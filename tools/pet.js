// Classroom Pet: pick a pet, give it a name, and take care of it together every day.
(function () {
  var TT = window.TT, h = TT.h;
  var KEY = 'pet';

  var PETS = [
    { id: 'puppy', name: 'Puppy', emoji: '🐶', color: 'amber', food: 'a bowl of kibble' },
    { id: 'kitten', name: 'Kitten', emoji: '🐱', color: 'coral', food: 'some tuna' },
    { id: 'bunny', name: 'Bunny', emoji: '🐰', color: 'rose', food: 'fresh carrots' },
    { id: 'hamster', name: 'Hamster', emoji: '🐹', color: 'amber', food: 'sunflower seeds' },
    { id: 'turtle', name: 'Turtle', emoji: '🐢', color: 'emerald', food: 'leafy greens' },
    { id: 'fish', name: 'Goldfish', emoji: '🐠', color: 'sky', food: 'fish flakes' },
    { id: 'parrot', name: 'Parrot', emoji: '🦜', color: 'lime', food: 'a fruit snack' },
    { id: 'panda', name: 'Panda', emoji: '🐼', color: 'violet', food: 'bamboo' },
    { id: 'dragon', name: 'Baby Dragon', emoji: '🐲', color: 'emerald', food: 'spicy peppers' },
    { id: 'unicorn', name: 'Unicorn', emoji: '🦄', color: 'violet', food: 'rainbow oats' },
    { id: 'penguin', name: 'Penguin', emoji: '🐧', color: 'cobalt', food: 'a tiny fish' },
    { id: 'frog', name: 'Frog', emoji: '🐸', color: 'lime', food: 'crunchy crickets' }
  ];

  var CORE = [
    { id: 'hello', label: 'Say good morning', icon: '👋', stat: 'Love' },
    { id: 'food', label: 'Feed', icon: '🍽️', stat: 'Food' },
    { id: 'water', label: 'Fresh water', icon: '💧', stat: 'Water' },
    { id: 'play', label: 'Play time', icon: '🎾', stat: 'Fun' },
    { id: 'clean', label: 'Clean the home', icon: '🧽', stat: 'Clean' }
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

  function dayNumber(d) { return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
  function isSchoolDay(n) { var wd = new Date(n * 86400000).getUTCDay(); return wd !== 0 && wd !== 6; }

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
        } }, h('span', { class: 'pet-emoji', text: p.emoji }), h('span', { text: p.name }));
        grid.append(b);
      });
      var msg = h('p', { class: 'form-msg', hidden: true });
      root.append(
        h('div', { class: 'pet-setup' },
          h('h2', { text: 'Choose your classroom pet' }),
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
    var petEl, moodEl, heartsEl, levelEl, streakEl, taskList, bonusBtn, helperEl, hatEl, progressEl;
    function renderPet() {
      rollDay();
      var p = petInfo();
      root.textContent = '';
      hatEl = h('span', { class: 'pet-hat' });
      petEl = h('div', { class: 'pet-avatar' }, hatEl, h('span', { class: 'pet-big', text: p.emoji, 'aria-hidden': 'true' }));
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
            h('span', { class: 'stat' }, h('span', { text: '❤️' }), heartsEl, h('small', { text: 'hearts' })),
            h('span', { class: 'stat' }, h('span', { text: '⭐' }), levelEl, h('small', { text: 'level' })),
            h('span', { class: 'stat' }, h('span', { text: '🔥' }), streakEl, h('small', { text: 'day streak' })))),
        petEl,
        moodEl,
        h('div', { class: 'day-progress' }, h('span', { class: 'track' }, progressEl))
      );

      var side = h('section', { class: 'care' },
        h('div', { class: 'care-head' }, h('h3', { text: 'Today’s care' }), h('span', { class: 'muted', id: 'careCount' })),
        taskList,
        h('h3', { class: 'care-sub', text: 'Class challenge' }),
        bonusBtn,
        h('h3', { class: 'care-sub', text: 'Pet helper today' }),
        helperEl,
        h('div', { class: 'care-foot' }, changeArea())
      );

      root.append(h('div', { class: 'pet-layout' }, habitat, side));
      paint();
    }

    function changeArea() {
      var confirm = h('span', { class: 'confirm', hidden: true },
        h('span', { text: 'Pick a different pet? Hearts and streak are kept.' }),
        TT.button('Yes, choose', { kind: 'primary small', onclick: renderChooser }),
        TT.button('Cancel', { kind: 'small', onclick: function () { confirm.hidden = true; btn.hidden = false; } }));
      var btn = TT.button('Change pet', { kind: 'small', onclick: function () { btn.hidden = true; confirm.hidden = false; } });
      return h('div', null, btn, confirm);
    }

    function doTask(id, n) {
      if (state.done[id]) return;
      state.done[id] = true;
      state.hearts = (state.hearts || 0) + n;
      var before = state.lastLevel || 1;
      save();
      celebrate(n);
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
        var label = c.id === 'food' ? 'Feed ' + p.food : c.label;
        taskList.append(h('button', { type: 'button', class: 'task' + (done ? ' done' : ''), 'aria-pressed': done ? 'true' : 'false', disabled: done, onclick: function () { doTask(c.id, 2); } },
          h('span', { class: 'task-icon', text: c.icon }),
          h('span', { class: 'task-text' }, h('b', { text: label }), h('small', { text: done ? 'Done today' : '+2 hearts' })),
          h('span', { class: 'task-check', html: done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>' : '' })));
      });

      bonusBtn.textContent = '';
      bonusBtn.className = 'bonus' + (state.bonusDone ? ' done' : '');
      bonusBtn.disabled = !!state.bonusDone;
      bonusBtn.append(h('span', { class: 'bonus-text', text: bonusText() }),
        h('span', { class: 'bonus-cta', text: state.bonusDone ? 'Challenge complete' : 'We did it! +5 hearts' }));
      bonusBtn.onclick = function () { if (!state.bonusDone) { state.bonusDone = true; state.hearts = (state.hearts || 0) + 5; save(); celebrate(5); paint(); } };

      helperEl.textContent = '';
      if (state.helper) {
        helperEl.append(h('span', { class: 'helper-name', text: state.helper }),
          TT.button('Pick again', { icon: 'shuffle', kind: 'small', onclick: pickHelper }));
      } else {
        helperEl.append(h('span', { class: 'muted', text: 'Choose a student to do today’s pet jobs.' }),
          TT.button('Pick a helper', { icon: 'sparkle', kind: 'small', onclick: pickHelper }));
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
