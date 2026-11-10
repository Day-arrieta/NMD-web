/* Artist profile, filled from the CMS by ?artist=<id>.
   Used by exact-desktop-menu-3.html (desktop) and exact-mobile-work-profile.html (mobile). Each page marks its fields with
   data-artist="…" and keeps them hidden until #stage gets data-profile ("ready" or "missing"), so Figma placeholders never flash. */
(async () => {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const field = name => stage.querySelector(`[data-artist="${name}"]`);
  const hide = (...names) => names.forEach(name => { const el = field(name); if (el) el.hidden = true; });
  // The location/specialty text sits in a bordered box on mobile; hide the box with it so no empty frame is left.
  const hideBio = () => { const bio = field('bio'); if (bio) (bio.parentElement === stage ? bio : bio.parentElement).hidden = true; };
  const link = (label, href, external) => {
    const a = document.createElement('a'); a.href = href; a.textContent = label;
    if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  };

  // Shrinks the name until it fits its box width and data-max-height (e.g. two lines), keeping the Figma line-height ratio.
  async function fitName() {
    const el = field('name');
    if (!el) return;
    const style = getComputedStyle(el);
    const base = parseFloat(el.dataset.baseSize || (el.dataset.baseSize = style.fontSize));
    const ratio = (parseFloat(style.lineHeight) / parseFloat(style.fontSize)) || 0.8;
    const maxHeight = Number(el.dataset.maxHeight) || base * ratio;
    try { await document.fonts.load(`900 ${base}px Manuka`, el.textContent); } catch (error) { /* measure with the fallback font */ }
    const overflow = el.style.overflow;
    el.style.overflow = 'hidden'; // makes scrollWidth report a word wider than the box
    for (let size = base; size >= base * 0.3; size -= 2) {
      el.style.fontSize = size + 'px';
      el.style.lineHeight = Math.round(size * ratio) + 'px';
      if (el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= maxHeight + 1) break;
    }
    el.style.overflow = overflow;
  }

  const topOf = el => { const m = (el.style.transform || '').match(/matrix\(([^)]*)\)/); return m ? parseFloat(m[1].split(',')[5]) : 0; };
  function makeRoomForAbout(socials, p) {
    if (stage.dataset.about === 'push') {
      let group = socials; while (group.parentElement && group.parentElement !== stage) group = group.parentElement;
      const needed = topOf(socials) + p.offsetTop + p.offsetHeight + 16;          // en px del diseño (sin escala)
      const extra = Math.ceil(needed - (parseFloat(group.style.height) || needed));
      if (extra <= 0) return;
      group.style.height = (parseFloat(group.style.height) + extra) + 'px';
      [].forEach.call(stage.children, el => {
        if (el === group || topOf(el) <= topOf(group)) return;
        const m = el.style.transform.match(/matrix\(([^)]*)\)/);
        if (!m) return;
        const v = m[1].split(','); v[5] = String(parseFloat(v[5]) + extra);
        el.style.transform = 'matrix(' + v.join(',') + ')';
      });
      stage.style.height = (stage.offsetHeight + extra) + 'px';
      if (typeof window.fit === 'function') window.fit();
    } else {
      const name = field('name');
      if (!name) return;
      const k = (stage.getBoundingClientRect().width / stage.offsetWidth) || 1;
      const room = (name.getBoundingClientRect().top - p.getBoundingClientRect().top) / k - 32;
      if (room > 40) { p.style.maxHeight = room + 'px'; p.style.overflowY = 'auto'; }
    }
  }

  async function unavailable(message) {
    document.title = 'Profile unavailable — NMD19®';
    field('name').textContent = message;
    hide('pill', 'portrait', 'works-title', 'works', 'instagram');
    hideBio();
    const socials = field('socials');
    if (socials) socials.replaceChildren(link('Back to Work', stage.dataset.workUrl || 'exact-desktop-work.html'));
    await fitName();
    stage.dataset.profile = 'missing';
  }

  let artist;
  try {
    const artists = await NMDContent.artists();
    const id = new URLSearchParams(location.search).get('artist');
    artist = id ? artists.find(a => a.id === id) : artists[0];
  } catch (error) {
    console.error(error);
    return unavailable('Could not load profile');
  }
  if (!artist) return unavailable('Profile unavailable');

  document.title = artist.name + ' — NMD19®';
  field('name').textContent = artist.name;
  field('role').textContent = artist.role;

  const details = [artist.location, artist.bio].filter(value => typeof value === 'string' && value.trim()).map(value => value.trim());
  field('bio').textContent = details.join('\n');
  if (!details.length) hideBio();

  const portrait = field('portrait');
  portrait.style.backgroundImage = `url(${JSON.stringify(artist.image)})`;
  portrait.setAttribute('role', 'img');
  portrait.setAttribute('aria-label', artist.name);

  const socials = field('socials');
  socials.replaceChildren(...[['Instagram', artist.instagram], ['Website', artist.website]]
    .filter(([, href]) => href).map(([label, href]) => link(label, href, true)));

  // Descripción (Pages CMS → "Descripción"), debajo de las redes. Escritorio: cabe en la columna sobre el nombre
  // (si es muy larga, se desplaza dentro). Móvil (#stage[data-about="push"]): lo de abajo baja para dejarle espacio.
  const about = typeof artist.description === 'string' ? artist.description.trim() : '';
  if (about) {
    const p = document.createElement('p');
    p.className = 'artist-about';
    p.textContent = about;
    socials.append(p);
    makeRoomForAbout(socials, p);
  }

  const instagram = field('instagram'); // mobile "View Instagram" bar
  if (instagram) {
    if (artist.instagram) { instagram.href = artist.instagram; instagram.setAttribute('aria-label', 'View Instagram: ' + artist.name); }
    else instagram.hidden = true;
  }

  const gallery = field('works');
  const works = artist.works.filter(work => work.featured);
  gallery.replaceChildren(...works.map(work => {
    const img = document.createElement('img');
    img.src = work.image; img.alt = work.title || ''; img.loading = 'lazy'; img.decoding = 'async';
    return img;
  }));
  if (!works.length) { const p = document.createElement('p'); p.textContent = 'Coming soon'; gallery.append(p); }

  await fitName();
  stage.dataset.profile = 'ready';
})();
