/* Shared content source for Pages CMS. Public content only; no credentials. */
window.NMDContent = (() => {
  let request;
  const base = new URL('../../', document.currentScript.src);
  function safeURL(value) {
    if (!value || typeof value !== 'string') return '';
    try { const url = new URL(value.replace(/^\//, ''), base); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  }
  // External links typed in the CMS: "nmd19.com" or "//nmd19.com" get https://; other schemes (javascript:, mailto:…) are dropped.
  function externalURL(value) {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text) return '';
    const absolute = /^https?:\/\//i.test(text) ? text
      : /^[a-z][a-z\d+.-]*:/i.test(text) ? ''
      : 'https://' + text.replace(/^\/+/, '');
    try {
      const url = new URL(absolute);
      return ['https:', 'http:'].includes(url.protocol) && url.hostname.includes('.') ? url.href : '';
    } catch { return ''; }
  }
  // Instagram also accepts a bare handle ("@cesarvaca.tt" or "cesarvaca.tt"); handles may contain dots, so they win over domains.
  function instagramURL(value) {
    const text = typeof value === 'string' ? value.trim() : '';
    const handle = text.match(/^@?([a-z\d._]{1,30})$/i);
    if (handle && !/^(www\.)?instagram\.com$/i.test(handle[1])) return 'https://www.instagram.com/' + handle[1] + '/';
    return externalURL(text);
  }
  // "@cuenta" de un enlace de Instagram ya normalizado (https://www.instagram.com/cuenta/ → @cuenta).
  function instagramHandle(url) {
    try {
      const u = new URL(url);
      const user = /(^|\.)instagram\.com$/i.test(u.hostname) && u.pathname.split('/').filter(Boolean)[0];
      return user ? '@' + user : '';
    } catch { return ''; }
  }
  // Desktop profile by default; pass true for the mobile profile page.
  function profileURL(id, mobile) {
    const page = mobile ? 'exact-mobile-work-profile.html' : 'exact-desktop-menu-3.html';
    const url = new URL(page + '?artist=' + encodeURIComponent(id), base).href;
    // Relative when it is in the current folder, so the pages' fade-out transition (which skips absolute URLs) still runs.
    let here = '';
    try { here = new URL('./', document.baseURI).href; } catch { /* e.g. about:srcdoc: keep the absolute URL */ }
    return here && url.startsWith(here) ? url.slice(here.length) : url;
  }
  async function artists() {
    if (!request) request = fetch(new URL('content/artists.json', base), {cache: 'no-cache'})
      .then(response => { if (!response.ok) throw new Error('Content unavailable'); return response.json(); })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid artists data');
        return data.filter(a => a.published !== false && a.id && a.name && safeURL(a.image))
          .map(a => ({...a, image: safeURL(a.image), role: a.role === 'Guest' ? 'Guest' : 'Resident',
            instagram: instagramURL(a.instagram),
            handle: instagramHandle(instagramURL(a.instagram)),
            website: externalURL(a.website),
            works: (Array.isArray(a.works) ? a.works : []).filter(w => w && w.published !== false && safeURL(w.image)).map(w => ({...w, image: safeURL(w.image)}))}))
          .sort((a,b) => (Number(a.order)||0) - (Number(b.order)||0));
      });
    return request;
  }
  return {artists, profileURL};
})();
