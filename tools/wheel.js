// Name Wheel: a colorful spinning wheel that lands on a name.
(function () {
  var TT = window.TT, h = TT.h;
  var KEY = 'wheel';
  var COLORS = ['#3B7BFF', '#FF7448', '#14B884', '#F5AE14', '#8B5CF6', '#EC4899', '#0EA5E9', '#7CB518'];

  TT.mountWheel = function (el, side) {
    var state = TT.load(KEY, { source: 'class', custom: 'Pizza party\nExtra recess\nPick the music\nTeacher’s helper\nHomework pass\nFree draw', removed: [], history: [] });
    var rot = 0, spinning = false;

    var canvas = h('canvas', { class: 'wheel-canvas', role: 'img', 'aria-label': 'Name wheel' });
    var hub = h('button', { type: 'button', class: 'wheel-hub', onclick: spin }, 'SPIN');
    var pointer = h('div', { class: 'wheel-pointer', 'aria-hidden': 'true' });
    var stage = h('div', { class: 'wheel-stage' }, canvas, hub, pointer);
    var result = h('div', { class: 'wheel-result', hidden: true, role: 'dialog', 'aria-live': 'assertive' });
    var hint = h('p', { class: 'muted wheel-hint', text: 'Click the wheel or press the space bar to spin.' });
    el.append(h('div', { class: 'wheel' }, h('div', { class: 'wheel-wrap' }, stage, result), hint));
    canvas.addEventListener('click', spin);

    // ----- Side panel: entries -----
    var srcClass = h('button', { type: 'button', class: 'seg', onclick: function () { setSource('class'); } }, 'Class List');
    var srcCustom = h('button', { type: 'button', class: 'seg', onclick: function () { setSource('custom'); } }, 'My Own List');
    var area = h('textarea', { class: 'roster-input', id: 'wheelCustom', rows: 10, 'aria-label': 'Wheel entries, one per line' });
    area.value = state.custom;
    area.addEventListener('input', function () { state.custom = area.value; state.removed = []; save(); draw(); paintSide(); });
    var classInfo = h('p', { class: 'roster-note' });
    var removedBox = h('div', { class: 'chips small' });
    var historyBox = h('ol', { class: 'wheel-history' });
    side.append(h('div', { class: 'roster' },
      h('div', { class: 'segmented', role: 'group', 'aria-label': 'What goes on the wheel' }, srcClass, srcCustom),
      classInfo, area,
      h('div', { class: 'row' },
        TT.button('Shuffle', { icon: 'shuffle', kind: 'small', onclick: function () { shuffled = TT.shuffle(entries()); draw(); } }),
        TT.button('Put Everyone Back', { icon: 'reset', kind: 'small', onclick: function () { state.removed = []; save(); shuffled = null; draw(); paintSide(); } })),
      h('div', { class: 'picked-head' }, h('h3', { text: 'Taken Off the Wheel' })), removedBox,
      h('div', { class: 'picked-head' }, h('h3', { text: 'Results' }),
        TT.button('Clear', { kind: 'small', onclick: function () { state.history = []; save(); paintSide(); } })),
      historyBox));

    var shuffled = null;
    function save() { TT.save(KEY, state); }
    function allEntries() {
      return state.source === 'class' ? TT.roster.present() : state.custom.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    }
    function entries() {
      var list = allEntries().filter(function (n) { return state.removed.indexOf(n) < 0; });
      if (shuffled) {
        var keep = shuffled.filter(function (n) { return list.indexOf(n) >= 0; });
        list.forEach(function (n) { if (keep.indexOf(n) < 0) keep.push(n); });
        return keep;
      }
      return list;
    }
    function setSource(s) { state.source = s; state.removed = []; shuffled = null; save(); draw(); paintSide(); }

    function paintSide() {
      srcClass.classList.toggle('on', state.source === 'class');
      srcCustom.classList.toggle('on', state.source === 'custom');
      area.hidden = state.source !== 'custom';
      classInfo.hidden = state.source !== 'class';
      classInfo.textContent = TT.roster.isSample()
        ? 'Using sample names. Add your class on the Name Picker or Group Maker page.'
        : 'Using “' + TT.roster.activeName() + '”: ' + TT.roster.present().length + ' students here today. Change classes on the Name Picker page.';
      classInfo.classList.toggle('warn', TT.roster.isSample());
      removedBox.textContent = '';
      if (!state.removed.length) removedBox.append(h('span', { class: 'muted', text: 'Nobody yet.' }));
      state.removed.forEach(function (n) {
        removedBox.append(h('button', { type: 'button', class: 'chip', title: 'Put back on the wheel', onclick: function () {
          state.removed.splice(state.removed.indexOf(n), 1); save(); draw(); paintSide();
        } }, n + ' ↺'));
      });
      historyBox.textContent = '';
      if (!state.history.length) historyBox.append(h('li', { class: 'muted', text: 'Spin to see results here.' }));
      state.history.slice(0, 12).forEach(function (n) { historyBox.append(h('li', { text: n })); });
    }

    // ----- Drawing -----
    function draw() {
      var list = entries();
      var size = canvas.clientWidth || 560;
      var dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(size * dpr)) { canvas.width = Math.round(size * dpr); canvas.height = Math.round(size * dpr); }
      var ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      var cx = size / 2, R = size / 2 - 6;
      ctx.save();
      ctx.translate(cx, cx);
      // rim shadow
      ctx.beginPath(); ctx.arc(0, 0, R + 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(14,17,32,.12)'; ctx.fill();
      ctx.rotate(rot);
      if (!list.length) {
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = '#E3E6EF'; ctx.fill();
        ctx.restore(); return;
      }
      var seg = Math.PI * 2 / list.length;
      var fontSize = Math.max(12, Math.min(R * 0.13, (R * seg) * 0.42, 40));
      list.forEach(function (name, i) {
        var a0 = i * seg, a1 = a0 + seg;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, a0, a1); ctx.closePath();
        var color = COLORS[i % COLORS.length];
        if (list.length % COLORS.length === 1 && i === list.length - 1) color = COLORS[(i + 2) % COLORS.length];
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = list.length > 40 ? 1 : 2; ctx.stroke();
        ctx.save();
        ctx.rotate(a0 + seg / 2);
        ctx.fillStyle = '#fff';
        ctx.font = '700 ' + fontSize + 'px "Plus Jakarta Sans", "Segoe UI", sans-serif';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 4;
        var maxW = R * 0.68, text = name;
        while (ctx.measureText(text).width > maxW && text.length > 2) text = text.slice(0, -2) + '…';
        ctx.fillText(text, R - 18, 0);
        ctx.restore();
      });
      ctx.restore();
    }

    function indexAtPointer(n) {
      var seg = Math.PI * 2 / n;
      var a = ((-rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      return Math.floor(a / seg) % n;
    }

    function spin() {
      var list = entries();
      if (spinning || list.length < 1) return;
      result.hidden = true;
      spinning = true; stage.classList.add('spinning');
      var start = rot, extra = Math.PI * 2 * (5 + Math.random() * 2) + Math.random() * Math.PI * 2;
      var dur = 4800 + Math.random() * 1200, t0 = performance.now(), last = indexAtPointer(list.length);
      (function frame(now) {
        var t = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - t, 4);
        rot = start + extra * e;
        draw();
        var idx = indexAtPointer(list.length);
        if (idx !== last) { last = idx; TT.tick(); pointer.classList.remove('flick'); void pointer.offsetWidth; pointer.classList.add('flick'); }
        if (t < 1) { requestAnimationFrame(frame); return; }
        spinning = false; stage.classList.remove('spinning');
        showResult(list[idx]);
      })(t0);
    }

    function showResult(name) {
      TT.chime();
      state.history.unshift(name); state.history = state.history.slice(0, 50); save(); paintSide();
      result.textContent = '';
      result.append(
        h('span', { class: 'eyebrow', text: 'The Wheel Picked' }),
        h('div', { class: 'wheel-winner', text: name }),
        h('div', { class: 'row center' },
          TT.button('Take Off the Wheel', { kind: 'primary', onclick: function () { state.removed.push(name); save(); result.hidden = true; draw(); paintSide(); } }),
          TT.button('Keep on the Wheel', { onclick: function () { result.hidden = true; } })));
      result.hidden = false;
    }

    document.addEventListener('keydown', function (e) {
      if (el.offsetParent === null || /INPUT|TEXTAREA|BUTTON/.test(e.target.tagName)) return;
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); spin(); }
    });
    window.addEventListener('resize', draw);
    TT.roster.onChange(function () { shuffled = null; draw(); paintSide(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    paintSide();
    requestAnimationFrame(draw);
    return { show: function () { requestAnimationFrame(draw); } };
  };
})();
