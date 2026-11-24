// Timer, the fun version (Kevin, 2026-11-24): the same timer (tools/timer.js) on a bright stage with the mascot,
// plus a choice of looks kids enjoy watching: the Classic Ring, a Rocket flying to the moon, and a Juice Jar
// that drains. The look is saved in tt:timer-look. The small board widget still uses the plain timer.
// Styles: `.tm2-*` in assets/arcade.css.
(function () {
  var TT = window.TT, h = TT.h, old = TT.mountTimer;
  if (!TT.arcade || !old) return;
  var LOOKS = [['ring', 'Classic Ring'], ['rocket', 'Rocket'], ['jar', 'Juice Jar']];
  var ROCKET = '<svg viewBox="0 0 64 64" aria-hidden="true"><path class="tm2-flame" d="M26 46c-2 6 2 12 6 16 4-4 8-10 6-16z" fill="#FFB02E" stroke="#1B1740" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<path d="M32 3c10 8 14 20 12 34H20C18 23 22 11 32 3z" fill="#fff" stroke="#1B1740" stroke-width="3" stroke-linejoin="round"/><path d="M32 3c5 4 8.500 9 10.500 15h-21C23.500 12 27 7 32 3z" fill="#FF5E6C" stroke="#1B1740" stroke-width="3" stroke-linejoin="round"/>' +
    '<circle cx="32" cy="27" r="6" fill="#7CD4FF" stroke="#1B1740" stroke-width="3"/><path d="M20 33l-9 10 10 1zM44 33l9 10-10 1z" fill="#FF5E6C" stroke="#1B1740" stroke-width="3" stroke-linejoin="round"/><path d="M24 41h16v5H24z" fill="#C9C6E8" stroke="#1B1740" stroke-width="3" stroke-linejoin="round"/></svg>';

  TT.mountTimer = function (el, opts) {
    opts = opts || {};
    if (opts.compact) return old(el, opts);
    var look = TT.load('timer-look', 'ring'); if (!LOOKS.some(function (l) { return l[0] === look; })) look = 'ring';
    var A = TT.arcade({ theme: 'timer' });
    var rocket = h('div', { class: 'tm2-rocket', html: ROCKET });
    var sky = h('div', { class: 'tm2-scene tm2-sky', 'aria-hidden': 'true' },
      h('i', { class: 's1' }), h('i', { class: 's2' }), h('i', { class: 's3' }), h('i', { class: 's4' }), h('i', { class: 's5' }), h('i', { class: 's6' }),
      h('span', { class: 'tm2-earth' }), h('span', { class: 'tm2-moon' }), h('span', { class: 'tm2-path' }), rocket);
    var juice = h('span', { class: 'tm2-juice' }, h('span', { class: 'tm2-wave' }));
    var jar = h('div', { class: 'tm2-scene tm2-jarbox', 'aria-hidden': 'true' }, h('span', { class: 'tm2-lid' }), h('span', { class: 'tm2-jar' }, juice, h('span', { class: 'tm2-shine' })));
    var inner = h('div', { class: 'tm2-timer' });
    var box = h('div', { class: 'tm2' }, sky, jar, inner);
    var picker = h('div', { class: 'segmented', role: 'group', 'aria-label': 'Timer look' });
    A.play.append(box);
    el.append(h('div', { class: 'game ar' }, A.el, h('div', { class: 'row center ar-controls' }, h('span', { class: 'ff-label', text: 'Look' }), picker)));

    var last = { running: false, done: false, half: false, low: false, total: 0 };
    function onPaint(t) {
      var p = t.total ? 1 - t.remaining / t.total : 0; if (t.done) p = 1;
      // Rocket: flies from the Earth (bottom left) up an arc to the Moon (top right).
      rocket.style.left = (9 + p * 70) + '%'; rocket.style.bottom = (10 + Math.sin(p * Math.PI / 2) * 56) + '%';
      rocket.style.rotate = (58 - p * 30) + 'deg';
      juice.style.height = Math.max(0, (1 - p) * 100) + '%';
      box.classList.toggle('run', t.running); box.classList.toggle('done', t.done); box.classList.toggle('low', !t.done && t.remaining <= 10 && t.running);
      A.status.textContent = t.done ? 'Time’s Up!' : t.running ? (t.remaining <= 10 ? 'Almost Done!' : 'Counting Down') : t.remaining < t.total ? 'Paused' : 'Ready When You Are';
      A.status.classList.toggle('win', t.done);
      if (t.running && !last.running) { A.say(look === 'rocket' ? 'Blast off!' : 'Here we go!', 'cheer', 2200); last.half = false; last.low = false; }
      if (!t.running && last.running && !t.done) A.say('Paused.', 'idle');
      if (t.running && !last.half && t.total >= 40 && t.remaining <= t.total / 2) { last.half = true; A.say('Halfway there!', 'point', 2400); }
      if (t.running && !last.low && t.total > 15 && t.remaining <= 10) { last.low = true; A.say('Ten seconds!', 'think', 2400); }
      if (t.done && !last.done) { A.say(look === 'rocket' ? 'We made it to the moon!' : 'Time’s up!', 'party', 4200); if (TT.celebrate) TT.celebrate(A.el); }
      if (!t.running && !t.done && t.total !== last.total && last.total) A.say('Set for ' + (t.total >= 60 ? Math.round(t.total / 60 * 10) / 10 + ' min' : t.total + ' seconds') + '.', 'wave', 1800);
      last.running = t.running; last.done = t.done; last.total = t.total;
      if (opts.onPaint) opts.onPaint(t);
    }
    function paintLook() {
      box.setAttribute('data-look', look);
      picker.textContent = '';
      LOOKS.forEach(function (l) {
        picker.append(h('button', { type: 'button', class: 'seg' + (l[0] === look ? ' on' : ''), 'aria-pressed': l[0] === look ? 'true' : 'false', onclick: function () { look = l[0]; TT.save('timer-look', look); paintLook(); } }, l[1]));
      });
    }
    paintLook();
    var o = {}; Object.keys(opts).forEach(function (k) { o[k] = opts[k]; }); o.onPaint = onPaint;
    var handle = old(inner, o);
    A.say('Pick a time and press Start.', 'wave', 2400);
    return handle;
  };
})();
