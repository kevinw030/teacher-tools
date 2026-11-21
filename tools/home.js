// Home page motion: things spring into place when the home page opens and as cards scroll into view.
(function () {
  var root = document.documentElement, home = document.getElementById('view-home');
  if (!home) return;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Cards join in too, so the page builds up from top to bottom.
  var cards = home.querySelectorAll('.tool, .section-head');
  for (var c = 0; c < cards.length; c++) cards[c].setAttribute('data-rise', '');
  root.classList.add('js-rise');

  function land(el, i) {
    if (el.classList.contains('in')) return;
    el.style.setProperty('--i', i);
    el.classList.add('in');
    setTimeout(function () { el.classList.add('done'); el.style.removeProperty('--i'); }, 1000 + i * 70);
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (e) { if (e.isIntersecting) { land(e.target, Math.min(n++, 8)); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -6% 0px' }) : null;

  var net;
  function play() {
    var on = (location.hash.replace('#', '') || 'home') === 'home' || home.hidden === false;
    document.body.classList.toggle('home-mode', !home.hidden);
    if (home.hidden || !on) return;
    var items = home.querySelectorAll('[data-rise]'), scene = home.querySelector('.hero-scene');
    for (var i = 0; i < items.length; i++) { items[i].classList.remove('in', 'done'); if (io) io.unobserve(items[i]); }
    if (scene) scene.classList.remove('in');
    void home.offsetWidth;
    if (scene) scene.classList.add('in');
    for (var j = 0; j < items.length; j++) { if (io && !still) io.observe(items[j]); else land(items[j], 0); }
    // Safety net: never leave anything hidden if the page is not scrolled the usual way.
    clearTimeout(net); net = setTimeout(function () { for (var k = 0; k < items.length; k++) land(items[k], 0); }, 3000);
  }
  window.addEventListener('hashchange', function () { setTimeout(play, 0); });
  play();
})();
