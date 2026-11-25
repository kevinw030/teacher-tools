// Ready-made question sets for Sidekick Live. Two kinds:
//   * Math facts, made on the spot (addition, subtraction, multiplication, division, by level), with
//     believable wrong choices, the same way the math races make facts.
//   * Written sets by grade band and subject. Format: "Question|right answer|wrong|wrong|wrong".
// A set handed to the game engine is { id, title, subject, grade, questions: [{ q, a: [choices], c }] }.
(function () {
  var LB = window.LiveBanks = {};
  var BANDS = [['1-2', 'Grades 1 and 2'], ['3-4', 'Grades 3 and 4'], ['5', 'Grade 5']];
  LB.BANDS = BANDS;

  // ---------- Written sets ----------
  var WRITTEN = {
    '1-2': {
      'Reading and Words': [
        'Which word rhymes with "cat"?|hat|dog|sun|cup',
        'What is the first letter in "apple"?|a|p|l|e',
        'Which one is a naming word (a noun)?|dog|run|happy|quickly',
        'What do we put at the end of a telling sentence?|a period|a question mark|a comma|nothing',
        'Which word means more than one book?|books|book|booked|booking',
        'Which word is the opposite of "big"?|small|tall|wide|heavy',
        'Which word starts with the same sound as "sun"?|sock|moon|tree|bell',
        'How many syllables are in "butterfly"?|3|1|2|4'
      ],
      'Science': [
        'What do plants need to grow?|water and sunlight|candy|pencils|shoes',
        'Which animal lays eggs?|a chicken|a dog|a cat|a horse',
        'What season comes after summer?|fall|winter|spring|summer',
        'Which one is a liquid?|milk|a rock|a chair|a book',
        'What do we call baby frogs?|tadpoles|puppies|chicks|cubs',
        'Which is the closest star to Earth?|the Sun|the Moon|Mars|Pluto',
        'What do bees make?|honey|milk|bread|wool',
        'Which body part helps you hear?|your ears|your nose|your elbow|your knee'
      ],
      'Social Studies': [
        'Who helps you learn at school?|a teacher|a dentist|a pilot|a chef',
        'Which one is a map used for?|finding places|cooking food|telling time|playing music',
        'How many days are in one week?|7|5|10|12',
        'Who puts out fires?|a firefighter|a farmer|a painter|a barber',
        'What do we call the rules of a classroom?|rules|games|songs|snacks',
        'Which comes first in the year?|January|March|July|December',
        'What is a community?|a place where people live and work together|a kind of food|a type of car|a board game',
        'Which coin is worth 5 cents?|a nickel|a penny|a dime|a quarter'
      ],
      'Fun Facts': [
        'How many legs does a spider have?|8|6|4|10',
        'What color do you get mixing red and yellow?|orange|green|purple|gray',
        'Which animal is the biggest?|a blue whale|an elephant|a giraffe|a bear',
        'How many sides does a triangle have?|3|4|5|6',
        'What do you call a baby cat?|a kitten|a puppy|a cub|a foal',
        'Which one can fly?|a bat|a snake|a fish|a turtle',
        'What shape is a ball?|a sphere|a cube|a cone|a square',
        'How many colors are in a rainbow?|7|3|5|10'
      ]
    },
    '3-4': {
      'Reading and Words': [
        'What is the main idea of a story?|what the story is mostly about|the longest word in it|the last sentence|the title only',
        'Which word is an adjective?|shiny|jump|quickly|table',
        'What does the prefix "re-" mean, as in "rewrite"?|again|not|before|under',
        'Which word is a synonym for "happy"?|cheerful|angry|tired|quiet',
        'What are quotation marks used for?|showing what someone said|ending a sentence|asking a question|listing items',
        'Which word is spelled correctly?|friend|freind|frend|friennd',
        'What is a fable usually meant to teach?|a lesson|a recipe|a math fact|a map skill',
        'Which word is an antonym for "ancient"?|modern|old|dusty|large'
      ],
      'Science': [
        'What is the water cycle step where water turns into vapor?|evaporation|condensation|precipitation|erosion',
        'Which planet is known as the Red Planet?|Mars|Venus|Jupiter|Mercury',
        'What force pulls things toward the Earth?|gravity|friction|magnetism|energy',
        'What do we call an animal that eats only plants?|a herbivore|a carnivore|an omnivore|a predator',
        'Which is a state of matter?|gas|metal|sound|color',
        'What part of a plant takes in water from the soil?|the roots|the leaves|the flower|the stem',
        'What do we call a shaking of the ground?|an earthquake|a tornado|a blizzard|a drought',
        'How many bones are in the adult human body?|206|150|88|320'
      ],
      'Social Studies': [
        'What is the capital of the United States?|Washington, D.C.|New York City|Los Angeles|Chicago',
        'Which direction is at the top of most maps?|north|south|east|west',
        'How many states are in the United States?|50|13|48|52',
        'What do we call the people who make laws in a city?|the city council|the jury|the army|the choir',
        'Which ocean is on the east coast of the United States?|the Atlantic Ocean|the Pacific Ocean|the Indian Ocean|the Arctic Ocean',
        'What is a landform with a flat top and steep sides?|a plateau|a valley|a canyon|an island',
        'What is the job of a mayor?|leading a city|flying planes|teaching science|fixing roads',
        'Which holiday honors people who served in the military?|Veterans Day|Labor Day|Earth Day|Flag Day'
      ],
      'Fun Facts': [
        'How many minutes are in an hour?|60|30|90|100',
        'Which animal is the fastest on land?|a cheetah|a horse|a lion|a kangaroo',
        'How many continents are there?|7|5|6|8',
        'What is the largest ocean?|the Pacific|the Atlantic|the Indian|the Arctic',
        'Which is the tallest animal?|a giraffe|an elephant|a camel|a moose',
        'How many sides does a hexagon have?|6|5|7|8',
        'What do you call a group of wolves?|a pack|a herd|a school|a flock',
        'What does a thermometer measure?|temperature|weight|speed|sound'
      ]
    },
    '5': {
      'Reading and Words': [
        'What is a metaphor?|a comparison without "like" or "as"|a rhyme at the end of a line|a list of facts|the first paragraph',
        'What is the theme of a story?|the message or lesson|the setting|the number of pages|the author\'s name',
        'Which word is a conjunction?|because|slowly|bright|river',
        'What does "inference" mean?|a smart guess using clues|a word you look up|the end of a chapter|a list of characters',
        'Which sentence uses a comma correctly?|After lunch, we read.|After, lunch we read.|After lunch we, read.|After lunch we read,',
        'What is the root word in "unbelievable"?|believe|un|able|unbeliev',
        'What is a primary source?|a record from someone who was there|a textbook summary|a book review|an encyclopedia',
        'Which word means "to make shorter"?|abbreviate|elaborate|illustrate|navigate'
      ],
      'Science': [
        'What is the powerhouse of the cell?|the mitochondria|the nucleus|the cell wall|the vacuole',
        'What do we call animals with a backbone?|vertebrates|invertebrates|amphibians|mammals only',
        'Which gas do plants take in to make food?|carbon dioxide|oxygen|nitrogen|helium',
        'What is the closest planet to the Sun?|Mercury|Venus|Earth|Mars',
        'What is a mixture that is the same all the way through?|a solution|a suspension|a compound|an element',
        'What simple machine is a ramp?|an inclined plane|a pulley|a lever|a wheel and axle',
        'What is the name for animals active at night?|nocturnal|diurnal|migratory|hibernating',
        'What does a food chain show?|how energy moves between living things|how rocks form|how clouds make rain|how magnets work'
      ],
      'Social Studies': [
        'What document begins "We the People"?|the Constitution|the Declaration of Independence|the Bill of Rights|the Gettysburg Address',
        'How many branches does the U.S. government have?|3|2|4|5',
        'Who was the first president of the United States?|George Washington|Abraham Lincoln|Thomas Jefferson|John Adams',
        'What is the longest river in the United States?|the Missouri River|the Hudson River|the Colorado River|the Ohio River',
        'What are the first ten amendments called?|the Bill of Rights|the Preamble|the Articles|the Amendments Act',
        'What does an archaeologist study?|objects left by people long ago|weather patterns|ocean animals|rocks only',
        'Which branch makes the laws?|the legislative branch|the executive branch|the judicial branch|the state branch',
        'What is an economy based on buying and selling called?|a market economy|a barter system|a monarchy|a democracy'
      ],
      'Fun Facts': [
        'What is the hardest natural substance?|diamond|gold|iron|granite',
        'How many degrees are in a right angle?|90|45|180|360',
        'What is the smallest prime number?|2|1|3|0',
        'Which country has the most people?|India|the United States|Brazil|Russia',
        'How long does light from the Sun take to reach Earth?|about 8 minutes|about 1 second|about 1 hour|about 1 day',
        'What is the largest desert on Earth?|Antarctica|the Sahara|the Gobi|the Mojave',
        'How many hearts does an octopus have?|3|1|2|8',
        'What is the chemical symbol for water?|H2O|CO2|O2|NaCl'
      ]
    }
  };

  // ---------- Math facts, made on the spot ----------
  var MATH = [
    { id: 'add', name: 'Addition Facts', grades: { '1-2': [0, 10], '3-4': [0, 20], '5': [10, 50] } },
    { id: 'sub', name: 'Subtraction Facts', grades: { '1-2': [0, 10], '3-4': [0, 20], '5': [10, 50] } },
    { id: 'mul', name: 'Multiplication Facts', grades: { '1-2': [1, 5], '3-4': [1, 10], '5': [2, 12] } },
    { id: 'div', name: 'Division Facts', grades: { '1-2': [1, 5], '3-4': [1, 10], '5': [2, 12] } }
  ];
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Wrong answers a student might really pick: one off, ten off, and the other operation's answer.
  function mathQ(kind, lo, hi) {
    var a, b, q, right;
    if (kind === 'add') { a = rnd(lo, hi); b = rnd(lo, hi); q = a + ' + ' + b; right = a + b; }
    else if (kind === 'sub') { a = rnd(lo, hi); b = rnd(lo, Math.max(lo, a)); q = a + ' − ' + b; right = a - b; }
    else if (kind === 'mul') { a = rnd(lo, hi); b = rnd(lo, hi); q = a + ' × ' + b; right = a * b; }
    else { b = rnd(Math.max(1, lo), hi); right = rnd(Math.max(1, lo), hi); a = b * right; q = a + ' ÷ ' + b; }
    var near = {}, out = [];
    near[right] = 1;
    var tries = [right + 1, right - 1, right + 2, right - 2, right + 10, right - 10, kind === 'mul' ? a + b : right + 3, right * 2];
    tries.forEach(function (n) { if (out.length < 3 && n >= 0 && !near[n]) { near[n] = 1; out.push(n); } });
    while (out.length < 3) { var n = Math.max(0, right + rnd(-6, 6)); if (!near[n]) { near[n] = 1; out.push(n); } }
    var choices = shuffle([right].concat(out)).map(String);
    return { q: q + ' = ?', a: choices, c: choices.indexOf(String(right)), tag: 'math' };
  }
  // A set of n math questions, no repeats where it can help it.
  LB.mathSet = function (kind, band, n) {
    var m = MATH.filter(function (x) { return x.id === kind; })[0] || MATH[0];
    var range = m.grades[band] || m.grades['3-4'], seen = {}, out = [];
    for (var i = 0; i < (n || 20) * 6 && out.length < (n || 20); i++) {
      var q = mathQ(kind, range[0], range[1]);
      if (seen[q.q]) continue;
      seen[q.q] = 1; out.push(q);
    }
    return { id: 'math-' + kind + '-' + band, title: m.name + ' · ' + bandName(band), subject: 'Math', grade: band, questions: out, endless: kind };
  };
  function bandName(b) { for (var i = 0; i < BANDS.length; i++) if (BANDS[i][0] === b) return BANDS[i][1]; return b; }
  LB.bandName = bandName;

  // ---------- The list the teacher picks from ----------
  function parse(line, subject) {
    var p = line.split('|'), right = p[1];
    var choices = shuffle(p.slice(1, 5));
    return { q: p[0], a: choices, c: choices.indexOf(right), tag: subject === 'Science' ? 'science' : subject === 'Reading and Words' ? 'words' : '' };
  }
  LB.written = function (band, subject) {
    var lines = (WRITTEN[band] || {})[subject] || [];
    return { id: 'bank-' + band + '-' + subject.toLowerCase().replace(/[^a-z]+/g, '-'), title: subject + ' · ' + bandName(band), subject: subject, grade: band,
      questions: lines.map(function (l) { return parse(l, subject); }) };
  };
  // Every ready-made set, as cards for the picker: { id, title, subject, grade, count, make() }
  LB.list = function (band) {
    var out = [];
    MATH.forEach(function (m) {
      out.push({ id: 'math-' + m.id + '-' + band, title: m.name, subject: 'Math', grade: band, count: 'Endless',
        make: function (n) { return LB.mathSet(m.id, band, n || 20); } });
    });
    Object.keys(WRITTEN[band] || {}).forEach(function (subject) {
      var n = WRITTEN[band][subject].length;
      out.push({ id: 'bank-' + band + '-' + subject, title: subject, subject: subject, grade: band, count: n + ' questions',
        make: function () { var s = LB.written(band, subject); s.questions = shuffle(s.questions.slice()); return s; } });
    });
    return out;
  };
  LB.shuffle = shuffle;
})();
