/* ============================================================
   Carrito de maqueta (localStorage). NO cobra — solo demo visual.
   Cuando conectemos Shopify/pasarela, se sustituye esta capa.
   ============================================================ */
const Cart = {
  key:'nmd_cart',
  read(){ try{ return JSON.parse(localStorage.getItem(this.key)||'[]'); }catch(e){ return []; } },
  write(items){ localStorage.setItem(this.key, JSON.stringify(items)); document.dispatchEvent(new Event('cart:change')); },
  add(item){
    const items = this.read();
    const found = items.find(i=>i.id===item.id && i.size===item.size);
    if(found) found.qty += item.qty||1; else items.push({...item, qty:item.qty||1});
    this.write(items);
  },
  setQty(id,size,qty){
    let items = this.read();
    items = items.map(i=> (i.id===id&&i.size===size)?{...i,qty:Math.max(1,qty)}:i);
    this.write(items);
  },
  remove(id,size){ this.write(this.read().filter(i=>!(i.id===id&&i.size===size))); },
  count(){ return this.read().reduce((s,i)=>s+i.qty,0); },
  subtotal(){ return this.read().reduce((s,i)=>s+i.price*i.qty,0); }
};
const money = n => '$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
document.addEventListener('cart:change', ()=>{
  document.querySelectorAll('.cart-count').forEach(el=>el.textContent=`(${Cart.count()})`);
});
