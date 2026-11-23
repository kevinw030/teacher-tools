// Three additions: the "Pick a Reward" tab in Class Points, Fact Fluency practice, and the Prompts page.
// Everything saves in this browser with the usual TT.save keys.
(function () {
  var TT = window.TT, h = TT.h;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TINTS = ['cobalt', 'coral', 'emerald', 'amber', 'violet', 'rose', 'sky', 'lime'];

  // A fixed-size window that text rolls through (the same motion as Brain Breaks and the Name Picker).
  function reel(cls, first) {
    var item = h('div', { class: 'bb-item' }, first || '');
    var el = h('div', { class: 'pick-name ' + cls, 'aria-live': 'polite' }, item);
    function slide(text, ms, last) {
      var old = item, next = h('div', { class: 'bb-item' }, text);
      if (!last) next.setAttribute('aria-hidden', 'true');
      el.append(next); item = next;
      if (still || !next.animate) { old.remove(); return; }
      old.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-85%)', opacity: 0 }], { duration: ms, easing: last ? 'ease-out' : 'linear', fill: 'forwards' }).onfinish = function () { old.remove(); };
      next.animate([{ transform: 'translateY(85%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: last ? ms * 1.5 : ms, easing: last ? 'cubic-bezier(.2, 1.5, .4, 1)' : 'linear' });
    }
    // Roll through a few choices and land on the winner. done() runs when it stops.
    function roll(choices, winner, done) {
      var steps = still || choices.length < 2 ? 0 : 10, i = 0, lastPick = '';
      (function step() {
        if (i >= steps) { slide(winner, 520, true); TT.tick(); setTimeout(done, still ? 0 : 420); return; }
        var n, tries = 0;
        do { n = choices[Math.floor(Math.random() * choices.length)]; } while (n === lastPick && ++tries < 8);
        lastPick = n;
        var ms = 130 + i * i * 3.4;
        slide(n, ms); TT.tick(); i++;
        setTimeout(step, ms);
      })();
    }
    return { el: el, slide: slide, roll: roll, set: function (t) { el.textContent = ''; item = h('div', { class: 'bb-item' }, t); el.append(item); } };
  }

  // ====================== Class Points: Pick a Reward ======================
  var REWARDS = ['Extra Recess', 'Pajama Day', 'Movie Afternoon', 'Free Draw Time', 'Sit Anywhere Day', 'Game Time'];
  TT.rewardsTab = function (box, state, save, toJar) {
    var r = state.rewards = state.rewards || {};
    if (!Array.isArray(r.list) || r.list.length < 2) r.list = REWARDS.slice();
    r.votes = r.votes || {};
    r.how = r.how === 'spin' ? 'spin' : 'vote';
    var body = h('div', { class: 'rw-body' });
    var how = h('div', { class: 'segmented', role: 'group', 'aria-label': 'How to pick' }, [['vote', 'Class Vote'], ['spin', 'Spin for It']].map(function (m) {
      return h('button', { type: 'button', class: 'seg' + (r.how === m[0] ? ' on' : ''), 'aria-pressed': r.how === m[0], onclick: function () { r.how = m[0]; save(); box.textContent = ''; TT.rewardsTab(box, state, save, toJar); } }, m[1]);
    }));
    var now = h('p', { class: 'rw-now' });
    function paintNow() { now.textContent = ''; now.append('The jar is working toward: ', h('b', { text: state.jar.reward || 'a class reward' })); }
    function use(name) { state.jar.reward = name; save(); paintNow(); TT.chime(); if (TT.celebrate) TT.celebrate(box); }
    var edit = h('textarea', { class: 'roster-input', id: 'rwList', rows: 6, 'aria-label': 'Reward choices, one per line' });
    edit.value = r.list.join('\n');
    edit.addEventListener('change', function () {
      var list = edit.value.split('\n').map(function (s) { return s.trim().slice(0, 40); }).filter(Boolean).slice(0, 8);
      if (list.length < 2) { edit.value = r.list.join('\n'); return; }
      r.list = list; Object.keys(r.votes).forEach(function (k) { if (list.indexOf(k) < 0) delete r.votes[k]; });
      save(); box.textContent = ''; TT.rewardsTab(box, state, save, toJar);
    });
    var editBox = h('details', { class: 'rw-edit' }, h('summary', { text: 'Change the Reward Choices' }),
      h('p', { class: 'muted', text: 'One reward on each line, up to 8. Click outside the box when you finish.' }), edit);

    function vote() {
      var grid = h('div', { class: 'rw-grid' }), msg = h('p', { class: 'rw-msg', 'aria-live': 'polite' });
      function paint() {
        grid.textContent = '';
        var top = Math.max.apply(null, r.list.map(function (n) { return r.votes[n] || 0; }));
        r.list.forEach(function (n, i) {
          var v = r.votes[n] || 0;
          grid.append(h('div', { class: 'rw-card c-' + TINTS[i % 8] + (top > 0 && v === top ? ' lead' : '') },
            h('button', { type: 'button', class: 'rw-vote', 'aria-label': 'Add a vote for ' + n, onclick: function () { r.votes[n] = v + 1; save(); TT.tick(); paint(); } },
              h('span', { class: 'rw-name', text: n }), h('b', { class: 'rw-count', text: String(v) }), h('span', { class: 'rw-tap', text: 'Tap to Vote' })),
            h('button', { type: 'button', class: 'rw-minus', title: 'Take One Vote Away', 'aria-label': 'Take one vote away from ' + n, html: TT.icon('minus'), onclick: function () { r.votes[n] = Math.max(0, v - 1); save(); paint(); } })));
        });
      }
      paint();
      body.append(grid, msg, h('div', { class: 'row' },
        TT.button('Use the Winner for the Jar', { icon: 'sparkle', kind: 'primary big', onclick: function () {
          var top = Math.max.apply(null, r.list.map(function (n) { return r.votes[n] || 0; }));
          var winners = r.list.filter(function (n) { return (r.votes[n] || 0) === top; });
          if (top === 0) { msg.textContent = 'Nobody has voted yet. Tap a reward to add a vote.'; return; }
          if (winners.length > 1) { msg.textContent = 'It is a tie between ' + winners.join(' and ') + '. Vote again between those, or use Spin for It.'; return; }
          msg.textContent = winners[0] + ' wins the vote!'; use(winners[0]);
        } }),
        TT.button('Clear the Votes', { icon: 'reset', kind: 'big', onclick: function () { r.votes = {}; save(); msg.textContent = ''; paint(); } })));
    }
    function spin() {
      var rl = reel('rw-reel', 'Ready to spin?'), sub = h('div', { class: 'pick-sub', text: r.list.length + ' rewards to land on' });
      var stage = h('div', { class: 'pick-stage rw-stage' }, rl.el, sub), busy = false, won = '';
      var useBtn = TT.button('Use This for the Jar', { kind: 'big', onclick: function () { if (won) use(won); } });
      useBtn.disabled = true;
      var spinBtn = TT.button('Spin for a Reward', { icon: 'sparkle', kind: 'primary big', onclick: function () {
        if (busy) return;
        busy = true; useBtn.disabled = true; stage.classList.remove('reveal'); stage.classList.add('spinning'); sub.textContent = 'Spinning…';
        var w = r.list[Math.floor(Math.random() * r.list.length)];
        rl.roll(r.list, w, function () { busy = false; won = w; useBtn.disabled = false; stage.classList.remove('spinning'); stage.classList.add('reveal'); sub.textContent = 'The class landed on this one!'; TT.chime(); });
      } });
      body.append(stage, h('div', { class: 'row center' }, spinBtn, useBtn));
    }
    (r.how === 'vote' ? vote : spin)();
    paintNow();
    box.append(h('div', { class: 'rw' }, h('div', { class: 'rw-top' }, how, now, TT.button('Back to the Jar', { kind: 'small', onclick: toJar })), body, editBox));
  };

  // ====================== Fact Fluency ======================
  var OPS = [['add', 'Addition', '+'], ['sub', 'Subtraction', '−'], ['mul', 'Multiplication', '×'], ['div', 'Division', '÷'], ['mix', 'Mixed', '±']];
  var LEVELS = [['1', 'Starter'], ['2', 'On Level'], ['3', 'Challenge']];
  var LEVEL_HINT = {
    add: ['Sums to 10', 'Sums to 20', 'Sums to 100'], sub: ['Within 10', 'Within 20', 'Within 100'],
    mul: ['×0, 1, 2, 5 and 10', 'Up to 10 × 10', 'Up to 12 × 12'], div: ['÷1, 2, 5 and 10', 'Facts to 100 ÷ 10', 'Facts to 144 ÷ 12'], mix: ['A little of everything', 'A little of everything', 'A little of everything']
  };
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function fact(op, lv) {
    if (op === 'mix') op = ['add', 'sub', 'mul', 'div'][rnd(0, 3)];
    var a, b, easy = [0, 1, 2, 5, 10];
    if (op === 'add' || op === 'sub') {
      if (lv === 1) { a = rnd(0, 10); b = rnd(0, 10 - a); }
      else if (lv === 2) { a = rnd(2, 12); b = rnd(2, Math.min(9, 20 - a)); }
      else { a = rnd(11, 79); b = rnd(3, Math.min(20, 100 - a)); }
      return op === 'add' ? { q: a + ' + ' + b, a: a + b } : { q: (a + b) + ' − ' + b, a: a };
    }
    if (lv === 1) { a = easy[rnd(0, 4)]; b = rnd(1, 10); } else { a = rnd(2, lv === 2 ? 10 : 12); b = rnd(2, lv === 2 ? 10 : 12); }
    if (op === 'mul') return Math.random() < 0.5 ? { q: a + ' × ' + b, a: a * b } : { q: b + ' × ' + a, a: a * b };
    if (a === 0) a = 1;
    return { q: (a * b) + ' ÷ ' + a, a: b };
  }
  TT.mountFluency = function (el) {
    var state = TT.load('fluency', null) || {};
    state.best = state.best || {};
    if (!state.op) state.op = 'mul';
    if (!state.lv) state.lv = 2;
    if (!state.secs) state.secs = 60;
    var view = h('div', { class: 'ff' });
    el.append(view);
    function save() { TT.save('fluency', state); }
    function key() { return state.op + state.lv + ':' + state.secs; }
    var run = null, iv = 0;

    function setup() {
      clearInterval(iv); run = null; view.textContent = '';
      var opName = OPS.filter(function (o) { return o[0] === state.op; })[0][1], best = state.best[key()] || 0;
      view.append(h('div', { class: 'ff-setup' },
        h('div', { class: 'ff-pick' }, h('span', { class: 'ff-label', text: '1. Choose the Facts' }),
          h('div', { class: 'ff-ops' }, OPS.map(function (o) {
            return h('button', { type: 'button', class: 'ff-op' + (state.op === o[0] ? ' on' : ''), 'aria-pressed': state.op === o[0], onclick: function () { state.op = o[0]; save(); setup(); } }, h('b', { text: o[2] }), h('span', { text: o[1] }));
          }))),
        h('div', { class: 'ff-pick' }, h('span', { class: 'ff-label', text: '2. Choose the Level' }),
          h('div', { class: 'segmented' }, LEVELS.map(function (l) {
            return h('button', { type: 'button', class: 'seg' + (state.lv === +l[0] ? ' on' : ''), 'aria-pressed': state.lv === +l[0], onclick: function () { state.lv = +l[0]; save(); setup(); } }, l[1]);
          })), h('span', { class: 'muted', text: LEVEL_HINT[state.op][state.lv - 1] })),
        h('div', { class: 'ff-pick' }, h('span', { class: 'ff-label', text: '3. Choose the Time' }),
          h('div', { class: 'segmented' }, [[30, '30 Seconds'], [60, '1 Minute'], [120, '2 Minutes']].map(function (t) {
            return h('button', { type: 'button', class: 'seg' + (state.secs === t[0] ? ' on' : ''), 'aria-pressed': state.secs === t[0], onclick: function () { state.secs = t[0]; save(); setup(); } }, t[1]);
          }))),
        h('div', { class: 'ff-go' },
          h('div', { class: 'ff-best' }, h('span', { text: 'Class Best to Beat' }), h('b', { text: best ? String(best) : '–' }), h('small', { text: opName + ' · ' + LEVELS[state.lv - 1][1] })),
          TT.button('Start the Round', { icon: 'play', kind: 'primary big', onclick: start }),
          best ? TT.button('Reset This Best', { icon: 'reset', kind: 'small', onclick: function () { delete state.best[key()]; save(); setup(); } }) : null)));
    }

    function start() {
      view.textContent = '';
      run = { left: state.secs, right: 0, miss: 0, typed: '', f: fact(state.op, state.lv), last: '' };
      var q = h('div', { class: 'ff-q' }), ans = h('div', { class: 'ff-ans', 'aria-live': 'polite' }), card = h('div', { class: 'ff-card' }, q, h('span', { class: 'ff-eq', text: '=' }), ans);
      var time = h('b', { class: 'ff-time' }), score = h('b', { class: 'ff-score' }), bar = h('span');
      var pad = h('div', { class: 'ff-pad', role: 'group', 'aria-label': 'Number pad' });
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].forEach(function (k) {
        pad.append(h('button', { type: 'button', class: 'ff-key' + (k === 'ok' ? ' ok' : k === 'del' ? ' del' : ''), 'aria-label': k === 'ok' ? 'Check the answer' : k === 'del' ? 'Erase' : k, onclick: function () { press(k); } }, k === 'ok' ? 'Enter' : k === 'del' ? '⌫' : k));
      });
      function paint() {
        q.textContent = run.f.q; ans.textContent = run.typed || '?'; ans.classList.toggle('empty', !run.typed);
        time.textContent = Math.floor(run.left / 60) + ':' + (run.left % 60 < 10 ? '0' : '') + run.left % 60; score.textContent = String(run.right);
        bar.style.width = (100 - run.left / state.secs * 100) + '%';
      }
      function press(k) {
        if (!run || run.left <= 0) return;
        if (k === 'del') run.typed = run.typed.slice(0, -1);
        else if (k === 'ok') {
          if (!run.typed) return;
          if (+run.typed === run.f.a) {
            run.right++; TT.tick(); run.typed = '';
            var n; do { n = fact(state.op, state.lv); } while (n.q === run.f.q);
            run.f = n; card.classList.remove('good'); void card.offsetWidth; card.classList.add('good');
          } else { run.miss++; run.typed = ''; card.classList.remove('bad'); void card.offsetWidth; card.classList.add('bad'); }
        } else if (run.typed.length < 3) run.typed += k;
        paint();
      }
      run.press = press;
      view.append(h('div', { class: 'ff-play' },
        h('div', { class: 'ff-hud' }, h('div', { class: 'ff-stat' }, h('span', { text: 'Time Left' }), time), h('span', { class: 'track ff-track' }, bar), h('div', { class: 'ff-stat' }, h('span', { text: 'Correct' }), score)),
        card, pad, h('div', { class: 'row center' }, TT.button('Stop the Round', { kind: 'small', onclick: setup }))));
      paint();
      iv = setInterval(function () {
        if (!run) { clearInterval(iv); return; }
        run.left--; paint();
        if (run.left <= 0) { clearInterval(iv); finish(); }
      }, 1000);
    }

    function finish() {
      var r = run, old = state.best[key()] || 0, record = r.right > old;
      if (record) { state.best[key()] = r.right; save(); }
      run = null; view.textContent = ''; TT.chime();
      view.append(h('div', { class: 'ff-done' + (record ? ' record' : '') },
        h('span', { class: 'eyebrow', text: record ? 'New Class Best!' : 'Time Is Up' }),
        h('div', { class: 'ff-final' }, h('b', { text: String(r.right) }), h('span', { text: r.right === 1 ? 'fact correct' : 'facts correct' })),
        h('p', { class: 'ff-note', text: record ? (old ? 'You beat the old best of ' + old + '.' : 'That is the first score to beat.') : r.right === old ? 'You tied the class best of ' + old + '. So close!' : 'The class best is ' + old + '. Only ' + (old - r.right + 1) + ' more to beat it.' }),
        r.miss ? h('p', { class: 'muted', text: r.miss + (r.miss === 1 ? ' answer needed' : ' answers needed') + ' a second try.' }) : null,
        h('div', { class: 'row center' }, TT.button('Play Again', { icon: 'play', kind: 'primary big', onclick: start }), TT.button('Change the Facts', { kind: 'big', onclick: setup }))));
      if (record && TT.celebrate) TT.celebrate(view);
    }

    document.addEventListener('keydown', function (e) {
      if (!run || el.offsetParent === null || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); run.press(e.key); }
      else if (e.key === 'Enter') { e.preventDefault(); run.press('ok'); }
      else if (e.key === 'Backspace') { e.preventDefault(); run.press('del'); }
    });
    setup();
    return { hide: function () { if (run) setup(); } };
  };

  // ====================== Prompts ======================
  var KINDS = [['write', 'Writing Prompts'], ['talk', 'Discussion Starters'], ['pick', 'This or That']];
  TT.mountPrompts = function (el) {
    var state = TT.load('prompts', null) || {};
    if (!state.kind) state.kind = 'write';
    if (!state.subject) state.subject = 'Any';
    state.seen = state.seen || {};
    var cur = null, busy = false, votes = [0, 0];
    function save() { TT.save('prompts', state); }
    var kinds = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Kind of prompt' });
    var subjects = h('div', { class: 'pr-subjects', role: 'group', 'aria-label': 'Subject' });
    var rl = reel('pr-reel', ''), sub = h('div', { class: 'pick-sub' });
    var duel = h('div', { class: 'pr-duel', hidden: true });
    // Every prompt comes with a helper: the facts, examples or a sentence starter a student needs to get going.
    var helpText = h('span'), help = h('div', { class: 'pr-help', hidden: true }, h('b', { text: 'Helper' }), helpText);
    var stage = h('div', { class: 'pick-stage pr-stage' }, rl.el, duel, help, sub);
    var nextBtn = TT.button('New Prompt', { icon: 'sparkle', kind: 'primary big', onclick: next });
    var gradeRow = h('div', { class: 'pr-grade' }, h('span', { class: 'ff-label', text: 'Grade' }), TT.gradePicker(function () { cur = null; paint(); }));
    el.append(h('div', { class: 'pr' }, h('div', { class: 'pr-top' }, kinds, gradeRow), subjects, stage, h('div', { class: 'row center' }, nextBtn)));

    function pool() {
      var out = [], band = TT.gradeBand(TT.grade());
      if (state.kind === 'pick') TT.THIS_OR_THAT.forEach(function (t) { if (state.subject === 'Any' || t[0] === state.subject) out.push(t[1] + '|' + t[2]); });
      else {
        var src = (state.kind === 'write' ? TT.WRITING_PROMPTS : TT.DISCUSSION_PROMPTS)[band];
        Object.keys(src).forEach(function (s) { if (state.subject === 'Any' || s === state.subject) out = out.concat(src[s]); });
      }
      return out;
    }
    function paint() {
      kinds.textContent = '';
      KINDS.forEach(function (k) { kinds.append(h('button', { type: 'button', class: 'seg' + (state.kind === k[0] ? ' on' : ''), 'aria-pressed': state.kind === k[0], onclick: function () { state.kind = k[0]; cur = null; save(); paint(); } }, k[1])); });
      subjects.textContent = '';
      ['Any'].concat(TT.PROMPT_SUBJECTS).forEach(function (s, i) {
        subjects.append(h('button', { type: 'button', class: 'chip pr-subject' + (state.subject === s ? ' on' : ''), 'aria-pressed': state.subject === s, onclick: function () { state.subject = s; cur = null; save(); paint(); } }, s === 'Any' ? 'Any Subject' : s));
      });
      gradeRow.hidden = state.kind === 'pick';
      nextBtn.lastChild.textContent = state.kind === 'pick' ? 'New Question' : 'New Prompt';
      stage.classList.toggle('duel', state.kind === 'pick');
      stage.classList.remove('reveal');
      if (!cur) {
        duel.hidden = true; rl.el.hidden = false; help.hidden = true;
        rl.set(state.kind === 'write' ? 'Ready to write?' : state.kind === 'talk' ? 'Ready to talk it over?' : 'Ready to choose?');
        sub.textContent = pool().length + (state.kind === 'pick' ? ' questions' : ' prompts') + (state.kind === 'pick' ? '' : ' for ' + TT.GRADE_NAMES[TT.grade()] + ' grade') + (state.subject === 'Any' ? '' : ' in ' + state.subject);
      }
    }
    function showDuel() {
      var parts = cur.split('|');
      duel.textContent = '';
      parts.forEach(function (t, i) {
        var n = h('b', { text: String(votes[i]) });
        duel.append(h('button', { type: 'button', class: 'pr-side ' + (i ? 'c-coral' : 'c-cobalt'), 'aria-label': 'Vote for ' + t, onclick: function () { votes[i]++; n.textContent = String(votes[i]); TT.tick(); } },
          h('span', { class: 'pr-side-text', text: t }), h('span', { class: 'pr-side-count' }, n, h('small', { text: 'Tap to Vote' }))));
        if (!i) duel.append(h('span', { class: 'pr-or', text: 'or' }));
      });
    }
    function next() {
      if (busy) return;
      var all = pool(); if (!all.length) return;
      var k = state.kind + ':' + (state.kind === 'pick' ? '' : TT.gradeBand(TT.grade())) + ':' + state.subject;
      var seen = state.seen[k] || [], left = all.filter(function (p) { return seen.indexOf(p) < 0; });
      if (!left.length) { seen = []; left = all.filter(function (p) { return p !== cur; }); if (!left.length) left = all; }
      var pickd = left[Math.floor(Math.random() * left.length)];
      seen.push(pickd); state.seen[k] = seen; save();
      cur = pickd; votes = [0, 0]; busy = true;
      var bits = cur.split(' || '); help.hidden = state.kind === 'pick' || !bits[1]; helpText.textContent = bits[1] || '';
      stage.classList.remove('reveal'); stage.classList.add('spinning');
      function done() { busy = false; stage.classList.remove('spinning'); stage.classList.add('reveal'); sub.textContent = state.kind === 'write' ? 'Take a minute to think, then start writing.' : state.kind === 'talk' ? 'Turn and talk with a partner, then share with the class.' : 'Tap a side for each vote, or have students move to a side of the room.'; }
      if (state.kind === 'pick') { duel.hidden = false; rl.el.hidden = true; showDuel(); if (!still && duel.animate) duel.animate([{ transform: 'translateY(24px) scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2, 1.4, .4, 1)' }); TT.tick(); done(); }
      else { rl.slide(bits[0], 420, true); if (!still && help.animate) help.animate([{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, delay: 260, easing: 'cubic-bezier(.2, 1.3, .4, 1)', fill: 'backwards' }); TT.tick(); setTimeout(done, still ? 0 : 420); }
    }
    document.addEventListener('keydown', function (e) {
      if (el.offsetParent === null || /INPUT|TEXTAREA|BUTTON|SELECT/.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); next(); }
    });
    paint();
    return { show: function () { paint(); } };
  };
})();
