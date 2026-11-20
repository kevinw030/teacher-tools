// Holiday and season themes. The theme follows the calendar (or the choice in Settings) and dresses up
// the home page, Morning Meeting, the Classroom Board backgrounds and the games.
(function () {
  var TT = window.TT, h = TT.h;

  // from/to are [month, day]. The first theme whose range holds today wins.
  var SEASONS = [
    { id: 'newyear', name: 'Happy New Year', from: [1, 1], to: [1, 10], emoji: ['🎉', '✨', '🎆', '🥳', '⭐'], colors: ['#7C5CFF', '#FFC043'], bg: 'linear-gradient(160deg,#1B1147 0%,#3B1E7A 55%,#7B2FA8 100%)', dark: true,
      cards: ['🎉', '✨', '🎆', '🥳', '⭐', '🎈', '🕛', '🎊', '🥂', '📅', '🎇', '🪩'] },
    { id: 'valentine', name: 'Valentine’s Day', from: [2, 1], to: [2, 14], emoji: ['💖', '💌', '🌹', '💕', '🍫'], colors: ['#FF5C8A', '#FFB3C7'], bg: 'linear-gradient(135deg,#FFE0EA 0%,#FFA9C2 100%)',
      cards: ['💖', '💌', '🌹', '💕', '🍫', '🧸', '💝', '🍓', '🎀', '💐', '🍬', '😊'] },
    { id: 'stpat', name: 'St. Patrick’s Day', from: [3, 1], to: [3, 17], emoji: ['☘️', '🌈', '🍀', '🪙', '🎩'], colors: ['#1FB565', '#F5C518'], bg: 'linear-gradient(135deg,#D3F9D0 0%,#5CCB7E 100%)',
      cards: ['☘️', '🌈', '🍀', '🪙', '🎩', '💚', '⭐', '🥔', '🎻', '🧚', '🌟', '🟢'] },
    { id: 'spring', name: 'Spring', from: [3, 18], to: [5, 31], emoji: ['🌷', '🌼', '🐝', '🦋', '🌱'], colors: ['#FF8FB8', '#7CD67A'], bg: 'linear-gradient(160deg,#DFF7FF 0%,#E9FBD8 60%,#FFE3F0 100%)',
      cards: ['🌷', '🌼', '🐝', '🦋', '🌱', '🐣', '🌧️', '🌈', '🐞', '🪺', '🐰', '☂️'] },
    { id: 'summer', name: 'Summer', from: [6, 1], to: [8, 9], emoji: ['☀️', '🌊', '🍉', '🏖️', '🍦'], colors: ['#18B5F0', '#FFC043'], bg: 'linear-gradient(180deg,#58C7FF 0%,#A6E6FF 55%,#FFE7A8 56%,#FFD27A 100%)',
      cards: ['☀️', '🌊', '🍉', '🏖️', '🍦', '🕶️', '🐚', '⛱️', '🏄', '🐠', '🌴', '🍋'] },
    { id: 'school', name: 'Back to School', from: [8, 10], to: [9, 15], emoji: ['✏️', '🍎', '📚', '🎒', '🖍️'], colors: ['#F2643D', '#F5AE14'], bg: 'linear-gradient(135deg,#FFF3C4 0%,#FFD98A 100%)',
      cards: ['✏️', '🍎', '📚', '🎒', '🖍️', '📏', '🚌', '📓', '✂️', '🔔', '🧮', '🌟'] },
    { id: 'fall', name: 'Fall', from: [9, 16], to: [10, 14], emoji: ['🍂', '🍁', '🌰', '🍎', '🧣'], colors: ['#E86F3C', '#F5AE14'], bg: 'linear-gradient(135deg,#FFD9A0 0%,#F09A52 55%,#C9572E 100%)',
      cards: ['🍂', '🍁', '🌰', '🍎', '🧣', '🦊', '🌻', '🐿️', '🥧', '🍄', '🦉', '🌾'] },
    { id: 'halloween', name: 'Halloween', from: [10, 15], to: [10, 31], emoji: ['🎃', '👻', '🦇', '🍬', '🕸️'], colors: ['#FF8A1F', '#8B5CF6'], bg: 'radial-gradient(circle at 82% 18%,#FFC25C 0 54px,transparent 56px),linear-gradient(180deg,#24123F 0%,#4C2278 100%)', dark: true,
      cards: ['🎃', '👻', '🦇', '🍬', '🕸️', '🕷️', '🐈‍⬛', '🧙', '🍭', '🌙', '💀', '🧹'] },
    { id: 'harvest', name: 'Thankful Season', from: [11, 1], to: [11, 30], emoji: ['🦃', '🍂', '🌽', '🥧', '🍁'], colors: ['#D9652B', '#C99A2E'], bg: 'linear-gradient(135deg,#FFE4B8 0%,#EFA65A 55%,#B5562B 100%)',
      cards: ['🦃', '🍂', '🌽', '🥧', '🍁', '🌰', '🍎', '🥔', '🧡', '🌾', '🍗', '🎃'] },
    { id: 'holidays', name: 'Winter Holidays', from: [12, 1], to: [12, 31], emoji: ['❄️', '🎁', '⛄', '🌟', '🕯️'], colors: ['#E0484D', '#22B573'], bg: 'radial-gradient(circle,#fff 0 2px,transparent 3px) 0 0/52px 52px,radial-gradient(circle,rgba(255,255,255,.7) 0 1.5px,transparent 2.5px) 26px 26px/52px 52px,linear-gradient(160deg,#16466B 0%,#0E2A47 100%)', dark: true,
      cards: ['❄️', '🎁', '⛄', '🌟', '🕯️', '🎄', '🧤', '🛷', '🍪', '🔔', '🧦', '☕'] },
    { id: 'winter', name: 'Winter', from: [1, 11], to: [2, 29], emoji: ['❄️', '⛄', '🧤', '☕', '🐧'], colors: ['#4DB8FF', '#9AA8FF'], bg: 'radial-gradient(circle,#fff 0 3px,transparent 4px) 0 0/60px 60px,radial-gradient(circle,rgba(255,255,255,.8) 0 2px,transparent 3px) 30px 30px/60px 60px,linear-gradient(180deg,#8FC1EE 0%,#DCEBFA 100%)',
      cards: ['❄️', '⛄', '🧤', '☕', '🐧', '🧣', '⛸️', '🏔️', '🐻‍❄️', '🛷', '🌨️', '🧊'] }
  ];
  TT.SEASONS = SEASONS;

  function byDate(d) {
    var n = (d.getMonth() + 1) * 100 + d.getDate();
    for (var i = 0; i < SEASONS.length; i++) {
      var s = SEASONS[i];
      if (n >= s.from[0] * 100 + s.from[1] && n <= s.to[0] * 100 + s.to[1]) return s;
    }
    return null;
  }
  // The theme in use right now, or null when themes are switched off.
  TT.season = function () {
    var pick = TT.settings.season || 'auto';
    if (pick === 'off') return null;
    if (pick === 'auto') return byDate(new Date());
    return SEASONS.filter(function (s) { return s.id === pick; })[0] || byDate(new Date());
  };

  // A repeating emoji pattern as a CSS background (the emoji are drawn in a tiny SVG tile).
  function pattern(emoji, base, size) {
    var S = size || 180, spots = [[30, 46, -12, 34], [118, 70, 14, 30], [66, 138, 8, 32], [150, 160, -18, 26]];
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + S + '" height="' + S + '" viewBox="0 0 180 180">' +
      spots.map(function (p, i) { return '<text x="' + p[0] + '" y="' + p[1] + '" font-size="' + p[3] + '" text-anchor="middle" transform="rotate(' + p[2] + ' ' + p[0] + ' ' + p[1] + ')">' + emoji[i % emoji.length] + '</text>'; }).join('') + '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") 0 0/' + S + 'px ' + S + 'px, ' + base;
  }
  TT.seasonPattern = function (s) { return pattern(s.emoji, s.bg.indexOf('radial-gradient(circle,#fff') === 0 ? s.bg.slice(s.bg.lastIndexOf('linear-gradient')) : s.bg); };

  // Classroom Board backgrounds: one for each holiday, plus one that follows the calendar.
  if (TT.BACKGROUNDS) {
    var now = TT.season() || byDate(new Date()) || SEASONS[0];
    TT.BACKGROUNDS.unshift({ group: 'Holidays', items: [{ id: 'auto-season', name: 'Auto: ' + now.name, css: TT.seasonPattern(now), dark: !!now.dark }].concat(
      SEASONS.map(function (s) { return { id: 'hol-' + s.id, name: s.name, css: TT.seasonPattern(s), dark: !!s.dark }; })) });
  }

  // A burst of falling emoji inside an element (used for wins and full jars).
  TT.celebrate = function (el, emoji) {
    if (!el || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var s = TT.season();
    emoji = emoji || (s ? s.emoji.concat(['🎉', '⭐']) : ['🎉', '⭐', '✨', '🎊', '💫']);
    var box = h('div', { class: 'party', 'aria-hidden': 'true' });
    for (var i = 0; i < 28; i++) {
      var e = h('span', { text: emoji[i % emoji.length] });
      e.style.left = Math.random() * 100 + '%';
      e.style.fontSize = 20 + Math.random() * 26 + 'px';
      e.style.animationDelay = Math.random() * 0.9 + 's';
      e.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
      e.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      box.append(e);
    }
    el.append(box);
    setTimeout(function () { box.remove(); }, 4500);
  };

  // Dress up the home page and Morning Meeting.
  var SPOTS = [[4, 12, 34, -14], [22, 78, 26, 10], [44, 6, 24, 18], [58, 84, 30, -8], [72, 14, 28, 12], [90, 70, 36, -16], [97, 8, 22, 6]];
  function decor(s) {
    var box = h('div', { class: 'season-decor', 'aria-hidden': 'true' });
    SPOTS.forEach(function (p, i) {
      var e = h('span', { text: s.emoji[i % s.emoji.length] });
      e.style.left = p[0] + '%'; e.style.top = p[1] + '%'; e.style.fontSize = p[2] + 'px';
      e.style.setProperty('--r', p[3] + 'deg'); e.style.animationDelay = (i * -0.9) + 's';
      box.append(e);
    });
    return box;
  }
  TT.applySeason = function () {
    var s = TT.season(), root = document.documentElement;
    document.querySelectorAll('.season-decor, .season-chip').forEach(function (n) { n.remove(); });
    if (s) root.setAttribute('data-season', s.id); else root.removeAttribute('data-season');
    root.style.setProperty('--season-a', s ? s.colors[0] : 'transparent');
    root.style.setProperty('--season-b', s ? s.colors[1] : 'transparent');
    if (!s) return;
    var hero = document.querySelector('#view-home .hero');
    if (hero) {
      hero.classList.add('seasonal'); hero.prepend(decor(s));
      var p = hero.querySelector('p');
      if (p) p.after(h('span', { class: 'season-chip', text: s.emoji[0] + ' ' + s.name }));
    }
    document.querySelectorAll('.mm-hero').forEach(function (m) { m.prepend(decor(s)); });
  };
  TT.applySeason();
})();
