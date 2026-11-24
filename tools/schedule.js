// Daily Schedule (2026-11-24 look). Shows what is happening right now with a countdown ring, what is
// next, and the whole day as a colorful timeline. Each block gets a picture and color (picked from its
// name, or chosen by the teacher). A teacher can keep a few kinds of day, like a Regular Day and a
// 2-Hour Delay, and switch between them. The same code draws the small Schedule widget on the board.
(function () {
  var TT = window.TT, h = TT.h;
  function svg(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  // key, name, color, drawing, words in a block's name that pick this style
  var STYLES = [
    ['meeting', 'Meeting', 'amber', '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.900 4.900l1.400 1.400M17.700 17.700l1.400 1.400M2 12h2M20 12h2M4.900 19.100l1.400-1.400M17.700 6.300l1.400-1.400"/>', /meeting|morning|arrival|welcome|circle|calendar/],
    ['reading', 'Reading', 'cobalt', '<path d="M12 6c-2-1.500-5-2-8-1.500v13c3-.500 6 0 8 1.500 2-1.500 5-2 8-1.500v-13c-3-.500-6 0-8 1.500zM12 6v13"/>', /read|ela|phonics|library|story|book|literacy|spelling/],
    ['writing', 'Writing', 'violet', '<path d="M4 20l1-4L16.500 4.500a2.100 2.100 0 0 1 3 3L8 19l-4 1zM14.500 6.500l3 3"/>', /writ|journal|grammar|handwriting|language/],
    ['math', 'Math', 'coral', '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 12h.010M12 12h.010M16 12h.010M8 16h.010M12 16h.010M16 16h.010"/>', /math|number|fact/],
    ['science', 'Science', 'emerald', '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.800 3h10.400a2 2 0 0 0 1.800-3l-5-9V3M7.500 15h9"/>', /science|stem|lab|experiment/],
    ['social', 'Social Studies', 'sky', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>', /social|history|geography|world/],
    ['art', 'Specials and Art', 'rose', '<path d="M12 3a9 9 0 1 0 0 18c1.500 0 2-1 2-2 0-1.500 1-2 2.500-2H18a3 3 0 0 0 3-3c0-5-4-11-9-11z"/><path d="M7.500 12h.010M9.500 8h.010M14 7h.010"/>', /art|special|paint|draw|craft/],
    ['music', 'Music', 'violet', '<path d="M9 18V5l11-2v13"/><circle cx="6.500" cy="18" r="2.500"/><circle cx="17.500" cy="16" r="2.500"/>', /music|band|choir|sing/],
    ['move', 'Recess and Gym', 'lime', '<circle cx="12" cy="12" r="9"/><path d="M12 3c-2 3-2 6 0 9s2 6 0 9M3.500 9c3 1.500 6 1.500 8.500 3s5.500 1.500 8.500 3"/>', /recess|gym|p\.?e\.?$|p\.?e\.? |play|outside|brain break|movement/],
    ['food', 'Lunch and Snack', 'amber', '<path d="M12 7c-2-2-7-1.500-7 4 0 5 3.500 9 7 9s7-4 7-9c0-5.500-5-6-7-4zM12 7c0-2 1-3.500 3-4"/>', /lunch|snack|breakfast|eat/],
    ['tech', 'Computers', 'cobalt', '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 19h20"/>', /computer|tech|typing|coding|chromebook|ipad/],
    ['pack', 'Pack Up', 'sky', '<path d="M6 9a6 6 0 0 1 12 0v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM9 4.500V3h6v1.500M9 13h6v3H9z"/>', /pack|dismiss|bus|home|clean/],
    ['star', 'Something Else', 'coral', '<path d="M12 3l2.700 5.600 6.100.900-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.900z"/>', null]
  ];
  var BY = {}; STYLES.forEach(function (s) { BY[s[0]] = s; });
  function styleOf(b) {
    if (b.k && BY[b.k]) return BY[b.k];
    var n = (b.name || '').toLowerCase();
    for (var i = 0; i < STYLES.length; i++) if (STYLES[i][4] && STYLES[i][4].test(n)) return STYLES[i];
    return BY.star;
  }
  var CHECK = svg('<path d="M5 12.500l4.500 4.500L19 7.500"/>');
  var FLAG = svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>');

  var SAMPLE_DAY = { end: '15:00', blocks: [['08:00', 'Morning Meeting'], ['08:30', 'Reading'], ['09:45', 'Specials'], ['10:30', 'Math'], ['11:45', 'Lunch and Recess'], ['12:30', 'Writing'], ['13:30', 'Science'], ['14:30', 'Pack Up']] };
  function mins(t) { var p = /^(\d\d?):(\d\d)$/.exec(t || ''); return p ? +p[1] * 60 + +p[2] : null; }
  function clock(t) { var m = typeof t === 'number' ? t : mins(t); if (m == null) return ''; var hr = Math.floor(m / 60), mm = m % 60; return ((hr + 11) % 12 + 1) + ':' + (mm < 10 ? '0' : '') + mm; }
  function ampm(m) { return clock(m) + (m >= 720 ? ' PM' : ' AM'); }
  function hhmm(m) { m = Math.max(0, Math.min(1439, m)); var a = Math.floor(m / 60), b = m % 60; return (a < 10 ? '0' : '') + a + ':' + (b < 10 ? '0' : '') + b; }
  function span(n) { return n >= 60 ? Math.floor(n / 60) + ' hr' + (n % 60 ? ' ' + n % 60 + ' min' : '') : n + ' min'; }
  var listeners = [];
  function load() {
    var s = TT.load('schedule', null);
    if (!s || !Array.isArray(s.blocks)) s = { end: SAMPLE_DAY.end, blocks: SAMPLE_DAY.blocks.map(function (b) { return { t: b[0], name: b[1] }; }), sample: true };
    if (!Array.isArray(s.days) || !s.days.length) s.days = [{ name: 'Regular Day', end: s.end, blocks: s.blocks }];
    s.days.forEach(function (d) { if (!Array.isArray(d.blocks)) d.blocks = []; });
    s.cur = Math.max(0, Math.min(s.days.length - 1, s.cur | 0));
    return s;
  }

  TT.mountSchedule = function (el, opts) {
    var compact = !!(opts && opts.compact), state = load(), editing = false, lastCur = null, picking = -1;
    var root = h('div', { class: 'ds' + (compact ? ' compact' : '') });
    el.append(root);
    function day() { return state.days[state.cur]; }
    function save() {
      delete state.sample; state.end = day().end; state.blocks = day().blocks;   // the plain copy keeps older saved screens working
      TT.save('schedule', state); listeners.forEach(function (fn) { if (fn !== reload) fn(); });
    }
    function reload() { state = load(); lastCur = null; if (!editing) paint(); }
    listeners.push(reload);
    function sorted() { return day().blocks.filter(function (b) { return mins(b.t) != null && b.name; }).sort(function (a, b) { return mins(a.t) - mins(b.t); }); }
    function chip(st, cls) { return h('span', { class: 'ds-ico ' + (cls || ''), html: svg(st[3]) }); }
    function dayPills() {
      if (state.days.length < 2) return null;
      return h('div', { class: 'ds-days', role: 'group', 'aria-label': 'Kind of day' }, state.days.map(function (d, i) {
        return h('button', { type: 'button', class: 'ds-day' + (i === state.cur ? ' on' : ''), 'aria-pressed': i === state.cur ? 'true' : 'false', onclick: function () { state.cur = i; picking = -1; lastCur = null; save(); paint(); } }, d.name || 'Day ' + (i + 1));
      }));
    }

    function paint() {
      root.textContent = '';
      if (editing) { edit(); return; }
      var list = sorted(), c = TT.clock ? TT.clock() : null, d = new Date();
      var now = c ? c.hour * 60 + c.minute : d.getHours() * 60 + d.getMinutes(), end = mins(day().end);
      var cur = -1;
      list.forEach(function (b, i) { var stop = i + 1 < list.length ? mins(list[i + 1].t) : (end != null ? end : 24 * 60); if (now >= mins(b.t) && now < stop) cur = i; });
      if (lastCur != null && cur !== lastCur && cur >= 0 && state.chime && TT.chime && !compact) TT.chime();
      lastCur = cur;

      var top = h('div', { class: 'ds-top' }, dayPills(),
        h('div', { class: 'ds-clock' }, h('b', { text: ampm(now) }), c && !compact ? h('span', { text: c.text }) : null),
        compact ? h('button', { type: 'button', class: 'wb', onclick: function () { editing = true; paint(); } }, 'Edit')
          : TT.button('Edit Schedule', { icon: 'edit', onclick: function () { editing = true; paint(); } }));

      var hero, st;
      if (!list.length) {
        hero = h('div', { class: 'ds-hero c-sky' }, h('div', { class: 'ds-hero-text' }, h('span', { class: 'ds-eyebrow', text: 'No Schedule Yet' }), h('b', { class: 'ds-name', text: 'Add Your Day' }), h('span', { class: 'ds-sub', text: 'Press Edit Schedule to put in your day.' })));
      } else if (cur >= 0) {
        var stop = cur + 1 < list.length ? mins(list[cur + 1].t) : end, start = mins(list[cur].t);
        var left = stop != null ? stop - now : null, part = left != null ? (now - start) / (stop - start) : 0;
        st = styleOf(list[cur]);
        var nx = cur + 1 < list.length ? list[cur + 1] : null, nst = nx ? styleOf(nx) : null;
        hero = h('div', { class: 'ds-hero c-' + st[2] },
          h('div', { class: 'ds-hero-text' },
            h('span', { class: 'ds-eyebrow' }, h('i', { class: 'ds-live' }), 'Right Now'),
            h('div', { class: 'ds-name-row' }, chip(st, 'big'), h('b', { class: 'ds-name', text: list[cur].name })),
            h('span', { class: 'ds-sub', text: clock(start) + (stop != null ? ' to ' + clock(stop) : '') }),
            nx ? h('div', { class: 'ds-next c-' + nst[2] }, chip(nst), h('span', { class: 'ds-next-text' }, h('span', { text: 'Up Next at ' + clock(nx.t) }), h('b', { text: nx.name })))
              : (day().end ? h('div', { class: 'ds-next c-sky' }, h('span', { class: 'ds-ico', html: FLAG }), h('span', { class: 'ds-next-text' }, h('span', { text: 'Then at ' + clock(day().end) }), h('b', { text: 'End of the Day' }))) : null)),
          left != null ? h('div', { class: 'ds-ring', role: 'img', 'aria-label': span(left) + ' left', style: '--p:' + Math.round(part * 1000) / 10 },
            h('div', { class: 'ds-ring-in' }, h('b', { text: left >= 60 ? Math.floor(left / 60) + ':' + (left % 60 < 10 ? '0' : '') + left % 60 : String(left) }), h('span', { text: left >= 60 ? 'Hours Left' : left === 1 ? 'Minute Left' : 'Minutes Left' }))) : null);
      } else if (now < mins(list[0].t)) {
        st = styleOf(list[0]);
        hero = h('div', { class: 'ds-hero c-' + st[2] }, h('div', { class: 'ds-hero-text' }, h('span', { class: 'ds-eyebrow', text: 'Coming Up' }),
          h('div', { class: 'ds-name-row' }, chip(st, 'big'), h('b', { class: 'ds-name', text: list[0].name })),
          h('span', { class: 'ds-sub', text: 'Starts at ' + clock(list[0].t) + ', in ' + span(mins(list[0].t) - now) })));
      } else {
        hero = h('div', { class: 'ds-hero c-violet done' }, h('div', { class: 'ds-hero-text' }, h('span', { class: 'ds-eyebrow', text: 'All Done' }),
          h('div', { class: 'ds-name-row' }, h('span', { class: 'ds-ico big', html: svg(BY.star[3]) }), h('b', { class: 'ds-name', text: 'The School Day Is Over' })),
          h('span', { class: 'ds-sub', text: 'See you tomorrow!' })));
      }

      var rows = h('ol', { class: 'ds-list' });
      list.forEach(function (b, i) {
        var s = styleOf(b), stop = i + 1 < list.length ? mins(list[i + 1].t) : end, past = i < cur || (cur < 0 && now >= mins(b.t));
        rows.append(h('li', { class: 'ds-row c-' + s[2] + (i === cur ? ' now' : past ? ' past' : ''), style: '--i:' + i },
          h('time', { text: clock(b.t) }), past ? h('span', { class: 'ds-ico', html: CHECK }) : chip(s),
          h('span', { class: 'ds-row-name', text: b.name }),
          i === cur ? h('span', { class: 'ds-tag', text: 'Now' }) : (stop != null && stop > mins(b.t) ? h('span', { class: 'ds-len', text: span(stop - mins(b.t)) }) : null)));
      });
      if (list.length && day().end) rows.append(h('li', { class: 'ds-row end c-sky' + (end != null && now >= end ? ' past' : '') }, h('time', { text: clock(day().end) }), h('span', { class: 'ds-ico', html: FLAG }), h('span', { class: 'ds-row-name', text: 'End of the Day' })));
      root.append(top, h('div', { class: 'ds-main' }, hero, rows));
      if (state.sample && !compact) root.append(h('p', { class: 'roster-note warn', text: 'This is a sample day. Press Edit Schedule to put in your own.' }));
    }

    function edit() {
      var dy = day(), uid = Math.random().toString(36).slice(2, 6), rows = h('div', { class: 'ds-edit' });
      dy.blocks.sort(function (a, b) { return (mins(a.t) || 0) - (mins(b.t) || 0); });
      // Kinds of day
      var tabs = h('div', { class: 'ds-days' }, state.days.map(function (d, i) {
        return h('button', { type: 'button', class: 'ds-day' + (i === state.cur ? ' on' : ''), onclick: function () { state.cur = i; picking = -1; save(); paint(); } }, d.name || 'Day ' + (i + 1));
      }), state.days.length < 5 ? h('button', { type: 'button', class: 'ds-day add', title: 'Starts as a copy of this day', onclick: function () {
        state.days.push({ name: state.days.length === 1 ? '2-Hour Delay' : 'New Day', end: dy.end, blocks: dy.blocks.map(function (b) { return { t: b.t, name: b.name, k: b.k }; }) });
        state.cur = state.days.length - 1; picking = -1; save(); paint();
        var n = root.querySelector('.ds-day-name'); if (n) { n.focus(); n.select(); }
      } }, h('span', { html: TT.icon('plus') }), 'Add Another Kind of Day') : null);
      var nameIn = h('input', { type: 'text', class: 'ds-day-name', id: 'scd' + uid, maxlength: 24, 'aria-label': 'Name of this kind of day', placeholder: 'Like Early Release' });
      nameIn.value = dy.name || '';
      nameIn.addEventListener('input', function () { dy.name = nameIn.value; save(); var on = tabs.querySelector('.ds-day.on'); if (on) on.textContent = dy.name || 'Day ' + (state.cur + 1); });
      var shift = h('div', { class: 'ds-shift' }, h('span', { text: 'Move Every Time' }),
        [[-15, '15 Min Earlier'], [15, '15 Min Later']].map(function (s) {
          return h('button', { type: 'button', class: 'wb', onclick: function () { dy.blocks.forEach(function (b) { var m = mins(b.t); if (m != null) b.t = hhmm(m + s[0]); }); var e = mins(dy.end); if (e != null) dy.end = hhmm(e + s[0]); save(); paint(); } }, s[1]);
        }));
      var head = h('div', { class: 'ds-edit-head' },
        h('label', { class: 'cq-field', for: 'scd' + uid }, h('span', { text: 'This Day Is Called' }), nameIn),
        compact ? null : shift,
        state.days.length > 1 ? h('button', { type: 'button', class: 'wb ds-del', onclick: function () { state.days.splice(state.cur, 1); state.cur = 0; picking = -1; save(); paint(); } }, 'Delete This Kind of Day') : null);

      dy.blocks.forEach(function (b, i) {
        var t = h('input', { type: 'time', id: 'sct' + uid + i, 'aria-label': 'Start time' }), n = h('input', { type: 'text', id: 'scn' + uid + i, maxlength: 40, placeholder: 'Like Math', 'aria-label': 'What happens' });
        t.value = b.t || ''; n.value = b.name || '';
        var s = styleOf(b);
        var pic = h('button', { type: 'button', class: 'ds-pic c-' + s[2], title: 'Change the picture and color', 'aria-label': 'Change the picture and color', 'aria-expanded': picking === i ? 'true' : 'false', html: svg(s[3]), onclick: function () { picking = picking === i ? -1 : i; paint(); } });
        t.addEventListener('input', function () { b.t = t.value; save(); });
        n.addEventListener('input', function () { b.name = n.value; save(); if (!b.k) { var z = styleOf(b); pic.className = 'ds-pic c-' + z[2]; pic.innerHTML = svg(z[3]); } });
        rows.append(h('div', { class: 'ds-erow' }, pic, t, n, h('button', { type: 'button', class: 'cq-x', 'aria-label': 'Remove this block', title: 'Remove', html: TT.icon('trash'), onclick: function () { dy.blocks.splice(i, 1); picking = -1; save(); paint(); } })));
        if (picking === i) rows.append(h('div', { class: 'ds-picker', role: 'group', 'aria-label': 'Picture and color' }, STYLES.map(function (z) {
          return h('button', { type: 'button', class: 'ds-pic c-' + z[2] + (s === z ? ' on' : ''), title: z[1], 'aria-label': z[1], html: svg(z[3]), onclick: function () { b.k = z[0]; picking = -1; save(); paint(); } });
        }), b.k ? h('button', { type: 'button', class: 'wb', onclick: function () { delete b.k; picking = -1; save(); paint(); } }, 'Pick It for Me') : null));
      });
      var endIn = h('input', { type: 'time', id: 'sce' + uid, 'aria-label': 'End of the day' });
      endIn.value = dy.end || ''; endIn.addEventListener('input', function () { dy.end = endIn.value; save(); });
      var chime = h('input', { type: 'checkbox', id: 'scc' + uid }); chime.checked = !!state.chime;
      chime.addEventListener('change', function () { state.chime = chime.checked; save(); if (chime.checked && TT.chime) TT.chime(); });
      root.append(h('div', { class: 'ds-edit-top' }, h('h2', { class: 'ds-edit-title', text: 'Edit Schedule' }), tabs), head,
        h('p', { class: 'muted ds-help', text: 'Type when each part of the day starts. Each one runs until the next begins. Click a picture to change it.' }), rows,
        h('div', { class: 'ds-erow end' }, h('span', { class: 'ds-pic c-sky flat', html: FLAG }), endIn, h('b', { text: 'End of the Day' })),
        h('div', { class: 'ds-edit-foot' },
          TT.button('Add a Block', { icon: 'plus', kind: compact ? 'small' : '', onclick: function () { var last = dy.blocks[dy.blocks.length - 1]; dy.blocks.push({ t: last && last.t ? last.t : '08:00', name: '' }); picking = -1; save(); paint(); var ins = root.querySelectorAll('.ds-erow input[type=text]'); if (ins.length) ins[ins.length - 1].focus(); } }),
          compact ? null : h('label', { class: 'ds-check', for: 'scc' + uid }, chime, h('span', { text: 'Play a Chime When a New Block Starts' })),
          TT.button('Done', { kind: 'primary' + (compact ? ' small' : ''), onclick: function () { editing = false; picking = -1; state.days.forEach(function (d) { d.blocks = d.blocks.filter(function (b) { return b.name && b.name.trim(); }); if (!d.name || !d.name.trim()) d.name = 'Regular Day'; }); save(); paint(); } })));
    }
    paint();
    var iv = setInterval(function () { if (!editing) paint(); }, 15000);
    return { show: function () { reload(); }, destroy: function () { clearInterval(iv); listeners.splice(listeners.indexOf(reload), 1); } };
  };
})();
