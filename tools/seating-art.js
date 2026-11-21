// Seating Chart pictures: a small drawing for every kind of furniture, seen from above.
// "var(--ic)" is the item's own color, so a recolored item recolors its picture too.
(function () {
  var C = 'var(--ic, #8A93B2)', K = '#0E1120';
  function svg(inner) { return '<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="' + K + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">' + inner + '</svg>'; }
  function desk(x, y, w, hh) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="2.5" fill="#fff"/>'; }
  function chair(cx, cy) { return '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + C + '"/>'; }
  window.TT.SEAT_ART = {
    desk: svg(desk(11, 12, 26, 16) + chair(24, 36)),
    pair: svg(desk(4, 12, 19, 15) + desk(25, 12, 19, 15) + chair(13.5, 35) + chair(34.5, 35)),
    group4: svg(chair(14, 6) + chair(34, 6) + desk(6, 12, 17, 11) + desk(25, 12, 17, 11) + desk(6, 25, 17, 11) + desk(25, 25, 17, 11) + chair(14, 42) + chair(34, 42)),
    round4: svg(chair(24, 6) + chair(42, 24) + chair(24, 42) + chair(6, 24) + '<circle cx="24" cy="24" r="12" fill="#fff"/>'),
    long6: svg(chair(10, 10) + chair(24, 10) + chair(38, 10) + desk(3, 16, 42, 16) + chair(10, 38) + chair(24, 38) + chair(38, 38)),
    teacher: svg(desk(4, 10, 40, 20) + '<rect x="9" y="14" width="13" height="9" rx="1.5" fill="' + C + '"/><path d="M28 16h10M28 21h7" />' + '<path d="M17 36a7 7 0 0 1 14 0v4H17z" fill="' + C + '"/>'),
    board: svg('<rect x="4" y="9" width="40" height="26" rx="2.5" fill="#fff"/><path d="M10 17c3-4 5 4 8 0s5 4 8 0M10 25h16" stroke="' + C + '" stroke-width="2.6"/><path d="M14 35v5M34 35v5M10 40h28"/>'),
    door: svg('<path d="M8 42V6h20v36" fill="none"/><path d="M8 6l16 5v34L8 42z" fill="' + C + '"/><circle cx="19.500" cy="27" r="1.6" fill="#fff" stroke-width="1.5"/><path d="M4 42h40"/>'),
    rug: svg('<path d="M9 8v-4M17 8v-4M24 8v-4M31 8v-4M39 8v-4M9 40v4M17 40v4M24 40v4M31 40v4M39 40v4"/><rect x="5" y="8" width="38" height="32" rx="5" fill="' + C + '"/><rect x="11" y="14" width="26" height="20" rx="3" stroke="#fff"/><circle cx="24" cy="24" r="4" fill="#fff" stroke="none"/>'),
    shelf: svg('<rect x="5" y="6" width="38" height="36" rx="2.5" fill="#fff"/><path d="M5 24h38"/><rect x="10" y="10" width="5" height="14" fill="' + C + '"/><rect x="15" y="12" width="5" height="12" fill="#fff"/><rect x="20" y="9" width="6" height="15" fill="' + C + '"/><path d="M31 24l4-13 5 1.500-4 11.500" fill="#fff"/><rect x="10" y="29" width="6" height="13" fill="#fff"/><rect x="16" y="27" width="5" height="15" fill="' + C + '"/><rect x="27" y="30" width="11" height="5" fill="' + C + '"/><rect x="26" y="35" width="13" height="7" fill="#fff"/>'),
    label: svg('<path d="M5 12a3 3 0 0 1 3-3h24l11 15-11 15H8a3 3 0 0 1-3-3z" fill="' + C + '"/><path d="M12 20h14M12 28h9" stroke="#fff" stroke-width="2.6"/>')
  };
  window.TT.SEAT_ICONS = {
    seat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0"/><path d="M17 11l2 2 3.500-4"/></svg>',
    room: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="7" height="6" rx="1.5"/><rect x="14" y="14" width="7" height="6" rx="1.5"/><path d="M14 7h7M18 4l3 3-3 3M10 17H3M6 14l-3 3 3 3"/></svg>'
  };
})();
