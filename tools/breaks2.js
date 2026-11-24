// Brain Breaks, the energetic version (Kevin, 2026-11-24): a bright stage, a big activity card that takes its
// color and badge from the kind of break (move, stretch, dance, calm, partner), a countdown ring, and the
// mascot cheering while the timer runs. Replaces the page from tools/extras.js (same saved data, tt:breaks).
// Styles: `.bb2-*` in assets/arcade.css.
(function () {
  var TT = window.TT, h = TT.h;
  if (!TT.arcade || !TT.BREAKS) return;
  var BREAKS = TT.BREAKS;
  function any(a) { return a[Math.floor(Math.random() * a.length)]; }
  function svg(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  // Kinds of break, matched from the words in the activity. First match wins.
  var KINDS = [
    { id: 'partner', label: 'With a Partner', color: '#F43F7F', re: /partner|neighbor/i, icon: svg('<circle cx="8" cy="7" r="3"/><circle cx="17" cy="8" r="2.500"/><path d="M2.500 20a5.500 5.500 0 0 1 11 0M14.500 20a4.500 4.500 0 0 1 7-3.700"/>') },
    { id: 'calm', label: 'Calm and Quiet', color: '#0EA5E9', re: /breath|listen|close your eyes|silent|tiptoe|slow-motion|name 5/i, icon: svg('<path d="M12 21c-4-2-7-5.500-7-10a7 7 0 0 1 7 4 7 7 0 0 1 7-4c0 4.500-3 8-7 10z"/><path d="M12 15V4M9.500 6.500 12 4l2.500 2.500"/>') },
    { id: 'dance', label: 'Dance Party', color: '#8B5CF6', re: /dance|disco|robot|shake/i, icon: svg('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>') },
    { id: 'stretch', label: 'Stretch It Out', color: '#12B886', re: /stretch|reach|balance|roll|tree|sway|squat|arm circle|ladder|draw your name/i, icon: svg('<circle cx="12" cy="4.500" r="2"/><path d="M4 7l8 2 8-2M12 9v6M12 15l-4 6M12 15l4 6"/>') },
    { id: 'move', label: 'Get Moving', color: '#FF7A1A', re: /./, icon: svg('<path d="M13 2 4.500 13.500H11L10 22l8.500-11.500H12z"/>') }
  ];
  function kindOf(text) { return KINDS.filter(function (k) { return k.re.test(text); })[0]; }
  function fmt(s) { return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; }

  TT.mountBreaks = function (el) {
    var state = TT.load('breaks', { seen: [] }) || { seen: [] };
    if (!Array.isArray(state.seen)) state.seen = [];
    var cur = null, left = 0, total = 0, iv = 0, running = false, spinning = false, timer = 0;
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var A = TT.arcade({ theme: 'break' });
    var badge = h('span', { class: 'bb2-badge' }), text = h('div', { class: 'bb2-text', 'aria-live': 'polite', text: 'Ready for a Brain Break?' });
    var card = h('div', { class: 'bb2-card' }, badge, text);
    var num = h('b', { class: 'bb2-num', text: '0:00' }), cap = h('span', { class: 'bb2-cap', text: 'Spin First' });
    var ring = h('div', { class: 'bb2-ring' }, h('div', { class: 'bb2-ring-in' }, num, cap));
    var spinBtn = TT.button('Spin for a Break', { icon: 'sparkle', kind: 'primary big bb2-spin', onclick: spin });
    var goBtn = TT.button('Start Timer', { icon: 'play', kind: 'big bb2-go', onclick: toggle });
    var moreBtn = TT.button('+15 Seconds', { kind: 'small', onclick: function () { if (!cur) return; left += 15; total = Math.max(total, left); card.classList.remove('done'); paint(); } });
    A.play.append(h('div', { class: 'bb2' }, card, ring, h('div', { class: 'row center bb2-btns' }, spinBtn, goBtn, moreBtn)));
    el.append(h('div', { class: 'game ar' }, A.el));

    function setKind(k) {
      card.style.setProperty('--c', k ? k.color : '#FF7A1A'); ring.style.setProperty('--c', k ? k.color : '#FF7A1A');
      badge.innerHTML = k ? k.icon : ''; badge.append(h('span', { text: k ? k.label : 'Brain Break' }));
    }
    function paint() {
      goBtn.disabled = !cur || spinning || left <= 0; moreBtn.hidden = !cur || spinning; spinBtn.disabled = spinning;
      goBtn.innerHTML = TT.icon(running ? 'pause' : 'play') + '<span>' + (running ? 'Pause' : left < total && left > 0 ? 'Resume' : 'Start Timer') + '</span>';
      num.textContent = cur ? fmt(Math.max(0, left)) : '0:00';
      cap.textContent = spinning ? 'Picking…' : !cur ? 'Spin First' : left <= 0 ? 'Time’s Up!' : running ? 'Keep Going!' : 'Ready?';
      ring.style.setProperty('--p', cur && total ? Math.max(0, left) / total : 0);
      ring.classList.toggle('run', running); ring.classList.toggle('low', running && left <= 10);
      A.status.textContent = spinning ? 'Picking a Break…' : !cur ? BREAKS.length + ' Quick Movement Breaks' : left <= 0 ? 'Great Job! Back to Your Seats.' : running ? 'Go, Go, Go!' : 'Press Start When Everyone Is Ready';
      A.status.classList.toggle('win', !!cur && left <= 0 && !spinning);
    }
    function spin() {
      if (spinning) return;
      clearInterval(iv); running = false; spinning = true;
      var pool = BREAKS.map(function (_, i) { return i; }).filter(function (i) { return state.seen.indexOf(i) < 0; });
      if (!pool.length) { state.seen = []; pool = BREAKS.map(function (_, i) { return i; }); }
      var win = pool[Math.floor(Math.random() * pool.length)];
      state.seen.push(win); TT.save('breaks', state);
      card.classList.remove('reveal', 'done'); card.classList.add('spinning');
      A.say(any(['What will it be?', 'Spinning…', 'Get ready to move!']), 'think', 3600);
      paint();
      // Flips through a few breaks, quick at first and slowing to a stop over about three seconds.
      var steps = still ? 0 : 10, i = 0, lastPick = -1;
      (function step() {
        if (i >= steps) {
          cur = BREAKS[win]; total = left = cur[1];
          text.textContent = cur[0]; setKind(kindOf(cur[0])); TT.tick();
          card.classList.remove('spinning'); void card.offsetWidth; card.classList.add('reveal');
          spinning = false; paint();
          A.say(any(['Stand up, everyone!', 'This one is fun!', 'Let’s do it!']), 'point', 2600);
          return;
        }
        var n, tries = 0;
        do { n = Math.floor(Math.random() * BREAKS.length); } while (n === lastPick && ++tries < 8);
        lastPick = n; text.textContent = BREAKS[n][0]; setKind(kindOf(BREAKS[n][0])); TT.tick();
        i++; timer = setTimeout(step, 120 + i * i * 3.6);
      })();
    }
    function toggle() {
      if (!cur || spinning || left <= 0) return;
      if (running) { clearInterval(iv); running = false; paint(); A.say('Paused.', 'idle'); return; }
      running = true; A.say(any(['Go, go, go!', 'You’ve got this!', 'Move it!']), 'party', 2600);
      iv = setInterval(function () {
        left--;
        if (left <= 0) {
          left = 0; clearInterval(iv); running = false; card.classList.add('done');
          A.say('Time’s up! Great job!', 'party', 4200); TT.chime(); if (TT.celebrate && !still) TT.celebrate(A.el);
        } else {
          if (left <= 5) TT.tick();
          if (left % 12 === 0) A.say(any(['Keep going!', 'Looking good!', 'Almost there!', 'Nice moves!']), 'cheer', 2400);
        }
        paint();
      }, 1000);
      paint();
    }
    setKind(null); paint();
    A.say('Time to wiggle?', 'wave', 2200);
    return { destroy: function () { clearInterval(iv); clearTimeout(timer); } };
  };
})();
