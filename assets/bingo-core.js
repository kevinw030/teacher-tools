// Class Bingo: the parts both screens share (the teacher's page and the student join page).
// Word and math-fact lists, making cards, checking for a win, and class codes.
(function () {
  var B = window.Bingo = window.Bingo || {};

  // ---------- Class codes ----------
  // 6 characters from letters and digits that can't be mixed up (no O/0, I/1/L, S/5, Z/2).
  // 28 characters, so about 480 million codes.
  B.ALPHA = 'ABCDEFGHJKMNPQRTUVWXY3456789';
  B.makeCode = function () {
    var out = '', a = new Uint32Array(6);
    (window.crypto || window.msCrypto).getRandomValues(a);
    for (var i = 0; i < 6; i++) out += B.ALPHA[a[i] % B.ALPHA.length];
    return out;
  };
  // What a student typed, tidied: capitals only, spaces and dashes dropped.
  B.cleanCode = function (s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); };
  B.showCode = function (c) { return c ? c.slice(0, 3) + ' ' + c.slice(3) : ''; };

  // ---------- Random numbers you can repeat (same seed, same card) ----------
  B.seeded = function (seed) {
    var h = 1779033703 ^ String(seed).length;
    for (var i = 0; i < String(seed).length; i++) { h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    var a = h >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  B.shuffle = function (arr, rand) {
    rand = rand || Math.random;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  B.randomId = function () { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); };

  // ---------- Items ----------
  // An item is { card: what is printed on the card, calls: [what the caller says] }.
  // Words: one per line, with an optional clue after a colon or dash ("habitat: where an animal lives").
  B.fromWords = function (text, callClue) {
    var seen = {}, out = [];
    String(text || '').split(/\r?\n|;/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var m = line.match(/^(.+?)\s*(?::|\s[-–—]\s|\t)\s*(.+)$/);
      var word = (m ? m[1] : line).trim().slice(0, 40), clue = m ? m[2].trim().slice(0, 200) : '';
      var key = word.toLowerCase();
      if (!word || seen[key]) return;
      seen[key] = 1;
      out.push({ card: word, calls: [callClue && clue ? clue : word], clue: clue });
    });
    return out;
  };
  B.hasClues = function (text) { return B.fromWords(text).some(function (i) { return i.clue; }); };

  // Math facts: every fact with both numbers from min to max. Cards show answers, the caller shows a fact.
  B.OPS = { add: '+', sub: '−', mul: '×', div: '÷' };
  // need: how many different answers a card needs. When the chosen numbers don't give that many
  // (like 0 to 10 subtraction, only 11 answers), the first number keeps going a little higher until
  // there are enough, so every card can still be different. list.stretched tells how far it went.
  B.fromFacts = function (ops, min, max, need) {
    var list = facts(ops, min, max, max), top = max;
    while (need && list.length < need && top < max + 40) { top++; list = facts(ops, min, max, top); }
    if (top > max) list.stretched = top;
    return list;
  };
  function facts(ops, min, max, top) {
    var by = {};
    function add(ans, call) { (by[ans] = by[ans] || []).push(call); }
    ops.forEach(function (op) {
      for (var a = min; a <= top; a++) for (var b = min; b <= max; b++) {
        if (op === 'add') add(a + b, a + ' + ' + b);
        if (op === 'sub') add(a, (a + b) + ' − ' + b);
        if (op === 'mul') add(a * b, a + ' × ' + b);
        if (op === 'div' && b > 0) add(a, (a * b) + ' ÷ ' + b);
      }
    });
    return Object.keys(by).map(Number).sort(function (x, y) { return x - y; })
      .map(function (n) { return { card: String(n), calls: by[n] }; });
  }
  // Say a fact the way a teacher would: "7 times 8".
  B.spoken = function (s) {
    return String(s).replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/−/g, ' minus ').replace(/\+/g, ' plus ').replace(/\s+/g, ' ').trim();
  };

  // ---------- Cards ----------
  B.cellsNeeded = function (size, free) { return size * size - (free && size % 2 ? 1 : 0); };
  // A card is a list of item numbers, row by row. -1 is the free space in the middle.
  B.makeCard = function (count, size, free, seed) {
    var rand = B.seeded(seed), pick = B.shuffle(Array.from({ length: count }, function (_, i) { return i; }), rand);
    var cells = [], mid = free && size % 2 ? Math.floor(size * size / 2) : -1, k = 0;
    for (var i = 0; i < size * size; i++) cells.push(i === mid ? -1 : pick[k++ % count]);
    return cells;
  };

  // Ways to win. Each is a list of cell positions that all need marking.
  B.PATTERNS = { line: 'Any Line', corners: 'Four Corners', full: 'Full Card' };
  B.lines = function (size, pattern) {
    var n = size, out = [], i, j, r;
    if (pattern === 'corners') return [[0, n - 1, n * (n - 1), n * n - 1]];
    if (pattern === 'full') return [Array.from({ length: n * n }, function (_, k) { return k; })];
    for (i = 0; i < n; i++) {
      r = []; for (j = 0; j < n; j++) r.push(i * n + j); out.push(r);
      r = []; for (j = 0; j < n; j++) r.push(j * n + i); out.push(r);
    }
    r = []; for (i = 0; i < n; i++) r.push(i * n + i); out.push(r);
    r = []; for (i = 0; i < n; i++) r.push(i * n + n - 1 - i); out.push(r);
    return out;
  };
  // marked: true/false for each cell. Returns the winning cell positions, or null.
  B.winLine = function (marked, size, pattern) {
    var ls = B.lines(size, pattern);
    for (var i = 0; i < ls.length; i++) if (ls[i].every(function (p) { return marked[p]; })) return ls[i];
    return null;
  };
  // How close a card is: the fewest cells still needed for any way to win.
  B.toGo = function (marked, size, pattern) {
    return Math.min.apply(null, B.lines(size, pattern).map(function (l) { return l.filter(function (p) { return !marked[p]; }).length; }));
  };
  // Text size for a cell as a share of the cell's width: the longest word must fit on one line
  // and all the words must fit top to bottom, so words never get broken in the middle.
  B.fitSize = function (text) {
    var t = String(text), words = t.split(/\s+/), longest = Math.max.apply(null, words.map(function (w) { return w.length; }));
    var lines = words.length === 1 ? 1 : Math.min(words.length, Math.max(2, Math.ceil(t.length / Math.max(longest, 8))));
    // Very long words (photosynthesis) split over two lines with a hyphen instead of shrinking to nothing.
    if (longest > 10) { longest = Math.ceil(longest / 2) + 1; lines += 1; }
    return Math.max(0.09, Math.min(/^\d+$/.test(t) ? 0.42 : 0.3, 1.6 / Math.max(longest, 1), 0.8 / (lines * 1.08))).toFixed(3);
  };
  // After a card is on the page: shrink any cell whose text still spills out (fonts differ from computer to computer).
  B.fitCells = function (box) {
    if (!box) return;
    var cells = box.querySelectorAll('.bc-cell:not(.bc-free)');
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i], k = parseFloat(c.style.getPropertyValue('--k')) || 0.2;
      if (!c.dataset.k0) c.dataset.k0 = k; else { k = parseFloat(c.dataset.k0); c.style.setProperty('--k', k); }
      for (var n = 0; n < 10 && (c.scrollWidth > c.clientWidth + 1 || c.scrollHeight > c.clientHeight + 1); n++) {
        k *= 0.9; c.style.setProperty('--k', k.toFixed(3));
      }
    }
  };
  B.HEAD = ['B', 'I', 'N', 'G', 'O'];

  // ---------- Drawing a card ----------
  // o: { cards: card texts by item number, cells, size, title, number, marked: [bool], hits: [bool] (called cells, for checking),
  //      onTap(pos) makes each cell a button }
  var COLS = ['#F2643D', '#E89A00', '#0FA974', '#0B9BD8', '#7B4DEB'];
  B.COLS = COLS;
  B.cardEl = function (o) {
    var n = o.size, card = document.createElement('div');
    card.className = 'bc bc-s' + n + (o.onTap ? ' bc-play' : '');
    var head = document.createElement('div');
    head.className = 'bc-head';
    if (n === 5) {
      B.HEAD.forEach(function (L, i) { var s = document.createElement('span'); s.textContent = L; s.style.setProperty('--hc', COLS[i]); s.style.setProperty('--d', i * 60 + 'ms'); head.append(s); });
    } else {
      var t = document.createElement('span'); t.className = 'bc-word'; t.textContent = 'Bingo'; head.append(t);
    }
    card.append(head);
    if (o.title || o.number) {
      var sub = document.createElement('div'); sub.className = 'bc-sub';
      sub.textContent = (o.title || '') + (o.title && o.number ? ' · ' : '') + (o.number ? 'Card ' + o.number : '');
      card.append(sub);
    }
    var grid = document.createElement('div');
    grid.className = 'bc-grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', 'Bingo card, ' + n + ' by ' + n);
    grid.style.setProperty('--n', n);
    o.cells.forEach(function (c, p) {
      var free = c === -1, text = free ? 'Free' : o.cards[c];
      var el = document.createElement(o.onTap && !free ? 'button' : 'div');
      el.className = 'bc-cell' + (free ? ' bc-free' : '');
      if (!free) { el.style.setProperty('--k', B.fitSize(text)); if (/\S{11,}/.test(text)) el.classList.add('hy'); }
      el.style.setProperty('--i', p);
      el.style.setProperty('--dc', COLS[(p % n) % COLS.length]);
      if (o.onTap && !free) {
        el.type = 'button';
        el.setAttribute('aria-pressed', o.marked && o.marked[p] ? 'true' : 'false');
        el.addEventListener('click', function () { o.onTap(p, el); });
      }
      if (o.marked && o.marked[p]) el.classList.add('on');
      if (o.hits && o.hits[p]) el.classList.add('hit');
      var dab = document.createElement('span'); dab.className = 'bc-dab'; dab.setAttribute('aria-hidden', 'true');
      var tx = document.createElement('span'); tx.className = 'bc-txt'; tx.textContent = text;
      if (free) { var st = document.createElement('span'); st.className = 'bc-star'; st.setAttribute('aria-hidden', 'true'); st.textContent = '★'; el.append(st); el.setAttribute('aria-label', 'Free space'); }
      el.append(dab, tx);
      grid.append(el);
    });
    card.append(grid);
    return card;
  };
})();
