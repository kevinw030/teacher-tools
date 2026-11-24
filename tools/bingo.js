// Class Bingo (teacher side). Make cards from vocabulary words or math facts, then call them on the
// board, print a class set, or start a class code so students play on their own devices (/join).
// Live play goes through assets/bingo-live.js. Students never sign in and nothing about them is saved:
// names they type exist only on the teacher's open screen while the game runs.
(function () {
  var TT = window.TT, h = TT.h, B = window.Bingo;
  TT.bingoIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="6" cy="6" r="1.6" fill="currentColor"/><circle cx="18" cy="18" r="1.6" fill="currentColor"/></svg>';
  var DEF = { kind: 'words', text: '', listName: '', lists: [], sample: 0, callClue: true, ops: ['mul'], min: 0, max: 10,
    size: 5, free: true, pattern: 'line', copies: 24, speak: false, auto: 0, guided: false };
  var GAME_KEY = 'tt-bingo-game';   // this tab only, so a refresh keeps the game (and class code) going
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hashOf(s) { var x = 0; for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36); }
  function sizeLabel(n) { return n + ' × ' + n; }

  TT.mountBingo = function (el) {
    var S = Object.assign({}, DEF, TT.load('bingo', {}));
    if (!S.text && S.kind === 'words') { S.text = B.SAMPLES[0].text; S.listName = B.SAMPLES[0].name; }
    // A built-in list keeps its current name even if it was renamed since this was saved.
    B.SAMPLES.forEach(function (l) { if (S.text === l.text && !S.lists.some(function (m) { return m.name === S.listName; })) S.listName = l.name; });
    function save() { TT.save('bingo', S); }

    var root = h('div', { class: 'bgo' });
    el.append(root);
    var game = null, conn = null, people = [], claims = [], autoTimer = null, autoStart = 0, sendTimer = null, celebrating = null, liveStatus = 'trying';

    function items() { return S.kind === 'math' ? B.fromFacts(S.ops, S.min, S.max, B.cellsNeeded(S.size, free())) : B.fromWords(S.text, S.callClue); }
    function free() { return S.free && S.size % 2 === 1; }
    function title() {
      if (S.kind === 'math') return S.ops.map(function (o) { return { add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division' }[o]; }).join(' and ') + ' Facts';
      return S.listName || 'Vocabulary';
    }

    // ================= Setup =================
    function stepHead(n, text, sub) {
      return h('div', { class: 'bgo-step-head' }, h('span', { class: 'bgo-num', text: n }), h('div', null, h('h2', { text: text }), sub ? h('p', { text: sub }) : null));
    }
    function seg(options, value, onPick, label) {
      var box = h('div', { class: 'segmented', role: 'group', 'aria-label': label });
      options.forEach(function (o) {
        box.append(h('button', { type: 'button', class: 'seg' + (o[0] === value ? ' on' : ''), 'aria-pressed': o[0] === value ? 'true' : 'false',
          onclick: function () { onPick(o[0]); } }, o[1]));
      });
      return box;
    }
    function stepper(label, value, min, max, onSet) {
      var out = h('output', { class: 'stepper-value', text: value });
      function set(v) { v = Math.max(min, Math.min(max, v)); onSet(v); }
      return h('div', { class: 'bgo-stepper', role: 'group', 'aria-label': label },
        h('span', { class: 'bgo-lab', text: label }),
        h('button', { type: 'button', class: 'btn icon-only', 'aria-label': 'Less', html: TT.icon('minus'), onclick: function () { set(value - 1); } }),
        out,
        h('button', { type: 'button', class: 'btn icon-only', 'aria-label': 'More', html: TT.icon('plus'), onclick: function () { set(value + 1); } }));
    }

    var previewSeed = 1, editing = false;
    function paintSetup() {
      root.textContent = '';
      root.className = 'bgo bgo-setup v2';
      var list = items(), need = B.cellsNeeded(S.size, free()), enough = list.length >= need;

      // ---- Step 1: what goes on the cards ----
      // A gallery of lists to pick from. The chosen list shows a short summary; its words only open up
      // when the teacher asks to edit them, so the page stays tidy.
      var s1 = h('section', { class: 'bgo-step c-violet' }, stepHead(1, 'Pick What Goes on the Cards', 'Choose a ready-made set, use one of your own lists, or make a new one.'));
      var gallery = h('div', { class: 'bgo-gallery', role: 'group', 'aria-label': 'Lists to choose from' });
      function pick(o) {
        var b = h('button', { type: 'button', class: 'bgo-pick c-' + (o.color || 'violet') + (o.on ? ' on' : '') + (o.cls ? ' ' + o.cls : ''), 'aria-pressed': o.on ? 'true' : 'false', onclick: o.onclick },
          h('span', { class: 'bgo-pick-art', 'aria-hidden': 'true' }, o.art ? h('img', { src: o.art, alt: '', draggable: 'false' }) : h('span', { class: 'bgo-pick-glyph', text: o.glyph || '' })),
          h('span', { class: 'bgo-pick-text' }, h('strong', { text: o.name }), h('span', { text: o.meta })),
          o.badge || null,
          o.on ? h('span', { class: 'bgo-pick-check', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' }) : null);
        return b;
      }
      function metaOf(text) {
        var it = B.fromWords(text), pics = it.filter(function (i) { return B.pic(i.card); }).length, clues = it.filter(function (i) { return i.clue; }).length;
        if (pics && pics === it.length) return it.length + ' pictures';
        return it.length + (it.length === 1 ? ' word' : ' words') + (clues ? ' with clues' : '');
      }
      function choose(l) { S.kind = 'words'; S.text = l.text; S.listName = l.name; editing = false; save(); paintSetup(); }
      var isMine = S.kind === 'words' && S.lists.some(function (l) { return l.name === S.listName && l.text === S.text; });
      var isSample = S.kind === 'words' && !isMine && B.SAMPLES.some(function (l) { return l.text === S.text; });
      var isNew = S.kind === 'words' && !isMine && !isSample;
      // Making and changing your own lists is a Plus feature. Free accounts play the ready-made lists and Math Facts.
      var plus = !TT.premium || TT.premium.has(), owner = !!(TT.premium && TT.premium.owner());
      if (!plus && isNew && (!TT.account || !TT.account.known || TT.account.known())) { S.text = B.SAMPLES[0].text; S.listName = B.SAMPLES[0].name; editing = false; isNew = false; isSample = true; list = items(); enough = list.length >= need; }
      B.SAMPLES.forEach(function (l) {
        gallery.append(pick({ name: l.name, meta: metaOf(l.text), art: l.art, glyph: l.glyph, color: l.color, on: isSample && S.text === l.text, onclick: function () { choose(l); } }));
      });
      gallery.append(pick({ name: 'Math Facts', meta: 'Add, subtract, multiply, divide', glyph: '7×8', color: 'cobalt', cls: 'is-math', on: S.kind === 'math', onclick: function () { S.kind = 'math'; editing = false; save(); paintSetup(); } }));
      S.lists.forEach(function (l) {
        gallery.append(pick({ name: l.name, meta: metaOf(l.text) + ' · My List', glyph: '★', color: 'amber', cls: 'is-mine', on: isMine && S.listName === l.name, onclick: function () { choose(l); } }));
      });
      gallery.append(pick({ name: 'Make a New List', meta: 'Type or paste your own words', glyph: '+', color: 'rose', cls: 'is-new' + (plus ? '' : ' pm-locked'), on: isNew,
        badge: !plus ? TT.premium.badge('mini') : owner ? TT.premium.ownerBadge() : null, onclick: function () {
        if (!plus) { TT.premium.open('bingoLists'); return; }
        S.kind = 'words'; S.text = ''; S.listName = ''; editing = true; save(); paintSetup();
        setTimeout(function () { var t = root.querySelector('textarea'); if (t) t.focus(); }, 30);
      } }));
      s1.append(gallery);

      var detail = h('div', { class: 'bgo-detail' });
      s1.append(detail);
      if (S.kind === 'words') {
        if (isNew) editing = true;
        var ta = h('textarea', { rows: 9, class: 'bgo-text', 'aria-label': 'Words, one per line',
          placeholder: 'Type or paste one word per line.\nAdd a clue after a colon if you like:\nhabitat: The natural home of a plant or animal' });
        ta.value = S.text;
        if (!plus) { ta.readOnly = true; ta.classList.add('locked'); }
        var count = h('span', { class: 'bgo-badge', 'aria-live': 'polite' });
        var callBox = h('div', { class: 'bgo-call-what' });
        function recount() {
          var it = B.fromWords(ta.value), clues = it.filter(function (i) { return i.clue; }).length, short = it.length < need;
          count.textContent = short ? (need - it.length) + ' more needed for a ' + sizeLabel(S.size) + ' card' : it.length + (it.length === 1 ? ' word' : ' words') + ' · plenty for a ' + sizeLabel(S.size) + ' card';
          count.classList.toggle('short', short);
          callBox.textContent = '';
          if (clues) callBox.append(h('span', { class: 'bgo-lab', text: 'You Call Out' }),
            seg([[true, 'The Clue'], [false, 'The Word']], !!S.callClue, function (v) { S.callClue = v; save(); paintSetup(); }, 'What to call'),
            h('span', { class: 'bgo-opt-help', text: S.callClue ? 'Students hear the clue and find the word.' : 'Students hear the word and find it.' }));
        }
        var typing;
        ta.addEventListener('input', function () {
          S.text = ta.value; recount(); save();
          clearTimeout(typing); typing = setTimeout(function () { paintPreview(); paintPlay(); paintSummary(); }, 350);
        });
        recount();
        var headName = isNew ? 'Your New List' : (S.listName || 'Vocabulary');
        var editBtn = isNew ? null : TT.button(editing ? 'Done' : plus ? 'See and Edit the Words' : 'See the Words', { kind: editing ? 'small primary' : 'small', icon: editing ? null : 'edit', onclick: function () { editing = !editing; paintSetup(); } });
        detail.append(h('div', { class: 'bgo-detail-head' }, h('div', null, h('h3', { text: headName }), count), editBtn));
        if (editing) {
          var nameIn = h('input', { type: 'text', class: 'bgo-name', maxlength: 40, placeholder: 'List Name, Like “Unit 3 Words”', 'aria-label': 'List name' });
          nameIn.value = isMine ? S.listName : '';
          var mine = isMine ? S.lists.findIndex(function (l) { return l.name === S.listName; }) : -1;
          var saveRow = h('div', { class: 'row bgo-save-row' }, nameIn,
            TT.button(mine >= 0 ? 'Update List' : 'Save to My Lists', { kind: 'small primary', icon: 'download', onclick: function () {
              var name = nameIn.value.trim() || (isMine ? S.listName : '') || 'My Words';
              if (!B.fromWords(ta.value).length) { ta.focus(); return; }
              var at = S.lists.findIndex(function (l) { return l.name === name; });
              var row = { name: name, text: ta.value };
              if (at >= 0) S.lists[at] = row; else S.lists.unshift(row);
              S.listName = name; editing = false; save(); paintSetup(); toast('Saved “' + name + '” to My Lists');
            } }),
            mine >= 0 ? TT.button('Delete', { kind: 'small', icon: 'trash', onclick: function () {
              S.lists.splice(mine, 1); S.text = B.SAMPLES[0].text; S.listName = B.SAMPLES[0].name; editing = false; save(); paintSetup();
            } }) : null);
          if (plus) detail.append(ta, h('p', { class: 'bgo-hint', text: 'One word per line. Add a clue after a colon if you like. Save it to use it again another day.' }), saveRow);
          else detail.append(ta, h('div', { class: 'row bgo-locked-row' }, h('span', { class: 'bgo-hint', text: 'Changing words and making your own lists comes with Plus.' }),
            TT.premium.button('Make Your Own List', 'bingoLists', function () {})));
        } else {
          // A peek at what is in the list.
          var all = B.fromWords(S.text), peek = h('div', { class: 'bgo-peek' });
          all.slice(0, 10).forEach(function (i) { peek.append(h('span', { class: 'bgo-peek-item' }, B.picEl(i.card, 'bgo-peek-pic'), i.card)); });
          if (all.length > 10) peek.append(h('button', { type: 'button', class: 'bgo-peek-more', onclick: function () { editing = true; paintSetup(); } }, '+' + (all.length - 10) + ' More'));
          detail.append(peek);
        }
        detail.append(callBox);
      } else {
        var ops = h('div', { class: 'bgo-ops', role: 'group', 'aria-label': 'Operations' });
        [['add', '+', 'Add'], ['sub', '−', 'Subtract'], ['mul', '×', 'Multiply'], ['div', '÷', 'Divide']].forEach(function (o) {
          var on = S.ops.indexOf(o[0]) >= 0;
          ops.append(h('button', { type: 'button', class: 'bgo-op' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: function () {
            if (on && S.ops.length === 1) return;
            S.ops = on ? S.ops.filter(function (x) { return x !== o[0]; }) : S.ops.concat(o[0]);
            save(); paintSetup();
          } }, h('span', { class: 'bgo-op-sign', 'aria-hidden': 'true', text: o[1] }), h('span', { text: o[2] })));
        });
        var range = h('div', { class: 'row bgo-range' },
          stepper('Numbers From', S.min, 0, 12, function (v) { S.min = Math.min(v, S.max); save(); paintSetup(); }),
          stepper('To', S.max, 1, 12, function (v) { S.max = Math.max(v, S.min); save(); paintSetup(); }));
        var mc = h('span', { class: 'bgo-badge' + (enough ? '' : ' short'), text: list.stretched
          ? 'Enough answers for a ' + sizeLabel(S.size) + ' card'
          : enough ? list.length + ' different answers · plenty for a ' + sizeLabel(S.size) + ' card' : (need - list.length) + ' more answers needed for a ' + sizeLabel(S.size) + ' card' });
        var ex = list.length ? list[Math.floor(list.length / 2)] : null;
        detail.append(h('div', { class: 'bgo-detail-head' }, h('div', null, h('h3', { text: 'Math Facts' }), mc)), ops, range,
          ex ? h('p', { class: 'bgo-hint', text: 'You call a fact like “' + ex.calls[0] + '”, and students look for ' + ex.card + ' on their card.' + (list.stretched ? ' A few facts start with numbers up to ' + list.stretched + ', so every card is different.' : '') }) : null);
      }

      // ---- Step 2: the card ----
      var s2 = h('section', { class: 'bgo-step c-sky' }, stepHead(2, 'Set Up the Card', 'These apply to every card in the game.'));
      function optRow(label, help, control) {
        return h('div', { class: 'bgo-opt' }, h('div', { class: 'bgo-opt-text' }, h('span', { class: 'bgo-lab', text: label }), help ? h('span', { class: 'bgo-opt-help', text: help }) : null), control);
      }
      var opts = h('div', { class: 'bgo-card-opts' },
        optRow('Card Size', B.cellsNeeded(S.size, free()) + ' squares to fill', seg([[3, sizeLabel(3)], [4, sizeLabel(4)], [5, sizeLabel(5)]], S.size, function (v) { S.size = v; save(); paintSetup(); }, 'Card size')),
        S.size % 2 ? optRow('Free Space', 'A free square in the middle', seg([[true, 'On'], [false, 'Off']], !!S.free, function (v) { S.free = v; save(); paintSetup(); }, 'Free space in the middle')) : null,
        optRow('How to Win', { line: 'A full row, column or diagonal', corners: 'All four corner squares', full: 'Every square on the card' }[S.pattern],
          seg(Object.keys(B.PATTERNS).map(function (k) { return [k, B.PATTERNS[k]]; }), S.pattern, function (v) { S.pattern = v; save(); paintSetup(); }, 'How to win')),
        // Guided play: students' cards light up the called answer and say "It's on your card!".
        optRow('Guided Play', S.guided ? 'Cards light up the called answer. Good for younger players.' : 'Students find the answers on their own.',
          seg([[false, 'Off'], [true, 'On']], !!S.guided, function (v) { S.guided = v; save(); paintSetup(); }, 'Guided play')));
      s2.append(opts);

      // ---- Beside the steps: a live sample card ----
      var prevBox = h('div', { class: 'bgo-preview', 'aria-hidden': 'true' });
      var shuffleBtn = TT.button('Show Another', { kind: 'small', icon: 'shuffle', onclick: function () { previewSeed++; paintPreview(); } });
      var summary = h('ul', { class: 'bgo-summary' });
      var side = h('aside', { class: 'bgo-side', 'aria-label': 'Sample card' },
        h('div', { class: 'bgo-side-head' }, h('h2', { text: 'Sample Card' }), shuffleBtn), prevBox, summary);
      function paintSummary() {
        summary.textContent = '';
        [title(), sizeLabel(S.size) + (free() ? ' With a Free Space' : ''), B.PATTERNS[S.pattern] + ' Wins', S.guided ? 'Guided Play On' : null].forEach(function (t) { if (t) summary.append(h('li', { text: t })); });
      }
      function paintPreview() {
        var it = items(); prevBox.textContent = '';
        if (it.length < B.cellsNeeded(S.size, free())) { prevBox.append(h('div', { class: 'bgo-prev-empty', text: 'Add more ' + (S.kind === 'math' ? 'facts' : 'words') + ' to see a card.' })); return; }
        var cells = B.makeCard(it.length, S.size, free(), 'preview' + previewSeed);
        var demo = {}; B.lines(S.size, S.pattern)[0].forEach(function (p) { demo[p] = true; });
        var c = B.cardEl({ cards: it.map(function (i) { return i.card; }), cells: cells, size: S.size, marked: demo });
        prevBox.append(c);
        requestAnimationFrame(function () { B.fitCells(prevBox); });
      }

      // ---- Step 3: how to play ----
      var s3 = h('section', { class: 'bgo-step c-coral' }, stepHead(3, 'How Will You Play?', 'Pick one to start.'));
      var playBox = h('div', { class: 'bgo-play' });
      s3.append(playBox);
      function paintPlay() {
        var it = items(), ok = it.length >= B.cellsNeeded(S.size, free());
        playBox.textContent = '';
        if (!ok) playBox.append(h('p', { class: 'bgo-warn', role: 'status', text: S.kind === 'math'
          ? 'These facts only have ' + it.length + ' different answers. Pick a bigger number range, add another operation, or choose a smaller card.'
          : 'Add at least ' + B.cellsNeeded(S.size, free()) + ' words for a ' + sizeLabel(S.size) + ' card, or choose a smaller card.' }));
        function tile(cls, icon, head, text, onclick, extra) {
          var b = h('button', { type: 'button', class: 'bgo-tile ' + cls, onclick: onclick, disabled: !ok },
            h('span', { class: 'bgo-tile-icon', html: icon }), h('span', { class: 'bgo-tile-text' }, h('strong', { text: head }), h('span', { text: text })), extra || null);
          return b;
        }
        var phone = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/><path d="M9 8.5h6M9 12h6"/></svg>';
        var board = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M9 10.5l2 2 4-4"/></svg>';
        var printer = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><rect x="7" y="14" width="10" height="7" rx="1"/></svg>';
        var liveOk = B.liveReady();
        playBox.append(h('div', { class: 'bgo-tiles' },
          tile('t-live', phone, 'Students Join With a Class Code', liveOk ? 'Each student gets their own card on a Chromebook, tablet or phone. You call from here.' : 'Needs the site’s online features, which aren’t switched on.', function () { if (liveOk) start(true); }, h('span', { class: 'bgo-new', text: 'New!' })),
          tile('t-screen', board, 'Play on This Screen', 'Call from the board while students use printed or paper cards.', function () { start(false); })));
        var copies = S.copies;
        var printRow = h('div', { class: 'bgo-print-row' + (ok ? '' : ' off') },
          h('span', { class: 'bgo-tile-icon', html: printer }),
          h('div', { class: 'bgo-tile-text' }, h('strong', { text: 'Print Cards' }), h('span', { text: 'Every card is different and numbered, so you can check a winner from this screen.' })),
          stepper('Cards', copies, 1, 60, function (v) { S.copies = v; save(); paintPlay(); }),
          TT.button('Print ' + copies + (copies === 1 ? ' Card' : ' Cards'), { kind: 'primary', icon: 'download', onclick: function () { if (ok) printCards(); } }));
        if (!ok) printRow.querySelector('.btn.primary').disabled = true;
        playBox.append(printRow);
      }
      if (again && game && game.live) {
        // Same class, new game: the students wait in the lobby while the teacher picks new settings.
        s3.textContent = '';
        s3.append(stepHead(3, 'Start the New Game'),
          h('div', { class: 'bgo-again' },
            h('p', { class: 'bgo-again-t', text: countText(people.length) + ' waiting in the lobby' }),
            h('p', { class: 'join-help', text: 'Same class code (' + B.showCode(game.code) + '), same students and animals. Pick the words, card size and win rule above, then start.' }),
            h('div', { class: 'row' },
              TT.button('Start New Game', { kind: 'primary big', icon: 'play', onclick: function () { if (items().length >= B.cellsNeeded(S.size, free())) start(true); else toast('Add more words, or pick a smaller card.'); } }),
              TT.button('Close Game', { kind: 'big', icon: 'close', onclick: function () { if (confirmEnd()) endGame(); } }))));
        root.append(s1, s2, side, s3);
        paintPreview(); paintSummary();
        return;
      }
      root.append(s1, s2, side, s3);
      paintPreview(); paintPlay(); paintSummary();
    }

    // ================= Printing =================
    function printCards() {
      var it = items(), seed = B.randomId(), cards = it.map(function (i) { return i.card; });
      S.printed = { seed: seed, key: hashOf(cards.join('|')), size: S.size, free: free(), title: title(), count: S.copies, at: Date.now() };
      save();
      var sheet = h('div', { class: 'bgo-print', 'aria-hidden': 'true' });
      var perPage = S.size === 5 ? 2 : S.size === 4 ? 2 : 4, page = null;
      for (var n = 1; n <= S.copies; n++) {
        if ((n - 1) % perPage === 0) { page = h('div', { class: 'bgo-page per-' + perPage }); sheet.append(page); }
        page.append(B.cardEl({ cards: cards, cells: B.makeCard(cards.length, S.size, free(), seed + ':' + n), size: S.size, title: title(), number: n }));
      }
      // A calling list for the teacher, in case the board isn't handy.
      var callList = h('div', { class: 'bgo-page bgo-calllist' }, h('h2', { text: title() + ': Calling List' }),
        h('p', { text: 'Check off each one as you call it. ' + B.PATTERNS[S.pattern] + ' wins.' }),
        h('ol', null, B.shuffle(it).map(function (i) { return h('li', null, h('span', { class: 'box' }), h('span', { text: i.calls[0] + (i.calls[0] !== i.card ? '  (' + i.card + ')' : '') })); })));
      sheet.append(callList);
      sheet.classList.add('measuring');
      document.body.append(sheet);
      B.fitCells(sheet);
      sheet.classList.remove('measuring');
      document.body.classList.add('bgo-printing');
      function done() { document.body.classList.remove('bgo-printing'); sheet.remove(); window.removeEventListener('afterprint', done); }
      window.addEventListener('afterprint', done);
      setTimeout(function () { window.print(); setTimeout(function () { if (!matchMedia('print').matches) done(); }, 1000); }, 60);
    }

    // ================= Game =================
    function persist() {
      if (!game) { try { sessionStorage.removeItem(GAME_KEY); } catch (e) {} return; }
      try { sessionStorage.setItem(GAME_KEY, JSON.stringify(Object.assign({}, game, { savedAt: Date.now() }))); } catch (e) {}
    }
    function start(live) {
      var it = items();
      // "New Game" after a Bingo: same class code, same students and animals, new settings.
      var keep = again && game && game.live && conn ? game : null;
      again = false; goWinners = [];
      if (keep) live = true;
      game = { g: B.randomId(), items: it, order: B.shuffle(it.map(function (_, i) { return i; })), called: [], last: null, round: 1,
        title: title(), size: S.size, free: free(), pattern: S.pattern, live: !!live, code: keep ? keep.code : live ? B.makeCode() : '', winners: [], reveal: false,
        guided: !!S.guided, phase: live ? 'lobby' : 'play', kicked: keep ? keep.kicked || [] : [], avs: keep ? keep.avs || {} : {} };
      claims = [];
      if (!keep) people = [];
      persist();
      if (live && !keep) goLive();
      paintNow();
      if (keep) { startGame(); return; }
      var pg = root.closest('.page'); if (pg && pg.getBoundingClientRect().top < 0) window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
      if (TT.track) TT.track('bingo', live ? 'live' : 'screen');
    }
    function goLive() {
      if (conn) conn.close();
      liveStatus = 'trying';
      conn = B.connect({
        code: game.code, me: 'host-' + game.g, meta: { host: true },
        on: {
          hello: function (m) { if (m && kickedId(m.id)) conn.send('kick', { id: m.id, g: game.g }); else sendState(); },
          claim: onClaim,
          poke: function (m) { if (!m || kickedId(m.id)) return; if (lobbyRoom) lobbyRoom.poke(m.id); if (gameRoom) gameRoom.poke(m.id); },
          // A student chose an animal. Each animal belongs to one player per game: first come, first served.
          pick: function (m) {
            if (!m || typeof m.id !== 'string' || kickedId(m.id) || !game) return;
            var here = hereNow(); here[m.id] = true;
            if (Lobby.assign(game.avs, here, m.id, Number(m.av))) { persist(); paintPeople(); }
            sendSeats(true);
          }
        },
        onPeople: function (list) {
          people = list.filter(function (p) {
            if (p.host) return false;
            p.name = Lobby.safeName(p.name, game && game.avs && game.avs[p.id] != null ? game.avs[p.id] : p.av);
            if (kickedId(p.id)) { conn.send('kick', { id: p.id, g: game.g }); return false; }
            return true;
          });
          seatPeople();
          paintPeople();
        },
        onStatus: function (s) { liveStatus = s; paintStatus(); },
        onLive: function () { sendState(); }
      });
    }
    // Every player keeps a different animal. Earlier joiners keep theirs when two want the same one.
    function hereNow() { var here = {}; people.forEach(function (p) { here[p.id] = true; }); return here; }
    function seatPeople() {
      if (!game) return;
      game.avs = game.avs || {};
      var here = hereNow(), changed = false;
      people.slice().sort(function (a, b) { return (a.at || 0) - (b.at || 0); }).forEach(function (p) {
        var want = game.avs[p.id] != null ? game.avs[p.id] : Number(p.av);
        if (Lobby.assign(game.avs, here, p.id, want)) changed = true;
      });
      if (changed) persist();
      sendSeats();
    }
    var seatTimer = null;
    function sendSeats(now) {
      clearTimeout(seatTimer);
      seatTimer = setTimeout(function () { if (conn && game) conn.send('avs', { g: game.g, map: Lobby.seated(game.avs || {}, hereNow()) }); }, now ? 0 : 150);
    }
    function stateMsg() {
      return { g: game.g, phase: game.phase || 'play', round: game.round, title: game.title, size: game.size, free: game.free, pattern: game.pattern,
        cards: game.items.map(function (i) { return i.card; }), called: game.called,
        last: game.last ? { i: game.last.i, text: game.last.text, n: game.called.length } : null, winners: game.winners, guided: !!game.guided, avs: Lobby.seated(game.avs || {}, hereNow()) };
    }
    function sendState() {
      if (!conn || !game) return;
      clearTimeout(sendTimer);
      sendTimer = setTimeout(function () { if (conn && game) conn.send('state', stateMsg()); }, 120);
    }

    function callNext() {
      if (!game || celebrating || counting || game.phase === 'lobby') return;
      var left = game.order.filter(function (i) { return game.called.indexOf(i) < 0; });
      if (!left.length) { stopAuto(); return; }
      var i = left[0], item = game.items[i];
      var text = item.calls[Math.floor(Math.random() * item.calls.length)];
      game.called.push(i);
      game.last = { i: i, text: text };
      game.reveal = false;
      persist(); sendState();
      if (game.called.length === 1 && game.live && !game.bigCode) { paintGame(); paintCall(true); paintBoard(i); }
      paintCall(true); paintBoard(i); paintCounts();
      if (S.speak) say(text);
      if (TT.tick) TT.tick();
      if (S.auto) restartAuto();
    }
    function say(text) {
      try {
        if (!window.speechSynthesis) return;
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(B.spoken(text)); u.rate = 0.9; speechSynthesis.speak(u);
      } catch (e) {}
    }
    function stopAuto() { clearInterval(autoTimer); autoTimer = null; var bar = root.querySelector('.bgo-auto-bar'); if (bar) bar.style.setProperty('--p', 0); }
    function restartAuto() {
      stopAuto();
      if (!S.auto || !game) return;
      autoStart = Date.now();
      autoTimer = setInterval(function () {
        var p = (Date.now() - autoStart) / (S.auto * 1000), bar = root.querySelector('.bgo-auto-bar');
        if (bar) bar.style.setProperty('--p', Math.min(1, p));
        if (p >= 1 && !celebrating) callNext();
      }, 100);
    }
    function newRound() {
      game.round++; game.called = []; game.last = null; game.winners = []; game.reveal = false; goWinners = [];
      game.order = B.shuffle(game.items.map(function (_, i) { return i; }));
      claims = [];
      stopAuto();
      if (game.live && window.Lobby) {
        // Everyone counts down together, then the fresh cards deal in.
        game.phase = 'play'; persist();
        countIn('Round ' + game.round, function () { sendState(); paintGame(); });
        return;
      }
      persist(); sendState(); paintGame();
      toast('New round! Clear your cards.');
    }
    // 3, 2, 1, Go on the board and on every student's screen at the same moment.
    var counting = null;
    function countIn(title, done) {
      if (counting) return;
      if (conn) conn.send('countdown', { g: game.g, round: game.round, title: title });
      counting = Lobby.countdown({ title: title, done: function () { counting = null; done(); } });
    }
    var again = false, goWinners = [];
    // After a Bingo: back to the settings with the same class in the lobby.
    function newGame() {
      if (!game || !game.live) { endGame(); return; }
      stopAuto();
      game.phase = 'lobby'; game.called = []; game.last = null; game.winners = []; game.reveal = false;
      claims = []; goWinners = [];
      persist(); sendState();
      again = true; lobbyRoom = null; gameRoom = null;
      paintSetup();
      window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
    }
    function startGame() {
      if (!game || game.phase !== 'lobby') return;
      game.phase = 'play'; persist();
      countIn(game.title, function () { sendState(); paintGame(); });
    }
    function kickedId(id) { return !!(game && game.kicked && game.kicked.indexOf(id) >= 0); }
    // Remove a player (for an unkind nickname). They see a message and can join again with a new name.
    var kickPop = null;
    function askKick(p, node) {
      if (kickPop) kickPop.remove();
      var r = node.getBoundingClientRect();
      kickPop = h('div', { class: 'lb-kick', role: 'dialog', 'aria-label': 'Remove ' + p.name },
        h('p', { text: 'Remove ' + (p.name || 'this player') + '?' }),
        h('div', { class: 'row' },
          TT.button('Cancel', { kind: 'small', onclick: function () { kickPop.remove(); kickPop = null; } }),
          TT.button('Remove', { kind: 'small lb-remove', onclick: function () {
            game.kicked = (game.kicked || []).concat(p.id); persist();
            conn.send('kick', { id: p.id, g: game.g });
            people = people.filter(function (x) { return x.id !== p.id; }); sendSeats(true);
            paintPeople(); kickPop.remove(); kickPop = null;
            toast((p.name || 'The player') + ' was removed.');
          } })));
      kickPop.style.left = Math.max(8, Math.min(window.innerWidth - 230, r.left + r.width / 2 - 110)) + 'px';
      kickPop.style.top = Math.min(window.innerHeight - 120, r.bottom + 8) + 'px';
      document.body.append(kickPop);
      setTimeout(function () { var b = kickPop && kickPop.querySelector('.lb-remove'); if (b) b.focus(); }, 30);
    }
    document.addEventListener('pointerdown', function (e) { if (kickPop && !kickPop.contains(e.target)) { kickPop.remove(); kickPop = null; } });
    function paintNow() { if (game.live && game.phase === 'lobby') paintLobby(); else paintGame(); }

    // ---- The lobby: the code, and everyone who has joined ----
    var lobbyRoom = null, lobbyCount = null, startBtn = null;
    function paintLobby() {
      root.textContent = '';
      root.className = 'bgo bgo-lobby';
      peopleEl = null; claimsEl = null; callEl = null; boardEl = null; countEl = null;
      var head = h('div', { class: 'bgo-game-head' },
        h('div', { class: 'bgo-game-title' }, h('span', { class: 'bgo-chip-title', text: game.title }),
          h('span', { class: 'bgo-rule', text: sizeLabel(game.size) + ' Cards' }),
          h('span', { class: 'bgo-rule', text: B.PATTERNS[game.pattern] + ' Wins' })),
        h('div', { class: 'row' }, TT.button('End Game', { kind: 'small', icon: 'close', onclick: function () { if (confirmEnd()) endGame(); } })));
      lobbyRoom = Lobby.room({ empty: 'No one yet. As students join, they pop in here.', onTap: askKick });
      lobbyCount = h('span', { class: 'lb-wait-count', 'aria-live': 'polite' });
      startBtn = h('button', { type: 'button', class: 'btn big lb-start', onclick: startGame, html: TT.icon('play') + '<span>Start Game</span>' });
      var wait = h('section', { class: 'lb-wait' },
        h('div', { class: 'lb-wait-head' }, h('h2', { text: 'Waiting Room' }), lobbyCount, statusEl = h('span', { class: 'bgo-status' })),
        lobbyRoom.el,
        h('p', { class: 'lb-tip', text: 'Tap a player to remove them. Students can still join after the game starts.' }),
        startBtn);
      root.append(head, h('div', { class: 'lb-host' }, joinCard(true), wait));
      paintPeople(); paintStatus();
      if (TT.fitRefresh) TT.fitRefresh();
    }
    function endGame() {
      stopAuto();
      if (conn) { conn.send('end', { g: game && game.g }); var c = conn; setTimeout(function () { c.close(); }, 600); conn = null; }
      game = null; claims = []; people = []; again = false; goWinners = [];
      persist();
      if (celebrating) { celebrating.remove(); celebrating = null; }
      if (counting) { counting.cancel(); counting = null; }
      if (kickPop) { kickPop.remove(); kickPop = null; }
      lobbyRoom = null; gameRoom = null;
      paintSetup();
    }

    // ---- Checking a bingo ----
    function check(cells, marks) {
      var calledSet = {}; game.called.forEach(function (i) { calledSet[i] = true; });
      var good = cells.map(function (c, p) { return c === -1 || (marks[p] && calledSet[c]); });
      var wrong = []; cells.forEach(function (c, p) { if (marks[p] && c !== -1 && !calledSet[c]) wrong.push(p); });
      return { line: B.winLine(good, game.size, game.pattern), wrong: wrong, hits: cells.map(function (c) { return c === -1 || !!calledSet[c]; }) };
    }
    function onClaim(m) {
      if (!game || !m || m.g !== game.g || m.round !== game.round || typeof m.id !== 'string' || kickedId(m.id)) return;
      var who = people.filter(function (p) { return p.id === m.id; })[0];
      var name = who ? who.name : Lobby.safeName(m.name, m.av);
      var cells = B.makeCard(game.items.length, game.size, game.free, m.id + ':' + game.g + ':' + game.round);
      var marks = cells.map(function (_, p) { return Array.isArray(m.marks) && m.marks.indexOf(p) >= 0; });
      var r = check(cells, marks), ok = !!r.line;
      var already = claims.some(function (c) { return c.id === m.id && c.ok; });
      if (ok && !already) game.winners.push(name);
      claims.unshift({ id: m.id, name: name, ok: ok, at: Date.now() });
      claims = claims.slice(0, 30);
      conn.send('verdict', { to: m.id, g: game.g, round: game.round, ok: ok, line: r.line, wrong: r.wrong, name: name });
      persist(); sendState(); paintClaims();
      if (ok && !already) celebrate(name, r.line);
      else if (!ok) toast(name + ' called Bingo, but not yet!');
    }

    function winnerAv(name) {
      var p = people.filter(function (x) { return x.name === name; })[0];
      return p ? (game.avs && game.avs[p.id] != null ? game.avs[p.id] : p.av) : null;
    }
    // Bingo! Everyone who gets it before the teacher picks Keep Going or New Game shows up together.
    function celebrate(name, line) {
      stopAuto();
      if (goWinners.indexOf(name) >= 0) return;
      goWinners.push(name);
      if (TT.chime) TT.chime();
      if (S.speak) say(name + ' has Bingo!');
      if (celebrating && celebrating.isConnected && celebrating.addWinner) { celebrating.addWinner(name); return; }
      if (celebrating) celebrating.remove();
      var conf = h('div', { class: 'bgo-confetti', 'aria-hidden': 'true' });
      if (!still) for (var i = 0; i < 70; i++) {
        var bit = h('i'); bit.style.setProperty('--x', Math.random() * 100 + '%'); bit.style.setProperty('--d', (Math.random() * 0.9) + 's');
        bit.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); bit.style.setProperty('--c', B.COLS[i % 5]); bit.style.setProperty('--s', (0.6 + Math.random() * 0.8));
        conf.append(bit);
      }
      var mas = TT.mascot ? TT.mascot({ mood: 'party' }) : null;
      var list = h('div', { class: 'bgo-winners', role: 'list', 'aria-live': 'polite' });
      var head = h('h2', { class: 'bgo-winners-t' });
      function addWinner(n) {
        var av = game.live ? winnerAv(n) : null;
        list.append(h('div', { class: 'bgo-winner', role: 'listitem' },
          av != null ? h('span', { class: 'bgo-win-ava', style: '--ac:' + Lobby.avatar(av).c, 'aria-hidden': 'true' }, Lobby.img(av)) : h('span', { class: 'bgo-win-star', 'aria-hidden': 'true', text: '⭐' }),
          h('span', { class: 'bgo-winner-n', text: n })));
        list.classList.toggle('many', goWinners.length > 1);
        head.textContent = goWinners.length === 1 ? n + (game.live ? ' Has Bingo!' : '') : goWinners.length + ' Bingos!';
      }
      var keep = TT.button('Keep Going', { kind: 'big', icon: 'play', onclick: function () { close(); } });
      var fresh = TT.button('New Game', { kind: 'primary big', icon: 'shuffle', onclick: function () { close(true); if (game && game.live) newGame(); else endGame(); } });
      var shut = TT.button(game.live ? 'Close Game' : 'Back to Setup', { kind: 'small', icon: 'close', onclick: function () { if (!game.live || confirmEnd()) { close(true); endGame(); } } });
      celebrating = h('div', { class: 'bgo-win', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Bingo!' }, conf,
        h('div', { class: 'bgo-win-card' },
          mas ? h('div', { class: 'bgo-win-mascot' }, mas) : null,
          h('p', { class: 'bgo-win-kicker', text: 'Bingo!' }),
          head, list,
          h('p', { class: 'bgo-win-ask', text: game.live ? 'Keep going with the same cards, or start a new game with this class?' : 'Keep going with the same cards, or set up a new game?' }),
          h('div', { class: 'row center' }, keep, fresh),
          h('div', { class: 'row center' }, shut)));
      celebrating.addWinner = addWinner;
      addWinner(name);
      // Keep Going: same cards, calling picks up again until the next Bingo.
      function close(quiet) {
        if (!celebrating) return; var c = celebrating; celebrating = null; goWinners = [];
        c.classList.add('out'); setTimeout(function () { c.remove(); }, 300);
        if (!quiet && S.auto) restartAuto();
      }
      celebrating.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
      (root.closest('.page') || document.body).append(celebrating);
      setTimeout(function () { keep.focus(); }, 50);
    }

    // ---- Game screen ----
    var callEl, boardEl, countEl, peopleEl, claimsEl, statusEl;
    function paintGame() {
      root.textContent = '';
      root.className = 'bgo bgo-game' + (game.live ? ' is-live' : '');
      var head = h('div', { class: 'bgo-game-head' },
        h('div', { class: 'bgo-game-title' }, h('span', { class: 'bgo-chip-title', text: game.title }),
          countEl = h('span', { class: 'bgo-progress' }),
          h('span', { class: 'bgo-rule', text: B.PATTERNS[game.pattern] + ' Wins' })),
        h('div', { class: 'row' },
          TT.button('New Round', { kind: 'small', icon: 'shuffle', onclick: newRound }),
          TT.button(game.live ? 'End Game' : 'Back to Setup', { kind: 'small', icon: game.live ? 'close' : 'back', onclick: function () {
            if (game.live && !confirmEnd()) return;
            endGame();
          } })));
      root.append(head);

      var main = h('div', { class: 'bgo-main' });
      // Left: the live join card (class code) and the caller
      var left = h('div', { class: 'bgo-left' });
      if (game.live) left.append(joinCard());
      callEl = h('div', { class: 'bgo-call', 'aria-live': 'polite' });
      var next = h('button', { type: 'button', class: 'btn primary big bgo-next', onclick: callNext }, h('span', { text: 'Call Next' }), h('kbd', { text: 'Space' }));
      var speak = h('button', { type: 'button', class: 'btn bgo-speak' + (S.speak ? ' on' : ''), 'aria-pressed': S.speak ? 'true' : 'false',
        html: TT.icon(S.speak ? 'volume' : 'mute') + '<span>Read Aloud</span>',
        onclick: function () { S.speak = !S.speak; save(); if (S.speak && game.last) say(game.last.text); paintGame(); } });
      var auto = h('div', { class: 'bgo-auto' }, h('span', { class: 'bgo-lab', text: 'Auto Call' }),
        seg([[0, 'Off'], [10, '10s'], [20, '20s'], [30, '30s']], S.auto, function (v) { S.auto = v; save(); paintGame(); if (v && game.last) restartAuto(); else if (!v) stopAuto(); }, 'Auto call'));
      left.append(h('div', { class: 'bgo-stage' }, callEl, h('div', { class: 'bgo-auto-bar', 'aria-hidden': 'true' }),
        h('div', { class: 'bgo-controls' }, next, speak, auto)));
      // Right: everything called so far, and live players and bingo calls
      var right = h('div', { class: 'bgo-right' });
      boardEl = h('div', { class: 'bgo-board' });
      right.append(h('section', { class: 'bgo-side' }, h('h3', { text: 'Called So Far' }), boardEl));
      if (game.live) {
        peopleEl = h('div', { class: 'bgo-people' });
        claimsEl = h('div', { class: 'bgo-claims', 'aria-live': 'polite' });
        right.append(h('section', { class: 'bgo-side' }, h('h3', null, 'Players ', statusEl = h('span', { class: 'bgo-status' })), peopleEl));
        right.append(h('section', { class: 'bgo-side' }, h('h3', { text: 'Bingo Calls' }), claimsEl));
      } else right.append(paperCheck());
      main.append(left, right);
      root.append(main);
      paintCall(false); paintBoard(); paintCounts(); paintPeople(); paintClaims(); paintStatus();
      if (S.auto && game.last) restartAuto();
      if (TT.fitRefresh) TT.fitRefresh();
    }
    function confirmEnd() { return window.confirm ? window.confirm('End this game? Students will see that class is over.') : true; }

    function joinCard(big) {
      var host = location.host.replace(/^www\./, '') || 'edsidekick.com';
      var url = location.origin + '/join?code=' + game.code;
      var qr = h('div', { class: 'bgo-qr', 'aria-hidden': 'true' });
      loadQR().then(function () {
        try { var q = window.qrcode(0, 'M'); q.addData(url); q.make(); qr.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) {}
      }, function () {});
      var card = h('section', { class: 'bgo-join' + (!big && game.called.length && !game.bigCode ? ' compact' : '') },
        // Three big numbered steps a first grader can follow from across the room.
        h('ol', { class: 'bgo-join-text bgo-steps' },
          h('li', { class: 'bgo-st' }, h('span', { class: 'bgo-st-n', 'aria-hidden': 'true', text: '1' }),
            h('span', { class: 'bgo-st-body' }, h('span', { class: 'bgo-join-step', text: 'Open the internet and type' }),
              h('span', { class: 'bgo-join-url', text: host + '/join' }))),
          h('li', { class: 'bgo-st' }, h('span', { class: 'bgo-st-n', 'aria-hidden': 'true', text: '2' }),
            h('span', { class: 'bgo-st-body' }, h('span', { class: 'bgo-join-step', text: 'Type this code' }),
              h('span', { class: 'bgo-code', 'aria-label': 'Class code ' + game.code.split('').join(' ') },
                game.code.split('').map(function (ch, i) { return h('span', { class: 'bgo-code-ch', style: '--i:' + i, text: ch }); })))),
          h('li', { class: 'bgo-st bgo-st-3' }, h('span', { class: 'bgo-st-n', 'aria-hidden': 'true', text: '3' }),
            h('span', { class: 'bgo-st-body' }, h('span', { class: 'bgo-join-step', text: 'Then' }),
              h('span', { class: 'bgo-st-go', text: 'Press the big pink Join button!' })))),
        h('div', { class: 'bgo-qr-box' }, qr, h('span', { class: 'bgo-qr-t', text: 'Or scan with a camera' })));
      var size = TT.button(card.classList.contains('compact') ? 'Show the Code Big' : 'Make the Code Smaller', { kind: 'small bgo-join-size', icon: card.classList.contains('compact') ? 'expand' : 'shrink', onclick: function () {
        game.bigCode = card.classList.contains('compact'); persist(); paintGame();
      } });
      return big ? card : h('div', { class: 'bgo-join-wrap' }, card, size);
    }
    var qrLoading = null;
    function loadQR() {
      if (window.qrcode) return Promise.resolve();
      if (qrLoading) return qrLoading;
      qrLoading = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/assets/qrcode.js?v=1'; s.onload = ok; s.onerror = no; document.head.append(s); });
      return qrLoading;
    }

    function paintCall(fresh) {
      if (!callEl) return;
      callEl.textContent = '';
      if (!game.last) {
        callEl.append(h('div', { class: 'bgo-call-empty' }, h('p', { class: 'bgo-call-kicker', text: game.live ? 'Waiting for players? Start whenever you’re ready.' : 'Ready When You Are' }),
          h('p', { class: 'bgo-call-big', text: 'Press Call Next' })));
        return;
      }
      var item = game.items[game.last.i], clue = game.last.text !== item.card, short = game.last.text.length <= 14;
      var card = h('div', { class: 'bgo-call-card' + (fresh && !still ? ' pop' : '') + ' ' + (short ? 'is-word' : 'is-clue') },
        h('p', { class: 'bgo-call-kicker', text: 'Call ' + game.called.length }),
        h('p', { class: 'bgo-call-big' + (game.last.text.length > 60 ? ' long' : ''), text: game.last.text }));
      // Picture words: the call shows the picture (with a clue call, only once the answer is shown).
      var callPic = (!clue || game.reveal) ? B.picEl(item.card, 'bgo-call-pic') : null;
      if (callPic) { card.classList.add('has-pic'); card.insertBefore(callPic, card.children[1]); }
      if (clue) {
        var ans = h('p', { class: 'bgo-answer' + (game.reveal ? ' shown' : ''), text: game.reveal ? item.card : '' });
        card.append(h('div', { class: 'bgo-reveal-row' },
          TT.button(game.reveal ? 'Hide Answer' : 'Show Answer', { kind: 'small', onclick: function () { game.reveal = !game.reveal; persist(); paintCall(false); } }), ans));
      }
      // Live game: how many players have it, and their animals hop.
      if (game.live && people.length) {
        var has = whoHas(game.last.i);
        card.append(h('p', { class: 'bgo-have' + (has.length ? '' : ' none') }, has.length ? '🎯 ' + has.length + (has.length === 1 ? ' player has it!' : ' players have it!') : 'Nobody has this one!'));
        if (fresh && gameRoom) has.forEach(function (id, k) { setTimeout(function () { if (gameRoom) gameRoom.poke(id); }, 250 + k * 70); });
      }
      callEl.append(card);
    }
    function whoHas(i) {
      var n = game.items.length;
      return people.filter(function (p) { return B.makeCard(n, game.size, game.free, p.id + ':' + game.g + ':' + game.round).indexOf(i) >= 0; }).map(function (p) { return p.id; });
    }
    function paintBoard(fresh) {
      if (!boardEl) return;
      boardEl.textContent = '';
      var order = {}; game.called.forEach(function (i, n) { order[i] = n + 1; });
      var idx = game.items.map(function (_, i) { return i; });
      if (S.kind !== 'math') idx.sort(function (a, b) { return game.items[a].card.localeCompare(game.items[b].card); });
      idx.forEach(function (i) {
        var on = !!order[i];
        boardEl.append(h('span', { class: 'bgo-cell' + (on ? ' on' : '') + (fresh === i ? ' fresh' : ''), title: on ? 'Called #' + order[i] : 'Not called yet' },
          on ? h('i', { text: order[i] }) : null, B.picEl(game.items[i].card, 'bgo-cell-pic'), game.items[i].card));
      });
    }
    function paintCounts() {
      if (!countEl) return;
      countEl.textContent = game.called.length + ' of ' + game.items.length + ' Called';
      var next = root.querySelector('.bgo-next');
      if (next) {
        var done = game.called.length >= game.items.length;
        next.disabled = done;
        next.querySelector('span').textContent = done ? 'All Called' : game.called.length ? 'Call Next' : 'Start Calling';
      }
    }
    var gameRoom = null;
    function countText(n) { return n + (n === 1 ? ' Player' : ' Players'); }
    function paintPeople() {
      var list = people.map(function (p) { return { id: p.id, name: String(p.name || 'Player').slice(0, 20), av: game && game.avs && game.avs[p.id] != null ? game.avs[p.id] : p.av, at: p.at }; });
      if (lobbyRoom && game && game.phase === 'lobby' && lobbyRoom.el.isConnected) {
        lobbyRoom.update(list);
        var was = lobbyCount.textContent;
        lobbyCount.innerHTML = '<span class="n">' + list.length + '</span> ' + (list.length === 1 ? 'Player' : 'Players');
        if (was && was !== lobbyCount.textContent && !still) lobbyCount.firstChild.classList.add('bump');
        startBtn.classList.toggle('ready', list.length > 0);
        return;
      }
      if (!peopleEl) return;
      if (!gameRoom || !peopleEl.contains(gameRoom.el)) {
        peopleEl.textContent = '';
        peopleEl.append(h('p', { class: 'bgo-people-count' }));
        gameRoom = Lobby.room({ small: true, empty: 'No one yet. Students join at the address on the left.', onTap: askKick });
        peopleEl.append(gameRoom.el);
      }
      peopleEl.firstChild.textContent = list.length ? countText(list.length) : '';
      gameRoom.update(list);
    }
    function paintClaims() {
      if (!claimsEl) return;
      claimsEl.textContent = '';
      if (!claims.length) { claimsEl.append(h('p', { class: 'bgo-empty', text: 'When a student presses Bingo, their card is checked here automatically.' })); return; }
      claims.slice(0, 8).forEach(function (c) {
        claimsEl.append(h('div', { class: 'bgo-claim ' + (c.ok ? 'ok' : 'no') },
          h('span', { class: 'bgo-claim-mark', 'aria-hidden': 'true', text: c.ok ? '★' : '…' }),
          h('strong', { text: c.name }), h('span', { text: c.ok ? 'Bingo! Card checked.' : 'Not yet. Told them to keep going.' })));
      });
    }
    function paintStatus() {
      if (!statusEl) return;
      statusEl.className = 'bgo-status s-' + liveStatus;
      statusEl.textContent = liveStatus === 'live' ? 'Live' : liveStatus === 'off' ? 'Offline, Retrying' : 'Connecting';
    }

    // ---- Checking a printed card by its number ----
    function paperCheck() {
      var P = S.printed, cards = game.items.map(function (i) { return i.card; });
      var sec = h('section', { class: 'bgo-side bgo-paper' }, h('h3', { text: 'Check a Printed Card' }));
      if (!P || P.key !== hashOf(cards.join('|')) || P.size !== game.size || P.free !== game.free) {
        sec.append(h('p', { class: 'bgo-empty', text: 'Print cards from the setup page with these same words, and you can type a card’s number here to check a Bingo.' }));
        return sec;
      }
      var input = h('input', { type: 'text', inputmode: 'numeric', class: 'bgo-card-no', placeholder: 'Card #', 'aria-label': 'Card number', maxlength: 3 });
      var out = h('div', { class: 'bgo-check-out', 'aria-live': 'polite' });
      function go(e) {
        if (e) e.preventDefault();
        var n = parseInt(input.value, 10); out.textContent = '';
        if (!(n >= 1 && n <= (P.count || 60))) { out.append(h('p', { class: 'bgo-empty', text: 'Type a card number from 1 to ' + (P.count || 60) + '.' })); return; }
        var cells = B.makeCard(cards.length, game.size, game.free, P.seed + ':' + n);
        var r = check(cells, cells.map(function () { return true; }));
        var hits = r.hits, line = r.line ? r.line : null, marked = {};
        if (line) line.forEach(function (p) { marked[p] = true; });
        out.append(h('p', { class: 'bgo-verdict ' + (line ? 'ok' : 'no'), text: line ? 'Card ' + n + ' has Bingo!' : 'Card ' + n + ' is ' + B.toGo(hits, game.size, game.pattern) + ' away.' }),
          B.cardEl({ cards: cards, cells: cells, size: game.size, hits: hits, marked: marked, number: n }));
        requestAnimationFrame(function () { B.fitCells(out); });
        if (line) celebrate('Card ' + n, line);
      }
      sec.append(h('form', { class: 'row', onsubmit: go }, input, TT.button('Check', { kind: 'primary small' })), out);
      sec.querySelector('form .btn').type = 'submit';
      return sec;
    }

    // ---- Small message that pops up and fades ----
    function toast(text) {
      var t = h('div', { class: 'bgo-toast', role: 'status', text: text });
      (root.closest('.page') || document.body).append(t);
      setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 2600);
    }

    // Space, Enter or the right arrow calls the next one (unless you're typing).
    document.addEventListener('keydown', function (e) {
      if (!game || celebrating || counting || game.phase === 'lobby' || TT.page() !== 'bingo' || e.repeat) return;
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      if ((e.key === ' ' || e.key === 'Enter') && tag === 'BUTTON' && t !== root.querySelector('.bgo-next')) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); callNext(); }
    });

    // Games don't carry over: leaving this page ends the game (Lobby.endOnLeave), so a visit always starts fresh.
    try { sessionStorage.removeItem(GAME_KEY); } catch (e) {}
    paintSetup();
    Lobby.endOnLeave({ page: 'bingo', active: function () { return !!game; }, players: function () { return game && game.live ? people.length : 0; }, end: endGame });

    return {
      show: function () { if (!game) paintSetup(); },
      hide: function () { stopAuto(); }
    };
  };

  // Class Bingo also has a card on the Games page.
  setTimeout(function () {
  var list = document.getElementById('gamesList');
  if (list) {
    var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
    list.append(h('a', { class: 'tool c-rose', href: '/bingo' },
      h('span', { class: 'tool-icon', html: TT.bingoIcon }),
      h('h3', { text: 'Class Bingo' }), h('p', { text: 'Cards from your vocabulary words or math facts. Students can join with a class code.' }),
      h('span', { class: 'go', html: 'Play ' + arrow })));
  }
  }, 0);
})();
