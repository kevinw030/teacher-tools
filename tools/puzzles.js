// Puzzle and mystery games for the whole class:
// Mystery Riddle of the Day, Mini Escape Room, Code Breaker, Trivia Showdown.
(function () {
  var TT = window.TT, h = TT.h;
  function status() { return h('p', { class: 'game-status', 'aria-live': 'polite' }); }
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); }

  // ---------- Mystery Riddle of the Day ----------
  // [riddle, hint 1, hint 2, answer]
  var RIDDLES = [
    ['I have hands but cannot clap. What am I?', 'You look at me many times a day.', 'I tell you when it is time for recess.', 'A clock'],
    ['The more you take, the more you leave behind. What am I?', 'You make them when you walk.', 'Look behind you on a sandy beach.', 'Footsteps'],
    ['I have keys but open no doors. I have space but no rooms. What am I?', 'You use me to write without a pencil.', 'I sit in front of a computer screen.', 'A keyboard'],
    ['What has to be broken before you can use it?', 'It is a food.', 'A chicken made it.', 'An egg'],
    ['I am tall when I am young and short when I am old. What am I?', 'I give light.', 'You find me on a birthday cake.', 'A candle'],
    ['What has a neck but no head?', 'It can hold a drink.', 'It is often made of glass.', 'A bottle'],
    ['What gets wetter the more it dries?', 'You use it after a bath.', 'It hangs in the bathroom.', 'A towel'],
    ['I have a face and two hands, but no arms or legs. What am I?', 'I am often round.', 'I go tick tock.', 'A clock'],
    ['What can you catch but not throw?', 'It makes you sneeze.', 'You might stay home from school with it.', 'A cold'],
    ['What has many teeth but cannot bite?', 'You use it in the morning.', 'It helps with tangles.', 'A comb'],
    ['What goes up but never comes down?', 'Everyone has one.', 'It changes on your birthday.', 'Your age'],
    ['I am full of holes but I can still hold water. What am I?', 'You find me in the kitchen.', 'I am squishy and good for cleaning.', 'A sponge'],
    ['What has one eye but cannot see?', 'It is small and sharp.', 'Thread goes through it.', 'A needle'],
    ['What has legs but does not walk?', 'You sit near it every day.', 'You eat dinner on it.', 'A table'],
    ['What begins with T, ends with T, and has T in it?', 'It is found in the kitchen.', 'It holds a hot drink.', 'A teapot'],
    ['What kind of room has no doors or windows?', 'It is not really a room.', 'It grows in the forest and on pizza.', 'A mushroom'],
    ['What has words but never speaks?', 'You can find many of me in the library.', 'You read me.', 'A book'],
    ['What runs but never walks, has a mouth but never talks?', 'It is made of water.', 'Fish live in it.', 'A river'],
    ['What can travel around the world while staying in a corner?', 'It is small and sticky.', 'It goes on an envelope.', 'A stamp'],
    ['What has a thumb and four fingers but is not alive?', 'You wear it.', 'It keeps your hand warm.', 'A glove'],
    ['I am light as a feather, but even the strongest person cannot hold me for long. What am I?', 'You are doing it right now.', 'You need air for it.', 'Your breath'],
    ['What building has the most stories?', 'It is a quiet place.', 'It is full of books.', 'A library'],
    ['What has a head and a tail but no body?', 'You can flip it.', 'It is money.', 'A coin'],
    ['What comes down but never goes up?', 'It comes from the sky.', 'You need an umbrella for it.', 'Rain'],
    ['What is always in front of you but cannot be seen?', 'It has not happened yet.', 'It comes after today.', 'The future'],
    ['I am an odd number. Take away one letter and I become even. What number am I?', 'I am less than ten.', 'Take away the letter S.', 'Seven'],
    ['What has four wheels and flies?', 'It visits your street once a week.', 'It smells bad.', 'A garbage truck'],
    ['What has ears but cannot hear?', 'It grows in a field.', 'It is yellow and you can pop it.', 'Corn'],
    ['Which month has 28 days?', 'Think carefully about every month.', 'Do the other months have a 28th day?', 'All of them'],
    ['What can you break without touching it?', 'You make it with words.', 'You should always keep it.', 'A promise'],
    ['What is so fragile that saying its name breaks it?', 'A library is full of it.', 'Shhh!', 'Silence'],
    ['What has a bottom at the top?', 'You have two of them.', 'You stand on them.', 'Your legs'],
    ['I follow you all day long, but when the sun goes down I am gone. What am I?', 'I am dark.', 'I copy every move you make.', 'Your shadow'],
    ['What is black and white and read all over?', 'People read it in the morning.', 'It is full of news.', 'A newspaper'],
    ['What has a ring but no finger?', 'It makes a sound.', 'You answer it.', 'A phone'],
    ['What can fill a room but takes up no space?', 'You need it to see.', 'A lamp makes it.', 'Light'],
    ['What goes through cities and fields but never moves?', 'Cars use it.', 'It can be bumpy or smooth.', 'A road'],
    ['I have cities but no houses, mountains but no trees, and water but no fish. What am I?', 'It is made of paper.', 'It helps you find your way.', 'A map'],
    ['What invention lets you look right through a wall?', 'Every classroom has one.', 'It is made of glass.', 'A window'],
    ['If two is company and three is a crowd, what are four and five?', 'This one is a math trick.', 'Add them together.', 'Nine']
  ];

  function riddle(el) {
    var state = TT.load('riddle', { seen: [], day: '', cur: -1 });
    var shown = 0;
    var qEl = h('h2', { class: 'riddle-q' });
    var hints = h('div', { class: 'riddle-hints' });
    var ans = h('div', { class: 'riddle-answer', hidden: true });
    var hintBtn = TT.button('Show a Hint', { icon: 'sparkle', kind: 'big', onclick: function () { shown = Math.min(2, shown + 1); TT.tick(); paint(); } });
    var ansBtn = TT.button('Reveal Answer', { kind: 'primary big', onclick: function () { shown = 3; TT.chime(); paint(); } });
    var count = h('p', { class: 'muted' });
    el.append(h('div', { class: 'game riddle' },
      h('span', { class: 'eyebrow', text: 'Today’s Riddle' }), qEl, hints, ans,
      h('div', { class: 'row center' }, hintBtn, ansBtn, TT.button('Another Riddle', { icon: 'arrow', kind: 'big', onclick: function () { pick(); paint(); } })),
      count));
    function pick() {
      var left = RIDDLES.map(function (_, i) { return i; }).filter(function (i) { return state.seen.indexOf(i) < 0; });
      if (!left.length) { state.seen = []; left = RIDDLES.map(function (_, i) { return i; }).filter(function (i) { return i !== state.cur; }); }
      state.cur = left[Math.floor(Math.random() * left.length)];
      state.seen.push(state.cur); state.day = TT.today(); shown = 0;
      TT.save('riddle', state);
    }
    function paint() {
      if (state.day !== TT.today() || !RIDDLES[state.cur]) pick();
      var r = RIDDLES[state.cur];
      qEl.textContent = r[0];
      hints.textContent = '';
      for (var i = 1; i <= Math.min(shown, 2); i++) hints.append(h('div', { class: 'hint' }, h('b', { text: 'Hint ' + i }), h('span', { text: r[i] })));
      ans.hidden = shown < 3; ans.textContent = r[3];
      hintBtn.disabled = shown >= 2; ansBtn.disabled = shown >= 3;
      count.textContent = 'Riddle ' + state.seen.length + ' of ' + RIDDLES.length + '. No repeats until you have seen them all.';
    }
    paint();
  }

  // ---------- Mini Escape Room ----------
  // Each lock: q (puzzle), a (accepted answers), hint.
  var ROOMS = [
    { id: 'library', title: 'The Locked Library', emoji: '📚', color: 'violet',
      intro: 'The class stayed late to finish a book, and the old library doors have locked themselves! The librarian left five clues. Solve them all to get out before the bell.',
      win: 'The doors swing open. You escaped the library!',
      locks: [
        { q: 'The first lock needs a number. The shelf has 6 rows with 8 books in each row. How many books are on the shelf?', a: ['48'], hint: 'Multiply 6 × 8.' },
        { q: 'Unscramble the letters on the dusty book cover: R E T S Y M Y', a: ['mystery'], hint: 'It is a kind of story with a puzzle to solve.' },
        { q: 'A note says: “I have pages but I am not a book. I have months but I am not a year. I hang on the wall.” What am I?', a: ['calendar', 'acalendar'], hint: 'You check it to find the date.' },
        { q: 'Finish the pattern on the keypad: 3, 6, 12, 24, __', a: ['48'], hint: 'Each number is double the one before it.' },
        { q: 'The last lock asks: The library opens at 9:00 and closes 7 hours later. What time does it close? (Type it like 4:00)', a: ['400', '4', '4pm', '400pm'], hint: 'Count 7 hours forward from 9:00. After 12 comes 1.' }
      ] },
    { id: 'space', title: 'Stuck on the Space Station', emoji: '🚀', color: 'cobalt',
      intro: 'Your class is visiting a space station when the airlock seals shut. The computer will only open it for a crew that can answer five questions.',
      win: 'Airlock open! Mission control says, “Welcome home, crew.”',
      locks: [
        { q: 'Computer: “Which planet is known as the Red Planet?”', a: ['mars'], hint: 'It is the fourth planet from the Sun.' },
        { q: 'The fuel gauge shows 1,000 units. The trip home uses 375. How many units will be left?', a: ['625'], hint: 'Subtract 375 from 1,000.' },
        { q: 'Decode the message. Each number is a letter (A=1, B=2, C=3 …): 13 – 15 – 15 – 14', a: ['moon'], hint: 'The 13th letter is M.' },
        { q: 'There are 4 astronauts. Each needs 3 meals a day for 5 days. How many meals is that in all?', a: ['60'], hint: '4 × 3 = 12 meals each day. Now multiply by 5.' },
        { q: 'Final question: “I am a star, but you only see me in the daytime. What am I?”', a: ['sun', 'thesun'], hint: 'It gives Earth light and heat.' }
      ] },
    { id: 'pirate', title: 'The Pirate’s Treasure', emoji: '🏴‍☠️', color: 'amber',
      intro: 'You found an old treasure chest on the beach, but Captain Redbeard put five locks on it. Crack them all to see what is inside!',
      win: 'The chest creaks open. It is full of gold coins… made of chocolate!',
      locks: [
        { q: 'The map says: “Walk 25 steps north, then 3 times as many steps east.” How many steps east?', a: ['75'], hint: 'Multiply 25 × 3.' },
        { q: 'Unscramble the word carved in the lid: S A T R E U R E', a: ['treasure'], hint: 'It is what pirates bury.' },
        { q: 'The crew shares 56 gold coins equally among 8 pirates. How many coins does each pirate get?', a: ['7'], hint: 'Divide 56 by 8.' },
        { q: 'A parrot squawks: “What has a bed but never sleeps, and a mouth but never eats?”', a: ['river', 'ariver'], hint: 'It flows to the sea.' },
        { q: 'Last lock: Which is the biggest? Type the number. 0.5, 0.25 or 0.75', a: ['075', '75', '.75'], hint: 'Think of money: 50 cents, 25 cents or 75 cents.' }
      ] },
    { id: 'museum', title: 'Night at the Museum', emoji: '🦖', color: 'emerald',
      intro: 'The museum closed while your class was looking at the dinosaur bones. The night guard will let you out if you can prove you paid attention on the tour.',
      win: 'The guard smiles and unlocks the front door. “Best class I have ever met!”',
      locks: [
        { q: 'The guard asks: “What do we call animals that eat only plants?”', a: ['herbivores', 'herbivore'], hint: 'It starts with “herb”.' },
        { q: 'A dinosaur skeleton has 4 legs with 3 claws on each foot. Two skeletons have how many claws altogether?', a: ['24'], hint: 'One skeleton has 4 × 3 = 12 claws.' },
        { q: 'Which word is spelled correctly? Type it. A) fossle  B) fossil  C) fosil', a: ['fossil', 'b'], hint: 'It has a double S and ends in “il”.' },
        { q: 'The tour started at 1:15 and lasted 45 minutes. What time did it end? (Type it like 4:00)', a: ['200', '2', '2pm'], hint: '15 minutes + 45 minutes makes a full hour.' },
        { q: 'Final lock: “I have no life, but I can die. I power your toys. What am I?”', a: ['battery', 'abattery', 'batteries'], hint: 'You put it in a flashlight.' }
      ] }
  ];

  function allRooms() {
    var mine = ((TT.load('custom', {}) || {}).rooms || []).filter(function (r) { return r && r.title && Array.isArray(r.locks) && r.locks.length; });
    return ROOMS.concat(mine.map(function (r) {
      return { id: 'my-' + r.id, title: r.title, emoji: '🗝️', color: 'rose', mine: true,
        intro: r.intro || 'Your teacher built this room just for you. Work together to open every lock!',
        win: 'Every lock is open. Great teamwork!',
        locks: r.locks.map(function (L) {
          return { q: L.q, a: String(L.a).split(',').map(norm).filter(Boolean), hint: L.hint || 'No hint for this one. Talk it over as a team.' };
        }) };
    }));
  }

  // The game itself lives in tools/escape.js (rooms you explore) and tools/escape-art.js (the pictures).
  TT.escapeRooms = allRooms; TT.escapeNorm = norm;
  function escape(el) { return TT.mountEscape(el); }

  // ---------- Code Breaker ----------
  function code(el) {
    var COLORS = [['Red', '#EF4444'], ['Orange', '#F59E0B'], ['Yellow', '#FDE047'], ['Green', '#22C55E'], ['Blue', '#3B82F6'], ['Purple', '#A855F7']];
    var LEN = 4, MAX = 8, secret, rows, cur, over;
    var st = status();
    var board = h('div', { class: 'cb-board' });
    var palette = h('div', { class: 'cb-palette', role: 'group', 'aria-label': 'Pick a color' });
    COLORS.forEach(function (c, i) {
      palette.append(h('button', { type: 'button', class: 'cb-peg big', style: 'background:' + c[1], 'aria-label': c[0], title: c[0], onclick: function () { add(i); } }));
    });
    var checkBtn = TT.button('Check Guess', { kind: 'primary big', onclick: check });
    el.append(h('div', { class: 'game' }, st, board, palette,
      h('div', { class: 'row center' }, TT.button('Undo', { icon: 'back', kind: 'big', onclick: function () { if (!over) { cur.pop(); paint(); } } }), checkBtn,
        TT.button('New Code', { icon: 'reset', kind: 'big', onclick: reset })),
      h('p', { class: 'muted cb-key', html: '<span class="cb-fb exact"></span> right color, right spot &nbsp; <span class="cb-fb near"></span> right color, wrong spot' })));
    function reset() { secret = []; for (var i = 0; i < LEN; i++) secret.push(Math.floor(Math.random() * COLORS.length)); rows = []; cur = []; over = false; paint(); }
    function add(i) { if (over || cur.length >= LEN) return; cur.push(i); TT.tick(); paint(); }
    function score(g) {
      var exact = 0, near = 0, s = [], r = [];
      g.forEach(function (v, i) { if (v === secret[i]) exact++; else { s.push(secret[i]); r.push(v); } });
      r.forEach(function (v) { var k = s.indexOf(v); if (k >= 0) { near++; s.splice(k, 1); } });
      return [exact, near];
    }
    function check() {
      if (over || cur.length < LEN) return;
      var sc = score(cur); rows.push({ g: cur.slice(), s: sc }); cur = [];
      if (sc[0] === LEN) { over = true; TT.chime(); }
      else if (rows.length >= MAX) over = true;
      paint();
    }
    function pegRow(g, sc, active) {
      var pegs = []; for (var i = 0; i < LEN; i++) pegs.push(h('span', { class: 'cb-peg' + (g[i] == null ? ' empty' : ''), style: g[i] != null ? 'background:' + COLORS[g[i]][1] : null }));
      var fb = [];
      if (sc) { for (var a = 0; a < sc[0]; a++) fb.push(h('span', { class: 'cb-fb exact' })); for (var b = 0; b < sc[1]; b++) fb.push(h('span', { class: 'cb-fb near' })); }
      while (fb.length < LEN) fb.push(h('span', { class: 'cb-fb' }));
      return h('div', { class: 'cb-row' + (active ? ' active' : '') }, h('div', { class: 'cb-pegs' }, pegs), h('div', { class: 'cb-fbs' }, fb));
    }
    function paint() {
      board.textContent = '';
      rows.forEach(function (r) { board.append(pegRow(r.g, r.s)); });
      if (!over) board.append(pegRow(cur, null, true));
      for (var i = rows.length + (over ? 0 : 1); i < MAX; i++) board.append(pegRow([], null));
      var won = over && rows[rows.length - 1].s[0] === LEN;
      if (over && !won) board.append(h('div', { class: 'cb-row reveal' }, h('div', { class: 'cb-pegs' }, secret.map(function (v) { return h('span', { class: 'cb-peg', style: 'background:' + COLORS[v][1] }); })), h('b', { text: 'The code' })));
      checkBtn.disabled = over || cur.length < LEN;
      st.textContent = won ? 'Code cracked in ' + rows.length + (rows.length === 1 ? ' guess!' : ' guesses!') : over ? 'Out of guesses. Here is the secret code.' :
        'Guess ' + (rows.length + 1) + ' of ' + MAX + '. Pick four colors. Colors can repeat.';
    }
    reset();
  }

  // ---------- Trivia Showdown ----------
  // Each category has 8 questions; a board uses 4 of them, easiest first.
  var TRIVIA = {
    'Science': [['What do plants need from the Sun to make food?', 'Light (sunlight)'], ['What is frozen water called?', 'Ice'], ['Which planet is closest to the Sun?', 'Mercury'], ['What gas do people breathe in to stay alive?', 'Oxygen'],
      ['What force pulls objects toward the ground?', 'Gravity'], ['What are the three states of matter?', 'Solid, liquid and gas'], ['What part of a plant takes in water from the soil?', 'The roots'], ['What do we call an animal that is hunted by another animal?', 'Prey']],
    'Math': [['What is 9 × 7?', '63'], ['How many sides does a hexagon have?', '6'], ['What is half of 250?', '125'], ['How many minutes are in 2 hours?', '120'],
      ['What is 1,000 − 250?', '750'], ['What do we call the answer to a multiplication problem?', 'The product'], ['A square has sides of 6 inches. What is its perimeter?', '24 inches'], ['What is 144 ÷ 12?', '12']],
    'Geography': [['What is the largest ocean on Earth?', 'The Pacific Ocean'], ['How many continents are there?', '7'], ['What is the capital of the United States?', 'Washington, D.C.'], ['Which continent is the coldest?', 'Antarctica'],
      ['What imaginary line divides Earth into north and south halves?', 'The equator'], ['What is the longest river in the United States?', 'The Missouri River'], ['Which country is directly north of the United States?', 'Canada'], ['What do we call a piece of land with water on all sides?', 'An island']],
    'Animals': [['What is the largest animal on Earth?', 'The blue whale'], ['How many legs does a spider have?', '8'], ['What do we call a baby frog?', 'A tadpole'], ['Which bird cannot fly but is a great swimmer?', 'A penguin'],
      ['What is the fastest land animal?', 'The cheetah'], ['What do we call animals that are awake at night?', 'Nocturnal'], ['What is a group of lions called?', 'A pride'], ['Which mammal can truly fly?', 'A bat']],
    'Words': [['What is the opposite of “ancient”?', 'Modern (or new)'], ['What is a word that means the same as “happy”?', 'Glad, joyful, cheerful…'], ['What do we call a word that names a person, place or thing?', 'A noun'], ['How many syllables are in “elephant”?', '3'],
      ['What punctuation mark ends a question?', 'A question mark'], ['What is the plural of “mouse”?', 'Mice'], ['What do we call words that sound alike, like “pair” and “pear”?', 'Homophones'], ['Which word is the verb: “The dog barked loudly”?', 'Barked']],
    'History': [['Who was the first President of the United States?', 'George Washington'], ['What do the 50 stars on the U.S. flag stand for?', 'The 50 states'], ['On what holiday do Americans celebrate independence?', 'The Fourth of July (Independence Day)'], ['What ship brought the Pilgrims to America in 1620?', 'The Mayflower'],
      ['Who gave the “I Have a Dream” speech?', 'Dr. Martin Luther King Jr.'], ['How many colonies became the first states?', '13'], ['Which president is on the penny?', 'Abraham Lincoln'], ['What document begins with “We the People”?', 'The U.S. Constitution']]
  };

  // Every trivia question (built-in plus the teacher's own), for other games to use: [question, answer, category].
  TT.triviaPool = function () {
    var out = [];
    Object.keys(TRIVIA).forEach(function (c) { TRIVIA[c].forEach(function (q) { out.push([q[0], q[1], c]); }); });
    ((TT.load('custom', {}) || {}).trivia || []).forEach(function (t) { if (t && t.q && t.a) out.push([t.q, t.a, t.cat || 'My Questions']); });
    return out;
  };

  // Question pools for each grade. 4th grade is the set above; the others live in tools/trivia-grades.js.
  var GRADES = TT.TRIVIA_GRADES || {}; GRADES[4] = TRIVIA;
  var GRADE_NAMES = { 1: '1st Grade', 2: '2nd Grade', 3: '3rd Grade', 4: '4th Grade', 5: '5th Grade' };
  var GRADE_COLORS = { 1: 'emerald', 2: 'sky', 3: 'amber', 4: 'coral', 5: 'violet' };
  var GRADE_HINTS = { 1: 'Counting, letters and helpers', 2: 'Adding, nouns and seasons', 3: 'Multiplying, continents and life cycles', 4: 'Bigger facts, history and homophones', 5: 'Fractions, government and photosynthesis' };

  function trivia(el) {
    var POINTS = [100, 200, 300, 400];
    var TEAM_COLORS = ['cobalt', 'coral', 'emerald', 'amber'];
    var state = TT.load('trivia', null);
    var teams = Math.max(1, Math.min(4, (state && state.scores && state.scores.length) || 2));
    var root = h('div', { class: 'game trivia' });
    el.append(root);
    // Four questions from a category, kept easiest to hardest so 100 is the easiest tile.
    function pick4(list) {
      var idx = TT.shuffle(list.map(function (_, i) { return i; })).slice(0, 4).sort(function (a, b) { return a - b; });
      return idx.map(function (i) { return list[i]; });
    }
    // The teacher's own categories and questions go on the board first, then the chosen grade's questions.
    function newBoard(grade) {
      var pool = GRADES[grade] || TRIVIA, mine = {}, own = [];
      ((TT.load('custom', {}) || {}).trivia || []).forEach(function (t) {
        if (!t || !t.cat || !t.q || !t.a) return;
        if (!mine[t.cat]) { mine[t.cat] = []; if (!pool[t.cat]) own.push(t.cat); }
        mine[t.cat].push([t.q, t.a]);
      });
      own = own.filter(function (c) { return mine[c].length >= 4; });
      var cats = TT.shuffle(own).concat(TT.shuffle(Object.keys(pool))).slice(0, 5);
      state = { grade: grade, cats: cats.map(function (c) {
        return { name: c, items: TT.shuffle(mine[c] || []).concat(pool[c] ? pick4(pool[c]) : []).slice(0, 4), done: [0, 0, 0, 0] };
      }), scores: Array.apply(null, Array(teams)).map(function () { return 0; }) };
      save(); board();
    }
    // Every game starts here: choose the grade level the questions come from.
    function chooseGrade() {
      var playing = state && state.cats && state.cats.some(function (c) { return c.done.indexOf(0) >= 0; });
      root.textContent = '';
      var row = h('div', { class: 'tv-grades' });
      [1, 2, 3, 4, 5].forEach(function (g) {
        row.append(h('button', { type: 'button', class: 'tv-grade c-' + GRADE_COLORS[g] + (state && state.grade === g ? ' last' : ''), onclick: function () { newBoard(g); } },
          h('b', { text: String(g) }), h('span', { text: GRADE_NAMES[g] }), h('small', { text: GRADE_HINTS[g] })));
      });
      root.append(h('div', { class: 'tv-start' },
        h('span', { class: 'eyebrow', text: 'New Game' }),
        h('h2', { class: 'tv-start-h', text: 'Choose a Grade Level' }),
        h('p', { class: 'muted', text: 'Every question on the board comes from the grade you pick. Your own categories are always added first.' }),
        row,
        h('div', { class: 'tv-teams' }, h('span', { class: 'tv-teams-label', text: 'How Many Teams?' }),
          h('div', { class: 'segmented', role: 'group', 'aria-label': 'Number of teams' }, [1, 2, 3, 4].map(function (n) {
            return h('button', { type: 'button', class: 'seg' + (n === teams ? ' on' : ''), 'aria-pressed': n === teams ? 'true' : 'false', text: n === 1 ? '1 Team' : n + ' Teams', onclick: function () { teams = n; chooseGrade(); } });
          }))),
        h('div', { class: 'row center' },
          playing ? TT.button('Back to Game', { kind: 'big', onclick: board }) : null,
          TT.button('Write Your Own', { icon: 'plus', kind: 'big', onclick: function () { TT.custom.open('trivia'); } }))));
    }
    function save() { TT.save('trivia', state); }
    function overText(s) {
      if (s.length === 1) return 'Game over. You scored ' + s[0] + ' points!';
      var top = Math.max.apply(null, s), who = [];
      s.forEach(function (v, t) { if (v === top) who.push(t + 1); });
      return who.length > 1 ? 'Game over. It’s a tie between Teams ' + who.slice(0, -1).join(', ') + ' and ' + who[who.length - 1] + '!' : 'Game over. Team ' + who[0] + ' wins!';
    }
    function board() {
      root.textContent = '';
      var left = 0;
      var grid = h('div', { class: 'tv-grid', style: 'grid-template-columns:repeat(' + state.cats.length + ',1fr)' });
      state.cats.forEach(function (c) { grid.append(h('div', { class: 'tv-cat', text: c.name })); });
      POINTS.forEach(function (p, r) {
        state.cats.forEach(function (c, ci) {
          var done = !!c.done[r]; if (!done) left++;
          grid.append(h('button', { type: 'button', class: 'tv-tile' + (done ? ' done' : ''), disabled: done, 'aria-label': c.name + ' for ' + p, onclick: function () { question(ci, r); } }, done ? '' : String(p)));
        });
      });
      var s = state.scores;
      root.append(
        h('div', { class: 'scorebar' },
          s.map(function (pts, t) { return h('div', { class: 'team active' }, h('span', { class: 'team-dot', style: 'background:var(--' + TEAM_COLORS[t] + ')' }), h('span', { text: 'Team ' + (t + 1) }), h('b', { text: pts })); }),
          h('span', { class: 'tv-grade-chip', text: GRADE_NAMES[state.grade] || 'Mixed' }),
          TT.button('New Game', { icon: 'reset', kind: 'small', onclick: chooseGrade }),
          TT.button('Write Your Own', { icon: 'plus', kind: 'small', onclick: function () { TT.custom.open('trivia'); } })),
        h('p', { class: 'game-status', text: left ? 'Pick a category and a point value.' : overText(s) }),
        grid);
      if (!left) TT.chime();
    }
    function question(ci, r) {
      var c = state.cats[ci], q = c.items[r], p = POINTS[r];
      var ans = h('div', { class: 'riddle-answer', hidden: true, text: q[1] });
      var award = h('div', { class: 'row center', hidden: true },
        h('span', { class: 'muted', text: state.scores.length === 1 ? 'Did the team get it?' : 'Who got it?' }),
        state.scores.map(function (_, t) { return TT.button('Team ' + (t + 1) + ' +' + p, { kind: 'primary big', onclick: function () { give(t); } }); }),
        TT.button(state.scores.length === 1 ? 'Not This Time' : 'Nobody', { kind: 'big', onclick: function () { give(-1); } }));
      var reveal = TT.button('Show Answer', { kind: 'primary big', onclick: function () { ans.hidden = false; award.hidden = false; reveal.hidden = true; TT.tick(); } });
      function give(t) { if (t >= 0) state.scores[t] += p; c.done[r] = 1; save(); board(); }
      root.textContent = '';
      root.append(h('div', { class: 'tv-question' },
        h('span', { class: 'eyebrow', text: c.name + ' · ' + p + ' Points' }),
        h('h2', { class: 'riddle-q', text: q[0] }), ans,
        h('div', { class: 'row center' }, reveal, TT.button('Back to Board', { kind: 'big', onclick: board })), award));
    }
    // Pick up a game already in progress; otherwise start by choosing a grade.
    if (state && state.grade && state.cats && state.cats.every(function (c) { return c.items && c.items.length === 4; }) && state.cats.some(function (c) { return c.done.indexOf(0) >= 0; })) board(); else chooseGrade();
  }

  TT.games = (TT.games || []).concat([
    { id: 'riddle', title: 'Mystery Riddle', desc: 'A riddle a day with two hints and a big reveal.', color: 'amber', mount: riddle,
      icon: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>' },
    { id: 'escape-room', title: 'Mini Escape Room', desc: 'Explore the room, find the clues and open every lock to escape together.', color: 'violet', mount: escape,
      icon: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r="1.3" fill="currentColor"/>' },
    { id: 'code-breaker', title: 'Code Breaker', desc: 'Crack the secret color code using clues from each guess.', color: 'sky', mount: code,
      icon: '<circle cx="6" cy="12" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M3 19h18M3 5h18"/>' },
    { id: 'trivia', title: 'Trivia Showdown', desc: 'A quiz-show board with categories and points for one to four teams.', color: 'cobalt', mount: trivia,
      icon: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16M15 4v16"/>' }
  ]);
})();
