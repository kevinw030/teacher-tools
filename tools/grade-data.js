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
  // Each prompt is "the prompt || a helper". The helper gives the facts, examples or a sentence starter
  // a student needs to get going, so nobody is stuck because they do not know a word or an idea.
  TT.WRITING_PROMPTS = {
    a: {
      'Reading & Writing': [
        'Write about your favorite book. Who is in it? || The people or animals in a story are called characters. Start with: My favorite book is ___. It is about ___.',
        'Finish the story: One day my shoe started to talk. || Think: What did the shoe say? Was it happy, grumpy or silly? What did you do next?',
        'Write three sentences about your best friend. || You could tell their name, what they look like, and what you like to do together.',
        'Tell about a time you were very brave. || Brave means you did something even though you felt scared. Like the first day of school, a shot at the doctor, or trying a new food.'],
      'Math': [
        'Draw and write about five things you can count in our room. || Examples: 4 windows, 20 chairs, 2 doors. Start with: I counted ___ ___.',
        'What shapes can you find on the playground? Write about two. || Shapes to look for: circle (a ball), square (a window), rectangle (a door), triangle (a roof).',
        'Write a story problem about apples. || A story problem is a little story with numbers. Example: I had 5 apples. I ate 2. How many are left?',
        'How do you know which number is bigger? Tell how. || Pick two numbers, like 7 and 12. You could count up, use a number line, or look at the tens.'],
      'Science': [
        'What does a plant need to grow? Write and draw. || Plants need four things: water, sunlight, air and soil (dirt).',
        'Write about your favorite kind of weather. || Kinds of weather: sunny, rainy, snowy, windy, cloudy. Tell what you like to do in it.',
        'Pick an animal. Where does it live and what does it eat? || Example: A frog lives in a pond and eats bugs. Start with: A ___ lives in ___. It eats ___.',
        'What can you do with water? Write three ideas. || Ideas: drink it, wash with it, swim in it, water plants, cook with it, make ice.'],
      'Social Studies': [
        'Who is a helper in our town? What do they do? || Helpers: firefighter, doctor, nurse, mail carrier, police officer, teacher, bus driver.',
        'Write about a rule that keeps us safe. || Examples: walk in the hall, wear a seat belt, look both ways before you cross the street.',
        'What makes someone a good friend? || A good friend might share, listen, take turns, and help when you are sad.',
        'Tell about a special day your family celebrates. || It could be a birthday, a holiday, or a family dinner. Tell who is there and what you do.'],
      'Just for Fun': [
        'If you had a pet dragon, what would you name it and why? || Tell its name, its color, and one thing you would do together.',
        'What would you do with one hundred balloons? || Ideas: give them away, fill a room, tie them to a chair, make a balloon animal zoo.',
        'Invent a new ice cream flavor. What is in it? || A flavor is how something tastes, like chocolate or strawberry. Give your flavor a name and tell what is mixed in.',
        'If toys could talk, what would yours say? || Pick one toy. Would it thank you, ask to play, or tell a secret?']
    },
    b: {
      'Reading & Writing': [
        'Write a new ending for a story you know well. || The ending is the last part, where the problem gets solved. Pick a story like The Three Little Pigs and change what happens last.',
        'Describe a character you admire. What makes them special? || Admire means you look up to someone. A character is a person or animal in a story. Tell what they do that is brave, kind or smart.',
        'Write a letter to an author. What would you ask? || An author is the person who writes a book. Start with: Dear ___, I read your book ___. I wonder ___.',
        'Tell a story that starts with a strange sound at the door. || Plan it: What was the sound (a scratch, a knock, a hum)? Who or what was there? What happened next?'],
      'Math': [
        'Explain how you would share 12 cookies fairly with 3 friends. || Fairly means everyone gets the same amount. You can draw 12 cookies and pass them out one at a time. That is division.',
        'Where do you use multiplication outside of school? || Multiplication is adding equal groups, like 3 packs of 4 pencils. Think about shopping, sports, cooking or games.',
        'Write a story problem that uses the number 24. || A story problem is a short story with numbers and a question. Example: There are 24 students in 4 equal rows. How many are in each row?',
        'Which is easier for you, adding or subtracting? Explain why. || Adding puts numbers together (8 + 5). Subtracting takes away (13 − 5). Give an example of the one you like.'],
      'Science': [
        'Describe the life cycle of an animal you know. || A life cycle is the stages a living thing goes through. Butterfly: egg, caterpillar, chrysalis, butterfly. Frog: egg, tadpole, froglet, frog.',
        'What would happen if there was no friction? Write about your day. || Friction is the force that slows things down when they rub together. It lets your shoes grip the floor and lets brakes stop a bike.',
        'Explain to a younger student why we have day and night. || Earth spins like a top. The side facing the Sun has day. The side facing away has night. One full spin takes 24 hours.',
        'Pick a habitat. What lives there and why? || A habitat is the place where an animal lives. Examples: desert (hot and dry), ocean, rainforest, arctic (cold and icy), pond.'],
      'Social Studies': [
        'What would you do first if you were mayor of our town? || A mayor is the leader of a town or city. Mayors help with parks, roads, safety and town rules.',
        'Describe a place in our community that is important to you. || A community is the place where people live and work together. Places: library, park, school, store, fire station.',
        'Write about someone from history you would like to meet. || History means the past. Ideas: George Washington, Rosa Parks, Dr. Martin Luther King Jr., Amelia Earhart. What would you ask them?',
        'Why do communities need rules? Give two reasons. || Rules (called laws for a town) keep people safe and help things be fair. Think of traffic lights or taking turns.'],
      'Just for Fun': [
        'You wake up and you can fly. Where do you go first? || Tell where you go, what you see from the sky, and who you bring along.',
        'Invent a holiday. How do people celebrate it? || Celebrate means to do something special. Give your holiday a name, a date, a food and a tradition (something people do every year).',
        'Describe the best treehouse ever built. || Use your five senses. What does it look like? How do you get up? What is inside each room?',
        'If animals had jobs, what job would a penguin have? || Think about what penguins are good at: swimming, sliding, staying cool, standing in line. Explain your choice.']
    },
    c: {
      'Reading & Writing': [
        'Rewrite a scene from a book from a different character’s point of view. || Point of view means who is telling the story. Example: tell The Three Little Pigs as the wolf, using “I” and sharing his thoughts.',
        'What is the theme of the last book you read? Give evidence. || Theme is the lesson or message, like “never give up” or “be yourself.” Evidence is a part of the book that proves it.',
        'Write a story that ends with the line: “And that is why I never skip breakfast.” || Work backward. What went wrong on the day breakfast was skipped? Build up to that last line.',
        'Convince a friend to read your favorite book in one paragraph. || Convince means to change someone’s mind. Give the title, what it is about (no spoilers), and two reasons it is great.'],
      'Math': [
        'Explain why 1/2 and 2/4 are the same amount. Use a drawing if it helps. || These are equivalent fractions: different numbers, same amount. Cut a pizza in 2 and take 1 slice, or cut it in 4 and take 2.',
        'Describe a real problem you could solve with multiplication or division. || Multiplication joins equal groups (6 boxes of 8). Division splits into equal groups (48 shared by 6). Think of money, time or teams.',
        'Would you rather have 0.5 or 3/8 of a pizza? Explain your thinking. || 0.5 is the same as one half, or 4/8. Compare that to 3/8. Which is more?',
        'Write the steps for a math skill so a new student could learn it. || Pick one skill, like rounding or long division. Use order words: first, next, then, last. Add an example.'],
      'Science': [
        'Design an animal that could survive in the desert. Describe its adaptations. || An adaptation is a body part or behavior that helps an animal survive. A camel stores fat in its hump. A fox has big ears to stay cool.',
        'Explain what would change on Earth if the Sun were farther away. || The Sun gives Earth heat and light. Plants use sunlight to make food. Think about temperature, water, plants and animals.',
        'Describe an experiment you would like to try and what you predict. || An experiment is a test to answer a question. A prediction (hypothesis) is your best guess. Example: Do plants grow faster with music?',
        'Why are decomposers important to an ecosystem? || Decomposers break down dead plants and animals. Examples: worms, mushrooms, bacteria. An ecosystem is all the living and nonliving things in one place.'],
      'Social Studies': [
        'If you could add one amendment to the Constitution, what would it say? || The Constitution is the set of rules for the United States. An amendment is a change or addition to it. The first ten are the Bill of Rights, like freedom of speech.',
        'Describe a day in the life of a child living 200 years ago. || In the 1820s there was no electricity, cars or phones. Many children did farm chores, walked to a one-room school and read by candlelight.',
        'Which of the three branches of government would you want to work in? Why? || Legislative (Congress) makes the laws. Executive (the President) carries out the laws. Judicial (the courts and judges) decides what the laws mean.',
        'Write about a person who changed history and how they did it. || Ideas: Abraham Lincoln, Harriet Tubman, Susan B. Anthony, Dr. Martin Luther King Jr., Cesar Chavez. Tell the problem they saw and what they did.'],
      'Just for Fun': [
        'You find a door in the library that was not there yesterday. What happens next? || Plan it: Where does the door lead? Who do you meet? What problem do you have to solve to get back?',
        'Invent a machine that solves a small everyday problem. || Everyday problems: lost socks, a messy desk, a heavy backpack. Tell the machine’s name, how it works, and who would use it.',
        'You are in charge of school for one day. Describe the schedule. || A schedule is a plan for the day with times. Example: 8:00 Morning Meeting, 9:00 ___. Explain why you chose each part.',
        'Write a review of a restaurant on the Moon. || A review tells what was good and bad and gives a rating, like 4 out of 5 stars. Remember, there is very little gravity on the Moon, so things float.']
    }
  };
  TT.DISCUSSION_PROMPTS = {
    a: {
      'Reading & Writing': [
        'What makes a story fun to read? || Think about funny parts, pictures, surprises, or characters you like. Start with: I like stories that ___.',
        'Who is your favorite character and why? || A character is a person or animal in a story. Start with: I like ___ because ___.',
        'What do you do when you get to a tricky word? || Ideas: sound it out, look at the picture, find a small word inside, skip it and come back.'],
      'Math': [
        'How do you know when you have counted everything? || Ideas: touch each thing one time, move it to a new pile, or line things up.',
        'Where do you see numbers at home? || Look for a clock, a phone, a calendar, the TV remote, or the number on your house.',
        'What is your favorite way to add? || Ways to add: count on your fingers, use a number line, draw dots, or count on from the bigger number.'],
      'Science': [
        'How can you tell if something is alive? || Living things grow, need food and water, and can make more of themselves. A dog is alive. A rock is not.',
        'Why do we need the Sun? || The Sun gives us light and keeps us warm. It helps plants grow.',
        'What changes when the seasons change? || The four seasons are winter, spring, summer and fall. Think about the weather, the trees, and the clothes you wear.'],
      'Social Studies': [
        'What makes our classroom a good place to learn? || Think about being kind, listening, sharing, and keeping our room clean.',
        'How can we help someone who feels left out? || Left out means not included. You could ask them to play, sit with them, or say something kind.',
        'Why do we take turns? || Taking turns is fair. Everyone gets a chance and nobody has to wait forever.'],
      'Just for Fun': [
        'What is the best thing about being your age? || Start with: The best thing about being ___ years old is ___.',
        'What would you teach the class if you were the teacher? || It can be anything you are good at: drawing, a game, a sport, or a fact about animals.',
        'What makes you laugh the most? || It could be a joke, a silly face, a pet, or a funny show.']
    },
    b: {
      'Reading & Writing': [
        'How do pictures help you understand a story? || Pictures (illustrations) can show the setting, how a character feels, or something the words do not say.',
        'What makes a good beginning to a story? || A good beginning grabs your attention. It might start with action, a question, or a strange sound.',
        'Is it better to read one long book or many short ones? || There is no wrong answer. Give a reason. Long books have more details. Short books let you try more stories.'],
      'Math': [
        'Is there more than one way to solve a problem? Show how. || Try 6 × 4. You could add 6 + 6 + 6 + 6, draw 6 rows of 4, or skip count by 4s.',
        'When is estimating better than counting exactly? || Estimating is making a smart guess, like “about 50.” It helps when you are in a hurry or do not need the exact number.',
        'Why is it helpful to know your multiplication facts? || Facts like 7 × 8 = 56 help with bigger problems, division, fractions and money. Knowing them saves time.'],
      'Science': [
        'What would you put in a time capsule to show how we live? || A time capsule is a box you seal up for people to open far in the future. Think of a photo, a toy, a lunch menu or a note.',
        'Why do some animals sleep through the winter? || This is called hibernation. Bears, bats and groundhogs do it because food is hard to find in winter.',
        'How do scientists find out if an idea is true? || They ask a question, make a guess (hypothesis), test it with an experiment, and look at what happened.'],
      'Social Studies': [
        'What makes a good leader? || A leader helps a group reach a goal. Good leaders listen, are fair, and help others. Think of a coach, a principal or a mayor.',
        'How is our community different from one far away? || A community is where people live and work together. Think about weather, homes, food, and what people do for fun.',
        'What job in our town would be hardest to do without? || Jobs to think about: doctor, farmer, firefighter, teacher, trash collector, store worker. Give a reason.'],
      'Just for Fun': [
        'What invention do you wish existed? || An invention is something new that someone makes to solve a problem, like the light bulb or the phone.',
        'If our class had a mascot, what should it be? || A mascot is an animal or character that stands for a team, like a tiger or an eagle. Tell why it fits our class.',
        'What is one thing everyone should try once? || It could be a food, a sport, a game, or a place to visit. Give a reason.']
    },
    c: {
      'Reading & Writing': [
        'Can a character be both a hero and make bad choices? || A hero is someone who does brave or good things. Think of a character who helped others but also lied, got angry or broke a rule.',
        'How does the setting change a story? || The setting is where and when a story happens. Imagine the same story on a ship, in a desert, or 100 years ago.',
        'Why might two people read the same book and disagree about it? || Readers bring their own lives and opinions. An opinion is what you think or feel. It is not right or wrong.'],
      'Math': [
        'Is a mistake in math ever useful? How? || A mistake can show you which step went wrong, so you learn it better. Think of a time you fixed an error.',
        'When would you choose a fraction over a decimal? || 1/2 and 0.5 are the same amount. Fractions are common in cooking (1/2 cup). Decimals are common with money ($0.50).',
        'How do you check an answer without doing the problem again? || Ideas: estimate first, use the opposite operation (check 56 ÷ 7 = 8 with 8 × 7), or ask if the answer makes sense.'],
      'Science': [
        'Should people explore space or the deep ocean first? || We have mapped more of the Moon than our own ocean floor. Think about cost, danger, and what we might discover.',
        'What is one way our school could use less energy? || Energy runs lights, heat and computers. Ideas: turn off lights, use sunlight, unplug chargers, close doors.',
        'How do living things in an ecosystem depend on each other? || An ecosystem is all the living and nonliving things in one place. Plants make food, animals eat plants or other animals, and decomposers clean up.'],
      'Social Studies': [
        'Is it ever right to break a rule? || Think of Rosa Parks, who broke an unfair law by keeping her bus seat. Compare that with breaking a rule just because you want to.',
        'What does it mean to be a good citizen? || A citizen is a member of a community or country. Good citizens follow laws, vote when they are adults, help others and respect differences.',
        'How do we know what really happened long ago? || Historians use primary sources (letters, photos and diaries from the time) and artifacts (objects people left behind).'],
      'Just for Fun': [
        'What skill do you think will matter most when you grow up? || A skill is something you learn to do well, like reading, teamwork, solving problems or using technology.',
        'If you could ask any person one question, who and what? || The person can be from today or from history. Tell who, your question, and why you want to know.',
        'What makes something funny? || Think about surprises, silly voices, jokes with two meanings (puns), or things going wrong in a harmless way.']
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
