// Class games for the board: two teams take turns. Four in a Row, Tic-Tac-Toe, Checkers, Memory Match, Word Guess.
(function () {
  var TT = window.TT, h = TT.h;

  function scoreBar(names, scoreKey, colors) {
    var scores = TT.load(scoreKey, [0, 0]);
    var els = [h('b'), h('b')];
    var turnEls = [];
    var bar = h('div', { class: 'scorebar' },
      names.map(function (n, i) {
        var e = h('div', { class: 'team team-' + i }, h('span', { class: 'team-dot', style: colors ? 'background:' + colors[i] : null }), h('span', { class: 'team-name', text: n }), els[i]);
        turnEls.push(e);
        return e;
      }),
      TT.button('Reset Score', { kind: 'small', onclick: function () { scores = [0, 0]; TT.save(scoreKey, scores); paint(); } }));
    function paint() { els[0].textContent = scores[0]; els[1].textContent = scores[1]; }
    paint();
    return {
      el: bar,
      win: function (i) { scores[i]++; TT.save(scoreKey, scores); paint(); },
      turn: function (i) { turnEls.forEach(function (e, k) { e.classList.toggle('active', k === i); }); }
    };
  }
  function status() { return h('p', { class: 'game-status', 'aria-live': 'polite' }); }

  // ---------- Four in a Row ----------
  function four(el) {
    var COLS = 7, ROWS = 6;
    var sb = scoreBar(['Red Team', 'Yellow Team'], 'g-four');
    var st = status();
    var grid = h('div', { class: 'c4', role: 'grid', 'aria-label': 'Four in a Row board' });
    var board, turn, over, starter = 0;
    var cells = [];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      (function (c) {
        var cell = h('button', { type: 'button', class: 'c4-cell', 'aria-label': 'Column ' + (c + 1), onclick: function () { drop(c); } }, h('span'));
        cells.push(cell); grid.append(cell);
      })(c);
    }
    el.append(h('div', { class: 'game' }, sb.el, st, grid, h('div', { class: 'row center' }, TT.button('New Game', { icon: 'reset', kind: 'primary', onclick: reset }))));
    function reset() { board = []; for (var i = 0; i < ROWS * COLS; i++) board.push(-1); turn = starter; starter = 1 - starter; over = false; paint(); }
    function at(r, c) { return r < 0 || r >= ROWS || c < 0 || c >= COLS ? -2 : board[r * COLS + c]; }
    function drop(c) {
      if (over) return;
      for (var r = ROWS - 1; r >= 0; r--) if (at(r, c) === -1) {
        board[r * COLS + c] = turn; TT.tick();
        var line = winLine(r, c);
        if (line) { over = true; line.forEach(function (i) { cells[i].classList.add('win'); }); sb.win(turn); st.textContent = (turn ? 'Yellow' : 'Red') + ' Team wins!'; paintCells(r * COLS + c); TT.chime(); return; }
        if (board.indexOf(-1) < 0) { over = true; st.textContent = 'It’s a tie! The board is full.'; paintCells(r * COLS + c); return; }
        turn = 1 - turn; paint(r * COLS + c); return;
      }
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
    function paintCells(last) {
      cells.forEach(function (cell, i) {
        cell.className = 'c4-cell' + (board[i] === 0 ? ' p0' : board[i] === 1 ? ' p1' : '') + (i === last ? ' drop' : '') + (cell.classList.contains('win') && over ? ' win' : '');
      });
      grid.classList.toggle('t1', turn === 1);
    }
    function paint(last) {
      cells.forEach(function (c) { c.classList.remove('win'); });
      paintCells(last);
      st.textContent = (turn ? 'Yellow' : 'Red') + ' Team’s turn. Tap a column.';
      sb.turn(turn);
    }
    reset();
  }

  // ---------- Tic-Tac-Toe ----------
  function ttt(el) {
    var sb = scoreBar(['Team X', 'Team O'], 'g-ttt', ['var(--cobalt)', 'var(--coral)']);
    var st = status();
    var vsBox = h('input', { type: 'checkbox', id: 'tttCpu' });
    var grid = h('div', { class: 'ttt' });
    var board, turn, over, starter = 0, cells = [];
    for (var i = 0; i < 9; i++) (function (i) {
      var b = h('button', { type: 'button', class: 'ttt-cell', 'aria-label': 'Square ' + (i + 1), onclick: function () { play(i); } });
      cells.push(b); grid.append(b);
    })(i);
    vsBox.addEventListener('change', reset);
    el.append(h('div', { class: 'game' }, sb.el, st, grid,
      h('div', { class: 'row center' },
        h('label', { class: 'check', for: 'tttCpu' }, vsBox, h('span', { text: 'Class vs. computer (computer plays O)' })),
        TT.button('New Game', { icon: 'reset', kind: 'primary', onclick: reset }))));
    var LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    function winner(b) { for (var k = 0; k < 8; k++) { var l = LINES[k]; if (b[l[0]] >= 0 && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return l; } return null; }
    function reset() { board = [-1,-1,-1,-1,-1,-1,-1,-1,-1]; turn = vsBox.checked ? 0 : starter; starter = 1 - starter; over = false; paint(); }
    function play(i) {
      if (over || board[i] >= 0) return;
      if (vsBox.checked && turn === 1) return;
      move(i);
      if (!over && vsBox.checked) setTimeout(cpu, 450);
    }
    function move(i) {
      board[i] = turn; TT.tick();
      var w = winner(board);
      if (w) { over = true; sb.win(turn); st.textContent = (turn ? 'Team O' : 'Team X') + ' wins!'; paint(w); TT.chime(); return; }
      if (board.indexOf(-1) < 0) { over = true; st.textContent = 'It’s a tie!'; paint(); return; }
      turn = 1 - turn; paint();
    }
    function cpu() {
      // Win if possible, block if needed, else center, corner, side. Sometimes plays randomly so kids can win.
      var free = board.map(function (v, i) { return v < 0 ? i : -1; }).filter(function (i) { return i >= 0; });
      function tryFor(p) { for (var k = 0; k < free.length; k++) { var b = board.slice(); b[free[k]] = p; if (winner(b)) return free[k]; } return -1; }
      var pick = tryFor(1);
      if (pick < 0) pick = Math.random() < 0.8 ? tryFor(0) : -1;
      if (pick < 0 && board[4] < 0 && Math.random() < 0.7) pick = 4;
      if (pick < 0) pick = free[Math.floor(Math.random() * free.length)];
      move(pick);
    }
    function paint(win) {
      cells.forEach(function (c, i) {
        c.textContent = board[i] === 0 ? 'X' : board[i] === 1 ? 'O' : '';
        c.className = 'ttt-cell' + (board[i] === 0 ? ' x' : board[i] === 1 ? ' o' : '') + (win && win.indexOf(i) >= 0 ? ' win' : '');
      });
      if (!over) st.textContent = (turn ? 'Team O' : 'Team X') + '’s turn.';
      sb.turn(turn);
    }
    reset();
  }

  // ---------- Checkers ----------
  function checkers(el) {
    var sb = scoreBar(['Red Team', 'Black Team'], 'g-checkers', ['#E8524A', '#2B3A55']);
    var st = status();
    var grid = h('div', { class: 'ck' });
    var board, turn, sel, over, chain, cells = [];
    for (var i = 0; i < 64; i++) (function (i) {
      var dark = (Math.floor(i / 8) + i % 8) % 2 === 1;
      var b = h('button', { type: 'button', class: 'ck-sq' + (dark ? ' dark' : ''), 'aria-label': 'Row ' + (Math.floor(i / 8) + 1) + ', column ' + (i % 8 + 1), onclick: function () { tap(i); } });
      if (!dark) b.disabled = true;
      cells.push(b); grid.append(b);
    })(i);
    el.append(h('div', { class: 'game' }, sb.el, st, grid, h('div', { class: 'row center' },
      h('span', { class: 'muted', text: 'Tap a piece, then tap where it should go. Jumps capture.' }),
      TT.button('New Game', { icon: 'reset', kind: 'primary', onclick: reset }))));
    // piece: {p: 0 red (moves up) | 1 black (moves down), k: king}
    function reset() {
      board = [];
      for (var i = 0; i < 64; i++) {
        var r = Math.floor(i / 8), dark = (r + i % 8) % 2 === 1;
        board.push(dark && r < 3 ? { p: 1, k: false } : dark && r > 4 ? { p: 0, k: false } : null);
      }
      turn = 0; sel = -1; over = false; chain = false; paint();
    }
    function moves(i, jumpsOnly) {
      var pc = board[i]; if (!pc) return [];
      var r = Math.floor(i / 8), c = i % 8, out = [];
      var dirs = pc.k ? [-1, 1] : [pc.p === 0 ? -1 : 1];
      dirs.forEach(function (dr) {
        [-1, 1].forEach(function (dc) {
          var r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
          if (r1 < 0 || r1 > 7 || c1 < 0 || c1 > 7) return;
          var mid = board[r1 * 8 + c1];
          if (!mid) { if (!jumpsOnly) out.push({ to: r1 * 8 + c1 }); }
          else if (mid.p !== pc.p && r2 >= 0 && r2 <= 7 && c2 >= 0 && c2 <= 7 && !board[r2 * 8 + c2]) out.push({ to: r2 * 8 + c2, cap: r1 * 8 + c1 });
        });
      });
      return out;
    }
    function tap(i) {
      if (over) return;
      var pc = board[i];
      if (pc && pc.p === turn && !chain) { sel = i; paint(); return; }
      if (sel < 0) return;
      var m = moves(sel, chain).filter(function (x) { return x.to === i; })[0];
      if (!m) return;
      board[i] = board[sel]; board[sel] = null; TT.tick();
      var r = Math.floor(i / 8), crowned = false;
      if (!board[i].k && ((board[i].p === 0 && r === 0) || (board[i].p === 1 && r === 7))) { board[i].k = true; crowned = true; }
      if (m.cap != null) {
        board[m.cap] = null;
        if (!crowned && moves(i, true).length) { sel = i; chain = true; paint(); st.textContent = 'Jump again!'; return; }
      }
      chain = false; sel = -1; turn = 1 - turn;
      var left = board.some(function (x, k) { return x && x.p === turn && moves(k).length; });
      if (!left) { over = true; sb.win(1 - turn); paint(); st.textContent = (turn ? 'Red' : 'Black') + ' Team wins!'; TT.chime(); return; }
      paint();
    }
    function paint() {
      var targets = sel >= 0 ? moves(sel, chain).map(function (m) { return m.to; }) : [];
      cells.forEach(function (c, i) {
        var pc = board[i];
        c.classList.toggle('sel', i === sel);
        c.classList.toggle('target', targets.indexOf(i) >= 0);
        c.innerHTML = pc ? '<span class="ck-pc p' + pc.p + (pc.k ? ' king' : '') + '">' + (pc.k ? '♛' : '') + '</span>' : '';
      });
      if (!over) st.textContent = (turn ? 'Black' : 'Red') + ' Team’s turn.';
      sb.turn(turn);
    }
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
    var sb = scoreBar(['Team 1', 'Team 2'], 'g-memory', ['var(--violet)', 'var(--rose)']);
    var st = status();
    var grid = h('div', { class: 'mem' });
    var setSel = h('div', { class: 'segmented' });
    var set = 'animals', cards, open, matched, turn, lock, pts;
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
    el.append(h('div', { class: 'game' }, sb.el, st, grid, h('div', { class: 'row center' }, setSel, TT.button('New Game', { icon: 'reset', kind: 'primary', onclick: reset })), learn));
    function reset() {
      var deck = [];
      if (set === 'learn') TT.shuffle((pairSets()[pairSet] || []).slice()).slice(0, 10).forEach(function (p, i) { deck.push({ t: p[0], k: i }, { t: p[1], k: i }); });
      else TT.shuffle(SETS[set]).slice(0, 10).forEach(function (e, i) { deck.push({ t: e, k: i }, { t: e, k: i }); });
      cards = TT.shuffle(deck); open = []; matched = {}; turn = 0; lock = false; pts = [0, 0];
      grid.textContent = ''; grid.classList.toggle('mem-words', set === 'learn');
      cards.forEach(function (e, i) {
        grid.append(h('button', { type: 'button', class: 'mem-card', 'aria-label': 'Card ' + (i + 1), onclick: function () { flip(i); } },
          h('span', { class: 'mem-inner' }, h('span', { class: 'mem-back' }), h('span', { class: 'mem-front', text: e.t }))));
      });
      paint();
    }
    function flip(i) {
      if (lock || matched[i] || open.indexOf(i) >= 0) return;
      open.push(i); TT.tick(); paint();
      if (open.length < 2) return;
      lock = true;
      var a = open[0], b = open[1];
      if (cards[a].k === cards[b].k) {
        matched[a] = matched[b] = true; pts[turn]++; open = []; lock = false;
        if (Object.keys(matched).length === cards.length) {
          var w = pts[0] === pts[1] ? -1 : pts[0] > pts[1] ? 0 : 1;
          if (w >= 0) sb.win(w);
          paint(); st.textContent = w < 0 ? 'All matched! It’s a tie, ' + pts[0] + ' to ' + pts[1] + '.' : 'Team ' + (w + 1) + ' wins, ' + Math.max(pts[0], pts[1]) + ' to ' + Math.min(pts[0], pts[1]) + '!';
          TT.chime(); return;
        }
        paint(); st.textContent = 'Match! Team ' + (turn + 1) + ' goes again. (' + pts[0] + ' – ' + pts[1] + ')';
      } else {
        setTimeout(function () { open = []; turn = 1 - turn; lock = false; paint(); }, 1100);
      }
    }
    function paint() {
      grid.querySelectorAll('.mem-card').forEach(function (c, i) {
        c.classList.toggle('open', open.indexOf(i) >= 0 || !!matched[i]);
        c.classList.toggle('matched', !!matched[i]);
      });
      st.textContent = 'Team ' + (turn + 1) + '’s turn. Find a matching pair. (' + pts[0] + ' – ' + pts[1] + ')';
      sb.turn(turn);
    }
    reset();
  }

  // ---------- Word Guess (balloons pop instead of a hangman) ----------
  function words(el) {
    var LIST = {
      'Animals': ['ELEPHANT', 'GIRAFFE', 'PENGUIN', 'DOLPHIN', 'KANGAROO', 'OCTOPUS', 'CHEETAH', 'BUTTERFLY', 'SQUIRREL', 'CROCODILE'],
      'Science': ['GRAVITY', 'MAGNET', 'VOLCANO', 'PLANET', 'ENERGY', 'FOSSIL', 'WEATHER', 'HABITAT', 'EROSION', 'SKELETON'],
      'Math': ['FRACTION', 'DECIMAL', 'MULTIPLY', 'DIVIDE', 'PERIMETER', 'ANGLE', 'TRIANGLE', 'HUNDRED', 'EQUATION', 'SYMMETRY'],
      'Places': ['MOUNTAIN', 'DESERT', 'ISLAND', 'LIBRARY', 'MUSEUM', 'RAINFOREST', 'VALLEY', 'CANYON', 'OCEAN', 'VILLAGE']
    };
    var MAX = 7;
    var st = status();
    var balloons = h('div', { class: 'balloons', 'aria-hidden': 'true' });
    var wordEl = h('div', { class: 'word' });
    var keys = h('div', { class: 'keys' });
    var catSel = h('div', { class: 'segmented' });
    var custom = h('input', { type: 'text', id: 'wordCustom', placeholder: 'Or type your own secret word', 'aria-label': 'Your own secret word', maxlength: 14 });
    var cat = 'Animals', word, guessed, misses, over;
    // Words come from the chosen grade (1st to 5th). Each grade has its own categories.
    function paintCats() {
      if (TT.GRADE_WORDS) LIST = TT.GRADE_WORDS[TT.grade()] || LIST;
      if (!LIST[cat]) cat = Object.keys(LIST)[0];
      catSel.textContent = '';
      Object.keys(LIST).forEach(function (k) {
        catSel.append(h('button', { type: 'button', class: 'seg' + (k === cat ? ' on' : ''), 'data-cat': k, onclick: function () { cat = k; paintCats(); reset(); } }, k));
      });
    }
    paintCats();
    var gradeSel = TT.gradePicker ? TT.gradePicker(function () { paintCats(); reset(); }) : null;
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (L) {
      keys.append(h('button', { type: 'button', class: 'key', 'data-k': L, onclick: function () { guess(L); } }, L));
    });
    el.append(h('div', { class: 'game' }, st, balloons, wordEl, keys,
      h('div', { class: 'row center' }, gradeSel, catSel, TT.button('New Word', { icon: 'reset', kind: 'primary', onclick: reset })),
      h('div', { class: 'row center' }, custom, TT.button('Use My Word', { onclick: function () {
        var w = custom.value.toUpperCase().replace(/[^A-Z]/g, ''); if (w.length < 2) return; custom.value = ''; start(w, 'Teacher’s word');
      } }))));
    document.addEventListener('keydown', function (e) {
      if (el.offsetParent === null || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      var L = e.key.toUpperCase(); if (/^[A-Z]$/.test(L)) guess(L);
    });
    function reset() { var list = LIST[cat]; start(list[Math.floor(Math.random() * list.length)], cat); }
    function start(w, label) { word = w; guessed = {}; misses = 0; over = false; st.dataset.cat = label; paint(); }
    function guess(L) {
      if (over || guessed[L]) return;
      guessed[L] = true; TT.tick();
      if (word.indexOf(L) < 0) misses++;
      var solved = word.split('').every(function (c) { return guessed[c]; });
      if (solved) { over = true; TT.chime(); }
      else if (misses >= MAX) over = true;
      paint(solved);
    }
    function paint(solved) {
      balloons.textContent = '';
      for (var i = 0; i < MAX; i++) balloons.append(h('span', { class: 'balloon b' + (i % 5) + (i < misses ? ' popped' : '') }));
      wordEl.textContent = '';
      word.split('').forEach(function (c) {
        wordEl.append(h('span', { class: 'letter' + (guessed[c] ? ' shown' : '') + (over && !guessed[c] ? ' missed' : ''), text: guessed[c] || over ? c : '' }));
      });
      keys.querySelectorAll('.key').forEach(function (k) {
        var L = k.getAttribute('data-k');
        k.disabled = over || !!guessed[L];
        k.className = 'key' + (guessed[L] ? (word.indexOf(L) >= 0 ? ' hit' : ' miss') : '');
      });
      st.textContent = solved ? 'You got it! The word was ' + word + '.' :
        over ? 'Out of balloons! The word was ' + word + '.' :
        'Category: ' + st.dataset.cat + ' · ' + (MAX - misses) + ' balloons left';
    }
    reset();
  }

  TT.games = [
    { id: 'four-in-a-row', title: 'Four in a Row', desc: 'Drop discs and connect four in a line.', color: 'coral', mount: four,
      icon: '<circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>' },
    { id: 'tic-tac-toe', title: 'Tic-Tac-Toe', desc: 'Team X against Team O, or the class against the computer.', color: 'cobalt', mount: ttt,
      icon: '<path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>' },
    { id: 'checkers', title: 'Checkers', desc: 'The classic. Jump pieces and get kings.', color: 'rose', mount: checkers,
      icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>' },
    { id: 'memory-match', title: 'Memory Match', desc: 'Flip cards and find the pairs. Teams take turns.', color: 'violet', mount: memory,
      icon: '<rect x="3" y="4" width="8" height="11" rx="2"/><rect x="13" y="9" width="8" height="11" rx="2"/>' },
    { id: 'word-guess', title: 'Word Guess', desc: 'Guess the letters before all the balloons pop.', color: 'emerald', mount: words,
      icon: '<path d="M4 20h16"/><path d="M6 16h2M11 16h2M16 16h2"/><circle cx="12" cy="7" r="3"/>' }
  ];
})();
