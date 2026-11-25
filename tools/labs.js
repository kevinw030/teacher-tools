// Labs (/labs): the owner-only preview of Sidekick Live. Nothing here is linked for other accounts:
// the page shows "not open yet" to anyone but the owner, and the database (supabase/labs.sql) only lets
// the owner make classes and question sets.
// Tabs: My Classes (this file), Question Sets (tools/labs-sets.js), Host a Game (tools/labs-host.js).
// Each tab registers itself with TT.labs.tab({ id, title, mount(box, ctx) }).
(function () {
  var TT = window.TT, h = TT.h;
  var tabs = [];
  TT.labs = {
    tab: function (t) { tabs.push(t); tabs.sort(function (a, b) { return (a.order || 0) - (b.order || 0); }); },
    isOwner: function () { return !!(TT.account && TT.account.realPlan && TT.account.realPlan() === 'owner'); }
  };
  var SQL_URL = 'https://github.com/kevinw030/teacher-tools/blob/main/supabase/labs.sql';

  // ---------- Small helpers ----------
  function sb() { return TT.account && TT.account.client && TT.account.client(); }
  function q(p) { return p.then(function (r) { if (r.error) throw r.error; return r.data; }); }
  TT.labs.q = q; TT.labs.sb = sb;
  function ago(d) {
    if (!d) return 'Never';
    var s = (Date.now() - new Date(d)) / 1000;
    if (s < 120) return 'Just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' hr ago';
    var n = Math.round(s / 86400); return n === 1 ? 'Yesterday' : n + ' days ago';
  }
  TT.labs.ago = ago;
  function cleanName(s) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    return s.slice(0, 20).replace(/(^|[\s-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  // A PIN that is easy to type but not 0000, 1234 or one a classmate already has.
  function newPin(taken) {
    var bad = { '0000': 1, '1234': 1, '1111': 1, '2222': 1, '4321': 1, '1212': 1, '6969': 1 };
    for (var i = 0; i < 200; i++) {
      var p = ('000' + Math.floor(Math.random() * 10000)).slice(-4);
      if (!bad[p] && !(taken && taken[p])) return p;
    }
    return ('000' + Math.floor(Math.random() * 10000)).slice(-4);
  }
  function errText(e) {
    var m = String(e && (e.message || e.code) || e || '');
    if (/lab_|does not exist|schema cache|PGRST20/.test(m)) return 'setup';
    if (/owner_only/.test(m)) return 'Only the owner account can do this while Labs is a preview.';
    if (/too_many/.test(m)) return 'You have the most classes Labs allows (20). Delete one first.';
    if (/row-level|violates/.test(m)) return 'That class is full (60 students at most).';
    return 'Something went wrong. Check your internet and try again.';
  }
  TT.labs.errText = errText;
  // An in-page "Are you sure?" (no browser pop-ups).
  function confirmBox(text, yes, onYes) {
    var box = h('div', { class: 'lab-confirm', role: 'alertdialog' },
      h('p', { text: text }),
      h('div', { class: 'row' },
        TT.button(yes, { kind: 'primary small danger', onclick: function () { box.remove(); onYes(); } }),
        TT.button('Cancel', { kind: 'small', onclick: function () { box.remove(); } })));
    return box;
  }
  TT.labs.confirmBox = confirmBox;

  // ---------- Classes (shared with the other tabs) ----------
  var classes = null, loadingClasses = null;
  function loadClasses(force) {
    if (classes && !force) return Promise.resolve(classes);
    if (loadingClasses && !force) return loadingClasses;
    loadingClasses = q(sb().from('lab_classes').select('*').order('created_at')).then(function (rows) {
      classes = rows || []; loadingClasses = null; return classes;
    }, function (e) { loadingClasses = null; throw e; });
    return loadingClasses;
  }
  function loadStudents(classId) {
    return q(sb().from('lab_students').select('id,class_id,first_name,pin,buddy,badges,stats,fails,paused_until,last_seen_at,created_at').eq('class_id', classId).order('first_name'));
  }
  TT.labs.classes = loadClasses; TT.labs.students = loadStudents;

  // ---------- The page ----------
  TT.mountLabs = function (el) {
    var cur = null;
    function paint() {
      el.textContent = '';
      if (!TT.labs.isOwner()) {
        el.append(h('div', { class: 'panel lab-closed' }, h('h2', { text: 'This Page Isn’t Open Yet' }), h('p', { class: 'muted', text: 'Check back soon!' }),
          h('a', { class: 'btn', href: '/' }, 'Back to Home')));
        return;
      }
      if (!sb()) { el.append(h('div', { class: 'panel' }, h('p', { class: 'muted', text: 'Getting your account ready…' }))); return; }
      var bar = h('div', { class: 'lab-tabs', role: 'tablist' });
      var box = h('div', { class: 'lab-box' });
      var all = [{ id: 'classes', title: 'My Classes', mount: mountClasses }].concat(tabs);
      if (!cur || !all.some(function (t) { return t.id === cur; })) cur = 'classes';
      all.forEach(function (t) {
        bar.append(h('button', { type: 'button', role: 'tab', class: 'lab-tab' + (t.id === cur ? ' on' : ''), 'aria-selected': t.id === cur ? 'true' : 'false',
          onclick: function () { if (cur === t.id) return; cur = t.id; if (hideCur) hideCur(); paint(); } }, t.title));
      });
      if (all.length < 3) bar.append(h('span', { class: 'lab-soon', text: 'Question sets come next' }));
      el.append(bar, box);
      var t = all.filter(function (x) { return x.id === cur; })[0];
      var res = t.mount(box, ctx) || {};
      hideCur = res.hide || null;
    }
    var hideCur = null;
    var ctx = { repaint: paint, go: function (id) { cur = id; if (hideCur) hideCur(); paint(); } };
    TT.labs.go = ctx.go;
    paint();
    if (TT.account && TT.account.onChange) TT.account.onChange(function () { if (!el.querySelector('.lab-box') || !TT.labs.isOwner()) paint(); });
    return { hide: function () { if (hideCur) hideCur(); } };
  };

  function setupCard(box) {
    box.append(h('div', { class: 'panel lab-setup' },
      h('h2', { text: 'One Setup Step First' }),
      h('p', { text: 'Labs needs its own tables in Supabase. It takes about two minutes:' }),
      h('ol', null,
        h('li', null, 'Open ', h('a', { href: SQL_URL, target: '_blank', rel: 'noopener', text: 'supabase/labs.sql' }), ' and copy all of it (it is also in your project files as accounts/labs.sql).'),
        h('li', { text: 'In Supabase, open SQL Editor, then New Query.' }),
        h('li', { text: 'Paste it in and press Run. You should see “Success. No rows returned.”' }),
        h('li', { text: 'Come back here and reload the page.' })),
      TT.button('Reload', { kind: 'primary', icon: 'reset', onclick: function () { location.reload(); } })));
  }
  TT.labs.setupCard = setupCard;

  // ---------- My Classes ----------
  function mountClasses(box) {
    var open = null;   // the class being looked at
    function list() {
      box.textContent = '';
      box.append(h('p', { class: 'muted lab-loading', text: 'Loading your classes…' }));
      loadClasses(true).then(function (rows) {
        box.textContent = '';
        if (open) { var still = rows.filter(function (c) { return c.id === open; })[0]; if (still) return detail(still); open = null; }
        var nameIn = h('input', { type: 'text', maxlength: 40, placeholder: 'Class name, like Room 12', 'aria-label': 'New class name' });
        var msg = h('p', { class: 'form-msg', hidden: true });
        var form = h('form', { class: 'lab-new', onsubmit: function (e) {
          e.preventDefault();
          var name = nameIn.value.trim();
          if (!name) { nameIn.focus(); return; }
          addBtn.disabled = true;
          q(sb().rpc('lab_new_class', { p_name: name })).then(function (c) { open = c.id; list(); }, function (err) {
            addBtn.disabled = false; var t = errText(err);
            if (t === 'setup') { box.textContent = ''; setupCard(box); return; }
            msg.textContent = t; msg.hidden = false;
          });
        } }, nameIn);
        var addBtn = h('button', { type: 'submit', class: 'btn primary', html: TT.icon('plus') + '<span>New Class</span>' });
        form.append(addBtn);
        var grid = h('div', { class: 'lab-classes' });
        rows.forEach(function (c) {
          grid.append(h('button', { type: 'button', class: 'lab-class-card', onclick: function () { open = c.id; detail(c); } },
            h('span', { class: 'lab-class-code', text: c.code }), h('b', { text: c.name }),
            h('span', { class: 'muted', text: c.locked ? 'Locked' : 'Opened ' + ago(c.last_used_at).toLowerCase() })));
        });
        box.append(h('section', { class: 'panel lab-panel' },
          h('div', { class: 'lab-panel-head' }, h('div', null, h('h2', { text: 'My Classes' }),
            h('p', { class: 'muted', text: 'Students sign in at edsidekick.com/play with the class code, their name and a 4-digit PIN.' }))),
          rows.length ? grid : h('p', { class: 'lab-empty', text: 'No classes yet. Make your first one below.' }),
          form, msg),
          privacyNote());
      }, function (err) {
        box.textContent = '';
        if (errText(err) === 'setup') setupCard(box);
        else box.append(h('div', { class: 'panel' }, h('p', { text: errText(err) }), TT.button('Try Again', { onclick: list })));
      });
    }

    function detail(c) {
      box.textContent = '';
      var students = [], showPins = false;
      var head = h('div', { class: 'lab-panel-head' });
      var tableBox = h('div', { class: 'lab-students' });
      var tools = h('div', { class: 'lab-tools' });
      var msg = h('p', { class: 'form-msg', hidden: true });
      function say(t) { msg.textContent = t; msg.hidden = !t; }
      var panel = h('section', { class: 'panel lab-panel' }, head, tools, msg, tableBox);
      box.append(h('div', { class: 'row lab-crumbs' }, TT.button('All Classes', { icon: 'back', kind: 'small', onclick: function () { open = null; list(); } })), panel);

      function paintHead() {
        head.textContent = '';
        var nameIn = h('input', { class: 'lab-rename', type: 'text', maxlength: 40, value: c.name, 'aria-label': 'Class name' });
        nameIn.addEventListener('change', function () {
          var v = nameIn.value.trim(); if (!v || v === c.name) { nameIn.value = c.name; return; }
          q(sb().from('lab_classes').update({ name: v }).eq('id', c.id)).then(function () { c.name = v; }, function (e) { say(errText(e)); });
        });
        head.append(h('div', null, h('span', { class: 'eyebrow', text: c.locked ? 'Locked: nobody can sign in' : 'Class' }), nameIn),
          h('div', { class: 'lab-code-box' }, h('span', { class: 'muted', text: 'Class Code' }), h('b', { text: c.code }),
            TT.button('Show on Board', { kind: 'primary small', icon: 'board', onclick: function () { showCode(c); } })));
      }
      function paintTools() {
        tools.textContent = '';
        var area = h('textarea', { rows: 4, placeholder: 'Type first names, one per line', 'aria-label': 'Student first names, one per line' });
        var lists = (TT.load('classes', { lists: [] }).lists || []).filter(function (l) { return l.names && l.names.length; });
        var pick = lists.length ? h('select', { 'aria-label': 'Add from a saved class list', onchange: function () {
          var l = lists.filter(function (x) { return x.id === pick.value; })[0];
          if (l) area.value = (area.value.trim() ? area.value.trim() + '\n' : '') + l.names.join('\n');
          pick.value = '';
        } }, h('option', { value: '', text: 'Add from a saved class list…' }), lists.map(function (l) { return h('option', { value: l.id, text: l.name + ' (' + l.names.length + ')' }); })) : null;
        var add = TT.button('Add Students', { kind: 'primary', icon: 'plus', onclick: function () {
          var have = {}, pins = {};
          students.forEach(function (s) { have[s.first_name.toLowerCase()] = 1; pins[s.pin] = 1; });
          var names = area.value.split(/\n|,/).map(cleanName).filter(Boolean);
          var rows = [], skipped = [];
          names.forEach(function (n) {
            if (have[n.toLowerCase()]) { skipped.push(n); return; }
            have[n.toLowerCase()] = 1;
            var p = newPin(pins); pins[p] = 1;
            rows.push({ class_id: c.id, first_name: n, pin: p });
          });
          if (!rows.length) { say(skipped.length ? 'Those names are already in the class. Add a last initial to tell two students apart, like Ava B.' : 'Type at least one first name.'); return; }
          if (students.length + rows.length > 60) { say('A class can have up to 60 students.'); return; }
          add.disabled = true;
          q(sb().from('lab_students').insert(rows)).then(function () {
            area.value = ''; add.disabled = false;
            say(skipped.length ? 'Added! Skipped names already in the class: ' + skipped.join(', ') + '.' : '');
            reload();
          }, function (e) { add.disabled = false; say(errText(e)); });
        } });
        tools.append(h('details', { class: 'lab-add', open: !students.length },
          h('summary', null, h('span', { html: TT.icon('plus') }), 'Add Students'),
          h('p', { class: 'muted', text: 'First names only. Each student gets their own 4-digit PIN, which you can see and change below.' }),
          area, h('div', { class: 'row' }, add, pick)));
        tools.append(h('div', { class: 'row lab-class-actions' },
          TT.button(showPins ? 'Hide PINs' : 'Show PINs', { kind: 'small', icon: showPins ? 'lock' : 'unlock', onclick: function () { showPins = !showPins; paintTools(); paintTable(); } }),
          TT.button('Print Sign-In Cards', { kind: 'small', icon: 'download', onclick: function () { printCards(c, students); } }),
          TT.button('Sign Everyone Out', { kind: 'small', onclick: function () {
            q(sb().rpc('lab_sign_out_all', { p_class: c.id })).then(function () { say('Everyone in ' + c.name + ' is signed out.'); }, function (e) { say(errText(e)); });
          } }),
          TT.button(c.locked ? 'Unlock Class' : 'Lock Class', { kind: 'small', icon: c.locked ? 'unlock' : 'lock', onclick: function () {
            q(sb().from('lab_classes').update({ locked: !c.locked }).eq('id', c.id)).then(function () { c.locked = !c.locked; paintHead(); paintTools(); say(c.locked ? 'Locked. Nobody can sign in until you unlock it.' : 'Unlocked.'); }, function (e) { say(errText(e)); });
          } }),
          TT.button('New Code', { kind: 'small', icon: 'reset', onclick: function (e) {
            e.currentTarget.after(confirmBox('Make a new class code? The old code stops working and everyone is signed out.', 'New Code', function () {
              q(sb().rpc('lab_new_code', { p_class: c.id })).then(function (code) { c.code = code; paintHead(); say('The new code is ' + code + '.'); }, function (er) { say(errText(er)); });
            }));
          } }),
          TT.button('Delete Class', { kind: 'small danger', icon: 'trash', onclick: function (e) {
            e.currentTarget.after(confirmBox('Delete ' + c.name + '? Every student’s buddy, badges and game stats are erased for good.', 'Delete Forever', function () {
              q(sb().from('lab_classes').delete().eq('id', c.id)).then(function () { open = null; list(); }, function (er) { say(errText(er)); });
            }));
          } })));
      }
      // Type a new 4-digit PIN for one student, right in the row.
      function editPin(cell, s) {
        if (cell.querySelector('input')) return;
        var input = h('input', { class: 'lab-pin-in', type: 'text', inputmode: 'numeric', maxlength: 4, value: s.pin, 'aria-label': 'New PIN for ' + s.first_name });
        var old = cell.textContent;
        cell.textContent = '';
        function stop() { showPins = true; paintTools(); paintTable(); }
        function save() {
          var v = input.value.replace(/[^0-9]/g, '');
          if (v.length !== 4) { say('A PIN is 4 numbers, like 2714.'); input.focus(); return; }
          if (students.some(function (x) { return x.id !== s.id && x.pin === v; })) { say('Another student in this class already has that PIN. Pick a different one.'); input.focus(); return; }
          if (v === s.pin) { stop(); return; }
          q(sb().from('lab_students').update({ pin: v, fails: 0, paused_until: null }).eq('id', s.id)).then(function () {
            say(s.first_name + '’s PIN is now ' + v + '.'); reload();
          }, function (e) { say(errText(e)); stop(); });
        }
        input.addEventListener('input', function () { input.value = input.value.replace(/[^0-9]/g, '').slice(0, 4); });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); save(); }
          if (e.key === 'Escape') { cell.textContent = ''; stop(); void old; }
        });
        cell.append(input,
          TT.button('Save', { kind: 'small primary', onclick: save }),
          TT.button('', { kind: 'small', icon: 'close', aria: 'Cancel', onclick: stop }));
        input.focus(); input.select();
      }
      function paintTable() {
        tableBox.textContent = '';
        if (!students.length) { tableBox.append(h('p', { class: 'lab-empty', text: 'No students yet. Add their first names above.' })); return; }
        var rows = students.map(function (s) {
          var paused = s.paused_until && new Date(s.paused_until) > new Date();
          var nBadges = Object.keys(s.badges || {}).length, st = s.stats || {};
          // The PIN, with a pencil to type a new one for just this student.
          var pinCell = h('span', { class: 'lab-pin-box' },
            h('span', { class: 'lab-pin', text: showPins ? s.pin : '••••' }),
            TT.button('', { kind: 'small ghost', icon: 'edit', aria: 'Change ' + s.first_name + '’s PIN', title: 'Change PIN', onclick: function () { editPin(pinCell, s); } }));
          var actions = h('div', { class: 'lab-row-actions' },
            paused ? TT.button('Unpause', { kind: 'small primary', onclick: function () {
              q(sb().from('lab_students').update({ paused_until: null, fails: 0 }).eq('id', s.id)).then(reload, function (e) { say(errText(e)); });
            } }) : null,
            TT.button('Gold Star', { kind: 'small', title: 'Give ' + s.first_name + ' the Gold Star badge', onclick: function () {
              q(sb().rpc('lab_save_results', { p_class: c.id, p_results: [{ id: s.id, badges: ['star'] }] })).then(function () { say(s.first_name + ' got a Gold Star!'); if (TT.chime) TT.chime(); reload(); }, function (e) { say(errText(e)); });
            } }),
            TT.button('', { kind: 'small', icon: 'reset', aria: 'Random new PIN for ' + s.first_name, title: 'Random new PIN', onclick: function () {
              var taken = {}; students.forEach(function (x) { taken[x.pin] = 1; });
              var p = newPin(taken);
              q(sb().from('lab_students').update({ pin: p, fails: 0, paused_until: null }).eq('id', s.id)).then(function () { showPins = true; say(s.first_name + '’s new PIN is ' + p + '.'); reload(); }, function (e) { say(errText(e)); });
            } }),
            TT.button('', { kind: 'small', icon: 'trash', aria: 'Remove ' + s.first_name, title: 'Remove', onclick: function (e) {
              e.currentTarget.parentNode.after(confirmBox('Remove ' + s.first_name + '? Their buddy, badges and stats are erased.', 'Remove', function () {
                q(sb().from('lab_students').delete().eq('id', s.id)).then(reload, function (er) { say(errText(er)); });
              }));
            } }));
          var nameIn = h('input', { class: 'lab-name-in', type: 'text', maxlength: 20, value: s.first_name, 'aria-label': 'First name' });
          nameIn.addEventListener('change', function () {
            var v = cleanName(nameIn.value); if (!v) { nameIn.value = s.first_name; return; }
            q(sb().from('lab_students').update({ first_name: v }).eq('id', s.id)).then(function () { s.first_name = v; nameIn.value = v; }, function (e) { say(errText(e)); });
          });
          return h('div', { class: 'lab-st' + (paused ? ' paused' : ''), role: 'row' },
            h('span', { class: 'lab-st-who', role: 'cell' }, window.Buddy ? Buddy.el(Buddy.of(s.buddy, s.id), 'lab-st-buddy') : null, nameIn),
            h('span', { role: 'cell' }, pinCell, paused ? h('em', { class: 'lab-paused', text: 'Paused' }) : null),
            h('span', { role: 'cell', class: 'lab-num', text: (st.games || 0) + ' games' }),
            h('span', { role: 'cell', class: 'lab-num', text: nBadges + ' badges' }),
            h('span', { role: 'cell', class: 'muted', text: ago(s.last_seen_at) }),
            actions);
        });
        tableBox.append(h('div', { class: 'lab-st head', role: 'row' }, ['Student', 'PIN', 'Played', 'Badges', 'Last Sign-In', ''].map(function (t) { return h('span', { role: 'columnheader', text: t }); })));
        rows.forEach(function (r) { tableBox.append(r); });
      }
      function reload() {
        return loadStudents(c.id).then(function (rows) { students = rows || []; paintTools(); paintTable(); }, function (e) { say(errText(e)); });
      }
      paintHead(); paintTools(); reload();
    }
    list();
  }

  function privacyNote() {
    return h('aside', { class: 'lab-note' },
      h('b', { text: 'What Labs Saves About Students' }),
      h('p', { text: 'First name, PIN, buddy, badges and game stats. No emails, last names, birthdays or photos. Only you can see your students. Deleting a class erases everything about its students.' }));
  }

  // ---------- Show the class code big, with a QR code ----------
  function showCode(c) {
    var url = location.origin + '/play?c=' + encodeURIComponent(c.code);
    var qr = h('div', { class: 'lab-qr', 'aria-hidden': 'true' });
    var layer = h('div', { class: 'lab-show', role: 'dialog', 'aria-label': 'Class code' },
      h('div', { class: 'lab-show-card' },
        h('p', { class: 'lab-show-kicker', text: c.name }),
        h('p', { class: 'lab-show-step', text: 'Go to' }), h('p', { class: 'lab-show-url', text: location.host + '/play' }),
        h('p', { class: 'lab-show-step', text: 'Type this code' }), h('p', { class: 'lab-show-code', text: c.code }),
        qr,
        TT.button('Close', { kind: 'primary', onclick: function () { layer.remove(); } })));
    (document.fullscreenElement || document.body).append(layer);
    loadQR().then(function () {
      try { var g = window.qrcode(0, 'M'); g.addData(url); g.make(); qr.innerHTML = g.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) {}
    }, function () {});
    layer.addEventListener('click', function (e) { if (e.target === layer) layer.remove(); });
  }
  TT.labs.showCode = showCode;
  var qrLoading = null;
  function loadQR() {
    if (window.qrcode) return Promise.resolve();
    if (qrLoading) return qrLoading;
    qrLoading = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/assets/qrcode.js?v=1'; s.onload = ok; s.onerror = no; document.head.append(s); });
    return qrLoading;
  }
  TT.labs.loadQR = loadQR;

  // ---------- Printable sign-in cards ----------
  function printCards(c, students) {
    if (!students.length) return;
    var w = window.open('', '_blank');
    if (!w) return;
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]; }); };
    var cards = students.map(function (s) {
      return '<div class="card"><div class="b">' + Buddy.svg(Buddy.of(s.buddy, s.id)) + '</div><div><p class="n">' + esc(s.first_name) + '</p>' +
        '<p class="l">Go to <b>' + esc(location.host) + '/play</b></p><p class="l">Class code <b>' + esc(c.code) + '</b></p><p class="pin">My PIN <b>' + esc(s.pin) + '</b></p></div></div>';
    }).join('');
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Sign-In Cards · ' + esc(c.name) + '</title>' +
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gabarito:wght@600..900&family=Atkinson+Hyperlegible+Next:wght@400..700&display=swap">' +
      '<style>body{font-family:"Atkinson Hyperlegible Next",sans-serif;margin:24px;color:#2B1F66}h1{font:900 22px Gabarito,sans-serif;margin:0 0 12px}' +
      '.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{display:flex;gap:14px;align-items:center;border:2px dashed #B9B0EE;border-radius:18px;padding:14px;break-inside:avoid}' +
      '.b{width:86px;flex:none}.b svg{width:100%}.n{font:900 26px Gabarito,sans-serif;margin:0 0 4px}.l{margin:0;font-size:14px}.pin{margin:6px 0 0;font-size:16px}.pin b{font:900 24px Gabarito,sans-serif;letter-spacing:.12em;background:#FFF1C2;padding:2px 8px;border-radius:8px}' +
      '@media print{body{margin:10mm}button{display:none}}</style></head><body><h1>' + esc(c.name) + ': Sidekick Live Sign-In Cards</h1>' +
      '<button onclick="print()" style="font:700 16px sans-serif;padding:10px 16px;border-radius:10px;margin-bottom:12px">Print</button><div class="grid">' + cards + '</div></body></html>');
    w.document.close();
  }
})();
