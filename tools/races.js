// Addition, Subtraction and Division Races. Same board game as Multiplication Race (tools/trail.js),
// each with its own theme and Kevin's artwork: Garden Rally, Desert Rally and Deep Sea Rally.
(function () {
  var TT = window.TT;
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  var OWN = ['question', 'move', 'rocket', 'banana', 'dice', 'swap', 'finish', 'sign', 'pawns', 'pawn-1', 'pawn-2', 'pawn-3', 'pawn-4'];
  function kinds(moveTitle, moveText, boostTitle) {
    return {
      q: ['question', 'Fact Check', 'Solve it to move ahead 2'],
      move: ['move', moveTitle, moveText],
      boost: ['rocket', boostTitle, 'Double your roll'],
      slip: ['banana', 'Banana Slip', 'Slide back 2'],
      again: ['dice', 'Roll Again', 'Take another turn'],
      swap: ['swap', 'Switch Places', 'Trade spots with the leader']
    };
  }
  function teams(list) { return list.map(function (t, i) { return [t[0], t[1], 'pawn-' + (i + 1)]; }); }
  function doubles(r) { return r + ' + ' + r + ' = ' + r * 2; }

  // Addition: facts within 10 and 20, then two- and three-digit sums (regrouping happens naturally).
  var ADD = {
    w10: function () { var a = rnd(1, 9); return [a, rnd(1, 10 - a)]; },
    w20: function () { var a = rnd(2, 10); return [a, rnd(Math.max(1, 11 - a), Math.min(10, 20 - a))]; },
    d2: function () { var a = rnd(10, 89); return [a, rnd(10, 99 - a)]; },
    d3: function () { var a = rnd(100, 899); return [a, rnd(100, 999 - a)]; }
  };
  // Subtraction: never below zero.
  var SUB = {
    w10: function () { var a = rnd(2, 10); return [a, rnd(1, a)]; },
    w20: function () { var a = rnd(11, 20); return [a, rnd(2, 10)]; },
    d2: function () { var a = rnd(21, 99); return [a, rnd(10, a - 1)]; },
    d3: function () { var a = rnd(201, 999); return [a, rnd(100, a - 1)]; }
  };
  var LEVELS = [['w10', 'Within 10', 'Kindergarten and 1st grade'], ['w20', 'Within 20', '1st and 2nd grade'], ['d2', 'Two-Digit', '2nd and 3rd grade'], ['d3', 'Three-Digit', '3rd and 4th grade']];
  var divisors = [];
  for (var d = 2; d <= 12; d++) divisors.push([d, '÷' + d, 'Divide by ' + d]);

  var add = TT.race({
    key: 'race-add', setKey: 'race-add-set', cls: 'th-garden', dir: 'garden', own: OWN, signArt: 'sign', pairArt: 'pawns',
    teams: teams([['Mint Team', '#2EDD7A'], ['Sunny Team', '#F5C518'], ['Rose Team', '#F0437E'], ['Sky Team', '#2F8FE8']]),
    kinds: kinds('Count On', 'Count and move, then go ahead 1', 'Doubles'),
    picker: { label: 'Facts in Play', options: LEVELS, def: ['w20', 'd2'] },
    fact: function (sel) { var f = ADD[pick(sel)](); if (Math.random() < 0.5) f.reverse(); return { text: f[0] + ' + ' + f[1], ans: f[0] + f[1], key: Math.min(f[0], f[1]) + '+' + Math.max(f[0], f[1]) }; },
    move: function () { var n = pick([2, 5, 10]), s = rnd(0, 20); return 'Everyone count on by ' + n + 's from ' + s + ' to ' + (s + n * 10); },
    boost: doubles,
    cheer: 'What a race. Great adding, everyone!'
  });
  var sub = TT.race({
    key: 'race-sub', setKey: 'race-sub-set', cls: 'th-desert', dir: 'desert', own: OWN, signArt: 'sign', pairArt: 'pawns',
    teams: teams([['Coral Team', '#F2553A'], ['Turquoise Team', '#1FCFC0'], ['Gold Team', '#F5A623'], ['Purple Team', '#A14DF0']]),
    kinds: kinds('Count Back', 'Count back and move, then go ahead 1', 'Rocket Boost'),
    picker: { label: 'Facts in Play', options: LEVELS, def: ['w20', 'd2'] },
    fact: function (sel) { var f = SUB[pick(sel)](); return { text: f[0] + ' − ' + f[1], ans: f[0] - f[1], key: f[0] + '-' + f[1] }; },
    move: function () { var n = pick([2, 5, 10]), e = rnd(0, 10); return 'Everyone count back by ' + n + 's from ' + (e + n * 10) + ' to ' + e; },
    boost: doubles,
    cheer: 'What a race. Great subtracting, everyone!'
  });
  // Division: every fact is built from a times fact, so answers are always whole numbers.
  var div = TT.race({
    key: 'race-div', setKey: 'race-div-set', cls: 'th-sea', dir: 'sea', own: OWN, signArt: 'sign', pairArt: 'pawns',
    teams: teams([['Cyan Team', '#12D8F0'], ['Violet Team', '#9233EA'], ['Coral Team', '#F0365A'], ['Gold Team', '#F5C000']]),
    kinds: kinds('Skip Count', 'Count and move, then go ahead 1', 'Rocket Boost'),
    picker: { label: 'Divide By', options: divisors, def: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
    fact: function (sel) { var d = pick(sel), q = rnd(2, 12); return { text: d * q + ' ÷ ' + d, ans: q, key: d * q + '/' + d }; },
    move: function (sel) { var n = pick(sel); return 'Everyone count by ' + n + 's up to ' + n * 10; },
    boost: doubles,
    cheer: 'What a race. Great dividing, everyone!'
  });

  var flag = '<path d="M16 3v8M16 4h5l-1.5 2L21 8h-5"/>';
  var mine = [
    { id: 'addition-race', title: 'Addition Race', desc: 'Garden Rally. Teams roll, race around the track and solve addition facts to get ahead.', color: 'lime', mount: add, forget: ['race-add'],
      icon: flag + '<path d="M7 10v8M3 14h8"/>' },
    { id: 'subtraction-race', title: 'Subtraction Race', desc: 'Desert Rally. Teams roll, race around the track and solve subtraction facts to get ahead.', color: 'coral', mount: sub, forget: ['race-sub'],
      icon: flag + '<path d="M3 14h8"/>' },
    { id: 'division-race', title: 'Division Race', desc: 'Deep Sea Rally. Teams roll, race around the track and solve division facts to get ahead.', color: 'sky', mount: div, forget: ['race-div'],
      icon: flag + '<path d="M3 14h8"/><circle cx="7" cy="10.5" r="1.2" fill="currentColor"/><circle cx="7" cy="17.5" r="1.2" fill="currentColor"/>' }
  ];
  // Kevin's order for the races: Addition, Subtraction, Multiplication, Division
  var games = TT.games || [], at = games.map(function (g) { return g.id; }).indexOf('trail-race');
  if (at < 0) TT.games = games.concat(mine);
  else TT.games = games.slice(0, at).concat(mine.slice(0, 2), games[at], mine[2], games.slice(at + 1));
})();
