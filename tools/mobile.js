// Phone layout: a bottom tab bar, slide-up menus for Daily and Tools, and a back button with the
// page name in the top bar. Everything built here is hidden on computers by assets/mobile.css,
// which only switches it on for phone-sized screens.
(function () {
  var TT = window.TT; if (!TT || !TT.h) return;
  var h = TT.h, nav = document.querySelector('.nav-inner');
  if (!nav) return;

  function svg(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var ICON = {
    home: '<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9"/>',
    board: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
    daily: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    tools: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    games: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.1" fill="currentColor"/><circle cx="15" cy="15" r="1.1" fill="currentColor"/><circle cx="15" cy="9" r="1.1" fill="currentColor"/><circle cx="9" cy="15" r="1.1" fill="currentColor"/>',
    back: '<path d="m14.5 5-7 7 7 7"/>',
    dot: '<circle cx="12" cy="12" r="5"/>'
  };

  // ----- The Daily and Tools lists come straight from the menus the computer version already has -----
  var menus = document.querySelectorAll('.nav-menu'), lists = { daily: [], tools: [] }, where = {};
  function gather(menu, key) {
    if (!menu) return;
    var links = menu.querySelectorAll('.nav-pop a[data-view]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.hidden || a.style.display === 'none') continue;   // switched-off pages stay off
      var view = a.getAttribute('data-view'), tile = document.querySelector('#view-home a.tool[href="#' + view + '"]');
      var ico = tile && tile.querySelector('.tool-icon'), color = tile ? (tile.className.match(/c-[a-z]+/) || ['c-violet'])[0] : 'c-violet';
      lists[key].push({ view: view, label: a.textContent, icon: ico ? ico.innerHTML : svg(ICON.dot), color: color });
      where[view] = key;
    }
  }
  gather(menus[0], 'daily'); gather(menus[1], 'tools');

  // ----- Slide-up sheet -----
  var grid = h('div', { class: 'mob-grid' }), sheetTitle = h('h2', { class: 'mob-sheet-title' });
  var card = h('div', { class: 'mob-card', role: 'dialog', 'aria-modal': 'true' }, h('span', { class: 'mob-grab', 'aria-hidden': 'true' }), sheetTitle, grid);
  var sheet = h('div', { class: 'mob-sheet', 'aria-hidden': 'true' }, h('div', { class: 'mob-shade', onclick: closeSheet }), card);
  var openKey = null;
  function openSheet(key) {
    if (openKey === key) return closeSheet();
    openKey = key;
    sheetTitle.textContent = key === 'daily' ? 'Daily Routines' : 'Classroom Tools';
    grid.textContent = '';
    var now = current();
    lists[key].forEach(function (it, i) {
      var a = h('a', { class: 'mob-item ' + it.color + (it.view === now ? ' on' : ''), href: '#' + it.view, style: '--i:' + i, onclick: closeSheet },
        h('span', { class: 'mob-item-ico', html: it.icon }), h('span', { class: 'mob-item-name', text: it.label }));
      grid.append(a);
    });
    card.style.transform = '';
    sheet.classList.add('open'); sheet.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('mob-lock');
    paintTabs();
  }
  function closeSheet() {
    if (!openKey) return;
    openKey = null; card.style.transform = '';
    sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('mob-lock');
    paintTabs();
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  // Pull the sheet down to close it.
  (function () {
    var y0 = null, dy = 0;
    card.addEventListener('touchstart', function (e) { y0 = card.scrollTop <= 0 ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
    card.addEventListener('touchmove', function (e) {
      if (y0 === null) return;
      dy = Math.max(0, e.touches[0].clientY - y0);
      card.style.transition = 'none'; card.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    card.addEventListener('touchend', function () {
      card.style.transition = '';
      if (dy > 70) closeSheet(); else card.style.transform = '';
      y0 = null; dy = 0;
    });
  })();

  // ----- Bottom tabs -----
  var TABS = [
    { key: 'home', label: 'Home', href: '#home', color: 'c-coral' },
    { key: 'board', label: 'Board', href: '#board', color: 'c-cobalt' },
    { key: 'daily', label: 'Daily', color: 'c-amber' },
    { key: 'tools', label: 'Tools', color: 'c-violet' },
    { key: 'games', label: 'Games', href: '#games', color: 'c-rose' }
  ];
  var bar = h('nav', { class: 'mob-tabs', 'aria-label': 'Sections' });
  TABS.forEach(function (t) {
    var inner = [h('span', { class: 'mob-tab-ico', html: svg(ICON[t.key]) }), h('span', { class: 'mob-tab-name', text: t.label })];
    if (t.href) {
      t.el = h('a', { class: 'mob-tab ' + t.color, href: t.href, onclick: function () {
        closeSheet();
        if (location.hash === t.href || (t.key === 'home' && !location.hash)) window.scrollTo({ top: 0, behavior: 'smooth' });
      } }, inner);
    } else {
      t.el = h('button', { type: 'button', class: 'mob-tab ' + t.color, 'aria-haspopup': 'dialog', onclick: function () { openSheet(t.key); } }, inner);
    }
    bar.append(t.el);
  });

  // ----- Top bar: back button and the page name -----
  var back = h('a', { class: 'mob-back', href: '#home', 'aria-label': 'Back', html: svg(ICON.back) });
  var title = h('span', { class: 'mob-title' });
  nav.insertBefore(title, nav.firstChild); nav.insertBefore(back, title);

  function current() { return location.hash.replace('#', '') || 'home'; }
  function isGame(name) { return (TT.games || []).some(function (g) { return g.id === name; }); }
  function section(name) {
    if (name === 'home' || name === 'board' || name === 'games') return name;
    if (isGame(name)) return 'games';
    return where[name] || '';
  }
  function paintTabs() {
    var sec = openKey || section(current());
    TABS.forEach(function (t) {
      var on = t.key === sec;
      t.el.classList.toggle('on', on);
      if (t.href) { if (on && !openKey) t.el.setAttribute('aria-current', 'page'); else t.el.removeAttribute('aria-current'); }
      else t.el.setAttribute('aria-expanded', openKey === t.key ? 'true' : 'false');
    });
  }
  function paint() {
    var name = current(), parts = document.title.split(' · ');
    var sub = parts.length > 1;                       // every page but Home is "Name · ED Sidekick"
    document.body.classList.toggle('mob-sub', sub);
    title.textContent = sub ? parts[0] : '';
    back.setAttribute('href', isGame(name) ? '#games' : '#home');
    back.setAttribute('aria-label', isGame(name) ? 'Back to All Games' : 'Back to Home');
    closeSheet(); paintTabs();
  }
  window.addEventListener('hashchange', function () { setTimeout(paint, 0); });

  document.body.append(bar, sheet);
  paint();
})();
