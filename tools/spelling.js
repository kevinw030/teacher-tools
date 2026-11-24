// Spelling Practice (Kevin, 2026-11-24): the teacher types the week's spelling words once, and the class plays
// quick whole-class spelling games with them on the board. The word lists save to the account (tt:spelling).
// Four games, all on the shared game stage look (assets/arcade.css) with the mascot as the host:
//   Hear and Spell   the mascot reads the word (and a sentence), the class writes it, then the word is shown
//   Unscramble       tap the mixed-up letters in the right order
//   Missing Letters  tap the letters that fill the blanks
//   Quick Look       the word shows for a few seconds, hides, then the class types it from memory
// Whole Class or Two Teams. Styles: assets/spelling.css.
(function () {
  var TT = window.TT, h = TT.h;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAX_LISTS = 30, MAX_WORDS = 40;
  var SAMPLE = 'because - I stayed inside because it was raining.\nfriend - My friend sat next to me at lunch.\npeople\nagain\nabout\nwould\ncould\nthere\nwhere\nlittle';
  var TEAMS = [{ name: 'Blue Team', color: '#2F6BFF' }, { name: 'Orange Team', color: '#FF7A3D' }];
  function any(a) { return a[Math.floor(Math.random() * a.length)]; }
  function fx(name) { if (TT.fx && TT.fx.sound) TT.fx.sound(name); else if (name === 'good' || name === 'win') TT.chime(); }
  function svg(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  var SPEAKER = svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.500 8.500 0 0 1 0 12"/>');

  var GAMES = [
    { id: 'listen', title: 'Hear and Spell', tint: 'sky', desc: 'Ed reads the word out loud. Everyone writes it, then see if you got it.',
      icon: svg('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.500 8.500 0 0 1 0 12"/>') },
    { id: 'scramble', title: 'Unscramble', tint: 'coral', desc: 'The letters are all mixed up. Tap them in the right order.',
      icon: svg('<rect x="3" y="4" width="7" height="7" rx="2"/><rect x="14" y="13" width="7" height="7" rx="2"/><path d="M14 7h3a3 3 0 0 1 3 3M10 17H7a3 3 0 0 1-3-3"/><path d="m18 8 2 2 2-2M6 16l-2-2-2 2"/>') },
    { id: 'missing', title: 'Missing Letters', tint: 'emerald', desc: 'Some letters fell out. Tap the ones that fill the blanks.',
      icon: svg('<rect x="2" y="7" width="6" height="10" rx="1.6"/><rect x="9" y="7" width="6" height="10" rx="1.6" stroke-dasharray="2.4 2.200"/><rect x="16" y="7" width="6" height="10" rx="1.6"/>') },
    { id: 'flash', title: 'Quick Look', tint: 'violet', desc: 'The word shows for a few seconds, then hides. Spell it from memory.',
      icon: svg('<path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>') }
  ];

  // ---------- Words ----------
  // One word per line. A sentence for Hear and Spell can follow a dash: "friend - My friend sat with me."
  function parse(text) {
    var out = [], seen = {};
    String(text || '').split('\n').forEach(function (line) {
      var m = line.split(/\s+[-–—:]\s+|\s*\|\s*/);
      var w = (m[0] || '').replace(/[^A-Za-z' \-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 24);
      var s = m.slice(1).join(' - ').trim().slice(0, 160);
      if (w.replace(/[^A-Za-z]/g, '').length < 2 || seen[w.toLowerCase()]) return;
      seen[w.toLowerCase()] = 1;
      out.push({ w: w, s: s });
    });
    return out.slice(0, MAX_WORDS);
  }
  function isLetter(c) { return /[A-Za-z]/.test(c); }
  function same(a, b) { return String(a).toLowerCase() === String(b).toLowerCase(); }

  // ---------- Talking ----------
  var voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = speechSynthesis.getVoices().filter(function (v) { return /^en[-_]US/i.test(v.lang); });
    if (!vs.length) vs = speechSynthesis.getVoices().filter(function (v) { return /^en/i.test(v.lang); });
    voice = vs.filter(function (v) { return /natural/i.test(v.name); })[0] || vs.filter(function (v) { return /Google US|Samantha|Aria|Jenny|Zira/i.test(v.name); })[0] || vs[0] || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice); }
  function canTalk() { return !!(window.speechSynthesis && window.SpeechSynthesisUtterance); }
  function talk(parts, onstart, onend) {
    if (!canTalk()) return false;
    speechSynthesis.cancel();
    parts.forEach(function (p, i) {
      var u = new SpeechSynthesisUtterance(p);
      u.rate = 0.82; u.pitch = 1.05; u.lang = 'en-US';
      if (voice) u.voice = voice;
      if (i === 0 && onstart) u.onstart = onstart;
      if (i === parts.length - 1 && onend) { u.onend = onend; u.onerror = onend; }
      speechSynthesis.speak(u);
    });
    return true;
  }
  function hush() { if (canTalk()) speechSynthesis.cancel(); }

  // ====================================================================================
  TT.mountSpelling = function (el) {
    var state = TT.load('spelling', null) || {};
    if (!Array.isArray(state.lists) || !state.lists.length) state.lists = [{ id: 'l' + Date.now(), name: 'Sample Words', text: SAMPLE }];
    if (!state.lists.some(function (l) { return l.id === state.cur; })) state.cur = state.lists[0].id;
    state.teams = !!state.teams;
    function save() { TT.save('spelling', state); }
    function cur() { return state.lists.filter(function (l) { return l.id === state.cur; })[0]; }
    var view = h('div', { class: 'sp' });
    el.append(view);
    var game = null;   // the game being played (null on the setup screen)

    // ---------- Setup: the word list and the games ----------
    function setup() {
      stopGame();
      view.textContent = '';
      var list = cur();
      var chips = h('div', { class: 'sp-lists', role: 'group', 'aria-label': 'Your word lists' });
      state.lists.forEach(function (l) {
        chips.append(h('button', { type: 'button', class: 'sp-chip' + (l.id === state.cur ? ' on' : ''), 'aria-pressed': l.id === state.cur ? 'true' : 'false',
          onclick: function () { state.cur = l.id; save(); setup(); } }, l.name || 'Untitled List'));
      });
      if (state.lists.length < MAX_LISTS) chips.append(h('button', { type: 'button', class: 'sp-chip add', onclick: function () {
        var l = { id: 'l' + Date.now(), name: 'Week of ' + new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' }), text: '' };
        state.lists.push(l); state.cur = l.id; save(); setup();
        var ta = view.querySelector('.sp-words'); if (ta) ta.focus();
      } }, h('span', { html: TT.icon('plus') }), 'New List'));

      var name = h('input', { class: 'sp-name', type: 'text', maxlength: '40', value: list.name || '', 'aria-label': 'List name', placeholder: 'List Name' });
      var words = h('textarea', { class: 'sp-words roster-input', rows: '9', spellcheck: 'true', 'aria-label': 'Spelling words, one on each line',
        placeholder: 'because - I stayed inside because it was raining.\nfriend\npeople' });
      words.value = list.text || '';
      var count = h('span', { class: 'sp-count' });
      function paintCount() {
        var n = parse(words.value).length;
        count.textContent = n === 1 ? '1 Word' : n + ' Words';
        count.classList.toggle('low', n < 2);
      }
      paintCount();
      var saveT;
      function keep() {
        clearTimeout(saveT);
        saveT = setTimeout(function () {
          list.name = name.value.trim().slice(0, 40) || 'Untitled List';
          list.text = words.value.slice(0, 6000);
          save();
          var on = chips.querySelector('.sp-chip.on'); if (on) on.textContent = list.name;
        }, 350);
        paintCount();
      }
      name.addEventListener('input', keep); words.addEventListener('input', keep);
      var del = state.lists.length > 1 ? TT.button('Delete This List', { icon: 'trash', kind: 'small ghost', onclick: function () {
        if (!confirmDelete(del)) return;
        state.lists = state.lists.filter(function (l) { return l.id !== list.id; });
        state.cur = state.lists[0].id; save(); setup();
      } }) : null;

      var who = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Who is playing' }, [[false, 'Whole Class'], [true, 'Two Teams']].map(function (m) {
        return h('button', { type: 'button', class: 'seg' + (state.teams === m[0] ? ' on' : ''), 'aria-pressed': state.teams === m[0] ? 'true' : 'false',
          onclick: function () { state.teams = m[0]; save(); setup(); } }, m[1]);
      }));
      var warn = h('p', { class: 'sp-warn', role: 'status' });
      var cards = h('div', { class: 'sp-games' }, GAMES.map(function (g) {
        return h('button', { type: 'button', class: 'sp-game c-' + g.tint, onclick: function () {
          clearTimeout(saveT); list.text = words.value; list.name = name.value.trim() || list.name; save();
          var ws = parse(words.value);
          if (ws.length < 2) { warn.textContent = 'Type at least 2 words first, one on each line.'; words.focus(); return; }
          play(g.id, ws);
        } }, h('span', { class: 'sp-game-icon', html: g.icon }), h('span', { class: 'sp-game-text' }, h('b', { text: g.title }), h('span', { text: g.desc })),
          h('span', { class: 'sp-game-go', html: TT.icon('play') }));
      }));

      view.append(h('div', { class: 'sp-setup' },
        h('section', { class: 'sp-card sp-list-card' },
          h('h2', { class: 'sp-step', text: '1. This Week’s Words' }), chips,
          h('label', { class: 'sp-field' }, h('span', { text: 'List Name' }), name),
          h('label', { class: 'sp-field' }, h('span', { text: 'Words, One on Each Line' }), words),
          h('p', { class: 'sp-tip muted', text: 'Want Ed to read a sentence too? Add it after a dash: friend - My friend sat next to me.' }),
          h('div', { class: 'sp-list-foot' }, count, del)),
        h('section', { class: 'sp-card sp-game-card' },
          h('h2', { class: 'sp-step', text: '2. Pick a Game' }),
          h('div', { class: 'sp-who' }, h('span', { class: 'ff-label', text: 'Who Is Playing' }), who),
          cards, warn)));
    }
    function confirmDelete(btn) {
      if (btn.classList.contains('sure')) return true;
      btn.classList.add('sure'); btn.querySelector('span').textContent = 'Tap Again to Delete';
      setTimeout(function () { if (btn.isConnected) { btn.classList.remove('sure'); btn.querySelector('span').textContent = 'Delete This List'; } }, 3000);
      return false;
    }

    // ---------- The game stage ----------
    function play(id, words) {
      stopGame();
      view.textContent = '';
      var meta = GAMES.filter(function (g) { return g.id === id; })[0];
      var teams = state.teams ? TEAMS : [];
      var g = game = { id: id, words: TT.shuffle(words), i: -1, turn: Math.random() < 0.5 ? 0 : 1, scores: [0, 0], right: 0, missed: [], timers: [], keys: null, done: false };
      var buddy = TT.mascot ? TT.mascot() : h('span');
      var bubble = h('div', { class: 'ar-bubble on', 'aria-live': 'polite' });
      var status = h('p', { class: 'ar-status', 'aria-live': 'polite' });
      var cards = teams.map(function (t) {
        var c = h('div', { class: 'ar-team' }, h('span', { class: 'ar-team-name', text: t.name }), h('b', { class: 'ar-team-score', text: '0' }), h('span', { class: 'ar-team-sub' }),
          h('span', { class: 'ar-team-turn', text: 'Your Turn' }));
        c.style.setProperty('--c', t.color);
        return c;
      });
      var board = h('div', { class: 'sp-board' });
      var controls = h('div', { class: 'sp-controls' });
      var scene = h('div', { class: 'ar-scene', 'aria-hidden': 'true' }, h('i', { class: 'a' }), h('i', { class: 'b' }), h('i', { class: 'c' }));
      var stage = h('div', { class: 'ar-stage ar-spell sp-' + id + (teams.length ? ' teams' : '') }, scene,
        h('div', { class: 'ar-top' + (teams.length ? '' : ' solo') }, cards[0] || null, status, cards[1] || null),
        h('div', { class: 'ar-mid' }, h('div', { class: 'ar-buddy' }, bubble, buddy), h('div', { class: 'ar-play sp-play' }, board, controls), h('div', { class: 'ar-side', 'aria-hidden': 'true' })));
      var foot = h('div', { class: 'row center sp-foot' },
        TT.button('Pick Another Game', { icon: 'back', kind: 'small', onclick: setup }),
        h('span', { class: 'muted sp-foot-name', text: meta.title + ' · ' + (cur().name || '') }));
      view.append(stage, foot);
      g.stage = stage; g.board = board; g.controls = controls;

      g.say = function (text, mood, ms) {
        bubble.textContent = text; bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
        if (mood && buddy.mood) buddy.mood(mood, ms || 2200);
      };
      g.later = function (fn, ms) { g.timers.push(setTimeout(function () { if (game === g) fn(); }, ms)); };
      g.word = function () { return g.words[g.i]; };
      g.alive = function () { return game === g; };
      g.hear = function (withSentence) {
        var w = g.word(); if (!w) return;
        var parts = withSentence && w.s ? [w.w, w.s, w.w] : withSentence ? [w.w, w.w] : [w.w];
        var ok = talk(parts, function () { if (buddy.mood) buddy.mood('point'); }, function () { if (buddy.mood && game === g) buddy.mood('idle'); });
        if (!ok) g.say('My voice is off on this computer. Read the word out loud for the class.', 'think', 3000);
      };
      g.hearBtn = function (label, withSentence) {
        var b = h('button', { type: 'button', class: 'btn sp-hear', onclick: function () { g.hear(withSentence); } }, h('span', { class: 'sp-hear-ico', html: SPEAKER }), h('span', { text: label || 'Hear It' }));
        if (!canTalk()) b.hidden = true;
        return b;
      };
      g.paintTop = function () {
        status.textContent = g.done ? 'All Done!' : 'Word ' + (g.i + 1) + ' of ' + g.words.length;
        cards.forEach(function (c, k) {
          c.querySelector('.ar-team-score').textContent = g.scores[k];
          c.classList.toggle('active', !g.done && k === g.turn);
        });
        if (teams.length) stage.style.setProperty('--turn', teams[g.turn].color);
      };
      // A word is finished: ok = spelled right. Points go to the team whose turn it is.
      g.finish = function (ok, clean) {
        if (g.answered) return; g.answered = true;
        var w = g.word();
        if (ok) { g.right++; if (teams.length) g.scores[g.turn]++; }
        if (!ok || clean === false) g.missed.push(w.w);
        g.paintTop();
        if (ok) {
          fx('good');
          g.say(any(['You got it!', 'Super speller!', 'Nailed it!', 'Yes! That is right!', 'Way to go!']), any(['cheer', 'cheer-left', 'cheer-right']), 2000);
          var t = teams.length ? cards[g.turn] : null;
          if (t) { t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); }
        } else g.say(any(['Good try! Here is how it goes.', 'Almost! Look at it closely.', 'Tricky one! Now you know it.']), 'think', 2400);
        controls.textContent = '';
        controls.append(TT.button(g.i + 1 < g.words.length ? 'Next Word' : 'See How We Did', { icon: 'arrow', kind: 'primary big sp-next', onclick: next }));
        var nb = controls.querySelector('.sp-next'); if (nb) nb.focus({ preventScroll: true });
      };

      function next() {
        hush();
        g.timers.forEach(clearTimeout); g.timers = [];
        g.i++; g.answered = false; g.keys = null;
        if (g.i > 0 && teams.length) g.turn = 1 - g.turn;
        board.textContent = ''; controls.textContent = '';
        if (g.i >= g.words.length) return end();
        g.paintTop();
        ROUNDS[id](g, teams.length ? teams[g.turn].name : '');
        if (g.i > 0 && id !== 'flash') g.say(teams.length ? any(['Your turn, ' + teams[g.turn].name + '!', teams[g.turn].name + ', you can do it!']) : any(['Next word!', 'Here comes another one!', 'You can do it!', 'Ready for the next one?']), 'wave', 1600);
      }
      g.next = next;

      function end() {
        g.done = true; g.paintTop();
        var n = g.words.length, win = -1;
        if (teams.length) win = g.scores[0] === g.scores[1] ? -1 : g.scores[0] > g.scores[1] ? 0 : 1;
        cards.forEach(function (c, k) { c.classList.toggle('winner', k === win); });
        var big = teams.length ? (win < 0 ? 'It’s a Tie!' : teams[win].name + ' Wins!') : g.right === n && !g.missed.length ? 'Every Word Right!' : 'Great Spelling!';
        var box = h('div', { class: 'sp-end' },
          h('span', { class: 'sp-end-kicker', text: cur().name || 'Spelling Practice' }),
          h('h2', { class: 'sp-end-title', text: big }),
          h('div', { class: 'sp-end-score' }, h('b', { text: g.right + ' of ' + n }), h('span', { text: 'words spelled right' })),
          g.missed.length ? h('div', { class: 'sp-end-miss' }, h('span', { class: 'sp-end-label', text: 'Practice These Again' }),
            h('div', { class: 'sp-end-words' }, g.missed.map(function (w) {
              return h('button', { type: 'button', class: 'sp-end-word', title: 'Hear it', onclick: function () { talk([w]); } }, w);
            }))) : h('p', { class: 'sp-end-note', text: 'No words to practice again. Amazing work!' }));
        board.append(box);
        controls.append(TT.button('Play Again', { icon: 'reset', kind: 'primary big', onclick: function () { play(id, words); } }),
          TT.button('Pick Another Game', { kind: 'big', onclick: setup }));
        status.classList.add('win'); stage.classList.add('won');
        g.say(g.right >= n / 2 ? any(['What a spelling team!', 'You are spelling stars!', 'High five, spellers!']) : 'Nice work! Let’s practice these again soon.', g.right >= n / 2 ? 'party' : 'cheer', 4200);
        if (g.right >= Math.ceil(n / 2) && TT.celebrate) TT.celebrate(stage); else TT.chime();
      }

      g.say(teams.length ? 'Ready, teams? Let’s spell!' : 'Ready, spellers? Here we go!', 'wave', 1800);
      next();
    }

    function stopGame() {
      hush();
      if (game) { game.timers.forEach(clearTimeout); game = null; }
    }

    // Keys typed on a real keyboard go to the game (letters, Backspace, Enter).
    document.addEventListener('keydown', function (e) {
      if (!game || el.offsetParent === null || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter' && game.answered) { var nb = view.querySelector('.sp-next'); if (nb) { e.preventDefault(); nb.click(); } return; }
      if (game.keys && game.keys(e.key)) e.preventDefault();
    });

    setup();
    return { hide: function () { if (game) setup(); } };
  };

  // ====================================================================================
  // Letter tiles. A word turns into a row of slots; spaces, dashes and apostrophes are filled in for free.
  function slotsFor(word) {
    var row = h('div', { class: 'sp-word', style: '--n:' + word.length });
    var slots = word.split('').map(function (c) {
      var s = h('span', { class: 'sp-slot' + (isLetter(c) ? '' : ' fixed' + (c === ' ' ? ' gap' : '')) });
      if (!isLetter(c)) s.textContent = c === ' ' ? '' : c;
      row.append(s);
      return s;
    });
    return { row: row, slots: slots };
  }
  function pop(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  // Show the word in the slots, one letter at a time.
  function reveal(g, slots, word, cls, done) {
    var i = 0;
    (function step() {
      if (!g.alive()) return;
      while (i < word.length && !isLetter(word[i])) i++;
      if (i >= word.length) { if (done) done(); return; }
      var s = slots[i];
      if (!s.textContent || !same(s.textContent, word[i])) { s.textContent = word[i]; s.classList.add('show'); }
      s.classList.add(cls); pop(s, 'flip');
      if (TT.tick) TT.tick();
      i++;
      g.later(step, still ? 0 : 140);
    })();
  }
  function prompt(text) { return h('p', { class: 'sp-ask', text: text }); }
  function ALPHA() { return 'abcdefghijklmnopqrstuvwxyz'.split(''); }

  var ROUNDS = {};

  // ---------- Hear and Spell ----------
  ROUNDS.listen = function (g, team) {
    var w = g.word(), t = slotsFor(w.w);
    t.row.classList.add('blank');
    g.board.append(prompt(team ? team + ', write this word!' : 'Listen, then write the word!'), t.row);
    var show = TT.button('Show the Word', { icon: 'sparkle', kind: 'primary big', onclick: function () {
      g.controls.textContent = '';
      t.row.classList.remove('blank');
      reveal(g, t.slots, w.w, 'show', function () {
        g.say(team ? 'Did ' + team + ' spell it right?' : 'Did you spell it right?', 'point', 2400);
        g.controls.append(
          TT.button('We Got It!', { kind: 'big sp-yes', onclick: function () { g.finish(true); } }),
          TT.button('Not Yet', { kind: 'big sp-no', onclick: function () { g.finish(false); } }),
          g.hearBtn('Hear It'));
      });
    } });
    g.controls.append(g.hearBtn(w.s ? 'Hear the Word and Sentence' : 'Hear It Again', true), show);
    if (canTalk()) g.later(function () { g.hear(true); }, g.i === 0 ? 900 : 300);
    else g.say('Read the word out loud for the class: ' + w.w + '.', 'point', 3000);
    g.keys = function (k) { if (k === ' ') { show.click(); return true; } return false; };
  };

  // ---------- Unscramble ----------
  ROUNDS.scramble = function (g, team) {
    var w = g.word(), letters = [];
    w.w.split('').forEach(function (c, i) { if (isLetter(c)) letters.push({ c: c, i: i }); });
    var order = letters.slice(), tries = 0;
    var plain = letters.map(function (l) { return l.c.toLowerCase(); }).join('');
    do { order = TT.shuffle(letters); tries++; } while (tries < 20 && order.map(function (l) { return l.c.toLowerCase(); }).join('') === plain);
    var t = slotsFor(w.w), filled = [], mistakes = 0, hints = 0;
    var bank = h('div', { class: 'sp-bank', style: '--n:' + Math.max(order.length, 5) });
    if (order.length > 9) bank.style.setProperty('--n', Math.ceil(order.length / 2));
    var tiles = order.map(function (l) {
      var b = h('button', { type: 'button', class: 'sp-tile', text: l.c, onclick: function () { pick(b); } });
      b._l = l; bank.append(b); return b;
    });
    var open = t.slots.filter(function (s) { return !s.classList.contains('fixed'); });
    open.forEach(function (s, k) { s.addEventListener('click', function () { if (!g.answered && k >= hints) back(k); }); s.classList.add('tap'); });
    g.board.append(prompt(team ? team + ', unscramble this word!' : 'Unscramble the word!'), t.row, bank);
    function paint() {
      open.forEach(function (s, k) { var b = filled[k]; s.textContent = b ? b._l.c : ''; s.classList.toggle('on', !!b); s.classList.toggle('hint', k < hints); });
    }
    function pick(b) {
      if (g.answered || b.disabled || filled.length >= open.length) return;
      filled.push(b); b.disabled = true; b.classList.add('used');
      paint(); pop(open[filled.length - 1], 'flip'); if (TT.tick) TT.tick();
      if (filled.length === open.length) check();
    }
    function back(k) {
      if (k >= filled.length) return;
      filled.splice(k).forEach(function (b) { b.disabled = false; b.classList.remove('used'); });
      paint();
    }
    function check() {
      var made = filled.map(function (b) { return b._l.c; }).join('');
      if (same(made, plain)) {
        open.forEach(function (s) { s.classList.add('right'); pop(s, 'flip'); });
        bank.classList.add('gone');
        return g.finish(true, mistakes === 0 && hints === 0);
      }
      mistakes++; fx('bad');
      pop(t.row, 'shake');
      g.say(mistakes === 1 ? 'Not quite. Try a new order!' : 'Keep trying! Tap Hint for help.', 'think', 2000);
      g.later(function () { back(hints); }, 650);
    }
    function hint() {
      if (g.answered || hints >= open.length - 1) return;
      back(hints);
      var want = letters[hints].c.toLowerCase();
      var b = tiles.filter(function (x) { return !x.disabled && x._l.c.toLowerCase() === want; })[0];
      if (!b) return;
      filled.push(b); b.disabled = true; b.classList.add('used'); hints++;
      paint(); pop(open[hints - 1], 'flip'); fx('pop');
      g.say('The next letter is ' + b._l.c.toUpperCase() + '.', 'point', 1800);
    }
    g.controls.append(g.hearBtn('Hear It'), TT.button('Hint', { icon: 'sparkle', kind: 'big', onclick: hint }),
      TT.button('Show Me', { kind: 'big sp-quiet', onclick: function () {
        back(0); bank.classList.add('gone');
        reveal(g, t.slots, w.w, 'given', function () { g.finish(false); });
      } }));
    g.keys = function (k) {
      if (g.answered) return false;
      if (k === 'Backspace') { if (filled.length > hints) back(filled.length - 1); return true; }
      if (k.length !== 1 || !isLetter(k)) return false;
      var b = tiles.filter(function (x) { return !x.disabled && same(x._l.c, k); })[0];
      if (b) pick(b);
      return true;
    };
  };

  // ---------- Missing Letters ----------
  var VOWELS = 'aeiou';
  var LOOKS = { b: 'dp', d: 'bp', p: 'bq', q: 'pg', m: 'nw', n: 'mh', a: 'eo', e: 'ai', i: 'ey', o: 'au', u: 'ow', c: 'ks', k: 'c', s: 'cz', g: 'jq', j: 'g', f: 'v', v: 'f', y: 'i', w: 'u', h: 'n', l: 'i', r: 'l', t: 'f', x: 'z', z: 's' };
  ROUNDS.missing = function (g, team) {
    var w = g.word(), idx = [];
    w.w.split('').forEach(function (c, i) { if (isLetter(c)) idx.push(i); });
    var want = Math.max(1, Math.min(3, Math.round(idx.length / 3)));
    if (idx.length <= 3) want = 1;
    // Prefer vowels and the middle of the word, the spots kids mix up most.
    var pool = TT.shuffle(idx.slice(1)).sort(function (a, b) { return (VOWELS.indexOf(w.w[b].toLowerCase()) >= 0) - (VOWELS.indexOf(w.w[a].toLowerCase()) >= 0); });
    var gaps = pool.slice(0, want).sort(function (a, b) { return a - b; });
    var t = slotsFor(w.w), at = 0, mistakes = 0;
    t.slots.forEach(function (s, i) { if (gaps.indexOf(i) < 0 && isLetter(w.w[i])) { s.textContent = w.w[i]; s.classList.add('given'); } });
    gaps.forEach(function (i) { t.slots[i].classList.add('gap-slot'); });
    function mark() { gaps.forEach(function (i, k) { t.slots[i].classList.toggle('next', k === at); }); }
    mark();
    var need = gaps.map(function (i) { return w.w[i].toLowerCase(); }), choices = need.filter(function (c, k) { return need.indexOf(c) === k; });
    var decoys = [];
    need.forEach(function (c) { (LOOKS[c] || '').split('').forEach(function (d) { if (choices.indexOf(d) < 0 && decoys.indexOf(d) < 0) decoys.push(d); }); });
    var left = ALPHA().filter(function (c) { return choices.indexOf(c) < 0 && decoys.indexOf(c) < 0; });
    while (choices.length + decoys.length < 6) decoys.push(left.splice(Math.floor(Math.random() * left.length), 1)[0]);
    var bankLetters = TT.shuffle(choices.concat(TT.shuffle(decoys).slice(0, 6 - choices.length)));
    var bank = h('div', { class: 'sp-bank choose', style: '--n:6' });
    var tiles = bankLetters.map(function (c) { var b = h('button', { type: 'button', class: 'sp-tile', text: c, onclick: function () { tap(b); } }); b._c = c; bank.append(b); return b; });
    g.board.append(prompt(team ? team + ', find the missing letter' + (gaps.length > 1 ? 's!' : '!') : 'Which letter' + (gaps.length > 1 ? 's are' : ' is') + ' missing?'), t.row, bank);
    function tap(b) {
      if (g.answered || at >= gaps.length) return;
      var i = gaps[at];
      if (same(b._c, w.w[i])) {
        var s = t.slots[i]; s.textContent = w.w[i]; s.classList.add('right'); pop(s, 'flip'); if (TT.tick) TT.tick();
        at++; mark();
        if (at >= gaps.length) { bank.classList.add('gone'); g.finish(true, mistakes === 0); }
      } else {
        mistakes++; fx('bad'); pop(b, 'shake'); b.classList.add('wrong'); b.disabled = true;
        g.say(any(['Not that one. Try again!', 'Hmm, look again!', 'Close! Try another letter.']), 'think', 1600);
        // If only right answers are left, tidy up so nobody gets stuck.
      }
    }
    g.controls.append(g.hearBtn('Hear It'), TT.button('Show Me', { kind: 'big sp-quiet', onclick: function () {
      bank.classList.add('gone');
      gaps.forEach(function (i) { t.slots[i].textContent = ''; });
      reveal(g, t.slots, w.w, 'given', function () { g.finish(false); });
    } }));
    g.keys = function (k) {
      if (g.answered || k.length !== 1 || !isLetter(k)) return false;
      var b = tiles.filter(function (x) { return !x.disabled && same(x._c, k); })[0];
      if (b) tap(b);
      return true;
    };
  };

  // ---------- Quick Look ----------
  ROUNDS.flash = function (g, team) {
    var w = g.word(), t = slotsFor(w.w), typed = [];
    var open = []; t.slots.forEach(function (s, i) { if (isLetter(w.w[i])) open.push(i); });
    var ask = prompt(team ? team + ', look closely!' : 'Look closely!');
    var timebar = h('span', { class: 'sp-timebar' }, h('i'));
    g.board.append(ask, t.row, timebar);
    var secs = Math.min(6, 2.5 + w.w.length * 0.2);
    t.slots.forEach(function (s, i) { if (isLetter(w.w[i])) s.textContent = w.w[i]; });
    t.row.classList.add('peek');
    var bar = timebar.firstChild;
    bar.style.transition = still ? 'none' : 'transform ' + secs + 's linear';
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.transform = 'scaleX(0)'; }); });
    g.say(any(['Remember the letters!', 'Take a picture with your eyes!', 'Look at every letter!']), 'point', 2000);
    var kb = h('div', { class: 'sp-keys', role: 'group', 'aria-label': 'Letters' });
    ALPHA().forEach(function (c) { kb.append(h('button', { type: 'button', class: 'sp-key', text: c, onclick: function () { press(c); } })); });
    kb.append(h('button', { type: 'button', class: 'sp-key wide', 'aria-label': 'Erase', onclick: function () { press('Backspace'); } }, '⌫'));
    var hiding = true;
    g.controls.append(TT.button('Hide It Now', { kind: 'big', onclick: cover }));
    g.later(cover, secs * 1000);
    function cover() {
      if (!hiding || !g.alive()) return;
      hiding = false;
      timebar.remove(); t.row.classList.remove('peek');
      open.forEach(function (i) { t.slots[i].textContent = ''; t.slots[i].classList.add('tap'); });
      pop(t.row, 'flip');
      ask.textContent = team ? team + ', spell the word!' : 'Now spell it!';
      g.say('Where did it go? Spell it!', 'think', 1800);
      g.controls.textContent = '';
      g.board.append(kb);
      g.controls.append(TT.button('Look Again', { kind: 'big sp-quiet', onclick: peekAgain }), g.hearBtn('Hear It'));
      mark();
    }
    var peeks = 0;
    function peekAgain() {
      if (g.answered) return;
      peeks++;
      open.forEach(function (i) { t.slots[i].textContent = w.w[i]; });
      t.row.classList.add('peek');
      g.later(function () { t.row.classList.remove('peek'); paint(); }, 1500);
    }
    function mark() { open.forEach(function (i, k) { t.slots[i].classList.toggle('next', k === typed.length); }); }
    function paint() { open.forEach(function (i, k) { t.slots[i].textContent = typed[k] || ''; t.slots[i].classList.toggle('on', !!typed[k]); }); mark(); }
    function press(k) {
      if (hiding || g.answered) return;
      if (k === 'Backspace') typed.pop();
      else if (typed.length < open.length) { typed.push(w.w[open[typed.length]] === w.w[open[typed.length]].toUpperCase() && isLetter(k) ? k.toUpperCase() : k.toLowerCase()); if (TT.tick) TT.tick(); }
      paint();
      if (typed.length === open.length) check();
    }
    function check() {
      var ok = open.every(function (i, k) { return same(typed[k], w.w[i]); });
      kb.classList.add('gone');
      open.forEach(function (i, k) { t.slots[i].classList.remove('next'); t.slots[i].classList.add(same(typed[k], w.w[i]) ? 'right' : 'wrong'); });
      if (ok) return g.finish(true, peeks === 0);
      fx('bad'); pop(t.row, 'shake');
      var fix = slotsFor(w.w); fix.row.classList.add('fix');
      g.board.append(h('p', { class: 'sp-ask small', text: 'It’s spelled:' }), fix.row);
      reveal(g, fix.slots, w.w, 'given', function () { g.finish(false); });
    }
    g.keys = function (k) {
      if (hiding && k === ' ') { cover(); return true; }
      if (k === 'Backspace') { press(k); return true; }
      if (k.length === 1 && isLetter(k)) { press(k); return true; }
      return false;
    };
  };
})();
