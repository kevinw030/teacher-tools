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

// Every other page springs in when it opens.
(function () {
  var t;
  function enter() {
    var name = location.hash.replace('#', '') || 'home';
    if (name === 'home' || name === 'board') return;
    var pg = document.querySelector('.page:not([hidden])');
    if (!pg || pg.id === 'view-home' || pg.classList.contains('fs')) return;
    pg.classList.remove('page-enter'); void pg.offsetWidth; pg.classList.add('page-enter');
    clearTimeout(t); t = setTimeout(function () { pg.classList.remove('page-enter'); }, 1200);
  }
  window.addEventListener('hashchange', function () { setTimeout(enter, 0); });
  setTimeout(enter, 0);
})();

// An "All Tools" button at the top of every tool page (the same spot as "All Games" on game pages). It goes back to the home page.
(function () {
  var TT = window.TT; if (!TT || !TT.h) return;
  var heads = document.querySelectorAll('main.page > header.tool-head');
  for (var i = 0; i < heads.length; i++) {
    var box = heads[i].firstElementChild;
    if (!box || box.querySelector('a.btn.small')) continue;   // game pages already have "All Games"
    var eyebrow = box.querySelector('.eyebrow');
    var back = TT.h('a', { class: 'btn small back-all', href: '#home', html: TT.icon('back') + '<span>All Tools</span>' });
    if (eyebrow) eyebrow.replaceWith(back); else box.prepend(back);
  }
})();
