/* ============================================================
   NMD19 — Tarjetas de producto del inicio y del menú ("New Items", "New In", "Shop").
   ------------------------------------------------------------
   En el diseño son tarjetas de relleno ("Coral Heart. / Totebag / $1,229.00").
   Este script las llena con productos reales del catálogo (local o de Shopify,
   los más nuevos primero, en orden de lectura de la página) y las convierte en
   enlaces a su producto. Requiere shop-config.js, shopify.js y catalog.js antes.
   ============================================================ */
(() => {
  if (typeof Catalog === 'undefined') return;
  const PLACEHOLDER = 'Coral Heart.';
  const BG = '[style*="background-image"]';
  const isName = e => !e.children.length && e.textContent.trim() === PLACEHOLDER;
  const leaf = (root, test) => [...root.querySelectorAll('div')].find(e => !e.children.length && test(e.textContent.trim()));

  // Un contenedor NO es una sola tarjeta si junta dos nombres, dos fotos o un enlace propio
  // (p. ej. el título "Shop"): un enlace encima taparía la otra tarjeta o ese enlace.
  const shared = el => [...el.querySelectorAll('div')].filter(isName).length > 1
    || el.querySelectorAll(BG).length > 1
    || !!el.querySelector('a[href]:not(.nmd-teaser-link)');

  // Tarjeta = el contenedor más cercano al nombre que tiene la foto y nada más de otra tarjeta.
  // Si el diseño no agrupa la foto y los textos (quedan sueltos dentro de una sección), la tarjeta
  // son el bloque de textos del nombre + la foto hermana más cercana, y el enlace cubre solo esas cajas.
  function tileFor(name){
    let part = name, el = name.parentElement;
    while (el && el !== document.body && !shared(el)) {
      const img = el.querySelector(BG);
      if (img) return { root: el, scope: el, img, name, pieces: [el] };
      part = el; el = el.parentElement;
    }
    if (!el || el === document.body) return null;
    const sibs = [...el.children], at = sibs.indexOf(part);
    const isPhoto = s => s.matches(BG) || (s.querySelectorAll(BG).length === 1 && !shared(s) && ![...s.querySelectorAll('div')].some(isName));
    const img = sibs.slice(0, at).reverse().concat(sibs.slice(at + 1)).find(isPhoto) || null;
    const photo = img && (img.matches(BG) ? img : img.querySelector(BG));
    return { root: el, scope: part, img: photo, name, pieces: img ? [part, img] : [part], box: true };
  }
  function tiles(){
    const seen = new Set();
    return [...document.querySelectorAll('div')].filter(isName).map(tileFor)
      .filter(t => t && !seen.has(t.scope) && seen.add(t.scope));
  }
  // Orden de lectura (arriba→abajo, izquierda→derecha), no el del DOM exportado: así "New Items"
  // del inicio muestra los productos más nuevos. Misma fila = tops a menos de media tarjeta.
  // Caja en pantalla que une las piezas de una tarjeta.
  function union(pieces){
    const rs = pieces.map(p => p.getBoundingClientRect());
    const left = Math.min(...rs.map(b => b.left)), top = Math.min(...rs.map(b => b.top));
    const right = Math.max(...rs.map(b => b.right)), bottom = Math.max(...rs.map(b => b.bottom));
    return { left, top, width: right - left, height: bottom - top };
  }
  function byPosition(a, b){
    const ra = union(a.pieces), rb = union(b.pieces);
    return Math.abs(ra.top - rb.top) < Math.min(ra.height, rb.height) / 2 ? ra.left - rb.left : ra.top - rb.top;
  }
  // La misma caja en px del contenedor (sin la escala del stage), para el enlace de una tarjeta suelta.
  function boxIn(el, pieces){
    const r = el.getBoundingClientRect(), k = (r.width / el.offsetWidth) || 1, u = union(pieces);
    return `left:${(u.left - r.left) / k}px;top:${(u.top - r.top) / k}px;width:${u.width / k}px;height:${u.height / k}px`;
  }
  const css = v => String(v).replace(/["\\\n]/g, '');
  // Nombre y subtítulo en una línea: un nombre largo termina en "…" en vez de pisar el subtítulo.
  function oneLine(el){
    const h = el.style.height;
    Object.assign(el.style, { display: 'block', height: 'auto', minHeight: h, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
  }
  const show = (found, on) => found.forEach(t => t.pieces.forEach(p => { p.style.visibility = on ? '' : 'hidden'; }));

  function fill(list, found){
    if (!found.length || !list.length) return;
    // Primero los disponibles (los más nuevos de Shopify llegan primero).
    const order = list.filter(p => p.available !== false).concat(list.filter(p => p.available === false));
    found.slice().sort(byPosition).forEach((t, i) => {
      const { root, scope, img, name } = t, p = order[i % order.length];
      const src = p.thumb || p.img;
      if (img) img.style.backgroundImage = src ? `url("${css(src)}")` : 'none';   // nunca la foto de otro producto
      name.textContent = p.name + '.'; oneLine(name);
      const sub = leaf(scope, s => s === 'Totebag');
      if (sub) { sub.textContent = p.sub || ''; oneLine(sub); }
      const price = leaf(scope, s => /^\$[\d,]+\.\d{2}$/.test(s));
      if (price) {
        price.textContent = money(p.price);
        // la píldora del precio crece si el monto es largo y "MXN" se corre a su lado
        const pill = price.closest('[style*="border-radius"]');
        if (pill) {
          const w = Math.max(84, price.textContent.length * 9 + 14);
          const grow = w - (parseFloat(pill.style.width) || 84);
          if (grow > 0) {
            pill.style.width = w + 'px';
            const mxn = leaf(scope, s => s === 'MXN');
            const m = mxn && mxn.style.transform.match(/matrix\(([^)]*)\)/);
            if (m) { const v = m[1].split(','); v[4] = String(parseFloat(v[4]) + grow); mxn.style.transform = `matrix(${v.join(',')})`; }
          }
        }
      }
      // Toda la tarjeta lleva al producto (tarjeta suelta: solo su foto y sus textos).
      const a = document.createElement('a');
      a.className = 'nmd-teaser-link';
      a.style.cssText = `position:absolute;${t.box ? boxIn(root, t.pieces) : 'inset:0'};z-index:2;border-radius:8px`;
      a.href = 'product.html?id=' + encodeURIComponent(p.id);
      a.setAttribute('aria-label', `${p.name}${p.sub ? ' ' + p.sub : ''}, ${money(p.price)} MXN${p.available === false ? ', sold out' : ''}`);
      root.appendChild(a);
    });
    show(found, true);
  }

  const style = document.createElement('style');
  // anillo de foco por dentro: un contenedor con overflow:hidden lo cortaría por fuera
  style.textContent = '.nmd-teaser-link:focus-visible{outline:2px solid #FDDE36;outline-offset:-2px}';
  document.head.appendChild(style);

  function run(){
    const found = tiles();
    // Con Shopify: las tarjetas de relleno (producto y precio falsos) no se ven mientras carga
    // ni si falla la conexión.
    const remote = Catalog.usesShopify();
    if (remote) show(found, false);
    Catalog.load().then(list => fill(list, found)).catch(() => {});
    // Al volver de pagar en Shopify a una página sin carrito (inicio, menú): vacía el carrito pagado.
    if (remote) NMDShopify.syncAfterCheckout(() => {
      try { localStorage.setItem('nmd_cart', '[]'); } catch(e){}
      document.dispatchEvent(new Event('cart:change'));   // sticky-rail.js actualiza el contador
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
