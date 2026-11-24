// Holiday Helper (Kevin, 2026-11-24): a red elf hat with a jingle bell and a wrapped gift he carries.
// All of December, taking over from the November turkey. Hand-drawn to match Kevin's mascot artwork.
// The hat flops to his left so his antenna can poke out of the top. The bell swings, and rings harder
// (and the gift bounces) when he is excited. Positions per pose are in `at`: [dx, dy, scale, degrees].
(function () {
  var TT = window.TT; if (!TT || !TT.disguise || !TT.disguise.add) return;
  var OUT = TT.disguise.OUT;
  var HAT = '<g class="elf-hat">' +
      // the floppy tip and its bell (they swing together)
      '<g class="elf-flop">' +
        '<path d="M150 124 C122 104 90 108 70 136 C64 146 62 154 63 160 C82 146 108 142 140 150 Z" fill="#C92A3E" stroke="' + OUT + '" stroke-width="7" stroke-linejoin="round"/>' +
        '<path d="M120 116 C100 114 86 122 76 136" fill="none" stroke="#F0637A" stroke-width="6" stroke-linecap="round" opacity=".8"/>' +
        '<g class="elf-bell"><path d="M63 160 v8" stroke="' + OUT + '" stroke-width="6" stroke-linecap="round"/>' +
          '<circle cx="63" cy="186" r="19" fill="#FFC233" stroke="' + OUT + '" stroke-width="6"/>' +
          '<path d="M51 188 h24" stroke="' + OUT + '" stroke-width="4.5" stroke-linecap="round"/><circle cx="63" cy="196" r="4" fill="' + OUT + '"/>' +
          '<ellipse cx="56" cy="178" rx="5" ry="3.6" fill="#FFF1B8" transform="rotate(-35 56 178)"/></g>' +
      '</g>' +
      // the crown of the hat
      '<path d="M120 186 C116 150 132 118 162 104 C188 92 222 90 246 100 C282 116 300 150 298 186 Z" fill="#E5394B" stroke="' + OUT + '" stroke-width="7" stroke-linejoin="round"/>' +
      '<path d="M150 158 C152 136 166 118 188 108" fill="none" stroke="#FF8A98" stroke-width="9" stroke-linecap="round" opacity=".75"/>' +
      '<path d="M268 168 C268 146 258 128 242 116" fill="none" stroke="#B3203A" stroke-width="10" stroke-linecap="round" opacity=".55"/>' +
      // a little holly sprig
      '<g transform="translate(262 158) rotate(-14)"><path d="M0 0 c-16 -14 -32 -6 -36 -2 c8 0 10 6 6 10 c8 -2 12 4 10 10 c8 -10 18 -12 20 -18z" fill="#2BA36B" stroke="' + OUT + '" stroke-width="4.5" stroke-linejoin="round"/>' +
        '<path d="M2 0 c14 -16 30 -10 36 -6 c-8 2 -9 8 -5 12 c-8 -1 -11 6 -8 11 c-9 -9 -19 -10 -23 -17z" fill="#36BE7E" stroke="' + OUT + '" stroke-width="4.5" stroke-linejoin="round"/>' +
        '<circle cx="-4" cy="4" r="7" fill="#E5394B" stroke="' + OUT + '" stroke-width="4"/><circle cx="7" cy="6" r="7" fill="#E5394B" stroke="' + OUT + '" stroke-width="4"/><circle cx="1" cy="-4" r="7" fill="#E5394B" stroke="' + OUT + '" stroke-width="4"/></g>' +
      // fluffy white brim
      '<path d="M116 188 Q208 156 302 188" fill="none" stroke="' + OUT + '" stroke-width="40" stroke-linecap="round"/>' +
      '<path d="M116 188 Q208 156 302 188" fill="none" stroke="#FFFFFF" stroke-width="27" stroke-linecap="round"/>' +
      '<path d="M128 194 Q208 168 290 194" fill="none" stroke="#DCE4F5" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16"/>' +
      '<path d="M124 180 Q208 150 294 180" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 15" opacity=".9"/>' +
    '</g>';
  // The gift, drawn around (210, 290). A teal box with a gold ribbon and bow.
  var GIFT = '<g class="elf-gift">' +
      '<rect x="168" y="282" width="84" height="64" rx="8" fill="#19A99A"/>' +
      '<path d="M176 296 v42" stroke="#0F8A7E" stroke-width="7" stroke-linecap="round" opacity=".6"/>' +
      '<g fill="#BFF5E9" opacity=".7"><circle cx="186" cy="326" r="4"/><circle cx="236" cy="300" r="4"/><circle cx="240" cy="332" r="3"/><circle cx="190" cy="298" r="3"/></g>' +
      '<rect x="202" y="282" width="16" height="64" fill="#FFC233"/>' +
      '<rect x="168" y="282" width="84" height="64" rx="8" fill="none" stroke="' + OUT + '" stroke-width="6.5"/>' +
      '<rect x="160" y="262" width="100" height="26" rx="8" fill="#2FCCB6" stroke="' + OUT + '" stroke-width="6.5"/>' +
      '<rect x="202" y="262" width="16" height="26" fill="#FFC233" stroke="' + OUT + '" stroke-width="5"/>' +
      '<path d="M170 270 h22" stroke="#B8F6EB" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M202 290 v54 M218 290 v54" stroke="#D99A12" stroke-width="3" opacity=".7"/>' +
      '<g class="elf-bow">' +
        '<path d="M206 258 C186 236 166 238 168 252 C170 264 192 264 206 258 Z" fill="#FFC233" stroke="' + OUT + '" stroke-width="6" stroke-linejoin="round"/>' +
        '<path d="M214 258 C234 236 254 238 252 252 C250 264 228 264 214 258 Z" fill="#FFC233" stroke="' + OUT + '" stroke-width="6" stroke-linejoin="round"/>' +
        '<path d="M180 250 c6 -4 14 -2 20 4 M240 250 c-6 -4 -14 -2 -20 4" fill="none" stroke="#FFE7A0" stroke-width="4" stroke-linecap="round"/>' +
        '<rect x="200" y="250" width="20" height="15" rx="6" fill="#FFB000" stroke="' + OUT + '" stroke-width="6"/>' +
      '</g></g>';

  TT.disguise.add({ id: 'elf', from: [12, 1], to: [12, 31], parts: [
    { layer: 'front', cls: 'dis-hat', svg: HAT, origin: [207, 180],
      at: { stand: [0, 0], wave: [-22, 2, .98, -4], point: [-18, -9, .96, -3], cheer: [-14, -11, .97, -2], think: [-16, -21, .97, -3], work: [-34, -2, .96, 2] } },
    { layer: 'front', cls: 'dis-gift', svg: GIFT, origin: [210, 300],
      at: { stand: [152, 80, .86, 6], wave: [-166, 84, .86, -6], point: [-148, 94, .86, -4], cheer: [152, -132, .84, 8], think: [-8, 152, .86, -3] } }
  ], css:
    '.dis-hat .elf-flop { transform-box: view-box; transform-origin: 150px 130px; animation: elf-sway 3s ease-in-out infinite; }' +
    '.dis-hat .elf-bell { transform-box: view-box; transform-origin: 63px 162px; animation: elf-ring 3s ease-in-out infinite; }' +
    '@keyframes elf-sway { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(4deg); } }' +
    '@keyframes elf-ring { 0%, 100% { transform: rotate(6deg); } 50% { transform: rotate(-8deg); } }' +
    '@keyframes elf-jingle { 0%, 100% { transform: rotate(16deg); } 50% { transform: rotate(-18deg); } }' +
    '@keyframes elf-bounce { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-14px) rotate(-4deg); } }' +
    '.mascot:is([data-act="yay"], [data-act="twirl"], [data-act="dance"], [data-act="hop"], [data-act="wave"], [data-mood^="cheer"], [data-mood="party"], [data-mood="wave"]) .dis-hat .elf-bell { animation: elf-jingle .32s ease-in-out infinite; }' +
    '.mascot:is([data-act="yay"], [data-mood^="cheer"], [data-mood="party"]) .dis-gift .elf-gift { transform-box: view-box; transform-origin: 210px 340px; animation: elf-bounce .5s ease-in-out infinite; }'
  });
})();
