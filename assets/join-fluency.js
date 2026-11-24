// Fact Fluency quiz on a student's own device (the /join page). The teacher's screen (tools/fluency.js)
// sends { id, op, lv, secs, phase: 'wait' | 'go' | 'done', got: [student ids it has scores for] }.
// This screen makes its own facts (assets/fluency-core.js), keeps its own time, sends 'prog' after each
// correct answer and 'fin' with the final score. Built for the youngest players: one big fact, a big
// number pad, and nothing else to tap.
(function () {
  var F = window.Fluency, TT = window.TT = window.TT || {};
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cx = null, cur = null, play = null, fin = null, view = '', sendT = 0, tickT = 0, flashT = 0, countdown = null;

  function stop() {
    clearInterval(tickT); clearTimeout(sendT); clearTimeout(flashT);
    if (countdown) { countdown.cancel(); countdown = null; }
    play = null; view = '';
  }
  function valid(m) {
    return m && typeof m.id === 'string' && F.okOp(m.op) && m.lv >= 1 && m.lv <= 3 && [30, 60, 120].indexOf(m.secs) >= 0 && ['wait', 'go', 'done'].indexOf(m.phase) >= 0;
  }

  function on(m, ctx) {
    cx = ctx;
    if (!valid(m)) return;
    cur = m;
    if (!fin) { var kept = cx.recall('quiz'); if (kept && kept.id === m.id) fin = kept; }
    if (fin && fin.id !== m.id) fin = null;
    var got = Array.isArray(m.got) && m.got.indexOf(cx.me.id) >= 0;
    if (fin && got && !fin.ok) { fin.ok = true; cx.store('quiz', fin); clearTimeout(sendT); view = ''; }

    if (m.phase === 'wait' || !m.id) {
      if (play || countdown) stop();
      return paint('wait', paintWait);
    }
    if (m.phase === 'go') {
      if (fin) return paint('fin', paintFin);
      if (play && play.id === m.id) return;
      if (countdown) return;
      if (window.Lobby && Lobby.countdown && !still) {
        view = 'count';
        countdown = Lobby.countdown({ title: 'Get Ready!', done: function () { countdown = null; if (cur && cur.id === m.id && cur.phase === 'go') begin(m); } });
      } else begin(m);
      return;
    }
    // 'done': the teacher ended the quiz. A quiz still going ends right now.
    if (play && play.id === m.id) { end(); return; }
    if (fin) return paint('fin', paintFin);
    if (countdown) { countdown.cancel(); countdown = null; }
    paint('closed', paintClosed);
  }
  function paint(v, fn) { var k = v + ':' + (cur && cur.id) + ':' + (fin && fin.ok ? 1 : 0); if (k === view) return; view = k; fn(); }

  function card(cls, kids) {
    cx.root.textContent = '';
    cx.root.className = 'join-main is-ticket is-quiz';
    var c = cx.h('div', { class: 'join-card jf ' + cls });
    kids.forEach(function (k) { if (k) c.append(k); });
    cx.root.append(c);
    return c;
  }
  function mascot(mood) {
    var m = TT.mascot ? TT.mascot({ mood: mood }) : null;
    if (m && mood !== 'think') setTimeout(function () { m.mood('idle'); }, 2600);
    return m ? cx.h('div', { class: 'join-mascot small', 'aria-hidden': 'true' }, m) : null;
  }
  function factsName(m) { return F.opName(m.op) + (m.op === 'mix' ? ' Facts' : ''); }

  function paintWait() {
    var h = cx.h;
    card('jf-wait', [mascot('think'), cx.who(),
      h('div', { class: 'jf-sign', 'aria-hidden': 'true', text: F.opSign(cur.op) }),
      h('h1', { text: 'You’re In!' }),
      h('p', { class: 'join-lead', text: 'Get ready for ' + factsName(cur) + '.' }),
      h('div', { class: 'join-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
      h('p', { class: 'join-help', text: 'Wait for your teacher to press Start.' })]);
  }
  function paintClosed() {
    card('jf-wait', [mascot('think'), h2('Time Is Up'), cx.h('p', { class: 'join-lead', text: 'Your teacher is looking at the scores. Stay here for the next quiz.' })]);
  }
  function h2(t) { return cx.h('h1', { text: t }); }

  // ---------- Playing ----------
  function begin(m) {
    stop();
    play = { id: m.id, op: m.op, lv: m.lv, secs: m.secs, start: Date.now(), r: 0, m: 0, x: {}, typed: '', lock: false, f: F.fact(m.op, m.lv) };
    view = 'play:' + m.id;
    var h = cx.h;
    var q = h('span', { class: 'jf-q' }), ans = h('span', { class: 'jf-ans' }), factCard = h('div', { class: 'jf-card', 'aria-live': 'polite' }, q, h('span', { class: 'jf-eq', text: '=' }), ans);
    var bar = h('span', { class: 'jf-bar' }), secs = h('b', { class: 'jf-secs' }), score = h('b', { class: 'jf-score' });
    var padEl = h('div', { class: 'jf-pad', role: 'group', 'aria-label': 'Number pad' });
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].forEach(function (k) {
      padEl.append(h('button', { type: 'button', class: 'jf-key' + (k === 'ok' ? ' ok' : k === 'del' ? ' del' : ''), 'aria-label': k === 'ok' ? 'Check my answer' : k === 'del' ? 'Erase' : k,
        onclick: function () { press(k); } }, k === 'ok' ? '✓' : k === 'del' ? '⌫' : k));
    });
    card('jf-play', [
      h('div', { class: 'jf-top' }, cx.who(), h('span', { class: 'jf-right' }, h('span', { class: 'jf-star', 'aria-hidden': 'true', text: '★' }), score)),
      h('div', { class: 'jf-time' }, h('span', { class: 'jf-track' }, bar), secs),
      factCard, padEl]);
    function show() {
      if (!play) return;
      q.textContent = play.f.q;
      if (!play.lock) { ans.textContent = play.typed || '?'; ans.className = 'jf-ans' + (play.typed ? '' : ' empty'); }
      score.textContent = String(play.r);
    }
    function clock() {
      if (!play) return;
      var left = Math.max(0, play.secs - (Date.now() - play.start) / 1000);
      bar.style.width = (left / play.secs * 100) + '%';
      bar.classList.toggle('low', left <= 10);
      secs.textContent = String(Math.ceil(left));
      if (left <= 0) end();
    }
    function press(k) {
      if (!play || play.lock) return;
      if (k === 'del') play.typed = play.typed.slice(0, -1);
      else if (k === 'ok') {
        if (!play.typed) return;
        if (+play.typed === play.f.a) {
          play.r++; play.typed = '';
          play.f = F.next(play.op, play.lv, play.f);
          cx.beep(660 + Math.min(play.r, 20) * 12, 0.1, 'triangle', 0.07);
          factCard.classList.remove('good'); void factCard.offsetWidth; factCard.classList.add('good');
          if (cx.conn) cx.conn.send('prog', { id: cx.me.id, q: play.id, r: play.r });
        } else {
          // Show the right answer for a moment, then a new fact.
          play.m++; play.x[play.f.q] = (play.x[play.f.q] || 0) + 1; play.typed = ''; play.lock = true;
          cx.beep(240, 0.18, 'sine', 0.06);
          ans.textContent = String(play.f.a); ans.className = 'jf-ans fix';
          factCard.classList.remove('bad'); void factCard.offsetWidth; factCard.classList.add('bad');
          flashT = setTimeout(function () { if (!play) return; play.lock = false; play.f = F.next(play.op, play.lv, play.f); show(); }, 1100);
        }
      } else if (play.typed.length < 3) { play.typed += k; cx.beep(520, 0.05, 'sine', 0.03); }
      show();
    }
    play.press = press;
    show(); clock();
    tickT = setInterval(clock, 200);
  }
  function end() {
    if (!play) return;
    var p = play;
    stop();
    fin = { id: p.id, r: p.r, m: p.m, x: p.x, op: p.op, ok: false };
    cx.store('quiz', fin);
    send(0);
    paint('fin', paintFin);
  }
  // Keep sending until the teacher's screen says it has the score.
  function send(n) {
    clearTimeout(sendT);
    if (!fin || fin.ok || !cx.conn) return;
    cx.conn.send('fin', { id: cx.me.id, q: fin.id, r: fin.r, m: fin.m, x: fin.x });
    if (n < 12) sendT = setTimeout(function () { send(n + 1); }, 2000);
  }
  function paintFin() {
    var h = cx.h, n = fin.r;
    var c = card('jf-fin', [mascot('cheer'),
      h('h1', { text: 'Time’s Up!' }),
      h('div', { class: 'jf-final' }, h('b', { text: String(n) }), h('span', { text: n === 1 ? 'fact right!' : 'facts right!' })),
      h('p', { class: 'join-lead', text: n >= 20 ? 'Wow, super fast!' : n >= 10 ? 'Great job!' : n > 0 ? 'Nice work! Keep practicing.' : 'Good try! You’ll get faster.' }),
      fin.ok ? h('p', { class: 'jf-sent' }, h('span', { 'aria-hidden': 'true', text: '✓' }), 'Your teacher got your score.') : h('p', { class: 'jf-sent wait' }, h('span', { class: 'join-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), 'Sending to your teacher…'),
      h('p', { class: 'join-help', text: 'Stay here for the next quiz.' })]);
    if (view.indexOf(':0') === view.length - 2) {
      if (cx.cheer) cx.cheer();
      if (n > 0 && TT.confetti) TT.confetti(document.body);
    }
    return c;
  }

  document.addEventListener('keydown', function (e) {
    if (!play || !play.press || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); play.press(e.key); }
    else if (e.key === 'Enter') { e.preventDefault(); play.press('ok'); }
    else if (e.key === 'Backspace') { e.preventDefault(); play.press('del'); }
  });

  window.JoinQuiz = { on: on, stop: function () { stop(); fin = null; cur = null; }, active: function () { return !!cur; } };
})();
