// Classroom Pet: pick a pet, give it a name, and take care of it together every day.
(function () {
  var TT = window.TT, h = TT.h;
  var KEY = 'pet';

  var PETS = [
    { id: 'puppy', name: 'Puppy', emoji: '🐶', color: 'amber', food: 'a bowl of kibble', home: 'yard', move: 'walk', say: 'Woof woof!' },
    { id: 'kitten', name: 'Kitten', emoji: '🐱', color: 'coral', food: 'some tuna', home: 'yard', move: 'walk', say: 'Meow!', art: 'cat' },
    { id: 'bunny', name: 'Bunny', emoji: '🐰', color: 'rose', food: 'fresh carrots', home: 'yard', move: 'hop', say: '*wiggles nose*' },
    { id: 'hamster', name: 'Hamster', emoji: '🐹', color: 'amber', food: 'sunflower seeds', home: 'den', move: 'walk', say: 'Squeak!' },
    { id: 'turtle', name: 'Turtle', emoji: '🐢', color: 'emerald', food: 'leafy greens', home: 'terrarium', move: 'slow', say: 'Hello… slowly.', side: 'right' },
    { id: 'fish', name: 'Goldfish', emoji: '🐠', color: 'sky', food: 'fish flakes', home: 'tank', move: 'swim', say: 'Blub blub!', side: 'left' },
    { id: 'parrot', name: 'Parrot', emoji: '🦜', color: 'lime', food: 'a fruit snack', home: 'sky', move: 'fly', say: 'Squawk! Hello!', side: 'left' },
    { id: 'panda', name: 'Panda', emoji: '🐼', color: 'violet', food: 'bamboo', home: 'bamboo', move: 'walk', say: '*munch munch*' },
    { id: 'dragon', name: 'Baby Dragon', emoji: '🐲', color: 'emerald', food: 'spicy peppers', home: 'sky', move: 'fly', say: 'Rawr!' },
    { id: 'unicorn', name: 'Unicorn', emoji: '🦄', color: 'violet', food: 'rainbow oats', home: 'rainbow', move: 'hop', say: 'Neigh!' },
    { id: 'penguin', name: 'Penguin', emoji: '🐧', color: 'cobalt', food: 'a tiny fish', home: 'ice', move: 'waddle', say: 'Honk honk!' },
    { id: 'frog', name: 'Frog', emoji: '🐸', color: 'lime', food: 'crunchy crickets', home: 'pond', move: 'hop', say: 'Ribbit!' }
  ];

  TT.PETS = PETS;

  var CORE = [
    { id: 'hello', label: 'Say Good Morning', icon: '👋', stat: 'Love' },
    { id: 'food', label: 'Feed', icon: '🍽️', stat: 'Food' },
    { id: 'water', label: 'Fresh Water', icon: '💧', stat: 'Water' },
    { id: 'play', label: 'Play Time', icon: '🎾', stat: 'Fun' },
    { id: 'clean', label: 'Clean the Home', icon: '🧽', stat: 'Clean' }
  ];

  // A different class challenge each day. Finishing it earns bonus hearts.
  var BONUS = [
    'Read a page of your book out loud to {name}.',
    'Everyone whispers one kind thing about a classmate.',
    'Teach {name} a new word from today’s lesson.',
    'Do 10 jumping jacks together so {name} gets exercise.',
    'Count to 100 by fives for {name}.',
    'Tell {name} one thing you learned yesterday.',
    'Sing {name} a song as a class.',
    'Stay quiet for one full minute so {name} can nap.',
    'Spell three tricky words for {name}.',
    'Give {name} a high five by clapping in rhythm.',
    'Share one thing you are thankful for.',
    'Solve one math problem on the board for {name}.',
    'Draw a quick picture of {name} on scrap paper.',
    'Name five animals that live where {name} comes from.',
    'Line up quietly in under 30 seconds to show {name}.'
  ];

  var HATS = [
    { level: 2, emoji: '🎀', name: 'a bow' },
    { level: 3, emoji: '🧢', name: 'a cap' },
    { level: 4, emoji: '🎩', name: 'a top hat' },
    { level: 5, emoji: '👑', name: 'a crown' }
  ];

  function titleCase(t) { return t.replace(/\b(?!(?:a|an|of|the|and|or|to|in|on|for)\b)[a-z]/g, function (c) { return c.toUpperCase(); }); }
  function dayNumber(d) { return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function isSchoolDay(n) { var wd = new Date(n * 86400000).getUTCDay(); return wd !== 0 && wd !== 6; }

  // ---------- Mini habitat for the home page ----------
  // The pet moves around its home. Tap the pet to say hi, tap anywhere else to call it over.
  TT.mountPetMini = function (el) {
    if (!TT.PETS_ON) {
      if (el) { el.hidden = true; var card = el.closest && el.closest('.mm-card'); if (card) card.hidden = true; }
      return { refresh: function () {} };
    }
    var raf = 0, pet = null, node = null, home = null, bubble = null, info = null, bubbleTimer = 0;
    var x = 50, y = 60, tx = 50, ty = 60, vx = 0, face = 1, rest = 0, t0 = 0, lastPick = 0;

    function build() {
      cancelAnimationFrame(raf);
      el.textContent = '';
      var st = TT.load(KEY, null);
      if (!st || !st.pet) {
        el.append(h('a', { class: 'pet-mini empty-pet', href: '/pet' },
          h('span', { class: 'pet-mini-emoji', text: '🐾' }),
          h('span', null, h('b', { text: 'Adopt a Class Pet' }), h('small', { text: 'Choose a pet to care for together' }))));
        return;
      }
      pet = PETS.filter(function (p) { return p.id === st.pet; })[0] || PETS[0];
      var done = st.day === dayNumber(new Date()) ? CORE.filter(function (c) { return st.done && st.done[c.id]; }).length : 0;
      bubble = h('span', { class: 'mini-bubble', hidden: true });
      var art = pet.art && TT.petActor;
      if (art) home = h('div', { class: 'mini-home' }, bubble);
      else {
        node = h('button', { type: 'button', class: 'mini-pet', 'aria-label': 'Say hi to ' + st.name }, h('span', { class: 'mini-pet-body', text: pet.emoji }));
        home = h('div', { class: 'mini-home home-' + pet.home }, decor(pet.home), node, bubble);
      }
      info = h('a', { class: 'mini-info', href: '/pet' },
        h('span', null, h('b', { text: st.name }), h('small', { text: done === CORE.length ? 'All cared for today ❤️' : done + ' of ' + CORE.length + ' care tasks done' })),
        h('span', { class: 'mini-go', html: TT.icon('arrow') }));
      el.append(h('div', { class: 'pet-mini' }, home, info));
      if (art) {
        // An illustrated pet runs itself: it walks, sits, blinks and waves when tapped.
        TT.petActor(home, { art: pet.art, size: 1.3, ground: 8, label: 'Say hi to ' + st.name, onHello: function (px) {
          bubble.textContent = pet.say; bubble.hidden = false; bubble.style.left = px + '%'; bubble.style.top = '30%';
          clearTimeout(bubbleTimer); bubbleTimer = setTimeout(function () { bubble.hidden = true; }, 1800);
        } });
        return;
      }
      node.addEventListener('click', function (e) { e.stopPropagation(); hello(st.name); });
      home.addEventListener('click', function (e) {
        var r = home.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width * 100;
        ty = (e.clientY - r.top) / r.height * 100;
        clampTarget(); rest = 0;
      });
      x = 30 + Math.random() * 40; y = groundY(); tx = x; ty = y;
      if (pet.move === 'swim' || pet.move === 'fly') { y = 45; ty = 45; }
      t0 = performance.now();
      raf = requestAnimationFrame(loop);
    }

    function decor(type) {
      var d = h('div', { class: 'mini-decor', 'aria-hidden': 'true' });
      if (type === 'tank') { for (var i = 0; i < 6; i++) { var b = h('i', { class: 'bubble' }); b.style.left = (10 + i * 15) + '%'; b.style.animationDelay = (i * 0.7) + 's'; d.append(b); } d.append(h('i', { class: 'weed w1' }), h('i', { class: 'weed w2' }), h('i', { class: 'weed w3' })); }
      if (type === 'sky' || type === 'rainbow') d.append(h('i', { class: 'cloud c1' }), h('i', { class: 'cloud c2' }));
      if (type === 'pond') d.append(h('i', { class: 'pad p1' }), h('i', { class: 'pad p2' }), h('i', { class: 'pad p3' }));
      if (type === 'bamboo') d.append(h('i', { class: 'stalk s1' }), h('i', { class: 'stalk s2' }), h('i', { class: 'stalk s3' }));
      if (type === 'ice') d.append(h('i', { class: 'flake f1' }), h('i', { class: 'flake f2' }), h('i', { class: 'flake f3' }));
      return d;
    }
    function groundY() { return pet.move === 'swim' ? 50 : pet.move === 'fly' ? 40 : 74; }
    function clampTarget() {
      tx = Math.max(12, Math.min(88, tx));
      if (pet.move === 'swim') ty = Math.max(18, Math.min(72, ty));
      else if (pet.move === 'fly') ty = Math.max(15, Math.min(65, ty));
      else ty = groundY();
    }
    function wander(now) {
      if (now - lastPick < 400) return;
      lastPick = now;
      tx = 12 + Math.random() * 76;
      ty = pet.move === 'swim' ? 20 + Math.random() * 50 : pet.move === 'fly' ? 15 + Math.random() * 45 : groundY();
      clampTarget();
    }
    function speed() { return { swim: 0.09, fly: 0.12, walk: 0.07, hop: 0.08, waddle: 0.05, slow: 0.025 }[pet.move] || 0.06; }

    function loop(now) {
      if (!el.isConnected) return;
      raf = requestAnimationFrame(loop);
      if (document.hidden || el.offsetParent === null) return;
      var dx = tx - x, dy = ty - y, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) {
        if (!rest) rest = now + 1200 + Math.random() * 2600;
        if (now > rest) { rest = 0; wander(now); }
      } else {
        var sp = speed();
        x += dx / dist * Math.min(sp * 16, dist) * 0.6;
        y += dy / dist * Math.min(sp * 16, dist) * 0.6;
        if (Math.abs(dx) > 0.5) face = dx > 0 ? 1 : -1;
      }
      var t = (now - t0) / 1000, moving = dist >= 1, bob = 0, tilt = 0;
      if (pet.move === 'swim') { bob = Math.sin(t * 2.2) * 1.6; tilt = moving ? Math.sin(t * 6) * 4 : 0; }
      else if (pet.move === 'fly') { bob = Math.sin(t * 3) * 2.4; tilt = moving ? -6 * face : 0; }
      else if (pet.move === 'hop') { bob = moving ? -Math.abs(Math.sin(t * 7)) * 9 : 0; }
      else if (pet.move === 'waddle') { tilt = moving ? Math.sin(t * 9) * 10 : 0; }
      else if (pet.move === 'walk') { bob = moving ? -Math.abs(Math.sin(t * 9)) * 2.5 : 0; }
      else if (pet.move === 'slow') { bob = 0; }
      var flip = pet.side ? (pet.side === 'left' ? -face : face) : 1;
      node.style.left = x + '%';
      node.style.top = (y + bob) + '%';
      node.firstChild.style.transform = 'scaleX(' + flip + ') rotate(' + tilt + 'deg)';
      bubble.style.left = x + '%';
      bubble.style.top = (y + bob) + '%';
    }

    function hello(name) {
      TT.tick();
      node.classList.remove('wiggle'); void node.offsetWidth; node.classList.add('wiggle');
      bubble.textContent = pet.say;
      bubble.hidden = false;
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () { bubble.hidden = true; }, 1800);
      var heart = h('span', { class: 'mini-heart', text: '❤️', 'aria-hidden': 'true' });
      heart.style.left = x + '%'; heart.style.top = y + '%';
      home.append(heart);
      setTimeout(function () { heart.remove(); }, 1300);
    }

    build();
    window.addEventListener('storage', function (e) { if (e.key === 'tt:' + KEY) build(); });
    return { refresh: build };
  };

  TT.mountPet = function (el) {
    var state = TT.load(KEY, null);
    var root = h('div', { class: 'pet-app' });
    el.append(root);

    function save() { TT.save(KEY, state); }
    function today() { return dayNumber(new Date()); }

    // New day: count the streak, then clear today's tasks.
    function rollDay() {
      if (!state || !state.pet) return;
      var t = today();
      if (state.day === t) return;
      if (state.day != null) {
        var finishedLast = CORE.every(function (c) { return state.done && state.done[c.id]; });
        var gapOk = true;
        for (var d = state.day + 1; d < t; d++) if (isSchoolDay(d)) { gapOk = false; break; }
        state.streak = finishedLast && gapOk ? (state.streak || 0) + 1 : (finishedLast ? 1 : 0);
      }
      state.day = t; state.done = {}; state.bonusDone = false; state.helper = null;
      save();
    }

    function level() { return Math.floor((state.hearts || 0) / 40) + 1; }
    function hat() { var lv = level(), best = null; HATS.forEach(function (x) { if (lv >= x.level) best = x; }); return best; }
    function petInfo() { return PETS.filter(function (p) { return p.id === state.pet; })[0] || PETS[0]; }
    function bonusText() { return BONUS[today() % BONUS.length].replace(/\{name\}/g, state.name); }

    // ---------- Choose a pet ----------
    function renderChooser() {
      root.textContent = '';
      var chosen = PETS[0].id;
      var nameInput = h('input', { type: 'text', id: 'petName', maxlength: 20, placeholder: 'Give your pet a name', 'aria-label': 'Pet name' });
      var grid = h('div', { class: 'pet-grid', role: 'radiogroup', 'aria-label': 'Choose a pet' });
      PETS.forEach(function (p) {
        var b = h('button', { type: 'button', class: 'pet-choice c-' + p.color, role: 'radio', 'aria-checked': p.id === chosen ? 'true' : 'false', onclick: function () {
          chosen = p.id;
          grid.querySelectorAll('.pet-choice').forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
          b.setAttribute('aria-checked', 'true');
          if (!nameInput.value) nameInput.placeholder = 'Name your ' + p.name.toLowerCase();
        } }, p.art && TT.petIcon ? TT.petIcon(p.art, 'pet-emoji pet-art-icon') : h('span', { class: 'pet-emoji', text: p.emoji }), h('span', { text: p.name }));
        grid.append(b);
      });
      var msg = h('p', { class: 'form-msg', hidden: true });
      root.append(
        h('div', { class: 'pet-setup' },
          h('h2', { text: 'Choose Your Classroom Pet' }),
          h('p', { class: 'muted', text: 'Your class will take care of it every day. Vote together, then type a name.' }),
          grid,
          h('div', { class: 'add-form' }, nameInput,
            TT.button('Adopt', { icon: 'sparkle', kind: 'primary big', onclick: function () {
              var n = nameInput.value.trim();
              if (!n) { msg.textContent = 'Give your pet a name first.'; msg.hidden = false; nameInput.focus(); return; }
              var keep = state || {};
              state = { pet: chosen, name: n, hearts: keep.hearts || 0, streak: keep.streak || 0, day: today(), done: {}, bonusDone: false, adopted: keep.adopted || new Date().toISOString() };
              save(); renderPet();
            } }),
            msg)
        ));
    }

    // ---------- Pet home ----------
    var petEl, moodEl, heartsEl, levelEl, streakEl, taskList, bonusBtn, helperEl, hatEl, progressEl, actor = null;
    function renderPet() {
      rollDay();
      var p = petInfo();
      root.textContent = '';
      hatEl = h('span', { class: 'pet-hat' });
      if (actor) { actor.destroy(); actor = null; }
      if (p.art && TT.petActor) {
        // Illustrated pets live in a room: they walk around and act out each care task.
        petEl = h('div', { class: 'pet-scene' });
        actor = TT.petActor(petEl, { art: p.art, hat: hatEl, label: 'Say hi to ' + state.name });
      } else petEl = h('div', { class: 'pet-avatar' }, hatEl, h('span', { class: 'pet-big', text: p.emoji, 'aria-hidden': 'true' }));
      moodEl = h('p', { class: 'pet-mood', 'aria-live': 'polite' });
      heartsEl = h('b'); levelEl = h('b'); streakEl = h('b');
      progressEl = h('span');
      taskList = h('div', { class: 'task-list' });
      bonusBtn = h('button', { type: 'button', class: 'bonus' });
      helperEl = h('div', { class: 'helper' });

      var habitat = h('section', { class: 'habitat c-' + p.color },
        h('div', { class: 'habitat-top' },
          h('div', null, h('h2', { class: 'pet-name', text: state.name }), h('span', { class: 'muted', text: 'Your class ' + p.name.toLowerCase() })),
          h('div', { class: 'stats' },
            h('span', { class: 'stat' }, h('span', { text: '❤️' }), heartsEl, h('small', { text: 'Hearts' })),
            h('span', { class: 'stat' }, h('span', { text: '⭐' }), levelEl, h('small', { text: 'Level' })),
            h('span', { class: 'stat' }, h('span', { text: '🔥' }), streakEl, h('small', { text: 'Day Streak' })))),
        petEl,
        moodEl,
        h('div', { class: 'day-progress' }, h('span', { class: 'track' }, progressEl))
      );

      var side = h('section', { class: 'care' },
        h('div', { class: 'care-head' }, h('h3', { text: 'Today’s Care' }), h('span', { class: 'muted', id: 'careCount' })),
        taskList,
        h('h3', { class: 'care-sub', text: 'Class Challenge' }),
        bonusBtn,
        h('h3', { class: 'care-sub', text: 'Pet Helper Today' }),
        helperEl,
        h('div', { class: 'care-foot' }, changeArea())
      );

      root.append(h('div', { class: 'pet-layout' }, habitat, side));
      paint();
    }

    function changeArea() {
      var confirm = h('span', { class: 'confirm', hidden: true },
        h('span', { text: 'Pick a different pet? Hearts and streak are kept.' }),
        TT.button('Yes, Choose', { kind: 'primary small', onclick: renderChooser }),
        TT.button('Cancel', { kind: 'small', onclick: function () { confirm.hidden = true; btn.hidden = false; } }));
      var btn = TT.button('Change Pet', { kind: 'small', onclick: function () { btn.hidden = true; confirm.hidden = false; } });
      return h('div', null, btn, confirm);
    }

    function doTask(id, n) {
      if (state.done[id]) return;
      state.done[id] = true;
      state.hearts = (state.hearts || 0) + n;
      var before = state.lastLevel || 1;
      save();
      celebrate(n);
      if (actor) actor.act({ hello: 'wave', food: 'eat', water: 'drink', play: 'play', clean: 'happy' }[id], 3600);
      paint();
      if (level() > before) { state.lastLevel = level(); save(); var hh = hat(); moodEl.textContent = state.name + ' reached level ' + level() + '!' + (hh && hh.level === level() ? ' It earned ' + hh.name + ' ' + hh.emoji : ''); }
    }

    function celebrate(n) {
      petEl.classList.remove('hop'); void petEl.offsetWidth; petEl.classList.add('hop');
      TT.tick();
      for (var i = 0; i < Math.min(n, 6); i++) {
        var heart = h('span', { class: 'float-heart', text: '❤️', 'aria-hidden': 'true' });
        heart.style.left = (35 + Math.random() * 30) + '%';
        heart.style.animationDelay = (i * 90) + 'ms';
        petEl.append(heart);
        setTimeout(function (x) { return function () { x.remove(); }; }(heart), 1600);
      }
    }

    function paint() {
      if (!state || !state.pet) return;
      rollDay();
      var p = petInfo();
      var count = CORE.filter(function (c) { return state.done[c.id]; }).length;
      heartsEl.textContent = state.hearts || 0;
      levelEl.textContent = level();
      streakEl.textContent = state.streak || 0;
      progressEl.style.width = (count / CORE.length * 100) + '%';
      var hh = hat(); hatEl.textContent = hh ? hh.emoji : '';
      petEl.classList.toggle('sleepy', count === 0);
      petEl.classList.toggle('happy', count === CORE.length);
      var hr = new Date().getHours();
      moodEl.textContent =
        count === 0 ? (hr < 12 ? state.name + ' just woke up and is waiting for the class to say hi.' : state.name + ' has been waiting all day. Time to take care of it!') :
        count < 3 ? state.name + ' is getting hungry and wants some attention.' :
        count < CORE.length ? state.name + ' is feeling good. Almost done!' :
        state.name + ' is super happy. Great job, class!';
      var cc = document.getElementById('careCount'); if (cc) cc.textContent = count + ' of ' + CORE.length + ' done';

      taskList.textContent = '';
      CORE.forEach(function (c) {
        var done = !!state.done[c.id];
        var label = c.id === 'food' ? 'Feed ' + titleCase(p.food) : c.label;
        taskList.append(h('button', { type: 'button', class: 'task' + (done ? ' done' : ''), 'aria-pressed': done ? 'true' : 'false', disabled: done, onclick: function () { doTask(c.id, 2); } },
          h('span', { class: 'task-icon', text: c.icon }),
          h('span', { class: 'task-text' }, h('b', { text: label }), h('small', { text: done ? 'Done Today' : '+2 Hearts' })),
          h('span', { class: 'task-check', html: done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>' : '' })));
      });

      bonusBtn.textContent = '';
      bonusBtn.className = 'bonus' + (state.bonusDone ? ' done' : '');
      bonusBtn.disabled = !!state.bonusDone;
      bonusBtn.append(h('span', { class: 'bonus-text', text: bonusText() }),
        h('span', { class: 'bonus-cta', text: state.bonusDone ? 'Challenge Complete' : 'We Did It! +5 Hearts' }));
      bonusBtn.onclick = function () { if (!state.bonusDone) { state.bonusDone = true; state.hearts = (state.hearts || 0) + 5; save(); celebrate(5); paint(); } };

      helperEl.textContent = '';
      if (state.helper) {
        helperEl.append(h('span', { class: 'helper-name', text: state.helper }),
          TT.button('Pick Again', { icon: 'shuffle', kind: 'small', onclick: pickHelper }));
      } else {
        helperEl.append(h('span', { class: 'muted', text: 'Choose a student to do today’s pet jobs.' }),
          TT.button('Pick a Helper', { icon: 'sparkle', kind: 'small', onclick: pickHelper }));
      }
    }

    function pickHelper() {
      var names = TT.roster.present();
      if (!names.length) return;
      var choices = names.filter(function (n) { return n !== state.helper; });
      state.helper = (choices.length ? choices : names)[Math.floor(Math.random() * (choices.length || names.length))];
      save(); paint();
    }

    setInterval(function () { if (state && state.pet && state.day !== today()) renderPet(); }, 60000);

    if (state && state.pet) renderPet(); else renderChooser();
    return { show: function () { if (state && state.pet) paint(); } };
  };
})();

// When pets are switched off, take the links off the page and send #pet back home.
(function () {
  if (TT.PETS_ON) return;
  function off() {
    var links = document.querySelectorAll('a[href="#pet"]');
    for (var i = 0; i < links.length; i++) links[i].hidden = true, links[i].style.display = 'none';
    if (TT.page() === 'pet') TT.go('home', true);
  }
  off();
  document.addEventListener('DOMContentLoaded', off);
  window.addEventListener('tt:page', off);
})();
