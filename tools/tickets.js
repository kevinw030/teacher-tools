// Exit Tickets and Quick Polls: one question at the end of a lesson. Students answer on this screen,
// either with anonymous taps or by tapping their own name first. Everything stays in this browser.
(function () {
  var TT = window.TT, h = TT.h;
  var COLORS = ['#3B7BFF', '#FF7448', '#14B884', '#F5AE14', '#8B5CF6'];
  var PRESETS = {
    thumbs: { label: 'Thumbs Check', icon: '👍', q: 'How well do you understand today’s lesson?', choices: ['👍 Got It', '👌 Almost', '👎 Not Yet'] },
    scale: { label: 'Rate It 1 to 4', icon: '🔢', q: 'Rate your understanding from 1 to 4.', choices: ['1 · I’m Lost', '2 · I Need Help', '3 · I Mostly Get It', '4 · I Could Teach It'] },
    choice: { label: 'Multiple Choice', icon: '🔠', q: '', choices: ['', '', ''] },
    text: { label: 'Short Answer', icon: '✏️', q: 'What is one thing you learned today?', choices: [] }
  };

  TT.mountTickets = function (el) {
    var state = TT.load('tickets', null) || {};
    if (!Array.isArray(state.saved)) state.saved = [];
    var draft = { type: 'thumbs', q: PRESETS.thumbs.q, choices: PRESETS.thumbs.choices.slice(), mode: 'anon' };
    var view = state.cur ? (state.cur.done ? 'results' : 'collect') : 'setup', viewing = null, who = null, peek = false;
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
      q.value = draft.q; q.addEventListener('input', function () { draft.q = q.value; });
      var msg = h('p', { class: 'form-msg', hidden: true, role: 'status' });
      var form = h('div', { class: 'cq-form' },
        h('div', { class: 'xt-presets' }, Object.keys(PRESETS).map(function (k) {
          return h('button', { type: 'button', class: 'xt-preset' + (draft.type === k ? ' on' : ''), 'aria-pressed': draft.type === k, onclick: function () {
            draft.type = k; draft.q = PRESETS[k].q; draft.choices = PRESETS[k].choices.slice(); paint();
          } }, h('span', { text: PRESETS[k].icon }), h('b', { text: PRESETS[k].label }));
        })),
        h('label', { class: 'cq-field', for: 'xtQ' }, h('span', { text: 'Question' }), q));
      if (draft.type !== 'text') {
        var rows = h('div', { class: 'xt-choices' });
        draft.choices.forEach(function (c, i) {
          var inp = h('input', { type: 'text', id: 'xtC' + i, maxlength: 50, placeholder: 'Choice ' + String.fromCharCode(65 + i), 'aria-label': 'Choice ' + (i + 1) });
          inp.value = c; inp.addEventListener('input', function () { draft.choices[i] = inp.value; });
          rows.append(h('div', { class: 'xt-choice-row' }, h('i', { style: 'background:' + COLORS[i % 5] }), inp,
            draft.choices.length > 2 ? h('button', { type: 'button', class: 'cq-x', 'aria-label': 'Remove choice ' + (i + 1), html: TT.icon('close'), onclick: function () { draft.choices.splice(i, 1); paint(); } }) : null));
        });
        form.append(h('div', { class: 'cq-field' }, h('span', { text: 'Choices' }), rows,
          draft.choices.length < 5 ? h('div', { class: 'row' }, TT.button('Add a Choice', { icon: 'plus', kind: 'small', onclick: function () { draft.choices.push(''); paint(); } })) : null));
      }
      form.append(h('div', { class: 'cq-field' }, h('span', { text: 'Who Answers' }),
        seg([['anon', 'Anonymous Taps'], ['names', 'By Name']], function () { return draft.mode; }, function (v) { draft.mode = v; }),
        h('p', { class: 'muted xt-note', text: draft.mode === 'anon' ? 'Students tap an answer on this screen as they leave. No names are kept.'
          : 'Students tap their own name, then answer. You see who chose what and who is missing. Names stay on this computer.' })),
        msg,
        h('div', { class: 'row' }, TT.button('Start Collecting Answers', { icon: 'play', kind: 'primary big', onclick: function () {
          var choices = draft.choices.map(function (c) { return c.trim(); }).filter(Boolean);
          if (!draft.q.trim()) { msg.textContent = 'Type a question first.'; msg.hidden = false; q.focus(); return; }
          if (draft.type !== 'text' && choices.length < 2) { msg.textContent = 'Add at least two choices.'; msg.hidden = false; return; }
          state.cur = { id: 't' + Date.now().toString(36), date: TT.today(), q: draft.q.trim(), type: draft.type, choices: draft.type === 'text' ? [] : choices, mode: draft.mode, answers: [], done: false,
            cls: draft.mode === 'names' ? TT.roster.activeName() : '' };
          save(); view = 'collect'; who = null; peek = false; paint();
        } })));
      root.append(form);
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
      root.append(h('h3', { class: 'cq-h', text: 'Past Tickets (' + state.saved.length + ')' }),
        TT.premium && !TT.premium.has() ? TT.upsell('Your last ' + keep + ' tickets are kept. Premium keeps your last 50.') : null, list);
    }

    // ----- 2. Students answer -----
    function collect() {
      var t = state.cur, done = {};
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
      root.append(h('div', { class: 'xt-stage results' }, h('span', { class: 'eyebrow', text: dateText(t.date) + ' · ' + t.answers.length + (t.answers.length === 1 ? ' Answer' : ' Answers') }), h('h2', { class: 'xt-q', text: t.q })),
        results(t, false),
        h('div', { class: 'row' },
          live ? TT.button('Save and Close', { kind: 'primary big', onclick: function () { state.saved.unshift(t); state.saved = state.saved.slice(0, TT.storeLimit ? TT.storeLimit('tickets') : TT.limit ? TT.limit('tickets') : 50); state.cur = null; save(); view = 'setup'; paint(); } }) : null,
          live ? TT.button('Keep Collecting', { kind: 'big', onclick: function () { t.done = false; save(); view = 'collect'; paint(); } }) : null,
          live ? TT.button('Throw Away', { icon: 'trash', kind: 'big', onclick: function () { state.cur = null; save(); view = 'setup'; paint(); } }) : null,
          !live ? TT.button('Back to Tickets', { icon: 'back', kind: 'big', onclick: function () { viewing = null; view = 'setup'; paint(); } }) : null));
    }

    function paint() {
      root.textContent = '';
      if (view === 'collect' && state.cur) collect(); else if (view === 'results' && (viewing || state.cur)) resultsView(); else { view = 'setup'; setup(); }
    }
    paint();
    return { show: function () { if (view === 'collect') paint(); } };
  };
})();
