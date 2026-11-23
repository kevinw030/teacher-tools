// Classroom Board templates: ready-made layouts that open as a new saved screen.
// Each build(b) gets the board's size and returns { bg, widgets }. Positions are fractions of the board,
// so a template fits a laptop and a big classroom display the same way.
(function () {
  function note(text, size, extra) { var d = { text: text, size: size, bold: true, color: 'auto', box: 'default', align: 'left' }; if (extra) Object.keys(extra).forEach(function (k) { d[k] = extra[k]; }); return d; }
  function maker(b) {
    var pad = Math.max(16, b.w * 0.02), gap = Math.max(12, b.w * 0.015);
    // place a widget on a 12 x 12 grid inside the padding
    return function (type, cx, cy, cw, ch, data) {
      var W = b.w - pad * 2, H = b.h - pad * 2;
      var w = { type: type, x: pad + W * cx / 12 + gap / 2, y: pad + H * cy / 12 + gap / 2, w: W * cw / 12 - gap, h: H * ch / 12 - gap, data: data };
      // Text is sized so every line fits inside its box, allowing for a long line that wraps.
      if (type === 'text' && data) {
        var lines = data.text.split('\n'), rows = 0;
        lines.forEach(function (l) { rows += Math.max(1, Math.ceil(l.length * data.size * 0.54 / (w.w - 60))); });
        while (data.size > 14 && rows * data.size * 1.5 > w.h - 96) {
          data.size -= 2; rows = 0;
          lines.forEach(function (l) { rows += Math.max(1, Math.ceil(l.length * data.size * 0.54 / (w.w - 60))); });
        }
      }
      return w;
    };
  }
  function big(b) { return Math.round(Math.max(22, Math.min(46, b.w / 34))); }
  window.TT.BOARD_TEMPLATES = [
    { id: 'arrival', name: 'Morning Arrival', desc: 'Greeting, morning jobs, clock and schedule', color: '#F5AE14', build: function (b) {
      var at = maker(b);
      return { bg: 'morning', widgets: [
        at('text', 0, 0, 7, 7, note('Good Morning!\n\n1. Unpack your backpack\n2. Turn in your homework\n3. Sharpen two pencils\n4. Start your morning work', big(b))),
        at('clock', 7, 0, 5, 3),
        at('schedule', 7, 3, 5, 9),
        at('wyr', 0, 7, 7, 5)
      ] };
    } },
    { id: 'work', name: 'Independent Work', desc: 'Directions, a timer and the voice level', color: '#14B884', build: function (b) {
      var at = maker(b);
      return { bg: 'mint', widgets: [
        at('text', 0, 0, 8, 6, note('Independent Work\n\nWork quietly at your seat.\nFinished early? Read your book or check your work.', big(b))),
        at('timer', 8, 0, 4, 8, { total: 1200 }),
        at('workmode', 0, 6, 4, 6, { on: 'silent' }),
        at('text', 4, 6, 4, 6, note('Need help?\nAsk 3 before me.', Math.round(big(b) * 0.8), { box: '#FEF3C7', align: 'center', middle: true }))
      ] };
    } },
    { id: 'test', name: 'Test Day', desc: 'A calm screen with the time left and quiet reminders', color: '#3B7BFF', build: function (b) {
      var at = maker(b);
      return { bg: 'chalk', widgets: [
        at('text', 0, 0, 8, 5, note('Testing in Progress\n\nEyes on your own paper.\nTake your time and check your work.', big(b), { box: 'clear', color: '#FFFFFF' })),
        at('timer', 8, 0, 4, 8, { total: 2700 }),
        at('workmode', 0, 5, 4, 7, { on: 'silent' }),
        at('text', 4, 5, 4, 7, note('When You Finish\n\n1. Turn your test over\n2. Read silently', Math.round(big(b) * 0.75)))
      ] };
    } },
    { id: 'centers', name: 'Centers', desc: 'Rotation timer, groups and a clean-up light', color: '#8B5CF6', build: function (b) {
      var at = maker(b);
      return { bg: 'lemon', widgets: [
        at('text', 0, 0, 8, 8, note('Centers\n\n1. Read to Self\n2. Word Work\n3. Math Facts\n4. Meet With the Teacher', big(b))),
        at('timer', 8, 0, 4, 8, { total: 900 }),
        at('workmode', 0, 8, 4, 4, { on: 'whisper' }),
        at('text', 4, 8, 8, 4, note('When the timer rings: clean up, then move to the next center.', Math.round(big(b) * 0.75), { box: '#DBEAFE', middle: true }))
      ] };
    } },
    { id: 'packup', name: 'Pack Up', desc: 'End of day checklist with a five minute timer', color: '#FF7448', build: function (b) {
      var at = maker(b);
      return { bg: 'peach', widgets: [
        at('text', 0, 0, 7, 9, note('Time to Pack Up\n\n1. Write in your planner\n2. Stack your chair\n3. Clean up your area\n4. Line up quietly', big(b))),
        at('timer', 7, 0, 5, 8, { total: 300 }),
        at('clock', 7, 8, 5, 4),
        at('text', 0, 9, 7, 3, note('See you tomorrow!', big(b), { box: '#DCFCE7', align: 'center', middle: true }))
      ] };
    } }
  ];
})();
