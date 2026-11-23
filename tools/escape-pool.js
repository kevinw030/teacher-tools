// More Escape Room questions. Each built-in room picks one question per spot at random from its grade's
// set in tools/escape-grades.js (or tools/puzzles.js for 4th grade) plus the extras here, so replays feel new.
// Lock N belongs to scene spot N, so each list keeps the spot order noted above it.
// P(question, answers separated by |, hint). Answers are matched without capitals, spaces or punctuation.
(function () {
  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function P(q, a, hint) { return { q: q, a: a.split('|').map(norm).filter(function (v, i, all) { return v && all.indexOf(v) === i; }), hint: hint }; }
  window.TT.ESCAPE_POOL = {
    // Spots: Tall Bookshelf, Dusty Book, Pinned Note, Door Keypad, Grandfather Clock
    library: {
      1: [
        [P('The shelf has 7 red books and 3 blue books. How many books are there in all?', '10|ten', 'Start at 7 and count on 3 more.'),
         P('There were 9 books on the shelf. A student took 4 to read. How many books are left?', '5|five', 'Count back 4 from 9.')],
        [P('Unscramble the letters on the dusty book cover: A D E R', 'read', 'You do it with a book. It starts with R.'),
         P('Unscramble the letters on the dusty book cover: G P A E', 'page', 'A book has lots of these. It starts with P.')],
        [P('A note says: “I am yellow and long. You write with me and sharpen me.” What am I?', 'pencil|apencil', 'You use it at your desk every day.'),
         P('A note says: “I have a face and two hands, but no arms or legs.” What am I?', 'clock|aclock', 'Look at the wall. It tells time.')],
        [P('Finish the pattern on the keypad: 1, 2, 3, 4, __', '5|five', 'Count by ones.'),
         P('Finish the pattern on the keypad: 10, 20, 30, 40, __', '50|fifty', 'Count by tens.')],
        [P('The short hand points to 7 and the long hand points to 12. What time is it? (Type it like 4:00)', '700|7|7oclock', 'When the long hand is on the 12, it is “something o’clock”.'),
         P('Library time starts at 10:00 and ends 1 hour later. What time does it end? (Type it like 4:00)', '1100|11|11oclock', 'What number comes after 10?')]
      ],
      2: [
        [P('The shelf has 46 books. The class takes 15 out to read. How many books are still on the shelf?', '31', 'Take away the tens first: 46 − 10 = 36. Then take away 5.'),
         P('One shelf has 28 books and another has 31 books. How many books are on both shelves?', '59', 'Add the tens: 20 + 30. Then add the ones: 8 + 1.')],
        [P('Unscramble the letters on the dusty book cover: T O R Y S', 'story', 'A book tells one. It starts with S.'),
         P('Unscramble the letters on the dusty book cover: D R O W S', 'words', 'Books are full of them. It starts with W.')],
        [P('A note says: “I have a neck but no head. I wear a cap.” What am I?', 'bottle|abottle', 'You drink water from me.'),
         P('A note says: “What gets wetter the more it dries?”', 'towel|atowel', 'You use it after a bath.')],
        [P('Finish the pattern on the keypad: 2, 4, 6, 8, 10, __', '12|twelve', 'Count by twos.'),
         P('Finish the pattern on the keypad: 100, 90, 80, 70, __', '60|sixty', 'Each number is 10 less.')],
        [P('The clock shows 4:30. Pick-up is 30 minutes later. What time is pick-up? (Type it like 4:00)', '500|5|5oclock', '30 minutes after 4:30 is the next hour.'),
         P('The long hand points to 6 and the short hand is between 9 and 10. What time is it? (Type it like 4:30)', '930', 'When the long hand points to 6, it is half past.')]
      ],
      3: [
        [P('The shelf has 5 rows with 7 books in each row. How many books are on the shelf?', '35', 'Multiply 5 × 7, or count by sevens 5 times.'),
         P('The librarian puts 36 books equally on 4 shelves. How many books go on each shelf?', '9|nine', 'Divide 36 by 4. What times 4 makes 36?')],
        [P('Unscramble the letters on the dusty book cover: V E L O N', 'novel', 'A long made-up story. It starts with N.'),
         P('Unscramble the letters on the dusty book cover: T H O R A U', 'author', 'The person who writes a book. It starts with A.')],
        [P('A note says: “I have cities but no houses, rivers but no water, and mountains but no rocks.” What am I?', 'map|amap', 'You use it to find your way.'),
         P('A note says: “What has many keys but cannot open a single door?”', 'piano|apiano', 'You play music on it.')],
        [P('Finish the pattern on the keypad: 6, 12, 18, 24, __', '30|thirty', 'Each number is 6 more than the one before it.'),
         P('Finish the pattern on the keypad: 50, 45, 40, 35, __', '30|thirty', 'Each number is 5 less.')],
        [P('Reading time starts at 10:15 and lasts 30 minutes. What time does it end? (Type it like 4:00)', '1045', 'Add 30 minutes to the 15 minutes.'),
         P('The library opens at 7:00 and closes 9 hours later. What time does it close? (Type it like 4:00)', '400|4|4pm|4oclock', 'Count 9 hours from 7:00. After 12 comes 1.')]
      ],
      4: [
        [P('The shelf has 9 rows with 7 books in each row. How many books are on the shelf?', '63', 'Multiply 9 × 7.'),
         P('The library has 8 shelves with 24 books on each. How many books is that?', '192', 'Break it apart: 8 × 20 = 160 and 8 × 4 = 32.')],
        [P('Unscramble the letters on the dusty book cover: D A N V E T R U E', 'adventure', 'A kind of exciting story. It starts with AD.'),
         P('Unscramble the letters on the dusty book cover: R A C H T E C A R', 'character', 'A person or animal in a story. It starts with CH.')],
        [P('A note says: “The more you take away from me, the bigger I get.” What am I?', 'hole|ahole', 'Think about digging in the sand.'),
         P('A note says: “I go up and down but never move.” What am I?', 'stairs|staircase|steps', 'You climb them to get upstairs.')],
        [P('Finish the pattern on the keypad: 5, 10, 20, 40, __', '80|eighty', 'Each number is double the one before it.'),
         P('Finish the pattern on the keypad: 81, 72, 63, 54, __', '45', 'Each number is 9 less.')],
        [P('Book club starts at 2:45 and lasts 50 minutes. What time does it end? (Type it like 4:00)', '335|335pm', '15 minutes gets you to 3:00. Then add the other 35.'),
         P('The library opens at 8:30 and closes 6 hours later. What time does it close? (Type it like 4:00)', '230|230pm', 'Count 6 hours from 8:30. After 12 comes 1.')]
      ],
      5: [
        [P('The shelf has 14 rows with 12 books in each row. How many books are on the shelf?', '168', '14 × 10 = 140 and 14 × 2 = 28. Add them.'),
         P('The library gets 375 new books and puts them equally on 15 shelves. How many books on each shelf?', '25', 'How many 15s make 375? Try 15 × 25.')],
        [P('Unscramble the letters on the dusty book cover: G R A P H B O I Y', 'biography', 'A true story about someone’s life. It starts with BIO.'),
         P('Unscramble the letters on the dusty book cover: R I N A T A R O R', 'narrator', 'The voice that tells the story. It starts with N.')],
        [P('A note says: “I can be cracked, made, told and played. What am I?”', 'joke|ajoke', 'It makes people laugh.'),
         P('A note says: “What has a head and a tail but no body?”', 'coin|acoin', 'Flip it to decide who goes first.')],
        [P('Finish the pattern on the keypad: 2, 6, 18, 54, __', '162', 'Each number is 3 times the one before it.'),
         P('Finish the pattern on the keypad: 1, 1, 2, 3, 5, 8, __', '13|thirteen', 'Add the two numbers before it.')],
        [P('The clock says 1:25. The library closes at 3:10. How many minutes until it closes?', '105|105minutes', 'From 1:25 to 2:25 is 60 minutes. Then count on to 3:10.'),
         P('A read-a-thon started at 9:40 and lasted 2 hours and 35 minutes. What time did it end? (Type it like 4:00)', '1215|1215pm', 'Two hours after 9:40 is 11:40. Then add 35 minutes.')]
      ]
    },
    // Spots: Main Computer, Fuel Gauge, Radio Decoder, Meal Locker, Big Window
    space: {
      1: [
        [P('Computer: “What do we call the big ball of light we see in the day sky?”', 'sun|thesun', 'It keeps us warm.'),
         P('Computer: “What do astronauts ride into space?”', 'rocket|arocket|spaceship|rocketship|shuttle', 'It blasts off with fire.')],
        [P('The fuel gauge shows 10. The ship uses 3. How much is left?', '7|seven', 'Count back 3 from 10.'),
         P('The tank has 6 units. The crew adds 5 more. How many units now?', '11|eleven', 'Start at 6 and count on 5.')],
        [P('Decode the message (A=1, B=2, C=3 …): 19 – 21 – 14', 'sun', 'The 19th letter is S.'),
         P('Decode the message (A=1, B=2, C=3 …): 19 – 11 – 25', 'sky', 'The 19th letter is S. The 25th letter is Y.')],
        [P('There are 2 astronauts. Each one eats 2 snacks. How many snacks in all?', '4|four', 'Count 2, then 2 more.'),
         P('The locker has 8 juice boxes. The crew drinks 2. How many are left?', '6|six', 'Count back 2 from 8.')],
        [P('Out the window you see the thing that shines at night and changes shape. What is it?', 'moon|themoon', 'Sometimes it looks like a banana. Sometimes it is round.'),
         P('“I twinkle in the night sky. There are too many of me to count.” What am I?', 'star|stars|astar', 'Sing “Twinkle, twinkle, little …”')]
      ],
      2: [
        [P('Computer: “What is the name of the planet we live on?”', 'earth|planetearth', 'It is the third planet from the Sun.'),
         P('Computer: “What pulls things down so they fall to the ground?”', 'gravity', 'It starts with G. There is very little of it in space.')],
        [P('The fuel gauge shows 85. The ship uses 40. How much is left?', '45', 'Take away 4 tens from 85.'),
         P('The tank has 37 units. The crew adds 25. How many units now?', '62', 'Add the tens, then the ones: 30 + 20 and 7 + 5.')],
        [P('Decode the message (A=1, B=2, C=3 …): 19 – 20 – 1 – 18', 'star', 'The 20th letter is T.'),
         P('Decode the message (A=1, B=2, C=3 …): 13 – 1 – 18 – 19', 'mars', 'The 13th letter is M.')],
        [P('There are 3 astronauts. Each one has 5 meals. How many meals in all?', '15|fifteen', 'Count by fives 3 times.'),
         P('The locker has 20 apples. The crew eats 7. How many are left?', '13|thirteen', 'Count back 7 from 20.')],
        [P('“I am the planet with big rings around me.” What am I?', 'saturn', 'It is the sixth planet from the Sun.'),
         P('“I am the biggest planet in our solar system.” What am I?', 'jupiter', 'It has a giant red spot.')]
      ],
      3: [
        [P('Computer: “How many planets are in our solar system?”', '8|eight', 'Mercury, Venus, Earth, Mars … keep counting.'),
         P('Computer: “Which planet is closest to the Sun?”', 'mercury', 'It is the smallest planet too.')],
        [P('The fuel gauge shows 500 units. The trip uses 230. How many are left?', '270', 'Subtract the hundreds, then the tens.'),
         P('The ship burns 6 units of fuel each hour. How much does it burn in 8 hours?', '48', 'Multiply 6 × 8.')],
        [P('Decode the message (A=1, B=2, C=3 …): 15 – 18 – 2 – 9 – 20', 'orbit', 'The 15th letter is O.'),
         P('Decode the message (A=1, B=2, C=3 …): 3 – 15 – 13 – 5 – 20', 'comet', 'The 3rd letter is C.')],
        [P('There are 6 astronauts. Each needs 3 meals a day. How many meals in one day?', '18|eighteen', 'Multiply 6 × 3.'),
         P('The locker has 28 snack bars to share equally among 4 astronauts. How many does each get?', '7|seven', 'Divide 28 by 4.')],
        [P('“I am a space rock that burns up and makes a streak of light in the sky.” What am I?', 'meteor|shootingstar|meteors', 'People call me a shooting star.'),
         P('“Earth spins once on its axis every one of me.” What am I?', 'day|aday|24hours', 'It is 24 hours long.')]
      ],
      4: [
        [P('Computer: “What is the name of the path a planet takes around the Sun?”', 'orbit|anorbit', 'It starts with O.'),
         P('Computer: “Which planet is the hottest in our solar system?”', 'venus', 'It is the second planet. Its thick clouds trap heat.')],
        [P('The fuel gauge shows 2,000 units. The trip uses 1,265. How many will be left?', '735', 'Subtract 1,265 from 2,000.'),
         P('The ship uses 125 units each day. How many units in 6 days?', '750', '6 × 100 = 600 and 6 × 25 = 150.')],
        [P('Decode the message (A=1, B=2, C=3 …): 7 – 1 – 12 – 1 – 24 – 25', 'galaxy', 'The 7th letter is G.'),
         P('Decode the message (A=1, B=2, C=3 …): 16 – 12 – 1 – 14 – 5 – 20', 'planet', 'The 16th letter is P.')],
        [P('There are 5 astronauts. Each needs 3 meals a day for 7 days. How many meals in all?', '105', '5 × 3 = 15 meals a day. Multiply by 7.'),
         P('The locker holds 96 juice pouches, packed 8 to a box. How many boxes?', '12|twelve', 'Divide 96 by 8.')],
        [P('“I am a big ball of ice and dust with a long glowing tail.” What am I?', 'comet|acomet', 'Halley’s is a famous one.'),
         P('“I am the dwarf planet that used to be called the ninth planet.” What am I?', 'pluto', 'It shares its name with a cartoon dog.')]
      ],
      5: [
        [P('Computer: “What force keeps the Moon in orbit around Earth?”', 'gravity', 'It is the same force that makes an apple fall.'),
         P('Computer: “What do we call a group of stars that make a picture in the sky?”', 'constellation|constellations|aconstellation', 'The Big Dipper is part of one.')],
        [P('The tank holds 12,500 units. The trip uses 4,875. How many will be left?', '7625', 'Subtract 4,875 from 12,500.'),
         P('The ship uses 2.5 units of fuel each minute. How much does it use in 40 minutes?', '100', '2.5 × 4 = 10, so 2.5 × 40 = 100.')],
        [P('Decode the message (A=1, B=2, C=3 …): 1 – 19 – 20 – 18 – 15 – 14 – 1 – 21 – 20', 'astronaut', 'The 1st letter is A.'),
         P('Decode the message (A=1, B=2, C=3 …): 19 – 1 – 20 – 5 – 12 – 12 – 9 – 20 – 5', 'satellite', 'The 19th letter is S.')],
        [P('There are 6 astronauts. Each needs 4 meals a day for 15 days. How many meals in all?', '360', '6 × 4 = 24 meals a day. Then 24 × 15.'),
         P('The locker has 252 meals for 7 astronauts. How many meals does each astronaut get?', '36', 'Divide 252 by 7.')],
        [P('“Light from me takes about 8 minutes to reach Earth.” What am I?', 'sun|thesun', 'It is the closest star to Earth.'),
         P('“I am the name for a planet’s trip all the way around the Sun.” What am I?', 'year|ayear|revolution', 'For Earth, it takes about 365 days.')]
      ]
    },
    // Spots: Treasure Map, Carved Sign, Pile of Coins, Talking Parrot, Bottle in the Sand
    pirate: {
      1: [
        [P('The map says: “Walk 4 steps, then 5 more steps.” How many steps in all?', '9|nine', 'Start at 4 and count on 5.'),
         P('The map says: “Walk 12 steps, then go back 2.” How many steps from the start are you?', '10|ten', 'Count back 2 from 12.')],
        [P('Unscramble the word carved in the sign: H I S P', 'ship', 'Pirates sail on it. It starts with S.'),
         P('Unscramble the word carved in the sign: L G O D', 'gold', 'Shiny treasure. It starts with G.')],
        [P('There are 3 gold coins and 4 silver coins. How many coins in all?', '7|seven', 'Count them all together.'),
         P('A pirate had 10 coins and gave away 5. How many are left?', '5|five', 'Count back 5 from 10.')],
        [P('A parrot squawks: “What has an eye but cannot see?”', 'needle|aneedle|storm|hurricane', 'You use it to sew.'),
         P('A parrot squawks: “What can you catch but not throw?”', 'cold|acold', 'Achoo! You might get one in winter.')],
        [P('Which number is bigger? Type it. 18 or 81', '81', 'Look at the tens. 8 tens is more than 1 ten.'),
         P('What number comes right after 29?', '30|thirty', 'After 9 ones, you get a new ten.')]
      ],
      2: [
        [P('The map says: “Walk 30 steps north, then 45 steps east.” How many steps in all?', '75', 'Add the tens, then the ones.'),
         P('The map says: “Walk 50 steps, then 2 times as many.” How many steps is the second walk?', '100', 'Two groups of 50.')],
        [P('Unscramble the word carved in the sign: D A S I N L', 'island', 'Land with water all around. It starts with I.'),
         P('Unscramble the word carved in the sign: H C O R A N', 'anchor', 'It holds the ship in place. It starts with A.')],
        [P('A pirate has 3 bags with 5 coins in each. How many coins?', '15|fifteen', 'Count by fives 3 times.'),
         P('The chest has 64 coins. The captain takes 21. How many are left?', '43', 'Take away 2 tens and 1 one.')],
        [P('A parrot squawks: “What has hands but cannot clap?”', 'clock|aclock|watch', 'It tells time.'),
         P('A parrot squawks: “What has to be broken before you can use it?”', 'egg|anegg', 'You crack it for breakfast.')],
        [P('Which number is the biggest? Type it. 405, 450 or 445', '450', 'All have 4 hundreds. Now compare the tens.'),
         P('What is 10 more than 286?', '296', 'Only the tens digit changes.')]
      ],
      3: [
        [P('The map says: “Walk 8 steps, 6 times.” How many steps in all?', '48', 'Multiply 8 × 6.'),
         P('The map says: “Walk 240 steps north, then 135 steps east.” How many steps in all?', '375', 'Add the hundreds, tens and ones.')],
        [P('Unscramble the word carved in the sign: P A T C I N A', 'captain', 'The boss of the ship. It starts with C.'),
         P('Unscramble the word carved in the sign: S O C P M A S', 'compass', 'It points north. It starts with C.')],
        [P('The crew shares 42 coins equally among 6 pirates. How many coins does each get?', '7|seven', 'Divide 42 by 6.'),
         P('There are 9 bags with 4 coins in each. How many coins?', '36', 'Multiply 9 × 4.')],
        [P('A parrot squawks: “What has a thumb and four fingers but is not alive?”', 'glove|aglove|mitten', 'You wear it when it is cold.'),
         P('A parrot squawks: “What runs but never walks, and has a bank but no money?”', 'river|ariver', 'Boats float on it.')],
        [P('Which fraction is bigger? Type it like 1/2. 1/3 or 1/2', '12|onehalf|half', 'Cut a pizza into 2 pieces or 3 pieces. Which slice is bigger?'),
         P('Round 67 to the nearest ten.', '70|seventy', 'Is 67 closer to 60 or to 70?')]
      ],
      4: [
        [P('The map says: “Walk 125 steps, 4 times.” How many steps in all?', '500', 'Four quarters of 100 make 100. So 4 × 125 = …'),
         P('The map says: “Walk 1,000 steps. You have walked 368.” How many steps are left?', '632', 'Subtract 368 from 1,000.')],
        [P('Unscramble the word carved in the sign: G V O A E Y', 'voyage', 'A long trip by sea. It starts with V.'),
         P('Unscramble the word carved in the sign: S C P A W K R E H I', 'shipwreck', 'A ship that sank. It starts with SHIP.')],
        [P('The crew shares 72 gold coins equally among 9 pirates. How many does each get?', '8|eight', 'Divide 72 by 9.'),
         P('A chest holds 6 bags with 35 coins each. How many coins?', '210', '6 × 30 = 180 and 6 × 5 = 30.')],
        [P('A parrot squawks: “What has many teeth but cannot bite?”', 'comb|acomb|zipper|saw', 'You use it on your hair.'),
         P('A parrot squawks: “The more of me there is, the less you see. What am I?”', 'darkness|dark|fog', 'Turn off the lights and you get me.')],
        [P('Which is the biggest? Type it like 3/4. 1/2, 3/4 or 2/3', '34|threefourths|threequarters', 'Think of them as money: 50 cents, 75 cents and about 67 cents.'),
         P('Which is the smallest? Type the number. 0.6, 0.06 or 0.66', '006|06|.06', 'Think of money: 60 cents, 6 cents or 66 cents.')]
      ],
      5: [
        [P('The map says: “Walk 48 steps, 25 times.” How many steps in all?', '1200', '48 × 100 = 4,800. A quarter of that is 25 × 48.'),
         P('The map shows 3.5 miles to the treasure. You walked 1.75 miles. How many miles are left?', '175|1.75', 'Subtract 1.75 from 3.50.')],
        [P('Unscramble the word carved in the sign: T R A N A V I O N G I', 'navigation', 'Finding your way at sea. It starts with NAV.'),
         P('Unscramble the word carved in the sign: P E T S L E C O E T', 'telescope', 'It makes faraway ships look close. It starts with TEL.')],
        [P('The crew shares 156 gold coins equally among 12 pirates. How many does each get?', '13|thirteen', 'Divide 156 by 12. Try 12 × 13.'),
         P('A pirate has 3/4 of 100 coins. How many coins is that?', '75|seventyfive', 'One fourth of 100 is 25. Three fourths is …')],
        [P('A parrot squawks: “What belongs to you, but other people use it more than you do?”', 'name|yourname|myname', 'People call you by it.'),
         P('A parrot squawks: “I have keys but no locks, space but no room, and you can enter but not go in.” What am I?', 'keyboard|akeyboard', 'You type on it.')],
        [P('Which is the biggest? Type the number. 0.705, 0.75 or 0.7', '075|75|.75', 'Line up the decimal points: 0.705, 0.750, 0.700.'),
         P('Round 4.68 to the nearest tenth.', '47|4.7', 'Look at the hundredths digit. 8 rounds up.')]
      ]
    },
    // Spots: Dinosaur Painting, Giant Skeleton, Fossil Case, Tour Sign, Guard's Flashlight
    museum: {
      1: [
        [P('The guard asks: “Dinosaurs hatched from these. What are they?”', 'eggs|egg', 'Birds come from them too.'),
         P('The guard asks: “Is a dinosaur alive today, yes or no?”', 'no', 'Dinosaurs lived a very long time ago.')],
        [P('The skeleton has 2 big legs and 2 small arms. How many legs and arms in all?', '4|four', 'Count 2 and 2 more.'),
         P('There are 5 skulls on one shelf and 3 on another. How many skulls?', '8|eight', 'Start at 5 and count on 3.')],
        [P('Which word is spelled right? Type it. A) bon  B) bone  C) boen', 'bone|b', 'It ends with a silent E.'),
         P('Which word is spelled right? Type it. A) rok  B) rock  C) roc', 'rock|b', 'It ends with CK.')],
        [P('The tour starts at 2:00 and ends 1 hour later. What time does it end? (Type it like 4:00)', '300|3|3oclock', 'What number comes after 2?'),
         P('The museum opens at 9:00. The short hand points to 9 and the long hand to __. What number?', '12|twelve', 'At o’clock times, the long hand is at the top.')],
        [P('“I am bright and help you see in the dark.” What am I?', 'flashlight|light|aflashlight|lamp', 'The guard is holding me.'),
         P('“I have four legs but I cannot walk. You eat your lunch on me.” What am I?', 'table|atable', 'Your plate sits on top of me.')]
      ],
      2: [
        [P('The guard asks: “What do we call animals that eat only meat?”', 'carnivores|carnivore', 'It starts with “carn”. T. rex was one.'),
         P('The guard asks: “What do we call a person who digs up and studies dinosaur bones?”', 'paleontologist|paleontologists|scientist', 'It starts with “pale”.')],
        [P('A dinosaur has 3 claws on each of its 4 feet. How many claws?', '12|twelve', 'Count by threes 4 times.'),
         P('The skeleton has 26 bones in its tail and 18 in its neck. How many bones in both?', '44', 'Add the tens, then the ones.')],
        [P('Which word is spelled right? Type it. A) skul  B) scull  C) skull', 'skull|c', 'It starts with SK and ends with LL.'),
         P('Which word is spelled right? Type it. A) extinct  B) exstinct  C) extinkt', 'extinct|a', 'It means gone forever.')],
        [P('The tour starts at 11:30 and lasts 30 minutes. What time does it end? (Type it like 4:00)', '1200|12|noon|12oclock', '30 minutes after 11:30 is the next hour.'),
         P('The tour ends at 3:00. It lasted 1 hour. What time did it start? (Type it like 4:00)', '200|2|2oclock', 'Count back 1 hour.')],
        [P('“I have no life, but I can die. I make your flashlight glow.” What am I?', 'battery|abattery|batteries', 'You put me in toys and remotes.'),
         P('“The more you have of me, the less you see.” What am I?', 'darkness|dark', 'Turn off the lights.')]
      ],
      3: [
        [P('The guard asks: “What do we call a living thing that is gone forever, like the dinosaurs?”', 'extinct', 'It starts with “ex”.'),
         P('The guard asks: “Which dinosaur had three horns on its face?”', 'triceratops', 'Its name means “three-horned face”.')],
        [P('One dinosaur has 8 sharp teeth in each of 6 rows. How many teeth?', '48', 'Multiply 8 × 6.'),
         P('The museum has 35 bones to put equally into 5 cases. How many bones in each case?', '7|seven', 'Divide 35 by 5.')],
        [P('Which word is spelled right? Type it. A) skeleton  B) skelaton  C) skeliton', 'skeleton|a', 'It has three E’s.'),
         P('Which word is spelled right? Type it. A) muzeum  B) museum  C) musium', 'museum|b', 'It ends in “eum”.')],
        [P('The tour started at 10:20 and lasted 40 minutes. What time did it end? (Type it like 4:00)', '1100|11|11oclock', '20 minutes + 40 minutes makes an hour.'),
         P('The tour started at 2:45 and lasted 15 minutes. What time did it end? (Type it like 4:00)', '300|3|3pm', '45 + 15 makes a full hour.')],
        [P('“I have a head and a foot, but no body. You sleep on me.” What am I?', 'bed|abed', 'You lie down on it at night.'),
         P('“I am full of holes but still hold water.” What am I?', 'sponge|asponge', 'You use me to wash dishes.')]
      ],
      4: [
        [P('The guard asks: “What do we call the hardened remains of a plant or animal from long ago?”', 'fossil|fossils|afossil', 'It is in the case by the wall.'),
         P('The guard asks: “Which kind of rock is most likely to hold fossils: sedimentary, igneous or metamorphic?”', 'sedimentary', 'It forms in layers of mud and sand.')],
        [P('A stegosaurus had 17 plates on its back. How many plates on 6 stegosauruses?', '102', '6 × 10 = 60 and 6 × 7 = 42.'),
         P('The giant skeleton is 84 feet long. Its tail is 1/4 of that. How many feet long is the tail?', '21|twentyone', 'Divide 84 by 4.')],
        [P('Which word is spelled right? Type it. A) prehistoric  B) prehistorik  C) prehistorick', 'prehistoric|a', 'It ends in “ic”.'),
         P('Which word is spelled right? Type it. A) carnivoar  B) carnivore  C) carnivor', 'carnivore|b', 'It ends with “vore”, like herbivore.')],
        [P('The tour started at 12:40 and lasted 55 minutes. What time did it end? (Type it like 4:00)', '135|135pm', '20 minutes gets you to 1:00. Then add the other 35.'),
         P('The tour ended at 4:10. It lasted 1 hour and 30 minutes. What time did it start? (Type it like 4:00)', '240|240pm', 'Count back 1 hour to 3:10, then 30 minutes more.')],
        [P('“I have a ring but no finger.” What am I?', 'phone|telephone|aphone|bell|doorbell', 'Brrring! Someone is calling.'),
         P('“I can fill a room but take up no space.” What am I?', 'light|air|sound', 'The guard turns me on with a switch.')]
      ],
      5: [
        [P('The guard asks: “The time when dinosaurs lived is called the Mesozoic ___.” Type the missing word.', 'era', 'It is a three-letter word for a long period of time.'),
         P('The guard asks: “Which modern animals are thought to be close relatives of dinosaurs?”', 'birds|bird|chickens', 'They have feathers and lay eggs.')],
        [P('The skeleton has 9 neck bones, 12 back bones and 45 tail bones. How many bones in all?', '66', 'Add 9 + 12 first, then add 45.'),
         P('A long-neck dinosaur weighed 22.5 tons. A T. rex weighed 8.75 tons. How many more tons did the long-neck weigh?', '1375|13.75', 'Subtract 8.75 from 22.50.')],
        [P('Which word is spelled right? Type it. A) paleontologist  B) paleontoligist  C) palentologist', 'paleontologist|a', 'Break it apart: pale – on – tol – o – gist.'),
         P('Which word is spelled right? Type it. A) archaeology  B) archeolagy  C) arkaeology', 'archaeology|a', 'It starts with ARCH and ends with OLOGY.')],
        [P('The museum opens at 9:45 and closes at 5:15. How many hours and minutes is it open? Type it like 6:30', '730', 'From 9:45 to 4:45 is 7 hours. Then count on 30 minutes.'),
         P('The tour started at 11:35 and lasted 1 hour and 50 minutes. What time did it end? (Type it like 4:00)', '125|125pm', 'One hour after 11:35 is 12:35. Then add 50 minutes.')],
        [P('“What can travel around the world while staying in a corner?”', 'stamp|astamp|postagestamp', 'You stick me on a letter.'),
         P('“I have branches, but no fruit, trunk or leaves.” What am I?', 'bank|abank', 'You keep your money in me.')]
      ]
    }
  };
})();
