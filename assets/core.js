// Shared helpers for every tool: storage, class list, sounds, full screen, small DOM helpers.
(function () {
  var TT = window.TT = window.TT || {};

  // Site settings. maxScreens: how many Classroom Board screens a teacher can save
  // (set to 1 for a free plan later, and raise it for premium).
  TT.config = { maxScreens: 10 };

  // ---------- Storage (safe if the browser blocks it) ----------
  TT.load = function (key, fallback) {
    try { var v = JSON.parse(localStorage.getItem('tt:' + key)); return v == null ? fallback : v; }
    catch (e) { return fallback; }
  };
  TT.save = function (key, value) {
    try { localStorage.setItem('tt:' + key, JSON.stringify(value)); } catch (e) {}
  };

  // ---------- DOM helper ----------
  // TT.h('div', {class: 'x', onclick: fn}, child, 'text', ...)
  TT.h = function (tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (cc) { if (cc != null) el.append(cc); });
      else el.append(c);
    }
    return el;
  };

  TT.icon = function (name) {
    var paths = {
      play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/>',
      pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
      reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      minus: '<path d="M5 12h14"/>',
      close: '<path d="M6 6l12 12M18 6 6 18"/>',
      shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
      sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
      expand: '<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
      edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
      arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
      back: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
      image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
      trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
      bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
      home: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
      volume: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
      mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l4 6M21 9l-4 6"/>',
      board: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
      download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
      upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || '') + '</svg>';
  };

  TT.button = function (label, opts) {
    opts = opts || {};
    var b = TT.h('button', { type: 'button', class: 'btn ' + (opts.kind || ''), title: opts.title, 'aria-label': opts.aria, onclick: opts.onclick });
    if (opts.icon) b.insertAdjacentHTML('beforeend', TT.icon(opts.icon));
    if (label) b.append(TT.h('span', { text: label }));
    return b;
  };

  TT.today = function () {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  };

  TT.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };

  // ---------- Full screen ----------
  TT.canFullscreen = !!document.documentElement.requestFullscreen;
  TT.toggleFullscreen = function (el) {
    if (!TT.canFullscreen) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    else (el || document.documentElement).requestFullscreen().catch(function () {});
  };

  // ---------- Sounds (a soft three-note chime, no files needed) ----------
  var ctx;
  TT.chime = function () {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      [659.25, 830.61, 987.77].forEach(function (f, i) {
        var t = ctx.currentTime + i * 0.28;
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        o.connect(g).connect(ctx.destination);
        o.start(t); o.stop(t + 1.3);
      });
    } catch (e) {}
  };
  TT.tick = function () {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = 'triangle'; o.frequency.value = 900;
      g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.06);
    } catch (e) {}
  };

  // ---------- Class lists (shared by Name Picker, Name Wheel, Group Maker, Pet) ----------
  // Several named lists can be saved. Names stay in this browser only.
  // "Absent today" clears itself each new day.
  var SAMPLE = ['Ava', 'Ben', 'Carlos', 'Daisy', 'Eli', 'Fatima', 'Grace', 'Hiro', 'Isla', 'Jayden',
    'Kira', 'Leo', 'Maya', 'Noah', 'Olivia', 'Priya', 'Quinn', 'Ruby', 'Sam', 'Theo', 'Uma', 'Victor'];
  var listeners = [];
  function newId() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  var classes = TT.load('classes', null);
  if (!classes || !Array.isArray(classes.lists) || !classes.lists.length) {
    var old = TT.load('roster', null);
    var first = { id: newId(), name: 'My Class', names: (old && old.names) || [], absent: { day: '', names: [] } };
    classes = { active: first.id, lists: [first] };
    TT.save('classes', classes);
  }
  classes.lists.forEach(function (l) { if (l.name === 'My class') l.name = 'My Class'; });
  function cur() {
    var c = classes.lists.filter(function (l) { return l.id === classes.active; })[0];
    if (!c) { c = classes.lists[0]; classes.active = c.id; }
    if (!c.absent || c.absent.day !== TT.today()) c.absent = { day: TT.today(), names: [] };
    return c;
  }
  function emit() { TT.save('classes', classes); listeners.forEach(function (fn) { fn(); }); }
  function clean(list) {
    var seen = {};
    return list.map(function (s) { return String(s).trim(); }).filter(function (s) {
      if (!s || seen[s.toLowerCase()]) return false; seen[s.toLowerCase()] = 1; return true;
    });
  }

  TT.roster = {
    isSample: function () { return !cur().names.length; },
    all: function () { var c = cur(); return c.names.length ? c.names.slice() : SAMPLE.slice(); },
    present: function () {
      var abs = {}; cur().absent.names.forEach(function (n) { abs[n] = 1; });
      return TT.roster.all().filter(function (n) { return !abs[n]; });
    },
    isAbsent: function (n) { return cur().absent.names.indexOf(n) >= 0; },
    toggleAbsent: function (n) {
      var a = cur().absent.names, i = a.indexOf(n);
      if (i >= 0) a.splice(i, 1); else a.push(n);
      emit();
    },
    setNames: function (list) {
      var c = cur();
      c.names = clean(list);
      c.absent.names = c.absent.names.filter(function (n) { return c.names.indexOf(n) >= 0; });
      emit();
    },
    lists: function () { return classes.lists.map(function (l) { return { id: l.id, name: l.name, count: l.names.length }; }); },
    activeName: function () { return cur().name; },
    activeId: function () { return cur().id; },
    select: function (id) { classes.active = id; emit(); },
    create: function (name, names) {
      var l = { id: newId(), name: (name || 'New Class').trim().slice(0, 40), names: clean(names || []), absent: { day: TT.today(), names: [] } };
      classes.lists.push(l); classes.active = l.id; emit(); return l.id;
    },
    rename: function (name) { if (name && name.trim()) { cur().name = name.trim().slice(0, 40); emit(); } },
    remove: function () {
      if (classes.lists.length <= 1) { cur().names = []; cur().name = 'My Class'; emit(); return; }
      var id = cur().id;
      classes.lists = classes.lists.filter(function (l) { return l.id !== id; });
      classes.active = classes.lists[0].id; emit();
    },
    onChange: function (fn) { listeners.push(fn); }
  };

  // ---------- Backup file: move everything to another computer ----------
  TT.backup = {
    download: function () {
      var out = { app: 'teacher-tools', version: 1, saved: new Date().toISOString(), data: {} };
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k.indexOf('tt:') === 0) out.data[k] = localStorage.getItem(k);
        }
      } catch (e) {}
      var blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'teacher-tools-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    },
    // Calls done(message, ok)
    load: function (file, done) {
      var r = new FileReader();
      r.onload = function () {
        try {
          var obj = JSON.parse(r.result);
          if (!obj || obj.app !== 'teacher-tools' || !obj.data) throw 0;
          Object.keys(obj.data).forEach(function (k) { if (k.indexOf('tt:') === 0) localStorage.setItem(k, obj.data[k]); });
          done('Backup loaded. Reloading…', true);
          setTimeout(function () { location.reload(); }, 900);
        } catch (e) { done('That file isn’t a Teacher Tools backup. Choose the .json file you saved before.', false); }
      };
      r.readAsText(file);
    }
  };
  TT.backupControls = function () {
    var id = 'bk-' + Math.random().toString(36).slice(2, 7);
    var input = TT.h('input', { type: 'file', id: id, accept: '.json,application/json', hidden: true });
    var msg = TT.h('p', { class: 'roster-note', hidden: true });
    input.addEventListener('change', function () {
      if (!input.files[0]) return;
      TT.backup.load(input.files[0], function (m, ok) { msg.textContent = m; msg.hidden = false; msg.classList.toggle('warn', !ok); });
      input.value = '';
    });
    return TT.h('div', { class: 'backup' },
      TT.h('div', { class: 'row' },
        TT.button('Save Backup File', { icon: 'download', kind: 'small', onclick: TT.backup.download }),
        TT.h('label', { class: 'btn small', for: id, html: TT.icon('upload') + '<span>Load Backup File</span>' }), input),
      msg);
  };

  // Class list panel: choose a class, tap a name to mark absent, edit or add classes.
  TT.mountRoster = function (el) {
    var h = TT.h;
    var uid = Math.random().toString(36).slice(2, 7);
    var chips = h('div', { class: 'chips' });
    var note = h('p', { class: 'roster-note' });
    var select = h('select', { class: 'class-select', id: 'classSel-' + uid, 'aria-label': 'Choose a class' });
    select.addEventListener('change', function () {
      if (select.value === '__new') { openEditor(true); return; }
      TT.roster.select(select.value);
    });
    var nameInput = h('input', { type: 'text', id: 'className-' + uid, maxlength: 40, placeholder: 'Class name, like Reading Group A', 'aria-label': 'Class name' });
    var area = h('textarea', { class: 'roster-input', id: 'rosterInput-' + uid, rows: 10, placeholder: 'Type or paste names, one per line', 'aria-label': 'Class list, one name per line' });
    var creating = false;
    var delConfirm = h('span', { class: 'confirm', hidden: true },
      h('span', { text: 'Delete this class list?' }),
      TT.button('Delete', { kind: 'primary small', onclick: function () { TT.roster.remove(); closeEditor(); } }),
      TT.button('Keep', { kind: 'small', onclick: function () { delConfirm.hidden = true; delBtn.hidden = false; } }));
    var delBtn = TT.button('Delete Class', { icon: 'trash', kind: 'small', onclick: function () { delBtn.hidden = true; delConfirm.hidden = false; } });
    var editor = h('div', { class: 'roster-editor', hidden: true },
      nameInput, area,
      h('div', { class: 'row' },
        TT.button('Save', { kind: 'primary', onclick: function () {
          var names = area.value.split(/\n|,/);
          if (creating) TT.roster.create(nameInput.value || 'New Class', names);
          else { TT.roster.rename(nameInput.value); TT.roster.setNames(names); }
          closeEditor();
        } }),
        TT.button('Cancel', { onclick: closeEditor }),
        delBtn, delConfirm));
    var count = h('span', { class: 'roster-count' });
    var view = h('div', { class: 'roster-view' }, note, chips);
    var editBtn = TT.button('Edit', { icon: 'edit', kind: 'small', onclick: function () { openEditor(false); } });
    var newBtn = TT.button('New Class', { icon: 'plus', kind: 'small', onclick: function () { openEditor(true); } });
    el.append(h('div', { class: 'roster' },
      h('div', { class: 'roster-head' }, h('h3', { text: 'Class List' }), h('div', { class: 'row' }, editBtn, newBtn)),
      select, count, view, editor,
      h('details', { class: 'move' }, h('summary', { text: 'Use These Lists on Another Computer' }),
        h('p', { class: 'roster-note', text: 'Lists are saved only on this computer. Save a backup file, put it on a USB drive or email it to yourself, then load it on the other computer. It includes your classes, links, board and pet.' }),
        TT.backupControls())));

    function openEditor(isNew) {
      creating = isNew;
      nameInput.value = isNew ? '' : TT.roster.activeName();
      area.value = isNew || TT.roster.isSample() ? '' : TT.roster.all().join('\n');
      delBtn.hidden = isNew; delConfirm.hidden = true;
      view.hidden = true; editor.hidden = false; (isNew ? nameInput : area).focus();
      paintSelect();
    }
    function closeEditor() { editor.hidden = true; view.hidden = false; paint(); }
    function paintSelect() {
      select.textContent = '';
      TT.roster.lists().forEach(function (l) {
        var o = h('option', { value: l.id, text: l.name + (l.count ? ' (' + l.count + ')' : '') });
        if (l.id === TT.roster.activeId()) o.selected = true;
        select.append(o);
      });
      select.append(h('option', { value: '__new', text: '+ New Class…' }));
    }
    function paint() {
      paintSelect();
      chips.textContent = '';
      var all = TT.roster.all();
      all.forEach(function (n) {
        var absent = TT.roster.isAbsent(n);
        chips.append(h('button', {
          type: 'button', class: 'chip' + (absent ? ' absent' : ''), 'aria-pressed': absent ? 'true' : 'false',
          title: absent ? 'Marked absent today. Tap to mark here.' : 'Tap to mark absent today',
          onclick: function () { TT.roster.toggleAbsent(n); }
        }, n));
      });
      var present = TT.roster.present().length;
      count.textContent = present + ' here today' + (all.length !== present ? ' · ' + (all.length - present) + ' absent' : '');
      note.textContent = TT.roster.isSample()
        ? 'These are sample names. Choose “Edit” to type or paste your class.'
        : 'Tap a name to mark someone absent today. It resets tomorrow.';
      note.classList.toggle('warn', TT.roster.isSample());
    }
    TT.roster.onChange(paint);
    paint();
  };
})();
