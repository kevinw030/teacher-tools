// Fact Fluency Tracker (2026-11-24): timed math fact quizzes with class progress charts.
// Replaces the older Fact Fluency page in tools/learn.js. Three tabs:
//   Class Round      the whole class (or one student at the computer) answers on this screen.
//   Student Devices  every student takes the quiz on their own device with a class code (/join).
//   Progress         class average over time, each student's scores, and the facts the class misses most.
// Scores are saved only under names from the teacher's own class list (tt:fluency-log, synced like class lists).
// Facts come from assets/fluency-core.js, the same maker the student page uses.
(function () {
  var TT = window.TT, h = TT.h, F = window.Fluency;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function svg(d, fill) { return '<svg viewBox="0 0 24 24" fill="' + (fill || 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var ICO = {
    round: svg('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'),
    devices: svg('<rect x="2" y="5" width="12" height="9" rx="1.5"/><rect x="15" y="8" width="7" height="12" rx="1.5"/><path d="M5 18h7"/>'),
    chart: svg('<path d="M4 20V4M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/>'),
    check: svg('<path d="m5 12 5 5 9-10"/>'),
    up: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    dots: svg('<circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/>'),
    flag: svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>')
  };
  var DEFAULT_GOAL = 30;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function day() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayDate(d) { var p = String(d).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function dayText(d) { return dayDate(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
  function dayShort(d) { var x = dayDate(d); return (x.getMonth() + 1) + '/' + x.getDate(); }
  function newId() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
  function fmt(n) { return (Math.round(n * 10) / 10).toString(); }
  function avg(list) { return list.length ? list.reduce(function (a, b) { return a + b; }, 0) / list.length : 0; }
  function sound(n) { if (TT.fx && TT.fx.sound) TT.fx.sound(n); else if (n === 'good' && TT.tick) TT.tick(); }

  TT.mountFluency = function (el) {
    var state = TT.load('fluency', null) || {};
    state.best = state.best || {};
    state.goal = state.goal || {};
    if (!F.okOp(state.op)) state.op = 'mul';
    if (!(state.lv >= 1 && state.lv <= 3)) state.lv = 2;
    if ([30, 60, 120].indexOf(state.secs) < 0) state.secs = 60;
    if (['round', 'devices', 'progress'].indexOf(state.tab) < 0) state.tab = 'round';
    if (!state.view) state.view = { op: state.op, lv: state.lv };
    var log = TT.load('fluency-log', null);
    if (!Array.isArray(log)) log = [];
    function save() { TT.save('fluency', state); }
    function saveLog() { log = log.slice(0, 400); TT.save('fluency-log', log); }
    function realNames() { return TT.roster.isSample() ? [] : TT.roster.all(); }
    function classId() { return TT.roster.activeId ? TT.roster.activeId() : ''; }
    function goalFor(op) { var g = +state.goal[op]; return g > 0 ? g : DEFAULT_GOAL; }

    var B = window.Bingo, Lobby = window.Lobby;
    function canLive() { return !!(B && B.connect && B.liveReady && B.liveReady() && Lobby); }

    // ---------- Frame: tabs and a body ----------
    var TABS = [['round', 'Class Round', ICO.round], ['devices', 'Student Devices', ICO.devices], ['progress', 'Progress', ICO.chart]];
    var tabs = h('div', { class: 'cp-tabs fl-tabs', role: 'group', 'aria-label': 'Fact Fluency' }, TABS.map(function (t) {
      return h('button', { type: 'button', class: 'cp-tab fl-tab', 'data-t': t[0], onclick: function () {
        if (state.tab === t[0]) return;
        stopRound(); state.tab = t[0]; save(); paint();
      } }, h('span', { class: 'cp-tab-ico', html: t[2] }), h('span', { text: t[1] }));
    }));
    var body = h('div', { class: 'fl-body' });
    el.textContent = '';
    el.append(h('div', { class: 'fl' }, tabs, body));

    function paint() {
      tabs.querySelectorAll('.fl-tab').forEach(function (b) { var on = b.getAttribute('data-t') === state.tab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      body.textContent = '';
      if (state.tab === 'progress') progress();
      else if (state.tab === 'devices') devices();
      else roundSetup();
    }

    // ---------- Pickers shared by both quiz tabs ----------
    function pickers(after) {
      function pick(n, label, kids) { return h('div', { class: 'ff-pick' }, h('span', { class: 'ff-label', text: n + '. ' + label }), kids); }
      return [
        pick(1, 'Choose the Facts', h('div', { class: 'ff-ops' }, F.OPS.map(function (o) {
          return h('button', { type: 'button', class: 'ff-op' + (state.op === o[0] ? ' on' : ''), 'aria-pressed': state.op === o[0], onclick: function () { state.op = o[0]; save(); after(); } }, h('b', { text: o[2] }), h('span', { text: o[1] }));
        }))),
        h('div', { class: 'fl-pair' },
          pick(2, 'Choose the Level', h('div', { class: 'fl-col' }, h('div', { class: 'segmented' }, F.LEVELS.map(function (l) {
            return h('button', { type: 'button', class: 'seg' + (state.lv === +l[0] ? ' on' : ''), 'aria-pressed': state.lv === +l[0], onclick: function () { state.lv = +l[0]; save(); after(); } }, l[1]);
          })), h('span', { class: 'muted fl-hint', text: F.HINT[state.op][state.lv - 1] }))),
          pick(3, 'Choose the Time', h('div', { class: 'segmented' }, F.TIMES.map(function (t) {
            return h('button', { type: 'button', class: 'seg' + (state.secs === t[0] ? ' on' : ''), 'aria-pressed': state.secs === t[0], onclick: function () { state.secs = t[0]; save(); after(); } }, t[1]);
          }))))
      ];
    }
    function factsLabel(op, lv, secs) { return F.opName(op) + ' · ' + F.LEVELS[lv - 1][1] + (secs ? ' · ' + F.TIMES.filter(function (t) { return t[0] === secs; })[0][1] : ''); }

    // ---------- Saved scores ----------
    function studentBest(name, op, lv) {
      var b = 0;
      log.forEach(function (e) { if (e.op !== op || e.lv !== lv) return; e.s.forEach(function (s) { if (s.n === name) b = Math.max(b, F.perMin(s.r, e.secs)); }); });
      return b;
    }
    function addEntry(how, scores, misses) {
      var e = { id: newId(), d: day(), t: Date.now(), cls: classId(), op: state.op, lv: state.lv, secs: state.secs, how: how, s: scores, x: misses || {} };
      log.unshift(e); saveLog();
      state.view = { op: state.op, lv: state.lv }; save();
      return e;
    }
    function addMisses(into, from) { Object.keys(from || {}).forEach(function (q) { into[q] = (into[q] || 0) + from[q]; }); return into; }

    // ====================== Class Round (this screen) ======================
    var run = null, iv = 0, flashT = 0;
    function stopRound() { clearInterval(iv); clearTimeout(flashT); run = null; }
    function key() { return state.op + state.lv + ':' + state.secs; }
    function roundSetup() {
      stopRound();
      var names = realNames();
      if (state.who && names.indexOf(state.who) < 0) state.who = '';
      var one = !!state.who;
      var best = one ? studentBest(state.who, state.op, state.lv) : state.best[key()] || 0;
      var whoRow = h('div', { class: 'ff-pick' }, h('span', { class: 'ff-label', text: '4. Who Is Playing?' }),
        names.length ? h('div', { class: 'fl-who' },
          h('button', { type: 'button', class: 'chip fl-who-chip' + (!one ? ' on' : ''), 'aria-pressed': !one, onclick: function () { state.who = ''; save(); roundSetup(); } }, 'The Whole Class'),
          names.map(function (n) { return h('button', { type: 'button', class: 'chip fl-who-chip' + (state.who === n ? ' on' : ''), 'aria-pressed': state.who === n, onclick: function () { state.who = n; save(); roundSetup(); } }, n); }))
          : h('p', { class: 'muted fl-tip', text: 'Add your class list (in the Name Picker or Settings) to let one student at a time take a quiz here and save their score.' }));
      body.textContent = '';
      body.append(h('div', { class: 'ff fl-round' }, h('div', { class: 'ff-setup' }, pickers(roundSetup), whoRow,
        h('div', { class: 'ff-go' },
          h('div', { class: 'ff-best' }, h('span', { text: one ? state.who + '’s Best' : 'Class Best to Beat' }), h('b', { text: best ? (one ? fmt(best) : String(best)) : '–' }),
            h('small', { text: one ? 'correct per minute' : factsLabel(state.op, state.lv) })),
          TT.button(one ? 'Start ' + state.who + '’s Quiz' : 'Start the Round', { icon: 'play', kind: 'primary big', onclick: startRound }),
          !one && best ? TT.button('Reset This Best', { icon: 'reset', kind: 'small', onclick: function () { delete state.best[key()]; save(); roundSetup(); } }) : null))));
    }
    function startRound() {
      body.textContent = '';
      run = { left: state.secs, right: 0, miss: 0, typed: '', f: F.fact(state.op, state.lv), x: {}, lock: false, who: state.who || '' };
      var who = run.who ? h('p', { class: 'fd-who' }, h('span', { text: 'Now Playing' }), h('b', { text: run.who })) : null;
      var st = F.stage(h, { who: who, onKey: function (k) { press(k); } });
      function paintRun() {
        if (!run) return;
        if (!run.lock) st.setTyped(run.typed);
        st.setTime(run.left, state.secs); st.setScore(run.right);
      }
      function press(k) {
        if (!run || run.left <= 0 || run.lock) return;
        if (k === 'del') run.typed = run.typed.slice(0, -1);
        else if (k === 'ok') {
          if (!run.typed) return;
          if (+run.typed === run.f.a) {
            run.right++; sound('good'); run.typed = '';
            run.f = F.next(state.op, state.lv, run.f); st.setScore(run.right); st.good(); st.setFact(run.f.q);
          } else {
            // Show the right answer for a moment, then a new fact. Nobody gets stuck on one fact.
            run.miss++; run.x[run.f.q] = (run.x[run.f.q] || 0) + 1; run.typed = ''; run.lock = true; sound('bad');
            st.bad(run.f.a);
            flashT = setTimeout(function () { if (!run) return; run.lock = false; run.f = F.next(state.op, state.lv, run.f); st.setFact(run.f.q); paintRun(); }, 1100);
          }
        } else if (run.typed.length < 3) { run.typed += k; sound('tap'); }
        paintRun();
      }
      run.press = press;
      st.setFact(run.f.q);
      body.append(h('div', { class: 'fl-round fl-stage' }, st.el, h('div', { class: 'row center' }, TT.button('Stop the Round', { kind: 'small', onclick: roundSetup }))));
      paintRun();
      iv = setInterval(function () {
        if (!run) { clearInterval(iv); return; }
        run.left--; paintRun();
        if (run.left <= 0) { clearInterval(iv); finishRound(); }
      }, 1000);
    }
    function finishRound() {
      var r = run; stopRound(); body.textContent = '';
      if (TT.chime) TT.chime();
      var record, old, note, extra = null;
      if (r.who) {
        old = studentBest(r.who, state.op, state.lv);
        var pm = F.perMin(r.right, state.secs);
        addEntry('one', [{ n: r.who, r: r.right, m: r.miss }], r.x);
        record = pm > old;
        note = record ? (old ? r.who + ' beat their best of ' + fmt(old) + ' per minute.' : 'That is ' + r.who + '’s first score. Saved to Progress.') : 'Saved to Progress. ' + r.who + '’s best is ' + fmt(old) + ' per minute.';
        extra = h('p', { class: 'muted', text: fmt(pm) + ' correct per minute' });
      } else {
        old = state.best[key()] || 0; record = r.right > old;
        if (record) { state.best[key()] = r.right; save(); }
        note = record ? (old ? 'You beat the old best of ' + old + '.' : 'That is the first score to beat.') : r.right === old ? 'You tied the class best of ' + old + '. So close!' : 'The class best is ' + old + '. Only ' + (old - r.right + 1) + ' more to beat it.';
      }
      var missed = Object.keys(r.x);
      var box = h('div', { class: 'ff-done' + (record ? ' record' : '') },
        h('span', { class: 'eyebrow', text: record ? (r.who ? 'New Personal Best!' : 'New Class Best!') : 'Time Is Up' }),
        h('div', { class: 'ff-final' }, h('b', { text: String(r.right) }), h('span', { text: r.right === 1 ? 'fact correct' : 'facts correct' })),
        extra, h('p', { class: 'ff-note', text: note }),
        missed.length ? h('div', { class: 'fl-missed' }, h('span', { class: 'ff-label', text: 'Facts to Practice' }), h('div', { class: 'fl-chips' }, missed.slice(0, 10).map(function (q) { return h('span', { class: 'fl-fact', text: q }); }))) : null,
        h('div', { class: 'row center' }, TT.button('Play Again', { icon: 'play', kind: 'primary big', onclick: startRound }), TT.button('Change the Facts', { kind: 'big', onclick: roundSetup }),
          r.who ? TT.button('See Progress', { icon: 'arrow', kind: 'big', onclick: function () { state.tab = 'progress'; save(); paint(); } }) : null));
      body.append(h('div', { class: 'ff fl-round' }, box));
      if (record && TT.celebrate) TT.celebrate(box);
    }
    document.addEventListener('keydown', function (e) {
      if (!run || !run.press || el.offsetParent === null || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); run.press(e.key); }
      else if (e.key === 'Enter') { e.preventDefault(); run.press('ok'); }
      else if (e.key === 'Backspace') { e.preventDefault(); run.press('del'); }
    });

    // ====================== Student Devices (class code) ======================
    // This screen runs the quiz: it sends the facts settings and the start signal, and collects each
    // student's score. Students make their own facts and keep their own time (assets/join-fluency.js).
    var conn = null, liveCode = '', people = [], liveStatus = 'trying', refreshLive = null;
    var dv = { phase: 'setup', run: '', scores: {}, startAt: 0, saved: false, op: '', lv: 0, secs: 0 };
    var liveTimer = 0;
    function quizMsg() {
      return { id: dv.run, op: dv.op || state.op, lv: dv.lv || state.lv, secs: dv.secs || state.secs, phase: dv.phase === 'go' ? 'go' : dv.phase === 'results' ? 'done' : 'wait',
        got: Object.keys(dv.scores).filter(function (k) { return dv.scores[k].fin; }) };
    }
    function sendQuiz() { if (conn) conn.send('quiz', quizMsg()); }
    function goLive() {
      if (!canLive() || conn) return;
      liveCode = liveCode || B.makeCode(); liveStatus = 'trying'; people = [];
      conn = B.connect({
        code: liveCode, me: 'host-' + newId(), meta: { host: true },
        on: { hello: function () { sendQuiz(); }, prog: onProg, fin: onFin },
        onPeople: function (list) {
          people = list.filter(function (p) { return !p.host; }).map(function (p) { return { id: p.id, av: p.av | 0, name: Lobby.safeName(p.name, p.av), at: p.at || 0 }; });
          people.forEach(function (p) { var s = dv.scores[p.id]; if (s) { s.name = p.name; s.av = p.av; } });
          if (refreshLive) refreshLive();
        },
        onStatus: function (s) { liveStatus = s; if (refreshLive) refreshLive(); },
        onLive: function () { sendQuiz(); }
      });
    }
    function endLive() {
      clearInterval(liveTimer);
      if (!conn) return;
      conn.send('end', {}); var c = conn; setTimeout(function () { c.close(); }, 600);
      conn = null; liveCode = ''; people = [];
    }
    function personOf(id) { return people.filter(function (p) { return p.id === id; })[0]; }
    function scoreFor(id) {
      var s = dv.scores[id];
      if (!s) { var p = personOf(id) || {}; s = dv.scores[id] = { r: 0, m: 0, x: {}, fin: false, name: p.name || 'Student', av: p.av | 0 }; }
      return s;
    }
    var maxRight = function () { return Math.ceil((dv.secs || state.secs) * 2.5); };
    function okCount(n, max) { return typeof n === 'number' && n % 1 === 0 && n >= 0 && n <= max; }
    function onProg(m) {
      if (dv.phase !== 'go' || !m || typeof m.id !== 'string' || m.q !== dv.run || !okCount(m.r, maxRight())) return;
      var s = scoreFor(m.id.slice(0, 24));
      if (s.fin) return;
      s.r = Math.max(s.r, m.r);
      if (refreshLive) refreshLive();
    }
    function onFin(m) {
      if ((dv.phase !== 'go' && dv.phase !== 'results') || dv.saved || !m || typeof m.id !== 'string' || m.q !== dv.run) return;
      if (!okCount(m.r, maxRight()) || !okCount(m.m, 400)) return;
      var s = scoreFor(m.id.slice(0, 24));
      if (!s.fin) {
        s.fin = true; s.r = m.r; s.m = m.m; s.x = {};
        Object.keys(m.x || {}).slice(0, 40).forEach(function (q) { var c = m.x[q]; if (F.okFact(q) && okCount(c, 50) && c > 0) s.x[q] = c; });
      }
      sendQuiz();
      if (dv.phase === 'go' && people.length && people.every(function (p) { return dv.scores[p.id] && dv.scores[p.id].fin; })) setTimeout(showResults, 900);
      if (refreshLive) refreshLive();
    }
    function startQuiz() {
      dv.run = newId(); dv.scores = {}; dv.saved = false; dv.op = state.op; dv.lv = state.lv; dv.secs = state.secs;
      people.forEach(function (p) { scoreFor(p.id); });
      dv.phase = 'go'; dv.startAt = Date.now();
      sendQuiz(); sound('whoosh');
      paint();
      // Students count down 3, 2, 1 first, then play. Give stragglers a few extra seconds to send in.
      clearInterval(liveTimer);
      liveTimer = setInterval(function () {
        if (dv.phase !== 'go') { clearInterval(liveTimer); return; }
        if (refreshLive) refreshLive();
        if (Date.now() - dv.startAt > (dv.secs + 4 + 10) * 1000) showResults();
      }, 500);
    }
    function showResults() {
      if (dv.phase !== 'go') return;
      clearInterval(liveTimer);
      dv.phase = 'results'; sendQuiz(); if (TT.chime) TT.chime();
      paint();
    }
    function joinCard(code) {
      var host = location.host.replace(/^www\./, '') || 'edsidekick.com';
      var url = location.origin + '/join?code=' + code;
      var qr = h('div', { class: 'bgo-qr', 'aria-hidden': 'true' });
      function draw() { try { var q = window.qrcode(0, 'M'); q.addData(url); q.make(); qr.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) {} }
      if (window.qrcode) draw(); else { var sc = document.createElement('script'); sc.src = '/assets/qrcode.js?v=1'; sc.onload = draw; document.head.append(sc); }
      var copyBtn = h('button', { type: 'button', class: 'bgo-copy', title: 'Post this link in Google Classroom so students can click it', onclick: function () {
        function done(ok) { copyBtn.lastChild.textContent = ok ? 'Copied! Paste It for Your Class' : url; copyBtn.classList.toggle('ok', ok); if (ok) setTimeout(function () { copyBtn.lastChild.textContent = 'Copy Join Link'; copyBtn.classList.remove('ok'); }, 2600); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); }); else done(false);
      } }, h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>' }), h('span', { text: 'Copy Join Link' }));
      function st(n, label, b, cls) { return h('li', { class: 'bgo-st' + (cls || '') }, h('span', { class: 'bgo-st-n', 'aria-hidden': 'true', text: n }), h('span', { class: 'bgo-st-body' }, h('span', { class: 'bgo-join-step', text: label }), b)); }
      return h('section', { class: 'bgo-join' },
        h('ol', { class: 'bgo-join-text bgo-steps' },
          st('1', 'Open the internet and type', h('span', { class: 'bgo-join-url', text: host + '/join' })),
          st('2', 'Type this code', h('span', { class: 'bgo-code', 'aria-label': 'Class code ' + code.split('').join(' ') }, code.split('').map(function (ch, i) { return h('span', { class: 'bgo-code-ch', style: '--i:' + i, text: ch }); }))),
          st('3', 'Then', h('span', { class: 'bgo-st-go', text: 'Press the big pink Join button!' }), ' bgo-st-3')),
        h('div', { class: 'bgo-qr-box' }, qr, h('div', { class: 'bgo-qr-side' }, h('span', { class: 'bgo-qr-t', text: 'Or scan with a camera' }), copyBtn)));
    }
    function ava(av) { return h('span', { class: 'xt-who-ava', 'aria-hidden': 'true', style: '--ac:' + Lobby.avatar(av).c }, Lobby.img(av)); }

    function devices() {
      refreshLive = null;
      if (dv.phase === 'setup' || !conn) { dv.phase = conn ? dv.phase : 'setup'; }
      if (dv.phase === 'setup') return devSetup();
      if (dv.phase === 'lobby') return devLobby();
      if (dv.phase === 'go') return devGo();
      return devResults();
    }
    function devSetup() {
      var ok = canLive();
      body.append(h('div', { class: 'ff fl-dev' }, h('div', { class: 'ff-setup' }, pickers(paint),
        h('ol', { class: 'fl-how' },
          h('li', null, h('b', { text: 'Students join' }), h('span', { text: ' at edsidekick.com/join with a class code. No accounts.' })),
          h('li', null, h('b', { text: 'Everyone starts together' }), h('span', { text: ' when you press Start. Each student gets their own facts and a big number pad.' })),
          h('li', null, h('b', { text: 'Scores come back here.' }), h('span', { text: ' Save them under names from your class list to see progress over time.' }))),
        h('div', { class: 'ff-go' },
          h('div', { class: 'ff-best' }, h('span', { text: 'Quiz' }), h('b', { class: 'fl-sign', text: F.opSign(state.op) }), h('small', { text: factsLabel(state.op, state.lv, state.secs) })),
          ok ? TT.button(conn ? 'Back to the Waiting Room' : 'Open the Class Code', { icon: 'arrow', kind: 'primary big', onclick: function () { goLive(); dv.phase = 'lobby'; sendQuiz(); paint(); } })
            : h('p', { class: 'muted', text: 'Class codes aren’t switched on for this site yet.' })))));
    }
    function devLobby() {
      sendQuiz();
      var whoBox = h('div', { class: 'xt-live-who fl-here' }), num = h('b', { class: 'xt-live-num' }), status = h('p', { class: 'xt-live-status', role: 'status' });
      var startBtn = TT.button('Start the Quiz', { icon: 'play', kind: 'primary big', onclick: startQuiz });
      refreshLive = function () {
        if (state.tab !== 'devices' || dv.phase !== 'lobby') return;
        num.textContent = String(people.length);
        whoBox.textContent = '';
        if (!people.length) whoBox.append(h('p', { class: 'xt-live-empty', text: 'Students show up here as they join.' }));
        people.slice().sort(function (a, b) { return a.at - b.at; }).forEach(function (p) {
          whoBox.append(h('span', { class: 'xt-who done', style: '--ac:' + Lobby.avatar(p.av).c }, ava(p.av), h('span', { text: p.name })));
        });
        startBtn.disabled = !people.length;
        status.textContent = liveStatus === 'off' ? 'Can’t reach the internet. Students can’t join until it’s back.' : '';
        status.hidden = liveStatus !== 'off';
      };
      body.append(h('div', { class: 'xt-live fl-live' },
        h('div', { class: 'lb-host xt-live-join' }, joinCard(liveCode)),
        h('div', { class: 'xt-stage xt-live-stage' },
          h('span', { class: 'eyebrow', text: 'Fact Fluency Quiz' }),
          h('h2', { class: 'xt-q fl-q' }, h('span', { class: 'fl-q-sign', text: F.opSign(state.op) }), F.opName(state.op)),
          h('p', { class: 'fl-q-sub', text: F.LEVELS[state.lv - 1][1] + ' · ' + F.HINT[state.op][state.lv - 1] + ' · ' + F.TIMES.filter(function (t) { return t[0] === state.secs; })[0][1] }),
          h('div', { class: 'xt-live-count' }, num, h('span', { class: 'xt-live-lab', text: 'Students Here' })), whoBox, status)),
        h('div', { class: 'xt-bar' },
          h('div', { class: 'row' }, TT.button('Change the Facts', { kind: 'small', onclick: function () { dv.phase = 'setup'; paint(); } }),
            TT.button('Close the Class Code', { kind: 'small', onclick: function () { endLive(); dv.phase = 'setup'; paint(); } })),
          startBtn));
      refreshLive();
    }
    function devGo() {
      var laneEls = {}, lanes = h('div', { class: 'fl-lanes' }), time = h('b', { class: 'fl-clock' }), done = h('span', { class: 'fl-done-n' });
      refreshLive = function () {
        if (state.tab !== 'devices' || dv.phase !== 'go') return;
        var left = Math.max(0, Math.ceil(dv.secs - (Date.now() - dv.startAt) / 1000 + 3.6));
        time.textContent = left > dv.secs ? 'Get Ready…' : Math.floor(left / 60) + ':' + pad(left % 60);
        people.forEach(function (p) { scoreFor(p.id); });
        var ids = Object.keys(dv.scores), top = 10, fin = 0;
        ids.forEach(function (k) { top = Math.max(top, dv.scores[k].r + 3); if (dv.scores[k].fin) fin++; });
        done.textContent = fin + ' of ' + ids.length + ' finished';
        // One lane per student. Their animal runs toward the flag (the class goal) with every correct fact.
        var finish = Math.max(Math.round(goalFor(dv.op) * dv.secs / 60), top - 3 + 2);
        ids.sort(function (a, b) { return (dv.scores[a].name || '').localeCompare(dv.scores[b].name || ''); });
        var empty = lanes.querySelector('.empty'); if (empty && ids.length) empty.remove();
        ids.forEach(function (k) {
          var s = dv.scores[k], L = laneEls[k];
          if (!L) {
            L = laneEls[k] = { n: h('b', { class: 'fl-lane-n' }), run: h('span', { class: 'fl-runner', style: '--p:0;--ac:' + Lobby.avatar(s.av).c }, Lobby.img(s.av)), ok: h('span', { class: 'fl-lane-ok wait', html: ICO.dots, title: 'Still going' }), name: h('span', { class: 'fl-lane-name' }) };
            L.row = h('div', { class: 'fl-lane' }, L.name, h('span', { class: 'fl-lane-track' }, h('span', { class: 'fl-flag', html: ICO.flag, title: 'Goal' }), L.run), L.n, L.ok);
          }
          lanes.append(L.row);
          L.name.textContent = s.name; L.n.textContent = String(s.r);
          L.run.style.setProperty('--p', Math.min(1, s.r / finish));
          if (s.fin && !L.done) { L.done = true; L.row.classList.add('fin'); L.ok.className = 'fl-lane-ok'; L.ok.innerHTML = ICO.check; L.ok.title = 'Finished'; }
        });
        if (!ids.length && !lanes.firstChild) lanes.append(h('div', { class: 'empty', text: 'Waiting for students to send their first answers.' }));
      };
      body.append(h('div', { class: 'fl-race' },
        h('div', { class: 'fl-race-top' },
          h('div', null, h('span', { class: 'eyebrow', text: 'Quiz in Progress' }), h('h2', { class: 'fl-race-t', text: factsLabel(dv.op, dv.lv) })),
          h('div', { class: 'fl-race-stats' }, h('div', { class: 'ff-stat' }, h('span', { text: 'Time Left' }), time), done)),
        lanes,
        h('div', { class: 'xt-bar' }, h('b', { class: 'xt-count', text: 'Students answer on their own screens. Scores show here as they go.' }),
          TT.button('End the Quiz Now', { kind: 'primary', onclick: showResults }))));
      refreshLive();
    }
    function devResults() {
      var names = realNames(), ids = Object.keys(dv.scores);
      function match(typed) {
        var t = String(typed || '').trim().toLowerCase(), first = t.split(' ')[0];
        return names.filter(function (n) { return n.toLowerCase() === t; })[0] || names.filter(function (n) { return n.toLowerCase().split(' ')[0] === first; })[0] || '';
      }
      ids.forEach(function (k) { var s = dv.scores[k]; if (s.as == null) s.as = match(s.name); });
      ids.sort(function (a, b) { return (dv.scores[a].name || '').localeCompare(dv.scores[b].name || ''); });
      var pms = ids.map(function (k) { return F.perMin(dv.scores[k].r, dv.secs); });
      var classAvg = avg(pms), goal = goalFor(dv.op), atGoal = pms.filter(function (p) { return p >= goal; }).length;
      var msg = h('p', { class: 'form-msg', role: 'status', hidden: true });
      var rows = ids.map(function (k) {
        var s = dv.scores[k], pm = F.perMin(s.r, dv.secs);
        var sel = null;
        if (names.length && !dv.saved) {
          sel = h('select', { class: 'fl-as', 'aria-label': 'Save ' + s.name + '’s score as', onchange: function () { s.as = sel.value; } },
            h('option', { value: '', text: 'Don’t Save a Name' }), names.map(function (n) { return h('option', { value: n, text: n }); }));
          sel.value = s.as || '';
        }
        return h('tr', null,
          h('td', null, h('span', { class: 'fl-res-who' }, ava(s.av), h('span', { text: s.name }), !s.fin ? h('small', { class: 'muted', text: ' (didn’t finish)' }) : null)),
          h('td', { class: 'num' }, h('b', { text: String(s.r) })),
          h('td', { class: 'num', text: fmt(pm) }),
          h('td', null, status(pm, goal, true)),
          names.length ? h('td', null, dv.saved ? h('span', { text: s.as || '–' }) : sel) : null);
      });
      var allMiss = {}; ids.forEach(function (k) { addMisses(allMiss, dv.scores[k].x); });
      body.append(h('div', { class: 'fl-res' },
        h('div', { class: 'fl-res-top' },
          h('div', null, h('span', { class: 'eyebrow', text: 'Quiz Results · ' + factsLabel(dv.op, dv.lv, dv.secs) }), h('h2', { class: 'fl-race-t', text: ids.length ? 'Great Work, Everyone!' : 'No Scores Came In' })),
          h('div', { class: 'fl-tiles' }, tile(fmt(classAvg), 'Class Average', 'correct per minute'), tile(atGoal + ' of ' + ids.length, 'Met the Goal', goal + ' per minute'))),
        ids.length ? h('div', { class: 'fl-table-wrap' }, h('table', { class: 'fl-table' },
          h('thead', null, h('tr', null, h('th', { text: 'Student' }), h('th', { class: 'num', text: 'Correct' }), h('th', { class: 'num', text: 'Per Minute' }), h('th', { text: 'Goal' }), names.length ? h('th', { text: 'Save As' }) : null)),
          h('tbody', null, rows))) : h('div', { class: 'empty', text: 'Nobody sent a score this time. Students need to stay on the quiz page until the timer runs out.' }),
        Object.keys(allMiss).length ? missBars(allMiss, 6) : null,
        names.length ? (dv.saved ? null : h('p', { class: 'muted fl-tip', text: 'Students typed their own names. Pick the matching name from your class list for each score you want to keep, then press Save Scores. Scores without a name still count toward the class average.' }))
          : h('p', { class: 'muted fl-tip', text: 'Add your class list (in the Name Picker or Settings) to save each student’s score. For now, the class average is saved.' }),
        msg,
        h('div', { class: 'row fl-res-btns' },
          !dv.saved && ids.length ? TT.button('Save Scores', { icon: 'check', kind: 'primary big', onclick: function () {
            var scores = ids.map(function (k) { var s = dv.scores[k]; return { n: s.as || '', r: s.r, m: s.m || 0 }; });
            var keep = { op: state.op, lv: state.lv, secs: state.secs };
            state.op = dv.op; state.lv = dv.lv; state.secs = dv.secs;
            addEntry('devices', scores, allMiss);
            state.op = keep.op; state.lv = keep.lv; state.secs = keep.secs; save();
            dv.saved = true; sound('coin'); paint();
          } }) : null,
          dv.saved ? h('p', { class: 'fl-saved', html: ICO.check + '<span>Saved to Progress</span>' }) : null,
          TT.button(dv.saved || !ids.length ? 'Quiz Again' : 'Quiz Again Without Saving', { icon: 'play', kind: dv.saved ? 'primary big' : 'big', onclick: function () { dv.phase = 'lobby'; dv.run = ''; dv.scores = {}; dv.saved = false; paint(); } }),
          dv.saved ? TT.button('See Progress', { icon: 'arrow', kind: 'big', onclick: function () { state.tab = 'progress'; state.view = { op: dv.op, lv: dv.lv }; save(); paint(); } }) : null,
          TT.button('Close the Class Code', { kind: 'small', onclick: function () { endLive(); dv.phase = 'setup'; dv.scores = {}; paint(); } }))));
    }
    function tile(big, label, small) { return h('div', { class: 'fl-tile' }, h('span', { class: 'fl-tile-l', text: label }), h('b', { text: big }), small ? h('small', { text: small }) : null); }
    function status(pm, goal, small) {
      var k = pm >= goal ? ['met', 'Met the Goal', ICO.check] : pm >= goal * 0.75 ? ['near', 'Almost There', ICO.up] : ['grow', 'Keep Practicing', ICO.up];
      return h('span', { class: 'fl-status ' + k[0] + (small ? ' small' : '') }, h('span', { html: k[2] }), h('span', { text: k[1] }));
    }
    function missBars(miss, n) {
      var top = Object.keys(miss).sort(function (a, b) { return miss[b] - miss[a]; }).slice(0, n || 8);
      var mx = miss[top[0]] || 1, op = state.tab === 'progress' ? state.view.op : dv.op || state.op;
      var race = F.RACE[op];
      return h('section', { class: 'fl-card fl-miss' },
        h('div', { class: 'fl-card-head' }, h('h3', { text: 'Facts to Practice' }), h('span', { class: 'muted', text: 'Missed most often' })),
        h('div', { class: 'fl-bars' }, top.map(function (q) {
          return h('div', { class: 'fl-bar-row', title: q + ': missed ' + miss[q] + (miss[q] === 1 ? ' time' : ' times') },
            h('span', { class: 'fl-bar-q', text: q }),
            h('span', { class: 'fl-bar-track' }, h('span', { class: 'fl-bar', style: 'width:' + Math.max(6, miss[q] / mx * 100) + '%' })),
            h('span', { class: 'fl-bar-n', text: String(miss[q]) }));
        })),
        race ? h('a', { class: 'btn fl-race-link', href: race[0] }, h('span', { html: ICO.flag }), h('span', { text: 'Practice in the ' + race[1] })) : null);
    }

    // ====================== Progress ======================
    function progress() {
      var v = state.view;
      if (!F.okOp(v.op)) v.op = 'mul';
      if (!(v.lv >= 1 && v.lv <= 3)) v.lv = 2;
      var lists = TT.roster.lists ? TT.roster.lists() : [];
      var cls = classId(), goal = goalFor(v.op);
      var mine = log.filter(function (e) { return (!e.cls || !cls || e.cls === cls) && e.how !== 'class'; });
      var rows = mine.filter(function (e) { return e.op === v.op && e.lv === v.lv; });

      var filters = h('div', { class: 'fl-filters' },
        h('div', { class: 'fl-filter-ops', role: 'group', 'aria-label': 'Facts' }, F.OPS.map(function (o) {
          var has = mine.some(function (e) { return e.op === o[0]; });
          return h('button', { type: 'button', class: 'chip fl-op-chip' + (v.op === o[0] ? ' on' : '') + (has ? ' has' : ''), 'aria-pressed': v.op === o[0], onclick: function () { v.op = o[0]; save(); paint(); } }, h('b', { text: o[2] }), o[1]);
        })),
        h('div', { class: 'segmented', role: 'group', 'aria-label': 'Level' }, F.LEVELS.map(function (l) {
          return h('button', { type: 'button', class: 'seg' + (v.lv === +l[0] ? ' on' : ''), 'aria-pressed': v.lv === +l[0], onclick: function () { v.lv = +l[0]; save(); paint(); } }, l[1]);
        })),
        lists.length > 1 ? (function () {
          var sel = h('select', { class: 'fl-class', 'aria-label': 'Class', onchange: function () { TT.roster.select(sel.value); } }, lists.map(function (l) { return h('option', { value: l.id, text: l.name }); }));
          sel.value = cls; return sel;
        })() : null);

      var goalIn = h('input', { type: 'number', class: 'fl-goal-in', min: 1, max: 99, value: goal, 'aria-label': 'Goal, correct per minute' });
      goalIn.addEventListener('change', function () { var g = Math.round(+goalIn.value); if (g >= 1 && g <= 99) { state.goal[v.op] = g; save(); paint(); } else goalIn.value = goal; });

      body.append(filters);
      if (!rows.length) {
        body.append(h('div', { class: 'empty fl-empty', text: mine.length ? 'No ' + F.opName(v.op) + ' quizzes at the ' + F.LEVELS[v.lv - 1][1] + ' level yet. Try another set of facts above, or take a quiz.' : 'Progress shows up here after your first saved quiz. Use Student Devices, or pick one student in Class Round.' }),
          h('div', { class: 'row center' }, TT.button('Take a Quiz on Devices', { icon: 'play', kind: 'primary', onclick: function () { state.tab = 'devices'; state.op = v.op; state.lv = v.lv; save(); paint(); } }),
            TT.button('One Student at a Time', { kind: '', onclick: function () { state.tab = 'round'; state.op = v.op; state.lv = v.lv; save(); paint(); } })));
        return;
      }

      // Each quiz day: the average of every score that day, in correct answers per minute.
      var days = {};
      rows.forEach(function (e) { (days[e.d] = days[e.d] || { d: e.d, pm: [], quizzes: 0 }); days[e.d].quizzes++; e.s.forEach(function (s) { days[e.d].pm.push(F.perMin(s.r, e.secs)); }); });
      var series = Object.keys(days).sort().slice(-12).map(function (d) { return { d: d, v: avg(days[d].pm), n: days[d].pm.length, q: days[d].quizzes }; });

      // Each student: every score in date order.
      var people2 = {};
      rows.slice().reverse().forEach(function (e) { e.s.forEach(function (s) { if (!s.n) return; (people2[s.n] = people2[s.n] || []).push({ d: e.d, v: F.perMin(s.r, e.secs) }); }); });
      var names = Object.keys(people2).sort(function (a, b) { var r = realNames(); var ia = r.indexOf(a), ib = r.indexOf(b); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || a.localeCompare(b); });
      var latestAll = names.map(function (n) { return people2[n][people2[n].length - 1].v; });
      var met = latestAll.filter(function (x) { return x >= goal; }).length;
      var first = series[0], last = series[series.length - 1], grew = series.length > 1 ? last.v - first.v : 0;

      body.append(h('div', { class: 'fl-tiles fl-stats' },
        tile(fmt(last.v), 'Latest Class Average', 'correct per minute · ' + dayText(last.d)),
        tile((grew > 0 ? '+' : '') + fmt(grew), 'Change Since ' + dayShort(first.d), series.length > 1 ? 'per minute' : 'Take another quiz to see growth'),
        names.length ? tile(met + ' of ' + names.length, 'Students at the Goal', 'latest score') : tile(String(rows.length), 'Quizzes Saved', ''),
        h('label', { class: 'fl-tile fl-goal' }, h('span', { class: 'fl-tile-l', text: 'Class Goal' }), h('span', { class: 'fl-goal-row' }, goalIn, h('small', { text: 'per minute' })))));

      body.append(h('section', { class: 'fl-card' },
        h('div', { class: 'fl-card-head' }, h('h3', { text: 'Class Average Over Time' }), h('span', { class: 'muted', text: F.opName(v.op) + ' · ' + F.LEVELS[v.lv - 1][1] + ' · correct per minute' })),
        lineChart(series, goal)));

      var grid = h('div', { class: 'fl-grid' });
      if (names.length) {
        grid.append(h('section', { class: 'fl-card fl-students' },
          h('div', { class: 'fl-card-head' }, h('h3', { text: 'Each Student' }), h('span', { class: 'muted', text: 'Correct per minute' })),
          h('div', { class: 'fl-table-wrap' }, h('table', { class: 'fl-table' },
            h('thead', null, h('tr', null, h('th', { text: 'Student' }), h('th', { text: 'Last 8 Quizzes' }), h('th', { class: 'num', text: 'Latest' }), h('th', { class: 'num', text: 'Best' }), h('th', { text: 'Goal' }))),
            h('tbody', null, names.map(function (n) {
              var list = people2[n], lt = list[list.length - 1].v, best = Math.max.apply(null, list.map(function (x) { return x.v; }));
              return h('tr', null, h('td', null, h('b', { text: n })), h('td', null, spark(list.slice(-8), goal)), h('td', { class: 'num', text: fmt(lt) }), h('td', { class: 'num', text: fmt(best) }), h('td', null, status(lt, goal, true)));
            }))))));
      }
      var miss = {}; rows.forEach(function (e) { addMisses(miss, e.x); });
      if (Object.keys(miss).length) grid.append(missBars(miss, 8));
      if (grid.childNodes.length) body.append(grid);

      // Saved quizzes, newest first, with a two-press Delete for mistakes.
      body.append(h('section', { class: 'fl-card fl-history' },
        h('div', { class: 'fl-card-head' }, h('h3', { text: 'Saved Quizzes' }), h('span', { class: 'muted', text: rows.length + (rows.length === 1 ? ' quiz' : ' quizzes') })),
        h('ul', { class: 'fl-hist' }, rows.slice(0, 30).map(function (e) {
          var del = TT.button('Delete', { icon: 'trash', kind: 'small', onclick: function () {
            if (!del.classList.contains('arm')) { del.classList.add('arm'); del.lastChild.textContent = 'Press Again to Delete'; setTimeout(function () { if (del.isConnected) { del.classList.remove('arm'); del.lastChild.textContent = 'Delete'; } }, 3000); return; }
            log = log.filter(function (x) { return x.id !== e.id; }); saveLog(); paint();
          } });
          var pmAvg = avg(e.s.map(function (s) { return F.perMin(s.r, e.secs); }));
          return h('li', null,
            h('span', { class: 'fl-hist-d', text: dayText(e.d) }),
            h('span', { class: 'fl-hist-k', text: e.how === 'one' ? (e.s[0] && e.s[0].n ? e.s[0].n + ' at the Computer' : 'At the Computer') : e.s.length + (e.s.length === 1 ? ' Student' : ' Students') + ' on Devices' }),
            h('span', { class: 'fl-hist-v', text: fmt(pmAvg) + ' per minute' }), del);
        }))));
    }

    // ---------- Charts (plain SVG, recolor with the theme) ----------
    var tipEl = null;
    function tip(show, x, y, html, box) {
      if (!tipEl) tipEl = h('div', { class: 'fl-tip-pop', role: 'tooltip' });
      if (!show) { tipEl.remove(); return; }
      tipEl.innerHTML = html; box.append(tipEl);
      var r = box.getBoundingClientRect(), w = tipEl.offsetWidth;
      tipEl.style.left = Math.max(4, Math.min(r.width - w - 4, x - w / 2)) + 'px';
      tipEl.style.top = Math.max(0, y - tipEl.offsetHeight - 12) + 'px';
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function lineChart(series, goal) {
      var W = Math.round(Math.max(340, Math.min(760, (body.clientWidth || 760) - 40))), H = W < 520 ? 230 : 260, L = 34, R = 56, T = 18, Bm = 30;
      var top = Math.max(goal * 1.15, Math.max.apply(null, series.map(function (s) { return s.v; })) * 1.12, 10);
      var step = top > 60 ? 20 : top > 30 ? 10 : 5; top = Math.ceil(top / step) * step;
      function X(i) { return series.length === 1 ? L + (W - L - R) / 2 : L + i * (W - L - R) / (series.length - 1); }
      function Y(v) { return T + (1 - v / top) * (H - T - Bm); }
      var s = '<svg class="fl-line" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Class average correct per minute on each quiz day">';
      for (var g = 0; g <= top; g += step) s += '<line class="fl-grid-l" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(g) + '" y2="' + Y(g) + '"/><text class="fl-ax" x="' + (L - 8) + '" y="' + (Y(g) + 4) + '" text-anchor="end">' + g + '</text>';
      s += '<line class="fl-goal-l" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(goal) + '" y2="' + Y(goal) + '"/><text class="fl-goal-t" x="' + (W - R + 6) + '" y="' + (Y(goal) + 4) + '">Goal ' + goal + '</text>';
      var every = Math.ceil(series.length / (W < 520 ? 4 : 7));
      series.forEach(function (p, i) { if (i % every === 0 || i === series.length - 1) s += '<text class="fl-ax" x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + dayShort(p.d) + '</text>'; });
      if (series.length > 1) {
        var d = series.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' ');
        s += '<path class="fl-area" d="' + d + ' L' + X(series.length - 1) + ' ' + Y(0) + ' L' + X(0) + ' ' + Y(0) + 'Z"/><path class="fl-path" d="' + d + '"/>';
      }
      series.forEach(function (p, i) { s += '<circle class="fl-dot" cx="' + X(i) + '" cy="' + Y(p.v) + '" r="5"/>'; });
      var lp = series[series.length - 1];
      s += '<text class="fl-last" x="' + (X(series.length - 1) + 10) + '" y="' + (Y(lp.v) - 10) + '">' + fmt(lp.v) + '</text>';
      series.forEach(function (p, i) { s += '<circle class="fl-hit" data-i="' + i + '" cx="' + X(i) + '" cy="' + Y(p.v) + '" r="16"/>'; });
      s += '</svg>';
      var box = h('div', { class: 'fl-chart', html: s });
      function over(e) {
        var c = e.target.closest && e.target.closest('.fl-hit'); if (!c) { tip(false); return; }
        var p = series[+c.getAttribute('data-i')], br = box.getBoundingClientRect(), cr = c.getBoundingClientRect();
        tip(true, cr.left - br.left + cr.width / 2, cr.top - br.top + cr.height / 2 - 6,
          '<b>' + esc(fmt(p.v)) + ' per minute</b><span>' + esc(dayText(p.d)) + '</span><span>' + p.n + (p.n === 1 ? ' score' : ' scores') + '</span>', box);
      }
      box.addEventListener('pointermove', over); box.addEventListener('pointerleave', function () { tip(false); });
      return box;
    }
    function spark(list, goal) {
      var W = 96, H = 28, mx = Math.max(goal, Math.max.apply(null, list.map(function (x) { return x.v; }))) * 1.05 || 1;
      function X(i) { return list.length === 1 ? W / 2 : 3 + i * (W - 6) / (list.length - 1); }
      function Y(v) { return H - 3 - v / mx * (H - 6); }
      var d = list.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' ');
      var lp = list[list.length - 1];
      return h('span', { class: 'fl-spark', title: list.map(function (p) { return dayShort(p.d) + ': ' + fmt(p.v); }).join(', '),
        html: '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><line class="fl-goal-l" x1="0" x2="' + W + '" y1="' + Y(goal) + '" y2="' + Y(goal) + '"/>' + (list.length > 1 ? '<path class="fl-path" d="' + d + '"/>' : '') + '<circle class="fl-dot" cx="' + X(list.length - 1) + '" cy="' + Y(lp.v) + '" r="3.5"/></svg>' });
    }

    TT.roster.onChange(function () { if (state.tab === 'progress' || (state.tab === 'round' && !run)) { if (el.offsetParent !== null) paint(); } });
    // Leaving the page closes the class code (students see "All Done").
    if (Lobby && Lobby.endOnLeave) Lobby.endOnLeave({ page: 'fact-fluency', active: function () { return !!conn; }, players: function () { return people.length; }, end: function () { endLive(); dv.phase = 'setup'; } });
    paint();
    return {
      hide: function () { if (run) roundSetup(); },
      show: function () { if (!run) paint(); }
    };
  };
})();
