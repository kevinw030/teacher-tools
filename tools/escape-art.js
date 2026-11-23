// Escape room scenes: original illustrations drawn as SVG (1600 x 900).
// Each scene has five things to investigate (spots), an exit, and parts that change when a lock opens:
//   class "on-N"  shows once lock N is open,  class "off-N" hides once lock N is open,
//   class "x-open" shows after the escape,    class "x-shut" hides after the escape.
(function () {
  var TT = window.TT;

  function R(x, y, w, h, fill, rx, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (rx ? ' rx="' + rx + '"' : '') + (extra ? ' ' + extra : '') + '/>'; }
  function C(x, y, r, fill, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function E(x, y, rx, ry, fill, extra) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function P(d, fill, extra) { return '<path d="' + d + '" fill="' + (fill || 'none') + '"' + (extra ? ' ' + extra : '') + '/>'; }
  function L(d, stroke, w, extra) { return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (extra ? ' ' + extra : '') + '/>'; }
  function G(cls, inner, extra) { return '<g class="' + cls + '"' + (extra ? ' ' + extra : '') + '>' + inner + '</g>'; }
  function T(x, y, size, fill, text, extra) { return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + fill + '" font-family="Arial, Helvetica, sans-serif" font-weight="800" text-anchor="middle"' + (extra ? ' ' + extra : '') + '>' + text + '</text>'; }
  function grad(id, stops, dir) {
    var d = dir === 'h' ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"';
    return '<linearGradient id="' + id + '" ' + d + '>' + stops.map(function (s, i) { return '<stop offset="' + (stops.length === 1 ? 0 : i / (stops.length - 1)) + '" stop-color="' + s + '"/>'; }).join('') + '</linearGradient>';
  }
  function glow(id, color, mid) { return '<radialGradient id="' + id + '"><stop offset="0" stop-color="' + color + '" stop-opacity=".95"/><stop offset="' + (mid || 0.5) + '" stop-color="' + color + '" stop-opacity=".35"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></radialGradient>'; }
  // A steady stream of numbers from a seed, so the art is the same every time.
  function rng(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  // A shelf unit full of books.
  function shelves(x, y, w, h, rows, seed, wood, colors) {
    var r = rng(seed), out = R(x, y, w, h, wood[0], 10) + R(x + 14, y + 14, w - 28, h - 28, wood[1], 4);
    var rh = (h - 28) / rows;
    for (var i = 0; i < rows; i++) {
      var by = y + 14 + rh * (i + 1), bx = x + 22;
      while (bx < x + w - 44) {
        var bw = 16 + Math.floor(r() * 16), bh = rh * (0.55 + r() * 0.3), col = colors[Math.floor(r() * colors.length)];
        if (r() < 0.12) { bx += bw; continue; }
        out += R(bx, by - 10 - bh, bw, bh, col, 3) + R(bx + 3, by - 10 - bh + 10, bw - 6, 4, 'rgba(255,255,255,.35)', 2);
        bx += bw + 2;
      }
      out += R(x + 14, by - 10, w - 28, 10, wood[0]);
    }
    return out;
  }
  function stars(x, y, w, h, n, seed) {
    var r = rng(seed), out = '';
    for (var i = 0; i < n; i++) out += C(Math.round(x + r() * w), Math.round(y + r() * h), (1 + r() * 2.2).toFixed(1), '#fff', 'opacity="' + (0.5 + r() * 0.5).toFixed(2) + '"' + (i % 5 === 0 ? ' class="ea-twinkle" style="animation-delay:-' + (r() * 3).toFixed(1) + 's"' : ''));
    return out;
  }
  function planks(y, h, color, n) { var out = ''; for (var i = 1; i < n; i++) out += L('M0 ' + (y + h * i / n) + ' H1600', color, 3, 'opacity=".5"'); return out; }
  function dust(seed, color) {
    var r = rng(seed), out = '';
    for (var i = 0; i < 9; i++) out += C(Math.round(150 + r() * 1300), Math.round(180 + r() * 420), (2 + r() * 2.5).toFixed(1), color, 'opacity=".5" class="ea-float" style="animation-delay:-' + (r() * 8).toFixed(1) + 's"');
    return out;
  }

  var SCENES = {};

  // ------------------------------------------------------------------ The Locked Library
  SCENES.library = {
    exit: { name: 'The Library Doors', x: 1270, y: 190, w: 280, h: 520 },
    spots: [
      { name: 'The Tall Bookshelf', x: 60, y: 150, w: 360, h: 560 },
      { name: 'The Dusty Book', x: 560, y: 520, w: 190, h: 110 },
      { name: 'The Pinned Note', x: 880, y: 210, w: 170, h: 170 },
      { name: 'The Door Keypad', x: 1196, y: 410, w: 62, h: 100 },
      { name: 'The Grandfather Clock', x: 1070, y: 210, w: 116, h: 500 }
    ],
    art: function (p) {
      var books = ['#E5484D', '#F5AE14', '#3B7BFF', '#14B884', '#EC4899', '#8B5CF6', '#F2643D', '#2DD4D0', '#F4E3C1'];
      return '<defs>' + grad(p + 'wall', ['#4A3470', '#2E2050']) + grad(p + 'floor', ['#9A6A44', '#6E472B']) + grad(p + 'sky', ['#141B4D', '#3A2C7A', '#7A4FA8']) +
        grad(p + 'door', ['#8A5632', '#6B3F22']) + grad(p + 'hall', ['#FFF6D0', '#FFD98A']) + glow(p + 'lamp', '#FFE08A') + glow(p + 'moon', '#FFF6C9', 0.35) + glow(p + 'gold', '#FFD43B') + '</defs>' +
        R(0, 0, 1600, 900, 'url(#' + p + 'wall)') +
        // wall panels and trim
        R(0, 640, 1600, 70, '#3A2860') + R(0, 632, 1600, 12, '#5B4290') + R(0, 700, 1600, 200, 'url(#' + p + 'floor)') + planks(700, 200, '#5A3920', 5) +
        E(700, 800, 420, 62, '#B33A55') + E(700, 800, 370, 46, '#D9566F') + E(700, 800, 300, 30, '#B33A55', 'opacity=".5"') +
        // arched window with the moon
        P('M500 520 V270 a150 150 0 0 1 300 0 V520Z', '#2A1D45') + P('M516 510 V270 a134 134 0 0 1 268 0 V510Z', 'url(#' + p + 'sky)') +
        stars(520, 150, 260, 300, 18, 7) + C(712, 250, 90, 'url(#' + p + 'moon)') + C(712, 250, 38, '#FFF6C9') + C(700, 240, 7, '#F2E3A6') + C(724, 262, 5, '#F2E3A6') +
        L('M650 136 V510 M516 330 H784', '#2A1D45', 10) + R(486, 512, 328, 20, '#6B4226', 6) +
        // bookshelf
        shelves(60, 150, 360, 560, 5, 11, ['#6B4226', '#3B2414'], books) +
        G('on-0', C(250, 372, 90, 'url(#' + p + 'gold)') + R(232, 318, 30, 82, '#FFD43B', 4) + R(237, 332, 20, 5, '#B77A00', 2) + R(237, 344, 20, 5, '#B77A00', 2)) +
        // desk, lamp and the dusty book
        R(470, 620, 430, 24, '#7A4B2A', 8) + R(490, 644, 28, 110, '#5E3920') + R(852, 644, 28, 110, '#5E3920') + R(500, 644, 370, 46, '#6B4226', 4) + C(685, 668, 7, '#F5AE14') +
        G('ea-flicker', C(820, 520, 150, 'url(#' + p + 'lamp)')) + R(812, 560, 14, 60, '#3B2414') + R(790, 612, 58, 10, '#3B2414', 5) + P('M770 560 L870 560 L846 500 L794 500Z', '#FFD76A') +
        G('off-1', R(578, 584, 150, 36, '#8B5CF6', 6) + R(586, 590, 134, 8, '#C4A8FF', 3) + R(600, 566, 120, 20, '#5E3FB8', 5) + E(660, 562, 46, 6, 'rgba(255,255,255,.25)')) +
        G('on-1', P('M574 618 Q574 584 654 592 Q734 584 734 618 L654 626Z', '#F4E3C1') + L('M654 592 V624', '#C9B48A', 4) + L('M592 602 H640 M592 612 H636 M668 602 H716 M668 612 H712', '#B8A47C', 3) + C(654, 560, 70, 'url(#' + p + 'gold)')) +
        // bulletin board and the pinned note
        R(870, 200, 190, 190, '#6B4226', 10) + R(884, 214, 162, 162, '#C99A62', 4) +
        P('M910 240 h98 v112 h-98Z', '#FFF8DC', 'transform="rotate(-4 959 296)"') + L('M924 268 h70 M924 288 h70 M924 308 h52', '#B8A47C', 5, 'transform="rotate(-4 959 296)"') + C(958, 238, 8, '#E5484D') +
        G('on-2', C(1004, 338, 26, '#14B884') + L('M992 338 l8 9 l16 -18', '#fff', 6)) +
        // grandfather clock
        R(1070, 210, 116, 500, '#5E3920', 14) + R(1082, 222, 92, 476, '#7A4B2A', 8) + C(1128, 290, 40, '#FFF8DC') + C(1128, 290, 40, 'none', 'stroke="#C99A2E" stroke-width="5"') +
        L('M1128 290 V264 M1128 290 L1146 298', '#3B2414', 5) + R(1098, 360, 60, 300, '#3B2414', 6) +
        G('ea-swing', L('M1128 366 V590', '#C99A2E', 5) + C(1128, 600, 20, '#F5C542'), 'style="transform-origin:1128px 366px"') +
        G('on-4', C(1128, 290, 70, 'url(#' + p + 'gold)')) +
        // keypad
        R(1196, 410, 62, 100, '#2A2440', 8) + R(1204, 418, 46, 22, '#0E1120', 4) +
        G('off-3', C(1227, 429, 6, '#E5484D', 'class="ea-blink"')) + G('on-3', C(1227, 429, 7, '#5BF0A5')) +
        [0, 1, 2].map(function (r) { return [0, 1, 2].map(function (c) { return R(1206 + c * 15, 448 + r * 18, 11, 12, '#8E8AA8', 2); }).join(''); }).join('') +
        // the double doors
        P('M1260 710 V330 a150 150 0 0 1 300 0 V710Z', '#3B2414') +
        G('x-open', P('M1276 710 V330 a134 134 0 0 1 268 0 V710Z', 'url(#' + p + 'hall)') + P('M1276 710 L1200 900 H1620 L1544 710Z', '#FFE9A8', 'opacity=".45"') +
          P('M1276 710 V330 a134 134 0 0 1 30 -80 V710Z', '#6B3F22') + P('M1544 710 V330 a134 134 0 0 0 -30 -80 V710Z', '#6B3F22')) +
        G('x-shut', P('M1276 710 V330 a134 134 0 0 1 268 0 V710Z', 'url(#' + p + 'door)') + L('M1410 198 V710', '#3B2414', 8) +
          R(1296, 360, 96, 140, '#7A4B2A', 8) + R(1428, 360, 96, 140, '#7A4B2A', 8) + R(1296, 530, 96, 150, '#7A4B2A', 8) + R(1428, 530, 96, 150, '#7A4B2A', 8) +
          C(1392, 520, 10, '#F5C542') + C(1428, 520, 10, '#F5C542')) +
        dust(3, '#FFE9B0');
    }
  };

  // ------------------------------------------------------------------ Stuck on the Space Station
  SCENES.space = {
    exit: { name: 'The Airlock', x: 1290, y: 230, w: 260, h: 470 },
    spots: [
      { name: 'The Main Computer', x: 420, y: 500, w: 190, h: 130 },
      { name: 'The Fuel Gauge', x: 100, y: 220, w: 210, h: 250 },
      { name: 'The Radio Decoder', x: 640, y: 500, w: 170, h: 130 },
      { name: 'The Meal Locker', x: 1080, y: 300, w: 160, h: 400 },
      { name: 'The Big Window', x: 470, y: 120, w: 500, h: 330 }
    ],
    art: function (p) {
      return '<defs>' + grad(p + 'wall', ['#24365E', '#131D38']) + grad(p + 'floor', ['#3A4A72', '#1C2744']) + grad(p + 'space', ['#05061A', '#141A4A', '#2A1B5E']) + grad(p + 'desk', ['#5B6C9A', '#3A4770']) +
        grad(p + 'out', ['#05061A', '#1B2A6B']) + glow(p + 'sun', '#FFE08A', 0.3) + glow(p + 'gold', '#5BF0A5') + glow(p + 'lite', '#9AD8FF') +
        '<clipPath id="' + p + 'win"><rect x="420" y="110" width="600" height="360" rx="60"/></clipPath></defs>' +
        R(0, 0, 1600, 900, 'url(#' + p + 'wall)') +
        [200, 400, 1060, 1260].map(function (x) { return L('M' + x + ' 0 V700', '#31456F', 4, 'opacity=".7"'); }).join('') + R(0, 60, 1600, 26, '#31456F') +
        [140, 500, 860, 1220].map(function (x) { return R(x, 66, 200, 14, '#BFE8FF', 7) + E(x + 100, 96, 150, 40, 'url(#' + p + 'lite)', 'opacity=".5"'); }).join('') +
        R(0, 700, 1600, 200, 'url(#' + p + 'floor)') + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return L('M' + (i * 200) + ' 700 L' + (i * 260 - 240) + ' 900', '#4D5F8C', 3, 'opacity=".6"'); }).join('') + L('M0 770 H1600 M0 846 H1600', '#4D5F8C', 3, 'opacity=".6"') +
        // the big window
        R(400, 90, 640, 400, '#5B6C9A', 76) + G('', R(420, 110, 600, 360, 'url(#' + p + 'space)') + stars(420, 110, 600, 360, 46, 5) +
          C(960, 150, 150, 'url(#' + p + 'sun)') + C(960, 150, 34, '#FFE9A8') +
          C(560, 480, 190, '#2F7BFF') + P('M430 420 q60 -70 130 -40 q40 30 10 70 q-70 40 -140 30Z', '#3CCB7F') + P('M610 380 q50 -10 70 30 q-10 40 -60 40 q-30 -30 -10 -70Z', '#3CCB7F') + E(520, 350, 70, 12, '#fff', 'opacity=".6"') +
          C(800, 250, 30, '#E0603C') + C(792, 242, 7, '#C24A2A') + C(810, 260, 5, '#C24A2A') +
          G('ea-drift', P('M0 0 l26 -8 l-8 26Z', '#fff') + L('M0 0 l-46 14', '#fff', 3, 'opacity=".6"'), 'transform="translate(700 170)"'), 'clip-path="url(#' + p + 'win)"') +
        R(400, 90, 640, 400, 'none', 76, 'stroke="#8FA3D6" stroke-width="10"') + G('on-4', R(420, 110, 600, 360, 'none', 60, 'stroke="#5BF0A5" stroke-width="8"')) +
        // console with three screens
        P('M360 700 L400 560 H1040 L1080 700Z', 'url(#' + p + 'desk)') + R(380, 548, 680, 20, '#7F92C4', 8) +
        R(420, 500, 190, 120, '#0E1120', 12) + G('off-0', R(432, 512, 166, 96, '#12305E', 6) + L('M448 540 h90 M448 560 h120 M448 580 h60', '#5AA8FF', 6) + R(560, 574, 22, 12, '#5AA8FF', 2, 'class="ea-blink"')) +
        G('on-0', R(432, 512, 166, 96, '#0F4A36', 6) + L('M488 560 l18 20 l36 -42', '#5BF0A5', 10)) +
        R(640, 500, 170, 120, '#0E1120', 12) + G('off-2', R(652, 512, 146, 96, '#2A1B5E', 6) + L('M664 560 q12 -40 24 0 t24 0 t24 0 t24 0 t24 0', '#C4A8FF', 5, 'class="ea-blink"')) +
        G('on-2', R(652, 512, 146, 96, '#0F4A36', 6) + L('M698 560 l18 20 l36 -42', '#5BF0A5', 10)) +
        R(840, 508, 180, 106, '#0E1120', 12) + R(852, 520, 156, 82, '#16224A', 6) + [0, 1, 2, 3, 4].map(function (i) { return R(866 + i * 28, 580 - (i * 13) % 44 - 10, 16, (i * 13) % 44 + 20, ['#5AA8FF', '#5BF0A5', '#FFD43B', '#FF8FB8', '#C4A8FF'][i], 3); }).join('') +
        [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return C(450 + i * 80, 660, 9, ['#E5484D', '#FFD43B', '#5BF0A5', '#5AA8FF'][i % 4], i % 3 === 0 ? 'class="ea-blink" style="animation-delay:-' + (i * 0.4) + 's"' : ''); }).join('') +
        // fuel gauge panel
        R(100, 220, 210, 250, '#3A4770', 18) + R(114, 234, 182, 222, '#16224A', 10) + P('M140 380 a66 66 0 0 1 132 0', 'none', 'stroke="#31456F" stroke-width="18" stroke-linecap="round"') +
        P('M140 380 a66 66 0 0 1 100 -56', 'none', 'stroke="#FFD43B" stroke-width="18" stroke-linecap="round"') + G('ea-needle', L('M206 380 L236 326', '#fff', 7), 'style="transform-origin:206px 380px"') + C(206, 380, 11, '#fff') +
        T(206, 430, 26, '#9AD8FF', 'FUEL') + G('on-1', R(114, 234, 182, 222, 'none', 10, 'stroke="#5BF0A5" stroke-width="8"')) +
        // meal locker
        R(1080, 300, 160, 400, '#5B6C9A', 14) + R(1094, 314, 132, 176, '#3A4770', 8) + R(1094, 506, 132, 180, '#3A4770', 8) + R(1206, 380, 10, 44, '#BFE8FF', 5) + R(1206, 574, 10, 44, '#BFE8FF', 5) +
        R(1120, 340, 60, 40, '#FFD43B', 8) + R(1120, 396, 60, 40, '#FF8FB8', 8) + R(1120, 534, 60, 40, '#5BF0A5', 8) + R(1120, 590, 60, 40, '#5AA8FF', 8) +
        G('on-3', C(1160, 300, 26, '#14B884') + L('M1148 300 l8 9 l16 -18', '#fff', 6)) +
        // the airlock
        R(1290, 230, 260, 470, '#3A4770', 30) +
        G('x-open', R(1310, 250, 220, 430, 'url(#' + p + 'out)', 110) + stars(1320, 260, 200, 400, 14, 9) + C(1420, 560, 150, '#2F7BFF', 'opacity=".9" clip-path="inset(0 0 26% 0)"') + R(1310, 250, 220, 430, 'none', 110, 'stroke="#5BF0A5" stroke-width="10"')) +
        G('x-shut', R(1310, 250, 220, 430, '#5B6C9A', 110) + R(1330, 270, 180, 390, '#7F92C4', 90) + C(1420, 465, 62, '#3A4770') + C(1420, 465, 62, 'none', 'stroke="#BFE8FF" stroke-width="10"') +
          G('ea-spin', L('M1420 410 V520 M1365 465 H1475', '#BFE8FF', 10), 'style="transform-origin:1420px 465px"') + C(1420, 465, 14, '#BFE8FF')) +
        R(1380, 180, 80, 34, '#0E1120', 10) + G('x-shut', C(1420, 197, 9, '#E5484D', 'class="ea-blink"')) + G('x-open', C(1420, 197, 10, '#5BF0A5')) +
        // a little helper robot
        G('ea-bob', E(230, 690, 44, 8, 'rgba(0,0,0,.3)') + R(190, 560, 80, 74, '#DDE6FF', 26) + R(204, 578, 52, 26, '#16224A', 12) + C(218, 591, 6, '#5BF0A5', 'class="ea-blink"') + C(242, 591, 6, '#5BF0A5', 'class="ea-blink"') +
          L('M230 560 V540', '#DDE6FF', 5) + C(230, 536, 7, '#FF8FB8') + P('M206 634 q24 30 48 0Z', '#9AD8FF', 'opacity=".8"'));
    }
  };

  // ------------------------------------------------------------------ The Pirate's Treasure
  SCENES.pirate = {
    exit: { name: 'The Treasure Chest', x: 630, y: 520, w: 340, h: 280 },
    spots: [
      { name: 'The Treasure Map', x: 270, y: 560, w: 190, h: 120 },
      { name: 'The Carved Sign', x: 1040, y: 350, w: 220, h: 170 },
      { name: 'The Pile of Coins', x: 1010, y: 700, w: 200, h: 130 },
      { name: 'The Talking Parrot', x: 400, y: 250, w: 130, h: 160 },
      { name: 'The Bottle in the Sand', x: 1310, y: 640, w: 140, h: 130 }
    ],
    art: function (p) {
      var coins = '', r = rng(4);
      for (var i = 0; i < 16; i++) { var cx = 1040 + r() * 140, cy = 740 + r() * 60; coins += E(cx, cy, 20, 9, '#F5AE14') + E(cx, cy - 4, 20, 9, '#FFD43B'); }
      return '<defs>' + grad(p + 'sky', ['#4A3C9A', '#C85A8E', '#FF9E5E', '#FFD98A']) + grad(p + 'sea', ['#2FA8C9', '#1B6FA8']) + grad(p + 'sand', ['#FFE2A0', '#EDB868']) + grad(p + 'chest', ['#A8642F', '#7A4320']) +
        glow(p + 'sun', '#FFF1B8', 0.3) + glow(p + 'gold', '#FFD43B') + '</defs>' +
        R(0, 0, 1600, 470, 'url(#' + p + 'sky)') + C(1080, 430, 230, 'url(#' + p + 'sun)') + C(1080, 440, 86, '#FFF1B8') +
        E(300, 150, 150, 26, '#fff', 'opacity=".35"') + E(420, 176, 110, 20, '#fff', 'opacity=".3"') + E(1340, 120, 130, 22, '#fff', 'opacity=".3"') +
        // far island and the ship
        P('M0 440 q120 -70 260 -30 q60 16 120 30Z', '#5E4A8A', 'opacity=".7"') +
        G('ea-bob', P('M610 420 h170 l-24 34 h-122Z', '#3B2414') + L('M690 420 V300', '#3B2414', 7) + P('M698 306 q70 30 0 96Z', '#FFF8DC') + P('M682 320 q-50 26 0 82Z', '#FFF8DC') + P('M690 300 l34 10 l-34 10Z', '#0E1120')) +
        R(0, 440, 1600, 150, 'url(#' + p + 'sea)') +
        G('ea-wave', L('M-40 480 q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0', '#BFF0FF', 5, 'opacity=".6"')) +
        G('ea-wave', L('M-40 530 q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0', '#BFF0FF', 5, 'opacity=".45" style="animation-delay:-2s"')) +
        P('M0 580 q300 -40 620 -14 q400 30 980 -20 V900 H0Z', 'url(#' + p + 'sand)') + P('M0 570 q300 -40 620 -14 q400 30 980 -20 v18 q-580 50 -980 20 q-320 -26 -620 14Z', '#fff', 'opacity=".7"') +
        E(300, 860, 260, 30, '#E0A85A', 'opacity=".5"') + E(1250, 850, 300, 34, '#E0A85A', 'opacity=".5"') +
        // palm tree
        L('M150 780 Q190 520 300 330', '#8A5A3C', 44) + L('M150 780 Q190 520 300 330', '#A8744C', 22) +
        [[-170, -10], [-120, -90], [-10, -130], [110, -90], [170, 0], [120, 70], [-110, 60]].map(function (d, i) { return P('M300 330 q' + (d[0] * 0.5) + ' ' + (d[1] * 0.5 - 50) + ' ' + d[0] + ' ' + d[1] + ' q' + (-d[0] * 0.4) + ' ' + (-d[1] * 0.2 + 10) + ' ' + (-d[0]) + ' ' + (-d[1]) + 'Z', i % 2 ? '#2FA860' : '#1F8A4C'); }).join('') +
        C(290, 344, 16, '#6B4226') + C(316, 350, 14, '#6B4226') +
        // parrot on a perch
        L('M465 420 V560', '#6B4226', 10) + L('M410 410 H520', '#6B4226', 10) +
        G('ea-bob', E(466, 350, 36, 50, '#E5484D') + P('M440 370 q-30 40 -6 70 q20 -30 26 -60Z', '#3B7BFF') + P('M466 396 q10 50 30 70 q10 -40 -4 -74Z', '#F5AE14') + C(470, 300, 30, '#E5484D') + C(480, 294, 9, '#fff') + C(482, 294, 4, '#0E1120', 'class="ea-blink"') + P('M494 300 q26 4 14 26 q-14 -4 -20 -12Z', '#FFD43B')) +
        G('on-3', C(516, 262, 22, '#14B884') + L('M506 262 l7 8 l14 -16', '#fff', 5)) +
        // barrel with the map
        E(365, 790, 74, 12, 'rgba(0,0,0,.2)') + P('M300 640 q-16 76 0 150 h130 q16 -74 0 -150Z', '#8A5A3C') + L('M294 680 h142 M294 750 h142', '#3B2414', 9) + E(365, 640, 66, 14, '#A8744C') +
        G('off-0', P('M290 610 l150 -30 l12 50 l-150 30Z', '#FFF1C9') + L('M312 620 q30 -22 54 -4 t50 -14', '#C0392B', 4, 'stroke-dasharray="8 8"') + L('M410 590 l14 14 m0 -14 l-14 14', '#C0392B', 5)) +
        G('on-0', P('M290 610 l150 -30 l12 50 l-150 30Z', '#FFF1C9') + C(370, 618, 60, 'url(#' + p + 'gold)') + C(370, 618, 22, '#14B884') + L('M360 618 l7 8 l14 -16', '#fff', 5)) +
        // carved sign
        L('M1150 520 V640', '#6B4226', 16) + P('M1040 370 h200 l30 46 l-30 46 h-200Z', '#A8744C') + P('M1052 382 h182 l22 34 l-22 34 h-182Z', '#8A5A3C') + L('M1076 404 h110 M1076 428 h80', '#F4D9A8', 7) +
        G('on-1', C(1250, 362, 22, '#14B884') + L('M1240 362 l7 8 l14 -16', '#fff', 5)) +
        // coins
        coins + G('on-2', C(1110, 760, 90, 'url(#' + p + 'gold)') + C(1200, 708, 22, '#14B884') + L('M1190 708 l7 8 l14 -16', '#fff', 5)) +
        // bottle with a message
        E(1380, 762, 60, 9, 'rgba(0,0,0,.18)') + G('', R(1340, 690, 100, 54, '#7FE0C8', 26, 'opacity=".75"') + R(1436, 704, 26, 26, '#7FE0C8', 6, 'opacity=".75"') + R(1458, 706, 12, 22, '#8A5A3C', 3) + R(1360, 704, 52, 26, '#FFF1C9', 4) + L('M1352 700 h60', '#fff', 4, 'opacity=".7"'), 'transform="rotate(-14 1390 716)"') +
        G('on-4', C(1440, 660, 22, '#14B884') + L('M1430 660 l7 8 l14 -16', '#fff', 5)) +
        // the treasure chest
        E(800, 800, 200, 20, 'rgba(0,0,0,.22)') +
        G('x-open', C(800, 600, 260, 'url(#' + p + 'gold)') + P('M650 640 q0 -120 150 -150 q150 30 150 150Z', '#5E3518', 'transform="rotate(-24 650 640)"') + P('M664 632 q0 -100 136 -128 q136 28 136 128Z', '#7A4320', 'transform="rotate(-24 650 640)"') +
          E(800, 646, 140, 34, '#FFD43B') + [[720, 630], [770, 616], [820, 622], [870, 630], [745, 606], [800, 598], [850, 606]].map(function (c) { return E(c[0], c[1], 24, 12, '#F5AE14') + E(c[0], c[1] - 5, 24, 12, '#FFE066'); }).join('') +
          P('M790 590 l16 -36 l16 36 l-16 14Z', '#5AD1FF') + C(760, 590, 12, '#FF5C8A') + G('ea-twinkle', P('M900 560 l6 16 l16 6 l-16 6 l-6 16 l-6 -16 l-16 -6 l16 -6Z', '#fff'))) +
        G('x-shut', P('M650 640 q0 -120 150 -120 q150 0 150 120Z', '#7A4320') + P('M664 640 q0 -106 136 -106 q136 0 136 106Z', 'url(#' + p + 'chest)') + L('M720 540 V640 M880 540 V640', '#F5AE14', 12)) +
        R(650, 640, 300, 150, 'url(#' + p + 'chest)', 10) + R(650, 640, 300, 22, '#5E3518') + L('M720 640 V790 M880 640 V790', '#F5AE14', 12) + R(650, 772, 300, 18, '#5E3518', 6) +
        G('x-shut', R(774, 632, 52, 62, '#FFD43B', 10) + C(800, 656, 9, '#7A4320') + R(796, 660, 8, 20, '#7A4320', 3));
    }
  };

  // ------------------------------------------------------------------ Night at the Museum
  SCENES.museum = {
    exit: { name: 'The Front Door', x: 1350, y: 230, w: 210, h: 480 },
    spots: [
      { name: 'The Dinosaur Painting', x: 90, y: 190, w: 290, h: 220 },
      { name: 'The Giant Skeleton', x: 470, y: 230, w: 560, h: 480 },
      { name: 'The Fossil Case', x: 130, y: 480, w: 220, h: 240 },
      { name: 'The Tour Sign', x: 1060, y: 400, w: 130, h: 310 },
      { name: 'The Guard’s Flashlight', x: 1200, y: 540, w: 130, h: 100 }
    ],
    art: function (p) {
      var bone = '#F4EAD0', tiles = '';
      for (var i = 0; i < 12; i++) tiles += P('M' + (i * 160 - 160) + ' 900 L' + (400 + i * 73) + ' 710 h73 L' + (i * 160) + ' 900Z', i % 2 ? '#C9D8D4' : '#9FB5B0');
      return '<defs>' + grad(p + 'wall', ['#1F4A4A', '#143233']) + grad(p + 'beam', ['#DDF6FF', 'rgba(221,246,255,0)']) + grad(p + 'day', ['#BFE8FF', '#FFF6D0']) + grad(p + 'art', ['#BFE8FF', '#E9FBD8']) +
        glow(p + 'gold', '#FFD43B') + glow(p + 'torch', '#FFF1B8', 0.4) + '</defs>' +
        R(0, 0, 1600, 900, 'url(#' + p + 'wall)') + R(0, 700, 1600, 200, '#B4C7C2') + tiles + R(0, 700, 1600, 12, '#E9F1EE') + R(0, 660, 1600, 40, '#0F2A2B') +
        // skylight and moonbeam
        P('M620 0 h360 l-40 60 h-280Z', '#0B1E3A') + stars(650, 4, 300, 50, 8, 2) + P('M660 60 h280 l180 640 h-640Z', 'url(#' + p + 'beam)', 'opacity=".22" class="ea-flicker"') +
        // columns
        [420].map(function (x) { return R(x - 34, 110, 68, 590, '#2F6564') + R(x - 46, 96, 92, 26, '#3F8280', 8) + R(x - 46, 676, 92, 26, '#3F8280', 8) + L('M' + (x - 14) + ' 126 V672 M' + (x + 14) + ' 126 V672', '#245453', 6); }).join('') +
        // banner
        R(600, 96, 400, 56, '#E5484D', 8) + T(800, 136, 32, '#fff', 'DINOSAUR HALL') +
        // the painting
        R(90, 190, 290, 220, '#C99A2E', 10) + R(106, 206, 258, 188, 'url(#' + p + 'art)') + P('M106 394 v-40 q60 -30 130 -10 q70 -26 128 4 v46Z', '#7CD67A') +
        P('M170 360 q-6 -60 40 -64 q30 -2 44 20 l40 -70 q10 -16 26 -8 q12 10 2 24 l-36 70 q10 30 -6 44Z', '#5AA86B') + C(318, 250, 4, '#0E1120') + L('M196 360 v24 M250 360 v24', '#5AA86B', 12) +
        P('M330 226 q20 -20 34 -4 q-10 14 -34 4Z', '#2FA860') + P('M336 246 q22 -6 28 12 q-18 6 -28 -12Z', '#2FA860') +
        G('on-0', C(366, 204, 24, '#14B884') + L('M355 204 l8 9 l16 -18', '#fff', 6)) +
        // fossil display case
        R(130, 600, 220, 120, '#2F6564', 8) + R(118, 588, 244, 20, '#3F8280', 6) + R(140, 480, 200, 110, '#BFE8FF', 8, 'opacity=".28"') + R(140, 480, 200, 110, 'none', 8, 'stroke="#DDF6FF" stroke-width="5"') +
        E(240, 580, 60, 10, '#8A7A5C') + L('M240 546 m-30 0 a30 30 0 1 1 30 30 a22 22 0 1 1 -22 -22 a14 14 0 1 1 14 14 a7 7 0 1 1 -7 -7', '#F4EAD0', 8) + R(196, 630, 88, 30, '#F4EAD0', 4) + L('M208 645 h64', '#8A7A5C', 5) +
        G('on-2', C(240, 536, 80, 'url(#' + p + 'gold)') + C(346, 478, 24, '#14B884') + L('M335 478 l8 9 l16 -18', '#fff', 6)) +
        // the skeleton on its plinth
        P('M500 710 l30 -50 h440 l30 50Z', '#3F8280') + R(530, 648, 440, 16, '#55A09D', 6) +
        L('M560 470 Q660 380 780 400 Q880 416 930 470', bone, 20) + L('M560 470 Q520 520 490 600', bone, 14) + L('M490 600 q-14 20 -4 40', bone, 9) +
        [0, 1, 2, 3, 4, 5].map(function (i) { return L('M' + (650 + i * 38) + ' ' + (404 + Math.abs(i - 2.5) * 4) + ' q' + (-10 + i * 2) + ' 70 ' + (10 - i * 3) + ' 120', bone, 9); }).join('') +
        L('M930 470 Q960 400 950 330', bone, 20) + P('M900 250 q20 -40 90 -34 q70 8 80 50 q4 30 -40 36 l-110 4 q-30 -20 -20 -56Z', bone) + P('M930 306 l110 -4 q20 14 -10 26 l-96 4Z', bone) +
        C(966, 258, 13, '#143233') + G('on-1', C(966, 258, 26, 'url(#' + p + 'gold)') + C(966, 258, 8, '#FFD43B')) +
        [0, 1, 2, 3, 4, 5].map(function (i) { return P('M' + (944 + i * 18) + ' 304 l8 16 l8 -16Z', '#fff'); }).join('') +
        L('M720 500 Q700 580 730 648', bone, 18) + L('M730 648 h44', bone, 12) + L('M820 500 Q860 570 830 648', bone, 18) + L('M830 648 h44', bone, 12) +
        L('M890 440 q30 30 20 60', bone, 9) + [0, 1, 2].map(function (i) { return L('M' + (734 + i * 14) + ' 648 l6 10', bone, 6) + L('M' + (834 + i * 14) + ' 648 l6 10', bone, 6); }).join('') +
        // tour sign
        L('M1125 560 V700', '#C99A2E', 10) + E(1125, 704, 44, 8, '#8A6A1E') + R(1060, 400, 130, 170, '#FFF8DC', 10) + R(1060, 400, 130, 40, '#3B7BFF', 10) + T(1125, 429, 24, '#fff', 'TOURS') +
        C(1125, 500, 36, '#fff') + C(1125, 500, 36, 'none', 'stroke="#3B7BFF" stroke-width="6"') + L('M1125 500 V478 M1125 500 l16 8', '#0E1120', 5) +
        G('on-3', C(1188, 402, 24, '#14B884') + L('M1177 402 l8 9 l16 -18', '#fff', 6)) +
        // guard desk and flashlight
        R(1200, 610, 140, 100, '#6B4226', 8) + R(1190, 596, 160, 20, '#8A5A3C', 6) + R(1218, 636, 104, 28, '#5E3920', 4) + C(1270, 650, 6, '#F5AE14') +
        G('off-4', R(1220, 566, 70, 26, '#E5484D', 8) + P('M1290 560 h22 v38 h-22Z', '#B8BCC8') + P('M1312 566 l-90 -140 h-60 l110 150Z', 'url(#' + p + 'torch)', 'opacity="0"')) +
        G('on-4', P('M1312 560 l160 -90 v150 l-160 -22Z', '#FFF1B8', 'opacity=".5"') + R(1220, 566, 70, 26, '#E5484D', 8) + P('M1290 560 h22 v38 h-22Z', '#FFF1B8') + C(1216, 556, 22, '#14B884') + L('M1206 556 l7 8 l14 -16', '#fff', 5)) +
        // the front door
        R(1350, 230, 210, 480, '#0F2A2B', 12) + R(1400, 170, 110, 44, '#0E1120', 8) + G('x-shut', T(1455, 202, 28, '#E5484D', 'EXIT')) + G('x-open', T(1455, 202, 28, '#5BF0A5', 'EXIT')) +
        G('x-open', R(1366, 246, 178, 464, 'url(#' + p + 'day)') + C(1455, 420, 60, '#FFF1B8') + P('M1366 710 l-60 190 h300 l-62 -190Z', '#FFF6D0', 'opacity=".4"') + R(1366, 246, 30, 464, '#6B4226')) +
        G('x-shut', R(1366, 246, 178, 464, '#8A5A3C', 6) + R(1384, 266, 142, 190, '#6B4226', 6) + R(1384, 480, 142, 210, '#6B4226', 6) + C(1520, 480, 11, '#F5C542'));
    }
  };

  // ------------------------------------------------------------------ The Mystery Classroom (teacher-made rooms)
  SCENES.classroom = {
    exit: { name: 'The Classroom Door', x: 1340, y: 220, w: 220, h: 490 },
    spots: [
      { name: 'The Chalkboard', x: 440, y: 150, w: 600, h: 300 },
      { name: 'The Teacher’s Desk', x: 560, y: 560, w: 360, h: 160 },
      { name: 'The Spinning Globe', x: 150, y: 290, w: 150, h: 170 },
      { name: 'The Backpack', x: 1100, y: 560, w: 150, h: 160 },
      { name: 'The Wall Clock', x: 1110, y: 170, w: 130, h: 130 }
    ],
    art: function (p) {
      var books = ['#E5484D', '#F5AE14', '#3B7BFF', '#14B884', '#EC4899', '#8B5CF6'];
      return '<defs>' + grad(p + 'wall', ['#FFE7B8', '#FFD08A']) + grad(p + 'floor', ['#C98F5A', '#A8703E']) + grad(p + 'board', ['#2F6B57', '#1F4D3E']) + grad(p + 'hall', ['#DDF6FF', '#FFF6D0']) + glow(p + 'gold', '#FFD43B') + '</defs>' +
        R(0, 0, 1600, 900, 'url(#' + p + 'wall)') + R(0, 640, 1600, 60, '#F2B766') + R(0, 700, 1600, 200, 'url(#' + p + 'floor)') + planks(700, 200, '#8A5A30', 5) +
        // chalkboard
        R(440, 150, 600, 300, '#8A5A3C', 12) + R(458, 168, 564, 264, 'url(#' + p + 'board)', 4) + R(458, 432, 564, 14, '#6B4226') + R(880, 424, 60, 10, '#fff', 4) + R(950, 424, 44, 12, '#FF8FB8', 4) +
        G('off-0', L('M500 230 h200 M500 280 h280 M500 330 h160', '#fff', 8, 'opacity=".7"') + T(900, 300, 110, '#FFD43B', '?')) +
        G('on-0', L('M660 310 l50 56 l120 -140', '#5BF0A5', 22)) +
        // bookshelf with a globe on top
        shelves(90, 460, 280, 250, 2, 21, ['#8A5A3C', '#5E3920'], books) +
        R(204, 440, 42, 20, '#5E3920', 4) + L('M225 440 V412', '#5E3920', 8) + G('ea-bob', C(225, 360, 58, '#3B9BFF') + P('M190 330 q30 -20 54 0 q10 26 -14 40 q-34 4 -40 -40Z', '#3CCB7F') + P('M236 380 q26 -6 34 14 q-14 20 -34 8Z', '#3CCB7F') + E(205, 340, 12, 22, '#fff', 'opacity=".25"')) +
        L('M170 320 a70 70 0 0 0 80 104', '#C99A2E', 7) + G('on-2', C(292, 300, 22, '#14B884') + L('M282 300 l7 8 l14 -16', '#fff', 5)) +
        // window
        R(90, 150, 280, 130, '#fff', 10) + R(102, 162, 256, 106, '#9AD8FF', 4) + E(180, 250, 70, 20, '#fff', 'opacity=".8"') + C(300, 200, 26, '#FFE066') + L('M230 162 V268', '#fff', 10) +
        // teacher desk
        R(560, 600, 360, 26, '#8A5A3C', 8) + R(580, 626, 320, 94, '#A8744C', 6) + R(600, 644, 120, 56, '#8A5A3C', 6) + C(660, 672, 8, '#F5AE14') + R(760, 644, 120, 56, '#8A5A3C', 6) + C(820, 672, 8, '#F5AE14') +
        C(620, 580, 22, '#E5484D') + L('M620 558 q4 -12 14 -14', '#5E3920', 5) + P('M624 556 q14 -12 22 0 q-10 8 -22 0Z', '#3CCB7F') + R(780, 572, 90, 28, '#3B7BFF', 4) + R(790, 556, 76, 18, '#F5AE14', 4) +
        G('on-1', R(596, 650, 128, 70, '#5E3920', 6) + R(604, 690, 112, 36, '#A8744C', 6) + C(660, 690, 60, 'url(#' + p + 'gold)') + C(660, 690, 20, '#14B884') + L('M651 690 l7 8 l13 -15', '#fff', 5)) +
        // wall clock
        C(1175, 235, 62, '#fff') + C(1175, 235, 62, 'none', 'stroke="#3B7BFF" stroke-width="10"') + L('M1175 235 V196 M1175 235 l26 14', '#0E1120', 7) + C(1175, 235, 7, '#0E1120') +
        G('on-4', C(1175, 235, 100, 'url(#' + p + 'gold)') + C(1232, 180, 22, '#14B884') + L('M1222 180 l7 8 l14 -16', '#fff', 5)) +
        // cubbies and backpack
        R(1080, 430, 200, 120, '#8A5A3C', 8) + R(1094, 444, 80, 92, '#5E3920', 4) + R(1186, 444, 80, 92, '#5E3920', 4) + R(1104, 486, 60, 50, '#FFD43B', 6) + R(1196, 476, 60, 60, '#5BF0A5', 6) +
        E(1175, 722, 70, 10, 'rgba(0,0,0,.18)') + R(1110, 580, 130, 140, '#EC4899', 36) + R(1130, 640, 90, 60, '#D9367F', 14) + L('M1146 584 q29 -44 58 0', '#B82A6A', 12) + R(1166, 662, 18, 10, '#FFD43B', 4) +
        G('on-3', C(1240, 580, 22, '#14B884') + L('M1230 580 l7 8 l14 -16', '#fff', 5)) +
        // door
        R(1340, 220, 220, 490, '#8A5A3C', 10) +
        G('x-open', R(1358, 238, 184, 472, 'url(#' + p + 'hall)') + P('M1358 710 l-70 190 h320 l-66 -190Z', '#fff', 'opacity=".45"') + R(1358, 238, 34, 472, '#3B7BFF')) +
        G('x-shut', R(1358, 238, 184, 472, '#3B7BFF', 4) + R(1390, 270, 120, 130, '#BFE8FF', 8) + R(1380, 440, 140, 240, '#2F66D6', 8) + C(1514, 490, 12, '#FFD43B'));
    }
  };

  TT.escapeScenes = SCENES;
  // The whole picture for a scene, ready to drop into the page.
  // ------------------------------------------------------------------ Rooms that use Kevin's own artwork
  // The room is a picture (assets/escape/<id>.jpg, 1600 x 900). The spots are lined up with the picture,
  // and a glow appears on each thing once its lock is open. The exit lights up when the class escapes.
  function pictureScene(id, spots, exit, tint, strip) {
    SCENES[id].spots = spots; SCENES[id].exit = exit;
    SCENES[id].art = function (p) {
      var out = '<defs>' + glow(p + 'g', tint, 0.45) + glow(p + 'x', '#FFF3C4', 0.5) + '</defs>' +
        '<image href="assets/escape/' + id + '.jpg" x="0" y="0" width="1600" height="900" preserveAspectRatio="xMidYMid slice"/>';
      spots.forEach(function (s, i) {
        out += G('on-' + i, E(s.x + s.w / 2, s.y + s.h / 2, s.w * 0.62, s.h * 0.58, 'url(#' + p + 'g)', 'opacity=".5" style="mix-blend-mode:screen"'));
      });
      return out + G('x-open', E(exit.x + exit.w / 2, exit.y + exit.h / 2, exit.w * 0.75, exit.h * 0.62, 'url(#' + p + 'x)', 'style="mix-blend-mode:screen"') +
        (strip ? R(exit.x + exit.w / 2 - 5, exit.y + 40, 10, exit.h - 40, '#FFF6D0', 5, 'opacity=".95"') : ''));
    };
  }
  pictureScene('library', [
    { name: 'The Tall Bookshelf', x: 50, y: 74, w: 372, h: 668 },
    { name: 'The Dusty Book', x: 518, y: 506, w: 172, h: 92 },
    { name: 'The Pinned Note', x: 812, y: 166, w: 192, h: 204 },
    { name: 'The Door Keypad', x: 1146, y: 376, w: 62, h: 104 },
    { name: 'The Grandfather Clock', x: 1008, y: 160, w: 132, h: 584 }
  ], { name: 'The Library Doors', x: 1208, y: 118, w: 344, h: 620 }, '#FFD76A', true);
  pictureScene('space', [
    { name: 'The Star Map Computer', x: 493, y: 512, w: 483, h: 163 },
    { name: 'The Fuel Tank', x: 1292, y: 536, w: 278, h: 230 },
    { name: 'The Radio Decoder', x: 603, y: 683, w: 252, h: 60 },
    { name: 'The Meal Locker', x: 448, y: 188, w: 126, h: 305 },
    { name: 'The Big Window', x: 813, y: 96, w: 450, h: 354 }
  ], { name: 'The Airlock', x: 62, y: 148, w: 383, h: 360 }, '#FFE08A', false);

  pictureScene('pirate', [
    { name: 'The Treasure Map', x: 77, y: 392, w: 459, h: 278 },
    { name: 'The Carved Sign', x: 75, y: 75, w: 327, h: 146 },
    { name: 'The Pile of Coins', x: 67, y: 766, w: 211, h: 105 },
    { name: 'The Talking Parrot', x: 1191, y: 81, w: 244, h: 310 },
    { name: 'The Message in a Bottle', x: 1316, y: 526, w: 258, h: 105 }
  ], { name: 'The Treasure Chest', x: 878, y: 536, w: 404, h: 306 }, '#FFE08A', false);

  pictureScene('museum', [
    { name: 'The Dinosaur Painting', x: 1247, y: 120, w: 332, h: 254 },
    { name: 'The Giant Skeleton', x: 550, y: 263, w: 690, h: 311 },
    { name: 'The Fossil Case', x: 29, y: 536, w: 316, h: 258 },
    { name: 'The Tour Clock', x: 383, y: 225, w: 139, h: 392 },
    { name: 'The Night Guard’s Book', x: 1287, y: 550, w: 292, h: 140 }
  ], { name: 'The Exit Doors', x: 57, y: 215, w: 280, h: 321 }, '#FFE08A', false);

  TT.escapeArt = function (id, prefix) {
    var s = SCENES[id] || SCENES.classroom;
    return '<svg class="ea" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + s.art(prefix || ('ea' + id)) + '</svg>';
  };
})();
