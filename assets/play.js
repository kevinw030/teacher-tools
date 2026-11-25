// Sidekick Live student page (/play), Labs preview. A student types their class code, taps their name,
// types their 4-digit PIN and lands on their Student Home: their buddy, their badges, their game stats,
// and the live game their teacher is hosting. Students are not accounts: the page only talks to the
// lab_* functions in supabase/labs.sql, with the site's public key.
// Built for the youngest players: one big thing to do on each screen, big buttons, short words.
(function () {
  var P = window.Play = window.Play || {};
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root, sb = null, me = null, roster = null, homeHooks = [];

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
  P.h = h;
  function keep(k, v) { try { if (v == null) localStorage.removeItem('sl-' + k); else localStorage.setItem('sl-' + k, JSON.stringify(v)); } catch (e) {} }
  function recall(k) { try { return JSON.parse(localStorage.getItem('sl-' + k)); } catch (e) { return null; } }
  P.keep = keep; P.recall = recall;

  // ---------- Sounds (soft, made on the spot) ----------
  var audio;
  function beep(f, len, type, vol, at) {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + (at || 0);
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol || 0.08, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + (len || 0.2));
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + (len || 0.2) + 0.03);
    } catch (e) {}
  }
  P.sound = function (name) {
    if (name === 'tap') beep(880, 0.07, 'triangle', 0.06);
    else if (name === 'good') { beep(659, 0.3, 'sine', 0.12); beep(988, 0.5, 'sine', 0.12, 0.1); }
    else if (name === 'bad') { beep(311, 0.25, 'triangle', 0.1); beep(233, 0.4, 'triangle', 0.1, 0.12); }
    else if (name === 'win') [523, 659, 784, 1047, 1319].forEach(function (f, i) { beep(f, 0.45, 'triangle', 0.09, i * 0.1); });
    else if (name === 'coin') { beep(988, 0.1, 'triangle', 0.09); beep(1319, 0.4, 'triangle', 0.09, 0.07); }
  };

  // ---------- Database ----------
  function client() {
    var C = window.TT_ACCOUNT_CONFIG || {};
    if (!C.supabaseUrl || !C.supabaseKey) return Promise.reject(new Error('off'));
    if (sb) return Promise.resolve(sb);
    return new Promise(function (ok, fail) {
      if (window.supabase && window.supabase.createClient) return ok();
      var s = document.createElement('script'); s.src = LIB; s.onload = ok; s.onerror = function () { fail(new Error('offline')); };
      document.head.append(s);
    }).then(function () {
      sb = sb || window.supabase.createClient(C.supabaseUrl, C.supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'sl-student' }
      });
      return sb;
    });
  }
  P.client = client;
  P.clientNow = function () { return sb; };
  function rpc(name, args) {
    return client().then(function (c) { return c.rpc(name, args); }).then(function (r) {
      if (r.error) throw r.error;
      return r.data;
    });
  }
  P.rpc = rpc;
  P.token = function () { return recall('token'); };
  P.me = function () { return me; };
  P.onHome = function (fn) { homeHooks.push(fn); };

  // ---------- Pieces every screen uses ----------
  function screen(cls) {
    root.className = 'pl-main ' + (cls || '');
    root.textContent = '';
    window.scrollTo(0, 0);
    return root;
  }
  P.screen = screen;
  function mascot(mood) {
    if (!window.TT || !TT.mascot) return null;
    var m = TT.mascot({ mood: mood || 'wave' });
    if (mood === 'wave') setTimeout(function () { m.mood('idle'); }, 2200);
    return h('div', { class: 'pl-mascot', 'aria-hidden': 'true' }, m);
  }
  P.mascot = mascot;
  function bigBtn(text, cls, onclick, icon) {
    return h('button', { type: 'button', class: 'pl-btn ' + (cls || ''), onclick: function (e) { P.sound('tap'); onclick(e); } },
      icon ? h('span', { class: 'pl-btn-ico', 'aria-hidden': 'true', html: icon }) : null, h('span', { text: text }));
  }
  P.bigBtn = bigBtn;
  var ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h11v14H9l-6-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/></svg>',
    brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l6 6-8 8H6v-6z"/><path d="M11 7l6 6"/></svg>',
    medal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="6"/><path d="M8.5 9 6 3h4l2 4 2-4h4l-2.5 6"/></svg>',
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/></svg>'
  };
  P.ICON = ICON;
  function backBtn(text, onclick) {
    return h('button', { type: 'button', class: 'pl-back', onclick: function () { P.sound('tap'); onclick(); } },
      h('span', { 'aria-hidden': 'true', html: ICON.back }), h('span', { text: text || 'Back' }));
  }
  P.backBtn = backBtn;
  function oops(text) { return h('p', { class: 'pl-oops', role: 'alert', text: text || '' }); }
  function shake(el) { if (!el || still) return; el.classList.remove('pl-shake'); void el.offsetWidth; el.classList.add('pl-shake'); }
  P.shake = shake;
  function buddyOf(st) { return window.Buddy ? Buddy.of(st.buddy, st.id || st.name) : null; }
  P.buddyOf = buddyOf;

  // Class codes look like KTP-4829: three letters, then four numbers.
  function tidyCode(v) {
    var s = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    var letters = s.replace(/[^A-Z]/g, '').slice(0, 3), nums = s.replace(/[^0-9]/g, '').slice(0, 4);
    return letters + (letters.length === 3 || nums ? '-' : '') + nums;
  }

  // ---------- 1. The class code ----------
  function paintCode(msg) {
    var r = screen('is-code');
    var input = h('input', { class: 'pl-code-in', type: 'text', inputmode: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
      maxlength: 8, placeholder: 'ABC-1234', 'aria-label': 'Class code' });
    var err = oops(msg);
    input.addEventListener('input', function () {
      var at = input.value; input.value = tidyCode(at); err.textContent = '';
      if (/^[A-Z]{3}-\d{4}$/.test(input.value)) go();
    });
    var goBtn = bigBtn('Go!', 'go', function () { go(); }, ICON.play);
    function go() {
      var code = tidyCode(input.value);
      if (!/^[A-Z]{3}-\d{4}$/.test(code)) { err.textContent = 'Type all 7 parts of the code, like ABC-1234.'; shake(input); return; }
      goBtn.disabled = true; input.disabled = true;
      loadRoster(code).then(function (ok) {
        if (ok) return;
        goBtn.disabled = false; input.disabled = false; input.focus();
      });
    }
    r.append(h('div', { class: 'pl-card pl-enter' },
      mascot('wave'),
      h('h1', { class: 'pl-title', text: 'Type Your Class Code' }),
      h('p', { class: 'pl-sub', text: 'It’s on your teacher’s screen.' }),
      h('form', { class: 'pl-code-form', onsubmit: function (e) { e.preventDefault(); go(); } }, input, goBtn),
      err));
    setTimeout(function () { input.focus(); }, 60);
  }

  function loadRoster(code) {
    return rpc('lab_roster', { p_code: code }).then(function (d) {
      if (!d || d.error) {
        var e = d && d.error;
        var msg = e === 'slow' ? 'Too many tries. Wait a few minutes, then try again.' : e === 'locked' ? 'This class is closed right now. Ask your teacher.' : 'Hmm, that code didn’t work. Check it and try again.';
        keep('code', null); paintCode(msg); shake(root.querySelector('.pl-code-in'));
        return false;
      }
      roster = { code: code, name: d['class'], students: d.students || [] };
      keep('code', code);
      paintNames();
      return true;
    }, function () { paintCode('We can’t reach the internet right now. Try again in a moment.'); return false; });
  }

  // ---------- 2. Tap your name ----------
  function paintNames() {
    var r = screen('is-names');
    var grid = h('div', { class: 'pl-names', role: 'list' });
    roster.students.forEach(function (s, i) {
      var b = h('button', { type: 'button', class: 'pl-name', role: 'listitem', style: '--i:' + i, onclick: function () { P.sound('tap'); paintPin(s); } },
        window.Buddy ? Buddy.el(buddyOf(s), 'pl-name-buddy') : null,
        h('span', { class: 'pl-name-t', text: s.name }));
      grid.append(b);
    });
    if (!roster.students.length) grid.append(h('p', { class: 'pl-sub', text: 'Your teacher hasn’t added names yet.' }));
    r.append(h('div', { class: 'pl-head' },
      h('div', null, h('p', { class: 'pl-kicker', text: roster.name }), h('h1', { class: 'pl-title', text: 'Tap Your Name' })),
      backBtn('New Code', function () { keep('code', null); roster = null; paintCode(); })), grid);
  }

  // ---------- 3. Your secret number ----------
  function paintPin(st) {
    var r = screen('is-pin');
    var pin = '', busy = false, waitTimer = null;
    var dots = h('div', { class: 'pl-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i'));
    var live = h('p', { class: 'pl-pin-msg', role: 'status', 'aria-live': 'polite', text: 'Type your 4 secret numbers.' });
    var pad = h('div', { class: 'pl-pad' });
    function paint() { [].forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i < pin.length); }); }
    function press(k) {
      if (busy) return;
      P.sound('tap');
      if (k === 'del') pin = pin.slice(0, -1);
      else if (pin.length < 4) pin += k;
      paint();
      if (pin.length === 4) check();
    }
    function check() {
      busy = true; pad.classList.add('busy');
      rpc('lab_sign_in', { p_code: roster.code, p_student: st.id, p_pin: pin }).then(function (d) {
        busy = false; pad.classList.remove('busy');
        if (d && d.token) { keep('token', d.token); P.sound('good'); return loadMe(); }
        pin = ''; paint(); shake(dots); P.sound('bad');
        if (d && d.error === 'pin') live.textContent = d.left > 0 ? 'Oops! That’s not it. Try again.' : 'Too many tries. Ask your teacher for help.';
        else if (d && d.error === 'paused') wait(d.seconds || 300);
        else { live.textContent = 'Something went wrong. Pick your name again.'; setTimeout(paintNames, 1600); }
        if (d && d.error === 'pin' && d.left <= 0) wait(300);
      }, function () { busy = false; pad.classList.remove('busy'); pin = ''; paint(); live.textContent = 'We can’t reach the internet. Try again.'; });
    }
    function wait(sec) {
      busy = true; pad.classList.add('busy');
      var end = Date.now() + sec * 1000;
      (function tick() {
        var left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        live.textContent = 'Too many tries. Ask your teacher, or wait ' + Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2) + '.';
        if (left <= 0) { busy = false; pad.classList.remove('busy'); live.textContent = 'Type your 4 secret numbers.'; return; }
        waitTimer = setTimeout(tick, 1000);
      })();
    }
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'del'].forEach(function (k) {
      if (k === 'back') { pad.append(h('span')); return; }
      pad.append(h('button', { type: 'button', class: 'pl-key' + (k === 'del' ? ' del' : ''), 'aria-label': k === 'del' ? 'Erase' : k,
        html: k === 'del' ? ICON.del : null, text: k === 'del' ? null : k, onclick: function () { press(k); } }));
    });
    function onKey(e) {
      if (!document.body.contains(pad)) { document.removeEventListener('keydown', onKey); clearTimeout(waitTimer); return; }
      if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del');
    }
    document.addEventListener('keydown', onKey);
    r.append(h('div', { class: 'pl-card pl-pin' },
      backBtn('Not Me', function () { paintNames(); }),
      window.Buddy ? Buddy.el(buddyOf(st), 'pl-pin-buddy') : null,
      h('h1', { class: 'pl-title', text: 'Hi, ' + st.name + '!' }),
      dots, live, pad));
  }

  // ---------- 4. Student Home ----------
  function loadMe() {
    var tok = recall('token');
    if (!tok) { start(); return Promise.resolve(); }
    return rpc('lab_me', { p_token: tok }).then(function (d) {
      if (!d || d.error) { keep('token', null); me = null; start(); return; }
      me = d; me.buddy = buddyOf(d);
      paintHome();
    }, function () {
      var r = screen('is-code');
      r.append(h('div', { class: 'pl-card pl-enter' }, mascot('think'), h('h1', { class: 'pl-title', text: 'No Internet' }),
        h('p', { class: 'pl-sub', text: 'We can’t reach ED Sidekick right now.' }), bigBtn('Try Again', 'go', loadMe)));
    });
  }
  P.reload = loadMe;

  function stat(n, label, color) {
    return h('div', { class: 'pl-stat', style: '--sc:' + color }, h('b', { text: (+n || 0).toLocaleString() }), h('span', { text: label }));
  }
  function paintHome() {
    var r = screen('is-home');
    var st = me.stats || {}, earned = Object.keys(me.badges || {}).filter(function (k) { return window.LabBadges && LabBadges.byKey[k]; });
    var gameSlot = h('div', { class: 'pl-game-slot' });
    var hero = h('section', { class: 'pl-hero' },
      h('button', { type: 'button', class: 'pl-hero-buddy', 'aria-label': 'Change my buddy', onclick: function () { P.sound('tap'); paintBuddy(); } },
        Buddy.el(me.buddy, 'big'), h('span', { class: 'pl-hero-edit', 'aria-hidden': 'true', html: ICON.brush })),
      h('div', { class: 'pl-hero-text' }, h('p', { class: 'pl-kicker', text: me['class'] }), h('h1', { class: 'pl-title', text: 'Hi, ' + me.name + '!' }),
        h('div', { class: 'pl-shelf-mini', 'aria-label': earned.length + ' badges' }, earned.slice(-5).map(function (k) { return h('span', { html: LabBadges.svg(k, true) }); }))));
    var tiles = h('div', { class: 'pl-tiles' },
      h('button', { type: 'button', class: 'pl-tile t-buddy', onclick: function () { P.sound('tap'); paintBuddy(); } },
        h('span', { class: 'pl-tile-ico', html: ICON.brush }), h('b', { text: 'My Buddy' }), h('span', { text: 'Change how you look' })),
      h('button', { type: 'button', class: 'pl-tile t-badge', onclick: function () { P.sound('tap'); paintBadges(); } },
        h('span', { class: 'pl-tile-ico', html: ICON.medal }), h('b', { text: 'My Badges' }), h('span', { text: earned.length + ' of ' + LabBadges.LIST.length + ' earned' })));
    var stats = h('div', { class: 'pl-stats' },
      stat(st.games, 'Games Played', '#3FA9F5'), stat(st.right, 'Right Answers', '#22C3A6'), stat(st.best_streak, 'Best Streak', '#FF7A59'));
    r.append(hero, gameSlot, tiles, stats,
      h('button', { type: 'button', class: 'pl-signout', onclick: signOut, text: 'Not ' + me.name + '? Sign Out' }));
    homeHooks.forEach(function (fn) { try { fn(gameSlot, me); } catch (e) { console.error(e); } });
  }
  P.home = function () { if (me) paintHome(); else loadMe(); };

  function signOut() {
    var tok = recall('token');
    keep('token', null); me = null;
    if (tok) rpc('lab_sign_out', { p_token: tok }).catch(function () {});
    if (P.onSignOut) P.onSignOut();
    start();
  }

  // ---------- 5. My Buddy ----------
  function paintBuddy() {
    var r = screen('is-buddy');
    var box = h('div', { class: 'pl-bm' }), saved = JSON.stringify(me.buddy), msg = h('p', { class: 'pl-pin-msg', role: 'status' });
    var ed = Buddy.editor(box, me.buddy, { badges: me.badges || {}, badgeName: LabBadges.name, onChange: function () { save.disabled = JSON.stringify(ed.value()) === saved; } });
    var save = bigBtn('Save My Buddy', 'go', function () {
      save.disabled = true;
      var tok = recall('token'), b = ed.value();
      rpc('lab_save_buddy', { p_token: tok, p_buddy: b }).then(function (d) {
        if (d && d.ok) {
          var first = !(me.badges || {}).buddy;
          me.buddy = b; me.badges = me.badges || {};
          if (first) me.badges.buddy = new Date().toISOString().slice(0, 10);
          P.sound('win'); saved = JSON.stringify(b);
          if (first) { celebrateBadge('buddy', paintHome); return; }
          paintHome();
        } else if (d && d.error === 'signed_out') { keep('token', null); start(); }
        else { msg.textContent = 'That didn’t save. Try again.'; save.disabled = false; }
      }, function () { msg.textContent = 'We can’t reach the internet. Try again.'; save.disabled = false; });
    }, ICON.play);
    save.disabled = true;
    r.append(h('div', { class: 'pl-head' }, h('h1', { class: 'pl-title', text: 'My Buddy' }), backBtn('Home', paintHome)),
      box, h('div', { class: 'pl-row' }, bigBtn('Surprise Me', 'soft', function () { ed.surprise(); }, ICON.dice), save), msg);
  }

  // A big "You Earned a Badge!" moment.
  function celebrateBadge(key, done) {
    var b = LabBadges.byKey[key];
    var layer = h('div', { class: 'pl-earn', role: 'dialog', 'aria-label': 'You earned a badge' },
      h('div', { class: 'pl-earn-card' },
        h('p', { class: 'pl-kicker', text: 'New Badge!' }),
        h('div', { class: 'pl-earn-medal', html: LabBadges.svg(key, true) }),
        h('h2', { class: 'pl-title', text: b.name }), h('p', { class: 'pl-sub', text: b.how }),
        bigBtn('Yay!', 'go', function () { layer.remove(); if (done) done(); })));
    document.body.append(layer);
    if (window.TT && TT.confetti) try { TT.confetti(layer); } catch (e) {}
  }
  P.celebrateBadge = celebrateBadge;

  // ---------- 6. My Badges ----------
  function paintBadges() {
    var r = screen('is-badges');
    var have = me.badges || {};
    var shelf = h('div', { class: 'pl-badges' });
    LabBadges.LIST.forEach(function (b) {
      var on = !!have[b[0]];
      shelf.append(h('div', { class: 'pl-badge' + (on ? ' on' : '') },
        h('span', { class: 'pl-badge-medal', html: LabBadges.svg(b[0], on) }),
        h('b', { text: b[1] }), h('span', { text: on ? 'Earned ' + niceDate(have[b[0]]) : b[2] })));
    });
    var n = LabBadges.LIST.filter(function (b) { return have[b[0]]; }).length;
    r.append(h('div', { class: 'pl-head' }, h('div', null, h('p', { class: 'pl-kicker', text: n + ' of ' + LabBadges.LIST.length + ' Earned' }), h('h1', { class: 'pl-title', text: 'My Badges' })),
      backBtn('Home', paintHome)), shelf);
  }
  function niceDate(d) { try { var p = String(d).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch (e) { return ''; } }

  // ---------- Start ----------
  function start() {
    root = document.getElementById('play');
    var C = window.TT_ACCOUNT_CONFIG || {};
    if (!C.supabaseUrl) { screen('is-code').append(h('div', { class: 'pl-card' }, h('h1', { class: 'pl-title', text: 'Not Switched On Yet' }))); return; }
    // A class code in the link (from the QR code on the board): /play?c=KTP-4829
    var q = new URLSearchParams(location.search).get('c');
    if (q) { history.replaceState(null, '', location.pathname); keep('token', null); loadRoster(tidyCode(q)); return; }
    if (recall('token')) { loadMe(); return; }
    var saved = recall('code');
    if (saved) { loadRoster(saved); return; }
    paintCode();
  }
  P.start = start;
})();
