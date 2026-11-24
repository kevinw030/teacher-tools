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
    // The starting background changed from the blue Sky to Warm Morning. Boards still on the old default move over once.
    if (!TT.load('board-bg2', null)) { screens.list.forEach(function (x) { if (x.state && x.state.bg === 'sky') x.state.bg = 'morning'; }); TT.save('board-bg2', 1); }
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
        h('label', { class: 'btn small', for: 'bgPhoto', html: TT.icon('image') + '<span>Use My Own Photo</span>', onclick: function (e) {
          if (TT.limit && !TT.limit('photo')) { e.preventDefault(); photoMsg.textContent = ''; photoMsg.append(TT.upsell('Your own photo backgrounds come with Plus.')); photoMsg.hidden = false; }
        } }), fileInput,
        h('label', { class: 'btn small color-btn', for: 'bgColor' }, colorInput, h('span', { text: 'Any Color' }))),
      photoMsg,
      (TT.BACKGROUNDS || []).map(function (g) {
        return h('div', { class: 'bg-group' }, h('h4', { text: g.group }),
          h('div', { class: 'bg-grid' }, g.items.map(function (b) {
            return h('button', { type: 'button', class: 'bg-swatch' + (b.photo ? ' photo' : ''), 'data-bg': b.id, style: 'background:' + (b.thumb || b.css), title: b.name, onclick: function () { setBg(b.id); } },
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
    var screenBtn = h('button', { type: 'button', class: 'btn glass', 'aria-haspopup': 'true', onclick: function () { screenPanel.hidden = !screenPanel.hidden; organizer.reset(); paintScreens(); } },
      h('span', { html: TT.icon('board') }), screenLabel, h('span', { class: 'caret', text: '▾' }));
    var screenList = h('div', { class: 'screen-list' });
    var screenName = h('input', { type: 'text', id: 'screenName', maxlength: 30, placeholder: 'Name, like Morning Work', 'aria-label': 'New screen name' });
    var screenMsg = h('p', { class: 'roster-note', hidden: true });
    // Organize mode (tools/board-screens.js): drag or arrow to reorder, rename in place, delete with undo.
    var organizer = TT.boardScreens({
      list: function () { return screens.list; },
      active: function () { return screens.active; },
      thumb: function (st) { return bgCss(st); },
      changed: function (paintOnly) { if (!paintOnly) save(); paintScreens(); },
      remove: removeScreen,
      restore: restoreScreen
    });
    var organizeHint = h('p', { class: 'ss-hint', hidden: true, text: 'Drag a screen by its dots or use the arrows to change the order. Type on a name to rename it.' });
    var screenPanel = h('div', { class: 'bg-panel screen-panel', hidden: true, role: 'dialog', 'aria-label': 'Saved screens' },
      h('div', { class: 'bg-group' }, h('div', { class: 'ss-head' }, h('h4', { text: 'Saved Screens' }), organizer.toggle), organizeHint, organizer.undoBar, screenList),
      h('div', { class: 'bg-group' }, h('h4', { text: 'Save a New Screen' }),
        h('div', { class: 'screen-form' }, screenName,
          TT.button('Copy This Screen', { kind: 'small', onclick: function () { addScreen(true); } }),
          TT.button('Start Blank', { kind: 'small primary', onclick: function () { addScreen(false); } })),
        screenMsg),
      h('div', { class: 'bg-group' }, h('h4', { text: 'Start From a Template' }),
        h('div', { class: 'tpl-list' }, (TT.BOARD_TEMPLATES || []).map(function (t) {
          return h('button', { type: 'button', class: 'tpl', onclick: function () { addTemplate(t); } },
            h('span', { class: 'tpl-dot', style: 'background:' + t.color }), h('span', { class: 'screen-text' }, h('b', { text: t.name }), h('small', { text: t.desc })));
        }))));

    // Quick switcher: flip between saved screens without opening the menu.
    var navLabel = h('span', { class: 'screen-count', 'aria-live': 'polite' });
    var navPrev = h('button', { type: 'button', title: 'Previous Screen', 'aria-label': 'Previous screen', onclick: function () { stepScreen(-1); } }, '‹');
    var navNext = h('button', { type: 'button', title: 'Next Screen', 'aria-label': 'Next screen', onclick: function () { stepScreen(1); } }, '›');
    var navAdd = h('button', { type: 'button', title: 'New Blank Screen', 'aria-label': 'New blank screen', html: TT.icon('plus'), onclick: function () { addScreen(false); } });
    var screenNav = h('div', { class: 'screen-nav', role: 'group', 'aria-label': 'Switch screens' }, navPrev, navLabel, navNext, navAdd);
    function stepScreen(d) {
      var n = screens.list.length, i = screens.list.indexOf(activeScreen());
      if (n > 1) switchTo(screens.list[(i + d + n) % n].id);
    }

    function paintScreens() {
      screenLabel.textContent = activeScreen().name;
      screenList.textContent = '';
      screenList.className = 'screen-list';
      var organizing = organizer.editing();
      organizeHint.hidden = !organizing;
      organizer.toggle.hidden = screens.list.length < 2 && !organizing;
      if (organizing) organizer.paintList(screenList);
      else screens.list.forEach(function (sc) {
        var n = (sc.state && sc.state.widgets ? sc.state.widgets.length : 0);
        screenList.append(h('button', { type: 'button', class: 'screen-item' + (sc.id === screens.active ? ' on' : ''), onclick: function () { switchTo(sc.id); } },
          h('span', { class: 'screen-thumb', style: 'background:' + bgCss(sc.state) }),
          h('span', { class: 'screen-text' }, h('b', { text: sc.name }), h('small', { text: n + (n === 1 ? ' widget' : ' widgets') }))));
      });
      var max = TT.config.maxScreens;
      navLabel.textContent = (screens.list.indexOf(activeScreen()) + 1) + ' / ' + screens.list.length;
      navLabel.title = activeScreen().name;
      navPrev.disabled = navNext.disabled = screens.list.length < 2;
      navAdd.disabled = screens.list.length >= max;
      navAdd.title = navAdd.disabled ? 'You can save up to ' + max + ' screens' : 'New Blank Screen';
      screenMsg.hidden = screens.list.length < max;
      screenMsg.textContent = '';
      if (!canSave()) { screenMsg.hidden = false; screenMsg.append(signInNote('Sign in to save your board and keep up to ' + TT.PLANS.free.screens + ' screens free.')); }
      else if (TT.account && TT.account.enabled && !TT.account.isPremium()) screenMsg.append(TT.upsell('The Free plan saves ' + max + (max === 1 ? ' screen' : ' screens') + '. Delete one to make room, or save as many as you like with Plus.'));
      else screenMsg.textContent = 'You can save up to ' + max + (max === 1 ? ' screen' : ' screens') + '. Delete one to make room.';
      screenMsg.classList.add('warn');
    }
    function bgCss(st) {
      if (!st) return '#8EC5FF';
      if (st.bg === 'color') return st.customColor || '#7CC8FF';
      if (st.bg === 'photo') return '#555';
      var b = allBackgrounds().filter(function (x) { return x.id === st.bg; })[0];
      return b ? (b.thumb || b.css) : '#8EC5FF';
    }
    function unrenderAll() {
      if (TT.closeLookPop) TT.closeLookPop();
      Object.keys(mounted).forEach(function (k) { if (mounted[k] && mounted[k].destroy) mounted[k].destroy(); });
      mounted = {}; canvas.querySelectorAll('.widget').forEach(function (n) { n.remove(); });
    }
    function loadState() {
      if (!state || !Array.isArray(state.widgets)) { state = { bg: 'morning', widgets: [] }; seed(); }
      else requestAnimationFrame(function () { state.widgets.forEach(function (w) { clamp(w); renderWidget(w); }); });
      setBg(state.bg || 'morning');
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
      organizer.forgetUndo();
      if (screens.list.length >= TT.config.maxScreens) { if (TT.account && TT.account.signedIn() && !TT.premium.has()) TT.premium.open('screens'); paintScreens(); return; }
      save();
      var st = copy ? JSON.parse(JSON.stringify(state)) : { bg: state.bg || 'morning', widgets: [] };
      if (copy) st.widgets.forEach(function (w, i) { w.id = 'w' + Date.now().toString(36) + i; });
      var sc = { id: 's' + Date.now().toString(36), name: screenName.value.trim() || 'Screen ' + (screens.list.length + 1), state: st };
      screens.list.push(sc); screenName.value = '';
      unrenderAll(); screens.active = sc.id; state = st;
      loadState(); save(); screenPanel.hidden = true;
    }
    // A template becomes a new saved screen, so the screen you were on is never changed.
    function addTemplate(t) {
      organizer.forgetUndo();
      var replace = !canSave();   // signed out: a template takes over the one working screen
      if (!replace && screens.list.length >= TT.config.maxScreens) { if (TT.account && TT.account.signedIn() && !TT.premium.has()) TT.premium.open('screens'); paintScreens(); return; }
      save();
      var b = bounds(), st = t.build(b);
      st.ref = b;
      st.widgets.forEach(function (w, i) { w.id = 'w' + Date.now().toString(36) + i; w.x = Math.round(w.x); w.y = Math.round(w.y); w.w = Math.round(w.w); w.h = Math.round(w.h); if (!w.data) w.data = TYPES[w.type] && TYPES[w.type].init ? TYPES[w.type].init() : {}; });
      st.widgets = st.widgets.filter(function (w) { return TYPES[w.type]; });
      var sc = { id: 's' + Date.now().toString(36), name: screenName.value.trim() || t.name, state: st };
      if (replace) screens.list = screens.list.filter(function (x) { return x.id !== screens.active; });
      screens.list.push(sc); screenName.value = '';
      unrenderAll(); screens.active = sc.id; state = st;
      loadState(); save(); screenPanel.hidden = true;
    }
    // Delete any saved screen (from Organize). Deleting the one on the board shows its neighbor.
    function removeScreen(id) {
      if (screens.list.length <= 1) return;
      var i = screens.list.map(function (x) { return x.id; }).indexOf(id);
      if (i < 0) return;
      if (id !== screens.active) { screens.list.splice(i, 1); save(); paintScreens(); return; }
      save(); unrenderAll();
      screens.list.splice(i, 1);
      screens.active = screens.list[Math.min(i, screens.list.length - 1)].id; state = activeScreen().state;
      loadState(); save();
    }
    // Undo a delete: the screen goes back in its old spot (and back on the board if it was showing).
    function restoreScreen(sc, index, wasActive) {
      if (screens.list.length >= TT.config.maxScreens) { paintScreens(); return true; }
      screens.list.splice(Math.min(index, screens.list.length), 0, sc);
      if (!wasActive) { save(); paintScreens(); return true; }
      save(); unrenderAll();
      screens.active = sc.id; state = sc.state;
      loadState(); save();
      return true;
    }

    // Signed out: a small chip says the board isn't being saved, and the first visit explains why.
    var unsavedChip = h('a', { class: 'btn glass small unsaved-chip', href: '/account', title: 'Sign In to Save', onclick: function () { TT.account.wantSignIn = true; } },
      h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { text: 'Not Saved · Sign In' }));
    function signInNote(text) {
      return h('p', { class: 'upsell' }, h('span', { text: text + ' ' }), h('a', { href: '/account', text: 'Sign In', onclick: function () { TT.account.wantSignIn = true; } }));
    }
    function paintSaveState() { unsavedChip.hidden = canSave(); }
    if (TT.account && TT.account.onChange) TT.account.onChange(function () { paintSaveState(); paintScreens(); });
    paintSaveState();

    var fsBtn = TT.canFullscreen ? TT.button('Full Screen', { icon: 'expand', kind: 'glass', title: 'Full Screen', onclick: function () { TT.toggleFullscreen(); } }) : null;
    bgBtn.title = 'Background'; clearBtn.title = 'Clear the Board'; screenBtn.title = 'Saved Screens';
    var top = h('div', { class: 'board-top' },
      h('div', { class: 'row' }, h('a', { class: 'btn glass', href: '/', title: 'All Tools', html: TT.icon('back') + '<span>All Tools</span>' }), h('div', { class: 'bg-wrap' }, screenBtn, screenPanel), screenNav, unsavedChip),
      h('div', { class: 'row' }, clearConfirm, clearBtn, h('div', { class: 'bg-wrap' }, bgBtn, bgPanel),
        fsBtn)
    );

    var dock = h('div', { class: 'dock', role: 'toolbar', 'aria-label': 'Add a widget' });
    Object.keys(TYPES).forEach(function (t) {
      dock.append(h('button', { type: 'button', class: 'dock-btn', title: 'Add ' + TYPES[t].title.toLowerCase(), onclick: function () { addWidget(t); } },
        h('span', { class: 'dock-icon', style: 'background:' + (TYPES[t].color || '#0E1120'), html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + TYPES[t].icon + '</svg>' }),
        h('span', { class: 'dock-label', text: TYPES[t].title })));
    });

    // ----- Drawing tools (tools/board-pen.js): pen, highlighter, eraser and shapes drawn on top of everything -----
    var penApi = TT.boardPen({ canvas: canvas, dock: dock, bounds: bounds, getState: function () { return state; }, save: function () { save(); } });
    function drawInk() { penApi.draw(); }

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

    // Saving needs an account (Free or Premium). Signed out, the board still works but forgets your changes.
    function canSave() { return !TT.limit || TT.limit('saveBoard') !== false; }
    function save() { activeScreen().state = state; if (canSave()) TT.save('board-screens', screens); }
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
          try { localStorage.setItem('tt:board-photo', JSON.stringify(data)); photoMsg.hidden = true; if (TT.changed) TT.changed('tt:board-photo'); }
          catch (e) { photoMsg.textContent = 'That photo is too big to save. Try a smaller one.'; photoMsg.hidden = false; return; }
          setBg('photo');
        };
        img.onerror = function () { photoMsg.textContent = 'That file isn’t a picture this browser can open. Try a JPG or PNG.'; photoMsg.hidden = false; };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    function bounds() { return { w: canvas.clientWidth || window.innerWidth, h: canvas.clientHeight || window.innerHeight - 160 }; }
    // Widgets are saved in the measurements of the screen they were arranged on (state.ref).
    // On any other screen size the whole layout is scaled to fit, so nothing overlaps or falls off.
    function ref() {
      if (!state.ref || !(state.ref.w > 0) || !(state.ref.h > 0)) {
        if (!canvas.clientWidth) return bounds();
        state.ref = bounds();
      }
      return state.ref;
    }
    function scale() {
      var b = bounds(), r = ref(), k = Math.min(b.w / r.w, b.h / r.h);
      if (!(k > 0) || Math.abs(k - 1) < 0.02) return 1;
      return Math.max(0.3, Math.min(3, k));
    }
    function clamp(w) {
      var b = ref();
      w.w = Math.max(160, Math.min(w.w, b.w));
      w.h = Math.max(120, Math.min(w.h, b.h));
      w.x = Math.max(0, Math.min(w.x, b.w - w.w));
      w.y = Math.max(0, Math.min(w.y, b.h - w.h));
    }

    function addWidget(type) {
      if (!state.widgets.length && canvas.clientWidth) state.ref = bounds();
      var t = TYPES[type], b = ref();
      var n = state.widgets.length;
      var w = { id: 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), type: type, w: t.w, h: t.h,
        x: (b.w - t.w) / 2 + (n % 5) * 24, y: Math.max(0, (b.h - t.h) / 2 - 40) + (n % 5) * 24, data: {} };
      if (type === 'text') w.data = { text: 'Type your message here', size: 40, bold: true, color: 'ink' };
      if (type === 'traffic') w.data = { on: 'green' };
      if (t.init) w.data = t.init();
      if (state.look) w.look = state.look;   // after "Use on All Widgets", new widgets match too
      clamp(w);
      state.widgets.push(w); save();
      renderWidget(w, true);
    }

    // A new look shows through a text box only when the box uses its plain color.
    function setLook(x, look) {
      if (look) x.look = look; else delete x.look;
      if (x.type === 'text' && x.data && x.data.box && x.data.box !== 'default') x.data.box = 'default';
      var n = canvas.querySelector('[data-id="' + x.id + '"]');
      if (n && TT.applyLook) TT.applyLook(n, x);
      if (mounted[x.id] && mounted[x.id].restyle) mounted[x.id].restyle();
    }

    function removeWidget(id) {
      if (TT.closeLookPop) TT.closeLookPop();
      state.widgets = state.widgets.filter(function (w) { return w.id !== id; });
      var node = canvas.querySelector('[data-id="' + id + '"]');
      if (mounted[id] && mounted[id].destroy) mounted[id].destroy();
      delete mounted[id];
      if (node) node.remove();
      save();
    }

    function place(node, w) {
      var k = scale(), b = bounds(), r = ref();
      var fx = r.w > w.w ? w.x / (r.w - w.w) : 0, fy = r.h > w.h ? w.y / (r.h - w.h) : 0;
      node.style.zoom = k === 1 ? '' : k;
      node.style.left = Math.max(0, fx * (b.w - w.w * k)) / k + 'px'; node.style.top = Math.max(0, fy * (b.h - w.h * k)) / k + 'px';
      node.style.width = w.w + 'px'; node.style.height = w.h + 'px';
      node.style.transform = w.rot ? 'rotate(' + w.rot + 'deg)' : '';
    }

    function renderWidget(w, fresh) {
      var t = TYPES[w.type];
      if (!t) return;
      var body = h('div', { class: 'w-body' });
      var closeBtn = h('button', { type: 'button', class: 'w-close', 'aria-label': 'Close ' + t.title, title: 'Close', html: TT.icon('close'), onclick: function () { removeWidget(w.id); } });
      var lockBtn = h('button', { type: 'button', class: 'w-close w-lock', onclick: function () { w.locked = !w.locked; paintLock(); save(); } });
      // Colors button (tools/board-looks.js): a palette for this widget, or for every widget at once.
      var lookBtn = TT.lookButton ? TT.lookButton({ widget: w, title: t.title,
        set: function (look) { setLook(w, look); save(); },
        setAll: function (look) { state.look = look || undefined; state.widgets.forEach(function (x) { setLook(x, look); }); save(); } }) : null;
      var head = h('div', { class: 'w-head' }, h('span', { class: 'w-title', text: t.title }), h('span', { class: 'w-btns' }, lookBtn, lockBtn, closeBtn));
      var node = h('div', { class: 'widget w-' + w.type + (fresh ? ' fresh' : ''), 'data-id': w.id }, head, body);
      if (TT.applyLook) TT.applyLook(node, w);
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
      // The title bar, handles and turn button only show on the box that was clicked last (Kevin, 2026-11-24),
      // so the board looks clean while it is just sitting on the screen.
      function activate() { canvas.querySelectorAll('.widget.active').forEach(function (n) { if (n !== node) n.classList.remove('active'); }); node.classList.add('active'); }
      node.addEventListener('pointerdown', function () { node.style.zIndex = ++z; activate(); });
      node.addEventListener('focusin', activate);
      if (fresh) activate();

      drag(head, function (dx, dy, start) {
        // the pointer moves in screen pixels, the widget is stored in layout measurements
        var k = scale(), b = bounds(), r = ref(), fw = b.w - w.w * k, fh = b.h - w.h * k;
        w.x = fw > 1 ? start.x + dx / fw * (r.w - w.w) : start.x; w.y = fh > 1 ? start.y + dy / fh * (r.h - w.h) : start.y;
        clamp(w); place(node, w);
      }, w, head.querySelector('.w-btns'));
      // Resize handles on every side and corner. Dragging a left or top handle moves that edge and keeps the opposite one still.
      ['n', 'e', 's', 'w', 'ne', 'nw', 'sw', 'se'].forEach(function (dir) {
        var g = h('div', { class: 'w-resize w-rs-' + dir, 'aria-hidden': 'true' });
        node.append(g);
        drag(g, function (dx, dy, start) {
          var k = scale(), r = ref(), X = dx / k, Y = dy / k;
          // a turned box is resized along its own sides, not the screen's
          if (w.rot) { var a = -w.rot * Math.PI / 180, x0 = X; X = x0 * Math.cos(a) - Y * Math.sin(a); Y = x0 * Math.sin(a) + Y * Math.cos(a); }
          var nw = start.w, nh = start.h, nx = start.x, ny = start.y;
          if (dir.indexOf('e') >= 0) nw = Math.min(start.w + X, r.w - start.x);
          if (dir.indexOf('s') >= 0) nh = Math.min(start.h + Y, r.h - start.y);
          if (dir.indexOf('w') >= 0) { nw = Math.max(160, Math.min(start.w - X, start.x + start.w)); nx = start.x + start.w - nw; }
          if (dir.indexOf('n') >= 0) { nh = Math.max(120, Math.min(start.h - Y, start.y + start.h)); ny = start.y + start.h - nh; }
          w.w = nw; w.h = nh; w.x = nx; w.y = ny; clamp(w); place(node, w);
          if (mounted[w.id] && mounted[w.id].restyle) mounted[w.id].restyle();
        }, w);
      });

      // Rotation handle under the box: drag it around to turn the box. It snaps to straight and to every 15 degrees.
      var deg = h('span', { class: 'w-rot-deg' });
      var rot = h('div', { class: 'w-rot', title: 'Turn (Double-Click to Straighten)', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9a9 9 0 0 0 16 0"/><path d="M4 14V9h5M20 14V9h-5"/></svg>' }, deg);
      function paintRot() { deg.textContent = Math.round(w.rot || 0) + '°'; node.classList.toggle('turned', !!w.rot); }
      paintRot();
      rot.addEventListener('pointerdown', function (e) {
        if (w.locked) return;
        e.preventDefault(); e.stopPropagation(); rot.setPointerCapture(e.pointerId);
        var r = node.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        function ang(ev) { return Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180 / Math.PI; }
        var a0 = ang(e), r0 = w.rot || 0;
        node.classList.add('turning');
        function mv(ev) {
          var v = r0 + ang(ev) - a0; v = ((v + 180) % 360 + 360) % 360 - 180;
          var near = Math.round(v / 15) * 15; if (Math.abs(v - near) < 4) v = near;
          w.rot = Math.round(v) || 0; place(node, w); paintRot();
        }
        function up() { rot.removeEventListener('pointermove', mv); rot.removeEventListener('pointerup', up); rot.removeEventListener('pointercancel', up); node.classList.remove('turning'); save(); }
        rot.addEventListener('pointermove', mv); rot.addEventListener('pointerup', up); rot.addEventListener('pointercancel', up);
      });
      rot.addEventListener('dblclick', function () { if (w.locked) return; w.rot = 0; place(node, w); paintRot(); save(); });
      node.append(rot);

      if (!w.data) w.data = {};
      mounted[w.id] = (WIDGETS[w.type] || t.mount)(body, w, save) || {};
    }

    // Clicking anywhere that is not a widget puts every title bar away again.
    document.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('.widget, .look-pop, .look-panel')) return;
      canvas.querySelectorAll('.widget.active').forEach(function (n) { n.classList.remove('active'); });
    });
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
        // Two rows of colors: strong on top, soft below. The last soft slot is a special choice.
        var STRONG = ['#0E1120', '#EF4444', '#FB923C', '#FBBF24', '#22C55E', '#22D3EE', '#3B82F6', '#8B5CF6', '#FF4FA3', '#FFFFFF'];
        var SOFT = ['#9CA3AF', '#FECACA', '#FED7AA', '#FEF3C7', '#DCFCE7', '#CFFAFE', '#DBEAFE', '#DDD6FE', '#FBCFE8'];
        var TEXT_COLORS = STRONG.concat(SOFT, ['auto']);
        var BOX_COLORS = STRONG.concat(['default'], SOFT.slice(1), ['clear']);
        var HL_COLORS = ['#FDE047', '#FDBA74', '#FCA5A5', '#F9A8D4', '#D8B4FE', '#93C5FD', '#67E8F9', '#86EFAC', '#D1D5DB', 'clear'];
        if (!d.font) d.font = 'modern';
        if (!d.align) d.align = 'left';
        if (!d.box) d.box = 'default';
        if (!d.color || d.color === 'ink') d.color = 'auto';

        // The message is rich text, so single words or lines can have their own color.
        function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
        // Keep only line breaks and the styles the toolbar can give (color, highlight, bold, italic, underline, strikethrough, font, size); drop every other tag and attribute.
        function clean(html) {
          var t = document.createElement('template'); t.innerHTML = html;
          (function walk(n) {
            [].slice.call(n.childNodes).forEach(function (c) {
              if (c.nodeType === 3) return;
              if (c.nodeType !== 1) { c.remove(); return; }
              var tag = c.tagName;
              if (['BR', 'DIV', 'SPAN', 'FONT', 'P', 'B', 'I', 'U', 'S', 'STRIKE', 'STRONG', 'EM'].indexOf(tag) < 0) {
                if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META'].indexOf(tag) >= 0) { c.remove(); return; }
                walk(c); c.replaceWith.apply(c, [].slice.call(c.childNodes)); return;
              }
              var col = (c.style && c.style.color) || c.getAttribute('color') || '', bg = (c.style && c.style.backgroundColor) || '';
              var cs = c.style || {}, fw = cs.fontWeight, fi = cs.fontStyle, td = cs.textDecorationLine || cs.textDecoration, ff = cs.fontFamily, fz = cs.fontSize;
              [].slice.call(c.attributes).forEach(function (a) { c.removeAttribute(a.name); });
              if (fw && /^(bold|normal|[1-9]00)$/.test(fw)) c.style.fontWeight = fw;
              if (fi && /^(italic|normal)$/.test(fi)) c.style.fontStyle = fi;
              if (td && /^(underline|line-through|none)( (underline|line-through))?$/.test(td)) c.style.textDecorationLine = td;
              if (ff && /^[\w\s,"'-]+$/.test(ff)) c.style.fontFamily = ff;
              if (fz && /^[\d.]+(em|px|%)$/.test(fz)) c.style.fontSize = fz;
              if (col && /^[#a-z0-9(),.\s%]+$/i.test(col)) c.style.color = col;
              if (bg && bg !== 'transparent' && /^[#a-z0-9(),.\s%]+$/i.test(bg)) c.style.backgroundColor = bg;
              walk(c);
            });
          })(t.content);
          return t.innerHTML;
        }
        var area = h('div', { class: 'note-area', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true', 'aria-label': 'Message', id: 'txt-' + w.id, 'data-ph': 'Type here', spellcheck: 'false' });
        // Underline used to be a whole-box switch. It now lives in the text itself, so single words can have it.
        if (d.underline) { d.html = '<span style="text-decoration-line: underline;">' + (d.html != null ? d.html : esc(d.text || '').replace(/\n/g, '<br>')) + '</span>'; d.underline = false; }
        area.innerHTML = clean(d.html != null ? d.html : esc(d.text || '').replace(/\n/g, '<br>'));
        function keepText() { if (area.innerHTML === '<br>') area.innerHTML = ''; d.html = area.innerHTML; d.text = area.innerText; save(); }
        area.addEventListener('input', keepText);
        area.addEventListener('paste', function (e) {
          e.preventDefault();
          var t = (e.clipboardData || window.clipboardData).getData('text');
          document.execCommand('insertText', false, t);
        });
        // Remember where the cursor or highlight was, so a color can still be applied after the color picker takes focus.
        var lastRange = null;
        document.addEventListener('selectionchange', function () {
          var sel = window.getSelection();
          if (sel.rangeCount && area.contains(sel.anchorNode) && area.contains(sel.focusNode)) lastRange = sel.getRangeAt(0).cloneRange();
          if (node.isConnected) marks();
        });
        area.addEventListener('blur', function () { setTimeout(function () { if (!node.contains(document.activeElement)) lastRange = null; }, 0); });
        // Color only the highlighted words, or what is typed next. With no cursor in the box, color the whole box.
        function intoText() {
          var sel = window.getSelection();
          var inside = document.activeElement === area && sel.rangeCount && area.contains(sel.anchorNode);
          if (!inside && lastRange) { area.focus(); sel.removeAllRanges(); sel.addRange(lastRange); inside = true; }
          return inside;
        }
        // Highlight the selected words (or what is typed next) like a marker. With no cursor in the box, highlight all of it.
        var hlNow = '#FDE047';
        function hiliteText(c) {
          if (c !== 'clear') hlNow = c;
          var sel = window.getSelection();
          if (!intoText()) { area.focus(); sel.selectAllChildren(area); }
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('hiliteColor', false, c === 'clear' ? 'transparent' : c);
          keepText(); style();
        }
        function colorText(c) {
          var sel = window.getSelection();
          var inside = intoText();
          if (!inside) { set('color', c); return; }
          document.execCommand('styleWithCSS', false, true);
          if (c === 'auto') {
            if (sel.isCollapsed) document.execCommand('foreColor', false, getComputedStyle(area).color);
            else document.execCommand('removeFormat', false, null);
          } else document.execCommand('foreColor', false, c);
          keepText();
        }

        // Bold, italic, underline and strikethrough change the highlighted words, or what is typed next.
        // With no cursor in the box, bold and italic switch the whole box; underline and strikethrough cover all of the text.
        function fmt(cmd, key) {
          var sel = window.getSelection();
          if (!intoText()) {
            if (key) { set(key, !d[key]); return; }
            area.focus(); sel.selectAllChildren(area);
          }
          document.execCommand('styleWithCSS', false, true);
          document.execCommand(cmd, false, null);
          keepText(); marks();
        }
        function inText() { var sel = window.getSelection(); return document.activeElement === area && sel.rangeCount && area.contains(sel.anchorNode); }
        function hasRange() { return lastRange && !lastRange.collapsed && node.contains(document.activeElement); }
        function state(cmd) { try { return document.queryCommandState(cmd); } catch (e) { return false; } }
        // Show which styles the cursor is sitting in.
        function marks() {
          var inside = inText();
          boldBtn.classList.toggle('on', inside ? state('bold') : !!d.bold);
          italBtn.classList.toggle('on', inside ? state('italic') : !!d.italic);
          undBtn.classList.toggle('on', inside && state('underline'));
          strikeBtn.classList.toggle('on', inside && state('strikeThrough'));
        }
        // A different font or size for just the highlighted words.
        function fontFor(family) {
          intoText();
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('fontName', false, family);
          keepText();
        }
        function sizeFor(step) {
          intoText();
          var sel = window.getSelection(), at = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode);
          var base = parseFloat(getComputedStyle(area).fontSize) || 1, cur = at ? parseFloat(getComputedStyle(at).fontSize) : base;
          var target = Math.max(0.3, Math.min(5, cur / base + step * 0.15));
          document.execCommand('styleWithCSS', false, true);
          document.execCommand('fontSize', false, 7);
          [].forEach.call(area.querySelectorAll('span, font'), function (n) {
            if (n.style.fontSize !== 'xxx-large' && n.getAttribute('size') !== '7') return;
            n.removeAttribute('size');
            var parent = parseFloat(getComputedStyle(n.parentNode).fontSize) || base;
            n.style.fontSize = (target * base / parent).toFixed(3) + 'em';
            // words inside that already had their own size follow the new one
            [].forEach.call(n.querySelectorAll('[style]'), function (k) { k.style.fontSize = ''; });
          });
          keepText();
        }

        function lum(hex) { var n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000; }
        function set(k, v) { d[k] = v; style(); save(); }
        function tb(label, aria, key, html) {
          return h('button', { type: 'button', class: 'tb tb-' + key, 'aria-label': aria, title: aria, html: html || label, onclick: function () {
            if (key === 'bold') fmt('bold', 'bold'); else if (key === 'italic') fmt('italic', 'italic'); else if (key === 'underline') fmt('underline'); else if (key === 'strike') fmt('strikeThrough'); else set(key, !d[key]);
          } });
        }
        var fontSel = h('select', { class: 'tb-select', 'aria-label': 'Font', id: 'font-' + w.id }, FONTS.map(function (f) {
          var o = h('option', { value: f[0], text: f[1] }); o.style.fontFamily = f[2]; return o;
        }));
        fontSel.addEventListener('change', function () {
          var f = FONTS.filter(function (x) { return x[0] === fontSel.value; })[0] || FONTS[0];
          if (hasRange()) { fontFor(f[2]); fontSel.value = d.font; } else set('font', fontSel.value);
        });
        var boldBtn = tb('B', 'Bold', 'bold'), italBtn = tb('I', 'Italic', 'italic'), undBtn = tb('U', 'Underline', 'underline');
        var strikeBtn = tb('S', 'Strikethrough', 'strike'), shadowBtn = tb('A', 'Text Shadow', 'shadow');
        var alignIcons = {
          left: '<path d="M4 6h16M4 11h10M4 16h14"/>', center: '<path d="M4 6h16M7 11h10M5 16h14"/>', right: '<path d="M4 6h16M10 11h10M6 16h14"/>'
        };
        var aligns = ['left', 'center', 'right'].map(function (al) {
          return h('button', { type: 'button', class: 'tb', 'data-al': al, 'aria-label': 'Align ' + al, title: 'Align ' + al,
            html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">' + alignIcons[al] + '</svg>', onclick: function () { set('align', al); } });
        });
        var midBtn = h('button', { type: 'button', class: 'tb', 'aria-label': 'Center up and down', title: 'Center Up and Down',
          html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 12h16M12 3v5M9.5 5.5 12 8l2.5-2.5M12 21v-5M9.5 18.5 12 16l2.5 2.5"/></svg>',
          onclick: function () { set('middle', !d.middle); } });

        // A palette: two rows of ten, then the teacher's own saved colors and a "+" to add one.
        function palette(list, key, label) {
          function pick(c) { if (key === 'color') colorText(c); else if (key === 'hl') hiliteText(c); else set(key, c); }
          var custom = h('input', { type: 'color', class: 'pal-input', 'aria-label': label + ': add a color', title: 'Add a Color' });
          custom.addEventListener('change', function () {
            var mine = TT.load('board-colors', []) || [], v = custom.value.toUpperCase();
            if (mine.indexOf(v) < 0) { mine.unshift(v); TT.save('board-colors', mine.slice(0, 9)); }
            pick(v); paintMine();
          });
          function dot(c) {
            var special = c === 'auto' || c === 'default' || c === 'clear';
            var name = c === 'auto' ? 'Automatic' : c === 'default' ? 'Standard' : c === 'clear' ? (key === 'hl' ? 'No Highlight' : 'See-Through') : c;
            return h('button', { type: 'button', class: 'dot' + (special ? ' dot-' + c : ''), 'data-c': c, style: special ? null : 'background:' + c, 'aria-label': label + ': ' + name, title: name, onclick: function () { pick(c); } });
          }
          var btns = list.map(dot), mineRow = h('div', { class: 'pal-mine' });
          function paintMine() {
            mineRow.textContent = '';
            (TT.load('board-colors', []) || []).forEach(function (c) { if (/^#[0-9A-F]{6}$/i.test(c)) mineRow.append(dot(c)); });
            mineRow.append(h('label', { class: 'pal-add', title: 'Add a Color' }, h('span', { 'aria-hidden': 'true', text: '+' }), custom));
          }
          paintMine();
          return { el: h('div', { class: 'pal', hidden: true }, h('div', { class: 'pal-grid' }, btns), h('span', { class: 'tb-label pal-label', text: 'My Colors' }), mineRow), btns: btns, paintMine: paintMine };
        }
        var textSw = palette(TEXT_COLORS, 'color', 'Text');
        var boxSw = palette(BOX_COLORS, 'box', 'Box');
        var hlSw = palette(HL_COLORS, 'hl', 'Highlight');
        var palOpen = '';
        function tab(key, word, tip) {
          return h('button', { type: 'button', class: 'tb pal-tab', title: tip, 'aria-label': tip, onclick: function () { palOpen = palOpen === key ? '' : key; style(); } }, h('i', { class: 'pal-now' }), h('span', { text: word }));
        }
        var textTab = tab('color', 'Text', 'Text Color'), hlTab = tab('hl', 'Highlight', 'Highlight Color'), boxTab = tab('box', 'Box', 'Box Color');

        var bar = h('div', { class: 'text-toolbar' },
          h('div', { class: 'tb-panel' },
            h('div', { class: 'tb-row tb-one' }, fontSel,
              h('button', { type: 'button', class: 'tb', 'aria-label': 'Smaller text', title: 'Smaller', text: 'A−', onclick: function () { if (hasRange()) sizeFor(-1); else set('size', Math.max(12, d.size - 4)); } }),
              h('button', { type: 'button', class: 'tb', 'aria-label': 'Bigger text', title: 'Bigger', text: 'A+', onclick: function () { if (hasRange()) sizeFor(1); else set('size', Math.min(200, d.size + 4)); } }),
              h('span', { class: 'tb-sep' }), boldBtn, italBtn, undBtn, strikeBtn, shadowBtn,
              h('span', { class: 'tb-sep' }), aligns, midBtn,
              h('span', { class: 'tb-sep' }), textTab, hlTab, boxTab),
            textSw.el, hlSw.el, boxSw.el));
        // Clicking the toolbar must not take the cursor out of the text.
        bar.addEventListener('mousedown', function (e) { if (!e.target.closest('select, input, label')) e.preventDefault(); });
        body.append(area, bar);

        function style() {
          var f = FONTS.filter(function (x) { return x[0] === d.font; })[0] || FONTS[0];
          fontSel.value = f[0];
          area.style.fontFamily = f[2];
          area.style.fontSize = d.size + 'px';
          area.style.fontWeight = d.bold ? '700' : '400';
          area.style.fontStyle = d.italic ? 'italic' : 'normal';
          area.style.textDecoration = 'none';
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
          marks(); shadowBtn.classList.toggle('on', !!d.shadow); midBtn.classList.toggle('on', !!d.middle);
          aligns.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-al') === d.align); });
          textSw.btns.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-c') === d.color); });
          boxSw.btns.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-c') === d.box); });
          textSw.el.hidden = palOpen !== 'color'; boxSw.el.hidden = palOpen !== 'box'; hlSw.el.hidden = palOpen !== 'hl';
          textTab.classList.toggle('on', palOpen === 'color'); boxTab.classList.toggle('on', palOpen === 'box'); hlTab.classList.toggle('on', palOpen === 'hl');
          hlTab.firstChild.style.background = hlNow;
          textTab.firstChild.style.background = color;
          boxTab.firstChild.style.background = custom ? d.box : clear ? 'transparent' : 'var(--surface)';
        }
        area.addEventListener('input', function () { if (d.middle) style(); });
        // Open the toolbar above the box when there is no room below it.
        node.addEventListener('pointerenter', function () { node.classList.toggle('tb-up', w.y + w.h + 230 > ref().h); });
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
        if (canvas.clientWidth) state.ref = bounds();
        var b = ref();
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

    // Keep the whole widget bar on screen on narrow displays.
    function fitDock() {
      dock.style.zoom = '';
      var room = dockWrap.clientWidth - 32, need = dock.scrollWidth;
      if (room > 0 && need > room + 1) dock.style.zoom = Math.max(0.5, room / need);
    }
    window.addEventListener('resize', function () {
      drawInk(); fitDock();
      state.widgets.forEach(function (w) { clamp(w); var n = canvas.querySelector('[data-id="' + w.id + '"]'); if (n) place(n, w); });
    });

    return {
      show: function () {
        // My Account's Saved Boards chips ask for one screen (tools/account-home.js).
        if (TT.boardWant) { var want = TT.boardWant; TT.boardWant = null; if (screens.list.some(function (x) { return x.id === want; })) switchTo(want); }
        paintSaveState();
        if (!canSave() && TT.boardIntro) TT.boardIntro();
        requestAnimationFrame(function () {
          drawInk(); fitDock();
          state.widgets.forEach(function (w) { clamp(w); var n = canvas.querySelector('[data-id="' + w.id + '"]'); if (n) place(n, w); });
        });
      }
    };
  };
})();
