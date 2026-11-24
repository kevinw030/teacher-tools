// Backgrounds for the Classroom Board. Each "css" value is a CSS background shorthand.
(function () {
  var dots = function (dot, bg, size) { return 'radial-gradient(' + dot + ' 18%, transparent 19%) 0 0/' + size + 'px ' + size + 'px, ' + bg; };
  var grid = function (line, bg, size) { return 'linear-gradient(' + line + ' 1px, transparent 1px) 0 0/' + size + 'px ' + size + 'px, linear-gradient(90deg, ' + line + ' 1px, transparent 1px) 0 0/' + size + 'px ' + size + 'px, ' + bg; };
  var stripes = function (a, b, w) { return 'repeating-linear-gradient(45deg, ' + a + ' 0 ' + w + 'px, ' + b + ' ' + w + 'px ' + (w * 2) + 'px)'; };

  window.TT.BACKGROUNDS = [
    // Real photos (Kevin, 2026-11-24). Public domain / CC0 pictures from Wikimedia Commons, credits in assets/scenes/CREDITS.md.
    // 'thumb' is a tiny copy for the picker so opening it does not download every full photo.
    { group: 'Scenic Photos', items: [
      { id: 'scene-mountain-lake', name: 'Mountain Lake', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/mountain-lake.webp"), #626772', thumb: 'center / cover no-repeat url("/assets/scenes/mountain-lake-thumb.webp"), #626772' },
      { id: 'scene-snowy-peaks', name: 'Snowy Peaks', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/snowy-peaks.webp"), #6f7a96', thumb: 'center / cover no-repeat url("/assets/scenes/snowy-peaks-thumb.webp"), #6f7a96' },
      { id: 'scene-lavender-field', name: 'Lavender Field', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/lavender-field.webp"), #68768b', thumb: 'center / cover no-repeat url("/assets/scenes/lavender-field-thumb.webp"), #68768b' },
      { id: 'scene-lavender-farm', name: 'Lavender Farm', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/lavender-farm.webp"), #545f65', thumb: 'center / cover no-repeat url("/assets/scenes/lavender-farm-thumb.webp"), #545f65' },
      { id: 'scene-desert-stars', name: 'Desert Stars', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/desert-stars.webp"), #124778', thumb: 'center / cover no-repeat url("/assets/scenes/desert-stars-thumb.webp"), #124778' },
      { id: 'scene-starry-forest', name: 'Starry Forest', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/starry-forest.webp"), #273f61', thumb: 'center / cover no-repeat url("/assets/scenes/starry-forest-thumb.webp"), #273f61' },
      { id: 'scene-planet-earth', name: 'Planet Earth', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/planet-earth.webp"), #383b40', thumb: 'center / cover no-repeat url("/assets/scenes/planet-earth-thumb.webp"), #383b40' },
      { id: 'scene-ocean-sunset', name: 'Ocean Sunset', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/ocean-sunset.webp"), #7c5329', thumb: 'center / cover no-repeat url("/assets/scenes/ocean-sunset-thumb.webp"), #7c5329' },
      { id: 'scene-green-mountains', name: 'Green Mountains', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/green-mountains.webp"), #5a7370', thumb: 'center / cover no-repeat url("/assets/scenes/green-mountains-thumb.webp"), #5a7370' },
      { id: 'scene-northern-lights', name: 'Northern Lights', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/northern-lights.webp"), #647b8e', thumb: 'center / cover no-repeat url("/assets/scenes/northern-lights-thumb.webp"), #647b8e' },
      { id: 'scene-aurora-lake', name: 'Aurora Lake', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/aurora-lake.webp"), #3f778e', thumb: 'center / cover no-repeat url("/assets/scenes/aurora-lake-thumb.webp"), #3f778e' },
      { id: 'scene-canyon', name: 'Canyon', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/canyon.webp"), #7b7f84', thumb: 'center / cover no-repeat url("/assets/scenes/canyon-thumb.webp"), #7b7f84' },
      { id: 'scene-autumn-forest', name: 'Autumn Forest', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/autumn-forest.webp"), #5e533c', thumb: 'center / cover no-repeat url("/assets/scenes/autumn-forest-thumb.webp"), #5e533c' }
    ] },
    { group: 'Winter Photos', items: [
      { id: 'scene-snowy-road', name: 'Snowy Road', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/snowy-road.webp"), #7f7f7f', thumb: 'center / cover no-repeat url("/assets/scenes/snowy-road-thumb.webp"), #7f7f7f' },
      { id: 'scene-snowy-valley', name: 'Snowy Valley', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/snowy-valley.webp"), #8e9bad', thumb: 'center / cover no-repeat url("/assets/scenes/snowy-valley-thumb.webp"), #8e9bad' },
      { id: 'scene-frosted-pines', name: 'Frosted Pines', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/frosted-pines.webp"), #707888', thumb: 'center / cover no-repeat url("/assets/scenes/frosted-pines-thumb.webp"), #707888' },
      { id: 'scene-snow-cabin', name: 'Snowy Cabin', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/snow-cabin.webp"), #555c5a', thumb: 'center / cover no-repeat url("/assets/scenes/snow-cabin-thumb.webp"), #555c5a' },
      { id: 'scene-winter-field', name: 'Winter Field', photo: true, dark: false, css: 'center / cover no-repeat url("/assets/scenes/winter-field.webp"), #cbccd0', thumb: 'center / cover no-repeat url("/assets/scenes/winter-field-thumb.webp"), #cbccd0' }
    ] },
    { group: 'Spring and Summer Photos', items: [
      { id: 'scene-tulip-field', name: 'Tulip Field', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/tulip-field.webp"), #9c4c4b', thumb: 'center / cover no-repeat url("/assets/scenes/tulip-field-thumb.webp"), #9c4c4b' },
      { id: 'scene-mountain-meadow', name: 'Mountain Meadow', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/mountain-meadow.webp"), #687772', thumb: 'center / cover no-repeat url("/assets/scenes/mountain-meadow-thumb.webp"), #687772' }
    ] },
    { group: 'Famous Places', items: [
      { id: 'scene-golden-gate-sunset', name: 'Golden Gate Sunset', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/golden-gate-sunset.webp"), #82728d', thumb: 'center / cover no-repeat url("/assets/scenes/golden-gate-sunset-thumb.webp"), #82728d' },
      { id: 'scene-golden-gate', name: 'Golden Gate Bridge', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/golden-gate.webp"), #829eb7', thumb: 'center / cover no-repeat url("/assets/scenes/golden-gate-thumb.webp"), #829eb7' },
      { id: 'scene-paris-dusk', name: 'Paris at Dusk', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/paris-dusk.webp"), #545558', thumb: 'center / cover no-repeat url("/assets/scenes/paris-dusk-thumb.webp"), #545558' },
      { id: 'scene-castle', name: 'Neuschwanstein Castle', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/castle.webp"), #7c828e', thumb: 'center / cover no-repeat url("/assets/scenes/castle-thumb.webp"), #7c828e' },
      { id: 'scene-colosseum', name: 'The Colosseum', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/colosseum.webp"), #556066', thumb: 'center / cover no-repeat url("/assets/scenes/colosseum-thumb.webp"), #556066' },
      { id: 'scene-machu-picchu', name: 'Machu Picchu', photo: true, dark: true, css: 'center / cover no-repeat url("/assets/scenes/machu-picchu.webp"), #6e726b', thumb: 'center / cover no-repeat url("/assets/scenes/machu-picchu-thumb.webp"), #6e726b' }
    ] },
    { group: 'Gradients', items: [
      { id: 'morning', name: 'Warm Morning', css: 'radial-gradient(circle at 10% 8%,#FFE2A6 0%,transparent 52%),radial-gradient(circle at 92% 96%,#FFC3A0 0%,transparent 55%),radial-gradient(circle at 85% 10%,#FFE9D2 0%,transparent 45%),#FBEFDD' },
      { id: 'sky', name: 'Sky', css: 'linear-gradient(135deg,#8EC5FF 0%,#C9B8FF 100%)' },
      { id: 'sunrise', name: 'Sunrise', css: 'linear-gradient(135deg,#FFB38A 0%,#FF8FB1 55%,#C79BFF 100%)' },
      { id: 'meadow', name: 'Meadow', css: 'linear-gradient(135deg,#A8EBC6 0%,#6CCFB0 50%,#4BA3C7 100%)' },
      { id: 'lemon', name: 'Lemonade', css: 'linear-gradient(135deg,#FFF1A8 0%,#FFC987 100%)' },
      { id: 'cotton', name: 'Cotton Candy', css: 'linear-gradient(135deg,#FBC2EB 0%,#A6C1EE 100%)' },
      { id: 'peach', name: 'Peach', css: 'linear-gradient(135deg,#FFECD2 0%,#FCB69F 100%)' },
      { id: 'mint', name: 'Mint', css: 'linear-gradient(135deg,#D4FC79 0%,#96E6A1 100%)' },
      { id: 'lagoon', name: 'Lagoon', css: 'linear-gradient(135deg,#84FAB0 0%,#8FD3F4 100%)' },
      { id: 'berry', name: 'Berry', css: 'linear-gradient(135deg,#F093FB 0%,#F5576C 100%)' },
      { id: 'tropical', name: 'Tropical', css: 'linear-gradient(135deg,#43E97B 0%,#38F9D7 100%)' },
      { id: 'citrus', name: 'Citrus', css: 'linear-gradient(135deg,#F6D365 0%,#FDA085 100%)' },
      { id: 'lilac', name: 'Lilac', css: 'linear-gradient(135deg,#E0C3FC 0%,#8EC5FC 100%)' },
      { id: 'rainbow', name: 'Rainbow', css: 'linear-gradient(120deg,#FF9A9E 0%,#FECF8B 25%,#C2F0A8 50%,#9BD5FF 75%,#D7B5FF 100%)' },
      { id: 'aurora', name: 'Aurora', css: 'radial-gradient(circle at 15% 20%,#7CF5C7 0%,transparent 40%),radial-gradient(circle at 85% 30%,#8FA8FF 0%,transparent 45%),radial-gradient(circle at 50% 90%,#FFA7D1 0%,transparent 45%),#E9F0FF' }
    ] },
    { group: 'Dark', items: [
      { id: 'ocean', name: 'Ocean', dark: true, css: 'linear-gradient(160deg,#1E3A8A 0%,#2563EB 50%,#38BDF8 100%)' },
      { id: 'galaxy', name: 'Galaxy', dark: true, css: 'radial-gradient(circle at 20% 20%,#5B3FD1 0%,transparent 45%),radial-gradient(circle at 80% 70%,#D9469C 0%,transparent 45%),#151033' },
      { id: 'chalk', name: 'Chalkboard', dark: true, css: 'radial-gradient(circle at 50% 40%,#2F5D4E 0%,#1C3B32 100%)' },
      { id: 'night', name: 'Night Sky', dark: true, css: 'radial-gradient(1.5px 1.5px at 20% 30%,#fff 50%,transparent 51%) 0 0/120px 120px,radial-gradient(1px 1px at 70% 60%,#fff 50%,transparent 51%) 0 0/90px 90px,radial-gradient(2px 2px at 50% 80%,#FFF3B0 50%,transparent 51%) 0 0/170px 170px,linear-gradient(180deg,#0B1030 0%,#27306B 100%)' },
      { id: 'forest', name: 'Forest', dark: true, css: 'linear-gradient(160deg,#134E4A 0%,#166534 60%,#3F6212 100%)' },
      { id: 'midnight', name: 'Midnight', dark: true, css: 'linear-gradient(135deg,#232526 0%,#414345 100%)' },
      { id: 'plum', name: 'Plum', dark: true, css: 'linear-gradient(135deg,#4A1D6E 0%,#9D3C8F 100%)' },
      { id: 'deepsea', name: 'Deep Sea', dark: true, css: 'linear-gradient(180deg,#0F2027 0%,#203A43 50%,#2C5364 100%)' }
    ] },
    { group: 'Solid Colors', items: [
      { id: 'paper', name: 'Paper', css: '#F4F2EC' },
      { id: 'white', name: 'White', css: '#FFFFFF' },
      { id: 'cloud', name: 'Cloud', css: '#E8EDF5' },
      { id: 'sun', name: 'Sunshine', css: '#FFE07A' },
      { id: 'tangerine', name: 'Tangerine', css: '#FF9F5A' },
      { id: 'blush', name: 'Blush', css: '#FFB3C7' },
      { id: 'lavender', name: 'Lavender', css: '#C9B6FF' },
      { id: 'pool', name: 'Pool', css: '#7CC8FF' },
      { id: 'grass', name: 'Grass', css: '#8EDB8E' },
      { id: 'teal', name: 'Teal', dark: true, css: '#127C7A' },
      { id: 'navy', name: 'Navy', dark: true, css: '#1B2A55' },
      { id: 'charcoal', name: 'Charcoal', dark: true, css: '#2A2D36' }
    ] },
    { group: 'Patterns', items: [
      { id: 'polka', name: 'Polka Dots', css: dots('rgba(255,255,255,.75)', '#FF9EB5', 34) },
      { id: 'dots-blue', name: 'Blue Dots', css: dots('rgba(255,255,255,.6)', '#6FA8FF', 26) },
      { id: 'graph', name: 'Graph Paper', css: grid('rgba(37,99,235,.18)', '#FBFCFF', 28) },
      { id: 'notebook', name: 'Notebook', css: 'linear-gradient(90deg, transparent 72px, rgba(239,68,68,.45) 72px, rgba(239,68,68,.45) 74px, transparent 74px), repeating-linear-gradient(#FFFEF8 0 31px, #BFD6F5 31px 32px)' },
      { id: 'candy', name: 'Candy Stripes', css: stripes('#FFD1DC', '#FFF0F4', 26) },
      { id: 'mint-stripes', name: 'Mint Stripes', css: stripes('#BDF2D5', '#ECFCF3', 26) },
      { id: 'sunny-stripes', name: 'Sunny Stripes', css: stripes('#FFE48A', '#FFF7D6', 30) },
      { id: 'blueprint', name: 'Blueprint', dark: true, css: grid('rgba(255,255,255,.18)', '#1F4FA8', 32) },
      { id: 'checks', name: 'Picnic', css: 'repeating-conic-gradient(#FFB3B3 0 25%, #FFF 0 50%) 0 0/48px 48px' },
      { id: 'confetti', name: 'Confetti', css: 'radial-gradient(circle at 10% 20%,#FF6B6B 0 5px,transparent 6px) 0 0/90px 90px,radial-gradient(circle at 60% 70%,#4D96FF 0 5px,transparent 6px) 0 0/110px 110px,radial-gradient(circle at 80% 30%,#FFD93D 0 6px,transparent 7px) 0 0/130px 130px,radial-gradient(circle at 30% 80%,#6BCB77 0 5px,transparent 6px) 0 0/100px 100px,#FFFDF7' }
    ] },
    { group: 'Seasons', items: [
      { id: 'autumn', name: 'Autumn', css: 'linear-gradient(135deg,#F8B562 0%,#E86F3C 55%,#A63D2C 100%)' },
      { id: 'winter', name: 'Winter', css: 'radial-gradient(circle,#fff 0 3px,transparent 4px) 0 0/60px 60px,radial-gradient(circle,rgba(255,255,255,.8) 0 2px,transparent 3px) 30px 30px/60px 60px,linear-gradient(180deg,#9CC8F0 0%,#DCEBFA 100%)' },
      { id: 'spring', name: 'Spring', css: 'radial-gradient(circle at 20% 30%,#FFC6E0 0%,transparent 35%),radial-gradient(circle at 80% 70%,#C8F5B5 0%,transparent 40%),#FFF7FB' },
      { id: 'summer', name: 'Summer', css: 'linear-gradient(180deg,#5EC8FF 0%,#9EE3FF 55%,#FFE29A 56%,#FFD173 100%)' },
      { id: 'halloween', name: 'Halloween', dark: true, css: 'radial-gradient(circle at 80% 20%,#FFB347 0 60px,transparent 62px),linear-gradient(180deg,#2B1748 0%,#5B2A86 100%)' },
      { id: 'holiday', name: 'Holiday', dark: true, css: 'radial-gradient(circle,#fff 0 2px,transparent 3px) 0 0/48px 48px,linear-gradient(160deg,#B3202E 0%,#7A1420 100%)' },
      { id: 'valentine', name: 'Valentine', css: 'linear-gradient(135deg,#FFD6E0 0%,#FF8FAB 100%)' },
      { id: 'clover', name: 'Spring Green', css: 'linear-gradient(135deg,#C9F7C2 0%,#3FBF6F 100%)' }
    ] }
  ];
})();
