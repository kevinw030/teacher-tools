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
    return h('p', { class: 'upsell' }, h('span', { text: text + ' ' }), h('a', { href: '#account', text: TT.account.signedIn() ? 'Go Premium' : 'See Plans',
      onclick: function () { TT.account.wantPlans = true; if (location.hash === '#account' && TT.account.openPlans) TT.account.openPlans(); } }));
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
  // Coming back from a "reset password" email, or from a link that failed (expired or used).
  var linkError = '';
  (function () {
    var q = location.search + '&' + location.hash.replace(/^#/, '');
    var m = q.match(/error_description=([^&]+)/);
    if (m) {
      linkError = decodeURIComponent(m[1].replace(/\+/g, ' '));
      if (/expired|invalid/i.test(linkError)) linkError = 'That email link has expired or was already used. Please try again.';
      history.replaceState(null, '', base + '#account');
    }
    if (/[?&]reset=1/.test(location.search)) { try { sessionStorage.setItem('tt-reset', '1'); } catch (e) {} }
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
    if (user) { meta.email = user.email; meta.firstName = TT.account.firstName(); saveMeta(); }
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
        if (/[?&](code|reset)=/.test(location.search)) history.replaceState(null, '', base + (resetting() ? '#account' : location.hash));
        if (resetting()) window.dispatchEvent(new HashChangeEvent('hashchange'));
        try { if (sessionStorage.getItem('tt-after-google')) { sessionStorage.removeItem('tt-after-google'); if (r.data && r.data.session) location.hash = '#account'; } } catch (e) {}
        setUser(r.data && r.data.session ? r.data.session.user : null);
      });
      sb.auth.onAuthStateChange(function (event, session) {
        if (event === 'PASSWORD_RECOVERY') { try { sessionStorage.setItem('tt-reset', '1'); } catch (e) {} }
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') setUser(session ? session.user : null);
      });
    };
    s.onerror = function () { setStatus('offline'); emit(); };
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
      if (signup) card.append(h('p', { class: 'acct-fine' }, 'By creating an account, you confirm you’re 13 or older and agree to the ', h('a', { href: 'terms/', target: '_blank', rel: 'noopener', text: 'Terms of Service' }), ' and ', h('a', { href: 'privacy/', target: '_blank', rel: 'noopener', text: 'Privacy Policy' }), '.'));
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
          item('🆓', 'Free to Start', 'Every tool and game, no card needed.'),
          item('🔒', 'Just for You', 'Only you can see what you save.')),
        h('p', { class: 'acct-disclaimer', text: DISCLAIMER }),
        h('p', { class: 'muted small', text: 'Not signing in is fine too. Everything still works and saves on this computer.' }));
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
          h('span', { class: 'nav-avatar big', text: (TT.account.firstName() || TT.account.email() || '?').charAt(0).toUpperCase() }),
          h('div', null, h('h2', { text: TT.account.firstName() ? 'Hi, ' + TT.account.firstName() + '!' : TT.account.email() }),
            TT.account.firstName() ? h('p', { class: 'muted acct-email', text: TT.account.email() }) : null,
            h('span', { class: 'plan-badge p-' + plan, text: label + ' Plan' }),
            plan === 'free' ? h('button', { type: 'button', class: 'linkish plan-see', onclick: function () { tab = 'plans'; paint(); } }, 'See Plans') : null)),
        showSaved ? h('p', { class: 'sync-status s-saved', text: 'Your new password is saved.' }) : null,
        h('p', { class: 'sync-status s-' + status, text: STATUS[status] || '' }),
        sync,
        h('div', { class: 'row' }, outBtn, outConfirm));
    }

    var billing = 'month';
    function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); }
    function plansCard() {
      var plan = TT.account.plan(), prem = plan === 'premium' || plan === 'owner';
      var F = PLANS.free, P = PLANS.premium;
      var mo = parseFloat(String(CFG.priceMonthly).replace(/[^0-9.]/g, '')) || 0;
      var yr = parseFloat(String(CFG.priceYearly).replace(/[^0-9.]/g, '')) || 0;
      var off = CFG.earlyDiscount || 0.25;
      var until = new Date((CFG.earlyUntil || '2027-01-01') + 'T00:00:00');
      var earlyOpen = new Date() < until;
      var untilText = new Date(until.getTime() - 86400000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
      var save = mo && yr ? Math.round((1 - yr / (mo * 12)) * 100) : 0;
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
        if (plan === 'premium') return CFG.manageLink ? cta('Manage My Plan', '', { href: CFG.manageLink, blank: true }) : cta('Your Plan', '', { disabled: true });
        if (!user) return cta(label, 'primary', { onclick: needAccount });
        var linkUrl = yearly ? yearlyLink : monthly;
        return linkUrl ? cta(label, 'primary', { href: payLink(linkUrl) }) : cta('Coming Soon', '', { disabled: true });
      }
      function list(lead, items) {
        return h('div', { class: 'plan-list' }, h('p', { class: 'plan-lead', text: lead }),
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
        h('p', { class: 'plan-note', text: 'No card needed. Works without an account too, saving on that computer.' }),
        list('Get started with:', [
          ['Every tool and game'],
          ['Saves to your account', 'Use it on any computer'],
          [F.screens + ' saved board screen'],
          [F.classes + ' class lists'],
          [F.questions + ' of your own questions and rooms']])));
      cols.push(h('div', { class: 'plan-col featured' },
        h('div', { class: 'plan-top' }, h('h3', { text: 'Premium' }), h('span', { class: 'plan-tag', text: 'Recommended' })),
        h('p', { class: 'plan-desc', text: 'More room for every class, and your own photos on the board.' }),
        priceBlock(yearly ? money(yr) : money(mo)),
        paidCta(CFG.premiumMonthlyLink, CFG.premiumYearlyLink, 'Get Premium'),
        h('p', { class: 'plan-note', text: yearly ? 'Billed once a year. Cancel anytime.' : 'Billed monthly. Cancel anytime.' }),
        list('Everything in Free, plus:', [
          [P.screens + ' saved board screens'],
          ['Unlimited class lists'],
          ['Unlimited questions and escape rooms'],
          ['Your own photo backgrounds']])));
      if (earlyOpen) cols.push(h('div', { class: 'plan-col early' },
        h('div', { class: 'plan-top' }, h('h3', { text: 'Early Access' }), h('span', { class: 'plan-tag early-tag', text: Math.round(off * 100) + '% Off' })),
        h('p', { class: 'plan-desc', text: 'Premium for early members who join before ' + untilText + '.' }),
        priceBlock(yearly ? money(yr * (1 - off)) : money(mo * (1 - off)), yearly ? money(yr) : money(mo)),
        paidCta(CFG.earlyMonthlyLink, CFG.earlyYearlyLink, 'Get Early Access'),
        h('p', { class: 'plan-note', text: 'Only until ' + untilText + '. Cancel anytime.' }),
        list('Everything in Premium, plus:', [
          [Math.round(off * 100) + '% off Premium', 'For members who join before ' + untilText]])));

      var toggle = h('div', { class: 'segmented bill-toggle', role: 'group', 'aria-label': 'Billing' },
        [['month', 'Monthly'], ['year', 'Yearly' + (save > 0 ? ' (Save ' + save + '%)' : '')]].map(function (o) {
          return h('button', { type: 'button', class: 'seg' + (billing === o[0] ? ' on' : ''), 'aria-pressed': billing === o[0], onclick: function () { billing = o[0]; paint(); } }, o[1]);
        }));
      return h('section', { class: 'pricing' },
        h('div', { class: 'pricing-head' }, h('h2', { text: 'Start Free. Upgrade Anytime.' }),
          h('p', { class: 'muted', text: 'Every tool and game is free. Premium gives you more room and your own photos.' }), toggle),
        h('div', { class: 'pricing-grid cols-' + cols.length }, cols));
    }

    var tab = 'account';
    function tabs() {
      return h('div', { class: 'acct-tabs', role: 'tablist', 'aria-label': 'Account sections' },
        [['account', user ? 'My Account' : 'Sign In'], ['plans', 'Plans and Pricing']].map(function (t) {
          return h('button', { type: 'button', role: 'tab', class: 'acct-tab' + (tab === t[0] ? ' on' : ''), 'aria-selected': tab === t[0] ? 'true' : 'false',
            onclick: function () { if (tab !== t[0]) { tab = t[0]; paint(); } } }, t[1]);
        }));
    }
    function paint() {
      // Rebuilding the page must not jump the scroll position.
      var y = window.scrollY;
      root.style.minHeight = root.offsetHeight + 'px';
      root.textContent = '';
      if (!enabled) { root.append(h('section', { class: 'acct-card' }, h('h2', { text: 'Accounts Are Coming Soon' }), h('p', { class: 'muted', text: 'For now, everything saves on this computer.' }))); return; }
      root.append(tabs());
      if (tab === 'plans') root.append(plansCard());
      else {
        if (user && resetting()) root.append(resetCard());
        if (user) root.append(accountCard());
        else root.append(h('div', { class: 'acct-row' }, signInCard(), sideCard()));
      }
      root.style.minHeight = '';
      if (window.scrollY !== y) window.scrollTo(0, y);
    }
    TT.account.onChange(paint);
    TT.account.openPlans = function () { tab = 'plans'; paint(); };
    if (TT.account.wantPlans) { tab = 'plans'; TT.account.wantPlans = false; }
    paint();
    return { show: function () { if (TT.account.wantPlans) { tab = 'plans'; TT.account.wantPlans = false; } loadPlan(); paint(); } };
  };

  // ---------- Top bar button ----------
  var navBtn = null;
  function paintNav() {
    if (!navBtn) return;
    var signed = !!(user || meta.userId);
    navBtn.textContent = '';
    if (signed) {
      var em = TT.account.firstName() || TT.account.email() || '?';
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
