// Site shell: pages, home screen, saved links.
(function () {
  var TT = window.TT, h = TT.h;
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Home: date and greeting ----------
  var homeMascot = null, shownScene = '';
  function paintDate() {
    var now = TT.clock(), hr = now.hour;
    $('homeDate').textContent = now.text;
    // No name in the greeting: the home page is often projected for students (Kevin, 2026-11-23).
    // Late at night the window shows a night sky, so the greeting matches it.
    $('greeting').textContent = hr < 5 ? 'Up Late?' : (hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening') + '!';
    // The window shows the teacher's own time of day, and the sill shows the season.
    var season = TT.season ? TT.season() : null, key = TT.dayPhase(hr) + (hr < 12 ? 'a' : 'p') + (season ? season.id : '');
    if (key !== shownScene) { shownScene = key; $('homeWindow').innerHTML = TT.homeWindow(hr, season); }
    if (!homeMascot) {
      homeMascot = TT.mascot({ mood: 'wave' }); $('homeMascot').append(homeMascot);
      setTimeout(function () { homeMascot.mood('idle'); }, 2200);
      // Tap him for a trick, and he reacts when you reach for a button.
      var tricks = ['yay', 'twirl', 'hop', 'work', 'dance', 'peek'], t = 0;
      $('homeMascot').addEventListener('click', function () { homeMascot.play(tricks[t++ % tricks.length]); if (TT.tick) TT.tick(); });
      var open = document.querySelector('.wel-open'), go = $('todayGo');
      if (open) { open.addEventListener('pointerenter', function () { homeMascot.play('yay'); }); open.addEventListener('focus', function () { homeMascot.play('yay'); }); }
      if (go) { go.addEventListener('pointerenter', function () { homeMascot.play('ponder'); }); go.addEventListener('focus', function () { homeMascot.play('ponder'); }); }
    }
    $('wyrDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + ' · Pick a side, then tell a partner why.';
  }
  TT.paintWelcome = function () { paintDate(); };
  if (TT.account && TT.account.onChange) TT.account.onChange(function () { if (!$('view-home').hidden) paintDate(); });
  // The banner keeps today's question a secret until the class has spun for it.
  function paintToday() {
    var q = TT.wyr && TT.wyr.current();
    var box = $('todayQ'), go = $('todayGo'), label = $('todayGoText');
    box.classList.toggle('secret', !q);
    if (!TT.wyr || !TT.wyr.count()) { box.textContent = 'Add questions to get started.'; label.textContent = 'Open'; return; }
    if (!q) {
      box.textContent = 'It’s still a secret. Spin the wheel to find out!';
      label.textContent = 'Spin the Wheel';
      go.onclick = function () { TT.wyr.autoSpin = true; };
      return;
    }
    go.onclick = null; label.textContent = 'Show the Class';
    box.textContent = q[0].charAt(0).toUpperCase() + q[0].slice(1) + ' or ' + q[1] + '?';
  }

  // ---------- My links ----------
  var COLORS = ['var(--cobalt)', 'var(--coral)', 'var(--emerald)', 'var(--rose)', 'var(--violet)', 'var(--amber)'];
  var links = TT.load('links', []);
  function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; } }
  function paintLinks() {
    var box = $('links');
    box.textContent = '';
    if (!links.length) {
      box.append(h('div', { class: 'empty', text: 'No links yet. Add the sites you open every day, like your class page, a reading site or GoNoodle.' }));
      return;
    }
    links.forEach(function (l, i) {
      var rm = h('button', { type: 'button', class: 'remove', 'aria-label': 'Remove ' + l.name, html: TT.icon('close'),
        onclick: function () { links.splice(i, 1); TT.save('links', links); paintLinks(); } });
      var badge = h('span', { class: 'badge', text: (l.name || '?').trim().charAt(0).toUpperCase() });
      badge.style.setProperty('--c', COLORS[i % COLORS.length]);
      box.append(h('div', { class: 'link' },
        h('a', { href: l.url, target: '_blank', rel: 'noopener' }, badge,
          h('span', { class: 'link-text' }, h('span', { class: 'link-name', text: l.name }), h('span', { class: 'link-url', text: hostOf(l.url) }))),
        rm));
    });
  }
  $('addLink').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = $('linkName').value.trim(), url = $('linkUrl').value.trim(), msg = $('linkMsg');
    if (!url) { msg.textContent = 'Type a web address, like gonoodle.com.'; msg.hidden = false; $('linkUrl').focus(); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try { if (!/\./.test(new URL(url).hostname)) throw 0; } catch (e) { msg.textContent = 'That web address doesn’t look right. Try something like gonoodle.com.'; msg.hidden = false; return; }
    links.push({ name: name || hostOf(url), url: url });
    TT.save('links', links);
    msg.hidden = true; $('linkName').value = ''; $('linkUrl').value = '';
    paintLinks();
  });

  // ---------- Games: one card and one page per game ----------
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
  var gameMounters = {}, gameTitles = {}, gameClosers = {};
  (TT.games || []).forEach(function (g) {
    $('gamesList').append(h('a', { class: 'tool c-' + g.color, href: '/' + g.id },
      h('span', { class: 'tool-icon', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + g.icon + '</svg>' }),
      h('h3', { text: g.title }), h('p', { text: g.desc }), h('span', { class: 'go', html: 'Play ' + arrow })));
    var mount = h('section', { class: 'panel' });
    $('gameViews').append(h('main', { class: 'page c-' + g.color, id: 'view-' + g.id, 'data-view': g.id, hidden: true },
      h('header', { class: 'tool-head' },
        h('div', null, h('a', { class: 'btn small', href: '/games', html: TT.icon('back') + '<span>All Games</span>' }), h('h1', { text: g.title }), h('p', { text: g.desc })),
        h('div', { class: 'row js-fs-slot' })),
      mount));
    gameMounters[g.id] = function () { return TT.premium.gate(g.id, mount, g.mount); };
    // Leaving a game closes it out: the page is emptied and any half-finished game is forgotten,
    // so the next visit starts fresh. Scores between rounds, best times and settings are kept.
    gameClosers[g.id] = function () {
      (g.forget || []).forEach(function (k) { TT.save(k, null); });
      mount.textContent = '';
    };
    gameTitles[g.id] = g.title;
  });

  // ---------- Full screen buttons on tool pages ----------
  document.querySelectorAll('.js-fs-slot').forEach(function (slot) {
    if (!TT.canFullscreen) return;
    var page = slot.closest('.page');
    slot.append(TT.button('Full Screen', { icon: 'expand', onclick: function () { TT.toggleFullscreen(page); } }));
  });
  document.addEventListener('fullscreenchange', function () {
    document.querySelectorAll('.page.fs').forEach(function (p) { p.classList.remove('fs'); });
    var el = document.fullscreenElement;
    if (el && el.classList.contains('page')) el.classList.add('fs');
  });

  // ---------- Pages ----------
  var mounted = {};
  var mounters = {
    board: function () { return TT.mountBoard($('view-board')); },
    timer: function () { return TT.mountTimer($('timerMount'), { state: TT.load('timer', {}), onChange: function (d) { TT.save('timer', d); } }); },
    'name-picker': function () { TT.mountRoster($('pickerRoster')); return TT.mountPicker($('pickerMount')); },
    groups: function () { TT.mountRoster($('groupsRoster')); return TT.mountGroups($('groupsMount')); },
    'would-you-rather': function () { return TT.mountWYR($('wyrMount')); },
    pet: function () { return TT.mountPet($('petMount')); },
    'name-wheel': function () { return TT.mountWheel($('wheelMount'), $('wheelSide')); },
    'morning-meeting': function () { return TT.mountMorning($('morningMount')); },
    'brain-breaks': function () { return TT.mountBreaks($('breaksMount')); },
    settings: function () { return TT.mountSettings($('settingsMount')); },
    account: function () { return TT.mountAccount($('accountMount')); },
    owner: function () { return TT.mountOwner($('ownerMount')); },
    'my-questions': function () { return TT.mountCustom($('customMount')); },
    'sound-level': function () { return TT.mountSound($('soundMount')); },
    schedule: function () { return TT.mountSchedule($('scheduleMount')); },
    jobs: function () { return TT.mountJobs($('jobsMount')); },
    points: function () { return TT.mountPoints($('pointsMount')); },
    'exit-tickets': function () { return TT.mountTickets($('ticketsMount')); },
    seating: function () { return TT.premium.gate('seating', $('seatingMount'), TT.mountSeating); },
    'fact-fluency': function () { return TT.mountFluency($('fluencyMount')); },
    bingo: function () { return TT.premium.gate('bingo', $('bingoMount'), TT.mountBingo); },
    prompts: function () { return TT.premium.gate('prompts', $('promptsMount'), TT.mountPrompts); }
  };
  Object.keys(gameMounters).forEach(function (k) { mounters[k] = gameMounters[k]; });
  var views = document.querySelectorAll('[data-view]:not(a)');
  var titles = { home: 'ED Sidekick', board: 'Classroom Board', timer: 'Timer', 'name-picker': 'Name Picker', groups: 'Group Maker', 'would-you-rather': 'Would You Rather', pet: 'Classroom Pet', games: 'Games', 'name-wheel': 'Name Wheel', 'morning-meeting': 'Morning Meeting', 'brain-breaks': 'Brain Breaks', settings: 'Settings', account: 'My Account', owner: 'Owner Dashboard', 'my-questions': 'My Questions', 'sound-level': 'Sound Level', schedule: 'Daily Schedule', jobs: 'Class Jobs', points: 'Class Points', 'exit-tickets': 'Exit Tickets', seating: 'Seating Chart', 'fact-fluency': 'Fact Fluency', prompts: 'Prompts', bingo: 'Class Bingo' };
  Object.keys(gameTitles).forEach(function (k) { titles[k] = gameTitles[k]; });

  // ---------- Menus in the top bar ----------
  var last = null;
  function closeMenus(except) {
    document.querySelectorAll('.nav-menu').forEach(function (m) {
      if (m === except) return;
      m.querySelector('.nav-pop').hidden = true; m.querySelector('.nav-drop').setAttribute('aria-expanded', 'false');
    });
  }
  document.querySelectorAll('.nav-menu').forEach(function (m) {
    var btn = m.querySelector('.nav-drop'), pop = m.querySelector('.nav-pop');
    btn.addEventListener('click', function () { closeMenus(m); pop.hidden = !pop.hidden; btn.setAttribute('aria-expanded', pop.hidden ? 'false' : 'true'); });
    pop.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenus(); });
  });
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest('.nav-menu')) closeMenus(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenus(); });

  TT.pages = titles;
  // The student join page is its own small page (join.html), not part of the teacher's site.
  if (TT.page() === 'join') location.replace('/join' + location.search);
  function route() {
    var name = TT.page();
    if (!titles[name]) name = 'home';
    // Tidy the address: /games/ or /games.html become /games, and unknown pages go home.
    if (location.pathname !== TT.pageUrl(name)) history.replaceState(null, '', TT.pageUrl(name) + location.search + location.hash);
    views.forEach(function (v) { v.hidden = v.getAttribute('data-view') !== name; });
    document.querySelectorAll('.nav a[data-view]').forEach(function (a) {
      var on = a.getAttribute('data-view') === name || (a.getAttribute('data-view') === 'games' && !!gameTitles[name]);
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.nav-menu').forEach(function (m) {
      m.querySelector('.nav-drop').classList.toggle('active', !!m.querySelector('a.active'));
    });
    closeMenus();
    if (last && last !== name && mounted[last] && mounted[last].hide) mounted[last].hide();
    if (last && last !== name && gameClosers[last] && mounted[last]) { gameClosers[last](); delete mounted[last]; }
    last = name;
    document.body.classList.toggle('board-mode', name === 'board');
    if (!mounted[name] && mounters[name]) mounted[name] = mounters[name]() || {};
    if (mounted[name] && mounted[name].show) mounted[name].show();
    if (name === 'home') { paintDate(); paintToday(); if (petMini) petMini.refresh(); }
    document.title = name === 'home' ? 'ED Sidekick' : titles[name] + ' · ED Sidekick';
    window.scrollTo(0, 0);
  }
  window.addEventListener('tt:page', route);
  // Old bookmarks and links like edsidekick.com/#games (or code that still sets location.hash)
  // are moved to the clean address, /games.
  function fromHash() {
    var name = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    if (name && titles[name]) { history.replaceState(null, '', TT.pageUrl(name) + location.search); return true; }
    return false;
  }
  window.addEventListener('hashchange', function () { if (fromHash()) window.dispatchEvent(new Event('tt:page')); });
  fromHash();
  // Links to site pages change the page in place instead of reloading the whole site.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    var path = url.pathname.replace(/^\/+|\/+$/g, ''), name = path || 'home';
    if (!titles[name]) {
      if (url.pathname !== location.pathname || !url.hash) return;
      name = decodeURIComponent(url.hash.replace(/^#\/?/, ''));   // an old-style "#games" link
      if (!titles[name]) return;
    }
    e.preventDefault();
    TT.go(name);
  });

  var shown = new Date().toDateString();
  setInterval(function () {
    if (new Date().toDateString() !== shown) { shown = new Date().toDateString(); paintDate(); paintToday(); }
    else if (!$('view-home').hidden) paintDate();   // keeps the greeting and the window in step with the clock
  }, 60000);

  document.querySelector('.nav-gear').innerHTML = TT.icon('gear');
  $('homeBackup').append(TT.backupControls());
  var petMini = TT.mountPetMini ? TT.mountPetMini($('petMini')) : null;
  paintDate();
  paintLinks();
  route();
})();
