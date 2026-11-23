// Class Bingo live play: the teacher's screen and students' devices talk through a Supabase Realtime
// channel named after the class code. Messages go straight from screen to screen and are never written
// to a database, so nothing about the students is stored anywhere. When the teacher ends the game,
// the channel is simply gone.
(function () {
  var B = window.Bingo = window.Bingo || {};
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
    // The teacher's page already has a signed-in client; reuse it so there is only one connection.
    var shared = window.TT && TT.account && TT.account.client && TT.account.client();
    if (shared) { client = shared; return Promise.resolve(client); }
    return loadLib().then(function () {
      client = client || window.supabase.createClient(C.supabaseUrl, C.supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'tt-bingo-live' }
      });
      return client;
    });
  }

  // opts: code, me (this screen's id), meta (shown to others, e.g. { name }), on: { event: fn(payload) },
  // onPeople(list of metas), onStatus('live' | 'trying' | 'off')
  B.connect = function (opts) {
    var ch = null, closed = false, queue = [], live = false, retry = null;
    var api = {
      send: function (event, payload) {
        if (!ch || !live) { queue.push([event, payload]); return; }
        ch.send({ type: 'broadcast', event: event, payload: payload || {} });
      },
      track: function (meta) { opts.meta = meta; if (ch && live) ch.track(meta); },
      close: function () {
        closed = true; clearTimeout(retry);
        if (ch) { try { ch.untrack(); } catch (e) {} if (client) client.removeChannel(ch); }
        ch = null;
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
        var mine = ch = sb.channel('bingo-' + opts.code, { config: { broadcast: { self: false, ack: false }, presence: { key: opts.me } } });
        Object.keys(opts.on || {}).forEach(function (ev) {
          ch.on('broadcast', { event: ev }, function (msg) { try { opts.on[ev](msg.payload || {}); } catch (e) { console.error(e); } });
        });
        ch.on('presence', { event: 'sync' }, people);
        ch.subscribe(function (s) {
          if (closed || ch !== mine) return;   // a message from an old connection
          if (s === 'SUBSCRIBED') {
            live = true; status('live');
            ch.track(opts.meta || {});
            var q = queue; queue = [];
            q.forEach(function (m) { api.send(m[0], m[1]); });
            if (opts.onLive) opts.onLive();
          } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
            live = false; status('trying');
            // Try again in a moment (a school network blip, a sleeping laptop).
            clearTimeout(retry);
            retry = setTimeout(function () { if (closed || ch !== mine) return; ch = null; live = false; try { client.removeChannel(mine); } catch (e) {} open(); }, 3000);
          }
        });
      }, function () { status('off'); retry = setTimeout(open, 5000); });
    }
    open();
    return api;
  };
  B.liveReady = function () { var C = window.TT_ACCOUNT_CONFIG || {}; return !!(C.supabaseUrl && C.supabaseKey); };
})();
