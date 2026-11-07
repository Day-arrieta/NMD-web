/* Aparición progresiva al hacer scroll (todas las páginas que lo cargan).
   · Cada bloque entra con un fundido y un desplazamiento corto hacia arriba cuando llega a la pantalla;
     si entran varios a la vez, aparecen escalonados (de arriba abajo y de izquierda a derecha).
   · Usa la propiedad CSS `translate`, que se suma al `transform` con el que las páginas del Figma
     posicionan cada elemento, así que nada cambia de lugar.
   · Páginas del Figma (#stage): se animan sus bloques; un grupo alto (más del 40 % de la pantalla) se divide
     en sus partes. Carruseles, mapas y acordeones se animan como un bloque (no por dentro).
   · Páginas hechas a mano (tienda, producto): se animan los bloques de REVEAL_SELECTORS, incluidos
     los que se dibujan después (tarjetas de producto al filtrar).
   · No se anima nada con "reducir movimiento" activado, dentro del menú en iframe (?embed=1)
     ni sin IntersectionObserver; sin JavaScript todo se ve normal.
   · window.nmdRevealNow(el): para los saltos dentro de la página (section-scroll.js, appointments-landing.js,
     faq-page.js…), muestra al instante el bloque del destino antes de medirlo. */
(() => {
  if (/[?&]embed=1(&|$)/.test(location.search)) return;              // el menú del iframe tiene su propia animación
  if (!('IntersectionObserver' in window)) return;
  const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced && reduced.matches) return;

  const DURATION = 800, STEP = 90, MAX_DELAY = 540;
  // Bloques que nunca se dividen por dentro (tienen su propio movimiento o deben verse completos).
  const ATOMIC = '#team-carousel, .mt-scroller, .policies, .appointment-faq, .nmd-location-map, iframe, a, button, details, form';
  // Nunca se animan: navegación fija, carrito, menú, formularios.
  const SKIP = '#nmd-rail-fixed, #nmd-topbar, .cart-drawer, .nmd-ov, .submenu, .toast, [inert], [aria-hidden="true"], script, style, template';
  // Páginas sin #stage.
  const REVEAL_SELECTORS = '.head, .grid > *, .pdp .gallery, .pdp .info > :not([hidden]), .notfound, .reco h2, .reco-grid > *, .main > footer';

  const css = document.createElement('style');
  // «#stage .nmd-reveal» gana a «#stage a{transition:opacity …}» de las páginas del Figma: los enlaces también se
  // deslizan y respetan el escalonado. Las clases se quitan al terminar y vuelve la transición propia del enlace.
  css.textContent =
    '#stage .nmd-reveal,.nmd-reveal{opacity:0;translate:0 28px;transition:opacity ' + DURATION + 'ms cubic-bezier(.22,1,.36,1),translate ' + DURATION + 'ms cubic-bezier(.22,1,.36,1);transition-delay:var(--nmd-reveal-delay,0ms)}' +
    '#stage .nmd-reveal.is-in,.nmd-reveal.is-in{opacity:1;translate:0 0}' +
    '@media print{#stage .nmd-reveal,.nmd-reveal{opacity:1!important;translate:none!important}}';
  document.head.appendChild(css);

  const seen = new WeakSet();
  // Quita las clases para no dejar estilos pendientes (p. ej. al medir posiciones).
  const done = el => { el.classList.remove('nmd-reveal', 'is-in'); el.style.removeProperty('--nmd-reveal-delay'); };
  // Muestra varios bloques escalonados (de arriba abajo y de izquierda a derecha).
  function show(els) {
    els
      .map(el => ({ el, r: el.getBoundingClientRect() }))
      .sort((a, b) => (a.r.top - b.r.top) || (a.r.left - b.r.left))
      .forEach(({ el }, i) => {
        el.style.setProperty('--nmd-reveal-delay', Math.min(i * STEP, MAX_DELAY) + 'ms');
        el.classList.add('is-in');
        io.unobserve(el);
        setTimeout(() => done(el), DURATION + MAX_DELAY + 100);
      });
  }
  const io = new IntersectionObserver(entries => show(entries.filter(e => e.isIntersecting).map(e => e.target)),
    { rootMargin: '0px 0px -8% 0px', threshold: 0 });

  // Saltos dentro de la página (flechas, enlaces #…): llamar antes de medir el destino. Muestra al instante, sin
  // animación, el bloque que lo contiene; si no, la medida incluye los 28px de desplazamiento y el salto queda corto.
  window.nmdRevealNow = el => {
    for (let r = el && el.closest && el.closest('.nmd-reveal'); r; r = r.parentElement && r.parentElement.closest('.nmd-reveal')) {
      const prev = r.style.transition;
      r.style.transition = 'none';
      io.unobserve(r);
      done(r);
      void r.offsetWidth;            // aplica el estado final antes de devolver la transición
      r.style.transition = prev;
    }
  };

  function register(el) {
    if (!el || seen.has(el) || el.closest(SKIP)) return;
    seen.add(el);
    el.classList.add('nmd-reveal');
    io.observe(el);
  }
  const hasContent = el => el.textContent.trim() || el.querySelector('img,svg,iframe,video') ||
    (el.getAttribute('style') || '').includes('background') || el.offsetHeight <= 2 || el.offsetWidth <= 2;

  // Páginas del Figma: bloques del escenario; los más altos que la pantalla se dividen en sus partes.
  function collectStage(stage) {
    const scale = (stage.getBoundingClientRect().width / stage.offsetWidth) || 1;
    const limit = window.innerHeight * 0.4;          // grupos más altos que esto se animan por partes
    const stageH = stage.offsetHeight;
    (function visit(parent, depth) {
      [...parent.children].forEach(el => {
        if (el.matches(SKIP)) return;
        const w = el.offsetWidth, h = el.offsetHeight;
        if (!w && !h) return;
        if (w <= 120 && h >= stageH * 0.8) return;                       // riel blanco estático del Figma
        // Grupo alto con varias partes → se anima por partes (un carrusel o acordeón dentro queda entero).
        if (h * scale > limit && depth < 4 && el.children.length > 1 && !el.matches(ATOMIC)) {
          visit(el, depth + 1);
        } else if (el.matches(ATOMIC) || hasContent(el)) {   // el carrusel puede estar vacío al cargar (llega del CMS)
          register(el);
        }
      });
    })(stage, 0);
  }

  function scan() {
    const stage = document.getElementById('stage');
    if (stage) collectStage(stage);
    document.querySelectorAll(REVEAL_SELECTORS).forEach(register);
  }

  // Tarjetas y bloques que se dibujan después (catálogo, recomendados).
  let pending = null;
  const mo = new MutationObserver(() => {
    if (pending) return;
    pending = setTimeout(() => { pending = null; document.querySelectorAll(REVEAL_SELECTORS).forEach(register); }, 60);
  });

  // Red de seguridad del observer (se revisa al desplazar, al cargar y al cambiar el tamaño):
  // · Un bloque pegado al borde inferior de un contenedor que recorta (overflow:hidden) queda fuera de él por los
  //   28px del desplazamiento y el observer nunca lo ve: se revela al pasar la misma línea de activación.
  // · Al final de la página, lo último (p. ej. la línea inferior del pie) nunca sube hasta esa línea: al llegar al
  //   fondo se revela todo lo que está en pantalla. Una página que no se desplaza ya está en el fondo.
  // · Lo que quedó arriba sin revelarse (un salto rápido) se muestra sin animación.
  function catchUp() {
    const vh = window.innerHeight;
    const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 4;
    const line = atBottom ? vh : vh * 0.92;                   // misma línea que el rootMargin del observer
    const inView = [];
    document.querySelectorAll('.nmd-reveal:not(.is-in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;                      // oculto (acordeón cerrado…): lo revela el observer
      if (r.bottom - 28 <= 0) { io.unobserve(el); done(el); } // ya pasó: sin animación
      else if (r.top - 28 < line) inView.push(el);
    });
    if (inView.length) show(inView);
  }
  let ticking = false;
  const check = () => {
    if (ticking) return;
    ticking = true;
    setTimeout(() => { ticking = false; catchUp(); }, 120);
  };
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);

  function start() {
    scan();
    mo.observe(document.body, { childList: true, subtree: true });
    // Un poco después de la primera pasada del observer, para que la fila de abajo entre al final.
    setTimeout(catchUp, 300);
    if (document.readyState !== 'complete') window.addEventListener('load', () => setTimeout(catchUp, 300), { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // Imprimir: todo visible.
  window.addEventListener('beforeprint', () => document.querySelectorAll('.nmd-reveal').forEach(el => el.classList.add('is-in')));
})();
