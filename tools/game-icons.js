// Kevin's sticker icons (2026-11-24) on every game tile and Classroom Tools tile: the Games page, the home page and Customize.
// Pictures are in assets/game-icons/<name>.webp (256px). Any tile whose link matches gets its picture in
// place of the line icon. To add one: drop the picture in that folder and add the page name below.
(function () {
  var ART = { 'trivia': 1, 'addition-race': 1, 'subtraction-race': 1, 'trail-race': 'multiplication-race', 'division-race': 1, 'bingo': 1, 'four-in-a-row': 1, 'tic-tac-toe': 1,
    'checkers': 1, 'memory-match': 1, 'word-guess': 1, 'riddle': 1, 'escape-room': 1, 'code-breaker': 1 };
  // Kevin's tool stickers (same day), in assets/tool-icons/.
  var TOOLS = { 'board': 1, 'timer': 1, 'name-picker': 1, 'name-wheel': 1, 'groups': 1, 'sound-level': 1, 'brain-breaks': 1, 'exit-tickets': 1, 'seating': 1, 'fact-fluency': 1,
    'prompts': 1, 'games': 1, 'my-questions': 1, 'morning-meeting': 1, 'schedule': 1, 'jobs': 1, 'points': 1, 'would-you-rather': 1 };
  function idOf(icon) {
    var a = icon.closest('a[href], [data-id], [data-tile]');
    if (!a) return '';
    var v = a.getAttribute('href') || a.getAttribute('data-id') || a.getAttribute('data-tile') || '';
    return v.replace(/^\//, '').replace(/[?#].*$/, '');
  }
  function dress(icon) {
    if (icon.classList.contains('art')) return;
    var id = idOf(icon), f = ART[id], dir = 'game-icons';
    if (!f && TOOLS[id]) { f = 1; dir = 'tool-icons'; }
    if (!f) return;
    icon.classList.add('art');
    icon.innerHTML = '<img src="/assets/' + dir + '/' + (f === 1 ? id : f) + '.webp?v=1" alt="" draggable="false" decoding="async">';
  }
  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches('.tool-icon')) dress(root);
    var list = root.querySelectorAll('.tool-icon');
    for (var i = 0; i < list.length; i++) dress(list[i]);
  }
  function start() {
    scan(document.body);
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) for (var j = 0; j < muts[i].addedNodes.length; j++) scan(muts[i].addedNodes[j]);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
