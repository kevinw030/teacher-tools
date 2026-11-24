// Classroom Board: Dice widget (Kevin, 2026-11-24). Replaces the flat dice from tools/widgets.js.
// Real 3D dice (TT.dice from tools/dice.js, the same ones the Math Races roll) that tumble, bounce and land,
// a rattle-and-clack sound (TT.fx.sound('dice')), and a big total with the sum written out ("4 + 3 = 7").
// 1 to 6 dice, eight dice colors (one is Mixed: every die a different color, handy for telling them apart).
// Saved on the widget as w.data: { n, vals: [..], color }.
(function () {
  var TT = window.TT, h = TT.h;
  if (!TT.boardWidgets) TT.boardWidgets = {};
  var MAX = 6;
  var STAGGER = 70;   // each die leaves the hand a moment after the one before
  var REST = 350;     // the Roll button rests this long after the dice land, so it can't be spammed
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // face: light and dark of the plastic. pip: dot color. one: the single dot on the 1 face.
  var COLORS = [
    { id: 'classic', name: 'White', face: ['#FFFFFF', '#E7EAF3'], pip: '#0E1120', one: '#F0505A' },
    { id: 'ruby', name: 'Red', face: ['#FF6B6B', '#D62F45'], pip: '#FFFFFF' },
    { id: 'orange', name: 'Orange', face: ['#FFA24C', '#EE6A1E'], pip: '#FFFFFF' },
    { id: 'sunny', name: 'Yellow', face: ['#FFE070', '#F4B41A'], pip: '#3A2A00' },
    { id: 'mint', name: 'Green', face: ['#3ED6A0', '#0E9467'], pip: '#FFFFFF' },
    { id: 'ocean', name: 'Blue', face: ['#5B9BFF', '#1F5FD8'], pip: '#FFFFFF' },
    { id: 'grape', name: 'Purple', face: ['#A783FF', '#6B3FE0'], pip: '#FFFFFF' },
    { id: 'midnight', name: 'Black', face: ['#3A4166', '#151A30'], pip: '#FFFFFF', one: '#FFD34D' },
    { id: 'mixed', name: 'Mixed' }
  ];
  var MIXED = ['ruby', 'ocean', 'mint', 'sunny', 'grape', 'orange'];
  function color(id) { return COLORS.filter(function (c) { return c.id === id; })[0] || COLORS[0]; }
  function colorFor(d, i) { return d.color === 'mixed' ? color(MIXED[i % MIXED.length]) : color(d.color); }
  function paintDie(el, c) {
    el.style.setProperty('--dl', c.face[0]);
    el.style.setProperty('--dd', c.face[1]);
    el.style.setProperty('--pip', c.pip);
    el.style.setProperty('--one', c.one || c.pip);
    el.classList.toggle('dw-light-pip', c.pip === '#FFFFFF');
  }
  // A small flat die for the color buttons.
  function swatch(c, i) {
    var s = h('span', { class: 'dw-sw', 'aria-hidden': 'true' });
    if (c.id === 'mixed') { s.classList.add('mixed'); return s; }
    s.style.background = 'linear-gradient(150deg, ' + c.face[0] + ' 30%, ' + c.face[1] + ')';
    s.style.setProperty('--pip', c.pip);
    for (var k = 0; k < 3; k++) s.append(h('i'));
    return s;
  }
  var PALETTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11.5" r="1.1" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="8" r="1.1" fill="currentColor"/></svg>';

  var old = TT.boardWidgets.dice || {};
  TT.boardWidgets.dice = {
    title: 'Dice', color: old.color || '#E5397A', w: 360, h: 330,
    icon: old.icon || '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/>',
    init: function () { return { n: 2, vals: [3, 4], color: 'classic' }; },
    mount: function (body, w, save) {
      var d = w.data;
      d.n = Math.max(1, Math.min(MAX, d.n || 1));
      d.vals = (d.vals || []).slice(0, d.n); while (d.vals.length < d.n) d.vals.push(1 + Math.floor(Math.random() * 6));
      if (!d.color) d.color = 'classic';
      var rolling = false, view = 'dice', dice = [], gone = false;

      var area = h('button', { type: 'button', class: 'dw-area', 'aria-label': 'Roll the dice', onclick: roll });
      var sum = h('span', { class: 'dw-sum' }), big = h('b', { class: 'dw-big' }), label = h('span', { class: 'dw-label' });
      var result = h('div', { class: 'dw-result', 'aria-live': 'polite' }, label, sum, big);
      var less = h('button', { type: 'button', class: 'wb round', 'aria-label': 'One less die', text: '−', onclick: function () { setN(d.n - 1); } });
      var more = h('button', { type: 'button', class: 'wb round', 'aria-label': 'One more die', text: '+', onclick: function () { setN(d.n + 1); } });
      var rollBtn = h('button', { type: 'button', class: 'wb primary dw-roll', onclick: roll }, 'Roll');
      var colorBtn = h('button', { type: 'button', class: 'wb round dw-colorbtn', title: 'Dice Color', 'aria-label': 'Dice color', onclick: function () { view = view === 'colors' ? 'dice' : 'colors'; paintView(); } });
      var controls = h('div', { class: 'wx-row dw-controls' }, less, rollBtn, more, colorBtn);
      var panel = h('div', { class: 'dw-colors', hidden: true });
      var root = h('div', { class: 'wx dw' }, area, result, panel, controls);
      body.append(root);

      function build() {
        area.textContent = ''; dice = [];
        for (var i = 0; i < d.n; i++) {
          var die = TT.dice({ quiet: true });
          paintDie(die.el, colorFor(d, i));
          die.show(d.vals[i]);
          var cell = h('span', { class: 'dw-cell' }, die.el);
          area.append(cell); dice.push(die);
        }
        less.disabled = d.n <= 1; more.disabled = d.n >= MAX;
        colorBtn.textContent = ''; colorBtn.append(swatch(color(d.color)));
        layout(); total(false);
      }
      function total(pop) {
        var t = 0; d.vals.forEach(function (v) { t += v; });
        label.textContent = d.n > 1 ? 'Total' : 'You Rolled';
        sum.textContent = d.n > 1 ? d.vals.join(' + ') + ' =' : '';
        sum.hidden = d.n < 2;
        big.textContent = t;
        result.classList.remove('waiting');
        if (pop && big.animate && !calm) big.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.18)', opacity: 1, offset: 0.55 }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.2,1.3,.4,1)' });
      }
      // Pick the number of columns that makes the dice biggest in the space the widget has.
      function layout() {
        var W = area.clientWidth, H = area.clientHeight;
        if (!W || !H) return;
        var best = 0, cols = d.n;
        for (var c = 1; c <= d.n; c++) {
          var r = Math.ceil(d.n / c);
          // A die needs about 1.8x its size in height (hop room above, shadow below) and 1.55x in width (the tilt shows a side).
          var s = Math.min(W / (c * 1.55), H / (r * 1.8));
          if (s > best + 0.5) { best = s; cols = c; }
        }
        best = Math.max(28, Math.min(best, 200));
        area.style.setProperty('--ds', Math.floor(best) + 'px');
        area.style.setProperty('--cols', cols);
      }
      function roll() {
        if (rolling || view !== 'dice' || !dice.length) return;
        rolling = true; root.classList.add('rolling'); rollBtn.disabled = true;
        result.classList.add('waiting');
        if (TT.fx) TT.fx.sound('dice'); else if (TT.tick) TT.tick();
        var left = d.n;
        dice.forEach(function (die, i) {
          var v = 1 + Math.floor(Math.random() * 6);
          d.vals[i] = v;
          setTimeout(function () {
            if (gone) return;
            die.roll(v, function () {
              if (--left > 0 || gone) return;
              total(true); save();
              setTimeout(function () { rolling = false; root.classList.remove('rolling'); rollBtn.disabled = false; }, REST);
            });
          }, i * STAGGER);
        });
      }
      function setN(n) {
        if (rolling) return;
        n = Math.max(1, Math.min(MAX, n)); if (n === d.n) return;
        d.n = n; while (d.vals.length < d.n) d.vals.push(1 + Math.floor(Math.random() * 6)); d.vals.length = d.n;
        build(); save();
        if (TT.fx) TT.fx.sound('pop');
      }
      function paintColors() {
        panel.textContent = '';
        var grid = h('div', { class: 'dw-colors-grid', role: 'group', 'aria-label': 'Dice color' });
        COLORS.forEach(function (c) {
          grid.append(h('button', { type: 'button', class: 'dw-pick' + (d.color === c.id ? ' on' : ''), 'aria-pressed': d.color === c.id ? 'true' : 'false',
            onclick: function () { d.color = c.id; save(); build(); view = 'dice'; paintView(); } }, swatch(c), h('small', { text: c.name })));
        });
        panel.append(grid);
      }
      function paintView() {
        var col = view === 'colors';
        if (col) paintColors();
        panel.hidden = !col; area.hidden = col; result.hidden = col;
        less.hidden = more.hidden = rollBtn.hidden = col;
        colorBtn.classList.toggle('on', col);
        colorBtn.setAttribute('aria-expanded', col ? 'true' : 'false');
        if (col) { colorBtn.textContent = 'Done'; colorBtn.classList.add('dw-done'); }
        else { colorBtn.classList.remove('dw-done'); colorBtn.textContent = ''; colorBtn.append(swatch(color(d.color))); requestAnimationFrame(layout); }
      }

      var ro = window.ResizeObserver ? new ResizeObserver(function () { if (!document.contains(root)) { gone = true; ro.disconnect(); return; } layout(); }) : null;
      if (ro) ro.observe(area); else window.addEventListener('resize', layout);
      build();
      requestAnimationFrame(layout);
      return { destroy: function () { gone = true; if (ro) ro.disconnect(); } };
    }
  };
  TT.diceColors = COLORS;
})();
