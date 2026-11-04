/* Shared content source for Pages CMS. Public content only; no credentials. */
window.NMDContent = (() => {
  let request;
  const base = new URL('../../', document.currentScript.src);
  function safeURL(value) {
    if (!value || typeof value !== 'string') return '';
    try { const url = new URL(value.replace(/^\//, ''), base); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  }
  function profileURL(id) {
    return new URL('exact-desktop-menu-3.html?artist=' + encodeURIComponent(id), base).href;
  }
  async function artists() {
    if (!request) request = fetch(new URL('content/artists.json', base), {cache: 'no-cache'})
      .then(response => { if (!response.ok) throw new Error('Content unavailable'); return response.json(); })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid artists data');
        return data.filter(a => a.published !== false && a.id && a.name && safeURL(a.image))
          .map(a => ({...a, image: safeURL(a.image), role: a.role === 'Guest' ? 'Guest' : 'Resident',
            instagram: /^https?:\/\//i.test(a.instagram || '') ? safeURL(a.instagram) : '',
            website: /^https?:\/\//i.test(a.website || '') ? safeURL(a.website) : '',
            works: (a.works || []).filter(w => w.published !== false && safeURL(w.image)).map(w => ({...w, image: safeURL(w.image)}))}))
          .sort((a,b) => (Number(a.order)||0) - (Number(b.order)||0));
      });
    return request;
  }
  return {artists, profileURL};
})();
