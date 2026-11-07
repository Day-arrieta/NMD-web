/* ============================================================
   NMD19 — Cliente de la Storefront API de Shopify (sin dependencias).
   ------------------------------------------------------------
   Se activa solo si assets/js/shop-config.js tiene domain y storefrontToken.
   · fetchProducts(): productos → mismo formato que el catálogo local.
   · checkout(lines): crea un carrito en Shopify y devuelve su checkoutUrl
     (el pago, impuestos y envío los resuelve el checkout de Shopify).
   · syncAfterCheckout(): si el último carrito enviado a Shopify ya no existe
     (compra completada), vacía el carrito del sitio.
   Solo usa el token PÚBLICO de la Storefront API (seguro en el navegador).
   ============================================================ */
const NMDShopify = (() => {
  const cfg = () => (window.NMD_SHOP && window.NMD_SHOP.shopify) || {};
  const CART_KEY = 'nmd_shopify_cart';      // { id, at } del último carrito enviado al checkout
  const CACHE_KEY = 'nmd_shopify_catalog_v2';  // catálogo en caché (sessionStorage); v2: imágenes con tamaño + descriptionHtml

  function enabled(){
    const c = cfg();
    return !!(c.domain && c.storefrontToken && typeof fetch === 'function');
  }
  function endpoint(){
    const c = cfg();
    const domain = String(c.domain).replace(/^https?:\/\//, '').replace(/\/+$/, '');
    return `https://${domain}/api/${c.apiVersion || '2026-10'}/graphql.json`;
  }

  // Petición GraphQL. Lanza un Error con mensaje legible si falla la red o la API responde con errores.
  // · Si al token le falta un permiso opcional (p. ej. inventario o etiquetas), Shopify responde los datos
  //   con un error ACCESS_DENIED: se usan los datos y se avisa en la consola, sin tumbar la tienda.
  // · "Throttled" (límite por minuto al crear carritos): se reintenta con espera creciente.
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function gql(query, variables, attempt = 0){
    const res = await fetch(endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': cfg().storefrontToken },
      body: JSON.stringify({ query, variables: variables || {} })
    });
    if (res.status === 429 && attempt < 3) { await wait(800 * 2 ** attempt); return gql(query, variables, attempt + 1); }
    if (!res.ok) throw new Error(`Shopify ${res.status}`);
    let json;
    try { json = await res.json(); } catch(e){ throw new Error('Bad response from Shopify'); }   // p. ej. una página de error HTML
    const errors = json.errors || [];
    if (errors.length) {
      const code = e => e && e.extensions && e.extensions.code;
      if (errors.some(e => code(e) === 'THROTTLED' || /throttled/i.test(e.message)) && attempt < 3) {
        await wait(800 * 2 ** attempt); return gql(query, variables, attempt + 1);
      }
      if (json.data && errors.every(e => code(e) === 'ACCESS_DENIED')) {
        console.warn('[shop] Shopify token is missing a permission (data still used):', errors.map(e => e.message).join('; '));
        return json.data;
      }
      throw new Error(errors.map(e => e.message).join('; '));
    }
    return json.data;
  }

  // ---------- productos ----------
  const ctx = () => `@inContext(country: ${cfg().country || 'MX'}, language: ${cfg().language || 'EN'})`;
  const productsQuery = () => `
    query Products($first: Int!, $after: String) ${ctx()} {
      products(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id handle title productType tags isGiftCard availableForSale description descriptionHtml
          featuredImage { thumb: url(transform: { maxWidth: 640 }) full: url(transform: { maxWidth: 1600 }) altText }
          images(first: 10) { nodes { thumb: url(transform: { maxWidth: 200 }) full: url(transform: { maxWidth: 1600 }) } }
          variants(first: 50) {
            nodes {
              id title sku availableForSale ${cfg().readInventory ? 'quantityAvailable' : ''}
              price { amount currencyCode }
              selectedOptions { name value }
            }
          }
        }
      }
    }`;

  const lower = s => String(s || '').trim().toLowerCase();
  function categoryOf(node){
    if (node.isGiftCard) return 'giftcards';
    const cats = (window.NMD_SHOP && window.NMD_SHOP.categories) || {};
    const keys = [lower(node.productType), ...(node.tags || []).map(lower)].filter(Boolean);
    for (const cat of Object.keys(cats)) {
      if ((cats[cat] || []).map(lower).some(word => keys.includes(word))) return cat;
    }
    return 'apparel';
  }
  // Etiqueta de una variante: los valores de sus opciones ("M", o "Black / M" si también tiene color).
  // Sin opciones (Default Title) → "One Size". Montos de gift card → la opción se llama "Amount".
  const AMOUNT = ['amount', 'monto', 'denomination', 'denominations', 'value'];
  function sizeOf(variant){
    const real = (variant.selectedOptions || []).filter(o => lower(o.name) !== 'title' && o.value !== 'Default Title');
    if (!real.length) return { label: 'One Size', option: 'Size' };
    const names = real.map(o => AMOUNT.includes(lower(o.name)) ? 'Amount' : o.name);
    return { label: real.map(o => o.value).join(' / '), option: names.join(' / ') };
  }
  // Descripción de Shopify → nota (primer párrafo, entero: puede llevar " · ") y lista de detalles
  // (un párrafo, viñeta o línea con <br> por punto). Se usa descriptionHtml porque `description`
  // llega en una sola línea, sin saltos. Solo se extrae texto: nunca se inserta HTML de Shopify.
  const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', bull: '•', ndash: '–', mdash: '—' };
  function decode(text){
    if (typeof DOMParser === 'function') return new DOMParser().parseFromString(text, 'text/html').documentElement.textContent;
    return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] !== '#' ? (ENTITIES[e.toLowerCase()] || m)
      : String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))));
  }
  function blocksFromHtml(html){
    const text = String(html || '')
      .replace(/\s+/g, ' ')                                             // los saltos del código HTML no cuentan
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>|<\/?(p|div|li|ul|ol|h[1-6]|blockquote|tr|table)\b[^>]*>/gi, '\n')   // fin de bloque = línea
      .replace(/<[^>]*>/g, '');
    return decode(text).split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }
  function infoFrom(html, description){
    let blocks = blocksFromHtml(html);
    if (!blocks.length) blocks = String(description || '').split(/\n+|•/).map(s => s.trim()).filter(Boolean);
    return { note: blocks[0] || '', info: blocks.slice(1, 8) };
  }
  // Producto sin imágenes (típico de una gift card): foto de la gift card del diseño o un gris neutro.
  const GIFTCARD_IMG = 'assets/fig/0c37da8ad28cec6dd2dff07d9657a9383059727f.jpg';
  const NO_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3E%3Crect width='4' height='5' fill='%23f2f2f2'/%3E%3C/svg%3E";
  function normalize(node){
    const variants = {}, prices = {}, sizes = [];
    let optionLabel = 'Size';
    (node.variants && node.variants.nodes || []).forEach(v => {
      const { label, option } = sizeOf(v);
      if (variants[label]) return;                       // variante repetida: se usa la primera
      sizes.push(label);
      optionLabel = option;
      prices[label] = Number(v.price && v.price.amount) || 0;
      variants[label] = {
        id: v.id,                                        // gid://shopify/ProductVariant/…
        available: v.availableForSale !== false,
        qty: typeof v.quantityAvailable === 'number' ? v.quantityAvailable : NaN,
        sku: v.sku || ''
      };
    });
    // Imágenes con tamaño (CDN de Shopify): full 1600px (página de producto), thumb 640px (tarjetas,
    // carrito, inicio) y 200px para las miniaturas de la galería. Sin transform llegaría el original.
    const nodes = (node.images && node.images.nodes || []).filter(i => i && (i.full || i.url));
    const fi = node.featuredImage && (node.featuredImage.full || node.featuredImage.url) ? node.featuredImage : null;
    const fallback = node.isGiftCard ? GIFTCARD_IMG : NO_IMG;
    const img = (fi && (fi.full || fi.url)) || (nodes[0] && (nodes[0].full || nodes[0].url)) || fallback;
    const thumb = (fi && fi.thumb) || img;
    const gallery = nodes.length ? nodes.map(i => i.full || i.url) : [img];
    const galleryThumbs = nodes.length ? nodes.map(i => i.thumb || i.full || i.url) : [thumb];
    const minPrice = sizes.length ? Math.min(...sizes.map(s => prices[s])) : 0;
    const samePrice = sizes.every(s => prices[s] === minPrice);
    const { note, info } = infoFrom(node.descriptionHtml, node.description);
    const firstSku = sizes.length ? variants[sizes[0]].sku : '';
    return {
      id: node.handle,                                   // product.html?id=<handle>
      shopifyId: node.id,
      name: node.title,
      sub: node.isGiftCard ? `From ${money(minPrice)}` : (node.productType || ''),
      price: minPrice,
      cat: categoryOf(node),
      giftcard: !!node.isGiftCard,                       // la gift card no lleva subtítulo en el nombre ni "From"
      img,
      thumb,
      gallery,
      galleryThumbs,
      sizes: sizes.length ? sizes : ['One Size'],
      prices: samePrice ? undefined : prices,
      optionLabel: lower(optionLabel) === 'size' ? undefined : optionLabel,
      variants,
      available: node.availableForSale !== false,
      sku: firstSku,
      note,
      info
    };
  }

  async function fetchProducts(){
    const minutes = (window.NMD_SHOP && window.NMD_SHOP.cacheMinutes) || 0;
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.endpoint === endpoint() && Date.now() - cached.at < minutes * 60000) return cached.products;
    } catch(e){}
    // Páginas de 50 productos (consultas ligeras) hasta productsLimit.
    const limit = Math.max(1, cfg().productsLimit || 100);
    const nodes = [];
    let after = null;
    do {
      const data = await gql(productsQuery(), { first: Math.min(50, limit - nodes.length), after });
      const page = (data && data.products) || {};
      nodes.push(...(page.nodes || []));
      after = page.pageInfo && page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    } while (after && nodes.length < limit);
    // Un producto sin variantes no se puede comprar: no se muestra.
    const products = nodes.filter(n => n && n.handle && n.variants && n.variants.nodes && n.variants.nodes.length).map(normalize);
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ endpoint: endpoint(), at: Date.now(), products })); } catch(e){}
    return products;
  }

  // ---------- carrito y checkout ----------
  const CART_CREATE = `
    mutation CartCreate($input: CartInput!) ${'@inContext(country: COUNTRY, language: LANG)'} {
      cartCreate(input: $input) {
        cart { id checkoutUrl totalQuantity lines(first: 100) { nodes { quantity merchandise { ... on ProductVariant { id } } } } }
        userErrors { code field message }
        warnings { code message target }
      }
    }`;
  // lines: [{ variantId, qty }] → { checkoutUrl, lines } o lanza Error. Los errores pensados para el
  // cliente (userErrors de Shopify) llevan userFacing: true; el resto se muestra con un mensaje genérico.
  const customerError = msg => Object.assign(new Error(msg), { userFacing: true });
  async function checkout(lines){
    const valid = (lines || []).filter(l => l && /^gid:\/\/shopify\/ProductVariant\//.test(l.variantId) && l.qty > 0);
    if (!valid.length) throw customerError('No purchasable items in the cart.');
    const query = CART_CREATE.replace('COUNTRY', cfg().country || 'MX').replace('LANG', cfg().language || 'EN');
    const data = await gql(query, { input: {
      lines: valid.map(l => ({ merchandiseId: l.variantId, quantity: l.qty })),
      buyerIdentity: { countryCode: cfg().country || 'MX' }
    }});
    const result = data.cartCreate || {};
    if (result.userErrors && result.userErrors.length) throw customerError(result.userErrors.map(e => e.message).join(' '));
    if (!result.cart || !result.cart.checkoutUrl) throw new Error('Shopify did not return a checkout.');
    try { localStorage.setItem(CART_KEY, JSON.stringify({ id: result.cart.id, at: Date.now() })); } catch(e){}
    // Avisos de existencia: Shopify ajustó cantidades (MERCHANDISE_NOT_ENOUGH_STOCK / OUT_OF_STOCK…).
    const warnings = (result.warnings || []).map(w => w.message).filter(Boolean);
    const requested = valid.reduce((n, l) => n + l.qty, 0);
    // Cantidades que Shopify dejó en el carrito (para igualar el carrito del sitio si las ajustó).
    const got = result.cart.lines && result.cart.lines.nodes;
    const cartLines = Array.isArray(got) ? got.filter(l => l && l.merchandise && l.merchandise.id)
      .map(l => ({ variantId: l.merchandise.id, qty: l.quantity })) : null;
    return { checkoutUrl: result.cart.checkoutUrl, cartId: result.cart.id, warnings, lines: cartLines,
             adjusted: warnings.length > 0 || (typeof result.cart.totalQuantity === 'number' && result.cart.totalQuantity < requested) };
  }

  // Al volver al sitio: si el carrito enviado al checkout ya no existe en Shopify (pedido completado),
  // se vacía el carrito local. Devuelve true si lo vació.
  async function syncAfterCheckout(clearLocalCart){
    if (!enabled()) return false;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(CART_KEY) || 'null'); } catch(e){}
    if (!saved || !saved.id) return false;
    if (Date.now() - (saved.at || 0) > 30 * 864e5) { localStorage.removeItem(CART_KEY); return false; }   // Shopify lo expira a los 30 días
    try {
      const data = await gql(`query Cart($id: ID!) { cart(id: $id) { id } }`, { id: saved.id });
      if (data && data.cart) return false;               // sigue abierto: la compra no se completó
      localStorage.removeItem(CART_KEY);
      if (typeof clearLocalCart === 'function') clearLocalCart();
      return true;
    } catch(e){ return false; }
  }

  // Olvida el catálogo en caché (p. ej. si Shopify avisó de cambios de existencia).
  function clearCache(){ try { sessionStorage.removeItem(CACHE_KEY); } catch(e){} }

  return { enabled, fetchProducts, checkout, syncAfterCheckout, clearCache, _normalize: normalize, _endpoint: endpoint };
})();
