/* F.A.Q. y políticas.
   · Escritorio (exact-desktop-f-a-q.html): el contenido está escrito en el HTML de la página (.policies), dentro del
     escenario de 1920px. Es la única fuente del texto.
   · Móvil (exact-mobile-f-a-q.html): la página trae ese mismo .policies con fetch desde la página de escritorio y lo
     inserta en [data-policies-src]. Si no se puede traer, se muestra el enlace de respaldo que ya está en el HTML.
   Comportamiento común: un apartado abierto a la vez y los enlaces #faq, #shipping, #returns, #terms y #privacy abren
   su apartado sin recargar la página. Solo en escritorio: el footer se recorre hacia abajo cuando el contenido crece y
   el título grande sigue al apartado abierto. */
(() => {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const slot = stage.querySelector('[data-policies-src]');
  if (slot) load(slot);
  else if (stage.querySelector('.policies')) setup(stage.querySelector('.policies'), true);

  function load(slot) {
    fetch(slot.dataset.policiesSrc)
      .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.text(); })
      .then(html => {
        const source = new DOMParser().parseFromString(html, 'text/html').querySelector('.policies');
        if (!source) throw new Error('.policies not found');
        const list = document.importNode(source, true);
        list.removeAttribute('style'); // posición absoluta del escenario de escritorio
        slot.replaceChildren(list);
        slot.removeAttribute('aria-busy');
        setup(list, false);
      })
      .catch(() => {
        slot.classList.add('is-failed');
        slot.removeAttribute('aria-busy');
        const link = slot.querySelector('a[href]');
        if (link && location.hash) link.setAttribute('href', link.getAttribute('href').split('#')[0] + location.hash);
        if (typeof window.fit === 'function') window.fit();
      });
  }

  function setup(list, desktop) {
    const STAGE_H = 2689, SLOT_H = 680, FOOTER_Y = 1392;
    const TITLES = {
      faq: ['F.A.Q.', ''], shipping: ['Shipping', ''], returns: ['Return', 'Policies'],
      terms: ['Terms &', 'Conditions'], privacy: ['Privacy', 'Policy'],
    };

    const matrixY = el => { const m = (el.getAttribute('style') || '').match(/matrix\(([^)]*)\)/); return m ? +m[1].split(',')[5] : null; };
    const footer = desktop ? [...stage.children].find(el => matrixY(el) === FOOTER_Y) : null;
    const rail = desktop ? [...stage.children].find(el => /height:2689(\.0)?px/.test(el.getAttribute('style') || '')) : null;
    const bigText = text => [...stage.querySelectorAll('div')].find(el => !el.children.length && el.textContent.trim() === text && el.style.fontSize === '160px');
    const titleTop = desktop ? bigText('Terms &') : null, titleBottom = desktop ? bigText('Conditions') : null;
    const samePage = path => path.replace(/\.html$/, ''); // Netlify sirve /pagina y /pagina.html
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let scrolledByOpen = null;
    // .wrap (overflow:hidden) sigue siendo un contenedor con scroll: el salto del navegador a #apartado al cargar lo
    // desplazaba y escondía el principio de la página. Con overflow:clip ya no se puede desplazar.
    const wrap = document.querySelector('.wrap');
    if (wrap && window.CSS && CSS.supports('overflow', 'clip')) wrap.style.overflow = 'clip';

    function setTitle(id) {
      const t = TITLES[id]; if (!t || !titleTop || !titleBottom) return;
      titleTop.textContent = t[0]; titleBottom.textContent = t[1];
    }
    function reflow() {
      if (desktop) {
        const delta = Math.max(0, list.offsetHeight - SLOT_H);
        if (footer) footer.style.transform = footer.style.transform.replace(/matrix\(([^)]*)\)/, (m, v) => { const p = v.split(','); p[5] = String(FOOTER_Y + delta); return 'matrix(' + p.join(',') + ')'; });
        if (rail) rail.style.height = (STAGE_H + delta) + 'px';
        stage.style.height = (STAGE_H + delta) + 'px';
      }
      // En móvil el escenario tiene alto automático: fit() vuelve a medirlo y ajusta la escala y el alto de .wrap.
      if (typeof window.fit === 'function') window.fit();
    }
    // No usar scrollIntoView: desplazaría el contenedor .wrap (overflow:hidden) en lugar de la ventana.
    function scrollToPolicy(target, behavior) {
      if (wrap) wrap.scrollTop = 0;
      const top = target.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: Math.max(0, top), behavior });
    }
    function open(id, scroll) {
      const target = id && document.getElementById(id);
      if (!target || !target.classList.contains('policy') || !list.contains(target)) return false;
      if (!target.open) scrolledByOpen = target;
      // Cerrar los demás antes de medir: si no, la página se encoge después de calcular el desplazamiento.
      list.querySelectorAll('details.policy[open]').forEach(other => { if (other !== target) other.open = false; });
      target.open = true;
      setTitle(id);
      reflow();
      if (scroll) scrollToPolicy(target, reducedMotion.matches ? 'auto' : 'smooth');
      return true;
    }

    // El apartado abierto de inicio (sin #hash en la URL) no debe reescribir la URL a #faq al cargar.
    const initiallyOpen = list.querySelector('details.policy[open]');
    let pristine = !location.hash;
    // Un solo apartado abierto a la vez; el título grande sigue al apartado abierto.
    list.addEventListener('toggle', event => {
      const el = event.target;
      const opened = el.classList && el.classList.contains('policy') && el.open;
      if (opened) {
        list.querySelectorAll('details.policy[open]').forEach(other => { if (other !== el) other.open = false; });
        setTitle(el.id);
        if (pristine && el === initiallyOpen) { /* carga inicial: la URL se queda como está */ }
        else { pristine = false; if (location.hash !== '#' + el.id) history.replaceState(null, '', '#' + el.id); }
      }
      reflow();
      // Móvil: al cerrarse un apartado largo de arriba, el que se acaba de tocar sube fuera de la pantalla; volver a él.
      if (opened && !desktop && el !== scrolledByOpen) {
        if (el.getBoundingClientRect().top < 0) scrollToPolicy(el, 'auto');
      }
      if (el === scrolledByOpen) scrolledByOpen = null;
    }, true);
    // Enlaces a esta misma página con #apartado: abrir sin recargar (evita el fundido de salida de la página).
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const a = event.target.closest && event.target.closest('a[href]');
      if (!a) return;
      const url = new URL(a.getAttribute('href'), location.href);
      if (samePage(url.pathname) !== samePage(location.pathname) || !url.hash) return;
      event.preventDefault(); event.stopPropagation();
      document.body.classList.remove('is-leaving');
      open(url.hash.slice(1), true);
    }, true);
    window.addEventListener('hashchange', () => { document.body.classList.remove('is-leaving'); open(location.hash.slice(1), true); });
    window.addEventListener('resize', reflow);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reflow);

    // Al llegar con #apartado: salto directo, sin animación (un scroll suave lanzado mientras carga la página puede
    // no arrancar) y repetido en load, porque el navegador puede volver a mover el scroll mientras carga.
    const initial = location.hash.slice(1);
    if (open(initial, false)) {
      const jump = () => scrollToPolicy(document.getElementById(initial), 'auto');
      jump();
      if (document.readyState !== 'complete') window.addEventListener('load', jump, { once: true });
    } else {
      const opened = list.querySelector('details.policy[open]');
      if (opened) setTitle(opened.id);
    }
    reflow();
  }
})();
