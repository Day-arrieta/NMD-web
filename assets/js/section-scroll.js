(() => {
  const arrows = document.querySelectorAll('[data-scroll-target], [data-scroll-page]');
  arrows.forEach(arrow => {
    arrow.style.cursor = 'pointer';
    const go = event => {
      if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
      if (arrow.dataset.scrollPage) {event.preventDefault();event.stopImmediatePropagation();location.href=arrow.dataset.scrollPage;return;}
      const target = document.getElementById(arrow.dataset.scrollTarget);
      if (!target) return;
      event.preventDefault();event.stopImmediatePropagation();
      if (window.nmdRevealNow) window.nmdRevealNow(target);   // scroll-reveal.js: medir sin el desplazamiento de la animación
      const top = window.scrollY + target.getBoundingClientRect().top - 24;
      window.scrollTo({top:Math.max(0,top),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    };
    arrow.addEventListener('click', go, true);
    arrow.addEventListener('keydown', go, true);
  });
})();
