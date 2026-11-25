// Sidekick Live: the wire between the teacher's screen and the students' devices.
// Same idea as Class Bingo (assets/bingo-live.js): one Supabase Realtime channel named after the class
// code. Messages go straight from screen to screen and are never written to a database. The teacher's
// screen is the referee: it holds the questions and the answer key, decides what is right, and keeps the
// scores. Students' devices only send taps, so the answers can't be read ahead on a student's device.
(function () {
  var L = window.Live = window.Live || {};
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
  var client = null, loading = null;

  function loadLib() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = LIB; s.async = true; s.onload = ok; s.onerror = function () { loading = null; fail(new Error('offline')); };
      document.head.append(s);
    });
    return loading;
  }
  function getClient() {
    var C = window.TT_ACCOUNT_CONFIG || {};
    if (!C.supabaseUrl || !C.supabaseKey) return Promise.reject(new Error('off'));
    if (client) return Promise.resolve(client);
    // Reuse the page's client (the teacher's signed-in one, or the student page's) so there is one connection.
    var shared = (window.TT && TT.account && TT.account.client && TT.account.client()) || (window.Play && Play.clientNow && Play.clientNow());
    if (shared) { client = shared; return Promise.resolve(client); }
    return loadLib().then(function () {
      client = client || window.supabase.createClient(C.supabaseUrl, C.supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'tt-live' }
      });
      return client;
    });
  }
  L.ready = function () { var C = window.TT_ACCOUNT_CONFIG || {}; return !!(C.supabaseUrl && C.supabaseKey); };

  // opts: code, me (this screen's id), meta (what others see about this screen), on: { event: fn(payload) },
  //       onPeople(list), onStatus('live' | 'trying' | 'off'), onLive()
  L.connect = function (opts) {
    var ch = null, closed = false, queue = [], live = false, retry = null;
    var api = {
      send: function (event, payload) {
        if (!ch || !live) { if (queue.length < 40) queue.push([event, payload]); return; }
        ch.send({ type: 'broadcast', event: event, payload: payload || {} });
      },
      track: function (meta) { opts.meta = meta; if (ch && live) ch.track(meta); },
      live: function () { return live; },
      close: function () {
        closed = true; clearTimeout(retry);
        if (ch) { try { ch.untrack(); } catch (e) {} if (client) client.removeChannel(ch); }
        ch = null; live = false;
      }
    };
    function status(s) { if (opts.onStatus) opts.onStatus(s); }
    function people() {
      if (!ch || !opts.onPeople) return;
      var st = ch.presenceState(), out = [];
      Object.keys(st).forEach(function (k) { var m = st[k][0] || {}; out.push(Object.assign({ id: k }, m)); });
      opts.onPeople(out);
    }
    function open() {
      if (closed) return;
      status('trying');
      getClient().then(function (sb) {
        if (closed) return;
        var mine = ch = sb.channel('live-' + opts.code, { config: { broadcast: { self: false, ack: false }, presence: { key: opts.me } } });
        Object.keys(opts.on || {}).forEach(function (ev) {
          ch.on('broadcast', { event: ev }, function (msg) { try { opts.on[ev](msg.payload || {}); } catch (e) { console.error(e); } });
        });
        ch.on('presence', { event: 'sync' }, people);
        ch.subscribe(function (s) {
          if (closed || ch !== mine) return;
          if (s === 'SUBSCRIBED') {
            live = true; status('live');
            ch.track(opts.meta || {});
            var q = queue; queue = [];
            q.forEach(function (m) { api.send(m[0], m[1]); });
            if (opts.onLive) opts.onLive();
          } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
            live = false; status('trying');
            clearTimeout(retry);
            retry = setTimeout(function () { if (closed || ch !== mine) return; ch = null; try { client.removeChannel(mine); } catch (e) {} open(); }, 3000);
          }
        });
      }, function () { status('off'); retry = setTimeout(open, 5000); });
    }
    open();
    return api;
  };

  // ---------- Scoring, shared by every mode ----------
  // Right answers are worth 100, plus up to 100 more for being quick, plus 10 for each answer in a row
  // (up to 50). Wrong answers are never worth less than nothing: a student can only go up.
  L.points = function (right, ms, limitMs, streak) {
    if (!right) return 0;
    var quick = Math.max(0, 1 - (ms || 0) / Math.max(1000, limitMs || 20000));
    return Math.round(100 + 100 * quick + Math.min(50, Math.max(0, streak - 1) * 10));
  };
  // Places, with ties sharing a place (1, 2, 2, 4).
  L.places = function (players) {
    var sorted = players.slice().sort(function (a, b) { return b.score - a.score; });
    var place = 0, last = null, n = 0;
    sorted.forEach(function (p) { n++; if (p.score !== last) { place = n; last = p.score; } p.place = place; });
    return sorted;
  };
})();
