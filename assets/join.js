// The student join page (/join). A student types the class code their teacher shows and gets their own
// Class Bingo card. No account and no password. A first name or nickname is optional: it is kept in this
// browser tab only and sent live to the teacher's open screen, never saved online.
(function () {
  var B = window.Bingo, TT = window.TT = window.TT || {};
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Small helpers (this page doesn't load the teacher's tools) ----------
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (cc) { if (cc != null) el.append(cc); }); else el.append(c);
    }
    return el;
  }
  TT.h = TT.h || h;
  var audio;
  function beep(f, len, type, vol) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + len);
      g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + len + 0.02);
    } catch (e) {}
  }
  function cheer() { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { beep(f, 0.3, 'triangle', 0.09); }, i * 110); }); }
  function store(k, v) { try { if (v == null) sessionStorage.removeItem('tt-join-' + k); else sessionStorage.setItem('tt-join-' + k, JSON.stringify(v)); } catch (e) {} }
  function recall(k) { try { return JSON.parse(sessionStorage.getItem('tt-join-' + k)); } catch (e) { return null; } }

  // A friendly name for anyone who doesn't type one.
  var ADJ = ['Bright', 'Brave', 'Speedy', 'Clever', 'Happy', 'Sunny', 'Lucky', 'Jolly', 'Mighty', 'Cosmic', 'Zippy', 'Bouncy'];
  var ANIMAL = ['Otter', 'Panda', 'Falcon', 'Koala', 'Tiger', 'Dolphin', 'Fox', 'Owl', 'Turtle', 'Llama', 'Penguin', 'Gecko'];
  function funName() { return ADJ[Math.floor(Math.random() * ADJ.length)] + ' ' + ANIMAL[Math.floor(Math.random() * ANIMAL.length)]; }

  var root, me = recall('me') || null, conn = null, state = null, cells = null, marks = [], hostHere = false, findTimer = null, lastN = -1, wins = 0, cardKey = '';

  function start() {
    root = document.getElementById('join');
    if (!B.liveReady()) { paintEnter('Joining isn’t switched on for this site yet.'); return; }
    if (me && me.code) { connect(); return; }
    paintEnter();
  }

  // ---------- Step 1: type the code ----------
  function paintEnter(msg) {
    root.textContent = '';
    root.className = 'join-main is-enter';
    var preset = B.cleanCode(new URLSearchParams(location.search).get('code') || (me && me.code) || '');
    var mas = TT.mascot ? TT.mascot({ mood: 'wave' }) : null;
    if (mas) setTimeout(function () { mas.mood('idle'); }, 2200);
    var code = h('input', { id: 'code', class: 'join-code-in', type: 'text', inputmode: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
      maxlength: 8, placeholder: 'ABC 123', 'aria-describedby': 'codeHelp', value: B.showCode(preset) });
    var name = h('input', { id: 'nick', class: 'join-name-in', type: 'text', autocomplete: 'off', maxlength: 16, placeholder: 'Like Maya or Speedy Otter' });
    if (me && me.name && !me.auto) name.value = me.name;
    var err = h('p', { class: 'join-err', role: 'alert', text: msg || '' });
    var go = h('button', { type: 'submit', class: 'btn primary big join-go' }, h('span', { text: 'Join' }), h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>' }));
    code.addEventListener('input', function () {
      var c = B.cleanCode(code.value);
      var show = c.length > 3 ? c.slice(0, 3) + ' ' + c.slice(3) : c;
      if (code.value !== show) code.value = show;
      code.classList.toggle('full', c.length === 6);
      err.textContent = '';
    });
    var form = h('form', { class: 'join-card', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      var c = B.cleanCode(code.value);
      if (c.length !== 6) { err.textContent = 'The code has 6 letters and numbers. Look at your teacher’s screen.'; code.focus(); shake(form); return; }
      var n = name.value.replace(/\s+/g, ' ').trim().slice(0, 16);
      me = { code: c, id: B.randomId(), name: n || funName(), auto: !n };
      store('me', me);
      connect();
    } },
      h('h1', { text: 'Join Your Class' }),
      h('p', { class: 'join-lead', text: 'Type the code on your teacher’s screen.' }),
      h('label', { for: 'code', class: 'join-lab', text: 'Class Code' }), code,
      h('p', { id: 'codeHelp', class: 'join-help', text: 'No account or password needed.' }),
      h('label', { for: 'nick', class: 'join-lab' }, 'Your First Name or a Nickname ', h('span', { class: 'join-opt', text: '(optional)' })), name,
      err, go,
      h('p', { class: 'join-privacy', text: 'Nothing you type here is saved. Your name only shows on your teacher’s screen during the game.' }));
    root.append(h('div', { class: 'join-stage' }, mas ? h('div', { class: 'join-mascot', 'aria-hidden': 'true' }, mas) : null, form));
    setTimeout(function () { (preset.length === 6 ? name : code).focus(); }, 60);
  }
  function shake(el) { if (still) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  // ---------- Connecting ----------
  function connect() {
    paintWaiting('Finding your class…');
    if (conn) conn.close();
    conn = B.connect({
      code: me.code, me: me.id, meta: { name: me.name },
      on: {
        state: onState,
        verdict: onVerdict,
        end: function () { over(); },
        pause: function () { hostHere = false; if (state) paintHost(); }
      },
      onPeople: function (list) { var was = hostHere; hostHere = list.some(function (p) { return p.host; }); if (was !== hostHere && state) paintHost(); },
      onStatus: function (s) { if (s === 'off' && !state) paintWaiting('Can’t reach the game. Check the internet, then we’ll keep trying.'); },
      onLive: function () { conn.send('hello', { id: me.id }); }
    });
    clearTimeout(findTimer);
    findTimer = setTimeout(function () {
      if (state) return;
      paintNotFound();
    }, 9000);
  }
  function paintWaiting(text) {
    root.textContent = '';
    root.className = 'join-main is-wait';
    var mas = TT.mascot ? TT.mascot({ mood: 'think' }) : null;
    root.append(h('div', { class: 'join-card join-wait' },
      mas ? h('div', { class: 'join-mascot small', 'aria-hidden': 'true' }, mas) : null,
      h('div', { class: 'join-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
      h('h1', { text: text }),
      h('p', { class: 'join-lead', text: 'Code ' + B.showCode(me.code) }),
      h('button', { type: 'button', class: 'btn', onclick: leave, text: 'Use a Different Code' })));
  }
  function paintNotFound() {
    root.textContent = '';
    root.className = 'join-main is-wait';
    root.append(h('div', { class: 'join-card join-wait' },
      h('h1', { text: 'We Can’t Find That Game Yet' }),
      h('p', { class: 'join-lead', text: 'Check that the code matches your teacher’s screen: ' + B.showCode(me.code) + '. If it does, your teacher may still be starting the game. We’ll keep looking.' }),
      h('div', { class: 'row center' },
        h('button', { type: 'button', class: 'btn primary big', onclick: leave, text: 'Type the Code Again' }))));
    if (conn) conn.send('hello', { id: me.id });
    findTimer = setTimeout(function () { if (!state && conn) { conn.send('hello', { id: me.id }); } }, 5000);
  }
  function leave() {
    if (conn) conn.close(); conn = null; clearTimeout(findTimer);
    var keepName = me && !me.auto ? me.name : '';
    state = null; cells = null; store('me', null); store('card', null);
    me = keepName ? { name: keepName } : null;
    paintEnter();
  }
  function over() {
    if (conn) conn.close(); conn = null;
    store('me', null); store('card', null);
    state = null;
    root.textContent = '';
    root.className = 'join-main is-over';
    var mas = TT.mascot ? TT.mascot({ mood: 'wave' }) : null;
    root.append(h('div', { class: 'join-card join-wait' },
      mas ? h('div', { class: 'join-mascot small', 'aria-hidden': 'true' }, mas) : null,
      h('h1', { text: 'Thanks for Playing!' }),
      h('p', { class: 'join-lead', text: wins ? 'You got Bingo ' + (wins === 1 ? 'once' : wins + ' times') + '. Nice work!' : 'Your teacher ended the game.' }),
      h('button', { type: 'button', class: 'btn primary big', onclick: function () { me = null; wins = 0; paintEnter(); }, text: 'Join Another Game' })));
  }

  // ---------- Playing ----------
  var callEl, gridBox, bingoBtn, calledEl, hostEl, toastEl;
  function onState(s) {
    if (!s || !Array.isArray(s.cards)) return;
    clearTimeout(findTimer);
    var first = !state, key = s.g + ':' + s.round, prev = state;
    state = s; hostHere = true;
    if (key !== cardKey) {
      cardKey = key;
      cells = B.makeCard(s.cards.length, s.size, s.free, me.id + ':' + s.g + ':' + s.round);
      var saved = recall('card');
      marks = saved && saved.key === key ? saved.marks : cells.map(function () { return false; });
      lastN = -1;
      paintPlay(first || (prev && prev.round !== s.round));
      if (prev && prev.round !== s.round) toast('New round! Here’s a fresh card.');
    }
    paintCall();
    paintCalled();
    paintHost();
    // Someone else got Bingo
    var before = prev && prev.round === s.round ? (prev.winners || []).length : (s.winners || []).length;
    (s.winners || []).slice(before).forEach(function (n) { if (n !== me.name) toast(n + ' got Bingo!'); });
  }
  function paintPlay(deal) {
    root.textContent = '';
    root.className = 'join-main is-play';
    callEl = h('div', { class: 'join-call', role: 'status', 'aria-live': 'assertive' });
    hostEl = h('p', { class: 'join-host', role: 'status' });
    gridBox = h('div', { class: 'join-card-box' + (deal && !still ? ' deal' : '') });
    bingoBtn = h('button', { type: 'button', class: 'join-bingo', onclick: claim }, h('span', { class: 'jb-word', text: 'Bingo!' }), h('span', { class: 'jb-hint' }));
    calledEl = h('div', { class: 'join-called' });
    var drawer = h('details', { class: 'join-drawer' }, h('summary', { text: 'Called So Far' }), calledEl);
    root.append(
      h('div', { class: 'join-bar' },
        h('span', { class: 'join-who' }, h('span', { class: 'join-dot', 'aria-hidden': 'true' }), me.name),
        h('span', { class: 'join-rule', text: B.PATTERNS[state.pattern] + ' Wins' })),
      hostEl, callEl, gridBox, bingoBtn, drawer);
    drawCard();
  }
  function drawCard() {
    gridBox.textContent = '';
    gridBox.append(B.cardEl({ cards: state.cards, cells: cells, size: state.size, marked: marks.map(function (m, p) { return m || cells[p] === -1; }), title: state.title, onTap: tap }));
    fit();
    paintBingo();
  }
  function tap(p, el) {
    marks[p] = !marks[p];
    el.classList.toggle('on', marks[p]);
    el.classList.remove('wrong');
    el.setAttribute('aria-pressed', marks[p] ? 'true' : 'false');
    if (marks[p] && !still) { el.classList.remove('stamp'); void el.offsetWidth; el.classList.add('stamp'); }
    beep(marks[p] ? 520 : 360, 0.09, 'triangle', 0.07);
    store('card', { key: cardKey, marks: marks });
    paintBingo();
  }
  function ready() { return !!B.winLine(marks.map(function (m, p) { return m || cells[p] === -1; }), state.size, state.pattern); }
  function paintBingo() {
    var r = ready();
    bingoBtn.classList.toggle('ready', r);
    bingoBtn.disabled = !r;
    var togo = B.toGo(marks.map(function (m, p) { return m || cells[p] === -1; }), state.size, state.pattern);
    bingoBtn.querySelector('.jb-hint').textContent = r ? 'Tap to tell your teacher!' : (state.pattern === 'full' ? 'Mark every square' : state.pattern === 'corners' ? 'Mark all four corners' : 'Mark a full line') + ' · ' + togo + ' to go';
    bingoBtn.setAttribute('aria-label', r ? 'Bingo! Tap to tell your teacher' : 'Bingo button. ' + togo + ' more to go');
  }
  function paintCall() {
    var L = state.last;
    if (!L) { callEl.className = 'join-call idle'; callEl.textContent = 'Get ready! Your teacher will call the first one soon.'; return; }
    if (L.n === lastN) return;
    var fresh = lastN !== -1;
    lastN = L.n;
    callEl.textContent = '';
    callEl.className = 'join-call' + (fresh && !still ? ' pop' : '');
    callEl.append(h('span', { class: 'join-call-n', text: 'Call ' + L.n }), h('span', { class: 'join-call-text' + (L.text.length > 50 ? ' long' : ''), text: L.text }));
    if (fresh) beep(740, 0.12, 'sine', 0.06);
  }
  function paintCalled() {
    if (!calledEl) return;
    calledEl.textContent = '';
    var calls = (state.called || []).slice().reverse();
    if (!calls.length) { calledEl.append(h('p', { class: 'join-help', text: 'Nothing yet.' })); return; }
    calledEl.append(h('div', { class: 'chips small' }, calls.map(function (i) { return h('span', { class: 'chip static', text: state.cards[i] }); })));
  }
  function paintHost() {
    if (!hostEl) return;
    hostEl.textContent = hostHere ? '' : 'Your teacher’s screen is away. Keep your card, the game will pick up again.';
    hostEl.hidden = hostHere;
  }
  function claim() {
    if (!ready() || !conn) return;
    bingoBtn.disabled = true;
    bingoBtn.querySelector('.jb-hint').textContent = 'Checking with your teacher…';
    conn.send('claim', { id: me.id, name: me.name, g: state.g, round: state.round, marks: marks.map(function (m, p) { return m ? p : -1; }).filter(function (p) { return p >= 0; }) });
    setTimeout(function () { if (bingoBtn && bingoBtn.querySelector('.jb-hint').textContent.indexOf('Checking') === 0) paintBingo(); }, 6000);
  }
  function onVerdict(v) {
    if (!v || v.to !== me.id || !state || v.round !== state.round) return;
    if (v.ok) {
      wins++;
      celebrate(v.line || []);
    } else {
      var grid = gridBox.querySelectorAll('.bc-cell');
      (v.wrong || []).forEach(function (p) { if (grid[p]) { grid[p].classList.remove('wrong'); void grid[p].offsetWidth; grid[p].classList.add('wrong'); } });
      toast(v.wrong && v.wrong.length ? 'Not yet! The shaking squares haven’t been called.' : 'Not yet! Keep listening.');
      beep(220, 0.25, 'sawtooth', 0.04);
      paintBingo();
    }
  }
  function celebrate(line) {
    var grid = gridBox.querySelectorAll('.bc-cell');
    line.forEach(function (p, i) { if (grid[p]) { grid[p].style.setProperty('--w', i); grid[p].classList.add('win'); } });
    bingoBtn.classList.add('won'); bingoBtn.disabled = true;
    bingoBtn.querySelector('.jb-hint').textContent = 'You got it! Your teacher saw it.';
    var conf = h('div', { class: 'bgo-confetti', 'aria-hidden': 'true' });
    if (!still) for (var i = 0; i < 60; i++) {
      var bit = h('i'); bit.style.setProperty('--x', Math.random() * 100 + '%'); bit.style.setProperty('--d', (Math.random() * 0.8) + 's');
      bit.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); bit.style.setProperty('--c', B.COLS[i % 5]); bit.style.setProperty('--s', 0.6 + Math.random() * 0.8);
      conf.append(bit);
    }
    var mas = TT.mascot ? TT.mascot({ mood: 'party' }) : null;
    var layer = h('div', { class: 'bgo-win join-win', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Bingo!' }, conf,
      h('div', { class: 'bgo-win-card' }, mas ? h('div', { class: 'bgo-win-mascot' }, mas) : null,
        h('p', { class: 'bgo-win-kicker', text: 'Bingo!' }), h('h2', { text: 'You Did It, ' + me.name + '!' }),
        h('button', { type: 'button', class: 'btn primary big', onclick: function () { layer.classList.add('out'); setTimeout(function () { layer.remove(); }, 300); }, text: 'Back to My Card' })));
    document.body.append(layer);
    setTimeout(function () { var b = layer.querySelector('button'); if (b) b.focus(); }, 50);
    cheer();
  }
  function toast(text) {
    if (toastEl) toastEl.remove();
    var t = toastEl = h('div', { class: 'bgo-toast', role: 'status', text: text });
    document.body.append(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); if (toastEl === t) toastEl = null; }, 400); }, 2800);
  }

  // Keep every word inside its square, also after the fonts arrive or the device turns.
  function fit() { if (gridBox) B.fitCells(gridBox); }
  var fitT; window.addEventListener('resize', function () { clearTimeout(fitT); fitT = setTimeout(fit, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  window.Join = { start: start };
})();
