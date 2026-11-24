// Confetti for the whole site, made from Kevin's eight paper shapes (assets/confetti/*.webp, 2026-11-24):
// red spiral, orange zigzag, yellow sparkle, green curl, teal spiral, blue bolt, purple loop, pink heart.
//
//   TT.confetti(el)        a burst inside el: two cannons fire up from the bottom corners, then a light
//                          sprinkle falls from the top. Pieces have weight and air drag, flutter (they flip
//                          over and show a darker back), sway, and sit at different depths (far ones are
//                          smaller, slower and softer). Drawn on one <canvas>, so it stays smooth on school PCs.
//   TT.confetti.piece(i)   a single shape as a <span class="cf cf-i"> for small CSS bursts (lobby, escape room).
//
// No emoji anywhere in confetti (Kevin, 2026-11-24). Respects "reduce motion". Loaded on every page and /join.
(function () {
  var TT = window.TT = window.TT || {};
  var NAMES = ['spiral-red', 'zigzag', 'sparkle', 'curl', 'spiral-teal', 'bolt', 'loop', 'heart'];
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sprites = [], loading = false;

  // Each shape is drawn once into a small canvas (front) plus a shaded copy (back, seen when it flips).
  function load() {
    if (loading) return; loading = true;
    NAMES.forEach(function (n, i) {
      var img = new Image();
      img.onload = function () {
        var S = 72, k = S / Math.max(img.width, img.height), w = Math.round(img.width * k), h = Math.round(img.height * k);
        function make(dark) {
          var c = document.createElement('canvas'); c.width = w; c.height = h;
          var x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
          if (dark) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(20,10,40,.28)'; x.fillRect(0, 0, w, h); }
          return c;
        }
        sprites[i] = { front: make(false), back: make(true), ar: w / h };
      };
      img.src = '/assets/confetti/' + n + '.webp';
    });
  }
  // Fetch the shapes once the page has settled, so the first win already has them.
  if (document.readyState === 'complete') setTimeout(load, 600); else window.addEventListener('load', function () { setTimeout(load, 600); });

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function burst(el, tries) {
    if (!el || still) return;
    load();
    var ready = sprites.filter(Boolean);
    if (!el.isConnected || !ready.length || !el.clientWidth) {   // not on the page yet, or shapes still loading
      if ((tries || 0) < 30) setTimeout(function () { burst(el, (tries || 0) + 1); }, 50);
      return;
    }
    var old = el.querySelector(':scope > .fx-confetti'); if (old) { old._stop && old._stop(); old.remove(); }
    var W = el.clientWidth, H = el.clientHeight, fixed = false;
    if (H > innerHeight * 1.3 || el === document.body) { W = innerWidth; H = innerHeight; fixed = true; }   // tall pages: cover the screen
    var cv = document.createElement('canvas'); cv.className = 'fx-confetti' + (fixed ? ' fixed' : ''); cv.setAttribute('aria-hidden', 'true');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    if (!fixed && getComputedStyle(el).position === 'static') el.classList.add('fx-host');
    el.append(cv);
    var ctx = cv.getContext('2d');

    var weak = (navigator.hardwareConcurrency || 4) <= 4;
    var count = Math.round(Math.max(70, Math.min(weak ? 130 : 190, W * H / 7000)));
    var unit = Math.max(0.75, Math.min(1.25, Math.min(W, H * 1.6) / 900));   // piece size follows the space
    var g = H * 1.15, P = [];
    for (var i = 0; i < count; i++) {
      var z = Math.pow(Math.random(), 0.7) * 0.7 + 0.5;       // depth 0.5 (far) .. 1.2 (near), more far than near
      var s = sprites[(i * 5 + (Math.random() * 3 | 0)) % sprites.length] || ready[i % ready.length];
      var size = 30 * unit * z * rnd(0.8, 1.2), p = { s: s, z: z, w: s.ar >= 1 ? size : size * s.ar, h: s.ar >= 1 ? size / s.ar : size };
      p.rot = rnd(0, 6.28); p.spin = rnd(-6, 6); p.flip = rnd(0, 6.28); p.flipV = rnd(4, 11) * (Math.random() < .5 ? -1 : 1);
      p.sway = rnd(0, 6.28); p.swayV = rnd(1.5, 3.2); p.swayA = rnd(20, 60) * unit;
      p.drag = rnd(2.4, 3.6) / (0.6 + z * 0.4);               // far pieces drift slower
      if (i < count * 0.78) {                                  // the two corner cannons
        var left = i % 2 === 0, ang = rnd(58, 82) * Math.PI / 180, sp = H * rnd(2.0, 3.4) * (0.7 + z * 0.3);
        p.x = left ? rnd(-10, W * 0.04) : W - rnd(-10, W * 0.04); p.y = H + 10;
        p.vx = Math.cos(ang) * sp * (left ? 1 : -1) * (W / H > 1.4 ? 1.25 : 0.9); p.vy = -Math.sin(ang) * sp;
        p.t0 = rnd(0, 0.28);
      } else {                                                 // a light sprinkle from the top
        p.x = rnd(0, W); p.y = -20 - rnd(0, H * 0.2); p.vx = rnd(-30, 30); p.vy = rnd(40, 120); p.t0 = rnd(0.35, 1.1);
      }
      P.push(p);
    }
    P.sort(function (a, b) { return a.z - b.z; });             // far pieces drawn first

    var start = 0, last = 0, raf = 0, LIFE = 6.5;
    function frame(now) {
      if (!start) start = last = now;
      var dt = Math.min(0.033, (now - last) / 1000), t = (now - start) / 1000; last = now;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      var alive = 0;
      for (var i = 0; i < P.length; i++) {
        var p = P[i];
        if (t < p.t0) { alive++; continue; }
        if (p.y > H + 60) continue;
        alive++;
        var k = Math.exp(-p.drag * dt);
        p.sway += p.swayV * dt;
        var wind = Math.sin(p.sway) * p.swayA;                 // paper drifts side to side as it falls
        p.vx = (p.vx - wind) * k + wind; p.vy = p.vy * k + g * (0.5 + 0.5 * p.z) / p.drag * (1 - k);   // falls toward its own top speed
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.spin * dt; p.flip += p.flipV * dt;
        var fy = Math.cos(p.flip), age = t - p.t0, a = Math.min(1, age * 6) * (t > LIFE - 0.8 ? Math.max(0, (LIFE - t) / 0.8) : 1);
        ctx.globalAlpha = a * (0.72 + 0.28 * Math.min(1, (p.z - 0.5) / 0.5));
        var c = Math.cos(p.rot), sn = Math.sin(p.rot), sy = Math.abs(fy) < 0.08 ? 0.08 : fy;
        ctx.setTransform(c * dpr, sn * dpr, -sn * sy * dpr, c * sy * dpr, p.x * dpr, p.y * dpr);
        ctx.drawImage(fy >= 0 ? p.s.front : p.s.back, -p.w / 2, -p.h / 2, p.w, p.h);
      }
      if (alive && t < LIFE) raf = requestAnimationFrame(frame); else cv.remove();
    }
    cv._stop = function () { cancelAnimationFrame(raf); };
    raf = requestAnimationFrame(frame);
  }

  TT.confetti = burst;
  TT.confetti.piece = function (i) {
    var s = document.createElement('span'); s.className = 'cf cf-' + (((i % 8) + 8) % 8); s.setAttribute('aria-hidden', 'true'); return s;
  };
})();
