// The ED Sidekick mascot. Kevin's artwork (assets/mascot/*.webp) in five poses: stand, wave, point,
// cheer and think. The poses are stacked and swapped, CSS moves the whole character, and a few drawn
// extras (blinking eyelids, sparkle lines, stars, a question mark) are layered on top so he feels alive.
// Use: var m = TT.mascot(); box.append(m); m.mood('cheer', 1800);
// Moods: idle, wave, point, think, cheer, cheer-left, cheer-right, party. A mood with a time goes back
// to idle afterwards. While idle he mostly stands, breathes and blinks; every 7 to 13 seconds he does one
// short act (see ACTS), never the same act twice in a row. m.play('hop') runs one act right away.
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
  // A back view of him typing at a computer, drawn to match the artwork (there is no picture of this pose).
  var WORK = '<svg class="mascot-pose m-work" viewBox="0 0 420 576" aria-hidden="true">' +
    // desk and monitor (he faces them, so they sit behind him)
    // a wooden desk with a drawer unit
    '<rect x="368" y="402" width="98" height="148" rx="8" fill="#A9622F" stroke="#470380" stroke-width="6"/>' +
    '<rect x="380" y="416" width="74" height="52" rx="6" fill="#C87A42" stroke="#7A421C" stroke-width="4"/><rect x="380" y="480" width="74" height="56" rx="6" fill="#C87A42" stroke="#7A421C" stroke-width="4"/>' +
    '<rect x="405" y="436" width="24" height="9" rx="4.5" fill="#FFC233"/><rect x="405" y="503" width="24" height="9" rx="4.5" fill="#FFC233"/>' +
    '<rect x="216" y="404" width="20" height="146" rx="6" fill="#8E4E28" stroke="#470380" stroke-width="6"/>' +
    '<rect x="150" y="380" width="330" height="26" rx="10" fill="#C87A42" stroke="#470380" stroke-width="6"/><rect x="158" y="385" width="314" height="7" rx="3.5" fill="#E7A468"/>' +
    // monitor stand and a mug
    '<ellipse cx="334" cy="378" rx="42" ry="9" fill="#B9A9E8" stroke="#470380" stroke-width="5"/><rect x="322" y="348" width="24" height="30" fill="#B9A9E8" stroke="#470380" stroke-width="5"/>' +
    '<g class="wk-steam" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"><path d="M438 334 q-8 -10 0 -20 q8 -10 0 -20"/><path d="M454 336 q-6 -8 0 -16"/></g>' +
    '<path d="M462 352 h12 a10 10 0 0 1 0 22 h-10" fill="none" stroke="#470380" stroke-width="6"/><rect x="426" y="344" width="40" height="38" rx="7" fill="#FF8FB8" stroke="#470380" stroke-width="5"/>' +
    '<rect x="236" y="186" width="176" height="170" rx="16" fill="#E9E2FF" stroke="#470380" stroke-width="7"/><rect x="250" y="200" width="148" height="128" rx="8" fill="#1B1F5E"/>' +
    '<g class="wk-glow"><rect x="250" y="200" width="148" height="128" rx="8" fill="#7CC8FF" opacity=".18"/></g>' +
    '<g stroke-linecap="round" stroke-width="9" fill="none"><path class="wk-line l1" d="M264 222 h92" stroke="#7CE0C3"/><path class="wk-line l2" d="M264 246 h118" stroke="#FFC233"/><path class="wk-line l3" d="M264 270 h70" stroke="#FF8FB8"/><path class="wk-line l4" d="M264 294 h104" stroke="#9AD8FF"/></g>' +
    '<rect x="236" y="364" width="118" height="17" rx="6" fill="#E9E2FF" stroke="#470380" stroke-width="5"/><path d="M248 372 h94" stroke="#B9A9E8" stroke-width="5" stroke-dasharray="9 6" stroke-linecap="round"/>' +
    // feet, antenna, body from behind
    '<ellipse cx="128" cy="548" rx="46" ry="19" fill="#4A0E8F"/><ellipse cx="218" cy="548" rx="46" ry="19" fill="#4A0E8F"/>' +
    '<g class="wk-ant"><path d="M186 178 C182 120 200 92 240 84" fill="none" stroke="#470380" stroke-width="27" stroke-linecap="round"/><path d="M186 178 C182 120 200 92 240 84" fill="none" stroke="#9748ED" stroke-width="15" stroke-linecap="round"/><circle cx="262" cy="70" r="38" fill="#FFC107" stroke="#470380" stroke-width="7"/></g>' +
    '<path d="M172 150 C254 150 292 250 292 352 C292 468 250 540 172 540 C96 540 54 468 54 352 C54 250 92 150 172 150Z" fill="#9748ED" stroke="#470380" stroke-width="8"/>' +
    '<path d="M96 300 C84 380 96 460 132 506" fill="none" stroke="#8438DA" stroke-width="16" stroke-linecap="round" opacity=".7"/>' +
    // a bit of cheek and his arm reaching to the keys
    '<circle cx="286" cy="300" r="15" fill="#FF7BB5"/>' +
    // from this side only his near arm shows (the other is hidden behind his body)
    '<g class="wk-arm a2"><path d="M196 352 C236 336 276 350 290 372" fill="none" stroke="#470380" stroke-width="42" stroke-linecap="round"/><path d="M196 352 C236 336 276 350 290 372" fill="none" stroke="#9748ED" stroke-width="29" stroke-linecap="round"/><path d="M196 352 C214 344 232 342 248 344" fill="none" stroke="#9748ED" stroke-width="33" stroke-linecap="round"/></g>' +
    '<g class="wk-taps" stroke="#FFC233" stroke-width="8" stroke-linecap="round"><path d="M330 352 l10 -16"/><path d="M352 358 l18 -8"/></g></svg>';
  // The idle routine. [name, pose, how long it lasts, extra]
  var ACTS = [['wave', 'wave', 1900, 'sparks'], ['hop', 'stand', 1300, ''], ['look', 'point', 2000, ''], ['ponder', 'think', 2300, 'ask'],
    ['yay', 'cheer', 1500, 'stars'], ['twirl', 'stand', 1100, ''], ['dance', 'stand', 1900, 'note'], ['peek', 'stand', 1500, ''], ['work', 'work', 6500, '']];

  TT.mascot = function (opts) {
    opts = opts || {};
    var body = h('span', { class: 'mascot-body' }, POSES.map(function (p) {
      return h('img', { class: 'mascot-pose m-' + p, src: 'assets/mascot/' + p + '.webp', alt: '', draggable: 'false', decoding: 'async' });
    }));
    // His gold antenna bulb lights up when he is excited (see .mascot-glow in assets/learn.css).
    body.prepend(h('span', { class: 'mascot-glow halo' })); body.append(h('span', { class: 'mascot-glow shine' }));
    var lids = h('span', { class: 'mascot-lidbox' }); lids.innerHTML = LIDS; body.append(lids);
    var work = h('span', { class: 'mascot-workbox' }); work.innerHTML = WORK; body.append(work);
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
    // Mostly he just stands, breathes and blinks. Every so often he does one act from the list.
    function queue() {
      clearTimeout(next);
      if (opts.still === true) return;
      next = setTimeout(function () {
        if (!el.isConnected) return;                       // taken off the page: stop the loop
        if (el.getAttribute('data-mood') !== 'idle' || el.getAttribute('data-act') || el.offsetParent === null) return queue();
        var pool = ACTS.filter(function (a) { return a[0] !== last; });
        run(pool[Math.floor(Math.random() * pool.length)]);
      }, 7000 + Math.random() * 6000);
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
