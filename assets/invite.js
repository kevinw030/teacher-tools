// Invite codes: every account has its own code and link (edsidekick.com/account?invite=CODE).
// A new account that signs up with a code gets 3 free days of Plus, and so does the person who invited them
// (rewarded for up to 10 friends, 30 days). The server decides everything (supabase/invites.sql):
// this file only remembers the code from the link, asks the server to use it once the new account
// is signed in, and shows the "Invite Friends" box in My Account.
(function () {
  var TT = window.TT, h = TT.h;
  if (!TT || !TT.account) return;
  var KEY = 'tt-invite';          // the code from a link, kept on this computer only (not synced, not in backups)
  var KEEP_DAYS = 14;
  var DAYS = 3, MAX = 10;
  var info = null, loading = false, failed = false, setupMissing = false, tried = false, version = 0;
  var redeemMsg = '', redeemOk = false, redeemBusy = false;

  function clean(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12); }
  function stored() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && v.code && Date.now() - (v.at || 0) < KEEP_DAYS * 864e5) return v.code;
    } catch (e) {}
    return '';
  }
  function store(code) {
    code = clean(code);
    try { if (code.length >= 4) localStorage.setItem(KEY, JSON.stringify({ code: code, at: Date.now() })); else localStorage.removeItem(KEY); } catch (e) {}
  }
  function forget() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function bump() { version++; TT.account.onChange && emitSoon(); }
  var emitTimer = null;
  // Ask the account page to repaint (it repaints only when its signature changes, and sig() includes our version).
  function emitSoon() { clearTimeout(emitTimer); emitTimer = setTimeout(function () { window.dispatchEvent(new Event('tt:invite')); }, 0); }

  // ---------- Arriving from a friend's link ----------
  (function () {
    var m = location.search.match(/[?&](?:invite|ref)=([^&#]+)/i);
    if (!m) return;
    var code = clean(decodeURIComponent(m[1]));
    var rest = location.search.replace(/([?&])(?:invite|ref)=[^&#]*&?/i, '$1').replace(/[?&]$/, '');
    try { history.replaceState(null, '', location.pathname + rest + location.hash); } catch (e) {}
    if (code.length < 4) return;
    store(code);
    // Not signed in on this computer yet: open the Create an Account form.
    var signedBefore = false;
    try { signedBefore = !!(JSON.parse(localStorage.getItem('tt-account') || '{}').userId); } catch (e) {}
    if (!signedBefore) TT.account.wantMode = 'signup';
  })();

  // ---------- Using a code once the new account is signed in ----------
  function rpc(name, args) {
    var sb = TT.account.client();
    if (!sb) return Promise.reject(new Error('offline'));
    return sb.rpc(name, args || {}).then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function missing(err) { return err && (err.code === 'PGRST202' || err.code === '42883' || /could not find the function|does not exist/i.test(err.message || '')); }

  function redeem(code, fromBox) {
    return rpc('redeem_invite', { invite_code: code }).then(function (res) {
      res = res || {};
      if (res.ok) {
        forget();
        redeemOk = true;
        redeemMsg = 'Invite code added! You have ' + DAYS + ' free days of Plus. Enjoy!';
        toast('🎉 Welcome! You and your friend each got ' + DAYS + ' free days of Plus.');
        info = null; TT.account.refreshPlan();
        load();
      } else {
        // Codes that can never work here are forgotten so we don't keep trying.
        forget();
        redeemOk = false;
        redeemMsg = res.reason === 'own_code' ? 'That’s your own invite code. Share it with a friend instead!'
          : res.reason === 'already' ? 'This account has already used an invite code.'
          : res.reason === 'not_new' ? 'Invite codes are for brand-new accounts.'
          : 'We couldn’t find that invite code. Check the letters and try again.';
        if (!fromBox && res.reason !== 'already') toast(redeemMsg);
      }
      bump();
      return res;
    }, function (err) {
      if (missing(err)) setupMissing = true;   // invites.sql not run yet: keep the code and try again later
      redeemOk = false;
      redeemMsg = setupMissing ? 'Invite codes are almost ready. Your code is saved and will be added soon.' : 'Couldn’t reach the server. Try again in a moment.';
      bump();
      return { ok: false, reason: 'offline' };
    });
  }
  function tryStored() {
    var code = stored(), u = TT.account.user();
    if (!code || !u || tried) return;
    tried = true;
    redeem(code, false);
  }
  TT.account.onChange(function () { if (TT.account.user()) tryStored(); else { tried = false; info = null; } });

  // ---------- My Account: my code and invites ----------
  function load() {
    if (loading || !TT.account.user()) return;
    loading = true; failed = false;
    rpc('my_invites').then(function (d) { info = d || null; loading = false; bump(); },
      function (err) { loading = false; failed = true; if (missing(err)) setupMissing = true; bump(); });
  }
  function link() { return 'https://edsidekick.com/account?invite=' + (info && info.code || ''); }
  function copy(text, btn) {
    function done(ok) {
      var label = btn.querySelector('span') || btn;
      var was = label.textContent;
      label.textContent = ok ? 'Copied!' : 'Press Ctrl+C to Copy';
      btn.classList.toggle('copied', ok);
      setTimeout(function () { label.textContent = was; btn.classList.remove('copied'); }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallback()); });
    else done(fallback());
    function fallback() {
      var t = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0' }); t.value = text; document.body.append(t); t.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} t.remove(); return ok;
    }
  }
  function fmtDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }); }

  function card() {
    if (!TT.account.user()) return null;
    if (!info && !loading && !failed) load();
    var box = h('section', { class: 'invite-box', 'aria-label': 'Invite Friends' });
    var head = h('div', { class: 'invite-head' },
      h('span', { class: 'invite-gift', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>' }),
      h('div', null, h('h3', { text: 'Invite Friends, Get Free Plus' }),
        h('p', { class: 'muted', text: 'When a friend makes a new account with your link, you each get ' + DAYS + ' free days of Plus. Invite up to ' + MAX + ' friends for ' + (DAYS * MAX) + ' free days.' })));
    box.append(head);

    if (!info) {
      box.append(h('p', { class: 'invite-wait muted', role: 'status', text: setupMissing ? 'Invite codes are coming very soon.' : failed ? 'Couldn’t load your invite code. Check the internet connection.' : 'Getting your invite code…' }));
      if (failed && !setupMissing) box.append(TT.button('Try Again', { kind: 'small', onclick: function () { failed = false; load(); bump(); } }));
      return box;
    }

    var copyBtn = TT.button('Copy Link', { kind: 'primary', onclick: function () { copy(link(), copyBtn); } });
    var share = navigator.share ? TT.button('Share', { kind: '', onclick: function () {
      navigator.share({ title: 'ED Sidekick', text: 'Try ED Sidekick, the classroom toolbox I use! Sign up with my link and we both get ' + DAYS + ' free days of Plus.', url: link() }).catch(function () {});
    } }) : null;
    box.append(h('div', { class: 'invite-code-row' },
      h('div', { class: 'invite-code' }, h('small', { text: 'Your Invite Code' }), h('b', { text: info.code })),
      h('div', { class: 'invite-link' }, h('small', { text: 'Your Link' }), h('span', { class: 'invite-url', text: link().replace('https://', '') })),
      h('div', { class: 'invite-actions' }, copyBtn, share)));

    var n = info.invites || 0, got = Math.min(n, MAX);
    var dots = h('div', { class: 'invite-dots', role: 'img', 'aria-label': got + ' of ' + MAX + ' invite rewards earned' });
    for (var i = 0; i < MAX; i++) dots.append(h('span', { class: 'invite-dot' + (i < got ? ' on' : '') }));
    box.append(h('div', { class: 'invite-progress' },
      h('div', { class: 'invite-count' },
        h('b', { text: String(n) }), h('span', { text: n === 1 ? ' friend joined' : ' friends joined' })),
      dots,
      h('p', { class: 'muted invite-earned', text: got >= MAX ? 'You earned the full ' + (DAYS * MAX) + ' free days. Thank you for spreading the word!'
        : got ? 'You earned ' + (got * DAYS) + ' free days so far. ' + (MAX - got) + ' more ' + (MAX - got === 1 ? 'invite' : 'invites') + ' can still earn days.'
        : 'No invites yet. Share your link with a teacher friend!' })));
    if (info.plus_until && Date.parse(info.plus_until) > Date.now() && TT.account.paidPlan() === 'premium') {
      box.append(h('p', { class: 'muted invite-note', text: 'You already pay for Plus, so your free days are saved on your account and nothing about your plan or billing changes.' }));
    }

    // Brand-new accounts that came without a link can still type a code.
    if (info.can_redeem || redeemMsg) {
      var input = h('input', { type: 'text', class: 'invite-input', placeholder: 'Friend’s Code', 'aria-label': 'Friend’s invite code', maxlength: '12', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
      var add = TT.button(redeemBusy ? 'Adding…' : 'Add Code', { kind: 'small' });
      add.disabled = redeemBusy;
      add.addEventListener('click', function () {
        var c = clean(input.value);
        if (c.length < 4) { redeemMsg = 'Type the invite code your friend sent you.'; redeemOk = false; bump(); return; }
        redeemBusy = true; bump();
        redeem(c, true).then(function () { redeemBusy = false; bump(); });
      });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') add.click(); });
      box.append(h('div', { class: 'invite-redeem' },
        info.can_redeem ? h('div', { class: 'invite-redeem-row' }, h('span', { class: 'invite-redeem-q', text: 'Did a friend invite you?' }), input, add) : null,
        redeemMsg ? h('p', { class: 'invite-msg' + (redeemOk ? ' ok' : ''), role: 'status', text: redeemMsg }) : null));
    }
    return box;
  }

  // ---------- The sign-up form ----------
  // "Invite Code (optional)", filled in from the link.
  function field() {
    var code = stored();
    var input = h('input', { type: 'text', id: 'acctInvite', placeholder: 'Invite Code (optional)', 'aria-label': 'Invite code (optional)', maxlength: '12', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
    input.value = code;
    if (code) input.classList.add('has-invite');
    return input;
  }
  // Save whatever is typed in that box, so it is used as soon as the account exists (email or Google).
  function keepTyped() {
    var el = document.getElementById('acctInvite');
    if (!el) return;
    var c = clean(el.value);
    if (c.length >= 4) store(c); else if (!c) forget();
  }
  function banner() {
    return h('div', { class: 'invite-banner', role: 'note' },
      h('span', { class: 'invite-banner-ico', 'aria-hidden': 'true', text: '🎁' }),
      h('p', null, h('b', { text: 'A friend invited you!' }), ' Create your free account and you’ll both get ' + DAYS + ' free days of Plus.'));
  }

  function toast(text) {
    function show() {
      var n = h('div', { class: 'invite-toast', role: 'status', text: text });
      document.body.append(n);
      setTimeout(function () { n.classList.add('out'); setTimeout(function () { n.remove(); }, 400); }, 6500);
    }
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }

  TT.invite = {
    code: stored, field: field, keepTyped: keepTyped, banner: banner, card: card,
    sig: function () { return version; }
  };
})();
// The My Account page asks for the Invite Friends box here too.
window.TT.inviteCard = function () { return window.TT.invite ? window.TT.invite.card() : null; };
