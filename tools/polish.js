// Small touches that apply to every page (Kevin, 2026-11-24):
// 1. Smooth page changes: the new page fades in and its parts rise into place, tiles one after another.
// 2. Friendlier empty and loading spots: any plain "nothing here yet" box gets the mascot beside its line.
// Styles in assets/polish.css.
(function () {
  var TT = window.TT; if (!TT) return;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 1. Page changes ----------
  var lastPage = null, timer = 0;
  function shownPage() {
    var pages = document.querySelectorAll('main.page');
    for (var i = 0; i < pages.length; i++) if (!pages[i].hidden) return pages[i];
    return null;
  }
  function enter() {
    var name = TT.page ? TT.page() : '';
    if (name === lastPage) return;
    var first = lastPage === null;
    lastPage = name;
    if (still || first) return;                      // the first page just shows; the home page has its own entrance
    var pg = shownPage();
    if (!pg || pg.getAttribute('data-view') === 'board' || document.fullscreenElement) return;
    document.querySelectorAll('main.page.pg-in').forEach(function (p) { p.classList.remove('pg-in'); });
    var tiles = pg.querySelectorAll('.tools > *');
    for (var i = 0; i < tiles.length; i++) tiles[i].style.setProperty('--pi', Math.min(i, 14));
    void pg.offsetWidth;
    pg.classList.add('pg-in');
    clearTimeout(timer);
    timer = setTimeout(function () { pg.classList.remove('pg-in'); }, 1300);
  }
  window.addEventListener('tt:page', function () { setTimeout(enter, 0); });
  setTimeout(enter, 0);

  // ---------- 2. Empty and loading spots ----------
  // A box that only holds a line of text ("No answers yet.") becomes: mascot + the same line.
  function plain(el) { return el.childNodes.length === 1 && el.firstChild.nodeType === 3 && el.textContent.trim().length > 8; }
  function dress(el) {
    if (!TT.mascot || el.getAttribute('data-pal')) return;
    var loading = el.classList.contains('acct-loading');
    if (!loading && (!plain(el) || el.closest('.widget, .board, .ar-stage, .join-main'))) return;
    el.setAttribute('data-pal', '1');
    var m = TT.mascot({ mood: loading ? 'work' : 'think' });
    var box = document.createElement('span'); box.className = 'pal-mascot'; box.setAttribute('aria-hidden', 'true'); box.append(m);
    if (loading) { el.classList.add('pal-loading'); el.prepend(box); return; }
    var text = document.createElement('span'); text.className = 'pal-text'; text.textContent = el.textContent;
    el.textContent = ''; el.classList.add('pal-empty'); el.append(box, text);
    // If a page rewrites the line later (el.textContent = '…'), dress it again.
    el.removeAttribute('data-pal'); el.setAttribute('data-pal', '1');
  }
  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches('.empty, .acct-loading')) dress(root);
    var list = root.querySelectorAll ? root.querySelectorAll('.empty, .acct-loading') : [];
    for (var i = 0; i < list.length; i++) dress(list[i]);
  }
  function start() {
    scan(document.body);
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var n = m.addedNodes[j];
          if (n.nodeType === 1) scan(n);
          // a page set new text on a box that was already dressed
          else if (n.nodeType === 3 && m.target.nodeType === 1 && m.target.matches('.empty') && plain(m.target)) { m.target.removeAttribute('data-pal'); dress(m.target); }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
