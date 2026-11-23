// Escape Room puzzles by grade level. Every room has one set of five locks for each grade, 1st to 5th.
// The 4th grade set is the original one in tools/puzzles.js. Lock N belongs to scene spot N, so keep
// the order: each puzzle is written to match the thing the class taps on.
// Each lock: q (puzzle), a (accepted answers, lowercase letters and digits only), hint.
(function () {
  var TT = window.TT;
  TT.ESCAPE_GRADES = {
    // Spots: Tall Bookshelf, Dusty Book, Pinned Note, Door Keypad, Grandfather Clock
    library: {
      1: [
        { q: 'The top shelf has 5 books. The bottom shelf has 4 books. How many books are there in all?', a: ['9', 'nine'], hint: 'Start at 5 and count on 4 more: 6, 7, 8 …' },
        { q: 'Unscramble the letters on the dusty book cover: O B K O', a: ['book'], hint: 'You read it. It starts with B.' },
        { q: 'A note says: “I have four legs but I cannot walk. You sit on me to read.” What am I?', a: ['chair', 'achair'], hint: 'There is one at your desk.' },
        { q: 'Finish the pattern on the keypad: 2, 4, 6, 8, __', a: ['10', 'ten'], hint: 'Count by twos.' },
        { q: 'On the clock, the short hand points to 3 and the long hand points to 12. What time is it? (Type it like 4:00)', a: ['300', '3', '3oclock'], hint: 'When the long hand is on the 12, it is “something o’clock”.' }
      ],
      2: [
        { q: 'The shelf has 35 books. The class puts 20 more books on it. How many books are on the shelf now?', a: ['55'], hint: 'Add the tens: 30 + 20. Then add the 5.' },
        { q: 'Unscramble the letters on the dusty book cover: R A Y B R I L', a: ['library'], hint: 'It is the room you are standing in. It starts with L.' },
        { q: 'A note says: “I have a spine but no bones. I have a jacket but no arms.” What am I?', a: ['book', 'abook', 'books'], hint: 'This room is full of them.' },
        { q: 'Finish the pattern on the keypad: 5, 10, 15, 20, __', a: ['25'], hint: 'Count by fives.' },
        { q: 'The clock shows 2:30. Story time starts in 30 minutes. What time does story time start? (Type it like 4:00)', a: ['300', '3', '3pm', '3oclock'], hint: '30 minutes after 2:30 is the next hour.' }
      ],
      3: [
        { q: 'The shelf has 4 rows with 6 books in each row. How many books are on the shelf?', a: ['24'], hint: 'Multiply 4 × 6, or add 6 + 6 + 6 + 6.' },
        { q: 'Unscramble the letters on the dusty book cover: P A R C H E T', a: ['chapter'], hint: 'Long books are split into these. It starts with CH.' },
        { q: 'A note says: “I have keys but no locks. I have space but no room. You use me to type.” What am I?', a: ['keyboard', 'akeyboard', 'computerkeyboard'], hint: 'It is part of a computer.' },
        { q: 'Finish the pattern on the keypad: 4, 8, 12, 16, __', a: ['20'], hint: 'Each number is 4 more than the one before it.' },
        { q: 'The library opens at 8:00 and closes 4 hours later. What time does it close? (Type it like 4:00)', a: ['1200', '12', '12pm', 'noon'], hint: 'Count 4 hours forward from 8:00: 9, 10, 11 …' }
      ],
      5: [
        { q: 'The shelf has 12 rows with 15 books in each row. How many books are on the shelf?', a: ['180'], hint: 'Break it apart: 12 × 10 = 120 and 12 × 5 = 60. Add them.' },
        { q: 'Unscramble the letters on the dusty book cover: T E R U L I A R T E', a: ['literature'], hint: 'It is a word for books, poems and plays. It starts with LIT.' },
        { q: 'A note says: “The more of me you take, the more you leave behind.” What am I?', a: ['footsteps', 'footstep', 'steps', 'afootstep', 'footprints'], hint: 'Think about walking across the floor.' },
        { q: 'Finish the pattern on the keypad: 1, 4, 9, 16, __', a: ['25'], hint: 'These are square numbers: 1 × 1, 2 × 2, 3 × 3, 4 × 4 …' },
        { q: 'The clock says 2:40. The library closes at 4:15. How many minutes until it closes?', a: ['95', '95minutes', '95min'], hint: 'From 2:40 to 3:40 is 60 minutes. Then count on from 3:40 to 4:15.' }
      ]
    },
    // Spots: Main Computer, Fuel Gauge, Radio Decoder, Meal Locker, Big Window
    space: {
      1: [
        { q: 'Computer: “What is the name of the planet we live on?”', a: ['earth', 'theearth', 'planetearth'], hint: 'It starts with E and rhymes with “birth”.' },
        { q: 'The fuel tank has 10 cans of fuel. The trip home uses 4 cans. How many cans will be left?', a: ['6', 'six'], hint: 'Start at 10 and count back 4.' },
        { q: 'Decode the message. Each number is a letter (A=1, B=2, C=3, D=4, E=5): 2 – 5 – 4', a: ['bed'], hint: 'The 2nd letter is B. Astronauts sleep in one.' },
        { q: 'There are 3 astronauts. Each one needs 2 snacks. How many snacks is that in all?', a: ['6', 'six'], hint: 'Add 2 + 2 + 2.' },
        { q: 'Out the window: “I come out at night. Sometimes I look like a circle and sometimes like a banana. What am I?”', a: ['moon', 'themoon', 'amoon'], hint: 'It is in the night sky and it starts with M.' }
      ],
      2: [
        { q: 'Computer: “What do we call a person who travels into space?”', a: ['astronaut', 'astronauts', 'anastronaut'], hint: 'It starts with “astro”.' },
        { q: 'The fuel gauge shows 80 units. The trip home uses 30. How many units will be left?', a: ['50'], hint: 'Think of tens: 8 tens take away 3 tens.' },
        { q: 'Decode the message. Each number is a letter (A=1, B=2, C=3 …): 19 – 20 – 1 – 18', a: ['star'], hint: 'The 19th letter is S. The 1st letter is A.' },
        { q: 'There are 5 astronauts. Each one needs 3 meals today. How many meals is that in all?', a: ['15'], hint: 'Add 3 five times: 3 + 3 + 3 + 3 + 3.' },
        { q: 'Out the window: “I twinkle at night, far away and bright. There are too many of us to count. What am I?”', a: ['star', 'stars', 'astar', 'thestars'], hint: 'There is a song about a little one that twinkles.' }
      ],
      3: [
        { q: 'Computer: “What force pulls things down toward the ground?”', a: ['gravity'], hint: 'It starts with G. It is why a dropped ball falls.' },
        { q: 'The fuel gauge shows 500 units. The trip home uses 240. How many units will be left?', a: ['260'], hint: 'Take away 200 first, then take away 40 more.' },
        { q: 'Decode the message. Each number is a letter (A=1, B=2, C=3 …): 16 – 12 – 1 – 14 – 5 – 20', a: ['planet'], hint: 'The 16th letter is P. Earth is one of these.' },
        { q: 'There are 3 astronauts. Each needs 3 meals a day for 4 days. How many meals is that in all?', a: ['36'], hint: '3 × 3 = 9 meals each day. Now multiply by 4.' },
        { q: 'Out the window: “I have a tail but I am not an animal. I am made of ice and dust, and I fly around the Sun. What am I?”', a: ['comet', 'acomet', 'comets'], hint: 'It starts with C and has a long glowing tail.' }
      ],
      5: [
        { q: 'Computer: “Which planet is the largest in our solar system?”', a: ['jupiter'], hint: 'It is the fifth planet from the Sun and it has a Great Red Spot.' },
        { q: 'The fuel gauge shows 2,500 units. The trip home uses 1,360. How many units will be left?', a: ['1140'], hint: 'Subtract 1,000 first, then 300, then 60.' },
        { q: 'Decode the message. Each number is a letter (A=1, B=2, C=3 …): 7 – 1 – 12 – 1 – 24 – 25', a: ['galaxy'], hint: 'The 7th letter is G. The Milky Way is one.' },
        { q: 'There are 6 astronauts. Each needs 3 meals a day for 14 days. How many meals is that in all?', a: ['252'], hint: '6 × 3 = 18 meals each day. Now multiply 18 × 14.' },
        { q: 'Out the window: “I circle the Earth, but I am not the Moon. People built me, and I help phones find their way. What am I?”', a: ['satellite', 'asatellite', 'satellites'], hint: 'It starts with S. GPS and weather maps use them.' }
      ]
    },
    // Spots: Treasure Map, Carved Sign, Pile of Coins, Talking Parrot, Bottle in the Sand
    pirate: {
      1: [
        { q: 'The map says: “Walk 3 steps north, then 5 steps east.” How many steps is that in all?', a: ['8', 'eight'], hint: 'Start at 5 and count on 3 more.' },
        { q: 'Unscramble the word carved in the sign: P I H S', a: ['ship'], hint: 'Pirates sail on it. It starts with SH.' },
        { q: 'There are 6 gold coins. 2 pirates share them equally. How many coins does each pirate get?', a: ['3', 'three'], hint: 'Give one coin to each pirate, again and again, until the coins are gone.' },
        { q: 'A parrot squawks: “I am yellow and hot. I shine on the beach all day. What am I?”', a: ['sun', 'thesun'], hint: 'It is up in the sky in the daytime.' },
        { q: 'A note in the bottle asks: Which number is the biggest? 7, 12 or 9', a: ['12', 'twelve'], hint: 'Which number comes last when you count?' }
      ],
      2: [
        { q: 'The map says: “Walk 20 steps north, then 15 steps east.” How many steps is that in all?', a: ['35'], hint: 'Add 20 + 10, then add 5 more.' },
        { q: 'Unscramble the word carved in the sign: D I S L A N', a: ['island'], hint: 'It is land with water all around it. It starts with I.' },
        { q: 'The crew has 20 gold coins. They put 5 coins in each bag. How many bags do they fill?', a: ['4', 'four'], hint: 'Count by fives until you reach 20: 5, 10 …' },
        { q: 'A parrot squawks: “I am full of holes, but I still hold water. What am I?”', a: ['sponge', 'asponge'], hint: 'You use it to wash dishes. It starts with SP.' },
        { q: 'A note in the bottle asks: Which number is the biggest? 348, 384 or 438', a: ['438'], hint: 'Look at the hundreds digit first.' }
      ],
      3: [
        { q: 'The map says: “Walk 8 steps north, then 4 times as many steps east.” How many steps east?', a: ['32'], hint: 'Multiply 8 × 4.' },
        { q: 'Unscramble the word carved in the sign: C A P T I N A', a: ['captain'], hint: 'This person is in charge of the ship. It starts with CAP.' },
        { q: 'The crew shares 24 gold coins equally among 6 pirates. How many coins does each pirate get?', a: ['4', 'four'], hint: 'Divide 24 by 6. Think: 6 times what makes 24?' },
        { q: 'A parrot squawks: “What gets wetter the more it dries?”', a: ['towel', 'atowel', 'beachtowel'], hint: 'You use it after you swim.' },
        { q: 'A note in the bottle asks: Which fraction is the biggest? 1/2, 1/4 or 1/8 (Type it like 1/3)', a: ['12', 'onehalf', 'half', 'ahalf'], hint: 'Cutting a pizza into fewer pieces makes each piece bigger.' }
      ],
      5: [
        { q: 'The map says: “Walk 125 steps north, then 4 times as many steps east.” How many steps east?', a: ['500'], hint: 'Multiply 125 × 4. Think: 100 × 4 and 25 × 4.' },
        { q: 'Unscramble the word carved in the sign: D A V U R E N T E', a: ['adventure'], hint: 'It is an exciting journey. It starts with ADV.' },
        { q: 'The crew shares 144 gold coins equally among 12 pirates. How many coins does each pirate get?', a: ['12', 'twelve'], hint: 'Divide 144 by 12. Think: 12 times what makes 144?' },
        { q: 'A parrot squawks: “I have cities but no houses, forests but no trees, and water but no fish. What am I?”', a: ['map', 'amap', 'treasuremap'], hint: 'A pirate uses one to find the treasure.' },
        { q: 'A note in the bottle asks: Which is the biggest? Type the number. 0.6, 0.58 or 0.09', a: ['06', '6', '060', '60'], hint: 'Give them all two decimal places: 0.60, 0.58 and 0.09.' }
      ]
    },
    // Spots: Dinosaur Painting, Giant Skeleton, Fossil Case, Tour Sign, Guard's Flashlight
    museum: {
      1: [
        { q: 'The guard asks: “A baby dinosaur hatched out of what?”', a: ['egg', 'anegg', 'eggs'], hint: 'Baby birds hatch out of one too.' },
        { q: 'One dinosaur skeleton has 4 legs. A second skeleton has 4 legs too. How many legs is that in all?', a: ['8', 'eight'], hint: 'Add 4 + 4.' },
        { q: 'Which word is spelled correctly? Type it. A) bon  B) bone  C) boan', a: ['bone', 'b'], hint: 'It ends with a silent E.' },
        { q: 'The tour starts at 1:00 and ends one hour later. What time does it end? (Type it like 4:00)', a: ['200', '2', '2pm', '2oclock'], hint: 'What number comes after 1 on a clock?' },
        { q: 'Final lock: “I am bright. You turn me on when it is dark. What am I?”', a: ['light', 'alight', 'flashlight', 'aflashlight', 'lamp', 'alamp', 'thelight'], hint: 'The guard is holding one.' }
      ],
      2: [
        { q: 'The guard asks: “What do we call the hard parts inside your body that hold you up? A skeleton is made of them.”', a: ['bones', 'bone'], hint: 'It starts with B. Dogs like to chew on them.' },
        { q: 'A dinosaur skeleton has 4 feet with 3 claws on each foot. How many claws does it have?', a: ['12', 'twelve'], hint: 'Add 3 + 3 + 3 + 3.' },
        { q: 'Which word is spelled correctly? Type it. A) dinasor  B) dinosaur  C) dinosore', a: ['dinosaur', 'b'], hint: 'It ends with “saur”.' },
        { q: 'The tour started at 1:00 and lasted 30 minutes. What time did it end? (Type it like 4:00)', a: ['130', '130pm'], hint: '30 minutes is half an hour. It is half past 1.' },
        { q: 'Final lock: “I copy everything you do, but I never make a sound. I only show up when there is light. What am I?”', a: ['shadow', 'ashadow', 'myshadow', 'yourshadow', 'shadows'], hint: 'Shine a flashlight on your hand and look at the wall.' }
      ],
      3: [
        { q: 'The guard asks: “What do we call animals that eat only meat?”', a: ['carnivores', 'carnivore'], hint: 'It starts with “carn”. A T. rex was one.' },
        { q: 'A dinosaur skeleton has 4 feet with 5 claws on each foot. How many claws does it have?', a: ['20', 'twenty'], hint: 'Multiply 4 × 5.' },
        { q: 'Which word is spelled correctly? Type it. A) skeleton  B) skeliton  C) skelaton', a: ['skeleton', 'a'], hint: 'The middle part is spelled “le”.' },
        { q: 'The tour started at 1:15 and lasted 30 minutes. What time did it end? (Type it like 4:00)', a: ['145', '145pm'], hint: 'Add 30 minutes to 15 minutes.' },
        { q: 'Final lock: “The more of me there is, the less you can see. What am I?”', a: ['darkness', 'dark', 'thedark', 'fog'], hint: 'A flashlight makes it go away.' }
      ],
      5: [
        { q: 'The guard asks: “What do we call an animal that eats both plants and meat?”', a: ['omnivore', 'omnivores', 'anomnivore'], hint: 'It starts with “omni”, which means “all”.' },
        { q: 'A dinosaur skeleton has 4 feet with 3 claws on each foot. The museum has 15 skeletons. How many claws is that altogether?', a: ['180'], hint: 'One skeleton has 4 × 3 = 12 claws. Now multiply 12 × 15.' },
        { q: 'Which word is spelled correctly? Type it. A) paleontologist  B) paliontologist  C) paleontoligist', a: ['paleontologist', 'a'], hint: 'It begins “paleo” and ends “ologist”. It is a scientist who studies fossils.' },
        { q: 'The tour started at 12:50 and lasted 1 hour and 25 minutes. What time did it end? (Type it like 4:00)', a: ['215', '215pm'], hint: 'One hour after 12:50 is 1:50. Then add 25 minutes.' },
        { q: 'Final lock: “I can fill a whole room, but I take up no space. What am I?”', a: ['light', 'thelight', 'alight'], hint: 'It comes out of the guard’s flashlight.' }
      ]
    }
  };
  // The five locks a room uses for a grade (falls back to the room's own set).
  // Each spot picks one question at random from its grade's pool (tools/escape-pool.js adds the extras),
  // so the room is a little different every time the class plays.
  TT.escapeLocks = function (room, grade) {
    if (room.mine) return room.locks;
    var set = TT.ESCAPE_GRADES[room.id], base = (set && set[grade]) || room.locks;
    var pool = TT.ESCAPE_POOL && TT.ESCAPE_POOL[room.id] && TT.ESCAPE_POOL[room.id][grade];
    return base.map(function (L, i) {
      var opts = [L].concat((pool && pool[i]) || []);
      return opts[Math.floor(Math.random() * opts.length)];
    });
  };
})();
