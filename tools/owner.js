// Owner Dashboard (#owner): traffic, most-used tools, every account, members, income, and a switch
// that previews the site as Free or Premium. Only the owner account sees any numbers: the database
// functions in supabase/owner-dashboard.sql check the signed-in account before they answer, so the
// numbers can't be read by anyone else even though this page is public code.
(function () {
  var TT = window.TT, h = TT.h;
  var RANGES = [[1, 'Today'], [7, '7 Days'], [30, '30 Days'], [90, '90 Days'], [3650, 'All Time']];
  var PLAN_NAME = { free: 'Free', premium: 'Premium', owner: 'Owner' };
  var PLAN_COLOR = { free: 'var(--cobalt)', premium: 'var(--coral)', owner: 'var(--emerald)' };
  var ROOMS = { library: 'The Locked Library', space: 'Stuck on the Space Station', pirate: 'The Pirate’s Treasure', museum: 'Night at the Museum', 'my-room': 'Teachers’ Own Rooms' };
  var FEATURES = { rooms: 'Escape Rooms', roomedit: 'Edit Room Questions', seating: 'Seating Chart', prompts: 'Prompts', screens: 'More Board Screens', classes: 'More Class Lists', trivia: 'More Trivia', plan: 'Plan Button' };
  var GITHUB_SQL = 'https://github.com/kevinw030/teacher-tools/blob/main/supabase/owner-dashboard.sql';

  function tz() {
    var t = TT.settings && TT.settings.tz;
    if (t && t !== 'auto') return t;
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
  }
  function dayKey(d) { try { return new Date(d).toLocaleDateString('en-CA', { timeZone: tz() }); } catch (e) { return new Date(d).toISOString().slice(0, 10); } }
  function num(n) { return (+n || 0).toLocaleString(); }
  function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '–'; }
  function money(cents) { return '$' + ((cents || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function shortDate(d) { return d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: tz() }) : '–'; }
  function keyLabel(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  function ago(d) {
    if (!d) return 'Never';
    var s = (Date.now() - new Date(d)) / 1000;
    if (s < 90) return 'Just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' hr ago';
    if (s < 86400 * 45) { var n = Math.round(s / 86400); return n + (n === 1 ? ' day ago' : ' days ago'); }
    return shortDate(d);
  }
  function titleCase(s) { return String(s || '').replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); }); }
  function lastActive(u) { return [u.last_seen, u.last_sign_in, u.last_saved].filter(Boolean).sort().pop() || null; }

  // ---------- What each page is called and which group it belongs to ----------
  var pageInfo = null;
  function pages() {
    if (pageInfo) return pageInfo;
    pageInfo = { home: ['Home', 'pages'], board: ['Classroom Board', 'tools'], games: ['Games List', 'pages'], account: ['My Account', 'pages'], settings: ['Settings', 'pages'], 'my-questions': ['My Questions', 'tools'] };
    var menus = document.querySelectorAll('.nav .nav-menu');
    [['daily', 0], ['tools', 1]].forEach(function (m) {
      var menu = menus[m[1]]; if (!menu) return;
      menu.querySelectorAll('a[data-view]').forEach(function (a) { var v = a.getAttribute('data-view'); if (!pageInfo[v] || v !== 'my-questions') pageInfo[v] = [a.textContent.trim(), m[0]]; });
    });
    (TT.games || []).forEach(function (g) { pageInfo[g.id] = [g.title, 'games']; });
    return pageInfo;
  }
  function pageName(id) { var p = pages()[id]; return p ? p[0] : titleCase(id); }
  function pageGroup(id) { var p = pages()[id]; return p ? p[1] : 'pages'; }

  // ---------- Small building blocks ----------
  function card(title, sub, body, cls) {
    return h('section', { class: 'od-card ' + (cls || '') },
      h('div', { class: 'od-card-head' }, h('h2', { text: title }), sub ? h('p', { class: 'muted', text: sub }) : null), body);
  }
  function tile(label, value, sub, color) {
    var t = h('div', { class: 'od-tile' }, h('span', { class: 'od-tile-label', text: label }), h('strong', { class: 'od-tile-value', text: value }), sub ? h('span', { class: 'od-tile-sub', text: sub }) : null);
    if (color) t.style.setProperty('--c', color);
    return t;
  }
  function empty(text) { return h('p', { class: 'od-empty', text: text }); }
  // Ranked list with a bar behind each row.
  function bars(rows, color, unit) {
    if (!rows.length) return empty('Nothing yet. This fills in as people use the site.');
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; })) || 1;
    var box = h('ol', { class: 'od-bars' });
    if (color) box.style.setProperty('--c', color);
    rows.forEach(function (r) {
      var li = h('li', { title: r.label + ': ' + num(r.value) + ' ' + (unit || '') + (r.sub ? ' · ' + r.sub : '') },
        h('span', { class: 'od-bar-fill', style: 'width:' + Math.max(2, r.value / max * 100) + '%' }),
        h('span', { class: 'od-bar-label', text: r.label }),
        h('span', { class: 'od-bar-value', text: num(r.value) + (r.sub ? ' · ' + r.sub : '') }));
      box.append(li);
    });
    return box;
  }
  // Columns over time or over hours. pts: [{label, value, tip}]
  function columns(pts, color, opts) {
    opts = opts || {};
    var max = Math.max.apply(null, pts.map(function (p) { return p.value; })) || 0;
    var wrap = h('div', { class: 'od-cols-wrap' });
    if (color) wrap.style.setProperty('--c', color);
    if (!max) { wrap.append(empty(opts.empty || 'Nothing yet in this range.')); return wrap; }
    var cols = h('div', { class: 'od-cols' + (pts.length > 40 ? ' dense' : '') });
    var every = Math.ceil(pts.length / (opts.labels || 8));
    pts.forEach(function (p, i) {
      cols.append(h('div', { class: 'od-col', tabindex: '0', 'data-tip': p.tip || (p.label + ': ' + num(p.value)), 'aria-label': p.tip || (p.label + ': ' + num(p.value)) },
        h('span', { class: 'od-col-bar' + (p.value ? '' : ' zero'), style: 'height:' + (p.value / max * 100) + '%' }),
        h('span', { class: 'od-col-label', text: i % every === 0 || i === pts.length - 1 && pts.length < 10 ? p.label : '' })));
    });
    wrap.append(h('div', { class: 'od-cols-max', text: 'Top: ' + num(max) }), cols);
    return wrap;
  }
  // One bar split into parts, with a legend that names each part.
  function split(parts) {
    var total = parts.reduce(function (s, p) { return s + p.value; }, 0);
    if (!total) return empty('Nothing yet.');
    var bar = h('div', { class: 'od-split', role: 'img', 'aria-label': parts.map(function (p) { return p.label + ' ' + p.value; }).join(', ') });
    var legend = h('ul', { class: 'od-legend' });
    parts.forEach(function (p) {
      if (p.value) { var s = h('span', { title: p.label + ': ' + num(p.value) + ' (' + pct(p.value, total) + ')', style: 'flex:' + p.value + ';background:' + p.color }); bar.append(s); }
      legend.append(h('li', null, h('i', { style: 'background:' + p.color }), h('span', { text: p.label }), h('b', { text: num(p.value) + ' · ' + pct(p.value, total) })));
    });
    return h('div', null, bar, legend);
  }

  // Days in the chosen range, oldest first. Long ranges are grouped into weeks.
  function dayList(days, startFrom) {
    var out = [], noon = new Date(); noon.setHours(12, 0, 0, 0);
    var n = days;
    if (startFrom) { var back = Math.ceil((noon - new Date(startFrom)) / 86400000) + 1; n = Math.max(1, Math.min(days, back)); }
    for (var i = n - 1; i >= 0; i--) out.push(dayKey(noon.getTime() - i * 86400000));
    return out;
  }
  function series(keys, counts) {
    var pts = keys.map(function (k) { return { key: k, label: keyLabel(k), value: counts[k] || 0 }; });
    if (pts.length <= 92) return pts;
    var weeks = [];
    for (var i = 0; i < pts.length; i += 7) {
      var chunk = pts.slice(i, i + 7);
      weeks.push({ label: chunk[0].label, value: chunk.reduce(function (s, p) { return s + p.value; }, 0), tip: 'Week of ' + chunk[0].label });
    }
    weeks.forEach(function (w) { w.tip += ': ' + num(w.value); });
    return weeks;
  }

  // ---------- The page ----------
  TT.mountOwner = function (el) {
    var root = h('div', { class: 'od' });
    el.append(root);
    var range = TT.load('owner-range', 30), userQuery = '', userPlan = 'all', userSort = 'new', userShown = 40, topTab = 'all';
    var data = null, users = null, loading = false;

    function shell(node) { root.textContent = ''; root.append(node); }
    function message(title, text, extra) { shell(h('section', { class: 'od-card od-msg' }, h('h2', { text: title }), h('p', { class: 'muted', text: text }), extra || null)); }

    function load() {
      if (!TT.account || !TT.account.enabled) return message('Accounts Are Off', 'Turn accounts on to use the Owner Dashboard.');
      var sb = TT.account.client();
      if (!sb) { message('Loading…', 'Connecting to your account.'); setTimeout(load, 700); return; }
      if (!TT.account.signedIn()) {
        return message('Owner Only', 'Sign in with the owner account to see the dashboard.', h('a', { class: 'btn primary', href: '#account' }, 'Sign In'));
      }
      if (loading) return; loading = true;
      if (!data) message('Loading…', 'Gathering your numbers.');
      Promise.all([sb.rpc('owner_stats', { days: range, tz: tz() }), sb.rpc('owner_users')]).then(function (res) {
        loading = false;
        var err = res[0].error || res[1].error;
        if (err) {
          if (/owner only|42501/i.test((err.message || '') + (err.code || ''))) return message('Owner Only', 'This page is just for the site owner. Your account doesn’t have access.');
          if (/PGRST202|could not find|does not exist/i.test((err.message || '') + (err.code || ''))) return setupCard();
          return message('Couldn’t Load the Dashboard', 'Something went wrong: ' + (err.message || 'unknown error') + '. Try Refresh in a minute.', TT.button('Try Again', { kind: 'primary', onclick: load }));
        }
        data = res[0].data || {}; users = res[1].data || [];
        paint();
      }, function () { loading = false; message('You’re Offline', 'Connect to the internet, then try again.', TT.button('Try Again', { kind: 'primary', onclick: load })); });
    }

    function setupCard() {
      shell(h('section', { class: 'od-card od-msg' },
        h('h2', { text: 'One Setup Step Left' }),
        h('p', { class: 'muted', text: 'The dashboard needs its owner-only database functions. This takes about a minute:' }),
        h('ol', { class: 'od-steps' },
          h('li', null, 'Open ', h('a', { href: GITHUB_SQL, target: '_blank', rel: 'noopener', text: 'owner-dashboard.sql' }), ' and click the copy button (two little squares) above the code.'),
          h('li', { text: 'In Supabase, open SQL Editor, then New Query.' }),
          h('li', { text: 'Paste, click Run, and come back here.' })),
        TT.button('I Ran It, Check Again', { kind: 'primary', onclick: load })));
    }

    // ---------- Sections ----------
    function header() {
      var seg = h('div', { class: 'segmented od-range', role: 'group', 'aria-label': 'Date range' }, RANGES.map(function (r) {
        return h('button', { type: 'button', class: 'seg' + (range === r[0] ? ' on' : ''), 'aria-pressed': range === r[0] ? 'true' : 'false',
          onclick: function () { if (range !== r[0]) { range = r[0]; TT.save('owner-range', range); load(); } } }, r[1]);
      }));
      var first = data.first_event ? shortDate(data.first_event) : 'today';
      return h('div', { class: 'od-top' },
        h('p', { class: 'od-note', text: 'Visits count from the day the counter went live (' + first + '). Your own visits aren’t counted, and neither are browsers set to “Do Not Track”. Times are in ' + tz().replace(/_/g, ' ') + '.' }),
        h('div', { class: 'od-controls' }, seg, TT.button('Refresh', { kind: 'small', icon: 'reset', onclick: load })));
    }

    function previewCard() {
      var now = TT.account.viewAs() || 'owner';
      var opts = [['owner', 'Owner', 'Everything, with Premium tags shown'], ['free', 'Free', 'Exactly what Free members see'], ['premium', 'Premium', 'Exactly what Premium members see']];
      return card('View the Site As', 'Switch how the site looks for you. This only changes your view on this computer. Your account stays the owner account and none of your work is touched.',
        h('div', { class: 'od-view' }, opts.map(function (o) {
          return h('button', { type: 'button', class: 'od-view-btn' + (now === o[0] ? ' on' : ''), 'aria-pressed': now === o[0] ? 'true' : 'false',
            onclick: function () { if (now !== o[0]) TT.account.setViewAs(o[0] === 'owner' ? '' : o[0]); } },
            h('strong', { text: o[1] }), h('span', { text: o[2] }));
        })), 'od-preview');
    }

    function kpis() {
      var count = { free: 0, premium: 0, owner: 0 };
      users.forEach(function (u) { count[u.plan] = (count[u.plan] || 0) + 1; });
      var since = new Date(data.since), fresh = users.filter(function (u) { return new Date(u.joined) >= since; }).length;
      var paid = (data.payments || []).reduce(function (s, p) { return s + (p.status === 'refunded' ? -p.amount_cents : p.amount_cents); }, 0);
      var label = RANGES.filter(function (r) { return r[0] === range; })[0][1];
      return h('div', { class: 'od-tiles' },
        tile('Visitors', num(data.visitors), label + ' · ' + num(data.today_visitors) + ' today', 'var(--sky)'),
        tile('Page Views', num(data.views), (data.visitors ? (data.views / data.visitors).toFixed(1) : '0') + ' pages per visitor', 'var(--violet)'),
        tile('Accounts', num(users.length), num(fresh) + ' new · ' + label, 'var(--ink)'),
        tile('Free Members', num(count.free), pct(count.free, users.length) + ' of accounts', PLAN_COLOR.free),
        tile('Premium Members', num(count.premium), pct(count.premium, users.length) + ' of accounts', PLAN_COLOR.premium),
        tile('Income', money(paid), paid ? label : 'No payments yet', 'var(--emerald)'));
    }

    function trafficCard() {
      var byDay = {}, visDay = {};
      (data.by_day || []).forEach(function (d) { byDay[d.d] = d.views; visDay[d.d] = d.visitors; });
      var keys = dayList(range, range > 90 ? data.first_event : null);
      var pts = series(keys, byDay);
      if (keys.length <= 92) pts.forEach(function (p) { p.tip = p.label + ': ' + num(p.value) + ' views, ' + num(visDay[p.key] || 0) + ' visitors'; });
      var ret = data.visitors ? pct(data.returning, data.visitors) : '–';
      return card('Site Traffic', 'Page views each ' + (keys.length > 92 ? 'week' : 'day') + '. Hover a column for the numbers.',
        h('div', null,
          range === 1 ? columns(hoursPts(), 'var(--violet)', { labels: 8, empty: 'No visits yet today.' }) : columns(pts, 'var(--violet)', { labels: 8 }),
          h('div', { class: 'od-mini' },
            mini('New Visitors', num(data.new_visitors)),
            mini('Came Back Another Day', ret),
            mini('Views While Signed In', pct(data.signed_in_views, data.views)),
            mini('Visitors Today', num(data.today_visitors)))));
    }
    function mini(label, value) { return h('div', { class: 'od-mini-item' }, h('strong', { text: value }), h('span', { text: label })); }
    function hoursPts() {
      var c = {}; (data.hours || []).forEach(function (x) { c[x.h] = x.views; });
      var pts = [];
      for (var i = 0; i < 24; i++) pts.push({ label: (i % 12 || 12) + (i < 12 ? 'a' : 'p'), value: c[i] || 0, tip: (i % 12 || 12) + ':00 ' + (i < 12 ? 'AM' : 'PM') + ': ' + num(c[i] || 0) + ' views' });
      return pts;
    }

    function topCard() {
      var groups = [['all', 'Everything'], ['tools', 'Tools'], ['games', 'Games'], ['daily', 'Daily'], ['pages', 'Other Pages']];
      var rows = (data.pages || []).filter(function (p) { return p.page && p.page !== 'owner' && (topTab === 'all' || pageGroup(p.page) === topTab); })
        .slice(0, 15).map(function (p) { return { label: pageName(p.page), value: p.views, sub: num(p.visitors) + (p.visitors === 1 ? ' visitor' : ' visitors') }; });
      var sum = {};
      (data.pages || []).forEach(function (p) { var g = pageGroup(p.page); sum[g] = (sum[g] || 0) + p.views; });
      var tabs = h('div', { class: 'segmented od-tabs', role: 'group', 'aria-label': 'Group' }, groups.map(function (g) {
        return h('button', { type: 'button', class: 'seg' + (topTab === g[0] ? ' on' : ''), 'aria-pressed': topTab === g[0] ? 'true' : 'false',
          onclick: function () { topTab = g[0]; paint(); } }, g[1] + (g[0] !== 'all' && sum[g[0]] ? ' (' + num(sum[g[0]]) + ')' : ''));
      }));
      return card('Most Used', 'Which tools, games and pages get opened the most.', h('div', null, tabs, bars(rows, 'var(--violet)', 'views')), 'od-wide');
    }

    function devicesCard() {
      var d = {}; (data.devices || []).forEach(function (x) { d[x.device] = x.visitors; });
      return card('Phone or Computer', 'Visitors by device.', split([
        { label: 'Computer', value: d.computer || 0, color: 'var(--cobalt)' },
        { label: 'Phone', value: d.phone || 0, color: 'var(--coral)' },
        { label: 'Tablet', value: d.tablet || 0, color: 'var(--emerald)' }]));
    }
    function timesCard() {
      var w = {}; (data.weekdays || []).forEach(function (x) { w[x.d] = x.views; });
      var names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return card('Busiest Times', 'When people use the site.', h('div', { class: 'od-stack' },
        h('h3', { text: 'By Hour' }), columns(hoursPts(), 'var(--amber)', { labels: 6 }),
        h('h3', { text: 'By Day of the Week' }), columns(names.map(function (n, i) { return { label: n, value: w[i + 1] || 0, tip: n + ': ' + num(w[i + 1] || 0) + ' views' }; }), 'var(--amber)', { labels: 7 })));
    }
    function sourcesCard() {
      var rows = (data.sources || []).map(function (s) { return { label: s.source === 'direct' ? 'Typed In or Bookmark' : s.source, value: s.visitors }; });
      return card('Where Visitors Come From', 'The site someone clicked from to reach ED Sidekick.', bars(rows, 'var(--sky)', 'visitors'));
    }
    function actions(event) { return (data.actions || []).filter(function (a) { return a.event === event; }); }
    function escapeCard() {
      var rooms = {}, grades = {};
      actions('escape-room').forEach(function (a) {
        var p = String(a.detail || '').split('|'); rooms[p[0]] = (rooms[p[0]] || 0) + a.n;
        var g = /^g(\d)$/.exec(p[1] || ''); if (g) grades[g[1]] = (grades[g[1]] || 0) + a.n;
      });
      var rows = Object.keys(rooms).map(function (k) { return { label: ROOMS[k] || titleCase(k), value: rooms[k] }; }).sort(function (a, b) { return b.value - a.value; });
      var gpts = [1, 2, 3, 4, 5].map(function (g) { var n = ['1st', '2nd', '3rd', '4th', '5th'][g - 1]; return { label: n, value: grades[g] || 0, tip: n + ' grade: ' + num(grades[g] || 0) + ' games' }; });
      return card('Escape Rooms Played', 'Games started, by room and grade.', h('div', { class: 'od-stack' }, bars(rows, 'var(--emerald)', 'games'),
        h('h3', { text: 'By Grade' }), columns(gpts, 'var(--emerald)', { labels: 5, empty: 'No grades picked yet.' })));
    }
    function interestCard() {
      var f = {};
      actions('premium-popup').forEach(function (a) { var k = String(a.detail || 'plan').replace(/-/g, ''); f[k] = (f[k] || 0) + a.n; });
      var rows = Object.keys(f).map(function (k) { return { label: FEATURES[k] || titleCase(k), value: f[k] }; }).sort(function (a, b) { return b.value - a.value; });
      return card('Premium Interest', 'How often someone clicked a locked Premium feature, by feature. These are the features people want most.', bars(rows, 'var(--coral)', 'clicks'));
    }

    function membersCard() {
      var count = { free: 0, premium: 0, owner: 0 }, google = 0;
      users.forEach(function (u) { count[u.plan] = (count[u.plan] || 0) + 1; if (u.provider === 'google') google++; });
      var day = 86400000, now = Date.now();
      var act7 = users.filter(function (u) { var a = lastActive(u); return a && now - new Date(a) < 7 * day; }).length;
      var act30 = users.filter(function (u) { var a = lastActive(u); return a && now - new Date(a) < 30 * day; }).length;
      var older = users.filter(function (u) { return now - new Date(u.joined) > 2 * day; });
      var stayed = older.filter(function (u) { var a = lastActive(u); return a && new Date(a) - new Date(u.joined) > day; }).length;
      var joins = {}; users.forEach(function (u) { var k = dayKey(u.joined); joins[k] = (joins[k] || 0) + 1; });
      var firstJoin = users.length ? users[users.length - 1].joined : null;
      var keys = dayList(range, range > 90 ? firstJoin : null);
      return card('Members', 'Everyone with an account.', h('div', { class: 'od-stack' },
        split([{ label: 'Free', value: count.free, color: PLAN_COLOR.free }, { label: 'Premium', value: count.premium, color: PLAN_COLOR.premium }, { label: 'Owner', value: count.owner, color: PLAN_COLOR.owner }]),
        h('div', { class: 'od-mini' },
          mini('Active in the Last 7 Days', num(act7)),
          mini('Active in the Last 30 Days', num(act30)),
          mini('Came Back After Day One', older.length ? pct(stayed, older.length) : '–'),
          mini('Signed Up With Google', pct(google, users.length))),
        h('h3', { text: 'New Sign-Ups' }), columns(series(keys, joins), 'var(--cobalt)', { labels: 8, empty: 'No new sign-ups in this range.' })), 'od-wide');
    }

    function premiumCard() {
      var joins = {}, left = 0, joined = 0, since = new Date(data.since);
      (data.plan_changes || []).forEach(function (c) {
        if (c.new_plan === 'premium' && c.old_plan !== 'owner') { joins[c.d] = (joins[c.d] || 0) + 1; if (new Date(c.at) >= since) joined++; }
        if (c.old_plan === 'premium' && c.new_plan === 'free' && new Date(c.at) >= since) left++;
      });
      var prem = users.filter(function (u) { return u.plan === 'premium'; }).sort(function (a, b) { return new Date(b.premium_since || 0) - new Date(a.premium_since || 0); });
      var first = (data.plan_changes || []).length ? data.plan_changes[0].at : null;
      var keys = dayList(range, range > 90 ? first : null);
      return card('Premium Sign-Ups', 'People who moved up to Premium, and anyone who cancelled.', h('div', { class: 'od-stack' },
        h('div', { class: 'od-mini' }, mini('Premium Now', num(prem.length)), mini('Joined Premium', num(joined)), mini('Cancelled', num(left))),
        columns(series(keys, joins), PLAN_COLOR.premium, { labels: 8, empty: 'No Premium sign-ups in this range yet.' }),
        prem.length ? h('h3', { text: 'Newest Premium Members' }) : null,
        prem.length ? h('ul', { class: 'od-people' }, prem.slice(0, 6).map(function (u) {
          return h('li', null, h('span', { text: u.first_name || u.email }), h('span', { class: 'muted', text: u.premium_since ? 'Since ' + shortDate(u.premium_since) : 'Given by hand' }));
        })) : null));
    }

    function incomeCard() {
      var pays = data.payments || [], C = (TT.account && TT.account.config) || {};
      var pr = TT.account.prices();
      var early = function (n) { return '$' + (Math.floor(n * (1 - pr.off) * 100) / 100).toFixed(2); };
      var priceList = h('ul', { class: 'od-prices' },
        h('li', null, h('span', { text: 'Premium Monthly' }), h('b', { text: '$' + pr.mo.toFixed(2) })),
        h('li', null, h('span', { text: 'Premium Yearly' }), h('b', { text: '$' + pr.yr.toFixed(2) })),
        pr.earlyOpen ? h('li', null, h('span', { text: 'Early Access Monthly (until ' + pr.untilText + ')' }), h('b', { text: early(pr.mo) })) : null,
        pr.earlyOpen ? h('li', null, h('span', { text: 'Early Access Yearly (until ' + pr.untilText + ')' }), h('b', { text: early(pr.yr) })) : null);
      if (!pays.length) {
        var connected = !!(C.premiumMonthlyLink || C.premiumYearlyLink);
        return card('Income From Memberships', null, h('div', { class: 'od-stack' },
          h('div', { class: 'od-nopay' }, h('strong', { text: 'No Payments Yet' }),
            h('p', { text: connected ? 'Payments are set up, but nobody has paid yet. The first one will show here right away.' :
              'Stripe isn’t connected yet, so plan buttons say “Coming Soon” and nobody can pay. Anyone on Premium right now was given it by hand. Once Stripe is set up, this shows income this month, in the chosen range and all time, monthly vs yearly members, and refunds.' })),
          h('h3', { text: 'Your Prices' }), priceList), 'od-wide');
      }
      var since = new Date(data.since), monthKey = dayKey(Date.now()).slice(0, 7);
      var all = 0, inRange = 0, month = 0, byBill = { month: 0, year: 0 }, refunds = 0, byMonth = {};
      pays.forEach(function (p) {
        var c = p.status === 'refunded' ? -p.amount_cents : p.amount_cents;
        all += c; if (new Date(p.d + 'T12:00:00') >= since) inRange += c;
        if (String(p.d).slice(0, 7) === monthKey) month += c;
        if (p.status === 'refunded') refunds += p.amount_cents; else byBill[p.billing === 'year' ? 'year' : 'month'] += p.amount_cents;
        var mk = String(p.d).slice(0, 7); byMonth[mk] = (byMonth[mk] || 0) + c;
      });
      var payers = users.filter(function (u) { return u.paid_cents > 0 && u.plan === 'premium'; }).length;
      var months = Object.keys(byMonth).sort().slice(-12).map(function (k) {
        var p = k.split('-'), name = new Date(+p[0], +p[1] - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
        return { label: name, value: Math.max(0, byMonth[k]) / 100, tip: name + ': ' + money(byMonth[k]) };
      });
      return card('Income From Memberships', 'Money in from Stripe, after refunds.', h('div', { class: 'od-stack' },
        h('div', { class: 'od-tiles small' },
          tile('This Month', money(month), null, 'var(--emerald)'),
          tile('In This Range', money(inRange), null, 'var(--emerald)'),
          tile('All Time', money(all), null, 'var(--emerald)'),
          tile('Paying Members', num(payers), null, PLAN_COLOR.premium)),
        split([{ label: 'Monthly Plans', value: byBill.month / 100, color: 'var(--cobalt)' }, { label: 'Yearly Plans', value: byBill.year / 100, color: 'var(--coral)' }]),
        refunds ? h('p', { class: 'muted', text: 'Refunded: ' + money(refunds) }) : null,
        h('h3', { text: 'By Month' }), columns(months, 'var(--emerald)', { labels: 12 }),
        h('h3', { text: 'Your Prices' }), priceList), 'od-wide');
    }

    // ---------- Every account ----------
    function usersCard() {
      var box = h('div', { class: 'od-users' });
      var search = h('input', { type: 'search', class: 'od-search', placeholder: 'Search by name or email', 'aria-label': 'Search accounts', value: userQuery });
      var plan = h('select', { class: 'od-select', 'aria-label': 'Plan' },
        [['all', 'All Plans'], ['free', 'Free'], ['premium', 'Premium'], ['owner', 'Owner']].map(function (o) { return h('option', { value: o[0], selected: userPlan === o[0] }, o[1]); }));
      var sort = h('select', { class: 'od-select', 'aria-label': 'Sort' },
        [['new', 'Newest First'], ['old', 'Oldest First'], ['active', 'Last Active'], ['visits', 'Most Visits'], ['name', 'Name A to Z']].map(function (o) { return h('option', { value: o[0], selected: userSort === o[0] }, o[1]); }));
      var list = h('div', { class: 'od-user-list' }), countLine = h('p', { class: 'muted od-count' });
      function rows() {
        var q = userQuery.trim().toLowerCase();
        var out = users.filter(function (u) {
          return (userPlan === 'all' || u.plan === userPlan) && (!q || (u.email || '').toLowerCase().indexOf(q) >= 0 || (u.first_name || '').toLowerCase().indexOf(q) >= 0);
        });
        var by = {
          new: function (a, b) { return new Date(b.joined) - new Date(a.joined); },
          old: function (a, b) { return new Date(a.joined) - new Date(b.joined); },
          active: function (a, b) { return new Date(lastActive(b) || 0) - new Date(lastActive(a) || 0); },
          visits: function (a, b) { return b.visits - a.visits; },
          name: function (a, b) { return (a.first_name || a.email || '').localeCompare(b.first_name || b.email || ''); }
        };
        return out.sort(by[userSort]);
      }
      function fill() {
        var r = rows();
        list.textContent = '';
        countLine.textContent = r.length === users.length ? num(users.length) + (users.length === 1 ? ' account' : ' accounts') : num(r.length) + ' of ' + num(users.length) + ' accounts';
        if (!r.length) { list.append(empty(users.length ? 'No accounts match.' : 'No accounts yet.')); return; }
        r.slice(0, userShown).forEach(function (u) {
          var name = u.first_name || (u.email || '?').split('@')[0];
          var item = h('details', { class: 'od-user' },
            h('summary', null,
              h('span', { class: 'od-avatar', text: name.charAt(0).toUpperCase(), style: 'background:' + PLAN_COLOR[u.plan] }),
              h('span', { class: 'od-user-name' }, h('strong', { text: name }), h('span', { class: 'muted', text: u.email || '' })),
              h('span', { class: 'od-plan p-' + u.plan, text: PLAN_NAME[u.plan] || u.plan }),
              h('span', { class: 'od-user-joined muted', text: 'Joined ' + shortDate(u.joined) }),
              h('span', { class: 'od-chev', html: TT.icon('chevdown') })),
            h('dl', { class: 'od-user-facts' },
              fact('Plan', PLAN_NAME[u.plan] || u.plan), fact('Signed Up With', u.provider === 'google' ? 'Google' : u.provider === 'email' ? 'Email and Password' : titleCase(u.provider)),
              fact('Joined', shortDate(u.joined)), fact('Last Active', ago(lastActive(u))),
              fact('Last Signed In', ago(u.last_sign_in)), fact('Last Saved Work', ago(u.last_saved)),
              fact('Pages Opened (Signed In)', num(u.visits)), fact('Devices', u.devices ? u.devices.split(',').map(titleCase).join(', ') : '–'),
              fact('Premium Since', u.plan === 'premium' ? (u.premium_since ? shortDate(u.premium_since) : 'Given by hand') : '–'),
              fact('Paid So Far', money(u.paid_cents))));
          list.append(item);
        });
        if (r.length > userShown) list.append(TT.button('Show More (' + num(r.length - userShown) + ' more)', { kind: 'small', onclick: function () { userShown += 60; fill(); } }));
      }
      search.addEventListener('input', function () { userQuery = search.value; userShown = 40; fill(); });
      plan.addEventListener('change', function () { userPlan = plan.value; userShown = 40; fill(); });
      sort.addEventListener('change', function () { userSort = sort.value; fill(); });
      box.append(h('div', { class: 'od-user-tools' }, search, plan, sort, TT.button('Download List', { kind: 'small', icon: 'download', onclick: function () { csv(rows()); } })), countLine, list);
      fill();
      return card('All Accounts', 'Tap anyone to see their details.', box, 'od-wide');
    }
    function fact(k, v) { return h('div', null, h('dt', { text: k }), h('dd', { text: v })); }
    function csv(rows) {
      var head = ['First Name', 'Email', 'Plan', 'Signed Up With', 'Joined', 'Last Active', 'Last Signed In', 'Last Saved', 'Pages Opened', 'Premium Since', 'Paid'];
      var lines = [head].concat(rows.map(function (u) {
        return [u.first_name, u.email, PLAN_NAME[u.plan] || u.plan, u.provider, u.joined, lastActive(u), u.last_sign_in, u.last_saved, u.visits, u.premium_since, (u.paid_cents / 100).toFixed(2)];
      })).map(function (r) { return r.map(function (v) { v = v == null ? '' : String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(','); });
      var a = h('a', { href: URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv' })), download: 'ed-sidekick-accounts-' + dayKey(Date.now()) + '.csv' });
      document.body.append(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }

    function paint() {
      var y = window.scrollY;
      root.style.minHeight = root.offsetHeight + 'px';
      root.textContent = '';
      root.append(header(), kpis(), previewCard(),
        h('div', { class: 'od-grid' },
          trafficCard(), topCard(), membersCard(), usersCard(), premiumCard(), interestCard(), incomeCard(),
          devicesCard(), sourcesCard(), timesCard(), escapeCard()));
      root.style.minHeight = '';
      if (window.scrollY !== y) window.scrollTo(0, y);
    }

    // Sign-in finishes a moment after the page opens, so try again once the account is known.
    if (TT.account && TT.account.onChange) TT.account.onChange(function () { if (!data && !loading && TT.account.signedIn() && location.hash === '#owner') load(); });
    load();
    return { show: function () { if (!loading) load(); } };
  };

  // ---------- Reminder while the owner previews Free or Premium ----------
  function pill() {
    if (!TT.account || !TT.account.viewAs) return;
    var v = TT.account.viewAs();
    if (!v) return;
    document.body.append(h('div', { class: 'od-pill', role: 'status' },
      h('span', { text: 'Previewing as ' + (v === 'free' ? 'Free' : 'Premium') }),
      h('button', { type: 'button', onclick: function () { TT.account.setViewAs(''); } }, 'Back to Owner View')));
  }
  // A Dashboard link in the top bar for the owner.
  function navLink() {
    if (!TT.account || !TT.account.realPlan || TT.account.realPlan() !== 'owner') return;
    var acct = document.querySelector('.nav-account');
    if (!acct || document.querySelector('.nav-owner')) return;
    acct.parentNode.insertBefore(h('a', { class: 'nav-owner', href: '#owner', 'data-view': 'owner', text: 'Dashboard' }), acct);
  }
  function start() {
    pill(); navLink();
    if (TT.account && TT.account.onChange) TT.account.onChange(navLink);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
