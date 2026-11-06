/* Reloj del estudio: reemplaza la hora fija del diseño ("12:31:32 pm") por la hora actual de Ciudad de México
   y muestra si el estudio está abierto según HOURS. Mientras HOURS sea null, la etiqueta dice "Local time"
   en lugar de afirmar "Open". */
(() => {
  // Horario por día (0 = domingo … 6 = sábado): [hora de apertura, hora de cierre] en formato 24 h, o null si cierra.
  // Lunes a viernes 11:00–20:00 · sábado 12:00–18:00 · domingo 12:00–20:00.
  const HOURS = { 0: [12, 20], 1: [11, 20], 2: [11, 20], 3: [11, 20], 4: [11, 20], 5: [11, 20], 6: [12, 18] };
  const ZONE = 'America/Mexico_City';
  const TIME_RE = /^\s*\d{1,2}:\d{2}:\d{2}\s*[ap]m\s*$/i;

  const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  const partsFmt = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, weekday: 'short', hour: 'numeric', hourCycle: 'h23' });
  const DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  function status(now) {
    if (!HOURS) return 'Local time';
    const p = Object.fromEntries(partsFmt.formatToParts(now).map(x => [x.type, x.value]));
    const today = HOURS[DAYS[p.weekday]];
    const hour = Number(p.hour);
    return today && hour >= today[0] && hour < today[1] ? 'Open' : 'Closed';
  }

  // Cada reloj es un nodo de texto con la hora; la etiqueta "Open" está en el mismo bloque (antes de un <br>) o en el bloque hermano anterior.
  const clocks = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!TIME_RE.test(node.nodeValue)) continue;
    let label = null;
    let prev = node.previousSibling;
    while (prev && prev.nodeType === 1 && prev.tagName === 'BR') prev = prev.previousSibling;
    if (prev && prev.nodeType === 3 && /^\s*Open\s*$/i.test(prev.nodeValue)) label = prev;
    if (!label) {
      const host = node.parentElement && node.parentElement.previousElementSibling;
      if (host && !host.children.length && /^\s*Open\s*$/i.test(host.textContent)) label = host.firstChild;
    }
    if (node.parentElement) node.parentElement.setAttribute('aria-live', 'off');
    clocks.push({ node, label });
  }
  if (!clocks.length) return;

  function tick() {
    const now = new Date();
    const time = timeFmt.format(now).toLowerCase().replace(/\s+/g, ' ');
    const text = status(now);
    clocks.forEach(c => {
      if (c.node.nodeValue !== time) c.node.nodeValue = time;
      if (c.label && c.label.nodeValue !== text) c.label.nodeValue = text;
    });
  }
  tick();
  setInterval(tick, 1000);
})();
