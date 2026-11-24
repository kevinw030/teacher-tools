// One shared set of sounds and win moments for the whole site (Kevin, 2026-11-24).
// Every page already calls TT.chime(), TT.tick() and TT.celebrate(el); this file replaces those three with
// nicer versions, so every tool and game sounds and celebrates the same way:
//   TT.chime()              a warm three-note bell (timers, picks, reveals)
//   TT.tick()               a soft pop (taps, counts)
//   TT.celebrate(el, emoji) a win: fanfare, paper confetti inside el, and the mascot popping up to cheer
//   TT.fx.sound(name)       'win' | 'good' | 'bad' | 'pop' | 'tap' | 'whoosh' | 'coin' | 'chime'
//   TT.fx.win(el)           the same as TT.celebrate, for wins that had no celebration before
// Everything follows Settings > Sounds and the "reduce motion" setting. Styles in assets/polish.css.
(function () {
  var TT = window.TT; if (!TT) return;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = null, out = null;

  function ready() {
    if (TT.settings && TT.settings.sound === false) return false;
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        // A gentle limiter plus a short echo, so notes sound round instead of beepy.
        var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
        out = ctx.createGain(); out.gain.value = 0.9;
        var delay = ctx.createDelay(0.5), fb = ctx.createGain(), wet = ctx.createGain();
        delay.delayTime.value = 0.16; fb.gain.value = 0.22; wet.gain.value = 0.18;
        out.connect(comp); out.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(comp);
        comp.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    } catch (e) { return false; }
  }
  // One note: a sine with a quiet octave on top, a quick soft start and a long fade.
  function note(f, at, len, vol, type) {
    var t = ctx.currentTime + (at || 0);
    [[1, 1, type || 'sine'], [2, 0.22, 'sine'], [3, 0.06, 'sine']].forEach(function (p) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = p[2]; o.frequency.value = f * p[0];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime((vol || 0.2) * p[1], t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(out); o.start(t); o.stop(t + len + 0.05);
    });
  }
  function sweep(from, to, len, vol) {
    var t = ctx.currentTime, n = Math.floor(ctx.sampleRate * len), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + len);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + len * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    src.connect(f).connect(g).connect(out); src.start(t);
  }
  var SOUNDS = {
    chime: function () { [659.25, 830.61, 987.77].forEach(function (f, i) { note(f, i * 0.2, 1.3, 0.2); }); },
    tap: function () { note(880, 0, 0.07, 0.07, 'triangle'); },
    pop: function () { note(520, 0, 0.09, 0.12, 'triangle'); note(780, 0.03, 0.1, 0.07); },
    good: function () { note(659.25, 0, 0.35, 0.16); note(987.77, 0.11, 0.6, 0.16); },
    bad: function () { note(311.13, 0, 0.3, 0.13, 'triangle'); note(233.08, 0.14, 0.5, 0.13, 'triangle'); },
    coin: function () { note(987.77, 0, 0.12, 0.12, 'triangle'); note(1318.5, 0.07, 0.5, 0.12, 'triangle'); },
    whoosh: function () { sweep(400, 2600, 0.32, 0.12); },
    // The win fanfare: a rising run, a held chord, and a sparkle on top.
    win: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { note(f, i * 0.1, 0.5, 0.16, 'triangle'); });
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f) { note(f, 0.44, 1.6, 0.11); });
      [1567.98, 2093, 2637].forEach(function (f, i) { note(f, 0.6 + i * 0.09, 0.5, 0.05); });
    }
  };
  function sound(name) { if (SOUNDS[name] && ready()) { try { SOUNDS[name](); } catch (e) {} } }

  // Pages call TT.chime() and then TT.celebrate(): the chime waits a beat so a win plays only the fanfare.
  var chimeT = 0;
  TT.chime = function () { clearTimeout(chimeT); chimeT = setTimeout(function () { sound('chime'); }, 0); };
  TT.tick = function () { sound('tap'); };

  // ---------- Confetti: paper pieces in the site's colors, plus a few themed emoji ----------
  var COLORS = ['#F2643D', '#E5397A', '#E89A00', '#0FA974', '#2563EB', '#7B4DEB', '#0B9BD8', '#FFC233'];
  function confetti(el, emoji) {
    if (!el || still) return;
    var old = el.querySelector(':scope > .fx-confetti'); if (old) old.remove();
    var box = document.createElement('div'); box.className = 'fx-confetti'; box.setAttribute('aria-hidden', 'true');
    var wide = el.getBoundingClientRect().width, count = Math.max(36, Math.min(110, Math.round(wide / 11)));
    for (var i = 0; i < count; i++) {
      var p = document.createElement('i'), kind = i % 9 === 0 && emoji && emoji.length ? 'e' : ['r', 'c', 's'][i % 3];
      p.className = 'fx-bit ' + kind;
      if (kind === 'e') p.textContent = emoji[(i / 9 | 0) % emoji.length];
      p.style.cssText = 'left:' + (Math.random() * 100).toFixed(1) + '%;--c:' + COLORS[i % COLORS.length] + ';--d:' + (Math.random() * 0.7).toFixed(2) + 's;--t:' + (2 + Math.random() * 1.6).toFixed(2) +
        's;--x:' + (Math.random() * 160 - 80).toFixed(0) + 'px;--r:' + (Math.random() * 900 - 450).toFixed(0) + 'deg;--s:' + (0.7 + Math.random() * 0.8).toFixed(2);
      box.append(p);
    }
    if (getComputedStyle(el).position === 'static') el.classList.add('fx-host');
    el.append(box);
    setTimeout(function () { box.remove(); }, 4600);
  }
  // The mascot pops up from the bottom corner to cheer, on pages that don't already have him on stage.
  function cheer(el) {
    if (!el || still || !TT.mascot || el.closest('.ar-stage, .board, .widget') || el.querySelector('.mascot') || el.getBoundingClientRect().width < 420) return;
    var old = el.querySelector(':scope > .fx-cheer'); if (old) old.remove();
    var m = TT.mascot({ mood: 'party' }), box = document.createElement('div');
    box.className = 'fx-cheer'; box.setAttribute('aria-hidden', 'true'); box.append(m);
    if (getComputedStyle(el).position === 'static') el.classList.add('fx-host');
    el.append(box);
    setTimeout(function () { box.classList.add('out'); setTimeout(function () { box.remove(); }, 500); }, 3200);
  }
  var lastWin = 0;
  TT.celebrate = function (el, emoji) {
    clearTimeout(chimeT);
    var now = Date.now();
    if (now - lastWin > 900) sound('win');            // two things finishing at once still play one fanfare
    lastWin = now;
    if (!emoji) { var s = TT.season ? TT.season() : null; emoji = s ? s.emoji.slice(0, 3) : ['⭐']; }
    confetti(el, emoji); cheer(el);
  };
  TT.fx = {
    sound: sound,
    confetti: confetti,
    win: function (el, emoji) {
      if (!el) { var pages = document.querySelectorAll('main.page'); for (var i = 0; i < pages.length; i++) if (!pages[i].hidden) el = pages[i].querySelector('.panel') || pages[i]; }
      TT.celebrate(el, emoji);
    }
  };
})();
