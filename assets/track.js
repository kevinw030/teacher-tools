// Visit counter for the Owner Dashboard. Privacy-friendly on purpose:
// - one small row per page opened: the page, the time, phone/tablet/computer, and where the visit came from (a site name like google.com)
// - "visitor" is a random id this browser makes for itself. No IP address, no names, nothing typed into a tool.
// - the owner's own visits are not counted, and browsers that ask not to be tracked are not counted.
// Rows go to the site_events table in Supabase, which anyone can add to but only the owner can read (supabase/owner-dashboard.sql).
(function () {
  var TT = window.TT, CFG = window.TT_ACCOUNT_CONFIG || {};
  TT.track = function () {};
  if (!CFG.supabaseUrl || !CFG.supabaseKey) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true || navigator.webdriver) return;
  if (!/^(edsidekick\.com|www\.edsidekick\.com|kevinw030\.github\.io)$/.test(location.hostname)) return; // not while testing on another computer

  function store(kind) { try { return window[kind]; } catch (e) { return null; } }
  function visitorId() {
    var ls = store('localStorage'), id = null;
    try { id = ls && ls.getItem('tt-visitor'); } catch (e) {}
    if (!id || id.length < 8) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      try { ls && ls.setItem('tt-visitor', id); } catch (e) {}
    }
    return id.slice(0, 40);
  }
  function device() {
    var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    var short = Math.min(screen.width || 0, screen.height || 0);
    if (coarse && short && short < 600) return 'phone';
    if (coarse && short && short < 1100) return 'tablet';
    return 'computer';
  }
  // Where this visit came from, only the first page of each visit, and only the site's name.
  function source() {
    var ss = store('sessionStorage');
    try { if (ss && ss.getItem('tt-src')) return null; ss && ss.setItem('tt-src', '1'); } catch (e) {}
    try {
      var host = new URL(document.referrer).hostname.replace(/^www\./, '');
      if (!host || /edsidekick\.com$|kevinw030\.github\.io$/.test(host)) return null;
      return host.slice(0, 80);
    } catch (e) { return 'direct'; }
  }
  function isOwner() { return TT.account && TT.account.realPlan && TT.account.realPlan() === 'owner'; }
  function clean(s, n) { return s == null ? null : String(s).toLowerCase().replace(/[^a-z0-9|:._-]/g, '-').slice(0, n); }

  var queue = [], timer = 0, tries = 0, me = visitorId(), dev = device();
  function flush() {
    timer = 0;
    if (!queue.length) return;
    var sb = TT.account && TT.account.client && TT.account.client();
    if (!sb) { if (++tries < 40) timer = setTimeout(flush, 1500); else queue = []; return; }
    if (isOwner()) { queue = []; return; }
    var rows = queue.splice(0, 20);
    sb.from('site_events').insert(rows).then(function () {}, function () {});
    if (queue.length) timer = setTimeout(flush, 500);
  }
  function add(row) {
    if (isOwner()) return;
    row.visitor = me; row.device = dev;
    queue.push(row);
    if (!timer) timer = setTimeout(flush, 800);
  }

  // Something worth counting inside a tool, like which escape room and grade was played.
  TT.track = function (event, detail) {
    add({ event: clean(event, 40) || 'action', page: clean(TT.page(), 60), detail: clean(detail, 80) });
  };

  var lastPage = '', lastAt = 0;
  function view() {
    var page = TT.page();
    if (!/^[a-z0-9-]{1,40}$/i.test(page)) return;          // sign-in links and other odd addresses
    var now = Date.now();
    if (page === lastPage && now - lastAt < 3000) return;
    lastPage = page; lastAt = now;
    add({ event: 'view', page: clean(page, 60), source: source() });
  }
  window.addEventListener('tt:page', view);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', view); else view();
})();
