// Kid-safe names for everything students join with a class code (window.NameFilter).
// Students type a first name or nickname. Before it shows anywhere, it has to pass this filter:
// on the student's own screen when they join, and again on every screen that shows it (the teacher's
// and classmates'), so a changed copy of the page can't sneak a name through.
// It catches bad words even when they're spaced out (f u c k), padded (fuuuck), written in l33t (sh1t, @ss),
// with look-alike letters from other alphabets, or hidden inside other words. When in doubt, it says no.
// The word lists are stored ROT13-scrambled so they don't read as plain text in the code.
(function () {
  var NF = window.NameFilter = {};
  function rot(s) { return s.replace(/[a-z]/g, function (c) { return String.fromCharCode((c.charCodeAt(0) - 97 + 13) % 26 + 97); }); }
  var PART = rot('shpx shx sipx cuhpx sphx fuvg fulg ovgpu ovngpu onfgneq nffubyr nefrubyr qvpxurnq qvxurnq phag pbpxfhpx juber fyhg cravf intvan cbea ahqr anxrq obbo gvggl gvggvrf frkl frkk qvyqb ubeal encvfg encvat zbyrfg crqb vaprfg betnfz znfgheong wrexbss wnpxbss oybjwbo unaqwbo ohggubyr ohggsnpr nffsnpr nffung wnpxnff qhzonff fznegnff avttre avttn avtt avdd avoon snttbg sntbg ergneq genaal xvxr jrgonpx ornare anmv uvgyre xxx fhvpvqr xvyylbh xvyyzr xvyyhefrys xzf zheqre greebevfg pbpnvar urebva jrrq420 fgbare qehax nypbuby cvffrq cvffbss cvff ohyyfuvg qnzavg tbqqnza zbgures jgs fgsh yzsnb fghcvq vqvbg ybfre htyl snggl sngfb zbeba qhzzl ungrlbh vungr fhpxzl fhpxf cbbcl cbbcurnq crrcrr jvrare jrvare jvrare obbgl fxnax ubbxre fgevccre gubat ovxvav fcrez frzra rerpgvba obare ivnten pbaqbz srgvfu xvaxl obaqntr fcnax onyyfnpx ahgfnpx fpebghz grfgvp pyvg ihyin ynovn nahf qlxr dhrre ubzb yrfob wvmm phzfubg chffl gjng jnax obyybpx ohttre fynt gbffre qbhpur anmv fjnfgvxn tnatfgn tnatonat penpxurnq zrguurnq whaxvr bireqbfr fubbg thafubg obzore orurnq fynhtugre oybbql').split(' ');   // blocked anywhere in the name
  var WORD = rot('nff nefr ohgg ohggf qvpx qvx pbpx frk snt tnl ubr ubrf gubg cevpx phz gvg gvgf nany uryy qnza penc cbbc crr crrf sneg snegf fhpx fhk qvr qvrf qrnq xvyy xvyyf xvyyre tha thaf ungr ungre qhzo sng sngnff sernx genfu avt avtn fcvp puvax tbbx wnc pbba cnxv vfvf zrgu jrrq incr incvat penpx orre jvar ibqxn fgbarq qeht qehtf encr encrf xlf fvzc guvpp zvys qvys grnpure nqzva cevapvcny ze zef zf fve znqnz fgnss zbqrengbe bjare').split(' ');   // blocked as a whole word
  var MAX = 16;

  // Look-alike letters from other alphabets, and l33t.
  var LOOK = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's', 'к': 'k', 'м': 'm', 'н': 'h', 'т': 't', 'в': 'b', 'ԁ': 'd', 'ɡ': 'g', 'ⅼ': 'l',
    'α': 'a', 'β': 'b', 'ε': 'e', 'η': 'n', 'ι': 'i', 'κ': 'k', 'ν': 'v', 'ο': 'o', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x', 'ω': 'w', 'ß': 'ss', 'æ': 'ae', 'ø': 'o', 'đ': 'd', 'ł': 'l', 'ı': 'i' };
  var LEET = { '0': 'o', '2': 'z', '3': 'e', '4': 'a', '5': 's', '6': 'g', '7': 't', '8': 'b', '9': 'g', '@': 'a', '$': 's', '!': 'i', '+': 't', '€': 'e', '£': 'l', '¥': 'y', '(': 'c', '<': 'c', '{': 'c', '[': 'c' };

  function base(s) {
    s = String(s || '').normalize('NFKC').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
    return s.replace(/[^\x00-\x7f]/g, function (c) { return LOOK[c] != null ? LOOK[c] : c; });
  }
  // The ways a name could be read: "1" and "|" could be an i or an l, "v" could stand in for "u".
  function readings(s) {
    var b = base(s).replace(/[0-9@$!+€£¥(<{\[]/g, function (c) { return LEET[c] != null ? LEET[c] : c; });
    var out = [b.replace(/[1|]/g, 'i'), b.replace(/[1|]/g, 'l')];
    out.push(out[0].replace(/vv/g, 'w').replace(/ph/g, 'f').replace(/ck/g, 'k'));
    // A star or other mark standing in for a letter ("f*ck", "sh_t"): try each vowel there.
    if (/[a-z][*#%_?~^.-]+[a-z]/.test(out[0])) 'aeiouy'.split('').forEach(function (v) { out.push(out[0].replace(/([a-z])[*#%_?~^.-]+(?=[a-z])/g, '$1' + v)); });
    return out;
  }
  function squash(s) { return s.replace(/[^a-z]/g, ''); }
  function single(s) { return s.replace(/([a-z])\1+/g, '$1'); }
  // Padded forms ("fuuuck" -> "fuck"). Only for longer words, so "kkk" doesn't turn into every "k".
  var PART1 = PART.map(function (w) { var o = single(w); return o.length >= 4 ? o : null; }), WORD1 = WORD.map(single);
  function bad(text) {
    return readings(text).some(function (r) {
      var all = squash(r), all1 = single(all);
      for (var i = 0; i < PART.length; i++) if (all.indexOf(PART[i]) >= 0 || (PART1[i] && all1.indexOf(PART1[i]) >= 0)) return true;
      // Whole words: split on anything that isn't a letter, and also try single letters run together ("a s s").
      var words = r.split(/[^a-z]+/).filter(Boolean), joined = [], run = '';
      words.forEach(function (w) { if (w.length === 1) run += w; else { if (run.length > 1) joined.push(run); run = ''; } });
      if (run.length > 1) joined.push(run);
      return words.concat(joined).some(function (w) {
        var forms = [w, single(w), w.replace(/(e?s|z)$/, ''), single(w).replace(/(e?s|z)$/, '')];
        return forms.some(function (f) { return f && (WORD.indexOf(f) >= 0 || WORD1.indexOf(f) >= 0); });
      });
    });
  }

  // Tidy what was typed: no emoji or symbols, no links, at most 16 letters, three words.
  NF.tidy = function (raw) {
    var s = String(raw || '').normalize('NFKC');
    s = s.replace(/[^\p{L}\p{M}0-9 '\-.]/gu, ' ').replace(/\s+/g, ' ').trim();
    s = s.split(' ').slice(0, 3).join(' ').slice(0, MAX).trim();
    return s;
  };
  // { ok: true, name } or { ok: false, why: 'empty' | 'link' | 'numbers' | 'word' }
  NF.check = function (raw) {
    var r = String(raw || '');
    if (/https?:|www\.|\.(com|net|org|io|gg|tv|ly|me|co|xyz)\b|@\w+\.|discord|tiktok|insta|snap|youtube|robux/i.test(r)) return { ok: false, why: 'link' };
    var name = NF.tidy(r);
    if (!/\p{L}/u.test(name)) return { ok: false, why: 'empty' };
    if (/\d{3,}|69|420|666|1488|88\b/.test(name.replace(/\s/g, ''))) return { ok: false, why: 'numbers' };
    if (bad(name) || bad(r)) return { ok: false, why: 'word' };
    return { ok: true, name: name };
  };
  // A typed sentence (an exit ticket answer): no links and no bad words, checked word by word.
  NF.textOk = function (raw) {
    var r = String(raw || '');
    if (/https?:|www\.|\.(com|net|org|io|gg|tv|ly|me|co|xyz)\b|discord|tiktok|insta|snap|youtube|robux/i.test(r)) return false;
    // Each word on its own (running a whole sentence together would trip on "push it"), plus letters typed
    // one at a time ("s h i t").
    var words = r.split(/\s+/).filter(Boolean), run = '', runs = [];
    words.forEach(function (w) { if (/^\p{L}$/u.test(w)) run += w; else { if (run.length > 2) runs.push(run); run = ''; } });
    if (run.length > 2) runs.push(run);
    return !words.concat(runs).some(bad);
  };
  NF.ok = function (raw) { return NF.check(raw).ok; };
  // For showing someone else's name: theirs if it passes, otherwise a safe stand-in.
  NF.safe = function (raw, fallback) { var c = NF.check(raw); return c.ok ? c.name : (fallback || 'Player'); };
})();
