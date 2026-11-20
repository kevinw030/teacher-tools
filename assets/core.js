// Shared helpers for every tool: storage, class list, sounds, full screen, small DOM helpers.
(function () {
  var TT = window.TT = window.TT || {};

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
      mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l4 6M21 9l-4 6"/>'
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

  // ---------- Class list (shared by Name Picker and Group Maker) ----------
  // Names stay in this browser only. "Absent today" clears itself each new day.
  var SAMPLE = ['Ava', 'Ben', 'Carlos', 'Daisy', 'Eli', 'Fatima', 'Grace', 'Hiro', 'Isla', 'Jayden',
    'Kira', 'Leo', 'Maya', 'Noah', 'Olivia', 'Priya', 'Quinn', 'Ruby', 'Sam', 'Theo', 'Uma', 'Victor'];
  var listeners = [];
  var data = TT.load('roster', { names: [], absent: { day: '', names: [] } });
  if (!data.absent || data.absent.day !== TT.today()) data.absent = { day: TT.today(), names: [] };

  function emit() { TT.save('roster', data); listeners.forEach(function (fn) { fn(); }); }

  TT.roster = {
    isSample: function () { return !data.names.length; },
    all: function () { return data.names.length ? data.names.slice() : SAMPLE.slice(); },
    present: function () {
      var abs = {}; data.absent.names.forEach(function (n) { abs[n] = 1; });
      return TT.roster.all().filter(function (n) { return !abs[n]; });
    },
    isAbsent: function (n) { return data.absent.names.indexOf(n) >= 0; },
    toggleAbsent: function (n) {
      if (data.absent.day !== TT.today()) data.absent = { day: TT.today(), names: [] };
      var i = data.absent.names.indexOf(n);
      if (i >= 0) data.absent.names.splice(i, 1); else data.absent.names.push(n);
      emit();
    },
    setNames: function (list) {
      var seen = {};
      data.names = list.map(function (s) { return s.trim(); }).filter(function (s) {
        if (!s || seen[s.toLowerCase()]) return false; seen[s.toLowerCase()] = 1; return true;
      });
      data.absent.names = data.absent.names.filter(function (n) { return data.names.indexOf(n) >= 0; });
      emit();
    },
    onChange: function (fn) { listeners.push(fn); }
  };

  // Class list panel: tap a name to mark absent; "Edit list" opens a text box.
  TT.mountRoster = function (el) {
    var h = TT.h;
    var chips = h('div', { class: 'chips' });
    var note = h('p', { class: 'roster-note' });
    var area = h('textarea', { class: 'roster-input', id: 'rosterInput-' + Math.random().toString(36).slice(2, 7), rows: 10, placeholder: 'One name per line', 'aria-label': 'Class list, one name per line' });
    var editor = h('div', { class: 'roster-editor', hidden: true },
      area,
      h('div', { class: 'row' },
        TT.button('Save class list', { kind: 'primary', onclick: function () {
          TT.roster.setNames(area.value.split(/\n|,/)); editor.hidden = true; view.hidden = false;
        } }),
        TT.button('Cancel', { onclick: function () { editor.hidden = true; view.hidden = false; } })
      )
    );
    var count = h('span', { class: 'roster-count' });
    var view = h('div', { class: 'roster-view' }, note, chips);
    var editBtn = TT.button('Edit list', { icon: 'edit', kind: 'small', onclick: function () {
      area.value = TT.roster.isSample() ? '' : TT.roster.all().join('\n');
      view.hidden = true; editor.hidden = false; area.focus();
    } });
    el.append(h('div', { class: 'roster' },
      h('div', { class: 'roster-head' }, h('div', null, h('h3', { text: 'Class list' }), count), editBtn),
      view, editor));

    function paint() {
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
        ? 'These are sample names. Choose “Edit list” to add your class.'
        : 'Tap a name to mark someone absent today. It resets tomorrow.';
      note.classList.toggle('warn', TT.roster.isSample());
    }
    TT.roster.onChange(paint);
    paint();
  };
})();
