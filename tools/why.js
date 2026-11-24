// "Why ED Sidekick?" on the home page, for visitors who aren't signed in yet.
// Real screenshots of the site live in assets/why/. Styles: assets/why.css.
(function () {
  var TT = window.TT, h = TT.h;
  var FEATURES = [
    { img: 'board', color: 'cobalt', title: 'One Board for Your Whole Day',
      text: 'Put a timer, clock, name picker, sound meter, notes and more on your classroom screen. Save each screen and bring it back tomorrow.' },
    { img: 'join', color: 'rose', title: 'Class Games With a Code',
      text: 'Students join from any device at edsidekick.com/join. No student accounts, no emails, and nothing about them is saved.' },
    { img: 'morning', color: 'amber', title: 'Routines on Autopilot',
      text: 'Morning Meeting, Daily Schedule, Class Jobs and Class Points, ready the moment you walk in.' },
    { img: 'escape', color: 'violet', title: 'Games Kids Beg For',
      text: 'Escape rooms, Trivia Showdown, Word Guess, Code Breaker and more, with questions for grades 1 to 5.' },
    { img: 'wheel', color: 'emerald', title: 'Pick, Spin and Group in Seconds',
      text: 'Type your class list once. The Name Wheel, Name Picker, Group Maker and Seating Chart all use it.' },
    { img: 'race', color: 'coral', title: 'Math Facts That Feel Like a Game',
      text: 'Addition, subtraction, multiplication and division races. Teams roll the die and solve facts to move ahead.' }
  ];
  var TRUST = [
    ['Built by a Classroom Teacher', 'Made for real school days, by someone who teaches every day.'],
    ['No Ads, Ever', 'Nothing to click away from on your projector.'],
    ['Student Names Stay Private', 'First names only, never sold, never used to train AI.'],
    ['Free to Start', 'Almost everything is free. No card needed.']
  ];
  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';

  function signup() {
    if (TT.account) TT.account.wantMode = 'signup';
    TT.go('account');
    window.scrollTo(0, 0);
  }

  function build() {
    return h('section', { class: 'why', id: 'why', 'aria-labelledby': 'whyHead' },
      h('div', { class: 'why-head' },
        h('div', null,
          h('span', { class: 'why-eyebrow', text: 'New Here?' }),
          h('h2', { id: 'whyHead', text: 'Why ED Sidekick?' }),
          h('p', { class: 'why-lead', text: 'Stop juggling ten different websites. Everything you put on the classroom screen is here, in one place that saves your work.' })),
        h('button', { type: 'button', class: 'why-cta', onclick: signup, html: '<span>Create a Free Account</span>' + ARROW })),
      h('div', { class: 'why-grid' }, FEATURES.map(function (f) {
        return h('article', { class: 'why-card c-' + f.color },
          h('div', { class: 'why-shot' }, h('img', { src: '/assets/why/' + f.img + '.webp', alt: '', loading: 'lazy', width: 800, height: 500 })),
          h('div', { class: 'why-text' }, h('h3', { text: f.title }), h('p', { text: f.text })));
      })),
      h('ul', { class: 'why-trust' }, TRUST.map(function (t) {
        return h('li', null, h('span', { class: 'why-check', html: CHECK }), h('div', null, h('b', { text: t[0] }), h('span', { text: t[1] })));
      })));
  }

  var node = null;
  function paint() {
    var home = document.getElementById('view-home');
    if (!home || !TT.signinGate) return;
    var show = !TT.signinGate.signedIn();
    if (!show) { if (node) { node.remove(); node = null; } return; }
    if (node && node.isConnected) return;
    node = build();
    // Right after the sign-in note (or the welcome banner).
    var after = home.querySelector('.sg-note') || home.querySelector('.welcome');
    if (after && after.nextSibling) home.insertBefore(node, after.nextSibling); else home.append(node);
  }
  if (TT.account && TT.account.onChange) TT.account.onChange(function () { setTimeout(paint, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(paint, 0); });
  else setTimeout(paint, 0);
})();
