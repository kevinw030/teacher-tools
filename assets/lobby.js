// The class-code lobby, shared by every activity students join with a code (Class Bingo first).
// A waiting room where everyone who joined pops in as a colorful animal, and the 3, 2, 1, Go countdown
// that starts the game on every screen at once. Nothing here is saved: names and animals live only
// on the screens that are open during the game.
(function () {
  var L = window.Lobby = window.Lobby || {};
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) { var c = arguments[i]; if (c != null && c !== false) el.append(c); }
    return el;
  }
  L.h = h;

  // ---------- Animals ----------
  L.AVATARS = [
    { e: '🦊', c: '#F2643D', n: 'Fox' }, { e: '🐼', c: '#5E6378', n: 'Panda' }, { e: '🦉', c: '#A0662B', n: 'Owl' },
    { e: '🐢', c: '#0FA974', n: 'Turtle' }, { e: '🐧', c: '#2563EB', n: 'Penguin' }, { e: '🦁', c: '#E89A00', n: 'Lion' },
    { e: '🐸', c: '#5E9C0C', n: 'Frog' }, { e: '🐙', c: '#E5397A', n: 'Octopus' }, { e: '🦄', c: '#7B4DEB', n: 'Unicorn' },
    { e: '🐨', c: '#0B9BD8', n: 'Koala' }, { e: '🐯', c: '#F27A1A', n: 'Tiger' }, { e: '🐬', c: '#1597B8', n: 'Dolphin' },
    { e: '🦖', c: '#2E9E5B', n: 'Dino' }, { e: '🐝', c: '#D9A400', n: 'Bee' }, { e: '🦩', c: '#E0569B', n: 'Flamingo' },
    { e: '🐳', c: '#3D7BE0', n: 'Whale' }
  ];
  L.pick = function () { return Math.floor(Math.random() * L.AVATARS.length); };
  L.avatar = function (i) { return L.AVATARS[((i | 0) % L.AVATARS.length + L.AVATARS.length) % L.AVATARS.length]; };

  // One player: a round colored badge with their animal, and their name under it.
  L.player = function (p, opts) {
    opts = opts || {};
    var a = L.avatar(p.av), tag = opts.onTap ? 'button' : 'div';
    var el = h(tag, { class: 'lb-p' + (opts.me ? ' me' : '') + (opts.small ? ' small' : ''), 'data-id': p.id, style: '--ac:' + a.c,
      'aria-label': (p.name || 'Player') + (opts.me ? ' (you)' : '') + (opts.onTap ? '. Tap to remove' : '') });
    if (tag === 'button') { el.type = 'button'; el.addEventListener('click', function () { opts.onTap(p, el); }); }
    el.append(h('span', { class: 'lb-ava', 'aria-hidden': 'true' }, h('span', { class: 'lb-emoji', text: a.e })),
      h('span', { class: 'lb-name', text: (p.name || 'Player') + (opts.me ? ' (You)' : '') }));
    return el;
  };

  // The waiting room: players pop in as they join and shrink away as they leave.
  // opts: { meId, onTap(p), empty: text, small }
  L.room = function (opts) {
    opts = opts || {};
    var el = h('div', { class: 'lb-room' + (opts.small ? ' small' : ''), role: 'list', 'aria-live': 'polite' });
    var shown = {}, emptyEl = h('p', { class: 'lb-empty', text: opts.empty || 'Waiting for players…' });
    el.append(emptyEl);
    function update(people) {
      var ids = {};
      people.slice().sort(function (a, b) { return (a.at || 0) - (b.at || 0) || String(a.name).localeCompare(String(b.name)); }).forEach(function (p) {
        ids[p.id] = 1;
        var key = p.id + '|' + p.name + '|' + p.av, old = shown[p.id];
        if (old && old.key === key) { el.append(old.node); return; }
        var node = L.player(p, { me: p.id === opts.meId, onTap: opts.onTap && p.id !== opts.meId ? opts.onTap : null, small: opts.small });
        node.setAttribute('role', 'listitem');
        if (!still) node.classList.add(old ? 'swap' : 'pop');
        if (old) old.node.replaceWith(node); else el.append(node);
        shown[p.id] = { key: key, node: node };
      });
      Object.keys(shown).forEach(function (id) {
        if (ids[id]) return;
        var n = shown[id].node; delete shown[id];
        if (still) n.remove(); else { n.classList.add('bye'); setTimeout(function () { n.remove(); }, 350); }
      });
      emptyEl.hidden = people.length > 0;
      if (people.length) el.append(emptyEl);
    }
    // Someone tapped their animal: make it jump here too.
    function poke(id) { var x = shown[id]; if (x) L.poke(x.node); }
    return { el: el, update: update, poke: poke };
  };

  // A happy jump with a little burst of sparkles.
  var SPARKS = ['✨', '⭐', '💖', '🎉', '💫'];
  L.poke = function (node, loud) {
    if (!node) return;
    var ava = node.querySelector('.lb-ava') || node;
    ava.classList.remove('jump'); void ava.offsetWidth; ava.classList.add('jump');
    if (!still) for (var i = 0; i < (loud ? 6 : 3); i++) {
      var s = h('span', { class: 'lb-spark', 'aria-hidden': 'true', text: SPARKS[Math.floor(Math.random() * SPARKS.length)] });
      s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); s.style.setProperty('--dy', (-50 - Math.random() * 60) + 'px');
      s.style.setProperty('--r', (Math.random() * 80 - 40) + 'deg');
      node.append(s);
      setTimeout(function (x) { x.remove(); }.bind(null, s), 1000);
    }
    if (loud) L.beep(500 + Math.random() * 400, 0.15, 'triangle', 0.08);
  };

  // Soft colored bubbles drifting up behind the waiting room.
  L.floaties = function () {
    var box = h('div', { class: 'lb-floaties', 'aria-hidden': 'true' });
    var cols = ['#F2643D', '#E89A00', '#0FA974', '#0B9BD8', '#7B4DEB', '#E5397A'];
    for (var i = 0; i < 14; i++) {
      var b = h('i');
      b.style.setProperty('--x', (Math.random() * 100) + '%'); b.style.setProperty('--s', (18 + Math.random() * 46) + 'px');
      b.style.setProperty('--d', (9 + Math.random() * 10) + 's'); b.style.setProperty('--delay', (-Math.random() * 18) + 's');
      b.style.setProperty('--c', cols[i % cols.length]);
      box.append(b);
    }
    return box;
  };

  // ---------- Sounds (soft, made on the spot) ----------
  var ctx;
  L.beep = function (f, len, type, vol) {
    try {
      if (window.TT && TT.settings && TT.settings.sound === false) return;
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(vol || 0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + (len || 0.2));
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + (len || 0.2) + 0.02);
    } catch (e) {}
  };

  // ---------- 3, 2, 1, Go! ----------
  // Shows over the whole page and calls done() when it's over (about 3.6 seconds).
  var COUNT_COLORS = ['#F2643D', '#E89A00', '#0FA974'];
  L.countdown = function (opts) {
    opts = opts || {};
    var layer = h('div', { class: 'lb-count', role: 'status', 'aria-live': 'assertive' });
    var title = h('p', { class: 'lb-count-title', text: opts.title || 'Get Ready!' });
    var stage = h('div', { class: 'lb-count-stage' });
    layer.append(title, stage);
    document.body.append(layer);
    var step = 0, STEP = still ? 700 : 950;
    function show() {
      stage.textContent = '';
      var go = step === 3, color = go ? '#E5397A' : COUNT_COLORS[step];
      var ring = '<svg class="lb-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="8"/>' +
        '<circle class="lb-ring-run" cx="60" cy="60" r="54" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" style="animation-duration:' + STEP + 'ms"/></svg>';
      var num = h('div', { class: 'lb-num' + (go ? ' go' : ''), style: '--cc:' + color, html: go ? '' : ring },
        h('span', { text: go ? 'Go!' : String(3 - step) }));
      stage.append(num);
      if (go && !still) for (var i = 0; i < 18; i++) {
        var b = h('i', { class: 'lb-burst' }); b.style.setProperty('--a', (i * 20) + 'deg'); b.style.setProperty('--c', ['#FFD15C', '#7CE0C3', '#FF8FB8', '#9AD8FF'][i % 4]);
        stage.append(b);
      }
      L.beep(go ? 880 : 520, go ? 0.45 : 0.18, go ? 'triangle' : 'sine', go ? 0.12 : 0.09);
      if (go) setTimeout(function () { L.beep(1175, 0.4, 'triangle', 0.09); }, 120);
    }
    show();
    var timer = setInterval(function () {
      step++;
      if (step <= 3) { show(); return; }
      clearInterval(timer);
      layer.classList.add('out');
      setTimeout(function () { layer.remove(); if (opts.done) opts.done(); }, 380);
    }, STEP);
    return { cancel: function () { clearInterval(timer); layer.remove(); } };
  };
})();
