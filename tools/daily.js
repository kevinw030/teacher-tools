// Sound Level, Daily Schedule, Class Jobs and Class Points.
(function () {
  var TT = window.TT, h = TT.h;

  // ---------- Sound Level ----------
  // Listens through the microphone and shows the volume. Nothing is recorded, saved or sent anywhere.
  // The listening buddy: an original sleepy creature that naps when the room is quiet,
  // wakes up when it is busy and covers its ears when it is too loud.
  var SNOOZY = '<svg viewBox="0 0 220 190" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="szG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5EE0D0"/><stop offset="1" stop-color="#1FA9B8"/></linearGradient></defs>' +
    '<ellipse cx="110" cy="176" rx="74" ry="9" fill="rgba(14,17,32,.22)"/>' +
    '<g class="z-waves" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"><path d="M30 70 Q14 95 30 120"/><path d="M12 56 Q-10 95 12 134"/><path d="M190 70 Q206 95 190 120"/><path d="M208 56 Q230 95 208 134"/></g>' +
    '<g class="z-all">' +
      '<path d="M40 150 Q40 128 66 130 Q74 114 96 120 Q110 106 128 120 Q152 112 158 132 Q182 130 180 152 Q182 172 158 172 L62 172 Q38 172 40 150Z" fill="#fff" stroke="#D5DCF5" stroke-width="3"/>' +
      '<g class="z-body">' +
        '<path d="M66 62 L58 34 L86 50Z" fill="#1FA9B8" stroke="#0E7C8A" stroke-width="3" stroke-linejoin="round"/><path d="M154 62 L162 34 L134 50Z" fill="#1FA9B8" stroke="#0E7C8A" stroke-width="3" stroke-linejoin="round"/>' +
        '<ellipse cx="110" cy="100" rx="60" ry="56" fill="url(#szG)" stroke="#0E7C8A" stroke-width="3"/>' +
        '<ellipse cx="110" cy="124" rx="32" ry="22" fill="#fff" opacity=".28"/>' +
        '<circle cx="74" cy="112" r="8" fill="#FF8FB8" opacity=".85"/><circle cx="146" cy="112" r="8" fill="#FF8FB8" opacity=".85"/>' +
        '<g class="z-cap"><path d="M64 66 Q82 22 132 34 Q160 40 172 66 Q118 50 64 66Z" fill="#7C5CFF" stroke="#4B32C4" stroke-width="3" stroke-linejoin="round"/><path d="M150 40 Q178 30 184 58" fill="none" stroke="#7C5CFF" stroke-width="9" stroke-linecap="round"/><circle cx="185" cy="62" r="9" fill="#FFD43B" stroke="#F59F00" stroke-width="2.5"/></g>' +
        '<g class="z-open"><circle cx="90" cy="92" r="13" fill="#fff"/><circle cx="130" cy="92" r="13" fill="#fff"/><g class="z-pupils"><circle cx="90" cy="93" r="6" fill="#0E1B3A"/><circle cx="130" cy="93" r="6" fill="#0E1B3A"/><circle cx="92" cy="91" r="2" fill="#fff"/><circle cx="132" cy="91" r="2" fill="#fff"/></g></g>' +
        '<g class="z-closed" fill="none" stroke="#0E1B3A" stroke-width="4" stroke-linecap="round"><path d="M79 94 Q90 103 101 94"/><path d="M119 94 Q130 103 141 94"/></g>' +
        '<path class="z-smile" d="M98 116 Q110 128 122 116" fill="none" stroke="#0E1B3A" stroke-width="4" stroke-linecap="round"/>' +
        '<ellipse class="z-snore" cx="110" cy="120" rx="5" ry="6" fill="#0E1B3A"/>' +
        '<ellipse class="z-yell" cx="110" cy="122" rx="11" ry="13" fill="#0E1B3A"/>' +
        '<path class="z-arm z-arm-l" d="M56 112 Q40 126 50 144" fill="none" stroke="#1FA9B8" stroke-width="13" stroke-linecap="round"/>' +
        '<path class="z-arm z-arm-r" d="M164 112 Q180 126 170 144" fill="none" stroke="#1FA9B8" stroke-width="13" stroke-linecap="round"/>' +
      '</g>' +
    '</g>' +
    '<g class="z-zzz" fill="#fff" font-family="sans-serif" font-weight="900"><text x="168" y="44" font-size="22">z</text><text x="184" y="26" font-size="17">z</text><text x="197" y="12" font-size="13">z</text></g>' +
    '</svg>';

  TT.mountSound = function (el) {
    var state = TT.load('sound', { limit: 60, sens: 50, chime: true });
    if ([15, 30, 60].indexOf(state.every) < 0) state.every = 30;
    if ([5, 10, 15].indexOf(state.goal) < 0) state.goal = 5;
    if (state.bestDay !== TT.today()) { state.bestDay = TT.today(); state.best = 0; }
    var stream = null, actx = null, analyser = null, buf = null, raf = 0, level = 0, overSince = 0, loud = false, alerts = 0, lastChime = 0;
    var stars = 0, streak = 0, sinceStar = 0, lastT = 0, done = false, fake = null, cur = '';
    var calm = 0, quietNow = false, loudOff = 0, want = '', wantSince = 0, sceneAt = 0, lastSub = '';
    var SEGS = 24;
    var bars = h('div', { class: 'sl-bars', 'aria-hidden': 'true' });
    for (var i = 0; i < SEGS; i++) bars.append(h('i'));
    var marker = h('span', { class: 'sl-marker', 'aria-hidden': 'true' }, h('b', { text: 'Limit' }));
    var label = h('div', { class: 'sl-label', 'aria-live': 'polite', text: 'Ready When You Are' });
    var sub = h('div', { class: 'sl2-sub', text: 'Press Start and allow the microphone.' });
    var buddy = h('div', { class: 'sl2-buddy' }); buddy.innerHTML = SNOOZY;
    var starRow = h('div', { class: 'sl2-stars', role: 'img' });
    var next = h('span'), nextBar = h('div', { class: 'sl2-next', 'aria-hidden': 'true' }, next);
    var streakPill = h('div', { class: 'sl2-pill' });
    var sky = h('div', { class: 'sl2-sky', 'aria-hidden': 'true' });
    var bgs = ['quiet', 'ok', 'loud', 'win'].map(function (n) { return h('div', { class: 'sl2-bg bg-' + n, 'aria-hidden': 'true' }); });
    for (var k = 0; k < 14; k++) { var dot = h('i'); dot.style.left = (4 + (k * 37) % 92) + '%'; dot.style.top = (6 + (k * 23) % 44) + '%'; dot.style.animationDelay = -(k * 0.37) + 's'; sky.append(dot); }
    var again = TT.button('Start a New Round', { kind: 'primary big', onclick: function () { stars = 0; sinceStar = 0; done = false; again.hidden = true; paintStars(); } });
    again.hidden = true;
    var stage = h('div', { class: 'sl-stage sl2', 'data-s': 'idle' }, bgs, sky,
      h('div', { class: 'sl2-top' }, h('div', { class: 'sl2-goal' }, h('b', { text: 'Quiet Stars' }), starRow, nextBar), streakPill),
      label, buddy, sub, again, h('div', { class: 'sl-meter' }, bars, marker));
    var startBtn = TT.button('Start Listening', { icon: 'play', kind: 'primary big', onclick: toggle });
    var msg = h('p', { class: 'form-msg', hidden: true, role: 'status' });
    function slider(id, labelText, key, after) {
      var input = h('input', { type: 'range', id: id, min: 5, max: 100, step: 1, 'aria-label': labelText });
      input.value = state[key];
      input.addEventListener('input', function () { state[key] = +input.value; TT.save('sound', state); if (after) after(); });
      return h('label', { class: 'sl-slider', for: id }, h('span', { text: labelText }), input);
    }
    function choice(title, key, opts, after) {
      var seg = h('div', { class: 'segmented', role: 'group', 'aria-label': title }, opts.map(function (o) {
        return h('button', { type: 'button', class: 'seg', 'data-v': o[0], onclick: function () { state[key] = o[0]; TT.save('sound', state); paint(); if (after) after(); } }, o[1]);
      }));
      function paint() { seg.querySelectorAll('.seg').forEach(function (b) { var on = +b.getAttribute('data-v') === state[key]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
      paint();
      return h('div', { class: 'sl2-opt' }, h('span', { text: title }), seg);
    }
    var chimeBtn = h('button', { type: 'button', class: 'seg', onclick: function () { state.chime = !state.chime; TT.save('sound', state); paintChime(); } });
    function paintChime() { chimeBtn.textContent = state.chime ? 'Chime When Too Loud: On' : 'Chime When Too Loud: Off'; chimeBtn.classList.toggle('on', state.chime); chimeBtn.setAttribute('aria-pressed', state.chime); }
    el.append(h('div', { class: 'picker sl' }, stage, h('div', { class: 'row center' }, startBtn), msg,
      h('div', { class: 'sl-controls' }, slider('slLimit', 'Loudness Limit', 'limit', paintMarker), slider('slSens', 'Microphone Sensitivity', 'sens'),
        choice('Earn a Star Every', 'every', [[15, '15 Sec'], [30, '30 Sec'], [60, '1 Min']], function () { sinceStar = 0; paintStars(); }),
        choice('Star Goal', 'goal', [[5, '5 Stars'], [10, '10 Stars'], [15, '15 Stars']], function () { if (stars >= state.goal) stars = state.goal - 1; done = false; again.hidden = true; paintStars(); }),
        h('div', { class: 'segmented' }, chimeBtn))));

    function mmss(sec) { sec = Math.floor(sec); return Math.floor(sec / 60) + ':' + (sec % 60 < 10 ? '0' : '') + sec % 60; }
    function paintMarker() { marker.style.left = state.limit + '%'; }
    function paintBars() {
      var on = Math.round(level / 100 * SEGS), lim = state.limit / 100 * SEGS;
      for (var i = 0; i < SEGS; i++) {
        var b = bars.children[i];
        b.className = i < on ? (i >= lim ? 'on red' : i >= lim * 0.7 ? 'on amber' : 'on green') : '';
      }
    }
    function paintStars(pop) {
      if (starRow.children.length !== state.goal) { starRow.textContent = ''; for (var i = 0; i < state.goal; i++) starRow.append(h('i', { text: '★' })); }
      for (var j = 0; j < state.goal; j++) { var st = starRow.children[j]; st.classList.toggle('on', j < stars); st.classList.toggle('pop', !!pop && j === stars - 1); }
      starRow.setAttribute('aria-label', stars + ' of ' + state.goal + ' quiet stars');
      next.style.width = Math.min(100, sinceStar / state.every * 100) + '%';
      streakPill.textContent = 'Quiet Streak ' + mmss(streak) + (state.best >= 1 ? ' · Best Today ' + mmss(state.best) : '');
    }
    function setScene(s) {
      if (cur === s) return;
      cur = s; stage.setAttribute('data-s', s);
      label.textContent = s === 'loud' ? 'Too Loud!' : s === 'quiet' ? 'Shhh… Nice and Quiet' : s === 'ok' ? 'Just Right' : s === 'win' ? 'Star Goal Reached!' : 'Ready When You Are';
    }
    // One step of the meter. target is 0-100.
    // The bars follow the sound quickly. The scene follows a slower, steadier reading and only
    // changes when the room has clearly settled into a new level, so it never flickers.
    function step(target, now) {
      var dt = lastT ? Math.min(0.25, (now - lastT) / 1000) : 0; lastT = now;
      level += (target - level) * (target > level ? 0.35 : 0.08);
      calm += (level - calm) * Math.min(1, dt / 1.6);
      paintBars();
      stage.style.setProperty('--lv', (calm / 100).toFixed(2));
      // Too loud: over the limit for a second to switch on, clearly back under it for two seconds to switch off.
      if (!loud) {
        if (level >= state.limit) { if (!overSince) overSince = now; } else if (level < state.limit * 0.92) overSince = 0;
        if (overSince && now - overSince > 1000) {
          loud = true; loudOff = 0; alerts++; streak = 0; sinceStar = 0;
          if (state.chime && now - lastChime > 6000) { lastChime = now; TT.chime(); }
        }
      } else {
        if (calm < state.limit * 0.85) { if (!loudOff) loudOff = now; } else loudOff = 0;
        if (loudOff && now - loudOff > 2000) { loud = false; overSince = 0; }
      }
      // Quiet and just right use two different lines, so a level sitting near one line stays put.
      if (quietNow) { if (calm > state.limit * 0.6) quietNow = false; } else if (calm < state.limit * 0.4) quietNow = true;
      if (!loud && !done) {
        streak += dt; sinceStar += dt;
        if (streak > state.best) state.best = streak;
        if (sinceStar >= state.every) {
          sinceStar = 0; stars++; TT.tick(); paintStars(true);
          TT.save('sound', state);
          if (stars >= state.goal) { done = true; again.hidden = false; TT.chime(); if (TT.celebrate) TT.celebrate(stage, ['⭐', '🌟', '✨', '🎉']); }
        }
      }
      var s = done ? 'win' : loud ? 'loud' : quietNow ? 'quiet' : 'ok';
      if (s !== want) { want = s; wantSince = now; }
      // Too loud and the win show right away. Other changes wait until the level has held steady.
      var ready = s === 'loud' || s === 'win' || cur === 'idle' || (now - wantSince > 1500 && now - sceneAt > 3500);
      if (s !== cur && ready) { setScene(s); sceneAt = now; }
      paintStars();
      var text = cur === 'win' ? 'Amazing teamwork. You earned all ' + state.goal + ' stars!' :
        cur === 'loud' ? 'The quiet streak starts over. Bring it back down!' :
        'Next star in ' + Math.max(1, Math.ceil(state.every - sinceStar)) + ' sec' + (alerts ? ' · Too loud ' + alerts + (alerts === 1 ? ' time' : ' times') : '');
      if (text !== lastSub) { lastSub = text; sub.textContent = text; }
    }
    function frame() {
      raf = requestAnimationFrame(frame);
      var target;
      if (fake !== null) target = fake;
      else {
        analyser.getFloatTimeDomainData(buf);
        var sum = 0;
        for (var i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        var rms = Math.sqrt(sum / buf.length);
        // Map quiet-to-loud onto 0-100. Sensitivity shifts how easily the meter fills.
        var db = 20 * Math.log10(rms || 1e-6), floor = -62 + (50 - state.sens) * 0.3, top = -8 - (state.sens - 50) * 0.3;
        target = Math.max(0, Math.min(100, (db - floor) / (top - floor) * 100));
      }
      step(target, Date.now());
    }
    function stop() {
      cancelAnimationFrame(raf);
      if (stream && stream.getTracks) stream.getTracks().forEach(function (t) { t.stop(); });
      if (actx) actx.close().catch(function () {});
      stream = actx = analyser = null; level = 0; calm = 0; quietNow = false; loud = false; overSince = 0; loudOff = 0; want = ''; lastT = 0; streak = 0; fake = null; lastSub = ''; paintBars();
      TT.save('sound', state);
      setScene('idle'); stage.style.setProperty('--lv', 0);
      sub.textContent = stars ? 'Paused with ' + stars + (stars === 1 ? ' star' : ' stars') + '. Press Start to keep going.' : 'Press Start and allow the microphone.';
      startBtn.innerHTML = TT.icon('play') + '<span>Start Listening</span>';
      paintStars();
    }
    function begin() { alerts = 0; lastT = 0; startBtn.innerHTML = TT.icon('pause') + '<span>Stop Listening</span>'; frame(); }
    function toggle() {
      if (stream) { stop(); return; }
      msg.hidden = true;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { msg.textContent = 'This browser can’t use the microphone here. Try Chrome or Edge.'; msg.hidden = false; return; }
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }).then(function (st) {
        stream = st;
        actx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = actx.createAnalyser(); analyser.fftSize = 2048;
        buf = new Float32Array(analyser.fftSize);
        actx.createMediaStreamSource(st).connect(analyser);
        begin();
      }).catch(function () {
        msg.textContent = 'The microphone is blocked or missing. Click the lock or camera icon in the address bar, allow the microphone, then press Start again.'; msg.hidden = false;
      });
    }
    paintMarker(); paintChime(); paintBars(); paintStars();
    // For checking the scene without a microphone: TT.soundDemo(40) sets the level, TT.soundDemo(null) stops.
    TT.soundDemo = function (v) {
      if (v === null) { if (stream) stop(); return; }
      fake = v; if (!stream) { stream = {}; begin(); }
    };
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
      if (!list.length) hero.append(h('span', { class: 'eyebrow', text: 'No Schedule Yet' }), h('b', { text: 'Add Your Day' }));
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
    state.mode = state.mode === 'teams' ? 'teams' : state.mode === 'reward' && TT.rewardsTab ? 'reward' : 'jar';
    state.jar = state.jar || { count: 0, goal: 20, reward: 'Extra Recess' };
    if (!Array.isArray(state.teams) || !state.teams.length) state.teams = [{ name: 'Table 1', pts: 0 }, { name: 'Table 2', pts: 0 }, { name: 'Table 3', pts: 0 }, { name: 'Table 4', pts: 0 }];
    var tabs = h('div', { class: 'segmented', role: 'group', 'aria-label': 'How to keep points' }, [['jar', 'Class Jar'], ['teams', 'Team Points']].concat(TT.rewardsTab ? [['reward', 'Pick a Reward']] : []).map(function (t) {
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
      function add(n) { var was = j.count >= goal; j.count = Math.max(0, Math.min(goal, j.count + n)); save(); if (n > 0) TT.tick(); var won = !was && j.count >= goal; if (won) TT.chime(); paint(); if (won && TT.celebrate) TT.celebrate(box); }
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
      if (state.mode === 'reward') TT.rewardsTab(box, state, save, function () { state.mode = 'jar'; save(); paint(); });
      else (state.mode === 'jar' ? jar : teams)();
    }
    paint();
  };
})();
