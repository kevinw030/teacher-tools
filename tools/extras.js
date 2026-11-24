// Settings, Morning Meeting and Brain Breaks.
(function () {
  var TT = window.TT, h = TT.h;

  // ---------- Settings ----------
  TT.mountSettings = function (el, opts) {
    var s = TT.settings;
    function seg(options, key, after) {
      var wrap = h('div', { class: 'segmented', role: 'group' });
      options.forEach(function (o) {
        wrap.append(h('button', { type: 'button', class: 'seg', 'data-v': String(o[0]), onclick: function () { s[key] = o[0]; TT.saveSettings(); paint(); if (after) after(); } }, o[1]));
      });
      function paint() { wrap.querySelectorAll('.seg').forEach(function (b) { var on = b.getAttribute('data-v') === String(s[key]); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
      paint();
      return wrap;
    }
    var classInput = h('input', { type: 'text', id: 'setClass', maxlength: 30, placeholder: 'Like Room 12 or 4th Grade Stars', 'aria-label': 'What you call your class' });
    classInput.value = s.className || '';
    classInput.addEventListener('input', function () { s.className = classInput.value.trim(); TT.saveSettings(); });
    function zonePick() {
      var sel = h('select', { id: 'setZone', class: 'set-select', 'aria-label': 'Time zone' });
      (TT.TIME_ZONES || [['auto', 'Match This Computer']]).forEach(function (o) {
        var opt = h('option', { value: o[0], text: o[1] }); if ((s.tz || 'auto') === o[0]) opt.selected = true; sel.append(opt);
      });
      sel.addEventListener('change', function () { s.tz = sel.value; TT.saveSettings(); if (TT.paintWelcome) TT.paintWelcome(); });
      return sel;
    }
    function seasonPick() {
      var sel = h('select', { id: 'setSeason', class: 'set-select', 'aria-label': 'Seasonal theme' });
      [['auto', 'Follow the Calendar'], ['off', 'Off']].concat((TT.SEASONS || []).map(function (x) { return [x.id, x.name]; })).forEach(function (o) {
        var opt = h('option', { value: o[0], text: o[1] }); if ((s.season || 'auto') === o[0]) opt.selected = true; sel.append(opt);
      });
      sel.addEventListener('change', function () { s.season = sel.value; TT.saveSettings(); if (TT.applySeason) TT.applySeason(); if (TT.paintWelcome) TT.paintWelcome(); });
      return sel;
    }
    var ICO = {
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
      class: '<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11.5V16c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.5"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      theme: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/>',
      season: '<path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5l-15.6 11"/><path d="M9.5 3.5 12 6l2.5-2.5M9.5 20.5 12 18l2.5 2.5"/>',
      sound: '<path d="M4 9.5v5h4l5 4.5V5L8 9.5z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
      pencil: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
      save: '<path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M4 19h16"/>'
    };
    function row(title, desc, control, icon, color) {
      return h('div', { class: 'set-row' },
        h('span', { class: 'set-ico c-' + color, 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICO[icon] + '</svg>' }),
        h('div', { class: 'set-text' }, h('h3', { text: title }), h('p', { class: 'muted', text: desc })), h('div', { class: 'set-control' }, control));
    }
    function group(title, rows) {
      return h('section', { class: 'set-group' }, h('h2', { class: 'set-group-h', text: title }), h('div', { class: 'set-card' }, rows));
    }
    var acct = TT.account && TT.account.enabled && !(opts && opts.inAccount)
      ? row('My Account', TT.account.signedIn() ? 'Signed in as ' + TT.account.email() + '. Everything saves to your account.' : 'Sign in to save everything to your account and use it on any computer.',
          h('a', { class: 'btn', href: '/account' }, TT.account.signedIn() ? 'Open My Account' : 'Sign In'), 'user', 'cobalt')
      : null;
    el.append(h('div', { class: 'settings set2' },
      group('My Class', [
        acct,
        row('Class Name', 'Shown on the Morning Meeting screen, like “Good Morning, Room 12!”', classInput, 'class', 'coral'),
        row('Time Zone', 'Sets the greeting and the view out of the classroom window on the home page.', zonePick(), 'clock', 'sky')]),
      group('Look and Sound', [
        row('Theme', 'Light, dark, or match this computer.', seg([['auto', 'Match Computer'], ['light', 'Light'], ['dark', 'Dark']], 'theme', TT.applyTheme), 'theme', 'violet'),
        row('Seasonal Theme', 'Holiday touches on the home page, board backgrounds and games.', seasonPick(), 'season', 'emerald'),
        row('Sounds', 'Chimes, ticks and spinner sounds.', seg([[true, 'On'], [false, 'Off']], 'sound', function () { if (s.sound) TT.chime(); }), 'sound', 'amber')]),
      group('My Things', [
        row('My Questions', 'Write your own Would You Rather questions, trivia and escape rooms.', TT.button('Open My Questions', { icon: 'edit', onclick: function () { TT.custom.open('wyr'); } }), 'pencil', 'rose'),
        row('Backup', 'Save everything to a file, or load it on another computer.', TT.backupControls(), 'save', 'cobalt')])));
  };

  // ---------- Morning Meeting ----------
  var WEATHER = [['sunny', '☀️', 'Sunny'], ['partly', '⛅', 'Partly Cloudy'], ['cloudy', '☁️', 'Cloudy'], ['rainy', '🌧️', 'Rainy'], ['stormy', '⛈️', 'Stormy'], ['snowy', '❄️', 'Snowy'], ['windy', '💨', 'Windy'], ['foggy', '🌫️', 'Foggy']];
  TT.mountMorning = function (el) {
    var state = TT.load('morning', { message: 'Welcome! Unpack, turn in your homework and start your morning work.', weather: {}, temp: {} });
    var greet = h('h1', { class: 'mm-greeting' });
    var dateEl = h('p', { class: 'mm-date' });
    var msg = h('textarea', { class: 'mm-message', id: 'mmMessage', rows: 3, 'aria-label': 'Message for the class', placeholder: 'Type a message for the class' });
    msg.value = state.message || '';
    msg.addEventListener('input', function () { state.message = msg.value; TT.save('morning', state); });
    var wxBig = h('div', { class: 'mm-wx-big' });
    var wxPick = h('div', { class: 'mm-wx-pick', role: 'group', 'aria-label': 'Today’s weather' });
    var temp = h('input', { type: 'text', id: 'mmTemp', class: 'mm-temp', inputmode: 'numeric', maxlength: 4, placeholder: '—', 'aria-label': 'Temperature' });
    temp.addEventListener('input', function () { state.temp = { day: TT.today(), v: temp.value.replace(/[^0-9\-]/g, '') }; TT.save('morning', state); });
    WEATHER.forEach(function (w) {
      wxPick.append(h('button', { type: 'button', class: 'mm-wx', 'data-w': w[0], title: w[2], 'aria-label': w[2], onclick: function () { state.weather = { day: TT.today(), v: w[0] }; TT.save('morning', state); paint(); } }, w[1]));
    });
    var wyrBox = h('div', { class: 'w-body mm-wyr' });
    var petBox = h('div', { class: 'mm-pet' });
    el.append(h('div', { class: 'mm' },
      h('section', { class: 'mm-hero' }, h('div', { class: 'mm-hello' }, greet, dateEl, msg)),
      h('section', { class: 'mm-card mm-weather' }, h('h3', { text: 'Today’s Weather' }), wxBig,
        h('div', { class: 'mm-temp-row' }, temp, h('span', { text: '°' })), wxPick),
      h('section', { class: 'mm-card' }, h('h3', { text: 'Our Class Pet' }), petBox),
      h('section', { class: 'mm-card mm-wide' }, h('h3', { text: 'Would You Rather…' }), wyrBox)));
    TT.mountWYR(wyrBox, { compact: true });
    var pet = TT.mountPetMini(petBox);

    function paint() {
      var d = new Date(), hr = d.getHours();
      var who = TT.settings.className || 'Class';
      greet.textContent = (hr < 5 ? 'Hello, ' : hr < 12 ? 'Good Morning, ' : hr < 17 ? 'Good Afternoon, ' : 'Good Evening, ') + who + '!';
      dateEl.textContent = 'Today is ' + d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      var cur = state.weather && state.weather.day === TT.today() ? state.weather.v : null;
      var w = WEATHER.filter(function (x) { return x[0] === cur; })[0];
      wxBig.textContent = '';
      wxBig.append(h('span', { class: 'mm-wx-emoji', text: w ? w[1] : '🌤️' }), h('b', { text: w ? w[2] : 'What’s the weather today?' }));
      wxBig.classList.toggle('unset', !w);
      wxPick.querySelectorAll('.mm-wx').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-w') === cur); });
      if (document.activeElement !== temp) temp.value = state.temp && state.temp.day === TT.today() ? state.temp.v : '';
    }
    paint();
    if (TT.applySeason) TT.applySeason();
    return { show: function () { paint(); pet.refresh(); } };
  };

  // ---------- Brain Breaks ----------
  // [activity, seconds]
  var BREAKS = [
    ['Do 20 jumping jacks', 60], ['Stretch up tall like a giraffe, then touch your toes. Repeat slowly.', 60], ['Freeze dance! Dance until the timer stops, then freeze.', 90],
    ['Run in place as fast as you can', 45], ['Balance on one foot, then switch. Can you close your eyes?', 60], ['Take 5 slow belly breaths. In through your nose, out through your mouth.', 60],
    ['Do 10 arm circles forward and 10 backward', 45], ['Hop like a frog around your desk', 45], ['Silent disco: dance in your spot with no sound at all', 90],
    ['Wall push-ups or desk push-ups. How many can you do?', 60], ['Stand up, sit down, 10 times. Go!', 45], ['Pretend to climb a ladder to the clouds', 60],
    ['Mirror your partner: one moves slowly, the other copies', 90], ['Shake it out: shake your hands, arms, legs and whole body', 45], ['Do the robot dance', 60],
    ['Tiptoe around the room without making a sound', 60], ['Draw your name in the air with your elbow, then your foot', 60], ['Squat like you are sitting in an invisible chair. Hold it!', 45],
    ['Slow-motion race: move across your space as slowly as you can', 90], ['Cross-crawl: touch your right elbow to your left knee, then switch', 60], ['Pretend you are a tree in the wind. Sway and stretch.', 60],
    ['Rock, paper, scissors with a neighbor. Best of five!', 90], ['March in place and count by fives to 100', 60], ['Star jumps: jump and make a star shape with your body', 45],
    ['Shoulder rolls and neck stretches. Nice and slow.', 60], ['Pretend to jump rope', 60], ['Stand up and name 5 things you can see, 4 you can hear, 3 you can touch', 90],
    ['Sky reaches: reach high with one hand, then the other, like picking apples', 45], ['Animal walk: choose bear, crab or penguin and walk to the door and back', 90], ['Close your eyes and listen. How many sounds can you count?', 60]
  ];
  TT.BREAKS = BREAKS; // also used by the stage version in tools/breaks2.js
  TT.mountBreaks = function (el) {
    var state = TT.load('breaks', { seen: [] });
    var cur = null, left = 0, total = 0, iv = 0, running = false, spinning = false;
    // The reel is a fixed-size window. Activities slide through it, so the page never changes size while it spins.
    var item = h('div', { class: 'bb-item' }, 'Ready for a Brain Break?');
    var actEl = h('div', { class: 'pick-name bb-activity bb-reel', 'aria-live': 'polite' }, item);
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function slide(text, ms, last) {
      var old = item, next = h('div', { class: 'bb-item' }, text);
      if (!last) next.setAttribute('aria-hidden', 'true');
      actEl.append(next); item = next;
      if (still || !next.animate) { old.remove(); return; }
      var ease = last ? 'cubic-bezier(.2, 1.5, .4, 1)' : 'linear';
      old.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-85%)', opacity: 0 }], { duration: ms, easing: last ? 'ease-out' : 'linear', fill: 'forwards' }).onfinish = function () { old.remove(); };
      next.animate([{ transform: 'translateY(85%)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: last ? ms * 1.5 : ms, easing: ease });
    }
    var subEl = h('div', { class: 'pick-sub' });
    var bar = h('span');
    var stage = h('div', { class: 'pick-stage bb-stage' }, actEl, subEl, h('span', { class: 'track bb-track' }, bar));
    var spinBtn = TT.button('Spin for a Break', { icon: 'sparkle', kind: 'primary big', onclick: spin });
    var goBtn = TT.button('Start Timer', { icon: 'play', kind: 'big', onclick: toggle });
    el.append(h('div', { class: 'picker' }, stage, h('div', { class: 'row center' }, spinBtn, goBtn)));

    function fmt(s) { return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; }
    function paint() {
      goBtn.disabled = !cur || spinning;
      goBtn.innerHTML = TT.icon(running ? 'pause' : 'play') + '<span>' + (running ? 'Pause' : left < total && left > 0 ? 'Resume' : 'Start Timer') + '</span>';
      if (spinning) subEl.textContent = 'Picking a break…';
      else if (cur) subEl.textContent = left <= 0 ? 'Time’s up! Great job. Back to your seats.' : fmt(left) + (running ? ' left' : ' · press Start Timer when everyone is ready');
      else subEl.textContent = BREAKS.length + ' quick movement breaks, 1 to 2 minutes each';
      bar.style.width = cur && total ? (100 - left / total * 100) + '%' : '0%';
    }
    function spin() {
      if (spinning) return;
      clearInterval(iv); running = false; spinning = true;
      var pool = BREAKS.map(function (_, i) { return i; }).filter(function (i) { return state.seen.indexOf(i) < 0; });
      if (!pool.length) { state.seen = []; pool = BREAKS.map(function (_, i) { return i; }); }
      var win = pool[Math.floor(Math.random() * pool.length)];
      state.seen.push(win); TT.save('breaks', state);
      stage.classList.remove('reveal'); stage.classList.add('spinning');
      // Starts quick and eases down to a stop over about three seconds.
      var steps = still ? 0 : 11, i = 0, lastPick = -1;
      (function step() {
        if (i >= steps) {
          cur = BREAKS[win]; total = left = cur[1];
          slide(cur[0], 520, true); TT.tick();
          setTimeout(function () { stage.classList.remove('spinning'); void stage.offsetWidth; stage.classList.add('reveal'); spinning = false; paint(); }, still ? 0 : 420);
          return;
        }
        var r; do { r = Math.floor(Math.random() * BREAKS.length); } while (r === lastPick || r === win);
        lastPick = r;
        var ms = 130 + i * i * 3.4;
        slide(BREAKS[r][0], ms, false); TT.tick(); i++;
        setTimeout(step, ms);
      })();
      paint();
    }
    function toggle() {
      if (!cur) return;
      if (running) { running = false; clearInterval(iv); paint(); return; }
      if (left <= 0) left = total;
      running = true;
      iv = setInterval(function () {
        left--;
        if (left <= 0) { left = 0; running = false; clearInterval(iv); TT.chime(); }
        paint();
      }, 1000);
      paint();
    }
    paint();
  };
})();
