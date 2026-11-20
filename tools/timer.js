// Timer: a big countdown with a progress ring, quick presets and a chime at zero.
(function () {
  var TT = window.TT, h = TT.h;

  TT.mountTimer = function (el, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var saved = opts.state || {};
    var total = saved.total || 300;      // seconds
    var remaining = total;
    var endAt = 0, running = false, raf = 0, done = false;
    var soundOn = saved.sound !== false;

    var R = 52, C = 2 * Math.PI * R;
    var ring = h('div', { class: 'timer-ring' });
    ring.innerHTML =
      '<svg viewBox="0 0 120 120" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="' + R + '" class="ring-bg"/>' +
      '<circle cx="60" cy="60" r="' + R + '" class="ring-fg" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg>';
    var digits = h('div', { class: 'timer-digits', role: 'timer', 'aria-live': 'off' });
    var status = h('div', { class: 'timer-status' });
    ring.append(h('div', { class: 'timer-center' }, digits, status));
    var fg = ring.querySelector('.ring-fg');

    var startBtn = TT.button('Start', { icon: 'play', kind: 'primary big', onclick: toggle });
    var resetBtn = TT.button(compact ? '' : 'Reset', { icon: 'reset', kind: 'big', aria: 'Reset timer', onclick: reset });
    var soundBtn = TT.button('', { icon: soundOn ? 'volume' : 'mute', kind: 'big icon-only', aria: 'Sound on or off', onclick: function () {
      soundOn = !soundOn; soundBtn.innerHTML = TT.icon(soundOn ? 'volume' : 'mute'); persist();
    } });

    var minus = TT.button('', { icon: 'minus', kind: 'icon-only', aria: 'One minute less', onclick: function () { adjust(-60); } });
    var plus = TT.button('', { icon: 'plus', kind: 'icon-only', aria: 'One minute more', onclick: function () { adjust(60); } });

    var presets = h('div', { class: 'presets' });
    (compact ? [1, 3, 5, 10] : [1, 2, 3, 5, 10, 15, 20, 30]).forEach(function (m) {
      presets.append(h('button', { type: 'button', class: 'preset', onclick: function () { set(m * 60); } }, m + (compact ? 'm' : ' min')));
    });

    var root = h('div', { class: 'timer' + (compact ? ' compact' : '') },
      h('div', { class: 'timer-dial' }, compact ? null : minus, ring, compact ? null : plus),
      presets,
      h('div', { class: 'row center' }, startBtn, resetBtn, compact ? null : soundBtn)
    );
    el.append(root);

    function fmt(s) {
      s = Math.max(0, Math.ceil(s));
      var hrs = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      var mm = hrs ? (m < 10 ? '0' + m : m) : m;
      return (hrs ? hrs + ':' : '') + mm + ':' + (sec < 10 ? '0' + sec : sec);
    }
    function paint() {
      digits.textContent = done ? '0:00' : fmt(remaining);
      fg.setAttribute('stroke-dashoffset', String(C * (1 - (total ? remaining / total : 0))));
      root.classList.toggle('running', running);
      root.classList.toggle('done', done);
      root.classList.toggle('warning', running && remaining <= 10 && remaining > 0);
      status.textContent = done ? 'Time’s up!' : running ? 'Counting Down' : (remaining < total ? 'Paused' : 'Ready');
      startBtn.innerHTML = TT.icon(running ? 'pause' : 'play') + '<span>' + (running ? 'Pause' : (remaining < total && !done ? 'Resume' : 'Start')) + '</span>';
    }
    function loop() {
      remaining = (endAt - Date.now()) / 1000;
      if (remaining <= 0) {
        remaining = 0; running = false; done = true; paint();
        if (soundOn) { TT.chime(); setTimeout(TT.chime, 1400); }
        return;
      }
      paint();
      raf = requestAnimationFrame(loop);
    }
    function toggle() {
      if (done) reset();
      if (running) { running = false; cancelAnimationFrame(raf); remaining = (endAt - Date.now()) / 1000; paint(); return; }
      if (remaining <= 0) return;
      if (soundOn) TT.tick();
      running = true; endAt = Date.now() + remaining * 1000; loop();
    }
    function reset() { running = false; done = false; cancelAnimationFrame(raf); remaining = total; paint(); }
    function set(s) { total = Math.max(5, Math.min(s, 5 * 3600)); reset(); persist(); }
    function adjust(d) {
      if (running) { endAt += d * 1000; total = Math.max(total + d, 5); remaining = (endAt - Date.now()) / 1000; if (remaining < 1) { endAt = Date.now() + 1000; } paint(); }
      else set(remaining + d > 0 ? Math.round(remaining) + d : 60);
      persist();
    }
    function persist() { if (opts.onChange) opts.onChange({ total: total, sound: soundOn }); }
    paint();

    return { destroy: function () { cancelAnimationFrame(raf); } };
  };
})();
