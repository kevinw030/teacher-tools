// Classroom Pet is switched off for now (Kevin, 2026-11-20). Set to true to bring it back everywhere.
window.TT = window.TT || {};
TT.PETS_ON = false;
// Illustrated pets: a pet drawn in several poses that walks around its room and acts things out.
// The kitten uses Kevin's artwork in assets/pet/cat/ (a cozy room plus seven poses).
(function () {
  var TT = window.TT, h = TT.h;
  // For each pose: the picture's width and height, and a size adjustment so the cat looks the same size in every pose.
  TT.PET_ART = {
    cat: {
      dir: '/assets/pet/cat/', room: 'room.jpg', unit: 1133,
      poses: { sit: [955, 1133, 1], happy: [954, 1135, 1], wave: [998, 1137, 1], walk: [992, 886, 1.2], eat: [1192, 755, 0.98], drink: [1237, 748, 0.98], play: [1089, 903, 1.08] }
    }
  };
  TT.petIcon = function (art, cls) { var a = TT.PET_ART[art]; return h('img', { class: cls || 'pet-art-icon', src: a.dir + 'sit.webp', alt: '', draggable: 'false' }); };

  // Put a living pet into a scene. opts: art, size (1 = normal), ground (% up from the bottom),
  // label, onHello(x), hat (an element to wear).
  TT.petActor = function (scene, opts) {
    var A = TT.PET_ART[opts.art], size = opts.size || 1, raf = 0, last = 0;
    var x = 30 + Math.random() * 40, tx = x, face = 1, pose = '', busy = 0, rest = 0, blink = 0, blinkEnd = 0, acting = '';
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scene.classList.add('pet-room'); scene.style.backgroundImage = 'url("' + A.dir + A.room + '")';
    var body = h('span', { class: 'pa-body' }), imgs = {};
    Object.keys(A.poses).forEach(function (k) { imgs[k] = h('img', { src: A.dir + k + '.webp', alt: '', draggable: 'false', hidden: true }); body.append(imgs[k]); });
    if (opts.hat) { opts.hat.classList.add('pa-hat'); body.append(opts.hat); }
    var flip = h('span', { class: 'pa-flip' }, body);
    var node = h('button', { type: 'button', class: 'pa', 'aria-label': opts.label || 'Say hi' }, h('span', { class: 'pa-shadow', 'aria-hidden': 'true' }), flip);
    node.style.bottom = (opts.ground == null ? 12 : opts.ground) + '%';
    scene.append(node);

    function setPose(p) {
      if (p === pose) return;
      if (imgs[pose]) imgs[pose].hidden = true;
      pose = p; imgs[p].hidden = false;
      var d = A.poses[p];
      // widths are a share of the scene's width, so the cat scales with the room
      node.style.width = (d[0] * d[2] * 0.18 / A.unit * 100 * size).toFixed(2) + '%';
      node.style.aspectRatio = d[0] + ' / ' + d[1];
      node.setAttribute('data-pose', p);
      if (opts.hat) opts.hat.hidden = !(p === 'sit' || p === 'happy' || p === 'wave');
    }
    function act(p, ms) {
      if (!A.poses[p]) return;
      acting = p; busy = performance.now() + (ms || 2600); tx = x; setPose(p);
      node.classList.remove('act'); void node.offsetWidth; node.classList.add('act');
    }
    function loop(now) {
      if (!scene.isConnected) return;
      raf = requestAnimationFrame(loop);
      var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (document.hidden || scene.offsetParent === null) return;
      if (busy) { if (now < busy) { place(); return; } busy = 0; acting = ''; node.classList.remove('act'); rest = now + 1500; }
      var dx = tx - x;
      if (Math.abs(dx) > 0.6 && !calm) {
        face = dx > 0 ? 1 : -1; x += face * Math.min(Math.abs(dx), 9 * dt); setPose('walk');
      } else {
        if (calm) x = tx;
        if (!rest) rest = now + 2500 + Math.random() * 4500;
        if (now > rest) { rest = 0; tx = 16 + Math.random() * 68; }
        // sit and blink now and then
        if (!blink) blink = now + 1800 + Math.random() * 3200;
        if (now > blink && !blinkEnd) blinkEnd = now + 190;
        if (blinkEnd && now > blinkEnd) { blinkEnd = 0; blink = 0; }
        setPose(blinkEnd ? 'happy' : 'sit');
      }
      place();
    }
    function place() { node.style.left = x + '%'; flip.style.transform = 'scaleX(' + face + ')'; }
    node.addEventListener('click', function (e) {
      e.stopPropagation(); act('wave', 1800); TT.tick();
      if (opts.onHello) opts.onHello(x);
    });
    scene.addEventListener('click', function (e) {
      if (busy) return;
      var r = scene.getBoundingClientRect();
      tx = Math.max(14, Math.min(86, (e.clientX - r.left) / r.width * 100)); rest = 0;
    });
    setPose('sit'); place();
    raf = requestAnimationFrame(loop);
    return { act: act, x: function () { return x; }, destroy: function () { cancelAnimationFrame(raf); node.remove(); } };
  };
})();
