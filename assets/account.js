// Accounts, cloud saving and plans.
// Everything a tool saves goes through TT.save into this browser ("tt:" keys). When a teacher
// signs in, those keys are also copied into their account (one row in Supabase), and copied
// back down on any other computer they sign in on. Guests keep using the site exactly as before.
(function () {
  var TT = window.TT, h = TT.h;
  var CFG = window.TT_ACCOUNT_CONFIG || {};
  var enabled = !!(CFG.supabaseUrl && CFG.supabaseKey);
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

  // ---------- Plans ----------
  var PLANS = {
    open: { screens: 10, classes: Infinity, questions: Infinity, photo: true }, // accounts switched off
    free: { screens: 1, classes: 2, questions: 25, photo: false },
    premium: { screens: 10, classes: Infinity, questions: Infinity, photo: true }
  };
  PLANS.owner = PLANS.premium;
  PLANS.guest = PLANS.free;

  // ---------- Small saved notes about the account (not synced, not in backups) ----------
  var META_KEY = 'tt-account';
  var meta = (function () { try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) { return {}; } })();
  function saveMeta() { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) {} }

  var sb = null, user = null, listeners = [], status = 'idle', pushTimer = null, changeSeq = 0, pushing = false, newerWaiting = false;

  TT.account = {
    enabled: enabled,
    config: CFG,
    user: function () { return user; },
    signedIn: function () { return !!user; },
    email: function () { return user ? user.email : meta.email || ''; },
    plan: function () { return !enabled ? 'open' : user || meta.userId ? (meta.plan || 'free') : 'guest'; },
    isPremium: function () { var p = TT.account.plan(); return p === 'premium' || p === 'owner' || p === 'open'; },
    status: function () { return status; },
    onChange: function (fn) { listeners.push(fn); },
    classSync: classSync,
    setClassSync: function (on) { TT.settings.syncClasses = !!on; TT.saveSettings(); changed('tt:classes'); emit(); }
  };
  TT.limit = function (name) { return PLANS[TT.account.plan()][name]; };
  Object.defineProperty(TT.config, 'maxScreens', { get: function () { return TT.limit('screens'); }, configurable: true });

  // A short "See Plans" note for places that hit a free-plan limit.
  TT.upsell = function (text) {
    return h('p', { class: 'upsell' }, h('span', { text: text + ' ' }), h('a', { href: '#account', text: TT.account.signedIn() ? 'Go Premium' : 'See Plans' }));
  };

  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); paintNav(); }
  function setStatus(s) { status = s; emit(); }

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
      if (res.error) { setStatus('offline'); return; }
      var row = res.data;
      if (meta.userId !== user.id) {
        // First time this account is used on this computer.
        meta.userId = user.id; meta.email = user.email;
        if (!row) { meta.dirty = true; saveMeta(); push(); return; } // new account: upload what's here
        try { localStorage.setItem('tt-before-signin', JSON.stringify(collect())); } catch (e) {}
        apply(row.data); meta.pulledAt = row.updated_at; meta.dirty = false; saveMeta();
        location.reload(); return;
      }
      if (!row || meta.dirty) { if (meta.dirty || !row) push(); return; }
      if (row.updated_at !== meta.pulledAt) {
        if (firstLoad) { apply(row.data); meta.pulledAt = row.updated_at; saveMeta(); location.reload(); return; }
        newerWaiting = row; showNewer();
        return;
      }
      setStatus('saved');
    }, function () { setStatus('offline'); });
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
      if (meta.plan !== res.data.plan) { meta.plan = res.data.plan; saveMeta(); emit(); }
    });
  }

  // ---------- Sign in and out ----------
  var base = location.origin + location.pathname;
  TT.account.sendCode = function (email) {
    return sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: base } });
  };
  TT.account.verifyCode = function (email, code) {
    return sb.auth.verifyOtp({ email: email, token: code, type: 'email' });
  };
  TT.account.google = function () {
    return sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: base + '#account' } });
  };
  TT.account.signOut = function () {
    function done() {
      try {
        var drop = [];
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (synced(k)) drop.push(k); }
        drop.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
      meta = {}; saveMeta();
      var after = function () { location.hash = '#home'; location.reload(); };
      if (sb) sb.auth.signOut().then(after, after); else after();
    }
    if (meta.dirty && sb && user) {
      sb.from('user_data').upsert({ user_id: user.id, data: collect() }).then(done, done);
    } else done();
  };
  TT.account.ready = function () { return !!sb; };

  function setUser(u) {
    var was = user && user.id;
    user = u || null;
    if (user) { meta.email = user.email; saveMeta(); }
    emit();
    if (user && user.id !== was) { loadPlan(); check(true); }
  }

  function start() {
    var s = document.createElement('script');
    s.src = LIB; s.async = true;
    s.onload = function () {
      try {
        sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
          auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
      } catch (e) { setStatus('offline'); return; }
      sb.auth.getSession().then(function (r) {
        if (/[?&]code=/.test(location.search)) history.replaceState(null, '', base + location.hash);
        setUser(r.data && r.data.session ? r.data.session.user : null);
      });
      sb.auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') setUser(session ? session.user : null);
      });
    };
    s.onerror = function () { setStatus('offline'); emit(); };
    document.head.append(s);
  }

  // ---------- Account page ----------
  TT.mountAccount = function (el) {
    var root = h('div', { class: 'acct' });
    el.append(root);
    var step = 'email', email = '', msgText = '', busy = false;

    function msg() { return msgText ? h('p', { class: 'form-msg', role: 'status', text: msgText }) : null; }
    function feature(text, on) { return h('li', { class: on ? 'yes' : 'no' }, h('span', { 'aria-hidden': 'true', text: on ? '✓' : '–' }), text); }
    function payLink(url) {
      if (!url || !user) return '';
      return url + (url.indexOf('?') < 0 ? '?' : '&') + 'client_reference_id=' + encodeURIComponent(user.id) + '&prefilled_email=' + encodeURIComponent(user.email || '');
    }

    function signInCard() {
      var card = h('section', { class: 'acct-card' },
        h('h2', { text: 'Teacher Sign In' }),
        h('p', { class: 'muted', text: 'Sign in or create a free teacher account. Your boards, questions, schedule and settings follow you to any computer. No password to remember.' }),
        h('p', { class: 'muted small', text: 'Accounts are for teachers only. Students never sign in or make accounts.' }));
      if (!sb) { card.append(h('p', { class: 'form-msg', text: status === 'offline' ? 'Can’t reach the sign-in service. Check the internet connection and reload.' : 'Loading…' })); return card; }
      if (CFG.google) {
        card.append(TT.button('Continue with Google', { kind: 'big google-btn', onclick: function () { TT.account.google(); } }),
          h('div', { class: 'acct-or' }, h('span', { text: 'or use your email' })));
      }
      if (step === 'email') {
        var input = h('input', { type: 'email', id: 'acctEmail', placeholder: 'you@school.org', autocomplete: 'email', 'aria-label': 'Email address', required: true });
        input.value = email;
        var form = h('form', { class: 'acct-form', novalidate: true, onsubmit: function (e) {
          e.preventDefault();
          email = input.value.trim();
          if (!/^\S+@\S+\.\S+$/.test(email)) { msgText = 'Type your email address, like you@school.org.'; paint(); return; }
          busy = true; msgText = ''; paint();
          TT.account.sendCode(email).then(function (r) {
            busy = false;
            if (r.error) { msgText = 'That didn’t work: ' + r.error.message; } else { step = 'code'; msgText = ''; }
            paint();
          });
        } }, input, TT.button(busy ? 'Sending…' : 'Email Me a Sign-In Code', { kind: 'primary big' }));
        form.querySelector('button').type = 'submit';
        card.append(form);
      } else {
        var code = h('input', { type: 'text', id: 'acctCode', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: 8, placeholder: '123456', 'aria-label': 'Sign-in code' });
        var f2 = h('form', { class: 'acct-form', novalidate: true, onsubmit: function (e) {
          e.preventDefault();
          var c = code.value.replace(/\D/g, '');
          if (c.length < 6) { msgText = 'Type the code from the email.'; paint(); return; }
          busy = true; msgText = ''; paint();
          TT.account.verifyCode(email, c).then(function (r) {
            busy = false;
            if (r.error) { msgText = 'That code didn’t work. Check it, or send a new one.'; paint(); }
          });
        } }, code, TT.button(busy ? 'Checking…' : 'Sign In', { kind: 'primary big' }));
        f2.querySelector('button').type = 'submit';
        card.append(h('p', { text: 'We sent a code to ' + email + '. Type it here, or tap the link in the email.' }), f2,
          TT.button('Use a Different Email', { kind: 'small', onclick: function () { step = 'email'; msgText = ''; paint(); } }));
        setTimeout(function () { var c = document.getElementById('acctCode'); if (c) c.focus(); }, 0);
      }
      var m = msg(); if (m) card.append(m);
      card.append(h('p', { class: 'muted small', text: 'Not signing in is fine too. Everything still works and saves on this computer.' }));
      return card;
    }

    var STATUS = { saved: 'All changes saved to your account.', saving: 'Saving…', unsaved: 'Saving soon…', offline: 'Offline. Changes will save when you’re back online.', error: 'Couldn’t save just now. We’ll keep trying.', idle: 'Checking your account…' };
    function accountCard() {
      var plan = TT.account.plan();
      var label = plan === 'owner' ? 'Owner' : plan === 'premium' ? 'Premium' : 'Free';
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
          h('span', { class: 'nav-avatar big', text: (TT.account.email() || '?').charAt(0).toUpperCase() }),
          h('div', null, h('h2', { text: TT.account.email() }), h('span', { class: 'plan-badge p-' + plan, text: label + ' Plan' }))),
        h('p', { class: 'sync-status s-' + status, text: STATUS[status] || '' }),
        sync,
        h('div', { class: 'row' }, outBtn, outConfirm));
    }

    function plansCard() {
      var plan = TT.account.plan(), prem = plan === 'premium' || plan === 'owner';
      var F = PLANS.free;
      var buy;
      if (prem) {
        buy = plan === 'owner' ? h('p', { class: 'muted', text: 'Your account has everything, free.' })
          : CFG.manageLink ? h('a', { class: 'btn', href: CFG.manageLink, target: '_blank', rel: 'noopener' }, 'Manage My Plan') : h('p', { class: 'muted', text: 'You’re on Premium. Thank you!' });
      } else if (!user) {
        buy = h('p', { class: 'muted', text: 'Sign in first, then choose Premium here.' });
      } else if (CFG.premiumMonthlyLink || CFG.premiumYearlyLink) {
        buy = h('div', { class: 'row' },
          CFG.premiumMonthlyLink ? h('a', { class: 'btn primary', href: payLink(CFG.premiumMonthlyLink) }, 'Monthly · ' + CFG.priceMonthly) : null,
          CFG.premiumYearlyLink ? h('a', { class: 'btn primary', href: payLink(CFG.premiumYearlyLink) }, 'Yearly · ' + CFG.priceYearly) : null);
      } else {
        buy = h('p', { class: 'muted', text: 'Premium is coming soon.' });
      }
      return h('section', { class: 'plans' },
        h('div', { class: 'plan-card' + (!prem ? ' current' : '') },
          h('h3', { text: 'Free' }), h('p', { class: 'price', text: '$0' }),
          h('ul', null,
            feature('Every tool and game', true),
            feature('Saves to your account', true),
            feature(F.screens + ' saved board screen', true),
            feature(F.classes + ' class lists', true),
            feature(F.questions + ' of your own questions', true),
            feature('Your own photo backgrounds', false)),
          !prem && user ? h('p', { class: 'plan-current', text: 'Your Plan' }) : null),
        h('div', { class: 'plan-card premium' + (prem ? ' current' : '') },
          h('h3', { text: 'Premium' }),
          h('p', { class: 'price' }, h('b', { text: CFG.priceMonthly }), ' a month, or ' + CFG.priceYearly + ' a year'),
          h('ul', null,
            feature('Everything in Free', true),
            feature(PLANS.premium.screens + ' saved board screens', true),
            feature('Unlimited class lists', true),
            feature('Unlimited questions and escape rooms', true),
            feature('Your own photo backgrounds', true)),
          buy));
    }

    function paint() {
      root.textContent = '';
      if (!enabled) { root.append(h('section', { class: 'acct-card' }, h('h2', { text: 'Accounts Are Coming Soon' }), h('p', { class: 'muted', text: 'For now, everything saves on this computer.' }))); return; }
      root.append(user ? accountCard() : signInCard(), plansCard());
    }
    TT.account.onChange(paint);
    paint();
    return { show: function () { loadPlan(); paint(); } };
  };

  // ---------- Top bar button ----------
  var navBtn = null;
  function paintNav() {
    if (!navBtn) return;
    var signed = !!(user || meta.userId);
    navBtn.textContent = '';
    if (signed) {
      var em = TT.account.email() || '?';
      navBtn.append(h('span', { class: 'nav-avatar', text: em.charAt(0).toUpperCase() }));
      navBtn.title = 'My Account';
      navBtn.setAttribute('aria-label', 'My account');
      navBtn.classList.add('signed');
    } else {
      navBtn.append(h('span', { text: 'Sign In' }));
      navBtn.title = 'Sign in or create a free account';
      navBtn.removeAttribute('aria-label');
      navBtn.classList.remove('signed');
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    navBtn = document.querySelector('.nav-account');
    if (!enabled) return;
    if (navBtn) navBtn.hidden = false;
    paintNav();
    start();
  });
})();
