// Classroom Board drawing tools: an expandable bar with a pen, highlighter, eraser, shapes, colors and sizes.
// Everything is drawn on one canvas that sits on top of the board. Strokes are saved with the board screen.
(function () {
  var TT = window.TT, h = TT.h;
  function svg(box, inner) { return '<svg viewBox="' + box + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>'; }

  var COLORS = [['#0E1120', 'Black'], ['#EF4444', 'Red'], ['#FB923C', 'Orange'], ['#FBBF24', 'Yellow'], ['#22C55E', 'Green'], ['#FFFFFF', 'White'],
    ['#9CA3AF', 'Gray'], ['#22D3EE', 'Teal'], ['#3B82F6', 'Blue'], ['#8B5CF6', 'Purple'], ['#FF4FA3', 'Pink']];
  var SIZES = [[3, 'Thin'], [7, 'Medium'], [14, 'Thick']];
  // Tall marker drawings. The tip and band take the chosen color (--pc).
  var TOOLS = [
    ['pen', 'Pen', '<path d="M16 3l6 13v29H10V16z" fill="#fff" stroke="#0E1120" stroke-width="2" stroke-linejoin="round"/><path d="M16 3l3.6 7.8h-7.2z" fill="var(--pc)" stroke="#0E1120" stroke-width="2" stroke-linejoin="round"/><path d="M10 33h12v6H10z" fill="var(--pc)" stroke="#0E1120" stroke-width="2"/>'],
    ['hl', 'Highlighter', '<path d="M12 16V9l8-4v11z" fill="var(--pc)" stroke="#0E1120" stroke-width="2" stroke-linejoin="round"/><path d="M9 16h14v29H9z" fill="#fff" stroke="#0E1120" stroke-width="2" stroke-linejoin="round"/><path d="M9 24h14v14H9z" fill="var(--pc)" stroke="#0E1120" stroke-width="2"/>'],
    ['er', 'Eraser', '<rect x="8" y="10" width="16" height="35" rx="6" fill="#FFD3DC" stroke="#0E1120" stroke-width="2"/><path d="M8 24h16v21H8z" fill="#fff" stroke="#0E1120" stroke-width="2" stroke-linejoin="round"/>']
  ];
  var SHAPES = [
    ['line', 'Line', '<path d="M5 19 19 5"/>'], ['arrow', 'Arrow', '<path d="M5 19 19 5M10 5h9v9"/>'],
    ['rect', 'Rectangle', '<rect x="4" y="5" width="16" height="14" rx="1.5"/>'], ['oval', 'Circle', '<circle cx="12" cy="12" r="8"/>'],
    ['frect', 'Filled Rectangle', '<rect x="4" y="5" width="16" height="14" rx="1.5" fill="currentColor"/>'], ['foval', 'Filled Circle', '<circle cx="12" cy="12" r="8" fill="currentColor"/>']
  ];
  function isShape(t) { return t === 'line' || t === 'arrow' || t === 'rect' || t === 'oval' || t === 'frect' || t === 'foval'; }

  TT.boardPen = function (env) {
    var canvas = env.canvas, bounds = env.bounds;
    var prefs = TT.load('board-pen', null) || {};
    var pen = { on: false, draw: true, tool: prefs.tool || 'pen', color: prefs.color || '#EF4444', size: prefs.size || 7, open: prefs.open !== false, shapes: false };
    var stroke = null;
    function keep() { TT.save('board-pen', { tool: pen.tool, color: pen.color, size: pen.size, open: pen.open }); }
    function strokes() { var s = env.getState(); if (!Array.isArray(s.strokes)) s.strokes = []; return s.strokes; }

    var ink = h('canvas', { class: 'board-ink', 'aria-hidden': 'true' });

    // ----- The bar -----
    function tbtn(cls, label, html, fn) { return h('button', { type: 'button', class: cls, title: label, 'aria-label': label, html: html, onclick: fn }); }
    var drawBtn = tbtn('pen2-mode', 'Draw', svg('0 0 24 24', '<path d="M4 16c2-6 4-8 6-4s3 5 5 1 3-5 5-3"/>'), function () { pen.draw = true; paint(); });
    var pointBtn = tbtn('pen2-mode', 'Use the Board (Stop Drawing for a Moment)', svg('0 0 24 24', '<path d="M6 4l12 6-5 2-2 5z"/>'), function () { pen.draw = false; pen.shapes = false; paint(); });
    var toolBtns = TOOLS.map(function (t) {
      return tbtn('pen2-tool', t[1], '<svg viewBox="0 0 32 48" aria-hidden="true">' + t[2] + '</svg>', function () { pen.tool = t[0]; pen.draw = true; pen.shapes = false; keep(); paint(); });
    });
    var shapeBtn = tbtn('pen2-shape-btn', 'Shapes', svg('0 0 32 32', '<rect x="11" y="12" width="16" height="16" rx="2" fill="#fff" stroke="#0E1120"/><circle cx="12" cy="12" r="8" fill="var(--pc)" stroke="#0E1120"/>'), function () { pen.shapes = !pen.shapes; if (pen.shapes && !isShape(pen.tool)) pen.tool = 'line'; pen.draw = true; keep(); paint(); });
    var shapeBtns = SHAPES.map(function (s) {
      return tbtn('pen2-shape', s[1], svg('0 0 24 24', s[2]), function () { pen.tool = s[0]; pen.draw = true; keep(); paint(); });
    });
    var shapeRow = h('div', { class: 'pen2-shapes', role: 'group', 'aria-label': 'Shapes', hidden: true }, shapeBtns);
    var custom = h('input', { type: 'color', class: 'pen2-any-input', 'aria-label': 'Any color', title: 'Any Color' });
    custom.addEventListener('input', function () { pen.color = custom.value; keep(); paint(); });
    var colorBtns = COLORS.map(function (c) {
      var b = tbtn('pen2-color', c[1], '', function () { pen.color = c[0]; keep(); paint(); });
      b.style.background = c[0]; b.setAttribute('data-c', c[0]); return b;
    });
    var anyBtn = h('label', { class: 'pen2-color pen2-any', title: 'Any Color' }, custom);
    var sizeBtns = SIZES.map(function (z) {
      var b = tbtn('pen2-size', z[1], '', function () { pen.size = z[0]; keep(); paint(); });
      b.append(h('i', { style: 'width:' + (z[0] + 4) + 'px;height:' + (z[0] + 4) + 'px' })); b.setAttribute('data-s', z[0]); return b;
    });
    var nowDot = h('span', { class: 'pen2-now', 'aria-hidden': 'true' });
    var foldBtn = tbtn('pen2-icon', 'Make the Drawing Bar Smaller', '', function () { pen.open = !pen.open; if (!pen.open) pen.shapes = false; keep(); paint(); });
    var main = h('div', { class: 'pen2-main' },
      h('div', { class: 'pen2-modes', role: 'group', 'aria-label': 'Draw or use the board' }, drawBtn, pointBtn),
      h('div', { class: 'pen2-tools', role: 'group', 'aria-label': 'Drawing tool' }, toolBtns, shapeBtn),
      nowDot,
      h('div', { class: 'pen2-colors', role: 'group', 'aria-label': 'Color' }, colorBtns, anyBtn),
      h('div', { class: 'pen2-sizes', role: 'group', 'aria-label': 'Thickness' }, sizeBtns),
      h('div', { class: 'pen2-acts' },
        tbtn('pen2-icon', 'Undo', TT.icon('reset'), function () { var s = strokes(); if (s.length) { s.pop(); env.save(); drawInk(); } }),
        tbtn('pen2-icon', 'Erase Everything', TT.icon('trash'), function () { env.getState().strokes = []; env.save(); drawInk(); })),
      h('div', { class: 'pen2-end' }, foldBtn, TT.button('Done', { kind: 'small primary', onclick: function () { setPen(false); } })));
    var bar = h('div', { class: 'pen2', hidden: true, role: 'toolbar', 'aria-label': 'Drawing tools' }, shapeRow, main);
    var penBtn = h('button', { type: 'button', class: 'dock-btn dock-pen', title: 'Draw on the board', 'aria-pressed': 'false', onclick: function () { setPen(!pen.on); } },
      h('span', { class: 'dock-icon', style: 'background:#0E1120', html: svg('0 0 24 24', '<path d="M17 3l4 4L8 20l-5 1 1-5z"/><path d="M14 6l4 4"/>') }),
      h('span', { class: 'dock-label', text: 'Draw' }));
    env.dock.append(penBtn);
    canvas.append(ink, bar);

    function paint() {
      var shape = isShape(pen.tool);
      bar.style.setProperty('--pc', pen.color);
      bar.classList.toggle('closed', !pen.open);
      ink.classList.toggle('on', pen.on && pen.draw);
      ink.classList.toggle('erasing', pen.tool === 'er');
      drawBtn.classList.toggle('on', pen.draw); pointBtn.classList.toggle('on', !pen.draw);
      TOOLS.forEach(function (t, i) { toolBtns[i].classList.toggle('on', pen.draw && pen.tool === t[0]); });
      shapeBtn.classList.toggle('on', pen.draw && shape);
      shapeRow.hidden = !(pen.shapes && pen.open && pen.draw);
      SHAPES.forEach(function (s, i) { shapeBtns[i].classList.toggle('on', pen.tool === s[0]); });
      var listed = false;
      colorBtns.forEach(function (b) { var on = b.getAttribute('data-c') === pen.color; listed = listed || on; b.classList.toggle('on', on); });
      anyBtn.classList.toggle('on', !listed); if (!listed) custom.value = pen.color;
      sizeBtns.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-s') === pen.size); });
      nowDot.style.background = pen.color;
      foldBtn.innerHTML = TT.icon(pen.open ? 'shrink' : 'expand');
      foldBtn.title = pen.open ? 'Make the Drawing Bar Smaller' : 'Show All Drawing Tools'; foldBtn.setAttribute('aria-label', foldBtn.title);
    }
    function setPen(on) {
      pen.on = on; if (on) pen.draw = true; else pen.shapes = false;
      bar.hidden = !on;
      penBtn.classList.toggle('on', on); penBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      paint();
    }

    // ----- Drawing -----
    // Freehand strokes are smooth curves through the midpoints between pen points, so there are no corners.
    // `from` draws only the newest piece while the pen is moving.
    function curve(ctx, st, b, from) {
      var p = st.p, n = p.length / 2;
      function X(i) { return p[i * 2] * b.w; } function Y(i) { return p[i * 2 + 1] * b.h; }
      if (n === 1) { ctx.beginPath(); ctx.arc(X(0), Y(0), ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); return; }
      ctx.beginPath();
      if (from == null) {
        ctx.moveTo(X(0), Y(0));
        for (var i = 1; i < n - 1; i++) ctx.quadraticCurveTo(X(i), Y(i), (X(i) + X(i + 1)) / 2, (Y(i) + Y(i + 1)) / 2);
        ctx.lineTo(X(n - 1), Y(n - 1));
      } else {
        var k = n - 1;
        if (k === 1) { ctx.moveTo(X(0), Y(0)); ctx.lineTo((X(0) + X(1)) / 2, (Y(0) + Y(1)) / 2); }
        else { ctx.moveTo((X(k - 2) + X(k - 1)) / 2, (Y(k - 2) + Y(k - 1)) / 2); ctx.quadraticCurveTo(X(k - 1), Y(k - 1), (X(k - 1) + X(k)) / 2, (Y(k - 1) + Y(k)) / 2); }
      }
      ctx.stroke();
    }
    function shape(ctx, st, b) {
      var p = st.p, x0 = p[0] * b.w, y0 = p[1] * b.h, x1 = p[2] * b.w, y1 = p[3] * b.h, t = st.t;
      ctx.beginPath();
      if (t === 'line' || t === 'arrow') {
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        if (t === 'arrow') {
          var a = Math.atan2(y1 - y0, x1 - x0), L = Math.max(14, st.s * 3.4);
          ctx.beginPath(); ctx.moveTo(x1 - L * Math.cos(a - 0.5), y1 - L * Math.sin(a - 0.5)); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L * Math.cos(a + 0.5), y1 - L * Math.sin(a + 0.5)); ctx.stroke();
        }
      } else if (t === 'rect' || t === 'frect') {
        ctx.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)); if (t === 'frect') ctx.fill(); else ctx.stroke();
      } else {
        ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, 0, 0, Math.PI * 2); if (t === 'foval') ctx.fill(); else ctx.stroke();
      }
    }
    function one(ctx, st, b, from) {
      var t = st.t || 'pen';
      ctx.save();
      ctx.globalCompositeOperation = t === 'er' ? 'destination-out' : 'source-over';
      ctx.globalAlpha = t === 'hl' ? 0.45 : 1;
      ctx.strokeStyle = st.c; ctx.fillStyle = st.c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = t === 'hl' ? st.s * 3 : t === 'er' ? st.s * 4 : st.s;
      if (isShape(t)) { if (st.p.length >= 4) shape(ctx, st, b); } else curve(ctx, st, b, from);
      ctx.restore();
    }
    function inkCtx() { return ink.getContext('2d', { desynchronized: true }); }
    function drawInk() {
      var b = bounds(), dpr = window.devicePixelRatio || 1;
      if (ink.width !== Math.round(b.w * dpr) || ink.height !== Math.round(b.h * dpr)) { ink.width = Math.round(b.w * dpr); ink.height = Math.round(b.h * dpr); }
      var ctx = inkCtx();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, b.w, b.h);
      (env.getState().strokes || []).forEach(function (st) { if (st.p && st.p.length >= 2) one(ctx, st, b); });
    }
    var raf = 0;
    function redrawSoon() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; drawInk(); }); }

    // Pen input. Every reading the device reports is used (not only one per frame), then eased a little
    // toward the pen so shaky hands and noisy touch panels still give a clean line.
    var penId = null, penKind = '', sx = 0, sy = 0, inkRect = null;
    function raw(e) { return [(e.clientX - inkRect.left) / inkRect.width, (e.clientY - inkRect.top) / inkRect.height]; }
    function r5(v) { return Math.round(v * 1e5) / 1e5; }
    function addPoint(x, y, b) {
      var n = stroke.p.length, dx = (x - stroke.p[n - 2]) * b.w, dy = (y - stroke.p[n - 1]) * b.h;
      if (dx * dx + dy * dy < 2.25) return;
      stroke.p.push(r5(x), r5(y));
      // A see-through highlighter line has to be redrawn whole, or its pieces would overlap and look darker.
      if (stroke.t === 'hl') redrawSoon(); else one(inkCtx(), stroke, b, n / 2);
    }
    ink.addEventListener('pointerdown', function (e) {
      if (!pen.on || !pen.draw || e.button) return;
      // one pen at a time: a resting palm or second finger never starts or breaks a line
      if (penId !== null) { if (e.pointerType === 'pen' && penKind !== 'pen') endStroke(); else return; }
      e.preventDefault();
      try { ink.setPointerCapture(e.pointerId); } catch (err) {}
      penId = e.pointerId; penKind = e.pointerType; inkRect = ink.getBoundingClientRect();
      var pt = raw(e); sx = pt[0]; sy = pt[1];
      stroke = { c: pen.color, s: pen.size, p: [r5(sx), r5(sy)] };
      if (pen.tool !== 'pen') stroke.t = pen.tool;
      strokes().push(stroke);
      if (!isShape(pen.tool)) { if (stroke.t === 'hl') redrawSoon(); else one(inkCtx(), stroke, bounds()); }
    });
    ink.addEventListener('pointermove', function (e) {
      if (!stroke || e.pointerId !== penId) return;
      e.preventDefault();
      if (isShape(stroke.t)) { var q = raw(e); stroke.p[2] = r5(q[0]); stroke.p[3] = r5(q[1]); redrawSoon(); return; }
      var b = bounds(), list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      if (!list || !list.length) list = [e];
      // Small wobbles are eased away; quick, deliberate moves are followed exactly so corners and
      // fast writing stay crisp. Fingers on a touch panel get a little more easing than a mouse or stylus.
      var base = penKind === 'touch' ? 0.35 : 0.5;
      for (var i = 0; i < list.length; i++) {
        var pt = raw(list[i]);
        var d = Math.sqrt(Math.pow((pt[0] - sx) * b.w, 2) + Math.pow((pt[1] - sy) * b.h, 2)), ease = Math.min(1, base + d / 60);
        sx += (pt[0] - sx) * ease; sy += (pt[1] - sy) * ease;
        addPoint(sx, sy, b);
      }
    });
    function endStroke(e) {
      if (!stroke || (e && e.pointerId !== penId)) return;
      var b = bounds();
      if (isShape(stroke.t)) {
        // a click without a drag is not a shape
        var p = stroke.p;
        if (p.length < 4 || Math.abs(p[2] - p[0]) * b.w + Math.abs(p[3] - p[1]) * b.h < 6) strokes().pop();
      } else if (e && e.type === 'pointerup' && inkRect) {
        // finish exactly where the pen lifted
        var pt = raw(e), n = stroke.p.length;
        if (Math.abs(pt[0] - stroke.p[n - 2]) * b.w + Math.abs(pt[1] - stroke.p[n - 1]) * b.h > 0.5) stroke.p.push(r5(pt[0]), r5(pt[1]));
      }
      stroke = null; penId = null; env.save(); drawInk();
    }
    ink.addEventListener('pointerup', endStroke);
    ink.addEventListener('pointercancel', endStroke);
    ink.addEventListener('lostpointercapture', endStroke);
    ink.addEventListener('contextmenu', function (e) { if (pen.on) e.preventDefault(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pen.on) setPen(false); });

    paint();
    return { draw: drawInk, set: setPen };
  };
})();
