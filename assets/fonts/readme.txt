NMD19 — Tipografía
=================

Manuka Black (Klim Type Foundry)
- Archivo local: manuka-black.woff2, proporcionado por la usuaria.
- Declaración: fonts.css, familia Manuka, peso 900.
- Integrada en todas las páginas HTML, en los títulos y en los estilos display.
- Los títulos display generados por JavaScript también usan la misma familia.
- Los nombres de productos usan Radio Grotesk, como indica Figma.

Radio Grotesk Regular (Pangram Pangram)
- Archivo local: PPRadioGrotesk-Regular.woff2, proporcionado por la usuaria.
- Declaración: fonts.css, familia Radio Grotesk, peso 400.
- Usos verificados en Figma: nombres de productos, precios, direcciones,
  etiquetas, opciones de formularios y textos de apoyo, en escritorio y móvil.
- Referencia: Ai93pEvdkr3QGfgdPQgbsE; nodos 147:41 y 3:38.
- Los bloques que Figma define como Helvetica Neue usan esa familia directamente,
  con Helvetica y Arial como alternativas del sistema.

Lunchtype25 Condensed Medium
- Archivo local: Lunchtype25-Medium-Condensed.ttf, proporcionado por la usuaria.
- Declaración: fonts.css, familia Lunchtype25, peso 500.
- Sustituye Oswald en los 12 bloques condensados del diseño: presentación del
  estudio, especialidad del artista, introducción del formulario y detalles
  de material/modelo de productos, en escritorio y móvil.
- También aplicada al texto equivalente del formulario y producto funcionales.
- Referencia Figma: Desktop/H4 Condensed; nodos 18:33 y 144:232.
- Light y Regular no se cargan: los usos revisados en Figma indican Medium.
Solo se cargan los archivos locales disponibles.

Tamaños e interlineados
- Las pantallas exact-* conservan las medidas de cada capa y el escalado del lienzo.
- Se contrastaron 332 textos de 9 pantallas con las medidas actuales de Figma.
- Las otras pantallas reutilizan estilos compartidos y medidas móviles de la
  revisión anterior; el límite de consultas impidió volver a leerlas todas.
- assets/css/typography.css aplica la escala equivalente a tienda, producto,
  carrito y formulario, interpolando entre las referencias de 440 y 1920 px.
