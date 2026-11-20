// Would You Rather: one question per day, no repeats until every question has been used.
(function () {
  var TT = window.TT, h = TT.h;
  var KEY = 'wyr';

  // Built-in questions plus any the teacher wrote on the My Questions page.
  var questions, byKey;
  function keyOf(q) { return q[0] + ' | ' + q[1]; }
  function build() {
    var mine = (TT.load('custom', {}) || {}).wyr || [];
    byKey = {};
    questions = (window.WYR_QUESTIONS || []).concat(mine).filter(function (q) {
      if (!Array.isArray(q) || q.length !== 2 || !q[0] || !q[1] || byKey[keyOf(q)]) return false;
      byKey[keyOf(q)] = q; return true;
    });
  }
  build();

  var state = TT.load(KEY, {});
  var listeners = [];
  function save() { TT.save(KEY, state); listeners.forEach(function (fn) { fn(); }); }
  function cleanSeen() { state.seen = (state.seen || []).filter(function (k) { return byKey[k]; }); }

  function pickNew() {
    cleanSeen();
    var seen = {};
    state.seen.forEach(function (k) { seen[k] = 1; });
    var pool = questions.filter(function (q) { return !seen[keyOf(q)]; });
    if (!pool.length) {
      state.seen = [];
      pool = questions.filter(function (q) { return keyOf(q) !== state.current; });
      if (!pool.length) pool = questions.slice();
    }
    var q = pool[Math.floor(Math.random() * pool.length)];
    state.current = keyOf(q);
    state.seen.push(state.current);
    state.date = TT.today();
    state.votes = { a: 0, b: 0 };
    save();
    return q;
  }
  function current() {
    if (!questions.length) return null;
    if (state.date === TT.today() && byKey[state.current]) return byKey[state.current];
    return pickNew();
  }

  TT.wyr = {
    current: current,
    onChange: function (fn) { listeners.push(fn); },
    reload: function () { build(); listeners.forEach(function (fn) { fn(); }); },
    // Show this question today.
    use: function (q) {
      build(); if (!byKey[keyOf(q)]) return;
      cleanSeen();
      state.current = keyOf(q); state.date = TT.today(); state.votes = { a: 0, b: 0 };
      if (state.seen.indexOf(state.current) < 0) state.seen.push(state.current);
      save();
    }
  };

  TT.mountWYR = function (el, opts) {
    opts = opts || {};
    var compact = !!opts.compact;

    function side(cls, label, key) {
      var text = h('span', { class: 'choice-text' });
      var count = h('strong');
      var bar = h('span');
      var btn = h('button', { type: 'button', class: 'choice ' + cls, 'aria-label': 'Vote for ' + label, onclick: function () {
        state.votes = state.votes || { a: 0, b: 0 }; state.votes[key] += 1; save();
      } },
        h('span', { class: 'tag', text: label }),
        text,
        h('span', { class: 'votes' },
          h('span', { class: 'votes-row' }, h('span', { text: compact ? 'Tap to Vote' : 'Tap to Add a Vote' }), count),
          h('span', { class: 'vbar' }, bar))
      );
      return { btn: btn, text: text, count: count, bar: bar };
    }
    var A = side('c-cobalt', 'Choice A', 'a');
    var B = side('c-coral', 'Choice B', 'b');
    var progressLabel = h('span', { class: 'progress-label' });
    var progressBar = h('span');
    var newBtn = TT.button('New Question', { icon: 'arrow', kind: 'primary', onclick: function () { newBtn.hidden = true; confirm.hidden = false; } });
    var confirm = h('span', { class: 'confirm', hidden: true },
      h('span', { text: 'Skip today’s question?' }),
      TT.button('Yes, Skip', { kind: 'primary', onclick: function () { pickNew(); confirm.hidden = true; newBtn.hidden = false; } }),
      TT.button('Keep It', { onclick: function () { confirm.hidden = true; newBtn.hidden = false; } })
    );

    el.append(h('div', { class: 'wyr' + (compact ? ' compact' : '') },
      compact ? null : h('p', { class: 'prompt', text: 'Pick a side, then tell a partner why.' }),
      h('div', { class: 'choices' }, A.btn, h('div', { class: 'or', 'aria-hidden': 'true', text: 'OR' }), B.btn),
      compact ? null : h('div', { class: 'wyr-foot' },
        h('div', { class: 'progress' }, progressLabel, h('span', { class: 'track' }, progressBar)),
        h('div', { class: 'row' },
          TT.button('Add Your Own', { icon: 'plus', onclick: function () { TT.custom.open('wyr'); } }),
          TT.button('Clear Votes', { icon: 'reset', onclick: function () { state.votes = { a: 0, b: 0 }; save(); } }),
          confirm, newBtn))
    ));

    function paint() {
      var q = current();
      if (!q) { A.text.textContent = 'No questions found'; B.text.textContent = 'Check questions.js'; return; }
      cleanSeen();
      A.text.textContent = q[0]; B.text.textContent = q[1];
      var v = state.votes || { a: 0, b: 0 }, t = v.a + v.b;
      A.count.textContent = v.a; B.count.textContent = v.b;
      A.bar.style.width = t ? (v.a / t * 100) + '%' : '0%';
      B.bar.style.width = t ? (v.b / t * 100) + '%' : '0%';
      var used = state.seen.length, total = questions.length;
      progressLabel.innerHTML = 'Question <b>' + used + '</b> of ' + total +
        (used >= total ? ' · last one, then a fresh round' : ' · ' + (total - used) + ' left before any repeats');
      progressBar.style.width = Math.round(used / total * 100) + '%';
    }
    TT.wyr.onChange(paint);
    paint();
    return { paint: paint };
  };
})();
