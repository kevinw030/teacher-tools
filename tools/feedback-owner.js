// Owner Dashboard: the Feedback section. Every "Suggest an Idea or Report a Bug" note (assets/feedback.js)
// shows here as a card, with filters and a Mark as Done button. Only the owner account can read the
// notes (row security in supabase/feedback.sql), so this file is safe to ship as public code.
// tools/owner.js puts TT.ownerFeedback() into the dashboard. The section keeps its own state, so the
// rest of the dashboard can repaint without losing the filters.
(function () {
  var TT = window.TT, h = TT && TT.h;
  if (!TT) return;
  var SQL = 'https://github.com/kevinw030/teacher-tools/blob/main/supabase/feedback.sql';
  var KIND = {
    tool: ['Tool Idea', 'var(--violet)'],
    idea: ['Idea', 'var(--amber)'],
    bug: ['Bug', 'var(--rose)']
  };
  var node = null, rows = null, loading = false, error = '', missing = false;
  var show = 'new', type = 'all', query = '', shown = 20;

  function when(d) {
    var t = new Date(d), s = (Date.now() - t) / 1000;
    if (s < 90) return 'Just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' hr ago';
    if (s < 86400 * 7) { var n = Math.round(s / 86400); return n + (n === 1 ? ' day ago' : ' days ago'); }
    return t.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function full(d) { return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }

  function load() {
    var sb = TT.account && TT.account.client && TT.account.client();
    if (!sb || loading) return;
    loading = true; error = '';
    sb.from('feedback').select('id, created_at, name, email, kind, message, page, browser, status, done_at')
      .order('created_at', { ascending: false }).limit(500).then(function (res) {
        loading = false;
        if (res.error) {
          var m = (res.error.message || '') + ' ' + (res.error.code || '');
          missing = /42P01|PGRST205|does not exist|could not find the table/i.test(m);
          error = missing ? '' : 'Couldn’t load feedback: ' + (res.error.message || 'unknown error') + '.';
        } else { rows = res.data || []; missing = false; }
        paint();
      }, function () { loading = false; error = 'You’re offline. Try again in a minute.'; paint(); });
  }

  function setStatus(f, status, btn) {
    btn.disabled = true;
    TT.account.client().from('feedback').update({ status: status }).eq('id', f.id).then(function (res) {
      btn.disabled = false;
      if (res.error) { btn.lastChild.textContent = 'Didn’t Save, Try Again'; return; }
      f.status = status; f.done_at = status === 'done' ? new Date().toISOString() : null;
      paint();
    }, function () { btn.disabled = false; });
  }

  function chip(label, on, onclick, color) {
    var b = h('button', { type: 'button', class: 'seg' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: onclick }, label);
    if (color) b.style.setProperty('--fbo-c', color);
    return b;
  }

  function item(f) {
    var k = KIND[f.kind] || ['Note', 'var(--cobalt)'];
    var name = f.name || (f.email || 'Someone').split('@')[0];
    var done = f.status === 'done';
    var btn = TT.button(done ? 'Move Back to New' : 'Mark as Done', { kind: 'small' + (done ? '' : ' fbo-done-btn'), icon: done ? 'reset' : null,
      onclick: function () { setStatus(f, done ? 'new' : 'done', btn); } });
    if (!done) btn.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>');
    var subject = 'Re: Your ' + k[0] + ' for ED Sidekick';
    var card = h('article', { class: 'fbo-item' + (done ? ' is-done' : '') },
      h('div', { class: 'fbo-top' },
        h('span', { class: 'fbo-kind', text: k[0] }),
        h('span', { class: 'fbo-who' }, h('strong', { text: name }), f.email ? h('span', { class: 'muted', text: f.email }) : null),
        h('time', { class: 'fbo-when muted', datetime: f.created_at, title: full(f.created_at), text: when(f.created_at) })),
      h('p', { class: 'fbo-msg', text: f.message }),
      h('div', { class: 'fbo-meta muted' },
        f.page ? h('span', null, 'Page: ', h('a', { href: f.page, text: f.page })) : null,
        f.browser ? h('span', { text: f.browser }) : null,
        done && f.done_at ? h('span', { text: 'Marked Done: ' + when(f.done_at) }) : null),
      h('div', { class: 'fbo-actions' }, btn,
        f.email ? h('a', { class: 'btn small', href: 'mailto:' + encodeURIComponent(f.email).replace(/%40/, '@') + '?subject=' + encodeURIComponent(subject) }, 'Reply by Email') : null));
    card.style.setProperty('--fbo-c', k[1]);
    return card;
  }

  function paint() {
    if (!node) return;
    node.textContent = '';
    var all = rows || [];
    var fresh = all.filter(function (f) { return f.status !== 'done'; }).length;
    var head = h('div', { class: 'od-card-head fbo-head' },
      h('div', null,
        h('h2', null, 'Feedback', fresh ? h('span', { class: 'fbo-new', text: fresh + ' New' }) : null),
        h('p', { class: 'muted', text: 'Tool ideas, ideas and bug reports from members. A copy of each one is also emailed to you.' })),
      TT.button('Refresh', { kind: 'small', icon: 'reset', onclick: function () { load(); paint(); } }));
    node.append(head);

    if (missing) {
      var p = h('p', { class: 'od-empty' }, 'One setup step left. Open ', h('a', { href: SQL, target: '_blank', rel: 'noopener', text: 'feedback.sql' }),
        ', copy it, paste it into Supabase (SQL Editor, New Query), click Run, then press Refresh.');
      node.append(p); return;
    }
    if (error) { node.append(h('p', { class: 'od-empty', text: error })); return; }
    if (!rows) { node.append(h('p', { class: 'od-empty', text: loading ? 'Loading feedback…' : 'Feedback will show here.' })); return; }

    var count = function (fn) { return all.filter(fn).length; };
    var inShow = function (f) { return show === 'all' || (show === 'done' ? f.status === 'done' : f.status !== 'done'); };
    var tools = h('div', { class: 'fbo-tools' },
      h('div', { class: 'segmented od-tabs', role: 'group', 'aria-label': 'Show' },
        chip('New (' + fresh + ')', show === 'new', function () { show = 'new'; shown = 20; paint(); }),
        chip('Done (' + count(function (f) { return f.status === 'done'; }) + ')', show === 'done', function () { show = 'done'; shown = 20; paint(); }),
        chip('All (' + all.length + ')', show === 'all', function () { show = 'all'; shown = 20; paint(); })),
      h('div', { class: 'segmented od-tabs', role: 'group', 'aria-label': 'Type' },
        chip('All Types', type === 'all', function () { type = 'all'; shown = 20; paint(); }),
        Object.keys(KIND).map(function (id) {
          var n = count(function (f) { return f.kind === id && inShow(f); });
          return chip(KIND[id][0] + 's (' + n + ')', type === id, function () { type = id; shown = 20; paint(); }, KIND[id][1]);
        })));
    var search = h('input', { type: 'search', class: 'od-search', placeholder: 'Search notes, names or emails', 'aria-label': 'Search feedback', value: query });
    tools.append(search);
    node.append(tools);

    var list = h('div', { class: 'fbo-list' });
    node.append(list);
    function fill() {
      list.textContent = '';
      var q = query.trim().toLowerCase();
      var r = all.filter(function (f) {
        return inShow(f) && (type === 'all' || f.kind === type) &&
          (!q || [f.message, f.name, f.email, f.page].join(' ').toLowerCase().indexOf(q) >= 0);
      });
      if (!r.length) {
        list.append(h('p', { class: 'od-empty', text: !all.length ? 'No feedback yet. Notes from the Suggest an Idea button land here.'
          : show === 'new' && !q && type === 'all' ? 'All caught up! Every note is marked done.' : 'No notes match.' }));
        return;
      }
      r.slice(0, shown).forEach(function (f) { list.append(item(f)); });
      if (r.length > shown) list.append(TT.button('Show More (' + (r.length - shown) + ' more)', { kind: 'small', onclick: function () { shown += 20; fill(); } }));
    }
    search.addEventListener('input', function () { query = search.value; shown = 20; fill(); });
    fill();
  }

  // The dashboard asks for this section each time it paints. The same box is handed back, so filters stay put.
  TT.ownerFeedback = function () {
    if (!node) { node = h('section', { class: 'od-card od-wide fbo', id: 'owner-feedback' }); paint(); }
    if (!rows && !loading && !missing) load();
    return node;
  };
  TT.ownerFeedback.refresh = function () { load(); };
})();
