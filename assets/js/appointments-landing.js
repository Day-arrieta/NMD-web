/* Página de citas: appointments.html (escenario de escritorio, 1920px) y exact-mobile-appointments.html (escenario
   móvil, 440px). Convierte las filas del F.A.Q. del Figma en <details> y alarga el escenario (alto fijo) cuando se abren
   respuestas. La posición de la lista y el espacio debajo se leen del export del Figma, así sirve para los dos. */
(() => {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const textNodes = [...stage.querySelectorAll('div')].filter(el => !el.querySelector('div') && el.textContent.trim());
  const question = textNodes.find(el => el.textContent.trim() === 'Do you accept walk-ins?');
  if (!question) return;
  const list = question.parentElement.parentElement;

  // Medidas del Figma antes de reemplazar las filas: top de la lista dentro del escenario (suma de los matrix()), tamaño
  // base del escenario (CSS de la página) y espacio bajo la lista. Escritorio: 3172 + 552, 1920 x 4836, 80. Móvil: 2742, 440 x 3886, 24.
  const matrixY = el => { const m = (el.getAttribute('style') || '').match(/matrix\(([^)]*)\)/); return m ? +m[1].split(',')[5] : 0; };
  let listTop = 0;
  for (let el = list; el && el !== stage; el = el.parentElement) listTop += matrixY(el);
  const baseHeight = stage.offsetHeight, stageWidth = stage.offsetWidth;
  const gap = Math.max(0, baseHeight - listTop - list.offsetHeight);

  const rows = [...list.children];
  const panels = rows.map((row, i) => {
    const texts = [...row.querySelectorAll('div')].filter(el => !el.querySelector('div,svg') && el.textContent.trim());
    const details = document.createElement('details');
    details.open = i === 2;
    const summary = document.createElement('summary');
    summary.textContent = texts[0].textContent;
    const answer = document.createElement('div');
    answer.className = 'faq-answer';
    if (texts.length > 1) answer.textContent = texts.slice(1).map(el => el.textContent.trim()).join(' ');
    else {
      // Opens an email to the studio with the question already in the subject.
      const link = document.createElement('a');
      link.href = 'mailto:info@nomadttt.com?subject=' + encodeURIComponent(texts[0].textContent.trim());
      link.textContent = 'Ask the studio about this question.';
      answer.append(link);
    }
    details.append(summary, answer);
    return details;
  });
  list.replaceChildren(...panels);
  list.classList.add('appointment-faq');
  list.style.height = 'auto';
  if (list.parentElement !== stage) list.parentElement.style.overflow = 'visible';
  const style = document.createElement('style');
  style.textContent = `.appointment-faq{display:flex;flex-direction:column;gap:12px;color:#fff;font:24px/24px 'Radio Grotesk',sans-serif}.appointment-faq details{background:#181818;border-radius:8px}.appointment-faq summary{list-style:none;cursor:pointer;padding:20px 24px;position:relative;padding-right:56px}.appointment-faq summary::-webkit-details-marker{display:none}.appointment-faq summary:after{content:'▾';position:absolute;top:20px;right:24px;color:#d9d9d9}.appointment-faq summary:focus-visible{outline:2px solid #FDDE36;outline-offset:2px}.appointment-faq .faq-answer{padding:0 24px 28px;color:#bcbcbc}.appointment-faq a{color:inherit}`;
  document.head.append(style);

  const wrap = document.querySelector('.wrap');
  function resize() {
    const height = Math.max(baseHeight, listTop + list.offsetHeight + gap);
    stage.style.height = height + 'px';
    if (wrap) wrap.style.height = height * Math.min(1, innerWidth / stageWidth) + 'px';
  }
  // Enlaces internos ("Ask the studio…" y "Contact" en escritorio → #appointment-studio). El salto del navegador también
  // desplaza .wrap (overflow:hidden sigue siendo un contenedor con scroll) y esconde el principio de la página:
  // .wrap pasa a overflow:clip y se desplaza la ventana.
  if (wrap && window.CSS && CSS.supports('overflow', 'clip')) wrap.style.overflow = 'clip';
  stage.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest && event.target.closest('a[href^="#"]');
    const target = link && document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
    if (!target) return;
    event.preventDefault();
    if (wrap) wrap.scrollTop = 0;
    const top = window.scrollY + target.getBoundingClientRect().top - 24;
    window.scrollTo({ top: Math.max(0, top), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    target.focus({ preventScroll: true });
  });

  panels.forEach(panel => panel.addEventListener('toggle', resize));
  window.addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
  resize();
})();
