// Name Picker: picks a student at random, with an option to give everyone a turn before repeats.
(function () {
  var TT = window.TT, h = TT.h;
  var KEY = 'picker';

  TT.mountPicker = function (el, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var state = TT.load(KEY, { picked: [], fair: true });
    var spinning = false, timer = 0;

    // Names roll through a fixed-size window (the same motion as Brain Breaks), so nothing jumps while it picks.
    var item = h('div', { class: 'bb-item' }, 'Ready?');
    var nameEl = h('div', { class: 'pick-name pk-reel', 'aria-live': 'polite' }, item);
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(text) { nameEl.textContent = ''; item = h('div', { class: 'bb-item' }, text); nameEl.append(item); }
    function slide(text, ms, last) {
      var old = item, next = h('div', { class: 'bb-item' }, text);
      if (!last) next.setAttribute('aria-hidden', 'true');
      nameEl.append(next); item = next;
      if (still || !next.animate) { old.remove(); return; }
      old.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-85%)', opacity: 0 }], { duration: ms, easing: last ? 'ease-out' : 'linear', fill: 'forwards' }).onfinish = function () { old.remove(); };
      next.animate([{ transform: 'translateY(85%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: last ? ms * 1.5 : ms, easing: last ? 'cubic-bezier(.2, 1.5, .4, 1)' : 'linear' });
    }
    var subEl = h('div', { class: 'pick-sub' });
    var stage = h('div', { class: 'pick-stage' }, nameEl, subEl);
    var pickBtn = TT.button('Pick a Name', { icon: 'sparkle', kind: 'primary big', onclick: pick });
    var fairBox = h('input', { type: 'checkbox', id: 'fair-' + Math.random().toString(36).slice(2, 7) });
    fairBox.checked = state.fair !== false;
    fairBox.addEventListener('change', function () { state.fair = fairBox.checked; save(); paint(); });
    var picked = h('div', { class: 'chips small' });
    var resetBtn = TT.button('Start Over', { icon: 'reset', kind: 'small', onclick: function () { state.picked = []; save(); show('Ready?'); stage.classList.remove('reveal'); paint(); } });

    var controls = h('div', { class: 'row center' }, pickBtn);
    var extra = compact ? null : h('div', { class: 'pick-extra' },
      h('label', { class: 'check', for: fairBox.id }, fairBox, h('span', { text: 'Give everyone a turn before anyone is picked twice' })),
      h('div', { class: 'picked-head' }, h('h3', { text: 'Already Picked' }), resetBtn),
      picked
    );
    el.append(h('div', { class: 'picker' + (compact ? ' compact' : '') }, stage, controls, extra));

    function save() { TT.save(KEY, state); }
    function pool() {
      var present = TT.roster.present();
      if (!state.fair) return present;
      var left = present.filter(function (n) { return state.picked.indexOf(n) < 0; });
      return left;
    }
    function paint() {
      var present = TT.roster.present();
      state.picked = state.picked.filter(function (n) { return present.indexOf(n) >= 0; });
      var left = pool().length;
      if (state.fair) subEl.textContent = left === 0 ? 'Everyone has had a turn. The next pick starts a new round.' : left + ' of ' + present.length + ' still to go';
      else subEl.textContent = present.length + ' students to choose from';
      if (picked) {
        picked.textContent = '';
        if (!state.picked.length) picked.append(h('span', { class: 'muted', text: 'Nobody yet.' }));
        state.picked.forEach(function (n) { picked.append(h('span', { class: 'chip static', text: n })); });
      }
    }
    function pick() {
      if (spinning) return;
      var present = TT.roster.present();
      if (!present.length) { show('Add your class list first'); item.style.fontSize = '.4em'; return; }
      var choices = pool();
      if (!choices.length) { state.picked = []; choices = present.slice(); }
      var winner = choices[Math.floor(Math.random() * choices.length)];
      spinning = true; pickBtn.disabled = true;
      stage.classList.remove('reveal'); stage.classList.add('spinning');
      // Starts quick and eases down to a stop over about three seconds.
      var steps = still ? 0 : 11, i = 0, lastName = '';
      (function step() {
        if (i >= steps) {
          slide(winner, 520, true); TT.tick();
          stage.classList.remove('spinning'); stage.classList.add('reveal');
          if (state.picked.indexOf(winner) < 0) state.picked.push(winner);
          save(); paint();
          spinning = false; pickBtn.disabled = false;
          return;
        }
        var n, tries = 0;
        do { n = present[Math.floor(Math.random() * present.length)]; } while (n === lastName && present.length > 1 && ++tries < 8);
        lastName = n;
        var ms = 130 + i * i * 3.4;
        slide(n, ms); TT.tick(); i++;
        timer = setTimeout(step, ms);
      })();
    }
    TT.roster.onChange(paint);
    paint();
    return { destroy: function () { clearTimeout(timer); } };
  };
})();
