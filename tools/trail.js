// Trail Race: a whole-class board game. Teams roll a die, move along the trail and land on surprise spaces.
(function () {
  var TT = window.TT, h = TT.h;
  var N = 30, COLS = 6;
  var TEAMS = [['Blue Team', '#3B7BFF'], ['Orange Team', '#FF7448'], ['Green Team', '#14B884'], ['Purple Team', '#8B5CF6']];
  var KINDS = {
    q: ['❓', 'Question', 'Answer it right to move ahead 2'],
    move: ['🤸', 'Move It', 'Everyone moves, then go ahead 1'],
    boost: ['🚀', 'Rocket Boost', 'Zoom ahead 3'],
    slip: ['🍌', 'Banana Slip', 'Slide back 2'],
    again: ['🎲', 'Roll Again', 'Take another turn'],
    swap: ['🔄', 'Switch Places', 'Trade spots with the leader']
  };
  var MOVES = ['Everyone do 10 jumping jacks!', 'Everyone hop on one foot 10 times!', 'Everyone touch your toes 5 times!', 'Everyone spin around 3 times, slowly!', 'Everyone do 5 big arm circles!',
    'Everyone march in place and count to 20!', 'Everyone reach for the sky, then touch the floor, 5 times!', 'Everyone do your best robot dance for 10 seconds!', 'Everyone balance on one foot and count to 10!',
    'Everyone do 5 star jumps!', 'Everyone pretend to swim across the room for 10 seconds!', 'Everyone give a neighbor an air high five!'];
  var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

  function makeLayout() {
    var L = [], bag = [], spots = [], i;
    for (i = 0; i < N; i++) L.push('');
    [['q', 9], ['move', 3], ['boost', 2], ['slip', 3], ['again', 2], ['swap', 1]].forEach(function (b) { for (var k = 0; k < b[1]; k++) bag.push(b[0]); });
    for (i = 1; i < N - 1; i++) spots.push(i);
    spots = TT.shuffle(spots);
    bag.forEach(function (k, j) { L[spots[j]] = k; });
    return L;
  }

  function trail(el) {
    var state = TT.load('trail', null), busy = false, lastRoll = 1, usedQ = [];
    var teamsBar = h('div', { class: 'scorebar' });
    var st = h('p', { class: 'game-status', 'aria-live': 'polite' });
    var die = h('span', { class: 'tr-die', 'aria-hidden': 'true' });
    var rollBtn = TT.button('Roll the Die', { kind: 'primary big', onclick: roll });
    var board = h('div', { class: 'tr-board', role: 'img', 'aria-label': 'Game board with ' + N + ' spaces' });
    var card = h('div', { class: 'tr-card', hidden: true, role: 'dialog', 'aria-live': 'assertive' });
    var counts = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Number of teams' }, [2, 3, 4].map(function (n) {
      return h('button', { type: 'button', class: 'seg', 'data-n': n, onclick: function () { newGame(n); } }, n + ' Teams');
    }));
    el.append(h('div', { class: 'game trail' }, teamsBar, st,
      h('div', { class: 'row center' }, die, rollBtn),
      h('div', { class: 'tr-wrap' }, board, card),
      h('div', { class: 'tr-legend' }, Object.keys(KINDS).map(function (k) { return h('span', null, h('b', { text: KINDS[k][0] + ' ' + KINDS[k][1] }), ' ' + KINDS[k][2]); })),
      h('div', { class: 'row center' }, counts, TT.button('New Game', { icon: 'reset', onclick: function () { newGame(state.n); } }))));

    function save() { TT.save('trail', state); }
    function newGame(n) {
      state = { n: n, pos: [], turn: 0, over: false, layout: makeLayout() };
      for (var i = 0; i < n; i++) state.pos.push(0);
      busy = false; card.hidden = true; save(); paint();
    }
    function name(t) { return TEAMS[t][0]; }
    function paintDie(v) {
      die.textContent = '';
      for (var k = 0; k < 9; k++) die.append(h('i', { class: PIPS[v].indexOf(k) >= 0 ? 'on' : '' }));
    }
    function paint() {
      teamsBar.textContent = '';
      state.pos.forEach(function (p, t) {
        teamsBar.append(h('div', { class: 'team' + (t === state.turn && !state.over ? ' active' : '') },
          h('span', { class: 'team-dot', style: 'background:' + TEAMS[t][1] }), h('span', { text: name(t) }), h('b', { text: p >= N - 1 ? '🏁' : String(p) })));
      });
      counts.querySelectorAll('.seg').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-n') === state.n); });
      board.textContent = '';
      for (var i = 0; i < N; i++) {
        var row = Math.floor(i / COLS), c = i % COLS, col = row % 2 ? COLS - 1 - c : c;
        var dir = i === N - 1 ? '' : c === COLS - 1 ? ' d' : row % 2 ? ' l' : ' r';
        var k = state.layout[i];
        var tokens = h('span', { class: 'tr-tokens' });
        state.pos.forEach(function (p, t) { if (p === i) tokens.append(h('i', { class: 'tr-token' + (t === state.turn && !state.over ? ' now' : ''), style: 'background:' + TEAMS[t][1], title: name(t) })); });
        var tile = h('div', { class: 'tr-tile' + dir + (k ? ' k-' + k : '') + (i === 0 ? ' start' : i === N - 1 ? ' finish' : ''), title: k ? KINDS[k][1] : null },
          h('span', { class: 'tr-n', text: i === 0 ? 'Start' : i === N - 1 ? 'Finish' : String(i) }),
          h('span', { class: 'tr-ico', text: i === N - 1 ? '🏁' : k ? KINDS[k][0] : '' }), tokens);
        tile.style.gridRow = row + 1; tile.style.gridColumn = col + 1;
        board.append(tile);
      }
      paintDie(lastRoll);
      rollBtn.disabled = busy || state.over;
      if (state.over) st.textContent = name(state.turn) + ' wins the race!';
      else if (!busy) st.textContent = name(state.turn) + ', it’s your turn. Roll the die!';
    }
    function show(emoji, title, text, buttons, extra) {
      card.textContent = '';
      card.append(h('span', { class: 'tr-card-emoji', text: emoji }), h('h2', { text: title }), text ? h('p', { text: text }) : null, extra || null, h('div', { class: 'row center' }, buttons));
      card.hidden = false;
      var b = card.querySelector('button'); if (b) b.focus();
    }
    function hide() { card.hidden = true; }
    // Move one space at a time so the class can count along.
    function walk(t, n, done) {
      var step = n > 0 ? 1 : -1, left = Math.abs(n);
      (function go() {
        if (!left || (step > 0 && state.pos[t] >= N - 1) || (step < 0 && state.pos[t] <= 0)) { save(); done(); return; }
        state.pos[t] += step; left--; TT.tick(); paint();
        setTimeout(go, 260);
      })();
    }
    function finishOr(t, next) {
      if (state.pos[t] >= N - 1) { state.over = true; busy = false; save(); paint(); TT.chime(); show('🏆', name(t) + ' Wins!', 'What a race. Great playing, everyone!', [TT.button('Play Again', { kind: 'primary big', onclick: function () { newGame(state.n); } })]); }
      else next();
    }
    function endTurn() { hide(); state.turn = (state.turn + 1) % state.n; busy = false; save(); paint(); }
    function thenMove(t, n) { hide(); walk(t, n, function () { finishOr(t, endTurn); }); }
    function roll() {
      if (busy || state.over) return;
      busy = true; rollBtn.disabled = true;
      var t = state.turn, i = 0;
      (function shake() {
        lastRoll = 1 + Math.floor(Math.random() * 6); paintDie(lastRoll); TT.tick();
        if (++i < 9) { setTimeout(shake, 60 + i * 8); return; }
        st.textContent = name(t) + ' rolled a ' + lastRoll + '!';
        setTimeout(function () { walk(t, lastRoll, function () { finishOr(t, function () { land(t); }); }); }, 450);
      })();
    }
    function land(t) {
      var k = state.layout[state.pos[t]];
      if (!k) { endTurn(); return; }
      var K = KINDS[k];
      if (k === 'q') {
        var pool = TT.triviaPool ? TT.triviaPool() : [];
        var fresh = pool.filter(function (q) { return usedQ.indexOf(q[0]) < 0; });
        if (!fresh.length) { usedQ = []; fresh = pool; }
        var q = fresh[Math.floor(Math.random() * fresh.length)] || ['What is 6 × 7?', '42', 'Math'];
        usedQ.push(q[0]);
        var ans = h('div', { class: 'tr-answer', hidden: true, text: q[1] });
        var judge = h('div', { class: 'row center', hidden: true },
          TT.button('Got It! Move Ahead 2', { kind: 'primary big', onclick: function () { thenMove(t, 2); } }),
          TT.button('Not This Time', { kind: 'big', onclick: endTurn }));
        var reveal = TT.button('Show Answer', { kind: 'primary big', onclick: function () { ans.hidden = false; judge.hidden = false; reveal.hidden = true; } });
        show(K[0], q[2] + ' Question for ' + name(t), q[0], [reveal], h('div', { class: 'tr-extra' }, ans, judge));
      } else if (k === 'move') {
        show(K[0], 'Move It!', MOVES[Math.floor(Math.random() * MOVES.length)], [TT.button('Done! Move Ahead 1', { kind: 'primary big', onclick: function () { thenMove(t, 1); } })]);
      } else if (k === 'boost') {
        show(K[0], 'Rocket Boost!', name(t) + ' zooms ahead 3 spaces.', [TT.button('Blast Off', { kind: 'primary big', onclick: function () { thenMove(t, 3); } })]);
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
    if (ok) paint(); else newGame(2);
  }

  TT.games = (TT.games || []).concat([
    { id: 'trail-race', title: 'Trail Race', desc: 'A class board game. Teams roll, race along the trail and land on questions and surprises.', color: 'emerald', mount: trail,
      icon: '<path d="M4 19h5a3 3 0 0 0 0-6H8a3 3 0 0 1 0-6h8"/><path d="M16 3v8M16 4h5l-1.5 2L21 8h-5"/><circle cx="4" cy="19" r="1.4" fill="currentColor"/>' }
  ]);
})();
