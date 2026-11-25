// Sidekick Live: the self-paced race (the modes marked solo in tools/live-modes.js).
// Every student answers on their own device at their own speed. A right answer earns them a turn at
// the game bit (a basket to open, a choice to make, a fuel bar to stop), then their next question comes.
// Everyone is racing the rest of the class for points, and the big screen keeps the live leaderboard.
// This screen is still the referee: it holds the questions and the answer key, rolls every surprise,
// keeps every score, and saves the results at the end.
(function () {
  var TT = window.TT, h = TT.h;
  var S = window.LiveSolo = {};

  S.run = function (box, opts) {
    var klass = opts.klass, set = opts.set, mode = opts.mode, minutes = opts.minutes || 5;
    var players = {}, phase = 'lobby', conn = null, endsAt = 0, clock = null, quitting = false, mascotEl = null;
    var stage = h('div', { class: 'live-stage solo mode-' + mode.id });
    box.textContent = '';
    box.append(stage);
    document.body.classList.add('live-hosting');

    function put(el) { var kids = [].slice.call(arguments, 1).filter(function (x) { return x != null && x !== false; }); el.append.apply(el, kids); }
    function list() { return Object.keys(players).map(function (k) { return players[k]; }); }
    function here() { return list().filter(function (p) { return p.here; }); }
    function send(ev, data) { if (conn) conn.send(ev, data || {}); }
    function stateMsg() { return { phase: phase, mode: mode.id, solo: true, title: set.title, klass: klass.name, ends: endsAt, minutes: minutes }; }
    function hostMascot() {
      if (!mascotEl) { mascotEl = TT.mascot({ mood: 'wave' }); setTimeout(function () { if (mascotEl) mascotEl.mood('idle'); }, 2400); }
      return mascotEl;
    }

    // Each player gets their own shuffled run through the set, so nobody can copy a neighbor.
    function order() { return LiveBanks.shuffle(set.questions.map(function (q, i) { return i; })); }
    function newPlayer(p) {
      return { sid: p.sid, name: String(p.name || 'Player').slice(0, 20), buddy: p.buddy || {}, here: true,
        score: 0, right: 0, answered: 0, streak: 0, bestStreak: 0, fastest: 0, turns: 0, shield: false, tags: {}, at: 0, order: order(), sentAt: 0 };
    }
    function askNext(p) {
      if (phase !== 'play') return;
      if (p.at >= p.order.length) { p.order = order(); p.at = 0; }   // the set comes around again, mixed up
      var item = set.questions[p.order[p.at]];
      p.q = item; p.qi = p.at; p.sentAt = Date.now();
      send('sq', { sid: p.sid, i: p.at, q: item.q, a: item.a });
    }
    function boardFor(p) { var board = Live.places(here()); return { place: (board.filter(function (x) { return x.sid === p.sid; })[0] || {}).place || 1, players: board.length }; }

    conn = Live.connect({
      code: klass.code, me: 'host', meta: { host: true },
      on: {
        join: function (p) {
          if (!p || !p.sid) return;
          var old = players[p.sid];
          if (old) { old.here = true; old.name = String(p.name || old.name).slice(0, 20); old.buddy = p.buddy || old.buddy; }
          else players[p.sid] = newPlayer(p);
          send('state', stateMsg());
          if (phase === 'play') askNext(players[p.sid]);
          paint();
        },
        bye: function (p) { if (p && players[p.sid]) { players[p.sid].here = false; paint(); } },
        hi: function () { send('state', stateMsg()); },
        // An answer. The key never leaves this screen.
        ans: function (msg) {
          var p = players[msg && msg.sid];
          if (phase !== 'play' || !p || !p.q || msg.i !== p.qi) return;
          var right = msg.pick === p.q.c, ms = Date.now() - p.sentAt;
          p.answered++;
          if (right) {
            p.right++; p.streak++; p.bestStreak = Math.max(p.bestStreak, p.streak);
            if (!p.fastest || ms < p.fastest) p.fastest = ms;
            if (p.q.tag) p.tags[p.q.tag] = (p.tags[p.q.tag] || 0) + 1;
          } else p.streak = 0;
          var b = boardFor(p);
          send('judge', { sid: p.sid, i: msg.i, right: right, c: p.q.c, score: p.score, place: b.place, players: b.players, streak: p.streak });
          p.q = right ? p.q : null;
          p.at++;
          if (!right) setTimeout(function () { askNext(p); }, 1600);   // wrong: see the right answer, then carry on
          paint();
        },
        // They played their turn at the game bit. This screen rolls the outcome.
        turn: function (msg) {
          var p = players[msg && msg.sid];
          if (phase !== 'play' || !p || !p.q) return;
          p.q = null; p.turns++;
          var out = mode.resolve(p, msg.choice, { players: here() }) || { gained: 10, say: '+10' };
          if (out.usedShield) p.shield = false;
          if (out.shield) p.shield = true;
          p.score = Math.max(0, p.score + (out.gained || 0));
          if (out.takeFrom && players[out.takeFrom]) {
            var other = players[out.takeFrom];
            other.score = Math.max(0, other.score - (out.take || 0));
            var ob = boardFor(other);
            send('nudge', { sid: other.sid, say: p.name + ' took ' + (out.take || 0) + ' from your pile!', score: other.score, place: ob.place });
          }
          if (out.giftLowest) {
            var low = here().filter(function (x) { return x.sid !== p.sid; }).sort(function (a, b) { return a.score - b.score; })[0];
            if (low) {
              low.score += out.giftLowest;
              var lb = boardFor(low);
              send('nudge', { sid: low.sid, say: p.name + ' shared a gift basket with you! +' + out.giftLowest, score: low.score, place: lb.place });
            }
          }
          var b = boardFor(p);
          send('prize', { sid: p.sid, kind: out.kind, say: out.say, gained: out.gained, score: p.score, place: b.place, players: b.players, shield: !!p.shield });
          setTimeout(function () { askNext(p); }, 1500);
          paint();
        }
      },
      onStatus: function (s) { stage.setAttribute('data-net', s); },
      onLive: function () { send('state', stateMsg()); }
    });

    // ---------- Screens ----------
    var painting = null;
    function paint() {
      if (painting) return;                        // many messages arrive at once; draw once a frame
      painting = requestAnimationFrame(function () {
        painting = null;
        if (phase === 'lobby') paintLobby(); else if (phase === 'play') paintPlay(); else paintDone();
      });
    }
    function topBar(right) {
      return h('div', { class: 'live-top' },
        h('div', null, h('span', { class: 'live-kicker', text: klass.name + ' · ' + set.title }), h('span', { class: 'live-mode-name', text: mode.name })),
        h('div', { class: 'row' }, right || null, TT.button('End Game', { kind: 'small danger', onclick: function () { finish(); } })));
    }
    function paintLobby() {
      var people = here();
      var qr = h('div', { class: 'live-qr', 'aria-hidden': 'true' });
      TT.labs.loadQR().then(function () {
        try { var g = window.qrcode(0, 'M'); g.addData(location.origin + '/play?c=' + encodeURIComponent(klass.code)); g.make(); qr.innerHTML = g.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) {}
      }, function () {});
      stage.textContent = '';
      put(stage, topBar(),
        h('div', { class: 'live-lobby' },
          h('div', { class: 'live-join' },
            h('p', { class: 'live-step', text: '1. Go to' }), h('p', { class: 'live-url', text: location.host + '/play' }),
            h('p', { class: 'live-step', text: '2. Class code' }), h('p', { class: 'live-code', text: klass.code }), qr),
          h('div', { class: 'live-waiting' },
            TT.mascot ? h('div', { class: 'live-mascot', 'aria-hidden': 'true' }, hostMascot()) : null,
            h('h2', { text: people.length ? people.length + (people.length === 1 ? ' Player Is In!' : ' Players Are In!') : 'Waiting for Players…' }),
            h('div', { class: 'live-players' }, people.map(function (p) {
              return h('div', { class: 'live-chip' }, window.Buddy ? Buddy.el(p.buddy, 'live-chip-buddy') : null, h('b', { text: p.name }));
            })),
            h('p', { class: 'muted', text: 'Everyone answers at their own speed for ' + minutes + ' minutes. Highest score wins.' }))),
        h('div', { class: 'live-go' }, TT.button('Start the Race', { kind: 'primary big', icon: 'play', onclick: start }),
          people.length ? null : h('span', { class: 'muted', text: 'You can start once someone has joined.' })));
      var go = stage.querySelector('.btn.primary');
      if (go) go.disabled = !people.length;
    }

    function start() {
      phase = 'play';
      endsAt = Date.now() + minutes * 60000;
      send('state', stateMsg());
      send('go', {});
      clearInterval(clock);
      clock = setInterval(function () {
        if (phase !== 'play') return;
        if (Date.now() >= endsAt) { finish(); return; }
        var t = stage.querySelector('.live-clock');
        if (t) t.textContent = clockText();
      }, 500);
      if (window.Lobby && Lobby.countdown) Lobby.countdown({ title: 'Get Ready!', done: function () { here().forEach(askNext); paint(); } });
      else { here().forEach(askNext); paint(); }
    }
    function clockText() {
      var left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      return Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2);
    }

    function paintPlay() {
      var board = Live.places(here());
      stage.textContent = '';
      put(stage, topBar(h('span', { class: 'live-count live-clock', text: clockText() })),
        mode.board ? mode.board(h, board, { klass: klass.name, total: set.questions.length }) : null,
        h('div', { class: 'live-solo-foot' },
          h('p', { class: 'muted', text: board.reduce(function (n, p) { return n + p.answered; }, 0) + ' questions answered so far' }),
          TT.button('Add a Minute', { kind: 'small', icon: 'plus', onclick: function () { endsAt += 60000; send('state', stateMsg()); } })));
    }

    // ---------- The end ----------
    function finish() {
      phase = 'done'; clearInterval(clock);
      var board = Live.places(list().filter(function (p) { return p.answered > 0 || p.here; }));
      var you = {}, results = [];
      board.forEach(function (p) {
        var earned = window.LabBadges ? LabBadges.forGame(p.start || {}, {
          right: p.right, answered: p.answered, bestStreak: p.bestStreak, fastest: p.fastest, place: p.place, players: board.length,
          math: p.tags.math || 0, words: p.tags.words || 0, science: p.tags.science || 0
        }, p.badges || {}) : [];
        you[p.sid] = { score: p.score, place: p.place, right: p.right, answered: p.answered, badges: earned, players: board.length };
        results.push({ id: p.sid, stats: { games: 1, right: p.right, answered: p.answered, math: p.tags.math || 0, words: p.tags.words || 0, science: p.tags.science || 0 },
          best: { streak: p.bestStreak, score: Math.min(1000, p.score) }, badges: earned });
      });
      send('end', { you: you, podium: board.slice(0, 3).map(function (p) { return { name: p.name, buddy: p.buddy, score: p.score, place: p.place, sid: p.sid }; }) });
      paintDone(board);
      if (mascotEl) mascotEl.mood('party', 2400);
      if (results.length) {
        TT.labs.q(TT.labs.sb().rpc('lab_save_results', { p_class: klass.id, p_results: results })).then(function () {
          var tag = stage.querySelector('.live-saved'); if (tag) tag.textContent = 'Saved to your class.';
        }, function () { var tag = stage.querySelector('.live-saved'); if (tag) tag.textContent = 'Could not save the results. Scores on this screen are still right.'; });
      }
      if (TT.celebrate) try { TT.celebrate(stage); } catch (e) {}
    }

    function paintDone(board) {
      board = board || Live.places(list());
      var top = board.slice(0, 3), rest = board.slice(3), order3 = [1, 0, 2];
      stage.textContent = '';
      put(stage, h('div', { class: 'live-top' },
          h('div', null, h('span', { class: 'live-kicker', text: klass.name + ' · ' + set.title }), h('span', { class: 'live-mode-name', text: 'Race Over' })),
          h('div', { class: 'row' }, TT.button('Play Again', { icon: 'reset', kind: 'small', onclick: function () { quit(); } }))),
        h('h2', { class: 'live-win-title', text: top.length ? (top[0].name + ' Takes First Place!') : 'Nobody Played This Round' }),
        h('div', { class: 'live-podium' }, order3.map(function (i) {
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
      clearInterval(clock);
      if (!silent) send('over', {});
      if (conn) conn.close();
      document.body.classList.remove('live-hosting');
      if (!silent && opts.onQuit) opts.onQuit();
    }
    window.addEventListener('tt:page', function () { if (!quitting && TT.page() !== 'labs') { send('over', {}); quit(true); } });
    window.addEventListener('pagehide', function () { if (!quitting) { send('over', {}); quit(true); } });

    // Each player's totals before the race, so badges can be worked out at the end.
    TT.labs.students(klass.id).then(function (rows) {
      (rows || []).forEach(function (s) {
        var p = players[s.id];
        if (p) { p.start = s.stats || {}; p.badges = s.badges || {}; }
      });
    }, function () {});

    paint();
    return { quit: quit };
  };
})();
