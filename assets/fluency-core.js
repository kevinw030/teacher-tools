// Fact Fluency: the fact maker shared by the teacher's page (tools/fluency.js) and the student
// join page (assets/join-fluency.js), so both sides make the same kinds of facts.
(function () {
  var F = window.Fluency = window.Fluency || {};
  F.OPS = [['add', 'Addition', '+'], ['sub', 'Subtraction', '−'], ['mul', 'Multiplication', '×'], ['div', 'Division', '÷'], ['mix', 'Mixed', '±']];
  F.LEVELS = [['1', 'Starter'], ['2', 'On Level'], ['3', 'Challenge']];
  F.HINT = {
    add: ['Sums to 10', 'Sums to 20', 'Sums to 100'], sub: ['Within 10', 'Within 20', 'Within 100'],
    mul: ['×0, 1, 2, 5 and 10', 'Up to 10 × 10', 'Up to 12 × 12'], div: ['÷1, 2, 5 and 10', 'Facts to 100 ÷ 10', 'Facts to 144 ÷ 12'],
    mix: ['A little of everything', 'A little of everything', 'A little of everything']
  };
  F.TIMES = [[30, '30 Seconds'], [60, '1 Minute'], [120, '2 Minutes']];
  // The Math Race that practices the same facts.
  F.RACE = { add: ['/addition-race', 'Addition Race'], sub: ['/subtraction-race', 'Subtraction Race'], mul: ['/trail-race', 'Multiplication Race'], div: ['/division-race', 'Division Race'] };

  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  F.fact = function (op, lv) {
    if (op === 'mix') op = ['add', 'sub', 'mul', 'div'][rnd(0, 3)];
    var a, b, easy = [0, 1, 2, 5, 10];
    if (op === 'add' || op === 'sub') {
      if (lv === 1) { a = rnd(0, 10); b = rnd(0, 10 - a); }
      else if (lv === 2) { a = rnd(2, 12); b = rnd(2, Math.min(9, 20 - a)); }
      else { a = rnd(11, 79); b = rnd(3, Math.min(20, 100 - a)); }
      return op === 'add' ? { q: a + ' + ' + b, a: a + b } : { q: (a + b) + ' − ' + b, a: a };
    }
    if (lv === 1) { a = easy[rnd(0, 4)]; b = rnd(1, 10); } else { a = rnd(2, lv === 2 ? 10 : 12); b = rnd(2, lv === 2 ? 10 : 12); }
    if (op === 'mul') return Math.random() < 0.5 ? { q: a + ' × ' + b, a: a * b } : { q: b + ' × ' + a, a: a * b };
    if (a === 0) a = 1;
    return { q: (a * b) + ' ÷ ' + a, a: b };
  };
  // A new fact that isn't the one just shown.
  F.next = function (op, lv, last) { var n, i = 0; do { n = F.fact(op, lv); } while (last && n.q === last.q && ++i < 20); return n; };
  F.opName = function (op) { var o = F.OPS.filter(function (x) { return x[0] === op; })[0]; return o ? o[1] : 'Facts'; };
  F.opSign = function (op) { var o = F.OPS.filter(function (x) { return x[0] === op; })[0]; return o ? o[2] : '?'; };
  F.okOp = function (op) { return F.OPS.some(function (o) { return o[0] === op; }); };
  // A fact the way students saw it, e.g. "7 × 8". Used to tally the facts a class misses.
  F.okFact = function (q) { return typeof q === 'string' && /^\d{1,3} [+−×÷] \d{1,3}$/.test(q); };
  F.perMin = function (right, secs) { return secs ? Math.round(right * 600 / secs) / 10 : 0; };
})();
