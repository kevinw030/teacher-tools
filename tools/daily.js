// Sound Level, Daily Schedule, Class Jobs and Class Points.
(function () {
  var TT = window.TT, h = TT.h;

  // ---------- Sound Level ----------
  // Listens through the microphone and shows the volume. Nothing is recorded, saved or sent anywhere.
  TT.mountSound = function (el) {
    var state = TT.load('sound', { limit: 60, sens: 50, chime: true });
    var stream = null, actx = null, analyser = null, buf = null, raf = 0, level = 0, overSince = 0, loud = false, alerts = 0, lastChime = 0;
    var SEGS = 24;
    var bars = h('div', { class: 'sl-bars', 'aria-hidden': 'true' });
    for (var i = 0; i < SEGS; i++) bars.append(h('i'));
    var marker = h('span', { class: 'sl-marker', 'aria-hidden': 'true' }, h('b', { text: 'Limit' }));
    var label = h('div', { class: 'sl-label', 'aria-live': 'polite', text: 'Ready When You Are' });
    var sub = h('div', { class: 'pick-sub', text: 'Press Start and allow the microphone.' });
    var stage = h('div', { class: 'sl-stage' }, label, h('div', { class: 'sl-meter' }, bars, marker), sub);
    var startBtn = TT.button('Start Listening', { icon: 'play', kind: 'primary big', onclick: toggle });
    var msg = h('p', { class: 'form-msg', hidden: true, role: 'status' });
    function slider(id, labelText, key, after) {
      var input = h('input', { type: 'range', id: id, min: 5, max: 100, step: 1, 'aria-label': labelText });
      input.value = state[key];
      input.addEventListener('input', function () { state[key] = +input.value; TT.save('sound', state); if (after) after(); });
      return h('label', { class: 'sl-slider', for: id }, h('span', { text: labelText }), input);
    }
    var chimeBtn = h('button', { type: 'button', class: 'seg', onclick: function () { state.chime = !state.chime; TT.save('sound', state); paintChime(); } });
    function paintChime() { chimeBtn.textContent = state.chime ? 'Chime When Too Loud: On' : 'Chime When Too Loud: Off'; chimeBtn.classList.toggle('on', state.chime); chimeBtn.setAttribute('aria-pressed', state.chime); }
    el.append(h('div', { class: 'picker sl' }, stage, h('div', { class: 'row center' }, startBtn), msg,
      h('div', { class: 'sl-controls' }, slider('slLimit', 'Loudness Limit', 'limit', paintMarker), slider('slSens', 'Microphone Sensitivity', 'sens'),
        h('div', { class: 'segmented' }, chimeBtn))));
    function paintMarker() { marker.style.left = state.limit + '%'; }
    function paintBars() {
      var on = Math.round(level / 100 * SEGS), lim = state.limit / 100 * SEGS;
      for (var i = 0; i < SEGS; i++) {
        var b = bars.children[i];
        b.className = i < on ? (i >= lim ? 'on red' : i >= lim * 0.7 ? 'on amber' : 'on green') : '';
      }
    }
    function frame() {
      raf = requestAnimationFrame(frame);
      analyser.getFloatTimeDomainData(buf);
      var sum = 0;
      for (var i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      var rms = Math.sqrt(sum / buf.length);
      // Map quiet-to-loud onto 0-100. Sensitivity shifts how easily the meter fills.
      var db = 20 * Math.log10(rms || 1e-6), floor = -62 + (50 - state.sens) * 0.3, top = -8 - (state.sens - 50) * 0.3;
      var target = Math.max(0, Math.min(100, (db - floor) / (top - floor) * 100));
      level += (target - level) * (target > level ? 0.35 : 0.08);
      paintBars();
      var now = Date.now(), over = level >= state.limit;
      if (over) { if (!overSince) overSince = now; } else overSince = 0;
      var nowLoud = over && now - overSince > 900;
      if (nowLoud && !loud) { alerts++; if (state.chime && now - lastChime > 6000) { lastChime = now; TT.chime(); } }
      if (nowLoud !== loud || !label.dataset.s) { loud = nowLoud; }
      var s = loud ? 'loud' : level < state.limit * 0.45 ? 'quiet' : 'ok';
      if (label.dataset.s !== s) {
        label.dataset.s = s; stage.setAttribute('data-s', s);
        label.textContent = s === 'loud' ? 'Too Loud!' : s === 'quiet' ? 'Nice and Quiet' : 'Just Right';
      }
      sub.textContent = alerts ? 'Too loud ' + alerts + (alerts === 1 ? ' time' : ' times') + ' so far' : 'Stay under the limit line';
    }
    function stop() {
      cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      if (actx) actx.close().catch(function () {});
      stream = actx = analyser = null; level = 0; loud = false; overSince = 0; paintBars();
      delete label.dataset.s; stage.removeAttribute('data-s');
      label.textContent = 'Ready When You Are'; sub.textContent = 'Press Start and allow the microphone.';
      startBtn.innerHTML = TT.icon('play') + '<span>Start Listening</span>';
    }
    function toggle() {
      if (stream) { stop(); return; }
      msg.hidden = true;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = 'This browser can’t use the microphone here. Try Chrome or Edge.'; msg.hidden = false; return; }
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (st) {
        stream = st; alerts = 0;
        actx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = actx.createAnalyser(); analyser.fftSize = 2048;
        buf = new Float32Array(analyser.fftSize);
        actx.createMediaStreamSource(st).connect(analyser);
        startBtn.innerHTML = TT.icon('pause') + '<span>Stop Listening</span>';
        frame();
      }).catch(function () {
        msg.textContent = 'The microphone is blocked or missing. Click the lock or camera icon in the address bar, allow the microphone, then press Start again.'; msg.hidden = false;
      });
    }
    paintMarker(); paintChime(); paintBars();
    return { hide: function () { if (stream) stop(); } };
  };

  // ---------- Daily Schedule ----------
  var SAMPLE_DAY = { end: '15:00', blocks: [['08:00', 'Morning Meeting'], ['08:30', 'Reading'], ['09:45', 'Specials'], ['10:30', 'Math'], ['11:45', 'Lunch and Recess'], ['12:30', 'Writing'], ['13:30', 'Science'], ['14:30', 'Pack Up']] };
  function mins(t) { var p = /^(\d\d?):(\d\d)$/.exec(t || ''); return p ? +p[1] * 60 + +p[2] : null; }
  function clock(t) { var m = mins(t); if (m == null) return ''; var hr = Math.floor(m / 60), mm = m % 60; return ((hr + 11) % 12 + 1) + ':' + (mm < 10 ? '0' : '') + mm; }
  function span(n) { return n >= 60 ? Math.floor(n / 60) + ' hr' + (n % 60 ? ' ' + n % 60 + ' min' : '') : n + ' min'; }
  var schedListeners = [];
  function schedLoad() {
    var s = TT.load('schedule', null);
    if (!s || !Array.isArray(s.blocks)) s = { end: SAMPLE_DAY.end, blocks: SAMPLE_DAY.blocks.map(function (b) { return { t: b[0], name: b[1] }; }), sample: true };
    return s;
  }
  TT.mountSchedule = function (el, opts) {
    var compact = !!(opts && opts.compact), state = schedLoad(), editing = false;
    var root = h('div', { class: 'sched' + (compact ? ' compact' : '') });
    el.append(root);
    function save() { delete state.sample; TT.save('schedule', state); schedListeners.forEach(function (fn) { if (fn !== reload) fn(); }); }
    function reload() { state = schedLoad(); if (!editing) paint(); }
    schedListeners.push(reload);
    function sorted() { return state.blocks.filter(function (b) { return mins(b.t) != null && b.name; }).sort(function (a, b) { return mins(a.t) - mins(b.t); }); }
    function paint() {
      root.textContent = '';
      if (editing) { edit(); return; }
      var list = sorted(), d = new Date(), now = d.getHours() * 60 + d.getMinutes(), end = mins(state.end);
      var cur = -1;
      list.forEach(function (b, i) { var stop = i + 1 < list.length ? mins(list[i + 1].t) : (end != null ? end : 24 * 60); if (now >= mins(b.t) && now < stop) cur = i; });
      var hero = h('div', { class: 'sched-now' });
      if (!list.length) hero.append(h('span', { class: 'eyebrow', text: 'No Schedule Yet' }), h('b', { text: 'Add your day' }));
      else if (cur >= 0) {
        var stop = cur + 1 < list.length ? mins(list[cur + 1].t) : end, start = mins(list[cur].t);
        var left = stop != null ? stop - now : null;
        hero.append(h('span', { class: 'eyebrow', text: 'Right Now' }), h('b', { text: list[cur].name }),
          left != null ? h('span', { class: 'sched-left', text: span(left) + ' left' }) : null,
          left != null ? h('span', { class: 'track' }, h('span', { style: 'width:' + Math.round((now - start) / (stop - start) * 100) + '%' })) : null,
          h('span', { class: 'sched-next', text: cur + 1 < list.length ? 'Next: ' + list[cur + 1].name + ' at ' + clock(list[cur + 1].t) : (state.end ? 'Then the day ends at ' + clock(state.end) : '') }));
      } else if (now < mins(list[0].t)) hero.append(h('span', { class: 'eyebrow', text: 'Coming Up' }), h('b', { text: list[0].name }), h('span', { class: 'sched-left', text: 'Starts at ' + clock(list[0].t) + ' · in ' + span(mins(list[0].t) - now) }));
      else hero.append(h('span', { class: 'eyebrow', text: 'All Done' }), h('b', { text: 'The School Day Is Over' }), h('span', { class: 'sched-left', text: 'See you tomorrow!' }));
      var rows = h('ol', { class: 'sched-list' });
      list.forEach(function (b, i) {
        rows.append(h('li', { class: i === cur ? 'now' : i < cur || (cur < 0 && now >= mins(b.t)) ? 'past' : '' }, h('time', { text: clock(b.t) }), h('span', { text: b.name })));
      });
      if (list.length && state.end) rows.append(h('li', { class: 'end' + (end != null && now >= end ? ' past' : '') }, h('time', { text: clock(state.end) }), h('span', { text: 'End of the Day' })));
      root.append(hero, rows);
      if (state.sample && !compact) root.append(h('p', { class: 'roster-note warn', text: 'This is a sample day. Press Edit Schedule to put in your own.' }));
      root.append(h('div', { class: 'row' }, compact ? h('button', { type: 'button', class: 'wb', onclick: function () { editing = true; paint(); } }, 'Edit') : TT.button('Edit Schedule', { icon: 'edit', onclick: function () { editing = true; paint(); } })));
    }
    function edit() {
      var rows = h('div', { class: 'sched-edit' }), uid = Math.random().toString(36).slice(2, 6);
      state.blocks.sort(function (a, b) { return (mins(a.t) || 0) - (mins(b.t) || 0); });
      state.blocks.forEach(function (b, i) {
        var t = h('input', { type: 'time', id: 'sct' + uid + i, 'aria-label': 'Start time' }), n = h('input', { type: 'text', id: 'scn' + uid + i, maxlength: 40, placeholder: 'Like Math', 'aria-label': 'What happens' });
        t.value = b.t || ''; n.value = b.name || '';
        t.addEventListener('input', function () { b.t = t.value; save(); });
        n.addEventListener('input', function () { b.name = n.value; save(); });
        rows.append(h('div', { class: 'sched-row' }, t, n, h('button', { type: 'button', class: 'cq-x', 'aria-label': 'Remove this block', title: 'Remove', html: TT.icon('trash'), onclick: function () { state.blocks.splice(i, 1); save(); paint(); } })));
      });
      var endIn = h('input', { type: 'time', id: 'sce' + uid, 'aria-label': 'End of the day' });
      endIn.value = state.end || ''; endIn.addEventListener('input', function () { state.end = endIn.value; save(); });
      root.append(h('p', { class: 'muted', text: 'Type when each part of the day starts. Each one runs until the next begins.' }), rows,
        h('div', { class: 'sched-row end' }, endIn, h('b', { text: 'End of the Day' })),
        h('div', { class: 'row' },
          TT.button('Add a Block', { icon: 'plus', kind: compact ? 'small' : '', onclick: function () { var last = state.blocks[state.blocks.length - 1]; state.blocks.push({ t: last && last.t ? last.t : '08:00', name: '' }); save(); paint(); var ins = root.querySelectorAll('.sched-row input[type=text]'); if (ins.length) ins[ins.length - 1].focus(); } }),
          TT.button('Done', { kind: 'primary' + (compact ? ' small' : ''), onclick: function () { editing = false; state.blocks = state.blocks.filter(function (b) { return b.name && b.name.trim(); }); save(); paint(); } })));
    }
    paint();
    var iv = setInterval(function () { if (!editing) paint(); }, 20000);
    return { show: function () { reload(); }, destroy: function () { clearInterval(iv); schedListeners.splice(schedListeners.indexOf(reload), 1); } };
  };
  if (TT.boardWidgets) TT.boardWidgets.schedule = {
    title: 'Schedule', color: '#0EA5E9', w: 320, h: 420,
    icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h5M8 17h8"/>',
    init: function () { return {}; },
    mount: function (body) { return TT.mountSchedule(body, { compact: true }); }
  };

  // ---------- Class Jobs ----------
  var DEFAULT_JOBS = ['Line Leader', 'Door Holder', 'Paper Passer', 'Librarian', 'Tech Helper', 'Messenger', 'Plant Helper', 'Board Cleaner', 'Lunch Helper', 'Caboose'];
  var JOB_COLORS = ['cobalt', 'coral', 'emerald', 'amber', 'violet', 'rose', 'sky', 'lime'];
  TT.mountJobs = function (el) {
    var state = TT.load('jobs', null) || { jobs: DEFAULT_JOBS.slice(), byClass: {} };
    if (!Array.isArray(state.jobs)) state.jobs = DEFAULT_JOBS.slice();
    if (!state.byClass) state.byClass = {};
    var editing = false, root = h('div', { class: 'jobs' });
    el.append(root);
    function save() { TT.save('jobs', state); }
    // Each class keeps its own order of students and its own place in the rotation.
    function cls() {
      var id = TT.roster.isSample() ? 'sample' : TT.roster.activeId(), names = TT.roster.all();
      var c = state.byClass[id] = state.byClass[id] || { order: [], offset: 0 };
      c.order = c.order.filter(function (n) { return names.indexOf(n) >= 0; });
      names.forEach(function (n) { if (c.order.indexOf(n) < 0) c.order.push(n); });
      return c;
    }
    function paint() {
      root.textContent = '';
      var c = cls(), n = c.order.length;
      if (editing) {
        var area = h('textarea', { class: 'roster-input', id: 'jobsList', rows: 12, 'aria-label': 'Jobs, one per line' });
        area.value = state.jobs.join('\n');
        root.append(h('h3', { class: 'cq-h', text: 'Your Jobs' }), h('p', { class: 'muted', text: 'One job per line. Add, remove or rename anything.' }), area,
          h('div', { class: 'row' }, TT.button('Save Jobs', { kind: 'primary', onclick: function () { state.jobs = area.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 40); editing = false; save(); paint(); } }),
            TT.button('Cancel', { onclick: function () { editing = false; paint(); } })));
        return;
      }
      var note = h('p', { class: 'roster-note' + (TT.roster.isSample() ? ' warn' : ''), text: TT.roster.isSample()
        ? 'Using sample names. Add your class on the Name Picker page and the jobs will use it.'
        : 'Using “' + TT.roster.activeName() + '”. Change classes on the Name Picker page.' });
      var grid = h('div', { class: 'jobs-grid' });
      var used = {};
      state.jobs.forEach(function (j, i) {
        var who = n ? c.order[(((i - c.offset) % n) + n) % n] : '';
        if (n && i >= n) who = '';
        if (who) used[who] = 1;
        grid.append(h('div', { class: 'job c-' + JOB_COLORS[i % JOB_COLORS.length] }, h('span', { class: 'job-title', text: j }), h('b', { class: 'job-who', text: who || 'Open' })));
      });
      if (!state.jobs.length) grid.append(h('div', { class: 'empty', text: 'No jobs yet. Press Edit Jobs to add some.' }));
      var rest = c.order.filter(function (s) { return !used[s]; });
      root.append(h('div', { class: 'row jobs-bar' },
        TT.button('Rotate Jobs', { icon: 'arrow', kind: 'primary big', onclick: function () { c.offset = (c.offset + 1) % Math.max(1, n); save(); paint(); TT.tick(); } }),
        TT.button('Shuffle', { icon: 'shuffle', kind: 'big', onclick: function () { c.order = TT.shuffle(c.order); c.offset = 0; save(); paint(); } }),
        TT.button('Edit Jobs', { icon: 'edit', kind: 'big', onclick: function () { editing = true; paint(); } })),
        grid);
      if (rest.length && state.jobs.length) root.append(h('div', { class: 'picked-head' }, h('h3', { text: 'On Break This Round (' + rest.length + ')' })), h('div', { class: 'chips' }, rest.map(function (s) { return h('span', { class: 'chip static', text: s }); })));
      root.append(note);
    }
    TT.roster.onChange(paint);
    paint();
    return { show: paint };
  };

  // ---------- Class Points ----------
  var MARBLES = ['#3B7BFF', '#FF7448', '#14B884', '#F5AE14', '#8B5CF6', '#EC4899', '#0EA5E9', '#7CB518'];
  var TEAM_COLORS = ['cobalt', 'coral', 'emerald', 'amber', 'violet', 'rose'];
  TT.mountPoints = function (el) {
    var state = TT.load('points', null) || {};
    state.mode = state.mode === 'teams' ? 'teams' : 'jar';
    state.jar = state.jar || { count: 0, goal: 20, reward: 'Extra Recess' };
    if (!Array.isArray(state.teams) || !state.teams.length) state.teams = [{ name: 'Table 1', pts: 0 }, { name: 'Table 2', pts: 0 }, { name: 'Table 3', pts: 0 }, { name: 'Table 4', pts: 0 }];
    var tabs = h('div', { class: 'segmented', role: 'group', 'aria-label': 'How to keep points' }, [['jar', 'Class Jar'], ['teams', 'Team Points']].map(function (t) {
      return h('button', { type: 'button', class: 'seg', 'data-m': t[0], onclick: function () { state.mode = t[0]; save(); paint(); } }, t[1]);
    }));
    var box = h('div', { class: 'pts-body' });
    el.append(h('div', { class: 'pts' }, tabs, box));
    function save() { TT.save('points', state); }
    var shown = 1e9; // marbles already drawn, so only new ones pop in
    function jar() {
      var j = state.jar, goal = Math.max(1, j.goal || 20), full = j.count >= goal;
      var marbles = h('div', { class: 'jar-marbles' });
      for (var i = 0; i < Math.min(j.count, goal); i++) marbles.append(h('i', { class: i >= shown ? 'new' : '', style: 'background:' + MARBLES[(i * 5 + 3) % MARBLES.length] }));
      shown = Math.min(j.count, goal);
      marbles.style.setProperty('--per', Math.ceil(Math.sqrt(goal * 0.8)));
      var goalIn = h('input', { type: 'number', id: 'jarGoal', min: 5, max: 100, 'aria-label': 'Marbles to fill the jar' }); goalIn.value = goal;
      goalIn.addEventListener('change', function () { j.goal = Math.max(5, Math.min(100, Math.round(+goalIn.value) || 20)); save(); paint(); });
      var rewardIn = h('input', { type: 'text', id: 'jarReward', maxlength: 40, placeholder: 'Like Extra Recess', 'aria-label': 'Reward' }); rewardIn.value = j.reward || '';
      rewardIn.addEventListener('input', function () { j.reward = rewardIn.value; save(); rewardEl.textContent = rewardText(); });
      function rewardText() { return full ? 'You earned: ' + (j.reward || 'your reward') + '!' : 'Working toward: ' + (j.reward || 'a class reward'); }
      var rewardEl = h('p', { class: 'jar-reward', text: rewardText() });
      function add(n) { var was = j.count >= goal; j.count = Math.max(0, Math.min(goal, j.count + n)); save(); if (n > 0) TT.tick(); if (!was && j.count >= goal) TT.chime(); paint(); }
      box.append(h('div', { class: 'jar-layout' },
        h('div', { class: 'jar' + (full ? ' full' : '') }, h('div', { class: 'jar-lid' }), h('div', { class: 'jar-glass' }, marbles)),
        h('div', { class: 'jar-side' },
          h('div', { class: 'jar-count', 'aria-live': 'polite' }, h('b', { text: String(j.count) }), h('span', { text: ' of ' + goal })),
          h('h2', { class: 'jar-title', text: full ? '🎉 The Jar Is Full!' : (goal - j.count) + (goal - j.count === 1 ? ' More to Go' : ' More to Go') }), rewardEl,
          full ? h('div', { class: 'row' }, TT.button('Empty the Jar and Start Again', { icon: 'reset', kind: 'primary big', onclick: function () { j.count = 0; save(); paint(); } }))
            : h('div', { class: 'row' }, TT.button('Add a Marble', { icon: 'plus', kind: 'primary big', onclick: function () { add(1); } }), TT.button('Add 5', { kind: 'big', onclick: function () { add(5); } }), TT.button('Take One Out', { icon: 'minus', kind: 'big', onclick: function () { add(-1); } })),
          h('div', { class: 'jar-set' }, h('label', { class: 'cq-field', for: 'jarReward' }, h('span', { text: 'Reward' }), rewardIn), h('label', { class: 'cq-field small', for: 'jarGoal' }, h('span', { text: 'Marbles to Fill' }), goalIn)))));
    }
    function teams() {
      var top = Math.max.apply(null, state.teams.map(function (t) { return t.pts; }));
      var grid = h('div', { class: 'pts-teams' });
      state.teams.forEach(function (t, i) {
        var name = h('input', { type: 'text', id: 'ptName' + i, class: 'pts-name', maxlength: 20, 'aria-label': 'Team name' }); name.value = t.name;
        name.addEventListener('input', function () { t.name = name.value; save(); });
        function add(n) { t.pts = Math.max(0, t.pts + n); save(); if (n > 0) TT.tick(); paint(); }
        grid.append(h('div', { class: 'pts-team c-' + TEAM_COLORS[i % 6] + (top > 0 && t.pts === top ? ' lead' : '') }, name,
          h('b', { class: 'pts-score', text: String(t.pts) }),
          h('div', { class: 'row center' },
            h('button', { type: 'button', class: 'btn icon-only', 'aria-label': 'Take a point from ' + t.name, html: TT.icon('minus'), onclick: function () { add(-1); } }),
            h('button', { type: 'button', class: 'btn primary big', 'aria-label': 'Give a point to ' + t.name, html: TT.icon('plus') + '<span>1</span>', onclick: function () { add(1); } }),
            h('button', { type: 'button', class: 'btn', 'aria-label': 'Give 5 points to ' + t.name, onclick: function () { add(5); } }, '+5'))));
      });
      box.append(grid, h('div', { class: 'row' },
        state.teams.length < 6 ? TT.button('Add a Team', { icon: 'plus', onclick: function () { state.teams.push({ name: 'Table ' + (state.teams.length + 1), pts: 0 }); save(); paint(); } }) : null,
        state.teams.length > 2 ? TT.button('Remove Last Team', { icon: 'minus', onclick: function () { state.teams.pop(); save(); paint(); } }) : null,
        TT.button('Reset Points', { icon: 'reset', onclick: function () { state.teams.forEach(function (t) { t.pts = 0; }); save(); paint(); } })));
    }
    function paint() {
      tabs.querySelectorAll('.seg').forEach(function (b) { var on = b.getAttribute('data-m') === state.mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      box.textContent = '';
      (state.mode === 'jar' ? jar : teams)();
    }
    paint();
  };
})();
