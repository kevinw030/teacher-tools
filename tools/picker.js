// Name Picker: picks a student at random, with an option to give everyone a turn before repeats.
(function () {
  var TT = window.TT, h = TT.h;
  var KEY = 'picker';

  TT.mountPicker = function (el, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var state = TT.load(KEY, { picked: [], fair: true });
    var spinning = false, timer = 0;

    var nameEl = h('div', { class: 'pick-name', 'aria-live': 'polite' }, 'Ready?');
    var subEl = h('div', { class: 'pick-sub' });
    var stage = h('div', { class: 'pick-stage' }, nameEl, subEl);
    var pickBtn = TT.button('Pick a name', { icon: 'sparkle', kind: 'primary big', onclick: pick });
    var fairBox = h('input', { type: 'checkbox', id: 'fair-' + Math.random().toString(36).slice(2, 7) });
    fairBox.checked = state.fair !== false;
    fairBox.addEventListener('change', function () { state.fair = fairBox.checked; save(); paint(); });
    var picked = h('div', { class: 'chips small' });
    var resetBtn = TT.button('Start over', { icon: 'reset', kind: 'small', onclick: function () { state.picked = []; save(); nameEl.textContent = 'Ready?'; paint(); } });

    var controls = h('div', { class: 'row center' }, pickBtn);
    var extra = compact ? null : h('div', { class: 'pick-extra' },
      h('label', { class: 'check', for: fairBox.id }, fairBox, h('span', { text: 'Give everyone a turn before anyone is picked twice' })),
      h('div', { class: 'picked-head' }, h('h3', { text: 'Already picked' }), resetBtn),
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
      if (!present.length) { nameEl.textContent = 'Add your class list first'; return; }
      var choices = pool();
      if (!choices.length) { state.picked = []; choices = present.slice(); }
      var winner = choices[Math.floor(Math.random() * choices.length)];
      spinning = true; pickBtn.disabled = true;
      stage.classList.remove('reveal'); stage.classList.add('spinning');
      var steps = 18, i = 0;
      (function step() {
        nameEl.textContent = present[Math.floor(Math.random() * present.length)];
        TT.tick();
        i++;
        if (i < steps) { timer = setTimeout(step, 30 + i * i * 0.5); return; }
        nameEl.textContent = winner;
        stage.classList.remove('spinning'); void stage.offsetWidth; stage.classList.add('reveal');
        if (state.picked.indexOf(winner) < 0) state.picked.push(winner);
        save(); paint();
        spinning = false; pickBtn.disabled = false;
      })();
    }
    TT.roster.onChange(paint);
    paint();
    return { destroy: function () { clearTimeout(timer); } };
  };
})();
