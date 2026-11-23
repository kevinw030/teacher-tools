// Would You Rather: one question per day, no repeats until every question has been used.
// Each day starts hidden. The class spins a reel (like Brain Breaks) to find out today's question.
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

  // quiet = save without telling the other views yet (used while the reel is still spinning).
  function pickNew(quiet) {
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
    if (quiet) TT.save(KEY, state); else save();
    return q;
  }
  // Today's question, or null until the class has spun for it.
  function current() {
    if (!questions.length) return null;
    if (state.date === TT.today() && byKey[state.current]) return byKey[state.current];
    return null;
  }
  function randomQ(not) {
    var q, n = 0;
    do { q = questions[Math.floor(Math.random() * questions.length)]; n++; } while (q === not && n < 8);
    return q;
  }

  TT.wyr = {
    current: current,
    count: function () { return questions.length; },
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

  // The question buddy is the site mascot (tools/mascot.js).
  var MOODS = { idle: 'idle', think: 'think', 'cheer-a': 'cheer-left', 'cheer-b': 'cheer-right', party: 'party' };

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
      h('span', { text: 'Spin for a different question?' }),
      TT.button('Yes, Spin Again', { kind: 'primary', onclick: function () { confirm.hidden = true; newBtn.hidden = false; spin(); } }),
      TT.button('Keep It', { onclick: function () { confirm.hidden = true; newBtn.hidden = false; } })
    );

    // The full page gets a colorful stage and a little animated buddy. The compact one stays plain.
    var fun = !compact, mascot = null, buddy = null, bubble = null, wrap, moodTimer = null, prevKey = null, prevVotes = null;
    if (fun) {
      buddy = h('button', { type: 'button', class: 'wyr-buddy idle', 'aria-label': 'Say hello to the question buddy', onclick: function () {
        mood('party', pickLine(['Hi, class!', 'Wheee!', 'I love a good question!', 'Tell a partner why!', 'No wrong answers here!']), 1800);
      } });
      mascot = TT.mascot(); buddy.append(mascot);
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
      buddy.className = 'wyr-buddy ' + m; mascot.mood(MOODS[m] || 'idle');
      bubble.textContent = text;
      bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
      if (ms) moodTimer = setTimeout(function () { buddy.className = 'wyr-buddy idle'; mascot.mood('idle'); bubble.textContent = statusLine(); }, ms);
    }
    function plusOne(S) {
      var f = h('span', { class: 'plus-one', 'aria-hidden': 'true', text: '+1' });
      f.style.left = 20 + Math.random() * 60 + '%';
      S.btn.append(f); setTimeout(function () { f.remove(); }, 900);
      S.btn.classList.remove('voted'); void S.btn.offsetWidth; S.btn.classList.add('voted');
    }

    // The spin reel: a fixed-size window that questions slide through, so nothing jumps while it spins.
    var spinning = false, still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var item = h('div', { class: 'bb-item' }, h('span', { text: 'What will today’s question be?' }));
    var reel = h('div', { class: 'wyr-reel bb-reel', 'aria-live': 'polite' }, item);
    var spinBtn = TT.button(compact ? 'Spin for Today’s Question' : 'Spin the Wheel', { icon: 'sparkle', kind: compact ? 'primary' : 'primary big', onclick: function () { spin(); } });
    var buddySpot = fun ? h('div', { class: 'wyr-spin-buddy' }) : null;
    var spinBox = h('div', { class: 'wyr-spin', hidden: true }, buddySpot,
      h('div', { class: 'wyr-reel-wrap' }, h('span', { class: 'wyr-ptr l', 'aria-hidden': 'true' }), reel, h('span', { class: 'wyr-ptr r', 'aria-hidden': 'true' })), spinBtn);
    function line(q) {
      return ['Would you rather ', h('span', { class: 'x', text: q[0] }), ' or ', h('span', { class: 'y', text: q[1] }), '?'];
    }
    function slide(content, ms, last) {
      var old = item, next = h('div', { class: 'bb-item' }, h('span', null, content));
      if (!last) next.setAttribute('aria-hidden', 'true');
      reel.append(next); item = next;
      if (still || !next.animate) { old.remove(); return; }
      old.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-85%)', opacity: 0 }], { duration: ms, easing: last ? 'ease-out' : 'linear', fill: 'forwards' }).onfinish = function () { old.remove(); };
      next.animate([{ transform: 'translateY(85%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: last ? ms * 1.5 : ms, easing: last ? 'cubic-bezier(.2, 1.5, .4, 1)' : 'linear' });
    }
    function spin() {
      if (spinning || !questions.length) return;
      spinning = true; spinBtn.disabled = true;
      paint();
      var winner = pickNew(true);
      if (fun) mood('think', pickLine(['Round and round it goes…', 'Which one will it be?', 'Ooh, I can’t look!', 'Here it comes…']));
      // Starts quick and eases down to a stop over about three seconds, the same as Brain Breaks.
      var steps = still ? 0 : 12, i = 0;
      (function step() {
        if (i >= steps) {
          slide(line(winner), 520, true); TT.tick(); wrap.classList.add('landed');
          setTimeout(function () {
            spinning = false; spinBtn.disabled = false; wrap.classList.remove('landed');
            if (TT.chime) TT.chime();
            save();   // now every view (this one, the home page, the board) shows today's question
            wrap.classList.remove('swap'); void wrap.offsetWidth; wrap.classList.add('swap');
            if (fun) mood('party', pickLine(['Today’s question is here!', 'Ooh, this is a good one!', 'Pick a side, class!']), 2400);
          }, still ? 300 : 1500);
          return;
        }
        var ms = 130 + i * i * 3.2;
        slide(line(randomQ(winner)), ms, false); TT.tick(); i++;
        setTimeout(step, ms);
      })();
    }

    var choicesEl, midEl = fun ? h('span', { class: 'wyr-buddy-home' }) : null;
    el.append(wrap = h('div', { class: 'wyr' + (compact ? ' compact' : ' fun') },
      fun ? bubble : null, spinBox,
      choicesEl = h('div', { class: 'choices' }, A.btn, fun ? h('div', { class: 'wyr-mid' }, midEl, h('div', { class: 'or', 'aria-hidden': 'true', text: 'OR' })) : h('div', { class: 'or', 'aria-hidden': 'true', text: 'OR' }), B.btn),
      compact ? null : h('div', { class: 'wyr-foot' },
        h('div', { class: 'progress' }, progressLabel, h('span', { class: 'track' }, progressBar)),
        h('div', { class: 'row' },
          TT.button('Add Your Own', { icon: 'plus', onclick: function () { TT.custom.open('wyr'); } }),
          TT.button('Clear Votes', { icon: 'reset', onclick: function () { state.votes = { a: 0, b: 0 }; save(); } }),
          confirm, newBtn))
    ));

    var footRow = null;
    function paint() {
      var q = current();
      var waiting = spinning || (!q && questions.length > 0);
      wrap.classList.toggle('unspun', waiting);
      spinBox.hidden = !waiting; choicesEl.hidden = waiting;
      if (fun) { (waiting ? buddySpot : midEl).append(buddy); newBtn.disabled = waiting; }
      if (waiting) {
        if (!spinning) {
          if (!item.isConnected || item.getAttribute('aria-hidden')) { reel.textContent = ''; item = h('div', { class: 'bb-item' }, h('span', { text: 'What will today’s question be?' })); reel.append(item); }
          if (fun) { clearTimeout(moodTimer); buddy.className = 'wyr-buddy idle'; mascot.mood('point'); bubble.textContent = 'Spin the wheel to find today’s question!'; }
          prevKey = null;
        }
        progressLabel.innerHTML = '<b>' + questions.length + '</b> questions in the wheel · a new one every day';
        progressBar.style.width = Math.round((state.seen || []).length / questions.length * 100) + '%';
        return;
      }
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
      if (prevKey === null) { buddy.className = 'wyr-buddy idle'; if (!moodTimer) mascot.mood('idle'); bubble.textContent = t ? statusLine() : 'Ooh, today’s question is a good one!'; }
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
    // The home page's "Spin the Wheel" button opens this page and starts the spin.
    function auto() { if (fun && TT.wyr.autoSpin && !current() && !spinning && location.hash === '#would-you-rather') { TT.wyr.autoSpin = false; setTimeout(spin, 650); } }
    if (fun) { window.addEventListener('hashchange', auto); auto(); }
    return { paint: paint, spin: spin };
  };
})();
