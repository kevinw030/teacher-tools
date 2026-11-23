// Name Wheel: a colorful spinning wheel that lands on a name.
(function () {
  var TT = window.TT, h = TT.h;
  var KEY = 'wheel';
  // Color themes: [id, name, colors]
  var THEMES = [
    ['classic', 'Classic', ['#3B7BFF', '#FF7448', '#14B884', '#F5AE14', '#8B5CF6', '#EC4899', '#0EA5E9', '#7CB518']],
    ['rainbow', 'Rainbow', ['#EF4444', '#FB923C', '#FBBF24', '#22C55E', '#22D3EE', '#3B82F6', '#8B5CF6', '#FF4FA3']],
    ['pastel', 'Pastel', ['#FFC8DD', '#FFE5A8', '#CDEAC0', '#BDE0FE', '#D7C8F5', '#FFD6BA', '#B8E8E0', '#F6C6EA']],
    ['sunset', 'Sunset', ['#FF6B6B', '#FF9F45', '#FFD166', '#F4845F', '#C9485B', '#8E44AD', '#F7B267', '#E56B6F']],
    ['ocean', 'Ocean', ['#0B5FA5', '#1E96C8', '#48CAE4', '#90E0EF', '#0077B6', '#00B4A0', '#3A7CA5', '#7BDFF2']],
    ['forest', 'Forest', ['#2D6A4F', '#52B788', '#95D5B2', '#B7B25A', '#6B8F3C', '#40916C', '#A3B18A', '#588157']],
    ['candy', 'Candy', ['#FF4FA3', '#A855F7', '#22D3EE', '#FDE047', '#FB7185', '#60A5FA', '#F472B6', '#34D399']],
    ['neon', 'Neon', ['#FF2E88', '#00E5FF', '#B6FF00', '#FF9100', '#9D4EDD', '#00F5A0', '#FFE600', '#3D5AFE']],
    ['earth', 'Earth', ['#B5651D', '#DDA15E', '#606C38', '#BC6C25', '#8D6E63', '#A3B18A', '#E0A458', '#6B705C']],
    ['berry', 'Berry', ['#7B2CBF', '#C77DFF', '#E0457B', '#FF8FAB', '#5A189A', '#F15BB5', '#9D4EDD', '#FF5D8F']],
    ['school', 'School Colors', ['#1D3557', '#F4B400']],
    ['chalk', 'Chalkboard', ['#1F2937', '#374151', '#4B5563', '#111827']]
  ];
  var TIMES = { short: [2600, 3], normal: [5200, 5.5], long: [8500, 8] };
  var SIZES = { s: 0.8, m: 1, l: 1.22 };
  function lum(hex) { var n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000; }

  TT.mountWheel = function (el, side) {
    var state = TT.load(KEY, { source: 'class', custom: 'Pizza party\nExtra recess\nPick the music\nTeacher’s helper\nHomework pass\nFree draw', removed: [], history: [] });
    var rot = 0, spinning = false;
    if (!state.style) state.style = {};
    var st = state.style;
    if (!st.theme) st.theme = 'classic';
    if (!Array.isArray(st.custom) || st.custom.length < 2) st.custom = ['#3B7BFF', '#FF7448', '#14B884', '#F5AE14'];
    if (!TIMES[st.time]) st.time = 'normal';
    if (!SIZES[st.size]) st.size = 'm';
    if (typeof st.hub !== 'string') st.hub = 'SPIN';
    if (st.auto !== 'always') st.auto = 'ask';
    function colors() {
      if (st.theme === 'custom') return st.custom;
      var t = THEMES.filter(function (x) { return x[0] === st.theme; })[0] || THEMES[0];
      return t[2];
    }

    var canvas = h('canvas', { class: 'wheel-canvas', role: 'img', 'aria-label': 'Name wheel' });
    var hub = h('button', { type: 'button', class: 'wheel-hub', onclick: spin }, st.hub || 'SPIN');
    var pointer = h('div', { class: 'wheel-pointer', 'aria-hidden': 'true' });
    var stage = h('div', { class: 'wheel-stage' }, canvas, hub, pointer);
    var result = h('div', { class: 'wheel-result', hidden: true, role: 'dialog', 'aria-live': 'assertive' });
    var hint = h('p', { class: 'muted wheel-hint', text: 'Click the wheel or press the space bar to spin.' });
    el.append(h('div', { class: 'wheel' }, h('div', { class: 'wheel-wrap' }, stage, result), hint));
    canvas.addEventListener('click', spin);

    // ----- Side panel: entries -----
    var srcClass = h('button', { type: 'button', class: 'seg', onclick: function () { setSource('class'); } }, 'Class List');
    var srcCustom = h('button', { type: 'button', class: 'seg', onclick: function () { setSource('custom'); } }, 'My Own List');
    var area = h('textarea', { class: 'roster-input', id: 'wheelCustom', rows: 10, 'aria-label': 'Wheel entries, one per line' });
    area.value = state.custom;
    area.addEventListener('input', function () { state.custom = area.value; state.removed = []; save(); draw(); paintSide(); });
    var classInfo = h('p', { class: 'roster-note' });
    var removedBox = h('div', { class: 'chips small' });
    var historyBox = h('ol', { class: 'wheel-history' });
    // ----- Side panel: wheel style (themes first, extra options tucked under Advanced) -----
    function mini(cols) {
      var n = cols.length, stops = cols.map(function (c, i) { return c + ' ' + (i / n * 100) + '% ' + ((i + 1) / n * 100) + '%'; });
      return 'conic-gradient(' + stops.join(', ') + ')';
    }
    var themeGrid = h('div', { class: 'wh-themes', role: 'group', 'aria-label': 'Color theme' });
    var customRow = h('div', { class: 'wh-custom' });
    function segs(key, opts, label) {
      var box = h('div', { class: 'segmented wh-seg', role: 'group', 'aria-label': label });
      opts.forEach(function (o) {
        box.append(h('button', { type: 'button', class: 'seg', 'data-v': o[0], text: o[1], onclick: function () { st[key] = o[0]; save(); paintStyle(); draw(); } }));
      });
      return box;
    }
    var timeSeg = segs('time', [['short', 'Quick'], ['normal', 'Normal'], ['long', 'Long']], 'Spin length');
    var sizeSeg = segs('size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']], 'Name size');
    var autoSeg = segs('auto', [['ask', 'Ask Me'], ['always', 'Always']], 'Take the winner off the wheel');
    var hubInput = h('input', { type: 'text', class: 'wh-input', id: 'wheelHub', maxlength: 8, 'aria-label': 'Word on the center button', value: st.hub });
    hubInput.addEventListener('input', function () { st.hub = hubInput.value.trim(); hub.textContent = st.hub || 'SPIN'; save(); });
    function opt(label, control) { return h('div', { class: 'wh-opt' }, h('span', { class: 'wh-opt-label', text: label }), control); }
    var styleBox = h('details', { class: 'wh-style', open: true },
      h('summary', { text: 'Wheel Style' }),
      h('span', { class: 'wh-sub', text: 'Color Theme' }), themeGrid, customRow,
      h('details', { class: 'wh-adv' },
        h('summary', { text: 'Advanced Options' }),
        opt('Spin Length', timeSeg), opt('Name Size', sizeSeg), opt('Take Winner Off', autoSeg), opt('Center Button Word', hubInput)));
    function paintStyle() {
      themeGrid.textContent = '';
      THEMES.concat([['custom', 'My Colors', st.custom]]).forEach(function (t) {
        themeGrid.append(h('button', { type: 'button', class: 'wh-theme' + (st.theme === t[0] ? ' on' : ''), 'aria-pressed': st.theme === t[0] ? 'true' : 'false', title: t[1],
          onclick: function () { st.theme = t[0]; save(); paintStyle(); draw(); } },
          h('i', { style: 'background:' + mini(t[2]) }), h('span', { text: t[1] })));
      });
      customRow.textContent = ''; customRow.hidden = st.theme !== 'custom';
      if (st.theme === 'custom') {
        st.custom.forEach(function (c, i) {
          var inp = h('input', { type: 'color', class: 'wh-color', value: c, 'aria-label': 'Color ' + (i + 1), title: 'Change This Color' });
          inp.addEventListener('input', function () { st.custom[i] = inp.value; save(); draw(); });
          inp.addEventListener('change', paintStyle);
          customRow.append(inp);
        });
        if (st.custom.length < 8) customRow.append(h('button', { type: 'button', class: 'wh-mini', title: 'Add a Color', 'aria-label': 'Add a color', text: '+', onclick: function () { st.custom.push('#EC4899'); save(); paintStyle(); draw(); } }));
        if (st.custom.length > 2) customRow.append(h('button', { type: 'button', class: 'wh-mini', title: 'Remove the Last Color', 'aria-label': 'Remove the last color', text: '−', onclick: function () { st.custom.pop(); save(); paintStyle(); draw(); } }));
      }
      [[timeSeg, 'time'], [sizeSeg, 'size'], [autoSeg, 'auto']].forEach(function (p) {
        var now = st[p[1]];
        [].forEach.call(p[0].children, function (b) { b.classList.toggle('on', b.getAttribute('data-v') === now); });
      });
    }
    paintStyle();

    side.append(h('div', { class: 'roster' },
      h('div', { class: 'segmented', role: 'group', 'aria-label': 'What goes on the wheel' }, srcClass, srcCustom),
      classInfo, area,
      h('div', { class: 'row' },
        TT.button('Shuffle', { icon: 'shuffle', kind: 'small', onclick: function () { shuffled = TT.shuffle(entries()); draw(); } }),
        TT.button('Put Everyone Back', { icon: 'reset', kind: 'small', onclick: function () { state.removed = []; save(); shuffled = null; draw(); paintSide(); } })),
      styleBox,
      h('div', { class: 'picked-head' }, h('h3', { text: 'Taken Off the Wheel' })), removedBox,
      h('div', { class: 'picked-head' }, h('h3', { text: 'Results' }),
        TT.button('Clear', { kind: 'small', onclick: function () { state.history = []; save(); paintSide(); } })),
      historyBox));

    var shuffled = null;
    function save() { TT.save(KEY, state); }
    function allEntries() {
      return state.source === 'class' ? TT.roster.present() : state.custom.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    }
    function entries() {
      var list = allEntries().filter(function (n) { return state.removed.indexOf(n) < 0; });
      if (shuffled) {
        var keep = shuffled.filter(function (n) { return list.indexOf(n) >= 0; });
        list.forEach(function (n) { if (keep.indexOf(n) < 0) keep.push(n); });
        return keep;
      }
      return list;
    }
    function setSource(s) { state.source = s; state.removed = []; shuffled = null; save(); draw(); paintSide(); }

    function paintSide() {
      srcClass.classList.toggle('on', state.source === 'class');
      srcCustom.classList.toggle('on', state.source === 'custom');
      area.hidden = state.source !== 'custom';
      classInfo.hidden = state.source !== 'class';
      classInfo.textContent = TT.roster.isSample()
        ? 'Using sample names. Add your class on the Name Picker or Group Maker page.'
        : 'Using “' + TT.roster.activeName() + '”: ' + TT.roster.present().length + ' students here today. Change classes on the Name Picker page.';
      classInfo.classList.toggle('warn', TT.roster.isSample());
      removedBox.textContent = '';
      if (!state.removed.length) removedBox.append(h('span', { class: 'muted', text: 'Nobody yet.' }));
      state.removed.forEach(function (n) {
        removedBox.append(h('button', { type: 'button', class: 'chip', title: 'Put Back on the Wheel', onclick: function () {
          state.removed.splice(state.removed.indexOf(n), 1); save(); draw(); paintSide();
        } }, n + ' ↺'));
      });
      historyBox.textContent = '';
      if (!state.history.length) historyBox.append(h('li', { class: 'muted', text: 'Spin to see results here.' }));
      state.history.slice(0, 12).forEach(function (n) { historyBox.append(h('li', { text: n })); });
    }

    // ----- Drawing -----
    function draw() {
      var list = entries();
      var size = canvas.clientWidth || 560;
      var dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(size * dpr)) { canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr); }
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      var cx = size / 2, R = size / 2 - 6;
      ctx.save();
      ctx.translate(cx, cx);
      // rim shadow
      ctx.beginPath(); ctx.arc(0, 0, R + 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(14,17,32,.12)'; ctx.fill();
      if (!list.length) {
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = '#E3E6EF'; ctx.fill();
        ctx.restore(); return;
      }
      var seg = Math.PI * 2 / list.length;
      var fontSize = Math.max(11, Math.min(R * 0.13, (R * seg) * 0.42, 40) * SIZES[st.size]);
      list.forEach(function (name, i) {
        var a0 = i * seg, a1 = a0 + seg;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a1); ctx.closePath();
        var COLORS = colors(), color = COLORS[i % COLORS.length];
        if (COLORS.length > 2 && list.length % COLORS.length === 1 && i === list.length - 1) color = COLORS[(i + 2) % COLORS.length];
        var dark = lum(color) > 170;
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = list.length > 40 ? 1 : 2; ctx.stroke();
        ctx.save();
        ctx.rotate(a0 + seg / 2);
        ctx.fillStyle = dark ? '#0E1120' : '#fff';
        ctx.font = '700 ' + fontSize + 'px "Gabarito", "Plus Jakarta Sans", "Segoe UI", sans-serif';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        if (!dark) { ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 4; }
        var maxW = R * 0.68, text = name;
        while (ctx.measureText(text).width > maxW && text.length > 2) text = text.slice(0, -2) + '…';
        ctx.fillText(text, R - 18, 0);
        ctx.restore();
      });
      ctx.restore();
    }

    // The wheel is painted once and then turned as a picture, so spinning stays smooth however many names are on it.
    function turn() { canvas.style.transform = 'rotate(' + rot + 'rad)'; }

    function indexAtPointer(n) {
      var seg = Math.PI * 2 / n;
      var a = ((-rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      return Math.floor(a / seg) % n;
    }

    function spin() {
      var list = entries();
      if (spinning || list.length < 1) return;
      result.hidden = true;
      spinning = true; stage.classList.add('spinning');
      var T = TIMES[st.time];
      var start = rot, extra = Math.PI * 2 * (T[1] + Math.random() * 2) + Math.random() * Math.PI * 2;
      var dur = T[0] + Math.random() * 900, t0 = performance.now(), last = indexAtPointer(list.length);
      // Speeds up gently for the first tenth of the spin, then glides down to a stop with no sudden changes.
      var t1 = 0.1, total = t1 / 2 + (1 - t1) / 4;
      function ease(t) {
        if (t < t1) return (t * t / (2 * t1)) / total;
        var u = (t - t1) / (1 - t1);
        return (t1 / 2 + (1 - t1) * (1 - Math.pow(1 - u, 4)) / 4) / total;
      }
      canvas.style.willChange = 'transform';
      (function frame(now) {
        var t = Math.max(0, Math.min(1, (now - t0) / dur));
        rot = start + extra * ease(t);
        turn();
        var idx = indexAtPointer(list.length);
        if (idx !== last) { last = idx; TT.tick(); pointer.classList.remove('flick'); void pointer.offsetWidth; pointer.classList.add('flick'); }
        if (t < 1) { requestAnimationFrame(frame); return; }
        spinning = false; stage.classList.remove('spinning');
        rot = rot % (Math.PI * 2); turn(); canvas.style.willChange = '';
        showResult(list[idx]);
      })(t0);
    }

    function showResult(name) {
      TT.chime();
      state.history.unshift(name); state.history = state.history.slice(0, 50); save(); paintSide();
      result.textContent = '';
      if (st.auto === 'always') {
        state.removed.push(name); save(); draw(); paintSide();
        result.append(h('span', { class: 'eyebrow', text: 'The Wheel Picked' }), h('div', { class: 'wheel-winner', text: name }),
          h('div', { class: 'row center' }, TT.button('OK', { kind: 'primary', onclick: function () { result.hidden = true; } })));
        result.hidden = false; return;
      }
      result.append(
        h('span', { class: 'eyebrow', text: 'The Wheel Picked' }),
        h('div', { class: 'wheel-winner', text: name }),
        h('div', { class: 'row center' },
          TT.button('Take Off the Wheel', { kind: 'primary', onclick: function () { state.removed.push(name); save(); result.hidden = true; draw(); paintSide(); } }),
          TT.button('Keep on the Wheel', { onclick: function () { result.hidden = true; } })));
      result.hidden = false;
    }

    document.addEventListener('keydown', function (e) {
      if (el.offsetParent === null || /INPUT|TEXTAREA|BUTTON/.test(e.target.tagName)) return;
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); spin(); }
    });
    window.addEventListener('resize', draw);
    TT.roster.onChange(function () { shuffled = null; draw(); paintSide(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    paintSide();
    requestAnimationFrame(draw);
    return { show: function () { requestAnimationFrame(draw); } };
  };
})();
