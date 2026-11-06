/* ============================================================
   NMD19 — Desktop / mobile routing.
   Loaded synchronously in <head> of every live page, so it runs
   before first paint. Below 1024px a desktop page is replaced by
   its mobile counterpart; at 1024px or wider a mobile page is
   replaced by its desktop counterpart. Query string and hash are
   kept. Pages without a counterpart are left alone.
   ============================================================ */
(function () {
  // Never route the menu iframe (sticky-rail.js) or any embedded copy.
  var framed;
  try { framed = window.self !== window.top; } catch (e) { framed = true; }
  if (framed || /[?&]embed=1(&|$)/.test(location.search)) return;
  // ?view=full: the visitor explicitly asked for the full (desktop) page, e.g. the mobile F.A.Q. fallback link.
  if (/[?&]view=full(&|$)/.test(location.search)) return;

  // [desktop page, mobile page]
  var PAIRS = [
    ['exact-desktop-studio-2', 'exact-mobile-home'],
    ['exact-desktop-studio', 'exact-mobile-studio'],
    ['exact-desktop-work', 'exact-mobile-work'],
    ['appointments', 'exact-mobile-appointments'],
    ['exact-desktop-menu-3', 'exact-mobile-work-profile'],
    ['exact-desktop-f-a-q', 'exact-mobile-f-a-q'],
    ['exact-desktop-menu', 'exact-mobile-menu-expanded']
  ];

  var path = location.pathname;
  var cut = path.lastIndexOf('/') + 1;
  var dir = path.slice(0, cut);
  var page;
  try { page = decodeURIComponent(path.slice(cut)); } catch (e) { page = path.slice(cut); }
  // Netlify can serve pages with or without ".html" (pretty URLs).
  page = page.toLowerCase().replace(/\.html$/, '');

  var desktop = window.matchMedia
    ? window.matchMedia('(min-width: 1024px)').matches
    : (window.innerWidth || document.documentElement.clientWidth) >= 1024;

  var target = null;
  for (var i = 0; i < PAIRS.length; i++) {
    if (!desktop && page === PAIRS[i][0]) target = PAIRS[i][1];
    else if (desktop && page === PAIRS[i][1]) target = PAIRS[i][0];
  }
  if (!target) return;

  // Loop guard: if we were sent here from the target a moment ago
  // (the two pages disagree about the width), stay put.
  var KEY = 'nmd_device_route', now = Date.now();
  try {
    var last = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (last && last.from === target && last.to === page && now - last.t < 3000) return;
    sessionStorage.setItem(KEY, JSON.stringify({ from: page, to: target, t: now }));
  } catch (e) { /* storage blocked: routing still works, only the guard is lost */ }

  // Hide this page while the counterpart loads (safety net if it is slow).
  var root = document.documentElement;
  root.style.visibility = 'hidden';
  setTimeout(function () { root.style.visibility = ''; }, 3000);
  location.replace(dir + target + '.html' + location.search + location.hash);
})();
