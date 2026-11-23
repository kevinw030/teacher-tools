// Group Maker: splits the students who are here today into random groups.
(function () {
  var TT = window.TT, h = TT.h;
  var KEY = 'groups';
  var COLORS = ['cobalt', 'coral', 'emerald', 'rose', 'amber', 'violet', 'sky', 'lime'];

  TT.mountGroups = function (el) {
    var state = TT.load(KEY, { mode: 'count', n: 4, groups: [] });

    var modeCount = h('button', { type: 'button', class: 'seg', onclick: function () { setMode('count'); } }, 'Number of Groups');
    var modeSize = h('button', { type: 'button', class: 'seg', onclick: function () { setMode('size'); } }, 'Students per Group');
    var nEl = h('output', { class: 'stepper-value' });
    var hint = h('p', { class: 'muted groups-hint' });
    var grid = h('div', { class: 'group-grid' });

    el.append(h('div', { class: 'groups' },
      h('div', { class: 'groups-controls' },
        h('div', { class: 'segmented', role: 'group', 'aria-label': 'How to split the class' }, modeCount, modeSize),
        h('div', { class: 'stepper' },
          TT.button('', { icon: 'minus', kind: 'icon-only', aria: 'Fewer', onclick: function () { setN(state.n - 1); } }),
          nEl,
          TT.button('', { icon: 'plus', kind: 'icon-only', aria: 'More', onclick: function () { setN(state.n + 1); } })
        ),
        TT.button('Make Groups', { icon: 'shuffle', kind: 'primary big', onclick: make })
      ),
      hint,
      grid
    ));

    function save() { TT.save(KEY, state); }
    function setMode(m) { state.mode = m; save(); paintControls(); }
    function setN(n) { state.n = Math.max(2, Math.min(n, 12)); save(); paintControls(); }

    function plan() {
      var count = TT.roster.present().length;
      var groups = state.mode === 'count' ? state.n : Math.max(1, Math.round(count / state.n));
      groups = Math.max(1, Math.min(groups, count || 1));
      return { count: count, groups: groups };
    }
    function paintControls() {
      modeCount.classList.toggle('on', state.mode === 'count');
      modeSize.classList.toggle('on', state.mode === 'size');
      modeCount.setAttribute('aria-pressed', state.mode === 'count');
      modeSize.setAttribute('aria-pressed', state.mode === 'size');
      nEl.textContent = state.n;
      var p = plan();
      var min = Math.floor(p.count / p.groups), extra = p.count % p.groups;
      hint.textContent = p.count + ' students here today → ' + p.groups + ' groups of ' + min + (extra ? ' or ' + (min + 1) : '') + '.';
    }
    function make() {
      var names = TT.shuffle(TT.roster.present());
      var p = plan();
      var groups = [];
      for (var i = 0; i < p.groups; i++) groups.push([]);
      names.forEach(function (n, i) { groups[i % p.groups].push(n); });
      state.groups = groups; save();
      paintGroups(true);
    }
    function paintGroups(animate) {
      grid.textContent = '';
      if (!state.groups.length) {
        grid.append(h('div', { class: 'empty' }, 'Choose how to split the class, then press “Make Groups.”'));
        return;
      }
      state.groups.forEach(function (g, i) {
        var card = h('div', { class: 'group-card c-' + COLORS[i % COLORS.length] + (animate ? ' pop' : ''), style: animate ? 'animation-delay:' + (i * 60) + 'ms' : null },
          h('div', { class: 'group-head' }, h('span', { class: 'group-num', text: i + 1 }), h('h3', { text: 'Group ' + (i + 1) }), h('span', { class: 'muted', text: g.length + (g.length === 1 ? ' student' : ' students') })),
          h('ul', null, g.map(function (n) { return h('li', { text: n }); }))
        );
        grid.append(card);
      });
    }
    TT.roster.onChange(paintControls);
    paintControls();
    paintGroups(false);
  };
})();
