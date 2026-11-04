(async () => {
  const root = document.getElementById('team-carousel');
  if (!root) return;
  root.innerHTML = '<div class="team-track"></div><div class="team-controls"><span aria-live="polite" class="team-count"></span></div>';
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
    inner.append(photoLink, meta, link); card.append(inner); track.append(card); return card;
  });
  const controls = root.querySelector('.team-controls');
  const bar = document.createElement('input');
  bar.type = 'range'; bar.min = 0; bar.max = cards.length - 1; bar.step = 'any';
  bar.className = 'team-progress'; bar.setAttribute('aria-label', 'Scroll team');
  controls.prepend(bar);
  let visibleCards = cards;
  function render() {
    current = Math.min(visibleCards.length - 1, Math.round(track.scrollLeft / 500));
    cards.forEach(card => card.classList.remove('is-active'));
    visibleCards.forEach((card, i) => card.classList.toggle('is-active', i === current));
    bar.value = track.scrollLeft / 500;
    root.querySelector('.team-count').textContent = `${String(current + 1).padStart(2, '0')}/${String(visibleCards.length).padStart(2, '0')}`;
  }
  const filters = [...document.querySelectorAll('[data-team-filter]')];
  function filterBy(value) {
    cards.forEach(card => { card.hidden = value !== 'all' && card.dataset.role !== value; });
    visibleCards = cards.filter(card => !card.hidden);
    filters.forEach(filter => {
      const active = filter.dataset.teamFilter === value;
      filter.setAttribute('aria-pressed', String(active));
      filter.style.color = active ? '#fff' : '#727272';
      filter.style.textDecoration = active ? 'underline' : 'none';
    });
    bar.max = Math.max(0, visibleCards.length - 1);
    bar.disabled = visibleCards.length <= 1;
    track.scrollLeft = 0;
    render();
  }
  filters.forEach(filter => {
    filter.addEventListener('click', () => filterBy(filter.dataset.teamFilter));
    filter.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); filter.click(); }
    });
  });
  track.addEventListener('scroll', render, { passive: true });
  bar.addEventListener('input', () => { track.scrollLeft = Number(bar.value) * 500; });
  root.addEventListener('keydown', event => {
    if (event.target === bar) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); track.scrollLeft += event.key === 'ArrowRight' ? 500 : -500;
    }
  });
  track.addEventListener('wheel', event => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    const amount = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 500 : 1);
    const max = track.scrollWidth - track.clientWidth;
    if ((amount < 0 && track.scrollLeft > 0) || (amount > 0 && track.scrollLeft < max)) {
      event.preventDefault(); track.scrollLeft += amount;
    }
  }, { passive: false });
  let start = null, origin = 0, dragged = false;
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
  track.scrollLeft = current * 500;
  render();
})();
