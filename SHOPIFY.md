# Conectar la tienda con Shopify

El código ya está listo para conectar. Mientras no se configure, la tienda usa el catálogo de muestra y el botón de pago muestra un aviso (no se cobra nada).

Este archivo no se publica (está bloqueado en `netlify.toml`).

## Cómo funciona

- **Productos, precios, tallas y existencias** se leen de Shopify con la **Storefront API** desde el navegador. No hace falta servidor.
- **El carrito** sigue en el sitio. Al pulsar *Checkout Now* se crea un carrito en Shopify y se envía al **checkout de Shopify**, donde se paga, se calculan impuestos y envío, y se crea el pedido.
- **El inventario** lo descuenta Shopify con cada pedido. El sitio marca tallas agotadas, oculta lo que no se puede comprar y no deja agregar más unidades de las que hay (ni en la página de producto ni con el "+" del carrito).
- **Al volver al sitio** después de pagar, el carrito se vacía solo.

## Pasos

### 1. En Shopify

1. Instala el canal de ventas **Headless** (Shopify Admin → Sales channels → Headless) y crea un *storefront*.
2. Copia el **Public access token** de la Storefront API. Es público y seguro en el navegador. Nunca uses un token privado ni de la Admin API en el sitio.
3. En **Storefront API permissions** (Headless → tu storefront → *Edit*) activa:
   - leer productos (`unauthenticated_read_product_listings`);
   - leer inventario (`unauthenticated_read_product_inventory`), para los topes por existencia;
   - leer etiquetas (`unauthenticated_read_product_tags`), para las categorías por etiqueta;
   - leer y escribir carritos (`unauthenticated_read_checkouts` y `unauthenticated_write_checkouts`).
   Si falta el de inventario o el de etiquetas, la tienda sigue funcionando: solo se pierden los topes por existencia o la categoría por etiqueta.
4. Publica los productos en el canal **Headless** y en el mercado de **México**. Un producto que no esté publicado en ambos no aparece en el sitio, y Shopify no da ningún error. Es la causa más común de una tienda vacía.
5. Configura **México / MXN** como mercado y moneda principal, con **precios con IVA incluido**: los precios del sitio son los finales y el envío se calcula en el checkout.
6. **Sin contraseña en la tienda online de Shopify:** si la Online Store tiene contraseña, el checkout puede mandar a los clientes a la página de contraseña. Quítala y usa un tema que redirija al sitio de Netlify.
7. **Gift cards:** el correo de la tarjeta de regalo enlaza a una página del tema de Shopify (Online Store). Esa página debe seguir funcionando, aunque el resto del tema redirija al sitio.

### 2. Productos

| En Shopify | En el sitio |
| --- | --- |
| Título | Nombre del producto |
| Tipo de producto (`productType`) | Subtítulo (p. ej. "T-Shirt") y categoría |
| Etiquetas (`tags`) | Categoría, si el tipo no coincide |
| Variantes (opción "Size", "Talla" o "Color / Size") | Botones de talla; cada variante tiene su precio y existencia |
| Gift card (producto de tarjeta de regalo) | Pestaña *Giftcards*; cada monto es una opción. Sin imagen propia, usa la foto de gift card del diseño |
| Imágenes | Galería (la destacada es la principal). El sitio pide tamaños reducidos al CDN de Shopify (1600 px en la página de producto, 640 px en tarjetas y carrito, 200 px en miniaturas), así que se pueden subir originales grandes |
| Descripción: primer párrafo | Nota bajo el precio, entera (p. ej. "MADE IN MEXICO · 100% Cotton · Model reference: 182cm"). Los " · " separan sus partes |
| Descripción: párrafos o viñetas siguientes | Lista de *Product Info*: un párrafo, una viñeta o una línea (Shift+Enter) por punto, hasta 7 |
| Más nuevos primero | Orden de la tienda y de las tarjetas "New Items" / "New In" del inicio y del menú (en orden de lectura de la página) |
| SKU de cada variante | SKU bajo el nombre; cambia con la talla elegida |

**Descripción, ejemplo** (en el editor de Shopify):

```
MADE IN MEXICO · 100% Cotton · Model reference: 182cm
Made of mediumweight classic cotton jersey
Loose fit · Below hip length
Ribbed collar and cuffs
```

Primera línea = nota; cada línea siguiente (o cada viñeta, con el botón de lista del editor) = un punto de *Product Info*. Solo se usa el texto: negritas, enlaces o imágenes de la descripción no se muestran.

**Categorías:** las pestañas *Apparel*, *Accessories* y *Giftcards* se asignan por tipo de producto o etiqueta, con las palabras de `categories` en `assets/js/shop-config.js` (por ejemplo, la etiqueta `accessories` o el tipo `Bag` van a *Accessories*). Lo que no coincide va a *Apparel*.

**Enlaces de producto:** la página de cada producto es `product.html?id=<handle de Shopify>`.

### 3. En el sitio

Abre `assets/js/shop-config.js` y llena:

```js
domain: 'tu-tienda.myshopify.com',
storefrontToken: 'el-token-público',
```

Sube el sitio de nuevo a Netlify. No hay que cambiar nada más.

### 4. Probar antes de vender

1. Activa el **modo de prueba** de pagos en Shopify (Settings → Payments → Test mode).
2. En el sitio: agrega productos, cambia tallas y revisa que una talla agotada aparezca tachada.
3. Pulsa *Checkout Now*: debe abrirse el checkout de Shopify con los mismos productos y cantidades.
4. Completa un pago de prueba y vuelve al sitio: el carrito debe quedar vacío.
5. Desactiva el modo de prueba.

## Si algo falla

- **La tienda dice "We couldn't load the shop right now":** revisa el dominio y el token en `shop-config.js`, y que los productos estén publicados en el canal Headless.
- **No hay topes por existencia:** al token le falta el permiso de inventario. La consola del navegador muestra el aviso `[shop] Shopify token is missing a permission`. Actívalo, o pon `readInventory: false` en `shop-config.js` para no pedirlo. Las tallas agotadas se siguen marcando.
- **Al pagar aparece "Limited stock: … reduced to …":** otra persona compró antes y Shopify ajustó la cantidad a lo disponible. El carrito del sitio se actualiza igual, el aviso dice qué producto cambió y el cliente sigue con *Continue to checkout*.
- **Un producto del carrito dice "No longer available":** se borró, se despublicó o se agotó en Shopify. No cuenta en el total y hay que quitarlo para pagar. Si solo se renombró una variante (p. ej. "M" → "Medium"), el carrito la reconoce sola.
- **Mientras carga Shopify** las tarjetas de producto del inicio y del menú no se ven (así no aparecen los productos de relleno del diseño); si Shopify no responde, siguen ocultas.
- **Un producto no aparece:** que esté activo, publicado en Headless y que tenga al menos una variante.
- **Precios en otra moneda:** revisa el mercado de México en Shopify; el sitio pide precios para `country: 'MX'`.

## Mantenimiento

- **Versión de la API:** `apiVersion: '2026-10'` en `shop-config.js` funciona hasta octubre de 2027. Una vez al año cámbiala por la versión estable más reciente (shopify.dev/docs/api/usage/versioning) y prueba la tienda.
- **Carrito guardado:** el sitio recuerda el último carrito enviado a Shopify (en el navegador del cliente) solo para vaciarlo después de la compra; se descarta a los 30 días, cuando Shopify lo expira.

## Archivos

- `assets/js/shop-config.js` — dominio, token, categorías (lo único que se edita).
- `assets/js/shopify.js` — conexión con la Storefront API.
- `assets/js/catalog.js` — catálogo (de Shopify o de muestra).
- `assets/js/commerce.js` — carrito y pago.
- `assets/js/shop-teasers.js` — tarjetas de producto del inicio y del menú.
- `shop.html`, `product.html`, `cart.html` — páginas de la tienda.
