// Sign-in gate (Kevin, 2026-11-23): every tool, game and daily routine needs an account (Free is enough).
// Signed-out visitors can still see the home page, My Account (sign in, sign up, plans), /privacy and /terms.
// Students never need an account: /join is its own page (join.html) and doesn't load this file.
// assets/app.js asks TT.signinGate.blocks(page) before opening a page, and shows the gate card instead.
(function () {
  var TT = window.TT, h = TT.h;
  // Pages anyone can open without signing in.
  var OPEN = { home: 1, account: 1, games: 1 };   // games = the list of games, so visitors can see what's here
  var RETURN_KEY = 'tt-after-signin';

  // Supabase keeps the session in localStorage (sb-<project>-auth-token), so a returning teacher
  // isn't shown the gate for a split second while the sign-in library loads.
  function storedSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k) && localStorage.getItem(k)) return true; }
    } catch (e) {}
    return false;
  }
  function on() { return !!(TT.account && TT.account.enabled); }
  function signedIn() {
    if (!on()) return true;
    if (TT.account.signedIn()) return true;
    // Until the library has checked, trust a saved session. Offline with a saved session also counts.
    var known = TT.account.known ? TT.account.known() : true;
    return (!known || TT.account.status() === 'offline') && storedSession();
  }
  function blocks(name) { return !OPEN[name] && !signedIn(); }

  // ---------- The gate page ----------
  var view = null, mascot = null, titleEl = null, textEl = null, shownFor = '';
  function remember(name) { try { if (name) sessionStorage.setItem(RETURN_KEY, name); else sessionStorage.removeItem(RETURN_KEY); } catch (e) {} }
  function toAccount(mode) {
    remember(shownFor);
    TT.account.wantMode = mode;
    TT.account.wantPlans = false;
    if (TT.track) TT.track('signin-gate', mode + ':' + shownFor);
    TT.go('account');
  }
  function google() {
    remember(shownFor);
    if (TT.track) TT.track('signin-gate', 'google:' + shownFor);
    if (TT.account.ready && TT.account.ready() && TT.account.google) TT.account.google();
    else toAccount('signup');
  }
  function arrow() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>'; }
  var G_LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  function build() {
    titleEl = h('h1', { class: 'sg-title', id: 'sgTitle' });
    textEl = h('p', { class: 'sg-text' });
    var useGoogle = TT.account.config && TT.account.config.google;
    var teacher = h('section', { class: 'sg-card sg-teacher', 'aria-labelledby': 'sgTitle' },
      h('div', { class: 'sg-mascot', id: 'sgMascot' }),
      h('div', { class: 'sg-body' },
        h('span', { class: 'sg-eyebrow', text: 'Free Account' }),
        titleEl, textEl,
        h('div', { class: 'sg-actions' },
          h('button', { type: 'button', class: 'sg-btn sg-main', onclick: function () { toAccount('signup'); }, html: '<span>Create a Free Account</span>' + arrow() }),
          useGoogle ? h('button', { type: 'button', class: 'sg-btn sg-google', onclick: google, html: G_LOGO + '<span>Continue With Google</span>' }) : null),
        h('p', { class: 'sg-have' }, 'Already have an account? ',
          h('button', { type: 'button', class: 'linkish sg-login', onclick: function () { toAccount('login'); }, text: 'Log In' })),
        h('p', { class: 'sg-fine', text: 'The free account needs no card. For grown-ups 13 and up.' })));
    // Students never sign in here: they go straight to edsidekick.com/join (Kevin, 2026-11-24).
    var student = h('p', { class: 'sg-join-line' },
      h('span', { text: 'Students don’t need an account. They go to ' }),
      h('span', { class: 'sg-url', text: 'edsidekick.com/join' }));
    view = h('main', { class: 'page sg-page', id: 'view-signin', hidden: true },
      h('div', { class: 'sg-wrap' }, teacher, student,
        h('a', { class: 'sg-home', href: '/', text: 'Back to Home' })));
    var nav = document.querySelector('.nav');
    if (nav && nav.parentNode) nav.parentNode.insertBefore(view, nav.nextSibling); else document.body.append(view);
  }

  // name: the page that was asked for, or null to hide the gate.
  function show(name, title) {
    if (!name) { if (view) view.hidden = true; return; }
    if (!view) build();
    shownFor = name;
    var isGame = TT.games && TT.games.some(function (g) { return g.id === name; });
    titleEl.textContent = title ? 'Sign In to Use ' + title : 'Sign In to Use ED Sidekick';
    textEl.textContent = 'Create a free account or log in to open ' + (title || (isGame ? 'the games' : 'the tools and games')) + '. It only takes a minute, and you’ll come right back here.';
    view.hidden = false;
    if (!mascot && TT.mascot) { mascot = TT.mascot({ mood: 'wave' }); document.getElementById('sgMascot').append(mascot); setTimeout(function () { mascot.mood('idle'); }, 2200); }
    else if (mascot && mascot.play) mascot.play('wave');
  }

  // ---------- Home page note for visitors ----------
  var note = null;
  function paintHomeNote() {
    var home = document.getElementById('view-home');
    if (!home) return;
    var need = on() && !signedIn();
    if (!need) { if (note) { note.remove(); note = null; } return; }
    if (note) return;
    var lock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10.5" width="16" height="10.5" rx="3"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.6" r="1.4" fill="currentColor" stroke="none"/></svg>';
    note = h('section', { class: 'sg-note', 'aria-label': 'Sign in' },
      h('div', { class: 'sg-note-main' },
        h('span', { class: 'sg-note-icon', html: lock }),
        h('div', { class: 'sg-note-text' },
          h('strong', { text: 'Sign In to Open the Tools and Games' }),
          h('span', { text: 'Create a free account to open the tools and games. It only takes a minute.' })),
        h('div', { class: 'sg-note-actions' },
          h('button', { type: 'button', class: 'sg-btn sg-main', onclick: function () { shownFor = ''; toAccount('signup'); }, html: '<span>Create a Free Account</span>' + arrow() }),
          h('button', { type: 'button', class: 'sg-btn sg-plain', onclick: function () { shownFor = ''; toAccount('login'); }, text: 'Log In' }))),
      h('p', { class: 'sg-join-line' },
        h('span', { text: 'Students don’t need an account. They go to ' }),
        h('span', { class: 'sg-url', text: 'edsidekick.com/join' })));
    var welcome = home.querySelector('.welcome');
    if (welcome && welcome.nextSibling) home.insertBefore(note, welcome.nextSibling); else home.prepend(note);
  }

  // When sign-in finishes (or the library finds there's no session), open the right page.
  var lastState = null;
  function refresh() {
    var state = signedIn();
    paintHomeNote();
    if (state && TT.account && TT.account.signedIn()) {
      var back = null;
      try { back = sessionStorage.getItem(RETURN_KEY); sessionStorage.removeItem(RETURN_KEY); } catch (e) {}
      if (back && TT.pages && TT.pages[back] && TT.page() === 'account') { lastState = state; TT.go(back); return; }
    }
    if (lastState !== null && state !== lastState) window.dispatchEvent(new Event('tt:page'));
    lastState = state;
  }
  if (TT.account && TT.account.onChange) TT.account.onChange(refresh);
  document.addEventListener('DOMContentLoaded', function () { lastState = signedIn(); paintHomeNote(); });

  TT.signinGate = { blocks: blocks, show: show, signedIn: signedIn, open: OPEN };
})();
