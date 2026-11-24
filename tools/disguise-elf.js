// Holiday Helper (Kevin, 2026-11-24): a red elf hat over his antenna, with his gold antenna ball as the
// hat's big jingle bell, and a few wrapped gifts on the floor around him. All of December, taking over
// from the November turkey.
// NOT LIVE YET: waiting for Kevin's OK. To turn it on, add <script src="/tools/disguise-elf.js"> after
// disguise.js in index.html and join.html, then run node scripts/make-pages.js.
// Drawn to match Kevin's mascot artwork: flat colors, one simple shade, and the same thick dark-purple
// outline (#44037B, about 10px). The hat follows each pose's own antenna, so it is drawn once per pose
// from where his head and antenna ball are in that picture (POSES below, measured from the artwork).
(function () {
  var TT = window.TT; if (!TT || !TT.disguise || !TT.disguise.add) return;
  var O = '#44037B', W = 10;
  function st(w) { return ' stroke="' + O + '" stroke-width="' + (w || W) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function P(x, y) { return Math.round(x) + ' ' + Math.round(y); }

  // Per pose: head middle (cx), how far the hat sits up or down (dy), and his antenna ball (bx, by, radius).
  var POSES = {
    stand: { cx: 207, dy: 0, bx: 291, by: 63, br: 44 },
    wave: { cx: 184, dy: 2, bx: 273, by: 61, br: 44 },
    point: { cx: 193, dy: -12, bx: 283, by: 65, br: 45 },
    cheer: { cx: 195, dy: -17, bx: 283, by: 65, br: 43 },
    think: { cx: 191, dy: -26, bx: 279, by: 56, br: 43 }
  };

  function hat(g) {
    var cx = g.cx, y = 184 + g.dy, bx = g.bx, by = g.by;
    // One shape: wide over his head, then a cone that curves up and over to the right, along his antenna,
    // and ends at the ball. Top edge first, then back down the underside.
    var shape = 'M' + P(cx - 90, y) +
      ' C' + P(cx - 92, y - 62) + ' ' + P(cx - 56, y - 122) + ' ' + P(bx - 82, by - 18) +
      ' C' + P(bx - 62, by - 26) + ' ' + P(bx - 44, by - 26) + ' ' + P(bx - 28, by - 20) +
      ' L' + P(bx - 30, by + 26) +
      ' C' + P(bx - 44, by + 32) + ' ' + P(bx - 54, by + 40) + ' ' + P(bx - 58, by + 48) +
      ' C' + P(cx + 66, y - 60) + ' ' + P(cx + 96, y - 34) + ' ' + P(cx + 96, y) + ' Z';
    var shade = 'M' + P(bx - 30, by + 26) +
      ' C' + P(bx - 44, by + 32) + ' ' + P(bx - 54, by + 40) + ' ' + P(bx - 58, by + 48) +
      ' C' + P(cx + 66, y - 60) + ' ' + P(cx + 96, y - 34) + ' ' + P(cx + 96, y) +
      ' L' + P(cx + 52, y) + ' C' + P(cx + 54, y - 44) + ' ' + P(bx - 74, by + 22) + ' ' + P(bx - 34, by + 4) + ' Z';
    var cuff = 'M' + P(cx - 104, y + 12) + ' Q' + P(cx + 1, y - 50) + ' ' + P(cx + 106, y + 12);
    var shine = 'M' + P(cx - 88, y - 8) + ' Q' + P(cx + 1, y - 60) + ' ' + P(cx + 90, y - 8);
    var r = g.br - 2;
    var bell = '<g class="elf-bell">' +
      '<circle cx="' + bx + '" cy="' + by + '" r="' + r + '" fill="#FBB900"' + st(11) + '/>' +
      '<path d="M' + P(bx - r + 8, by + 6) + ' Q' + P(bx, by + 14) + ' ' + P(bx + r - 8, by + 6) + '" fill="none" stroke="#E09A00" stroke-width="9" stroke-linecap="round"/>' +
      '<g class="elf-slit"><path d="M' + P(bx - 17, by + 14) + ' h34" stroke="' + O + '" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="' + bx + '" cy="' + (by + 25) + '" r="6" fill="' + O + '"/></g>' +
      '<path d="M' + P(bx - 22, by - 12) + ' a24 24 0 0 1 ' + '18 -14" fill="none" stroke="#FFE07A" stroke-width="8" stroke-linecap="round"/>' +
      '</g>';
    return '<g class="elf-hat">' +
      '<path d="' + shape + '" fill="#E8343F"/>' +
      '<path d="' + shade + '" fill="#C4212F"/>' +
      '<path d="' + shape + '" fill="none"' + st() + '/>' +
      '<path d="' + cuff + '" fill="none" stroke="' + O + '" stroke-width="52" stroke-linecap="round"/>' +
      '<path d="' + cuff + '" fill="none" stroke="#25B46A" stroke-width="32" stroke-linecap="round"/>' +
      '<path d="' + shine + '" fill="none" stroke="#4ED38A" stroke-width="7" stroke-linecap="round"/>' +
      bell + '</g>';
  }

  // A wrapped gift standing on the floor: bottom middle at (x, y), w x h box, box / lid / ribbon colors.
  function gift(x, y, w, h, box, lid, rib, side) {
    var l = x - w / 2, lh = Math.round(h * 0.3), b = Math.min(18, w * 0.2);
    return '<g>' +
      '<rect x="' + (l + 6) + '" y="' + (y - h + lh - 4) + '" width="' + (w - 12) + '" height="' + (h - lh + 4) + '" rx="7" fill="' + box + '"' + st() + '/>' +
      '<rect x="' + (l + w - 12 - w * 0.22) + '" y="' + (y - h + lh + 4) + '" width="' + Math.round(w * 0.2) + '" height="' + (h - lh - 10) + '" rx="4" fill="' + side + '"/>' +
      '<rect x="' + (x - b / 2) + '" y="' + (y - h + lh - 4) + '" width="' + b + '" height="' + (h - lh + 4) + '" fill="' + rib + '"' + st(7) + '/>' +
      '<rect x="' + l + '" y="' + (y - h) + '" width="' + w + '" height="' + lh + '" rx="7" fill="' + lid + '"' + st() + '/>' +
      '<rect x="' + (x - b / 2) + '" y="' + (y - h) + '" width="' + b + '" height="' + lh + '" fill="' + rib + '"' + st(7) + '/>' +
      '<path d="M' + P(x - 3, y - h - 2) + ' C' + P(x - 20, y - h - 30) + ' ' + P(x - 44, y - h - 24) + ' ' + P(x - 38, y - h - 10) + ' C' + P(x - 34, y - h) + ' ' + P(x - 16, y - h) + ' ' + P(x - 3, y - h - 2) + ' Z" fill="' + rib + '"' + st(8) + '/>' +
      '<path d="M' + P(x + 3, y - h - 2) + ' C' + P(x + 20, y - h - 30) + ' ' + P(x + 44, y - h - 24) + ' ' + P(x + 38, y - h - 10) + ' C' + P(x + 34, y - h) + ' ' + P(x + 16, y - h) + ' ' + P(x + 3, y - h - 2) + ' Z" fill="' + rib + '"' + st(8) + '/>' +
      '<rect x="' + (x - 10) + '" y="' + (y - h - 12) + '" width="20" height="16" rx="6" fill="' + rib + '"' + st(8) + '/>' +
      '</g>';
  }
  // Three gifts on the floor beside his feet: a little pile on our left, one big gift on our right.
  var GIFTS = '<g class="elf-gifts">' +
    gift(24, 560, 80, 96, '#25B46A', '#38C97C', '#FBB900', '#1C9A59') +
    gift(50, 574, 60, 50, '#FF7BB5', '#FF9BC8', '#9344F3', '#E95F9D') +
    gift(374, 572, 92, 76, '#E8343F', '#F2545E', '#FBB900', '#C4212F') +
    '</g>';
  var FLOOR = { stand: [0, 0], wave: [0, 0], point: [0, 0], cheer: [0, 0], think: [0, 0] };

  var parts = [{ layer: 'ground', cls: 'dis-gifts', svg: GIFTS, at: FLOOR }];
  Object.keys(POSES).forEach(function (pose) {
    var at = {}; at[pose] = [0, 0];
    parts.push({ layer: 'front', cls: 'dis-hat', svg: hat(POSES[pose]), at: at });
  });
  var css = '.dis-hat .elf-slit { transform-box: fill-box; transform-origin: 50% 0; }' +
    '@keyframes elf-jingle { 0%, 100% { transform: rotate(14deg); } 50% { transform: rotate(-14deg); } }' +
    '.mascot:is([data-act="yay"], [data-act="twirl"], [data-act="dance"], [data-act="hop"], [data-act="wave"], [data-mood^="cheer"], [data-mood="party"], [data-mood="wave"]) .dis-hat .elf-slit { animation: elf-jingle .3s ease-in-out infinite; }';
  TT.disguise.add({ id: 'elf', from: [12, 1], to: [12, 31], parts: parts, css: css });
})();
