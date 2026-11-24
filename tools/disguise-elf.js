// Holiday Helper (Kevin, 2026-11-24): a red elf hat with a jingle bell, and a wrapped gift he holds.
// All of December, taking over from the November turkey. NOT LIVE YET: waiting for Kevin's OK on the
// redraw. To turn it on, add <script src="/tools/disguise-elf.js"> after disguise.js in index.html and
// join.html, then run node scripts/make-pages.js. Drawn to match Kevin's mascot artwork: flat
// colors, one simple shade, and the same thick dark-purple outline (#44037B, about 10px).
// The hat leans to his right (our left) so his antenna still pokes out of the top. The bell swings,
// and jingles faster when he is excited. His own mitten is drawn over the gift so he really holds it.
(function () {
  var TT = window.TT; if (!TT || !TT.disguise || !TT.disguise.add) return;
  var O = '#44037B', W = 10, BODY = '#9344F3';
  function st(w) { return ' stroke="' + O + '" stroke-width="' + (w || W) + '" stroke-linejoin="round" stroke-linecap="round"'; }

  // The hat is one shape: a low crown on the right (his antenna comes out of it) and a tall cone on the
  // left that bends over into a floppy tip with the bell.
  var HATPATH = 'M304 184 C304 142 282 116 238 110 C216 108 198 106 186 100 C170 70 146 40 112 32 C80 26 54 46 46 82 C44 92 44 102 46 112 ' +
    'C56 92 76 78 98 82 C114 106 116 146 116 184 Z';
  var HAT = '<g class="elf-hat">' +
      '<path d="' + HATPATH + '" fill="#E8343F"/>' +
      '<path d="M272 124 C292 138 302 160 302 184 L250 184 C256 160 262 140 272 124 Z" fill="#C4212F"/>' +
      '<path d="' + HATPATH + '" fill="none"' + st() + '/>' +
      // the bell hangs from the tip and swings
      '<g class="elf-bell"><path d="M46 114 v10" stroke="' + O + '" stroke-width="7" stroke-linecap="round"/>' +
        '<circle cx="46" cy="144" r="21" fill="#FBB900"' + st(9) + '/>' +
        '<path d="M34 148 h24" stroke="' + O + '" stroke-width="6" stroke-linecap="round"/><circle cx="46" cy="157" r="4.5" fill="' + O + '"/>' +
        '<path d="M37 136 a11 11 0 0 1 9 -6" fill="none" stroke="#FFE07A" stroke-width="5" stroke-linecap="round"/></g>' +
      // green cuff hugging the top of his head
      '<path d="M104 196 Q208 134 312 196" fill="none" stroke="' + O + '" stroke-width="52" stroke-linecap="round"/>' +
      '<path d="M104 196 Q208 134 312 196" fill="none" stroke="#25B46A" stroke-width="32" stroke-linecap="round"/>' +
      '<path d="M120 176 Q208 124 296 176" fill="none" stroke="#4ED38A" stroke-width="7" stroke-linecap="round"/>' +
    '</g>';
  // His antenna, cut from his own picture, laid back over the hat so it pokes out of the top.
  // cut = how far down the antenna shows in that pose (just above where it meets the hat).
  // The hat is left off in the back view (the "work" pose), like the turkey costume.
  function antenna(pose, cut) {
    return '<svg x="150" y="-40" width="300" height="' + (cut + 40) + '" viewBox="150 -40 300 ' + (cut + 40) + '" overflow="hidden">' +
      '<image href="/assets/mascot/' + pose + '.webp" width="420" height="576"/></svg>';
  }

  // A gift drawn around (0, 0): green box, gold ribbon (the same gold as his antenna bulb), gold bow.
  function box() {
    return '<rect x="-46" y="-26" width="92" height="66" rx="9" fill="#25B46A"' + st() + '/>' +
      '<rect x="14" y="-20" width="26" height="54" rx="5" fill="#1C9A59"/>' +
      '<rect x="-9" y="-26" width="18" height="66" fill="#FBB900"' + st(8) + '/>' +
      '<rect x="-54" y="-46" width="108" height="26" rx="8" fill="#38C97C"' + st() + '/>' +
      '<rect x="-9" y="-46" width="18" height="26" fill="#FBB900"' + st(8) + '/>' +
      '<g class="elf-bow">' +
        '<path d="M-4 -50 C-20 -76 -46 -74 -44 -60 C-42 -48 -20 -46 -4 -50 Z" fill="#FBB900"' + st(9) + '/>' +
        '<path d="M4 -50 C20 -76 46 -74 44 -60 C42 -48 20 -46 4 -50 Z" fill="#FBB900"' + st(9) + '/>' +
        '<rect x="-11" y="-60" width="22" height="18" rx="7" fill="#FBB900"' + st(9) + '/>' +
      '</g>';
  }
  // His mitten wrapped over the edge of the gift. side: 'L' (arm comes from the left), 'R', or 'B' (from below).
  function mitt(side) {
    var m = '<ellipse cx="-4" cy="0" rx="20" ry="25" fill="' + BODY + '"' + st() + '/>' +
      '<ellipse cx="14" cy="-9" rx="12" ry="9.5" fill="' + BODY + '"' + st(9) + '/>' +
      '<ellipse cx="14" cy="10" rx="12" ry="9.5" fill="' + BODY + '"' + st(9) + '/>' +
      '<ellipse cx="-3" cy="0" rx="15.5" ry="20.5" fill="' + BODY + '"/>';
    if (side === 'L') return '<g transform="translate(-50 12)">' + m + '</g>';
    if (side === 'R') return '<g transform="translate(50 12) scale(-1 1)">' + m + '</g>';
    return '<g transform="translate(-4 48) rotate(-90)">' + m + '</g>';
  }
  function gift(x, y, deg, s, side) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + deg + ') scale(' + s + ')"><g class="elf-gift">' + box() + mitt(side) + '</g></g>';
  }
  function only(pose) { var a = {}; a[pose] = [0, 0]; return a; }

  TT.disguise.add({ id: 'elf', from: [12, 1], to: [12, 31], parts: [
    { layer: 'front', cls: 'dis-hat', svg: HAT, origin: [198, 120],
      at: { stand: [0, 0], wave: [-23, 2, .98, -3], point: [-14, -12, .97, -2], cheer: [-12, -17, .97, -1], think: [-16, -26, .97, -2] } },
    { layer: 'front', cls: 'elf-ant', svg: antenna('stand', 106), at: only('stand') },
    { layer: 'front', cls: 'elf-ant', svg: antenna('wave', 106), at: only('wave') },
    { layer: 'front', cls: 'elf-ant', svg: antenna("point", 94), at: only('point') },
    { layer: 'front', cls: 'elf-ant', svg: antenna("cheer", 89), at: only('cheer') },
    { layer: 'front', cls: 'elf-ant', svg: antenna("think", 80), at: only('think') },
    { layer: 'front', cls: 'dis-gift', svg: gift(376, 410, 5, 1, 'L'), at: only('stand') },
    { layer: 'front', cls: 'dis-gift', svg: gift(48, 404, -6, .95, 'R'), at: only('wave') },
    { layer: 'front', cls: 'dis-gift', svg: gift(66, 404, -4, .95, 'R'), at: only('point') },
    { layer: 'front', cls: 'dis-gift', svg: gift(366, 170, 8, .9, 'B'), at: only('cheer') },
    { layer: 'front', cls: 'dis-gift', svg: gift(160, 430, -4, .9, 'R'), at: only('think') }
  ], css:
        '.dis-hat .elf-bell { transform-box: view-box; transform-origin: 46px 114px; animation: elf-ring 3s ease-in-out infinite; }' +
        '@keyframes elf-ring { 0%, 100% { transform: rotate(7deg); } 50% { transform: rotate(-9deg); } }' +
    '@keyframes elf-jingle { 0%, 100% { transform: rotate(18deg); } 50% { transform: rotate(-20deg); } }' +
    '@keyframes elf-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }' +
    '.mascot:is([data-act="yay"], [data-act="twirl"], [data-act="dance"], [data-act="hop"], [data-act="wave"], [data-mood^="cheer"], [data-mood="party"], [data-mood="wave"]) .dis-hat .elf-bell { animation: elf-jingle .32s ease-in-out infinite; }' +
    '.mascot:is([data-act="yay"], [data-mood^="cheer"], [data-mood="party"]) .dis-gift .elf-gift { animation: elf-bounce .5s ease-in-out infinite; }'
  });
})();
