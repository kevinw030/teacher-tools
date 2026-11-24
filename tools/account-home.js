// My Account home (Kevin, 2026-11-24): a colorful welcome banner with the mascot, stats tiles,
// quick picks, the plan card, an Invite Friends slot, sticker achievements and a tidy Account Tools area.
//
// assets/account.js still owns signing in, saving, the avatar picker, backup, sign out and delete.
// Its accountCard() builds those pieces and hands them to TT.accountHome(parts) to lay out here.
//
// Stats come from what the site already saves (boards, class lists, spelling lists, My Questions,
// escape rooms, Fact Fluency rounds). Two small counters are new and live in "usage" (saved with the
// account like everything else): how often each tool or game page is opened (for Quick Picks and
// Games Played) and how many Bingo games were started. Page names and counts only, never names of students.
//
// Invite Friends: the invite code feature defines TT.inviteCard() (assets/invite.js). Until it
// does, the card shows a short Coming Soon note.
(function () {
  var TT = window.TT; if (!TT || !TT.h) return;
  var h = TT.h;

  // ---------- Usage counters ----------
  var SKIP = { home: 1, account: 1, settings: 1, owner: 1, games: 1, join: 1, privacy: 1, terms: 1, help: 1 };
  function usage() {
    var u = TT.load('usage', null);
    if (!u || typeof u !== 'object') u = {};
    if (!u.pages || typeof u.pages !== 'object') u.pages = {};
    u.bingo = +u.bingo || 0;
    if (!u.since) u.since = new Date().toISOString().slice(0, 10);
    return u;
  }
  function signedIn() { return !!(TT.account && TT.account.signedIn && TT.account.signedIn()); }
  var lastPage = '', lastAt = 0;
  function countPage() {
    var p = TT.page();
    if (!signedIn() || SKIP[p] || !TT.pages || !TT.pages[p]) return;
    var now = Date.now();
    if (p === lastPage && now - lastAt < 5000) return;
    lastPage = p; lastAt = now;
    var u = usage(); u.pages[p] = (+u.pages[p] || 0) + 1; TT.save('usage', u);
  }
  window.addEventListener('tt:page', countPage);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(countPage, 1500); });
  else setTimeout(countPage, 1500);
  // Bingo tells TT.track when a game starts. Count it here too.
  var track = TT.track;
  TT.track = function (event, detail) {
    if (event === 'bingo' && signedIn()) { var u = usage(); u.bingo++; TT.save('usage', u); }
    if (track) return track.apply(this, arguments);
  };

  // ---------- Little drawings (stroke icons, 24 x 24) ----------
  var ICONS = {
    board: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    class: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c.8-3.6 3.2-5.5 6-5.5s5.2 1.9 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.5c2.3.2 3.8 1.9 4.5 4.5"/>',
    game: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7 10.5v4M5 12.5h4"/><circle cx="15.5" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="13.8" r=".9" fill="currentColor"/>',
    bingo: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
    spell: '<path d="M4 19 8.5 5h1L14 19M5.6 14.5h6.8"/><path d="M15.5 13.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5V19M20.5 16.2c-.5-.6-1.4-1-2.5-1-1.4 0-2.5.9-2.5 2s1.1 1.8 2.5 1.8c1 0 2-.5 2.5-1.2"/>',
    question: '<path d="M9 9a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1.2-1.5 2.4"/><circle cx="12" cy="18" r=".7" fill="currentColor"/><circle cx="12" cy="12" r="9.5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l2.5 2.5M14.5 8.5 17 11"/>',
    bolt: '<path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    crown: '<path d="M3.5 8 7.5 12 12 5l4.5 7 4-4-1.8 10.5H5.3z"/><path d="M5.5 21h13"/>',
    paint: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.3-1.3-1.6-1.3-2.9 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8" r="1.2" fill="currentColor"/>',
    gift: '<rect x="3.5" y="9" width="17" height="11.5" rx="2"/><path d="M2.5 9h19v-.5M12 9v11.5M12 9c-1.5-3.5-5.5-4.5-6-2s3.5 2 6 2c2.5 0 6.5.5 6-2s-4.5-1.5-6 2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.3 2.3 4.2-4.6"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'
  };
  function ico(name, cls) {
    return h('span', { class: cls || 'ah-ico', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>' });
  }

  // ---------- Stats from what is already saved ----------
  function stats() {
    var u = usage(), s = {};
    var screens = TT.load('board-screens', null);
    s.boards = screens && Array.isArray(screens.list) ? screens.list.length : 0;
    var classes = TT.load('classes', null);
    s.classes = classes && Array.isArray(classes.lists) ? classes.lists.filter(function (l) { return l && Array.isArray(l.names) && l.names.length; }).length : 0;
    var games = {}; (TT.games || []).forEach(function (g) { games[g.id] = 1; });
    ['bingo', 'trivia', 'escape-room', 'addition-race', 'subtraction-race', 'multiplication-race', 'division-race', 'trail-race'].forEach(function (k) { games[k] = 1; });
    s.games = Object.keys(u.pages).reduce(function (n, k) { return n + (games[k] ? +u.pages[k] || 0 : 0); }, 0);
    s.bingo = u.bingo;
    var sp = TT.load('spelling', null);
    s.spelling = sp && Array.isArray(sp.lists) ? sp.lists.filter(function (l) { return l && l.name !== 'Sample Words'; }).length : 0;
    var c = TT.load('custom', {}) || {};
    s.questions = ['wyr', 'trivia', 'rooms'].reduce(function (n, k) { return n + (Array.isArray(c[k]) ? c[k].length : 0); }, 0);
    s.escapes = Object.keys(TT.load('escape-best', {}) || {}).length;
    var fl = TT.load('fluency-log', null);
    s.fluency = Array.isArray(fl) ? fl.length : 0;
    var av = TT.load('avatar', null);
    s.icon = !!(av && (av.preset || av.img || av.google));
    s.since = u.since;
    return s;
  }

  // ---------- Sticker achievements ----------
  // [id, name, how to earn it, icon, color, earned?]
  function stickers(s, plan) {
    return [
      ['first-board', 'First Board', 'Save a Classroom Board screen', 'board', 'cobalt', s.boards > 0],
      ['class-ready', 'Class Ready', 'Add names to a class list', 'class', 'emerald', s.classes > 0],
      ['bingo-host', 'Bingo Host', 'Start a game of Class Bingo', 'bingo', 'rose', s.bingo > 0],
      ['game-day', 'Game Day', 'Open 10 games with your class', 'game', 'coral', s.games >= 10],
      ['word-wizard', 'Word Wizard', 'Make your own spelling list', 'spell', 'violet', s.spelling > 0],
      ['question-writer', 'Question Writer', 'Write a question in My Questions', 'question', 'sky', s.questions > 0],
      ['escape-artist', 'Escape Artist', 'Escape from an escape room', 'key', 'amber', s.escapes > 0],
      ['fact-coach', 'Fact Coach', 'Run a Fact Fluency round', 'bolt', 'lime', s.fluency > 0],
      ['made-it-mine', 'Made It Mine', 'Pick an icon for your account', 'paint', 'rose', s.icon],
      ['plus-member', 'Plus Member', 'Join the Plus plan', 'crown', 'amber', plan === 'premium' || plan === 'owner']
    ];
  }

  // ---------- Quick Picks ----------
  var STARTERS = ['board', 'timer', 'name-picker', 'morning-meeting'];
  function tileFor(id) {
    var a = document.querySelector('#view-home a.tool[href="/' + id + '"]');
    var title = (TT.pages && TT.pages[id]) || id;
    var color = a ? (a.className.match(/\bc-[a-z]+/) || ['c-violet'])[0] : 'c-violet';
    var icon = a && a.querySelector('.tool-icon') ? a.querySelector('.tool-icon').innerHTML : '';
    if (!icon) { var g = (TT.games || []).filter(function (x) { return x.id === id; })[0]; if (g) { color = 'c-' + g.color; title = g.title; } }
    // "tool-icon" lets tools/game-icons.js swap in Kevin's sticker art for this page.
    return h('a', { class: 'ah-pick ' + color, href: '/' + id },
      h('span', { class: 'tool-icon ah-pick-ico', 'aria-hidden': 'true', html: icon || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS.game + '</svg>' }),
      h('span', { class: 'ah-pick-name', text: title }));
  }
  function picks() {
    var u = usage();
    var used = Object.keys(u.pages).filter(function (k) { return TT.pages && TT.pages[k] && !SKIP[k] && k !== 'pet'; })
      .sort(function (a, b) { return (u.pages[b] || 0) - (u.pages[a] || 0); });
    var list = used.slice(0, 4);
    STARTERS.forEach(function (k) { if (list.length < 4 && list.indexOf(k) < 0 && TT.pages && TT.pages[k]) list.push(k); });
    return { list: list, mine: used.length > 0 };
  }
  function boardChips() {
    var screens = TT.load('board-screens', null);
    if (!screens || !Array.isArray(screens.list) || !screens.list.length) return null;
    return h('div', { class: 'ah-boards' },
      h('span', { class: 'ah-sub', text: 'Your Saved Boards' }),
      h('div', { class: 'ah-chips' }, screens.list.slice(0, 8).map(function (x) {
        return h('a', { class: 'ah-chip', href: '/board', onclick: function () { TT.boardWant = x.id; } }, ico('board', 'ah-chip-ico'), h('span', { text: x.name || 'My Board' }));
      })));
  }

  // ---------- Small pieces ----------
  function card(cls, title, sub, body) {
    return h('section', { class: 'ah-card ' + cls },
      h('div', { class: 'ah-card-head' }, h('h2', { text: title }), sub ? h('p', { class: 'muted', text: sub }) : null),
      body);
  }
  function monthYear(iso) {
    var d = iso ? new Date(iso) : null;
    if (!d || isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  function longDate(v) {
    var d = v ? new Date(v) : null;
    if (!d || isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }
  function daysUntil(v) {
    var d = v ? new Date(v) : null;
    if (!d || isNaN(d)) return 0;
    return Math.max(0, Math.ceil((d - Date.now()) / 86400000));
  }

  function banner(p, anim) {
    var buddy = TT.mascot ? TT.mascot() : null;
    if (buddy && anim) setTimeout(function () { if (buddy.isConnected) buddy.mood('wave', 2600); }, 450);
    var since = monthYear(p.joined);
    return h('section', { class: 'ah-banner' },
      h('span', { class: 'ah-glow g1', 'aria-hidden': 'true' }), h('span', { class: 'ah-glow g2', 'aria-hidden': 'true' }),
      h('div', { class: 'ah-who' },
        h('div', { class: 'avatar-wrap ah-avatar' }, p.avatar),
        h('div', { class: 'ah-hello' },
          h('h2', { text: p.name ? 'Hi, ' + p.name + '!' : 'Welcome Back!' }),
          h('p', { class: 'ah-email', text: p.email }),
          h('div', { class: 'ah-tags' },
            h('span', { class: 'plan-badge p-' + p.plan, text: TT.planName(p.plan) + ' Plan' }),
            since ? h('span', { class: 'ah-tag' }, ico('cal', 'ah-tag-ico'), h('span', { text: 'Member Since ' + since })) : null))),
      buddy ? h('button', { type: 'button', class: 'ah-mascot', 'aria-label': 'Say hi to the Sidekick', onclick: function () { buddy.play('yay'); } }, buddy) : null);
  }

  function statsCard(s) {
    var tiles = [
      ['Boards Saved', s.boards, 'board', 'cobalt'],
      ['Class Lists', s.classes, 'class', 'emerald'],
      ['Games Played', s.games, 'game', 'coral'],
      ['Bingo Games Hosted', s.bingo, 'bingo', 'rose'],
      ['Spelling Lists Made', s.spelling, 'spell', 'violet'],
      ['My Questions Written', s.questions, 'question', 'sky'],
      ['Escape Rooms Won', s.escapes, 'key', 'amber'],
      ['Fact Fluency Rounds', s.fluency, 'bolt', 'lime']
    ];
    return card('ah-stats', 'Your Classroom at a Glance', null,
      h('div', { class: 'ah-stat-grid' }, tiles.map(function (t, i) {
        return h('div', { class: 'ah-stat c-' + t[3], style: '--i:' + i },
          ico(t[2], 'ah-stat-ico'), h('b', { class: 'ah-stat-num', text: String(t[1]) }), h('span', { class: 'ah-stat-label', text: t[0] }));
      })));
  }

  function picksCard() {
    var pk = picks();
    return card('ah-picks', 'Quick Picks', pk.mine ? 'The tools you open the most, one tap away.' : 'A few favorites to start. This fills in with the tools you use most.',
      h('div', null, h('div', { class: 'ah-pick-grid' }, pk.list.map(tileFor)), boardChips()));
  }

  function stickerCard(s, plan) {
    var list = stickers(s, plan), got = list.filter(function (x) { return x[5]; }).length;
    var seen = TT.load('stickers-seen', null);
    var first = !Array.isArray(seen); if (first) seen = [];
    var fresh = list.filter(function (x) { return x[5] && seen.indexOf(x[0]) < 0; }).map(function (x) { return x[0]; });
    // The first visit counts everything already earned as seen, so only later stickers say New.
    if (fresh.length) TT.save('stickers-seen', seen.concat(fresh));
    var head = h('div', { class: 'ah-card-head ah-stk-head' },
      h('div', null, h('h2', { text: 'Sticker Collection' }), h('p', { class: 'muted', text: 'Earn stickers as you use ED Sidekick.' })),
      h('span', { class: 'ah-stk-count' }, h('b', { text: got }), ' of ' + list.length));
    var meter = h('div', { class: 'ah-meter', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': list.length, 'aria-valuenow': got, 'aria-label': 'Stickers earned' },
      h('span', { style: 'width:' + Math.round(got / list.length * 100) + '%' }));
    return h('section', { class: 'ah-card ah-stickers' }, head, meter,
      h('div', { class: 'ah-stk-grid' }, list.map(function (x, i) {
        var isNew = !first && fresh.indexOf(x[0]) >= 0;
        return h('div', { class: 'ah-stk c-' + x[4] + (x[5] ? ' got' : ' locked') + (isNew ? ' new' : ''), style: '--i:' + i, title: x[5] ? x[1] : 'To earn it: ' + x[2] },
          h('span', { class: 'ah-stk-badge' }, ico(x[5] ? x[3] : 'lock', 'ah-stk-ico'), isNew ? h('span', { class: 'ah-new', text: 'New' }) : null),
          h('b', { text: x[1] }),
          h('small', { text: x[5] ? 'Earned' : x[2] }));
      })));
  }

  function planCard(p) {
    var free = p.plan === 'free';
    var until = TT.account.plusUntil ? TT.account.plusUntil() : null;
    var freeDays = TT.account.freePlus && TT.account.freePlus();
    var paidPremium = TT.account.paidPlan ? TT.account.paidPlan() === 'premium' : p.plan === 'premium';
    if (p.plan === 'owner') {
      return card('ah-plan is-owner', 'Owner Plan', p.viewAs ? 'You are previewing the site as ' + TT.planName(p.viewAs) + '.' : 'Every tool and game is unlocked on your account.',
        h('div', { class: 'ah-plan-body' }, h('div', { class: 'ah-plan-art' }, ico('crown', 'ah-plan-ico'))));
    }
    if (!free) {
      var perks = (TT.PLAN_FEATURES && TT.PLAN_FEATURES.premium || []).slice(0, 4);
      var left = freeDays && until ? daysUntil(until) : 0;
      return card('ah-plan is-plus', 'Plus Is On',
        left ? 'Free Plus from invites: ' + left + (left === 1 ? ' day' : ' days') + ' left, until ' + longDate(until) + '.' : 'Thank you for supporting ED Sidekick! Everything below is unlocked.',
        h('div', { class: 'ah-plan-body' },
          h('ul', { class: 'ah-perks' }, perks.map(function (t) { return h('li', null, ico('shield', 'ah-perk-ico'), h('span', { text: t[0] })); })),
          h('div', { class: 'row' },
            paidPremium && p.manageUrl ? h('a', { class: 'btn small', href: p.manageUrl, target: '_blank', rel: 'noopener' }, 'Manage My Plan') : null,
            !paidPremium ? TT.button('Keep Plus', { kind: 'primary small', onclick: p.openPlans }) : null,
            TT.button('See All Plans', { kind: 'small', onclick: p.openPlans }))));
    }
    var adds = (TT.PLAN_FEATURES && TT.PLAN_FEATURES.premium || []).slice(0, 5);
    return card('ah-plan is-free', 'See What Plus Adds', p.paying ? 'Your Plus plan is turning on.' : 'Your Free plan is yours forever. Plus opens even more for your class.',
      h('div', { class: 'ah-plan-body' },
        h('ul', { class: 'ah-perks' }, adds.map(function (t) { return h('li', null, ico('star', 'ah-perk-ico'), h('span', { text: t[0] })); })),
        TT.button('See Plans and Pricing', { kind: 'primary small', onclick: p.openPlans })));
  }

  function inviteCard() {
    var el = null;
    if (typeof TT.inviteCard === 'function') { try { el = TT.inviteCard(); } catch (e) { el = null; } }
    if (el) return h('div', { class: 'ah-invite-slot' }, el);
    return card('ah-invite', 'Invite Friends', 'Share ED Sidekick with the teachers down the hall.',
      h('div', { class: 'ah-invite-soon' }, ico('gift', 'ah-invite-ico'), h('p', { text: 'Invite codes are coming soon. Friends who join will earn you free Plus days.' })));
  }

  function ownerCard(p) {
    if (p.realPlan !== 'owner') return null;
    return h('section', { class: 'ah-card acct-owner ah-owner' },
      h('div', null, h('h3', { text: 'Owner Dashboard' }),
        h('p', { class: 'muted', text: p.viewAs ? 'You are previewing the site as ' + TT.planName(p.viewAs) + '. Your account is still the owner account.' : 'Traffic, members, income and the plan preview switch.' })),
      h('a', { class: 'btn primary small', href: '/owner' }, 'Open Dashboard'));
  }

  function toolsCard(p) {
    var backup = TT.backupControls ? h('div', { class: 'ah-tool' },
      h('div', null, h('h3', { text: 'Backup File' }), h('p', { class: 'muted', text: 'Download everything to a file you keep, or bring a backup back in.' })),
      TT.backupControls()) : null;
    return h('section', { class: 'ah-card ah-tools' },
      h('div', { class: 'ah-card-head ah-tools-head' },
        h('div', null, h('h2', { text: 'Account Tools' }), p.status),
        TT.button('Settings', { icon: 'gear', kind: 'small', onclick: p.openSettings })),
      p.sync ? h('div', { class: 'ah-tool' }, p.sync) : null,
      backup,
      h('div', { class: 'ah-tool' }, h('div', null, h('h3', { text: 'Sign Out' }), h('p', { class: 'muted', text: 'Your things stay safe in your account.' })), p.signOut),
      p.del);
  }

  // The page rebuilds itself as saving reports in. Only the first build after opening the page animates.
  var animated = false;
  window.addEventListener('tt:page', function () { animated = false; });
  TT.accountHome = function (p) {
    var s = stats();
    var notes = (p.notes || []).filter(Boolean);
    var anim = !animated; animated = true;
    return h('div', { class: 'ah' + (anim ? ' anim' : '') },
      banner(p, anim),
      notes.length ? h('div', { class: 'ah-notes' }, notes) : null,
      p.picker ? h('section', { class: 'ah-card ah-picker' }, p.picker) : null,
      h('div', { class: 'ah-cols' },
        h('div', { class: 'ah-main' }, statsCard(s), picksCard(), stickerCard(s, p.plan)),
        h('div', { class: 'ah-side' }, ownerCard(p), planCard(p), inviteCard())),
      toolsCard(p));
  };
})();
