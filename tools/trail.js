// Race board games: a whole-class board game. Teams roll, race around the track and answer
// math facts to get ahead. TT.race(cfg) builds one race; Multiplication Race is set up at the
// bottom and the Addition, Subtraction and Division races live in tools/races.js.
// Artwork lives in assets/race/ (each themed race has its own folder of Kevin's art).
(function () {
  var TT = window.TT, h = TT.h;
  var N = 48, COLS = 8, ART = '/assets/race/';
  var MOVES = ['march in place', 'do jumping jacks', 'hop on one foot', 'do arm circles', 'touch your toes', 'do star jumps', 'clap over your head', 'tap your knees'];
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function makeLayout() {
    var L = [], bag = [], spots = [], i;
    for (i = 0; i < N; i++) L.push('');
    // Every space that is not a special space is a multiplication fact, so most turns end on one.
    for (i = 1; i < N - 1; i++) L[i] = 'q';
    [['move', 4], ['boost', 3], ['slip', 3], ['again', 3], ['swap', 2]].forEach(function (b) { for (var k = 0; k < b[1]; k++) bag.push(b[0]); });
    for (i = 3; i < N - 2; i++) spots.push(i);
    spots = TT.shuffle(spots);
    // keep special spaces apart so facts sit between them
    var used = [];
    spots.forEach(function (sp) {
      if (!bag.length) return;
      if (used.some(function (u) { return Math.abs(u - sp) < 2; })) return;
      L[sp] = bag.pop(); used.push(sp);
    });
    return L;
  }

  // cfg: key, setKey, cls, dir (themed art folder) and own (art names found there), teams, kinds,
  // picker { label, options [[value, label]], def }, fact(sel) -> { text, ans, key },
  // move(sel) -> card text, boost(roll) -> card text, cheer (win message)
  function race(cfg) { return function (el) {
    var TEAMS = cfg.teams, KINDS = cfg.kinds, P = cfg.picker;
    function art(name, cls) { var d = cfg.own && cfg.own.indexOf(name) >= 0 ? ART + cfg.dir + '/' : ART; return h('img', { src: d + name + '.png', alt: '', class: cls || '', draggable: 'false' }); }
    var state = TT.load(cfg.key, null), busy = false, lastRoll = 1, recent = [];
    var set = TT.load(cfg.setKey, null) || {};
    var vals = P.options.map(function (o) { return o[0]; });
    if (!Array.isArray(set.sel)) set.sel = Array.isArray(set.tables) ? set.tables : [];
    set.sel = set.sel.filter(function (v) { return vals.indexOf(v) >= 0; });
    if (!set.sel.length) set.sel = P.def.slice();
    var teamsBar = h('div', { class: 'scorebar' });
    var st = h('p', { class: 'game-status', 'aria-live': 'polite' });
    var die = TT.dice ? TT.dice() : null;
    var rollBtn = TT.button('Roll the Die', { kind: 'primary big', onclick: roll });
    var board = h('div', { class: 'tr-board', role: 'img', 'aria-label': 'Race track with ' + N + ' spaces' });
    var card = h('div', { class: 'tr-card', hidden: true, role: 'dialog', 'aria-live': 'assertive' });
    var wrap = h('div', { class: 'tr-wrap' }, board, card), moving = -1;
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var counts = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Number of teams' }, [2, 3, 4].map(function (n) {
      return h('button', { type: 'button', class: 'seg', 'data-n': n, onclick: function () { newGame(n); } }, n + ' Teams');
    }));
    var tables = h('div', { class: 'tr-tables', role: 'group', 'aria-label': P.label });
    P.options.forEach(function (o, n) {
      tables.append(h('button', { type: 'button', class: 'tr-table', 'data-n': n, title: o[2] || null, onclick: function () {
        var i = set.sel.indexOf(o[0]);
        if (i >= 0) { if (set.sel.length > 1) set.sel.splice(i, 1); } else set.sel.push(o[0]);
        TT.save(cfg.setKey, set); paintTables();
      } }, o[1]));
    });
    function paintTables() { tables.querySelectorAll('.tr-table').forEach(function (b) { var on = set.sel.indexOf(vals[+b.getAttribute('data-n')]) >= 0; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
    el.append(h('div', { class: 'game trail' + (cfg.cls ? ' ' + cfg.cls : '') }, teamsBar, st,
      h('div', { class: 'row center tr-rollrow' }, die && die.el, rollBtn),
      wrap,
      h('div', { class: 'tr-legend' }, Object.keys(KINDS).map(function (k) { return h('span', null, art(KINDS[k][0]), h('b', { text: KINDS[k][1] }), ' ' + KINDS[k][2]); })),
      h('div', { class: 'tr-setup' }, h('b', { class: 'tr-setup-h' }, cfg.signArt ? art(cfg.signArt, 'tr-sign') : null, P.label), tables),
      h('div', { class: 'row center' }, cfg.pairArt ? art(cfg.pairArt, 'tr-pair') : null, counts, TT.button('New Game', { icon: 'reset', onclick: function () { newGame(state.n); } }))));

    function save() { TT.save(cfg.key, state); }
    function newGame(n) {
      state = { n: n, pos: [], turn: 0, over: false, layout: makeLayout() };
      for (var i = 0; i < n; i++) state.pos.push(0);
      busy = false; card.hidden = true; moving = -1; wrap.querySelectorAll('.tr-fly, .tr-count').forEach(function (n) { n.remove(); }); save(); paint();
    }
    function name(t) { return TEAMS[t][0]; }
    function fact() {
      var f, tries = 0;
      do { f = cfg.fact(set.sel); } while (recent.indexOf(f.key) >= 0 && ++tries < 30);
      recent.push(f.key); if (recent.length > 14) recent.shift();
      return f;
    }
    function paintDie(v) { if (die) die.show(v); }
    function paint() {
      teamsBar.textContent = '';
      state.pos.forEach(function (p, t) {
        teamsBar.append(h('div', { class: 'team tr-team' + (t === state.turn && !state.over ? ' active' : '') },
          art(TEAMS[t][2]), h('span', { text: name(t) }), h('b', { text: String(Math.min(p, N - 1)) })));
      });
      counts.querySelectorAll('.seg').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-n') === state.n); });
      board.textContent = '';
      for (var i = 0; i < N; i++) {
        var row = Math.floor(i / COLS), c = i % COLS, col = row % 2 ? COLS - 1 - c : c;
        var dir = i === N - 1 ? '' : c === COLS - 1 ? ' d' : row % 2 ? ' l' : ' r';
        var k = state.layout[i];
        var tokens = h('span', { class: 'tr-tokens' });
        state.pos.forEach(function (p, t) { if (Math.min(p, N - 1) === i && t !== moving) tokens.append(art(TEAMS[t][2], 'tr-token' + (t === state.turn && !state.over ? ' now' : ''))); });
        var ico = i === 0 ? 'start' : i === N - 1 ? 'finish' : k ? KINDS[k][0] : '';
        var tile = h('div', { class: 'tr-tile' + dir + (k ? ' k-' + k : '') + (i === 0 ? ' start' : i === N - 1 ? ' finish' : ''), title: i === 0 ? 'Start' : i === N - 1 ? 'Finish' : k ? KINDS[k][1] : null },
          h('span', { class: 'tr-n', text: i === 0 ? 'Start' : i === N - 1 ? 'Finish' : String(i) }),
          ico ? art(ico, 'tr-ico') : null, tokens);
        tile.style.gridRow = row + 1; tile.style.gridColumn = col + 1;
        board.append(tile);
      }
      paintDie(lastRoll); paintTables();
      rollBtn.disabled = busy || state.over;
      if (state.over) st.textContent = name(state.turn) + ' wins the race!';
      else if (!busy) st.textContent = name(state.turn) + ', it’s your turn. Roll the die!';
    }
    function show(icon, title, text, buttons, extra) {
      card.textContent = '';
      [art(icon, 'tr-card-art'), h('h2', { text: title }), text ? h('p', { text: text }) : null, extra, h('div', { class: 'row center' }, buttons)].forEach(function (n) { if (n) card.append(n); });
      card.hidden = false;
      var b = card.querySelector('button'); if (b) b.focus();
    }
    function hide() { card.hidden = true; }
    function artBtn(icon, label, kind, fn) { var b = TT.button(label, { kind: kind, onclick: fn }); b.prepend(art(icon, 'tr-btn-art')); return b; }
    // A fact on a card: show it, reveal the answer, then the teacher says if the team got it.
    function ask(t, icon, title, right, wrong, rightLabel) {
      var f = fact();
      var ans = h('span', { class: 'tr-ans', text: '?' });
      var judge = h('div', { class: 'row center', hidden: true },
        artBtn('right', rightLabel, 'primary big', right), artBtn('wrong', 'Not This Time', 'big', wrong));
      var reveal = TT.button('Show Answer', { kind: 'primary big', onclick: function () { ans.textContent = String(f.ans); ans.classList.add('shown'); judge.hidden = false; reveal.hidden = true; TT.tick(); } });
      // longer facts (two- and three-digit numbers) get a smaller font so they stay on one line
      var len = (f.text + String(f.ans)).length;
      show(icon, title, null, [reveal], h('div', { class: 'tr-extra' }, h('div', { class: 'tr-fact' + (len > 13 ? ' xlong' : len > 9 ? ' long' : '') }, f.text + ' = ', ans), judge));
    }
    // Where a pawn stands on a tile, measured inside the board frame.
    function spot(i) {
      // k undoes any full screen scaling, so the pawn lands on the tile at every screen size
      var r = board.children[i].getBoundingClientRect(), w = wrap.getBoundingClientRect(), k = wrap.offsetWidth / w.width || 1;
      return { x: (r.left - w.left + r.width / 2) * k, y: (r.top - w.top + r.height * 0.98) * k, s: r.height * k };
    }
    function at(p, extra) { return 'translate(' + p.x + 'px,' + p.y + 'px) translate(-50%,-100%) ' + (extra || ''); }
    // Hop one space at a time so the class can count along: crouch, jump in an arc, squash on landing.
    function walk(t, n, done) {
      var step = n > 0 ? 1 : -1, left = Math.abs(n), count = 0;
      if (!left || calm || !board.animate) { plainWalk(t, n, done); return; }
      moving = t; paint();
      var fly = art(TEAMS[t][2], 'tr-fly'), start = spot(state.pos[t]);
      fly.style.height = start.s * 0.86 + 'px'; fly.style.transform = at(start);
      wrap.append(fly);
      function finish() { fly.remove(); moving = -1; save(); paint(); done(); }
      (function go() {
        if (!left || (step > 0 && state.pos[t] >= N - 1) || (step < 0 && state.pos[t] <= 0) || !fly.isConnected) { finish(); return; }
        var a = spot(state.pos[t]), c = spot(state.pos[t] + step);
        var mid = { x: (a.x + c.x) / 2, y: Math.min(a.y, c.y) - a.s * 0.62 };
        var lean = c.x > a.x ? 10 : c.x < a.x ? -10 : 0;
        var anim = fly.animate([
          { transform: at(a, 'scale(1,1)'), offset: 0 },
          { transform: at(a, 'scale(1.16,.8)'), offset: 0.16 },
          { transform: at(mid, 'scale(.92,1.12) rotate(' + lean + 'deg)'), offset: 0.55 },
          { transform: at(c, 'scale(1.2,.76)'), offset: 0.86 },
          { transform: at(c, 'scale(.96,1.05)'), offset: 0.94 },
          { transform: at(c, 'scale(1,1)'), offset: 1 }
        ], { duration: 620, easing: 'ease-in-out', fill: 'forwards' });
        anim.onfinish = function () {
          state.pos[t] += step; left--; count++; TT.tick();
          fly.style.transform = at(c);
          var tile = board.children[state.pos[t]];
          tile.style.setProperty('--tc', TEAMS[t][1]);
          tile.classList.remove('land'); void tile.offsetWidth; tile.classList.add('land');
          var bub = h('span', { class: 'tr-count', text: (step > 0 ? '' : '−') + count });
          bub.style.left = c.x + 'px'; bub.style.top = (c.y - c.s * 0.9) + 'px'; bub.style.background = TEAMS[t][1];
          wrap.append(bub); setTimeout(function () { bub.remove(); }, 800);
          var num = teamsBar.children[t] && teamsBar.children[t].querySelector('b'); if (num) num.textContent = String(state.pos[t]);
          setTimeout(go, 200);
        };
      })();
    }
    function plainWalk(t, n, done) {
      var step = n > 0 ? 1 : -1, left = Math.abs(n);
      (function go() {
        if (!left || (step > 0 && state.pos[t] >= N - 1) || (step < 0 && state.pos[t] <= 0)) { save(); done(); return; }
        state.pos[t] += step; left--; TT.tick(); paint();
        setTimeout(go, 520);
      })();
    }
    // At the finish line a team has to solve one last fact to win.
    function finishOr(t, next) {
      if (state.pos[t] < N - 1) { next(); return; }
      ask(t, 'finish', 'Finish Line Fact for ' + name(t), function () {
        state.over = true; busy = false; save(); paint(); TT.chime(); if (TT.celebrate) TT.celebrate(wrap);
        show('finish', name(t) + ' Wins!', cfg.cheer, [TT.button('Play Again', { kind: 'primary big', onclick: function () { newGame(state.n); } })]);
      }, function () { hide(); walk(t, -2, endTurn); }, 'Got It! Win the Race');
    }
    function endTurn() { hide(); state.turn = (state.turn + 1) % state.n; busy = false; save(); paint(); }
    function thenMove(t, n) { hide(); walk(t, n, function () { finishOr(t, endTurn); }); }
    function roll() {
      if (busy || state.over) return;
      busy = true; rollBtn.disabled = true;
      var t = state.turn;
      lastRoll = 1 + Math.floor(Math.random() * 6);
      st.textContent = name(t) + ' is rolling…';
      die.roll(lastRoll, function () {
        st.textContent = name(t) + ' rolled a ' + lastRoll + '!';
        setTimeout(function () { walk(t, lastRoll, function () { finishOr(t, function () { land(t); }); }); }, 380);
      });
    }
    function land(t) {
      var k = state.layout[state.pos[t]];
      if (!k) { endTurn(); return; }
      var K = KINDS[k];
      if (k === 'q') {
        ask(t, K[0], 'Fact Check for ' + name(t), function () { thenMove(t, 2); }, endTurn, 'Got It! Move Ahead 2');
      } else if (k === 'move') {
        show(K[0], K[1] + '!', cfg.move(set.sel) + ' while you ' + pick(MOVES) + '.', [TT.button('Done! Move Ahead 1', { kind: 'primary big', onclick: function () { thenMove(t, 1); } })]);
      } else if (k === 'boost') {
        show(K[0], K[1] + '!', name(t) + ' rolled a ' + lastRoll + '. ' + cfg.boost(lastRoll) + ', so zoom ahead ' + lastRoll + ' more.', [TT.button('Blast Off', { kind: 'primary big', onclick: function () { thenMove(t, lastRoll); } })]);
      } else if (k === 'slip') {
        show(K[0], 'Banana Slip!', 'Whoops. ' + name(t) + ' slides back 2 spaces.', [TT.button('Slide Back', { kind: 'primary big', onclick: function () { thenMove(t, -2); } })]);
      } else if (k === 'again') {
        show(K[0], 'Roll Again!', name(t) + ' gets another turn.', [TT.button('Roll Again', { kind: 'primary big', onclick: function () { hide(); busy = false; paint(); } })]);
      } else {
        var lead = 0;
        state.pos.forEach(function (p, i) { if (p > state.pos[lead]) lead = i; });
        if (state.pos[lead] <= state.pos[t]) show(K[0], 'Switch Places!', name(t) + ' is already in the lead, so everyone stays put.', [TT.button('Keep Going', { kind: 'primary big', onclick: endTurn })]);
        else show(K[0], 'Switch Places!', name(t) + ' trades spots with ' + name(lead) + '!', [TT.button('Switch', { kind: 'primary big', onclick: function () {
          var a = state.pos[t]; state.pos[t] = state.pos[lead]; state.pos[lead] = a; endTurn();
        } })]);
      }
    }

    var ok = state && state.layout && state.layout.length === N && Array.isArray(state.pos) && state.pos.length === state.n && state.n >= 2 && state.n <= 4;
    if (ok) { if (state.pos.some(function (p) { return p >= N - 1; }) && !state.over) state.pos = state.pos.map(function (p) { return Math.min(p, N - 3); }); paint(); } else newGame(2);
  }; }
  TT.race = race;
  TT.raceMoves = MOVES;

  var tables = [];
  for (var tb = 2; tb <= 12; tb++) tables.push([tb, '×' + tb, tb + ' times table']);
  var trail = race({
    key: 'trail', setKey: 'trail-set',
    teams: [['Blue Team', '#2F6BFF', 'pawn-blue'], ['Orange Team', '#FF7A1A', 'pawn-orange'], ['Green Team', '#22D07A', 'pawn-green'], ['Purple Team', '#9B4DFF', 'pawn-purple']],
    kinds: {
      q: ['question', 'Fact Check', 'Solve it to move ahead 2'],
      move: ['move', 'Skip Count', 'Count and move, then go ahead 1'],
      boost: ['rocket', 'Times Two', 'Double your roll'],
      slip: ['banana', 'Banana Slip', 'Slide back 2'],
      again: ['dice', 'Roll Again', 'Take another turn'],
      swap: ['swap', 'Switch Places', 'Trade spots with the leader']
    },
    picker: { label: 'Times Tables in Play', options: tables, def: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
    fact: function (sel) {
      var a = pick(sel), b = 2 + Math.floor(Math.random() * 11), f = Math.random() < 0.5 ? [a, b] : [b, a];
      return { text: f[0] + ' × ' + f[1], ans: a * b, key: Math.min(a, b) + 'x' + Math.max(a, b) };
    },
    move: function (sel) { var n = pick(sel); return 'Everyone count by ' + n + 's up to ' + n * 10; },
    boost: function (r) { return r + ' × 2 = ' + r * 2; },
    cheer: 'What a race. Great multiplying, everyone!'
  });

  TT.games = (TT.games || []).concat([
    { id: 'trail-race', title: 'Multiplication Race', desc: 'A class board game. Teams roll, race around the track and solve multiplication facts to get ahead.', color: 'emerald', mount: trail, forget: ['trail'],
      icon: '<path d="M4 19h5a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/><path d="M16 3v8M16 4h5l-1.5 2L21 8h-5"/><circle cx="4" cy="19" r="1.4" fill="currentColor"/>' }
  ]);
})();
