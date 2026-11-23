// Classroom Board: a color palette ("look") for each widget.
// A look sets the widget's colors through CSS variables, so every widget's own parts
// (buttons, rings, labels) follow along. Text color is picked for contrast automatically.
// Saved on the widget as w.look: a preset id like 'mint', or a hex color from My Colors.
(function () {
  var TT = window.TT, h = TT.h;

  // bg: card color. ink: text (picked for contrast when left out). accent: rings, highlights.
  var LOOKS = [
    { id: 'classic', name: 'Classic' },
    { id: 'glass', name: 'Frosted Glass', bg: 'rgba(255,255,255,.42)', ink: '#0E1120', accent: '#0E8F63', glass: true },
    { id: 'midnight', name: 'Midnight', bg: '#161B33', accent: '#5EEAD4' },
    { id: 'chalk', name: 'Chalkboard', bg: '#2E4A3B', ink: '#F5F1E3', accent: '#FDE68A' },
    { id: 'coral', name: 'Coral', bg: '#F2643D', ink: '#FFFFFF', accent: '#FFF3B0' },
    { id: 'sunshine', name: 'Sunshine', bg: '#FFC93C', ink: '#2B1D00', accent: '#C2410C' },
    { id: 'mint', name: 'Mint', bg: '#10B981', ink: '#FFFFFF', accent: '#FFFFFF' },
    { id: 'sky', name: 'Sky', bg: '#2F80ED', ink: '#FFFFFF', accent: '#FFE066' },
    { id: 'grape', name: 'Grape', bg: '#7B4DEB', ink: '#FFFFFF', accent: '#FFD6F5' },
    { id: 'bubblegum', name: 'Bubblegum', bg: '#E5397A', ink: '#FFFFFF', accent: '#FFF0A8' },
    { id: 'ocean', name: 'Ocean', bg: '#0E7490', ink: '#FFFFFF', accent: '#A7F3D0' },
    { id: 'peach', name: 'Peach', bg: '#FFE2D3', ink: '#3A1A0C', accent: '#E4572E' },
    { id: 'lemon', name: 'Lemon', bg: '#FFF5C2', ink: '#2E2500', accent: '#D97706' },
    { id: 'pistachio', name: 'Pistachio', bg: '#DDF5E5', ink: '#0F2E1E', accent: '#059669' },
    { id: 'cloud', name: 'Cloud', bg: '#DCEBFF', ink: '#0E1F3D', accent: '#2563EB' },
    { id: 'lavender', name: 'Lavender', bg: '#ECE4FF', ink: '#24144D', accent: '#7C3AED' }
  ];
  var VARS = ['--bg', '--surface', '--surface-2', '--ink', '--muted', '--line', '--emerald', '--cobalt', '--w-accent'];

  function lum(hex) {
    var n = parseInt(hex.slice(1), 16);
    return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  }
  function find(id) {
    if (typeof id === 'string' && /^#[0-9A-F]{6}$/i.test(id)) return { id: id, name: 'My Color', bg: id };
    return LOOKS.filter(function (l) { return l.id === id; })[0] || null;
  }
  // Fill in everything a look leaves out, so any color makes a readable widget.
  function colors(l) {
    var ink = l.ink || (lum(l.bg) < 150 ? '#FFFFFF' : '#0E1120');
    var light = lum(ink) > 150; // light text on a dark card
    return {
      '--bg': l.glass ? '#FFFFFF' : l.bg,
      '--surface': l.bg,
      '--surface-2': light ? 'rgba(255,255,255,.16)' : l.glass ? 'rgba(255,255,255,.55)' : 'rgba(14,17,32,.07)',
      '--ink': ink,
      '--muted': light ? 'rgba(255,255,255,.74)' : 'color-mix(in srgb, ' + ink + ' 66%, transparent)',
      '--line': light ? 'rgba(255,255,255,.24)' : 'color-mix(in srgb, ' + ink + ' 16%, transparent)',
      '--emerald': l.accent || ink, '--cobalt': l.accent || ink, '--w-accent': l.accent || ink
    };
  }

  // Paint one widget node with its saved look.
  TT.applyLook = function (node, w) {
    var l = find(w.look);
    VARS.forEach(function (v) { node.style.removeProperty(v); });
    node.removeAttribute('data-look');
    node.classList.remove('look-glass', 'look-light-ink');
    if (!l || l.id === 'classic') return;
    var c = colors(l);
    Object.keys(c).forEach(function (k) { node.style.setProperty(k, c[k]); });
    node.setAttribute('data-look', l.id);
    node.classList.toggle('look-glass', !!l.glass);
    node.classList.toggle('look-light-ink', lum(c['--ink']) > 150);
  };

  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11.5" r="1.1" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="8" r="1.1" fill="currentColor"/></svg>';

  // One shared pop-up, placed next to whichever widget's Colors button was pressed.
  var pop = null, popFor = null;
  function closePop() {
    if (!pop) return;
    pop.remove(); pop = null;
    if (popFor) { popFor.btn.setAttribute('aria-expanded', 'false'); popFor = null; }
    document.removeEventListener('pointerdown', outside, true);
    document.removeEventListener('keydown', onKey, true);
  }
  function outside(e) { if (pop && !pop.contains(e.target) && !(popFor && popFor.btn.contains(e.target))) closePop(); }
  function onKey(e) { if (e.key === 'Escape') { var b = popFor && popFor.btn; closePop(); if (b) b.focus(); } }

  function tile(l, on, pick) {
    var c = l.id === 'classic' ? null : colors(l);
    var t = h('button', { type: 'button', class: 'look-tile' + (on ? ' on' : '') + (l.glass ? ' glass-tile' : '') + (l.id === 'classic' ? ' classic-tile' : ''),
      title: l.name, 'aria-label': l.name, 'aria-pressed': on ? 'true' : 'false', onclick: function () { pick(l.id); } },
      h('span', { class: 'look-chip', style: c ? 'background:' + c['--surface'] + ';color:' + c['--ink'] : '' },
        h('b', { text: 'Aa' }), h('i', { style: c ? 'background:' + c['--w-accent'] : '' })),
      h('small', { text: l.name }));
    return t;
  }

  function openPop(opts) {
    var w = opts.widget, current = w.look || 'classic';
    function pick(id) { opts.set(id === 'classic' ? null : id); current = id; paint(); }
    var grid = h('div', { class: 'look-grid' });
    var mineRow = h('div', { class: 'look-mine' });
    var custom = h('input', { type: 'color', class: 'pal-input', 'aria-label': 'Add a color', title: 'Add a Color', value: '#7CC8FF' });
    custom.addEventListener('change', function () {
      var mine = TT.load('board-colors', []) || [], v = custom.value.toUpperCase();
      if (mine.indexOf(v) < 0) { mine.unshift(v); TT.save('board-colors', mine.slice(0, 9)); }
      pick(v);
    });
    var allBtn = h('button', { type: 'button', class: 'look-all', onclick: function () {
      opts.setAll(current === 'classic' ? null : current);
      allBtn.textContent = 'Done! All Widgets Match';
      setTimeout(function () { if (allBtn.isConnected) allBtn.textContent = 'Use on All Widgets'; }, 1600);
    } }, 'Use on All Widgets');
    function paint() {
      grid.textContent = '';
      LOOKS.forEach(function (l) { grid.append(tile(l, l.id === current, pick)); });
      mineRow.textContent = '';
      (TT.load('board-colors', []) || []).forEach(function (c) {
        if (!/^#[0-9A-F]{6}$/i.test(c)) return;
        var on = current.toUpperCase && current.toUpperCase() === c.toUpperCase();
        mineRow.append(h('button', { type: 'button', class: 'look-dot' + (on ? ' on' : ''), style: 'background:' + c, title: c, 'aria-label': 'My color ' + c, 'aria-pressed': on ? 'true' : 'false', onclick: function () { pick(c.toUpperCase()); } }));
      });
      mineRow.append(h('label', { class: 'pal-add', title: 'Add a Color' }, h('span', { 'aria-hidden': 'true', text: '+' }), custom));
    }
    paint();
    pop = h('div', { class: 'look-pop', role: 'dialog', 'aria-label': 'Widget colors' },
      h('div', { class: 'look-head' }, h('b', { text: 'Widget Colors' }), h('span', { text: opts.title })),
      grid,
      h('div', { class: 'look-sec' }, h('span', { class: 'look-label', text: 'My Colors' }), mineRow),
      allBtn);
    document.body.append(pop);
    // Place it beside the button, kept on screen.
    var r = opts.btn.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    var x = Math.min(window.innerWidth - pw - 12, Math.max(12, r.right - pw));
    var y = r.bottom + 8;
    if (y + ph > window.innerHeight - 12) y = Math.max(12, r.top - ph - 8);
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
    pop.style.transformOrigin = (r.left + r.width / 2 - x) + 'px ' + (y > r.top ? '0' : '100%');
    popFor = opts; opts.btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', onKey, true);
    var first = pop.querySelector('.look-tile.on') || pop.querySelector('.look-tile');
    if (first) first.focus({ preventScroll: true });
  }

  // The Colors button for a widget's top bar.
  // opts: { widget, title, set(lookOrNull), setAll(lookOrNull) }
  TT.lookButton = function (opts) {
    var btn = h('button', { type: 'button', class: 'w-close w-look', title: 'Colors', 'aria-label': 'Colors for this ' + opts.title.toLowerCase(), 'aria-haspopup': 'dialog', 'aria-expanded': 'false', html: ICON });
    opts.btn = btn;
    btn.addEventListener('click', function () {
      var again = popFor && popFor.btn === btn;
      closePop();
      if (!again) openPop(opts);
    });
    return btn;
  };
  TT.closeLookPop = closePop;
  TT.BOARD_LOOKS = LOOKS;
})();
