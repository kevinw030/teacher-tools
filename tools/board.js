// Classroom Board: a full-screen background with widgets you can add, move, resize and close.
(function () {
  var TT = window.TT, h = TT.h;
  var KEY = 'board';

  function allBackgrounds() {
    var out = [];
    (TT.BACKGROUNDS || []).forEach(function (g) { g.items.forEach(function (b) { out.push(b); }); });
    return out;
  }

  var TYPES = {
    clock: { color: '#2563EB', title: 'Clock', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', w: 300, h: 190 },
    timer: { color: '#0FA974', title: 'Timer', icon: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>', w: 300, h: 380 },
    text: { color: '#F2643D', title: 'Text', icon: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>', w: 420, h: 240 },
    traffic: { color: '#E89A00', title: 'Traffic Light', icon: '<rect x="7" y="2" width="10" height="20" rx="3"/><circle cx="12" cy="7" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="17" r="1.6"/>', w: 200, h: 400 },
    picker: { color: '#7B4DEB', title: 'Name Picker', icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M18 4v6M15 7h6"/>', w: 340, h: 250 },
    wyr: { title: 'Would You Rather', color: '#E5397A', icon: '<path d="M4 4h7v7H4zM13 13h7v7h-7z"/><path d="M13 7h4l-2-2M11 17H7l2 2"/>', w: 560, h: 300 }
  };

  Object.keys(TT.boardWidgets || {}).forEach(function (k) { TYPES[k] = TT.boardWidgets[k]; });

  TT.mountBoard = function (el) {
    // Saved screens: each one keeps its own widgets and background, and saves itself as you work.
    var screens = TT.load('board-screens', null);
    if (!screens || !Array.isArray(screens.list) || !screens.list.length) {
      var first = { id: 's' + Date.now().toString(36), name: 'My Board', state: TT.load(KEY, null) };
      screens = { active: first.id, list: [first] };
    }
    screens.list.forEach(function (x) { if (x.name === 'My board') x.name = 'My Board'; });
    function activeScreen() { return screens.list.filter(function (x) { return x.id === screens.active; })[0] || screens.list[0]; }
    var state = activeScreen().state;
    var canvas = h('div', { class: 'board-canvas' });
    var z = 10;
    var mounted = {};

    // ----- Background chooser -----
    var colorInput = h('input', { type: 'color', id: 'bgColor', value: '#7CC8FF', 'aria-label': 'Pick any color' });
    colorInput.addEventListener('input', function () { state.customColor = colorInput.value; setBg('color'); });
    var fileInput = h('input', { type: 'file', id: 'bgPhoto', accept: 'image/*', hidden: true });
    fileInput.addEventListener('change', function () { if (fileInput.files[0]) usePhoto(fileInput.files[0]); fileInput.value = ''; });
    var photoMsg = h('p', { class: 'form-msg', hidden: true });
    var bgPanel = h('div', { class: 'bg-panel', hidden: true, role: 'dialog', 'aria-label': 'Choose a background' },
      h('div', { class: 'bg-own' },
        h('label', { class: 'btn small', for: 'bgPhoto', html: TT.icon('image') + '<span>Use My Own Photo</span>' }), fileInput,
        h('label', { class: 'btn small color-btn', for: 'bgColor' }, colorInput, h('span', { text: 'Any Color' }))),
      photoMsg,
      (TT.BACKGROUNDS || []).map(function (g) {
        return h('div', { class: 'bg-group' }, h('h4', { text: g.group }),
          h('div', { class: 'bg-grid' }, g.items.map(function (b) {
            return h('button', { type: 'button', class: 'bg-swatch', 'data-bg': b.id, style: 'background:' + b.css, title: b.name, onclick: function () { setBg(b.id); } },
              h('span', { text: b.name }));
          })));
      }));
    var bgBtn = TT.button('Background', { icon: 'image', kind: 'glass', onclick: function () { bgPanel.hidden = !bgPanel.hidden; } });

    var clearConfirm = h('span', { class: 'confirm glass-pill', hidden: true },
      h('span', { text: 'Remove all widgets?' }),
      TT.button('Remove', { kind: 'primary small', onclick: function () { state.widgets.slice().forEach(function (w) { removeWidget(w.id); }); clearConfirm.hidden = true; clearBtn.hidden = false; } }),
      TT.button('Cancel', { kind: 'small', onclick: function () { clearConfirm.hidden = true; clearBtn.hidden = false; } }));
    var clearBtn = TT.button('Clear', { icon: 'trash', kind: 'glass', onclick: function () { clearBtn.hidden = true; clearConfirm.hidden = false; } });

    // ----- Screens menu -----
    var screenLabel = h('span', { class: 'screen-label' });
    var screenBtn = h('button', { type: 'button', class: 'btn glass', 'aria-haspopup': 'true', onclick: function () { screenPanel.hidden = !screenPanel.hidden; paintScreens(); } },
      h('span', { html: TT.icon('board') }), screenLabel, h('span', { class: 'caret', text: '▾' }));
    var screenList = h('div', { class: 'screen-list' });
    var screenName = h('input', { type: 'text', id: 'screenName', maxlength: 30, placeholder: 'Name, like Morning Work', 'aria-label': 'New screen name' });
    var screenMsg = h('p', { class: 'roster-note', hidden: true });
    var renameInput = h('input', { type: 'text', id: 'screenRename', maxlength: 30, 'aria-label': 'Rename this screen' });
    var screenPanel = h('div', { class: 'bg-panel screen-panel', hidden: true, role: 'dialog', 'aria-label': 'Saved screens' },
      h('div', { class: 'bg-group' }, h('h4', { text: 'Saved Screens' }), screenList),
      h('div', { class: 'bg-group' }, h('h4', { text: 'Save a New Screen' }),
        h('div', { class: 'screen-form' }, screenName,
          TT.button('Copy This Screen', { kind: 'small', onclick: function () { addScreen(true); } }),
          TT.button('Start Blank', { kind: 'small primary', onclick: function () { addScreen(false); } })),
        screenMsg),
      h('div', { class: 'bg-group' }, h('h4', { text: 'This Screen' }),
        h('div', { class: 'screen-form' }, renameInput,
          TT.button('Rename', { kind: 'small', onclick: function () { if (renameInput.value.trim()) { activeScreen().name = renameInput.value.trim(); save(); paintScreens(); } } }),
          delWrap())));

    function delWrap() {
      var confirm = h('span', { class: 'confirm', hidden: true }, h('span', { text: 'Delete this screen?' }),
        TT.button('Delete', { kind: 'primary small', onclick: function () { deleteScreen(); confirm.hidden = true; btn.hidden = false; } }),
        TT.button('Keep', { kind: 'small', onclick: function () { confirm.hidden = true; btn.hidden = false; } }));
      var btn = TT.button('Delete', { icon: 'trash', kind: 'small', onclick: function () { btn.hidden = true; confirm.hidden = false; } });
      return h('span', null, btn, confirm);
    }
    function paintScreens() {
      screenLabel.textContent = activeScreen().name;
      renameInput.value = activeScreen().name;
      screenList.textContent = '';
      screens.list.forEach(function (sc) {
        var n = (sc.state && sc.state.widgets ? sc.state.widgets.length : 0);
        screenList.append(h('button', { type: 'button', class: 'screen-item' + (sc.id === screens.active ? ' on' : ''), onclick: function () { switchTo(sc.id); } },
          h('span', { class: 'screen-thumb', style: 'background:' + bgCss(sc.state) }),
          h('span', { class: 'screen-text' }, h('b', { text: sc.name }), h('small', { text: n + (n === 1 ? ' widget' : ' widgets') }))));
      });
      var max = TT.config.maxScreens;
      screenMsg.hidden = screens.list.length < max;
      screenMsg.textContent = 'You can save up to ' + max + (max === 1 ? ' screen' : ' screens') + '. Delete one to make room.';
      screenMsg.classList.add('warn');
    }
    function bgCss(st) {
      if (!st) return '#8EC5FF';
      if (st.bg === 'color') return st.customColor || '#7CC8FF';
      if (st.bg === 'photo') return '#555';
      var b = allBackgrounds().filter(function (x) { return x.id === st.bg; })[0];
      return b ? b.css : '#8EC5FF';
    }
    function unrenderAll() {
      Object.keys(mounted).forEach(function (k) { if (mounted[k] && mounted[k].destroy) mounted[k].destroy(); });
      mounted = {}; canvas.querySelectorAll('.widget').forEach(function (n) { n.remove(); });
    }
    function loadState() {
      if (!state || !Array.isArray(state.widgets)) { state = { bg: 'sky', widgets: [] }; seed(); }
      else requestAnimationFrame(function () { state.widgets.forEach(function (w) { clamp(w); renderWidget(w); }); });
      setBg(state.bg || 'sky');
      paintScreens();
      requestAnimationFrame(drawInk);
    }
    function switchTo(id) {
      if (id === screens.active) { screenPanel.hidden = true; return; }
      save(); unrenderAll();
      screens.active = id; state = activeScreen().state;
      loadState(); save(); screenPanel.hidden = true;
    }
    function addScreen(copy) {
      if (screens.list.length >= TT.config.maxScreens) { paintScreens(); return; }
      save();
      var st = copy ? JSON.parse(JSON.stringify(state)) : { bg: state.bg || 'sky', widgets: [] };
      if (copy) st.widgets.forEach(function (w, i) { w.id = 'w' + Date.now().toString(36) + i; });
      var sc = { id: 's' + Date.now().toString(36), name: screenName.value.trim() || 'Screen ' + (screens.list.length + 1), state: st };
      screens.list.push(sc); screenName.value = '';
      unrenderAll(); screens.active = sc.id; state = st;
      loadState(); save(); screenPanel.hidden = true;
    }
    function deleteScreen() {
      if (screens.list.length <= 1) { unrenderAll(); state.widgets = []; save(); paintScreens(); return; }
      unrenderAll();
      screens.list = screens.list.filter(function (x) { return x.id !== screens.active; });
      screens.active = screens.list[0].id; state = activeScreen().state;
      loadState(); save(); screenPanel.hidden = true;
    }

    var fsBtn = TT.canFullscreen ? TT.button('Full Screen', { icon: 'expand', kind: 'glass', title: 'Full Screen', onclick: function () { TT.toggleFullscreen(); } }) : null;
    bgBtn.title = 'Background'; clearBtn.title = 'Clear the Board'; screenBtn.title = 'Saved Screens';
    var top = h('div', { class: 'board-top' },
      h('div', { class: 'row' }, h('a', { class: 'btn glass', href: '#home', title: 'All Tools', html: TT.icon('back') + '<span>All Tools</span>' }), h('div', { class: 'bg-wrap' }, screenBtn, screenPanel)),
      h('div', { class: 'row' }, clearConfirm, clearBtn, h('div', { class: 'bg-wrap' }, bgBtn, bgPanel),
        fsBtn)
    );

    var dock = h('div', { class: 'dock', role: 'toolbar', 'aria-label': 'Add a widget' });
    Object.keys(TYPES).forEach(function (t) {
      dock.append(h('button', { type: 'button', class: 'dock-btn', title: 'Add ' + TYPES[t].title.toLowerCase(), onclick: function () { addWidget(t); } },
        h('span', { class: 'dock-icon', style: 'background:' + (TYPES[t].color || '#0E1120'), html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + TYPES[t].icon + '</svg>' }),
        h('span', { class: 'dock-label', text: TYPES[t].title })));
    });

    // ----- Drawing pen: draw right on the board, on top of everything -----
    var PEN_COLORS = [['#0E1120', 'Black'], ['#FFFFFF', 'White'], ['#E5484D', 'Red'], ['#2563EB', 'Blue'], ['#0FA974', 'Green'], ['#F5AE14', 'Yellow'], ['#8B5CF6', 'Purple']];
    var PEN_SIZES = [[3, 'Thin'], [7, 'Medium'], [14, 'Thick']];
    var pen = { on: false, color: '#E5484D', size: 7 }, stroke = null;
    var ink = h('canvas', { class: 'board-ink', 'aria-hidden': 'true' });
    var penColors = h('div', { class: 'pen-group', role: 'group', 'aria-label': 'Pen color' }, PEN_COLORS.map(function (c) {
      return h('button', { type: 'button', class: 'pen-color', 'data-c': c[0], title: c[1], 'aria-label': c[1], style: 'background:' + c[0], onclick: function () { pen.color = c[0]; paintPen(); } });
    }));
    var penSizes = h('div', { class: 'pen-group', role: 'group', 'aria-label': 'Pen size' }, PEN_SIZES.map(function (z) {
      return h('button', { type: 'button', class: 'pen-size', 'data-s': z[0], title: z[1], 'aria-label': z[1], onclick: function () { pen.size = z[0]; paintPen(); } },
        h('i', { style: 'width:' + (z[0] + 3) + 'px;height:' + (z[0] + 3) + 'px' }));
    }));
    var penBar = h('div', { class: 'pen-bar', hidden: true, role: 'toolbar', 'aria-label': 'Drawing tools' }, penColors, penSizes,
      TT.button('Undo', { icon: 'reset', kind: 'small', onclick: function () { if (state.strokes && state.strokes.length) { state.strokes.pop(); save(); drawInk(); } } }),
      TT.button('Erase All', { icon: 'trash', kind: 'small', onclick: function () { state.strokes = []; save(); drawInk(); } }),
      TT.button('Done', { kind: 'small primary', onclick: function () { setPen(false); } }));
    var penBtn = h('button', { type: 'button', class: 'dock-btn dock-pen', title: 'Draw on the board', 'aria-pressed': 'false', onclick: function () { setPen(!pen.on); } },
      h('span', { class: 'dock-icon', style: 'background:#0E1120', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3l4 4L8 20l-5 1 1-5z"/><path d="M14 6l4 4"/></svg>' }),
      h('span', { class: 'dock-label', text: 'Draw' }));
    dock.append(penBtn);
    canvas.append(ink, penBar);
    function paintPen() {
      penColors.querySelectorAll('.pen-color').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-c') === pen.color); });
      penSizes.querySelectorAll('.pen-size').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-s') === pen.size); });
    }
    function setPen(on) {
      pen.on = on; ink.classList.toggle('on', on); penBar.hidden = !on;
      penBtn.classList.toggle('on', on); penBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      paintPen();
    }
    function line(ctx, st, b, from) {
      var p = st.p;
      ctx.strokeStyle = st.c; ctx.lineWidth = st.s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      var i0 = Math.max(0, (from || 0));
      ctx.moveTo(p[i0] * b.w, p[i0 + 1] * b.h);
      if (p.length - i0 === 2) ctx.lineTo(p[i0] * b.w + 0.01, p[i0 + 1] * b.h);
      for (var i = i0 + 2; i < p.length; i += 2) ctx.lineTo(p[i] * b.w, p[i + 1] * b.h);
      ctx.stroke();
    }
    function drawInk() {
      var b = bounds(), dpr = window.devicePixelRatio || 1;
      if (ink.width !== Math.round(b.w * dpr) || ink.height !== Math.round(b.h * dpr)) { ink.width = Math.round(b.w * dpr); ink.height = Math.round(b.h * dpr); }
      var ctx = ink.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, b.w, b.h);
      (state.strokes || []).forEach(function (st) { if (st.p && st.p.length >= 2) line(ctx, st, b); });
    }
    function inkPoint(e) {
      var r = ink.getBoundingClientRect();
      return [Math.round((e.clientX - r.left) / r.width * 1e4) / 1e4, Math.round((e.clientY - r.top) / r.height * 1e4) / 1e4];
    }
    ink.addEventListener('pointerdown', function (e) {
      if (!pen.on) return;
      e.preventDefault(); ink.setPointerCapture(e.pointerId);
      if (!Array.isArray(state.strokes)) state.strokes = [];
      stroke = { c: pen.color, s: pen.size, p: inkPoint(e) };
      state.strokes.push(stroke);
      line(ink.getContext('2d'), stroke, bounds());
    });
    ink.addEventListener('pointermove', function (e) {
      if (!stroke) return;
      var pt = inkPoint(e), b = bounds(), n = stroke.p.length;
      if (Math.abs(pt[0] - stroke.p[n - 2]) * b.w + Math.abs(pt[1] - stroke.p[n - 1]) * b.h < 2) return;
      stroke.p.push(pt[0], pt[1]);
      line(ink.getContext('2d'), stroke, b, n - 2);
    });
    function endStroke() { if (stroke) { stroke = null; save(); } }
    ink.addEventListener('pointerup', endStroke);
    ink.addEventListener('pointercancel', endStroke);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pen.on) setPen(false); });

    // ----- Minimize the widget bar; full screen keeps everything small -----
    var ui = TT.load('board-ui', { dockMin: false }), fsHide = false;
    dock.append(h('button', { type: 'button', class: 'dock-min', title: 'Hide the Widget Bar', 'aria-label': 'Hide the widget bar', html: TT.icon('chevdown'), onclick: function () { setDock(true); } }));
    var dockShow = h('button', { type: 'button', class: 'dock-show', title: 'Show Widgets', 'aria-label': 'Show the widget bar', html: TT.icon('grid'), onclick: function () { setDock(false); } });
    var dockWrap = h('div', { class: 'dock-wrap' }, dock, dockShow);
    function paintDock() { var min = ui.dockMin || fsHide; dockWrap.classList.toggle('min', min); dockShow.hidden = !min; }
    function setDock(min) { fsHide = false; ui.dockMin = min; TT.save('board-ui', ui); paintDock(); }
    document.addEventListener('fullscreenchange', function () {
      var fs = !!document.fullscreenElement;
      root.classList.toggle('fs-min', fs);
      fsHide = fs; paintDock();
      if (fsBtn) { fsBtn.innerHTML = TT.icon(fs ? 'shrink' : 'expand') + '<span>' + (fs ? 'Exit Full Screen' : 'Full Screen') + '</span>'; fsBtn.title = fs ? 'Exit Full Screen' : 'Full Screen'; }
    });

    var root = h('div', { class: 'board' }, top, canvas, dockWrap);
    paintDock();
    el.append(root);

    document.addEventListener('pointerdown', function (e) {
      if (!bgPanel.hidden && !bgPanel.contains(e.target) && !bgBtn.contains(e.target)) bgPanel.hidden = true;
      if (!screenPanel.hidden && !screenPanel.contains(e.target) && !screenBtn.contains(e.target)) screenPanel.hidden = true;
    });

    function save() { activeScreen().state = state; TT.save('board-screens', screens); }
    function setBg(id) {
      state.bg = id; save();
      var css, dark = false;
      if (id === 'photo' && TT.load('board-photo', null)) { css = 'center / cover no-repeat url("' + TT.load('board-photo', '') + '"), #333'; dark = true; }
      else if (id === 'color') { css = state.customColor || '#7CC8FF'; dark = isDark(css); }
      else { var all = allBackgrounds(); var b = all.filter(function (x) { return x.id === id; })[0] || all[0]; css = b.css; dark = !!b.dark; }
      root.style.background = css;
      root.classList.toggle('dark-bg', dark);
      bgPanel.querySelectorAll('.bg-swatch').forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-bg') === id); });
      Object.keys(mounted).forEach(function (k) { if (mounted[k] && mounted[k].restyle) mounted[k].restyle(); });
    }
    function isDark(hex) {
      var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
      return (r * 299 + g * 587 + b * 114) / 1000 < 120;
    }
    // Shrink the photo so it fits in browser storage, then save it.
    function usePhoto(file) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, 1920 / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          var data = c.toDataURL('image/jpeg', 0.82);
          try { localStorage.setItem('tt:board-photo', JSON.stringify(data)); photoMsg.hidden = true; }
          catch (e) { photoMsg.textContent = 'That photo is too big to save. Try a smaller one.'; photoMsg.hidden = false; return; }
          setBg('photo');
        };
        img.onerror = function () { photoMsg.textContent = 'That file isn’t a picture this browser can open. Try a JPG or PNG.'; photoMsg.hidden = false; };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    function bounds() { return { w: canvas.clientWidth || window.innerWidth, h: canvas.clientHeight || window.innerHeight - 160 }; }
    function clamp(w) {
      var b = bounds();
      w.w = Math.max(160, Math.min(w.w, b.w));
      w.h = Math.max(120, Math.min(w.h, b.h));
      w.x = Math.max(0, Math.min(w.x, b.w - w.w));
      w.y = Math.max(0, Math.min(w.y, b.h - w.h));
    }

    function addWidget(type) {
      var t = TYPES[type], b = bounds();
      var n = state.widgets.length;
      var w = { id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: type, w: t.w, h: t.h,
        x: (b.w - t.w) / 2 + (n % 5) * 24, y: Math.max(0, (b.h - t.h) / 2 - 40) + (n % 5) * 24, data: {} };
      if (type === 'text') w.data = { text: 'Type your message here', size: 40, bold: true, color: 'ink' };
      if (type === 'traffic') w.data = { on: 'green' };
      if (t.init) w.data = t.init();
      clamp(w);
      state.widgets.push(w); save();
      renderWidget(w, true);
    }

    function removeWidget(id) {
      state.widgets = state.widgets.filter(function (w) { return w.id !== id; });
      var node = canvas.querySelector('[data-id="' + id + '"]');
      if (mounted[id] && mounted[id].destroy) mounted[id].destroy();
      delete mounted[id];
      if (node) node.remove();
      save();
    }

    function place(node, w) {
      node.style.left = w.x + 'px'; node.style.top = w.y + 'px';
      node.style.width = w.w + 'px'; node.style.height = w.h + 'px';
    }

    function renderWidget(w, fresh) {
      var t = TYPES[w.type];
      if (!t) return;
      var body = h('div', { class: 'w-body' });
      var closeBtn = h('button', { type: 'button', class: 'w-close', 'aria-label': 'Close ' + t.title, title: 'Close', html: TT.icon('close'), onclick: function () { removeWidget(w.id); } });
      var lockBtn = h('button', { type: 'button', class: 'w-close w-lock', onclick: function () { w.locked = !w.locked; paintLock(); save(); } });
      var head = h('div', { class: 'w-head' }, h('span', { class: 'w-title', text: t.title }), h('span', { class: 'w-btns' }, lockBtn, closeBtn));
      var grip = h('div', { class: 'w-resize', 'aria-hidden': 'true' });
      var node = h('div', { class: 'widget w-' + w.type + (fresh ? ' fresh' : ''), 'data-id': w.id }, head, body, grip);
      function paintLock() {
        node.classList.toggle('locked', !!w.locked);
        lockBtn.innerHTML = TT.icon(w.locked ? 'lock' : 'unlock');
        lockBtn.title = w.locked ? 'Locked in place. Click to unlock.' : 'Lock in place';
        lockBtn.setAttribute('aria-label', lockBtn.title);
        lockBtn.setAttribute('aria-pressed', w.locked ? 'true' : 'false');
      }
      paintLock();
      place(node, w);
      node.style.zIndex = ++z;
      canvas.append(node);
      node.addEventListener('pointerdown', function () { node.style.zIndex = ++z; });

      drag(head, function (dx, dy, start) { w.x = start.x + dx; w.y = start.y + dy; clamp(w); place(node, w); }, w, head.querySelector('.w-btns'));
      drag(grip, function (dx, dy, start) { w.w = start.w + dx; w.h = start.h + dy; clamp(w); place(node, w); }, w);

      if (!w.data) w.data = {};
      mounted[w.id] = (WIDGETS[w.type] || t.mount)(body, w, save) || {};
    }

    function drag(handle, move, w, ignore) {
      handle.addEventListener('pointerdown', function (e) {
        if (w.locked || (ignore && ignore.contains(e.target))) return;
        e.preventDefault();
        var sx = e.clientX, sy = e.clientY, start = { x: w.x, y: w.y, w: w.w, h: w.h };
        handle.setPointerCapture(e.pointerId);
        function mv(ev) { move(ev.clientX - sx, ev.clientY - sy, start); }
        function up() { handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up); save(); }
        handle.addEventListener('pointermove', mv);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
      });
    }

    // ----- Widget contents -----
    var WIDGETS = {
      clock: function (body) {
        var time = h('div', { class: 'clock-time' }), date = h('div', { class: 'clock-date' });
        body.append(h('div', { class: 'clock' }, time, date));
        function tick() {
          var d = new Date();
          time.textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          date.textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
        }
        tick();
        var iv = setInterval(tick, 1000);
        return { destroy: function () { clearInterval(iv); } };
      },
      timer: function (body, w, save) {
        return TT.mountTimer(body, { compact: true, state: w.data, onChange: function (d) { w.data = d; save(); } });
      },
      text: function (body, w, save) {
        var d = w.data, node = body.parentNode;
        var FONTS = [
          ['modern', 'Modern', '"Bricolage Grotesque", sans-serif'],
          ['clean', 'Clean', '"Plus Jakarta Sans", sans-serif'],
          ['rounded', 'Rounded', '"Fredoka", sans-serif'],
          ['easy', 'Easy Read', '"Lexend", sans-serif'],
          ['hand', 'Handwriting', '"Patrick Hand", cursive'],
          ['marker', 'Marker', '"Permanent Marker", cursive'],
          ['comic', 'Comic', '"Bangers", cursive'],
          ['fancy', 'Fancy', '"Pacifico", cursive'],
          ['book', 'Storybook', '"Merriweather", serif'],
          ['type', 'Typewriter', '"Courier Prime", monospace']
        ];
        var TEXT_COLORS = ['auto', '#0E1120', '#FFFFFF', '#2563EB', '#F2643D', '#0FA974', '#E5397A', '#7B4DEB', '#E89A00'];
        var BOX_COLORS = ['default', 'clear', '#FFFFFF', '#161A2B', '#FFF3B0', '#FFD6E0', '#CDE7FF', '#D5F5E3', '#E6DBFF', '#FFD9B8', '#2563EB', '#0FA974', '#E5397A'];
        if (!d.font) d.font = 'modern';
        if (!d.align) d.align = 'left';
        if (!d.box) d.box = 'default';
        if (!d.color || d.color === 'ink') d.color = 'auto';

        var area = h('textarea', { class: 'note-area', 'aria-label': 'Message', id: 'txt-' + w.id, placeholder: 'Type here' });
        area.value = d.text || '';
        area.addEventListener('input', function () { d.text = area.value; save(); });

        function lum(hex) { var n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000; }
        function set(k, v) { d[k] = v; style(); save(); }
        function tb(label, aria, key, html) {
          return h('button', { type: 'button', class: 'tb tb-' + key, 'aria-label': aria, title: aria, html: html || label, onclick: function () { set(key, !d[key]); } });
        }
        var fontSel = h('select', { class: 'tb-select', 'aria-label': 'Font', id: 'font-' + w.id }, FONTS.map(function (f) {
          var o = h('option', { value: f[0], text: f[1] }); o.style.fontFamily = f[2]; return o;
        }));
        fontSel.addEventListener('change', function () { set('font', fontSel.value); });
        var boldBtn = tb('B', 'Bold', 'bold'), italBtn = tb('I', 'Italic', 'italic'), undBtn = tb('U', 'Underline', 'underline');
        var shadowBtn = tb('S', 'Text shadow', 'shadow');
        var alignIcons = {
          left: '<path d="M4 6h16M4 11h10M4 16h14"/>', center: '<path d="M4 6h16M7 11h10M5 16h14"/>', right: '<path d="M4 6h16M10 11h10M6 16h14"/>'
        };
        var aligns = ['left', 'center', 'right'].map(function (al) {
          return h('button', { type: 'button', class: 'tb', 'data-al': al, 'aria-label': 'Align ' + al, title: 'Align ' + al,
            html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' + alignIcons[al] + '</svg>', onclick: function () { set('align', al); } });
        });
        var midBtn = h('button', { type: 'button', class: 'tb', 'aria-label': 'Center up and down', title: 'Center up and down',
          html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 12h16M12 3v5M9.5 5.5 12 8l2.5-2.5M12 21v-5M9.5 18.5 12 16l2.5 2.5"/></svg>',
          onclick: function () { set('middle', !d.middle); } });

        function swatches(list, key, label) {
          var custom = h('input', { type: 'color', class: 'dot-custom', 'aria-label': label + ': any color', title: 'Any color' });
          custom.addEventListener('input', function () { set(key, custom.value); });
          var btns = list.map(function (c) {
            var special = c === 'auto' || c === 'default' || c === 'clear';
            return h('button', { type: 'button', class: 'dot' + (special ? ' dot-' + c : ''), 'data-c': c, style: special ? null : 'background:' + c,
              'aria-label': label + ': ' + (c === 'auto' ? 'automatic' : c === 'default' ? 'standard' : c === 'clear' ? 'see-through' : c),
              title: c === 'auto' ? 'Automatic' : c === 'default' ? 'Standard' : c === 'clear' ? 'See-through' : c, onclick: function () { set(key, c); } });
          });
          return { el: h('div', { class: 'tb-row' }, h('span', { class: 'tb-label', text: label }), btns, custom), btns: btns, custom: custom };
        }
        var textSw = swatches(TEXT_COLORS, 'color', 'Text');
        var boxSw = swatches(BOX_COLORS, 'box', 'Box');

        var bar = h('div', { class: 'text-toolbar' },
          h('div', { class: 'tb-panel' },
            h('div', { class: 'tb-row' }, fontSel,
              h('button', { type: 'button', class: 'tb', 'aria-label': 'Smaller text', title: 'Smaller', text: 'A−', onclick: function () { set('size', Math.max(12, d.size - 4)); } }),
              h('button', { type: 'button', class: 'tb', 'aria-label': 'Bigger text', title: 'Bigger', text: 'A+', onclick: function () { set('size', Math.min(200, d.size + 4)); } }),
              h('span', { class: 'tb-sep' }), boldBtn, italBtn, undBtn, shadowBtn,
              h('span', { class: 'tb-sep' }), aligns, midBtn),
            textSw.el, boxSw.el));
        body.append(area, bar);

        function style() {
          var f = FONTS.filter(function (x) { return x[0] === d.font; })[0] || FONTS[0];
          fontSel.value = f[0];
          area.style.fontFamily = f[2];
          area.style.fontSize = d.size + 'px';
          area.style.fontWeight = d.bold ? '700' : '400';
          area.style.fontStyle = d.italic ? 'italic' : 'normal';
          area.style.textDecoration = d.underline ? 'underline' : 'none';
          area.style.textAlign = d.align;
          // Box color
          var clear = d.box === 'clear', custom = d.box.charAt(0) === '#';
          node.classList.toggle('box-clear', clear);
          node.style.background = clear ? 'transparent' : custom ? d.box : '';
          // Text color: "auto" picks a readable color for the box behind it
          var color;
          if (d.color === 'auto') color = custom ? (lum(d.box) < 140 ? '#FFFFFF' : '#0E1120') : clear ? (root.classList.contains('dark-bg') ? '#FFFFFF' : '#0E1120') : 'var(--ink)';
          else color = d.color.charAt(0) === '#' ? d.color : 'var(--' + d.color + ')';
          area.style.color = color;
          node.style.setProperty('--w-ink', custom ? (lum(d.box) < 140 ? 'rgba(255,255,255,.75)' : 'rgba(14,17,32,.6)') : '');
          area.style.textShadow = d.shadow ? '0 2px 0 rgba(0,0,0,.18), 0 4px 14px rgba(0,0,0,.28)' : 'none';
          body.classList.toggle('middle', !!d.middle);
          if (d.middle) { area.style.height = 'auto'; area.style.height = Math.min(area.scrollHeight, body.clientHeight - 8) + 'px'; } else area.style.height = '';
          boldBtn.classList.toggle('on', !!d.bold); italBtn.classList.toggle('on', !!d.italic);
          undBtn.classList.toggle('on', !!d.underline); shadowBtn.classList.toggle('on', !!d.shadow); midBtn.classList.toggle('on', !!d.middle);
          aligns.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-al') === d.align); });
          textSw.btns.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-c') === d.color); });
          boxSw.btns.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-c') === d.box); });
        }
        area.addEventListener('input', function () { if (d.middle) style(); });
        // Open the toolbar above the box when there is no room below it.
        node.addEventListener('pointerenter', function () { node.classList.toggle('tb-up', w.y + w.h + 150 > bounds().h); });
        style();
        return { restyle: style };
      },
      traffic: function (body, w, save) {
        var labels = { red: 'Stop and listen', yellow: 'Quiet voices', green: 'Go ahead' };
        var label = h('div', { class: 'traffic-label' });
        var lights = ['red', 'yellow', 'green'].map(function (c) {
          return h('button', { type: 'button', class: 'light ' + c, 'aria-label': labels[c], onclick: function () { w.data.on = c; paint(); save(); } });
        });
        body.append(h('div', { class: 'traffic' }, h('div', { class: 'traffic-box' }, lights), label));
        function paint() {
          lights.forEach(function (l) { l.classList.toggle('on', l.classList.contains(w.data.on)); l.setAttribute('aria-pressed', l.classList.contains(w.data.on)); });
          label.textContent = labels[w.data.on] || '';
        }
        paint();
      },
      picker: function (body) { return TT.mountPicker(body, { compact: true }); },
      wyr: function (body) { return TT.mountWYR(body, { compact: true }); }
    };

    // ----- First visit: start with a useful board -----
    function seed() {
      requestAnimationFrame(function () {
        var b = bounds();
        state.widgets = [
          { id: 'w-clock', type: 'clock', x: 32, y: 24, w: 300, h: 190, data: {} },
          { id: 'w-text', type: 'text', x: Math.max(360, b.w / 2 - 260), y: 24, w: 520, h: 230, data: { text: 'Good morning, class!\nGrab your journal and a pencil.', size: 34, bold: true, color: 'ink' } },
          { id: 'w-timer', type: 'timer', x: Math.max(32, b.w - 332), y: 24, w: 300, h: 380, data: { total: 300 } }
        ];
        state.widgets.forEach(function (w) { clamp(w); renderWidget(w); });
        save(); paintScreens();
      });
    }
    loadState();

    window.addEventListener('resize', function () {
      drawInk();
      state.widgets.forEach(function (w) { clamp(w); var n = canvas.querySelector('[data-id="' + w.id + '"]'); if (n) place(n, w); });
    });

    return {
      show: function () {
        requestAnimationFrame(function () {
          drawInk();
          state.widgets.forEach(function (w) { clamp(w); var n = canvas.querySelector('[data-id="' + w.id + '"]'); if (n) place(n, w); });
        });
      }
    };
  };
})();
