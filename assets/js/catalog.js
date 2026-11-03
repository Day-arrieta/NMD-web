/* ============================================================
   NMD19 — Catálogo de productos.
   Precios en MXN. Nombres = placeholder del Figma (cámbialos por los reales).
   Las imágenes ya son las del diseño (assets/fig).
   ============================================================ */
const IMG = h => 'assets/fig/' + h;
const PRODUCTS = [
  { id:'emissary-tshirt', name:'Emissary', sub:'T-Shirt', price:1299, cat:'apparel',
    img:IMG('f84d33dd6ed01af8f9863e55ecca9f4ff431240d.jpg'),
    gallery:['f84d33dd6ed01af8f9863e55ecca9f4ff431240d.jpg','75f4f5f504d335d36336992ea33ba483ca3d1625.jpg','bb3295a6ee073df856c71b4d521128216a0e677d.jpg','ec3e557f531118246552b0af9255b67eacf46ab3.jpg','d245fe7d574e8a60ff1308dfa2f87822ae3b1b19.jpg','53f2777f56e5ec781dc86913156cde30466ed316.jpg'].map(IMG),
    sizes:['XS','S','M','L','XL'], sku:'251CWDT-SHM01',
    note:'MADE IN MEXICO · 100% Cotton · Model reference: 182cm · Size: Large',
    info:['Made of mediumweight classic cotton jersey','Using GOTS certified organic cotton','Loose fit · Below hip length','Long sleeves · High turtle neck','Ribbed collar and cuffs','Signature level shoulder seams'] },
  { id:'coral-heart-tote', name:'Coral Heart', sub:'Totebag', price:1229, cat:'accesories',
    img:IMG('034eff316ff1dcf19afe59e3ec6b48cb7f12071f.jpg'),
    gallery:['034eff316ff1dcf19afe59e3ec6b48cb7f12071f.jpg'].map(IMG),
    sizes:['One Size'], sku:'251CHTB-01', note:'MADE IN MEXICO',
    info:['Heavyweight organic cotton canvas','Screen-printed Coral Heart artwork','Reinforced handles'] },
  { id:'windbreaker', name:'Windbreaker', sub:'Outerwear', price:2450, cat:'apparel',
    img:IMG('de0af7036a83d16255de160053f54af58f30637d.jpg'),
    gallery:['de0af7036a83d16255de160053f54af58f30637d.jpg'].map(IMG),
    sizes:['S','M','L','XL'], sku:'251WB-OR', note:'MADE IN MEXICO',
    info:['Water-repellent technical shell','Packable design','Adjustable hood'] },
  { id:'noir-coat', name:'Noir', sub:'Coat', price:2890, cat:'apparel',
    img:IMG('cc68d9b2dc32b590494e915fafcd13b2fe48e6e2.jpg'),
    gallery:['cc68d9b2dc32b590494e915fafcd13b2fe48e6e2.jpg'].map(IMG),
    sizes:['S','M','L','XL'], sku:'251NC-BK', note:'MADE IN MEXICO',
    info:['Deconstructed trench silhouette','Mixed-panel construction','Below-knee length'] },
  { id:'cope-hi', name:'Cope', sub:'Sneaker', price:3200, cat:'apparel',
    img:IMG('bd79c9119599aa0fed163608079f3649da5ea93f.jpg'),
    gallery:['bd79c9119599aa0fed163608079f3649da5ea93f.jpg'].map(IMG),
    sizes:['25','26','27','28','29'], sku:'251CP-HI', note:'MADE IN MEXICO',
    info:['High-top canvas upper','Vulcanized rubber sole','Raw laces'] },
  { id:'studio-tee', name:'Studio', sub:'T-Shirt', price:1199, cat:'apparel',
    img:IMG('a2cb78e97aa1d44195d9899a4ac8143feb20aba7.jpg'),
    gallery:['a2cb78e97aa1d44195d9899a4ac8143feb20aba7.jpg'].map(IMG),
    sizes:['XS','S','M','L','XL'], sku:'251ST-01', note:'MADE IN MEXICO',
    info:['Classic fit','Front + back print','Heavyweight jersey'] },
  { id:'archive-piece', name:'Archive', sub:'Piece', price:2100, cat:'apparel',
    img:IMG('73a15d683422cc7532d4eaf360e3ba980f99ea3b.jpg'),
    gallery:['73a15d683422cc7532d4eaf360e3ba980f99ea3b.jpg'].map(IMG),
    sizes:['S','M','L','XL'], sku:'251AR-01', note:'MADE IN MEXICO',
    info:['Boxy fit','Technical fabric'] },
  { id:'giftcard', name:'Giftcard', sub:'From $500', price:500, cat:'giftcards',
    img:IMG('0c37da8ad28cec6dd2dff07d9657a9383059727f.jpg'),
    gallery:['0c37da8ad28cec6dd2dff07d9657a9383059727f.jpg'].map(IMG),
    sizes:['$500','$1,000','$2,500'], sku:'251GC', note:'Delivered by email',
    info:['Digital giftcard','Redeemable in studio & shop'] },
];
const findProduct = id => PRODUCTS.find(p => p.id === id) || PRODUCTS[0];
const money = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
