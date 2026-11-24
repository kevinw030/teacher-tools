// Class Points (2026-11-24 look): a marble jar the whole class fills toward a reward, or a scoreboard
// for table teams. The sidekick cheers as marbles drop in. "Pick a Reward" comes from tools/learn.js.
(function () {
  var TT = window.TT, h = TT.h;
  var MARBLES = ['#3B7BFF', '#FF7448', '#14B884', '#F5AE14', '#8B5CF6', '#EC4899', '#0EA5E9', '#7CB518'];
  var TEAM_COLORS = ['cobalt', 'coral', 'emerald', 'amber', 'violet', 'rose'];
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function svg(d) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var ICO = {
    jar: svg('<path d="M8 3h8v3H8z"/><path d="M7 6h10a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2z"/><circle cx="10" cy="16" r="1.6"/><circle cx="14.5" cy="15" r="1.6"/>'),
    teams: svg('<path d="M5 20V10M12 20V4M19 20v-7"/>'),
    gift: svg('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M3 7h18v3H3zM12 7v13M12 7c-1.5-4-6-3-4.500 0M12 7c1.500-4 6-3 4.500 0"/>'),
    crown: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 8l4.500 4L12 5l4.500 7L21 8l-1.800 10H4.800z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.500l2.900 6.100 6.600.900-4.800 4.600 1.200 6.600L12 17.500l-5.900 3.200 1.200-6.600L2.500 9.500l6.600-.900z"/></svg>'
  };

  TT.mountPoints = function (el) {
    var state = TT.load('points', null) || {};
    state.mode = state.mode === 'teams' ? 'teams' : state.mode === 'reward' && TT.rewardsTab ? 'reward' : 'jar';
    state.jar = state.jar || { count: 0, goal: 20, reward: 'Extra Recess' };
    if (!Array.isArray(state.teams) || !state.teams.length) state.teams = [{ name: 'Table 1', pts: 0 }, { name: 'Table 2', pts: 0 }, { name: 'Table 3', pts: 0 }, { name: 'Table 4', pts: 0 }];
    function save() { TT.save('points', state); }

    var MODES = [['jar', 'Class Jar', ICO.jar], ['teams', 'Team Points', ICO.teams]].concat(TT.rewardsTab ? [['reward', 'Pick a Reward', ICO.gift]] : []);
    var tabs = h('div', { class: 'cp-tabs', role: 'group', 'aria-label': 'How to keep points' }, MODES.map(function (t) {
      return h('button', { type: 'button', class: 'cp-tab', 'data-m': t[0], onclick: function () { state.mode = t[0]; save(); paint(); } },
        h('span', { class: 'cp-tab-ico', html: t[2] }), h('span', { text: t[1] }));
    }));
    var box = h('div', { class: 'pts-body cp-body' });
    el.textContent = '';
    el.append(h('div', { class: 'cp' }, tabs, box));

    // ----- Class Jar -----
    function jar() {
      var j = state.jar, settings = false;
      var buddy = TT.mascot ? TT.mascot() : null;
      var marbles = h('div', { class: 'cp-marbles' });
      var numEl = h('b', { class: 'cp-num' }), ofEl = h('span', { class: 'cp-of' });
      var titleEl = h('h2', { class: 'cp-title' }), bar = h('span', { class: 'cp-bar-fill' });
      var rewardName = h('b'), rewardLab = h('span');
      var tag = h('div', { class: 'cp-reward' }, h('span', { class: 'cp-reward-ico', html: ICO.gift }), h('span', { class: 'cp-reward-text' }, rewardLab, rewardName));
      var jarEl = h('div', { class: 'cp-jar' }, h('div', { class: 'cp-lid' }), h('div', { class: 'cp-glass' }, marbles, h('span', { class: 'cp-shine', 'aria-hidden': 'true' })));
      var acts = h('div', { class: 'cp-acts' });
      var setBox = h('div', { class: 'cp-set' });
      function goal() { return Math.max(1, j.goal || 20); }
      function drawMarbles(from) {
        var g = goal(), n = Math.min(j.count, g);
        marbles.style.setProperty('--per', Math.ceil(Math.sqrt(g * 0.8)));
        while (marbles.children.length > n) marbles.lastChild.remove();
        for (var i = marbles.children.length; i < n; i++) {
          var m = h('i', { style: 'background:' + MARBLES[(i * 5 + 3) % MARBLES.length] });
          if (from != null && !still) { m.className = 'drop'; m.style.animationDelay = (i - from) * 90 + 'ms'; }
          marbles.append(m);
        }
      }
      function text() {
        var g = goal(), full = j.count >= g, left = g - j.count;
        numEl.textContent = j.count; ofEl.textContent = 'of ' + g + ' marbles';
        titleEl.textContent = full ? 'The Jar Is Full!' : left + ' More to Go';
        bar.style.width = Math.min(100, j.count / g * 100) + '%';
        rewardLab.textContent = full ? 'You Earned' : 'Working Toward';
        rewardName.textContent = j.reward || 'A Class Reward';
        jarEl.classList.toggle('full', full); stage.classList.toggle('full', full);
        acts.textContent = '';
        if (full) acts.append(h('button', { type: 'button', class: 'cp-add', onclick: function () { j.count = 0; save(); drawMarbles(); text(); } }, h('span', { class: 'cp-add-ico', html: TT.icon('reset') }), h('span', { text: 'Empty the Jar and Start Again' })));
        else acts.append(
          h('button', { type: 'button', class: 'cp-add', onclick: function () { add(1); } }, h('span', { class: 'cp-add-ico', html: TT.icon('plus') }), h('span', { text: 'Add a Marble' })),
          h('button', { type: 'button', class: 'cp-btn', onclick: function () { add(5); } }, 'Add 5'),
          h('button', { type: 'button', class: 'cp-btn quiet', onclick: function () { add(-1); } }, h('span', { html: TT.icon('minus') }), 'Take One Out'));
      }
      function add(n) {
        var g = goal(), was = j.count, wasFull = was >= g;
        j.count = Math.max(0, Math.min(g, j.count + n)); save();
        if (j.count === was) return;
        drawMarbles(n > 0 ? was : null); text();
        numEl.classList.remove('bump'); void numEl.offsetWidth; numEl.classList.add('bump');
        if (n > 0) TT.tick();
        var won = !wasFull && j.count >= g;
        if (won) { TT.chime(); if (TT.celebrate) TT.celebrate(box); }
        if (buddy && n > 0) buddy.mood(won ? 'party' : 'cheer', won ? 4000 : 1400);
      }
      function paintSet() {
        setBox.textContent = '';
        if (!settings) { setBox.append(h('button', { type: 'button', class: 'cp-link', onclick: function () { settings = true; paintSet(); } }, h('span', { html: TT.icon('gear') }), 'Change the Reward or Jar Size')); return; }
        var rewardIn = h('input', { type: 'text', id: 'jarReward', maxlength: 40, placeholder: 'Like Extra Recess', 'aria-label': 'Reward' }); rewardIn.value = j.reward || '';
        rewardIn.addEventListener('input', function () { j.reward = rewardIn.value; save(); text(); });
        var goalIn = h('input', { type: 'number', id: 'jarGoal', min: 5, max: 100, 'aria-label': 'Marbles to fill the jar' }); goalIn.value = goal();
        goalIn.addEventListener('change', function () { j.goal = Math.max(5, Math.min(100, Math.round(+goalIn.value) || 20)); goalIn.value = j.goal; j.count = Math.min(j.count, j.goal); save(); marbles.textContent = ''; drawMarbles(); text(); });
        setBox.append(h('div', { class: 'cp-set-row' },
          h('label', { class: 'cq-field', for: 'jarReward' }, h('span', { text: 'Reward' }), rewardIn),
          h('label', { class: 'cq-field small', for: 'jarGoal' }, h('span', { text: 'Marbles to Fill' }), goalIn),
          h('button', { type: 'button', class: 'cp-btn', onclick: function () { settings = false; paintSet(); } }, 'Done')));
      }
      var stage = h('div', { class: 'cp-stage' },
        h('div', { class: 'cp-scene' }, jarEl, buddy ? h('div', { class: 'cp-buddy' }, buddy) : null),
        h('div', { class: 'cp-side' },
          h('div', { class: 'cp-count', 'aria-live': 'polite' }, numEl, ofEl),
          h('div', { class: 'cp-bar' }, bar, h('span', { class: 'cp-bar-star', html: ICO.star })),
          titleEl, tag, acts));
      box.append(stage, setBox);
      drawMarbles(); text(); paintSet();
    }

    // ----- Team Points -----
    function teams() {
      var grid = h('div', { class: 'cp-teams' }), cards = [], armed = false;
      function top() { return Math.max.apply(null, state.teams.map(function (t) { return t.pts; })); }
      function refresh() {
        var best = top();
        cards.forEach(function (c, i) {
          var t = state.teams[i], lead = best > 0 && t.pts === best;
          c.score.textContent = t.pts;
          c.el.classList.toggle('lead', lead);
          c.fill.style.width = (best > 0 ? Math.max(4, t.pts / best * 100) : 4) + '%';
        });
      }
      state.teams.forEach(function (t, i) {
        var name = h('input', { type: 'text', id: 'ptName' + i, class: 'cp-name', maxlength: 20, 'aria-label': 'Team name' }); name.value = t.name;
        name.addEventListener('input', function () { t.name = name.value; save(); });
        var score = h('b', { class: 'cp-score' }), fill = h('span');
        function add(n) {
          var was = t.pts; t.pts = Math.max(0, t.pts + n); save(); if (t.pts === was) return;
          if (n > 0) TT.tick(); refresh();
          score.classList.remove('bump'); void score.offsetWidth; score.classList.add('bump');
        }
        var card = h('div', { class: 'cp-team c-' + TEAM_COLORS[i % 6], style: '--i:' + i },
          h('div', { class: 'cp-team-head' }, name, h('span', { class: 'cp-crown', title: 'In the Lead', html: ICO.crown })),
          score, h('div', { class: 'cp-race' }, fill),
          h('div', { class: 'cp-team-acts' },
            h('button', { type: 'button', class: 'cp-round', 'aria-label': 'Take a point from ' + t.name, html: TT.icon('minus'), onclick: function () { add(-1); } }),
            h('button', { type: 'button', class: 'cp-plus', 'aria-label': 'Give a point to ' + t.name, html: TT.icon('plus') + '<span>1</span>', onclick: function () { add(1); } }),
            h('button', { type: 'button', class: 'cp-round', 'aria-label': 'Give 5 points to ' + t.name, onclick: function () { add(5); } }, '+5')));
        cards.push({ el: card, score: score, fill: fill });
        grid.append(card);
      });
      var resetBtn = h('button', { type: 'button', class: 'cp-btn quiet', onclick: function () {
        if (!armed) { armed = true; resetBtn.lastChild.textContent = 'Press Again to Reset'; resetBtn.classList.add('warn'); setTimeout(function () { armed = false; resetBtn.lastChild.textContent = 'Reset Points'; resetBtn.classList.remove('warn'); }, 3000); return; }
        state.teams.forEach(function (t) { t.pts = 0; }); save(); paint();
      } }, h('span', { html: TT.icon('reset') }), h('span', { text: 'Reset Points' }));
      box.append(grid, h('div', { class: 'cp-foot' },
        state.teams.length < 6 ? h('button', { type: 'button', class: 'cp-btn', onclick: function () { state.teams.push({ name: 'Table ' + (state.teams.length + 1), pts: 0 }); save(); paint(); } }, h('span', { html: TT.icon('plus') }), 'Add a Team') : null,
        state.teams.length > 2 ? h('button', { type: 'button', class: 'cp-btn', onclick: function () { state.teams.pop(); save(); paint(); } }, h('span', { html: TT.icon('minus') }), 'Remove Last Team') : null,
        resetBtn));
      refresh();
    }

    function paint() {
      tabs.querySelectorAll('.cp-tab').forEach(function (b) { var on = b.getAttribute('data-m') === state.mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      box.textContent = '';
      if (state.mode === 'reward') TT.rewardsTab(box, state, save, function () { state.mode = 'jar'; save(); paint(); });
      else (state.mode === 'jar' ? jar : teams)();
    }
    paint();
  };
})();
