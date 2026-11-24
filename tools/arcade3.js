// The older games on the shared game stage (Kevin, 2026-11-24: bring them up to the Tic-Tac-Toe look).
// Each one keeps its rules and saved scores and gains the stage: team score cards, the mascot talking,
// and the shared win moment (tools/fx.js). Stage kit: TT.arcade in tools/arcade.js; styles: assets/arcade3.css.
(function () {
  var TT = window.TT, h = TT.h;
  function any(a) { return a[Math.floor(Math.random() * a.length)]; }
  function game(id) { return (TT.games || []).filter(function (g) { return g.id === id; })[0]; }

  // ---------- Checkers (Kevin's teal board and star pieces, assets/checkers/) ----------
  function checkers(el) {
    var A = TT.arcade({ theme: 'ck', scoreKey: 'g-checkers', teams: [{ name: 'Red Team', color: '#E8524A' }, { name: 'Blue Team', color: '#2B4C8C' }] });
    var grid = h('div', { class: 'ck' });
    var board, turn, sel, over, chain, last = [], cells = [];
    for (var i = 0; i < 64; i++) (function (i) {
      var dark = (Math.floor(i / 8) + i % 8) % 2 === 1;
      var b = h('button', { type: 'button', class: 'ck-sq' + (dark ? ' dark' : ''), 'aria-label': 'Row ' + (Math.floor(i / 8) + 1) + ', column ' + (i % 8 + 1), onclick: function () { tap(i); } });
      if (!dark) b.disabled = true;
      cells.push(b); grid.append(b);
    })(i);
    A.play.append(grid);
    el.append(h('div', { class: 'game ar' }, A.el, h('div', { class: 'row center ar-controls' },
      h('span', { class: 'muted', text: 'Tap a piece, then tap where it should go. Jumps capture.' }),
      TT.button('New Game', { icon: 'reset', kind: 'primary', onclick: reset }), A.resetBtn())));
    function name(t) { return t ? 'Blue Team' : 'Red Team'; }
    // piece: {p: 0 red (moves up) | 1 blue (moves down), k: king}
    function reset() {
      board = [];
      for (var i = 0; i < 64; i++) {
        var r = Math.floor(i / 8), dark = (r + i % 8) % 2 === 1;
        board.push(dark && r < 3 ? { p: 1, k: false } : dark && r > 4 ? { p: 0, k: false } : null);
      }
      turn = 0; sel = -1; over = false; chain = false; last = []; paint();
      A.say(any(['Red goes first!', 'Jump to capture!', 'Reach the far side for a king!']), 'wave', 1800);
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
    function count(p) { return board.filter(function (x) { return x && x.p === p; }).length; }
    function tap(i) {
      if (over) return;
      var pc = board[i];
      if (pc && pc.p === turn && !chain) { sel = i; paint(); return; }
      if (sel < 0) return;
      var m = moves(sel, chain).filter(function (x) { return x.to === i; })[0];
      if (!m) return;
      board[i] = board[sel]; board[sel] = null; last = [sel, i];
      var r = Math.floor(i / 8), crowned = false;
      if (!board[i].k && ((board[i].p === 0 && r === 0) || (board[i].p === 1 && r === 7))) { board[i].k = true; crowned = true; }
      if (m.cap != null) {
        board[m.cap] = null;
        if (TT.fx) TT.fx.sound('pop'); else TT.tick();
        if (!crowned && moves(i, true).length) { sel = i; chain = true; paint(); A.status.textContent = 'Jump Again!'; A.say(any(['Keep going!', 'Double jump!']), 'cheer', 1400); return; }
        A.say(any(['Got one!', 'Nice jump!', 'Captured!']), 'cheer', 1400);
      } else TT.tick();
      if (crowned) { if (TT.fx) TT.fx.sound('coin'); A.say('A king! It can move both ways.', 'party', 2200); }
      chain = false; sel = -1; turn = 1 - turn;
      var left = board.some(function (x, k) { return x && x.p === turn && moves(k).length; });
      if (!left) { over = true; paint(); A.win(1 - turn, name(1 - turn) + ' Wins!', count(turn) ? 'No moves left!' : 'Every piece captured!'); return; }
      paint();
    }
    function paint() {
      var targets = sel >= 0 ? moves(sel, chain).map(function (m) { return m.to; }) : [];
      cells.forEach(function (c, i) {
        var pc = board[i];
        c.classList.toggle('sel', i === sel);
        c.classList.toggle('target', targets.indexOf(i) >= 0);
        c.classList.toggle('last', last.indexOf(i) >= 0);
        c.innerHTML = pc ? '<span class="ck-pc p' + pc.p + (pc.k ? ' king' : '') + '"></span>' : '';
      });
      [0, 1].forEach(function (p) { var n = count(p); A.sub(p, n + (n === 1 ? ' piece' : ' pieces')); });
      if (!over) { A.set(name(turn) + '’s Turn'); A.turn(turn); }
    }
    reset();
  }

  [['checkers', checkers]].forEach(function (g) { var x = game(g[0]); if (x) x.mount = g[1]; });
})();
