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


  // ---------- Self-paced modes ----------
  // Everyone answers at their own speed on their own device. A right answer earns a turn at the game
  // bit, then the next question comes. Everyone is racing the rest of the class for points, and the
  // big screen keeps the live leaderboard. The teacher's screen decides every outcome.
  function rnd(n) { return Math.floor(Math.random() * n); }

  // Acorn Stash: pick one of three baskets. Mostly acorns, sometimes something surprising.
  M.add({
    id: 'acorns', name: 'Acorn Stash', solo: true, color: '#E89A00',
    blurb: 'Answer at your own speed. Every right answer opens a basket: acorns, double, a shield or a swap.',
    art: '<svg viewBox="0 0 48 48" fill="none"><path d="M10 22h28l-3 18H13z" fill="#C98A4B"/><path d="M8 18h32v5H8z" fill="#A9622F"/><circle cx="20" cy="12" r="5" fill="#E89A00"/><circle cx="30" cy="14" r="4" fill="#FFB627"/></svg>',
    pick: 3,
    // A turn: which basket they tapped. Returns what happens.
    resolve: function (p, choice, ctx) {
      var roll = rnd(100);
      if (roll < 52) { var n = 10 + rnd(16); return { gained: n, kind: 'acorns', say: '+' + n + ' acorns!' }; }
      if (roll < 70) { var big = 26 + rnd(20); return { gained: big, kind: 'big', say: 'A big haul! +' + big }; }
      if (roll < 80) return { gained: Math.max(8, Math.round(p.score * 0.5)), kind: 'double', say: 'Half again on top of your pile!' };
      if (roll < 88) return { gained: 6, kind: 'shield', shield: true, say: 'A shield! Your pile is safe from one swap.' };
      if (roll < 96) {
        // A swap, but only with someone ahead of you, and never more than 25 acorns. Nobody is wiped out.
        var ahead = ctx.players.filter(function (o) { return o.sid !== p.sid && o.score > p.score && !o.shield; });
        if (!ahead.length) { return { gained: 14, kind: 'acorns', say: '+14 acorns!' }; }
        var other = ahead[rnd(ahead.length)], take = Math.min(25, Math.round((other.score - p.score) / 2) || 10);
        return { gained: take, kind: 'swap', takeFrom: other.sid, take: take, say: 'You took ' + take + ' acorns from ' + other.name + '!' };
      }
      return { gained: 12, kind: 'gift', giftLowest: 12, say: 'A gift basket! You and whoever has the fewest acorns both get 12.' };
    },
    board: soloBoard('Acorns')
  });

  // Tower Climb: build your tower higher, or guard it before the next gust of wind.
  M.add({
    id: 'tower', name: 'Tower Climb', solo: true, color: '#3FA9F5',
    blurb: 'Answer at your own speed, then build your tower higher or guard it from the wind.',
    art: '<svg viewBox="0 0 48 48" fill="none"><rect x="14" y="30" width="20" height="12" fill="#3FA9F5"/><rect x="16" y="20" width="16" height="10" fill="#5B6CFF"/><rect x="18" y="12" width="12" height="8" fill="#9B6BFF"/><path d="M30 8h8l-3 3 3 3h-8z" fill="#FFD23F"/></svg>',
    pick: 3,
    // 0 = build small and safe, 1 = build big but the wind can take some, 2 = guard.
    resolve: function (p, choice, ctx) {
      if (choice === 2) return { gained: 6, kind: 'shield', shield: true, say: 'Guarded! The next gust goes right past you.' };
      if (choice === 1) {
        if (rnd(100) < 68) { var tall = 28 + rnd(16); return { gained: tall, kind: 'big', say: 'A tall new floor! +' + tall }; }
        var lost = Math.min(p.score, 10 + rnd(10));
        if (p.shield) return { gained: 10, kind: 'shield', usedShield: true, say: 'The wind blew, but your guard held! +10' };
        return { gained: -lost, kind: 'gust', say: 'A gust of wind! You lost ' + lost + '.' };
      }
      var n = 12 + rnd(10);
      return { gained: n, kind: 'acorns', say: 'A solid new floor! +' + n };
    },
    board: soloBoard('Blocks')
  });

  // Rocket Fuel: a one-tap timing bar. Stop the glow in the green for a big boost.
  M.add({
    id: 'rocket', name: 'Rocket Fuel', solo: true, color: '#7B4DEB',
    blurb: 'Answer at your own speed, then stop the fuel bar in the green for a bigger boost.',
    art: '<svg viewBox="0 0 48 48" fill="none"><path d="M24 4c7 6 10 14 10 22l-10 6-10-6c0-8 3-16 10-22z" fill="#7B4DEB"/><circle cx="24" cy="18" r="4" fill="#CFF4EC"/><path d="M18 32l-4 10 10-4 10 4-4-10" fill="#FF7A59"/></svg>',
    meter: true,
    // The student's device sends how close to the middle of the green they stopped (0 to 100).
    resolve: function (p, choice, ctx) {
      var near = Math.max(0, Math.min(100, choice | 0));
      if (near >= 85) return { gained: 34 + rnd(8), kind: 'big', say: 'Perfect burn! Full boost!' };
      if (near >= 55) return { gained: 20 + rnd(8), kind: 'acorns', say: 'Good boost!' };
      return { gained: 10 + rnd(6), kind: 'acorns', say: 'A small puff of fuel.' };
    },
    board: soloBoard('Fuel')
  });

  // Every self-paced mode shows the same live race on the big screen.
  function soloBoard(unit) {
    return function (h, players, info) {
      var top = players.slice(0, 8), most = Math.max(1, (top[0] && top[0].score) || 1);
      return h('div', { class: 'live-race' },
        h('div', { class: 'live-race-rows' }, top.map(function (p, i) {
          return h('div', { class: 'live-race-row' + (i === 0 ? ' lead' : '') },
            h('span', { class: 'live-row-place', text: '#' + p.place }),
            buddy(h, p, 'live-row-buddy'), h('b', { text: p.name }),
            h('span', { class: 'live-race-bar' }, h('i', { style: 'width:' + Math.round(p.score / most * 100) + '%' })),
            h('span', { class: 'live-row-score', text: p.score.toLocaleString() }));
        })),
        h('p', { class: 'live-race-unit muted', text: unit + ' · everyone is answering at their own speed' }));
    };
  }

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
