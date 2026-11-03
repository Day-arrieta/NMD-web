/* ============================================================
   Catálogo de productos (placeholder del Figma).
   Edita aquí títulos, precios e imágenes. Precios en MXN.
   ============================================================ */
const PRODUCTS = [
  { id:'emissary-tshirt', title:'Emissary', sub:'T-Shirt',     price:1299, cat:'apparel',    img:'assets/img/prod-3.jpg',
    gallery:['assets/img/prod-3.jpg','assets/img/prod-4.jpg','assets/img/prod-2.jpg'],
    sizes:['XS','S','M','L','XL'],
    info:['Made of mediumweight classic cotton jersey','Using GOTS certified organic cotton','Loose fit · Below hip length','Long sleeves · High turtle neck','Ribbed collar and cuffs','Signature level shoulder seams'],
    note:'MADE IN MEXICO · 100% Cotton · Model reference: 182cm · Size: Large' },
  { id:'coral-heart-tote', title:'Coral Heart', sub:'Totebag', price:1229, cat:'accesories', img:'assets/img/prod-1.jpg',
    gallery:['assets/img/prod-1.jpg'], sizes:['One Size'],
    info:['Heavyweight organic cotton canvas','Screen-printed Coral Heart artwork','Reinforced handles'], note:'MADE IN MEXICO' },
  { id:'windbreaker', title:'Windbreaker', sub:'Outerwear', price:2450, cat:'apparel', img:'assets/img/prod-4.jpg',
    gallery:['assets/img/prod-4.jpg','assets/img/prod-3.jpg'], sizes:['S','M','L','XL'],
    info:['Water-repellent technical shell','Packable design','Adjustable hood'], note:'MADE IN MEXICO' },
  { id:'cope-cap', title:'Cope', sub:'Cap', price:899, cat:'accesories', img:'assets/img/prod-5.jpg',
    gallery:['assets/img/prod-5.jpg'], sizes:['One Size'], info:['Structured 6-panel','Embroidered NMD19 mark'], note:'MADE IN MEXICO' },
  { id:'hooded-shell', title:'Nomad', sub:'Hooded Shell', price:2890, cat:'apparel', img:'assets/img/prod-2.jpg',
    gallery:['assets/img/prod-2.jpg'], sizes:['S','M','L','XL'], info:['Anorak silhouette','Kangaroo pocket'], note:'MADE IN MEXICO' },
  { id:'studio-tee', title:'Studio', sub:'T-Shirt', price:1199, cat:'apparel', img:'assets/img/prod-6.jpg',
    gallery:['assets/img/prod-6.jpg'], sizes:['XS','S','M','L','XL'], info:['Classic fit','Front + back print'], note:'MADE IN MEXICO' },
  { id:'archive-tee', title:'Archive', sub:'T-Shirt', price:1199, cat:'apparel', img:'assets/img/prod-7.jpg',
    gallery:['assets/img/prod-7.jpg'], sizes:['XS','S','M','L','XL'], info:['Boxy fit','Heavyweight jersey'], note:'MADE IN MEXICO' },
  { id:'giftcard', title:'Giftcard', sub:'From $500', price:500, cat:'giftcards', img:'assets/img/prod-8.jpg',
    gallery:['assets/img/prod-8.jpg'], sizes:['$500','$1,000','$2,500'], info:['Digital giftcard','Redeemable in studio & shop'], note:'Delivered by email' },
];
const findProduct = id => PRODUCTS.find(p=>p.id===id) || PRODUCTS[0];
