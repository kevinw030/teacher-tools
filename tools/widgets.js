// Extra Classroom Board widgets: dice, spinner, stopwatch, poll, work mode, countdown and picture.
// Each entry: { title, icon, color, w, h, init() -> starting data, mount(body, widget, save) }.
(function () {
  var TT = window.TT, h = TT.h;
  var W = TT.boardWidgets = {};
  function wb(label, cls, fn, aria) { return h('button', { type: 'button', class: 'wb ' + (cls || ''), onclick: fn, 'aria-label': aria || null }, label); }

  // ---------- Dice ----------
  var PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  W.dice = {
    title: 'Dice', color: '#E5397A', w: 320, h: 270,
    icon: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/>',
    init: function () { return { n: 2, vals: [3, 4] }; },
    mount: function (body, w, save) {
      var d = w.data; d.n = d.n || 1; d.vals = d.vals || [1];
      var row = h('button', { type: 'button', class: 'dice-row', 'aria-label': 'Roll the dice', onclick: roll }), total = h('div', { class: 'wx-note', 'aria-live': 'polite' });
      var rolling = false;
      function paint() {
        row.textContent = ''; row.style.setProperty('--n', d.n);
        var sum = 0;
        for (var i = 0; i < d.n; i++) {
          var v = d.vals[i] || 1; sum += v;
          var die = h('span', { class: 'die' });
          for (var k = 0; k < 9; k++) die.append(h('i', { class: PIPS[v].indexOf(k) >= 0 ? 'on' : '' }));
          row.append(die);
        }
        total.textContent = d.n > 1 ? 'Total: ' + sum : 'You rolled a ' + sum;
      }
      function roll() {
        if (rolling) return;
        rolling = true; var i = 0;
        (function step() {
          for (var k = 0; k < d.n; k++) d.vals[k] = 1 + Math.floor(Math.random() * 6);
          paint(); TT.tick();
          if (++i < 9) setTimeout(step, 60 + i * 8); else { rolling = false; save(); }
        })();
      }
      function setN(n) { d.n = Math.max(1, Math.min(4, n)); while (d.vals.length < d.n) d.vals.push(1); d.vals.length = d.n; paint(); save(); }
      body.append(h('div', { class: 'wx' }, row, total,
        h('div', { class: 'wx-row' }, wb('−', 'round', function () { setN(d.n - 1); }, 'One less die'), wb('Roll', 'primary', roll), wb('+', 'round', function () { setN(d.n + 1); }, 'One more die'))));
      paint();
    }
  };

  // ---------- Spinner ----------
  var COLORS = ['#3B7BFF', '#FF7448', '#14B884', '#F5AE14', '#8B5CF6', '#EC4899', '#0EA5E9', '#7CB518'];
  W.spinner = {
    title: 'Spinner', color: '#0EA5E9', w: 340, h: 420,
    icon: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 6.4"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
    init: function () { return { entries: 'Yes\nNo\nMaybe\nAsk a Friend\nTry Again' }; },
    mount: function (body, w, save) {
      var d = w.data; if (typeof d.entries !== 'string') d.entries = 'Yes\nNo';
      var rot = 0, spinning = false, editing = false;
      var cv = h('canvas', { class: 'spin-canvas', role: 'img', 'aria-label': 'Spinner' });
      var stage = h('button', { type: 'button', class: 'spin-stage', 'aria-label': 'Spin', onclick: spin }, cv, h('span', { class: 'spin-pointer', 'aria-hidden': 'true' }));
      var result = h('div', { class: 'wx-note spin-result', 'aria-live': 'polite', text: 'Tap the spinner' });
      var area = h('textarea', { class: 'wx-area', id: 'spin-' + w.id, 'aria-label': 'Spinner choices, one per line', hidden: true });
      area.value = d.entries;
      area.addEventListener('input', function () { d.entries = area.value; save(); });
      var editBtn = wb('Edit Choices', '', function () { editing = !editing; paintMode(); });
      function list() { return d.entries.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); }
      function paintMode() {
        area.hidden = !editing; stage.hidden = editing; result.hidden = editing;
        editBtn.textContent = editing ? 'Done' : 'Edit Choices';
        if (!editing) requestAnimationFrame(draw); else area.focus();
      }
      function draw() {
        var L = list(), size = cv.clientWidth;
        if (!size) return;
        var dpr = window.devicePixelRatio || 1;
        if (cv.width !== Math.round(size * dpr)) { cv.width = cv.height = Math.round(size * dpr); }
        var ctx = cv.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
        var R = size / 2 - 3;
        ctx.save(); ctx.translate(size / 2, size / 2); ctx.rotate(rot);
        if (!L.length) { ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fillStyle = '#E3E6EF'; ctx.fill(); ctx.restore(); return; }
        var seg = Math.PI * 2 / L.length, fs = Math.max(10, Math.min(R * 0.16, R * seg * 0.4));
        L.forEach(function (name, i) {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, i * seg, (i + 1) * seg); ctx.closePath();
          var c = COLORS[i % COLORS.length];
          if (L.length % COLORS.length === 1 && i === L.length - 1) c = COLORS[(i + 2) % COLORS.length];
          ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.save(); ctx.rotate(i * seg + seg / 2);
          ctx.fillStyle = '#fff'; ctx.font = '700 ' + fs + 'px "Plus Jakarta Sans", "Segoe UI", sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          var t = name; while (ctx.measureText(t).width > R * 0.7 && t.length > 2) t = t.slice(0, -2) + '…';
          ctx.fillText(t, R - 10, 0); ctx.restore();
        });
        ctx.restore();
        ctx.beginPath(); ctx.arc(size / 2, size / 2, R * 0.12, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
      }
      // The pointer sits at the top of the wheel.
      function atPointer(n) { var a = ((-Math.PI / 2 - rot) % (Math.PI * 2) + Math.PI * 4) % (Math.PI * 2); return Math.floor(a / (Math.PI * 2 / n)) % n; }
      function spin() {
        var L = list();
        if (spinning || !L.length) return;
        spinning = true; result.textContent = '…';
        var start = rot, extra = Math.PI * 2 * (4 + Math.random() * 2) + Math.random() * Math.PI * 2, dur = 3200 + Math.random() * 800, t0 = performance.now(), last = -1;
        (function frame(now) {
          var t = Math.min(1, (now - t0) / dur);
          rot = start + extra * (1 - Math.pow(1 - t, 4)); draw();
          var idx = atPointer(L.length);
          if (idx !== last) { last = idx; TT.tick(); }
          if (t < 1 && cv.isConnected) { requestAnimationFrame(frame); return; }
          spinning = false; result.textContent = L[idx]; TT.chime();
        })(t0);
      }
      body.append(h('div', { class: 'wx' }, stage, area, result, h('div', { class: 'wx-row' }, editBtn)));
      var ro = window.ResizeObserver ? new ResizeObserver(draw) : null;
      if (ro) ro.observe(body);
      requestAnimationFrame(draw);
      return { destroy: function () { if (ro) ro.disconnect(); } };
    }
  };

  // ---------- Stopwatch ----------
  W.stopwatch = {
    title: 'Stopwatch', color: '#0FA974', w: 300, h: 220,
    icon: '<circle cx="12" cy="13" r="8"/><path d="M12 13V9M10 2h4M18.5 6.5 20 5"/>',
    init: function () { return { elapsed: 0, startedAt: null }; },
    mount: function (body, w, save) {
      var d = w.data; d.elapsed = d.elapsed || 0;
      var time = h('div', { class: 'sw-time', 'aria-live': 'off' });
      var go = wb('Start', 'primary', function () {
        if (d.startedAt) { d.elapsed += Date.now() - d.startedAt; d.startedAt = null; } else d.startedAt = Date.now();
        save(); paint();
      });
      function ms() { return d.elapsed + (d.startedAt ? Date.now() - d.startedAt : 0); }
      function paint() {
        var t = ms(), s = Math.floor(t / 1000), m = Math.floor(s / 60), hr = Math.floor(m / 60);
        var txt = (hr ? hr + ':' + (m % 60 < 10 ? '0' : '') : '') + (m % 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60;
        time.textContent = '';
        time.append(txt, h('small', { text: '.' + Math.floor(t % 1000 / 100) }));
        go.textContent = d.startedAt ? 'Pause' : t ? 'Resume' : 'Start';
      }
      body.append(h('div', { class: 'wx' }, time, h('div', { class: 'wx-row' }, go, wb('Reset', '', function () { d.elapsed = 0; d.startedAt = null; save(); paint(); }))));
      paint();
      var iv = setInterval(function () { if (d.startedAt) paint(); }, 100);
      return { destroy: function () { clearInterval(iv); } };
    }
  };

  // ---------- Class Poll ----------
  var POLL_COLORS = ['#3B7BFF', '#FF7448', '#14B884', '#F5AE14', '#8B5CF6', '#EC4899'];
  W.poll = {
    title: 'Class Poll', color: '#7B4DEB', w: 420, h: 340,
    icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    init: function () { return { q: 'What Should We Read Next?', opts: [{ t: 'Choice A', n: 0 }, { t: 'Choice B', n: 0 }, { t: 'Choice C', n: 0 }] }; },
    mount: function (body, w, save) {
      var d = w.data; if (!Array.isArray(d.opts)) d.opts = [{ t: 'Yes', n: 0 }, { t: 'No', n: 0 }];
      var editing = false, box = h('div', { class: 'wx poll' });
      body.append(box);
      function paint() {
        box.textContent = '';
        if (editing) {
          var q = h('input', { type: 'text', class: 'wx-input', id: 'pollq-' + w.id, maxlength: 80, 'aria-label': 'Poll question', placeholder: 'Your question' });
          q.value = d.q || ''; q.addEventListener('input', function () { d.q = q.value; save(); });
          var rows = h('div', { class: 'poll-edit' }, q);
          d.opts.forEach(function (o, i) {
            var inp = h('input', { type: 'text', class: 'wx-input', id: 'pollo-' + w.id + '-' + i, maxlength: 40, 'aria-label': 'Choice ' + (i + 1), placeholder: 'Choice ' + (i + 1) });
            inp.value = o.t; inp.addEventListener('input', function () { o.t = inp.value; save(); });
            rows.append(h('div', { class: 'poll-edit-row' }, inp, d.opts.length > 2 ? wb('×', 'round', function () { d.opts.splice(i, 1); save(); paint(); }, 'Remove choice ' + (i + 1)) : null));
          });
          box.append(rows, h('div', { class: 'wx-row' }, d.opts.length < 6 ? wb('Add Choice', '', function () { d.opts.push({ t: '', n: 0 }); save(); paint(); }) : null, wb('Done', 'primary', function () { editing = false; paint(); })));
          return;
        }
        var total = d.opts.reduce(function (a, o) { return a + o.n; }, 0);
        box.append(h('div', { class: 'poll-q', text: d.q || 'Class Poll' }));
        var list = h('div', { class: 'poll-list' });
        d.opts.forEach(function (o, i) {
          var bar = h('span', { class: 'poll-bar' });
          bar.style.width = (total ? o.n / total * 100 : 0) + '%'; bar.style.background = POLL_COLORS[i % 6];
          list.append(h('div', { class: 'poll-row' },
            h('button', { type: 'button', class: 'poll-opt', title: 'Tap to Add a Vote', onclick: function () { o.n++; save(); paint(); } }, bar, h('span', { class: 'poll-t', text: o.t || 'Choice ' + (i + 1) }), h('b', { text: String(o.n) })),
            wb('−', 'round', function () { if (o.n > 0) { o.n--; save(); paint(); } }, 'Take one vote away')));
        });
        box.append(list, h('div', { class: 'wx-row' }, h('span', { class: 'wx-note', text: total + (total === 1 ? ' vote' : ' votes') }),
          wb('Edit', '', function () { editing = true; paint(); }), wb('Reset Votes', '', function () { d.opts.forEach(function (o) { o.n = 0; }); save(); paint(); })));
      }
      paint();
    }
  };

  // ---------- Work Mode ----------
  var MODES = [['silent', '🤐', 'Silent Work', '#E5484D'], ['whisper', '🤫', 'Whisper', '#E89A00'], ['partner', '💬', 'Partner Talk', '#0FA974'], ['group', '👥', 'Group Work', '#2563EB']];
  W.workmode = {
    title: 'Work Mode', color: '#F2643D', w: 300, h: 320,
    icon: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10.5h7"/>',
    init: function () { return { on: 'silent' }; },
    mount: function (body, w, save) {
      var d = w.data;
      var big = h('div', { class: 'wm-big', 'aria-live': 'polite' });
      var btns = MODES.map(function (m) {
        return h('button', { type: 'button', class: 'wm-btn', title: m[2], 'aria-label': m[2], 'data-m': m[0], onclick: function () { d.on = m[0]; save(); paint(); } }, m[1]);
      });
      function paint() {
        var m = MODES.filter(function (x) { return x[0] === d.on; })[0] || MODES[0];
        big.textContent = ''; big.style.background = m[3];
        big.append(h('span', { class: 'wm-emoji', text: m[1] }), h('b', { text: m[2] }));
        btns.forEach(function (b) { var on = b.getAttribute('data-m') === m[0]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      }
      body.append(h('div', { class: 'wx wm' }, big, h('div', { class: 'wx-row' }, btns)));
      paint();
    }
  };

  // ---------- Countdown to an event ----------
  W.countdown = {
    title: 'Countdown', color: '#E89A00', w: 320, h: 300,
    icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4"/>',
    init: function () { return { name: '', date: '' }; },
    mount: function (body, w, save) {
      var d = w.data;
      var num = h('div', { class: 'cd-num' }), label = h('div', { class: 'cd-label' });
      var name = h('input', { type: 'text', class: 'wx-input', id: 'cdn-' + w.id, maxlength: 40, placeholder: 'Event, like Field Trip', 'aria-label': 'Event name' });
      var date = h('input', { type: 'date', class: 'wx-input', id: 'cdd-' + w.id, 'aria-label': 'Event date' });
      name.value = d.name || ''; date.value = d.date || '';
      name.addEventListener('input', function () { d.name = name.value; save(); paint(); });
      date.addEventListener('input', function () { d.date = date.value; save(); paint(); });
      function paint() {
        var what = (d.name || '').trim() || 'the Big Day';
        var p = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d.date || '');
        if (!p) { num.textContent = '📅'; label.textContent = 'Pick a date below'; return; }
        var now = new Date(), a = new Date(now.getFullYear(), now.getMonth(), now.getDate()), b = new Date(+p[1], +p[2] - 1, +p[3]);
        var n = Math.round((b - a) / 864e5);
        if (n === 0) { num.textContent = '🎉'; label.textContent = what + ' Is Today!'; }
        else if (n > 0) { num.textContent = n; label.textContent = (n === 1 ? 'Day' : 'Days') + ' Until ' + what; }
        else { num.textContent = -n; label.textContent = (n === -1 ? 'Day' : 'Days') + ' Since ' + what; }
      }
      body.append(h('div', { class: 'wx cd' }, num, label, h('div', { class: 'cd-form' }, name, date)));
      paint();
      var iv = setInterval(paint, 60000);
      return { destroy: function () { clearInterval(iv); } };
    }
  };

  // ---------- Picture ----------
  W.image = {
    title: 'Picture', color: '#127C7A', w: 360, h: 300,
    icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    init: function () { return { src: '' }; },
    mount: function (body, w, save) {
      var d = w.data, id = 'img-' + w.id;
      var input = h('input', { type: 'file', id: id, accept: 'image/*', hidden: true });
      var msg = h('p', { class: 'form-msg', hidden: true });
      var box = h('div', { class: 'wx img-box' });
      body.append(box);
      input.addEventListener('change', function () {
        var f = input.files[0]; input.value = '';
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          var img = new Image();
          img.onload = function () {
            var scale = Math.min(1, 1000 / Math.max(img.width, img.height));
            var c = document.createElement('canvas');
            c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            var data = c.toDataURL('image/png');
            if (data.length > 400000) {
              var ctx = c.getContext('2d'); ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
              data = c.toDataURL('image/jpeg', 0.82);
            }
            try { localStorage.setItem('tt:space-test', data); localStorage.removeItem('tt:space-test'); }
            catch (e) { msg.textContent = 'There isn’t room to save that picture. Try a smaller one, or remove another picture first.'; msg.hidden = false; return; }
            msg.hidden = true; d.src = data; save(); paint();
          };
          img.onerror = function () { msg.textContent = 'That file isn’t a picture this browser can open. Try a JPG or PNG.'; msg.hidden = false; };
          img.src = reader.result;
        };
        reader.readAsDataURL(f);
      });
      function paint() {
        box.textContent = '';
        if (d.src) box.append(h('img', { src: d.src, alt: 'Picture on the board', draggable: 'false' }), h('label', { class: 'wb img-change', for: id, text: 'Change' }), input, msg);
        else box.append(h('label', { class: 'img-empty', for: id }, h('span', { html: TT.icon('image') }), h('b', { text: 'Choose a Picture' }), h('small', { text: 'From this computer' })), input, msg);
      }
      paint();
    }
  };
})();
