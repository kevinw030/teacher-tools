// Accounts, cloud saving and plans.
// Everything a tool saves goes through TT.save into this browser ("tt:" keys). When a teacher
// signs in, those keys are also copied into their account (one row in Supabase), and copied
// back down on any other computer they sign in on. Guests keep using the site exactly as before.
(function () {
  var TT = window.TT, h = TT.h;
  var CFG = window.TT_ACCOUNT_CONFIG || {};
  var enabled = !!(CFG.supabaseUrl && CFG.supabaseKey);
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';

  // ---------- Plans ----------
  // screens: saved board screens. classes: class lists. trivia: own trivia questions. tickets: past exit tickets kept.
  // premium: tools and rooms that only Premium opens (see assets/premium.js). saveBoard: the board remembers your screens.
  var PLANS = {
    open: { screens: Infinity, classes: Infinity, trivia: Infinity, tickets: 50, photo: true, premium: true, saveBoard: true }, // accounts switched off
    free: { screens: 2, classes: 2, trivia: 0, tickets: 5, photo: true, premium: false, saveBoard: true },
    premium: { screens: Infinity, classes: Infinity, trivia: Infinity, tickets: 50, photo: true, premium: true, saveBoard: true }
  };
  PLANS.owner = PLANS.premium;
  // Not signed in: everything works, but the board keeps only the screen on show and forgets it when the page closes.
  PLANS.guest = { screens: 1, classes: 2, trivia: 0, tickets: 5, photo: true, premium: false, saveBoard: false };
  TT.PLANS = PLANS;

  // What each plan includes. The pricing tab and the Premium pop-up both read these lists.
  TT.PLAN_FEATURES = {
    free: [
      ['Every Board Widget and Daily Tool'],
      ['Every Game but Trivia Showdown', 'Including all four math races'],
      ['Saves to Your Account', 'Use it on any computer'],
      [PLANS.free.screens + ' Saved Board Screens'],
      [PLANS.free.classes + ' Class Lists'],
      ['Your Own Photo Backgrounds'],
      ['The Locked Library Escape Room', 'New questions for each grade every time you play'],
      ['Your Own Would You Rather Questions', 'As many as you like'],
      ['The Last ' + PLANS.free.tickets + ' Exit Tickets']
    ],
    premium: [
      ['Unlimited Saved Board Screens'],
      ['Unlimited Class Lists'],
      ['All 4 Escape Rooms', 'Space Station, Pirate Treasure and Museum too'],
      ['Edit the Questions in Any Room', 'Match a room to this week\'s lesson'],
      ['Seating Chart', 'Build your room and seat your class'],
      ['Prompts', 'Writing, discussion and This or That by grade'],
      ['Trivia Showdown', 'Quiz-show game for 1 to 4 teams, with your own questions too'],
      ['Your Own Bingo Word Lists', 'Any words you teach, with clues, saved for next time'],
      ['Customize Your Home Page', 'Your own categories, with tiles in your order'],
      ['Customize Morning Meeting', 'Move the tiles and add extra widgets'],
      ['The Last ' + PLANS.premium.tickets + ' Exit Tickets']
    ],
    // The Premium plan (Coming Soon): shown on the pricing tab only.
    top: [
      ['Live Quiz Games', 'Students join on their own devices with a class code'],
      ['Fun Game Modes', 'Races, team games and more, all with your questions'],
      ['Your Own Question Sets', 'Type them in or paste them from a spreadsheet'],
      ['Game Reports', 'See which questions your class missed']
    ]
  };

  // ---------- Small saved notes about the account (not synced, not in backups) ----------
  var META_KEY = 'tt-account';
  var meta = (function () { try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { return {}; } })();
  function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} }

  var sb = null, user = null, known = false, listeners = [], status = 'idle', pushTimer = null, changeSeq = 0, pushing = false, newerWaiting = false;

  TT.account = {
    enabled: enabled,
    config: CFG,
    user: function () { return user; },
    signedIn: function () { return !!user; },
    email: function () { return user ? user.email : meta.email || ''; },
    // plan() is what the site shows. The owner can preview the site as Free or Premium (viewAs);
    // realPlan() is always the plan saved in the account, and the database checks that one, not this.
    plan: function () { var p = realPlan(); return p === 'owner' && (meta.viewAs === 'free' || meta.viewAs === 'premium') ? meta.viewAs : p; },
    realPlan: function () { return realPlan(); },
    viewAs: function () { return realPlan() === 'owner' ? meta.viewAs || '' : ''; },
    setViewAs: function (p) { meta.viewAs = p === 'free' || p === 'premium' ? p : ''; saveMeta(); location.reload(); },
    client: function () { return sb; },
    isPremium: function () { var p = TT.account.plan(); return p === 'premium' || p === 'owner' || p === 'open'; },
    status: function () { return status; },
    onChange: function (fn) { listeners.push(fn); },
    classSync: classSync,
    setClassSync: function (on) { TT.settings.syncClasses = !!on; TT.saveSettings(); changed('tt:classes'); emit(); }
  };
  function realPlan() { return !enabled ? 'open' : user || meta.userId ? (meta.plan || 'free') : 'guest'; }
  TT.limit = function (name) { return PLANS[TT.account.plan()][name]; };
  // For trimming saved things: always the real plan, so previewing Free never deletes the owner's work.
  TT.storeLimit = function (name) { return PLANS[realPlan()][name]; };

  // Prices from account-config.js, shared by the pricing tab and the Premium pop-up.
  // mo/yr are Plus; topMo/topYr are the Premium plan. early() is a price with the Early Access discount, to the cent.
  TT.account.prices = function () {
    function num(v, d) { return parseFloat(String(v == null ? d : v).replace(/[^0-9.]/g, '')) || 0; }
    var mo = num(CFG.priceMonthly, '3.99'), yr = num(CFG.priceYearly, '34.99');
    var topMo = num(CFG.topPriceMonthly, '7.99'), topYr = num(CFG.topPriceYearly, '71.99');
    var until = new Date((CFG.earlyUntil || '2027-01-01') + 'T00:00:00');
    var early = { mo: num(CFG.earlyPriceMonthly, '2.99'), yr: num(CFG.earlyPriceYearly, '29.99'),
      topMo: num(CFG.topEarlyPriceMonthly, '5.99'), topYr: num(CFG.topEarlyPriceYearly, '61.99') };
    var offMo = CFG.earlyOffMonthly || 0.25, offYr = CFG.earlyOffYearly || 0.37;
    return { mo: mo, yr: yr, topMo: topMo, topYr: topYr, earlyOpen: new Date() < until, earlyPrices: early, offMo: offMo, offYr: offYr,
      // One plan's price for a billing period. Early Access monthly is crossed out against the monthly price,
      // and early yearly against twelve months (about 37% off twelve months).
      price: function (top, yearly, isEarly) {
        var full = top ? (yearly ? topYr : topMo) : (yearly ? yr : mo);
        if (!isEarly) return { now: full, was: 0 };
        var e = early[(top ? 'top' : '') + (yearly ? (top ? 'Yr' : 'yr') : (top ? 'Mo' : 'mo'))];
        return { now: e, was: yearly ? (top ? topMo : mo) * 12 : full, off: yearly ? offYr : offMo };
      },
      untilText: new Date(until.getTime() - 86400000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
      save: mo && yr ? Math.round((1 - yr / (mo * 12)) * 100) : 0 };
  };
  // What members see for each plan. Inside the code and database, Plus is still called 'premium'.
  TT.planName = function (p) { return p === 'owner' ? 'Owner' : p === 'premium' ? 'Plus' : p === 'top' ? 'Premium' : 'Free'; };
  // "Everything in Free, Plus:" with the word Plus in gold.
  TT.planLead = function (text, cls) {
    var parts = String(text).split(/(Plus)/);
    return h('p', { class: cls }, parts.map(function (t) { return t === 'Plus' ? h('span', { class: 'plan-plus', text: t }) : t; }));
  };
  TT.money = function (n) { return '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); };
  Object.defineProperty(TT.config, 'maxScreens', { get: function () { return TT.limit('screens'); }, configurable: true });

  // A short "See Plans" note for places that hit a free-plan limit.
  TT.upsell = function (text) {
    return h('p', { class: 'upsell' }, h('span', { text: text + ' ' }), h('a', { href: '/account', text: TT.account.signedIn() ? 'Get Plus' : 'See Plans',
      onclick: function () { TT.account.wantPlans = true; if (TT.page() === 'account' && TT.account.openPlans) TT.account.openPlans(); } }));
  };

  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); paintNav(); }
  function setStatus(s) { if (s === status) return; status = s; emit(); }
  // True while a fresh sign-in is fetching what the account has saved (the page reloads once when it
  // arrives), and on a page load before the site has heard back about who is signed in.
  var syncing = false, reloading = false;
  TT.account.loading = function () { return syncing || reloading || (!known && !!meta.userId); };

  // ---------- Which keys go online ----------
  function classSync() {
    if (CFG.classSync === 'always') return true;
    if (CFG.classSync === 'never') return false;
    return !!TT.settings.syncClasses;
  }
  // Keys that can hold students' names: class lists, class jobs, seating charts, named exit tickets.
  var CLASS_KEYS = { 'tt:classes': 1, 'tt:roster': 1, 'tt:jobs': 1, 'tt:seating': 1, 'tt:tickets': 1 };
  var NEVER = { 'tt:space-test': 1 };
  function synced(k) { return k.indexOf('tt:') === 0 && !NEVER[k] && (classSync() || !CLASS_KEYS[k]); }
  function collect() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!synced(k)) continue;
        var v = localStorage.getItem(k);
        if (k === 'tt:pet' && !classSync()) {
          try { var p = JSON.parse(v); if (p && p.helper) { delete p.helper; v = JSON.stringify(p); } } catch (e) {}
        }
        out[k] = v;
      }
    } catch (e) {}
    return out;
  }
  function apply(data) {
    var keepHelper = null;
    try {
      if (!classSyncIn(data || {})) { var p = JSON.parse(localStorage.getItem('tt:pet')); keepHelper = p && p.helper; }
      var withClasses = classSyncIn(data || {}), drop = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf('tt:') === 0 && !NEVER[k] && (!CLASS_KEYS[k] || withClasses)) drop.push(k);
      }
      drop.forEach(function (k) { localStorage.removeItem(k); });
      Object.keys(data || {}).forEach(function (k) {
        if (k.indexOf('tt:') !== 0 || NEVER[k]) return;
        if (CLASS_KEYS[k] && !withClasses) return;
        localStorage.setItem(k, data[k]);
      });
      if (keepHelper) { var q = JSON.parse(localStorage.getItem('tt:pet')); if (q) { q.helper = keepHelper; localStorage.setItem('tt:pet', JSON.stringify(q)); } }
    } catch (e) {}
  }
  // The account's own settings say whether class lists sync, so honor them when they arrive.
  function classSyncIn(data) {
    if (CFG.classSync !== 'choose') return CFG.classSync === 'always';
    try { return !!JSON.parse(data['tt:settings']).syncClasses; } catch (e) { return false; }
  }

  // ---------- Saving ----------
  var rawSave = TT.save;
  TT.save = function (key, value) { rawSave(key, value); changed('tt:' + key); };
  // For code that writes to localStorage directly (board photo, backup file).
  TT.changed = function (k) { changed(k || 'tt:*'); };
  function changed(k) {
    if (!enabled || !meta.userId) return;
    if (k !== 'tt:*' && !synced(k) && !CLASS_KEYS[k]) return;
    changeSeq++;
    if (!meta.dirty) { meta.dirty = true; saveMeta(); }
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 2500);
    if (status !== 'saving') setStatus('unsaved');
  }
  function push() {
    if (!sb || !user || pushing) { if (user && !pushing) setStatus('offline'); return; }
    pushing = true; setStatus('saving');
    var seq = changeSeq;
    sb.from('user_data').upsert({ user_id: user.id, data: collect() }).select('updated_at').single().then(function (res) {
      pushing = false;
      if (res.error) { setStatus(navigator.onLine === false ? 'offline' : 'error'); return; }
      meta.pulledAt = res.data.updated_at;
      if (seq === changeSeq) { meta.dirty = false; setStatus('saved'); } else { pushTimer = setTimeout(push, 1000); }
      saveMeta();
    }, function () { pushing = false; setStatus('offline'); });
  }
  window.addEventListener('pagehide', function () { if (meta.dirty) push(); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') { if (meta.dirty) push(); }
    else check(false);
  });
  window.addEventListener('online', function () { if (meta.dirty) push(); else check(false); });

  // ---------- Loading from the account ----------
  // firstLoad: apply newer saved data right away. Otherwise offer it with a banner,
  // so a running timer or game isn't interrupted.
  function check(firstLoad) {
    if (!sb || !user) return;
    sb.from('user_data').select('data, updated_at').eq('user_id', user.id).maybeSingle().then(function (res) {
      var wasSyncing = syncing; syncing = false;
      if (res.error) { setStatus('offline'); if (wasSyncing) emit(); return; }
      var row = res.data;
      if (meta.userId !== user.id) {
        // First time this account is used on this computer.
        meta.userId = user.id; meta.email = user.email;
        if (!row) { meta.dirty = true; saveMeta(); push(); return; } // new account: upload what's here
        try { localStorage.setItem('tt-before-signin', JSON.stringify(collect())); } catch (e) {}
        apply(row.data); meta.pulledAt = row.updated_at; meta.dirty = false; saveMeta();
        reloading = true; location.reload(); return;
      }
      if (!row || meta.dirty) { if (meta.dirty || !row) push(); return; }
      if (row.updated_at !== meta.pulledAt) {
        if (firstLoad) { apply(row.data); meta.pulledAt = row.updated_at; saveMeta(); reloading = true; emit(); location.reload(); return; }
        newerWaiting = row; showNewer();
        return;
      }
      setStatus('saved');
      if (wasSyncing) emit();
    }, function () { syncing = false; setStatus('offline'); emit(); });
  }
  var banner = null;
  function showNewer() {
    if (banner) return;
    banner = h('div', { class: 'sync-banner', role: 'status' },
      h('span', { text: 'You made changes on another computer.' }),
      TT.button('Load Them', { kind: 'primary small', onclick: function () {
        apply(newerWaiting.data); meta.pulledAt = newerWaiting.updated_at; meta.dirty = false; saveMeta(); location.reload();
      } }),
      TT.button('Not Now', { kind: 'small', onclick: function () { banner.remove(); banner = null; } }));
    document.body.append(banner);
  }

  function loadPlan() {
    if (!sb || !user) return;
    sb.from('profiles').select('plan').eq('id', user.id).maybeSingle().then(function (res) {
      if (res.error || !res.data) return;
      if (meta.plan !== res.data.plan) {
        meta.plan = res.data.plan;
        if (res.data.plan !== 'free' && paying()) { try { sessionStorage.removeItem('tt-paid'); } catch (e) {} TT.account.justPaid = true; }
        saveMeta(); emit();
      }
    });
  }
  // Coming back from Stripe: the plan turns on a few seconds later, when Stripe tells the server.
  function paying() {
    try { var t = +sessionStorage.getItem('tt-paid'); return !!t && Date.now() - t < 3 * 60 * 1000; } catch (e) { return false; }
  }
  TT.account.paying = function () { return paying() && TT.account.plan() === 'free'; };
  var paidTimer = null;
  function watchPaid() {
    if (paidTimer || !paying()) return;
    var tries = 0;
    paidTimer = setInterval(function () {
      tries++;
      if (!paying() || TT.account.plan() !== 'free' || tries > 30) { clearInterval(paidTimer); paidTimer = null; emit(); return; }
      loadPlan();
    }, 3000);
  }

  // ---------- Sign in and out ----------
  var base = location.origin + location.pathname;
  // Coming back from a "reset password" email, or from a link that failed (expired or used).
  var linkError = '';
  (function () {
    var q = location.search + '&' + location.hash.replace(/^#/, '');
    var m = q.match(/error_description=([^&]+)/);
    if (m) {
      linkError = decodeURIComponent(m[1].replace(/\+/g, ' '));
      if (/expired|invalid/i.test(linkError)) linkError = 'That email link has expired or was already used. Please try again.';
      history.replaceState(null, '', '/account');
    }
    if (/[?&]reset=1/.test(location.search)) { try { sessionStorage.setItem('tt-reset', '1'); } catch (e) {} }
    if (/[?&]paid=1/.test(location.search)) {
      try { sessionStorage.setItem('tt-paid', String(Date.now())); } catch (e) {}
      history.replaceState(null, '', '/account');
    }
  })();
  function resetting() { try { return sessionStorage.getItem('tt-reset') === '1'; } catch (e) { return false; } }
  function friendly(err) {
    var m = (err && err.message) || '';
    if (/invalid login credentials/i.test(m)) return 'That email and password don’t match. Try again, or choose Forgot Password.';
    if (/email not confirmed/i.test(m)) return 'Please confirm your email first. Tap the link in the email we sent you.';
    if (/already registered|already been registered|user already exists/i.test(m)) return 'There’s already an account with that email. Choose Log In instead.';
    if (/password should be|weak password|at least/i.test(m)) return 'Choose a password with at least 8 characters.';
    if (/rate limit|too many|security purposes/i.test(m)) return 'Too many tries just now. Please wait a minute and try again.';
    return m ? 'That didn’t work: ' + m : 'That didn’t work. Please try again.';
  }
  TT.account.signUp = function (name, email, password) {
    return sb.auth.signUp({ email: email, password: password, options: { data: { first_name: name }, emailRedirectTo: base } });
  };
  TT.account.logIn = function (email, password) {
    return sb.auth.signInWithPassword({ email: email, password: password });
  };
  TT.account.forgot = function (email) {
    return sb.auth.resetPasswordForEmail(email, { redirectTo: base + '?reset=1' });
  };
  TT.account.setPassword = function (password) {
    return sb.auth.updateUser({ password: password });
  };
  TT.account.firstName = function () {
    return (user && user.user_metadata && (user.user_metadata.first_name || (user.user_metadata.full_name || user.user_metadata.name || '').split(' ')[0])) || meta.firstName || '';
  };
  TT.account.sendCode = function (email) {
    return sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: base } });
  };
  TT.account.verifyCode = function (email, code) {
    return sb.auth.verifyOtp({ email: email, token: code, type: 'email' });
  };
  TT.account.google = function () {
    try { sessionStorage.setItem('tt-after-google', '1'); } catch (e) {}
    return sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: base } });
  };
  TT.account.signOut = function () {
    function done() {
      try {
        var drop = [];
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (synced(k)) drop.push(k); }
        drop.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
      meta = {}; saveMeta();
      var after = function () { location.href = '/'; };
      if (sb) sb.auth.signOut().then(after, after); else after();
    }
    if (meta.dirty && sb && user) {
      sb.from('user_data').upsert({ user_id: user.id, data: collect() }).then(done, done);
    } else done();
  };
  // Deletes the signed-in account and everything saved in it (supabase/delete-account.sql).
  // Resolves to '' when done, or a short reason: 'plus', 'owner', 'setup' or 'error'.
  TT.account.deleteAccount = function () {
    if (!sb || !user) return Promise.resolve('error');
    return sb.rpc('delete_my_account').then(function (res) {
      var err = res && res.error;
      if (err) {
        var m = String(err.message || '') + ' ' + String(err.code || '');
        if (/cancel_plus_first/.test(m)) return 'plus';
        if (/owner_account/.test(m)) return 'owner';
        if (/PGRST202|does not exist|Could not find/i.test(m)) return 'setup';
        return 'error';
      }
      try {
        var drop = [];
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (synced(k) || k === 'tt:avatar') drop.push(k); }
        drop.forEach(function (k) { localStorage.removeItem(k); });
        sessionStorage.setItem('tt-deleted', '1');
      } catch (e) {}
      meta = {}; saveMeta();
      var after = function () { location.href = '/'; };
      sb.auth.signOut({ scope: 'local' }).then(after, after);
      return '';
    }, function () { return 'error'; });
  };
  // After an account is deleted, say so once on the next page.
  (function () {
    var gone = false;
    try { gone = sessionStorage.getItem('tt-deleted') === '1'; if (gone) sessionStorage.removeItem('tt-deleted'); } catch (e) {}
    if (!gone) return;
    function show() {
      var n = h('div', { class: 'acct-gone', role: 'status' }, 'Your account and everything saved in it have been deleted.');
      document.body.append(n);
      setTimeout(function () { n.classList.add('out'); setTimeout(function () { n.remove(); }, 400); }, 6000);
    }
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  })();
  TT.account.ready = function () { return !!sb; };
  // True once the site knows for sure whether someone is signed in (or the sign-in library could not load).
  TT.account.known = function () { return known; };

  function setUser(u) {
    var was = user && user.id;
    user = u || null; known = true;
    if (user) { meta.email = user.email; meta.firstName = TT.account.firstName(); saveMeta(); }
    // Signing in on this computer: wait for the saved things before showing the account.
    if (user && user.id !== was && sb && meta.userId !== user.id) syncing = true;
    emit();
    if (user && user.id !== was) { loadPlan(); check(true); watchPaid(); }
  }

  function start() {
    var s = document.createElement('script');
    s.src = LIB; s.async = true;
    s.onload = function () {
      try {
        sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
          auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
      } catch (e) { known = true; setStatus('offline'); return; }
      sb.auth.getSession().then(function (r) {
        if (/[?&](code|reset)=/.test(location.search)) history.replaceState(null, '', resetting() ? '/account' : location.pathname + location.hash);
        if (resetting()) window.dispatchEvent(new Event('tt:page'));
        try { if (sessionStorage.getItem('tt-after-google')) { sessionStorage.removeItem('tt-after-google'); if (r.data && r.data.session) TT.go('account'); } } catch (e) {}
        setUser(r.data && r.data.session ? r.data.session.user : null);
      });
      sb.auth.onAuthStateChange(function (event, session) {
        if (event === 'PASSWORD_RECOVERY') { try { sessionStorage.setItem('tt-reset', '1'); } catch (e) {} }
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') setUser(session ? session.user : null);
      });
    };
    s.onerror = function () { known = true; setStatus('offline'); emit(); };
    document.head.append(s);
  }

  // ---------- Account page ----------
  TT.mountAccount = function (el) {
    var root = h('div', { class: 'acct' });
    el.append(root);
    // mode: signup, login, forgot, sent (check your email)
    var mode = 'signup', email = '', fName = '', fPass = '', msgText = linkError, busy = false, sentText = '';
    linkError = '';

    function msg() { return msgText ? h('p', { class: 'form-msg', role: 'status', text: msgText }) : null; }
    function feature(text, on) { return h('li', { class: on ? 'yes' : 'no' }, h('span', { 'aria-hidden': 'true', text: on ? '✓' : '–' }), text); }
    function payLink(url) {
      if (!url || !user) return '';
      return url + (url.indexOf('?') < 0 ? '?' : '&') + 'client_reference_id=' + encodeURIComponent(user.id) + '&prefilled_email=' + encodeURIComponent(user.email || '');
    }
    function manageUrl() {
      var u = CFG.manageLink;
      return u && user && user.email ? u + (u.indexOf('?') < 0 ? '?' : '&') + 'prefilled_email=' + encodeURIComponent(user.email) : u;
    }
    var who = '';
    function isAdult() { if (who === 'adult') return true; try { return localStorage.getItem('tt-adult') === '1'; } catch (e) { return false; } }
    function go(m) { mode = m; msgText = ''; fPass = ''; paint(); }
    function link(text, m) { return h('button', { type: 'button', class: 'linkish', onclick: function () { go(m); } }, text); }
    function field(type, id, ph, auto) {
      return h('input', { type: type, id: id, placeholder: ph, autocomplete: auto, 'aria-label': ph });
    }
    function pwField(id, ph, auto) {
      var input = field('password', id, ph, auto);
      var t = h('button', { type: 'button', class: 'pw-show', 'aria-label': 'Show password', onclick: function () {
        var show = input.type === 'password'; input.type = show ? 'text' : 'password';
        t.textContent = show ? 'Hide' : 'Show'; t.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      } }, 'Show');
      return { wrap: h('div', { class: 'pw-wrap' }, input, t), input: input };
    }
    function googleBtn() {
      var g = h('button', { type: 'button', class: 'btn big google-btn', onclick: function () {
        TT.account.google().then(function (r) { if (r && r.error) { msgText = 'Google sign-in isn’t ready yet. Use your email for now.'; paint(); } });
      } });
      g.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg><span>Continue with Google</span>';
      return g;
    }
    function submitBtn(label, busyLabel) { var b = TT.button(busy ? busyLabel : label, { kind: 'primary big acct-submit' }); b.type = 'submit'; b.disabled = busy; return b; }
    function validEmail(v) { return /^\S+@\S+\.\S+$/.test(v); }
    function run(promise, onOk) {
      busy = true; msgText = ''; paint();
      promise.then(function (r) { busy = false; if (r.error) { msgText = friendly(r.error); paint(); } else onOk(r); }, function () { busy = false; msgText = 'Can’t reach the sign-in service. Check the internet connection.'; paint(); });
    }
    var DISCLAIMER = 'Some games and activities can share a class code so others can join in. People who join with a code don’t make an account, and nothing about them is saved: no name, birthday, location or anything else.';

    function signInCard() {
      var card = h('section', { class: 'acct-card' });
      if (!sb) {
        card.append(h('h2', { text: 'Sign In' }), h('p', { class: 'form-msg', text: status === 'offline' ? 'Can’t reach the sign-in service. Check the internet connection and reload.' : 'Loading…' }));
        return card;
      }
      if (mode === 'sent') {
        card.append(h('h2', { text: 'Check Your Email' }), h('p', { text: sentText }),
          h('p', { class: 'muted small', text: 'Open the link on this same computer and browser. Don’t see it? Check your spam folder.' }),
          h('p', { class: 'acct-switch' }, link('Back to Log In', 'login')));
        return card;
      }
      if (mode === 'forgot') {
        var fe = field('email', 'acctEmail', 'Email', 'email'); fe.value = email;
        var ff = h('form', { class: 'acct-stack', novalidate: true, onsubmit: function (e) {
          e.preventDefault(); email = fe.value.trim();
          if (!validEmail(email)) { msgText = 'Type your email address.'; paint(); return; }
          run(TT.account.forgot(email), function () { sentText = 'If there’s an account for ' + email + ', we sent a link to choose a new password.'; go('sent'); });
        } }, fe, submitBtn('Email Me a Reset Link', 'Sending…'));
        card.append(h('h2', { text: 'Forgot Your Password?' }), h('p', { class: 'muted', text: 'Type your email and we’ll send a link to choose a new one.' }), ff);
        var fm = msg(); if (fm) card.append(fm);
        card.append(h('p', { class: 'acct-switch' }, link('Back to Log In', 'login')));
        return card;
      }
      var signup = mode === 'signup';
      // Students kept making accounts (Kevin, 2026-11-24), so sign-up starts with one question.
      // "A Student" goes to the class code page and no account is made. Adults are only asked once per computer.
      if (signup && !isAdult()) {
        if (who === 'student') {
          card.classList.add('who-card');
          card.append(h('h2', { text: 'Students Don’t Need an Account' }),
            h('p', { class: 'muted', text: 'You join with the class code on your teacher’s screen. No email or password.' }),
            h('a', { class: 'btn primary big who-join', href: '/join', onclick: function () { if (TT.track) TT.track('signup-who', 'student-join'); } }, h('span', { text: 'Join With a Class Code' })),
            h('p', { class: 'acct-switch' }, h('button', { type: 'button', class: 'linkish', onclick: function () { who = ''; paint(); } }, 'Go Back')));
          return card;
        }
        card.classList.add('who-card');
        card.append(h('h2', { text: 'Who Is Making This Account?' }), h('p', { class: 'muted', text: 'Accounts are for teachers, parents and other grown-ups.' }),
          h('div', { class: 'who-opts' },
            h('button', { type: 'button', class: 'who-opt c-violet', onclick: function () { who = 'adult'; try { localStorage.setItem('tt-adult', '1'); } catch (e) {} if (TT.track) TT.track('signup-who', 'adult'); paint(); } },
              h('span', { class: 'who-ico', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H4z"/><path d="M9 20h6M12 16v4M8 9h8M8 12h5"/></svg>' }),
              h('b', { text: 'A Teacher or Parent' }), h('small', { text: 'Make a free account' })),
            h('button', { type: 'button', class: 'who-opt c-rose', onclick: function () { who = 'student'; if (TT.track) TT.track('signup-who', 'student'); paint(); } },
              h('span', { class: 'who-ico', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z"/><path d="M9 4.500V3h6v1.500M9 13h6v3H9z"/></svg>' }),
              h('b', { text: 'A Student' }), h('small', { text: 'Join your class with a code' }))),
          h('p', { class: 'acct-switch' }, 'Already have an account? ', link('Log In', 'login')));
        return card;
      }
      card.append(h('h2', { text: signup ? 'Create Your Free Account' : 'Welcome Back' }),
        h('p', { class: 'muted', text: signup ? 'Save your boards, lists, questions and settings, and use them on any computer.' : 'Log in to get your boards, lists and settings on this computer.' }));
      if (CFG.google) card.append(googleBtn(), h('div', { class: 'acct-or' }, h('span', { text: 'OR' })));
      var nameIn = signup ? field('text', 'acctName', 'First name', 'given-name') : null;
      if (nameIn) nameIn.value = fName;
      var emailIn = field('email', 'acctEmail', 'Email', 'email'); emailIn.value = email;
      var pw = pwField('acctPassword', signup ? 'Password (8+ characters)' : 'Password', signup ? 'new-password' : 'current-password');
      pw.input.value = fPass;
      var form = h('form', { class: 'acct-stack', novalidate: true, onsubmit: function (e) {
        e.preventDefault();
        email = emailIn.value.trim();
        var pass = pw.input.value, name = nameIn ? nameIn.value.trim() : '';
        fPass = pass; if (nameIn) fName = name;
        if (signup && !name) { msgText = 'Type your first name.'; paint(); return; }
        if (!validEmail(email)) { msgText = 'Type your email address, like you@example.com.'; paint(); return; }
        if (signup && pass.length < 8) { msgText = 'Choose a password with at least 8 characters.'; paint(); return; }
        if (!pass) { msgText = 'Type your password.'; paint(); return; }
        if (signup) {
          run(TT.account.signUp(name.slice(0, 40), email, pass), function (r) {
            fPass = '';
            if (r.data && r.data.session) return; // signed in right away
            sentText = 'We sent a link to ' + email + '. Tap it to finish creating your account.'; go('sent');
          });
        } else {
          run(TT.account.logIn(email, pass), function () { fPass = ''; });
        }
      } }, nameIn, emailIn, pw.wrap, submitBtn(signup ? 'Create Account' : 'Log In', signup ? 'Creating…' : 'Logging In…'));
      card.append(form);
      if (nameIn && !busy) setTimeout(function () { if (!nameIn.value && document.activeElement === document.body) nameIn.focus(); }, 0);
      var m = msg(); if (m) card.append(m);
      if (signup) card.append(h('p', { class: 'acct-fine' }, 'By creating an account, you confirm you’re 13 or older and agree to the ', h('a', { href: '/terms/', target: '_blank', rel: 'noopener', text: 'Terms of Service' }), ' and ', h('a', { href: '/privacy/', target: '_blank', rel: 'noopener', text: 'Privacy Policy' }), '.'));
      else card.append(h('p', { class: 'acct-forgot' }, link('Forgot password?', 'forgot')));
      card.append(h('p', { class: 'acct-switch' }, signup ? 'Already have an account? ' : 'New here? ', link(signup ? 'Log In' : 'Create an Account', signup ? 'login' : 'signup')));

      return card;
    }

    // Beside the sign-in card on wide screens, below it on phones.
    function sideCard() {
      function item(icon, title, text) { return h('li', null, h('span', { class: 'acct-side-ico', 'aria-hidden': 'true', text: icon }), h('div', null, h('b', { text: title }), h('span', { text: text }))); }
      return h('aside', { class: 'acct-side' },
        h('h3', { text: 'Why Make an Account?' }),
        h('ul', null,
          item('☁️', 'Saved Everywhere', 'Your boards, lists and questions on any computer.'),
          item('🆓', 'Free to Start', 'Most tools and games, no card needed.'),
          item('🔒', 'Just for You', 'Only you can see what you save.')),
        h('p', { class: 'acct-disclaimer', text: DISCLAIMER }),
        h('p', { class: 'muted small', text: 'You need an account to open the tools and games. Students never need one: they join with a class code.' }));
    }

    function resetCard() {
      var pw = pwField('acctNewPassword', 'New password (8+ characters)', 'new-password');
      var form = h('form', { class: 'acct-stack', novalidate: true, onsubmit: function (e) {
        e.preventDefault();
        if (pw.input.value.length < 8) { msgText = 'Choose a password with at least 8 characters.'; paint(); return; }
        run(TT.account.setPassword(pw.input.value), function () {
          try { sessionStorage.removeItem('tt-reset'); } catch (e) {}
          msgText = ''; paint(); showSaved = true; paint();
        });
      } }, pw.wrap, submitBtn('Save New Password', 'Saving…'));
      var c = h('section', { class: 'acct-card' }, h('h2', { text: 'Choose a New Password' }), form);
      var m = msg(); if (m) c.append(m);
      c.append(h('p', { class: 'acct-switch' }, h('button', { type: 'button', class: 'linkish', onclick: function () { try { sessionStorage.removeItem('tt-reset'); } catch (e) {} paint(); } }, 'Skip for Now')));
      return c;
    }
    var showSaved = false;

    var STATUS = { saved: 'All changes saved to your account.', saving: 'Saving…', unsaved: 'Saving soon…', offline: 'Offline. Changes will save when you’re back online.', error: 'Couldn’t save just now. We’ll keep trying.', idle: 'Checking your account…' };
    var picking = false, avatarMsg = '';
    function avatarPicker() {
      var cur = TT.account.avatar() || {};
      var file = h('input', { type: 'file', id: 'avatarFile', accept: 'image/*', hidden: true });
      file.addEventListener('change', function () {
        var f = file.files[0]; file.value = '';
        if (!f) return;
        squareImage(f, function (data) {
          if (!data) { avatarMsg = 'That file isn’t a picture this browser can open. Try a JPG or PNG.'; paint(); return; }
          avatarMsg = ''; TT.account.setAvatar({ img: data });
        });
      });
      var grid = h('div', { class: 'avatar-grid', role: 'radiogroup', 'aria-label': 'Premade icons' }, AVATARS.map(function (p) {
        var on = cur.preset === p[0];
        return h('button', { type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false', 'aria-label': p[0], title: p[0].charAt(0).toUpperCase() + p[0].slice(1),
          class: 'avatar-opt' + (on ? ' on' : ''), style: 'background:linear-gradient(135deg,' + p[2] + ',' + p[3] + ')',
          onclick: function () { avatarMsg = ''; TT.account.setAvatar({ preset: p[0] }); } }, avatarImg(p));
      }));
      var g = TT.account.googlePhoto();
      return h('div', { class: 'avatar-picker' },
        h('div', { class: 'avatar-picker-head' }, h('h3', { text: 'Choose Your Icon' }),
          h('button', { type: 'button', class: 'linkish', onclick: function () { picking = false; paint(); } }, 'Done')),
        grid,
        h('div', { class: 'row avatar-actions' },
          h('label', { class: 'btn small', for: 'avatarFile', html: TT.icon('upload') + '<span>Upload My Own</span>' }), file,
          g ? TT.button('Use My Google Photo', { kind: 'small', onclick: function () { TT.account.setAvatar({ google: true }); } }) : null,
          TT.button('Use My Initial', { kind: 'small', onclick: function () { TT.account.setAvatar(null); } })),
        avatarMsg ? h('p', { class: 'form-msg', text: avatarMsg }) : null,
        h('p', { class: 'muted small', text: 'Uploaded pictures are shrunk to a small square and saved to your account.' }));
    }
    function accountCard() {
      var plan = TT.account.plan();
      var label = TT.planName(plan);
      var sync = null;
      if (CFG.classSync === 'choose') {
        var on = classSync();
        sync = h('div', { class: 'set-row' },
          h('div', null, h('h3', { text: 'Save Class Lists to My Account' }),
            h('p', { class: 'muted', text: on ? 'Your class lists, jobs, seating charts and exit tickets are saved to your account and show up on any computer you sign in on.' : 'Off: these hold students’ names, so they stay only on this computer. Turn this on to have them on every computer.' })),
          h('div', { class: 'set-control' }, h('div', { class: 'segmented', role: 'group' },
            h('button', { type: 'button', class: 'seg' + (on ? ' on' : ''), 'aria-pressed': on, onclick: function () { TT.account.setClassSync(true); } }, 'On'),
            h('button', { type: 'button', class: 'seg' + (!on ? ' on' : ''), 'aria-pressed': !on, onclick: function () { TT.account.setClassSync(false); } }, 'Off'))));
      }
      var outConfirm = h('div', { class: 'confirm', hidden: true },
        h('span', { text: 'Sign out? Your things stay safe in your account, and this computer goes back to a fresh start.' }),
        TT.button('Sign Out', { kind: 'primary small', onclick: TT.account.signOut }),
        TT.button('Cancel', { kind: 'small', onclick: function () { outConfirm.hidden = true; outBtn.hidden = false; } }));
      var outBtn = TT.button('Sign Out', { kind: 'small', onclick: function () { outBtn.hidden = true; outConfirm.hidden = false; } });
      return h('section', { class: 'acct-card' },
        h('div', { class: 'acct-who' },
          h('div', { class: 'avatar-wrap' },
            h('button', { type: 'button', class: 'avatar-btn', title: 'Change your icon', 'aria-label': 'Change your icon', onclick: function () { picking = !picking; paint(); } },
              paintAvatar(h('span', { class: 'nav-avatar big' })), h('span', { class: 'avatar-edit', 'aria-hidden': 'true', html: TT.icon('edit') }))),
          h('div', null, h('h2', { text: TT.account.firstName() ? 'Hi, ' + TT.account.firstName() + '!' : TT.account.email() }),
            TT.account.firstName() ? h('p', { class: 'muted acct-email', text: TT.account.email() }) : null,
            h('span', { class: 'plan-badge p-' + plan, text: label + ' Plan' }),
            plan === 'free' && !TT.account.paying() ? h('button', { type: 'button', class: 'linkish plan-see', onclick: function () { tab = 'plans'; paint(); } }, 'See Plans') : null,
            plan === 'premium' && CFG.manageLink ? h('a', { class: 'linkish plan-see', href: manageUrl(), target: '_blank', rel: 'noopener' }, 'Manage My Plan') : null)),
        TT.account.paying() ? h('p', { class: 'sync-status s-syncing', role: 'status', text: 'Thank you! Your Plus plan is turning on. This only takes a few seconds.' }) : null,
        TT.account.justPaid && plan !== 'free' ? h('p', { class: 'sync-status s-saved', role: 'status', text: 'Welcome to Plus! Everything is unlocked.' }) : null,
        picking ? avatarPicker() : null,
        realPlan() === 'owner' ? h('div', { class: 'acct-owner' },
          h('div', null, h('h3', { text: 'Owner Dashboard' }),
            h('p', { class: 'muted', text: meta.viewAs ? 'You are previewing the site as ' + TT.planName(meta.viewAs) + '. Your account is still the owner account.' : 'Traffic, members, income and the plan preview switch.' })),
          h('a', { class: 'btn primary small', href: '/owner' }, 'Open Dashboard')) : null,
        showSaved ? h('p', { class: 'sync-status s-saved', text: 'Your new password is saved.' }) : null,
        h('p', { class: 'sync-status s-' + status, text: STATUS[status] || '' }),
        sync,
        TT.backupControls ? h('div', { class: 'acct-backup' }, h('h3', { text: 'Backup File' }),
          h('p', { class: 'muted', text: 'Download everything to a file you keep, or bring a backup back in.' }), TT.backupControls()) : null,
        h('div', { class: 'row' }, outBtn, outConfirm),
        deleteBox());
    }

    // ---------- Delete My Account ----------
    var delOpen = false, delText = '', delBusy = false, delMsg = '';
    function deleteBox() {
      if (realPlan() === 'owner') return null;
      var mail = h('a', { href: 'mailto:hello@edsidekick.com', text: 'hello@edsidekick.com' });
      if (!delOpen) {
        return h('div', { class: 'acct-delete' },
          h('div', null, h('h3', { text: 'Delete My Account' }),
            h('p', { class: 'muted', text: 'Remove your account and everything saved in it.' })),
          h('button', { type: 'button', class: 'btn small del-open', onclick: function () { delOpen = true; delText = ''; delMsg = ''; paint(); var f = document.getElementById('delConfirm'); if (f) f.focus(); } }, 'Delete My Account'));
      }
      if (realPlan() === 'premium') {
        return h('div', { class: 'acct-delete open', role: 'region', 'aria-label': 'Delete My Account' },
          h('h3', { text: 'Cancel Plus First' }),
          h('p', null, 'Your Plus plan is still active. Cancel it in Manage My Plan first so you are not charged again. When your Plus time runs out you can delete your account here, or email ', mail, ' and we will delete it right away.'),
          h('div', { class: 'row' },
            CFG.manageLink ? h('a', { class: 'btn primary small', href: manageUrl(), target: '_blank', rel: 'noopener' }, 'Manage My Plan') : null,
            TT.button('Keep My Account', { kind: 'small', onclick: function () { delOpen = false; paint(); } })));
      }
      var input = h('input', { type: 'text', id: 'delConfirm', class: 'del-input', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: 'Type DELETE', 'aria-label': 'Type DELETE to confirm' });
      input.value = delText;
      var go = h('button', { type: 'button', class: 'btn small del-go', disabled: delBusy || delText.trim().toUpperCase() !== 'DELETE' }, delBusy ? 'Deleting...' : 'Delete Forever');
      input.addEventListener('input', function () { delText = input.value; go.disabled = delBusy || delText.trim().toUpperCase() !== 'DELETE'; });
      go.addEventListener('click', function () {
        if (delText.trim().toUpperCase() !== 'DELETE' || delBusy) return;
        delBusy = true; delMsg = ''; paint();
        TT.account.deleteAccount().then(function (why) {
          if (!why) return;
          delBusy = false;
          delMsg = why === 'plus' ? 'Your Plus plan is still active. Cancel it in Manage My Plan first.'
            : why === 'setup' ? 'Deleting accounts is not switched on yet. Email hello@edsidekick.com and we will delete it for you.'
            : 'Something went wrong, so nothing was deleted. Try again, or email hello@edsidekick.com.';
          paint();
        });
      });
      return h('div', { class: 'acct-delete open', role: 'region', 'aria-label': 'Delete My Account' },
        h('h3', { text: 'Delete Your Account?' }),
        h('p', { text: 'This deletes your account and everything saved in it: boards, class lists, questions, schedules, seating charts and settings. It can’t be undone. Save a backup file first if you might want any of it.' }),
        h('label', { class: 'del-label', for: 'delConfirm', text: 'Type DELETE to confirm' }),
        h('div', { class: 'row' }, input, go,
          TT.button('Cancel', { kind: 'small', onclick: function () { delOpen = false; delText = ''; delMsg = ''; paint(); } })),
        delMsg ? h('p', { class: 'del-msg', role: 'alert', text: delMsg }) : null);
    }

    var billing = 'month';
    var money = TT.money;
    function plansCard() {
      var plan = TT.account.plan(), prem = plan === 'premium' || plan === 'owner';
      var pr = TT.account.prices(), mo = pr.mo, yr = pr.yr, earlyOpen = pr.earlyOpen, untilText = pr.untilText, save = pr.save;
      var yearly = billing === 'year';

      function startFree() { tab = 'account'; mode = 'signup'; msgText = ''; paint(); scrollToForm(); }
      function needAccount() { tab = 'account'; mode = 'signup'; msgText = 'Create your free account first, then choose your plan.'; paint(); scrollToForm(); }
      function scrollToForm() { setTimeout(function () { var f = document.getElementById('acctName') || document.getElementById('acctEmail'); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); f.focus({ preventScroll: true }); } }, 0); }
      function cta(label, kind, opts) {
        opts = opts || {};
        if (opts.href) return h('a', { class: 'btn plan-cta ' + kind, href: opts.href, target: opts.blank ? '_blank' : null, rel: opts.blank ? 'noopener' : null }, label);
        var b = h('button', { type: 'button', class: 'btn plan-cta ' + kind, onclick: opts.onclick, disabled: opts.disabled }, label);
        return b;
      }
      function paidCta(monthly, yearlyLink, label) {
        if (plan === 'owner') return cta('Included With Your Account', '', { disabled: true });
        if (plan === 'premium') return CFG.manageLink ? cta('Manage My Plan', '', { href: manageUrl(), blank: true }) : cta('Your Plan', '', { disabled: true });
        if (!user) return cta(label, 'primary', { onclick: needAccount });
        var linkUrl = yearly ? yearlyLink : monthly;
        return linkUrl ? cta(label, 'primary', { href: payLink(linkUrl) }) : cta('Coming Soon', '', { disabled: true });
      }
      function list(lead, items) {
        return h('div', { class: 'plan-list' }, TT.planLead(lead, 'plan-lead'),
          h('ul', null, items.map(function (t) { return h('li', null, h('span', { class: 'tick', 'aria-hidden': 'true', text: '✓' }), h('span', null, t[0], t[1] ? h('small', { text: t[1] }) : null)); })));
      }
      function priceBlock(amount, was) {
        return h('div', { class: 'plan-price' },
          h('span', { class: 'plan-from' + (was ? '' : ' empty'), text: was ? 'Was ' + was : '' }),
          h('div', null, h('b', { text: amount }), h('span', { class: 'per', text: amount === '$0' ? ' / forever' : yearly ? ' / year' : ' / month' })));
      }

      var cols = [];
      cols.push(h('div', { class: 'plan-col' },
        h('div', { class: 'plan-top' }, h('h3', { text: 'Free' })),
        h('p', { class: 'plan-desc', text: 'Everything you need to run your classroom board, free.' }),
        priceBlock('$0'),
        !user ? cta('Start for Free', '', { onclick: startFree }) : cta(prem ? 'Included' : 'Your Plan', '', { disabled: true }),
        h('p', { class: 'plan-note', text: 'No card needed. A free account saves your boards and classes.' }),
        list('Get started with:', TT.PLAN_FEATURES.free)));
      // Plus: during Early Access the early price shows, with the regular price crossed out.
      var plusP = pr.price(false, yearly, earlyOpen);
      cols.push(h('div', { class: 'plan-col featured' },
        h('div', { class: 'plan-top' }, h('h3', { text: 'Plus' }), h('span', { class: 'plan-tag', text: 'Recommended' })),
        h('p', { class: 'plan-desc', text: 'Every escape room, Trivia Showdown, Seating Chart, Prompts and room for every class.' }),
        priceBlock(money(plusP.now), plusP.was ? money(plusP.was) : ''),
        earlyOpen ? h('p', { class: 'plan-early' }, h('span', { class: 'plan-tag early-tag', text: 'Early Access · ' + Math.round(plusP.off * 100) + '% Off' }),
          h('small', { text: Math.round(plusP.off * 100) + (yearly ? '% off twelve months' : '% off every month') + ' for members who join by ' + untilText + '.' })) : null,
        earlyOpen ? paidCta(CFG.earlyMonthlyLink, CFG.earlyYearlyLink, 'Get Plus') : paidCta(CFG.plusMonthlyLink || CFG.premiumMonthlyLink, CFG.plusYearlyLink || CFG.premiumYearlyLink, 'Get Plus'),
        h('p', { class: 'plan-note', text: yearly ? 'Billed once a year. Cancel anytime.' : 'Billed monthly. Cancel anytime.' }),
        list('Everything in Free, Plus:', TT.PLAN_FEATURES.premium)));
      // Premium: the top plan. Coming Soon until CFG.topOpen is turned on.
      var topEarly = CFG.topOpen && earlyOpen, topP = pr.price(true, yearly, topEarly);
      cols.push(h('div', { class: 'plan-col top' + (CFG.topOpen ? '' : ' soon') },
        h('div', { class: 'plan-top' }, h('h3', { text: 'Premium' }), CFG.topOpen ? null : h('span', { class: 'plan-tag soon-tag', text: 'Coming Soon' })),
        h('p', { class: 'plan-desc', text: 'Everything in Plus, with live quiz games your class plays on their own devices.' }),
        priceBlock(money(topP.now), topP.was ? money(topP.was) : ''),
        CFG.topOpen ? (plan === 'top' ? cta('Your Plan', '', { disabled: true }) : topEarly ? paidCta(CFG.topEarlyMonthlyLink, CFG.topEarlyYearlyLink, 'Get Premium') : paidCta(CFG.topMonthlyLink, CFG.topYearlyLink, 'Get Premium'))
          : cta('Coming Soon', '', { disabled: true }),
        h('p', { class: 'plan-note', text: CFG.topOpen ? (yearly ? 'Billed once a year. Cancel anytime.' : 'Billed monthly. Cancel anytime.') : 'Not open yet. Plus members will be able to move up when it launches.' }),
        list('Everything in Plus, and:', TT.PLAN_FEATURES.top)));

      var toggle = h('div', { class: 'segmented bill-toggle', role: 'group', 'aria-label': 'Billing' },
        [['month', 'Monthly'], ['year', 'Yearly' + (save > 0 ? ' (Save ' + save + '%)' : '')]].map(function (o) {
          return h('button', { type: 'button', class: 'seg' + (billing === o[0] ? ' on' : ''), 'aria-pressed': billing === o[0], onclick: function () { billing = o[0]; paint(); } }, o[1]);
        }));
      return h('section', { class: 'pricing' },
        h('div', { class: 'pricing-head' }, h('h2', { text: 'Start Free. Upgrade Anytime.' }),
          h('p', { class: 'muted', text: 'Every board widget, Daily tool and almost every game is free. Plus opens every escape room, Trivia Showdown, Seating Chart and Prompts.' }), toggle),
        h('div', { class: 'pricing-grid cols-' + cols.length }, cols));
    }

    var tab = 'account';
    function tabs() {
      return h('div', { class: 'acct-tabs', role: 'tablist', 'aria-label': 'Account sections' },
        [['account', user ? 'My Account' : 'Sign In'], ['settings', 'Settings'], ['plans', ['Plans', h('span', { class: 'tab-long', text: ' and Pricing' })]]].map(function (t) {
          return h('button', { type: 'button', role: 'tab', class: 'acct-tab' + (tab === t[0] ? ' on' : ''), 'aria-selected': tab === t[0] ? 'true' : 'false',
            onclick: function () { if (tab !== t[0]) { tab = t[0]; paint(); } } }, t[1]);
        }));
    }
    var lastSig = '';
    function sig() {
      var av = ''; try { av = localStorage.getItem('tt:avatar') || ''; } catch (e) {}
      return [known, user && user.id, user && user.email, TT.account.firstName(), TT.account.plan(), TT.account.realPlan(), TT.account.viewAs(), status,
        TT.account.loading(), paying(), !!TT.account.justPaid, classSync(), av, resetting(), tab, mode].join('|');
    }
    function paint() {
      lastSig = sig();
      // Rebuilding the page must not jump the scroll position.
      var y = window.scrollY;
      root.style.minHeight = root.offsetHeight + 'px';
      root.textContent = '';
      if (!enabled) { root.append(h('section', { class: 'acct-card' }, h('h2', { text: 'Accounts Are Coming Soon' }), h('p', { class: 'muted', text: 'For now, everything saves on this computer.' }))); return; }
      root.append(tabs());
      if (tab === 'plans') root.append(plansCard());
      else if (tab === 'settings') {
        var setBox = h('section', { class: 'panel acct-settings' });
        root.append(setBox);
        if (TT.mountSettings) TT.mountSettings(setBox, { inAccount: true });
      } else {
        if (user && resetting()) root.append(resetCard());
        if (TT.account.loading()) root.append(h('section', { class: 'acct-card acct-loading', role: 'status' }, h('h2', { text: 'Getting Your Things Ready…' }), h('p', { class: 'muted', text: 'Loading what you saved in your account. This only takes a moment.' })));
        else if (user) root.append(accountCard());
        else root.append(h('div', { class: 'acct-row' }, signInCard(), sideCard()));
      }
      root.style.minHeight = '';
      if (window.scrollY !== y) window.scrollTo(0, y);
    }
    // Typing in the Settings tab saves (and syncs) on every key. Don't rebuild the page then,
    // or the box loses focus after one letter.
    TT.account.onChange(function () {
      var box = root.querySelector('.acct-settings');
      if (tab === 'settings' && box && box.contains(document.activeElement)) return;
      var del = root.querySelector('.acct-delete.open');
      if (del && del.contains(document.activeElement) && !delBusy) return;
      // Several things report in after a sign-in (who you are, your plan, saving). Only rebuild the
      // page when one of them changes what it shows, so it doesn't flicker.
      var now = sig();
      if (now === lastSig) return;
      paint();
    });
    TT.account.openPlans = function () { tab = 'plans'; paint(); };
    if (TT.account.wantPlans) { tab = 'plans'; TT.account.wantPlans = false; }
    // The sign-in gate (assets/signin-gate.js) can ask for the Log In or Create an Account form.
    function wanted() { var m = TT.account.wantMode; if (m === 'login' || m === 'signup') { tab = 'account'; mode = m; msgText = ''; } TT.account.wantMode = null; }
    wanted();
    paint();
    return { show: function () { if (TT.account.wantPlans) { tab = 'plans'; TT.account.wantPlans = false; } if (TT.account.wantSignIn) { tab = 'account'; TT.account.wantSignIn = false; } wanted(); loadPlan(); paint(); } };
  };

  // ---------- Account icon ----------
  // Saved as "avatar" with everything else, so it follows the account to any computer.
  var AVATARS = [
    ['fox', '🦊', '#FF9A5A', '#FF5E7E'], ['panda', '🐼', '#7CC8FF', '#5B7CFA'], ['owl', '🦉', '#B58CFF', '#7B4DEB'],
    ['turtle', '🐢', '#5BE0A6', '#13A97A'], ['octopus', '🐙', '#FF8FB8', '#E5397A'], ['unicorn', '🦄', '#FFC4F0', '#A383FF'],
    ['rocket', '🚀', '#6B97FF', '#2A3FAF'], ['rainbow', '🌈', '#9FE3FF', '#4CC3F5'], ['star', '⭐', '#FFE08A', '#FF9E3D'],
    ['apple', '🍎', '#FFB199', '#F2643D'], ['books', '📚', '#B9F18C', '#5E9C0C'], ['palette', '🎨', '#FFD36E', '#E89A00'],
    ['cat', '🐱', '#FFD1A8', '#FF8A5B'], ['dino', '🦖', '#A6F0C6', '#2FD199'], ['bee', '🐝', '#FFF0A0', '#FFC043'], ['planet', '🪐', '#C9B8FF', '#5B4BCB']
  ];
  TT.account.AVATARS = AVATARS;
  // Kevin's sticker art, one picture per icon (assets/avatars/<id>.png).
  function avatarImg(p) { return h('img', { class: 'avatar-art', src: '/assets/avatars/' + p[0] + '.png', alt: '', draggable: 'false' }); }
  TT.account.avatar = function () { return TT.load('avatar', null); };
  TT.account.setAvatar = function (a) { if (a) TT.save('avatar', a); else { try { localStorage.removeItem('tt:avatar'); } catch (e) {} changed('tt:avatar'); } emit(); };
  TT.account.googlePhoto = function () { return (user && user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture)) || ''; };
  // Fill an element with the account icon: uploaded photo, premade icon, or first letter.
  function paintAvatar(el) {
    var a = TT.account.avatar(), name = TT.account.firstName() || TT.account.email() || '?';
    el.textContent = ''; el.style.background = ''; el.style.backgroundImage = '';
    el.classList.remove('has-img', 'has-emoji');
    var src = a && (a.img || (a.google && TT.account.googlePhoto()));
    if (src) { el.style.backgroundImage = 'url("' + src.replace(/"/g, '%22') + '")'; el.classList.add('has-img'); return el; }
    var p = a && a.preset && AVATARS.filter(function (x) { return x[0] === a.preset; })[0];
    if (p) { el.style.background = 'linear-gradient(135deg,' + p[2] + ',' + p[3] + ')'; el.append(avatarImg(p)); el.classList.add('has-emoji'); return el; }
    el.textContent = name.charAt(0).toUpperCase();
    return el;
  }
  TT.account.paintAvatar = paintAvatar;
  // Shrink an uploaded picture to a small square (center crop) so it saves quickly.
  function squareImage(file, done) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var n = 160, c = document.createElement('canvas'); c.width = c.height = n;
        var side = Math.min(img.width, img.height);
        c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, n, n);
        done(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function () { done(null); };
      img.src = r.result;
    };
    r.onerror = function () { done(null); };
    r.readAsDataURL(file);
  }

  // ---------- Top bar button ----------
  var navBtn = null;
  function paintNav() {
    if (!navBtn) return;
    var signed = !!(user || meta.userId);
    navBtn.textContent = '';
    if (signed) {
      navBtn.append(paintAvatar(h('span', { class: 'nav-avatar' })));
      navBtn.title = 'Account menu';
      navBtn.setAttribute('aria-label', 'Account menu');
      navBtn.setAttribute('aria-haspopup', 'menu');
      navBtn.classList.add('signed');
    } else {
      navBtn.append(h('span', { text: 'Sign In' }));
      navBtn.title = 'Sign in or create a free account';
      navBtn.removeAttribute('aria-label');
      navBtn.removeAttribute('aria-haspopup');
      navBtn.classList.remove('signed');
      closeMenu();
    }
    // Settings live in the account menu once signed in; the gear stays for visitors.
    var gear = document.querySelector('.nav-gear');
    if (gear) gear.hidden = signed;
  }

  // ---------- Account menu (hover or tap the icon) ----------
  var menu = null, menuWrap = null, hoverTimer = null;
  function goPlans() { TT.account.wantPlans = true; if (TT.page() === 'account' && TT.account.openPlans) TT.account.openPlans(); else TT.go('account'); }
  function buildMenu() {
    var plan = TT.account.plan();
    var label = TT.planName(plan);
    function item(icon, text, onclick, cls) {
      return h('button', { type: 'button', role: 'menuitem', class: 'acct-menu-item' + (cls ? ' ' + cls : ''), onclick: function () { closeMenu(); onclick(); } },
        h('span', { class: 'acct-menu-ico', 'aria-hidden': 'true', html: icon }), h('span', { text: text }));
    }
    var I = {
      user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
      plans: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>',
      help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01"/></svg>',
      dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
      out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H4"/></svg>'
    };
    var name = TT.account.firstName();
    var m = h('div', { class: 'acct-menu', role: 'menu', 'aria-label': 'Account' },
      h('div', { class: 'acct-menu-head' }, paintAvatar(h('span', { class: 'nav-avatar' })),
        h('div', null, h('b', { text: name || 'My Account' }), h('small', { text: TT.account.email() }),
          h('span', { class: 'plan-badge p-' + plan, text: label + ' Plan' }))),
      item(I.user, 'My Account', function () { TT.account.wantPlans = false; TT.go('account'); }),
      item(I.plans, 'Plans and Pricing', goPlans),
      item(TT.icon('gear'), 'Settings', function () { TT.go('settings'); }),
      item(I.help, 'Help', function () { location.href = '/help/'; }),
      realPlan() === 'owner' && document.getElementById('view-owner') ? item(I.dash, 'Owner Dashboard', function () { TT.go('owner'); }) : null,
      h('div', { class: 'acct-menu-sep' }),
      item(I.out, 'Sign Out', TT.account.signOut, 'danger'));
    return m;
  }
  function openMenu() {
    if (!navBtn || !navBtn.classList.contains('signed')) return;
    clearTimeout(hoverTimer);
    if (menu) return;
    menu = buildMenu(); menuWrap.append(menu);
    navBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    clearTimeout(hoverTimer);
    if (menu) { menu.remove(); menu = null; }
    if (navBtn) navBtn.setAttribute('aria-expanded', 'false');
  }
  function setupMenu() {
    menuWrap = h('div', { class: 'acct-menu-wrap' });
    navBtn.parentNode.insertBefore(menuWrap, navBtn);
    menuWrap.append(navBtn);
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    navBtn.addEventListener('click', function (e) {
      if (!navBtn.classList.contains('signed')) return; // Sign In link works as before
      e.preventDefault();
      if (menu && !fine) closeMenu(); else openMenu();
    });
    if (fine) {
      menuWrap.addEventListener('mouseenter', openMenu);
      menuWrap.addEventListener('mouseleave', function () { hoverTimer = setTimeout(closeMenu, 250); });
    }
    document.addEventListener('pointerdown', function (e) { if (menu && !menuWrap.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu) { closeMenu(); navBtn.focus(); } });
    window.addEventListener('tt:page', closeMenu);
    TT.account.onChange(function () { if (menu) { closeMenu(); } });
  }

  document.addEventListener('DOMContentLoaded', function () {
    navBtn = document.querySelector('.nav-account');
    if (!enabled) return;
    if (navBtn) { navBtn.hidden = false; setupMenu(); }
    paintNav();
    start();
  });
})();
