// Full screen fit: when a tool page is in full screen, scale its content so everything is visible
// on any screen. Small screens shrink the content, very large screens enlarge it.
(function () {
  var page = null, box = null, ro = null, busy = false, timer = null;

  function room(p) {
    var cs = getComputedStyle(p);
    return {
      w: p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
      h: p.clientHeight - 2 * PAD, left: parseFloat(cs.paddingLeft)
    };
  }
  var PAD = 20;
  function top() { return Math.max(1, Math.min(3, Math.min(window.innerWidth / 1500, window.innerHeight / 860))); }
  function lay(z, r) { box.style.width = (r.w / z) + 'px'; return box.offsetHeight * z <= r.h + 0.5 && box.scrollWidth <= box.clientWidth + 1; }

  // Find the biggest scale that still fits. Screens larger than a normal laptop start bigger.
  function fit() {
    if (!page || busy) return;
    busy = true;
    var r = room(page), z = top();
    if (!lay(z, r)) {
      var lo = 0.25, hi = z;
      for (var i = 0; i < 9; i++) { var mid = (lo + hi) / 2; if (lay(mid, r)) lo = mid; else hi = mid; }
      z = lo; lay(z, r);
    }
    box._z = z;
    box.style.transform = 'scale(' + z.toFixed(4) + ')';
    box.style.left = r.left + 'px';
    box.style.top = (PAD + Math.max(0, (r.h - box.offsetHeight * z) / 2)) + 'px';
    requestAnimationFrame(function () { requestAnimationFrame(function () { busy = false; }); });
  }
  // Content changed size (a longer question, more names, a new game screen): refit only if needed.
  function check() {
    if (!page || busy) return;
    var r = room(page), z = box._z || 1, used = box.offsetHeight * z;
    if (used > r.h + 1 || (z < top() - 0.01 && used < r.h * 0.9) || box.scrollWidth > box.clientWidth + 1) fit();
    else box.style.top = (PAD + Math.max(0, (r.h - used) / 2)) + 'px';
  }
  function later() { clearTimeout(timer); timer = setTimeout(check, 50); }

  function stop() {
    if (ro) { ro.disconnect(); ro = null; }
    if (box && page) { while (box.firstChild) page.insertBefore(box.firstChild, box); box.remove(); }
    box = null; page = null;
  }
  function start(p) {
    stop(); page = p;
    box = document.createElement('div'); box.className = 'fs-fit';
    while (p.firstChild) box.appendChild(p.firstChild);
    p.appendChild(box);
    fit();
    if (window.ResizeObserver) { ro = new ResizeObserver(later); ro.observe(box); }
  }
  document.addEventListener('fullscreenchange', function () {
    var el = document.fullscreenElement;
    if (el && el.classList.contains('page')) start(el); else stop();
  });
  window.addEventListener('resize', function () { if (page) { clearTimeout(timer); timer = setTimeout(fit, 60); } });
  window.addEventListener('hashchange', function () { if (page) setTimeout(fit, 120); });
})();
