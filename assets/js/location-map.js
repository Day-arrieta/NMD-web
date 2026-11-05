(() => {
  const maps = [...document.querySelectorAll('.nmd-location-map iframe[data-map-src]')];
  const load = frame => {
    if (!frame.dataset.mapSrc) return;
    frame.addEventListener('load', () => frame.classList.add('is-loaded'), {once:true});
    frame.src = frame.dataset.mapSrc;
    delete frame.dataset.mapSrc;
  };
  if (!('IntersectionObserver' in window)) { maps.forEach(load); return; }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {load(entry.target);observer.unobserve(entry.target);}
    });
  }, {rootMargin:'1000px 0px'});
  maps.forEach(frame => observer.observe(frame));
})();
