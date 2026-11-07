# Lista de lanzamiento — NMD19

Estado tras la auditoría completa (web y móvil). Los errores de código encontrados están corregidos y verificados en el navegador. Lo que queda depende de contenido o decisiones del estudio.

Este archivo no se publica (está bloqueado en `netlify.toml`).

## Ya resuelto con los datos del estudio

- [x] **Correo:** "Mail", "Say hello" y "Contact" (escritorio y móvil) abren un correo a info@nomadttt.com. En Appointments, cada "Ask the studio about this question." abre un correo con la pregunta en el asunto.
- [x] **Horario:** el reloj de ubicación muestra "Open" o "Closed" según la hora de CDMX (lunes a viernes 11–20 h, sábado 12–18 h, domingo 12–20 h).
- [x] **F.A.Q.:** correo, contacto de privacidad, horario y anuncio de artistas invitados (Instagram @nomadttt) completados.
- [x] **Tienda:** se publica visible. Mientras no se conecte Shopify, usa los productos de muestra y el botón de pago muestra un aviso (no se cobra nada).
- [x] **Tienda lista para Shopify:** productos, precios, tallas, existencias y pago salen de Shopify al llenar el dominio y el token público en `assets/js/shop-config.js`. Pasos en `SHOPIFY.md`.
- [x] **Tarjetas de producto del inicio y del menú** ("New Items", "New In", "Shop"): se llenan con productos del catálogo y llevan a su página.
- [x] **Créditos del pie:** "Site by: Sabbath" en escritorio y móvil (sin enlace; se agrega si el estudio da la URL).
- [x] **Licencias de fuentes:** pagadas.
- [x] **Descuento del 10 %:** quitado (`DISCOUNT_RATE = 0`). Venía del código original importado (commit `0a43101`); el total ahora es igual al subtotal.
- [x] **Privacy Policy:** quitada la mención al registro REPEP de PROFECO.

## 1. Contenido que falta (lo ve el público)

- [ ] **Instagram del estudio en el sitio.** El diseño no tiene un enlace al Instagram del estudio (solo a los de cada artista). Se puede agregar junto a "Mail".
- [ ] **Teléfono / WhatsApp.** El F.A.Q. los menciona como pendientes ("Call" no existe en el sitio). Si el estudio no usa teléfono, se reescriben esas frases.
- [ ] **Artistas en Pages CMS.** Varias fichas siguen como "Zionele", y la mayoría no tiene especialidad, ubicación ni trabajos ("Coming soon").
- [ ] **Productos reales.** Los de `assets/js/catalog.js` son los del Figma (nombres, precios, fotos). Se reemplazan solos al conectar Shopify (`SHOPIFY.md`).
- [ ] **F.A.Q. y políticas.** 65 datos marcados en amarillo; ver `FAQ-PENDIENTES.md`. Conviene que un abogado revise Terms & Conditions y Privacy Policy.
- [ ] **Preguntas de Appointments.** 11 de 12 respuestas son "Ask the studio about this question." (ahora abren un correo al estudio).

## 2. Decisiones
- [ ] **Formulario de citas.** "Yes, I know what I want" y "No, I need help" llevan a los mismos pasos, aunque el texto dice que el formulario se adapta.
- [ ] **Prototipos del Figma.** Son 16 pantallas exportadas del diseño que ninguna página enlaza: variantes o estados intermedios que el sitio real ya cubre con otras páginas. Siguen en el repositorio, pero no se publican (responden 404 vía `netlify.toml`). ¿Se borran?
  - `exact-desktop-appointments.html` … `-6.html` (6): pantallas del flujo de citas; en vivo son `appointments.html` y `booking-form.html`.
  - `exact-desktop-shop.html`, `exact-desktop-shop-submenu-active.html`, `exact-mobile-shop.html`, `-2.html`: tienda; en vivo, `shop.html`.
  - `exact-desktop-product-inside.html`, `exact-mobile-shop-3.html`: ficha de producto; en vivo, `product.html`.
  - `exact-desktop-my-cart.html`, `exact-mobile-my-cart.html`: carrito; en vivo, `cart.html` y el carrito lateral.
  - `exact-desktop-menu-2.html`: variante del menú.
  - `exact-index.html`: índice interno de las pantallas del Figma.
- [ ] **Dominio final.** Con el dominio se agregan `sitemap.xml`, URL canónica e imagen para compartir en redes (`og:image`).

## 3. Publicación

- [ ] Hacer commit de todos los cambios, incluidos los archivos nuevos (`scroll-reveal.js`, `shop-config.js`, `shopify.js`, `shop-teasers.js`, `SHOPIFY.md`).
- [ ] En Netlify: activar la detección de formularios, configurar el aviso por correo (a info@nomadttt.com) y enviar una cita de prueba real después del despliegue.
- [ ] Revisar en el sitio publicado: que `/assets/js/faq-page.js` responda 200 y que `/CMS.md` responda 404.

## Limitaciones conocidas (no bloquean)

- En las páginas de escritorio exportadas del Figma, el orden de tabulación con teclado no sigue el orden visual.
- En algunas páginas móviles hay textos pequeños: el diseño de 440 px se escala al ancho del teléfono.
- El cambio entre versión móvil y de escritorio ocurre al cargar la página, no al girar el dispositivo.
- Los perfiles de artista comparten título y descripción para redes, porque el sitio es estático.
