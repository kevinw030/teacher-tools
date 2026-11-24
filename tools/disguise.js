// Mascot disguises (Kevin, 2026-11-24). A disguise is a costume drawn over Kevin's mascot artwork for part
// of the year. It shows on every mascot on the site, then comes off by itself when its dates are over.
// To add one: call TT.disguise.add({ id, from: [month, day], to: [month, day], parts: [...] }), ideally from
// its own file loaded right after this one (see tools/disguise-elf.js).
// Each part is { layer: 'back' | 'front', svg, at, origin }. Drawings use the mascot's own 420 x 576 box.
// `at` places the part in each pose: { pose: [dx, dy, scale, degrees] }. A pose left out of `at` hides the
// part (so most parts are hidden in the "work" pose, the back view). `origin` is the scale/turn point (px).
(function () {
  var TT = window.TT; if (!TT || !TT.mascot) return;
  var OUT = '#3B1A6E';
  function fan(cx, cy) {
    var cols = ['#8B4A2B', '#E4572E', '#F2A53A', '#FFD15C', '#F2A53A', '#E4572E', '#8B4A2B'], s = '';
    cols.forEach(function (c, i) {
      var a = -66 + i * 22;
      s += '<g transform="rotate(' + a + ' ' + cx + ' ' + cy + ')"><ellipse cx="' + cx + '" cy="' + (cy - 190) + '" rx="46" ry="118" fill="' + c + '" stroke="' + OUT + '" stroke-width="7"/>' +
        '<ellipse cx="' + cx + '" cy="' + (cy - 250) + '" rx="24" ry="38" fill="#FFF3D6" opacity=".55"/><path d="M' + cx + ' ' + (cy - 95) + 'V' + (cy - 285) + '" stroke="' + OUT + '" stroke-width="4" stroke-linecap="round" opacity=".35"/></g>';
    });
    return s;
  }
  function beak(x, y) {
    return '<path d="M' + (x - 118) + ' ' + (y - 22) + 'Q' + x + ' ' + (y - 2) + ' ' + (x + 118) + ' ' + (y - 22) + '" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 9"/>' +
      '<path d="M' + (x + 6) + ' ' + (y + 22) + 'c26 6 30 40 12 56c-16 12-34-4-28-24c4-12 4-22 2-32z" fill="#E5394B" stroke="' + OUT + '" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M' + (x - 40) + ' ' + (y - 18) + 'Q' + x + ' ' + (y - 34) + ' ' + (x + 40) + ' ' + (y - 18) + 'Q' + (x + 22) + ' ' + (y + 30) + ' ' + x + ' ' + (y + 46) + 'Q' + (x - 22) + ' ' + (y + 30) + ' ' + (x - 40) + ' ' + (y - 18) + 'z" fill="#FFA62B" stroke="' + OUT + '" stroke-width="7" stroke-linejoin="round"/>' +
      '<path d="M' + (x - 22) + ' ' + (y - 12) + 'Q' + x + ' ' + (y - 22) + ' ' + (x + 20) + ' ' + (y - 12) + '" fill="none" stroke="#FFD98A" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="' + (x - 7) + '" cy="' + (y + 2) + '" r="3" fill="' + OUT + '"/><circle cx="' + (x + 7) + '" cy="' + (y + 2) + '" r="3" fill="' + OUT + '"/>';
  }
  var ALL = { stand: [0, 0], wave: [0, 0], point: [0, 0], cheer: [0, 0], think: [0, 0] };
  var DISGUISES = [];

  var st = document.createElement('style');
  st.textContent = '.mascot-dis { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; display: none; }' +
    '.mascot-dis.front { transition: translate .12s ease; }' +
    '.mascot-dis.dis-fan { transform-origin: 50% 65%; animation: mas-dis-fan 3s ease-in-out infinite; }' +
    '@keyframes mas-dis-fan { 50% { transform: scale(1.03); } }' +
    '@media (prefers-reduced-motion: reduce) { .mascot-dis, .mascot-dis * { animation: none !important; transition: none !important; } }';
  document.head.appendChild(st);

  function add(g) {
    var css = '';
    g.parts.forEach(function (p, i) {
      var o = p.origin || [210, 288];
      Object.keys(p.at).forEach(function (pose) {
        var a = p.at[pose];
        css += '.mascot[data-dis="' + g.id + '"][data-pose="' + pose + '"] .mascot-dis.dp' + i + ' { display: block; translate: ' + (a[0] / 4.2).toFixed(2) + '% ' + (a[1] / 5.76).toFixed(2) + '%;' +
          (a[2] || a[3] ? ' transform-origin: ' + (o[0] / 4.2).toFixed(2) + '% ' + (o[1] / 5.76).toFixed(2) + '%; scale: ' + (a[2] || 1) + '; rotate: ' + (a[3] || 0) + 'deg;' : '') + ' }';
      });
    });
    st.textContent += css + (g.css || '');
    DISGUISES.push(g);
  }
  function today() {
    var d = new Date(), key = (d.getMonth() + 1) * 100 + d.getDate();
    if (TT.disguise.test) return DISGUISES.filter(function (g) { return g.id === TT.disguise.test; })[0] || null;
    return DISGUISES.filter(function (g) { return key >= g.from[0] * 100 + g.from[1] && key <= g.to[0] * 100 + g.to[1]; })[0] || null;
  }
  TT.disguise = today;
  TT.disguise.add = add;
  TT.disguise.ALL = ALL;
  TT.disguise.OUT = OUT;

  // Turkey: tail feathers behind, a strap-on beak and wattle in front. All of November.
  add({ id: 'turkey', from: [11, 1], to: [11, 30], parts: [
    { layer: 'back', cls: 'dis-fan', svg: fan(210, 374), at: ALL },
    { layer: 'front', svg: beak(210, 302), at: { stand: [0, 0], wave: [-18, 4], point: [-3, -2], cheer: [2, -2], think: [2, -22] } }
  ] });

  var make = TT.mascot;
  TT.mascot = function (opts) {
    var el = make(opts), g = today();
    if (!g) return el;
    var body = el.querySelector('.mascot-body'); if (!body) return el;
    el.setAttribute('data-dis', g.id);
    g.parts.forEach(function (p, i) {
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('class', 'mascot-dis ' + p.layer + ' dp' + i + (p.cls ? ' ' + p.cls : ''));
      s.setAttribute('viewBox', '0 0 420 576'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = p.svg;
      if (p.layer === 'back') body.insertBefore(s, body.firstChild); else body.appendChild(s);
    });
    return el;
  };
})();
