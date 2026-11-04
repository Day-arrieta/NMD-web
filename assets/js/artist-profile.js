(async () => {
  const field = name => document.querySelector(`[data-artist="${name}"]`);
  try {
    const artists = await NMDContent.artists();
    const id = new URLSearchParams(location.search).get('artist');
    const artist = id ? artists.find(a => a.id === id) : artists[0];
    if (!artist) {
      field('name').textContent = 'Perfil no disponible';
      ['role', 'bio', 'socials', 'portrait'].forEach(key => { field(key).hidden = true; });
      return;
    }
    document.title = artist.name + ' — NMD19';
    ['name', 'role', 'bio'].forEach(key => { field(key).textContent = artist[key] || ''; });
    field('portrait').style.backgroundImage = `url(${JSON.stringify(artist.image)})`;
    field('portrait').setAttribute('role', 'img');
    field('portrait').setAttribute('aria-label', artist.name);
    const socials = field('socials'); socials.replaceChildren();
    [['Instagram', artist.instagram], ['Website', artist.website]].forEach(([label, href]) => {
      if (!href) return;
      const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = label; socials.append(a);
    });
    const gallery = document.getElementById('artist-works');
    const works = artist.works.filter(work => work.featured);
    works.forEach(work => {
      const img = document.createElement('img'); img.src = work.image; img.alt = work.title || ''; img.loading = 'lazy'; gallery.append(img);
    });
    if (!works.length) { const p = document.createElement('p'); p.textContent = 'Próximamente'; gallery.append(p); }
  } catch (error) {
    field('name').textContent = 'No se pudo cargar el perfil'; console.error(error);
  }
})();
