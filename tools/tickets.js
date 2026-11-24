// Exit Tickets and Quick Polls: one question at the end of a lesson. Students answer on this screen
// (anonymous taps, or tapping their own name first), or on their own devices with a class code.
// Device answers travel live from screen to screen (assets/bingo-live.js) and only the answers are kept:
// student names show while the question is open and are never saved.
(function () {
  var TT = window.TT, h = TT.h;
  var COLORS = ['#3B7BFF', '#FF7448', '#14B884', '#F5AE14', '#8B5CF6'];
  var PRESETS = {
    thumbs: { label: 'Thumbs Check', icon: '👍', tint: '#14B884', desc: 'Got it, almost or not yet', q: 'How well do you understand today’s lesson?', choices: ['👍 Got It', '👌 Almost', '👎 Not Yet'] },
    scale: { label: 'Rate It 1 to 4', icon: '🔢', tint: '#3B7BFF', desc: 'How well do I get it?', q: 'Rate your understanding from 1 to 4.', choices: ['1 · I’m Lost', '2 · I Need Help', '3 · I Mostly Get It', '4 · I Could Teach It'] },
    choice: { label: 'Multiple Choice', icon: '🔠', tint: '#8B5CF6', desc: 'Your own answer choices', q: '', choices: ['', '', ''] },
    text: { label: 'Short Answer', icon: '✏️', tint: '#FF7448', desc: 'Students type a sentence', q: 'What is one thing you learned today?', choices: [] }
  };

  TT.mountTickets = function (el) {
    var state = TT.load('tickets', null) || {};
    if (!Array.isArray(state.saved)) state.saved = [];
    var draft = { type: 'thumbs', q: PRESETS.thumbs.q, choices: PRESETS.thumbs.choices.slice(), mode: 'anon' };
    var view = state.cur ? (state.cur.done ? 'results' : 'collect') : 'setup', viewing = null, who = null, peek = false;
    var B = window.Bingo, Lobby = window.Lobby;
    function canLive() { return !!(B && B.connect && B.liveReady && B.liveReady() && Lobby); }

    // ----- Answering on student devices: this screen is the "server" -----
    // One class code for the whole visit, so students can stay on for the next question.
    var conn = null, liveCode = '', people = [], nameOf = {}, liveStatus = 'trying', refreshLive = null, showNames = false;
    function isLive(t) { return !!t && t.mode === 'devices'; }
    function sendState() {
      if (!conn) return;
      var t = state.cur;
      if (!isLive(t)) { conn.send('ticket', { idle: true }); return; }
      conn.send('ticket', { id: t.id, q: t.q, type: t.type, choices: t.choices, open: !t.done, got: t.answers.map(function (a) { return a.sid; }).filter(Boolean) });
    }
    function goLive(t) {
      if (!canLive()) return;
      if (conn && liveCode === t.code) { sendState(); return; }
      if (conn) conn.close();
      liveCode = t.code; liveStatus = 'trying'; people = [];
      conn = B.connect({
        code: t.code, me: 'host-' + t.id, meta: { host: true },
        on: { hello: function () { sendState(); }, answer: onAnswer },
        onPeople: function (list) {
          people = list.filter(function (p) { return !p.host; }).map(function (p) { return { id: p.id, av: p.av | 0, name: Lobby.safeName(p.name, p.av) }; });
          people.forEach(function (p) { nameOf[p.id] = p.name; });
          if (refreshLive) refreshLive();
        },
        onStatus: function (s) { liveStatus = s; if (refreshLive) refreshLive(); },
        onLive: function () { sendState(); }
      });
    }
    function onAnswer(m) {
      var t = state.cur;
      if (!isLive(t) || t.done || !m || typeof m.id !== 'string' || m.t !== t.id) return;
      if (t.answers.some(function (a) { return a.sid === m.id; })) { sendState(); return; }
      var v = m.v;
      if (t.type === 'text') {
        v = String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, 240);
        if (!v || (window.NameFilter && NameFilter.textOk && !NameFilter.textOk(v))) return;
      } else if (typeof v !== 'number' || v % 1 || v < 0 || v >= t.choices.length) return;
      t.answers.push({ v: v, sid: m.id.slice(0, 24) });
      save(); TT.tick(); sendState();
      if (refreshLive) refreshLive();
    }
    function endLive() {
      if (!conn) return;
      conn.send('end', {}); var c = conn; setTimeout(function () { c.close(); }, 600);
      conn = null; liveCode = ''; people = [];
    }
    // Only the answers are kept: the ids that stop double answers are dropped when a ticket is put away.
    function tidy(t) { if (!isLive(t)) return t; t.answers = t.answers.map(function (a) { return { v: a.v }; }); delete t.code; return t; }
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
      function st(n, label, body, cls) { return h('li', { class: 'bgo-st' + (cls || '') }, h('span', { class: 'bgo-st-n', 'aria-hidden': 'true', text: n }), h('span', { class: 'bgo-st-body' }, h('span', { class: 'bgo-join-step', text: label }), body)); }
      return h('section', { class: 'bgo-join' },
        h('ol', { class: 'bgo-join-text bgo-steps' },
          st('1', 'Open the internet and type', h('span', { class: 'bgo-join-url', text: host + '/join' })),
          st('2', 'Type this code', h('span', { class: 'bgo-code', 'aria-label': 'Class code ' + code.split('').join(' ') }, code.split('').map(function (ch, i) { return h('span', { class: 'bgo-code-ch', style: '--i:' + i, text: ch }); }))),
          st('3', 'Then', h('span', { class: 'bgo-st-go', text: 'Press the big pink Join button!' }), ' bgo-st-3')),
        h('div', { class: 'bgo-qr-box' }, qr, h('div', { class: 'bgo-qr-side' }, h('span', { class: 'bgo-qr-t', text: 'Or scan with a camera' }), copyBtn)));
    }
    var root = h('div', { class: 'xt' });
    el.append(root);
    function save() { TT.save('tickets', state); }
    function seg(options, get, set) {
      return h('div', { class: 'segmented', role: 'group' }, options.map(function (o) {
        var on = get() === o[0];
        return h('button', { type: 'button', class: 'seg' + (on ? ' on' : ''), 'aria-pressed': on, onclick: function () { set(o[0]); paint(); } }, o[1]);
      }));
    }
    function count(t) { var c = t.choices.map(function () { return 0; }); t.answers.forEach(function (a) { if (typeof a.v === 'number' && c[a.v] != null) c[a.v]++; }); return c; }
    function dateText(d) { var p = String(d).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }

    // ----- 1. Set up a question -----
    function setup() {
      var q = h('input', { type: 'text', id: 'xtQ', maxlength: 160, placeholder: 'Type your question', 'aria-label': 'Question' });
      q.value = draft.q; q.addEventListener('input', function () { draft.q = q.value; preview(); });
      // A live look at what students will see, so the setup screen is not just a form.
      var pv = h('div', { class: 'xt-pv-screen' });
      function preview() {
        pv.textContent = '';
        pv.append(h('span', { class: 'xt-pv-tag', text: 'Exit Ticket' }), h('b', { class: 'xt-pv-q', text: draft.q.trim() || 'Your question shows here' }));
        if (draft.type === 'text') pv.append(h('span', { class: 'xt-pv-area', text: 'Type your answer here' }), h('span', { class: 'xt-pv-turn', text: 'Turn It In' }));
        else pv.append(h('div', { class: 'xt-pv-answers' }, draft.choices.map(function (c, i) { return h('span', { class: 'xt-pv-answer', style: '--c:' + COLORS[i % 5], text: c.trim() || 'Choice ' + String.fromCharCode(65 + i) }); })));
      }
      function step(n, label) { return h('span', { class: 'xt-step' }, h('i', { text: String(n) }), label); }
      var msg = h('p', { class: 'form-msg', hidden: true, role: 'status' });
      var form = h('div', { class: 'cq-form' },
        step(1, 'Pick a Kind of Ticket'),
        h('div', { class: 'xt-presets' }, Object.keys(PRESETS).map(function (k) {
          return h('button', { type: 'button', class: 'xt-preset' + (draft.type === k ? ' on' : ''), style: '--c:' + PRESETS[k].tint, 'aria-pressed': draft.type === k, onclick: function () {
            draft.type = k; draft.q = PRESETS[k].q; draft.choices = PRESETS[k].choices.slice(); paint();
          } }, h('span', { class: 'xt-preset-ico', text: PRESETS[k].icon }), h('span', { class: 'xt-preset-t' }, h('b', { text: PRESETS[k].label }), h('small', { text: PRESETS[k].desc })));
        })),
        h('label', { class: 'cq-field xt-qfield', for: 'xtQ' }, step(2, 'Write the Question'), q));
      if (draft.type !== 'text') {
        var rows = h('div', { class: 'xt-choices' });
        draft.choices.forEach(function (c, i) {
          var inp = h('input', { type: 'text', id: 'xtC' + i, maxlength: 50, placeholder: 'Choice ' + String.fromCharCode(65 + i), 'aria-label': 'Choice ' + (i + 1) });
          inp.value = c; inp.addEventListener('input', function () { draft.choices[i] = inp.value; preview(); });
          rows.append(h('div', { class: 'xt-choice-row', style: '--c:' + COLORS[i % 5] }, h('i', { text: String.fromCharCode(65 + i) }), inp,
            draft.choices.length > 2 ? h('button', { type: 'button', class: 'cq-x', 'aria-label': 'Remove choice ' + (i + 1), html: TT.icon('close'), onclick: function () { draft.choices.splice(i, 1); paint(); } }) : null));
        });
        form.append(h('div', { class: 'cq-field' }, h('span', { class: 'xt-sub', text: 'Answer Choices' }), rows,
          draft.choices.length < 5 ? h('div', { class: 'row' }, TT.button('Add a Choice', { icon: 'plus', kind: 'small', onclick: function () { draft.choices.push(''); paint(); } })) : null));
      }
      form.append(h('div', { class: 'cq-field' }, step(3, 'Who Answers'),
        seg([['anon', 'Anonymous Taps'], ['names', 'By Name']].concat(canLive() ? [['devices', 'On Student Devices']] : []), function () { return draft.mode; }, function (v) { draft.mode = v; }),
        h('p', { class: 'muted xt-note', text: draft.mode === 'anon' ? 'Students tap an answer on this screen as they leave. No names are kept.'
          : draft.mode === 'devices' ? 'Students go to ' + (location.host.replace(/^www\./, '') || 'edsidekick.com') + '/join on their own device, type the class code and answer there. No accounts, and only the answers are kept.'
          : 'Students tap their own name, then answer. You see who chose what and who is missing. Names stay on this computer.' })),
        msg,
        h('div', { class: 'row' }, TT.button('Start Collecting Answers', { icon: 'play', kind: 'primary big xt-start', onclick: function () {
          var choices = draft.choices.map(function (c) { return c.trim(); }).filter(Boolean);
          if (!draft.q.trim()) { msg.textContent = 'Type a question first.'; msg.hidden = false; q.focus(); return; }
          if (draft.type !== 'text' && choices.length < 2) { msg.textContent = 'Add at least two choices.'; msg.hidden = false; return; }
          state.cur = { id: 't' + Date.now().toString(36), date: TT.today(), q: draft.q.trim(), type: draft.type, choices: draft.type === 'text' ? [] : choices, mode: draft.mode, answers: [], done: false,
            cls: draft.mode === 'names' ? TT.roster.activeName() : '' };
          if (draft.mode === 'devices') { if (!canLive()) state.cur.mode = 'anon'; else state.cur.code = liveCode || B.makeCode(); }
          showNames = false;
          save(); view = 'collect'; who = null; peek = false; paint();
        } })));
      form.classList.add('xt-form');
      preview();
      root.append(h('div', { class: 'xt-setup' }, form, h('aside', { class: 'xt-pv' }, h('span', { class: 'xt-pv-label', text: 'What Students Will See' }), pv)));
      var list = h('div', { class: 'cq-list' });
      if (!state.saved.length) list.append(h('div', { class: 'empty', text: 'Finished tickets show up here so you can look back at them.' }));
      state.saved.forEach(function (t, i) {
        var c = count(t), best = t.type === 'text' ? '' : t.choices[c.indexOf(Math.max.apply(null, c))];
        list.append(h('div', { class: 'cq-item' },
          h('div', { class: 'cq-text' }, h('b', { text: t.q }), h('small', { text: dateText(t.date) + ' · ' + t.answers.length + (t.answers.length === 1 ? ' answer' : ' answers') + (best && t.answers.length ? ' · Top: ' + best : '') })),
          TT.button('View', { kind: 'small', onclick: function () { viewing = t; view = 'results'; paint(); } }),
          TT.button('Ask Again', { kind: 'small', onclick: function () { draft = { type: t.type, q: t.q, choices: t.choices.slice(), mode: t.mode }; paint(); window.scrollTo(0, 0); } }),
          h('button', { type: 'button', class: 'cq-x', 'aria-label': 'Delete this ticket', title: 'Delete', html: TT.icon('trash'), onclick: function () { state.saved.splice(i, 1); save(); paint(); } })));
      });
      var keep = TT.limit ? TT.limit('tickets') : 50;
      root.append(h('h3', { class: 'cq-h', text: 'Past Tickets (' + state.saved.length + ')' }));
      if (TT.premium && !TT.premium.has()) root.append(TT.upsell('Your last ' + keep + ' tickets are kept. Plus keeps your last 50.'));
      root.append(list);
    }

    // ----- 2. Students answer -----
    function collect() {
      var t = state.cur, done = {};
      refreshLive = null;
      if (isLive(t)) { collectLive(t); return; }
      t.answers.forEach(function (a) { if (a.who) done[a.who] = 1; });
      var names = t.mode === 'names' ? TT.roster.present() : [];
      var stage = h('div', { class: 'xt-stage' }, h('span', { class: 'eyebrow', text: t.mode === 'names' && who ? 'Hi, ' + who + '!' : 'Exit Ticket' }), h('h2', { class: 'xt-q', text: t.q }));
      function record(v) {
        var a = { v: v }; if (who) a.who = who;
        t.answers.push(a); save(); TT.tick();
        var was = who; who = null;
        stage.textContent = '';
        stage.append(h('div', { class: 'xt-thanks' }, h('span', { text: '✅' }), h('b', { text: was ? 'Thanks, ' + was + '!' : 'Thanks!' }), h('small', { text: t.mode === 'names' ? 'Next student, tap your name.' : 'Next student, your turn.' })));
        setTimeout(function () { if (view === 'collect' && state.cur === t) paint(); }, 1100);
      }
      if (t.mode === 'names' && !who) {
        var grid = h('div', { class: 'xt-names' });
        names.forEach(function (n) {
          grid.append(h('button', { type: 'button', class: 'xt-name' + (done[n] ? ' done' : ''), disabled: !!done[n], onclick: function () { who = n; paint(); } }, (done[n] ? '✓ ' : '') + n));
        });
        if (!names.length) grid.append(h('div', { class: 'empty', text: 'No students in the class list. Add your class on the Name Picker page.' }));
        stage.append(h('p', { class: 'xt-hint', text: 'Tap your name to answer.' }), grid);
      } else if (t.type === 'text') {
        var area = h('textarea', { id: 'xtAnswer', class: 'xt-area', rows: 3, maxlength: 240, placeholder: 'Type your answer here', 'aria-label': 'Your answer' });
        stage.append(area, h('div', { class: 'row center' }, TT.button('Turn It In', { kind: 'primary big', onclick: function () { if (area.value.trim()) record(area.value.trim()); else area.focus(); } }),
          who ? TT.button('Not Me', { kind: 'big', onclick: function () { who = null; paint(); } }) : null));
      } else {
        stage.append(h('div', { class: 'xt-answers n' + t.choices.length }, t.choices.map(function (c, i) {
          return h('button', { type: 'button', class: 'xt-answer', style: '--c:' + COLORS[i % 5], onclick: function () { record(i); } }, c);
        })), who ? h('div', { class: 'row center' }, TT.button('Not Me', { onclick: function () { who = null; paint(); } })) : null);
      }
      var total = t.answers.length;
      root.append(stage, h('div', { class: 'xt-bar' },
        h('b', { class: 'xt-count', text: total + (t.mode === 'names' ? ' of ' + names.length : '') + (total === 1 ? ' Answer' : ' Answers') }),
        h('div', { class: 'row' },
          TT.button(peek ? 'Hide Results' : 'Peek at Results', { kind: 'small', onclick: function () { peek = !peek; paint(); } }),
          total ? TT.button('Undo Last', { icon: 'reset', kind: 'small', onclick: function () { t.answers.pop(); save(); paint(); } }) : null,
          TT.button('Cancel', { kind: 'small', onclick: function () { state.cur = null; save(); view = 'setup'; paint(); } }),
          TT.button('Show Results', { kind: 'primary', onclick: function () { t.done = true; save(); view = 'results'; paint(); } }))));
      if (peek) root.append(results(t, true));
    }

    // Students answer on their own devices: the join steps, the question and who has turned it in.
    function collectLive(t) {
      if (!t.code) { t.code = liveCode || B.makeCode(); save(); }
      goLive(t);
      var num = h('b', { class: 'xt-live-num' }), lab = h('span', { class: 'xt-live-lab' }), whoBox = h('div', { class: 'xt-live-who' }), status = h('p', { class: 'xt-live-status', role: 'status' });
      var peekBox = h('div');
      var peekBtn = TT.button(peek ? 'Hide Results' : 'Peek at Results', { kind: 'small', onclick: function () { peek = !peek; paint(); } });
      refreshLive = function () {
        if (state.cur !== t || view !== 'collect') return;
        var got = {}; t.answers.forEach(function (a) { got[a.sid] = 1; });
        var n = t.answers.length;
        num.textContent = String(n);
        lab.textContent = (n === 1 ? 'Answer' : 'Answers') + (people.length ? ' · ' + people.length + (people.length === 1 ? ' Student Here' : ' Students Here') : '');
        whoBox.textContent = '';
        if (!people.length) whoBox.append(h('p', { class: 'xt-live-empty', text: 'Students show up here as they join.' }));
        people.slice().sort(function (a, b) { return (got[a.id] ? 1 : 0) - (got[b.id] ? 1 : 0); }).forEach(function (p) {
          whoBox.append(h('span', { class: 'xt-who' + (got[p.id] ? ' done' : ''), style: '--ac:' + Lobby.avatar(p.av).c }, h('span', { class: 'xt-who-ava', 'aria-hidden': 'true' }, Lobby.img(p.av)), h('span', { text: p.name }),
            h('span', { class: 'xt-who-mark', text: got[p.id] ? '✓' : '…', 'aria-label': got[p.id] ? 'answered' : 'still thinking' })));
        });
        status.textContent = liveStatus === 'off' ? 'Can’t reach the internet. Students can’t join until it’s back.' : '';
        status.hidden = liveStatus !== 'off';
        if (peek) { peekBox.textContent = ''; peekBox.append(results(t, true)); }
      };
      root.append(h('div', { class: 'xt-live' },
        h('div', { class: 'lb-host xt-live-join' }, joinCard(t.code)),
        h('div', { class: 'xt-stage xt-live-stage' }, h('span', { class: 'eyebrow', text: 'Exit Ticket · Answer on Your Device' }), h('h2', { class: 'xt-q', text: t.q }),
          h('div', { class: 'xt-live-count', 'aria-live': 'polite' }, num, lab), whoBox, status)),
        h('div', { class: 'xt-bar' },
          h('b', { class: 'xt-count', text: 'Students Answer on Their Own Screens' }),
          h('div', { class: 'row' }, peekBtn,
            TT.button('Cancel', { kind: 'small', onclick: function () { state.cur = null; save(); sendState(); view = 'setup'; paint(); } }),
            TT.button('Show Results', { kind: 'primary', onclick: function () { t.done = true; save(); sendState(); view = 'results'; paint(); } }))),
        peekBox);
      refreshLive();
    }

    // ----- 3. Results -----
    function results(t, small) {
      var box = h('div', { class: 'xt-results' + (small ? ' small' : '') }), total = t.answers.length;
      if (t.type === 'text') {
        if (!total) box.append(h('div', { class: 'empty', text: 'No answers yet.' }));
        t.answers.forEach(function (a) { box.append(h('div', { class: 'xt-reply' }, a.who ? h('b', { text: a.who }) : null, h('span', { text: String(a.v) }))); });
      } else {
        var c = count(t), top = Math.max.apply(null, c.concat([1]));
        t.choices.forEach(function (label, i) {
          var whoList = t.answers.filter(function (a) { return a.v === i && a.who; }).map(function (a) { return a.who; });
          box.append(h('div', { class: 'xt-row' },
            h('div', { class: 'xt-row-head' }, h('b', { text: label }), h('span', { text: c[i] + (total ? ' · ' + Math.round(c[i] / total * 100) + '%' : '') })),
            h('div', { class: 'xt-track' }, h('span', { style: 'width:' + (c[i] / top * 100) + '%;background:' + COLORS[i % 5] })),
            whoList.length && !small ? h('div', { class: 'chips small' }, whoList.map(function (n) { return h('span', { class: 'chip static', text: n }); })) : null));
        });
      }
      if (t.mode === 'names' && !small && t === state.cur) {
        var done = {}; t.answers.forEach(function (a) { done[a.who] = 1; });
        var missing = TT.roster.present().filter(function (n) { return !done[n]; });
        if (missing.length) box.append(h('div', { class: 'picked-head' }, h('h3', { text: 'Still Missing (' + missing.length + ')' })), h('div', { class: 'chips' }, missing.map(function (n) { return h('span', { class: 'chip static', text: n }); })));
      }
      return box;
    }
    function resultsView() {
      var t = viewing || state.cur, live = !viewing;
      refreshLive = null;
      var shown = t, named = live && isLive(t) && t.answers.some(function (a) { return nameOf[a.sid]; });
      if (named && showNames) shown = Object.assign({}, t, { answers: t.answers.map(function (a) { return { v: a.v, who: nameOf[a.sid] }; }) });
      if (live && isLive(t)) goLive(t);
      root.append(h('div', { class: 'xt-stage results' }, h('span', { class: 'eyebrow', text: dateText(t.date) + ' · ' + t.answers.length + (t.answers.length === 1 ? ' Answer' : ' Answers') }), h('h2', { class: 'xt-q', text: t.q })),
        results(shown, false),
        named ? h('p', { class: 'muted xt-note', text: showNames ? 'Names show only while this ticket is open. They are not saved with it.' : 'Want to see who chose what? Names show only while this ticket is open and are not saved.' }) : null,
        h('div', { class: 'row' },
          named ? TT.button(showNames ? 'Hide Names' : 'Show Names', { kind: 'big', onclick: function () { showNames = !showNames; paint(); } }) : null,
          live ? TT.button('Save and Close', { kind: 'primary big', onclick: function () { state.saved.unshift(tidy(t)); state.saved = state.saved.slice(0, TT.storeLimit ? TT.storeLimit('tickets') : TT.limit ? TT.limit('tickets') : 50); state.cur = null; save(); sendState(); view = 'setup'; paint(); } }) : null,
          live ? TT.button('Keep Collecting', { kind: 'big', onclick: function () { t.done = false; save(); sendState(); view = 'collect'; paint(); } }) : null,
          live ? TT.button('Throw Away', { icon: 'trash', kind: 'big', onclick: function () { state.cur = null; save(); sendState(); view = 'setup'; paint(); } }) : null,
          !live ? TT.button('Back to Tickets', { icon: 'back', kind: 'big', onclick: function () { viewing = null; view = 'setup'; paint(); } }) : null));
    }

    function paint() {
      root.textContent = '';
      if (view === 'collect' && state.cur) collect(); else if (view === 'results' && (viewing || state.cur)) resultsView(); else { view = 'setup'; setup(); }
    }
    paint();
    // Leaving the page closes the class code (students see "All Done"). Answers so far stay on the ticket.
    if (Lobby && Lobby.endOnLeave) Lobby.endOnLeave({ page: 'exit-tickets', active: function () { return !!conn; }, players: function () { return isLive(state.cur) && !state.cur.done ? people.length : 0; }, end: endLive });
    return { show: function () { if (view === 'collect' || (view === 'results' && !viewing && isLive(state.cur))) paint(); } };
  };
})();
