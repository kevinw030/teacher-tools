// The ED Sidekick mascot. Kevin's artwork (assets/mascot/*.webp) in five poses: stand, wave, point,
// cheer and think. The poses are stacked and swapped, CSS moves the whole character, and a few drawn
// extras (blinking eyelids, sparkle lines, stars, a question mark) are layered on top so he feels alive.
// Use: var m = TT.mascot(); box.append(m); m.mood('cheer', 1800);
// Moods: idle, wave, point, think, cheer, cheer-left, cheer-right, party. A mood with a time goes back
// to idle afterwards. While idle he runs a routine of short acts (see ACTS) with blinking in between,
// never the same act twice in a row. m.play('hop') runs one act right away.
(function () {
  var TT = window.TT, h = TT.h;
  var POSES = ['stand', 'wave', 'point', 'cheer', 'think'];
  var POSE_OF = { idle: 'stand', wave: 'wave', point: 'point', think: 'think', cheer: 'cheer', 'cheer-left': 'cheer', 'cheer-right': 'cheer', party: 'cheer' };
  // Eyelids for the standing pose, drawn to match the artwork (420 x 576).
  var LIDS = '<svg class="mascot-lids" viewBox="0 0 420 576" aria-hidden="true"><g fill="#9748ED" stroke="#470380" stroke-width="7"><circle cx="165" cy="238" r="42"/><circle cx="252" cy="238" r="42"/></g>' +
    '<path d="M138 240 q27 22 54 0 M225 240 q27 22 54 0" fill="none" stroke="#2A0750" stroke-width="8" stroke-linecap="round"/></svg>';
  // Extras that appear during an act. Positions are percentages of the character's box.
  var FX = {
    sparks: '<svg viewBox="0 0 420 576"><g class="fx-sparks" stroke="#FFC233" stroke-width="11" stroke-linecap="round"><path d="M372 176 l-10 -34"/><path d="M398 190 l14 -30"/><path d="M414 214 l26 -16"/></g></svg>',
    stars: '<svg viewBox="0 0 420 576">' + [[34, 150, 1.7], [388, 110, 2], [14, 330, 1.4], [408, 320, 1.5], [210, 4, 1.8]].map(function (s, i) {
      return '<path class="fx-star" style="animation-delay:' + (i * 0.09) + 's;transform-origin:' + s[0] + 'px ' + s[1] + 'px" transform="translate(' + s[0] + ' ' + s[1] + ') scale(' + s[2] + ')" d="M0 -22 l6 15 l16 1 l-12 10 l4 16 l-14 -9 l-14 9 l4 -16 l-12 -10 l16 -1Z" fill="' + ['#FFC233', '#FF8FB8', '#7CE0C3', '#FFC233', '#fff'][i] + '"/>';
    }).join('') + '</svg>',
    ask: '<svg viewBox="0 0 420 576"><g class="fx-ask"><circle cx="372" cy="150" r="44" fill="#fff"/><circle cx="330" cy="204" r="12" fill="#fff"/><text x="372" y="172" text-anchor="middle" font-size="62" font-weight="900" fill="#6B2FD6" font-family="Gabarito, sans-serif">?</text></g></svg>',
    note: '<svg viewBox="0 0 420 576"><g class="fx-note" fill="#FFC233"><path d="M360 96 v-56 l40 -12 v56" stroke="#FFC233" stroke-width="9" fill="none" stroke-linejoin="round"/><ellipse cx="348" cy="98" rx="15" ry="11"/><ellipse cx="388" cy="86" rx="15" ry="11"/></g></svg>'
  };
  // The idle routine. [name, pose, how long it lasts, extra]
  var ACTS = [['wave', 'wave', 1900, 'sparks'], ['hop', 'stand', 1300, ''], ['look', 'point', 2000, ''], ['ponder', 'think', 2300, 'ask'],
    ['yay', 'cheer', 1500, 'stars'], ['twirl', 'stand', 1100, ''], ['dance', 'stand', 1900, 'note'], ['peek', 'stand', 1500, '']];

  TT.mascot = function (opts) {
    opts = opts || {};
    var body = h('span', { class: 'mascot-body' }, POSES.map(function (p) {
      return h('img', { class: 'mascot-pose m-' + p, src: 'assets/mascot/' + p + '.webp', alt: '', draggable: 'false', decoding: 'async' });
    }));
    var lids = h('span', { class: 'mascot-lidbox' }); lids.innerHTML = LIDS; body.append(lids);
    var fx = h('span', { class: 'mascot-fx' });
    var el = h('span', { class: 'mascot', 'aria-hidden': 'true' }, h('span', { class: 'mascot-shadow' }), body, fx);
    var back = 0, next = 0, last = '';
    function set(mood, act) {
      el.setAttribute('data-mood', mood); el.setAttribute('data-pose', act ? act[1] : (POSE_OF[mood] || 'stand'));
      if (act) el.setAttribute('data-act', act[0]); else el.removeAttribute('data-act');
      fx.innerHTML = act && act[3] ? FX[act[3]] : (mood === 'wave' ? FX.sparks : mood === 'party' || mood.indexOf('cheer') === 0 ? FX.stars : mood === 'think' ? FX.ask : '');
      body.classList.remove('pop'); void body.offsetWidth; body.classList.add('pop');
    }
    function run(act) {
      last = act[0]; set('idle', act);
      clearTimeout(back);
      back = setTimeout(function () { if (el.getAttribute('data-act') === act[0]) set('idle'); queue(); }, act[2]);
    }
    // While idle, do something new every couple of seconds so he never looks frozen.
    function queue() {
      clearTimeout(next);
      if (opts.still === true) return;
      next = setTimeout(function () {
        if (!el.isConnected) return;                       // taken off the page: stop the loop
        if (el.getAttribute('data-mood') !== 'idle' || el.getAttribute('data-act') || el.offsetParent === null) return queue();
        var pool = ACTS.filter(function (a) { return a[0] !== last; });
        run(pool[Math.floor(Math.random() * pool.length)]);
      }, 1500 + Math.random() * 1700);
    }
    el.mood = function (mood, ms) {
      clearTimeout(back);
      set(POSE_OF[mood] ? mood : 'idle');
      if (ms) back = setTimeout(function () { set('idle'); }, ms);
      queue();
      return el;
    };
    el.play = function (name) {
      var act = ACTS.filter(function (a) { return a[0] === name; })[0];
      if (act) { clearTimeout(next); run(act); }
      return el;
    };
    el.mood(opts.mood || 'idle');
    return el;
  };
})();
