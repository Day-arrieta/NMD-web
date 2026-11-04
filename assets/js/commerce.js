/* ============================================================
   NMD19 — Carrito (localStorage) + barra de navegación + DRAWER de carrito.
   El carrito se abre como panel deslizante (como el Figma), no como página.
   ============================================================ */
const Cart = {
  KEY: 'nmd_cart',
  read(){ try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch(e){ return []; } },
  write(items){ localStorage.setItem(this.KEY, JSON.stringify(items)); document.dispatchEvent(new Event('cart:change')); },
  add(item){
    const items = this.read();
    const f = items.find(i => i.id === item.id && i.size === item.size);
    if (f) f.qty += item.qty || 1; else items.push({ ...item, qty: item.qty || 1 });
    this.write(items);
  },
  setQty(id, size, qty){ this.write(this.read().map(i => (i.id===id && i.size===size) ? { ...i, qty: Math.max(1, qty) } : i)); },
  remove(id, size){ this.write(this.read().filter(i => !(i.id===id && i.size===size))); },
  count(){ return this.read().reduce((s, i) => s + i.qty, 0); },
  subtotal(){ return this.read().reduce((s, i) => s + i.price * i.qty, 0); }
};
const SHOPIFY_DOMAIN = ''; // 'nmd19.myshopify.com' cuando exista la tienda → checkout real

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
.cart-drawer{position:fixed;left:var(--nmd-rail-width,0px);top:0;bottom:0;box-sizing:border-box;width:min(480px,calc(100vw - var(--nmd-rail-width,0px)));background:#fff;color:#0c0c0c;display:flex;flex-direction:column;transform:translateX(-110%);transition:transform .45s cubic-bezier(.22,1,.36,1);z-index:95;font-family:'Radio Grotesk',sans-serif}
.cart-drawer.open{transform:translateX(0)}
.cart-drawer__head{display:flex;align-items:flex-start;justify-content:space-between;padding:28px 30px 16px}
.cart-drawer__head h2{font-family:'Manuka',sans-serif;text-transform:uppercase;font-size:clamp(40px,9vw,68px);line-height:.85}
.cart-drawer__close{background:none;border:none;cursor:pointer;font-size:24px;color:#0c0c0c;line-height:1;padding:6px}
.cart-drawer__items{flex:1;overflow-y:auto;padding:0 30px}
.cart-it{display:grid;grid-template-columns:80px 1fr auto;gap:16px;padding:20px 0;border-bottom:1px solid #e6e6e6}
.cart-it img{width:80px;height:100px;object-fit:cover;background:#f2f2f2}
.cart-it h3{font-size:17px;font-weight:400}.cart-it .s{color:#888;font-size:12px;margin-top:2px}
.cart-it .q{display:inline-flex;align-items:center;border:1px solid #ddd;border-radius:100px;margin-top:10px}
.cart-it .q button{background:none;border:none;cursor:pointer;padding:5px 12px;font-size:15px}.cart-it .q span{min-width:24px;text-align:center;font-weight:400;font-size:14px}
.cart-it .r{text-align:right;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end}
.cart-it .r strong{font-size:15px;font-weight:400}.cart-it .x{background:none;border:none;color:#999;text-decoration:underline;font-size:11px;cursor:pointer;font-family:inherit}
.cart-drawer__foot{border-top:1px solid #e6e6e6;padding:18px 30px 26px;background:#fff}
.cart-row{display:flex;justify-content:space-between;padding:7px 0;font-size:15px;color:#555}
.cart-row .c{font-size:11px;color:#aaa;margin-left:4px}
.cart-row.total{color:#000;font-weight:400;font-size:20px;border-top:1px solid #e6e6e6;margin-top:6px;padding-top:14px}
.cart-checkout{width:100%;margin-top:16px;background:#0c0c0c;color:#fff;border:none;border-radius:100px;padding:17px;font-family:inherit;font-weight:400;letter-spacing:.04em;text-transform:uppercase;font-size:14px;cursor:pointer;transition:.2s}
.cart-checkout:hover{background:#FDDE36;color:#000}
.cart-empty{padding:40px 30px;color:#888}
.cart-empty a{color:#000;text-decoration:underline}
@media(max-width:680px){.cart-drawer{width:calc(100vw - var(--nmd-rail-width,0px))}.cart-drawer__head{padding:24px 18px 16px}.cart-drawer__items{padding:0 18px}.cart-drawer__foot{padding:18px}.cart-drawer__close{flex-shrink:0}}`;

function chromeHTML(){
  return `
  <div class="cart-backdrop" id="cartBackdrop"></div>
  <aside class="cart-drawer" id="cartDrawer" aria-hidden="true">
    <div class="cart-drawer__head"><h2>My Cart</h2><button class="cart-drawer__close" id="cartClose" aria-label="Close">✕</button></div>
    <div class="cart-drawer__items" id="cartItems"></div>
    <div class="cart-drawer__foot" id="cartFoot"></div>
  </aside>`;
}

function renderDrawer(){
  const items = Cart.read();
  const itemsEl = document.getElementById('cartItems');
  const footEl = document.getElementById('cartFoot');
  if(!itemsEl) return;
  if(!items.length){
    itemsEl.innerHTML = `<div class="cart-empty">Your cart is empty. <a href="shop.html">Go to Shop</a></div>`;
    footEl.innerHTML = '';
    return;
  }
  itemsEl.innerHTML = items.map(i=>`
    <div class="cart-it">
      <img src="${i.img}" alt="${i.name}">
      <div>
        <h3>${i.name}</h3><div class="s">${i.sub||''} · Size: ${i.size}</div>
        <div class="q"><button data-act="minus" data-id="${i.id}" data-size="${i.size}">–</button><span>${i.qty}</span><button data-act="plus" data-id="${i.id}" data-size="${i.size}">+</button></div>
      </div>
      <div class="r"><strong>${money(i.price*i.qty)} <span style="font-size:11px;color:#aaa">MXN</span></strong>
        <button class="x" data-act="remove" data-id="${i.id}" data-size="${i.size}">Remove</button></div>
    </div>`).join('');
  const sub = Cart.subtotal(), disc = Math.round(sub*0.10), tot = sub-disc;
  footEl.innerHTML = `
    <div class="cart-row"><span>Subtotal</span><span>${money(sub)}<span class="c">MXN</span></span></div>
    <div class="cart-row"><span>Discount (10%)</span><span>-${money(disc)}<span class="c">MXN</span></span></div>
    <div class="cart-row total"><span>Total</span><span>${money(tot)}<span class="c">MXN</span></span></div>
    <button class="cart-checkout" id="cartCheckout">Checkout Now</button>`;
}

function openCart(){ renderDrawer(); document.getElementById('cartDrawer').classList.add('open'); document.getElementById('cartBackdrop').classList.add('open'); document.getElementById('cartDrawer').setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
function closeCart(){ document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('cartBackdrop').classList.remove('open'); document.getElementById('cartDrawer').setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

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
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartBackdrop').addEventListener('click', closeCart);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape'){ closeCart(); if(menuOpen) closeMenu(); } });
  // delegación de acciones dentro del drawer
  document.getElementById('cartItems').addEventListener('click', e=>{
    const b = e.target.closest('[data-act]'); if(!b) return;
    const {act,id,size}=b.dataset; const it=Cart.read().find(i=>i.id===id&&i.size===size); if(!it) return;
    if(act==='minus') Cart.setQty(id,size,it.qty-1);
    if(act==='plus') Cart.setQty(id,size,it.qty+1);
    if(act==='remove') Cart.remove(id,size);
    renderDrawer();
  });
  document.getElementById('cartFoot').addEventListener('click', e=>{ if(e.target.id==='cartCheckout') checkout(); });
}
function checkout(){
  const items = Cart.read();
  if(!items.length) return;
  if(SHOPIFY_DOMAIN){
    const line = items.filter(i=>i.variantId).map(i=>`${i.variantId}:${i.qty}`).join(',');
    location.href = `https://${SHOPIFY_DOMAIN}/cart/${line}`; return;
  }
  alert('Checkout listo para conectar a Shopify.\n\nPedido:\n' + items.map(i=>`• ${i.name} (${i.size}) x${i.qty} — ${money(i.price*i.qty)} MXN`).join('\n') + `\n\nTotal: ${money(Cart.subtotal())} MXN`);
}
function updateCount(){ document.querySelectorAll('.rail__count').forEach(el => el.textContent = Cart.count()); }
document.addEventListener('cart:change', ()=>{ updateCount(); if(document.getElementById('cartDrawer')?.classList.contains('open')) renderDrawer(); });
document.addEventListener('DOMContentLoaded', mountChrome);
