// The ED Sidekick mascot. Kevin's artwork (assets/mascot/*.webp) in five poses: stand, wave, point,
// cheer and think. The poses are stacked and cross-faded, and CSS moves the whole character (bob, hop,
// sway, spin), so he feels alive. Use: var m = TT.mascot(); box.append(m); m.mood('cheer', 1800);
// Moods: idle (stands, bobs, and waves or points now and then), wave, point, think, cheer,
// cheer-left, cheer-right, party. A mood with a time goes back to idle afterwards.
(function () {
  var TT = window.TT, h = TT.h;
  var POSES = ['stand', 'wave', 'point', 'cheer', 'think'];
  var POSE_OF = { idle: 'stand', wave: 'wave', point: 'point', think: 'think', cheer: 'cheer', 'cheer-left': 'cheer', 'cheer-right': 'cheer', party: 'cheer' };

  TT.mascot = function (opts) {
    opts = opts || {};
    var body = h('span', { class: 'mascot-body' }, POSES.map(function (p) {
      return h('img', { class: 'mascot-pose m-' + p, src: 'assets/mascot/' + p + '.webp', alt: '', draggable: 'false', decoding: 'async' });
    }));
    var el = h('span', { class: 'mascot', 'aria-hidden': 'true' }, h('span', { class: 'mascot-shadow' }), body);
    var back = 0, idle = 0, turn = 0;
    function set(mood) {
      el.setAttribute('data-mood', mood); el.setAttribute('data-pose', POSE_OF[mood] || 'stand');
      body.classList.remove('pop'); void body.offsetWidth; body.classList.add('pop');
    }
    // While idle he waves, then later points, so he never looks frozen.
    function idleLoop() {
      clearTimeout(idle);
      idle = setTimeout(function () {
        if (!el.isConnected) return;                       // taken off the page: stop the loop
        if (el.getAttribute('data-mood') !== 'idle' || el.offsetParent === null) return idleLoop();
        var act = (turn++ % 2) ? 'point' : 'wave';
        set(act);
        back = setTimeout(function () { if (el.getAttribute('data-mood') === act) { set('idle'); } idleLoop(); }, 1700);
      }, 4200 + Math.random() * 2600);
    }
    el.mood = function (mood, ms) {
      clearTimeout(back);
      set(POSE_OF[mood] ? mood : 'idle');
      if (ms) back = setTimeout(function () { set('idle'); }, ms);
      if (opts.still !== true) idleLoop();
      return el;
    };
    el.mood(opts.mood || 'idle');
    return el;
  };
})();
