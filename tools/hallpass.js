// Classroom Board: Hall Pass widget (Kevin, 2026-11-24).
// A big pass a student taps "I'm Going" and "I'm Back" on. While the pass is out a timer counts up,
// and an optional time alert turns the pass red. Every trip goes into a simple log for today only.
// Student-facing: one big button at a time, and every button rests for a moment after a tap so it can't be spammed.
// Saved on the widget as w.data: { name, limit, ask, out: { who, at } | null, day, log: [{ who, out, back }] }.
(function () {
  var TT = window.TT, h = TT.h;
  if (!TT.boardWidgets) TT.boardWidgets = {};
  var LIMITS = [0, 3, 5, 10, 15];
  var REST = 1500;          // a button sleeps this long after it is pressed
  var SHORT = 10000;        // a trip shorter than this is treated as a mistake and not logged

  function wb(label, cls, fn, aria) { return h('button', { type: 'button', class: 'wb ' + (cls || ''), onclick: fn, 'aria-label': aria || null }, label); }
  function clock(t) { return new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  function mmss(ms) { var s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + s % 60; }
  function mins(ms) { var m = Math.round(ms / 60000); return m < 1 ? 'Under 1 Min' : m + ' Min'; }
  function realNames() { return TT.roster && !TT.roster.isSample() ? TT.roster.present() : []; }

  var ICON = '<path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><circle cx="12" cy="6.5" r="1"/><path d="M9 12h6M9 15.5h4"/>';
  var WALK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13" cy="4" r="2"/><path d="M11 21l2-6-3-3 1-4 3 3h3"/><path d="M8 13l-2 5M10 8l-3 2v3"/></svg>';
  var HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/></svg>';
  var GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
  var LIST = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>';

  TT.boardWidgets.hallpass = {
    title: 'Hall Pass', color: '#0E8F63', w: 320, h: 400,
    icon: ICON,
    init: function () { return { name: 'Hall Pass', limit: 5, ask: true, out: null, day: TT.today(), log: [] }; },
    mount: function (body, w, save) {
      var d = w.data;
      if (typeof d.name !== 'string') d.name = 'Hall Pass';
      if (LIMITS.indexOf(d.limit) < 0) d.limit = 5;
      if (d.ask === undefined) d.ask = true;
      if (!Array.isArray(d.log)) d.log = [];
      var view = 'pass', resting = false, alerted = false;
      var box = h('div', { class: 'wx hp' });
      body.append(box);

      // A new school day starts with an empty log.
      function freshDay() { if (d.day !== TT.today()) { d.day = TT.today(); d.log = []; save(); } }
      freshDay();

      function rest(btn) {
        resting = true; box.classList.add('resting');
        setTimeout(function () { resting = false; box.classList.remove('resting'); }, REST);
      }
      function goOut(who) {
        if (resting || d.out) return;
        d.out = { who: who || '', at: Date.now() }; alerted = false;
        save(); view = 'pass'; rest(); paint();
        if (TT.fx) TT.fx.sound('pop');
      }
      function comeBack() {
        if (resting || !d.out) return;
        var now = Date.now();
        freshDay();
        if (now - d.out.at >= SHORT) d.log.push({ who: d.out.who, out: d.out.at, back: now });
        d.out = null; save(); rest(); paint();
        if (TT.fx) TT.fx.sound('good');
      }
      function startOut() {
        if (resting) return;
        if (d.ask && realNames().length) { view = 'who'; paint(); } else goOut('');
      }

      var timeEl = null, passEl = null, hintEl = null;
      function tick() {
        if (!d.out || !timeEl) return;
        var ms = Date.now() - d.out.at, over = d.limit && ms >= d.limit * 60000;
        timeEl.textContent = mmss(ms);
        passEl.classList.toggle('late', !!over);
        if (hintEl) hintEl.textContent = over ? 'Time to Come Back' : d.limit ? 'Back in ' + d.limit + ' Min' : 'Walk, Don’t Run';
        if (over && !alerted) { alerted = true; if (TT.chime) TT.chime(); }
      }

      function tools() {
        var n = d.day === TT.today() ? d.log.length : 0;
        return h('div', { class: 'hp-tools' },
          h('button', { type: 'button', class: 'hp-mini', title: 'Today’s Log', 'aria-label': 'Today’s log, ' + n + (n === 1 ? ' trip' : ' trips'), onclick: function () { view = 'log'; paint(); } },
            h('span', { html: LIST }), h('b', { text: String(n) })),
          h('button', { type: 'button', class: 'hp-mini', title: 'Pass Settings', 'aria-label': 'Pass settings', html: GEAR, onclick: function () { view = 'set'; paint(); } }));
      }

      function paintPass() {
        var out = !!d.out;
        passEl = h('div', { class: 'hp-pass ' + (out ? 'out' : 'in') },
          h('span', { class: 'hp-hole', 'aria-hidden': 'true' }),
          h('div', { class: 'hp-name', text: d.name.trim() || 'Hall Pass' }));
        timeEl = null; hintEl = null;
        if (out) {
          timeEl = h('div', { class: 'hp-time', role: 'timer', 'aria-live': 'off' });
          hintEl = h('div', { class: 'hp-hint', 'aria-live': 'polite' });
          passEl.append(
            h('div', { class: 'hp-who', text: d.out.who ? d.out.who + ' Is Currently Out!' : 'Someone Is Currently Out!' }),
            timeEl, hintEl,
            h('button', { type: 'button', class: 'hp-go back', onclick: comeBack, html: HOME + '<span>I’m Back</span>' }));
        } else {
          passEl.append(
            h('div', { class: 'hp-ready', text: 'Hall Pass Available' }),
            h('button', { type: 'button', class: 'hp-go', onclick: startOut, html: WALK + '<span>I’m Going</span>' }));
        }
        box.append(passEl, tools());
        tick();
      }

      function paintWho() {
        var grid = h('div', { class: 'hp-names' });
        realNames().forEach(function (n) { grid.append(h('button', { type: 'button', class: 'hp-namebtn', text: n, onclick: function () { goOut(n); } })); });
        box.append(h('div', { class: 'hp-q', text: 'Who Is Going?' }), grid,
          h('div', { class: 'wx-row' }, wb('Back', '', function () { view = 'pass'; paint(); }), wb('Skip Names', 'primary', function () { goOut(''); })));
      }

      function paintLog() {
        freshDay();
        var list = h('div', { class: 'hp-log' });
        if (!d.log.length) list.append(h('p', { class: 'hp-empty', text: 'No trips yet today.' }));
        d.log.slice().reverse().forEach(function (t) {
          list.append(h('div', { class: 'hp-row' },
            h('b', { text: t.who || 'Student' }),
            h('span', { text: clock(t.out) + ' – ' + clock(t.back) }),
            h('em', { class: d.limit && t.back - t.out > d.limit * 60000 ? 'long' : '', text: mins(t.back - t.out) })));
        });
        var clear = wb('Clear Log', '', function () {
          if (clear.dataset.sure) { d.log = []; save(); paint(); return; }
          clear.dataset.sure = '1'; clear.textContent = 'Tap Again to Clear';
          setTimeout(function () { if (clear.isConnected) { delete clear.dataset.sure; clear.textContent = 'Clear Log'; } }, 3000);
        });
        box.append(h('div', { class: 'hp-q small', text: 'Today’s Log' }), list,
          h('div', { class: 'wx-row' }, d.log.length ? clear : null, wb('Done', 'primary', function () { view = 'pass'; paint(); })));
      }

      function paintSet() {
        var name = h('input', { type: 'text', class: 'wx-input', id: 'hpn-' + w.id, maxlength: 24, placeholder: 'Hall Pass', 'aria-label': 'Pass name' });
        name.value = d.name;
        name.addEventListener('input', function () { d.name = name.value; save(); });
        var quick = h('div', { class: 'hp-chips' }, ['Hall Pass', 'Restroom', 'Water', 'Nurse', 'Office'].map(function (n) {
          return h('button', { type: 'button', class: 'hp-chip' + (d.name === n ? ' on' : ''), text: n, onclick: function () { d.name = n; save(); paint(); } });
        }));
        var lim = h('div', { class: 'hp-chips' }, LIMITS.map(function (m) {
          return h('button', { type: 'button', class: 'hp-chip' + (d.limit === m ? ' on' : ''), 'aria-pressed': d.limit === m ? 'true' : 'false', text: m ? m + ' Min' : 'Off', onclick: function () { d.limit = m; save(); paint(); } });
        }));
        var has = realNames().length;
        var ask = h('label', { class: 'hp-check' }, h('input', { type: 'checkbox', id: 'hpa-' + w.id, checked: d.ask ? true : null, onchange: function (e) { d.ask = e.target.checked; save(); } }),
          h('span', { text: has ? 'Ask Who Is Going (From My Class List)' : 'Ask Who Is Going (Add a Class List First)' }));
        box.append(h('div', { class: 'hp-set' },
          h('div', { class: 'hp-label', text: 'Pass Name' }), name, quick,
          h('div', { class: 'hp-label', text: 'Time Alert' }), lim, ask),
          h('div', { class: 'wx-row' }, wb('Done', 'primary', function () { view = 'pass'; paint(); })));
      }

      function paint() {
        box.textContent = ''; box.dataset.view = view;
        if (view === 'who') paintWho(); else if (view === 'log') paintLog(); else if (view === 'set') paintSet(); else paintPass();
      }
      paint();
      var iv = setInterval(tick, 1000);
      return { destroy: function () { clearInterval(iv); } };
    }
  };
})();
