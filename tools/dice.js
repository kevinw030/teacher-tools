// A real 3D die for the race board games (tools/trail.js). TT.dice() returns
// { el, show(v), roll(v, done) }: roll() hops the die up, tumbles it and lands it on v with a
// springy bounce and squash, then calls done. Reduced motion: a short fade to the new face.
// TT.dice({ quiet: true }) skips the built-in clatter ticks, for callers that play their own roll sound.
(function () {
  var h = TT.h;
  var PIPS = { 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  // Where each face sits on the cube, and the cube turn that brings it to the front.
  var FACES = { 1: 'rotateY(0deg)', 6: 'rotateY(180deg)', 2: 'rotateY(90deg)', 5: 'rotateY(-90deg)', 3: 'rotateX(90deg)', 4: 'rotateX(-90deg)' };
  var SHOW = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] };
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tf(a) { return 'rotateX(' + a[0] + 'deg) rotateY(' + a[1] + 'deg) rotateZ(' + a[2] + 'deg)'; }

  TT.dice = function (opts) {
    var quiet = !!(opts && opts.quiet);
    var cube = h('span', { class: 'tr-dice-cube' });
    [1, 2, 3, 4, 5, 6].forEach(function (v) {
      var f = h('span', { class: 'tr-dice-face f' + v });
      f.style.transform = FACES[v] + ' translateZ(var(--half))';
      for (var k = 0; k < 9; k++) f.append(h('i', { class: PIPS[v].indexOf(k) >= 0 ? 'on' : '' }));
      cube.append(f);
    });
    // Inner planes fill the rounded corners so the cube never looks hollow while it spins.
    ['rotateX(90deg)', 'rotateY(90deg)', 'none'].forEach(function (r) { var c = h('span', { class: 'tr-dice-core' }); c.style.transform = r; cube.append(c); });
    var hop = h('span', { class: 'tr-dice-hop' }, h('span', { class: 'tr-dice-tilt' }, cube));
    var shadow = h('span', { class: 'tr-dice-shadow' });
    var el = h('span', { class: 'tr-dice', 'aria-hidden': 'true' }, shadow, hop);
    var ang = [0, 0, 0], rolling = false;

    function show(v) {
      if (rolling) return;
      var s = SHOW[v] || SHOW[1];
      ang = [s[0], s[1], 0];
      cube.style.transform = tf(ang);
    }
    function roll(v, done) {
      rolling = true;
      var s = SHOW[v], from = ang.slice();
      // Always spin forward by at least a turn and a half on two axes, so every roll tumbles.
      function next(cur, base, min) { var a = base; while (a < cur + min) a += 360; return a; }
      var to = [next(from[0], s[0], 540), next(from[1], s[1], 360), 0];
      ang = to;
      var finish = function () { rolling = false; cube.style.transform = tf(to); el.classList.remove('rolling'); el.classList.add('landed'); setTimeout(function () { el.classList.remove('landed'); }, 700); done(); };
      if (calm || !cube.animate) {
        cube.style.transform = tf(to);
        if (cube.animate) cube.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 220 });
        if (TT.tick && !quiet) TT.tick();
        setTimeout(finish, 240);
        return;
      }
      el.classList.add('rolling');
      cube.style.transform = tf(to);
      var D = 1050;
      var over = [to[0] + 14, to[1] - 18, 9], back = [to[0] - 5, to[1] + 6, -3];
      cube.animate([
        { transform: tf(from), easing: 'cubic-bezier(.3,.1,.4,1)' },
        { transform: tf(over), offset: 0.7, easing: 'cubic-bezier(.3,0,.3,1)' },
        { transform: tf(back), offset: 0.84, easing: 'ease-in-out' },
        { transform: tf(to) }
      ], { duration: D });
      hop.animate([
        { transform: 'translateY(0) scale(1, 1)', easing: 'cubic-bezier(.2,.8,.4,1)' },
        { transform: 'translateY(0) scale(1.1, .86)', offset: 0.06, easing: 'cubic-bezier(.2,.8,.4,1)' },
        { transform: 'translateY(-34%) scale(.96, 1.06)', offset: 0.36, easing: 'cubic-bezier(.55,0,.85,.4)' },
        { transform: 'translateY(0) scale(1.14, .84)', offset: 0.64, easing: 'cubic-bezier(.2,.8,.4,1)' },
        { transform: 'translateY(-9%) scale(.98, 1.03)', offset: 0.78, easing: 'cubic-bezier(.55,0,.85,.4)' },
        { transform: 'translateY(0) scale(1.05, .95)', offset: 0.9, easing: 'ease-out' },
        { transform: 'translateY(0) scale(1, 1)' }
      ], { duration: D });
      shadow.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(.55)', opacity: 0.35, offset: 0.36 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.64 },
        { transform: 'scale(.85)', opacity: 0.7, offset: 0.78 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: D });
      // Clatter: a tick as it leaves the table and on each bounce.
      if (TT.tick && !quiet) [0, 0.64, 0.9].forEach(function (o) { setTimeout(TT.tick, o * D); });
      setTimeout(finish, D);
    }
    show(1);
    return { el: el, show: show, roll: roll };
  };
})();
