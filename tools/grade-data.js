// Grade level content (1st to 5th) for Word Guess, Memory Match and the Prompts page.
// Kept in one file so it is easy to add to. Everything here is original and classroom safe.
(function () {
  var TT = window.TT = window.TT || {};
  TT.GRADE_NAMES = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th' };
  // The grade last chosen anywhere is remembered, so every tool opens on your grade.
  TT.grade = function (set) {
    if (set) { TT.save('grade', set); return set; }
    var g = +TT.load('grade', 4); return g >= 1 && g <= 5 ? g : 4;
  };
  // A row of 1st to 5th buttons. onPick(grade) runs when one is chosen.
  TT.gradePicker = function (onPick, label) {
    var h = TT.h, box = h('div', { class: 'segmented grade-seg', role: 'group', 'aria-label': label || 'Grade level' });
    function paint() { [].forEach.call(box.children, function (b) { var on = +b.getAttribute('data-g') === TT.grade(); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); }
    [1, 2, 3, 4, 5].forEach(function (g) {
      box.append(h('button', { type: 'button', class: 'seg', 'data-g': g, text: TT.GRADE_NAMES[g], onclick: function () { TT.grade(g); paint(); onPick(g); } }));
    });
    paint();
    return box;
  };

  // ----- Word Guess: words by grade and category -----
  TT.GRADE_WORDS = {
    1: {
      'Animals': ['FROG', 'DUCK', 'FISH', 'BEAR', 'GOAT', 'BIRD', 'PUPPY', 'HORSE'],
      'Colors & Shapes': ['BLUE', 'GREEN', 'PINK', 'BROWN', 'CIRCLE', 'SQUARE', 'STAR', 'HEART'],
      'At School': ['BOOK', 'DESK', 'BELL', 'LUNCH', 'CHAIR', 'CRAYON', 'PAPER', 'GLUE']
    },
    2: {
      'Animals': ['RABBIT', 'TURTLE', 'MONKEY', 'SPIDER', 'KITTEN', 'TIGER', 'ZEBRA', 'WHALE'],
      'Nature': ['FLOWER', 'CLOUD', 'RIVER', 'GARDEN', 'WINTER', 'SUMMER', 'SEEDS', 'ROOTS'],
      'Math Words': ['DOUBLE', 'DOLLAR', 'MINUTE', 'EQUAL', 'COUNT', 'EVEN', 'TENS', 'HOUR']
    },
    3: {
      'Animals': ['PENGUIN', 'DOLPHIN', 'GIRAFFE', 'TADPOLE', 'OCTOPUS', 'REPTILE', 'HAMSTER', 'PEACOCK'],
      'Science': ['MAGNET', 'FOSSIL', 'PLANET', 'LIQUID', 'ORBIT', 'HABITAT', 'WEATHER', 'FRICTION'],
      'Math Words': ['MULTIPLY', 'DIVIDE', 'AREA', 'PENTAGON', 'FRACTION', 'ROUNDING', 'PRODUCT', 'ARRAY']
    },
    4: {
      'Animals': ['ELEPHANT', 'KANGAROO', 'CHEETAH', 'BUTTERFLY', 'SQUIRREL', 'CROCODILE', 'MAMMAL', 'PREDATOR'],
      'Science': ['GRAVITY', 'VOLCANO', 'ENERGY', 'EROSION', 'SKELETON', 'CIRCUIT', 'MINERAL', 'ECOSYSTEM'],
      'Math Words': ['DECIMAL', 'PERIMETER', 'ANGLE', 'TRIANGLE', 'EQUATION', 'SYMMETRY', 'FACTOR', 'MULTIPLE'],
      'Places': ['MOUNTAIN', 'DESERT', 'ISLAND', 'RAINFOREST', 'VALLEY', 'CANYON', 'CAPITAL', 'COASTLINE']
    },
    5: {
      'Science': ['PHOTOSYNTHESIS', 'ATMOSPHERE', 'MOLECULE', 'NUCLEUS', 'ORGANISM', 'DECOMPOSER', 'ADAPTATION', 'MIXTURE'],
      'Math Words': ['NUMERATOR', 'DENOMINATOR', 'COORDINATE', 'VOLUME', 'EXPONENT', 'QUOTIENT', 'PARALLEL', 'HEXAGON'],
      'History': ['COLONY', 'CONGRESS', 'EXPLORER', 'FREEDOM', 'AMENDMENT', 'REVOLUTION', 'PIONEER', 'TREATY'],
      'Word Study': ['SIMILE', 'METAPHOR', 'ADVERB', 'SYNONYM', 'PREFIX', 'NARRATOR', 'CONFLICT', 'THEME']
    }
  };

  // ----- Memory Match: pairs that go together, by grade -----
  TT.GRADE_PAIRS = {
    1: {
      'Math Facts': [['2 + 3', '5'], ['4 + 4', '8'], ['6 + 1', '7'], ['5 + 5', '10'], ['9 − 3', '6'], ['7 − 4', '3'], ['3 + 6', '9'], ['8 − 4', '4'], ['1 + 1', '2'], ['10 − 9', '1'], ['6 + 6', '12'], ['7 + 4', '11']],
      'Opposites': [['hot', 'cold'], ['big', 'small'], ['up', 'down'], ['day', 'night'], ['happy', 'sad'], ['fast', 'slow'], ['wet', 'dry'], ['open', 'shut'], ['in', 'out'], ['tall', 'short'], ['full', 'empty'], ['soft', 'hard']]
    },
    2: {
      'Math Facts': [['8 + 7', '15'], ['9 + 9', '18'], ['14 − 6', '8'], ['20 − 8', '12'], ['6 + 7', '13'], ['17 − 8', '9'], ['30 + 40', '70'], ['50 − 20', '30'], ['8 + 8', '16'], ['9 + 5', '14'], ['11 + 8', '19'], ['25 + 25', '50']],
      'Opposites': [['early', 'late'], ['begin', 'end'], ['heavy', 'light'], ['loud', 'quiet'], ['push', 'pull'], ['near', 'far'], ['clean', 'dirty'], ['asleep', 'awake'], ['strong', 'weak'], ['thick', 'thin'], ['above', 'below'], ['smooth', 'rough']]
    },
    3: {
      'Math Facts': [['6 × 4', '24'], ['7 × 3', '21'], ['8 × 5', '40'], ['9 × 2', '18'], ['56 ÷ 8', '7'], ['36 ÷ 6', '6'], ['4 × 4', '16'], ['45 ÷ 5', '9'], ['3 × 9', '27'], ['6 × 5', '30'], ['7 × 2', '14'], ['24 ÷ 3', '8']],
      'Same Meaning': [['quick', 'fast'], ['large', 'huge'], ['glad', 'happy'], ['begin', 'start'], ['tiny', 'small'], ['shout', 'yell'], ['silent', 'quiet'], ['tired', 'sleepy'], ['smart', 'clever'], ['angry', 'mad'], ['gift', 'present'], ['close', 'shut']]
    },
    4: {
      'Math Facts': [['7 × 8', '56'], ['9 × 6', '54'], ['12 × 4', '48'], ['8 × 8', '64'], ['81 ÷ 9', '9'], ['72 ÷ 6', '12'], ['11 × 7', '77'], ['6 × 7', '42'], ['9 × 4', '36'], ['100 ÷ 4', '25'], ['12 × 5', '60'], ['7 × 5', '35']],
      'Same Meaning': [['brave', 'courageous'], ['enormous', 'gigantic'], ['ancient', 'very old'], ['difficult', 'hard'], ['wealthy', 'rich'], ['fragile', 'delicate'], ['assist', 'help'], ['purchase', 'buy'], ['reply', 'answer'], ['depart', 'leave'], ['rapid', 'speedy'], ['error', 'mistake']]
    },
    5: {
      'Fractions & Decimals': [['1/2', '0.5'], ['1/4', '0.25'], ['3/4', '0.75'], ['1/10', '0.1'], ['1/5', '0.2'], ['2/5', '0.4'], ['7/10', '0.7'], ['1/100', '0.01'], ['3/5', '0.6'], ['9/10', '0.9'], ['4/5', '0.8'], ['3/10', '0.3']],
      'Word Roots': [['tele-', 'far'], ['bio-', 'life'], ['geo-', 'earth'], ['aqua-', 'water'], ['micro-', 'small'], ['photo-', 'light'], ['re-', 'again'], ['un-', 'not'], ['pre-', 'before'], ['tri-', 'three'], ['therm-', 'heat'], ['graph-', 'write']]
    }
  };
  // ----- Prompts page. Bands: a = grades 1 and 2, b = grade 3, c = grades 4 and 5 -----
  TT.gradeBand = function (g) { return g <= 2 ? 'a' : g === 3 ? 'b' : 'c'; };
  TT.PROMPT_SUBJECTS = ['Reading & Writing', 'Math', 'Science', 'Social Studies', 'Just for Fun'];
  TT.WRITING_PROMPTS = {
    a: {
      'Reading & Writing': ['Write about your favorite book. Who is in it?', 'Finish the story: One day my shoe started to talk.', 'Write three sentences about your best friend.', 'Tell about a time you were very brave.'],
      'Math': ['Draw and write about five things you can count in our room.', 'What shapes can you find on the playground? Write about two.', 'Write a story problem about apples.', 'How do you know which number is bigger? Tell how.'],
      'Science': ['What does a plant need to grow? Write and draw.', 'Write about your favorite kind of weather.', 'Pick an animal. Where does it live and what does it eat?', 'What can you do with water? Write three ideas.'],
      'Social Studies': ['Who is a helper in our town? What do they do?', 'Write about a rule that keeps us safe.', 'What makes someone a good friend?', 'Tell about a special day your family celebrates.'],
      'Just for Fun': ['If you had a pet dragon, what would you name it and why?', 'What would you do with one hundred balloons?', 'Invent a new ice cream flavor. What is in it?', 'If toys could talk, what would yours say?']
    },
    b: {
      'Reading & Writing': ['Write a new ending for a story you know well.', 'Describe a character you admire. What makes them special?', 'Write a letter to an author. What would you ask?', 'Tell a story that starts with a strange sound at the door.'],
      'Math': ['Explain how you would share 12 cookies fairly with 3 friends.', 'Where do you use multiplication outside of school?', 'Write a story problem that uses the number 24.', 'Which is easier for you, adding or subtracting? Explain why.'],
      'Science': ['Describe the life cycle of an animal you know.', 'What would happen if there was no friction? Write about your day.', 'Explain to a younger student why we have day and night.', 'Pick a habitat. What lives there and why?'],
      'Social Studies': ['What would you do first if you were mayor of our town?', 'Describe a place in our community that is important to you.', 'Write about someone from history you would like to meet.', 'Why do communities need rules? Give two reasons.'],
      'Just for Fun': ['You wake up and you can fly. Where do you go first?', 'Invent a holiday. How do people celebrate it?', 'Describe the best treehouse ever built.', 'If animals had jobs, what job would a penguin have?']
    },
    c: {
      'Reading & Writing': ['Rewrite a scene from a book from a different character’s point of view.', 'What is the theme of the last book you read? Give evidence.', 'Write a story that begins with the last line: “And that is why I never skip breakfast.”', 'Convince a friend to read your favorite book in one paragraph.'],
      'Math': ['Explain why 1/2 and 2/4 are the same amount. Use a drawing if it helps.', 'Describe a real problem you could solve with multiplication or division.', 'Would you rather have 0.5 or 3/8 of a pizza? Explain your thinking.', 'Write the steps for a math skill so a new student could learn it.'],
      'Science': ['Design an animal that could survive in the desert. Describe its adaptations.', 'Explain what would change on Earth if the Sun were farther away.', 'Describe an experiment you would like to try and what you predict.', 'Why are decomposers important to an ecosystem?'],
      'Social Studies': ['If you could add one amendment to the Constitution, what would it say?', 'Describe a day in the life of a child living 200 years ago.', 'Which of the three branches of government would you want to work in? Why?', 'Write about a person who changed history and how they did it.'],
      'Just for Fun': ['You find a door in the library that was not there yesterday. What happens next?', 'Invent a machine that solves a small everyday problem.', 'You are in charge of school for one day. Describe the schedule.', 'Write a review of a restaurant on the Moon.']
    }
  };
  TT.DISCUSSION_PROMPTS = {
    a: {
      'Reading & Writing': ['What makes a story fun to read?', 'Who is your favorite character and why?', 'What do you do when you get to a tricky word?'],
      'Math': ['How do you know when you have counted everything?', 'Where do you see numbers at home?', 'What is your favorite way to add?'],
      'Science': ['How can you tell if something is alive?', 'Why do we need the Sun?', 'What changes when the seasons change?'],
      'Social Studies': ['What makes our classroom a good place to learn?', 'How can we help someone who feels left out?', 'Why do we take turns?'],
      'Just for Fun': ['What is the best thing about being your age?', 'What would you teach the class if you were the teacher?', 'What makes you laugh the most?']
    },
    b: {
      'Reading & Writing': ['How do pictures help you understand a story?', 'What makes a good beginning to a story?', 'Is it better to read one long book or many short ones?'],
      'Math': ['Is there more than one way to solve a problem? Show how.', 'When is estimating better than counting exactly?', 'Why is it helpful to know your multiplication facts?'],
      'Science': ['What would you put in a time capsule to show how we live?', 'Why do some animals sleep through the winter?', 'How do scientists find out if an idea is true?'],
      'Social Studies': ['What makes a good leader?', 'How is our community different from one far away?', 'What job in our town would be hardest to do without?'],
      'Just for Fun': ['What invention do you wish existed?', 'If our class had a mascot, what should it be?', 'What is one thing everyone should try once?']
    },
    c: {
      'Reading & Writing': ['Can a character be both a hero and make bad choices?', 'How does the setting change a story?', 'Why might two people read the same book and disagree about it?'],
      'Math': ['Is a mistake in math ever useful? How?', 'When would you choose a fraction over a decimal?', 'How do you check an answer without doing the problem again?'],
      'Science': ['Should people explore space or the deep ocean first?', 'What is one way our school could use less energy?', 'How do living things in an ecosystem depend on each other?'],
      'Social Studies': ['Is it ever right to break a rule?', 'What does it mean to be a good citizen?', 'How do we know what really happened long ago?'],
      'Just for Fun': ['What skill do you think will matter most when you grow up?', 'If you could ask any person one question, who and what?', 'What makes something funny?']
    }
  };
  TT.THIS_OR_THAT = [
    ['Reading & Writing', 'Read a mystery', 'Read an adventure'], ['Reading & Writing', 'Write a poem', 'Write a comic'], ['Reading & Writing', 'Read aloud', 'Read silently'], ['Reading & Writing', 'Be the author', 'Be the illustrator'],
    ['Math', 'Add all day', 'Multiply all day'], ['Math', 'Use a number line', 'Use counters'], ['Math', 'Measure the classroom', 'Measure the playground'], ['Math', 'Solve one hard problem', 'Solve ten easy ones'],
    ['Science', 'Explore a rainforest', 'Explore the ocean floor'], ['Science', 'Study the stars', 'Study the bugs'], ['Science', 'Build a robot', 'Grow a garden'], ['Science', 'Be a weather reporter', 'Be a zookeeper'],
    ['Social Studies', 'Visit the past', 'Visit the future'], ['Social Studies', 'Live in the mountains', 'Live by the sea'], ['Social Studies', 'Be the mayor', 'Be a firefighter'], ['Social Studies', 'Draw a map', 'Follow a map'],
    ['Just for Fun', 'Pizza party', 'Ice cream party'], ['Just for Fun', 'Extra recess', 'Extra art time'], ['Just for Fun', 'Fly like a bird', 'Swim like a dolphin'], ['Just for Fun', 'A snow day', 'A beach day'],
    ['Just for Fun', 'A pet dinosaur', 'A pet dragon'], ['Just for Fun', 'Always wear a cape', 'Always wear a crown']
  ];
})();
