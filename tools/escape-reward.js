// Escape Room: the "you found a key" moment. A shockwave leaves the thing that was solved, a big key
// springs out of it to the middle of the room in front of spinning light, themed bits burst out, and
// then the key is handed back (done) so it can fly down to its slot. Everything is sized in em, and
// 1em is 1% of the room's width, so it scales with the room on any screen.
(function () {
  var TT = window.TT, h = TT.h;
  var THEMES = {
    library: { say: 'The Lock Clicks Open!', bits: ['✨', '📖', '⭐', '🔖'] },
    space: { say: 'Access Granted!', bits: ['⭐', '🚀', '🪐', '✨'] },
    pirate: { say: 'Arrr, a Key!', bits: ['🪙', '💎', '⭐', '🪙'] },
    museum: { say: 'A Hidden Key!', bits: ['🦴', '⭐', '🦕', '✨'] }
  };
  var DEFAULT = { say: 'Great Thinking!', bits: ['⭐', '✨', '🗝️', '🎉'] };

  TT.escapeReward = function (stage, o, done) {
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var theme = THEMES[o.room] || DEFAULT;
    var cx = (o.spot.x + o.spot.w / 2) / 16, cy = (o.spot.y + o.spot.h / 2) / 9;   // percent of the room
    var box = h('div', { class: 'er-reward' + (calm ? ' calm' : ''), 'aria-hidden': 'true' });
    box.style.fontSize = (stage.offsetWidth / 100) + 'px';
    box.style.setProperty('--k', o.color);
    box.style.setProperty('--dx', (cx - 50) + 'em');
    box.style.setProperty('--dy', ((cy - 50) * 0.5625) + 'em');
    var wave = h('span', { class: 'er-rw-wave' }); wave.style.left = cx + '%'; wave.style.top = cy + '%';
    var key = h('span', { class: 'er-rw-key' }); key.innerHTML = o.svg;
    var bits = h('span', { class: 'er-rw-bits' });
    for (var i = 0; i < 16; i++) {
      var ang = (i / 16) * Math.PI * 2 + (i % 2 ? 0.2 : 0), far = 15 + (i % 3) * 5;
      var b = h('span', { text: theme.bits[i % theme.bits.length] });
      b.style.setProperty('--bx', (Math.cos(ang) * far).toFixed(1) + 'em');
      b.style.setProperty('--by', (Math.sin(ang) * far * 0.8).toFixed(1) + 'em');
      b.style.setProperty('--br', (i % 2 ? 1 : -1) * (120 + i * 20) + 'deg');
      b.style.animationDelay = (0.5 + (i % 4) * 0.04) + 's';
      bits.append(b);
    }
    box.append(h('span', { class: 'er-rw-dim' }), wave, h('span', { class: 'er-rw-rays' }), h('span', { class: 'er-rw-glow' }), bits, key,
      h('span', { class: 'er-rw-text' }, h('b', { text: theme.say }), h('small', { text: 'Key ' + o.n + ' of ' + o.of })));
    stage.append(box);
    if (TT.chime) setTimeout(function () { TT.chime(); }, 450);
    setTimeout(function () {
      box.classList.add('out');
      key.style.visibility = 'hidden';
      done(key);
      setTimeout(function () { box.remove(); }, 450);
    }, calm ? 900 : 2100);
  };
})();
