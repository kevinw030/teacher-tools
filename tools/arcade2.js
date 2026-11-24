// The fun versions of Code Breaker and Mystery Riddle (Kevin, 2026-11-24), on the shared game stage from
// tools/arcade.js. Replaces the plain versions in tools/puzzles.js. Styles: assets/arcade.css.
(function () {
  var TT = window.TT, h = TT.h;
  if (!TT.arcade) return;
  function any(a) { return a[Math.floor(Math.random() * a.length)]; }
  function game(id) { return (TT.games || []).filter(function (g) { return g.id === id; })[0]; }

  // ---------- Code Breaker: crack the vault ----------
  function code(el) {
    var COLORS = [['Red', '#F0364B'], ['Orange', '#FF8A1F'], ['Yellow', '#FFD43B'], ['Green', '#2CC76B'], ['Blue', '#3D8BFF'], ['Purple', '#A45CFF']];
    var LEN = 4, MAX = 8, secret, rows, cur, over, won;
    var A = TT.arcade({ theme: 'code' });
    var vault = h('div', { class: 'arc-vault' });
    var board = h('div', { class: 'arc-board' });
    var palette = h('div', { class: 'arc-palette', role: 'group', 'aria-label': 'Pick a color' });
    COLORS.forEach(function (c, i) {
      var b = h('button', { type: 'button', class: 'arc-gem big', 'aria-label': c[0], title: c[0], onclick: function () { add(i); } });
      b.style.setProperty('--g', c[1]); palette.append(b);
    });
    var checkBtn = TT.button('Check Guess', { kind: 'primary big', onclick: check });
    var undoBtn = TT.button('Undo', { icon: 'back', onclick: function () { if (!over && cur.length) { cur.pop(); paint(); } } });
    var key = h('div', { class: 'arc-key' },
      h('span', null, h('i', { class: 'arc-fb exact' }), 'Right color, right spot'),
      h('span', null, h('i', { class: 'arc-fb near' }), 'Right color, wrong spot'));
    A.play.append(h('div', { class: 'arc' },
      h('div', { class: 'arc-left' }, vault, board),
      h('div', { class: 'arc-right' }, h('b', { class: 'arc-label', text: 'Tap Four Colors' }), palette, h('div', { class: 'arc-btns' }, undoBtn, checkBtn), key)));
    el.append(h('div', { class: 'game ar' }, A.el, h('div', { class: 'row center ar-controls' }, TT.button('New Code', { icon: 'reset', kind: 'primary', onclick: reset }))));
    function gem(v, cls) { var s = h('span', { class: 'arc-gem' + (v == null ? ' empty' : '') + (cls || '') }); if (v != null) s.style.setProperty('--g', COLORS[v][1]); return s; }
    function reset() {
      secret = []; for (var i = 0; i < LEN; i++) secret.push(Math.floor(Math.random() * COLORS.length));
      rows = []; cur = []; over = false; won = false; paint();
      A.say(any(['Can you crack my code?', 'Four colors. Colors can repeat!', 'Start with any four!']), 'wave', 2000);
    }
    function add(i) { if (over || cur.length >= LEN) return; cur.push(i); TT.tick(); paint(); }
    function score(g) {
      var exact = 0, near = 0, s = [], r = [];
      g.forEach(function (v, i) { if (v === secret[i]) exact++; else { s.push(secret[i]); r.push(v); } });
      r.forEach(function (v) { var k = s.indexOf(v); if (k >= 0) { near++; s.splice(k, 1); } });
      return [exact, near];
    }
    function check() {
      if (over || cur.length < LEN) return;
      var sc = score(cur); rows.push({ g: cur.slice(), s: sc }); cur = [];
      if (sc[0] === LEN) { over = true; won = true; }
      else if (rows.length >= MAX) over = true;
      paint(true);
      if (won) A.win(-1, 'Code Cracked in ' + rows.length + (rows.length === 1 ? ' Guess!' : ' Guesses!'), 'You opened the vault!');
      else if (over) A.tie('Out of Guesses. Here Is the Code.', 'So close! Try a new code.');
      else A.say(sc[0] === 0 && sc[1] === 0 ? 'None of those colors!' : sc[0] >= 3 ? 'So close!' : sc[0] ? sc[0] + ' in the right spot!' : sc[1] + ' right, but in the wrong spot.', sc[0] >= 2 ? 'cheer' : 'think', 2000);
    }
    function row(g, sc, cls, n) {
      var pegs = []; for (var i = 0; i < LEN; i++) pegs.push(gem(g[i]));
      var fb = [];
      if (sc) { for (var a = 0; a < sc[0]; a++) fb.push(h('i', { class: 'arc-fb exact' })); for (var b = 0; b < sc[1]; b++) fb.push(h('i', { class: 'arc-fb near' })); }
      while (fb.length < LEN) fb.push(h('i', { class: 'arc-fb' }));
      return h('div', { class: 'arc-row ' + (cls || '') }, h('span', { class: 'arc-n', text: n }), h('div', { class: 'arc-pegs' }, pegs), h('div', { class: 'arc-fbs' }, fb));
    }
    function paint(fresh) {
      vault.textContent = ''; vault.classList.toggle('open', over);
      vault.append(h('span', { class: 'arc-vault-t', text: over ? 'The Code' : 'Secret Code' }));
      secret.forEach(function (v, i) { var g = over ? gem(v, ' flip') : h('span', { class: 'arc-gem lock', text: '?' }); g.style.setProperty('--i', i); vault.append(g); });
      board.textContent = '';
      rows.forEach(function (r, i) { board.append(row(r.g, r.s, 'done' + (fresh && i === rows.length - 1 ? ' fresh' : ''), i + 1)); });
      if (!over) board.append(row(cur, null, 'active', rows.length + 1));
      for (var i = rows.length + (over ? 0 : 1); i < MAX; i++) board.append(row([], null, 'later', i + 1));
      checkBtn.disabled = over || cur.length < LEN; undoBtn.disabled = over || !cur.length;
      checkBtn.classList.toggle('ready', !over && cur.length === LEN);
      if (!over) A.set('Guess ' + (rows.length + 1) + ' of ' + MAX);
    }
    reset();
  }

  // ---------- Mystery Riddle: a spotlight, two hint cards, and a mystery box that pops open ----------
  var BULB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.500 10.900c.600.500 1 1.200 1 2.100h5c0-.900.400-1.600 1-2.100A6 6 0 0 0 12 3z"/></svg>';
  function riddle(el) {
    var RIDDLES = TT.RIDDLES || [];
    if (!RIDDLES.length) return;
    var state = TT.load('riddle', { seen: [], day: '', cur: -1 }) || { seen: [], day: '', cur: -1 };
    var shown = 0;
    var A = TT.arcade({ theme: 'riddle' });
    var qEl = h('h2', { class: 'arr-q' });
    var hints = h('div', { class: 'arr-hints' });
    var box = h('button', { type: 'button', class: 'arr-box', 'aria-label': 'Reveal the answer', onclick: reveal }, h('span', { class: 'arr-lid', 'aria-hidden': 'true' }), h('span', { class: 'arr-mark', 'aria-hidden': 'true', text: '?' }));
    var ans = h('div', { class: 'arr-answer', 'aria-live': 'polite' });
    var hintBtn = TT.button('Show a Hint', { kind: 'big arr-hint-btn', onclick: function () { if (shown >= 2) return; shown++; TT.tick(); paint(); A.say(shown === 1 ? 'Here’s a clue…' : 'One more clue!', 'point', 2000); } });
    hintBtn.insertAdjacentHTML('afterbegin', BULB);
    var ansBtn = TT.button('Reveal Answer', { kind: 'primary big', icon: 'sparkle', onclick: reveal });
    A.play.append(h('div', { class: 'arr' },
      h('div', { class: 'arr-card' }, h('span', { class: 'arr-tag', text: 'Today’s Riddle' }), qEl),
      hints, h('div', { class: 'arr-reveal' }, box, ans),
      h('div', { class: 'row center arr-btns' }, hintBtn, ansBtn, TT.button('Another Riddle', { icon: 'arrow', kind: 'big', onclick: function () { pick(); paint(); intro(); } }))));
    el.append(h('div', { class: 'game ar' }, A.el));
    function intro() { A.say(any(['Hmm, what could it be?', 'Think, think, think…', 'Talk it over with a partner!']), 'think', 4000); }
    function pick() {
      var left = RIDDLES.map(function (_, i) { return i; }).filter(function (i) { return state.seen.indexOf(i) < 0; });
      if (!left.length) { state.seen = []; left = RIDDLES.map(function (_, i) { return i; }).filter(function (i) { return i !== state.cur; }); }
      state.cur = left[Math.floor(Math.random() * left.length)];
      state.seen.push(state.cur); state.day = TT.today(); shown = 0;
      TT.save('riddle', state);
    }
    function reveal() {
      if (shown >= 3) return;
      shown = 3; paint();
      A.say(any(['Ta-da!', 'Did you get it?', 'Who guessed it?']), 'party', 3600);
      TT.chime(); if (TT.celebrate) TT.celebrate(A.el);
    }
    function paint() {
      if (state.day !== TT.today() || !RIDDLES[state.cur]) pick();
      var r = RIDDLES[state.cur];
      qEl.textContent = r[0];
      var have = hints.children.length, want = Math.min(shown, 2);
      if (have > want) { hints.textContent = ''; have = 0; }
      for (var i = have + 1; i <= want; i++) hints.append(h('div', { class: 'arr-hint' }, h('span', { class: 'arr-hint-ico', html: BULB }), h('span', null, h('b', { text: 'Hint ' + i }), h('span', { text: r[i] }))));
      var open = shown >= 3;
      box.classList.toggle('open', open); box.disabled = open;
      ans.textContent = open ? r[3] : ''; ans.classList.toggle('on', open);
      hintBtn.disabled = shown >= 2; ansBtn.disabled = open;
      hintBtn.lastChild.textContent = shown >= 2 ? 'No More Hints' : shown === 1 ? 'Show the Last Hint' : 'Show a Hint';
      A.status.textContent = 'Riddle ' + state.seen.length + ' of ' + RIDDLES.length;
    }
    paint(); intro();
  }

  [['code-breaker', code], ['riddle', riddle]].forEach(function (g) { var x = game(g[0]); if (x) x.mount = g[1]; });
})();
