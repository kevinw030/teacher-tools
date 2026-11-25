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

  // ---------- Buddy Dash ----------
  // Every right answer moves your buddy along the trail. Three right in a row gives a hop forward.
  M.add({
    id: 'dash', name: 'Buddy Dash', blurb: 'Right answers move your buddy along the trail. First to the flag wins.', color: '#FF7A59',
    art: '<svg viewBox="0 0 48 48" fill="none"><path d="M4 36c8-4 12 4 20 0s12-10 20-6" stroke="#FF7A59" stroke-width="4" stroke-linecap="round"/><circle cx="14" cy="22" r="7" fill="#FF7A59"/><path d="M38 10v12" stroke="#2B1F66" stroke-width="3.5" stroke-linecap="round"/><path d="M38 11h9l-3 4 3 4h-9z" fill="#FFB627"/></svg>',
    board: function (h, players, info) {
      if (!players.length) return null;
      var most = Math.max(1, info.total);
      return h('div', { class: 'live-trail' },
        h('div', { class: 'live-trail-flag', 'aria-hidden': 'true' },
          h('span', { class: 'live-flag', html: '<svg viewBox="0 0 24 40"><path d="M5 2v36" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M6 3h15l-4 5 4 5H6z" fill="#FFD23F"/></svg>' })),
        h('div', { class: 'live-lanes' }, players.slice(0, 10).map(function (p) {
          var pct = Math.min(100, Math.round(p.right / most * 100));
          return h('div', { class: 'live-lane' },
            h('span', { class: 'live-lane-name', text: p.name }),
            h('div', { class: 'live-lane-track' },
              h('div', { class: 'live-runner', style: 'left:' + pct + '%' },
                buddy(h, p, 'live-lane-buddy'), h('span', { class: 'live-lane-steps', text: String(p.right) }))));
        })));
    },
    finish: function (players, info) {
      var top = players.slice().sort(function (a, b) { return b.right - a.right; })[0];
      return { title: top && top.right ? top.name + ' Reached the Flag First!' : 'Good Run, ' + info.klass + '!' };
    }
  });

  // ---------- Team Tug ----------
  // The class is split in two. Every right answer pulls the rope toward that team.
  M.add({
    id: 'tug', name: 'Team Tug', blurb: 'Two teams pull the rope with every right answer.', color: '#7B4DEB',
    teams: [{ name: 'Team Sun', color: '#FFB627' }, { name: 'Team Sea', color: '#2F6BFF' }],
    art: '<svg viewBox="0 0 48 48" fill="none"><path d="M4 24h40" stroke="#7B4DEB" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="24" r="5" fill="#FFD23F"/><circle cx="10" cy="24" r="5" fill="#FFB627"/><circle cx="38" cy="24" r="5" fill="#2F6BFF"/></svg>',
    board: function (h, players, info) {
      var t = info.teams; if (!t) return null;
      var a = t[0].right, b = t[1].right, lead = a - b;
      var pull = Math.max(-5, Math.min(5, lead));          // the rope slides five steps at most
      var pos = 50 - pull * 8;
      return h('div', { class: 'live-tug' },
        h('div', { class: 'live-tug-heads' },
          teamHead(h, t[0], a, 'a'), h('span', { class: 'live-tug-vs', text: 'vs' }), teamHead(h, t[1], b, 'b')),
        h('div', { class: 'live-rope' },
          h('i', { class: 'live-rope-line' }),
          h('span', { class: 'live-knot', style: 'left:' + pos + '%; --kc:' + (lead > 0 ? t[0].color : lead < 0 ? t[1].color : '#FFD23F') })),
        h('p', { class: 'live-tug-say', text: lead === 0 ? 'Dead even!' : (lead > 0 ? t[0].name : t[1].name) + ' is pulling ahead!' }));
    },
    finish: function (players, info) {
      var t = info.teams, win = t[0].right === t[1].right ? null : (t[0].right > t[1].right ? 0 : 1);
      return { winTeam: win, title: win == null ? 'A Tie! Great Pulling, Everyone!' : t[win].name + ' Wins the Tug!' };
    },
    endBoard: function (h, players, info) {
      var t = info.teams; if (!t) return null;
      return h('div', { class: 'live-tug-end' }, t.map(function (team) {
        return h('div', { class: 'live-team-card', style: '--tc:' + team.color },
          h('b', { text: team.name }), h('span', { class: 'live-team-n', text: team.right + ' right' }),
          h('div', { class: 'live-team-buddies' }, team.players.slice(0, 8).map(function (p) { return buddy(h, p, 'live-team-buddy'); })));
      }));
    }
  });

  // ---------- Class Garden ----------
  // Everyone works together: right answers grow flowers. Nobody loses anything for a wrong answer.
  M.add({
    id: 'garden', name: 'Class Garden', blurb: 'Everyone works together. Right answers grow the class garden.', color: '#22C3A6',
    art: '<svg viewBox="0 0 48 48" fill="none"><path d="M6 40h36" stroke="#5FB33E" stroke-width="4" stroke-linecap="round"/><path d="M16 40V26M32 40V22" stroke="#5FB33E" stroke-width="3.5" stroke-linecap="round"/><circle cx="16" cy="21" r="6" fill="#FF6FAE"/><circle cx="32" cy="17" r="6" fill="#FFB627"/></svg>',
    board: function (h, players, info) {
      var grown = info.classRight, goal = info.goal, pct = Math.min(100, Math.round(grown / goal * 100));
      var flowers = [];
      for (var i = 0; i < Math.min(24, grown); i++) flowers.push(flower(h, i));
      return h('div', { class: 'live-garden' },
        h('div', { class: 'live-garden-bar' }, h('i', { style: 'width:' + pct + '%' }), h('b', { text: grown + ' of ' + goal + ' flowers' })),
        h('div', { class: 'live-garden-bed' }, flowers.length ? flowers : h('p', { class: 'live-garden-empty', text: 'Answer together to grow the first flower!' })));
    },
    finish: function (players, info) {
      var won = info.classRight >= info.goal;
      return { coopWin: won, title: won ? 'The Garden Is Full! Great Teamwork!' : 'The Garden Grew ' + info.classRight + ' Flowers!' };
    },
    endBoard: function (h, players, info) { return this.board(h, players, info); }
  });

  function teamHead(h, team, n, side) {
    return h('div', { class: 'live-team-head ' + side, style: '--tc:' + team.color },
      h('b', { text: team.name }), h('span', { text: n + ' right' }),
      h('div', { class: 'live-team-buddies' }, team.players.slice(0, 6).map(function (p) { return buddy(h, p, 'live-team-buddy'); })));
  }
  var PETALS = ['#FF6FAE', '#FFB627', '#9B6BFF', '#FF7A59', '#3FA9F5', '#E9465A'];
  function flower(h, i) {
    var c = PETALS[i % PETALS.length], tall = 40 + (i % 5) * 8;
    return h('span', { class: 'live-flower', style: '--d:' + (i % 8) * 0.12 + 's',
      html: '<svg viewBox="0 0 40 ' + (tall + 30) + '"><path d="M20 ' + (tall + 28) + 'V22" stroke="#4FA336" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M20 ' + (tall - 2) + 'c-8-6-16-2-16-2s8 8 16 2z" fill="#5FB33E"/>' +
        '<circle cx="20" cy="10" r="8" fill="' + c + '"/><circle cx="31" cy="19" r="8" fill="' + c + '"/><circle cx="9" cy="19" r="8" fill="' + c + '"/>' +
        '<circle cx="20" cy="18" r="6" fill="#FFF3D6"/></svg>' });
  }
})();
