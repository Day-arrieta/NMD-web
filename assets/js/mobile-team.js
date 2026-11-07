/* Mobile TEAM section (exact-mobile-home.html, exact-mobile-work.html).
   Replaces the three Figma "Rubén" placeholder cards with the published CMS artists in a horizontal scroller that keeps the
   Figma layout (centred 260px card, neighbours peeking at 20% opacity), each card linking to the mobile profile page.
   Also wires the All / Residents / Guests filters and the previous / next arrows found in the section. */
(() => {
  const stage = document.getElementById('stage');
  const heading = stage && [...stage.querySelectorAll('div')]
    .find(el => !el.childElementCount && el.textContent.trim() === 'TEAM');
  const section = heading && heading.parentElement;
  // Same anchor as the desktop TEAM heading, so desktop deep links (#team-heading) still land here.
  if (heading && !document.getElementById('team-heading')) heading.id = 'team-heading';
  if (!section || !window.NMDContent) return;

  const matrix = el => ((el.style.transform.match(/matrix\(([^)]+)\)/) || [])[1] || '1,0,0,1,0,0').split(',').map(Number);
  const children = [...section.children];
  const placeholders = children.filter(el => el.textContent.includes('View Profile'));
  const template = placeholders.find(el => !el.style.opacity) || placeholders[0];
  if (!template) return;

  // Figma geometry (section coordinates): the section starts 210px left of the stage; the active card sits at x=300.
  const stageWidth = stage.offsetWidth || 440;
  const sectionX = matrix(section)[4];
  const [, , , , cardX, cardY] = matrix(template);
  const cardWidth = parseFloat(template.style.width) || 260;
  const ghostXs = placeholders.map(el => matrix(el)[4]).sort((a, b) => a - b);
  const gap = ghostXs.length > 1 ? ghostXs[1] - ghostXs[0] - cardWidth : 40;
  const step = cardWidth + gap;
  const centre = -sectionX + stageWidth / 2;

  const css = document.createElement('style');
  css.textContent = `
    .mt-scroller{position:absolute;display:flex;gap:${gap}px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain;z-index:1}
    .mt-scroller::-webkit-scrollbar{display:none}
    #stage .mt-card{position:relative;flex:0 0 ${cardWidth}px;display:block;color:inherit;text-decoration:none;scroll-snap-align:center;transition:opacity .3s}
    #stage .mt-card:not(.is-active){opacity:.2}
    #stage .mt-card:not(.is-active) .mt-view{visibility:hidden}
    #stage .mt-card[hidden]{display:none}
    .mt-card:focus-visible,.mt-arrow:focus-visible,.mt-filter:focus-visible{outline:2px solid #fff;outline-offset:4px}
    .mt-card img{display:block;width:100%;height:100%;object-fit:cover;border-radius:8px}
    .mt-empty{flex:0 0 ${cardWidth}px;align-self:center;text-align:center;color:#727272;font:20px/24px 'Radio Grotesk',sans-serif}
    .mt-arrow,.mt-filter{cursor:pointer;-webkit-tap-highlight-color:transparent}
    .mt-arrow{z-index:2;overflow:visible!important}.mt-arrow::before{content:'';position:absolute;inset:-6px}
    @media (prefers-reduced-motion:reduce){#stage .mt-card{transition:none}}`;
  document.head.append(css);

  // Hide the placeholders right away (this script runs at the end of <body>, before first paint).
  placeholders.forEach(el => el.remove());
  const scroller = document.createElement('div');
  scroller.className = 'mt-scroller';
  scroller.setAttribute('role', 'group');
  scroller.setAttribute('aria-label', 'Team artists');
  scroller.style.cssText += `left:${-sectionX}px;top:${cardY}px;width:${stageWidth}px;height:${template.style.height};` +
    `padding:0 ${cardX + sectionX}px;scroll-padding:0 ${cardX + sectionX}px`;
  heading.after(scroller);

  // Arrows: 32px icons left/right of the active card. The Work page only has "next", so "previous" is its mirror image.
  const arrows = children.filter(el => parseFloat(el.style.width) === 32 && el.querySelector('svg'));
  let prev = arrows.find(el => matrix(el)[4] < centre);
  let next = arrows.find(el => matrix(el)[4] > centre);
  const mirror = (el, toPrev) => {
    const [, , , , x, y] = matrix(el);
    const copy = el.cloneNode(true);
    copy.style.transform = toPrev ? `matrix(0,1,-1,0,${2 * centre - x},${y - 32})` : `matrix(0,-1,1,0,${2 * centre - x},${y + 32})`;
    return copy;
  };
  if (next && !prev) prev = mirror(next, true);
  if (prev && !next) next = mirror(prev, false);
  // Reading / tab order follows the visual order: filters, TEAM, cards, previous, next, "View Our Work".
  scroller.after(...[prev, next].filter(Boolean));

  let cards = [];
  let visible = [];
  let active = 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function render() {
    active = Math.max(0, Math.min(visible.length - 1, Math.round(scroller.scrollLeft / step)));
    cards.forEach(card => card.classList.toggle('is-active', card === visible[active]));
    if (prev) prev.style.visibility = active > 0 ? '' : 'hidden';
    if (next) next.style.visibility = active < visible.length - 1 ? '' : 'hidden';
  }
  function go(index) {
    scroller.scrollTo({left: index * step, behavior: reduceMotion.matches ? 'auto' : 'smooth'});
  }
  function message(text) {
    const p = document.createElement('p'); p.className = 'mt-empty'; p.textContent = text;
    return p;
  }

  [[prev, -1, 'Previous artist'], [next, 1, 'Next artist']].forEach(([arrow, delta, label]) => {
    if (!arrow) return;
    arrow.classList.add('mt-arrow');
    arrow.setAttribute('role', 'button');
    arrow.setAttribute('tabindex', '0');
    arrow.setAttribute('aria-label', label);
    arrow.style.visibility = 'hidden';
    arrow.addEventListener('click', () => go(active + delta));
    arrow.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); go(active + delta); }
    });
  });
  scroller.addEventListener('scroll', render, {passive: true});
  // Tapping a faded neighbour brings it to the centre instead of opening it.
  scroller.addEventListener('click', event => {
    const card = event.target.closest('.mt-card');
    const index = visible.indexOf(card);
    if (card && index !== active) { event.preventDefault(); go(index); }
  });

  // Filters: labels "All", "Residents", "Guests" (whichever exist); the label's own box is the hit area.
  const filters = [...section.querySelectorAll('div')]
    .filter(el => !el.childElementCount && /^(all|residents?|guests?)$/i.test(el.textContent.trim()))
    .map(label => {
      const text = label.textContent.trim();
      const value = /^all$/i.test(text) ? 'all' : /^resident/i.test(text) ? 'Resident' : 'Guest';
      const target = label.parentElement;
      target.classList.add('mt-filter');
      target.setAttribute('role', 'button');
      target.setAttribute('tabindex', '0');
      target.addEventListener('click', () => filterBy(value));
      target.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); filterBy(value); }
      });
      return {label, target, value, text};
    });
  if (filters.length) {
    const bar = filters[0].target.parentElement;
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Filter team');
    let group = bar;
    while (group.parentElement && group.parentElement !== section) group = group.parentElement;
    if (group.parentElement === section) section.prepend(group); // filters sit at the top of the section
  }

  function filterBy(value) {
    filters.forEach(filter => {
      const on = filter.value === value;
      filter.target.setAttribute('aria-pressed', String(on));
      filter.label.style.color = on ? 'rgba(255,255,255,1.0)' : 'rgba(114,114,114,1.0)';
    });
    visible = cards.filter(card => value === 'all' || card.dataset.role === value);
    cards.forEach(card => { card.hidden = !visible.includes(card); });
    // Mark the first card before the scroll write below forces a style flush, so it does not fade in from 20%.
    cards.forEach(card => card.classList.toggle('is-active', card === visible[0]));
    scroller.querySelectorAll('.mt-empty').forEach(el => el.remove());
    if (!visible.length) {
      const filter = filters.find(f => f.value === value);
      scroller.append(message(`No ${filter ? filter.text.toLowerCase() : 'artists'} right now.`));
    }
    scroller.scrollLeft = 0;
    render();
  }

  // Card = a copy of the Figma card (photo, name + role pill, "View Profile" bar) wrapped in a link.
  function buildCard(artist) {
    const card = document.createElement('a');
    card.className = 'mt-card';
    card.href = NMDContent.profileURL(artist.id, true);
    card.dataset.role = artist.role;
    card.setAttribute('aria-label', `View profile: ${artist.name}, ${artist.role}`);
    card.append(...template.cloneNode(true).childNodes);
    const [photo, meta] = card.children;
    const [row] = meta.children;
    const [name, pill] = row.children;
    photo.style.backgroundImage = 'none';
    const img = document.createElement('img');
    img.src = artist.image; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.draggable = false;
    photo.append(img);
    name.textContent = artist.name;
    // Name runs up to the role pill (8px gap); fitNames() shrinks it if needed.
    Object.assign(name.style, {width: (matrix(pill)[4] - 8) + 'px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis'});
    pill.firstElementChild.textContent = artist.role;
    // "View Profile" bar: shown only on the selected (active) card.
    const view = [...meta.querySelectorAll('div')].find(el => el.textContent.trim() === 'View Profile');
    if (view) (view.closest('[style*="inset"]') || view).classList.add('mt-view');
    return card;
  }
  function fitNames() {
    cards.forEach(card => {
      const name = card.children[1].children[0].children[0];
      const base = parseFloat(getComputedStyle(name).fontSize);
      for (let size = base; size > 16 && name.scrollWidth > name.clientWidth + 1; size -= 1) name.style.fontSize = (size - 1) + 'px';
    });
  }

  NMDContent.artists().then(artists => {
    if (!artists.length) { scroller.append(message('Team coming soon.')); return; }
    cards = artists.map(buildCard);
    scroller.append(...cards);
    filterBy('all');
    document.fonts.ready.then(fitNames, fitNames);
    // The heading id is set after load, so the browser's own jump to #team-heading has already been missed.
    if (location.hash === '#team-heading') {
      if (window.nmdRevealNow) window.nmdRevealNow(heading);   // scroll-reveal.js: measure without the reveal offset
      window.scrollTo({ top: heading.getBoundingClientRect().top + window.scrollY - 24 });
    }
  }).catch(error => {
    console.error(error);
    scroller.append(message('Could not load TEAM. Please reload the page.'));
  });
})();
