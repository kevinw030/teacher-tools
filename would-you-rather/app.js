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

  // The question buddy: an original little character drawn in SVG and animated with CSS.
  var BUDDY = '<svg viewBox="0 0 120 132" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="wbG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B58CFF"/><stop offset="1" stop-color="#7A4DF0"/></linearGradient></defs>' +
    '<ellipse class="b-shadow" cx="60" cy="125" rx="30" ry="5"/>' +
    '<g class="b-all">' +
      '<g class="b-ant"><path d="M60 34 Q56 16 68 13" fill="none" stroke="#5B34C9" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="12" r="7" fill="#FFD43B" stroke="#F59F00" stroke-width="2"/><text x="70" y="16" text-anchor="middle" font-size="10" font-weight="900" fill="#7A4A00" font-family="sans-serif">?</text></g>' +
      '<ellipse cx="45" cy="118" rx="12" ry="6" fill="#5B34C9"/><ellipse cx="75" cy="118" rx="12" ry="6" fill="#5B34C9"/>' +
      '<path class="b-arm b-arm-l" d="M27 76 Q12 82 14 98" fill="none" stroke="#7A4DF0" stroke-width="10" stroke-linecap="round"/>' +
      '<path class="b-arm b-arm-r" d="M93 76 Q108 82 106 98" fill="none" stroke="#7A4DF0" stroke-width="10" stroke-linecap="round"/>' +
      '<rect x="22" y="30" width="76" height="88" rx="37" fill="url(#wbG)" stroke="#5B34C9" stroke-width="3"/>' +
      '<ellipse cx="60" cy="96" rx="22" ry="15" fill="#fff" opacity=".22"/>' +
      '<circle cx="36" cy="80" r="6" fill="#FF8FB8" opacity=".8"/><circle cx="84" cy="80" r="6" fill="#FF8FB8" opacity=".8"/>' +
      '<circle cx="46" cy="62" r="12" fill="#fff"/><circle cx="74" cy="62" r="12" fill="#fff"/>' +
      '<g class="b-pupils"><circle cx="46" cy="63" r="5.5" fill="#1B1740"/><circle cx="74" cy="63" r="5.5" fill="#1B1740"/><circle cx="48" cy="61" r="1.8" fill="#fff"/><circle cx="76" cy="61" r="1.8" fill="#fff"/></g>' +
      '<g class="b-lids"><rect x="33" y="49" width="26" height="26" rx="12" fill="#9A6CF8"/><rect x="61" y="49" width="26" height="26" rx="12" fill="#9A6CF8"/></g>' +
      '<path class="b-smile" d="M50 82 Q60 92 70 82" fill="none" stroke="#1B1740" stroke-width="3.5" stroke-linecap="round"/>' +
      '<ellipse class="b-open" cx="60" cy="86" rx="8" ry="9" fill="#1B1740"/><ellipse class="b-open" cx="60" cy="91" rx="5" ry="3.5" fill="#FF6B8B"/>' +
      '<circle class="b-hmm" cx="65" cy="86" r="3.5" fill="#1B1740"/>' +
    '</g></svg>';

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

    // The full page gets a colorful stage and a little animated buddy. The compact one stays plain.
    var fun = !compact, buddy = null, bubble = null, wrap, moodTimer = null, prevKey = null, prevVotes = null;
    if (fun) {
      buddy = h('button', { type: 'button', class: 'wyr-buddy idle', 'aria-label': 'Say hello to the question buddy', onclick: function () {
        mood('party', pickLine(['Hi, class!', 'Wheee!', 'I love a good question!', 'Tell a partner why!', 'No wrong answers here!']), 1800);
      } });
      buddy.innerHTML = BUDDY;
      bubble = h('p', { class: 'wyr-bubble', 'aria-live': 'polite' });
      [A, B].forEach(function (S) { S.btn.append(h('span', { class: 'lead-badge', text: 'In the Lead' })); });
    }
    function pickLine(list) { return list[Math.floor(Math.random() * list.length)]; }
    function statusLine() {
      var v = state.votes || { a: 0, b: 0 }, d = Math.abs(v.a - v.b);
      if (!v.a && !v.b) return 'Pick a side, then tell a partner why.';
      if (!d) return 'It’s a tie! Who will break it?';
      return 'Choice ' + (v.a > v.b ? 'A' : 'B') + ' is ahead by ' + d + '!';
    }
    function mood(m, text, ms) {
      if (!fun) return;
      clearTimeout(moodTimer);
      buddy.className = 'wyr-buddy'; void buddy.offsetWidth; buddy.className = 'wyr-buddy ' + m;
      bubble.textContent = text;
      bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
      if (ms) moodTimer = setTimeout(function () { buddy.className = 'wyr-buddy idle'; bubble.textContent = statusLine(); }, ms);
    }
    function plusOne(S) {
      var f = h('span', { class: 'plus-one', 'aria-hidden': 'true', text: '+1' });
      f.style.left = 20 + Math.random() * 60 + '%';
      S.btn.append(f); setTimeout(function () { f.remove(); }, 900);
      S.btn.classList.remove('voted'); void S.btn.offsetWidth; S.btn.classList.add('voted');
    }

    el.append(wrap = h('div', { class: 'wyr' + (compact ? ' compact' : ' fun') },
      fun ? h('div', { class: 'wyr-sky', 'aria-hidden': 'true' }, ['?', '★', '?', '●', '★', '?', '●', '★'].map(function (g, i) { return h('i', { class: 'f' + i, text: g }); })) : null,
      fun ? bubble : null,
      h('div', { class: 'choices' }, A.btn, fun ? h('div', { class: 'wyr-mid' }, buddy, h('div', { class: 'or', 'aria-hidden': 'true', text: 'OR' })) : h('div', { class: 'or', 'aria-hidden': 'true', text: 'OR' }), B.btn),
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
      if (!fun) return;
      A.btn.classList.toggle('lead', v.a > v.b); B.btn.classList.toggle('lead', v.b > v.a);
      var key = keyOf(q);
      if (prevKey === null) { buddy.className = 'wyr-buddy idle'; bubble.textContent = t ? statusLine() : 'Ooh, today’s question is a good one!'; }
      else if (key !== prevKey) {
        wrap.classList.remove('swap'); void wrap.offsetWidth; wrap.classList.add('swap');
        mood('think', pickLine(['Hmm, a brand new question…', 'Ooh, this one is tricky…', 'Let me think about this one…', 'Whoa, tough choice…']), 3200);
      } else if (v.a > prevVotes.a || v.b > prevVotes.b) {
        var isA = v.a > prevVotes.a;
        plusOne(isA ? A : B); TT.tick();
        mood(isA ? 'cheer-a' : 'cheer-b', pickLine(isA ? ['One more for A!', 'Team A!', 'Great pick!', 'A it is!'] : ['One more for B!', 'Team B!', 'Great pick!', 'B it is!']), 1500);
      } else if (!t && (prevVotes.a || prevVotes.b)) mood('party', 'Fresh start! Vote again.', 1600);
      prevKey = key; prevVotes = { a: v.a, b: v.b };
    }
    TT.wyr.onChange(paint);
    paint();
    return { paint: paint };
  };
})();
