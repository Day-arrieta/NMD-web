(async () => {
  const root = document.getElementById('team-carousel');
  if (!root) return;
  root.innerHTML = '<div class="team-track"></div>';
  let artists;
  try { artists = await NMDContent.artists(); }
  catch (error) { root.textContent = 'No se pudo cargar TEAM. Recarga la página.'; console.error(error); return; }
  if (!artists.length) { root.hidden = true; return; }
  const track = root.querySelector('.team-track');
  let current = Math.min(2, artists.length - 1);
  const cards = artists.map(artist => {
    const card = document.createElement('article');
    card.className = 'team-card';
    card.dataset.role = artist.role;
    const inner = document.createElement('div');
    inner.className = 'team-card__inner';
    const img = document.createElement('img');
    img.src = artist.image; img.alt = artist.name; img.draggable = false;
    const meta = document.createElement('div'); meta.className = 'team-card__meta';
    const name = document.createElement('h3'); name.textContent = artist.name;
    const role = document.createElement('span'); role.className = 'team-card__role'; role.textContent = artist.role;
    meta.append(name, role);
    const link = document.createElement('a'); link.href = NMDContent.profileURL(artist.id); link.textContent = 'View Profile';
    const photoLink = document.createElement('a');
    photoLink.className = 'team-card__photo'; photoLink.href = link.href; photoLink.draggable = false;
    photoLink.setAttribute('aria-label', 'View profile: ' + artist.name);
    photoLink.append(img);
    inner.append(photoLink, meta);
    const specialty = typeof artist.bio === 'string' ? artist.bio.trim() : '';
    if (specialty) {
      const description = document.createElement('p');
      description.className = 'team-card__specialty';
      description.textContent = specialty;
      inner.append(description);
    }
    inner.append(link); card.append(inner); track.append(card); return card;
  });
  let visibleCards = cards;
  let renderedCards = [];
  let cycleWidth = 0, loopStart = 0;
  let start = null, origin = 0, dragged = false;
  const step = 500;
  const modulo = (value, length) => ((value % length) + length) % length;

  function rebuildLoop(index = 0) {
    track.replaceChildren();
    renderedCards = [];
    cycleWidth = visibleCards.length * step;
    // Keep at least four cards on either side, even for a single guest.
    const sideCycles = visibleCards.length ? Math.ceil(4 / visibleCards.length) : 0;
    loopStart = sideCycles * cycleWidth;
    for (let cycle = 0; cycle < sideCycles * 2 + 1; cycle++) {
      visibleCards.forEach(card => {
        const copy = card.cloneNode(true);
        copy.hidden = false;
        track.append(copy);
        renderedCards.push(copy);
      });
    }
    start = null;
    root.classList.remove('is-dragging');
    track.scrollLeft = loopStart + index * step;
    render();
  }
  function render() {
    if (!cycleWidth) {
      return;
    }
    const previous = track.scrollLeft;
    const wrapped = loopStart + modulo(previous - loopStart, cycleWidth);
    if (Math.abs(wrapped - previous) > 1) {
      track.scrollLeft = wrapped;
      // Preserve the pointer's position when wrapping during a drag.
      if (start !== null) origin += wrapped - previous;
    }
    const position = (track.scrollLeft - loopStart) / step;
    current = modulo(Math.round(position), visibleCards.length);
    const physicalIndex = Math.round(track.scrollLeft / step);
    renderedCards.forEach((card, i) => card.classList.toggle('is-active', i === physicalIndex));
  }
  const filters = [...document.querySelectorAll('[data-team-filter]')];
  function filterBy(value) {
    visibleCards = cards.filter(card => value === 'all' || card.dataset.role === value);
    filters.forEach(filter => {
      const active = filter.dataset.teamFilter === value;
      filter.setAttribute('aria-pressed', String(active));
      filter.style.color = active ? '#fff' : '#727272';
      filter.style.textDecoration = active ? 'underline' : 'none';
    });
    rebuildLoop();
  }
  filters.forEach(filter => {
    filter.addEventListener('click', () => filterBy(filter.dataset.teamFilter));
    filter.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); filter.click(); }
    });
  });
  track.addEventListener('scroll', render, { passive: true });
  root.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); track.scrollLeft += event.key === 'ArrowRight' ? 500 : -500;
    }
  });
  track.addEventListener('wheel', event => {
    if (!event.deltaX || Math.abs(event.deltaY) > Math.abs(event.deltaX)) return;
    const delta = event.deltaX;
    const amount = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 500 : 1);
    const max = track.scrollWidth - track.clientWidth;
    if ((amount < 0 && track.scrollLeft > 0) || (amount > 0 && track.scrollLeft < max)) {
      event.preventDefault(); track.scrollLeft += amount;
    }
  }, { passive: false });
  track.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    start = event.clientX; origin = track.scrollLeft; dragged = false;
  });
  window.addEventListener('pointermove', event => {
    if (start === null) return;
    const distance = (event.clientX - start) / (root.getBoundingClientRect().width / root.offsetWidth);
    if (Math.abs(distance) > 5) {
      dragged = true; root.classList.add('is-dragging');
      track.setPointerCapture(event.pointerId); track.scrollLeft = origin - distance;
    }
  });
  function finish() { start = null; root.classList.remove('is-dragging'); }
  window.addEventListener('pointerup', finish);
  track.addEventListener('pointercancel', finish);
  track.addEventListener('dragstart', event => event.preventDefault());
  track.addEventListener('click', event => { if (dragged) { event.preventDefault(); event.stopPropagation(); dragged = false; } }, true);
  rebuildLoop(current);
})();
