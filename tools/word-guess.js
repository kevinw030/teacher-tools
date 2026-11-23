// Word Guess, the fun version: Kevin's balloon artwork floats over a sky stage, a wrong letter pops a
// balloon (squash, burst of rubber bits, a "POP!" star, the string drops), and a small mascot in the
// corner reacts to every guess. Replaces the plain Word Guess from tools/games.js. Styles: assets/word-guess.css.
(function () {
  var TT = window.TT, h = TT.h;
  var game = (TT.games || []).filter(function (g) { return g.id === 'word-guess'; })[0];
  if (!game) return;

  var MAX = 7;
  var COLORS = ['#ff815e', '#5b8cff', '#ffc233', '#34ce99', '#a77bff', '#ff6fae', '#4cc3f5'];
  // Kevin's balloon (48 x 80). The color comes from --balloon-color on each balloon.
  function balloonSvg() {
    return '<svg class="game-balloon" width="48" height="80" viewBox="0 0 48 80" aria-hidden="true">' +
      '<path class="wg-string" d="M24 56c-3.7 9 5.1 12.5.5 21" fill="none" stroke="#bdb7b5" stroke-width="1.4" stroke-linecap="round"/>' +
      '<g class="wg-rubber"><g fill="var(--balloon-color, #ff815e)"><path d="M24.4 2C11.3 2 2 12.2 2 25.2c0 13.2 11.2 27 20.6 30.4l-2.1 4c-.4.8.1 1.5 1 1.5h5.3c.9 0 1.4-.8 1-1.5l-2.4-4.1C34.8 51.2 46 37.6 46 24.8 46 11.7 36.8 2 24.4 2Z"/></g>' +
      '<path d="M10.7 19.7c1.1-4 3.7-7.2 7.1-9" fill="none" stroke="#fff" stroke-opacity=".82" stroke-width="3.6" stroke-linecap="round"/></g></svg>';
  }
  var SAY = {
    start: ['Pick a letter!', 'Can you guess my word?', 'Vowels are a good start!'],
    hit: ['Nice one!', 'Yes! It’s in there!', 'Great guess!', 'Keep going!', 'You’re on a roll!'],
    miss: ['Pop! Try another letter.', 'Oops, not that one.', 'Not in this word.', 'Hmm, try again!'],
    last: ['Careful, one balloon left!'],
    win: ['You got it!', 'Hooray! You saved the balloons!', 'Word wizards!'],
    lose: ['So close! Try a new word.']
  };
  function any(a) { return a[Math.floor(Math.random() * a.length)]; }
  var still = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };

  // A short rubbery "pop": a burst of noise with a quick low thump. Follows the sound setting.
  var actx;
  function popSound() {
    if (!TT.settings || !TT.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var t = actx.currentTime, n = Math.floor(actx.sampleRate * 0.12);
      var buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
      var src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 0.8;
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      src.connect(f).connect(g).connect(actx.destination); src.start(t);
      var o = actx.createOscillator(), og = actx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.1);
      og.gain.setValueAtTime(0.3, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      o.connect(og).connect(actx.destination); o.start(t); o.stop(t + 0.13);
    } catch (e) {}
  }

  function mount(el) {
    var LIST = { 'Animals': ['ELEPHANT', 'GIRAFFE', 'PENGUIN', 'DOLPHIN', 'KANGAROO', 'OCTOPUS'] };
    var cat = 'Animals', word, guessed, misses, over, label, timers = [];

    var st = h('p', { class: 'wg-sr', 'aria-live': 'polite' });
    var chip = h('span', { class: 'wg-chip' });
    var left = h('span', { class: 'wg-left' });
    var bunch = h('div', { class: 'wg-bunch', 'aria-hidden': 'true' });
    var wordEl = h('div', { class: 'wg-word' });
    var keys = h('div', { class: 'wg-keys' });
    var say = h('p', { class: 'wg-say' });
    var buddy = TT.mascot ? TT.mascot() : h('span');
    var catSel = h('div', { class: 'segmented' });
    var custom = h('input', { type: 'text', placeholder: 'Or type your own secret word', 'aria-label': 'Your own secret word', maxlength: 14 });
    var stage = h('div', { class: 'wg-stage' },
      h('div', { class: 'wg-sky', 'aria-hidden': 'true' }, h('i', { class: 'wg-sun' }), h('i', { class: 'wg-cloud c1' }), h('i', { class: 'wg-cloud c2' }), h('i', { class: 'wg-cloud c3' }), h('i', { class: 'wg-hill' })),
      h('div', { class: 'wg-top' }, chip, left),
      bunch, wordEl, keys,
      h('div', { class: 'wg-buddy' }, say, h('button', { type: 'button', class: 'wg-buddy-btn', 'aria-label': 'Mascot', onclick: function () { buddy.mood && buddy.mood('wave', 1600); talk(any(SAY.start)); } }, buddy)),
      st);

    function paintCats() {
      if (TT.GRADE_WORDS) LIST = TT.GRADE_WORDS[TT.grade()] || LIST;
      if (!LIST[cat]) cat = Object.keys(LIST)[0];
      catSel.textContent = '';
      Object.keys(LIST).forEach(function (k) {
        catSel.append(h('button', { type: 'button', class: 'seg' + (k === cat ? ' on' : ''), onclick: function () { cat = k; paintCats(); reset(); } }, k));
      });
    }
    paintCats();
    var gradeSel = TT.gradePicker ? TT.gradePicker(function () { paintCats(); reset(); }) : null;
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(function (L) {
      keys.append(h('button', { type: 'button', class: 'wg-key', 'data-k': L, onclick: function () { guess(L); } }, L));
    });
    el.append(h('div', { class: 'game wg' }, stage,
      h('div', { class: 'row center wg-controls' }, gradeSel, catSel, TT.button('New Word', { icon: 'reset', kind: 'primary', onclick: reset })),
      h('div', { class: 'row center wg-controls' }, custom, TT.button('Use My Word', { onclick: useMine }))));
    custom.addEventListener('keydown', function (e) { if (e.key === 'Enter') useMine(); });
    function useMine() {
      var w = custom.value.toUpperCase().replace(/[^A-Z]/g, ''); if (w.length < 2) return; custom.value = ''; start(w, 'Teacher’s Word');
    }
    function onKey(e) {
      if (!stage.isConnected) { document.removeEventListener('keydown', onKey); return; }   // game was closed
      if (stage.offsetParent === null) return;
      if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable) return;
      var L = e.key.toUpperCase(); if (/^[A-Z]$/.test(L)) guess(L);
    }
    document.addEventListener('keydown', onKey);

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function talk(text) {
      say.textContent = text;
      say.classList.remove('pop'); void say.offsetWidth; say.classList.add('pop');
    }
    function mood(m, ms) { if (buddy.mood) buddy.mood(m, ms); }

    function reset() { var list = LIST[cat]; start(list[Math.floor(Math.random() * list.length)], cat); }
    function start(w, lbl) {
      timers.forEach(clearTimeout); timers = [];
      word = w; guessed = {}; misses = 0; over = false; label = lbl;
      stage.classList.remove('won', 'lost');
      bunch.textContent = '';
      for (var i = 0; i < MAX; i++) {
        var b = h('span', { class: 'wg-b', style: '--balloon-color:' + COLORS[i] + ';--i:' + i });
        b.innerHTML = '<span class="wg-bob">' + balloonSvg() + '</span>';
        bunch.append(b);
      }
      wordEl.textContent = '';
      word.split('').forEach(function () { wordEl.append(h('span', { class: 'wg-tile' }, h('b'))); });
      wordEl.style.setProperty('--n', word.length);
      talk(any(SAY.start)); mood('wave', 1500);
      paint();
    }

    function guess(L) {
      if (over || guessed[L] || !word) return;
      guessed[L] = true;
      var hit = word.indexOf(L) >= 0;
      if (!hit) { misses++; pop(bunch.children[misses - 1]); }
      else TT.tick();
      var solved = word.split('').every(function (c) { return guessed[c]; });
      if (solved) {
        over = true; stage.classList.add('won');
        talk(any(SAY.win)); mood('party', 3200);
        later(function () { TT.chime(); if (TT.celebrate) TT.celebrate(stage, ['🎈', '⭐', '🎉', '✨']); }, 450);
      } else if (misses >= MAX) {
        over = true; stage.classList.add('lost');
        talk(SAY.lose[0]); mood('think', 2600);
      } else if (hit) {
        talk(any(SAY.hit)); mood(Math.random() < .5 ? 'cheer-left' : 'cheer-right', 1000);
      } else {
        talk(MAX - misses === 1 ? SAY.last[0] : any(SAY.miss)); mood('think', 1300);
      }
      paint(hit ? L : null);
    }

    // The pop: a quick squash and stretch, then the rubber bursts into bits, a "POP!" star flashes
    // and the string drops away.
    function pop(b) {
      if (!b) return;
      b.classList.add('popping');
      later(function () {
        popSound();
        b.classList.remove('popping'); b.classList.add('popped');
        if (still()) return;
        var color = getComputedStyle(b).getPropertyValue('--balloon-color').trim();
        var burst = h('span', { class: 'wg-burst' });
        burst.innerHTML = '<svg class="wg-star" viewBox="-50 -50 100 100"><path d="M0-46 9-22 34-36 24-12 48-6 26 6 40 30 14 22 6 47-6 24-28 40-22 14-48 8-26-6-40-30-12-20Z" fill="#fff" stroke="#1B1740" stroke-width="4" stroke-linejoin="round"/>' +
          '<text y="7" text-anchor="middle" font-size="21" font-weight="900" fill="#1B1740" font-family="Gabarito, sans-serif">POP!</text></svg><i class="wg-ring"></i>';
        b.append(burst);
        for (var i = 0; i < 12; i++) {
          var a = (i / 12) * Math.PI * 2 + Math.random() * 0.4, dist = 0.8 + Math.random() * 0.9;
          var bit = h('i', { class: 'wg-bit' + (i % 3 === 0 ? ' long' : '') });
          bit.style.background = i % 4 === 3 ? '#fff' : color;
          burst.append(bit);
          if (bit.animate) bit.animate([
            { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 },
            { transform: 'translate(calc(-50% + ' + (Math.cos(a) * dist * 3.4).toFixed(2) + 'em), calc(-50% + ' + (Math.sin(a) * dist * 3 - 0.6).toFixed(2) + 'em)) rotate(' + (Math.random() * 400 - 200) + 'deg) scale(.9)', opacity: 1, offset: 0.55 },
            { transform: 'translate(calc(-50% + ' + (Math.cos(a) * dist * 4).toFixed(2) + 'em), calc(-50% + ' + (Math.sin(a) * dist * 3 + 2.6).toFixed(2) + 'em)) rotate(' + (Math.random() * 600 - 300) + 'deg) scale(.4)', opacity: 0 }
          ], { duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.15,.7,.4,1)', fill: 'forwards' });
        }
        later(function () { burst.remove(); }, 1400);
      }, 230);
    }

    function paint(justHit) {
      var tiles = wordEl.children;
      word.split('').forEach(function (c, i) {
        var t = tiles[i], show = guessed[c] || over;
        t.firstChild.textContent = show ? c : '';
        t.className = 'wg-tile' + (guessed[c] ? ' shown' : '') + (over && !guessed[c] ? ' missed' : '') + (c === justHit ? ' flip' : '');
        if (c === justHit) t.style.animationDelay = (i * 0.06) + 's';
      });
      keys.querySelectorAll('.wg-key').forEach(function (k) {
        var L = k.getAttribute('data-k');
        k.disabled = over || !!guessed[L];
        k.className = 'wg-key' + (guessed[L] ? (word.indexOf(L) >= 0 ? ' hit' : ' miss') : '');
      });
      var n = MAX - misses;
      chip.textContent = label;
      left.textContent = n === 1 ? '1 Balloon Left' : n + ' Balloons Left';
      left.classList.toggle('low', n <= 2);
      st.textContent = stage.classList.contains('won') ? 'You got it! The word was ' + word + '.' :
        over ? 'Out of balloons! The word was ' + word + '.' : 'Category: ' + label + '. ' + n + ' balloons left.';
    }
    reset();
  }

  game.mount = mount;
})();
