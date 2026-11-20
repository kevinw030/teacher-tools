// Settings, Morning Meeting and Brain Breaks.
(function () {
  var TT = window.TT, h = TT.h;

  // ---------- Settings ----------
  TT.mountSettings = function (el) {
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
    var nameInput = h('input', { type: 'text', id: 'setName', maxlength: 30, placeholder: 'Like Mr. Watts', 'aria-label': 'Your name' });
    nameInput.value = s.name || '';
    nameInput.addEventListener('input', function () { s.name = nameInput.value.trim(); TT.saveSettings(); });
    var classInput = h('input', { type: 'text', id: 'setClass', maxlength: 30, placeholder: 'Like Room 12 or 4th Grade Stars', 'aria-label': 'What you call your class' });
    classInput.value = s.className || '';
    classInput.addEventListener('input', function () { s.className = classInput.value.trim(); TT.saveSettings(); });
    function row(title, desc, control) {
      return h('div', { class: 'set-row' }, h('div', null, h('h3', { text: title }), h('p', { class: 'muted', text: desc })), h('div', { class: 'set-control' }, control));
    }
    el.append(h('div', { class: 'settings' },
      row('Your Name', 'Shown in the greeting on the home page.', nameInput),
      row('Class Name', 'Shown on the Morning Meeting screen, like “Good morning, Room 12!”', classInput),
      row('Theme', 'Light, dark, or match this computer.', seg([['auto', 'Match Computer'], ['light', 'Light'], ['dark', 'Dark']], 'theme', TT.applyTheme)),
      row('Sounds', 'Chimes, ticks and spinner sounds.', seg([[true, 'On'], [false, 'Off']], 'sound', function () { if (s.sound) TT.chime(); })),
      row('Backup', 'Save everything to a file, or load it on another computer.', TT.backupControls())));
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
      var who = TT.settings.className || 'class';
      greet.textContent = (hr < 12 ? 'Good morning, ' : hr < 17 ? 'Good afternoon, ' : 'Good evening, ') + who + '!';
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
  TT.mountBreaks = function (el) {
    var state = TT.load('breaks', { seen: [] });
    var cur = null, left = 0, total = 0, iv = 0, running = false, spinning = false;
    var actEl = h('div', { class: 'pick-name bb-activity', 'aria-live': 'polite' }, 'Ready for a brain break?');
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
      if (cur) subEl.textContent = left <= 0 ? 'Time’s up! Great job. Back to your seats.' : fmt(left) + (running ? ' left' : ' · press Start Timer when everyone is ready');
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
      var i = 0;
      (function step() {
        actEl.textContent = BREAKS[Math.floor(Math.random() * BREAKS.length)][0];
        TT.tick(); i++;
        if (i < 14) { setTimeout(step, 50 + i * i * 0.9); return; }
        cur = BREAKS[win]; actEl.textContent = cur[0]; total = left = cur[1];
        stage.classList.remove('spinning'); void stage.offsetWidth; stage.classList.add('reveal');
        spinning = false; paint();
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
