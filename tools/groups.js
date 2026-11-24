// Group Maker: splits the students who are here today into random groups.
// Each group is a team with a color and (if the teacher likes) one of the class animal stickers.
// Names are dealt out one at a time so the class can watch the groups fill up.
(function () {
  var TT = window.TT, h = TT.h;
  var KEY = 'groups';
  var COLORS = ['cobalt', 'coral', 'emerald', 'rose', 'amber', 'violet', 'sky', 'lime'];
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The animal stickers (assets/animals/) come from the class-code lobby list when it is loaded.
  function animals() { return (window.Lobby && window.Lobby.AVATARS) || []; }

  TT.mountGroups = function (el) {
    var state = TT.load(KEY, { mode: 'count', n: 4, groups: [] });
    if (state.names !== 'numbers' && state.names !== 'animals') state.names = animals().length ? 'animals' : 'numbers';
    if (!Array.isArray(state.teams)) state.teams = [];
    var dealing = 0, timers = [];

    function seg(label, on) { return h('button', { type: 'button', class: 'seg', onclick: on }, label); }
    var modeCount = seg('Number of Groups', function () { setMode('count'); });
    var modeSize = seg('Students per Group', function () { setMode('size'); });
    var nameNum = seg('Numbers', function () { setNames('numbers'); });
    var nameAni = seg('Animal Teams', function () { setNames('animals'); });
    var nEl = h('output', { class: 'gm-n' });
    var nLab = h('span', { class: 'gm-lab' });
    var hint = h('p', { class: 'gm-hint', 'aria-live': 'polite' });
    var grid = h('div', { class: 'gm-grid' });
    var goBtn = h('button', { type: 'button', class: 'gm-go', onclick: make },
      h('span', { class: 'gm-go-ico', html: TT.icon('shuffle') }), h('span', { class: 'gm-go-text', text: 'Make Groups' }));

    el.append(h('div', { class: 'gm' },
      h('div', { class: 'gm-deck' },
        h('div', { class: 'gm-field' }, h('span', { class: 'gm-lab', text: 'Split the Class By' }),
          h('div', { class: 'segmented', role: 'group', 'aria-label': 'How to split the class' }, modeCount, modeSize)),
        h('div', { class: 'gm-field' }, nLab,
          h('div', { class: 'gm-stepper' },
            h('button', { type: 'button', class: 'gm-step', 'aria-label': 'Fewer', html: TT.icon('minus'), onclick: function () { setN(state.n - 1); } }),
            nEl,
            h('button', { type: 'button', class: 'gm-step', 'aria-label': 'More', html: TT.icon('plus'), onclick: function () { setN(state.n + 1); } }))),
        animals().length ? h('div', { class: 'gm-field' }, h('span', { class: 'gm-lab', text: 'Group Names' }),
          h('div', { class: 'segmented', role: 'group', 'aria-label': 'Group names' }, nameAni, nameNum)) : null,
        goBtn),
      hint,
      grid
    ));

    function save() { TT.save(KEY, state); }
    function setMode(m) { state.mode = m; save(); paintControls(); }
    function setN(n) {
      n = Math.max(2, Math.min(n, 12));
      if (n === state.n) return;
      state.n = n; save(); paintControls();
      nEl.classList.remove('bump'); void nEl.offsetWidth; nEl.classList.add('bump');
    }
    function setNames(k) { state.names = k; save(); paintControls(); paintGroups(false); }

    function plan() {
      var count = TT.roster.present().length;
      var groups = state.mode === 'count' ? state.n : Math.max(1, Math.round(count / state.n));
      groups = Math.max(1, Math.min(groups, count || 1));
      return { count: count, groups: groups };
    }
    function press(b, on) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    function paintControls() {
      press(modeCount, state.mode === 'count'); press(modeSize, state.mode === 'size');
      press(nameNum, state.names === 'numbers'); press(nameAni, state.names === 'animals');
      nEl.textContent = state.n;
      nLab.textContent = state.mode === 'count' ? 'How Many Groups' : 'Students in Each';
      var p = plan();
      var min = Math.floor(p.count / p.groups), extra = p.count % p.groups;
      hint.textContent = '';
      if (!p.count) { hint.append(h('span', { class: 'gm-pill warn', text: 'Add students to the class list to make groups.' })); return; }
      hint.append(h('span', { class: 'gm-pill', text: p.count + (p.count === 1 ? ' student' : ' students') + ' here today' }),
        h('span', { class: 'gm-arrow', 'aria-hidden': 'true', html: TT.icon('arrow') }),
        h('span', { class: 'gm-pill strong', text: p.groups + (p.groups === 1 ? ' group' : ' groups') + ' of ' + min + (extra ? ' or ' + (min + 1) : '') }));
    }

    function make() {
      var names = TT.shuffle(TT.roster.present());
      if (!names.length) { paintControls(); return; }
      var p = plan(), groups = [];
      for (var i = 0; i < p.groups; i++) groups.push([]);
      names.forEach(function (n, i) { groups[i % p.groups].push(n); });
      // A fresh set of animals each time, never the same one twice in a round.
      var pool = TT.shuffle(animals().map(function (_, i) { return i; }));
      state.groups = groups; state.teams = groups.map(function (_, i) { return pool.length ? pool[i % pool.length] : i; });
      save();
      paintGroups(true);
    }

    function teamName(i) {
      var a = state.names === 'animals' && animals().length ? animals()[state.teams[i] % animals().length] : null;
      return a ? 'Team ' + a.n : 'Group ' + (i + 1);
    }
    function badge(i) {
      var a = state.names === 'animals' && animals().length ? animals()[state.teams[i] % animals().length] : null;
      if (a) return h('span', { class: 'gm-badge pic' }, h('img', { src: '/assets/animals/' + a.k + '.webp', alt: '', draggable: 'false' }));
      return h('span', { class: 'gm-badge', text: i + 1 });
    }
    function stop() { timers.forEach(clearTimeout); timers = []; dealing++; goBtn.classList.remove('busy'); }

    function paintGroups(animate) {
      stop();
      grid.textContent = '';
      grid.classList.toggle('few', state.groups.length > 0 && state.groups.length <= 3);
      goBtn.querySelector('.gm-go-text').textContent = state.groups.length ? 'Shuffle Again' : 'Make Groups';
      if (!state.groups.length) {
        var parade = h('div', { class: 'gm-parade', 'aria-hidden': 'true' }, TT.shuffle(animals().slice()).slice(0, 5).map(function (a, i) {
          return h('img', { src: '/assets/animals/' + a.k + '.webp', alt: '', draggable: 'false', style: '--i:' + i });
        }));
        grid.append(h('div', { class: 'gm-empty' }, parade, h('h3', { text: 'Ready to Mix Up the Class?' }),
          h('p', { text: 'Choose how to split the class, then press Make Groups.' })));
        return;
      }
      if (state.teams.length < state.groups.length) state.teams = state.groups.map(function (_, i) { return i; });
      var lists = [], counts = [];
      state.groups.forEach(function (g, i) {
        var ul = h('ul', { class: 'gm-names' }), count = h('span', { class: 'gm-count' });
        lists.push(ul); counts.push(count);
        grid.append(h('section', { class: 'gm-card c-' + COLORS[i % COLORS.length] + (animate && !still ? ' deal' : ''), style: '--i:' + i, 'aria-label': teamName(i) },
          h('header', { class: 'gm-card-head' }, badge(i), h('h3', { text: teamName(i) }), count), ul));
      });
      function li(name) { return h('li', { text: name }); }
      function setCount(i, n) { counts[i].textContent = n; counts[i].title = n + (n === 1 ? ' student' : ' students'); }
      if (!animate || still) {
        state.groups.forEach(function (g, i) { g.forEach(function (n) { lists[i].append(li(n)); }); setCount(i, g.length); });
        if (animate && TT.chime) TT.chime();
        return;
      }
      // Deal the names round and round, one at a time, the way you would deal cards.
      var run = dealing, order = [], most = Math.max.apply(null, state.groups.map(function (g) { return g.length; }));
      for (var r = 0; r < most; r++) state.groups.forEach(function (g, i) { if (g[r] != null) order.push([i, g[r]]); });
      var gap = Math.max(45, Math.min(130, 2600 / order.length)), start = 380 + state.groups.length * 55;
      state.groups.forEach(function (_, i) { setCount(i, 0); });
      goBtn.classList.add('busy');
      order.forEach(function (o, k) {
        timers.push(setTimeout(function () {
          if (run !== dealing) return;
          var item = li(o[1]); item.classList.add('in');
          lists[o[0]].append(item); setCount(o[0], lists[o[0]].children.length);
          if (TT.tick && k % 2 === 0) TT.tick();
          if (k === order.length - 1) {
            goBtn.classList.remove('busy');
            grid.classList.add('done'); setTimeout(function () { grid.classList.remove('done'); }, 900);
            if (TT.chime) TT.chime();
          }
        }, start + k * gap));
      });
    }
    TT.roster.onChange(paintControls);
    paintControls();
    paintGroups(false);
    return { hide: stop };
  };
})();
