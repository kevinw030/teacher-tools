// Home page welcome banner: the mascot greets the teacher beside a classroom window. The view out of
// the window follows the teacher's own time of day (sunrise, daytime, sunset, night) and the thing on
// the windowsill follows the season. The time zone comes from Settings (default: this computer).
(function () {
  var TT = window.TT;

  // The teacher's local time. Settings can name a time zone; otherwise the computer's clock is used.
  TT.clock = function () {
    var now = new Date(), tz = TT.settings && TT.settings.tz;
    if (tz && tz !== 'auto') {
      try {
        var parts = {}, f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', hour: 'numeric', minute: 'numeric', weekday: 'long', month: 'long', day: 'numeric' });
        f.formatToParts(now).forEach(function (p) { parts[p.type] = p.value; });
        return { hour: (+parts.hour) % 24, minute: +parts.minute, text: parts.weekday + ', ' + parts.month + ' ' + parts.day };
      } catch (e) { /* unknown zone: fall back to the computer's clock */ }
    }
    return { hour: now.getHours(), minute: now.getMinutes(), text: now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) };
  };
  TT.TIME_ZONES = [['auto', 'Match This Computer'], ['America/New_York', 'Eastern Time'], ['America/Chicago', 'Central Time'], ['America/Denver', 'Mountain Time'],
    ['America/Phoenix', 'Arizona'], ['America/Los_Angeles', 'Pacific Time'], ['America/Anchorage', 'Alaska'], ['Pacific/Honolulu', 'Hawaii'],
    ['America/Halifax', 'Atlantic Time'], ['America/Puerto_Rico', 'Puerto Rico'], ['Europe/London', 'United Kingdom and Ireland'], ['Europe/Paris', 'Central Europe'],
    ['Africa/Johannesburg', 'South Africa'], ['Asia/Dubai', 'Gulf (Dubai)'], ['Asia/Kolkata', 'India'], ['Asia/Manila', 'Philippines and Singapore'],
    ['Asia/Tokyo', 'Japan and Korea'], ['Australia/Sydney', 'Eastern Australia'], ['Pacific/Auckland', 'New Zealand']];

  // Which part of the day it is, for the sky outside the window.
  function phase(hr) { return hr >= 5 && hr < 8 ? 'sunrise' : hr >= 8 && hr < 17 ? 'day' : hr >= 17 && hr < 20 ? 'sunset' : 'night'; }
  var SKY = {
    sunrise: ['#FFB38A', '#FFD9A0', '#BFE3FF'], day: ['#49A8FF', '#8FD0FF', '#D8F1FF'],
    sunset: ['#3B2A8C', '#D9508A', '#FFB05C'], night: ['#0E1447', '#1B2466', '#2B3A8C']
  };
  var HILL = { sunrise: '#6FA06A', day: '#4FB86B', sunset: '#3A2A6B', night: '#1A2052' };

  // ----- little things for the windowsill, one per season -----
  function leaf(x, y, r, s, c) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + s + ')"><path d="M0 0 L-6 -10 L-16 -8 L-13 -18 L-24 -24 L-13 -28 L-16 -40 L-6 -34 L0 -48 L6 -34 L16 -40 L13 -28 L24 -24 L13 -18 L16 -8 L6 -10 Z" fill="' + c + '"/><path d="M0 0 V-34" stroke="#8A3A12" stroke-width="2" fill="none"/><path d="M0 0 l3 9" stroke="#8A3A12" stroke-width="3" stroke-linecap="round"/></g>';
  }
  function pot(x, y, top) {
    return '<g transform="translate(' + x + ' ' + y + ')">' + top + '<path d="M-17 -24 H17 L13 0 H-13 Z" fill="#E07A45"/><rect x="-20" y="-29" width="40" height="8" rx="3" fill="#F09560"/></g>';
  }
  function flower(c, mid) {
    return '<path d="M0 -24 V-52" stroke="#2F9E5B" stroke-width="4" stroke-linecap="round"/><path d="M0 -36 q-14 -2 -16 -14 q13 0 16 14Z M0 -40 q14 -2 16 -14 q-13 0 -16 14Z" fill="#3CCB7F"/>' +
      [0, 72, 144, 216, 288].map(function (a) { return '<ellipse cx="0" cy="-66" rx="7" ry="11" fill="' + c + '" transform="rotate(' + a + ' 0 -56)"/>'; }).join('') + '<circle cx="0" cy="-56" r="6" fill="' + mid + '"/>';
  }
  var SILL = {
    harvest: function () { return leaf(112, 245, -30, 1.35, '#E8601C') + leaf(204, 247, 36, 1.0, '#F08A2A'); },
    fall: function () { return leaf(112, 245, -30, 1.35, '#E8601C') + leaf(204, 247, 36, 1.0, '#F5AE14'); },
    halloween: function () { return '<g transform="translate(150 244)"><path d="M-2 -40 q4 -10 12 -8" stroke="#3E7A2E" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="-16" cy="-20" rx="18" ry="20" fill="#F2861E"/><ellipse cx="16" cy="-20" rx="18" ry="20" fill="#F2861E"/><ellipse cx="0" cy="-20" rx="16" ry="21" fill="#FF9D2E"/><path d="M-13 -26 l6 -8 l5 8Z M13 -26 l-6 -8 l-5 8Z" fill="#3A1B05"/><path d="M-14 -13 q14 12 28 0 q-14 4 -28 0Z" fill="#3A1B05"/></g>'; },
    holidays: function () { return '<g transform="translate(150 244)"><rect x="-5" y="-12" width="10" height="12" fill="#8A5A2B"/><path d="M0 -74 L-20 -44 H-10 L-26 -22 H26 L10 -44 H20 Z" fill="#1F9E5A"/><circle cx="-8" cy="-34" r="4" fill="#FF5C5C"/><circle cx="9" cy="-28" r="4" fill="#FFD43B"/><circle cx="2" cy="-52" r="4" fill="#7CC8FF"/><path d="M0 -84 l3 7 l8 1 l-6 5 l2 8 l-7 -4 l-7 4 l2 -8 l-6 -5 l8 -1Z" fill="#FFD43B"/></g>'; },
    winter: function () { return '<g transform="translate(150 244)"><circle cx="0" cy="-16" r="17" fill="#fff"/><circle cx="0" cy="-42" r="12" fill="#fff"/><circle cx="-4" cy="-44" r="2" fill="#1B1740"/><circle cx="4" cy="-44" r="2" fill="#1B1740"/><path d="M0 -40 l9 3 l-9 2Z" fill="#FF8A1F"/><path d="M-12 -32 h24" stroke="#E0484D" stroke-width="5" stroke-linecap="round"/></g>'; },
    newyear: function () { return '<g transform="translate(150 244)"><path d="M-12 0 L-20 -44 H20 L12 0Z" fill="#7C5CFF"/><path d="M-20 -44 L0 -70 L20 -44Z" fill="#FFC043"/><circle cx="0" cy="-72" r="6" fill="#FF5C8A"/><path d="M-17 -28 H17 M-14 -14 H14" stroke="#FFC043" stroke-width="4"/></g>'; },
    valentine: function () { return pot(150, 244, '<path d="M0 -24 V-44" stroke="#2F9E5B" stroke-width="4"/><path d="M0 -46 C-22 -66 -30 -40 0 -22 C30 -40 22 -66 0 -46Z" fill="#FF5C8A" transform="translate(0 -22)"/>'); },
    stpat: function () { return pot(150, 244, '<path d="M0 -24 V-46" stroke="#2F9E5B" stroke-width="4"/>' + [0, 120, 240].map(function (a) { return '<path d="M0 -52 C-14 -70 -20 -50 0 -46 C20 -50 14 -70 0 -52Z" fill="#1FB565" transform="rotate(' + a + ' 0 -48)"/>'; }).join('')); },
    spring: function () { return pot(150, 244, flower('#FF8FB8', '#FFD43B')); },
    summer: function () { return pot(150, 244, flower('#FFC043', '#8A4B12')); },
    school: function () { return '<g transform="translate(150 244)"><path d="M0 -34 q4 -10 12 -10" stroke="#6B3E1B" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M0 -34 C-26 -44 -30 -6 -8 0 q8 3 8 0 q0 3 8 0 C30 -6 26 -44 0 -34Z" fill="#E5484D"/><ellipse cx="-10" cy="-22" rx="4" ry="7" fill="#fff" opacity=".35"/><g transform="translate(38 -6) rotate(-12)"><rect x="-26" y="-5" width="44" height="10" fill="#FFD43B"/><path d="M18 -5 l12 5 l-12 5Z" fill="#F2C28A"/><rect x="-32" y="-5" width="7" height="10" fill="#FF8FB8"/></g></g>'; }
  };
  function plain() { return pot(150, 244, '<path d="M0 -24 q-20 -10 -18 -34 q16 8 18 34Z M0 -24 q20 -12 20 -38 q-17 10 -20 38Z M0 -24 q-4 -26 0 -48 q5 22 0 48Z" fill="#3CCB7F"/>'); }

  // The window and sill as one SVG. hr is 0 to 23, season is a TT.season() entry or null.
  TT.homeWindow = function (hr, season) {
    var ph = phase(hr), sky = SKY[ph], id = 'hw' + ph, out = '';
    out += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset=".6" stop-color="' + sky[1] + '"/><stop offset="1" stop-color="' + sky[2] + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'g"><stop offset="0" stop-color="#FFE9A8" stop-opacity=".85"/><stop offset="1" stop-color="#FFE9A8" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + id + 'c"><rect x="52" y="22" width="236" height="210"/></clipPath></defs>';
    // sky and what is in it
    var body = '<rect x="52" y="22" width="236" height="210" fill="url(#' + id + ')"/>';
    if (ph === 'night') {
      body += [[84, 60, 2.2], [120, 96, 1.6], [150, 48, 1.8], [196, 120, 2], [100, 150, 1.5], [250, 150, 1.7], [178, 82, 1.3], [230, 44, 1.4]].map(function (s, i) { return '<circle class="hw-star" style="animation-delay:-' + (i * 0.7) + 's" cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '" fill="#FFF3C4"/>'; }).join('') +
        '<path class="hw-star" d="M92 104 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 l8 -3Z M214 164 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2Z" fill="#FFE08A"/>' +
        '<circle cx="232" cy="78" r="46" fill="url(#' + id + 'g)" opacity=".5"/><path d="M246 52 a30 30 0 1 0 14 50 a24 24 0 1 1 -14 -50Z" fill="#FFE9A8"/>';
    } else {
      var sun = ph === 'sunrise' ? [104, 196, '#FFD43B'] : ph === 'sunset' ? [236, 190, '#FFB05C'] : hr < 12 ? [112, 86, '#FFD43B'] : [232, 80, '#FFD43B'];
      body += '<circle cx="' + sun[0] + '" cy="' + sun[1] + '" r="64" fill="url(#' + id + 'g)"/><circle class="hw-sun" cx="' + sun[0] + '" cy="' + sun[1] + '" r="26" fill="' + sun[2] + '"/>';
      var cloud = ph === 'sunset' ? '#FFC9A8' : '#fff';
      body += '<g class="hw-cloud" fill="' + cloud + '" opacity="' + (ph === 'day' ? '.95' : '.75') + '"><ellipse cx="190" cy="66" rx="30" ry="12"/><ellipse cx="170" cy="60" rx="18" ry="12"/><ellipse cx="206" cy="58" rx="16" ry="11"/></g>' +
        '<g class="hw-cloud two" fill="' + cloud + '" opacity=".8"><ellipse cx="96" cy="132" rx="24" ry="9"/><ellipse cx="110" cy="126" rx="14" ry="9"/></g>';
    }
    // far hills (snowy in winter) and, in winter, falling snow
    var snowy = season && (season.id === 'winter' || season.id === 'holidays');
    body += '<path d="M52 232 V196 q40 -30 84 -8 q30 -26 70 -6 q40 -22 82 4 V232Z" fill="' + (snowy ? (ph === 'night' ? '#C9D6FF' : '#F4F9FF') : HILL[ph]) + '"/>';
    if (snowy) body += [[80, 40], [130, 90], [176, 30], [220, 110], [260, 60], [104, 150], [240, 170], [156, 140]].map(function (s, i) { return '<circle class="hw-snow" style="animation-delay:-' + (i * 0.9) + 's" cx="' + s[0] + '" cy="' + s[1] + '" r="3" fill="#fff"/>'; }).join('');
    out += '<g clip-path="url(#' + id + 'c)">' + body + '</g>';
    // frame, panes
    out += '<rect x="44" y="14" width="252" height="226" rx="6" fill="none" stroke="#9A5A30" stroke-width="16"/><rect x="44" y="14" width="252" height="226" rx="6" fill="none" stroke="#C07A45" stroke-width="5"/>' +
      '<path d="M170 22 V232 M52 124 H288" stroke="#9A5A30" stroke-width="9"/>';
    // sill with a warm glow, and the season's little thing
    out += '<ellipse cx="170" cy="246" rx="150" ry="26" fill="#FFD58A" opacity="' + (ph === 'night' || ph === 'sunset' ? '.22' : '.12') + '"/>' +
      '<rect x="18" y="240" width="342" height="20" rx="5" fill="#C87A42"/><rect x="18" y="240" width="342" height="7" rx="3.5" fill="#E09A5C"/><rect x="34" y="260" width="326" height="40" fill="#8E4E28"/>';
    out += (season && SILL[season.id] ? SILL[season.id]() : plain());
    return '<svg viewBox="0 0 360 300" aria-hidden="true" focusable="false">' + out + '</svg>';
  };
  TT.dayPhase = phase;
})();
