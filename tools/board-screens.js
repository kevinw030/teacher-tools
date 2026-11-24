// Classroom Board: "Organize" mode for the Saved Screens menu.
// Drag a screen by its handle (or use the up/down arrows) to change the order,
// rename it right in the list, or delete it with a few seconds to undo.
// board.js owns the screens; this file only draws the organize list and calls back.
(function () {
  var TT = window.TT, h = TT.h;
  var GRIP = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
  var UP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
  var DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  // api: list() -> screens array, active() -> active id, thumb(sc) -> css background,
  //      changed() -> save + repaint, remove(id), restore(sc, index, wasActive) -> true if it fit
  TT.boardScreens = function (api) {
    var editing = false, undo = null, undoTimer = 0;
    var toggle = TT.button('Organize', { icon: 'edit', kind: 'small ss-toggle', onclick: function () { set(!editing); } });
    var undoBar = h('div', { class: 'ss-undo', hidden: true, role: 'status' });

    function set(on) {
      editing = on;
      toggle.classList.toggle('primary', on);
      toggle.querySelector('span').textContent = on ? 'Done' : 'Organize';
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      api.changed(true);
    }

    function move(from, to) {
      var list = api.list();
      if (to < 0 || to >= list.length || from === to) return;
      var sc = list.splice(from, 1)[0];
      list.splice(to, 0, sc);
      api.changed();
    }

    function del(sc) {
      var list = api.list();
      if (list.length <= 1) return;
      var index = list.indexOf(sc), wasActive = sc.id === api.active();
      api.remove(sc.id);
      undo = { sc: sc, index: index, wasActive: wasActive };
      showUndo();
    }

    function showUndo() {
      clearTimeout(undoTimer);
      undoBar.textContent = '';
      if (!undo) { undoBar.hidden = true; return; }
      var gone = undo;
      undoBar.append(h('span', { text: 'Deleted “' + gone.sc.name + '”' }),
        TT.button('Undo', { icon: 'reset', kind: 'small primary', onclick: function () {
          if (undo !== gone) return;
          undo = null; showUndo();
          if (!api.restore(gone.sc, gone.index, gone.wasActive)) api.changed();
        } }));
      undoBar.hidden = false;
      undoBar.classList.remove('pop'); void undoBar.offsetWidth; undoBar.classList.add('pop');
      undoTimer = setTimeout(function () { if (undo === gone) { undo = null; showUndo(); } }, 10000);
    }

    // Pointer drag on the handle: works with a mouse, a touch screen or a pen.
    function startDrag(e, row, box) {
      if (e.button > 0) return;
      e.preventDefault();
      var rows = function () { return Array.prototype.slice.call(box.querySelectorAll('.ss-row')); };
      var startIndex = rows().indexOf(row), lastY = e.clientY;
      row.classList.add('dragging');
      box.classList.add('sorting');
      try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
      function moveTo(y) {
        var all = rows(), before = null;
        for (var i = 0; i < all.length; i++) {
          if (all[i] === row) continue;
          var r = all[i].getBoundingClientRect();
          if (y < r.top + r.height / 2) { before = all[i]; break; }
        }
        if ((before ? before.previousElementSibling : box.lastElementChild) === row) return;
        flip(all, function () { box.insertBefore(row, before); });
      }
      function onMove(ev) { lastY = ev.clientY; moveTo(lastY); }
      function onUp() {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        row.classList.remove('dragging');
        box.classList.remove('sorting');
        var end = rows().indexOf(row);
        if (end !== startIndex) move(startIndex, end);
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    }

    // Smoothly slide the other rows into their new spots (FLIP).
    function flip(all, change) {
      var tops = all.map(function (n) { return n.getBoundingClientRect().top; });
      change();
      all.forEach(function (n, i) {
        if (n.classList.contains('dragging')) return;
        var d = tops[i] - n.getBoundingClientRect().top;
        if (!d) return;
        n.style.transition = 'none';
        n.style.transform = 'translateY(' + d + 'px)';
        requestAnimationFrame(function () { n.style.transition = ''; n.style.transform = ''; });
      });
    }

    function rename(sc, input) {
      var v = input.value.trim().slice(0, 30);
      if (!v) { input.value = sc.name; return; }
      if (v !== sc.name) { sc.name = v; api.changed(); }
    }

    function paintList(box) {
      var list = api.list(), active = api.active(), last = list.length - 1;
      box.classList.add('ss-box');
      list.forEach(function (sc, i) {
        var n = (sc.state && sc.state.widgets ? sc.state.widgets.length : 0);
        var name = h('input', { type: 'text', class: 'ss-name', value: sc.name, maxlength: 30, 'aria-label': 'Screen name' });
        name.addEventListener('change', function () { rename(sc, name); });
        name.addEventListener('keydown', function (e) { if (e.key === 'Enter') name.blur(); if (e.key === 'Escape') { name.value = sc.name; name.blur(); } });
        var row = h('div', { class: 'ss-row' + (sc.id === active ? ' on' : '') });
        var grip = h('button', { type: 'button', class: 'ss-grip', title: 'Drag to Move', 'aria-label': 'Drag ' + sc.name + ' to move it', html: GRIP });
        grip.addEventListener('pointerdown', function (e) { startDrag(e, row, box); });
        var up = h('button', { type: 'button', class: 'ss-arrow', title: 'Move Up', 'aria-label': 'Move ' + sc.name + ' up', html: UP, disabled: i === 0,
          onclick: function () { move(i, i - 1); focusLater(sc.id, i - 1 === 0 ? '.ss-arrow.dn' : '.ss-arrow.up'); } });
        var down = h('button', { type: 'button', class: 'ss-arrow dn', title: 'Move Down', 'aria-label': 'Move ' + sc.name + ' down', html: DOWN, disabled: i === last,
          onclick: function () { move(i, i + 1); focusLater(sc.id, i + 1 === last ? '.ss-arrow.up' : '.ss-arrow.dn'); } });
        up.classList.add('up');
        var trash = h('button', { type: 'button', class: 'ss-del', html: TT.icon('trash'), disabled: list.length <= 1,
          title: list.length <= 1 ? 'You Need at Least One Screen' : 'Delete Screen', 'aria-label': 'Delete ' + sc.name,
          onclick: function () { del(sc); } });
        row.setAttribute('data-id', sc.id);
        row.append(grip,
          h('span', { class: 'screen-thumb', style: 'background:' + api.thumb(sc.state) }),
          h('span', { class: 'ss-text' }, name, h('small', { text: (sc.id === active ? 'Showing Now · ' : '') + n + (n === 1 ? ' Widget' : ' Widgets') })),
          h('span', { class: 'ss-moves' }, up, down), trash);
        box.append(row);
      });
    }

    function focusLater(id, sel) {
      requestAnimationFrame(function () {
        var row = document.querySelector('.ss-row[data-id="' + id + '"]');
        var b = row && row.querySelector(sel);
        if (b && !b.disabled) b.focus();
      });
    }

    return {
      toggle: toggle,
      undoBar: undoBar,
      editing: function () { return editing; },
      paintList: paintList,
      // Closing or reopening the menu leaves Organize mode; a pending undo stays until it times out.
      reset: function () { if (editing) { editing = false; toggle.classList.remove('primary'); toggle.querySelector('span').textContent = 'Organize'; toggle.setAttribute('aria-pressed', 'false'); } },
      forgetUndo: function () { undo = null; showUndo(); }
    };
  };
})();
