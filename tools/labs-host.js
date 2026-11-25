// Labs: Host a Game. The teacher picks a class, a question set and a game mode, then runs the game from
// this screen while students answer on their own devices (/play).
// This screen is the referee: it holds the answer key, decides what is right, keeps the scores, and at the
// end saves each student's totals and new badges through lab_save_results (supabase/labs.sql).
// Game modes live in tools/live-modes.js: each one only draws the big screen between questions.
(function () {
  var TT = window.TT, h = TT.h;
  var SHAPES = ['triangle', 'diamond', 'circle', 'square'];
  var COLORS = ['#E9465A', '#2F6BFF', '#FFB627', '#22C3A6'];
  var SHAPE_SVG = {
    triangle: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 6 36 34H4z" fill="currentColor"/></svg>',
    diamond: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4 36 20 20 36 4 20z" fill="currentColor"/></svg>',
    circle: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="currentColor"/></svg>',
    square: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="6" width="28" height="28" rx="5" fill="currentColor"/></svg>'
  };
  window.LiveLook = { SHAPES: SHAPES, COLORS: COLORS, shape: function (i) { return SHAPE_SVG[SHAPES[i % 4]]; }, color: function (i) { return COLORS[i % 4]; } };

  var SECS = [10, 15, 20, 30, 45];
  var LENGTHS = [10, 15, 20, 30];
  var MINUTES = [3, 5, 8, 12];

  TT.labs.tab({ id: 'host', title: 'Host a Game', order: 1, mount: mountHost });

  function mountHost(box) {
    var game = null;   // the running game
    var pick = { classId: null, band: '3-4', setId: null, mode: 'classic', secs: 20, length: 15, minutes: 5 };
    try { Object.assign(pick, JSON.parse(localStorage.getItem('tt-live-pick') || '{}')); } catch (e) {}
    function remember() { try { localStorage.setItem('tt-live-pick', JSON.stringify(pick)); } catch (e) {} }

    function setup() {
      box.textContent = '';
      box.append(h('p', { class: 'muted lab-loading', text: 'Loading your classes…' }));
      TT.labs.classes().then(function (classes) {
        box.textContent = '';
        if (!classes.length) {
          box.append(h('div', { class: 'panel lab-panel' }, h('h2', { text: 'Make a Class First' }),
            h('p', { class: 'muted', text: 'A live game needs a class, so every player signs in as themselves.' }),
            TT.button('Go to My Classes', { kind: 'primary', onclick: function () { TT.labs.go('classes'); } })));
          return;
        }
        if (!pick.classId || !classes.some(function (c) { return c.id === pick.classId; })) pick.classId = classes[0].id;
        var sets = window.LiveBanks ? LiveBanks.list(pick.band) : [];
        var mine = (TT.labs.mySets && TT.labs.mySets()) || [];
        var all = sets.concat(mine.map(function (s) {
          return { id: 'own-' + s.id, title: s.title, subject: s.subject || 'My Set', grade: s.grade || '', count: (s.questions || []).length + ' questions', mine: true,
            make: function () { var q = LiveBanks.shuffle((s.questions || []).slice()).map(LiveBanks.mixChoices); return { id: s.id, title: s.title, subject: s.subject || '', grade: s.grade || '', questions: q }; } };
        }));
        if (!all.some(function (s) { return s.id === pick.setId; })) pick.setId = all[0] && all[0].id;

        var classRow = h('div', { class: 'lab-choice' }, classes.map(function (c) {
          return chip(c.name + ' · ' + c.code, c.id === pick.classId, function () { pick.classId = c.id; remember(); setup(); });
        }));
        var bandRow = h('div', { class: 'lab-choice' }, LiveBanks.BANDS.map(function (b) {
          return chip(b[1], b[0] === pick.band, function () { pick.band = b[0]; pick.setId = null; remember(); setup(); });
        }));
        var setGrid = h('div', { class: 'lab-sets' }, all.map(function (s) {
          return h('button', { type: 'button', class: 'lab-set' + (s.id === pick.setId ? ' on' : ''), onclick: function () { pick.setId = s.id; remember(); setup(); } },
            h('span', { class: 'lab-set-tag', text: s.mine ? 'My Set' : s.subject }), h('b', { text: s.title }), h('span', { class: 'muted', text: s.count }));
        }));
        var modeGrid = h('div', { class: 'lab-modes' }, LiveModes.list().map(function (m) {
          return h('button', { type: 'button', class: 'lab-mode' + (m.id === pick.mode ? ' on' : ''), style: '--mc:' + m.color, onclick: function () { pick.mode = m.id; remember(); setup(); } },
            h('span', { class: 'lab-mode-art', html: m.art }), h('b', { text: m.name }), h('span', { text: m.blurb }));
        }));
        var modeNow = LiveModes.get(pick.mode);
        var secRow = h('div', { class: 'lab-choice' }, SECS.map(function (s) { return chip(s + ' sec', s === pick.secs, function () { pick.secs = s; remember(); setup(); }); }));
        var lenRow = h('div', { class: 'lab-choice' }, LENGTHS.map(function (n) { return chip(n + ' questions', n === pick.length, function () { pick.length = n; remember(); setup(); }); }));
        var minRow = h('div', { class: 'lab-choice' }, MINUTES.map(function (n) { return chip(n + ' minutes', n === pick.minutes, function () { pick.minutes = n; remember(); setup(); }); }));

        box.append(h('section', { class: 'panel lab-panel' },
          h('div', { class: 'lab-panel-head' }, h('div', null, h('h2', { text: 'Host a Game' }),
            h('p', { class: 'muted', text: 'Your class signs in at edsidekick.com/play and joins with one tap.' }))),
          field('Class', classRow), field('Grade', bandRow), field('Question Set', setGrid),
          field('Game Mode', modeGrid),
          modeNow.solo ? field('How Long the Race Runs', minRow) : field('Seconds per Question', secRow),
          modeNow.solo ? h('p', { class: 'muted lab-solo-note', text: 'Self-paced: everyone answers on their own device at their own speed, and the big screen keeps the live leaderboard.' }) : field('Game Length', lenRow),
          h('div', { class: 'lab-go' }, TT.button('Start the Game', { kind: 'primary', icon: 'play', onclick: function () {
            var klass = classes.filter(function (c) { return c.id === pick.classId; })[0];
            var setCard = all.filter(function (s) { return s.id === pick.setId; })[0];
            if (!klass || !setCard) return;
            var m = LiveModes.get(pick.mode);
            if (m.solo) {
              // A self-paced race runs in its own engine (tools/labs-solo.js).
              game = LiveSolo.run(box, { klass: klass, set: setCard.make(Math.max(30, pick.minutes * 8)), mode: m, minutes: pick.minutes,
                onQuit: function () { game = null; setup(); } });
              return;
            }
            game = runGame(box, { klass: klass, set: setCard.make(pick.length), mode: pick.mode, secs: pick.secs, length: pick.length, onQuit: function () { game = null; setup(); } });
          } }))));
      }, function (err) {
        box.textContent = '';
        if (TT.labs.errText(err) === 'setup') TT.labs.setupCard(box);
        else box.append(h('div', { class: 'panel' }, h('p', { text: TT.labs.errText(err) })));
      });
    }
    function chip(text, on, onclick) { return h('button', { type: 'button', class: 'lab-chip' + (on ? ' on' : ''), onclick: onclick, text: text }); }
    function field(label, el) { return h('div', { class: 'lab-field' }, h('span', { class: 'eyebrow', text: label }), el); }

    setup();
    return { hide: function () { if (game) game.quit(true); } };
  }

  // ---------- Running a game ----------
  function runGame(box, opts) {
    // append, skipping anything that isn't there (a plain append would print "null")
    function put(el) { var kids = [].slice.call(arguments, 1).filter(function (x) { return x != null && x !== false; }); el.append.apply(el, kids); }
    var klass = opts.klass, set = opts.set, mode = LiveModes.get(opts.mode);
    var players = {};        // sid -> { sid, name, buddy, score, right, answered, streak, bestStreak, fastest, place, here, tags }
    var phase = 'lobby', qi = -1, asked = null, answers = {}, timer = null, tick = null, endsAt = 0, conn = null, quitting = false;
    var stage = h('div', { class: 'live-stage mode-' + mode.id });
    box.textContent = '';
    box.append(stage);
    document.body.classList.add('live-hosting');

    function list() { return Object.keys(players).map(function (k) { return players[k]; }); }
    function here() { return list().filter(function (p) { return p.here; }); }
    function send(ev, data) { if (conn) conn.send(ev, data || {}); }
    // Teams, kept even: a new player joins whichever team has fewer players.
    function smallestTeam() {
      var n = [0, 0];
      list().forEach(function (p) { if (p.here && p.team != null) n[p.team]++; });
      return n[0] <= n[1] ? 0 : 1;
    }
    // What the mode's big screen needs to know.
    function info() {
      var teams = mode.teams ? mode.teams.map(function (t, i) {
        var mates = here().filter(function (p) { return p.team === i; });
        return { name: t.name, color: t.color, players: mates, right: mates.reduce(function (n, p) { return n + p.right; }, 0), score: mates.reduce(function (n, p) { return n + p.score; }, 0) };
      }) : null;
      var right = here().reduce(function (n, p) { return n + p.right; }, 0);
      return { qn: qi + 1, total: set.questions.length, klass: klass.name, teams: teams, classRight: right,
        goal: Math.max(1, Math.round(set.questions.length * Math.max(1, here().length) * 0.6)) };
    }
    function stateMsg() { return { phase: phase, mode: mode.id, title: set.title, qn: qi + 1, total: set.questions.length, klass: klass.name }; }

    conn = Live.connect({
      code: klass.code, me: 'host', meta: { host: true },
      on: {
        join: function (p) {
          if (!p || !p.sid) return;
          var old = players[p.sid];
          players[p.sid] = Object.assign({ sid: p.sid, score: 0, right: 0, answered: 0, streak: 0, bestStreak: 0, fastest: 0, tags: {} }, old || {},
            { name: String(p.name || 'Player').slice(0, 20), buddy: p.buddy || {}, here: true });
          if (mode.teams && players[p.sid].team == null) players[p.sid].team = smallestTeam();
          send('state', stateMsg());
          if (phase === 'ask') send('q', askMsg());
          paint();
        },
        bye: function (p) { if (p && players[p.sid]) { players[p.sid].here = false; paint(); } },
        ans: function (p) {
          if (phase !== 'ask' || !p || !players[p.sid] || p.i !== qi || answers[p.sid]) return;
          var ms = Math.max(0, Math.min(opts.secs * 1000, +p.ms || 0));
          var right = p.pick === asked.c;
          answers[p.sid] = { pick: p.pick, ms: ms, right: right };
          paint();
          if (Object.keys(answers).length >= here().length) setTimeout(function () { if (phase === 'ask') reveal(); }, 600);
        },
        hi: function () { send('state', stateMsg()); }
      },
      onStatus: function (s) { stage.setAttribute('data-net', s); },
      onLive: function () { send('state', stateMsg()); }
    });

    // ---------- Screens ----------
    function paint() { if (phase === 'lobby') paintLobby(); else if (phase === 'ask') paintAsk(); else if (phase === 'reveal') paintReveal(); else if (phase === 'done') paintDone(); }

    function topBar(right) {
      return h('div', { class: 'live-top' },
        h('div', null, h('span', { class: 'live-kicker', text: klass.name + ' · ' + set.title }),
          h('span', { class: 'live-mode-name', text: mode.name })),
        h('div', { class: 'row' }, right || null,
          TT.button('End Game', { kind: 'small danger', onclick: function () { finish(); } })));
    }
    function playerChip(p, extra) {
      return h('div', { class: 'live-chip' + (extra || '') },
        window.Buddy ? Buddy.el(p.buddy, 'live-chip-buddy') : null, h('b', { text: p.name }));
    }

    var mascotEl = null;
    function hostMascot() {
      if (!mascotEl) { mascotEl = TT.mascot({ mood: 'wave' }); setTimeout(function () { if (mascotEl) mascotEl.mood('idle'); }, 2400); }
      return mascotEl;
    }
    function cheer(mood) { if (mascotEl) mascotEl.mood(mood || 'cheer', 2000); }
    function paintLobby() {
      stage.textContent = '';
      var people = here();
      var qr = h('div', { class: 'live-qr', 'aria-hidden': 'true' });
      TT.labs.loadQR().then(function () {
        try { var g = window.qrcode(0, 'M'); g.addData(location.origin + '/play?c=' + encodeURIComponent(klass.code)); g.make(); qr.innerHTML = g.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) {}
      }, function () {});
      put(stage, topBar(),
        h('div', { class: 'live-lobby' },
          h('div', { class: 'live-join' },
            h('p', { class: 'live-step', text: '1. Go to' }), h('p', { class: 'live-url', text: location.host + '/play' }),
            h('p', { class: 'live-step', text: '2. Class code' }), h('p', { class: 'live-code', text: klass.code }),
            qr),
          h('div', { class: 'live-waiting' },
            TT.mascot ? h('div', { class: 'live-mascot', 'aria-hidden': 'true' }, hostMascot()) : null,
            h('h2', { text: people.length ? people.length + (people.length === 1 ? ' Player Is In!' : ' Players Are In!') : 'Waiting for Players…' }),
            h('div', { class: 'live-players' }, people.map(function (p) { return playerChip(p); })),
            people.length ? null : h('p', { class: 'muted', text: 'Students tap their name and type their PIN, then press Join.' }))),
        h('div', { class: 'live-go' },
          TT.button('Start, ' + set.questions.length + ' Questions', { kind: 'primary big', icon: 'play', onclick: start }),
          h('span', { class: 'muted', text: people.length ? '' : 'You can start once someone has joined.' })));
      stage.querySelector('.btn.primary').disabled = !people.length;
    }

    function start() {
      send('go', {});
      if (window.Lobby && Lobby.countdown) Lobby.countdown({ title: 'Get Ready!', done: next });
      else next();
    }

    function askMsg() { return { i: qi, q: asked.q, a: asked.a, secs: opts.secs, qn: qi + 1, total: set.questions.length, ends: Date.now() + opts.secs * 1000 }; }
    function next() {
      qi++;
      if (qi >= set.questions.length) { finish(); return; }
      asked = set.questions[qi]; answers = {}; phase = 'ask';
      endsAt = Date.now() + opts.secs * 1000;
      send('q', askMsg());
      paintAsk();
      clearTimeout(timer);
      timer = setTimeout(function () { if (phase === 'ask') reveal(); }, opts.secs * 1000 + 300);
    }

    function paintAsk() {
      var ring = stage.querySelector('.live-ring-run'), count = stage.querySelector('.live-in');
      if (stage.getAttribute('data-q') === String(qi) && ring && count) {
        count.textContent = Object.keys(answers).length + ' of ' + here().length + ' in';
        return;
      }
      stage.setAttribute('data-q', String(qi));
      stage.textContent = '';
      var secs = h('span', { class: 'live-secs', text: String(opts.secs) });
      var ringEl = h('div', { class: 'live-ring' , html: '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="10"/>' +
        '<circle class="live-ring-run" cx="60" cy="60" r="52" fill="none" stroke="#FFD23F" stroke-width="10" stroke-linecap="round" style="animation-duration:' + opts.secs + 's"/></svg>' }, secs);
      var answersGrid = h('div', { class: 'live-answers' }, asked.a.map(function (text, i) {
        return h('div', { class: 'live-ans', style: '--ac:' + LiveLook.color(i) }, h('span', { class: 'live-ans-ico', html: LiveLook.shape(i) }), h('b', { text: text }));
      }));
      put(stage, topBar(h('span', { class: 'live-count', text: 'Question ' + (qi + 1) + ' of ' + set.questions.length })),
        h('div', { class: 'live-q-wrap' }, ringEl, h('h2', { class: 'live-q', text: asked.q }), h('p', { class: 'live-in', text: '0 of ' + here().length + ' in' })),
        answersGrid,
        h('div', { class: 'live-go' }, TT.button('Skip to the Answer', { kind: 'small', onclick: function () { if (phase === 'ask') reveal(); } })));
      clearInterval(tick);
      tick = setInterval(function () {
        var left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
        if (secs.textContent !== String(left)) {
          secs.textContent = String(left);
          if (left > 0 && left <= 5 && TT.fx && TT.fx.sound) TT.fx.sound('tap');
        }
        if (left <= 0) clearInterval(tick);
      }, 250);
      if (TT.fx && TT.fx.sound) TT.fx.sound('whoosh');
    }

    function reveal() {
      phase = 'reveal'; clearTimeout(timer); clearInterval(tick);
      var you = {};
      here().forEach(function (p) {
        var a = answers[p.sid];
        p.answered += a ? 1 : 0;
        var gained = 0;
        if (a && a.right) {
          p.streak++; p.bestStreak = Math.max(p.bestStreak, p.streak); p.right++;
          if (!p.fastest || a.ms < p.fastest) p.fastest = a.ms;
          if (asked.tag) p.tags[asked.tag] = (p.tags[asked.tag] || 0) + 1;
          gained = Live.points(true, a.ms, opts.secs * 1000, p.streak);
          p.score += gained;
        } else p.streak = 0;
        you[p.sid] = { right: !!(a && a.right), pick: a ? a.pick : -1, gained: gained, score: p.score, streak: p.streak,
          team: p.team != null && mode.teams ? mode.teams[p.team].name : '' };
      });
      var board = Live.places(here());
      board.forEach(function (p) { if (you[p.sid]) you[p.sid].place = p.place; });
      var counts = [0, 0, 0, 0];
      Object.keys(answers).forEach(function (k) { var pk = answers[k].pick; if (pk >= 0 && pk < 4) counts[pk]++; });
      send('reveal', { i: qi, c: asked.c, you: you, top: board.slice(0, 5).map(small), last: qi + 1 >= set.questions.length });
      paintReveal(counts, board);
      if (TT.fx && TT.fx.sound) TT.fx.sound('good');
    }
    function small(p) { return { name: p.name, buddy: p.buddy, score: p.score, place: p.place, sid: p.sid }; }

    function paintReveal(counts, board) {
      counts = counts || [0, 0, 0, 0];
      board = board || Live.places(here());
      stage.removeAttribute('data-q');
      stage.textContent = '';
      var most = Math.max(1, Math.max.apply(null, counts));
      put(stage, topBar(h('span', { class: 'live-count', text: 'Question ' + (qi + 1) + ' of ' + set.questions.length })),
        h('h2', { class: 'live-q small', text: asked.q }),
        h('div', { class: 'live-answers revealed' }, asked.a.map(function (text, i) {
          return h('div', { class: 'live-ans' + (i === asked.c ? ' right' : ' wrong'), style: '--ac:' + LiveLook.color(i) },
            h('span', { class: 'live-ans-ico', html: LiveLook.shape(i) }), h('b', { text: text }),
            h('span', { class: 'live-bar', style: '--w:' + Math.round(counts[i] / most * 100) + '%' }, h('i'), h('em', { text: String(counts[i]) })));
        })),
        mode.board ? mode.board(h, board, info()) : null,
        h('div', { class: 'live-go' }, TT.button(qi + 1 >= set.questions.length ? 'See the Winners' : 'Next Question', { kind: 'primary big', icon: 'arrow', onclick: next })));
    }

    // ---------- The end ----------
    function finish() {
      phase = 'done'; clearTimeout(timer); clearInterval(tick);
      var board = Live.places(list().filter(function (p) { return p.answered > 0 || p.here; }));
      var nfo = info(), ending = mode.finish ? mode.finish(board, nfo) || {} : {};
      // A team game or a team-up game: everyone on the winning side gets the badge.
      if (ending.winTeam != null) board.forEach(function (p) { p.teamWin = p.team === ending.winTeam; });
      if (ending.coopWin) board.forEach(function (p) { p.coopWin = true; });
      var you = {}, results = [];
      board.forEach(function (p) {
        var earned = window.LabBadges ? LabBadges.forGame(p.start || {}, {
          right: p.right, answered: p.answered, bestStreak: p.bestStreak, fastest: p.fastest, place: p.place, players: board.length,
          math: p.tags.math || 0, words: p.tags.words || 0, science: p.tags.science || 0,
          teamWin: !!p.teamWin, coopWin: !!p.coopWin
        }, p.badges || {}) : [];
        you[p.sid] = { score: p.score, place: p.place, right: p.right, answered: p.answered, badges: earned, players: board.length,
          teamWin: !!p.teamWin, coopWin: !!p.coopWin, team: p.team != null && mode.teams ? mode.teams[p.team].name : '' };
        results.push({ id: p.sid, stats: { games: 1, right: p.right, answered: p.answered, math: p.tags.math || 0, words: p.tags.words || 0, science: p.tags.science || 0 },
          best: { streak: p.bestStreak, score: p.score }, badges: earned });
      });
      send('end', { you: you, podium: board.slice(0, 3).map(small), headline: ending.title || '' });
      paintDone(board, ending, nfo);
      cheer('party');
      if (results.length) {
        TT.labs.q(TT.labs.sb().rpc('lab_save_results', { p_class: klass.id, p_results: results })).then(function () {
          var tag = stage.querySelector('.live-saved'); if (tag) tag.textContent = 'Saved to your class.';
        }, function () { var tag = stage.querySelector('.live-saved'); if (tag) tag.textContent = 'Could not save the results. Scores on this screen are still right.'; });
      }
      if (TT.celebrate) try { TT.celebrate(stage); } catch (e) {}
    }

    function paintDone(board, ending, nfo) {
      board = board || Live.places(list());
      ending = ending || {}; nfo = nfo || info();
      stage.textContent = '';
      var top = board.slice(0, 3), rest = board.slice(3);
      var order = [1, 0, 2];   // second, first, third, so the winner stands in the middle
      put(stage, h('div', { class: 'live-top' }, h('div', null, h('span', { class: 'live-kicker', text: klass.name + ' · ' + set.title }), h('span', { class: 'live-mode-name', text: 'Game Over' })),
        h('div', { class: 'row' }, TT.button('Play Again', { icon: 'reset', kind: 'small', onclick: function () { quit(); } }))),
        h('h2', { class: 'live-win-title', text: !top.length ? 'Nobody Played This Round' : ending.title || 'Great Game, ' + klass.name + '!' }),
        mode.endBoard ? mode.endBoard(h, board, nfo, ending) : null,
        h('div', { class: 'live-podium' }, order.map(function (i) {
          var p = top[i]; if (!p) return null;
          return h('div', { class: 'live-pod p' + (i + 1) },
            window.Buddy ? Buddy.el(p.buddy, 'live-pod-buddy') : null,
            h('b', { text: p.name }), h('span', { class: 'live-pod-score', text: p.score.toLocaleString() }),
            h('div', { class: 'live-pod-step' }, h('span', { text: '#' + p.place })));
        })),
        rest.length ? h('div', { class: 'live-rest' }, rest.map(function (p) {
          return h('div', { class: 'live-row' }, h('span', { class: 'live-row-place', text: '#' + p.place }),
            window.Buddy ? Buddy.el(p.buddy, 'live-row-buddy') : null, h('b', { text: p.name }),
            h('span', { class: 'live-row-score', text: p.score.toLocaleString() }),
            h('span', { class: 'muted', text: p.right + ' of ' + p.answered + ' right' }));
        })) : null,
        TT.mascot ? h('div', { class: 'live-mascot end', 'aria-hidden': 'true' }, hostMascot()) : null,
        h('p', { class: 'live-saved muted', text: 'Saving results…' }),
        h('div', { class: 'live-go' }, TT.button('Back to Setup', { kind: 'primary', icon: 'back', onclick: function () { quit(); } })));
    }

    function quit(silent) {
      if (quitting) return; quitting = true;
      clearTimeout(timer); clearInterval(tick);
      if (!silent) send('over', {});
      if (conn) conn.close();
      document.body.classList.remove('live-hosting');
      if (!silent && opts.onQuit) opts.onQuit();
    }
    // Leaving the page ends the game, the same way Class Bingo does.
    window.addEventListener('tt:page', function () { if (!quitting && TT.page() !== 'labs') { send('over', {}); quit(true); } });
    window.addEventListener('pagehide', function () { if (!quitting) { send('over', {}); quit(true); } });

    // Each player's totals before this game, so badges like "100 Right" can be worked out.
    TT.labs.students(klass.id).then(function (rows) {
      (rows || []).forEach(function (s) {
        var p = players[s.id];
        if (p) { p.start = s.stats || {}; p.badges = s.badges || {}; }
        else players[s.id] = { sid: s.id, name: s.first_name, buddy: s.buddy, score: 0, right: 0, answered: 0, streak: 0, bestStreak: 0, fastest: 0, tags: {}, here: false, start: s.stats || {}, badges: s.badges || {} };
      });
    }, function () {});

    paint();
    return { quit: quit };
  }
})();
