// Trivia Showdown question pools by grade level. Each category lists its questions from easiest to hardest;
// a board picks four of them and keeps that order, so 100 is the easiest and 400 the hardest.
// 4th grade uses the original set in tools/puzzles.js.
(function () {
  var TT = window.TT = window.TT || {};
  TT.TRIVIA_GRADES = {
    1: {
      'Science': [['What do we call frozen water?', 'Ice'], ['Which season is the coldest?', 'Winter'], ['What do we see in the sky during the day that gives us light?', 'The Sun'],
        ['Do plants need water or candy to grow?', 'Water'], ['Which of your five senses do you use with your nose?', 'Smell'], ['What does a caterpillar turn into?', 'A butterfly']],
      'Math': [['What is 2 + 3?', '5'], ['What number comes right after 9?', '10'], ['How many sides does a triangle have?', '3'],
        ['What is 10 − 4?', '6'], ['How many cents is a nickel worth?', '5 cents'], ['Count by tens: 10, 20, 30. What comes next?', '40']],
      'Our World': [['What color means “stop” on a traffic light?', 'Red'], ['Where do you go to borrow books?', 'A library'], ['How many days are in one week?', '7'],
        ['What do we call the big body of salt water where whales live?', 'The ocean'], ['What tool is a drawing that shows where places are?', 'A map'], ['What country do we live in?', 'The United States']],
      'Animals': [['What animal says “moo”?', 'A cow'], ['What baby animal grows up to be a dog?', 'A puppy'], ['Which animal has a very long neck?', 'A giraffe'],
        ['What do bees make?', 'Honey'], ['How many legs does a bird have?', '2'], ['What animal carries its home on its back?', 'A snail (or a turtle)']],
      'Words': [['What letter does “sun” start with?', 'S'], ['Which word rhymes with “cat”: hat or dog?', 'Hat'], ['What is the opposite of “hot”?', 'Cold'],
        ['How many letters are in the alphabet?', '26'], ['What goes at the end of a telling sentence?', 'A period'], ['Which letters are the vowels?', 'A, E, I, O, U (and sometimes Y)']],
      'Holidays & Helpers': [['Who helps put out fires?', 'A firefighter'], ['Who helps you when you are sick?', 'A doctor (or a nurse)'], ['Who brings letters and packages to your home?', 'A mail carrier'],
        ['What are the colors of the American flag?', 'Red, white and blue'], ['On which holiday in November do families give thanks and share a big meal?', 'Thanksgiving'], ['On what holiday do we celebrate America’s birthday with fireworks?', 'The Fourth of July']]
    },
    2: {
      'Science': [['What do we call water falling from the clouds?', 'Rain'], ['What are the four seasons?', 'Winter, spring, summer and fall'], ['What part of a plant grows under the ground?', 'The roots'],
        ['Is ice a solid, a liquid or a gas?', 'A solid'], ['What pulls a ball back down when you throw it up?', 'Gravity'], ['What do we call the place in nature where an animal lives?', 'A habitat']],
      'Math': [['What is 8 + 7?', '15'], ['What is 20 − 8?', '12'], ['How many sides does a rectangle have?', '4'],
        ['How many minutes are in one hour?', '60'], ['How many cents are in one dollar?', '100'], ['What is 45 + 30?', '75']],
      'Geography': [['What is the name of our planet?', 'Earth'], ['What do we call a drawing that shows where places are?', 'A map'], ['What are the four main directions?', 'North, south, east and west'],
        ['What do we call a landform that is taller than a hill?', 'A mountain'], ['On most maps, which direction is at the top?', 'North'], ['What do we call a very large area of land, like North America?', 'A continent']],
      'Animals': [['What do we call a baby cat?', 'A kitten'], ['Which animal has black and white stripes?', 'A zebra'], ['What covers a bird’s body?', 'Feathers'],
        ['What do caterpillars eat?', 'Leaves'], ['How many legs does an insect have?', '6'], ['What do we call animals that eat only plants?', 'Herbivores']],
      'Words': [['What is the opposite of “big”?', 'Small (or little)'], ['Which word is the action word: “The frog jumps”?', 'Jumps'], ['What do we call a word that names a person, place or thing?', 'A noun'],
        ['What two words make the contraction “don’t”?', 'Do not'], ['What is the plural of “fox”?', 'Foxes'], ['What do we call two words joined into one, like “sunshine”?', 'A compound word']],
      'History': [['Who was the first President of the United States?', 'George Washington'], ['What bird is a symbol of the United States?', 'The bald eagle'], ['Which president is on the penny?', 'Abraham Lincoln'],
        ['How many stripes are on the American flag?', '13'], ['What famous statue stands in New York Harbor holding a torch?', 'The Statue of Liberty'], ['Which holiday in January honors a leader who worked for fairness and peace?', 'Martin Luther King Jr. Day']]
    },
    3: {
      'Science': [['What are the three states of matter?', 'Solid, liquid and gas'], ['What part of a plant makes food using sunlight?', 'The leaves'], ['What do we call the remains of plants or animals from long ago found in rock?', 'Fossils'],
        ['What do we call the path Earth takes around the Sun?', 'An orbit'], ['What do we call the stages a living thing goes through as it grows?', 'A life cycle'], ['What force slows down a sliding object?', 'Friction']],
      'Math': [['What is 6 × 4?', '24'], ['How many sides does a pentagon have?', '5'], ['What is 100 − 37?', '63'],
        ['What is 56 ÷ 8?', '7'], ['If you eat half of a pizza, what fraction is left?', 'One half (1/2)'], ['A rectangle is 5 units long and 3 units wide. What is its area?', '15 square units']],
      'Geography': [['How many continents are there?', '7'], ['Which continent is the United States on?', 'North America'], ['What is the largest ocean?', 'The Pacific Ocean'],
        ['What do we call land with water on all sides?', 'An island'], ['Which country is directly south of the United States?', 'Mexico'], ['What imaginary line circles the middle of Earth?', 'The equator']],
      'Animals': [['What do we call a baby frog?', 'A tadpole'], ['Which bird cannot fly but swims very well?', 'A penguin'], ['What is the largest land animal?', 'The African elephant'],
        ['What do we call animals that eat meat?', 'Carnivores'], ['What do bears do when they sleep through the winter?', 'Hibernate'], ['Which group of animals has scales and includes snakes and lizards?', 'Reptiles']],
      'Words': [['What is the plural of “child”?', 'Children'], ['What is a word that means the same as “quick”?', 'Fast (or speedy)'], ['How many syllables are in “butterfly”?', '3'],
        ['What do we call a word that describes a noun?', 'An adjective'], ['What does the prefix “un-” mean, as in “unhappy”?', 'Not'], ['What do we call words with opposite meanings, like “hot” and “cold”?', 'Antonyms']],
      'History': [['What do the stars on the U.S. flag stand for?', 'The 50 states'], ['Which president is on the one-dollar bill?', 'George Washington'], ['What ship brought the Pilgrims to America?', 'The Mayflower'],
        ['What do we call the leader of a city?', 'A mayor'], ['Who gave the “I Have a Dream” speech?', 'Dr. Martin Luther King Jr.'], ['Who refused to give up her bus seat in Montgomery in 1955?', 'Rosa Parks']]
    },
    5: {
      'Science': [['Which planet is known as the Red Planet?', 'Mars'], ['What gas do plants take in from the air?', 'Carbon dioxide'], ['What is the process plants use to make food from sunlight?', 'Photosynthesis'],
        ['What is the largest organ of the human body?', 'The skin'], ['What do we call a combination that can be separated again, like trail mix?', 'A mixture'], ['What is the center of an atom called?', 'The nucleus']],
      'Math': [['What is 12 × 12?', '144'], ['What is 0.5 written as a fraction?', '1/2'], ['What is 3/4 + 1/4?', '1 (one whole)'],
        ['What is 7.5 × 10?', '75'], ['What do we call an angle that is less than 90 degrees?', 'An acute angle'], ['What is the volume of a box that is 2 by 3 by 4 units?', '24 cubic units']],
      'Geography': [['On which continent is Egypt?', 'Africa'], ['Which U.S. state is the largest by area?', 'Alaska'], ['What is the tallest mountain on Earth?', 'Mount Everest'],
        ['What is the largest country in the world by area?', 'Russia'], ['What is the largest hot desert in the world?', 'The Sahara'], ['What do we call the line of longitude at 0 degrees?', 'The prime meridian']],
      'Animals': [['What is the largest animal on Earth?', 'The blue whale'], ['What do we call an animal that eats both plants and animals?', 'An omnivore'], ['Which ocean mammals breathe air through a blowhole?', 'Whales and dolphins'],
        ['What do we call animals that have a backbone?', 'Vertebrates'], ['What do we call a feature that helps an animal survive, like a polar bear’s thick fur?', 'An adaptation'], ['What do we call a living thing that breaks down dead plants and animals?', 'A decomposer']],
      'Words': [['What do we call a word that describes a verb, like “quickly”?', 'An adverb'], ['What is the plural of “cactus”?', 'Cacti (or cactuses)'], ['What do we call a comparison that uses “like” or “as”?', 'A simile'],
        ['What do we call the lesson or message of a story?', 'The theme'], ['What does the root “tele-” mean, as in “telescope”?', 'Far (distant)'], ['What do we call giving human qualities to something that is not human?', 'Personification']],
      'History': [['In what year was the Declaration of Independence signed?', '1776'], ['What war was fought between the North and the South in the United States?', 'The Civil War'], ['Who wrote most of the Declaration of Independence?', 'Thomas Jefferson'],
        ['What are the three branches of the U.S. government?', 'Legislative, executive and judicial'], ['What are the first ten amendments to the Constitution called?', 'The Bill of Rights'], ['Which two explorers led the journey across the Louisiana Purchase starting in 1804?', 'Lewis and Clark']]
    }
  };
})();
