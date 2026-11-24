// The fun versions of Tic-Tac-Toe, Four in a Row and Memory Match (Kevin, 2026-11-24). Each game plays on a
// colorful stage with big team score cards, the site mascot reacting in the corner, and a real win moment.
// Replaces the plain versions in tools/games.js (same saved scores). Styles: assets/arcade.css.
// TT.arcade(...) is the shared stage, also used by tools/arcade2.js (Code Breaker, Mystery Riddle).
(function () {
  var TT = window.TT, h = TT.h;
  function any(a) { return a[Math.floor(Math.random() * a.length)]; }
  function game(id) { return (TT.games || []).filter(function (g) { return g.id === id; })[0]; }
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.200-6.600L2.500 9.500l6.600-.900z"/></svg>';

  // opts: { theme, teams: [{ name, color }], scoreKey }
  TT.arcade = function (opts) {
    var teams = opts.teams || [], scores = opts.scoreKey ? TT.load(opts.scoreKey, [0, 0]) : [0, 0];
    if (!Array.isArray(scores) || scores.length < 2) scores = [0, 0];
    var buddy = TT.mascot ? TT.mascot() : h('span');
    var bubble = h('div', { class: 'ar-bubble', 'aria-hidden': 'true' });
    var status = h('p', { class: 'ar-status', 'aria-live': 'polite' });
    var cards = teams.map(function (t, i) {
      var c = h('div', { class: 'ar-team' },
        h('span', { class: 'ar-team-name', text: t.name }), h('b', { class: 'ar-team-score' }), h('span', { class: 'ar-team-sub' }),
        h('span', { class: 'ar-team-turn', text: 'Your Turn' }), h('span', { class: 'ar-team-crown', html: STAR }));
      c.style.setProperty('--c', t.color);
      return c;
    });
    var play = h('div', { class: 'ar-play' });
    var scene = h('div', { class: 'ar-scene', 'aria-hidden': 'true' }, h('i', { class: 'a' }), h('i', { class: 'b' }), h('i', { class: 'c' }));
    var top = h('div', { class: 'ar-top' + (teams.length ? '' : ' solo') }, cards[0] || null, status, cards[1] || null);
    var stage = h('div', { class: 'ar-stage ar-' + opts.theme }, scene, top,
      h('div', { class: 'ar-mid' }, h('div', { class: 'ar-buddy' }, bubble, buddy), play, h('div', { class: 'ar-side', 'aria-hidden': 'true' })));
    var sayT;
    function paintScores() { cards.forEach(function (c, i) { c.querySelector('.ar-team-score').textContent = scores[i]; }); }
    paintScores();
    var api = {
      el: stage, play: play, status: status,
      say: function (text, mood, ms) {
        bubble.textContent = text; bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop', 'on');
        if (mood && buddy.mood) buddy.mood(mood, ms || 2200);
        clearTimeout(sayT);
      },
      mood: function (m, ms) { if (buddy.mood) buddy.mood(m, ms); },
      set: function (text) { status.textContent = text; status.classList.remove('win', 'tie'); stage.classList.remove('won'); cards.forEach(function (c) { c.classList.remove('winner'); }); },
      turn: function (i) { cards.forEach(function (c, k) { c.classList.toggle('active', k === i); }); stage.style.setProperty('--turn', teams[i] ? teams[i].color : '#fff'); },
      sub: function (i, text) { if (cards[i]) cards[i].querySelector('.ar-team-sub').textContent = text || ''; },
      // A win: the status pill turns gold and bounces, the winner's card gets a star, confetti falls, the mascot parties.
      win: function (i, text, line) {
        if (i >= 0 && cards[i]) { scores[i]++; if (opts.scoreKey) TT.save(opts.scoreKey, scores); paintScores(); cards[i].classList.add('winner'); }
        cards.forEach(function (c) { c.classList.remove('active'); });
        status.textContent = text; status.classList.add('win'); stage.classList.add('won');
        api.say(line || any(['Amazing!', 'What a game!', 'High five!']), 'party', 4200);
        TT.chime(); if (TT.celebrate) TT.celebrate(stage);
      },
      tie: function (text, line) {
        cards.forEach(function (c) { c.classList.remove('active'); });
        status.textContent = text; status.classList.add('tie');
        api.say(line || 'A tie! Play again?', 'think', 3000);
      },
      resetScores: function () { scores = [0, 0]; if (opts.scoreKey) TT.save(opts.scoreKey, scores); paintScores(); },
      resetBtn: function () { return TT.button('Reset Score', { kind: 'small', onclick: api.resetScores }); }
    };
    return api;
  };

  // ---------- Tic-Tac-Toe ----------
  var X = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M24 24 L76 76"/><path d="M76 24 L24 76"/></svg>';
  var O = '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="28"/></svg>';
  function ttt(el) {
    var A = TT.arcade({ theme: 'ttt', scoreKey: 'g-ttt', teams: [{ name: 'Team X', color: '#2F6BFF' }, { name: 'Team O', color: '#FF6B4A' }] });
    var cpuOn = false, board, turn, over, starter = 0, cells = [];
    var strike = h('div', { class: 'ar3-strike', 'aria-hidden': 'true' });
    var grid = h('div', { class: 'ar3' });
    for (var i = 0; i < 9; i++) (function (i) {
      var b = h('button', { type: 'button', class: 'ar3-cell', 'aria-label': 'Square ' + (i + 1), onclick: function () { play(i); } });
      cells.push(b); grid.append(b);
    })(i);
    grid.append(strike);
    A.play.append(grid);
    var mode = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Who plays' }, [[false, 'Two Teams'], [true, 'Class vs. Computer']].map(function (m) {
      return h('button', { type: 'button', class: 'seg' + (m[0] ? '' : ' on'), 'aria-pressed': m[0] ? 'false' : 'true', onclick: function () {
        cpuOn = m[0]; mode.querySelectorAll('.seg').forEach(function (s, k) { s.classList.toggle('on', (k === 1) === cpuOn); s.setAttribute('aria-pressed', (k === 1) === cpuOn ? 'true' : 'false'); }); reset();
      } }, m[1]);
    }));
    el.append(h('div', { class: 'game ar' }, A.el, h('div', { class: 'row center ar-controls' }, mode, TT.button('New Game', { icon: 'reset', kind: 'primary', onclick: reset }), A.resetBtn())));
    var LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    function winner(b) { for (var k = 0; k < 8; k++) { var l = LINES[k]; if (b[l[0]] >= 0 && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return k; } return -1; }
    function name(t) { return t ? (cpuOn ? 'The Computer' : 'Team O') : (cpuOn ? 'The Class' : 'Team X'); }
    function reset() {
      board = [-1,-1,-1,-1,-1,-1,-1,-1,-1]; turn = cpuOn ? 0 : starter; starter = 1 - starter; over = false;
      cells.forEach(function (c) { c.className = 'ar3-cell'; c.innerHTML = ''; c.disabled = false; });
      strike.className = 'ar3-strike'; grid.classList.remove('done');
      paint(); A.say(any(['Three in a row wins!', 'Who goes first?', 'Take the middle?']), 'wave', 1800);
    }
    function play(i) {
      if (over || board[i] >= 0 || (cpuOn && turn === 1)) return;
      move(i);
      if (!over && cpuOn) setTimeout(cpu, 650);
    }
    function move(i) {
      board[i] = turn; TT.tick();
      cells[i].innerHTML = turn ? O : X; cells[i].classList.add(turn ? 'o' : 'x', 'placed'); cells[i].disabled = true;
      var w = winner(board);
      if (w >= 0) {
        over = true; grid.classList.add('done');
        LINES[w].forEach(function (k) { cells[k].classList.add('win'); });
        strike.className = 'ar3-strike on l' + w; strike.style.setProperty('--c', turn ? '#FF6B4A' : '#2F6BFF');
        A.win(turn, name(turn) + (cpuOn && !turn ? ' Wins!' : ' Wins!'), cpuOn && turn ? 'The computer got lucky!' : 'Three in a row!');
        return;
      }
      if (board.indexOf(-1) < 0) { over = true; grid.classList.add('done'); A.tie('It’s a Tie!', 'Nobody got three. Rematch!'); return; }
      turn = 1 - turn; paint();
      var free = board.filter(function (v) { return v < 0; }).length;
      if (free === 5) A.say(any(['Watch for a block!', 'Hmm, tricky…']), 'think', 1800);
    }
    function cpu() {
      if (over) return;
      // Win if possible, block most of the time, else center, else anywhere. Loose on purpose so kids can win.
      var free = board.map(function (v, i) { return v < 0 ? i : -1; }).filter(function (i) { return i >= 0; });
      function tryFor(p) { for (var k = 0; k < free.length; k++) { var b = board.slice(); b[free[k]] = p; if (winner(b) >= 0) return free[k]; } return -1; }
      var pick = tryFor(1);
      if (pick < 0) pick = Math.random() < 0.8 ? tryFor(0) : -1;
      if (pick < 0 && board[4] < 0 && Math.random() < 0.7) pick = 4;
      if (pick < 0) pick = free[Math.floor(Math.random() * free.length)];
      move(pick);
    }
    function paint() {
      A.set(cpuOn && turn === 1 ? 'The computer is thinking…' : name(turn) + '’s Turn');
      A.turn(turn); grid.classList.toggle('t1', turn === 1);
    }
    reset();
  }

  // ---------- Four in a Row ----------
  function four(el) {
    var COLS = 7, ROWS = 6, NAMES = ['Red Team', 'Yellow Team'];
    var A = TT.arcade({ theme: 'four', scoreKey: 'g-four', teams: [{ name: NAMES[0], color: '#F0364B' }, { name: NAMES[1], color: '#F7B500' }] });
    var board, turn, over, starter = 0, cells = [], drops = [];
    var topRow = h('div', { class: 'ar4-drops', 'aria-hidden': 'true' });
    var grid = h('div', { class: 'ar4-grid', role: 'grid', 'aria-label': 'Four in a Row board' });
    for (var c0 = 0; c0 < COLS; c0++) { var d = h('span', { class: 'ar4-drop' }, h('i')); drops.push(d); topRow.append(d); }
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) (function (c) {
      var cell = h('button', { type: 'button', class: 'ar4-cell', 'aria-label': 'Column ' + (c + 1), onclick: function () { drop(c); } }, h('span'));
      cell.addEventListener('pointerenter', function () { aim(c); });
      cells.push(cell); grid.append(cell);
    })(c);
    var wrap = h('div', { class: 'ar4' }, topRow, h('div', { class: 'ar4-board' }, grid), h('div', { class: 'ar4-feet', 'aria-hidden': 'true' }));
    wrap.addEventListener('pointerleave', function () { aim(-1); });
    A.play.append(wrap);
    el.append(h('div', { class: 'game ar' }, A.el, h('div', { class: 'row center ar-controls' }, TT.button('New Game', { icon: 'reset', kind: 'primary', onclick: reset }), A.resetBtn())));
    function aim(c) { drops.forEach(function (d, k) { d.classList.toggle('on', !over && k === c && at(0, c) === -1); }); }
    function reset() {
      board = []; for (var i = 0; i < ROWS * COLS; i++) board.push(-1);
      turn = starter; starter = 1 - starter; over = false;
      cells.forEach(function (cell) { cell.className = 'ar4-cell'; cell.firstChild.style.removeProperty('--from'); });
      wrap.classList.remove('done'); paint(); A.say(any(['Four in a row wins!', 'Up, down, across or diagonal!', 'Tap a column to drop a disc.']), 'point', 2200);
    }
    function at(r, c) { return r < 0 || r >= ROWS || c < 0 || c >= COLS ? -2 : board[r * COLS + c]; }
    function drop(c) {
      if (over) return;
      for (var r = ROWS - 1; r >= 0; r--) if (at(r, c) === -1) {
        var i = r * COLS + c;
        board[i] = turn; TT.tick();
        cells[i].firstChild.style.setProperty('--from', (-(r + 1.3) * 112) + '%');
        cells[i].classList.add('p' + turn, 'drop');
        var line = winLine(r, c);
        if (line) {
          over = true; wrap.classList.add('done'); aim(-1);
          line.forEach(function (k, n) { cells[k].classList.add('win'); cells[k].style.setProperty('--n', n); });
          A.win(turn, NAMES[turn] + ' Wins!', 'Four in a row!');
          return;
        }
        if (board.indexOf(-1) < 0) { over = true; wrap.classList.add('done'); aim(-1); A.tie('It’s a Tie! The Board Is Full.'); return; }
        turn = 1 - turn; paint(); aim(c);
        if (threat()) A.say(any(['Uh oh, three in a row!', 'Somebody block that!']), 'think', 1800);
        return;
      }
    }
    // Does the team that just moved have three with an open fourth spot? Only used for the mascot's warning.
    function threat() {
      var p = 1 - turn;
      for (var c = 0; c < COLS; c++) for (var r = ROWS - 1; r >= 0; r--) if (at(r, c) === -1) {
        board[r * COLS + c] = p; var w = winLine(r, c); board[r * COLS + c] = -1;
        if (w) return true; break;
      }
      return false;
    }
    function winLine(r, c) {
      var p = at(r, c), dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
      for (var d = 0; d < 4; d++) {
        var line = [r * COLS + c];
        [1, -1].forEach(function (s) {
          var rr = r + dirs[d][0] * s, cc = c + dirs[d][1] * s;
          while (at(rr, cc) === p) { line.push(rr * COLS + cc); rr += dirs[d][0] * s; cc += dirs[d][1] * s; }
        });
        if (line.length >= 4) return line;
      }
      return null;
    }
    function paint() { A.set(NAMES[turn] + '’s Turn'); A.turn(turn); wrap.classList.toggle('t1', turn === 1); }
    reset();
  }

  // ---------- Memory Match ----------
  function memory(el) {
    var SETS = {
      animals: ['🐶', '🐱', '🐰', '🦊', '🐼', '🐸', '🐵', '🦁', '🐧', '🐢', '🦋', '🐙'],
      food: ['🍎', '🍌', '🍇', '🍓', '🍕', '🌮', '🍩', '🍪', '🥕', '🌽', '🧀', '🍉'],
      space: ['🚀', '🌙', '⭐', '☀️', '🪐', '🌍', '☄️', '👽', '🛸', '🌈', '⚡', '❄️']
    };
    var sea = TT.season && TT.season();
    if (sea) SETS.seasonal = sea.cards;
    var COLORS = ['#8B5CF6', '#F43F7F'];
    var A = TT.arcade({ theme: 'mem', scoreKey: 'g-memory', teams: [{ name: 'Team 1', color: COLORS[0] }, { name: 'Team 2', color: COLORS[1] }] });
    var grid = h('div', { class: 'arm' });
    A.play.append(grid);
    var setSel = h('div', { class: 'segmented' });
    var set = 'animals', cards, open, matched, turn, lock, pts, streak;
    // Picture sets match two of the same card. "Learning Pairs" match two cards that go together, by grade.
    var learn = h('div', { class: 'row center mem-learn', hidden: true });
    var pairSel = h('div', { class: 'segmented' }), pairSet = '';
    function pairSets() { return (TT.GRADE_PAIRS || {})[TT.grade ? TT.grade() : 4] || {}; }
    function paintPairs() {
      var names = Object.keys(pairSets()); if (names.indexOf(pairSet) < 0) pairSet = names[0];
      pairSel.textContent = '';
      names.forEach(function (n) { pairSel.append(h('button', { type: 'button', class: 'seg' + (n === pairSet ? ' on' : ''), onclick: function () { pairSet = n; paintPairs(); reset(); } }, n)); });
    }
    if (TT.GRADE_PAIRS) { learn.append(TT.gradePicker(function () { paintPairs(); reset(); }), pairSel); paintPairs(); }
    function choose(k) { set = k; setSel.querySelectorAll('.seg').forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-set') === k); }); learn.hidden = k !== 'learn'; reset(); }
    Object.keys(SETS).concat(TT.GRADE_PAIRS ? ['learn'] : []).forEach(function (k) {
      setSel.append(h('button', { type: 'button', class: 'seg' + (k === set ? ' on' : ''), 'data-set': k, onclick: function () { choose(k); } }, k === 'learn' ? 'Learning Pairs' : k.charAt(0).toUpperCase() + k.slice(1)));
    });
    el.append(h('div', { class: 'game ar' }, A.el, h('div', { class: 'row center ar-controls' }, setSel, TT.button('New Game', { icon: 'reset', kind: 'primary', onclick: reset }), A.resetBtn()), learn));
    function reset() {
      var deck = [];
      if (set === 'learn') TT.shuffle((pairSets()[pairSet] || []).slice()).slice(0, 10).forEach(function (p, i) { deck.push({ t: p[0], k: i }, { t: p[1], k: i }); });
      else TT.shuffle(SETS[set].slice()).slice(0, 10).forEach(function (e, i) { deck.push({ t: e, k: i }, { t: e, k: i }); });
      cards = TT.shuffle(deck); open = []; matched = {}; turn = 0; lock = false; pts = [0, 0]; streak = 0;
      grid.textContent = ''; grid.classList.toggle('words', set === 'learn');
      cards.forEach(function (e, i) {
        var b = h('button', { type: 'button', class: 'arm-card', 'aria-label': 'Card ' + (i + 1), onclick: function () { flip(i); } },
          h('span', { class: 'arm-inner' }, h('span', { class: 'arm-back', html: STAR }), h('span', { class: 'arm-front', text: e.t })));
        b.style.setProperty('--i', i);
        grid.append(b);
      });
      paint(); A.say(any(['Find two that match!', 'Remember where they are!', 'Ready, set, flip!']), 'wave', 1800);
    }
    function flip(i) {
      if (lock || matched[i] != null || open.indexOf(i) >= 0) return;
      open.push(i); TT.tick(); paint();
      if (open.length < 2) return;
      lock = true;
      var a = open[0], b = open[1];
      if (cards[a].k === cards[b].k) {
        matched[a] = matched[b] = turn; pts[turn]++; streak++; open = []; lock = false;
        [a, b].forEach(function (k) { var c = grid.children[k]; c.style.setProperty('--c', COLORS[turn]); c.classList.add('matched'); });
        paint();
        if (Object.keys(matched).length === cards.length) {
          var w = pts[0] === pts[1] ? -1 : pts[0] > pts[1] ? 0 : 1;
          if (w >= 0) A.win(w, 'Team ' + (w + 1) + ' Wins, ' + Math.max(pts[0], pts[1]) + ' to ' + Math.min(pts[0], pts[1]) + '!', 'Super memory!');
          else A.tie('All Matched! It’s a Tie, ' + pts[0] + ' to ' + pts[1] + '.');
          return;
        }
        A.status.textContent = 'A Match! Team ' + (turn + 1) + ' Goes Again';
        A.say(streak > 1 ? any(['Two in a row!', 'On fire!', 'Wow, again!']) : any(['A match!', 'Nice memory!', 'You found it!']), 'cheer', 1600);
      } else {
        streak = 0; grid.children[a].classList.add('nope'); grid.children[b].classList.add('nope');
        A.say(any(['Not a match.', 'So close!', 'Remember those!']), 'think', 1400);
        setTimeout(function () { if (!grid.children[a]) return; grid.children[a].classList.remove('nope'); grid.children[b].classList.remove('nope'); open = []; turn = 1 - turn; lock = false; paint(); }, 1200);
      }
    }
    function paint() {
      Array.prototype.forEach.call(grid.children, function (c, i) { c.classList.toggle('open', open.indexOf(i) >= 0 || matched[i] != null); });
      A.set('Team ' + (turn + 1) + '’s Turn'); A.turn(turn);
      A.sub(0, pts[0] + (pts[0] === 1 ? ' pair' : ' pairs')); A.sub(1, pts[1] + (pts[1] === 1 ? ' pair' : ' pairs'));
    }
    reset();
  }

  [['tic-tac-toe', ttt], ['four-in-a-row', four], ['memory-match', memory]].forEach(function (g) { var x = game(g[0]); if (x) x.mount = g[1]; });
})();
