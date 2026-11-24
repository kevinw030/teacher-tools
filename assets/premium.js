// Premium: what the Free plan leaves locked, the little Premium tags, and the pop-up that explains the plan.
// Clicking anything locked opens the pop-up. Nothing is locked while accounts are switched off.
// Locked on Free: Seating Chart, Prompts, every escape room except The Locked Library, and editing a room's questions.
(function () {
  var TT = window.TT, h = TT.h;
  // Class Bingo is free for now (Kevin, 2026-11-23). To make it Premium, add  bingo: 1  here, add /bingo to the
  // Premium tag selectors in premium.css, and add it to TT.PLAN_FEATURES in account.js.
  var LOCKED_VIEWS = { seating: 1, prompts: 1, trivia: 1 };
  var FREE_ROOMS = { library: 1 };

  var COPY = {
    rooms: ['Unlock Every Escape Room', 'The Space Station, Pirate Treasure and Museum rooms come with Plus. The Locked Library is always free.'],
    roomEdit: ['Make Any Room Your Own', 'Write your own question for any spot in a room, so an escape room can review this week’s lesson.'],
    seating: ['Seating Chart Is a Plus Tool', 'Build your room, then drag students to their seats or shuffle them. Each class list keeps its own chart.'],
    prompts: ['Prompts Is a Plus Tool', 'Writing prompts, discussion starters and This or That questions for your grade, each with a helper.'],
    screens: ['Save More Board Screens', 'Free accounts save 2 board screens. Plus saves as many as you like, one for every part of your day.'],
    classes: ['Add More Class Lists', 'Free accounts keep 2 class lists. Plus keeps as many as you teach.'],
    trivia: ['Trivia Showdown Is a Plus Game', 'A quiz-show board with categories and points for 1 to 4 teams, picked by grade. Write your own trivia questions for it too.'],
    bingo: ['Class Bingo Is a Plus Game', 'Bingo cards made from your vocabulary words or math facts. Play on the board, print a class set, or let students join on their own devices with a class code.'],
    dashboard: ['Make Your Home Page Your Own', 'Make your own categories, then drag your tools and games into the order you use them. Your layout is saved to your account.'],
    plan: ['ED Sidekick Plus', 'Every escape room, Trivia Showdown, Seating Chart, Prompts and room for every class.']
  };

  // Used only if an older copy of account.js is still in the browser's cache.
  var FALLBACK_FEATURES = [['Unlimited Saved Board Screens'], ['Unlimited Class Lists'], ['All 4 Escape Rooms'], ['Edit the Questions in Any Room'],
    ['Seating Chart'], ['Prompts'], ['Trivia Showdown'], ['The Last 50 Exit Tickets'], ['Customize Your Home Page']];
  function fallbackPrices() {
    var C = window.TT_ACCOUNT_CONFIG || {}, mo = parseFloat(String(C.priceMonthly || '3.99').replace(/[^0-9.]/g, '')), yr = parseFloat(String(C.priceYearly || '34.99').replace(/[^0-9.]/g, ''));
    var until = new Date((C.earlyUntil || '2027-01-01') + 'T00:00:00');
    var e = { mo: parseFloat(String(C.earlyPriceMonthly || '2.99').replace(/[^0-9.]/g, '')), yr: parseFloat(String(C.earlyPriceYearly || '29.99').replace(/[^0-9.]/g, '')) };
    return { mo: mo, yr: yr, earlyOpen: new Date() < until, save: Math.round((1 - yr / (mo * 12)) * 100),
      price: function (top, yearly, isEarly) { return !isEarly ? { now: yearly ? yr : mo, was: 0 } : { now: yearly ? e.yr : e.mo, was: yearly ? mo * 12 : mo, off: yearly ? (C.earlyOffYearly || 0.37) : (C.earlyOffMonthly || 0.25) }; },
      untilText: new Date(until.getTime() - 86400000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) };
  }
  function has() { return TT.limit ? !!TT.limit('premium') : true; }

  TT.premium = {
    has: has,
    view: function (name) { return !LOCKED_VIEWS[name] || has(); },
    room: function (r) { return !r || r.mine || FREE_ROOMS[r.id] || has(); },
    // A small "Premium" tag with a lock, for cards and buttons.
    badge: function (cls) { return h('span', { class: 'pm-badge ' + (cls || ''), html: TT.icon('lock') + '<span>Plus</span>' }); },
    // The site owner sees which things are Premium (unlocked), so the plan can be checked at a glance.
    owner: function () { return !!(TT.account && TT.account.plan && TT.account.plan() === 'owner'); },
    ownerBadge: function () { return h('span', { class: 'pm-badge pm-owner-badge', title: 'Plus (Included With Your Account)', html: TT.icon('unlock') + '<span>Plus</span>' }); },
    // A button that does its job for Premium and opens the pop-up for everyone else.
    button: function (label, feature, fn, icon) {
      if (has()) return TT.button(label, { icon: icon, kind: 'small', onclick: fn });
      var b = TT.button(label, { icon: 'lock', kind: 'small pm-btn', onclick: function () { TT.premium.open(feature); } });
      b.append(TT.premium.badge('mini'));
      return b;
    },
    open: open
  };

  // A greyed-out button with a "Coming Soon!" tag.
  TT.soonButton = function (label) {
    var b = TT.button(label, { icon: 'plus', kind: 'small soon-btn' });
    b.disabled = true; b.setAttribute('aria-disabled', 'true'); b.title = 'Coming Soon';
    b.append(h('span', { class: 'soon-tag', text: 'Coming Soon!' }));
    return b;
  };

  // ---------- The pop-up ----------
  var layer = null, lastFocus = null, billing = 'month';
  function close() {
    if (!layer) return;
    var l = layer; layer = null;
    l.classList.add('out');
    setTimeout(function () { l.remove(); }, 260);
    document.removeEventListener('keydown', onKey, true);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

  function open(feature) {
    if (TT.track) TT.track('premium-popup', feature || 'plan');
    if (layer) layer.remove();
    lastFocus = document.activeElement;
    var copy = COPY[feature] || COPY.plan;
    var pr = TT.account && TT.account.prices ? TT.account.prices() : fallbackPrices();
    var money = TT.money || function (n) { return '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); };
    var signedIn = TT.account && TT.account.signedIn && TT.account.signedIn();

    var priceBox = h('div', { class: 'pm-price' });
    var toggle = h('div', { class: 'segmented pm-bill', role: 'group', 'aria-label': 'Billing' });
    function paintPrice() {
      var yearly = billing === 'year', p = pr.price(false, yearly, pr.earlyOpen);
      priceBox.textContent = '';
      // Built with TT.h so a missing piece is skipped (a plain append would print "null").
      priceBox.append(h('div', { class: 'pm-price-in' },
        pr.earlyOpen ? h('span', { class: 'pm-early', text: 'Early Access · ' + Math.round(p.off * 100) + '% Off' }) : null,
        h('div', { class: 'pm-amount' }, p.was ? h('s', { text: money(p.was) }) : null, h('b', { text: money(p.now) }), h('span', { text: yearly ? ' / year' : ' / month' })),
        h('small', { text: (pr.earlyOpen ? 'Early price for members who join by ' + pr.untilText + '. ' : '') + (yearly ? 'Billed once a year. Cancel anytime.' : 'Billed monthly. Cancel anytime.') })));
      toggle.textContent = '';
      [['month', 'Monthly'], ['year', 'Yearly' + (pr.save > 0 ? ' · Save ' + pr.save + '%' : '')]].forEach(function (o) {
        toggle.append(h('button', { type: 'button', class: 'seg' + (billing === o[0] ? ' on' : ''), 'aria-pressed': billing === o[0] ? 'true' : 'false',
          onclick: function () { billing = o[0]; paintPrice(); } }, o[1]));
      });
    }
    paintPrice();

    var feats = (TT.PLAN_FEATURES && TT.PLAN_FEATURES.premium && TT.PLAN_FEATURES.premium.length) ? TT.PLAN_FEATURES.premium : FALLBACK_FEATURES;
    var list = h('ul', { class: 'pm-list' }, feats.map(function (t, i) {
      return h('li', { style: '--i:' + i }, h('span', { class: 'tick', 'aria-hidden': 'true', text: '✓' }), h('span', null, t[0], t[1] ? h('small', { text: t[1] }) : null));
    }));
    var go = TT.button('Get Plus', { kind: 'primary big pm-go', onclick: function () {
      close(); TT.account.wantPlans = true;
      if (TT.page() === 'account' && TT.account.openPlans) TT.account.openPlans(); else TT.go('account');
    } });
    var later = TT.button('Maybe Later', { kind: 'big', onclick: close });

    var card = h('div', { class: 'pm-card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pmTitle' },
      h('button', { type: 'button', class: 'pm-x', 'aria-label': 'Close', html: TT.icon('close'), onclick: close }),
      h('div', { class: 'pm-top' },
        h('span', { class: 'pm-icon', html: TT.icon('lock') }),
        h('div', null, h('span', { class: 'pm-eyebrow', text: 'ED Sidekick Plus' }), h('h2', { id: 'pmTitle', text: copy[0] }))),
      h('p', { class: 'pm-text', text: copy[1] }),
      h('div', { class: 'pm-mid' }, h('div', { class: 'pm-pricecol' }, toggle, priceBox),
        h('div', { class: 'pm-feats' }, (TT.planLead ? TT.planLead('Everything in Free, Plus:', 'pm-lead') : h('p', { class: 'pm-lead', text: 'Everything in Free, Plus:' })), list)),
      h('div', { class: 'pm-actions' }, go, later),
      h('p', { class: 'pm-foot', text: signedIn ? 'Everything you have saved stays put when you upgrade.' : 'Start with a free account, then upgrade anytime.' }));
    layer = h('div', { class: 'pm-layer', onclick: function (e) { if (e.target === layer) close(); } }, card);
    document.body.append(layer);
    // The lock pops open a moment after the card lands.
    setTimeout(function () { var ic = card.querySelector('.pm-icon'); if (ic) { ic.innerHTML = TT.icon('unlock'); ic.classList.add('open'); } }, 520);
    document.addEventListener('keydown', onKey, true);
    go.focus({ preventScroll: true });
  }

  // ---------- First visit to the board while signed out ----------
  // Shown once on this computer. Afterwards the "Not Saved" chip on the board is the reminder.
  TT.boardIntro = function () {
    var KEY = 'tt-board-intro';
    try { if (localStorage.getItem(KEY)) return; localStorage.setItem(KEY, '1'); } catch (e) { return; }
    if (layer) layer.remove();
    lastFocus = document.activeElement;
    function toAccount() { close(); TT.account.wantSignIn = true; TT.go('account'); }
    var make = TT.button('Make a Free Account', { kind: 'primary big', onclick: toAccount });
    var card = h('div', { class: 'pm-card pm-intro', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pmIntroTitle' },
      h('button', { type: 'button', class: 'pm-x', 'aria-label': 'Close', html: TT.icon('close'), onclick: close }),
      TT.mascot ? h('div', { class: 'pm-mascot' }, TT.mascot({ mood: 'cheer' })) : null,
      h('span', { class: 'pm-eyebrow', text: 'Welcome to Your Board' }),
      h('h2', { id: 'pmIntroTitle', text: 'Save Your Board With a Free Account' }),
      h('p', { class: 'pm-text', text: 'Sign in and your board screens, class lists and settings are saved for you, on any computer. It’s free, and no card is needed.' }),
      h('ul', { class: 'pm-list pm-intro-list' }, [['Save ' + TT.PLANS.free.screens + ' board screens free'], ['Pick up where you left off on any computer'], ['Use every widget, background and template']].map(function (t, i) {
        return h('li', { style: '--i:' + i }, h('span', { class: 'tick', 'aria-hidden': 'true', text: '✓' }), h('span', { text: t[0] }));
      })),
      h('div', { class: 'pm-actions' }, make, TT.button('I Have an Account', { kind: 'big', onclick: toAccount })),
      h('button', { type: 'button', class: 'linkish pm-try', onclick: close }, 'Just Try It (Nothing Is Saved)'));
    layer = h('div', { class: 'pm-layer', onclick: function (e) { if (e.target === layer) close(); } }, card);
    document.body.append(layer);
    document.addEventListener('keydown', onKey, true);
    make.focus({ preventScroll: true });
  };

  // ---------- Locked pages ----------
  // A locked page shows a short card instead of the tool, and opens the tool once the plan allows it.
  TT.premium.gate = function (name, el, mount) {
    var real = null, gateCard = null;
    function paint() {
      if (real) return;
      if (TT.premium.view(name)) { if (gateCard) { gateCard.remove(); gateCard = null; } real = mount(el) || {}; return; }
      if (gateCard) return;
      var copy = COPY[name] || COPY.plan;
      gateCard = h('div', { class: 'pm-gate' },
        h('span', { class: 'pm-icon', html: TT.icon('lock') }),
        h('h2', { text: copy[0] }), h('p', { class: 'muted', text: copy[1] }),
        h('div', { class: 'row center' }, TT.button('See What Plus Includes', { kind: 'primary big', onclick: function () { open(name); } }),
          h('a', { class: 'btn big', href: name === 'trivia' ? '/games' : '/', text: name === 'trivia' ? 'Back to All Games' : 'Back to All Tools' })));
      el.append(gateCard);
    }
    paint();
    if (TT.account && TT.account.onChange) TT.account.onChange(function () { if (!real) paint(); });
    return { show: function () { paint(); if (real && real.show) real.show(); }, hide: function () { if (real && real.hide) real.hide(); } };
  };

  // ---------- Tags on links and clicks on locked links ----------
  function paintTags() { document.body.classList.toggle('pm-free', !has()); document.body.classList.toggle('pm-owner', TT.premium.owner()); }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var name = a.getAttribute('href').slice(1);
    if (!LOCKED_VIEWS[name] || has()) return;
    e.preventDefault();
    open(name);
  }, true);
window.addEventListener('tt:page', close);
  if (TT.account && TT.account.onChange) TT.account.onChange(paintTags);
  paintTags();
})();
