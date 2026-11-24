// Prompts, the fun version (Kevin, 2026-11-24): each kind of prompt gets its own stage. Writing prompts land on
// a paper card, discussion starters in a big speech bubble, and This or That is a two-sided vote with a tug bar.
// The helper shows on a sticky note. Replaces the page from tools/learn.js (same saved data, tt:prompts).
// Styles: `.pr2-*` in assets/arcade.css.
(function () {
  var TT = window.TT, h = TT.h;
  if (!TT.arcade || !TT.WRITING_PROMPTS) return;
  function any(a) { return a[Math.floor(Math.random() * a.length)]; }
  function svg(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var KINDS = [
    ['write', 'Writing Prompts', 'Writing Prompt', svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.500 6.500l4 4"/>')],
    ['talk', 'Discussion Starters', 'Talk It Over', svg('<path d="M4 5h16v11H9l-5 4z"/>')],
    ['pick', 'This or That', 'This or That', svg('<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>')]
  ];
  var BULB = svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.500 10.900c.600.500 1 1.200 1 2.100h5c0-.900.400-1.600 1-2.100A6 6 0 0 0 12 3z"/>');
  var READY = { write: 'Ready to Write?', talk: 'Ready to Talk It Over?', pick: 'Ready to Choose?' };
  var TIP = { write: 'Think for a minute, then start writing.', talk: 'Turn and talk with a partner!', pick: 'Tap a side for each vote!' };

  TT.mountPrompts = function (el) {
    var state = TT.load('prompts', null) || {};
    if (!state.kind) state.kind = 'write';
    if (!state.subject) state.subject = 'Any';
    state.seen = state.seen || {};
    var cur = null, votes = [0, 0];
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function save() { TT.save('prompts', state); }
    var A = TT.arcade({ theme: 'prompt' });
    var kinds = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Kind of prompt' });
    var subjects = h('div', { class: 'pr-subjects pr2-subjects', role: 'group', 'aria-label': 'Subject' });
    var gradeRow = h('div', { class: 'pr-grade' }, h('span', { class: 'ff-label', text: 'Grade' }), TT.gradePicker(function () { cur = null; paint(); }));
    var tag = h('span', { class: 'pr2-tag' }), text = h('div', { class: 'pr2-text', 'aria-live': 'polite' });
    var card = h('div', { class: 'pr2-card' }, tag, text);
    var duel = h('div', { class: 'pr2-duel', hidden: true });
    var helpText = h('span'), help = h('div', { class: 'pr2-help', hidden: true }, h('span', { class: 'pr2-help-ico', html: BULB }), h('span', null, h('b', { text: 'Helper' }), helpText));
    var nextBtn = TT.button('New Prompt', { icon: 'sparkle', kind: 'primary big pr2-next', onclick: next });
    A.play.append(h('div', { class: 'pr2' }, card, duel, help, h('div', { class: 'row center' }, nextBtn)));
    el.append(h('div', { class: 'pr game ar' }, h('div', { class: 'pr-top' }, kinds, gradeRow), subjects, A.el));

    function pool() {
      var out = [], band = TT.gradeBand(TT.grade());
      if (state.kind === 'pick') TT.THIS_OR_THAT.forEach(function (t) { if (state.subject === 'Any' || t[0] === state.subject) out.push(t[1] + '|' + t[2]); });
      else {
        var src = (state.kind === 'write' ? TT.WRITING_PROMPTS : TT.DISCUSSION_PROMPTS)[band];
        Object.keys(src).forEach(function (s) { if (state.subject === 'Any' || s === state.subject) out = out.concat(src[s]); });
      }
      return out;
    }
    function kind() { return KINDS.filter(function (k) { return k[0] === state.kind; })[0] || KINDS[0]; }
    function paint() {
      var k = kind();
      kinds.textContent = '';
      KINDS.forEach(function (x) { kinds.append(h('button', { type: 'button', class: 'seg' + (state.kind === x[0] ? ' on' : ''), 'aria-pressed': state.kind === x[0], onclick: function () { state.kind = x[0]; cur = null; save(); paint(); } }, x[1])); });
      subjects.textContent = '';
      ['Any'].concat(TT.PROMPT_SUBJECTS).forEach(function (s) {
        subjects.append(h('button', { type: 'button', class: 'chip pr-subject' + (state.subject === s ? ' on' : ''), 'aria-pressed': state.subject === s, onclick: function () { state.subject = s; cur = null; save(); paint(); } }, s === 'Any' ? 'Any Subject' : s));
      });
      gradeRow.hidden = state.kind === 'pick';
      nextBtn.lastChild.textContent = state.kind === 'pick' ? 'New Question' : cur ? 'Next Prompt' : 'New Prompt';
      A.el.setAttribute('data-kind', state.kind);
      tag.innerHTML = k[3]; tag.append(h('span', { text: k[2] }));
      if (!cur) {
        duel.hidden = true; card.hidden = false; help.hidden = true; card.classList.remove('reveal');
        text.textContent = READY[state.kind];
        var n = pool().length;
        A.status.textContent = n + (state.kind === 'pick' ? ' Questions' : ' Prompts') + (state.kind === 'pick' ? '' : ' for ' + TT.GRADE_NAMES[TT.grade()] + ' Grade') + (state.subject === 'Any' ? '' : ' in ' + state.subject);
        A.say('Press the button!', 'wave', 2000);
      }
    }
    function showDuel() {
      var parts = cur.split('|');
      duel.textContent = '';
      var nums = [], bar = h('div', { class: 'pr2-tug', 'aria-hidden': 'true' }, h('i'));
      function tally() {
        var t = votes[0] + votes[1];
        bar.firstChild.style.width = (t ? votes[0] / t * 100 : 50) + '%';
        nums.forEach(function (n, i) { n.textContent = String(votes[i]); });
        duel.setAttribute('data-lead', votes[0] === votes[1] ? '' : votes[0] > votes[1] ? '0' : '1');
      }
      var sides = h('div', { class: 'pr2-sides' });
      parts.forEach(function (t, i) {
        var n = h('b'); nums.push(n);
        var side = h('button', { type: 'button', class: 'pr2-side s' + i, 'aria-label': 'Vote for ' + t, onclick: function () {
          votes[i]++; TT.tick(); tally(); side.classList.remove('bump'); void side.offsetWidth; side.classList.add('bump');
        } }, h('span', { class: 'pr2-side-text', text: t }), h('span', { class: 'pr2-side-count' }, n, h('small', { text: 'Tap to Vote' })));
        sides.append(side);
        if (!i) sides.append(h('span', { class: 'pr2-or', text: 'or' }));
      });
      duel.append(sides, bar,
        h('button', { type: 'button', class: 'linkish pr2-clear', onclick: function () { votes = [0, 0]; tally(); } }, 'Clear the Votes'));
      tally();
    }
    function next() {
      var all = pool(); if (!all.length) return;
      var k = state.kind + ':' + (state.kind === 'pick' ? '' : TT.gradeBand(TT.grade())) + ':' + state.subject;
      var seen = state.seen[k] || [], left = all.filter(function (p) { return seen.indexOf(p) < 0; });
      if (!left.length) { seen = []; left = all.filter(function (p) { return p !== cur; }); if (!left.length) left = all; }
      var pickd = left[Math.floor(Math.random() * left.length)];
      seen.push(pickd); state.seen[k] = seen; save();
      cur = pickd; votes = [0, 0];
      var bits = cur.split(' || ');
      help.hidden = state.kind === 'pick' || !bits[1]; helpText.textContent = bits[1] || '';
      if (!help.hidden) { help.classList.remove('in'); void help.offsetWidth; help.classList.add('in'); }
      if (state.kind === 'pick') { card.hidden = true; duel.hidden = false; showDuel(); duel.classList.remove('in'); void duel.offsetWidth; duel.classList.add('in'); }
      else {
        duel.hidden = true; card.hidden = false; text.textContent = bits[0];
        var len = bits[0].length; text.style.setProperty('--k', len > 150 ? .62 : len > 105 ? .76 : len > 70 ? .88 : 1);
        card.classList.remove('reveal'); void card.offsetWidth; card.classList.add('reveal');
      }
      if (state.kind !== 'pick') text.style.removeProperty('--r');
      nextBtn.lastChild.textContent = state.kind === 'pick' ? 'New Question' : 'Next Prompt';
      A.status.textContent = (seen.length) + ' of ' + all.length;
      TT.tick(); A.say(TIP[state.kind], state.kind === 'write' ? 'think' : 'point', 3200);
    }
    document.addEventListener('keydown', function (e) {
      if (el.offsetParent === null || /INPUT|TEXTAREA|BUTTON|SELECT/.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); next(); }
    });
    paint();
    return { show: function () { paint(); } };
  };
})();
