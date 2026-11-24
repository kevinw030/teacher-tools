// Customize My Home (Premium): teachers make their own categories on the home page and drag the
// tool and game tiles between them. Tiles always sit in the normal grid, so it stays tidy.
//
// The layout is saved with TT.save('home-layout'), so it goes to the account like everything else
// (and stays in this browser when signed out). Free plans and guests always see the normal layout,
// and the Customize button opens the Premium pop-up. A saved layout is kept if a plan lapses.
//
// New tools added to the site later still show up: anything the saved layout has never seen goes into
// the category it belongs to by default (or a "New Tools" category if that one was deleted).
// New games go to "Tiles Not on Your Home", the same as games on the normal layout.
(function () {
  var TT = window.TT; if (!TT || !TT.h) return;
  var h = TT.h, home = document.getElementById('view-home');
  if (!home) return;
  var KEY = 'home-layout', MAX_CATS = 12, TRAY = '__tray';
  var orig = [].slice.call(home.querySelectorAll('section.home-daily, section.home-tools'));
  if (!orig.length) return;
  var anchor = h('div', { class: 'dash-anchor', hidden: true });
  orig[0].parentNode.insertBefore(anchor, orig[0]);

  // ---------- Every tile the home page can show ----------
  var items = {}, defaults = [];
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
  function colorOf(el) { return (el.className.match(/\bc-[a-z]+/) || ['c-violet'])[0]; }
  orig.forEach(function (sec) {
    var id = sec.classList.contains('home-daily') ? 'daily' : 'tools', p = sec.querySelector('.section-head p');
    var cat = { id: id, name: sec.querySelector('h2').textContent, desc: p ? p.textContent : '', style: id === 'daily' ? 'big' : 'small', items: [] };
    [].forEach.call(sec.querySelectorAll('a.tool'), function (a) {
      var v = (a.getAttribute('href') || '').replace(/^\/+/, '');
      if (!v || items[v]) return;
      a.removeAttribute('data-rise'); a.classList.remove('in', 'done');
      items[v] = { id: v, node: a.cloneNode(true), title: a.querySelector('h3').textContent, color: colorOf(a), home: id };
      cat.items.push(v);
    });
    defaults.push(cat);
    sec.remove();
  });
  (TT.games || []).forEach(function (g) {
    if (items[g.id]) return;
    var a = h('a', { class: 'tool c-' + g.color, href: '/' + g.id },
      h('span', { class: 'tool-icon', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + g.icon + '</svg>' }),
      h('h3', { text: g.title }), h('p', { text: g.desc }), h('span', { class: 'go', html: 'Play ' + arrow }));
    items[g.id] = { id: g.id, node: a, title: g.title, color: 'c-' + g.color, home: 'games' };
  });
  // Switched-off pages (the Classroom Pet) never show.
  function ok(id) { return !!items[id] && !(id === 'pet' && !TT.PETS_ON); }
  // The phone menus borrow icons and colors from here, even for tiles that are not on the page.
  TT.homeTile = function (id) { return items[id] ? items[id].node : null; };

  // ---------- Layouts ----------
  function defaultLayout() {
    return {
      cats: defaults.map(function (c) { return { id: c.id, name: c.name, desc: c.desc, style: c.style, items: c.items.filter(ok) }; }),
      hidden: Object.keys(items).filter(function (id) { return ok(id) && items[id].home === 'games'; })
    };
  }
  function normalize(saved) {
    if (!saved || !saved.cats || !saved.cats.length && !(saved.hidden || []).length) return defaultLayout();
    var seen = {}, known = {};
    (saved.known || []).forEach(function (k) { known[k] = 1; });
    function keep(id) { if (!ok(id) || seen[id]) return false; seen[id] = 1; return true; }
    var cats = saved.cats.slice(0, MAX_CATS).map(function (c, i) {
      return { id: String(c.id || 'c' + i), name: String(c.name || '').slice(0, 40) || 'Untitled', desc: c.desc ? String(c.desc) : '', style: c.style === 'big' ? 'big' : 'small', items: (c.items || []).filter(keep) };
    });
    var hidden = (saved.hidden || []).filter(keep);
    Object.keys(items).forEach(function (id) {
      if (!ok(id) || seen[id]) return;
      var it = items[id];
      if (known[id] || it.home === 'games') { hidden.push(id); return; }
      var cat = cats.filter(function (c) { return c.id === it.home; })[0] || cats.filter(function (c) { return c.id === 'new'; })[0];
      if (!cat) { cat = { id: 'new', name: 'New Tools', desc: '', style: 'small', items: [] }; cats.push(cat); }
      cat.items.push(id);
    });
    return { cats: cats, hidden: hidden };
  }
  function serialize(L) {
    return { v: 1, cats: L.cats.map(function (c) { return { id: c.id, name: c.name, desc: c.desc || '', style: c.style, items: c.items.slice() }; }),
      hidden: L.hidden.slice(), known: Object.keys(items) };
  }
  function same(a, b) { return JSON.stringify(serialize(a).cats) === JSON.stringify(serialize(b).cats); }
  function copy(L) { return { cats: L.cats.map(function (c) { return { id: c.id, name: c.name, desc: c.desc, style: c.style, items: c.items.slice() }; }), hidden: L.hidden.slice() }; }

  var layout = normalize(TT.load(KEY, null));
  var editing = false, draft = null, mountedNodes = [], firstPaint = true;
  function premium() { return TT.premium ? TT.premium.has() : true; }
  function shown() { return premium() ? layout : defaultLayout(); }

  // A spoken note for screen readers when tiles move.
  var live = h('div', { class: 'dash-live', 'aria-live': 'polite', 'aria-atomic': 'true' });
  document.body.append(live);
  function say(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 30); }

  // ---------- Normal view ----------
  function clear() { mountedNodes.forEach(function (n) { n.remove(); }); mountedNodes = []; }
  function place(node) { anchor.parentNode.insertBefore(node, anchor); mountedNodes.push(node); }
  function customizeButton() {
    var b = TT.premium ? TT.premium.button('Customize', 'dashboard', startEdit, 'grid') : TT.button('Customize', { icon: 'grid', kind: 'small', onclick: startEdit });
    b.classList.add('dash-custom');
    b.title = premium() ? 'Make your own categories and move the tiles' : 'Customize your home page with Plus';
    return b;
  }
  // Big tiles are the Daily Routines look, small tiles the Classroom Tools look (styles in assets/home.css).
  function styleClass(st) { return st === 'big' ? 'home-daily' : 'home-tools'; }
  function riseOn(el) { el.setAttribute('data-rise', ''); if (!firstPaint) el.classList.add('in', 'done'); return el; }

  function paintView() {
    clear();
    document.body.classList.remove('dash-editing'); home.classList.remove('dash-edit');
    var L = shown(), made = 0;
    L.cats.forEach(function (c, i) {
      var list = c.items.filter(ok);
      if (!list.length) return;
      var hid = 'dashHead-' + i;
      var head = riseOn(h('div', { class: 'section-head' }, h('h2', { id: hid, text: c.name }), c.desc ? h('p', { text: c.desc }) : null));
      if (!made) head.append(customizeButton());
      var grid = h('div', { class: 'tools' }, list.map(function (id) { return riseOn(items[id].node.cloneNode(true)); }));
      place(h('section', { class: 'home-cat ' + styleClass(c.style), 'aria-labelledby': hid }, head, grid));
      made++;
    });
    if (!made) {
      place(h('section', { class: 'home-cat dash-none' },
        h('div', { class: 'section-head' }, h('h2', { text: 'Your Home Page Is Empty' }), h('p', { text: 'Add some tiles back so your tools are one click away.' }), customizeButton())));
    }
    firstPaint = false;
  }

  // ---------- Customize mode ----------
  var bar = null, editNodes = null;
  function startEdit() {
    if (!premium()) { if (TT.premium) TT.premium.open('dashboard'); return; }
    editing = true; draft = copy(layout);
    if (TT.track) TT.track('dashboard-customize', 'open');
    paintEdit();
    var top = home.querySelector('.dash-bar');
    if (top) window.scrollTo({ top: Math.max(0, top.getBoundingClientRect().top + window.scrollY - navH() - 8), behavior: 'smooth' });
    setTimeout(function () { var t = home.querySelector('.dd-tile'); if (t) t.focus({ preventScroll: true }); }, 350);
  }
  function finish(save) {
    if (!editing) return;
    if (TT.accent) { if (save && pickedAccent) TT.accent.set(pickedAccent); else TT.accent.apply(); }
    pickedAccent = null;
    if (save) {
      readDom();
      layout = normalize(serialize(draft));
      TT.save(KEY, same(layout, defaultLayout()) ? null : serialize(layout));
      say('Your home page is saved.');
    }
    editing = false; draft = null; closeMenu();
    paintView();
    var c = home.querySelector('.dash-custom'); if (c) c.focus({ preventScroll: true });
  }
  function navH() { var n = document.querySelector('.nav'); return n ? n.getBoundingClientRect().height : 0; }

  function tileNode(id) {
    var it = items[id], src = it.node;
    var t = h('div', { class: 'tool dd-tile ' + it.color, 'data-id': id, tabindex: '0', role: 'button',
      'aria-roledescription': 'Movable tile', 'aria-label': it.title + '. Press Enter to pick it up and move it with the arrow keys.' });
    [].forEach.call(src.children, function (ch) { if (!ch.classList.contains('go')) t.append(ch.cloneNode(true)); });
    t.append(h('button', { type: 'button', class: 'dd-more', 'aria-label': 'More for ' + it.title, title: 'Move or Remove',
      html: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>' }));
    t.append(h('span', { class: 'dd-grip', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>' }));
    return t;
  }
  function gridNode(catId, ids, emptyText) {
    return h('div', { class: 'tools dd-grid', 'data-cat': catId }, ids.filter(ok).map(tileNode),
      h('div', { class: 'dd-empty', 'aria-hidden': 'true' }, emptyText));
  }
  function catNode(c) {
    var name = h('input', { type: 'text', class: 'dd-name', value: c.name, maxlength: 40, 'aria-label': 'Category name', placeholder: 'Category Name', spellcheck: 'true' });
    name.addEventListener('change', function () { if (!name.value.trim()) name.value = 'Untitled'; readDom(); });
    name.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); name.blur(); } });
    var sizeBtn = h('button', { type: 'button', class: 'dd-icon-btn dd-size', 'data-act': 'size' });
    function paintSize() {
      var big = sec.getAttribute('data-style') === 'big';
      sizeBtn.innerHTML = big ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="5" width="16" height="4" rx="1.5"/><rect x="4" y="11" width="16" height="4" rx="1.5"/><rect x="4" y="17" width="16" height="2.5" rx="1.2"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="4" width="7" height="16" rx="2"/><rect x="13" y="4" width="7" height="16" rx="2"/></svg>';
      sizeBtn.setAttribute('aria-label', big ? 'Use Small Tiles' : 'Use Big Tiles'); sizeBtn.title = big ? 'Use Small Tiles' : 'Use Big Tiles';
      sec.classList.remove('home-daily', 'home-tools'); sec.classList.add(styleClass(big ? 'big' : 'small'));
    }
    var tools = h('div', { class: 'dd-cat-tools' }, sizeBtn,
      h('button', { type: 'button', class: 'dd-icon-btn', 'data-act': 'up', 'aria-label': 'Move Category Up', title: 'Move Up', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>' }),
      h('button', { type: 'button', class: 'dd-icon-btn', 'data-act': 'down', 'aria-label': 'Move Category Down', title: 'Move Down', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' }),
      h('button', { type: 'button', class: 'dd-icon-btn dd-del', 'data-act': 'delete', 'aria-label': 'Delete Category', title: 'Delete Category', html: TT.icon('trash') }));
    var sec = h('section', { class: 'home-cat dd-cat', 'data-style': c.style === 'big' ? 'big' : 'small', 'data-cat': c.id, 'data-desc': c.desc || '', 'data-name0': c.name },
      h('div', { class: 'dd-cat-head' }, h('span', { class: 'dd-pencil', 'aria-hidden': 'true', html: TT.icon('edit') }), name, tools),
      gridNode(c.id, c.items, 'Drag Tiles Here'));
    sec.paintSize = paintSize; paintSize();
    return sec;
  }
  // Theme Colors: one accent color for the whole site (tools/accent.js). It previews right away and is kept on Done.
  var pickedAccent = null;
  function themeRow() {
    if (!TT.accent || !TT.ACCENTS) return null;
    var now = pickedAccent || TT.accent.get();
    var row = h('div', { class: 'dash-swatches', role: 'radiogroup', 'aria-label': 'Theme color' }, TT.ACCENTS.map(function (a) {
      var b = h('button', { type: 'button', class: 'dash-sw' + (a.id === now ? ' on' : ''), role: 'radio', 'aria-checked': a.id === now ? 'true' : 'false', style: '--a:' + a.a + ';--b:' + a.b, onclick: function () {
        pickedAccent = a.id; TT.accent.preview(a.id);
        [].forEach.call(row.children, function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b ? 'true' : 'false'); });
        say(a.name + ' colors. Press Done to keep them.');
      } }, h('i', { 'aria-hidden': 'true' }), a.name);
      return b;
    }));
    return h('div', { class: 'dash-theme' }, h('span', { class: 'dash-theme-t', text: 'Theme Colors' }), row);
  }
  function paintEdit() {
    clear(); closeMenu();
    document.body.classList.add('dash-editing'); home.classList.add('dash-edit');
    home.style.setProperty('--dash-top', navH() + 'px');
    var count = h('span', { class: 'dash-bar-sub' });
    var resetBtn = TT.button('Reset to Default', { icon: 'reset', kind: 'small dash-reset', aria: 'Reset to Default', onclick: askReset });
    var addBtn = TT.button('Add Category', { icon: 'plus', kind: 'small dash-add', aria: 'Add Category', onclick: addCat });
    var cancel = TT.button('Cancel', { kind: 'small dash-cancel', onclick: function () { finish(false); say('No changes saved.'); } });
    var done = TT.button('Done', { kind: 'small primary dash-done', onclick: function () { finish(true); } });
    var main = h('div', { class: 'dash-bar-main' },
      h('div', { class: 'dash-bar-text' }, h('h2', { text: 'Customize Your Home' }), count),
      h('div', { class: 'dash-bar-btns' }, addBtn, resetBtn, cancel, done));
    bar = h('div', { class: 'dash-bar glass', role: 'region', 'aria-label': 'Customize your home page' }, main, themeRow());
    bar.paintCount = function () {
      count.textContent = matchMedia('(pointer: coarse)').matches ? 'Hold a tile, then drag it. Tap ••• to move or remove it.' : 'Drag tiles to move them, or tap ••• to move or remove one.';
    };
    bar.paintCount();
    place(bar);
    var cats = h('div', { class: 'dd-cats' }, draft.cats.map(catNode));
    place(cats);
    place(h('button', { type: 'button', class: 'dd-add-cat', onclick: addCat, html: TT.icon('plus') + '<span>Add a Category</span>' }));
    place(h('section', { class: 'home-cat dd-tray', 'data-cat': TRAY },
      h('div', { class: 'section-head' }, h('h2', { text: 'Tiles Not on Your Home' }), h('p', { text: 'Every game and tool lives here when it’s not on your home page. Drag one up to add it.' })),
      gridNode(TRAY, draft.hidden, 'Drag a Tile Here to Take It Off Your Home Page')));
    editNodes = cats;
    paintEmpty(); paintCatButtons();
  }
  function paintEmpty() {
    [].forEach.call(home.querySelectorAll('.dd-grid'), function (g) { g.classList.toggle('is-empty', !g.querySelector('.dd-tile')); });
  }
  function paintCatButtons() {
    var secs = home.querySelectorAll('.dd-cat');
    [].forEach.call(secs, function (s, i) {
      s.querySelector('[data-act="up"]').disabled = i === 0;
      s.querySelector('[data-act="down"]').disabled = i === secs.length - 1;
    });
    var add = home.querySelectorAll('.dd-add-cat, .dash-add');
    [].forEach.call(add, function (b) { b.disabled = secs.length >= MAX_CATS; });
  }
  // The page is the source of truth while editing: read the order straight from it.
  function readDom() {
    if (!editing) return;
    var cats = [].map.call(home.querySelectorAll('.dd-cat'), function (s) {
      var input = s.querySelector('.dd-name'), name = input.value.trim().slice(0, 40) || 'Untitled';
      return { id: s.getAttribute('data-cat'), name: name, style: s.getAttribute('data-style'), desc: name === s.getAttribute('data-name0') ? s.getAttribute('data-desc') : '',
        items: [].map.call(s.querySelectorAll('.dd-tile'), function (t) { return t.getAttribute('data-id'); }) };
    });
    var tray = home.querySelector('.dd-tray');
    draft = { cats: cats, hidden: tray ? [].map.call(tray.querySelectorAll('.dd-tile'), function (t) { return t.getAttribute('data-id'); }) : [] };
  }

  // Slide things to their new spots with a spring instead of jumping (FLIP).
  function flip(nodes, mutate) {
    var first = nodes.map(function (n) { return n.getBoundingClientRect(); });
    mutate();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    nodes.forEach(function (n, i) {
      if (!n.isConnected) return;
      var a = first[i], b = n.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      n.style.transition = 'none'; n.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      void n.offsetWidth;
      n.style.transition = 'transform .52s var(--spring)'; n.style.transform = '';
      clearTimeout(n._flipT); n._flipT = setTimeout(function () { n.style.transition = ''; }, 560);
    });
  }
  var moving = false;
  function allTiles() { return [].slice.call(home.querySelectorAll('.dd-tile, .dd-cat, .dd-add-cat, .dd-tray')); }
  function moveTile(tile, grid, before) {
    if (!before) before = grid.querySelector('.dd-empty');
    if (tile.parentNode === grid && (tile.nextSibling === before || tile === before)) return false;
    var focused = document.activeElement === tile;
    moving = true;
    flip(allTiles(), function () { grid.insertBefore(tile, before); paintEmpty(); });
    if (focused) tile.focus({ preventScroll: true });
    moving = false;
    return true;
  }
  function catName(grid) {
    if (grid.getAttribute('data-cat') === TRAY) return 'Tiles Not on Your Home';
    var s = grid.closest('.dd-cat'), i = s && s.querySelector('.dd-name');
    return i ? i.value.trim() || 'Untitled' : '';
  }

  // ---------- Categories ----------
  function addCat() {
    if (home.querySelectorAll('.dd-cat').length >= MAX_CATS) return;
    readDom();
    var c = { id: 'c' + Date.now().toString(36), name: 'New Category', desc: '', style: 'small', items: [] };
    var sec = catNode(c);
    sec.classList.add('dd-pop');
    flip(allTiles(), function () { editNodes.append(sec); paintEmpty(); paintCatButtons(); });
    readDom();
    var input = sec.querySelector('.dd-name');
    sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(function () { input.focus({ preventScroll: true }); input.select(); }, 60);
    say('Added a new category. Type its name.');
  }
  home.addEventListener('click', function (e) {
    if (!editing) return;
    var b = e.target.closest('.dd-cat-tools button');
    if (!b) return;
    var sec = b.closest('.dd-cat'), act = b.getAttribute('data-act');
    if (act === 'up' || act === 'down') {
      var sib = act === 'up' ? sec.previousElementSibling : sec.nextElementSibling;
      if (!sib) return;
      flip(allTiles(), function () { editNodes.insertBefore(sec, act === 'up' ? sib : sib.nextSibling); paintCatButtons(); });
      b.focus({ preventScroll: true });
      if (b.disabled) { var other = sec.querySelector('[data-act="' + (act === 'up' ? 'down' : 'up') + '"]'); if (other) other.focus({ preventScroll: true }); }
      readDom();
      say('Moved ' + sec.querySelector('.dd-name').value + ' ' + act + '.');
    } else if (act === 'size') {
      flip(allTiles(), function () { sec.setAttribute('data-style', sec.getAttribute('data-style') === 'big' ? 'small' : 'big'); sec.paintSize(); });
      readDom(); b.focus({ preventScroll: true });
      say(sec.querySelector('.dd-name').value + ' now uses ' + (sec.getAttribute('data-style') === 'big' ? 'big' : 'small') + ' tiles.');
    } else if (act === 'delete') {
      askDelete(sec);
    } else if (act === 'yes') {
      var tray = home.querySelector('.dd-tray .dd-grid'), tiles = [].slice.call(sec.querySelectorAll('.dd-tile'));
      var name = sec.querySelector('.dd-name').value;
      flip(allTiles(), function () { tiles.forEach(function (t) { tray.insertBefore(t, tray.querySelector('.dd-empty')); }); sec.remove(); paintEmpty(); paintCatButtons(); });
      readDom();
      say('Deleted ' + name + '.' + (tiles.length ? ' Its tiles moved to Tiles Not on Your Home.' : ''));
      var next = home.querySelector('.dd-cat .dd-name') || home.querySelector('.dd-add-cat'); if (next) next.focus({ preventScroll: true });
    } else if (act === 'no') {
      paintCatTools(sec, false);
    }
  });
  function askDelete(sec) {
    var n = sec.querySelectorAll('.dd-tile').length;
    if (!n) { var yes = h('button', { 'data-act': 'yes' }); sec.querySelector('.dd-cat-tools').append(yes); yes.click(); return; }
    paintCatTools(sec, true, n);
  }
  function paintCatTools(sec, asking, n) {
    var box = sec.querySelector('.dd-cat-tools');
    if (asking) {
      box.hidden = true;
      var ask = h('div', { class: 'dd-ask', role: 'group', 'aria-label': 'Delete this category?' },
        h('span', { text: 'Delete it? Its ' + n + (n === 1 ? ' tile moves' : ' tiles move') + ' to Tiles Not on Your Home.' }),
        h('div', { class: 'dd-cat-tools dd-ask-btns' },
          h('button', { type: 'button', class: 'btn small dd-yes', 'data-act': 'yes', text: 'Delete' }),
          h('button', { type: 'button', class: 'btn small', 'data-act': 'no', text: 'Keep It' })));
      box.after(ask);
      ask.querySelector('.dd-yes').focus({ preventScroll: true });
    } else {
      var a = sec.querySelector('.dd-ask'); if (a) a.remove();
      box.hidden = false; box.querySelector('.dd-del').focus({ preventScroll: true });
    }
  }
  function askReset() {
    var main = bar.querySelector('.dash-bar-main');
    if (bar.querySelector('.dash-ask')) return;
    main.hidden = true;
    var yes = TT.button('Reset', { icon: 'reset', kind: 'small primary dd-yes', onclick: function () {
      draft = defaultLayout(); paintEdit(); say('Everything is back where it started. Press Done to keep it.');
      var d = home.querySelector('.dash-done'); if (d) d.focus({ preventScroll: true });
    } });
    var no = TT.button('Keep Mine', { kind: 'small', onclick: function () { ask.remove(); main.hidden = false; bar.querySelector('.dash-reset').focus({ preventScroll: true }); } });
    var ask = h('div', { class: 'dash-ask' }, h('div', { class: 'dash-bar-text' }, h('h2', { text: 'Reset to Default?' }), h('span', { class: 'dash-bar-sub', text: 'Your categories are removed and every tile goes back where it started.' })),
      h('div', { class: 'dash-bar-btns' }, no, yes));
    bar.append(ask);
    yes.focus({ preventScroll: true });
  }

  // ---------- The ••• menu on each tile ----------
  var menu = null;
  function closeMenu(refocus) {
    if (!menu) return;
    var m = menu; menu = null;
    m.classList.add('out'); setTimeout(function () { m.remove(); }, 180);
    if (refocus && m._btn && m._btn.isConnected) m._btn.focus({ preventScroll: true });
  }
  function openMenu(btn) {
    var tile = btn.closest('.dd-tile');
    if (menu && menu._btn === btn) return closeMenu(true);
    closeMenu();
    readDom();
    var grid = tile.parentNode, inTray = grid.getAttribute('data-cat') === TRAY, title = items[tile.getAttribute('data-id')].title;
    var opts = [];
    [].forEach.call(home.querySelectorAll('.dd-cat .dd-grid'), function (g) {
      if (g === grid) return;
      opts.push([(inTray ? 'Add to ' : 'Move to ') + catName(g), function () { moveTile(tile, g); say(title + (inTray ? ' added to ' : ' moved to ') + catName(g) + '.'); flash(tile); }]);
    });
    if (!inTray) {
      if (tile.previousElementSibling) opts.unshift(['Move to the Front', function () { moveTile(tile, grid, grid.querySelector('.dd-tile')); say(title + ' is first in ' + catName(grid) + '.'); flash(tile); }]);
      opts.push(['Take Off Home Page', function () { moveTile(tile, home.querySelector('.dd-tray .dd-grid')); say(title + ' taken off your home page.'); flash(tile); }]);
    }
    if (!opts.length) opts.push(['Add a Category First', addCat]);
    menu = h('div', { class: 'dd-menu glass', role: 'menu', 'aria-label': title },
      h('p', { class: 'dd-menu-title', text: title }),
      opts.map(function (o) {
        return h('button', { type: 'button', role: 'menuitem', class: 'dd-menu-item', onclick: function () { closeMenu(); o[1](); readDom(); setTimeout(function () { if (tile.isConnected) tile.focus({ preventScroll: true }); }, 0); } }, o[0]);
      }));
    menu._btn = btn; menu._y = window.scrollY;
    document.body.append(menu);
    var r = btn.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
    var left = Math.min(Math.max(8, r.right - mw), window.innerWidth - mw - 8);
    var top = r.bottom + 6 + mh > window.innerHeight - 8 ? Math.max(8, r.top - mh - 6) : r.bottom + 6;
    menu.style.left = left + 'px'; menu.style.top = top + 'px';
    menu.style.transformOrigin = (r.right - left) + 'px ' + (top > r.top ? '0' : '100%');
    var first = menu.querySelector('.dd-menu-item'); if (first) first.focus({ preventScroll: true });
  }
  function flash(tile) { tile.classList.remove('dd-landed'); void tile.offsetWidth; tile.classList.add('dd-landed'); }
  document.addEventListener('pointerdown', function (e) { if (menu && !menu.contains(e.target) && e.target !== menu._btn && !(menu._btn && menu._btn.contains(e.target))) closeMenu(); }, true);
  document.addEventListener('keydown', function (e) {
    if (!menu) return;
    if (e.key === 'Escape') { e.stopPropagation(); closeMenu(true); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var list = [].slice.call(menu.querySelectorAll('.dd-menu-item')), i = list.indexOf(document.activeElement);
      e.preventDefault(); list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length].focus();
    }
    if (e.key === 'Tab') closeMenu();
  }, true);
  window.addEventListener('resize', function () { closeMenu(); if (bar) bar.paintCount(); });
  window.addEventListener('scroll', function () { if (menu && Math.abs(window.scrollY - menu._y) > 40) closeMenu(); }, { passive: true });
  home.addEventListener('click', function (e) {
    var b = e.target.closest('.dd-more');
    if (b && editing) { e.preventDefault(); openMenu(b); }
  });

  // ---------- Dragging (mouse, pen and touch) ----------
  var drag = null;
  home.addEventListener('pointerdown', function (e) {
    if (!editing || drag || (e.button && e.button !== 0)) return;
    var tile = e.target.closest('.dd-tile');
    if (!tile || e.target.closest('button, input')) return;
    closeMenu();
    drag = { tile: tile, pid: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, live: false, touch: e.pointerType !== 'mouse' };
    if (drag.touch) { tile.classList.add('dd-press'); drag.timer = setTimeout(begin, 260); }
    else { e.preventDefault(); tile.focus({ preventScroll: true }); }   // no text selection while dragging
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
  });
  // While a tile is lifted, a finger moves the tile instead of scrolling the page.
  document.addEventListener('touchmove', function (e) { if (drag && drag.live) e.preventDefault(); }, { passive: false });
  home.addEventListener('contextmenu', function (e) { if (editing && e.target.closest('.dd-tile')) e.preventDefault(); });

  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    drag.x = e.clientX; drag.y = e.clientY;
    if (!drag.live) {
      var d = Math.hypot(drag.x - drag.x0, drag.y - drag.y0);
      if (drag.touch) { if (d > 10) stop(); return; }   // the finger moved first, so it's a scroll
      if (d < 6) return;
      begin();
    }
    e.preventDefault();
    follow();
  }
  function begin() {
    if (!drag || drag.live) return;
    var tile = drag.tile, r = tile.getBoundingClientRect();
    tile.classList.remove('dd-press');
    drag.live = true; drag.dx = drag.x - r.left; drag.dy = drag.y - r.top;
    drag.from = { grid: tile.parentNode, next: tile.nextSibling };
    var inner = tile.cloneNode(true);
    inner.classList.remove('dd-press', 'dd-landed'); inner.classList.add('dd-float-in'); inner.removeAttribute('tabindex'); inner.removeAttribute('role');
    inner.style.transform = ''; inner.style.transition = '';
    var sec = tile.closest('.home-daily, .home-tools');   // keeps the big or small tile look while it flies
    var fl = h('div', { class: 'dd-float' + (sec ? ' ' + (sec.classList.contains('home-daily') ? 'home-daily' : 'home-tools') : ''), 'aria-hidden': 'true' }, inner);
    fl.style.width = r.width + 'px'; fl.style.height = r.height + 'px';
    fl.style.transform = 'translate(' + r.left + 'px,' + r.top + 'px)';
    home.append(fl); drag.float = fl;
    tile.classList.add('dd-ghost');
    document.body.classList.add('dd-dragging');
    requestAnimationFrame(function () { fl.classList.add('lift'); });
    if (drag.touch && navigator.vibrate) { try { navigator.vibrate(10); } catch (err) {} }
    say('Picked up ' + items[tile.getAttribute('data-id')].title + '.');
    drag.raf = requestAnimationFrame(loop);
  }
  function follow() {
    if (!drag.float) return;
    drag.float.style.transform = 'translate(' + (drag.x - drag.dx) + 'px,' + (drag.y - drag.dy) + 'px)';
  }
  // Each frame: scroll near the top or bottom edge, then find where the tile would land.
  function loop() {
    if (!drag || !drag.live) return;
    var edge = 80, top = (bar && bar.isConnected ? bar.getBoundingClientRect().bottom : navH()) + 40, bottom = window.innerHeight - (document.querySelector('.mob-tabs') && getComputedStyle(document.querySelector('.mob-tabs')).display !== 'none' ? 150 : edge), v = 0;
    if (drag.y < top) v = -Math.min(18, (top - drag.y) / 4 + 2);
    else if (drag.y > bottom) v = Math.min(18, (drag.y - bottom) / 4 + 2);
    if (v) window.scrollBy(0, v);
    hit();
    drag.raf = requestAnimationFrame(loop);
  }
  function hit() {
    var now = Date.now();
    if (drag.lastHit && now - drag.lastHit < 60) return;
    var el = document.elementFromPoint(drag.x, drag.y);
    if (!el) return;
    var grid = el.closest('.dd-grid');
    if (!grid) { var s = el.closest('.dd-cat, .dd-tray'); grid = s && s.querySelector('.dd-grid'); }
    if (!grid) return;
    var tiles = [].slice.call(grid.querySelectorAll('.dd-tile')).filter(function (t) { return t !== drag.tile; });
    var before = null;
    if (tiles.length) {
      var over = el.closest('.dd-tile');
      if (!over || over === drag.tile || over.parentNode !== grid) {
        var best = Infinity;
        tiles.forEach(function (t) { var r = t.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - drag.x, r.top + r.height / 2 - drag.y); if (d < best) { best = d; over = t; } });
        if (el.closest('.dd-tile') === drag.tile) return;
      }
      var r = over.getBoundingClientRect();
      var goBefore = drag.y < r.top || (drag.y <= r.bottom && drag.x < r.left + r.width / 2);
      before = goBefore ? over : over.nextElementSibling;
    }
    if (moveTile(drag.tile, grid, before)) drag.lastHit = now;
  }
  function stop() {
    if (!drag) return;
    clearTimeout(drag.timer); cancelAnimationFrame(drag.raf);
    drag.tile.classList.remove('dd-press');
    document.removeEventListener('pointermove', onMove, { passive: false });
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    var d = drag; drag = null;
    return d;
  }
  function land(d) {
    var tile = d.tile, fl = d.float, r = tile.getBoundingClientRect();
    document.body.classList.remove('dd-dragging');
    fl.classList.add('drop'); fl.classList.remove('lift');
    fl.style.transform = 'translate(' + r.left + 'px,' + r.top + 'px)';
    setTimeout(function () { fl.remove(); tile.classList.remove('dd-ghost'); flash(tile); }, 380);
    readDom();
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var d = stop();
    if (!d.live) return;
    land(d);
    var grid = d.tile.parentNode;
    say(items[d.tile.getAttribute('data-id')].title + ' dropped in ' + catName(grid) + '.');
  }
  function onCancel(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var d = stop();
    if (!d.live) return;
    moveTile(d.tile, d.from.grid, d.from.next && d.from.next.parentNode === d.from.grid ? d.from.next : null);
    land(d);
  }

  // ---------- Keyboard: Enter picks a tile up, arrows move it, Enter drops it ----------
  var held = null;
  function grids() { return [].slice.call(home.querySelectorAll('.dd-grid')); }
  function cols(grid) {
    var t = grid.querySelectorAll('.dd-tile'); if (t.length < 2) return 1;
    var y = t[0].offsetTop, n = 0;
    for (var i = 0; i < t.length && t[i].offsetTop === y; i++) n++;
    return Math.max(1, n);
  }
  home.addEventListener('keydown', function (e) {
    if (!editing) return;
    var tile = e.target.closest && e.target.closest('.dd-tile');
    if (!tile || e.target !== tile) return;
    var title = items[tile.getAttribute('data-id')].title;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (held === tile) { tile.classList.remove('dd-held'); held = null; readDom(); flash(tile); say(title + ' dropped in ' + catName(tile.parentNode) + '.'); }
      else {
        if (held) held.classList.remove('dd-held');
        held = tile; held._from = { grid: tile.parentNode, next: tile.nextSibling };
        tile.classList.add('dd-held');
        say('Picked up ' + title + '. Use the arrow keys to move it, then press Enter to drop it. Escape puts it back.');
      }
      return;
    }
    if (e.key === 'Escape' && held === tile) {
      e.preventDefault();
      moveTile(tile, held._from.grid, held._from.next && held._from.next.parentNode === held._from.grid ? held._from.next : null);
      tile.classList.remove('dd-held'); held = null; readDom(); say(title + ' put back.');
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && held !== tile && tile.parentNode.getAttribute('data-cat') !== TRAY) {
      e.preventDefault();
      moveTile(tile, home.querySelector('.dd-tray .dd-grid')); readDom(); say(title + ' taken off your home page.');
      return;
    }
    var k = e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(k) < 0) return;
    e.preventDefault();
    var grid = tile.parentNode, list = [].slice.call(grid.querySelectorAll('.dd-tile')), i = list.indexOf(tile), all = grids(), gi = all.indexOf(grid);
    if (held !== tile) {
      // Not holding: arrows just move focus between tiles.
      var flat = [].slice.call(home.querySelectorAll('.dd-tile')), fi = flat.indexOf(tile), step = k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : (k === 'ArrowUp' ? -cols(grid) : cols(grid));
      var to = list[i + step] || ((k === 'ArrowLeft' || k === 'ArrowRight') ? flat[fi + step] : null);
      if (!to && (k === 'ArrowUp' || k === 'ArrowDown')) { var g2 = all[gi + (k === 'ArrowUp' ? -1 : 1)]; to = g2 && g2.querySelector('.dd-tile'); }
      if (to) to.focus();
      return;
    }
    var c = cols(grid), target = grid, before;
    if (k === 'ArrowLeft') {
      if (i > 0) before = list[i - 1];
      else if (gi > 0) { target = all[gi - 1]; before = null; }
      else return;
    } else if (k === 'ArrowRight') {
      if (i < list.length - 1) before = list[i + 1].nextElementSibling;
      else if (gi < all.length - 1) { target = all[gi + 1]; before = target.querySelector('.dd-tile'); }
      else return;
    } else if (k === 'ArrowUp') {
      if (i - c >= 0) before = list[i - c];
      else if (gi > 0) { target = all[gi - 1]; before = null; }
      else return;
    } else {
      if (i + c < list.length) before = list[i + c].nextElementSibling;
      else if (gi < all.length - 1) { target = all[gi + 1]; before = target.querySelector('.dd-tile'); }
      else return;
    }
    moveTile(tile, target, before);
    tile.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    var pos = [].indexOf.call(target.querySelectorAll('.dd-tile'), tile) + 1;
    say(title + ', ' + catName(target) + ', spot ' + pos + '.');
  });
  home.addEventListener('focusout', function (e) {
    if (held && !moving && e.target === held && !home.contains(e.relatedTarget)) { held.classList.remove('dd-held'); held = null; readDom(); }
  });

  // ---------- When to repaint ----------
  window.addEventListener('tt:page', function () {
    if (editing && TT.page() !== 'home') finish(true);
  });
  if (TT.account && TT.account.onChange) {
    var lastPlan = premium();
    TT.account.onChange(function () {
      var p = premium();
      if (p === lastPlan) return;
      lastPlan = p;
      if (editing && !p) finish(false);
      if (!editing) paintView();
    });
  }
  window.addEventListener('storage', function (e) {
    if (e.key === 'tt:' + KEY && !editing) { layout = normalize(TT.load(KEY, null)); paintView(); }
  });
  paintView();
})();
