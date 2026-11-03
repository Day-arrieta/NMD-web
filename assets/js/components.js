/* ============================================================
   NMD19 — Header, menú overlay y footer compartidos.
   Se inyectan en cada página en #site-header / #site-footer,
   así editas la navegación en UN solo sitio.
   ============================================================ */

const NAV = [
  { n:'01', label:'Home',         href:'index.html' },
  { n:'02', label:'Studio',       href:'studio.html' },
  { n:'03', label:'Work',         href:'work.html' },
  { n:'04', label:'Appointments', href:'appointments.html' },
  { n:'05', label:'Shop',         href:'shop.html' },
];

const ADDRESS = 'Colima 220, Roma Norte<br>Cuauhtémoc · 06700 · CDMX';
const COORDS  = 'N 19° 25’ 9.417’’  ·  O 99° 9’ 43.961’’';

function headerHTML(){
  return `
  <a class="brand" href="index.html">NMD<sup>19®</sup></a>
  <div class="header-right">
    <div class="lang-toggle" aria-label="Language">
      <button data-lang="EN" class="active">EN</button>
      <button data-lang="SP">SP</button>
    </div>
    <a class="cart-btn" href="cart.html">Cart <span class="cart-count">(0)</span></a>
    <button class="menu-btn" id="menuOpen" aria-haspopup="true" aria-expanded="false">
      Menu <span class="bars"><span></span><span></span></span>
    </button>
  </div>`;
}

function overlayHTML(){
  const items = NAV.map(i=>`<li><a href="${i.href}"><span class="idx">${i.n}</span>${i.label}</a></li>`).join('');
  return `
  <nav class="nav-overlay" id="navOverlay" aria-hidden="true">
    <button class="nav-close" id="menuClose">Close ✕</button>
    <div class="nav-main">
      <ol>${items}</ol>
    </div>
    <aside class="nav-aside">
      <div class="featured">
        <span class="eyebrow" style="color:var(--gray-2)">New In</span>
        <img src="assets/img/prod-1.jpg" alt="Producto destacado">
        <div class="meta"><strong>Coral Heart · Totebag</strong>$1,229.00 <span style="color:var(--gray-2)">MXN</span></div>
      </div>
      <div>
        <div class="open-now"><span class="dot"></span><span>Open · <span class="js-clock">--:--:--</span></span></div>
        <p class="meta" style="margin-top:14px">${ADDRESS}</p>
      </div>
    </aside>
  </nav>`;
}

function footerHTML(){
  const links = NAV.map(i=>`<li><a href="${i.href}">${i.label}</a></li>`).join('');
  return `
  <div class="footer-top">
    <div class="footer-brand">
      <div class="display">Nomad<br>Studio</div>
      <p class="meta" style="margin-top:24px;color:var(--gray-2);max-width:30ch">${ADDRESS}</p>
      <p class="meta" style="margin-top:10px;color:var(--gray-2)">${COORDS}</p>
    </div>
    <div class="footer-col">
      <h4>Navigation</h4>
      <ul>${links}</ul>
    </div>
    <div class="footer-col footer-contact">
      <h4>Get in touch</h4>
      <a class="big" href="mailto:hola@nmd19.com">Mail</a>
      <a class="big" href="tel:+525500000000">Call</a>
      <ul style="margin-top:22px">
        <li><a href="faq.html">F.A.Q.</a></li>
        <li><a href="faq.html#shipping">Shipping</a></li>
        <li><a href="faq.html#returns">Return Policies</a></li>
        <li><a href="faq.html#terms">Terms &amp; Conditions</a></li>
        <li><a href="faq.html#privacy">Privacy Policy</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <span>Nomad Studio S.A. de C.V. 2022. All Rights Reserved®</span>
    <span>Site by: NMD19</span>
  </div>`;
}

/* ---------- montaje ---------- */
function mount(){
  const h = document.getElementById('site-header');
  if(h){ h.className='site-header'; h.innerHTML = headerHTML(); }
  // overlay va directo al body
  document.body.insertAdjacentHTML('afterbegin', overlayHTML());
  const f = document.getElementById('site-footer');
  if(f){ f.className='site-footer'; f.innerHTML = footerHTML(); }

  wireMenu();
  wireLang();
  startClock();
  updateCart();
  markActive();
}

function wireMenu(){
  const ov = document.getElementById('navOverlay');
  const open = document.getElementById('menuOpen');
  const close = document.getElementById('menuClose');
  const toggle = state => {
    ov.classList.toggle('open', state);
    ov.setAttribute('aria-hidden', String(!state));
    if(open) open.setAttribute('aria-expanded', String(state));
    document.body.style.overflow = state ? 'hidden' : '';
  };
  open && open.addEventListener('click', ()=>toggle(true));
  close && close.addEventListener('click', ()=>toggle(false));
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') toggle(false); });
}

function wireLang(){
  document.querySelectorAll('.lang-toggle button').forEach(b=>{
    b.addEventListener('click', ()=>{
      document.querySelectorAll('.lang-toggle button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.documentElement.dataset.lang = b.dataset.lang;
      // placeholder: aquí se intercambiará el contenido EN/SP cuando definamos textos en español
    });
  });
}

function startClock(){
  const tick = ()=>{
    const t = new Date().toLocaleTimeString('en-US',{hour12:true,timeZone:'America/Mexico_City'});
    document.querySelectorAll('.js-clock').forEach(el=>el.textContent=t.toLowerCase());
  };
  tick(); setInterval(tick,1000);
}

function updateCart(){
  let n = 0;
  try{ n = JSON.parse(localStorage.getItem('nmd_cart')||'[]').reduce((s,i)=>s+(i.qty||1),0); }catch(e){}
  document.querySelectorAll('.cart-count').forEach(el=>el.textContent=`(${n})`);
}

function markActive(){
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-main a, .footer-col a').forEach(a=>{
    if(a.getAttribute('href')===here) a.style.color='var(--yellow)';
  });
}

document.addEventListener('DOMContentLoaded', mount);
