// Labs: Question Sets. The teacher's own sets for Sidekick Live, saved to their account
// (lab_sets in supabase/labs.sql). Type questions in, or paste rows copied from a spreadsheet.
// A set: { id, title, subject, grade, questions: [{ q, a: [2 to 4 choices], c: which is right }] }.
(function () {
  var TT = window.TT, h = TT.h;
  var mine = [];
  TT.labs.mySets = function () { return mine.slice(); };
  TT.labs.tab({ id: 'sets', title: 'Question Sets', order: 2, mount: mountSets });

  var GRADES = [['', 'Any Grade'], ['1-2', 'Grades 1 and 2'], ['3-4', 'Grades 3 and 4'], ['5', 'Grade 5']];
  var SUBJECTS = ['Math', 'Reading and Words', 'Science', 'Social Studies', 'Fun Facts', 'This Week'];

  function sb() { return TT.labs.sb(); }
  function q(p) { return TT.labs.q(p); }
  function uid() { var u = TT.account && TT.account.user && TT.account.user(); return u && u.id; }

  // One question, cleaned up and safe to play: 2 to 4 choices, one of them right.
  function tidy(item) {
    var text = String(item.q || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    var a = (item.a || []).map(function (x) { return String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, 80); }).filter(function (x) { return x; }).slice(0, 4);
    var c = Math.min(Math.max(0, item.c | 0), Math.max(0, a.length - 1));
    return text && a.length >= 2 ? { q: text, a: a, c: c } : null;
  }
  function clean(list) { return (list || []).map(tidy).filter(Boolean); }

  function mountSets(box) {
    var editing = null;
    function load() {
      box.textContent = '';
      box.append(h('p', { class: 'muted lab-loading', text: 'Loading your question sets…' }));
      q(sb().from('lab_sets').select('*').order('updated_at')).then(function (rows) {
        mine = rows || [];
        list();
      }, function (err) {
        box.textContent = '';
        if (TT.labs.errText(err) === 'setup') TT.labs.setupCard(box);
        else box.append(h('div', { class: 'panel' }, h('p', { text: TT.labs.errText(err) }), TT.button('Try Again', { onclick: load })));
      });
    }

    function list() {
      box.textContent = '';
      var grid = h('div', { class: 'lab-sets' }, mine.map(function (s) {
        return h('button', { type: 'button', class: 'lab-set', onclick: function () { edit(s); } },
          h('span', { class: 'lab-set-tag', text: (s.subject || 'My Set') + (s.grade ? ' · ' + s.grade : '') }),
          h('b', { text: s.title }), h('span', { class: 'muted', text: (s.questions || []).length + ' questions' }));
      }));
      box.append(h('section', { class: 'panel lab-panel' },
        h('div', { class: 'lab-panel-head' },
          h('div', null, h('h2', { text: 'My Question Sets' }), h('p', { class: 'muted', text: 'Your own questions, ready to host in any game mode.' })),
          TT.button('New Set', { kind: 'primary', icon: 'plus', onclick: function () { edit(null); } })),
        mine.length ? grid : h('p', { class: 'lab-empty', text: 'No sets yet. Press New Set, or paste questions from a spreadsheet.' })));
    }

    function edit(set) {
      var draft = {
        id: set && set.id, title: (set && set.title) || '', subject: (set && set.subject) || 'This Week', grade: (set && set.grade) || '',
        questions: JSON.parse(JSON.stringify((set && set.questions) || []))
      };
      var msg = h('p', { class: 'form-msg', hidden: true });
      function say(t, good) { msg.textContent = t; msg.hidden = !t; msg.classList.toggle('ok', !!good); }
      box.textContent = '';
      var qBox = h('div', { class: 'lab-qs' });
      var titleIn = h('input', { type: 'text', maxlength: 60, value: draft.title, placeholder: 'Set name, like Week 12 Vocabulary', 'aria-label': 'Set name' });
      var subjectSel = h('select', { 'aria-label': 'Subject' }, SUBJECTS.map(function (s) { return h('option', { value: s, text: s, selected: s === draft.subject }); }));
      var gradeSel = h('select', { 'aria-label': 'Grade' }, GRADES.map(function (g) { return h('option', { value: g[0], text: g[1], selected: g[0] === draft.grade }); }));

      function paintQs() {
        qBox.textContent = '';
        draft.questions.forEach(function (item, i) {
          var card = h('div', { class: 'lab-q' });
          var qIn = h('textarea', { rows: 2, maxlength: 200, 'aria-label': 'Question ' + (i + 1) });
          qIn.value = item.q || '';
          qIn.addEventListener('input', function () { item.q = qIn.value; });
          var choices = h('div', { class: 'lab-q-choices' });
          for (var n = 0; n < 4; n++) (function (n) {
            var val = (item.a || [])[n] || '';
            var inp = h('input', { type: 'text', maxlength: 80, value: val, placeholder: n < 2 ? 'Answer ' + (n + 1) : 'Answer ' + (n + 1) + ' (you can leave this empty)', 'aria-label': 'Answer ' + (n + 1) });
            var mark = h('button', { type: 'button', class: 'lab-right' + (item.c === n ? ' on' : ''), title: 'This one is right', 'aria-label': 'Answer ' + (n + 1) + ' is the right one', 'aria-pressed': item.c === n ? 'true' : 'false',
              html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
              onclick: function () { item.c = n; paintQs(); } });
            inp.addEventListener('input', function () { item.a = item.a || []; item.a[n] = inp.value; });
            choices.append(h('div', { class: 'lab-q-row', style: '--ac:' + (window.LiveLook ? LiveLook.color(n) : '#888') },
              h('span', { class: 'lab-q-ico', html: window.LiveLook ? LiveLook.shape(n) : '' }), inp, mark));
          })(n);
          card.append(h('div', { class: 'lab-q-head' }, h('span', { class: 'eyebrow', text: 'Question ' + (i + 1) }),
            h('div', { class: 'row' },
              TT.button('', { kind: 'small', icon: 'back', aria: 'Move up', title: 'Move up', onclick: function () { if (!i) return; var t = draft.questions[i - 1]; draft.questions[i - 1] = item; draft.questions[i] = t; paintQs(); } }),
              TT.button('', { kind: 'small', icon: 'arrow', aria: 'Move down', title: 'Move down', onclick: function () { if (i >= draft.questions.length - 1) return; var t = draft.questions[i + 1]; draft.questions[i + 1] = item; draft.questions[i] = t; paintQs(); } }),
              TT.button('', { kind: 'small danger', icon: 'trash', aria: 'Delete question', title: 'Delete', onclick: function () { draft.questions.splice(i, 1); paintQs(); } }))),
            qIn, choices);
          qBox.append(card);
        });
        if (!draft.questions.length) qBox.append(h('p', { class: 'lab-empty', text: 'No questions yet. Press Add a Question, or paste from a spreadsheet.' }));
      }

      // Paste from a spreadsheet: one question per row, question first, then the right answer, then the wrong ones.
      function pasteBox() {
        var area = h('textarea', { rows: 5, placeholder: 'What is 2 + 2?\t4\t3\t5\t6', 'aria-label': 'Paste rows from a spreadsheet' });
        return h('details', { class: 'lab-add' },
          h('summary', null, h('span', { html: TT.icon('upload') }), 'Paste From a Spreadsheet'),
          h('p', { class: 'muted', text: 'Copy the rows from Google Sheets or Excel and paste them here. Each row: the question, then the right answer, then up to three wrong answers. Commas work too.' }),
          area,
          h('div', { class: 'row' }, TT.button('Add These Questions', { kind: 'primary', onclick: function () {
            var lines = area.value.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
            var added = 0;
            lines.forEach(function (line) {
              var parts = line.indexOf('\t') >= 0 ? line.split('\t') : line.split(/\s*[,|]\s*/);
              parts = parts.map(function (p) { return p.trim(); }).filter(function (p) { return p; });
              if (parts.length < 3) return;
              var item = tidy({ q: parts[0], a: parts.slice(1, 5), c: 0 });
              if (item) { draft.questions.push(item); added++; }
            });
            area.value = '';
            paintQs();
            say(added ? 'Added ' + added + (added === 1 ? ' question. The first answer in each row is marked right.' : ' questions. The first answer in each row is marked right.') : 'Each row needs a question and at least two answers.', !!added);
          } })));
      }

      function save() {
        var title = titleIn.value.trim();
        if (!title) { say('Give your set a name.'); titleIn.focus(); return; }
        var questions = clean(draft.questions);
        if (questions.length < 2) { say('A set needs at least 2 finished questions (a question and two answers).'); return; }
        saveBtn.disabled = true;
        var row = { teacher_id: uid(), title: title, subject: subjectSel.value, grade: gradeSel.value, questions: questions, updated_at: new Date().toISOString() };
        var p = draft.id ? sb().from('lab_sets').update(row).eq('id', draft.id) : sb().from('lab_sets').insert(row);
        q(p).then(function () { load(); }, function (e) { saveBtn.disabled = false; say(TT.labs.errText(e)); });
      }
      var saveBtn = TT.button('Save Set', { kind: 'primary', onclick: save });

      paintQs();
      box.append(h('div', { class: 'row lab-crumbs' }, TT.button('All Sets', { icon: 'back', kind: 'small', onclick: list })),
        h('section', { class: 'panel lab-panel' },
          h('div', { class: 'lab-panel-head' }, h('div', null, h('h2', { text: draft.id ? 'Edit Set' : 'New Set' }),
            h('p', { class: 'muted', text: 'Two to four answers per question. Tap the check to mark the right one.' }))),
          h('div', { class: 'lab-set-form' }, titleIn, subjectSel, gradeSel),
          pasteBox(), qBox,
          h('div', { class: 'row' },
            TT.button('Add a Question', { icon: 'plus', onclick: function () { draft.questions.push({ q: '', a: ['', ''], c: 0 }); paintQs(); var last = qBox.lastElementChild; if (last) last.querySelector('textarea').focus(); } }),
            saveBtn,
            draft.id ? TT.button('Delete Set', { kind: 'small danger', icon: 'trash', onclick: function (e) {
              e.currentTarget.after(TT.labs.confirmBox('Delete “' + draft.title + '”?', 'Delete', function () {
                q(sb().from('lab_sets').delete().eq('id', draft.id)).then(load, function (er) { say(TT.labs.errText(er)); });
              }));
            } }) : null),
          msg));
    }

    load();
  }
})();
