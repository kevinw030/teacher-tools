// The student door (Kevin, 2026-11-24): students who type edsidekick.com without /join land on the
// home page, and some then made accounts. Signed-out visitors now see a big "Students: Type Your Class
// Code" box at the top of the home page and of the sign-in page. It sends them to /join with the code
// filled in. Signed-in teachers never see it.
(function () {
  var TT = window.TT; if (!TT || !TT.h) return;
  var h = TT.h;
  function storedSession() {
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/^sb-.*-auth-token$/.test(k) && localStorage.getItem(k)) return true; } } catch (e) {}
    return false;
  }
  function signedOut() {
    if (!TT.account || !TT.account.enabled) return false;
    if (TT.account.signedIn()) return false;
    var known = TT.account.known ? TT.account.known() : true;
    return known ? true : !storedSession();
  }
  function clean(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); }
  function door(id, small) {
    var input = h('input', { type: 'text', id: id, class: 'sd-code', inputmode: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: 8, placeholder: 'ABC 123', 'aria-label': 'Class code' });
    input.addEventListener('input', function () { var c = clean(input.value), show = c.length > 3 ? c.slice(0, 3) + ' ' + c.slice(3) : c; if (input.value !== show) input.value = show; });
    var form = h('form', { class: 'sd-form', onsubmit: function (e) {
      e.preventDefault();
      var c = clean(input.value);
      if (TT.track) TT.track('student-door', c.length === 6 ? 'code' : 'no-code');
      location.href = '/join' + (c.length === 6 ? '?code=' + c : '');
    } }, input, h('button', { type: 'submit', class: 'sd-go' }, h('span', { text: 'Join' }),
      h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>' })));
    return h('section', { class: 'sd' + (small ? ' small' : ''), 'aria-label': 'Students join here' },
      h('div', { class: 'sd-text' }, h('span', { class: 'sd-eyebrow', text: 'Students' }), h('label', { class: 'sd-title', for: id, text: 'Type Your Class Code' }),
        h('span', { class: 'sd-sub', text: 'No account needed. Look at your teacher’s screen.' })), form);
  }
  var home = document.getElementById('view-home'), acct = document.getElementById('view-account');
  var a = door('sdHome'), b = door('sdAccount', true);
  if (home) home.insertBefore(a, home.firstChild);
  if (acct) { var m = document.getElementById('accountMount'); if (m) acct.insertBefore(b, m); }
  function paint() { var out = signedOut(); a.hidden = !out; b.hidden = !out; }
  paint();
  if (TT.account && TT.account.onChange) TT.account.onChange(paint);
})();
