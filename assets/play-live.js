// Sidekick Live on the student's device. It listens on the class's live channel (assets/live-core.js).
// When the teacher is hosting, a big Join button appears on Student Home. During the game the student
// only taps a shape: their device never gets the answer key, and their score comes back from the
// teacher's screen, which is the referee.
(function () {
  var P = window.Play; if (!P) return;
  var h = P.h;
  var SHAPES = {
    triangle: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 6 36 34H4z" fill="currentColor"/></svg>',
    diamond: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4 36 20 20 36 4 20z" fill="currentColor"/></svg>',
    circle: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="currentColor"/></svg>',
    square: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="6" width="28" height="28" rx="5" fill="currentColor"/></svg>'
  };
  var ORDER = ['triangle', 'diamond', 'circle', 'square'];
  var COLORS = ['#E9465A', '#2F6BFF', '#FFB627', '#22C3A6'];
  function shape(i) { return SHAPES[ORDER[i % 4]]; }
  function color(i) { return COLORS[i % 4]; }

  var conn = null, state = null, joined = false, me = null, inGame = false, asked = null, picked = -1, askedAt = 0, tick = null, score = 0, slot = null;

  // Student Home shows this when a game is on.
  P.onHome(function (box, student) {
    me = student; slot = box;
    if (!window.Live || !Live.ready()) return;
    listen();
    paintSlot();
  });
  P.onSignOut = function () { if (conn) { conn.close(); conn = null; } state = null; joined = false; inGame = false; };

  function listen() {
    if (conn) return;
    conn = Live.connect({
      code: me.code, me: 'st-' + me.id + '-' + Math.random().toString(36).slice(2, 7), meta: { sid: me.id },
      on: {
        state: function (s) { state = s; if (!inGame) paintSlot(); },
        go: function () { if (joined) startCountdown(); },
        q: function (q) { if (joined) showQuestion(q); },
        reveal: function (r) { if (joined) showReveal(r); },
        end: function (e) { if (joined) showEnd(e); },
        over: function () { state = null; joined = false; if (inGame) { inGame = false; P.home(); } else paintSlot(); }
      },
      onLive: function () { conn.send('hi', {}); if (joined) conn.send('join', { sid: me.id, name: me.name, buddy: me.buddy }); }
    });
  }

  function paintSlot() {
    if (!slot || !document.body.contains(slot)) return;
    slot.textContent = '';
    if (!state || state.phase === 'done') return;
    var mid = state.phase === 'lobby' ? 'Your teacher started a game!' : 'A game is going on right now!';
    slot.append(h('div', { class: 'pl-live-call' },
      h('p', { class: 'pl-kicker', text: state.title || 'Sidekick Live' }),
      h('h2', { class: 'pl-title', text: mid }),
      P.bigBtn(state.phase === 'lobby' ? 'Join the Game!' : 'Jump In!', 'mint big', join, P.ICON.play)));
  }

  function join() {
    joined = true; inGame = true;
    conn.send('join', { sid: me.id, name: me.name, buddy: me.buddy });
    waiting();
  }
  function leave() {
    joined = false; inGame = false;
    conn.send('bye', { sid: me.id });
    P.home();
  }

  function waiting() {
    var r = P.screen('is-live is-wait');
    r.append(h('div', { class: 'pl-card' },
      window.Buddy ? Buddy.el(me.buddy, 'big') : null,
      h('h1', { class: 'pl-title', text: 'You’re In, ' + me.name + '!' }),
      h('p', { class: 'pl-sub', text: 'Look at the big screen. The game starts in a moment.' }),
      state && state.title ? h('p', { class: 'pl-kicker', text: state.title }) : null,
      h('div', { class: 'pl-dots3', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
      h('button', { type: 'button', class: 'pl-signout', onclick: leave, text: 'Leave the Game' })));
  }
  function startCountdown() {
    var r = P.screen('is-live is-count');
    var n = h('p', { class: 'pl-count-n', text: '3' });
    r.append(h('div', { class: 'pl-card' }, h('p', { class: 'pl-sub', text: 'Get Ready!' }), n));
    var v = 3;
    P.sound('tap');
    var t = setInterval(function () {
      v--; n.textContent = v > 0 ? String(v) : 'Go!';
      n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop');
      P.sound(v > 0 ? 'tap' : 'coin');
      if (v <= 0) { clearInterval(t); }
    }, 900);
  }

  function showQuestion(q) {
    asked = q; picked = -1; askedAt = Date.now();
    var r = P.screen('is-live is-q');
    var left = h('span', { class: 'pl-timer-n', text: String(q.secs) });
    var bar = h('div', { class: 'pl-timer-bar' }, h('i', { style: 'animation-duration:' + q.secs + 's' }));
    var grid = h('div', { class: 'pl-answers' });
    (q.a || []).forEach(function (text, i) {
      grid.append(h('button', { type: 'button', class: 'pl-ans', style: '--ac:' + color(i), onclick: function () { answer(i); } },
        h('span', { class: 'pl-ans-ico', html: shape(i) }), h('b', { text: text })));
    });
    r.append(h('div', { class: 'pl-live-head' }, h('span', { class: 'pl-kicker', text: 'Question ' + q.qn + ' of ' + q.total }),
      h('span', { class: 'pl-timer' }, left)), bar, grid);
    clearInterval(tick);
    var ends = q.ends || (Date.now() + q.secs * 1000);
    tick = setInterval(function () {
      var s = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
      left.textContent = String(s);
      if (s <= 0) { clearInterval(tick); if (picked < 0) locked(true); }
    }, 250);
  }
  function answer(i) {
    if (picked >= 0 || !asked) return;
    picked = i;
    P.sound('tap');
    conn.send('ans', { sid: me.id, i: asked.i, pick: i, ms: Date.now() - askedAt });
    locked(false);
  }
  function locked(timeUp) {
    clearInterval(tick);
    var r = P.screen('is-live is-locked');
    r.append(h('div', { class: 'pl-card' },
      window.Buddy ? Buddy.el(me.buddy, 'big') : null,
      h('h1', { class: 'pl-title', text: timeUp ? 'Time’s Up!' : 'Locked In!' }),
      picked >= 0 ? h('span', { class: 'pl-locked-shape', style: 'color:' + color(picked), html: shape(picked) }) : null,
      h('p', { class: 'pl-sub', text: timeUp ? 'Get the next one!' : 'Look at the big screen.' })));
  }
  function showReveal(r0) {
    var mine = (r0.you || {})[me.id] || {};
    score = mine.score || score;
    var right = !!mine.right;
    var r = P.screen('is-live is-' + (right ? 'right' : 'wrong'));
    P.sound(right ? 'good' : 'bad');
    r.append(h('div', { class: 'pl-card pl-verdict' },
      h('span', { class: 'pl-verdict-mark', 'aria-hidden': 'true', html: right
        ? '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 25l10 10 18-22"/></svg>'
        : '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M14 14l20 20M34 14 14 34"/></svg>' }),
      h('h1', { class: 'pl-title', text: right ? (mine.streak >= 3 ? mine.streak + ' in a Row!' : 'That’s Right!') : 'Not This Time' }),
      mine.team ? h('p', { class: 'pl-kicker', text: mine.team }) : null,
      right && mine.gained ? h('p', { class: 'pl-gain', text: '+' + mine.gained }) : h('p', { class: 'pl-sub', text: 'The answer is on the big screen.' }),
      h('div', { class: 'pl-score-row' },
        h('div', null, h('b', { text: (mine.score || 0).toLocaleString() }), h('span', { text: 'Points' })),
        mine.place ? h('div', null, h('b', { text: '#' + mine.place }), h('span', { text: 'Place' })) : null)));
  }
  function showEnd(e) {
    var mine = (e.you || {})[me.id] || {};
    var r = P.screen('is-live is-end');
    var first = mine.place === 1 && (mine.players || 0) > 1;
    P.sound('win');
    r.append(h('div', { class: 'pl-card' },
      window.Buddy ? Buddy.el(me.buddy, 'big') : null,
      h('h1', { class: 'pl-title', text: first ? 'You Won!' : mine.place ? 'You Came #' + mine.place + '!' : 'Good Game!' }),
      h('div', { class: 'pl-score-row' },
        h('div', null, h('b', { text: (mine.score || 0).toLocaleString() }), h('span', { text: 'Points' })),
        h('div', null, h('b', { text: (mine.right || 0) + ' of ' + (mine.answered || 0) }), h('span', { text: 'Right' }))),
      (e.podium || []).length ? h('div', { class: 'pl-podium' }, e.podium.map(function (p, i) {
        return h('div', { class: 'pl-pod' }, h('span', { class: 'pl-pod-n', text: '#' + (i + 1) }),
          window.Buddy ? Buddy.el(p.buddy, 'pl-pod-buddy') : null, h('b', { text: p.name }));
      })) : null,
      P.bigBtn('Back to My Home', 'soft', function () {
        inGame = false; joined = false;
        var badges = mine.badges || [];
        P.reload().then(function () { if (badges.length) showBadges(badges.slice()); });
      })));
    if (window.TT && TT.confetti && (first || mine.place <= 3)) try { TT.confetti(r); } catch (err) {}
  }
  // New badges from the game, one happy card at a time.
  function showBadges(list) {
    if (!list.length) return;
    P.celebrateBadge(list.shift(), function () { showBadges(list); });
  }
})();
