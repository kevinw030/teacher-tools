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
    clock: { title: 'Clock', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', w: 300, h: 190 },
    timer: { title: 'Timer', icon: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>', w: 300, h: 380 },
    text: { title: 'Text', icon: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>', w: 420, h: 240 },
    traffic: { title: 'Traffic light', icon: '<rect x="7" y="2" width="10" height="20" rx="3"/><circle cx="12" cy="7" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="17" r="1.6"/>', w: 200, h: 400 },
    picker: { title: 'Name picker', icon: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M18 4v6M15 7h6"/>', w: 340, h: 250 },
    wyr: { title: 'Would you rather', icon: '<path d="M4 4h7v7H4zM13 13h7v7h-7z"/><path d="M13 7h4l-2-2M11 17H7l2 2"/>', w: 560, h: 300 }
  };

  TT.mountBoard = function (el) {
    // Saved screens: each one keeps its own widgets and background, and saves itself as you work.
    var screens = TT.load('board-screens', null);
    if (!screens || !Array.isArray(screens.list) || !screens.list.length) {
      var first = { id: 's' + Date.now().toString(36), name: 'My board', state: TT.load(KEY, null) };
      screens = { active: first.id, list: [first] };
    }
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
        h('label', { class: 'btn small', for: 'bgPhoto', html: TT.icon('image') + '<span>Use my own photo</span>' }), fileInput,
        h('label', { class: 'btn small color-btn', for: 'bgColor' }, colorInput, h('span', { text: 'Any color' }))),
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
      h('div', { class: 'bg-group' }, h('h4', { text: 'Saved screens' }), screenList),
      h('div', { class: 'bg-group' }, h('h4', { text: 'Save a new screen' }),
        h('div', { class: 'screen-form' }, screenName,
          TT.button('Copy this screen', { kind: 'small', onclick: function () { addScreen(true); } }),
          TT.button('Start blank', { kind: 'small primary', onclick: function () { addScreen(false); } })),
        screenMsg),
      h('div', { class: 'bg-group' }, h('h4', { text: 'This screen' }),
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
      mounted = {}; canvas.textContent = '';
    }
    function loadState() {
      if (!state || !Array.isArray(state.widgets)) { state = { bg: 'sky', widgets: [] }; seed(); }
      else requestAnimationFrame(function () { state.widgets.forEach(function (w) { clamp(w); renderWidget(w); }); });
      setBg(state.bg || 'sky');
      paintScreens();
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

    var top = h('div', { class: 'board-top' },
      h('div', { class: 'row' }, h('a', { class: 'btn glass', href: '#home', html: TT.icon('back') + '<span>All tools</span>' }), h('div', { class: 'bg-wrap' }, screenBtn, screenPanel)),
      h('div', { class: 'row' }, clearConfirm, clearBtn, h('div', { class: 'bg-wrap' }, bgBtn, bgPanel),
        TT.canFullscreen ? TT.button('Full screen', { icon: 'expand', kind: 'glass', onclick: function () { TT.toggleFullscreen(); } }) : null)
    );

    var dock = h('div', { class: 'dock', role: 'toolbar', 'aria-label': 'Add a widget' });
    Object.keys(TYPES).forEach(function (t) {
      dock.append(h('button', { type: 'button', class: 'dock-btn', title: 'Add ' + TYPES[t].title.toLowerCase(), onclick: function () { addWidget(t); } },
        h('span', { class: 'dock-icon', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + TYPES[t].icon + '</svg>' }),
        h('span', { class: 'dock-label', text: TYPES[t].title })));
    });

    var root = h('div', { class: 'board' }, top, canvas, h('div', { class: 'dock-wrap' }, dock));
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
      var closeBtn = h('button', { type: 'button', class: 'w-close', 'aria-label': 'Close ' + t.title, html: TT.icon('close'), onclick: function () { removeWidget(w.id); } });
      var head = h('div', { class: 'w-head' }, h('span', { class: 'w-title', text: t.title }), closeBtn);
      var grip = h('div', { class: 'w-resize', 'aria-hidden': 'true' });
      var node = h('div', { class: 'widget w-' + w.type + (fresh ? ' fresh' : ''), 'data-id': w.id }, head, body, grip);
      place(node, w);
      node.style.zIndex = ++z;
      canvas.append(node);
      node.addEventListener('pointerdown', function () { node.style.zIndex = ++z; });

      drag(head, function (dx, dy, start) { w.x = start.x + dx; w.y = start.y + dy; clamp(w); place(node, w); }, w, closeBtn);
      drag(grip, function (dx, dy, start) { w.w = start.w + dx; w.h = start.h + dy; clamp(w); place(node, w); }, w);

      mounted[w.id] = WIDGETS[w.type](body, w, save) || {};
    }

    function drag(handle, move, w, ignore) {
      handle.addEventListener('pointerdown', function (e) {
        if (ignore && ignore.contains(e.target)) return;
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
        var d = w.data;
        var area = h('textarea', { class: 'note-area', 'aria-label': 'Message', id: 'txt-' + w.id });
        area.value = d.text || '';
        function style() {
          area.style.fontSize = d.size + 'px';
          area.style.fontWeight = d.bold ? '700' : '500';
          area.style.color = 'var(--' + (d.color || 'ink') + ')';
          boldBtn.classList.toggle('on', !!d.bold);
          dots.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-c') === d.color); });
        }
        area.addEventListener('input', function () { d.text = area.value; save(); });
        var boldBtn = h('button', { type: 'button', class: 'tb', 'aria-label': 'Bold', html: TT.icon('bold'), onclick: function () { d.bold = !d.bold; style(); save(); } });
        var dots = ['ink', 'cobalt', 'coral', 'emerald', 'rose', 'violet'].map(function (c) {
          return h('button', { type: 'button', class: 'dot', 'data-c': c, style: 'background:var(--' + c + ')', 'aria-label': c + ' text', onclick: function () { d.color = c; style(); save(); } });
        });
        var bar = h('div', { class: 'text-toolbar' },
          h('button', { type: 'button', class: 'tb', 'aria-label': 'Smaller text', text: 'A−', onclick: function () { d.size = Math.max(14, d.size - 6); style(); save(); } }),
          h('button', { type: 'button', class: 'tb', 'aria-label': 'Bigger text', text: 'A+', onclick: function () { d.size = Math.min(160, d.size + 6); style(); save(); } }),
          boldBtn, h('span', { class: 'tb-sep' }), dots);
        body.append(area, bar);
        style();
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
      state.widgets.forEach(function (w) { clamp(w); var n = canvas.querySelector('[data-id="' + w.id + '"]'); if (n) place(n, w); });
    });

    return {
      show: function () {
        requestAnimationFrame(function () {
          state.widgets.forEach(function (w) { clamp(w); var n = canvas.querySelector('[data-id="' + w.id + '"]'); if (n) place(n, w); });
        });
      }
    };
  };
})();
