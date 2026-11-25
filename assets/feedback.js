// "Suggest an Idea or Report a Bug" (Kevin, 2026-11-25). A pop-up where a signed-in member picks
// Tool Idea, Idea or Bug and writes a note. It is saved to the feedback table (supabase/feedback.sql),
// shows up in the Owner Dashboard (tools/feedback-owner.js), and a copy is emailed by the
// feedback-email function (supabase/functions/feedback-email).
// Ways in: any link with data-feedback (the footer link), the profile menu, the My Account card,
// and /account?feedback=1 (used by the Help, Privacy and Terms pages). Nothing ever pops up on its own.
(function () {
  var TT = window.TT, h = TT && TT.h;
  if (!TT || !TT.account) return;
  var MAX = 2000, AFTER = 'tt-feedback-after', SENT = 'tt-feedback-sent';
  var KINDS = [
    { id: 'tool', label: 'Tool Idea', sub: 'A new tool or game you’d like', color: 'violet',
      hint: 'What tool or game would help your class? What would it do?',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></svg>' },
    { id: 'idea', label: 'Idea', sub: 'Make something better', color: 'amber',
      hint: 'What could be better? Tell us what you’d change.',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z"/></svg>' },
    { id: 'bug', label: 'Bug', sub: 'Something isn’t working', color: 'rose',
      hint: 'What happened, and what did you expect? Which tool were you using?',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="13" rx="5"/><path d="M9 7a3 3 0 0 1 6 0M12 11v9M3 13h4M17 13h4M4 7l3 2M20 7l-3 2M4 19l3-2M20 19l-3-2"/></svg>' }
  ];
  var layer = null, lastFocus = null, kind = 'idea', draft = '', busy = false;

  // ---------- Small helpers ----------
  function browser() {
    var ua = navigator.userAgent || '', b = 'Browser', os = '';
    var m;
    if ((m = ua.match(/Edg\/(\d+)/))) b = 'Edge ' + m[1];
    else if ((m = ua.match(/OPR\/(\d+)/))) b = 'Opera ' + m[1];
    else if ((m = ua.match(/(?:Chrome|CriOS)\/(\d+)/))) b = 'Chrome ' + m[1];
    else if ((m = ua.match(/(?:Firefox|FxiOS)\/(\d+)/))) b = 'Firefox ' + m[1];
    else if ((m = ua.match(/Version\/(\d+).*Safari/))) b = 'Safari ' + m[1];
    if (/CrOS/.test(ua)) os = 'Chromebook';
    else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) os = 'iPad';
    else if (/iPhone/.test(ua)) os = 'iPhone';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua)) os = 'Mac';
    else if (/Linux/.test(ua)) os = 'Linux';
    return (b + (os ? ' on ' + os : '') + ' · ' + window.innerWidth + '×' + window.innerHeight).slice(0, 300);
  }
  function page() { return (location.pathname || '/').slice(0, 300); }
  function recent() {
    try { return (JSON.parse(localStorage.getItem(SENT) || '[]') || []).filter(function (t) { return Date.now() - t < 600e3; }); } catch (e) { return []; }
  }
  function remember() { var r = recent(); r.push(Date.now()); try { localStorage.setItem(SENT, JSON.stringify(r)); } catch (e) {} }
  function name() { return TT.account.firstName ? TT.account.firstName() : ''; }

  // ---------- The pop-up ----------
  function close() {
    if (!layer) return;
    var l = layer; layer = null;
    document.removeEventListener('keydown', onKey, true);
    l.classList.add('out');
    setTimeout(function () { l.remove(); }, 240);
    if (lastFocus && lastFocus.focus) try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
  }
  function onKey(e) {
    if (!layer) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      var f = layer.querySelectorAll('button:not([disabled]), textarea, a[href], input');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function shell(content, label) {
    var card = h('div', { class: 'fb-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': label },
      h('button', { type: 'button', class: 'fb-x', 'aria-label': 'Close', html: TT.icon('close'), onclick: close }), content);
    if (layer) { layer.textContent = ''; layer.append(card); return card; }
    lastFocus = document.activeElement;
    layer = h('div', { class: 'fb-layer', onclick: function (e) { if (e.target === layer) close(); } }, card);
    (document.fullscreenElement || document.body).append(layer);
    document.addEventListener('keydown', onKey, true);
    return card;
  }
  function head(title, sub) {
    return h('div', { class: 'fb-head' },
      h('span', { class: 'fb-badge', 'aria-hidden': 'true', html: KINDS[1].icon }),
      h('div', null, h('h2', { text: title }), sub ? h('p', { class: 'muted', text: sub }) : null));
  }

  function signInPrompt() {
    function go(mode) {
      try { sessionStorage.setItem(AFTER, '1'); } catch (e) {}
      close(); TT.account.wantMode = mode; TT.account.wantSignIn = true; TT.account.wantPlans = false;
      TT.go('account', TT.page() === 'account');
    }
    var login = TT.button('Log In', { kind: 'primary big', onclick: function () { go('login'); } });
    shell(h('div', { class: 'fb-body' },
      head('Share an Idea or Report a Bug', 'Please sign in first, so we know who it’s from and can write back.'),
      h('div', { class: 'fb-actions' }, login, TT.button('Create a Free Account', { kind: 'big', onclick: function () { go('signup'); } })),
      h('p', { class: 'fb-fine muted', text: 'After you sign in, this box opens again so you can write your note.' })), 'Sign In to Send Feedback');
    login.focus({ preventScroll: true });
  }

  function form() {
    var msg = h('p', { class: 'fb-msg', role: 'alert', hidden: true });
    var box = h('textarea', { class: 'fb-text', maxlength: String(MAX), rows: '6', 'aria-label': 'Your note' });
    box.value = draft;
    var count = h('span', { class: 'fb-count', 'aria-hidden': 'true' });
    var chips = h('div', { class: 'fb-kinds', role: 'radiogroup', 'aria-label': 'What kind of note?' });
    function paintKinds() {
      var k = KINDS.filter(function (x) { return x.id === kind; })[0];
      chips.querySelectorAll('.fb-kind').forEach(function (b) {
        var on = b.getAttribute('data-kind') === kind;
        b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
      });
      box.placeholder = k.hint;
    }
    KINDS.forEach(function (k, i) {
      chips.append(h('button', { type: 'button', role: 'radio', class: 'fb-kind c-' + k.color, 'data-kind': k.id, style: '--i:' + i,
        onclick: function () { kind = k.id; paintKinds(); box.focus(); },
        onkeydown: function (e) {
          var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
          if (!d) return; e.preventDefault();
          kind = KINDS[(i + d + KINDS.length) % KINDS.length].id; paintKinds();
          chips.querySelector('[data-kind="' + kind + '"]').focus();
        } },
        h('span', { class: 'fb-kind-ico', 'aria-hidden': 'true', html: k.icon }),
        h('span', { class: 'fb-kind-words' }, h('b', { text: k.label }), h('small', { text: k.sub }))));
    });
    function paintCount() {
      var n = box.value.length;
      count.textContent = n + ' / ' + MAX;
      count.classList.toggle('near', n > MAX - 150);
    }
    box.addEventListener('input', function () { draft = box.value; paintCount(); if (!msg.hidden) msg.hidden = true; });
    var send = TT.button('Send', { kind: 'primary big fb-send', onclick: submit });
    function say(text) { msg.textContent = text; msg.hidden = !text; }
    function submit() {
      if (busy) return;
      var text = box.value.trim();
      if (text.length < 3) { say('Please write a little more so we know what you mean.'); box.focus(); return; }
      if (recent().length >= 3) { say('Thanks for all the notes! Please wait a few minutes before sending another.'); return; }
      var sb = TT.account.client();
      if (!sb || !TT.account.user()) { signInPrompt(); return; }
      busy = true; send.disabled = true; send.lastChild.textContent = 'Sending…';
      // No .select() after the insert: members can add notes but can't read them back.
      sb.from('feedback').insert({ kind: kind, message: text.slice(0, MAX), page: page(), browser: browser() }).then(function (res) {
        busy = false; send.disabled = false; send.lastChild.textContent = 'Send';
        if (res.error) {
          var m = (res.error.message || '') + ' ' + (res.error.code || '');
          if (/too_many|P0429/.test(m)) say('Thanks for all the notes! Please wait a little while before sending another.');
          else if (/42P01|PGRST205|relation .* does not exist|could not find the table/i.test(m)) say('Feedback is almost ready. Please try again later today.');
          else if (/sign in|42501|JWT/i.test(m)) { signInPrompt(); }
          else say('That didn’t send. Check the internet connection and try again.');
          return;
        }
        remember();
        // Ask the server to email a copy. If that part isn't set up yet, the note is still saved.
        try { if (sb.functions) sb.functions.invoke('feedback-email', { body: {} }).catch(function () {}); } catch (e) {}
        if (TT.track) try { TT.track('feedback', kind); } catch (e) {}
        draft = ''; thanks();
      }, function () {
        busy = false; send.disabled = false; send.lastChild.textContent = 'Send';
        say('That didn’t send. Check the internet connection and try again.');
      });
    }
    var who = name(), email = TT.account.email();
    shell(h('div', { class: 'fb-body' },
      head('Share an Idea or Report a Bug', 'Tell us what would help your classroom, or what isn’t working. We read every note.'),
      chips,
      h('label', { class: 'fb-field' }, box, count),
      h('p', { class: 'fb-fine muted' },
        'Sending as ', h('b', { text: who || email }), who && email ? ' (' + email + ')' : '',
        '. We also include the page you’re on and your browser, so bugs are easier to fix. Please leave out student names.'),
      msg,
      h('div', { class: 'fb-actions' }, send, TT.button('Cancel', { kind: 'big', onclick: close }))), 'Share an Idea or Report a Bug');
    paintKinds(); paintCount();
    setTimeout(function () { box.focus({ preventScroll: true }); }, 60);
  }

  function thanks() {
    var k = KINDS.filter(function (x) { return x.id === kind; })[0];
    var buddy = TT.mascot ? TT.mascot({ mood: 'cheer' }) : null;
    var done = TT.button('Done', { kind: 'primary big', onclick: close });
    shell(h('div', { class: 'fb-body fb-thanks' },
      buddy ? h('div', { class: 'fb-mascot' }, buddy) : h('span', { class: 'fb-badge big', 'aria-hidden': 'true', html: k.icon }),
      h('h2', { text: 'Thank You' + (name() ? ', ' + name() : '') + '!' }),
      h('p', { class: 'muted', text: kind === 'bug' ? 'Your bug report is on its way. We’ll take a look and fix it as soon as we can.' : 'Your ' + k.label.toLowerCase() + ' is on its way. Ideas like yours make ED Sidekick better for every class.' }),
      h('div', { class: 'fb-actions' }, done)), 'Thank You');
    done.focus({ preventScroll: true });
  }

  function open(k) {
    if (k && KINDS.some(function (x) { return x.id === k; })) kind = k;
    if (TT.account.enabled === false) return;
    if (!TT.account.user()) {
      // The account may still be loading right after the page opens.
      if (TT.account.known && !TT.account.known()) { shell(h('div', { class: 'fb-body' }, head('One Moment…', 'Checking your account.')), 'One Moment'); return; }
      signInPrompt(); return;
    }
    form();
  }

  // ---------- Ways in ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-feedback]');
    if (!a) return;
    e.preventDefault();
    open(a.getAttribute('data-feedback') || '');
  });
  // /account?feedback=1 (from the Help, Privacy and Terms pages), or coming back after signing in.
  var wantOpen = false;
  (function () {
    if (/[?&]feedback=1/.test(location.search)) {
      wantOpen = true;
      var rest = location.search.replace(/([?&])feedback=1&?/, '$1').replace(/[?&]$/, '');
      try { history.replaceState(null, '', location.pathname + rest + location.hash); } catch (e) {}
    }
  })();
  function after() { try { return sessionStorage.getItem(AFTER) === '1'; } catch (e) { return false; } }
  function check() {
    var known = !TT.account.known || TT.account.known();
    if (!known || (TT.account.loading && TT.account.loading())) return;
    if (TT.account.user() && after()) { try { sessionStorage.removeItem(AFTER); } catch (e) {} wantOpen = false; setTimeout(form, 400); return; }
    if (wantOpen) { wantOpen = false; setTimeout(function () { open(); }, 300); return; }
    // Still waiting in the pop-up while the account loaded: show the right thing now.
    if (layer && layer.querySelector('.fb-card[aria-label="One Moment"]')) open();
  }
  TT.account.onChange(check);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(check, 600); }); else setTimeout(check, 600);

  // ---------- The card on My Account ----------
  TT.feedbackCard = function () {
    if (!TT.account.user()) return null;
    return h('section', { class: 'ah-card fb-acct' },
      h('div', { class: 'fb-acct-top' },
        h('span', { class: 'fb-acct-ico', 'aria-hidden': 'true', html: KINDS[1].icon }),
        h('div', null, h('h2', { text: 'Have an Idea? Found a Bug?' }),
          h('p', { class: 'muted', text: 'Tell us what tool you’d love next, what could be better, or what isn’t working.' }))),
      h('div', { class: 'fb-acct-row' }, KINDS.map(function (k) {
        return h('button', { type: 'button', class: 'fb-acct-btn c-' + k.color, onclick: function () { open(k.id); } },
          h('span', { class: 'fb-acct-btn-ico', 'aria-hidden': 'true', html: k.icon }), h('span', { text: k.id === 'bug' ? 'Report a Bug' : k.id === 'tool' ? 'Suggest a Tool' : 'Share an Idea' }));
      })));
  };

  TT.feedback = { open: open, close: close, kinds: KINDS };
})();
