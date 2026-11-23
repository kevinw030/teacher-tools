// My Questions: teachers write their own Would You Rather questions, trivia questions and escape rooms.
// Saved in this browser under "custom" and mixed in with the built-in ones.
(function () {
  var TT = window.TT, h = TT.h;

  TT.custom = {
    get: function () {
      var c = TT.load('custom', {}) || {};
      ['wyr', 'trivia', 'rooms'].forEach(function (k) { if (!Array.isArray(c[k])) c[k] = []; });
      return c;
    },
    open: function (tab) { TT.customTab = tab; TT.go('my-questions'); }
  };

  var TABS = [['wyr', 'Would You Rather'], ['trivia', 'Trivia'], ['rooms', 'Escape Rooms']];
  var TRIVIA_CATS = ['Science', 'Math', 'Geography', 'Animals', 'Words', 'History'];

  TT.mountCustom = function (el) {
    var data = TT.custom.get(), tab = 'wyr', editing = null;
    var tabs = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Kind of question' }, TABS.map(function (t) {
      return h('button', { type: 'button', class: 'seg', 'data-t': t[0], onclick: function () { tab = t[0]; editing = null; paint(); } }, t[1]);
    }));
    var box = h('div', { class: 'cq-body' });
    el.append(h('div', { class: 'cq' }, tabs, box));
    function save() { TT.save('custom', data); if (TT.wyr && TT.wyr.reload) TT.wyr.reload(); }
    function field(label, input) { return h('label', { class: 'cq-field' }, h('span', { text: label }), input); }
    function input(id, ph, max) { return h('input', { type: 'text', id: id, placeholder: ph, maxlength: max || 120, autocomplete: 'off' }); }
    function full(m) {
      // Only trivia has a limit on the Free plan. Would You Rather questions are unlimited for everyone.
      var max = TT.limit ? TT.limit('trivia') : Infinity;
      if (data.trivia.length < max) return false;
      m.textContent = ''; m.append(TT.upsell(max ? 'Your plan holds ' + max + ' of your own trivia questions.' : 'Trivia Showdown and your own trivia questions come with Premium.')); m.hidden = false;
      return true;
    }
    function msgEl() { return h('p', { class: 'form-msg', hidden: true, role: 'status' }); }
    function say(m, text) { m.textContent = text; m.hidden = !text; }
    function removeBtn(label, fn) { return h('button', { type: 'button', class: 'cq-x', 'aria-label': label, title: 'Remove', html: TT.icon('trash'), onclick: fn }); }
    function empty(text) { return h('div', { class: 'empty', text: text }); }

    // ----- Would You Rather -----
    function wyr() {
      var a = input('cqA', 'have a pet dragon'), b = input('cqB', 'have a pet unicorn'), m = msgEl();
      function clean(v) { return v.trim().replace(/^would you rather\s+/i, '').replace(/^or\s+/i, '').replace(/[?.!\s]+$/, ''); }
      var form = h('form', { class: 'cq-form', novalidate: true, onsubmit: function (e) {
        e.preventDefault();
        var x = clean(a.value), y = clean(b.value);
        if (!x || !y) { say(m, 'Type both choices first.'); (x ? b : a).focus(); return; }
        data.wyr.push([x, y]); save(); a.value = ''; b.value = ''; paint();
        document.getElementById('cqA').focus();
      } },
        h('div', { class: 'cq-wyr' }, field('Would You Rather…', a), h('span', { class: 'cq-or', text: 'or' }), field('The Other Choice', b)),
        h('div', { class: 'row' }, TT.button('Add Question', { icon: 'plus', kind: 'primary' })), m);
      form.querySelector('button').type = 'submit';
      var list = h('div', { class: 'cq-list' });
      if (!data.wyr.length) list.append(empty('No questions of your own yet. Add one above and it joins the daily mix.'));
      data.wyr.forEach(function (q, i) {
        list.append(h('div', { class: 'cq-item' },
          h('div', { class: 'cq-text' }, h('b', { text: 'Would you rather ' + q[0] + ' or ' + q[1] + '?' })),
          TT.button('Use Today', { kind: 'small', onclick: function (e) { TT.wyr.use(q); e.currentTarget.querySelector('span').textContent = 'Showing Today'; } }),
          removeBtn('Remove this question', function () { data.wyr.splice(i, 1); save(); paint(); })));
      });
      box.append(h('p', { class: 'muted', text: 'Your questions are mixed in with the built-in ones, so each one comes up once before any repeat.' }), form,
        h('h3', { class: 'cq-h', text: 'My Questions (' + data.wyr.length + ')' }), list);
    }

    // ----- Trivia -----
    function trivia() {
      var names = TRIVIA_CATS.slice();
      data.trivia.forEach(function (t) { if (!names.some(function (n) { return n.toLowerCase() === t.cat.toLowerCase(); })) names.push(t.cat); });
      var cat = h('input', { type: 'text', id: 'cqCat', placeholder: 'Like Our State or Fractions', maxlength: 24, list: 'cqCats', autocomplete: 'off' });
      var q = input('cqQ', 'What is the capital of our state?', 160), a = input('cqAns', 'The answer', 80), m = msgEl();
      cat.value = TT.customCat || '';
      var form = h('form', { class: 'cq-form', novalidate: true, onsubmit: function (e) {
        e.preventDefault();
        var c = cat.value.trim(), qq = q.value.trim(), aa = a.value.trim();
        if (!c || !qq || !aa) { say(m, 'Fill in the category, question and answer.'); (!c ? cat : !qq ? q : a).focus(); return; }
        if (full(m)) return;
        var match = names.filter(function (n) { return n.toLowerCase() === c.toLowerCase(); })[0];
        data.trivia.push({ cat: match || c, q: qq, a: aa }); TT.customCat = match || c; save(); paint();
        document.getElementById('cqQ').focus();
      } },
        h('div', { class: 'cq-grid' }, field('Category', cat), field('Question', q), field('Answer', a)),
        h('datalist', { id: 'cqCats' }, names.map(function (n) { return h('option', { value: n }); })),
        h('div', { class: 'row' }, TT.button('Add Question', { icon: 'plus', kind: 'primary' })), m);
      form.querySelector('button').type = 'submit';
      var list = h('div', { class: 'cq-list' });
      if (!data.trivia.length) list.append(empty('No trivia questions of your own yet.'));
      var groups = {};
      data.trivia.forEach(function (t, i) { (groups[t.cat] = groups[t.cat] || []).push([t, i]); });
      Object.keys(groups).forEach(function (g) {
        var builtIn = TRIVIA_CATS.indexOf(g) >= 0, n = groups[g].length;
        list.append(h('div', { class: 'cq-group' }, h('b', { text: g }),
          h('span', { class: 'cq-tag' + (!builtIn && n < 4 ? ' warn' : ''), text: builtIn ? 'Added to the built-in category' : n >= 4 ? 'Ready for the board' : 'Add ' + (4 - n) + ' more to put it on the board' })));
        groups[g].forEach(function (p) {
          list.append(h('div', { class: 'cq-item' },
            h('div', { class: 'cq-text' }, h('b', { text: p[0].q }), h('small', { text: 'Answer: ' + p[0].a })),
            removeBtn('Remove this question', function () { data.trivia.splice(p[1], 1); save(); paint(); })));
        });
      });
      if (TT.limit && !TT.limit('trivia')) box.append(h('div', { class: 'row' }, TT.premium.button('Trivia Showdown Is a Premium Game', 'trivia', function () {})));
      box.append(h('p', { class: 'muted', text: 'Make your own categories for Trivia Showdown. A new category needs 4 questions to appear on the board. Press New Board in the game to use them.' }), form,
        h('h3', { class: 'cq-h', text: 'My Trivia Questions (' + data.trivia.length + ')' }), list);
    }

    // ----- Escape rooms -----
    function rooms() {
      if (editing) { roomEditor(); return; }
      var list = h('div', { class: 'cq-list' });
      if (!data.rooms.length) list.append(empty('No rooms of your own yet.'));
      data.rooms.forEach(function (r, i) {
        list.append(h('div', { class: 'cq-item' },
          h('div', { class: 'cq-text' }, h('b', { text: r.title }), h('small', { text: r.locks.length + (r.locks.length === 1 ? ' lock' : ' locks') })),
          TT.button('Edit', { icon: 'edit', kind: 'small', onclick: function () { editing = { index: i, room: JSON.parse(JSON.stringify(r)) }; paint(); } }),
          removeBtn('Delete ' + r.title, function () { data.rooms.splice(i, 1); save(); paint(); })));
      });
      // Building whole new rooms is coming soon. Rooms made before keep working and can still be edited.
      box.append(h('p', { class: 'muted', text: 'Soon you can build a whole room of your own. Until then, Premium lets you change the questions inside any escape room: open a room, pick a grade and press Edit Questions.' }),
        h('div', { class: 'row' }, TT.soonButton('Make a New Room')),
        h('h3', { class: 'cq-h', text: 'My Rooms (' + data.rooms.length + ')' }), list);
    }
    function roomEditor() {
      var r = editing.room, m = msgEl();
      var title = input('cqRoomTitle', 'Like The Fraction Vault', 40); title.value = r.title;
      var intro = h('textarea', { id: 'cqRoomIntro', rows: 2, maxlength: 300, placeholder: 'Optional. Set the scene: where is the class stuck, and why?' }); intro.value = r.intro || '';
      var locks = [];
      for (var i = 0; i < 5; i++) {
        var L = r.locks[i] || {};
        var q = h('textarea', { id: 'cqLq' + i, rows: 2, maxlength: 300, placeholder: 'The puzzle or question' }); q.value = L.q || '';
        var a = input('cqLa' + i, 'Like 48 or forty-eight', 80); a.value = L.a || '';
        var hint = input('cqLh' + i, 'Optional', 160); hint.value = L.hint || '';
        locks.push({ q: q, a: a, hint: hint });
      }
      function saveRoom() {
        var out = [], bad = -1;
        locks.forEach(function (L, i) {
          var q = L.q.value.trim(), a = L.a.value.trim();
          if (q && a) out.push({ q: q, a: a, hint: L.hint.value.trim() });
          else if ((q || a) && bad < 0) bad = i;
        });
        if (!title.value.trim()) { say(m, 'Give your room a name.'); title.focus(); return; }
        if (bad >= 0) { say(m, 'Lock ' + (bad + 1) + ' needs both a puzzle and an answer.'); (locks[bad].q.value.trim() ? locks[bad].a : locks[bad].q).focus(); return; }
        if (!out.length) { say(m, 'Write at least one lock with a puzzle and an answer.'); locks[0].q.focus(); return; }
        r.title = title.value.trim(); r.intro = intro.value.trim(); r.locks = out;
        if (editing.index >= 0) data.rooms[editing.index] = r; else data.rooms.push(r);
        editing = null; save(); paint();
      }
      box.append(h('div', { class: 'cq-form' },
        h('h3', { class: 'cq-h', text: editing.index >= 0 ? 'Edit Room' : 'New Room' }),
        field('Room Name', title), field('Story', intro),
        locks.map(function (L, i) {
          return h('fieldset', { class: 'cq-lock' }, h('legend', { text: '🔒 Lock ' + (i + 1) + (i ? ' (Optional)' : '') }),
            field('Puzzle', L.q), h('div', { class: 'cq-grid two' }, field('Answer', L.a), field('Hint', L.hint)));
        }),
        h('p', { class: 'muted', text: 'Capital letters, spaces and punctuation don’t matter when students type. To accept more than one answer, separate them with commas, like 48, forty-eight.' }),
        m,
        h('div', { class: 'row' }, TT.button('Save Room', { kind: 'primary', onclick: saveRoom }), TT.button('Cancel', { onclick: function () { editing = null; paint(); } }))));
    }

    function paint() {
      tabs.querySelectorAll('.seg').forEach(function (b) { var on = b.getAttribute('data-t') === tab; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      box.textContent = '';
      ({ wyr: wyr, trivia: trivia, rooms: rooms })[tab]();
    }
    paint();
    return { show: function () { data = TT.custom.get(); if (TT.customTab) { tab = TT.customTab; TT.customTab = null; editing = null; } paint(); } };
  };
})();
