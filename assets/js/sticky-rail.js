/* ============================================================
   NMD19 — Menú lateral FIJO + overlay animado del menú.
   ------------------------------------------------------------
   · Rail fijo (izquierda) con los iconos ORIGINALES del Figma:
       hamburguesa (2 barras CSS, se transforma en X al abrir),
       logo N sólido, carrito con badge arriba.
   · Al hacer clic en la hamburguesa, el menú (exact-desktop-menu.html)
     entra como OVERLAY que cubre la página (wipe izq→der) y su
     contenido aparece con fade-in ESCALONADO de izquierda a derecha.
     No recarga la página: el menú va en un iframe (?embed=1) precargado.
   · El borde claro del rail fuerza el pintado del fondo blanco en Chrome.
   · Páginas sin #stage (shop, product, cart, booking-form) por debajo de
     1024px: barra superior móvil como el header del Figma móvil.
   · Páginas exact-mobile-*: nunca llevan el rail de escritorio. En
     exact-mobile-menu-expanded.html el botón del menú cierra el menú.
   ============================================================ */
(function(){
  var EMBED = /[?&]embed=1/.test(location.search);
  // Versión de este script (?v=…): se pasa al iframe del menú para que nunca cargue una copia vieja de caché.
  var SELF_V = ((document.currentScript && document.currentScript.src || '').match(/[?&]v=([^&#]+)/) || [])[1] || '';
  var RAIL_ID = 'nmd-rail-fixed';
  var BAR_ID = 'nmd-topbar';
  var DESKTOP_MQ = '(min-width: 1024px)';          // mismo corte que device-route.js
  var PAGE = (location.pathname.split('/').pop() || '').toLowerCase().replace(/\.html$/, '');
  var MOBILE_PAGE = /^exact-mobile-/.test(PAGE);
  var root = document.documentElement;

  // ---------- iconos originales del Figma ----------
  var IC = {
    logoVB:'0 0 40 62',
    logo:'<path d="M0 8.75L0 25.04L6.59 32.48L0 31.59L0 62L40 57.85L40 36.97L9.31 32.89L12.26 29.27L40 32.8L40 0L0 8.75Z"/>',
    cartVB:'0 0 28 30',
    cart:'<path d="M2.62 0C3.68 0 4.34 .6 4.72 1.21L4.87 1.47L4.92 1.58L4.95 1.69L5.61 4.12L25.57 4.12C27.14 4.12 28.36 5.63 27.9 7.13L25.17 17.13L25.14 17.24L25.09 17.35C24.74 18.04 24.05 18.82 22.83 18.82L9.62 18.82L10.43 21.76L22.6 21.76C24.89 21.76 26.76 23.61 26.76 25.88C26.76 28.16 24.89 30 22.6 30C20.3 30 18.43 28.16 18.43 25.88C18.43 25.25 18.58 24.65 18.83 24.12L14.46 24.12C14.72 24.65 14.87 25.25 14.87 25.88C14.87 28.16 13 30 10.7 30C8.4 30 6.54 28.16 6.54 25.88C6.54 24.54 7.19 23.35 8.19 22.6L2.7 2.45C2.66 2.4 2.64 2.37 2.63 2.35L0 2.35L0 0L2.62 0ZM10.7 24.12C9.72 24.12 8.92 24.91 8.92 25.88C8.92 26.86 9.72 27.65 10.7 27.65C11.69 27.65 12.49 26.86 12.49 25.88C12.49 24.91 11.69 24.12 10.7 24.12ZM22.6 24.12C21.61 24.12 20.81 24.91 20.81 25.88C20.81 26.86 21.61 27.65 22.6 27.65C23.58 27.65 24.38 26.86 24.38 25.88C24.38 24.91 23.58 24.12 22.6 24.12ZM8.98 16.47L22.84 16.47C22.86 16.46 22.88 16.43 22.91 16.37L25.61 6.52L25.61 6.5C25.6 6.49 25.59 6.48 25.58 6.47L25.57 6.47L6.26 6.47L8.98 16.47Z"/>',
    // header móvil (exact-mobile-home.html)
    mMenuVB:'0 0 20 18',
    mMenu:'<path d="M20 18H0v-2.57h20V18ZM20 10.29H0V7.71h20v2.58ZM20 2.57H0V0h20v2.57Z"/>',
    mLogoVB:'0 0 47.715 31',     // la N del Figma móvil va girada 90°
    mLogo:'<path transform="matrix(0 1 -1 0 47.715 0)" d="M0 6.73L0 19.27L5.11 25L0 24.31L0 47.71L31 44.52L31 28.45L7.21 25.31L9.5 22.52L31 25.24L31 0L0 6.73Z"/>',
    mCartVB:'0 0 20 22',
    mCart:'<path fill-rule="evenodd" d="M1.87 0C2.63 0 3.1 .44 3.37 .89L3.48 1.08L3.52 1.16L3.54 1.24L4.01 3.02L18.26 3.02C19.38 3.02 20.26 4.13 19.93 5.23L17.98 12.56L17.96 12.65L17.92 12.72C17.67 13.23 17.18 13.8 16.31 13.8L6.87 13.8L7.45 15.96L16.14 15.96C17.78 15.96 19.11 17.31 19.11 18.98C19.11 20.65 17.78 22 16.14 22C14.5 22 13.17 20.65 13.17 18.98C13.17 18.52 13.27 18.08 13.45 17.69L10.33 17.69C10.52 18.08 10.62 18.52 10.62 18.98C10.62 20.65 9.29 22 7.65 22C6 22 4.67 20.65 4.67 18.98C4.67 18 5.13 17.13 5.85 16.57L1.93 1.8C1.9 1.76 1.89 1.73 1.88 1.73L0 1.73L0 0L1.87 0ZM7.65 17.69C6.94 17.69 6.37 18.27 6.37 18.98C6.37 19.7 6.94 20.27 7.65 20.27C8.35 20.27 8.92 19.7 8.92 18.98C8.92 18.27 8.35 17.69 7.65 17.69ZM16.14 17.69C15.44 17.69 14.87 18.27 14.87 18.98C14.87 19.7 15.44 20.27 16.14 20.27C16.84 20.27 17.41 19.7 17.41 18.98C17.41 18.27 16.84 17.69 16.14 17.69ZM6.42 12.08L16.32 12.08C16.33 12.07 16.34 12.05 16.37 12.01L18.29 4.78L18.3 4.77C18.29 4.76 18.28 4.75 18.26 4.75L4.47 4.75L6.42 12.08Z"/>'
  };
  function svg(vb,inner){ return '<svg viewBox="'+vb+'" fill="#000" aria-hidden="true" focusable="false">'+inner+'</svg>'; }

  // Clic "normal": sin modificadores, botón izquierdo y sin preventDefault previo.
  function plainClick(e){
    return !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  }
  function isDesktop(){ return window.matchMedia ? window.matchMedia(DESKTOP_MQ).matches : window.innerWidth >= 1024; }

  // El #stage se centra (margin:auto) en pantallas anchas dejando franjas
  // grises. El de escritorio (1920px) se alinea a la izquierda junto al rail;
  // el móvil (440px) se queda centrado (teléfonos en horizontal, tablets). Fondo negro.
  function layoutFix(){
    var stage = document.getElementById('stage');
    if (stage) stage.style.margin = stage.offsetWidth < 600 ? '0 auto' : '0';
    document.body.style.background = '#000';
    root.style.background = '#000';
  }

  /* ======================================================
     MODO EMBED: corre dentro del iframe del overlay.
     Oculta su propio rail, alinea, links→ventana padre, y
     escalona el contenido al recibir el mensaje 'nmd-play'.
     ====================================================== */
  var embedDone = false;
  function embedInit(){
    if (embedDone) return; embedDone = true;     // correr una sola vez
    layoutFix();
    var stage = document.getElementById('stage');
    if (!stage){ embedDone = false; return; }     // reintentar si aún no hay stage

    // hover de los links de sección (como el Figma: amarillo + subrayado); igual con teclado
    var hv = document.createElement('style');
    hv.textContent = '.nmd-navlink{transition:color .2s ease}.nmd-navlink:hover,.nmd-navlink:focus-visible{color:#FDDE36 !important;text-decoration:underline !important;text-underline-offset:.1em;text-decoration-thickness:.05em}';
    document.head.appendChild(hv);
    var navLinks = [];
    [].forEach.call(document.querySelectorAll('a'), function(a){
      var t = (a.textContent||'').trim().toLowerCase();
      if (['home','studio','work','appointments','shop'].indexOf(t) > -1){ a.classList.add('nmd-navlink'); navLinks.push(a); }
    });
    // ocultar el rail original del menú (barra blanca x≈0, alto completo)
    var kids = [].slice.call(stage.children);
    var vh = window.innerHeight || 800;
    var stageH = stage.getBoundingClientRect().height || vh;
    var items = [];
    function isWhite(el){
      var bg = el ? getComputedStyle(el).backgroundColor : '';
      return bg === 'rgb(255, 255, 255)' || bg === 'rgba(255, 255, 255, 1)';
    }
    kids.forEach(function(c){
      var r = c.getBoundingClientRect();
      var cs = getComputedStyle(c);
      // Alto comparado con el escenario (no con la ventana): en ventanas altas y angostas el menú mide
      // menos del 60 % de la pantalla y el rail del Figma no se detectaba (asomaba una franja blanca).
      var isRail = r.left <= 4 && r.width < 140 && r.height > stageH*0.8 && isWhite(c);
      if (isRail){ c.style.display = 'none'; return; }
      // El rail del Figma suele ser un contenedor (fondo blanco = primer hijo). Se oculta del todo:
      // si solo quedaba debajo del rail fijo del padre, en algunos anchos asomaba una franja blanca.
      if (r.left <= 4 && r.width < 140 && r.height > stageH*0.8 && isWhite(c.firstElementChild)){
        c.style.display = 'none'; c.inert = true; c.setAttribute('aria-hidden','true'); return;
      }
      // el fade (opacidad 0→100 + reveal) SOLO en TEXTOS e IMÁGENES,
      // NO en las líneas divisoras / fondo (quedan sólidas desde el inicio).
      var hasText = (c.textContent || '').trim().length > 0;
      var hasImg  = cs.backgroundImage !== 'none' || !!c.querySelector('img,[style*="background-image"]');
      if (!hasText && !hasImg) return;
      c.addEventListener('transitionend', function(event){
        if (event.target === c && event.propertyName === 'clip-path' && c.style.opacity === '1') {
          c.style.clipPath = 'none';
        }
      });
      items.push({ el: c, x: r.left });
    });
    items.sort(function(a,b){ return a.x - b.x; });
    var maxX = items.length ? items[items.length-1].x : 1;

    // IMPORTANTE: solo animamos OPACIDAD. Muchos grupos se posicionan con
    // transform:matrix(...) (render del Figma); tocar transform los rompería.
    // El efecto "de izquierda a derecha" viene del DELAY según la X.
    function hold(){
      items.forEach(function(it){
        it.el.style.transition = 'none';
        it.el.style.opacity = '0';
        it.el.style.clipPath = 'inset(0 100% 0 0)';      // oculto; se revela de izq→der
        it.el.style.willChange = 'opacity,clip-path';
      });
    }
    function play(){
      void document.body.offsetWidth;                   // reflow: registra el estado oculto
      items.forEach(function(it){
        var d = Math.round((it.x / (maxX||1)) * 680);   // delay por posición X (izq→der)
        it.el.style.transition = 'opacity .5s ease ' + d + 'ms, clip-path .65s cubic-bezier(.22,1,.36,1) ' + d + 'ms';
        it.el.style.opacity = '1';
        it.el.style.clipPath = 'inset(0 0 0 0)';         // revela el contenido de izq→der
      });
    }
    // Abierto con teclado: el foco va al primer link de sección (el de más arriba).
    function focusFirst(){
      var first = navLinks.slice().sort(function(a,b){
        return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
      })[0] || document.querySelector('a[href]');
      if (first) { try { first.focus({ preventScroll: true }); } catch(err){ first.focus(); } }
    }
    hold();

    // links del menú → navegan la ventana PADRE (no el iframe).
    // Clics con modificador / botón central / ya cancelados: comportamiento normal.
    document.addEventListener('click', function(e){
      if (!plainClick(e)) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href');
      if (!h || h.charAt(0)==='#' || a.target==='_blank' || /^(https?:|mailto:|tel:)/.test(h)) return;
      e.preventDefault(); e.stopImmediatePropagation();
      try { window.top.location.href = h; } catch(err){ window.parent.location.href = h; }
    }, true);

    // Escape con el foco dentro del iframe: pedir al padre que cierre.
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') { try { window.parent.postMessage('nmd-close','*'); } catch(err){} }
    });

    // mensajes desde el padre
    window.addEventListener('message', function(e){
      if (e.source !== window.parent) return;
      if (e.data === 'nmd-play'){ play(); }        // directo (rAF se throttleaba en iframe oculto)
      else if (e.data === 'nmd-focus'){ focusFirst(); }
      else if (e.data === 'nmd-reset'){ hold(); }
    });
    // avisar al padre que ya cargó
    try { window.parent.postMessage('nmd-ready','*'); } catch(err){}
  }

  /* ======================================================
     MODO NORMAL: rail + overlay (escritorio)
     ====================================================== */
  function findBar(){
    var vh = window.innerHeight || 800;
    var stage = document.getElementById('stage');
    // Un stage corto (p. ej. el perfil de 1080px en una ventana alta/vertical)
    // se ve más bajo que la ventana: comparamos con el menor de los dos.
    var minH = Math.min(vh, stage ? stage.getBoundingClientRect().height : vh) * 0.5;
    var best = null;
    var divs = document.querySelectorAll('div');
    for (var i=0;i<divs.length;i++){
      var el = divs[i];
      if (el.closest && el.closest('#'+RAIL_ID)) continue;
      var r = el.getBoundingClientRect();
      var bg = getComputedStyle(el).backgroundColor;
      if (r.left <= 3 && r.width >= 12 && r.width <= 220 && r.height > minH &&
          (bg === 'rgb(255, 255, 255)' || bg === 'rgba(255, 255, 255, 1)')) {
        if (!best || r.height > best.height) best = { width: r.width, height: r.height, el: el };
      }
    }
    return best;
  }

  // El rail estático del Figma queda debajo del rail fijo: sacarlo del orden
  // de tabulación y del árbol de accesibilidad (inert) mientras esté tapado.
  var muted = [];
  function muteStaticRail(bar){
    var stage = document.getElementById('stage');
    var want = [];
    if (bar && bar.el && stage){
      var box = bar.el.parentElement;              // contenedor del rail (fondo + links)
      if (box && box !== stage && stage.contains(box)) want = [box];
      else {
        var br = bar.el.getBoundingClientRect();
        want = [].filter.call(stage.querySelectorAll('a[href],button,[tabindex]'), function(n){
          var r = n.getBoundingClientRect();
          return r.width > 0 && r.left >= br.left - 1 && r.right <= br.right + 1;
        });
      }
    }
    muted.forEach(function(n){ if (want.indexOf(n) < 0){ n.inert = false; n.removeAttribute('aria-hidden'); } });
    want.forEach(function(n){ n.inert = true; n.setAttribute('aria-hidden','true'); });
    muted = want;
  }

  function buildRail(W){
    W = Math.round(Math.max(40, Math.min(W, 280)));
    root.style.setProperty('--nmd-rail-width', W + 'px');
    var hamW = Math.round(W*0.40), barT = Math.max(2, Math.round(hamW*0.10)), hamG = Math.max(4, Math.round(hamW*0.18)), hamH = hamG*2 + barT;
    var logoW= Math.round(W*0.375), logoH= Math.round(logoW*62/40);
    var cartW= Math.round(W*0.30),  cartH= Math.round(cartW*30/28);
    var badgeD = Math.round(W*0.36), badgeF = Math.round(badgeD*0.5);
    var pad  = Math.round(Math.max(16, W*0.30));

    var css = ''
      + '#'+RAIL_ID+'{position:fixed;left:0;top:0;bottom:0;width:'+W+'px;'
      +   'background:#fff;border:1px solid #e6e6e6;display:flex;flex-direction:column;'
      +   'align-items:center;justify-content:space-between;padding:'+pad+'px 0;'
      +   'z-index:99999;box-sizing:border-box}'
      + '#'+RAIL_ID+' a,#'+RAIL_ID+' button{display:flex;align-items:center;justify-content:center;'
      +   'text-decoration:none;color:#000;background:none;border:none;padding:0;cursor:pointer}'
      + '#'+RAIL_ID+' svg{display:block}'
      + '#'+RAIL_ID+' .nmd-logo svg{width:'+logoW+'px;height:'+logoH+'px}'
      + '#'+RAIL_ID+' .nmd-cart svg{width:'+cartW+'px;height:'+cartH+'px}'
      // hamburguesa = 2 líneas CSS que se transforman en X (solo transform → morph suave)
      + '#'+RAIL_ID+' .nmd-menu{position:relative;width:'+hamW+'px;height:'+hamH+'px}'
      + '#'+RAIL_ID+' .nmd-menu::before{content:"";position:absolute;left:50%;top:50%;width:44px;height:44px;transform:translate(-50%,-50%)}'
      + '#'+RAIL_ID+' .nmd-menu span{position:absolute;left:0;top:50%;width:100%;height:'+barT+'px;'
      +   'margin-top:'+(-barT/2)+'px;background:#000;border-radius:'+barT+'px;'
      +   'transition:transform .42s cubic-bezier(.65,0,.35,1)}'
      + '#'+RAIL_ID+' .nmd-menu span:nth-child(1){transform:translateY(-'+hamG+'px)}'
      + '#'+RAIL_ID+' .nmd-menu span:nth-child(2){transform:translateY('+hamG+'px)}'
      + '#'+RAIL_ID+' .nmd-menu.x span:nth-child(1){transform:rotate(45deg)}'
      + '#'+RAIL_ID+' .nmd-menu.x span:nth-child(2){transform:rotate(-45deg)}'
      + '#'+RAIL_ID+' .nmd-cart{flex-direction:column;gap:'+Math.round(badgeD*0.28)+'px}'
      + '#'+RAIL_ID+' .nmd-badge{width:'+badgeD+'px;height:'+badgeD+'px;border-radius:50%;background:#e8e8e8;'
      +   'color:#000;display:flex;align-items:center;justify-content:center;font-size:'+badgeF+'px;'
      +   "font-family:'Radio Grotesk',Arial,sans-serif;line-height:1}";

    var st = document.getElementById('nmd-rail-style');
    if (!st){ st = document.createElement('style'); st.id='nmd-rail-style'; document.head.appendChild(st); }
    st.textContent = css;

    // El rail se crea UNA vez; en cada resize solo cambia el CSS (así no se
    // pierden el foco ni el estado X del botón).
    if (!document.getElementById(RAIL_ID)){
      var rail = document.createElement('nav');
      rail.id = RAIL_ID; rail.setAttribute('aria-label','Site');
      rail.innerHTML = ''
        + '<button type="button" class="nmd-menu" id="nmdMenuBtn" aria-controls="nmdOverlay"><span></span><span></span></button>'
        + '<a class="nmd-logo" href="exact-desktop-studio-2.html" aria-label="NMD19 home">'+svg(IC.logoVB,IC.logo)+'</a>'
        + '<a class="nmd-cart" href="cart.html" aria-label="Cart"><span class="nmd-badge" aria-hidden="true">0</span>'+svg(IC.cartVB,IC.cart)+'</a>';
      document.body.insertBefore(rail, document.body.firstChild);   // primero en el orden de tabulación
      document.getElementById('nmdMenuBtn').addEventListener('click', toggleMenu);
      rail.querySelector('.nmd-cart').addEventListener('click', onCartClick);
    }
    syncMenuButton();
    updateBadge();
  }
  function removeRail(){
    var rail = document.getElementById(RAIL_ID);
    if (rail) rail.remove();
  }

  // Carrito: abre el drawer de commerce.js si existe; si no, va a cart.html.
  function onCartClick(e){
    if (!plainClick(e) || typeof window.openCart !== 'function') return;
    e.preventDefault(); closeMenu(false); window.openCart();
  }

  // ---------- overlay con iframe del menú ----------
  var ovBuilt = false, ovReady = false, isOpen = false, focusLink = false, inerted = [];
  function ensureOverlay(){
    if (ovBuilt) return;
    ovBuilt = true;
    var st = document.createElement('style');
    st.textContent = ''
      + '.nmd-ov{position:fixed;inset:0;z-index:99990;background:#000;'
      +   'clip-path:inset(0 100% 0 0);visibility:hidden;'
      +   'transition:clip-path .55s cubic-bezier(.76,0,.24,1),visibility 0s linear .55s}'
      + '.nmd-ov.open{clip-path:inset(0 0 0 0);visibility:visible;transition:clip-path .55s cubic-bezier(.76,0,.24,1)}'
      + '.nmd-ov iframe{width:100%;height:100%;border:0;display:block;background:#000}'
      + 'body.nmd-locked{overflow:hidden}';
    document.head.appendChild(st);

    var ov = document.createElement('div');
    ov.className = 'nmd-ov'; ov.id = 'nmdOverlay';
    var fr = document.createElement('iframe');
    fr.id = 'nmdMenuFrame'; fr.setAttribute('title','Menu'); fr.setAttribute('loading','eager');
    fr.src = 'exact-desktop-menu.html?embed=1&layout=menu-language-1' + (SELF_V ? '&v=' + SELF_V : '');
    ov.appendChild(fr);
    document.body.appendChild(ov);

    window.addEventListener('message', function(e){
      if (e.source !== frameWin()) return;
      if (e.data === 'nmd-ready'){ ovReady = true; if (isOpen){ post('nmd-play'); if (focusLink) post('nmd-focus'); } }
      else if (e.data === 'nmd-close' && isOpen){ closeMenu(); }   // Escape dentro del iframe
    });
  }
  function frameWin(){ var f=document.getElementById('nmdMenuFrame'); return f && f.contentWindow; }
  function post(msg){ var w = frameWin(); if (w) w.postMessage(msg,'*'); }
  function syncMenuButton(){
    var btn = document.getElementById('nmdMenuBtn');
    if (!btn) return;
    var shown = isOpen || (PAGE === 'exact-desktop-menu' && !EMBED);   // la página del menú sola ya es el menú
    btn.classList.toggle('x', shown);
    btn.setAttribute('aria-label', shown ? 'Close menu' : 'Open menu');
    btn.setAttribute('aria-expanded', shown ? 'true' : 'false');
  }
  // Con el menú abierto, todo lo que hay detrás queda inert (menos rail y overlay).
  function setPageInert(on){
    if (on){
      [].forEach.call(document.body.children, function(el){
        if (el.id === RAIL_ID || el.id === 'nmdOverlay' || el.inert || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(el.tagName)) return;
        el.inert = true; inerted.push(el);
      });
    } else {
      inerted.forEach(function(el){ el.inert = false; });
      inerted = [];
    }
  }
  // byKeyboard: abierto con Enter/Espacio → el foco va al primer link (con anillo
  // de foco). Con el mouse el foco entra al iframe sin marcar ningún link.
  function openMenu(byKeyboard){
    ensureOverlay();
    if (isOpen) return;
    isOpen = true;
    document.getElementById('nmdOverlay').classList.add('open');
    syncMenuButton();
    document.body.classList.add('nmd-locked');
    setPageInert(true);
    var fr = document.getElementById('nmdMenuFrame');
    try { fr.focus({ preventScroll: true }); } catch(e){}
    focusLink = !!byKeyboard;
    post('nmd-play');
    if (focusLink) post('nmd-focus');
  }
  // restoreFocus === false: no devolver el foco al botón (p. ej. al abrir el carrito)
  function closeMenu(restoreFocus){
    if (!isOpen) return;
    isOpen = false;
    var ov = document.getElementById('nmdOverlay');
    if (ov) ov.classList.remove('open');
    syncMenuButton();
    document.body.classList.remove('nmd-locked');
    setPageInert(false);
    post('nmd-reset');
    var btn = document.getElementById('nmdMenuBtn');
    if (restoreFocus !== false && btn) { try { btn.focus({ preventScroll: true }); } catch(e){ btn.focus(); } }
  }
  // e.detail === 0: clic generado por teclado (Enter/Espacio) o lector de pantalla
  function toggleMenu(e){
    if (e) e.preventDefault();
    // En la página del menú abierta sola (exact-desktop-menu.html sin iframe) el botón cierra esa página.
    if (PAGE === 'exact-desktop-menu' && !EMBED){ leaveStandaloneMenu('exact-desktop-studio-2.html'); return; }
    if (isOpen) closeMenu(); else openMenu(!!e && e.detail === 0);
  }
  if (!EMBED) document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    if (isOpen) closeMenu();
    else if (PAGE === 'exact-desktop-menu' && !e.defaultPrevented) leaveStandaloneMenu('exact-desktop-studio-2.html');
  });
  // Al volver con el botón Atrás (bfcache) la página no debe aparecer con el menú abierto.
  if (!EMBED) window.addEventListener('pageshow', function(e){ if (e.persisted && isOpen) closeMenu(false); });

  /* ======================================================
     BARRA SUPERIOR MÓVIL (shop, product, cart, booking-form < 1024px)
     Réplica del header del Figma móvil: caja blanca 392×56 (escala del
     stage de 440px), menú | logo | carrito, separadores #bebebe.
     ====================================================== */
  function buildTopBar(){
    var vw = root.clientWidth || window.innerWidth || 375;
    var vh = window.innerHeight || 812;
    // En horizontal la escala también depende del alto, para que la barra no ocupe un cuarto de pantalla.
    var k = Math.min(1, vw / 440, vh / 640);
    var m = Math.round(24*k);                       // margen exterior del Figma
    var h = Math.max(44, Math.round(56*k));         // alto de la caja (≥ 44px táctil)
    var cell = Math.max(44, Math.round(62*k));      // ancho de las celdas menú / carrito
    var gap = Math.round(12*k);
    var total = m + h + gap;
    var mw = +(20*k).toFixed(1), mh = +(18*k).toFixed(1);
    var lw = +(47.715*k).toFixed(1), lh = +(31*k).toFixed(1);
    var cw = +(20*k).toFixed(1), ch = +(22*k).toFixed(1);
    var bd = Math.max(16, Math.round(18*k));
    root.style.setProperty('--nmd-topbar-h', total + 'px');
    root.style.setProperty('--nmd-rail-width', '0px');
    root.style.setProperty('--rail', '0px');

    var B = '#'+BAR_ID;
    var css = ''
      + B+'{position:fixed;left:0;right:0;top:0;z-index:85;box-sizing:border-box;padding:'+m+'px '+m+'px '+gap+'px;background:#000}'
      + B+' .nmd-tb{display:flex;align-items:stretch;height:'+h+'px;background:#fff;border-radius:'+Math.round(8*k)+'px;overflow:hidden}'
      + B+' a{position:relative;display:flex;align-items:center;justify-content:center;box-sizing:border-box;color:#000;text-decoration:none;-webkit-tap-highlight-color:transparent}'
      + B+' a:focus-visible{outline:2px solid #000;outline-offset:-5px}'
      + B+' svg{display:block}'
      + B+' .nmd-tb-menu,'+B+' .nmd-tb-cart{flex:0 0 '+cell+'px}'
      + B+' .nmd-tb-menu{border-right:1px solid #bebebe}'
      + B+' .nmd-tb-cart{border-left:1px solid #bebebe}'
      + B+' .nmd-tb-mid{flex:1 1 auto;display:flex;justify-content:center}'
      + B+' .nmd-tb-logo{width:'+Math.max(cell, Math.round(lw + 32))+'px}'
      + B+' .nmd-tb-menu svg{width:'+mw+'px;height:'+mh+'px}'
      + B+' .nmd-tb-logo svg{width:'+lw+'px;height:'+lh+'px}'
      + B+' .nmd-tb-cart svg{width:'+cw+'px;height:'+ch+'px}'
      + B+' .nmd-badge{position:absolute;left:calc(50% + '+(cw/2 - bd*0.45).toFixed(1)+'px);top:calc(50% - '+(ch/2 + bd*0.55).toFixed(1)+'px);'
      +   'min-width:'+bd+'px;height:'+bd+'px;padding:0 4px;box-sizing:border-box;border-radius:'+bd+'px;background:#e8e8e8;box-shadow:0 0 0 2px #fff;'
      +   'color:#000;display:flex;align-items:center;justify-content:center;font-size:'+Math.round(bd*0.62)+'px;'
      +   "font-family:'Radio Grotesk',Arial,sans-serif;line-height:1}";
    var st = document.getElementById('nmd-topbar-style');
    if (!st){ st = document.createElement('style'); st.id = 'nmd-topbar-style'; document.head.appendChild(st); }
    st.textContent = css;

    if (!document.getElementById(BAR_ID)){
      var bar = document.createElement('nav');
      bar.id = BAR_ID; bar.setAttribute('aria-label','Site');
      bar.innerHTML = '<div class="nmd-tb">'
        + '<a class="nmd-tb-menu" href="exact-mobile-menu-expanded.html" aria-label="Open menu">'+svg(IC.mMenuVB,IC.mMenu)+'</a>'
        + '<span class="nmd-tb-mid"><a class="nmd-tb-logo" href="exact-mobile-home.html" aria-label="NMD19 home">'+svg(IC.mLogoVB,IC.mLogo)+'</a></span>'
        + '<a class="nmd-tb-cart" href="cart.html" aria-label="Cart">'+svg(IC.mCartVB,IC.mCart)+'<span class="nmd-badge" aria-hidden="true">0</span></a>'
        + '</div>';
      document.body.insertBefore(bar, document.body.firstChild);
      bar.querySelector('.nmd-tb-cart').addEventListener('click', onCartClick);
    }
    document.body.classList.remove('nmd-shared-navigation');
    document.body.classList.add('nmd-topbar-on');
    root.classList.add('nmd-topbar-on');
    updateBadge();
  }
  function removeTopBar(){
    var bar = document.getElementById(BAR_ID);
    if (bar) bar.remove();
    document.body.classList.remove('nmd-topbar-on');
    root.classList.remove('nmd-topbar-on');
    root.style.removeProperty('--nmd-topbar-h');
  }

  /* ======================================================
     MENÚ MÓVIL (exact-mobile-menu-expanded.html): su botón de menú
     apuntaba a la misma página. Ahora lo cierra: vuelve atrás si la
     página anterior es del sitio; si no, a la home móvil. Escape también.
     ====================================================== */
  var mobileMenuReady = false, closing = false, closeTimer = null;
  function setupMobileMenuClose(){
    if (mobileMenuReady || PAGE !== 'exact-mobile-menu-expanded') return;
    var btn = document.querySelector('#stage a[href="exact-mobile-menu-expanded.html"]');
    if (!btn) return;
    mobileMenuReady = true;
    btn.setAttribute('aria-label', 'Close menu');
    btn.setAttribute('href', 'exact-mobile-home.html');   // destino si se abre en otra pestaña
    // Icono: una X (cerrar) en lugar de la hamburguesa del Figma, en la misma caja de 20×18 y con el grosor de sus barras.
    var icon = btn.querySelector('svg');
    if (icon) icon.innerHTML = '<path d="M2.5 1.5L17.5 16.5M17.5 1.5L2.5 16.5" fill="none" stroke="#000" stroke-width="2.57" stroke-linecap="square"/>';
    btn.addEventListener('click', function(e){
      if (!plainClick(e)) return;
      e.preventDefault();                                  // la transición inline lo ignora
      closeMobileMenu();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && !e.defaultPrevented) closeMobileMenu();
    });
    window.addEventListener('pagehide', function(){ clearTimeout(closeTimer); closing = false; });
  }
  function cameFromSite(){
    try {
      if (!document.referrer || history.length < 2) return false;
      var ref = new URL(document.referrer);
      return ref.origin === location.origin && ref.pathname !== location.pathname;
    } catch(e){ return false; }
  }
  function closeMobileMenu(){ leaveStandaloneMenu('exact-mobile-home.html'); }
  // Cierra una página de menú: vuelve atrás si se llegó desde el sitio; si no, va a la home indicada.
  function leaveStandaloneMenu(home){
    if (closing) return;
    closing = true;
    var back = cameFromSite();
    document.body.classList.add('is-leaving');             // mismo fade que las transiciones
    closeTimer = setTimeout(function(){
      if (!back){ location.href = home; return; }
      history.back();
      // si back() no salió de la página (p. ej. solo había un #hash), ir a la home
      closeTimer = setTimeout(function(){ location.href = home; }, 700);
    }, 300);
  }
  if (!EMBED) window.addEventListener('pageshow', function(e){ if (e.persisted){ closing = false; clearTimeout(closeTimer); document.body.classList.remove('is-leaving'); } });

  /* ======================================================
     BADGE del carrito (rail y barra móvil)
     ====================================================== */
  function cartCount(){
    // commerce.js (si está cargado) normaliza las líneas guardadas; así el badge coincide con el carrito.
    try { if (typeof Cart !== 'undefined' && Cart && typeof Cart.count === 'function') return Cart.count(); } catch(e){}
    try {
      var items = JSON.parse(localStorage.getItem('nmd_cart') || '[]');
      if (!Array.isArray(items)) return 0;
      // Misma normalización que Cart.read() en commerce.js: líneas con id; cantidad entera ≥ 1.
      return items.reduce(function(total, item){
        if (!item || typeof item.id !== 'string') return total;
        return total + Math.max(1, Math.floor(Number(item.qty)) || 1);
      }, 0);
    } catch(e){ return 0; }
  }
  function updateBadge(){
    var n = cartCount();
    [].forEach.call(document.querySelectorAll('#'+RAIL_ID+' .nmd-badge,#'+BAR_ID+' .nmd-badge'), function(b){ b.textContent = n; });
    [].forEach.call(document.querySelectorAll('#'+RAIL_ID+' .nmd-cart,#'+BAR_ID+' .nmd-tb-cart'), function(a){
      a.setAttribute('aria-label', 'Cart, ' + n + (n === 1 ? ' item' : ' items'));
    });
  }
  if (!EMBED){
    document.addEventListener('cart:change', updateBadge);
    window.addEventListener('storage', updateBadge);
  }

  // Layout de las páginas sin #stage (se inyecta una vez).
  function ensurePageLayout(){
    if (document.getElementById('nmd-page-layout')) return;
    var layout = document.createElement('style'); layout.id = 'nmd-page-layout';
    layout.textContent = ''
      + 'body.nmd-shared-navigation .main{margin-left:var(--rail);margin-top:0}'
      + 'body.page-appointments.nmd-shared-navigation{padding-left:var(--rail)}'
      // barra móvil fija: el contenido empieza debajo y los sticky se corren
      + 'html.nmd-topbar-on{scroll-padding-top:var(--nmd-topbar-h)}'
      + 'body.nmd-topbar-on{padding-top:var(--nmd-topbar-h)}'
      + 'body.nmd-topbar-on .main{margin-left:0;margin-top:0}'
      + 'body.nmd-topbar-on .submenu{top:var(--nmd-topbar-h)}'
      + 'body.nmd-topbar-on .gallery,body.nmd-topbar-on .summary{top:calc(var(--nmd-topbar-h) + 16px)}'
      // booking-form.css reserva a la izquierda el ancho del rail (+2.2vw): sin rail, márgenes simétricos
      + 'body.page-appointments.nmd-topbar-on .wrap{padding-left:max(6.2vw,24px)!important;min-height:calc(100vh - var(--nmd-topbar-h))}';
    document.head.appendChild(layout);
  }

  function run(){
    layoutFix();
    // Páginas móviles: nunca el rail de escritorio.
    if (MOBILE_PAGE){ setupMobileMenuClose(); return; }
    var stage = document.getElementById('stage');
    if (stage && stage.offsetWidth < 600) return;   // stage móvil (440px) con otro nombre
    if (!stage){
      ensurePageLayout();
      if (!isDesktop()){ closeMenu(false); removeRail(); buildTopBar(); return; }
      removeTopBar();
    }
    var width = Math.max(40, Math.round(108 * Math.min(1, window.innerWidth / 1920)));
    var bar = stage ? findBar() : { width: width };
    if (!stage) {
      root.style.setProperty('--rail', width+'px');
      document.body.classList.add('nmd-shared-navigation');
    }
    if (!bar){ closeMenu(false); removeRail(); muteStaticRail(null); return; }
    buildRail(bar.width);
    muteStaticRail(stage ? bar : null);
    if (!(PAGE === 'exact-desktop-menu' && !EMBED)) ensureOverlay();   // la página del menú sola no se precarga a sí misma
  }
  // rAF para seguir el resize; setTimeout de respaldo (rAF no corre en pestañas ocultas).
  var pending = false;
  function schedule(){
    if (pending) return;
    pending = true;
    var go = function(){ if (!pending) return; pending = false; run(); };
    requestAnimationFrame(go);
    setTimeout(go, 150);
  }

  // ---------- arranque ----------
  if (EMBED){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', embedInit);
    else embedInit();
    window.addEventListener('load', embedInit);   // reintento (guard interno evita doble)
  } else {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
    else run();
    window.addEventListener('load', run);
    window.addEventListener('resize', schedule);
  }
})();
