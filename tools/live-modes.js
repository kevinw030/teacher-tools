// Sidekick Live game modes. Every mode asks the same questions and scores them the same way
// (assets/live-core.js). A mode only changes what the big screen shows between questions, and what
// the end of the game looks like. All original: no mode here copies another game's modes, names or art.
// A mode: { id, name, blurb, color, art (small SVG for the picker), board(h, players, info) }
(function () {
  var M = window.LiveModes = {};
  var MODES = [];
  M.add = function (m) { MODES.push(m); };
  M.list = function () { return MODES.slice(); };
  M.get = function (id) { return MODES.filter(function (m) { return m.id === id; })[0] || MODES[0]; };

  function buddy(h, p, cls) { return window.Buddy ? Buddy.el(p.buddy, cls) : h('span', { class: cls }); }

  // ---------- Classic Quiz ----------
  M.add({
    id: 'classic', name: 'Classic Quiz', blurb: 'Fast answers are worth more. Leaderboard after every question.', color: '#2F6BFF',
    art: '<svg viewBox="0 0 48 48" fill="none"><rect x="5" y="9" width="38" height="24" rx="5" fill="#2F6BFF"/><path d="M14 39h20" stroke="#2F6BFF" stroke-width="4" stroke-linecap="round"/><path d="M24 33v6" stroke="#2F6BFF" stroke-width="4"/><path d="M13 17h22M13 24h14" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>',
    board: function (h, players, info) {
      if (!players.length) return null;
      var top = players.slice(0, 5);
      return h('div', { class: 'live-board' },
        h('h3', { text: info.qn >= info.total ? 'Final Scores' : 'Top of the Class' }),
        h('div', { class: 'live-board-rows' }, top.map(function (p, i) {
          return h('div', { class: 'live-row r' + (i + 1) },
            h('span', { class: 'live-row-place', text: '#' + p.place }), buddy(h, p, 'live-row-buddy'),
            h('b', { text: p.name }), h('span', { class: 'live-row-score', text: p.score.toLocaleString() }));
        })));
    }
  });
})();
