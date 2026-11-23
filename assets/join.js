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
  function funName(av) {
    if (me && me.adj && window.Lobby) return me.adj + ' ' + Lobby.avatar(av).n;
    var animal = window.Lobby ? Lobby.avatar(av).n : ANIMAL[Math.floor(Math.random() * ANIMAL.length)];
    return ADJ[Math.floor(Math.random() * ADJ.length)] + ' ' + animal;
  }

  var goneTimer = null, root, me = recall('me') || null, conn = null, state = null, cells = null, marks = [], hostHere = false, findTimer = null, lastN = -1, wins = 0, cardKey = '';

  function start() {
    root = document.getElementById('join');
    if (!B.liveReady()) { paintEnter('Joining isn’t switched on for this site yet.'); return; }
    if (me && me.code) {
      if (!me.auto && window.NameFilter && !NameFilter.ok(me.name)) { me.auto = true; me.name = funName(me.av); store('me', me); }
      connect(); return;
    }
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
    var nameTip = h('div', { class: 'join-name-tip', role: 'alert', hidden: true },
      h('p', { class: 'join-name-tip-t', text: 'Let’s pick a different name!' }),
      h('p', { text: 'Try your first name, or get a fun animal name instead.' }),
      h('button', { type: 'button', class: 'btn small join-name-auto', onclick: function () { name.value = ''; nameTip.hidden = true; form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); } }, 'Use an Animal Name'));
    function badName() {
      name.value = ''; nameTip.hidden = false; shake(nameTip); name.focus();
    }
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
      // Names have to be kid-friendly. A name that doesn't pass is never shown or repeated back.
      if (n && window.NameFilter) {
        var ck = NameFilter.check(n);
        if (!ck.ok) { badName(); return; }
        n = ck.name;
      }
      nameTip.hidden = true;
      var av = window.Lobby ? Lobby.pick() : 0;
      me = { code: c, id: B.randomId(), name: '', auto: !n, av: av, at: Date.now(), adj: ADJ[Math.floor(Math.random() * ADJ.length)] };
      me.name = n || funName(av);
      store('me', me);
      connect();
    } },
      h('h1', { text: 'Join Your Class' }),
      h('p', { class: 'join-lead', text: 'Type the code on your teacher’s screen.' }),
      h('label', { for: 'code', class: 'join-lab', text: 'Class Code' }), code,
      h('p', { id: 'codeHelp', class: 'join-help', text: 'No account or password needed.' }),
      h('label', { for: 'nick', class: 'join-lab' }, 'Your First Name or a Nickname ', h('span', { class: 'join-opt', text: '(optional)' })), name,
      err, nameTip, go,
      h('p', { class: 'join-privacy', text: 'Nothing you type here is saved. Your name only shows on your teacher’s screen during the game.' }));
    root.append(h('div', { class: 'join-stage' }, mas ? h('div', { class: 'join-mascot', 'aria-hidden': 'true' }, mas) : null, form));
    setTimeout(function () { (preset.length === 6 ? name : code).focus(); }, 60);
  }
  function shake(el) { if (still) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

  // ---------- Connecting ----------
  function connect() {
    avMap = {}; pending = null; picker = null;
    paintWaiting('Finding your class…');
    if (conn) conn.close();
    conn = B.connect({
      code: me.code, me: me.id, meta: meta(),
      on: {
        state: onState,
        verdict: onVerdict,
        countdown: onCountdown,
        poke: function (m) { if (m && room) room.poke(m.id); },
        avs: function (m) { if (m && (!state || m.g === state.g)) applySeats(m.map); },
        kick: function (m) { if (m && m.id === me.id) removed(); },
        end: function () { over(); },
        pause: function () { hostHere = false; if (state) paintHost(); }
      },
      onPeople: function (list) {
        var was = hostHere; hostHere = list.some(function (p) { return p.host; });
        players = list.filter(function (p) { return !p.host; });
        if (room) room.update(seatedPlayers());
        if (was !== hostHere && state) paintHost();
        // The teacher's screen left and didn't come back (its "end" message got lost): the game is over.
        clearTimeout(goneTimer);
        if (state && !hostHere) goneTimer = setTimeout(function () { if (state && !hostHere) over(); }, 20000);
      },
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
    clearTimeout(goneTimer);
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
  function meta() { return { name: me.name, av: me.av | 0, at: me.at || 0 }; }
  var players = [], room = null, counting = false, waitingPaint = false, countedIn = false;

  // ---------- The lobby: "You're In!" and everyone else who has joined ----------
  function paintLobby() {
    root.textContent = '';
    root.className = 'join-main is-lobby';
    cardKey = '';
    var meBox = h('div', { class: 'lb-me-wrap' });
    var jumping = false;
    function drawMe() {
      meBox.textContent = '';
      var p = Lobby.player({ id: me.id, name: me.name, av: me.av }, { me: false, onTap: function (x, el) {
        // Tap your animal: it jumps and sparkles here, and bounces on everyone else's screen too.
        // One jump at a time: taps are ignored until the full spin has landed.
        if (jumping) return;
        jumping = true; el.classList.add('cooling');
        Lobby.poke(el, true);
        if (conn) conn.send('poke', { id: me.id });
        if (room) room.poke(me.id);
        setTimeout(function () {
          jumping = false; el.classList.remove('cooling');
          taps++; tapCount.textContent = taps === 1 ? '1 jump!' : taps + ' jumps!';
          tapCount.classList.remove('bump'); void tapCount.offsetWidth; tapCount.classList.add('bump');
        }, Lobby.JUMP_MS);
      } });
      p.classList.add('lb-me');
      p.setAttribute('aria-label', 'Your animal. Tap to make it jump');
      meBox.append(p, h('span', { class: 'lb-tap-hint', 'aria-hidden': 'true', text: 'Tap me!' }));
    }
    var taps = 0, tapCount = h('span', { class: 'lb-taps', 'aria-live': 'polite' });
    drawMe();
    redrawMe = drawMe;
    room = Lobby.room({ meId: me.id, empty: 'You’re the first one here!' });
    room.update(seatedPlayers());
    var pickBox = paintPicker();
    root.append(h('div', { class: 'join-card lb-in' },
      h('p', { class: 'join-call-n', text: state ? state.title : '' }),
      h('h1', { text: 'You’re In!' }),
      meBox,
      tapCount,
      h('div', { class: 'lb-waiting' },
        h('div', { class: 'join-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
        h('p', { class: 'lb-waiting-text', text: 'Waiting for Teacher to Start' }),
        h('p', { class: 'join-help', text: 'Tap your animal to make it jump. Your classmates see it bounce too!' })),
      pickBox,
      h('section', { class: 'lb-others' }, h('h2', { text: 'Who’s Here' }), room.el)));
    if (!document.querySelector('.lb-floaties')) document.body.append(Lobby.floaties());
  }
  // ---------- Choose your animal: one animal per player, the teacher's screen decides ties ----------
  var avMap = {}, picker = null, pickNote = null, pickWrap = null, pending = null, pendTimer = null, redrawMe = null;
  function takenSet() { var t = {}; Object.keys(avMap).forEach(function (k) { if (k !== me.id) t[avMap[k]] = true; }); return t; }
  function seatedPlayers() { return players.map(function (p) { return avMap[p.id] != null ? Object.assign({}, p, { av: avMap[p.id] }) : p; }); }
  function paintPicker() {
    picker = Lobby.picker({ mine: me.av | 0, taken: takenSet(), pending: pending, onPick: choose });
    pickNote = h('p', { class: 'lb-pick-note', role: 'status' });
    var open = !me.picked;
    var toggle = h('button', { type: 'button', class: 'btn small lb-change', 'aria-expanded': String(open), onclick: function () { show(pickWrap.hidden); } },
      h('span', { text: 'Choose Your Animal' }), h('span', { class: 'lb-chev', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>' }));
    pickWrap = h('div', { class: 'lb-pick-wrap' }, h('p', { class: 'join-help', text: 'Every player gets a different animal. Gray ones are taken.' }), pickNote, picker.el);
    function show(on) { pickWrap.hidden = !on; toggle.setAttribute('aria-expanded', String(on)); toggle.classList.toggle('open', on); }
    show(open);
    pickWrap.show = show;
    return h('div', { class: 'lb-pick-box' }, toggle, pickWrap);
  }
  function note(text, bad) { if (!pickNote) return; pickNote.textContent = text; pickNote.classList.toggle('bad', !!bad); }
  function choose(i) {
    if (i === (me.av | 0) && pending == null) { me.picked = true; store('me', me); if (pickWrap) pickWrap.show(false); return; }
    if (takenSet()[i]) return;
    pending = i; note('Grabbing the ' + Lobby.avatar(i).n + '…');
    if (picker) picker.update({ pending: i });
    if (conn) conn.send('pick', { id: me.id, av: i });
    clearTimeout(pendTimer);
    // No answer from the teacher's screen (an older page): take it if nobody else has it.
    pendTimer = setTimeout(function () { if (pending === i && !takenSet()[i]) { pending = null; setAv(i, true); } }, 3000);
  }
  function setAv(av, mine) {
    var changed = (me.av | 0) !== av;
    me.av = av;
    if (me.auto) me.name = funName(av);
    if (mine) { me.picked = true; note(''); beep(660, 0.12, 'triangle', 0.07); setTimeout(function () { beep(990, 0.14, 'triangle', 0.07); }, 90); if (pickWrap) pickWrap.show(false); }
    store('me', me);
    if (changed && conn) conn.track(meta());
    if (changed && redrawMe && root.querySelector('.lb-in')) redrawMe();
    if (picker) picker.update({ mine: av, pending: pending });
  }
  function applySeats(map) {
    avMap = map && typeof map === 'object' ? map : {};
    var mine = avMap[me.id];
    if (pending != null) {
      if (mine === pending) { pending = null; clearTimeout(pendTimer); setAv(mine, true); }
      else if (takenSet()[pending]) {
        var lost = pending; pending = null; clearTimeout(pendTimer);
        note('Someone just picked the ' + Lobby.avatar(lost).n + '. Try another one!', true);
        if (mine != null) setAv(mine);
      }
    } else if (typeof mine === 'number' && mine !== (me.av | 0)) setAv(mine);
    if (picker) picker.update({ mine: me.av | 0, taken: takenSet(), pending: pending });
    if (room) room.update(seatedPlayers());
  }

  // ---------- 3, 2, 1, Go! ----------
  function onCountdown(m) {
    if (!m || counting) return;
    counting = true; countedIn = true;
    Lobby.countdown({ title: m.title || 'Get Ready!', done: function () {
      counting = false;
      if (waitingPaint && state) { waitingPaint = false; cardKey = ''; onState(state); }
    } });
  }
  function removed() {
    if (conn) conn.close(); conn = null;
    store('me', null); store('card', null);
    state = null; cardKey = '';
    root.textContent = '';
    root.className = 'join-main is-over';
    root.append(h('div', { class: 'join-card join-wait' },
      h('h1', { text: 'You Left the Game' }),
      h('p', { class: 'join-lead', text: 'Your teacher took you out of this game. Ask your teacher, then join again with your first name.' }),
      h('button', { type: 'button', class: 'btn primary big', onclick: function () { me = null; paintEnter(); }, text: 'Join Again' })));
  }

  function onState(s) {
    if (!s || !Array.isArray(s.cards)) return;
    clearTimeout(findTimer);
    if (s.avs) applySeats(s.avs);
    // Everyone waits in the lobby until the teacher presses Start Game. (A game from an older teacher page
    // has no phase: it counts as the lobby until the first call.)
    var inLobby = s.phase === 'lobby' || (s.phase !== 'play' && !(s.called || []).length);
    if (inLobby) {
      s.phase = 'lobby';
      var fresh = !state || state.phase !== 'lobby' || state.g !== s.g;
      state = s; hostHere = true;
      if (fresh || !root.querySelector('.lb-in')) paintLobby();
      return;
    }
    // A countdown is running: the card deals in right after "Go!".
    if (counting) { state = s; waitingPaint = true; return; }
    // Joining a game that already started: a quick countdown first, never a card out of nowhere.
    if (!countedIn && !root.querySelector('.bc-play')) {
      state = s; waitingPaint = true;
      onCountdown({ title: 'Joining ' + (s.title || 'the Game') + '!' });
      return;
    }
    var first = !state || state.phase === 'lobby', key = s.g + ':' + s.round, prev = state && state.phase !== 'lobby' ? state : null;
    state = s; hostHere = true; room = null;
    if (key !== cardKey || first) {
      cardKey = key;
      cells = B.makeCard(s.cards.length, s.size, s.free, me.id + ':' + s.g + ':' + s.round);
      var saved = recall('card');
      marks = saved && saved.key === key ? saved.marks : cells.map(function () { return false; });
      lastN = -1;
      paintPlay(true);
      if (prev && prev.round !== s.round) toast('Round ' + s.round + '! Here’s a fresh card.');
    }
    paintCall();
    paintCalled();
    paintHost();
    // Someone else got Bingo
    var before = prev && prev.round === s.round ? (prev.winners || []).length : (s.winners || []).length;
    (s.winners || []).slice(before).forEach(function (n) { if (n !== me.name) friendWon(n); });
  }
  function paintPlay(deal) {
    var fl = document.querySelector('.lb-floaties'); if (fl) fl.remove();
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
        h('span', { class: 'join-who' }, window.Lobby ? h('span', { class: 'join-ava', 'aria-hidden': 'true', style: '--ac:' + Lobby.avatar(me.av).c }, Lobby.img(me.av)) : h('span', { class: 'join-dot', 'aria-hidden': 'true' }), me.name),
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
    if (marks[p] && !still) { el.classList.remove('stamp'); void el.offsetWidth; el.classList.add('stamp'); splat(el); }
    if (marks[p]) el.classList.remove('hot');
    // Each mark sounds a little higher than the last: the card "fills up" musically.
    var n = marks.filter(Boolean).length;
    if (marks[p]) { beep(440 + n * 28, 0.1, 'triangle', 0.08); setTimeout(function () { beep(660 + n * 28, 0.08, 'sine', 0.05); }, 60); }
    else beep(330, 0.09, 'triangle', 0.06);
    store('card', { key: cardKey, marks: marks });
    paintBingo();
  }
  // A burst of color dots out of the square you just marked.
  function splat(el) {
    var c = getComputedStyle(el).getPropertyValue('--dc') || '#F2643D';
    for (var i = 0; i < 8; i++) {
      var d = h('i', { class: 'bc-splat', 'aria-hidden': 'true' });
      var a = (i / 8) * Math.PI * 2 + Math.random() * .5, r = 30 + Math.random() * 26;
      d.style.setProperty('--dx', Math.cos(a) * r + 'px'); d.style.setProperty('--dy', Math.sin(a) * r + 'px'); d.style.setProperty('--c', c);
      el.append(d); setTimeout(function (x) { x.remove(); }.bind(null, d), 700);
    }
  }
  function ready() { return !!B.winLine(marks.map(function (m, p) { return m || cells[p] === -1; }), state.size, state.pattern); }
  function paintBingo() {
    var r = ready();
    bingoBtn.classList.toggle('ready', r);
    bingoBtn.disabled = !r;
    var togo = B.toGo(marks.map(function (m, p) { return m || cells[p] === -1; }), state.size, state.pattern);
    bingoBtn.querySelector('.jb-hint').textContent = r ? 'Tap to tell your teacher!' : togo === 1 ? 'So close! Just 1 more to go 👀' : (state.pattern === 'full' ? 'Mark every square' : state.pattern === 'corners' ? 'Mark all four corners' : 'Mark a full line') + ' · ' + togo + ' to go';
    bingoBtn.classList.toggle('close', !r && togo === 1);
    if (!r && togo === 1 && nearKey !== cardKey) { nearKey = cardKey; toast('One more and it’s Bingo! 👀'); beep(880, 0.12, 'sine', 0.06); }
    bingoBtn.setAttribute('aria-label', r ? 'Bingo! Tap to tell your teacher' : 'Bingo button. ' + togo + ' more to go');
  }
  var nearKey = '';
  function paintCall() {
    var L = state.last;
    if (!L) { callEl.className = 'join-call idle'; callEl.textContent = 'Get ready! Your teacher will call the first one soon.'; return; }
    if (L.n === lastN) return;
    var fresh = lastN !== -1;
    lastN = L.n;
    callEl.textContent = '';
    callEl.className = 'join-call' + (fresh && !still ? ' pop' : '');
    callEl.append(h('span', { class: 'join-call-n', text: 'Call ' + L.n }), h('span', { class: 'join-call-text' + (L.text.length > 50 ? ' long' : ''), text: L.text }));
    // Is it on my card? Light up that square and say so.
    var grid = gridBox ? gridBox.querySelectorAll('.bc-cell') : [], at = cells ? cells.indexOf(L.i) : -1;
    Array.prototype.forEach.call(grid, function (c) { c.classList.remove('hot'); });
    if (at >= 0 && !marks[at]) {
      if (grid[at]) grid[at].classList.add('hot');
      callEl.classList.add('have');
      callEl.append(h('span', { class: 'join-have', text: '🎯 It’s on your card! Find it and tap it!' }));
      if (fresh) { beep(660, 0.1, 'triangle', 0.08); setTimeout(function () { beep(990, 0.16, 'triangle', 0.08); }, 110); }
    } else {
      callEl.append(h('span', { class: 'join-not', text: at >= 0 ? 'Already marked ✓' : 'Not on your card this time' }));
      if (fresh) beep(740, 0.12, 'sine', 0.06);
    }
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
    hostEl.textContent = hostHere ? '' : 'Your teacher’s screen is away. Hang on a moment…';
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
  // Someone else got Bingo: their animal pops up with a little confetti.
  function friendWon(name) {
    var who = seatedPlayers().filter(function (p) { return Lobby.safeName(p.name, p.av) === name; })[0];
    var box = h('div', { class: 'join-friend', role: 'status' },
      who ? h('span', { class: 'join-friend-ava', style: '--ac:' + Lobby.avatar(who.av).c }, Lobby.img(who.av)) : null,
      h('span', null, h('b', { text: name }), ' got Bingo! 🎉'));
    if (!still) for (var i = 0; i < 16; i++) {
      var bit = h('i', { class: 'join-friend-bit' }); bit.style.setProperty('--a', (i * 22.5) + 'deg'); bit.style.setProperty('--c', B.COLS[i % 5]); box.append(bit);
    }
    document.body.append(box);
    [523, 784].forEach(function (f, i) { setTimeout(function () { beep(f, 0.18, 'triangle', 0.06); }, i * 120); });
    setTimeout(function () { box.classList.add('out'); setTimeout(function () { box.remove(); }, 400); }, 3200);
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
