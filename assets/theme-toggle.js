// Light/dark switch in the page footer (Kevin, 2026-11-24). It uses the same theme setting as
// Settings > Theme, so flipping it here changes it there too (and it syncs with the account).
(function () {
  var TT = window.TT, h = TT.h;
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function isDark() { var t = TT.settings.theme; return t === 'dark' || (t !== 'light' && !!(media && media.matches)); }
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';
  var toggles = [];
  function paint() {
    var dark = isDark();
    toggles.forEach(function (b) {
      b.setAttribute('aria-checked', dark ? 'true' : 'false');
      b.title = dark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      b.querySelector('.tg-label').textContent = dark ? 'Dark Mode' : 'Light Mode';
    });
  }
  function make() {
    var b = h('button', { type: 'button', class: 'theme-toggle', role: 'switch', 'aria-label': 'Dark mode',
      onclick: function () {
        TT.settings.theme = isDark() ? 'light' : 'dark';
        TT.saveSettings(); TT.applyTheme();
      } },
      h('span', { class: 'tg-track', 'aria-hidden': 'true' },
        h('span', { class: 'tg-icon tg-sun', html: SUN }), h('span', { class: 'tg-icon tg-moon', html: MOON }),
        h('span', { class: 'tg-knob' })),
      h('span', { class: 'tg-label' }));
    toggles.push(b);
    return b;
  }
  // Settings > Theme calls TT.applyTheme too, so the switch follows it.
  var apply = TT.applyTheme;
  TT.applyTheme = function () { apply(); paint(); };
  if (media && media.addEventListener) media.addEventListener('change', paint);
  function feet() {
    // Every page gets the footer (Kevin, 2026-11-24), in case a new visitor lands on one from a search.
    var model = document.querySelector('.site-foot');
    if (model) document.querySelectorAll('main.page').forEach(function (m) {
      if (!m.querySelector('.site-foot')) { var f = model.cloneNode(true); f.classList.add('added'); m.append(f); }
    });
    document.querySelectorAll('.site-foot').forEach(function (f) {
      var first = f.querySelector('a');
      f.insertBefore(make(), first);
    });
    paint();
  }
  // Game pages are built by app.js, which loads after this file, so wait for the whole page.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', feet); else feet();
  paint();
})();
