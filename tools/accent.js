// Theme Colors (Plus, Kevin 2026-11-24): one accent color for the whole site, chosen under Customize on the
// home page. Saved as tt:accent (syncs with the account). Colors live in assets/accent.css, keyed by
// <html data-accent="ocean">. "classic" (or nothing saved) is the normal look.
(function () {
  var TT = window.TT; if (!TT) return;
  TT.ACCENTS = [
    { id: 'classic', name: 'Classic', a: '#F2643D', b: '#F6F1E8' },
    { id: 'ocean', name: 'Ocean', a: '#0B6FB8', b: '#DCEBF5' },
    { id: 'forest', name: 'Forest', a: '#1F7A4D', b: '#DDECD9' },
    { id: 'sunset', name: 'Sunset', a: '#C44A15', b: '#F8DFC8' },
    { id: 'berry', name: 'Berry', a: '#B8246E', b: '#F3D9E6' },
    { id: 'grape', name: 'Grape', a: '#6A3FD0', b: '#E3DAF7' }
  ];
  function known(id) { return TT.ACCENTS.some(function (a) { return a.id === id; }) ? id : 'classic'; }
  function show(id) {
    id = known(id);
    if (id === 'classic') document.documentElement.removeAttribute('data-accent');
    else document.documentElement.setAttribute('data-accent', id);
  }
  TT.accent = {
    get: function () { return known(TT.load('accent', 'classic')); },
    preview: show,                                   // try a color without saving it
    set: function (id) { id = known(id); TT.save('accent', id === 'classic' ? null : id); show(id); },
    apply: function () { show(TT.accent.get()); }
  };
  TT.accent.apply();
  // Signing in on another computer brings the saved color with it.
  window.addEventListener('storage', function (e) { if (e.key === 'tt:accent') TT.accent.apply(); });
})();
