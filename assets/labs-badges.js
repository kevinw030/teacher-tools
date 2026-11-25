// Badges students earn in Sidekick Live (Labs preview). Each badge is a round medal with a ribbon,
// drawn here as SVG. Saved on the student as { key: 'YYYY-MM-DD' } (the day it was first earned).
// The teacher's screen decides which badges a game earned (LabBadges.forGame) and saves them through
// lab_save_results (supabase/labs.sql), so students can't hand themselves badges.
(function () {
  var LB = window.LabBadges = {};
  // key, name, how to earn it, medal color, icon (24x24 strokes)
  var I = {
    buddy: '<circle cx="12" cy="13" r="7"/><circle cx="9.5" cy="12" r="1" fill="currentColor"/><circle cx="14.5" cy="12" r="1" fill="currentColor"/><path d="M9.5 15.5q2.5 2 5 0M9 6.5 7.5 3.5M15 6.5l1.5-3"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    ten: '<path d="M6 8l2-1.5V17M12 8.5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0z"/>',
    joy: '<rect x="3" y="7" width="18" height="11" rx="5"/><path d="M8 10.5v4M6 12.5h4"/><circle cx="15.5" cy="11.5" r="1" fill="currentColor"/><circle cx="17.5" cy="13.5" r="1" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    checks: '<path d="M2.5 12.5 6 16l7.5-8M10.5 15l1 1 9-9.5"/>',
    flame: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-6 2 1 2.5 2.5 2.5 4 1.5-2 1.5-5 1.5-9z"/>',
    fire2: '<path d="M9 4c1 3 5 5 5 9a5 5 0 0 1-10 0c0-2.5 1.5-3.5 1.5-5 1.5 1 2 2 2 3.5 1-1.5 1.5-4 1.5-7.5z"/><path d="M16 9c.5 2 4 3 4 6.5a4 4 0 0 1-4.5 4"/>',
    bolt: '<path d="M13 2 5 13.5h6L10 22l9-12h-6z"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    podium: '<path d="M3 20v-6h6v6M9 20V9h6v11M15 20v-8h6v8M2 20h20"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v3.5M8 20.5h8l-1-3H9z"/>',
    plus: '<path d="M7 4v6M4 7h6M14 7h6M5 15l4 4M9 15l-4 4M14 15.5h6M14 18.5h6"/>',
    book: '<path d="M4 5.5C6.5 4 9.5 4 12 5.5 14.5 4 17.5 4 20 5.5V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z"/><path d="M12 5.5V19"/>',
    flask: '<path d="M9.5 3.5h5M10.5 3.5v6L5 18.5a1.5 1.5 0 0 0 1.3 2.2h11.4a1.5 1.5 0 0 0 1.3-2.2l-5.5-9v-6"/><path d="M7.5 15h9"/>',
    team: '<circle cx="8" cy="8.5" r="3"/><circle cx="16" cy="8.5" r="3"/><path d="M2.5 19c.5-3.5 3-5.5 5.5-5.5s5 2 5.5 5.5M10.5 19c.5-3.5 3-5.5 5.5-5.5s5 2 5.5 5.5"/>',
    sprout: '<path d="M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-4 3-6 7-6 0 4-3 6-7 6z"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>'
  };
  LB.LIST = [
    ['buddy', 'Buddy Maker', 'Make your very own buddy.', '#FF6FAE', I.buddy],
    ['first_game', 'First Game', 'Play your first live game.', '#3FA9F5', I.play],
    ['games10', 'Game Fan', 'Play 10 live games.', '#5B6CFF', I.ten],
    ['games50', 'Game Legend', 'Play 50 live games.', '#9B6BFF', I.joy],
    ['right100', '100 Right', 'Get 100 answers right.', '#22C3A6', I.check],
    ['right500', '500 Right', 'Get 500 answers right.', '#0F9E7B', I.checks],
    ['streak5', 'Hot Streak', 'Get 5 right in a row.', '#FF7A59', I.flame],
    ['streak10', 'On Fire', 'Get 10 right in a row.', '#E9465A', I.fire2],
    ['quick', 'Quick Thinker', 'Answer right in under 3 seconds.', '#FFB627', I.bolt],
    ['perfect', 'Perfect Game', 'Get every answer right in a game (5 or more).', '#7BD15A', I.target],
    ['podium', 'Top Three', 'Finish a game in the top three.', '#3FA9F5', I.podium],
    ['champion', 'Champion', 'Finish a game in first place.', '#FFB627', I.trophy],
    ['math50', 'Math Whiz', 'Get 50 math answers right.', '#5B6CFF', I.plus],
    ['words50', 'Word Wizard', 'Get 50 reading and word answers right.', '#9B6BFF', I.book],
    ['science50', 'Science Star', 'Get 50 science answers right.', '#22C3A6', I.flask],
    ['team', 'Team Player', 'Win a team game.', '#FF7A59', I.team],
    ['garden', 'Green Thumb', 'Help your class win a team-up game.', '#7BD15A', I.sprout],
    ['star', 'Gold Star', 'A special star from your teacher.', '#FFB627', I.star]
  ];
  LB.byKey = {};
  LB.LIST.forEach(function (b) { LB.byKey[b[0]] = { key: b[0], name: b[1], how: b[2], color: b[3], icon: b[4] }; });
  LB.name = function (k) { return LB.byKey[k] ? LB.byKey[k].name : k; };

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), f = amt < 0 ? 0 : 255, p = Math.abs(amt);
    var r = Math.round(((n >> 16) & 255) * (1 - p) + f * p), g = Math.round(((n >> 8) & 255) * (1 - p) + f * p), b = Math.round((n & 255) * (1 - p) + f * p);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  // One medal. earned=false draws it as a soft gray outline with a lock.
  LB.svg = function (key, earned) {
    var b = LB.byKey[key]; if (!b) return '';
    var c = earned ? b.color : '#C9CCDA', d = earned ? shade(b.color, -0.3) : '#A9ADBF', l = earned ? shade(b.color, 0.45) : '#E6E8F0';
    return '<svg class="lb-medal" viewBox="0 0 64 72" aria-hidden="true">' +
      '<path d="M20 44l-6 24 9-5 5 8 4-22z" fill="' + d + '"/><path d="M44 44l6 24-9-5-5 8-4-22z" fill="' + d + '"/>' +
      '<circle cx="32" cy="30" r="26" fill="' + c + '"/><circle cx="32" cy="30" r="26" fill="none" stroke="' + d + '" stroke-width="3"/>' +
      '<circle cx="32" cy="30" r="19" fill="' + l + '" opacity="' + (earned ? '.35' : '.6') + '"/>' +
      (earned ? '<path d="M14 22a20 20 0 0 1 12-12" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none" opacity=".7"/>' : '') +
      '<g transform="translate(20 18)" fill="none" stroke="' + (earned ? '#fff' : '#9094A8') + '" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">' + b.icon + '</g>' +
      '</svg>';
  };

  // Which badges one player earned in a game, given their totals before the game (stats),
  // what they did in it (game: { right, answered, bestStreak, fastest(ms), place, players, math, words, science, teamWin, coopWin })
  // and the badges they already have. Returns new badge keys.
  LB.forGame = function (stats, game, have) {
    stats = stats || {}; have = have || {}; var out = [];
    function add(k, ok) { if (ok && !have[k]) out.push(k); }
    var games = (stats.games || 0) + 1, right = (stats.right || 0) + (game.right || 0);
    add('first_game', true);
    add('games10', games >= 10);
    add('games50', games >= 50);
    add('right100', right >= 100);
    add('right500', right >= 500);
    add('streak5', game.bestStreak >= 5);
    add('streak10', game.bestStreak >= 10);
    add('quick', game.fastest > 0 && game.fastest < 3000);
    add('perfect', game.answered >= 5 && game.right === game.answered);
    add('podium', game.players >= 3 && game.place > 0 && game.place <= 3);
    add('champion', game.players >= 2 && game.place === 1);
    add('math50', (stats.math || 0) + (game.math || 0) >= 50);
    add('words50', (stats.words || 0) + (game.words || 0) >= 50);
    add('science50', (stats.science || 0) + (game.science || 0) >= 50);
    add('team', !!game.teamWin);
    add('garden', !!game.coopWin);
    return out;
  };
})();
