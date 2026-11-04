/* ============================================================
   NMD19 — Menú lateral FIJO + overlay animado del menú.
   ------------------------------------------------------------
   · Rail fijo (izquierda) con los iconos ORIGINALES del Figma:
       hamburguesa (3 barras CSS, se transforma en X al abrir),
       logo N sólido, carrito con badge "0" arriba.
   · Al hacer clic en la hamburguesa, el menú (exact-desktop-menu.html)
     entra como OVERLAY que cubre la página (wipe izq→der) y su
     contenido aparece con fade-in ESCALONADO de izquierda a derecha.
     No recarga la página: el menú va en un iframe (?embed=1) precargado.
   · El borde claro del rail fuerza el pintado del fondo blanco en Chrome.
   ============================================================ */
(function(){
  var EMBED = /[?&]embed=1/.test(location.search);
  var RAIL_ID = 'nmd-rail-fixed';

  // ---------- iconos originales del Figma ----------
  var IC = {
    logoVB:'0 0 40 62',
    logo:'<path d="M0 8.75L0 25.04L6.59 32.48L0 31.59L0 62L40 57.85L40 36.97L9.31 32.89L12.26 29.27L40 32.8L40 0L0 8.75Z"/>',
    cartVB:'0 0 28 30',
    cart:'<path d="M2.62 0C3.68 0 4.34 .6 4.72 1.21L4.87 1.47L4.92 1.58L4.95 1.69L5.61 4.12L25.57 4.12C27.14 4.12 28.36 5.63 27.9 7.13L25.17 17.13L25.14 17.24L25.09 17.35C24.74 18.04 24.05 18.82 22.83 18.82L9.62 18.82L10.43 21.76L22.6 21.76C24.89 21.76 26.76 23.61 26.76 25.88C26.76 28.16 24.89 30 22.6 30C20.3 30 18.43 28.16 18.43 25.88C18.43 25.25 18.58 24.65 18.83 24.12L14.46 24.12C14.72 24.65 14.87 25.25 14.87 25.88C14.87 28.16 13 30 10.7 30C8.4 30 6.54 28.16 6.54 25.88C6.54 24.54 7.19 23.35 8.19 22.6L2.7 2.45C2.66 2.4 2.64 2.37 2.63 2.35L0 2.35L0 0L2.62 0ZM10.7 24.12C9.72 24.12 8.92 24.91 8.92 25.88C8.92 26.86 9.72 27.65 10.7 27.65C11.69 27.65 12.49 26.86 12.49 25.88C12.49 24.91 11.69 24.12 10.7 24.12ZM22.6 24.12C21.61 24.12 20.81 24.91 20.81 25.88C20.81 26.86 21.61 27.65 22.6 27.65C23.58 27.65 24.38 26.86 24.38 25.88C24.38 24.91 23.58 24.12 22.6 24.12ZM8.98 16.47L22.84 16.47C22.86 16.46 22.88 16.43 22.91 16.37L25.61 6.52L25.61 6.5C25.6 6.49 25.59 6.48 25.58 6.47L25.57 6.47L6.26 6.47L8.98 16.47Z"/>'
  };
  function svg(vb,inner,w,h){ return '<svg viewBox="'+vb+'" width="'+w+'" height="'+h+'" fill="#000" aria-hidden="true">'+inner+'</svg>'; }

  // El #stage se centra (margin:auto) en pantallas anchas dejando franjas
  // grises. Lo alineamos a la izquierda y ponemos fondo negro. Sin escalar.
  function layoutFix(){
    var stage = document.getElementById('stage');
    if (stage) stage.style.margin = '0';
    document.body.style.background = '#000';
    document.documentElement.style.background = '#000';
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

    // hover de los links de sección (como el Figma: amarillo + subrayado)
    var hv = document.createElement('style');
    hv.textContent = '.nmd-navlink{transition:color .2s ease}.nmd-navlink:hover{color:#FDDE36 !important;text-decoration:underline !important;text-underline-offset:.1em;text-decoration-thickness:.05em}';
    document.head.appendChild(hv);
    [].forEach.call(document.querySelectorAll('a'), function(a){
      var t = (a.textContent||'').trim().toLowerCase();
      if (['home','studio','work','appointments','shop'].indexOf(t) > -1) a.classList.add('nmd-navlink');
    });
    // ocultar el rail original del menú (barra blanca x≈0, alto completo)
    var kids = [].slice.call(stage.children);
    var vh = window.innerHeight || 800;
    var items = [];
    kids.forEach(function(c){
      var r = c.getBoundingClientRect();
      var cs = getComputedStyle(c);
      var isRail = r.left <= 4 && r.width < 140 && r.height > vh*0.6 &&
                   (cs.backgroundColor === 'rgb(255, 255, 255)' || cs.backgroundColor === 'rgba(255, 255, 255, 1)');
      if (isRail){ c.style.display = 'none'; return; }
      // el fade (opacidad 0→100 + reveal) SOLO en TEXTOS e IMÁGENES,
      // NO en las líneas divisoras / fondo (quedan sólidas desde el inicio).
      var hasText = (c.textContent || '').trim().length > 0;
      var hasImg  = cs.backgroundImage !== 'none' || !!c.querySelector('img,[style*="background-image"]');
      if (!hasText && !hasImg) return;
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
    hold();

    // links del menú → navegan la ventana PADRE (no el iframe)
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href');
      if (!h || h.charAt(0)==='#' || /^(https?:|mailto:|tel:)/.test(h)) return;
      e.preventDefault(); e.stopImmediatePropagation();
      try { window.top.location.href = h; } catch(err){ window.parent.location.href = h; }
    }, true);

    // mensajes desde el padre
    window.addEventListener('message', function(e){
      if (e.data === 'nmd-play'){ play(); }        // directo (rAF se throttleaba en iframe oculto)
      else if (e.data === 'nmd-reset'){ hold(); }
    });
    // avisar al padre que ya cargó
    try { window.parent.postMessage('nmd-ready','*'); } catch(err){}
  }

  /* ======================================================
     MODO NORMAL: rail + overlay
     ====================================================== */
  function findBar(){
    var vh = window.innerHeight || 800;
    var best = null;
    var divs = document.querySelectorAll('div');
    for (var i=0;i<divs.length;i++){
      var el = divs[i];
      if (el.closest && el.closest('#'+RAIL_ID)) continue;
      var r = el.getBoundingClientRect();
      var bg = getComputedStyle(el).backgroundColor;
      if (r.left <= 3 && r.width >= 12 && r.width <= 220 && r.height > vh*0.5 &&
          (bg === 'rgb(255, 255, 255)' || bg === 'rgba(255, 255, 255, 1)')) {
        if (!best || r.height > best.height) best = { width: r.width, height: r.height };
      }
    }
    return best;
  }

  function build(W){
    W = Math.round(Math.max(40, Math.min(W, 280)));
    document.documentElement.style.setProperty('--nmd-rail-width', W + 'px');
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
      // hamburguesa = 2 líneas CSS que se transforman en X (solo transform → morph suave)
      + '#'+RAIL_ID+' .nmd-menu{position:relative;width:'+hamW+'px;height:'+hamH+'px}'
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

    var rail = document.getElementById(RAIL_ID);
    if (!rail){
      rail = document.createElement('nav');
      rail.id = RAIL_ID; rail.setAttribute('aria-label','Menu');
      document.body.appendChild(rail);
    }
    rail.innerHTML = ''
      + '<button class="nmd-menu" id="nmdMenuBtn" aria-label="Open menu"><span></span><span></span></button>'
      + '<a class="nmd-logo" href="index.html" aria-label="Home">'+svg(IC.logoVB,IC.logo,logoW,logoH)+'</a>'
      + '<a class="nmd-cart" href="cart.html" aria-label="Cart"><span class="nmd-badge">0</span>'+svg(IC.cartVB,IC.cart,cartW,cartH)+'</a>';

    document.getElementById('nmdMenuBtn').addEventListener('click', toggleMenu);
    rail.querySelector('.nmd-cart').addEventListener('click', function(e){
      if (typeof window.openCart === 'function') { e.preventDefault(); closeMenu(); window.openCart(); }
    });
    updateBadge();
  }

  // ---------- overlay con iframe del menú ----------
  var ovBuilt = false, ovReady = false, isOpen = false;
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
    fr.src = 'exact-desktop-menu.html?embed=1&layout=map-1';
    ov.appendChild(fr);
    document.body.appendChild(ov);

    window.addEventListener('message', function(e){
      if (e.data === 'nmd-ready'){ ovReady = true; if (isOpen){ var w=frameWin(); if(w) w.postMessage('nmd-play','*'); } }
    });
  }
  function frameWin(){ var f=document.getElementById('nmdMenuFrame'); return f && f.contentWindow; }
  function openMenu(){
    ensureOverlay();
    isOpen = true;
    var ov = document.getElementById('nmdOverlay');
    var btn = document.getElementById('nmdMenuBtn');
    ov.classList.add('open');
    if (btn){ btn.classList.add('x'); btn.setAttribute('aria-label','Close menu'); }
    document.body.classList.add('nmd-locked');
    var w = frameWin();
    if (w) w.postMessage('nmd-play','*');
  }
  function closeMenu(){
    isOpen = false;
    var ov = document.getElementById('nmdOverlay');
    var btn = document.getElementById('nmdMenuBtn');
    if (ov) ov.classList.remove('open');
    if (btn){ btn.classList.remove('x'); btn.setAttribute('aria-label','Open menu'); }
    document.body.classList.remove('nmd-locked');
    var w = frameWin();
    if (w) w.postMessage('nmd-reset','*');
  }
  function toggleMenu(e){ if (e) e.preventDefault(); isOpen ? closeMenu() : openMenu(); }
  document.addEventListener('keydown', function(e){ if (e.key==='Escape' && isOpen) closeMenu(); });

  function updateBadge(){
    var badge = document.querySelector('#'+RAIL_ID+' .nmd-badge');
    if (!badge) return;
    try {
      var items = JSON.parse(localStorage.getItem('nmd_cart') || '[]');
      badge.textContent = items.reduce(function(total, item){ return total + (Number(item.qty) || 0); }, 0);
    } catch(e) { badge.textContent = '0'; }
  }
  document.addEventListener('cart:change', updateBadge);
  window.addEventListener('storage', updateBadge);
  var raf = null;
  function run(){
    layoutFix();
    var stage = document.getElementById('stage');
    var width = Math.max(40, Math.round(108 * Math.min(1, window.innerWidth / 1920)));
    var bar = stage ? findBar() : { width: width };
    if (!stage) {
      document.documentElement.style.setProperty('--rail', width+'px');
      document.body.classList.add('nmd-shared-navigation');
      if (!document.getElementById('nmd-page-layout')) {
        var layout = document.createElement('style'); layout.id = 'nmd-page-layout';
        layout.textContent = 'body.nmd-shared-navigation .main{margin-left:var(--rail);margin-top:0}body.page-appointments.nmd-shared-navigation{padding-left:var(--rail)}';
        document.head.appendChild(layout);
      }
    }
    if (!bar){ var ex=document.getElementById(RAIL_ID); if(ex) ex.remove(); return; }
    build(bar.width);
    ensureOverlay();
  }
  function schedule(){ if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(run); }

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
