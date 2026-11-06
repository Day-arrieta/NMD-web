/* ============================================================
   NMD19 — Carrito (localStorage) + barra de navegación + DRAWER de carrito.
   El carrito se abre como panel deslizante (como el Figma), no como página.
   ============================================================ */
/* Discount applied to the whole cart (0.10 = 10 %). 0 = no discount: the "Discount" row is hidden
   and Total equals Subtotal. The drawer, cart.html and the checkout message all read this one value. */
const DISCOUNT_RATE = 0;

const Cart = {
  KEY: 'nmd_cart',
  // Always returns a clean array. Lines saved by an older version, edited in
  // another tab or malformed are normalised; known products take their
  // name, image and price from the catalog (giftcard: price of the amount).
  read(){
    let items;
    try { items = JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch(e){ items = []; }
    if (!Array.isArray(items)) return [];
    return items.filter(i => i && typeof i.id === 'string').map(i => {
      const size = String(i.size == null ? '' : i.size);
      const p = typeof findProduct === 'function' ? findProduct(i.id) : null;
      const line = { ...i, size, qty: Math.max(1, Math.floor(Number(i.qty)) || 1) };
      if (p) Object.assign(line, {
        name: p.name, img: p.img, price: priceFor(p, size),
        // a giftcard line reads "Amount: $1,000" instead of "From $500 · Size: $1,000"
        sub: p.prices ? '' : p.sub, option: p.optionLabel || 'Size'
      });
      if (!Number.isFinite(Number(line.price))) line.price = 0;
      return line;
    });
  },
  write(items){
    try { localStorage.setItem(this.KEY, JSON.stringify(items)); } catch(e){}
    document.dispatchEvent(new Event('cart:change'));
  },
  add(item){
    const items = this.read();
    const f = items.find(i => i.id === item.id && i.size === item.size);
    if (f) f.qty += item.qty || 1; else items.push({ ...item, qty: item.qty || 1 });
    this.write(items);
  },
  setQty(id, size, qty){ this.write(this.read().map(i => (i.id===id && i.size===size) ? { ...i, qty: Math.max(1, qty) } : i)); },
  remove(id, size){ this.write(this.read().filter(i => !(i.id===id && i.size===size))); },
  count(){ return this.read().reduce((s, i) => s + i.qty, 0); },
  subtotal(){ return this.read().reduce((s, i) => s + i.price * i.qty, 0); },
  // Single source for every total shown (drawer, cart page, checkout message).
  totals(){
    const subtotal = this.subtotal();
    const discount = Math.round(subtotal * DISCOUNT_RATE * 100) / 100;
    return { subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100 };
  }
};
const discountPct = () => `${+(DISCOUNT_RATE * 100).toFixed(2)}%`;
const discountLabel = () => `Discount (${discountPct()})`;
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const SHOPIFY_DOMAIN = ''; // e.g. 'nmd19.myshopify.com' once the store exists → real checkout

/* ---------- estilos del drawer (inyectados) ---------- */
const CART_CSS = `
/* El borde claro fuerza el rasterizado del fondo blanco del rail fijo:
   Chrome no pinta el fondo SÓLIDO de un position:fixed cuando hay algún
   transform en la página (aquí el hover de las cards). Un borde contrastante
   lo arregla. Mismo fix que sticky-rail.js en las páginas estáticas. */
.rail{border:1px solid #e6e6e6;box-sizing:border-box}
/* iconos originales del Figma (override del estilo viejo del rail) */
/* hamburguesa = 2 líneas CSS que se transforman en X (solo transform → morph suave) */
.rail__menu{position:relative;width:35px;height:16px;background:none;border:none;cursor:pointer;padding:0}
.rail__menu span{display:block;position:absolute;left:0;top:50%;width:100%;height:3.5px;margin-top:-1.75px;background:#000;border-radius:3.5px;transition:transform .42s cubic-bezier(.65,0,.35,1)}
.rail__menu span:nth-child(1){transform:translateY(-6px)}
.rail__menu span:nth-child(2){transform:translateY(6px)}
.rail__menu.x span:nth-child(1){transform:rotate(45deg)}
.rail__menu.x span:nth-child(2){transform:rotate(-45deg)}
/* overlay del menú */
.nmd-ov{position:fixed;inset:0;z-index:99990;background:#000;clip-path:inset(0 100% 0 0);visibility:hidden;transition:clip-path .55s cubic-bezier(.76,0,.24,1),visibility 0s linear .55s}
.nmd-ov.open{clip-path:inset(0 0 0 0);visibility:visible;transition:clip-path .55s cubic-bezier(.76,0,.24,1)}
.nmd-ov iframe{width:100%;height:100%;border:0;display:block;background:#000}
body.nmd-locked{overflow:hidden}
.rail__cart{display:flex;flex-direction:column;align-items:center;gap:8px;background:none;border:none;cursor:pointer;padding:0}
.rail__count{position:static;top:auto;right:auto;background:#e8e8e8;color:#000;min-width:0;width:30px;height:30px;border-radius:50%;font-family:'Radio Grotesk',Arial,sans-serif;font-size:15px;line-height:1;display:flex;align-items:center;justify-content:center}
.cart-backdrop{position:fixed;inset:0;left:var(--nmd-rail-width,0px);background:rgba(0,0,0,.55);opacity:0;visibility:hidden;transition:opacity .4s,visibility .4s;z-index:90}
.cart-backdrop.open{opacity:1;visibility:visible}
.cart-drawer{position:fixed;left:var(--nmd-rail-width,0px);top:0;bottom:0;box-sizing:border-box;width:min(480px,calc(100vw - var(--nmd-rail-width,0px)));background:#fff;color:#0c0c0c;display:flex;flex-direction:column;transform:translateX(-110%);visibility:hidden;transition:transform .45s cubic-bezier(.22,1,.36,1),visibility 0s linear .45s;z-index:95;font-family:'Radio Grotesk',sans-serif}
/* closed = visibility:hidden (after the slide-out) + inert: no keyboard focus, hidden from screen readers */
.cart-drawer.open{transform:translateX(0);visibility:visible;transition:transform .45s cubic-bezier(.22,1,.36,1)}
.cart-drawer__head{display:flex;align-items:flex-start;justify-content:space-between;padding:28px 30px 16px}
.cart-drawer__head h2{font-family:'Manuka',sans-serif;text-transform:uppercase;font-size:clamp(40px,9vw,68px);line-height:.85;letter-spacing:0.03em;}
.cart-drawer__close{background:none;border:none;cursor:pointer;font-size:24px;color:#0c0c0c;line-height:1;padding:6px}
.cart-drawer__items{flex:1;overflow-y:auto;padding:0 30px}
.cart-it{display:grid;grid-template-columns:80px minmax(0,1fr) auto;gap:16px;padding:20px 0;border-bottom:1px solid #e6e6e6}
.cart-it img{width:80px;height:100px;object-fit:cover;background:#f2f2f2}
.cart-it h3{font-size:17px;font-weight:400;overflow-wrap:anywhere}.cart-it .s{color:#6b6b6b;font-size:12px;margin-top:2px}
.cart-it .q{display:inline-flex;align-items:center;border:1px solid #ddd;border-radius:100px;margin-top:10px}
.cart-it .q button{background:none;border:none;cursor:pointer;padding:5px 12px;font-size:15px}.cart-it .q span{min-width:24px;text-align:center;font-weight:400;font-size:14px}
.cart-it .r{text-align:right;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end}
.cart-it .r strong{font-size:15px;font-weight:400}.cart-it .x{background:none;border:none;color:#6b6b6b;text-decoration:underline;font-size:11px;cursor:pointer;font-family:inherit}
.cart-drawer__foot{border-top:1px solid #e6e6e6;padding:18px 30px 26px;background:#fff}
.cart-row{display:flex;justify-content:space-between;padding:7px 0;font-size:15px;color:#555}
.cart-row .c{font-size:11px;color:#6b6b6b;margin-left:4px}
.cart-row.total{color:#000;font-weight:400;font-size:20px;border-top:1px solid #e6e6e6;margin-top:6px;padding-top:14px}
.cart-checkout{width:100%;margin-top:16px;background:#0c0c0c;color:#fff;border:none;border-radius:100px;padding:17px;font-family:inherit;font-weight:400;letter-spacing:.04em;text-transform:uppercase;font-size:14px;cursor:pointer;transition:.2s}
.cart-checkout:hover{background:#FDDE36;color:#000}
.cart-notice{margin-top:12px;font-size:14px;line-height:1.35;color:#555}.cart-notice:empty{display:none}
.cart-empty{padding:40px 30px;color:#6b6b6b}
.cart-empty a{color:#000;text-decoration:underline}
@media(max-width:680px){.cart-drawer{width:calc(100vw - var(--nmd-rail-width,0px))}.cart-drawer__head{padding:24px 18px 16px}.cart-drawer__items{padding:0 18px}.cart-drawer__foot{padding:18px}.cart-drawer__close{flex-shrink:0}
  /* phones: price + Remove go under the name so long names never push them out */
  .cart-it{grid-template-columns:80px minmax(0,1fr);column-gap:14px;row-gap:8px}
  .cart-it img{grid-row:span 2}
  .cart-it .r{flex-direction:row;align-items:center;justify-content:space-between;gap:12px}
  /* tap targets >= 40x40 */
  .cart-drawer__close{display:flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;margin:-8px -10px 0 0}
  .cart-it .q button{min-width:40px;min-height:40px;padding:0 10px}
  .cart-it .x{min-width:40px;min-height:40px;padding:0 4px}}`;

function chromeHTML(){
  // Closed drawer is inert (not focusable, hidden from screen readers) until openCart().
  return `
  <div class="cart-backdrop" id="cartBackdrop" aria-hidden="true"></div>
  <aside class="cart-drawer" id="cartDrawer" role="dialog" aria-modal="true" aria-labelledby="cartTitle" inert>
    <div class="cart-drawer__head"><h2 id="cartTitle">My Cart</h2><button type="button" class="cart-drawer__close" id="cartClose" aria-label="Close cart">✕</button></div>
    <div class="cart-drawer__items" id="cartItems"></div>
    <div class="cart-drawer__foot" id="cartFoot"></div>
  </aside>`;
}

/* Re-rendering replaces the quantity/remove buttons. Remember which one had
   keyboard focus and focus its replacement (or `fallback` if the line is gone).
   Shared with cart.html. */
function focusedCartAction(container){
  const a = document.activeElement;
  return (a && container.contains(a) && a.dataset && a.dataset.act)
    ? { act: a.dataset.act, id: a.dataset.id, size: a.dataset.size } : null;
}
function restoreCartAction(container, k, fallback){
  if (!k) return;
  const el = [...container.querySelectorAll('[data-act]')]
    .find(b => b.dataset.act === k.act && b.dataset.id === k.id && b.dataset.size === k.size);
  const target = el || fallback;
  if (target) target.focus({ preventScroll: true });
}
/* +/-/Remove for the drawer and cart.html. The buttons may be stale (cart changed
   in another tab or in the drawer): re-read the cart and just redraw if the line is gone. */
function cartAction(d){
  const it = Cart.read().find(i => i.id === d.id && i.size === d.size);
  if (!it) { document.dispatchEvent(new Event('cart:change')); return; }
  if (d.act === 'minus') Cart.setQty(d.id, d.size, it.qty - 1);
  else if (d.act === 'plus') Cart.setQty(d.id, d.size, it.qty + 1);
  else if (d.act === 'remove') Cart.remove(d.id, d.size);
}
const lineDetails = i => [i.sub, `${i.option || 'Size'}: ${i.size}`].filter(Boolean).join(' · ');

function renderDrawer(){
  const items = Cart.read();
  const itemsEl = document.getElementById('cartItems');
  const footEl = document.getElementById('cartFoot');
  if(!itemsEl) return;
  const keep = focusedCartAction(itemsEl);
  if(!items.length){
    itemsEl.innerHTML = `<div class="cart-empty">Your cart is empty. <a href="shop.html">Go to Shop</a></div>`;
    footEl.innerHTML = '';
    restoreCartAction(itemsEl, keep, itemsEl.querySelector('a'));
    return;
  }
  itemsEl.innerHTML = items.map(i=>{
    const data = `data-id="${esc(i.id)}" data-size="${esc(i.size)}"`, n = esc(i.name);
    return `
    <div class="cart-it">
      <img src="${esc(i.img)}" alt="">
      <div>
        <h3>${n}</h3><div class="s">${esc(lineDetails(i))}</div>
        <div class="q"><button type="button" data-act="minus" ${data} aria-label="Decrease quantity of ${n}">–</button><span>${i.qty}</span><button type="button" data-act="plus" ${data} aria-label="Increase quantity of ${n}">+</button></div>
      </div>
      <div class="r"><strong>${money(i.price*i.qty)} <span style="font-size:11px;color:#6b6b6b">MXN</span></strong>
        <button type="button" class="x" data-act="remove" ${data} aria-label="Remove ${n}">Remove</button></div>
    </div>`; }).join('');
  const t = Cart.totals();
  footEl.innerHTML = `
    <div class="cart-row"><span>Subtotal</span><span>${money(t.subtotal)}<span class="c">MXN</span></span></div>
    ${DISCOUNT_RATE > 0 ? `<div class="cart-row"><span>${discountLabel()}</span><span>-${money(t.discount)}<span class="c">MXN</span></span></div>` : ''}
    <div class="cart-row total"><span>Total</span><span>${money(t.total)}<span class="c">MXN</span></span></div>
    <button type="button" class="cart-checkout" id="cartCheckout">Checkout Now</button>
    <p class="cart-notice" id="cartNotice" role="status"></p>`;
  restoreCartAction(itemsEl, keep, itemsEl.querySelector('[data-act]'));
}

let cartTrigger = null;   // element that opened the drawer; focus returns there on close
const isCartOpen = () => !!document.getElementById('cartDrawer')?.classList.contains('open');
function openCart(){
  const d = document.getElementById('cartDrawer'); if(!d) return;
  if(!isCartOpen()) cartTrigger = document.activeElement;
  renderDrawer();
  d.inert = false;
  d.classList.add('open'); document.getElementById('cartBackdrop').classList.add('open');
  document.body.style.overflow='hidden';
  document.getElementById('cartClose').focus({ preventScroll: true });
}
function closeCart(){
  const d = document.getElementById('cartDrawer'); if(!d || !isCartOpen()) return;
  d.classList.remove('open'); document.getElementById('cartBackdrop').classList.remove('open');
  d.inert = true;
  document.body.style.overflow='';
  // the rail is rebuilt on resize, so fall back to its current cart link
  const back = (cartTrigger && cartTrigger.isConnected && cartTrigger !== document.body)
    ? cartTrigger : document.querySelector('#nmd-rail-fixed .nmd-cart, #nmd-topbar .nmd-tb-cart');
  cartTrigger = null;
  if (back && back.focus) back.focus({ preventScroll: true });
}

/* ---------- overlay del menú (animación que cubre la página, igual que las estáticas) ---------- */
let menuOvBuilt=false, menuOpen=false;
function ensureMenuOverlay(){
  if(menuOvBuilt) return; menuOvBuilt=true;
  const ov=document.createElement('div'); ov.className='nmd-ov'; ov.id='nmdOverlay';
  const fr=document.createElement('iframe'); fr.id='nmdMenuFrame'; fr.title='Menu'; fr.src='exact-desktop-menu.html?embed=1';
  ov.appendChild(fr); document.body.appendChild(ov);
  window.addEventListener('message', function(e){ if(e.data==='nmd-ready' && menuOpen){ const w=menuFrameWin(); if(w) w.postMessage('nmd-play','*'); } });
}
function menuFrameWin(){ const f=document.getElementById('nmdMenuFrame'); return f && f.contentWindow; }
function openMenu(){
  ensureMenuOverlay(); menuOpen=true;
  document.getElementById('nmdOverlay').classList.add('open');
  const b=document.getElementById('railMenuBtn'); if(b){ b.classList.add('x'); b.setAttribute('aria-label','Close menu'); }
  document.body.classList.add('nmd-locked');
  const w=menuFrameWin(); if(w) w.postMessage('nmd-play','*');
}
function closeMenu(){
  menuOpen=false;
  const ov=document.getElementById('nmdOverlay'); if(ov) ov.classList.remove('open');
  const b=document.getElementById('railMenuBtn'); if(b){ b.classList.remove('x'); b.setAttribute('aria-label','Open menu'); }
  document.body.classList.remove('nmd-locked');
  const w=menuFrameWin(); if(w) w.postMessage('nmd-reset','*');
}
function toggleMenu(e){ if(e) e.preventDefault(); menuOpen ? closeMenu() : openMenu(); }

function mountChrome(){
  const st = document.createElement('style'); st.textContent = CART_CSS; document.head.appendChild(st);
  document.body.insertAdjacentHTML('afterbegin', chromeHTML());
  updateCount();
  const drawer = document.getElementById('cartDrawer');
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartBackdrop').addEventListener('click', closeCart);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ if(isCartOpen()) closeCart(); if(menuOpen) closeMenu(); } });
  // keep Tab / Shift+Tab inside the open drawer (it is a modal dialog)
  drawer.addEventListener('keydown', e=>{
    if(e.key!=='Tab') return;
    const f = drawer.querySelectorAll('a[href],button:not([disabled])'); if(!f.length) return;
    const first = f[0], last = f[f.length-1];
    if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
  });
  // delegación de acciones dentro del drawer (cart:change redraws it)
  document.getElementById('cartItems').addEventListener('click', e=>{
    const b = e.target.closest('[data-act]'); if(b) cartAction(b.dataset);
  });
  document.getElementById('cartFoot').addEventListener('click', e=>{
    if(e.target.closest('#cartCheckout')) checkout(document.getElementById('cartNotice'));
  });
}
/* Shown instead of a real checkout while no payment provider is connected.
   Uses the same totals as the drawer and cart page. */
function checkoutMessage(){
  const t = Cart.totals();
  const note = t.discount > 0 ? `, after the ${discountPct()} discount` : '';
  return `Online payment isn't available yet, so no order was placed and nothing was charged. `
    + `Your cart (total ${money(t.total)} MXN${note}) stays saved on this device.`;
}
// `notice`: the role="status" element that receives the message.
function checkout(notice){
  const items = Cart.read();
  if(!items.length) return;
  if(SHOPIFY_DOMAIN){
    const line = items.filter(i=>i.variantId).map(i=>`${i.variantId}:${i.qty}`).join(',');
    location.href = `https://${SHOPIFY_DOMAIN}/cart/${line}`; return;
  }
  if(notice && notice.nodeType === 1) notice.textContent = checkoutMessage();
}
function updateCount(){ document.querySelectorAll('.rail__count').forEach(el => el.textContent = Cart.count()); }
document.addEventListener('cart:change', ()=>{ updateCount(); if(isCartOpen()) renderDrawer(); });
// A change in another tab only fires 'storage' here: re-emit it as cart:change so
// the drawer, the rail badge and cart.html redraw.
window.addEventListener('storage', e=>{ if(e.key===Cart.KEY || e.key===null) document.dispatchEvent(new Event('cart:change')); });
document.addEventListener('DOMContentLoaded', mountChrome);
