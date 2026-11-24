// Class Jobs (2026-11-24 look). Each job is a card with one of Kevin's job stickers (assets/jobs/),
// the job name and the student who has it this round. Rotate moves everyone on by one job.
// Jobs are saved as plain names like before; a picture a teacher picks is saved in state.icons.
(function () {
  var TT = window.TT, h = TT.h;
  var DEFAULT_JOBS = ['Line Leader', 'Door Holder', 'Paper Passer', 'Librarian', 'Tech Helper', 'Messenger', 'Plant Helper', 'Board Cleaner', 'Lunch Helper', 'Caboose'];
  // sticker file, name, color, words in a job's name that pick it
  var STICKERS = [
    ['line-leader', 'Line Leader', 'cobalt', /line|leader|first/], ['door-holder', 'Door Holder', 'coral', /door/], ['paper-passer', 'Paper Passer', 'emerald', /paper|pass|hand ?out|collect|supply|supplies/],
    ['librarian', 'Librarian', 'amber', /librar|book|read/], ['tech-helper', 'Tech Helper', 'violet', /tech|computer|chromebook|ipad|laptop|device/], ['messenger', 'Messenger', 'rose', /messenger|mail|office|errand|note/],
    ['plant-helper', 'Plant Helper', 'sky', /plant|water|garden/], ['board-cleaner', 'Board Cleaner', 'emerald', /board|eraser|clean|tidy|custodian/], ['lunch-helper', 'Lunch Helper', 'cobalt', /lunch|snack|cafeteria|milk|food/],
    ['caboose', 'Caboose', 'coral', /caboose|last|end of|light/]
  ];
  var BY = {}; STICKERS.forEach(function (s) { BY[s[0]] = s; });
  var SPARE = ['violet', 'sky', 'lime', 'rose', 'amber', 'cobalt', 'emerald', 'coral'];
  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.500l2.900 6.100 6.600.900-4.800 4.600 1.200 6.600L12 17.500l-5.900 3.200 1.200-6.600L2.500 9.500l6.600-.900z"/></svg>';
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  TT.mountJobs = function (el) {
    var state = TT.load('jobs', null) || { jobs: DEFAULT_JOBS.slice(), byClass: {} };
    if (!Array.isArray(state.jobs)) state.jobs = DEFAULT_JOBS.slice();
    if (!state.byClass) state.byClass = {};
    if (!state.icons) state.icons = {};
    var editing = false, draft = null, picking = -1, root = h('div', { class: 'cj' });
    el.textContent = ''; el.append(root);
    function save() { TT.save('jobs', state); }
    function stickerOf(name, icons) {
      var k = (icons || state.icons)[name];
      if (k === 'none') return null;
      if (k && BY[k]) return BY[k];
      var n = (name || '').toLowerCase();
      for (var i = 0; i < STICKERS.length; i++) if (STICKERS[i][3].test(n)) return STICKERS[i];
      return null;
    }
    function art(st, i, cls) {
      return st ? h('span', { class: 'cj-art ' + (cls || '') }, h('img', { src: '/assets/jobs/' + st[0] + '.webp', alt: '', draggable: 'false' }))
        : h('span', { class: 'cj-art plain ' + (cls || ''), html: STAR });
    }
    // Each class keeps its own order of students and its own place in the rotation.
    function cls() {
      var id = TT.roster.isSample() ? 'sample' : TT.roster.activeId(), names = TT.roster.all();
      var c = state.byClass[id] = state.byClass[id] || { order: [], offset: 0 };
      c.order = c.order.filter(function (n) { return names.indexOf(n) >= 0; });
      names.forEach(function (n) { if (c.order.indexOf(n) < 0) c.order.push(n); });
      return c;
    }

    function paint(anim) {
      root.textContent = '';
      if (editing) { edit(); return; }
      var c = cls(), n = c.order.length, used = {};
      var grid = h('div', { class: 'cj-grid' + (anim && !still ? ' ' + anim : '') });
      state.jobs.forEach(function (j, i) {
        var who = n ? c.order[(((i - c.offset) % n) + n) % n] : '';
        if (n && i >= n) who = '';
        if (who) used[who] = 1;
        var st = stickerOf(j), color = st ? st[2] : SPARE[i % SPARE.length];
        grid.append(h('div', { class: 'cj-card c-' + color + (who ? '' : ' open'), style: '--i:' + i },
          art(st, i), h('div', { class: 'cj-text' }, h('span', { class: 'cj-job', text: j }), h('b', { class: 'cj-who', text: who || 'Open' }))));
      });
      if (!state.jobs.length) grid.append(h('div', { class: 'empty', text: 'No jobs yet. Press Edit Jobs to add some.' }));
      var rest = c.order.filter(function (s) { return !used[s]; });
      var sample = TT.roster.isSample();
      root.append(h('div', { class: 'cj-bar' },
        h('button', { type: 'button', class: 'cj-rotate', onclick: function () { c.offset = (c.offset + 1) % Math.max(1, n); save(); paint('rotate'); TT.tick(); } }, h('span', { class: 'cj-rotate-ico', html: TT.icon('arrow') }), h('span', { text: 'Rotate Jobs' })),
        h('button', { type: 'button', class: 'cj-btn', onclick: function () { c.order = TT.shuffle(c.order); c.offset = 0; save(); paint('shuffle'); if (TT.chime) TT.chime(); } }, h('span', { html: TT.icon('shuffle') }), 'Shuffle'),
        h('button', { type: 'button', class: 'cj-btn', onclick: function () { editing = true; draft = null; paint(); } }, h('span', { html: TT.icon('edit') }), 'Edit Jobs'),
        h('span', { class: 'cj-class' + (sample ? ' warn' : ''), text: sample ? 'Sample Names' : TT.roster.activeName() })),
        grid);
      if (rest.length && state.jobs.length) root.append(h('div', { class: 'cj-rest' }, h('h3', {}, 'On Break This Round ', h('span', { text: rest.length })),
        h('div', { class: 'cj-chips' }, rest.map(function (s) { return h('span', { class: 'cj-chip', text: s }); }))));
      if (sample) root.append(h('p', { class: 'roster-note warn', text: 'Using sample names. Add your class on the Name Picker page and the jobs will use it.' }));
    }

    function edit() {
      if (!draft) draft = state.jobs.map(function (j) { return { name: j, was: j, k: state.icons[j] || '' }; });
      var rows = h('div', { class: 'cj-edit' });
      draft.forEach(function (d, i) {
        var icons = {}; if (d.k) icons[d.name] = d.k;
        var st = stickerOf(d.name, icons);
        var pic = h('button', { type: 'button', class: 'cj-pic', title: 'Change the Picture', 'aria-label': 'Change the picture', 'aria-expanded': picking === i ? 'true' : 'false', onclick: function () { picking = picking === i ? -1 : i; paint(); } }, art(st, i, 'small'));
        var name = h('input', { type: 'text', maxlength: 28, placeholder: 'Like Pencil Sharpener', 'aria-label': 'Job name' }); name.value = d.name;
        name.addEventListener('input', function () { d.name = name.value; if (!d.k) { var z = stickerOf(d.name, {}); pic.textContent = ''; pic.append(art(z, i, 'small')); } });
        rows.append(h('div', { class: 'cj-erow' }, h('span', { class: 'cj-num', text: i + 1 }), pic, name,
          h('button', { type: 'button', class: 'cq-x', 'aria-label': 'Remove this job', title: 'Remove', html: TT.icon('trash'), onclick: function () { draft.splice(i, 1); picking = -1; paint(); } })));
        if (picking === i) rows.append(h('div', { class: 'cj-picker', role: 'group', 'aria-label': 'Picture' }, STICKERS.map(function (z) {
          return h('button', { type: 'button', class: 'cj-pic' + (st === z ? ' on' : ''), title: z[1], 'aria-label': z[1], onclick: function () { d.k = z[0]; picking = -1; paint(); } }, art(z, 0, 'small'));
        }), h('button', { type: 'button', class: 'cj-pic' + (!st ? ' on' : ''), title: 'A Star', 'aria-label': 'A star', onclick: function () { d.k = 'none'; picking = -1; paint(); } }, art(null, 0, 'small'))));
      });
      root.append(h('div', { class: 'cj-edit-top' }, h('h2', { text: 'Edit Jobs' }), h('p', { class: 'muted', text: 'Rename, add or remove jobs. Click a picture to change it.' })), rows,
        h('div', { class: 'cj-edit-foot' },
          draft.length < 40 ? h('button', { type: 'button', class: 'cj-btn', onclick: function () { draft.push({ name: '', was: '', k: '' }); picking = -1; paint(); var ins = root.querySelectorAll('.cj-erow input'); if (ins.length) ins[ins.length - 1].focus(); } }, h('span', { html: TT.icon('plus') }), 'Add a Job') : null,
          h('button', { type: 'button', class: 'cj-btn quiet', onclick: function () { editing = false; draft = null; picking = -1; paint(); } }, 'Cancel'),
          TT.button('Save Jobs', { kind: 'primary', onclick: function () {
            var list = draft.filter(function (d) { return d.name && d.name.trim(); });
            state.jobs = list.map(function (d) { return d.name.trim(); }); state.icons = {};
            list.forEach(function (d) { if (d.k) state.icons[d.name.trim()] = d.k; });
            editing = false; draft = null; picking = -1; save(); paint();
          } })));
    }
    TT.roster.onChange(function () { if (!editing) paint(); });
    paint();
    return { show: function () { if (!editing) paint(); } };
  };
})();
