// Fact Fluency game stage ("Fact Dash"): the bright quiz screen used by the Class Round on the teacher's
// screen (tools/fluency.js) and by each student's own device (assets/join-fluency.js).
// The sidekick cheers right answers and helps with wrong ones, a ring timer counts down, streaks build up,
// and a colorful number pad sits under one big fact. Styles: .fd-* in assets/fluency.css.
// F.stage(h, opts) -> { el, press(key), setFact(q), setTyped(text), good(), bad(answer), setTime(left, total), setScore(n), say(text, mood) }
// opts: { who: element or null, onKey: fn(key), compact: true on phones }
(function () {
  var F = window.Fluency = window.Fluency || {};
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CHEERS = ['Yes!', 'Nice!', 'You got it!', 'Super!', 'Way to go!', 'Awesome!', 'Keep it up!', 'So fast!'];
  var STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9z"/></svg>';
  var FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.4 1.2-4 2.5-5 .1 1.8.9 3 2 3.5C11 8.5 11 5 12 2z"/></svg>';
  var MILESTONES = { 3: '3 in a Row!', 5: '5 in a Row!', 10: '10 in a Row!', 15: '15 in a Row!', 20: '20 in a Row!', 25: '25 in a Row!', 30: 'Unstoppable!' };

  F.stage = function (h, opts) {
    opts = opts || {};
    var R = 44, C = 2 * Math.PI * R;
    var ring = h('div', { class: 'fd-ring', html: '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="fd-ring-bg" cx="50" cy="50" r="' + R + '"/><circle class="fd-ring-run" cx="50" cy="50" r="' + R + '" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg>' });
    var secs = h('b', { class: 'fd-secs' }); ring.append(secs);
    var scoreN = h('b', { class: 'fd-score-n', text: '0' });
    var score = h('div', { class: 'fd-score', 'aria-label': 'Correct answers' }, h('span', { class: 'fd-star', html: STAR }), scoreN);
    var streakN = h('b', { text: '0' });
    var streak = h('div', { class: 'fd-streak', 'aria-live': 'polite' }, h('span', { class: 'fd-flame', html: FLAME }), streakN, h('span', { class: 'fd-streak-t', text: 'in a row' }));
    var q = h('span', { class: 'fd-q' }), ans = h('span', { class: 'fd-ans empty', text: '?' });
    var plus = h('span', { class: 'fd-plus', 'aria-hidden': 'true', text: '+1' });
    var card = h('div', { class: 'fd-card', 'aria-live': 'polite' }, q, h('span', { class: 'fd-eq', text: '=' }), ans, plus);
    var pad = h('div', { class: 'fd-pad', role: 'group', 'aria-label': 'Number pad' });
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].forEach(function (k, i) {
      pad.append(h('button', { type: 'button', class: 'fd-key k' + (k === 'ok' ? 'ok' : k === 'del' ? 'del' : Math.floor(i / 3)), 'aria-label': k === 'ok' ? 'Check my answer' : k === 'del' ? 'Erase' : k,
        onclick: function () { if (opts.onKey) opts.onKey(k); } },
        k === 'ok' ? h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>' })
          : k === 'del' ? h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5h11v14H9l-6-7z"/><path d="m12 9 5 6M17 9l-5 6"/></svg>' }) : k));
    });
    var buddy = window.TT && TT.mascot ? TT.mascot({ mood: 'wave' }) : h('span');
    var bubble = h('div', { class: 'fd-bubble', 'aria-hidden': 'true' });
    var side = h('div', { class: 'fd-buddy' }, bubble, buddy);
    var top = h('div', { class: 'fd-top' }, ring, opts.who || null, streak, score);
    var main = h('div', { class: 'fd-main' }, top, card, pad);
    var el = h('div', { class: 'fd' + (opts.compact ? ' compact' : '') }, h('div', { class: 'fd-glow a', 'aria-hidden': 'true' }), h('div', { class: 'fd-glow b', 'aria-hidden': 'true' }), side, main);
    var n = 0, run = 0, best = 0, sayT = 0, lastCheer = -1;

    function bump(node, cls) { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); }
    function say(text, mood, ms) {
      bubble.textContent = text; bump(bubble, 'pop'); bubble.classList.add('on');
      if (mood && buddy.mood) buddy.mood(mood, ms || 1600);
      clearTimeout(sayT); sayT = setTimeout(function () { bubble.classList.remove('on'); }, ms || 1600);
    }
    function burst(node) {
      if (still) return;
      for (var i = 0; i < 10; i++) {
        var b = h('i', { class: 'fd-burst cf cf-' + (i % 8) });
        b.style.setProperty('--a', (i * 36) + 'deg');
        node.append(b);
        setTimeout(function (x) { x.remove(); }.bind(null, b), 900);
      }
    }
    var api = {
      el: el,
      setFact: function (text) { q.textContent = text; bump(q, 'in'); },
      setTyped: function (t) { ans.textContent = t || '?'; ans.className = 'fd-ans' + (t ? '' : ' empty'); },
      setTime: function (left, total) {
        var f = Math.max(0, Math.min(1, left / total));
        ring.querySelector('.fd-ring-run').setAttribute('stroke-dashoffset', String(C * (1 - f)));
        secs.textContent = String(Math.ceil(left));
        ring.classList.toggle('low', left <= 10 && left > 0);
      },
      setScore: function (v) { n = v; scoreN.textContent = String(v); },
      good: function () {
        run++; best = Math.max(best, run);
        bump(card, 'good'); bump(plus, 'fly'); bump(score, 'hit');
        streakN.textContent = String(run); streak.classList.toggle('hot', run >= 3);
        if (MILESTONES[run]) { bump(streak, 'big'); burst(streak); say(MILESTONES[run], run >= 5 ? 'party' : 'cheer', 1800); }
        else if (run % 4 === 0 || (n > 0 && n % 7 === 0)) { var c; do { c = Math.floor(Math.random() * CHEERS.length); } while (c === lastCheer); lastCheer = c; say(CHEERS[c], 'cheer', 1300); }
      },
      bad: function (answer) {
        run = 0; streakN.textContent = '0'; streak.classList.remove('hot');
        ans.textContent = String(answer); ans.className = 'fd-ans fix';
        bump(card, 'bad');
        say('It’s ' + answer + '. Next one!', 'think', 1200);
      },
      say: say,
      best: function () { return best; }
    };
    setTimeout(function () { if (buddy.mood) buddy.mood('idle'); }, 1800);
    return api;
  };
})();
