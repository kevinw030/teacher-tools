// Mini Escape Room: explore an illustrated room, tap the things that glow, solve each puzzle to
// earn a key, then open the exit. Pictures come from tools/escape-art.js, puzzles from tools/puzzles.js.
(function () {
  var TT = window.TT, h = TT.h;
  var KEYS = ['#FF5C8A', '#FFB020', '#22C58B', '#3B9BFF', '#9B6BFF'];
  var KEY_SVG = '<svg viewBox="0 0 48 24" aria-hidden="true"><circle cx="11" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="5"/><path d="M19 12h24M34 12v8M41 12v6" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>';
  function fmt(s) { return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; }
  function sceneOf(room) { return TT.escapeScenes[room.id] ? room.id : 'classroom'; }
  function pct(v, of) { return (v / of * 100).toFixed(2) + '%'; }
  function box(node, s) { node.style.left = pct(s.x, 1600); node.style.top = pct(s.y, 900); node.style.width = pct(s.w, 1600); node.style.height = pct(s.h, 900); }

  TT.mountEscape = function (el) {
    var room = null, base = null, grade = 0, scene = null, solved = [], start = 0, iv = 0, hintsUsed = 0, escaped = false, playing = false;
    var root = h('div', { class: 'game escape er' });
    el.append(root);

    // ---------- Choose a room ----------
    function menu() {
      clearInterval(iv); root.textContent = ''; room = null; base = null; playing = false;
      var best = TT.load('escape-best', {});
      root.append(h('p', { class: 'game-status', text: 'Choose a room, then pick your grade. Look around, solve the clues and escape together.' }),
        h('div', { class: 'er-grid' }, TT.escapeRooms().map(function (r, i) {
          var pic = h('span', { class: 'er-thumb' }); pic.innerHTML = TT.escapeArt(sceneOf(r), 'm' + i);
          return h('button', { type: 'button', class: 'er-card', onclick: function () { begin(r); } }, pic,
            h('span', { class: 'er-card-text' }, h('b', { text: r.title }),
              h('small', { text: r.mine ? (best[r.id] ? 'My Room · Best Time ' + fmt(best[r.id]) : 'My Room · ' + r.locks.length + (r.locks.length === 1 ? ' Lock' : ' Locks')) : 'Grades 1 to 5 · ' + r.locks.length + ' Locks' })));
        })),
        h('div', { class: 'row center' }, TT.button('Make Your Own Room', { icon: 'plus', kind: 'small', onclick: function () { TT.custom.open('rooms'); } })));
    }

    // ---------- The room ----------
    var stage, overlay, bar, clock, status, spotBtns, exitBtn, keyRow;
    var GRADES = { 1: '1st Grade', 2: '2nd Grade', 3: '3rd Grade', 4: '4th Grade', 5: '5th Grade' };
    function bestKey() { return base.mine ? base.id : base.id + '-g' + grade; }
    function bestFor(best) { return best[bestKey()] || (grade === 4 && !base.mine ? best[base.id] : 0); }
    // g is the grade to play. Leave it out and the teacher is asked first (built-in rooms only).
    function begin(r0, g) {
      base = r0; grade = r0.mine ? 0 : (g || 0);
      var r = { id: r0.id, title: r0.title, intro: r0.intro, win: r0.win, mine: r0.mine, locks: grade ? TT.escapeLocks(r0, grade) : r0.locks };
      room = r; scene = TT.escapeScenes[sceneOf(r)]; solved = r.locks.map(function () { return false; });
      hintsUsed = 0; escaped = false; playing = false; clearInterval(iv); root.textContent = '';
      var art = h('div', { class: 'er-art' }); art.innerHTML = TT.escapeArt(sceneOf(r), 'p');
      overlay = h('div', { class: 'er-over' });
      spotBtns = r.locks.slice(0, scene.spots.length).map(function (_, i) {
        var s = scene.spots[i];
        var b = h('button', { type: 'button', class: 'er-spot', 'aria-label': 'Look at ' + s.name, onclick: function () { if (playing && !solved[i]) puzzle(i); } },
          h('span', { class: 'er-ping', 'aria-hidden': 'true' }), h('span', { class: 'er-tag', text: s.name }));
        box(b, s); return b;
      });
      exitBtn = h('button', { type: 'button', class: 'er-spot er-exit', 'aria-label': scene.exit.name, onclick: tryExit },
        h('span', { class: 'er-ping', 'aria-hidden': 'true' }), h('span', { class: 'er-tag', text: scene.exit.name }));
      box(exitBtn, scene.exit);
      stage = h('div', { class: 'er-stage dark' }, art, spotBtns, exitBtn, overlay);
      clock = h('span', { class: 'er-clock', text: '0:00' });
      keyRow = h('div', { class: 'er-keys', role: 'img' }, r.locks.map(function (_, i) { var k = h('span', { class: 'er-key' }); k.innerHTML = KEY_SVG; k.style.color = KEYS[i % KEYS.length]; return k; }));
      status = h('span', { class: 'er-status', 'aria-live': 'polite' });
      bar = h('div', { class: 'er-bar' }, keyRow, status, clock, TT.button('Leave Room', { kind: 'small', onclick: menu }));
      root.append(stage, bar);
      paint();
      if (!r.mine && !grade) return askGrade(r0);
      var bt = bestFor(TT.load('escape-best', {}));
      card([h('span', { class: 'er-eyebrow', text: grade ? 'Escape Room · ' + GRADES[grade] : 'Escape Room' }), h('h2', { text: r.title }), h('p', { text: r.intro }),
        bt ? h('p', { class: 'er-how', text: 'Best time' + (grade ? ' for ' + GRADES[grade].toLowerCase() : '') + ': ' + fmt(bt) }) : null,
        h('p', { class: 'er-how', text: 'Tap the things that glow. Each one hides a puzzle and a key.' }),
        h('div', { class: 'row center' }, TT.button('Turn On the Lights', { icon: 'play', kind: 'primary big', onclick: function () {
          closeCard(); playing = true; start = Date.now(); stage.classList.remove('dark'); tick(); iv = setInterval(tick, 500); paint();
        } }), grade ? TT.button('Change Grade', { kind: 'big', onclick: function () { begin(r0); } }) : null, TT.button('Choose Another Room', { kind: 'big', onclick: menu }))]);
    }
    // The teacher picks the grade before anyone goes in, so every puzzle fits the class.
    function askGrade(r0) {
      var last = TT.grade ? TT.grade() : 0;
      card([h('span', { class: 'er-eyebrow', text: 'Escape Room' }), h('h2', { text: r0.title }),
        h('p', { class: 'er-how', text: 'Teacher, which grade is playing? Every puzzle in the room will match that grade.' }),
        h('div', { class: 'er-grades', role: 'group', 'aria-label': 'Grade level' }, [1, 2, 3, 4, 5].map(function (n) {
          return h('button', { type: 'button', class: 'er-grade' + (n === last ? ' last' : ''), 'aria-label': GRADES[n], onclick: function () { if (TT.grade) TT.grade(n); begin(r0, n); } },
            h('b', { text: String(n) }), h('span', { text: GRADES[n] }));
        })),
        h('div', { class: 'row center' }, TT.button('Choose Another Room', { kind: 'small', onclick: menu }))], 'grades');
    }
    function tick() { if (clock) clock.textContent = fmt(Math.floor((Date.now() - start) / 1000)); }
    function left() { return solved.filter(function (v) { return !v; }).length; }
    function paint() {
      var n = left();
      solved.forEach(function (v, i) {
        stage.classList.toggle('done-' + i, v);
        if (spotBtns[i]) { spotBtns[i].classList.toggle('solved', v); spotBtns[i].disabled = v; }
        keyRow.children[i].classList.toggle('got', v);
      });
      stage.classList.toggle('ready', n === 0 && !escaped);
      stage.classList.toggle('escaped', escaped);
      stage.style.setProperty('--lit', (0.72 + 0.28 * (solved.length - n) / solved.length).toFixed(2));
      keyRow.setAttribute('aria-label', (solved.length - n) + ' of ' + solved.length + ' keys found');
      status.textContent = !playing ? '' : n === 0 ? 'You have every key! Tap ' + scene.exit.name.replace(/^The /, 'the ') + '.' :
        n === solved.length ? 'Look around the room. What do you notice?' : n + (n === 1 ? ' key' : ' keys') + ' to go. Keep exploring!';
    }
    function card(children, cls) {
      overlay.textContent = '';
      var c = h('div', { class: 'er-card-panel ' + (cls || ''), role: 'dialog', 'aria-modal': 'true' });
      children.forEach(function (n) { if (n) c.append(n); });
      overlay.append(c); overlay.classList.add('show');
      return c;
    }
    function closeCard() { overlay.classList.remove('show'); overlay.textContent = ''; }

    // ---------- One puzzle ----------
    function puzzle(i) {
      var L = room.locks[i], s = scene.spots[i];
      var input = h('input', { type: 'text', id: 'escAnswer', class: 'esc-input', placeholder: 'Type the Answer', autocomplete: 'off', 'aria-label': 'Answer' });
      var msg = h('p', { class: 'esc-msg', 'aria-live': 'polite' });
      var hintBox = h('div', { class: 'hint', hidden: true }, h('b', { text: 'Hint' }), h('span', { text: L.hint }));
      var keyIcon = h('span', { class: 'er-key big' }); keyIcon.innerHTML = KEY_SVG; keyIcon.style.color = KEYS[i % KEYS.length];
      var panel;
      function tryIt() {
        var v = TT.escapeNorm(input.value);
        if (!v) return;
        if (L.a.indexOf(v) >= 0) {
          TT.chime(); solved[i] = true; panel.classList.add('open');
          msg.textContent = 'Click! That is correct.'; input.disabled = true;
          var r0 = room;
          setTimeout(function () {
            if (room !== r0) return;
            closeCard(); paint(); keyRow.children[i].classList.add('wait');
            TT.escapeReward(stage, { spot: s, color: KEYS[i % KEYS.length], svg: KEY_SVG, room: base.id, n: solved.length - left(), of: solved.length }, function (bigKey) {
              if (room !== r0) return;
              flyKey(i, bigKey); if (left() === 0) setTimeout(allFound, 900);
            });
          }, 750);
        } else {
          TT.tick(); panel.classList.remove('shake'); void panel.offsetWidth; panel.classList.add('shake');
          msg.textContent = 'Not quite. Talk it over and try again.'; input.select();
        }
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryIt(); });
      panel = card([
        h('div', { class: 'er-panel-top' }, keyIcon, h('span', { class: 'er-eyebrow', text: 'You look closely at' }), h('h2', { text: s.name })),
        h('p', { class: 'er-q', text: L.q }), hintBox,
        h('div', { class: 'row center' }, input, TT.button('Unlock', { kind: 'primary big', onclick: tryIt })), msg,
        h('div', { class: 'row center' },
          TT.button('Show Hint', { icon: 'sparkle', kind: 'small', onclick: function () { if (hintBox.hidden) { hintBox.hidden = false; hintsUsed++; } } }),
          TT.button('Back to the Room', { kind: 'small', onclick: closeCard }))], 'puzzle');
      panel.style.setProperty('--k', KEYS[i % KEYS.length]);
      setTimeout(function () { input.focus(); }, 50);
    }
    // The new key flies from the object down to its slot.
    function flyKey(i, fromEl) {
      var from = fromEl || spotBtns[i], to = keyRow.children[i];
      if (!from || !to || !from.animate) { if (to) to.classList.remove('wait'); return; }
      var a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), r = root.getBoundingClientRect(), k = root.offsetWidth / r.width || 1;
      var fly = h('span', { class: 'er-key fly' }); fly.innerHTML = KEY_SVG; fly.style.color = KEYS[i % KEYS.length];
      root.append(fly);
      var x0 = (a.left + a.width / 2 - r.left) * k, y0 = (a.top + a.height / 2 - r.top) * k, x1 = (b.left + b.width / 2 - r.left) * k, y1 = (b.top + b.height / 2 - r.top) * k;
      to.classList.add('wait');
      var big = Math.max(1, a.width * k / 58);
      fly.animate([{ transform: 'translate(' + x0 + 'px,' + y0 + 'px) translate(-50%,-50%) scale(' + big.toFixed(2) + ') rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + ((x0 + x1) / 2) + 'px,' + (Math.min(y0, y1) - 30) + 'px) translate(-50%,-50%) scale(' + (big * 0.6 + 0.4).toFixed(2) + ') rotate(200deg)', opacity: 1, offset: 0.5 },
        { transform: 'translate(' + x1 + 'px,' + y1 + 'px) translate(-50%,-50%) scale(1) rotate(360deg)', opacity: 1 }], { duration: 800, easing: 'cubic-bezier(.5, 0, .3, 1)' })
        .onfinish = function () {
          fly.remove(); to.classList.remove('wait'); to.classList.add('pop'); TT.tick();
          var ring = h('span', { class: 'er-slot-ring' }); ring.style.color = KEYS[i % KEYS.length]; to.append(ring); setTimeout(function () { ring.remove(); }, 700);
        };
    }
    function allFound() { if (!room || escaped) return; TT.chime(); paint(); }
    function tryExit() {
      if (!playing || escaped) return;
      if (left() > 0) {
        exitBtn.classList.remove('nope'); void exitBtn.offsetWidth; exitBtn.classList.add('nope'); TT.tick();
        status.textContent = 'It’s locked tight. You still need ' + left() + (left() === 1 ? ' key.' : ' keys.');
        return;
      }
      escaped = true; clearInterval(iv); paint(); TT.chime();
      var secs = Math.floor((Date.now() - start) / 1000);
      var best = TT.load('escape-best', {}), old = bestFor(best), record = !old || secs < old;
      if (record) { best[bestKey()] = secs; TT.save('escape-best', best); }
      status.textContent = 'You escaped!';
      setTimeout(function () {
        if (!room) return;
        if (TT.celebrate) TT.celebrate(stage, ['🗝️', '⭐', '🎉', '✨']);
        card([h('span', { class: 'er-eyebrow', text: room.title + (grade ? ' · ' + GRADES[grade] : '') }), h('h2', { text: 'You Escaped!' }), h('p', { text: room.win }),
          h('div', { class: 'er-stats' },
            h('span', null, h('b', { text: fmt(secs) }), record ? 'New Best Time' : 'Your Time'),
            h('span', null, h('b', { text: String(hintsUsed) }), hintsUsed === 1 ? 'Hint Used' : 'Hints Used'),
            h('span', null, h('b', { text: String(room.locks.length) }), 'Keys Found')),
          h('div', { class: 'row center' }, TT.button('Choose Another Room', { kind: 'primary big', onclick: menu }), TT.button('Play Again', { kind: 'big', onclick: function () { begin(base, grade); } }))], 'win');
      }, 1700);
    }
    menu();
    return { show: function () { if (!room) menu(); }, hide: function () { clearInterval(iv); } };
  };
})();
