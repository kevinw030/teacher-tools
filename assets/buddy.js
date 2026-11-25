// Buddies: the little characters students build for themselves in Sidekick Live (Labs preview).
// Every buddy is drawn here as one SVG from a handful of choices, so a saved buddy is tiny:
//   { s: shape, c: body color, e: eyes, m: mouth, t: top, h: hat, x: extra, b: background }
// Some parts are locked until the student earns a badge (Buddy.LOCKS). Used by the student page
// (assets/play.js), the teacher's Labs page (tools/labs.js) and the live game screens.
(function () {
  var B = window.Buddy = {};
  var INK = '#23124F';

  B.COLORS = [
    ['#FF7A59', 'Coral'], ['#FFB627', 'Sunny'], ['#7BD15A', 'Lime'], ['#22C3A6', 'Mint'], ['#3FA9F5', 'Sky'], ['#5B6CFF', 'Blue'],
    ['#9B6BFF', 'Grape'], ['#FF6FAE', 'Bubblegum'], ['#E9465A', 'Cherry'], ['#8C5A3C', 'Cocoa'], ['#F4EDE0', 'Cream'], ['#6B7280', 'Stone'],
    ['#FFD23F', 'Gold']
  ];
  B.BGS = [
    ['#FFE3D6', 'Peach'], ['#FFF1C2', 'Lemon'], ['#DDF5CF', 'Leaf'], ['#CFF4EC', 'Pool'], ['#D6ECFF', 'Cloud'], ['#E2E4FF', 'Lilac'],
    ['#EFE2FF', 'Lavender'], ['#FFE0EF', 'Blossom'], ['#24166B', 'Night'], ['#0F3D3A', 'Forest']
  ];
  B.SHAPES = [['blob', 'Round'], ['bean', 'Bean'], ['box', 'Boxy'], ['pear', 'Pear'], ['drop', 'Drop']];
  B.EYES = [['dots', 'Bright'], ['happy', 'Happy'], ['sleepy', 'Sleepy'], ['sparkle', 'Sparkly'], ['wink', 'Wink'], ['one', 'One Eye']];
  B.MOUTHS = [['smile', 'Smile'], ['grin', 'Big Grin'], ['oh', 'Surprised'], ['tooth', 'Toothy'], ['cat', 'Kitty'], ['tongue', 'Silly']];
  B.TOPS = [['none', 'None'], ['ears', 'Round Ears'], ['bunny', 'Long Ears'], ['antenna', 'Antennas'], ['horns', 'Horns'], ['sprout', 'Sprout'], ['tuft', 'Hair Tuft']];
  B.HATS = [['none', 'None'], ['cap', 'Ball Cap'], ['beanie', 'Beanie'], ['party', 'Party Hat'], ['bow', 'Big Bow'], ['phones', 'Headphones'], ['flowers', 'Flower Crown'], ['wizard', 'Wizard Hat'], ['crown', 'Crown']];
  B.EXTRAS = [['none', 'None'], ['cheeks', 'Rosy Cheeks'], ['freckles', 'Freckles'], ['glasses', 'Glasses'], ['shades', 'Star Shades'], ['scarf', 'Scarf'], ['bowtie', 'Bow Tie']];
  // Parts that open with a badge: [part, value] -> badge key (see assets/labs-badges.js).
  B.LOCKS = { 'h:crown': 'champion', 'h:wizard': 'streak10', 'h:flowers': 'garden', 'h:phones': 'games10', 'x:shades': 'quick', 'c:12': 'right100' };
  B.locked = function (part, value, badges) {
    var need = B.LOCKS[part + ':' + value];
    return need && !(badges && badges[need]) ? need : '';
  };

  // A tidy buddy with every value checked (old or hand-edited saves can't break the drawing).
  function pickKey(list, v, d) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return v; return d; }
  function pickNum(list, v, d) { v = +v; return v >= 0 && v < list.length && v === Math.floor(v) ? v : d; }
  B.clean = function (o) {
    o = o || {};
    return { s: pickKey(B.SHAPES, o.s, 'blob'), c: pickNum(B.COLORS, o.c, 4), e: pickKey(B.EYES, o.e, 'dots'), m: pickKey(B.MOUTHS, o.m, 'smile'),
      t: pickKey(B.TOPS, o.t, 'none'), h: pickKey(B.HATS, o.h, 'none'), x: pickKey(B.EXTRAS, o.x, 'none'), b: pickNum(B.BGS, o.b, 4) };
  };
  // A random starting buddy (no locked parts), seeded so a student keeps the same one until they edit it.
  B.random = function (seed) {
    var n = 0, s = String(seed || Math.random());
    for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
    function r(len) { n = (n * 1103515245 + 12345) >>> 0; return (n >>> 8) % len; }
    var o = { s: B.SHAPES[r(5)][0], c: r(12), e: B.EYES[r(5)][0], m: B.MOUTHS[r(6)][0], t: B.TOPS[r(7)][0], h: 'none', x: 'none', b: r(8) };
    return o;
  };
  B.isEmpty = function (o) { return !o || !o.s; };
  B.of = function (o, seed) { return B.clean(B.isEmpty(o) ? B.random(seed) : o); };

  function mix(hex, to, amt) {
    var a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
    var r = Math.round(((a >> 16) & 255) * (1 - amt) + ((b >> 16) & 255) * amt);
    var g = Math.round(((a >> 8) & 255) * (1 - amt) + ((b >> 8) & 255) * amt);
    var bl = Math.round((a & 255) * (1 - amt) + (b & 255) * amt);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  // Each shape: its outline, where the top of its head is, and how wide the head is there.
  var SHAPE = {
    blob: { d: 'M100 60c36 0 62 26 62 62v80H38v-80c0-36 26-62 62-62z', top: 60, w: 58 },
    bean: { d: 'M100 52c27 0 46 19 46 46v104H54V98c0-27 19-46 46-46z', top: 52, w: 44 },
    box: { d: 'M74 66h52c16 0 28 12 28 28v108H46V94c0-16 12-28 28-28z', top: 66, w: 52 },
    pear: { d: 'M100 62c22 0 38 16 40 38 2 18 26 32 26 62v40H34v-40c0-30 24-44 26-62 2-22 18-38 40-38z', top: 62, w: 38 },
    drop: { d: 'M100 40c10 18 58 50 58 92v70H42v-70c0-42 48-74 58-92z', top: 52, w: 34 }
  };
  var S = 'stroke="' + INK + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';

  function eyes(kind) {
    var L = 80, R = 120, y = 108;
    function dot(x) { return '<circle cx="' + x + '" cy="' + y + '" r="12" fill="#fff" ' + S + '/><circle cx="' + (x + 2) + '" cy="' + (y + 1) + '" r="6" fill="' + INK + '"/><circle cx="' + (x + 4) + '" cy="' + (y - 2) + '" r="2" fill="#fff"/>'; }
    function arc(x) { return '<path d="M' + (x - 10) + ' ' + (y + 3) + 'q10 -14 20 0" fill="none" ' + S + ' stroke-width="6"/>'; }
    if (kind === 'happy') return arc(L) + arc(R);
    if (kind === 'sleepy') return [L, R].map(function (x) {
      return '<circle cx="' + x + '" cy="' + y + '" r="12" fill="#fff" ' + S + '/><circle cx="' + x + '" cy="' + (y + 4) + '" r="5.5" fill="' + INK + '"/>' +
        '<path d="M' + (x - 13) + ' ' + y + 'a13 13 0 0 1 26 0z" fill="' + INK + '" opacity=".85"/>';
    }).join('');
    if (kind === 'sparkle') return [L, R].map(function (x) {
      return '<circle cx="' + x + '" cy="' + y + '" r="14" fill="' + INK + '"/><circle cx="' + (x + 5) + '" cy="' + (y - 5) + '" r="4.5" fill="#fff"/><circle cx="' + (x - 5) + '" cy="' + (y + 5) + '" r="2.2" fill="#fff"/>';
    }).join('');
    if (kind === 'wink') return dot(L) + arc(R);
    if (kind === 'one') return '<circle cx="100" cy="' + (y - 2) + '" r="19" fill="#fff" ' + S + '/><circle cx="102" cy="' + y + '" r="9" fill="' + INK + '"/><circle cx="105" cy="' + (y - 4) + '" r="3" fill="#fff"/>';
    return dot(L) + dot(R);
  }
  function mouth(kind) {
    var y = 138;
    if (kind === 'grin') return '<path d="M80 ' + (y - 4) + 'h40c0 16-9 24-20 24s-20-8-20-24z" fill="' + INK + '" ' + S + '/><path d="M90 ' + (y + 14) + 'c4-6 16-6 20 0-6 5-14 5-20 0z" fill="#FF7A8A"/>';
    if (kind === 'oh') return '<ellipse cx="100" cy="' + (y + 2) + '" rx="8" ry="10" fill="' + INK + '"/>';
    if (kind === 'tooth') return '<path d="M82 ' + (y - 2) + 'q18 18 36 0" fill="none" ' + S + '/><path d="M94 ' + (y + 4) + 'h10v8h-10z" fill="#fff" ' + S + ' stroke-width="3"/>';
    if (kind === 'cat') return '<path d="M84 ' + (y - 2) + 'q8 10 16 0q8 10 16 0" fill="none" ' + S + '/>';
    if (kind === 'tongue') return '<path d="M82 ' + (y - 2) + 'q18 16 36 0" fill="none" ' + S + '/><path d="M98 ' + (y + 5) + 'h14v6a7 7 0 0 1-14 0z" fill="#FF7A8A" ' + S + ' stroke-width="3.5"/>';
    return '<path d="M82 ' + (y - 2) + 'q18 18 36 0" fill="none" ' + S + '/>';
  }
  function top(kind, sh, body, dark) {
    var t = sh.top, w = sh.w;
    if (kind === 'ears') return '<circle cx="' + (100 - w) + '" cy="' + (t + 14) + '" r="17" fill="' + body + '" ' + S + '/><circle cx="' + (100 + w) + '" cy="' + (t + 14) + '" r="17" fill="' + body + '" ' + S + '/>' +
      '<circle cx="' + (100 - w) + '" cy="' + (t + 14) + '" r="8" fill="' + dark + '"/><circle cx="' + (100 + w) + '" cy="' + (t + 14) + '" r="8" fill="' + dark + '"/>';
    if (kind === 'bunny') return '<path d="M' + (88 - w * 0.4) + ' ' + (t + 12) + 'c-10-30-8-52 2-54s16 26 12 52z" fill="' + body + '" ' + S + '/><path d="M' + (112 + w * 0.4) + ' ' + (t + 12) + 'c10-30 8-52-2-54s-16 26-12 52z" fill="' + body + '" ' + S + '/>';
    if (kind === 'antenna') return '<path d="M86 ' + (t + 4) + 'l-12-30M114 ' + (t + 4) + 'l12-30" ' + S + ' fill="none"/><circle cx="74" cy="' + (t - 28) + '" r="8" fill="#FFC233" ' + S + ' stroke-width="4"/><circle cx="126" cy="' + (t - 28) + '" r="8" fill="#FFC233" ' + S + ' stroke-width="4"/>';
    if (kind === 'horns') return '<path d="M' + (82 - w * 0.2) + ' ' + (t + 8) + 'q-14-12-10-30q10 10 22 24z" fill="#FFF3D6" ' + S + ' stroke-width="4"/><path d="M' + (118 + w * 0.2) + ' ' + (t + 8) + 'q14-12 10-30q-10 10-22 24z" fill="#FFF3D6" ' + S + ' stroke-width="4"/>';
    if (kind === 'sprout') return '<path d="M100 ' + (t + 2) + 'v-22" ' + S + ' fill="none"/><path d="M100 ' + (t - 18) + 'c-4-16-22-18-28-10 6 10 22 14 28 10z" fill="#7BD15A" ' + S + ' stroke-width="4"/><path d="M100 ' + (t - 14) + 'c4-14 20-16 26-8-6 9-20 12-26 8z" fill="#5FB33E" ' + S + ' stroke-width="4"/>';
    if (kind === 'tuft') return '<path d="M86 ' + (t + 6) + 'c-2-14 4-24 10-28 0 8 2 12 6 14 2-8 8-14 14-14-4 8-2 18-6 28z" fill="' + dark + '" ' + S + ' stroke-width="4"/>';
    return '';
  }
  function hat(kind, sh) {
    var t = sh.top, w = Math.max(sh.w, 40);
    if (kind === 'cap') return '<path d="M' + (100 - w) + ' ' + (t + 14) + 'c0-24 18-36 ' + w + '-36s' + w + ' 12 ' + w + ' 36z" fill="#2F6BFF" ' + S + '/><path d="M' + (100 + w - 4) + ' ' + (t + 12) + 'h34c4 0 4 8-2 9l-32 3z" fill="#1E4FD1" ' + S + ' stroke-width="4"/><circle cx="100" cy="' + (t - 22) + '" r="5" fill="#FFC233" ' + S + ' stroke-width="3"/>';
    if (kind === 'beanie') return '<path d="M' + (100 - w) + ' ' + (t + 12) + 'c0-28 20-40 ' + w + '-40s' + w + ' 12 ' + w + ' 40z" fill="#E9465A" ' + S + '/><rect x="' + (100 - w - 4) + '" y="' + (t + 4) + '" width="' + (2 * w + 8) + '" height="16" rx="8" fill="#FFB627" ' + S + ' stroke-width="4"/><circle cx="100" cy="' + (t - 30) + '" r="10" fill="#FFF3D6" ' + S + ' stroke-width="4"/>';
    if (kind === 'party') return '<path d="M80 ' + (t + 8) + 'l20-50 20 50z" fill="#9B6BFF" ' + S + '/><path d="M86 ' + (t - 6) + 'l28 0M92 ' + (t - 22) + 'l16 0" stroke="#FFD23F" stroke-width="6" stroke-linecap="round"/><circle cx="100" cy="' + (t - 44) + '" r="7" fill="#FF6FAE" ' + S + ' stroke-width="3.5"/>';
    if (kind === 'bow') return '<g transform="translate(' + (100 + w * 0.55) + ' ' + (t + 4) + ') rotate(14)"><path d="M0 0l-26-16c-6 10-6 22 0 32zM0 0l26-16c6 10 6 22 0 32z" fill="#FF6FAE" ' + S + ' stroke-width="4"/><circle r="8" fill="#E9465A" ' + S + ' stroke-width="4"/></g>';
    if (kind === 'phones') return '<path d="M' + (100 - w - 6) + ' ' + (t + 40) + 'c0-44 20-58 ' + (w + 6) + '-58s' + (w + 6) + ' 14 ' + (w + 6) + ' 58" fill="none" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/><path d="M' + (100 - w - 6) + ' ' + (t + 40) + 'c0-44 20-58 ' + (w + 6) + '-58s' + (w + 6) + ' 14 ' + (w + 6) + ' 58" fill="none" stroke="#22C3A6" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="' + (100 - w - 18) + '" y="' + (t + 30) + '" width="22" height="34" rx="10" fill="#22C3A6" ' + S + ' stroke-width="4"/><rect x="' + (100 + w - 4) + '" y="' + (t + 30) + '" width="22" height="34" rx="10" fill="#22C3A6" ' + S + ' stroke-width="4"/>';
    if (kind === 'flowers') return [-1.6, -0.8, 0, 0.8, 1.6].map(function (k, i) {
      var x = 100 + k * w * 0.62, y = t + 6 + Math.abs(k) * 6, c = ['#FF6FAE', '#FFD23F', '#FF7A59', '#9B6BFF', '#3FA9F5'][i];
      return '<g transform="translate(' + x + ' ' + y + ')"><circle cx="0" cy="-7" r="6" fill="' + c + '"/><circle cx="7" cy="0" r="6" fill="' + c + '"/><circle cx="0" cy="7" r="6" fill="' + c + '"/><circle cx="-7" cy="0" r="6" fill="' + c + '"/><circle r="4.5" fill="#FFF3D6" stroke="' + INK + '" stroke-width="2.5"/></g>';
    }).join('');
    if (kind === 'wizard') return '<path d="M' + (100 - w - 12) + ' ' + (t + 10) + 'h' + (2 * w + 24) + 'c-14-6-28-8-40-8l-6-50c-2-10-14-10-22-4l12 8-14 46c-12 0-24 2-36 8z" fill="#5B3FD6" ' + S + '/><path d="M96 ' + (t - 24) + 'l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#FFD23F"/>';
    if (kind === 'crown') return '<path d="M74 ' + (t + 8) + 'l-4-36 16 14 14-22 14 22 16-14-4 36z" fill="#FFD23F" ' + S + '/><circle cx="100" cy="' + (t - 4) + '" r="5" fill="#E9465A" ' + S + ' stroke-width="3"/><circle cx="84" cy="' + t + '" r="3.5" fill="#3FA9F5"/><circle cx="116" cy="' + t + '" r="3.5" fill="#3FA9F5"/>';
    return '';
  }
  function extra(kind) {
    var y = 108;
    if (kind === 'cheeks') return '<ellipse cx="68" cy="128" rx="9" ry="6" fill="#FF6F91" opacity=".55"/><ellipse cx="132" cy="128" rx="9" ry="6" fill="#FF6F91" opacity=".55"/>';
    if (kind === 'freckles') return [[64, 124], [70, 130], [74, 122], [126, 122], [130, 130], [136, 124]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.3" fill="' + INK + '" opacity=".55"/>'; }).join('');
    if (kind === 'glasses') return '<circle cx="80" cy="' + y + '" r="17" fill="rgba(255,255,255,.18)" stroke="' + INK + '" stroke-width="5"/><circle cx="120" cy="' + y + '" r="17" fill="rgba(255,255,255,.18)" stroke="' + INK + '" stroke-width="5"/><path d="M97 ' + y + 'h6" stroke="' + INK + '" stroke-width="5"/>';
    if (kind === 'shades') return [80, 120].map(function (x) {
      return '<path transform="translate(' + x + ' ' + (y + 1) + ') scale(1.25)" d="M0 -15l4.4 9.2 10 1.3-7.3 7 1.8 10L0 7.7l-8.9 4.8 1.8-10-7.3-7 10-1.3z" fill="#FF6FAE" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
    }).join('') + '<path d="M95 ' + (y - 2) + 'q5-4 10 0" stroke="' + INK + '" stroke-width="4" fill="none"/>';
    if (kind === 'scarf') return '<path d="M52 166c30 12 66 12 96 0l4 16c-32 14-72 14-104 0z" fill="#E9465A" ' + S + ' stroke-width="4"/><path d="M118 176l6 24h16l-6-26z" fill="#E9465A" ' + S + ' stroke-width="4"/><path d="M70 172l-2 12M88 175v12M106 175v12" stroke="#FFD23F" stroke-width="4" stroke-linecap="round"/>';
    if (kind === 'bowtie') return '<path d="M100 172l-22-12v26zM100 172l22-12v26z" fill="#3FA9F5" ' + S + ' stroke-width="4"/><circle cx="100" cy="172" r="6" fill="#2F6BFF" ' + S + ' stroke-width="3.5"/>';
    return '';
  }

  var uid = 0;
  // The buddy as an SVG string. opts: { round: false for no circle background }
  B.svg = function (o, opts) {
    o = B.clean(o); opts = opts || {};
    var sh = SHAPE[o.s], body = B.COLORS[o.c][0], bg = B.BGS[o.b][0];
    var dark = mix(body, INK, 0.28), belly = mix(body, '#FFFFFF', 0.42), shine = mix(body, '#FFFFFF', 0.6);
    var id = 'bd' + (++uid), round = opts.round !== false;
    var parts = '';
    parts += top(o.t, sh, body, dark);
    parts += '<path d="' + sh.d + '" fill="' + body + '" ' + S + '/>';
    parts += '<ellipse cx="100" cy="196" rx="' + (sh.w + 4) + '" ry="34" fill="' + belly + '"/>';
    parts += '<path d="M' + (100 - sh.w * 0.7) + ' ' + (sh.top + 28) + 'q8-14 22-16" stroke="' + shine + '" stroke-width="7" stroke-linecap="round" fill="none"/>';
    parts += eyes(o.e) + mouth(o.m) + extra(o.x) + hat(o.h, sh);
    var inner = round
      ? '<defs><clipPath id="' + id + '"><circle cx="100" cy="100" r="96"/></clipPath></defs><circle cx="100" cy="100" r="96" fill="' + bg + '"/>' +
        '<circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="6" transform="scale(.94) translate(6.4 6.4)"/>' +
        '<g clip-path="url(#' + id + ')"><g transform="translate(0 6)">' + parts + '</g></g>'
      : '<g transform="translate(0 6)">' + parts + '</g>';
    return '<svg class="buddy-svg" viewBox="0 0 200 200" role="img" aria-label="Buddy">' + inner + '</svg>';
  };
  B.el = function (o, cls) {
    var span = document.createElement('span');
    span.className = 'buddy ' + (cls || '');
    span.innerHTML = B.svg(o);
    return span;
  };

  // ---------- The buddy maker ----------
  // B.editor(box, buddy, { badges, badgeName(key), onChange(buddy) }) builds tabs of big choice tiles.
  B.editor = function (box, start, opts) {
    opts = opts || {};
    var cur = B.clean(start);
    var TABS = [
      ['s', 'Body', B.SHAPES], ['c', 'Color', B.COLORS], ['e', 'Eyes', B.EYES], ['m', 'Mouth', B.MOUTHS],
      ['t', 'Top', B.TOPS], ['h', 'Hat', B.HATS], ['x', 'Extras', B.EXTRAS], ['b', 'Background', B.BGS]
    ];
    var tab = 's';
    box.textContent = '';
    box.classList.add('bm');
    var preview = document.createElement('div'); preview.className = 'bm-preview';
    var tabs = document.createElement('div'); tabs.className = 'bm-tabs'; tabs.setAttribute('role', 'tablist');
    var grid = document.createElement('div'); grid.className = 'bm-grid';
    var note = document.createElement('p'); note.className = 'bm-note'; note.hidden = true;
    box.append(preview, tabs, grid, note);
    function paintPreview() { preview.innerHTML = B.svg(cur); }
    function paintTabs() {
      tabs.textContent = '';
      TABS.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'bm-tab' + (t[0] === tab ? ' on' : ''); b.textContent = t[1];
        b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', t[0] === tab ? 'true' : 'false');
        b.onclick = function () { tab = t[0]; note.hidden = true; paintTabs(); paintGrid(); };
        tabs.append(b);
      });
    }
    function paintGrid() {
      var t = TABS.filter(function (x) { return x[0] === tab; })[0];
      grid.textContent = '';
      t[2].forEach(function (item, i) {
        var value = tab === 'c' || tab === 'b' ? i : item[0];
        var trial = Object.assign({}, cur); trial[tab] = value;
        var lock = B.locked(tab, value, opts.badges);
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'bm-opt' + (cur[tab] === value ? ' on' : '') + (lock ? ' locked' : '');
        b.setAttribute('aria-pressed', cur[tab] === value ? 'true' : 'false');
        b.setAttribute('aria-label', item[1] + (lock ? ', locked' : ''));
        if (tab === 'c' || tab === 'b') b.innerHTML = '<span class="bm-swatch" style="background:' + item[0] + '"></span>';
        else b.innerHTML = B.svg(trial);
        var label = document.createElement('span'); label.className = 'bm-opt-n'; label.textContent = item[1];
        b.append(label);
        if (lock) {
          var l = document.createElement('span'); l.className = 'bm-lock';
          l.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
          b.append(l);
        }
        b.onclick = function () {
          if (lock) {
            note.textContent = 'Earn the ' + (opts.badgeName ? opts.badgeName(lock) : lock) + ' badge to unlock the ' + item[1] + '!';
            note.hidden = false; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
            return;
          }
          note.hidden = true;
          cur[tab] = value; paintPreview(); paintGrid();
          preview.classList.remove('boing'); void preview.offsetWidth; preview.classList.add('boing');
          if (opts.onChange) opts.onChange(Object.assign({}, cur));
        };
        grid.append(b);
      });
    }
    paintPreview(); paintTabs(); paintGrid();
    return {
      value: function () { return Object.assign({}, cur); },
      set: function (o) { cur = B.clean(o); paintPreview(); paintGrid(); },
      surprise: function () {
        var o = B.random(Math.random()), keep = cur;
        cur = B.clean(o);
        // Surprise can use any part the student has unlocked, hats and extras too.
        [['h', B.HATS], ['x', B.EXTRAS]].forEach(function (p) {
          var open = p[1].filter(function (it) { return !B.locked(p[0], it[0], opts.badges); });
          cur[p[0]] = open[Math.floor(Math.random() * open.length)][0];
        });
        void keep; paintPreview(); paintGrid();
        if (opts.onChange) opts.onChange(Object.assign({}, cur));
      }
    };
  };
})();
