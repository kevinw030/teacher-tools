// Name Picker, the fun version (Kevin, 2026-11-24): a bright stage with a big name card, a cloud of name
// bubbles that a spotlight hops across while it picks, the mascot calling out the winner, and confetti.
// Replaces the full-page picker from tools/picker.js. The small board widget still uses the old one.
// Same saved data (tt:picker). Styles: `.pk2-*` in assets/arcade.css.
(function () {
  var TT = window.TT, h = TT.h, old = TT.mountPicker;
  if (!TT.arcade) return;
  var TINTS = ['#2F6BFF', '#FF6B4A', '#12B886', '#F7A400', '#8B5CF6', '#F43F7F', '#0EA5E9', '#7C6FF0'];
  function any(a) { return a[Math.floor(Math.random() * a.length)]; }

  TT.mountPicker = function (el, opts) {
    if (opts && opts.compact) return old(el, opts);
    var state = TT.load('picker', { picked: [], fair: true }) || { picked: [], fair: true };
    if (!Array.isArray(state.picked)) state.picked = [];
    var spinning = false, timer = 0, winner = '';
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var A = TT.arcade({ theme: 'pick' });
    var nameEl = h('div', { class: 'pk2-name', 'aria-live': 'polite' });
    var card = h('div', { class: 'pk2-card' }, h('span', { class: 'pk2-rays', 'aria-hidden': 'true' }), h('span', { class: 'pk2-tag', text: 'Who Will It Be?' }), nameEl);
    var cloud = h('div', { class: 'pk2-cloud' });
    var pickBtn = TT.button('Pick a Name', { icon: 'sparkle', kind: 'primary big pk2-go', onclick: pick });
    var fairBtn = h('button', { type: 'button', class: 'pk2-fair', onclick: function () { state.fair = !fairOn(); save(); paint(); } }, h('i', { 'aria-hidden': 'true' }), h('span', { text: 'Everyone Gets a Turn' }));
    var resetBtn = TT.button('Start Over', { icon: 'reset', kind: 'small', onclick: function () { state.picked = []; winner = ''; save(); setName('Ready?'); card.classList.remove('reveal'); paint(); A.say('A fresh start!', 'wave', 1800); } });
    var bar = h('div', { class: 'pk2-bar', 'aria-hidden': 'true' }, h('i'));
    A.play.append(h('div', { class: 'pk2' }, card, h('div', { class: 'row center pk2-btns' }, pickBtn), bar, cloud));
    el.append(h('div', { class: 'game ar pk2-wrap' }, A.el, h('div', { class: 'row center ar-controls' }, fairBtn, resetBtn)));

    function fairOn() { return state.fair !== false; }
    function save() { TT.save('picker', state); }
    function setName(text) {
      nameEl.textContent = text;
      var n = String(text).length;
      nameEl.style.setProperty('--k', n > 16 ? .3 : n > 11 ? .44 : n > 8 ? .6 : n > 6 ? .78 : n > 5 ? .92 : 1);
    }
    function pool() {
      var present = TT.roster.present();
      return fairOn() ? present.filter(function (n) { return state.picked.indexOf(n) < 0; }) : present;
    }
    function chipOf(name) { return Array.prototype.filter.call(cloud.children, function (c) { return c.getAttribute('data-n') === name; })[0]; }
    function paint() {
      var present = TT.roster.present();
      state.picked = state.picked.filter(function (n) { return present.indexOf(n) >= 0; });
      var left = pool().length, fair = fairOn();
      fairBtn.classList.toggle('on', fair); fairBtn.setAttribute('aria-pressed', fair ? 'true' : 'false');
      fairBtn.title = fair ? 'Nobody is picked twice until everyone has had a turn. Click to turn off.' : 'Anyone can be picked any time. Click to give everyone a turn first.';
      resetBtn.hidden = !state.picked.length;
      bar.hidden = !fair || !present.length;
      bar.firstChild.style.width = (present.length ? (present.length - left) / present.length * 100 : 0) + '%';
      A.status.textContent = !present.length ? 'Add Your Class List to Start' : !fair ? present.length + ' Students to Choose From' :
        left === 0 ? 'Everyone Has Had a Turn!' : left + ' of ' + present.length + ' Still to Go';
      cloud.textContent = '';
      present.forEach(function (n, i) {
        var done = fair && state.picked.indexOf(n) >= 0;
        var c = h('span', { class: 'pk2-chip' + (done ? ' done' : '') + (n === winner ? ' win' : ''), 'data-n': n, text: n });
        c.style.setProperty('--c', TINTS[i % TINTS.length]);
        cloud.append(c);
      });
      pickBtn.disabled = spinning || !present.length;
    }
    function pick() {
      if (spinning) return;
      var present = TT.roster.present();
      if (!present.length) return;
      var choices = pool();
      if (!choices.length) { state.picked = []; choices = present.slice(); winner = ''; paint(); }
      var chosen = choices[Math.floor(Math.random() * choices.length)];
      spinning = true; pickBtn.disabled = true; winner = '';
      card.classList.remove('reveal'); card.classList.add('spinning');
      Array.prototype.forEach.call(cloud.children, function (c) { c.classList.remove('win'); });
      A.say(any(['Drumroll, please…', 'Who will it be?', 'Round and round…']), 'think', 4000);
      // The spotlight hops from bubble to bubble, quick at first and slowing to a stop over about three seconds.
      var steps = still ? 0 : Math.min(14, Math.max(6, choices.length + 4)), i = 0, last = '';
      (function step() {
        Array.prototype.forEach.call(cloud.children, function (c) { c.classList.remove('hop'); });
        if (i >= steps) return land(chosen);
        var n, tries = 0;
        do { n = choices[Math.floor(Math.random() * choices.length)]; } while (n === last && choices.length > 1 && ++tries < 8);
        if (i === steps - 1 && choices.length > 1 && n === chosen) n = choices[(choices.indexOf(chosen) + 1) % choices.length];
        last = n; setName(n); TT.tick();
        var c = chipOf(n); if (c) c.classList.add('hop');
        i++; timer = setTimeout(step, 110 + i * i * 2.6);
      })();
    }
    function land(name) {
      winner = name; setName(name);
      card.classList.remove('spinning'); void card.offsetWidth; card.classList.add('reveal');
      if (state.picked.indexOf(name) < 0) state.picked.push(name);
      save(); spinning = false; paint();
      A.say(any(['It’s ' + name + '!', name + ', you’re up!', 'Go, ' + name + '!']), 'party', 3200);
      TT.chime(); if (TT.celebrate && !still) TT.celebrate(A.el);
    }
    setName('Ready?');
    TT.roster.onChange(paint);
    paint();
    A.say(TT.roster.present().length ? 'Press the button!' : 'Add your class on the right.', 'wave', 2200);
    return { destroy: function () { clearTimeout(timer); } };
  };
})();
