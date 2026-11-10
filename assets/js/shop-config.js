/* ============================================================
   NMD19 — Configuración de la tienda (Shopify).
   ------------------------------------------------------------
   Mientras `domain` o `storefrontToken` estén vacíos, la tienda usa el
   catálogo local de assets/js/catalog.js y el botón de pago muestra un
   aviso (no se cobra nada).

   Para conectar Shopify (ver SHOPIFY.md):
   1. domain: el dominio .myshopify.com de la tienda (sin https://).
   2. storefrontToken: el token PÚBLICO de la Storefront API (Headless
      channel). Es seguro tenerlo en el navegador; nunca pongas aquí un
      token privado ni de la Admin API.
   3. Recarga la tienda: productos, precios, tallas y existencias salen de
      Shopify y el pago se hace en el checkout de Shopify.
   ============================================================ */
window.NMD_SHOP = {
  shopify: {
    domain: 'nomadttt.myshopify.com',
    storefrontToken: '80a75a63863dc00b8f4d1c2e84aac89a', // token público de la Storefront API
    apiVersion: '2026-10',    // versión estable de la Storefront API (revisar 1 vez al año)
    country: 'MX',            // precios y disponibilidad para México (MXN)
    language: 'EN',
    readInventory: true,      // pide cantidades en existencia (requiere el permiso de inventario del token)
    productsLimit: 100        // máximo de productos que se leen
  },

  // Categorías de la tienda (pestañas de shop.html) a partir de los datos de Shopify.
  // Se revisa, en este orden: tipo de producto (productType) y etiquetas (tags), sin
  // distinguir mayúsculas. Un producto que no coincide con ninguna va a 'apparel'.
  // Las gift cards de Shopify (isGiftCard) siempre van a 'giftcards'.
  categories: {
    apparel:     ['apparel', 'ropa', 'clothing', 't-shirt', 'tee', 'hoodie', 'outerwear', 'sweat', 'jacket'],
    accessories: ['accessories', 'accesorios', 'accessory', 'totebag', 'bag', 'cap', 'hat'],
    giftcards:   ['giftcard', 'giftcards', 'gift card', 'gift cards', 'tarjeta de regalo']
  },

  // Opciones de producto: cada variante de Shopify es una opción para elegir ("S", "M"… o
  // "Black / M" si el producto tiene color y talla). En gift cards la opción se muestra como "Amount".

  // Guarda el catálogo de Shopify unos minutos para no pedirlo en cada página.
  cacheMinutes: 5
};
