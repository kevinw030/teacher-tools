// Site shell: pages, home screen, saved links.
(function () {
  var TT = window.TT, h = TT.h;
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Home: date and greeting ----------
  function paintDate() {
    var d = new Date();
    $('dateDay').textContent = d.getDate();
    $('dateWeekday').textContent = d.toLocaleDateString(undefined, { weekday: 'long' });
    $('dateMonth').textContent = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    var hr = d.getHours();
    $('greeting').textContent = hr < 12 ? 'Good morning!' : hr < 17 ? 'Good afternoon!' : 'Good evening!';
    $('wyrDate').textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + ' · Pick a side, then tell a partner why.';
  }
  function paintToday() {
    var q = TT.wyr && TT.wyr.current();
    var box = $('todayQ');
    box.textContent = '';
    if (!q) { box.textContent = 'Add questions to get started.'; return; }
    box.append('Would you rather ', h('span', { class: 'x', text: q[0] }), ' or ', h('span', { class: 'y', text: q[1] }), '?');
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

  // ---------- Full screen buttons on tool pages ----------
  document.querySelectorAll('.js-fs-slot').forEach(function (slot) {
    if (!TT.canFullscreen) return;
    var page = slot.closest('.page');
    slot.append(TT.button('Full screen', { icon: 'expand', onclick: function () { TT.toggleFullscreen(page); } }));
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
    'would-you-rather': function () { return TT.mountWYR($('wyrMount')); }
  };
  var views = document.querySelectorAll('[data-view]:not(a)');
  var titles = { home: 'Teacher Tools', board: 'Classroom Board', timer: 'Timer', 'name-picker': 'Name Picker', groups: 'Group Maker', 'would-you-rather': 'Would You Rather' };

  function route() {
    var name = location.hash.replace('#', '') || 'home';
    if (!titles[name]) name = 'home';
    views.forEach(function (v) { v.hidden = v.getAttribute('data-view') !== name; });
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var on = a.getAttribute('data-view') === name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.body.classList.toggle('board-mode', name === 'board');
    if (!mounted[name] && mounters[name]) mounted[name] = mounters[name]() || {};
    if (mounted[name] && mounted[name].show) mounted[name].show();
    if (name === 'home') paintToday();
    document.title = name === 'home' ? 'Teacher Tools' : titles[name] + ' · Teacher Tools';
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  var shown = new Date().toDateString();
  setInterval(function () {
    if (new Date().toDateString() !== shown) { shown = new Date().toDateString(); paintDate(); paintToday(); }
  }, 60000);

  paintDate();
  paintLinks();
  route();
})();
