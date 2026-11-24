// Morning Meeting (2026-11-24 look). The standard page is free: the greeting and message, today's
// weather (Kevin's weather pictures in assets/weather/) and Would You Rather. With Plus a teacher can
// press Customize to drag the tiles into a new order, change their size, and add extra widgets
// (schedule, countdown, class poll, timer and more). The layout is saved with the rest of the page.
(function () {
  var TT = window.TT, h = TT.h;
  var WEATHER = [['sunny', 'Sunny'], ['partly', 'Partly Cloudy'], ['cloudy', 'Cloudy'], ['rainy', 'Rainy'], ['stormy', 'Stormy'], ['snowy', 'Snowy'], ['windy', 'Windy'], ['foggy', 'Foggy']];
  function svg(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var ICO = {
    hello: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
    weather: '<circle cx="8" cy="9" r="3"/><path d="M8 3v1M3 9H2M4.500 5.500l-.700-.700M11.500 5.500l.700-.700"/><path d="M9 20h8a3.500 3.500 0 0 0 .500-7 5 5 0 0 0-9.500 1.500A2.800 2.800 0 0 0 9 20z"/>',
    wyr: '<path d="M4 4h7v7H4zM13 13h7v7h-7z"/><path d="M13 7h4l-2-2M11 17H7l2 2"/>',
    note: '<path d="M5 4h14v10l-5 6H5z"/><path d="M14 20v-6h5M8 8h8M8 11h5"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
    grip: '<circle cx="9" cy="6" r="1.300" fill="currentColor"/><circle cx="15" cy="6" r="1.300" fill="currentColor"/><circle cx="9" cy="12" r="1.300" fill="currentColor"/><circle cx="15" cy="12" r="1.300" fill="currentColor"/><circle cx="9" cy="18" r="1.300" fill="currentColor"/><circle cx="15" cy="18" r="1.300" fill="currentColor"/>',
    left: '<path d="m14 6-6 6 6 6"/>', right: '<path d="m10 6 6 6-6 6"/>',
    size: '<path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4"/>'
  };
  // The extra widgets a Plus teacher can add. Most are the same widgets the Classroom Board uses.
  var EXTRAS = [
    ['schedule', 'Today’s Schedule', 'sky', 2], ['countdown', 'Countdown', 'amber', 1], ['poll', 'Class Poll', 'violet', 1], ['note', 'Sticky Note', 'amber', 1],
    ['timer', 'Timer', 'emerald', 1], ['stopwatch', 'Stopwatch', 'emerald', 1], ['workmode', 'Work Mode', 'coral', 1], ['dice', 'Dice', 'rose', 1], ['spinner', 'Spinner', 'sky', 1], ['image', 'Picture', 'cobalt', 1]
  ];
  var EX = {}; EXTRAS.forEach(function (e) { EX[e[0]] = e; });
  function extraIcon(type) { var w = TT.boardWidgets && TT.boardWidgets[type]; return ICO[type] || (w && w.icon) || ICO.note; }
  var STANDARD = ['hello', 'weather', 'wyr'], SIZE0 = { hello: 3, weather: 1, wyr: 2 };
  var SIZE_NAME = { 1: 'Small', 2: 'Medium', 3: 'Wide' };

  TT.mountMorning = function (el) {
    var state = TT.load('morning', { message: 'Welcome! Unpack, turn in your homework and start your morning work.', weather: {}, temp: {} });
    var L = state.layout = state.layout || {};
    if (!Array.isArray(L.order)) L.order = STANDARD.slice();
    if (!Array.isArray(L.extras)) L.extras = [];
    L.size = L.size || {};
    STANDARD.forEach(function (id) { if (L.order.indexOf(id) < 0) L.order.push(id); });
    L.order = L.order.filter(function (id) { return STANDARD.indexOf(id) >= 0 || L.extras.some(function (x) { return x.id === id; }); });
    function save() { TT.save('morning', state); }
    function plus() { return !TT.premium || TT.premium.has(); }

    var editing = false, tiles = {}, painters = [], handles = [];
    var grid = h('div', { class: 'mm2-grid' });
    var bar = h('div', { class: 'mm2-bar' }), tray = h('div', { class: 'mm2-tray', hidden: true });
    var root = h('div', { class: 'mm2' }, bar, grid, tray);
    el.textContent = ''; el.append(root);

    // ---------- The tiles ----------
    function shell(id, title, color, icon, body, cls) {
      var tools = h('div', { class: 'mm2-tools' });
      var head = h('header', { class: 'mm2-head' }, h('span', { class: 'mm2-ico', html: svg(icon) }), h('h2', { text: title }), tools);
      var t = h('section', { class: 'mm2-tile c-' + color + ' ' + (cls || ''), 'data-id': id, 'aria-label': title }, head, body);
      tiles[id] = { el: t, tools: tools, head: head, title: title };
      return t;
    }
    function hello() {
      var greet = h('h1', { class: 'mm2-greeting' });
      var dWeek = h('span'), dNum = h('b'), dMonth = h('span');
      var msg = h('textarea', { class: 'mm2-message', id: 'mmMessage', rows: 2, 'aria-label': 'Message for the class', placeholder: 'Type a message for the class' });
      msg.value = state.message || '';
      function grow() { msg.style.height = 'auto'; msg.style.height = msg.scrollHeight + 2 + 'px'; }
      msg.addEventListener('input', function () { state.message = msg.value; save(); grow(); });
      var buddy = TT.mascot ? TT.mascot({ mood: 'wave' }) : null;
      var t = shell('hello', 'Greeting', 'amber', ICO.hello, h('div', { class: 'mm2-hello' },
        h('div', { class: 'mm2-date', 'aria-hidden': 'true' }, dWeek, dNum, dMonth),
        h('div', { class: 'mm2-hello-text' }, greet, h('label', { class: 'mm2-msg-label', for: 'mmMessage', text: 'Today’s Message' }), msg),
        buddy ? h('div', { class: 'mm2-buddy' }, buddy) : null), 'mm2-hero mm-hero');
      painters.push(function () {
        var d = new Date(), c = TT.clock ? TT.clock() : null, hr = c ? c.hour : d.getHours();
        var who = (TT.settings && TT.settings.className) || 'Class';
        greet.textContent = (hr < 5 ? 'Hello, ' : hr < 12 ? 'Good Morning, ' : hr < 17 ? 'Good Afternoon, ' : 'Good Evening, ') + who + '!';
        var parts = (c ? c.text : d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })).split(/,?\s+/);
        dWeek.textContent = parts[0] || ''; dMonth.textContent = parts[1] || ''; dNum.textContent = parts[2] || '';
        t.setAttribute('data-time', hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening');
        grow();
      });
      setTimeout(grow, 0);
      return t;
    }
    function weather() {
      var big = h('div', { class: 'mm2-wx-big' });
      var temp = h('input', { type: 'text', id: 'mmTemp', class: 'mm2-temp', inputmode: 'numeric', maxlength: 4, placeholder: '?', 'aria-label': 'Temperature' });
      temp.addEventListener('input', function () { state.temp = { day: TT.today(), v: temp.value.replace(/[^0-9\-]/g, '') }; save(); });
      var pick = h('div', { class: 'mm2-wx-pick', role: 'group', 'aria-label': 'Today’s weather' }, WEATHER.map(function (w) {
        return h('button', { type: 'button', class: 'mm2-wx', 'data-w': w[0], title: w[1], 'aria-label': w[1], onclick: function () { state.weather = { day: TT.today(), v: w[0] }; save(); paintWx(true); if (TT.tick) TT.tick(); } },
          h('img', { src: '/assets/weather/' + w[0] + '.webp', alt: '', draggable: 'false' }));
      }));
      var t = shell('weather', 'Today’s Weather', 'sky', ICO.weather, h('div', { class: 'mm2-weather' }, big,
        h('label', { class: 'mm2-temp-row', for: 'mmTemp' }, h('span', { class: 'mm2-temp-lab', text: 'Temperature' }), temp, h('b', { text: '°F' })), pick));
      function paintWx(pop) {
        var cur = state.weather && state.weather.day === TT.today() ? state.weather.v : null;
        var w = WEATHER.filter(function (x) { return x[0] === cur; })[0];
        big.textContent = '';
        if (w) big.append(h('img', { class: 'mm2-wx-art' + (pop ? ' pop' : ''), src: '/assets/weather/' + w[0] + '.webp', alt: '' }), h('b', { text: w[1] }));
        else big.append(h('b', { class: 'ask', text: 'What’s the Weather Today?' }), h('span', { text: 'Pick a picture below.' }));
        big.classList.toggle('unset', !w);
        t.setAttribute('data-wx', cur || '');
        pick.querySelectorAll('.mm2-wx').forEach(function (b) { var on = b.getAttribute('data-w') === cur; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        if (document.activeElement !== temp) temp.value = state.temp && state.temp.day === TT.today() ? state.temp.v : '';
      }
      painters.push(function () { paintWx(false); });
      return t;
    }
    function wyr() {
      var box = h('div', { class: 'w-body mm-wyr mm2-wbody' });
      var t = shell('wyr', 'Would You Rather…', 'rose', ICO.wyr, box);
      if (TT.mountWYR) TT.mountWYR(box, { compact: true });
      return t;
    }
    function extra(x) {
      var def = EX[x.type]; if (!def) return null;
      var body, handle = null, bw = TT.boardWidgets && TT.boardWidgets[x.type];
      x.data = x.data || (bw && bw.init ? bw.init() : {});
      if (x.type === 'note') {
        body = h('textarea', { class: 'mm2-note', rows: 4, 'aria-label': 'Sticky note', placeholder: 'Type a note, like a birthday, a reminder or the lunch menu.' });
        body.value = x.data.text || '';
        body.addEventListener('input', function () { x.data.text = body.value; save(); });
      } else {
        body = h('div', { class: 'w-body mm2-wbody t-' + x.type });
        try {
          if (x.type === 'schedule') handle = TT.mountSchedule(body, { compact: true });
          else if (x.type === 'timer') handle = TT.mountTimer(body, { compact: true, state: x.data, onChange: function (s) { if (s) { x.data = s; save(); } } });
          else if (bw) handle = bw.mount(body, { id: x.id, data: x.data }, save);
        } catch (e) { body.textContent = 'This widget could not load.'; }
      }
      if (handle) handles.push(handle);
      return shell(x.id, def[1], def[2], extraIcon(x.type), body, 'mm2-extra');
    }

    // ---------- Layout ----------
    function custom() { return plus(); }
    function order() { return custom() ? L.order : STANDARD; }
    function sizeOf(id) {
      if (custom() && L.size[id]) return L.size[id];
      if (SIZE0[id]) return SIZE0[id];
      var x = L.extras.filter(function (e) { return e.id === id; })[0];
      return x && EX[x.type] ? EX[x.type][3] : 1;
    }
    function build() {
      handles.forEach(function (hd) { if (hd && hd.destroy) try { hd.destroy(); } catch (e) {} });
      handles = []; painters = []; tiles = {}; grid.textContent = '';
      order().forEach(function (id) {
        var t = id === 'hello' ? hello() : id === 'weather' ? weather() : id === 'wyr' ? wyr() : extra(L.extras.filter(function (e) { return e.id === id; })[0] || {});
        if (t) grid.append(t);
      });
      arrange(); paint(); paintBar();
    }
    function arrange() {
      var at = grid.firstChild;
      order().forEach(function (id) { var t = tiles[id]; if (!t) return; if (t.el === at) at = at.nextSibling; else grid.insertBefore(t.el, at); t.el.setAttribute('data-size', sizeOf(id)); });
      paintTools();
    }
    function move(id, by) {
      var i = L.order.indexOf(id), j = i + by;
      if (i < 0 || j < 0 || j >= L.order.length) return;
      L.order.splice(i, 1); L.order.splice(j, 0, id); save(); arrange();
      var b = tiles[id] && tiles[id].tools.querySelector(by < 0 ? '.mv-l' : '.mv-r'); if (b) b.focus();
    }
    function paintTools() {
      Object.keys(tiles).forEach(function (id) {
        var t = tiles[id]; t.tools.textContent = '';
        t.el.classList.toggle('editing', editing);
        if (!editing) return;
        var i = L.order.indexOf(id), isExtra = STANDARD.indexOf(id) < 0;
        function tb(cls, label, icon, fn, off) { var b = h('button', { type: 'button', class: 'mm2-tb ' + cls, title: label, 'aria-label': label + ': ' + t.title, html: icon, onclick: fn }); if (off) b.disabled = true; return b; }
        [
          h('span', { class: 'mm2-grab', title: 'Drag to Move', html: svg(ICO.grip) }),
          tb('mv-l', 'Move Earlier', svg(ICO.left), function () { move(id, -1); }, i <= 0),
          tb('mv-r', 'Move Later', svg(ICO.right), function () { move(id, 1); }, i >= L.order.length - 1),
          id === 'hello' ? null : h('button', { type: 'button', class: 'mm2-tb wide', title: 'Change the Size', onclick: function () { L.size[id] = sizeOf(id) % 3 + 1; save(); arrange(); var b = tiles[id].tools.querySelector('.wide'); if (b) b.focus(); } }, h('span', { html: svg(ICO.size) }), SIZE_NAME[sizeOf(id)]),
          isExtra ? tb('del', 'Remove', TT.icon('trash'), function () { L.extras = L.extras.filter(function (e) { return e.id !== id; }); L.order = L.order.filter(function (o) { return o !== id; }); delete L.size[id]; save(); build(); }) : null
        ].forEach(function (n) { if (n) t.tools.append(n); });
      });
    }
    function paintBar() {
      bar.textContent = ''; tray.textContent = ''; tray.hidden = !editing;
      root.classList.toggle('is-editing', editing);
      if (!editing) {
        var b = h('button', { type: 'button', class: 'mm2-custom', onclick: function () {
          if (!plus()) { if (TT.premium) TT.premium.open('morning'); return; }
          editing = true; paintBar(); paintTools();
        } }, h('span', { class: 'mm2-custom-ico', html: TT.icon('grid') }), h('span', { text: 'Customize' }));
        if (!plus() && TT.premium) b.append(TT.premium.badge('mini'));
        else if (TT.premium && TT.premium.owner()) b.append(TT.premium.ownerBadge());
        bar.append(b);
        return;
      }
      bar.append(h('p', { class: 'mm2-hint', text: 'Drag a tile by its top bar to move it, change its size, or add more widgets below.' }),
        h('button', { type: 'button', class: 'mm2-reset', onclick: function () { L.order = STANDARD.concat(L.extras.map(function (e) { return e.id; })); L.size = {}; save(); arrange(); } }, 'Back to the Standard Order'),
        TT.button('Done', { kind: 'primary', onclick: function () { editing = false; paintBar(); paintTools(); } }));
      tray.append(h('h3', { text: 'Add a Widget' }), h('div', { class: 'mm2-tray-list' }, EXTRAS.filter(function (e) { return e[0] === 'note' || e[0] === 'schedule' || e[0] === 'timer' || (TT.boardWidgets && TT.boardWidgets[e[0]]); }).map(function (e) {
        return h('button', { type: 'button', class: 'mm2-add c-' + e[2], onclick: function () {
          if (L.extras.length >= 8) return;
          var id = 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          L.extras.push({ id: id, type: e[0] }); L.order.push(id); save(); build();
          var t = tiles[id]; if (t) { t.el.classList.add('fresh'); t.el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        } }, h('span', { class: 'mm2-ico', html: svg(extraIcon(e[0])) }), h('span', { text: e[1] }), h('span', { class: 'mm2-add-plus', html: TT.icon('plus') }));
      })));
      if (L.extras.length >= 8) tray.append(h('p', { class: 'muted', text: 'That is the most widgets this page can hold. Remove one to add another.' }));
    }

    // ---------- Dragging tiles (while customizing) ----------
    var drag = null;
    grid.addEventListener('pointerdown', function (e) {
      if (!editing || drag || (e.button && e.button !== 0)) return;
      var head = e.target.closest && e.target.closest('.mm2-head');
      if (!head || e.target.closest('button, input, textarea')) return;
      var tile = head.parentNode, id = tile.getAttribute('data-id');
      drag = { id: id, tile: tile, pid: e.pointerId, moved: false };
      e.preventDefault();
      tile.classList.add('dragging'); document.body.classList.add('mm2-dragging');
    });
    // Listened for on the whole page: moving a tile in the grid would drop a pointer capture.
    document.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.pid) return;
      var under = document.elementsFromPoint(e.clientX, e.clientY).filter(function (n) { return n.classList && n.classList.contains('mm2-tile') && n !== drag.tile; })[0];
      if (!under) return;
      var r = under.getBoundingClientRect(), other = under.getAttribute('data-id');
      var after = (e.clientX - r.left) / r.width + (e.clientY - r.top) / r.height > 1;
      var list = L.order.filter(function (o) { return o !== drag.id; }), k = list.indexOf(other) + (after ? 1 : 0);
      list.splice(k, 0, drag.id);
      if (list.join() === L.order.join()) return;
      L.order = list; drag.moved = true; arrange();
    });
    function drop(e) {
      if (!drag || (e && e.pointerId !== drag.pid)) return;
      drag.tile.classList.remove('dragging'); document.body.classList.remove('mm2-dragging');
      if (drag.moved) save();
      drag = null;
    }
    document.addEventListener('pointerup', drop); document.addEventListener('pointercancel', drop);
    grid.addEventListener('mousedown', function (e) { if (editing && e.target.closest && e.target.closest('.mm2-head') && !e.target.closest('button, input, textarea')) e.preventDefault(); });

    function paint() { painters.forEach(function (fn) { fn(); }); }
    build();
    if (TT.applySeason) TT.applySeason();
    if (TT.account && TT.account.onChange) TT.account.onChange(function () { var c = custom(); if (c !== root._c) { root._c = c; if (!c) editing = false; build(); } });
    root._c = custom();
    return { show: function () { paint(); handles.forEach(function (hd) { if (hd && hd.show) hd.show(); }); } };
  };
})();
