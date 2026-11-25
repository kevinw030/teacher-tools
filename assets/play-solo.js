// The self-paced race on the student's device (the modes marked solo in tools/live-modes.js).
// The loop: a question of your own → get it right → take your turn at the game bit → the next question.
// The teacher's screen decides everything: this page only shows what it is told and sends taps back.
(function () {
  var P = window.Play; if (!P) return;
  var h = P.h, L = P.live;
  var PS = window.PlaySolo = {};
  var asked = null, picked = -1, score = 0, place = 0, shield = false, busy = false;

  // append, skipping anything that isn't there (a plain append would print "null")
  function put(el) { var kids = [].slice.call(arguments, 1).filter(function (x) { return x != null && x !== false; }); el.append.apply(el, kids); }
  function mode() { var s = L.state(); return (s && s.mode) || 'acorns'; }

  // ---------- 1. A question, at your own speed ----------
  PS.question = function (q) {
    asked = q; picked = -1; busy = false;
    var r = P.screen('is-live is-q is-solo');
    var grid = h('div', { class: 'pl-answers' });
    (q.a || []).forEach(function (text, i) {
      grid.append(h('button', { type: 'button', class: 'pl-ans', style: '--ac:' + L.color(i), onclick: function () { answer(i); } },
        h('span', { class: 'pl-ans-ico', html: L.shape(i) }), h('b', { text: text })));
    });
    put(r, h('div', { class: 'pl-live-head' },
      h('span', { class: 'pl-kicker', text: 'Take Your Time' }),
      h('span', { class: 'pl-mini-score' }, h('b', { text: score.toLocaleString() }), h('span', { text: place ? '#' + place : '' }))),
      h('h2', { class: 'pl-solo-q', text: q.q }), grid);
  };
  function answer(i) {
    if (picked >= 0 || busy || !asked) return;
    picked = i; busy = true;
    P.sound('tap');
    L.send('ans', { sid: L.me().id, i: asked.i, pick: i });
    var grid = document.querySelector('.pl-answers');
    if (grid) grid.classList.add('waiting');
  }

  // ---------- 2. Right or wrong ----------
  PS.judge = function (d) {
    score = d.score; place = d.place;
    if (d.right) { P.sound('good'); turn(); return; }
    P.sound('bad');
    var right = asked && asked.a ? asked.a[d.c] : '';
    var r = P.screen('is-live is-wrong is-solo');
    put(r, h('div', { class: 'pl-card pl-verdict' },
      h('span', { class: 'pl-verdict-mark', 'aria-hidden': 'true', html: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M14 14l20 20M34 14 14 34"/></svg>' }),
      h('h1', { class: 'pl-title', text: 'Not This Time' }),
      right ? h('p', { class: 'pl-sub' }, 'The answer was ', h('b', { text: right })) : null,
      h('p', { class: 'pl-kicker', text: 'Here comes another question…' })));
  };

  // ---------- 3. Your turn at the game bit ----------
  function turn() {
    var m = mode();
    if (m === 'rocket') return fuelBar();
    var picks = m === 'tower'
      ? [{ t: 'Build', s: 'A safe new floor', c: '#3FA9F5', art: block('#3FA9F5') },
         { t: 'Build Big', s: 'More blocks, but the wind might blow', c: '#9B6BFF', art: tower() },
         { t: 'Guard', s: 'Stay safe from the next gust', c: '#22C3A6', art: shieldArt() }]
      : [0, 1, 2].map(function (i) { return { t: 'Basket ' + (i + 1), s: '', c: ['#E89A00', '#FF7A59', '#7BD15A'][i], art: basket(['#E89A00', '#FF7A59', '#7BD15A'][i]) }; });
    var r = P.screen('is-live is-turn is-solo');
    var done = false;
    var cards = h('div', { class: 'pl-turn-cards' }, picks.map(function (p, i) {
      return h('button', { type: 'button', class: 'pl-turn-card', style: '--tc:' + p.c, onclick: function () {
        if (done) return; done = true;
        P.sound('coin');
        cards.classList.add('chosen');
        this.classList.add('on');
        L.send('turn', { sid: L.me().id, choice: i });
      } }, h('span', { class: 'pl-turn-art', html: p.art }), h('b', { text: p.t }), p.s ? h('span', { text: p.s }) : null);
    }));
    put(r, h('div', { class: 'pl-live-head' }, h('span', { class: 'pl-kicker', text: 'You Got It Right!' }),
      h('span', { class: 'pl-mini-score' }, h('b', { text: score.toLocaleString() }), h('span', { text: place ? '#' + place : '' }))),
      h('h2', { class: 'pl-solo-q', text: mode() === 'tower' ? 'What Do You Build?' : 'Pick a Basket!' }), cards,
      shield ? h('p', { class: 'pl-kicker', text: 'Your shield is up.' }) : null);
  }

  // The fuel bar: one tap, no spamming. Stop the glow as near the middle of the green as you can.
  function fuelBar() {
    var r = P.screen('is-live is-turn is-solo');
    var marker = h('i', { class: 'pl-fuel-marker' });
    var bar = h('div', { class: 'pl-fuel' }, h('span', { class: 'pl-fuel-green' }), marker);
    var done = false, start = Date.now(), raf = null;
    function frame() {
      if (done) return;
      var t = ((Date.now() - start) % 1800) / 1800;             // one sweep every 1.8 seconds
      var x = t < 0.5 ? t * 2 : (1 - t) * 2;                     // up and back
      marker.style.left = (x * 100) + '%';
      marker.dataset.x = String(Math.round(x * 100));
      raf = requestAnimationFrame(frame);
    }
    frame();
    var stop = P.bigBtn('Stop!', 'go big', function () {
      if (done) return; done = true;
      cancelAnimationFrame(raf);
      var x = +marker.dataset.x || 0;
      // The green strip sits from 40 to 60. Nearer the middle is a better burn.
      var near = Math.max(0, Math.round(100 - Math.abs(50 - x) * 4));
      marker.classList.add(near >= 55 ? 'good' : 'ok');
      P.sound(near >= 85 ? 'win' : 'coin');
      L.send('turn', { sid: L.me().id, choice: near });
    });
    put(r, h('div', { class: 'pl-live-head' }, h('span', { class: 'pl-kicker', text: 'You Got It Right!' }),
      h('span', { class: 'pl-mini-score' }, h('b', { text: score.toLocaleString() }), h('span', { text: place ? '#' + place : '' }))),
      h('h2', { class: 'pl-solo-q', text: 'Stop It in the Green!' }), bar, stop);
  }

  // ---------- 4. What you won ----------
  PS.prize = function (d) {
    score = d.score; place = d.place; shield = !!d.shield;
    P.sound(d.gained >= 26 ? 'win' : d.gained >= 0 ? 'coin' : 'bad');
    var r = P.screen('is-live is-prize is-solo');
    var art = d.kind === 'shield' ? shieldArt() : d.kind === 'gust' ? gust() : d.kind === 'swap' ? swap() : d.kind === 'gift' ? basket('#FF6FAE') : coins(d.kind === 'big');
    put(r, h('div', { class: 'pl-card' },
      h('span', { class: 'pl-prize-art', html: art }),
      h('h1', { class: 'pl-title', text: d.say || '' }),
      h('div', { class: 'pl-score-row' },
        h('div', null, h('b', { text: (d.score || 0).toLocaleString() }), h('span', { text: 'Points' })),
        d.place ? h('div', null, h('b', { text: '#' + d.place }), h('span', { text: 'of ' + (d.players || 1) })) : null)));
    if (window.TT && TT.confetti && d.gained >= 26) try { TT.confetti(r); } catch (e) {}
  };

  // Something another player did to you, shown as a small card on whatever screen you are on.
  PS.nudge = function (d) {
    score = d.score != null ? d.score : score;
    place = d.place || place;
    var toast = h('div', { class: 'pl-toast', role: 'status', text: d.say || '' });
    document.body.append(toast);
    P.sound('pop');
    setTimeout(function () { toast.classList.add('out'); setTimeout(function () { toast.remove(); }, 400); }, 2600);
  };

  // ---------- Little pictures ----------
  function coins(big) {
    var n = big ? 7 : 4, out = '';
    for (var i = 0; i < n; i++) out += '<circle cx="' + (22 + (i % 4) * 20) + '" cy="' + (70 - Math.floor(i / 4) * 20) + '" r="13" fill="#FFC233" stroke="#B57A00" stroke-width="3"/>';
    return '<svg viewBox="0 0 110 90">' + out + '</svg>';
  }
  function basket(c) {
    return '<svg viewBox="0 0 90 90"><path d="M12 36h66l-7 44H19z" fill="' + c + '" stroke="#5A3A12" stroke-width="4"/>' +
      '<path d="M8 28h74v10H8z" fill="#A9622F" stroke="#5A3A12" stroke-width="4"/>' +
      '<path d="M28 28c0-12 8-18 17-18s17 6 17 18" fill="none" stroke="#5A3A12" stroke-width="5"/></svg>';
  }
  function shieldArt() {
    return '<svg viewBox="0 0 90 90"><path d="M45 8l30 10v26c0 20-14 32-30 38-16-6-30-18-30-38V18z" fill="#22C3A6" stroke="#0E6B5A" stroke-width="4"/>' +
      '<path d="M30 44l10 10 20-22" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function block(c) { return '<svg viewBox="0 0 90 90"><rect x="16" y="34" width="58" height="44" rx="6" fill="' + c + '" stroke="#1C3F70" stroke-width="4"/><rect x="26" y="20" width="38" height="18" rx="5" fill="#9B6BFF" stroke="#1C3F70" stroke-width="4"/></svg>'; }
  function tower() { return '<svg viewBox="0 0 90 90"><rect x="22" y="56" width="46" height="24" fill="#3FA9F5" stroke="#1C3F70" stroke-width="4"/><rect x="28" y="36" width="34" height="20" fill="#5B6CFF" stroke="#1C3F70" stroke-width="4"/><rect x="34" y="18" width="22" height="18" fill="#9B6BFF" stroke="#1C3F70" stroke-width="4"/></svg>'; }
  function gust() { return '<svg viewBox="0 0 110 90"><path d="M10 34h56a12 12 0 1 0-12-12" fill="none" stroke="#9AD8FF" stroke-width="8" stroke-linecap="round"/><path d="M16 56h44a10 10 0 1 1-10 10" fill="none" stroke="#CFF4EC" stroke-width="8" stroke-linecap="round"/></svg>'; }
  function swap() { return '<svg viewBox="0 0 110 90"><path d="M18 34h60l-14-14" fill="none" stroke="#FFC233" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M92 58H32l14 14" fill="none" stroke="#FF7A59" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
})();
