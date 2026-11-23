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
      // Si el texto no cabe, se desvanece abajo (hay más al desplazar); el fundido se quita al llegar al final.
      const edge = () => p.classList.toggle('has-more', p.scrollHeight - p.clientHeight - p.scrollTop > 2);
      edge(); p.addEventListener('scroll', edge, { passive: true });
    }
  }

  // Franja inferior fija: "Contact" y la @cuenta. Se dibuja en la escala del escenario y se queda pegada al borde
  // de abajo de la ventana; si la página termina antes, se queda donde iba en el diseño (como un sticky).
  // Escritorio: fila de 96px desde el riel hasta "Featured Work". Celular: una barra de 80px partida en dos.
  function contactBar() {
    const desktop = stage.offsetWidth > 600;
    const L = desktop ? { x: 107, w: 1430, h: 96, split: 604, font: "900 42px/40px Manuka,Impact,sans-serif" }
                      : { x: 0, w: 440, h: 80, split: 220, font: "400 26px/26px Manuka,Impact,sans-serif" };
    const mail = stage.querySelector('a[href^="mailto:"]');
    const style = document.createElement('style');
    style.textContent = '.profile-bar{position:fixed;left:0;bottom:0;width:100%;z-index:60;pointer-events:none;animation:profile-bar-in .8s cubic-bezier(.22,1,.36,1) both}'
      + '@keyframes profile-bar-in{from{opacity:0;translate:0 28px}to{opacity:1;translate:0 0}}'
      + '@media (prefers-reduced-motion:reduce){.profile-bar{animation:none}}'
      + '.profile-bar__inner{position:absolute;top:0;transform-origin:0 0}'
      + '.profile-bar a{position:absolute;top:0;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:0 16px;'
      +   'background:#000;border-top:1px solid #484848;color:#fff;text-decoration:none;white-space:nowrap;overflow:hidden;letter-spacing:.03em;'
      +   'pointer-events:auto;transition:opacity .4s cubic-bezier(.22,1,.36,1)}'
      + '.profile-bar a:hover{opacity:.86}.profile-bar a:active{opacity:.5;transition:opacity .06s}'
      + '.profile-bar a:focus-visible{outline:2px solid #FDDE36;outline-offset:-4px}'
      + '.profile-bar a + a{border-left:1px solid #484848}'
      + (desktop ? '.profile-bar a:last-child{border-right:1px solid #484848}' : '');
    document.head.appendChild(style);
    const bar = document.createElement('div'); bar.className = 'profile-bar';
    const inner = document.createElement('div'); inner.className = 'profile-bar__inner';
    inner.style.cssText = `width:${stage.offsetWidth}px;height:${L.h}px`;
    const cell = (label, href, left, width, external) => {
      const a = link(label, href, external);
      a.style.cssText = `left:${left}px;width:${width}px;height:${L.h}px;font:${L.font}`;
      inner.append(a); return a;
    };
    cell('Contact', mail ? mail.getAttribute('href') : 'mailto:info@nomadttt.com', L.x, L.split);
    const handle = artist.handle ? cell(artist.handle, artist.instagram, L.x + L.split, L.w - L.split, true) : null;
    bar.append(inner); document.body.append(bar);
    // la @cuenta larga se achica para caber en su mitad
    if (handle) for (let size = parseFloat(getComputedStyle(handle).fontSize); size > 14 && handle.scrollWidth > handle.clientWidth; size -= 1) handle.style.fontSize = (size - 1) + 'px';
    const place = () => {
      const r = stage.getBoundingClientRect(), k = (r.width / stage.offsetWidth) || 1;
      bar.style.height = (L.h * k) + 'px';
      inner.style.left = r.left + 'px';
      inner.style.transform = `scale(${k})`;
      bar.style.bottom = Math.max(0, innerHeight - r.bottom) + 'px';   // nunca más abajo del final del diseño
    };
    place();
    addEventListener('scroll', place, { passive: true });
    addEventListener('resize', place);
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

  // Recuadro de abajo (donde iban ubicación y especialidad): la cuenta de Instagram, enlazada.
  if (artist.handle) field('bio').replaceChildren(link(artist.handle, artist.instagram, true));
  else hideBio();

  const portrait = field('portrait');
  portrait.style.backgroundImage = `url(${JSON.stringify(artist.image)})`;
  portrait.setAttribute('role', 'img');
  portrait.setAttribute('aria-label', artist.name);

  const socials = field('socials');
  socials.replaceChildren(...[['Website', artist.website]]
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
  contactBar();
  stage.dataset.profile = 'ready';
})();
