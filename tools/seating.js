// Seating Chart: build the room (desks, tables, teacher desk, rug...) and seat the class.
// The room is 1600 x 1000 "room units"; everything is drawn as a percentage so it scales to any screen.
// Each class list keeps its own chart. Saved in this browser only.
(function () {
  var TT = window.TT, h = TT.h;
  var RW = 1600, RH = 1000, SNAP = 10;
  // seats: how many students sit there. cols: seats per row when not turned.
  var TYPES = {
    desk: { name: 'Desk', w: 150, h: 100, seats: 1, cols: 1 },
    pair: { name: 'Pair of Desks', w: 300, h: 100, seats: 2, cols: 2 },
    group4: { name: 'Table for 4', w: 300, h: 200, seats: 4, cols: 2 },
    round4: { name: 'Round Table', w: 260, h: 260, seats: 4, cols: 2, round: true },
    long6: { name: 'Long Table', w: 450, h: 200, seats: 6, cols: 3 },
    teacher: { name: 'Teacher Desk', w: 260, h: 120, thing: true },
    board: { name: 'Board', w: 600, h: 50, thing: true },
    door: { name: 'Door', w: 130, h: 44, thing: true },
    rug: { name: 'Rug', w: 380, h: 260, thing: true },
    shelf: { name: 'Bookshelf', w: 300, h: 60, thing: true },
    label: { name: 'Label', w: 240, h: 80, thing: true }
  };
  var COLORS = ['', '#3B7BFF', '#FF7448', '#14B884', '#F5AE14', '#8B5CF6', '#EC4899'];
  function uid() { return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function dims(it) { var t = TYPES[it.type], w = it.w || t.w, hh = it.h || t.h; return it.rot ? { w: hh, h: w } : { w: w, h: hh }; }

  // Ready-made layouts with enough seats for n students.
  function layout(kind, n) {
    var items = [{ id: uid(), type: 'board', x: 500, y: 20 }, { id: uid(), type: 'teacher', x: 60, y: 50 }, { id: uid(), type: 'door', x: 1440, y: 20 }], i;
    n = Math.max(4, n);
    if (kind === 'rows') {
      var cols = n > 30 ? 7 : 6;
      for (i = 0; i < n; i++) items.push({ id: uid(), type: 'desk', x: (cols === 7 ? 110 : 190) + (i % cols) * 205, y: 210 + Math.floor(i / cols) * 150 });
    } else if (kind === 'pairs') {
      for (i = 0; i < Math.ceil(n / 2); i++) items.push({ id: uid(), type: 'pair', x: 130 + (i % 3) * 460, y: 210 + Math.floor(i / 3) * 150 });
    } else if (kind === 'ushape') {
      var side = Math.min(4, Math.ceil(n * 0.27)), bottom = Math.min(7, n - side * 2), rest = n - side * 2 - bottom;
      for (i = 0; i < side; i++) { items.push({ id: uid(), type: 'desk', rot: 1, x: 80, y: 190 + i * 160 }); items.push({ id: uid(), type: 'desk', rot: 1, x: 1420, y: 190 + i * 160 }); }
      for (i = 0; i < bottom; i++) items.push({ id: uid(), type: 'desk', x: 225 + i * 165, y: 850 });
      for (i = 0; i < Math.ceil(rest / 2); i++) items.push({ id: uid(), type: 'pair', x: 330 + (i % 3) * 330, y: 230 + Math.floor(i / 3) * 150 });
    } else {
      var g = Math.ceil(n / 4), per = g > 6 ? 4 : 3;
      for (i = 0; i < g; i++) items.push({ id: uid(), type: 'group4', color: COLORS[1 + i % 6], x: (per === 4 ? 70 : 180) + (i % per) * (per === 4 ? 385 : 450), y: 200 + Math.floor(i / per) * 265 });
    }
    return items;
  }

  TT.mountSeating = function (el) {
    var state = TT.load('seating', null) || {};
    if (!state.byClass) state.byClass = {};
    var mode = 'seat', sel = null, pick = null, drag = null;
    var room = h('div', { class: 'sc-room' });
    var top = h('div', { class: 'sc-top seat-ui' }), tools = h('div', { class: 'sc-tools seat-ui' }), tray = h('div', { class: 'sc-tray seat-ui' });
    el.append(h('div', { class: 'sc' }, top, tools, tray, h('div', { class: 'sc-room-wrap' }, room)));
    function save() { TT.save('seating', state); }
    function chart() {
      var id = TT.roster.isSample() ? 'sample' : TT.roster.activeId();
      var c = state.byClass[id];
      if (!c || !Array.isArray(c.items)) c = state.byClass[id] = { items: layout('groups', TT.roster.all().length), seats: {} };
      if (!c.seats) c.seats = {};
      var names = TT.roster.all(), keys = {};
      c.items.forEach(function (it) { for (var i = 0; i < (TYPES[it.type].seats || 0); i++) keys[it.id + ':' + i] = 1; });
      Object.keys(c.seats).forEach(function (k) { if (!keys[k] || names.indexOf(c.seats[k]) < 0) delete c.seats[k]; });
      return c;
    }
    function seatKeys(c) { var out = []; c.items.forEach(function (it) { for (var i = 0; i < (TYPES[it.type].seats || 0); i++) out.push(it.id + ':' + i); }); return out; }
    function seatOf(c, name) { var k = Object.keys(c.seats).filter(function (x) { return c.seats[x] === name; }); return k[0] || null; }
    function unseated(c) { var used = {}; Object.keys(c.seats).forEach(function (k) { used[c.seats[k]] = 1; }); return TT.roster.all().filter(function (n) { return !used[n]; }); }
    function put(c, name, key) {
      var from = seatOf(c, name), other = c.seats[key];
      if (from) delete c.seats[from];
      if (other && other !== name && from) c.seats[from] = other;
      c.seats[key] = name;
    }

    // ----- Drawing -----
    function paint() {
      var c = chart(), keys = seatKeys(c), names = TT.roster.all(), free = unseated(c);
      if (sel && !c.items.filter(function (i) { return i.id === sel; }).length) sel = null;
      el.firstChild.className = 'sc mode-' + mode;
      // top bar
      top.textContent = '';
      top.append(h('div', { class: 'sc-modes', role: 'group', 'aria-label': 'What to do' }, [['seat', 'Seat Students'], ['room', 'Arrange the Room']].map(function (m) {
        return h('button', { type: 'button', class: 'sc-mode' + (mode === m[0] ? ' on' : ''), 'aria-pressed': mode === m[0], onclick: function () { mode = m[0]; sel = null; pick = null; paint(); } },
          h('span', { class: 'sc-mode-icon', html: (TT.SEAT_ICONS || {})[m[0]] || '' }), h('span', { text: m[1] }));
      })), h('span', { class: 'sc-info' + (keys.length < names.length ? ' warn' : ''), text: keys.length + ' seats · ' + names.length + ' students' + (keys.length < names.length ? ' · add ' + (names.length - keys.length) + ' more seats' : '') }),
        TT.button('Print', { kind: 'small', onclick: function () { window.print(); } }));
      // tools
      tools.textContent = '';
      if (mode === 'seat') {
        tools.append(TT.button('Shuffle Everyone', { icon: 'shuffle', kind: 'primary', onclick: function () {
          var order = TT.shuffle(names.slice()), ks = keys.slice(); c.seats = {};
          order.forEach(function (n, i) { if (ks[i]) c.seats[ks[i]] = n; }); save(); paint(); TT.tick();
        } }), TT.button('Fill Empty Seats', { onclick: function () {
          var open = keys.filter(function (k) { return !c.seats[k]; }), rest = TT.shuffle(free.slice());
          open.forEach(function (k, i) { if (rest[i]) c.seats[k] = rest[i]; }); save(); paint();
        } }), TT.button('Clear All Seats', { icon: 'reset', onclick: function () { c.seats = {}; save(); paint(); } }));
      } else {
        var add = h('div', { class: 'sc-add sc-pieces' }, h('b', { text: 'Add to the Room' }), Object.keys(TYPES).map(function (k) {
          return h('button', { type: 'button', class: 'sc-piece t-' + k, title: 'Add a ' + TYPES[k].name, onclick: function () { var it = { id: uid(), type: k, x: 700 + (c.items.length % 5) * 20, y: 420 + (c.items.length % 5) * 20 }; c.items.push(it); sel = it.id; save(); paint(); } },
            h('span', { class: 'sc-piece-art', html: (TT.SEAT_ART || {})[k] || '' }), h('span', { text: TYPES[k].name }));
        }));
        var quick = h('div', { class: 'sc-add' }, h('b', { text: 'Quick Layouts' }), [['rows', 'Rows'], ['pairs', 'Pairs'], ['groups', 'Groups of 4'], ['ushape', 'U-Shape']].map(function (q) {
          return h('button', { type: 'button', class: 'wb', title: 'Replace the Room With This Layout', onclick: function () {
            var seated = keys.map(function (k) { return c.seats[k]; }).filter(Boolean);
            c.items = layout(q[0], names.length); c.seats = {}; sel = null;
            seatKeys(c).forEach(function (k, i) { if (seated[i]) c.seats[k] = seated[i]; }); save(); paint();
          } }, q[1]);
        }), h('button', { type: 'button', class: 'wb', onclick: function () { c.items = []; c.seats = {}; sel = null; save(); paint(); } }, 'Empty Room'));
        tools.append(add, quick);
        var it = sel && c.items.filter(function (i) { return i.id === sel; })[0];
        if (it) {
          var T = TYPES[it.type], bar = h('div', { class: 'sc-sel' }, h('b', { text: T.name }));
          if (T.thing) {
            var lab = h('input', { type: 'text', id: 'scLabel', maxlength: 30, placeholder: T.name, 'aria-label': 'Label' }); lab.value = it.label || '';
            lab.addEventListener('input', function () { it.label = lab.value; save(); var n = room.querySelector('[data-id="' + it.id + '"] .sc-thing-label'); if (n) n.textContent = it.label || T.name; });
            bar.append(lab);
          }
          bar.append(TT.button('Turn', { icon: 'reset', kind: 'small', onclick: function () { it.rot = it.rot ? 0 : 1; clamp(it); save(); paint(); } }),
            h('span', { class: 'sc-colors', role: 'group', 'aria-label': 'Color' }, COLORS.map(function (col) {
              return h('button', { type: 'button', class: 'sc-color' + ((it.color || '') === col ? ' on' : ''), title: col ? 'Color' : 'No Color', 'aria-label': col ? 'Color ' + col : 'No color', style: col ? 'background:' + col : null, onclick: function () { it.color = col; save(); paint(); } });
            })),
            TT.button('Copy', { icon: 'plus', kind: 'small', onclick: function () { var n = JSON.parse(JSON.stringify(it)); n.id = uid(); n.x += 40; n.y += 40; clamp(n); c.items.push(n); sel = n.id; save(); paint(); } }),
            TT.button('Remove', { icon: 'trash', kind: 'small', onclick: function () { c.items = c.items.filter(function (i) { return i !== it; }); sel = null; chart(); save(); paint(); } }));
          tools.append(bar);
        } else tools.append(h('p', { class: 'muted sc-hint', text: 'Drag anything to move it. Click it to turn, color, copy or remove it. Drag the corner of a rug, board or label to resize it.' }));
      }
      // room
      room.textContent = '';
      c.items.forEach(function (it) { room.append(itemNode(c, it)); });
      if (!c.items.length) room.append(h('div', { class: 'sc-empty', text: 'The room is empty. Switch to Arrange the Room to add desks.' }));
      // tray
      tray.textContent = '';
      if (mode === 'seat') {
        tray.append(h('div', { class: 'picked-head' }, h('h3', { text: 'Not Seated Yet (' + free.length + ')' }), h('span', { class: 'muted', text: pick ? 'Now click a seat for ' + pick + '.' : 'Drag a name to a seat, or click a name and then a seat.' })));
        var chips = h('div', { class: 'chips sc-chips', 'data-tray': '1' });
        free.forEach(function (n) { chips.append(nameChip(c, n, null)); });
        if (!free.length) chips.append(h('span', { class: 'muted', text: names.length ? 'Everyone has a seat.' : 'Add your class on the Name Picker page.' }));
        tray.append(chips);
        if (TT.roster.isSample()) tray.append(h('p', { class: 'roster-note warn', text: 'Using sample names. Add your class on the Name Picker page and this chart will use it.' }));
      }
    }
    function pct(v, of) { return (v / of * 100) + '%'; }
    function clamp(it) { var d = dims(it); it.x = Math.max(0, Math.min(RW - d.w, Math.round(it.x / SNAP) * SNAP)); it.y = Math.max(0, Math.min(RH - d.h, Math.round(it.y / SNAP) * SNAP)); }
    function place(node, it) { var d = dims(it); node.style.left = pct(it.x, RW); node.style.top = pct(it.y, RH); node.style.width = pct(d.w, RW); node.style.height = pct(d.h, RH); }
    function itemNode(c, it) {
      var T = TYPES[it.type];
      var node = h('div', { class: 'sc-item t-' + it.type + (T.thing ? ' thing' : '') + (T.round ? ' round' : '') + (sel === it.id ? ' sel' : ''), 'data-id': it.id });
      if (it.color) node.style.setProperty('--ic', it.color);
      place(node, it);
      if (T.thing) {
        var dd = dims(it);
        node.classList.toggle('wide', dd.w > dd.h * 1.6);
        node.append(h('span', { class: 'sc-thing-in' }, it.type === 'label' ? null : h('span', { class: 'sc-art', html: (TT.SEAT_ART || {})[it.type] || '' }), h('span', { class: 'sc-thing-label', text: it.label || T.name })));
      }
      else {
        var cols = it.rot ? T.seats / T.cols : T.cols;
        node.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
        for (var i = 0; i < T.seats; i++) node.append(seatNode(c, it.id + ':' + i));
      }
      if (mode === 'room') {
        node.addEventListener('pointerdown', function (e) {
          if (e.target.classList.contains('sc-grip')) return;
          e.preventDefault(); node.setPointerCapture(e.pointerId);
          var sx = e.clientX, sy = e.clientY, ox = it.x, oy = it.y, k = RW / room.getBoundingClientRect().width, moved = false;
          function mv(ev) { if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) > 3) moved = true; it.x = ox + (ev.clientX - sx) * k; it.y = oy + (ev.clientY - sy) * k; clamp(it); place(node, it); }
          function up() { node.removeEventListener('pointermove', mv); node.removeEventListener('pointerup', up); node.removeEventListener('pointercancel', up); save(); if (!moved || sel !== it.id) { sel = it.id; paint(); } }
          node.addEventListener('pointermove', mv); node.addEventListener('pointerup', up); node.addEventListener('pointercancel', up);
        });
        if (T.thing && sel === it.id) {
          var grip = h('span', { class: 'sc-grip', 'aria-hidden': 'true' });
          grip.addEventListener('pointerdown', function (e) {
            e.preventDefault(); e.stopPropagation(); grip.setPointerCapture(e.pointerId);
            var sx = e.clientX, sy = e.clientY, d0 = dims(it), k = RW / room.getBoundingClientRect().width;
            function mv(ev) {
              var w = Math.max(60, Math.min(RW - it.x, Math.round((d0.w + (ev.clientX - sx) * k) / SNAP) * SNAP)), hh = Math.max(30, Math.min(RH - it.y, Math.round((d0.h + (ev.clientY - sy) * k) / SNAP) * SNAP));
              if (it.rot) { it.w = hh; it.h = w; } else { it.w = w; it.h = hh; }
              place(node, it);
            }
            function up() { grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); save(); }
            grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up);
          });
          node.append(grip);
        }
      }
      return node;
    }
    function seatNode(c, key) {
      var name = c.seats[key];
      var seat = h('div', { class: 'sc-seat' + (name ? ' full' : '') + (name && pick === name ? ' picked' : ''), 'data-seat': key }, h('span', { text: name || '' }));
      if (mode === 'seat') {
        if (name) grab(seat, c, name, key);
        else seat.addEventListener('click', function () { if (pick) { put(c, pick, key); pick = null; save(); paint(); } });
      }
      return seat;
    }
    function nameChip(c, name) {
      var chip = h('button', { type: 'button', class: 'chip sc-chip' + (pick === name ? ' picked' : '') }, name);
      grab(chip, c, name, null);
      return chip;
    }
    // Drag a name (from the tray or a seat) onto a seat. A plain click picks the name up instead.
    function grab(node, c, name, fromKey) {
      node.addEventListener('pointerdown', function (e) {
        if (e.button) return;
        e.preventDefault();
        var sx = e.clientX, sy = e.clientY, ghost = null, over = null;
        function target(ev) { var t = document.elementFromPoint(ev.clientX, ev.clientY); return t && (t.closest('[data-seat]') || t.closest('[data-tray]')); }
        function mv(ev) {
          if (!ghost) {
            if (Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
            ghost = h('div', { class: 'sc-ghost', text: name }); (document.fullscreenElement || document.body).append(ghost); node.classList.add('dragging');
          }
          ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
          var t = target(ev);
          if (over && over !== t) over.classList.remove('over');
          over = t; if (over) over.classList.add('over');
        }
        function up(ev) {
          document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
          if (!ghost) {
            // click: pick this name up, or drop the picked name here (swap)
            if (pick && pick !== name && fromKey) { put(c, pick, fromKey); pick = null; save(); } else pick = pick === name ? null : name;
            paint(); return;
          }
          ghost.remove();
          var t = target(ev);
          if (t && t.hasAttribute('data-seat')) put(c, name, t.getAttribute('data-seat'));
          else if (t && fromKey) delete c.seats[fromKey];
          pick = null; save(); paint();
        }
        document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
      });
    }
    room.addEventListener('pointerdown', function (e) { if (mode === 'room' && e.target === room && sel) { sel = null; paint(); } });
    TT.roster.onChange(function () { sel = null; pick = null; paint(); });
    paint();
    return { show: paint };
  };
})();
