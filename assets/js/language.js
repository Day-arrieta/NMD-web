/* EN / ES UI translations — only loaded by the booking form. CMS content and submitted values stay intact.
   The form always opens in English; the EN/SP switch changes the language for the current visit only. */
(() => {
  const normalize = value => value.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
  const dictionary = new Map();
  (window.NMDTranslations || []).forEach(([en, es]) => {
    const pair = { en, es };
    if (!dictionary.has(normalize(en))) dictionary.set(normalize(en), pair);
    if (!dictionary.has(normalize(es))) dictionary.set(normalize(es), pair);
  });
  let language = 'en';
  function translate(value, target = language) {
    const pair = dictionary.get(normalize(value));
    if (!pair) return value;
    // Already in the target language: keep the original text and casing (e.g. "size" mid-sentence stays lowercase).
    if (normalize(pair[target]) === normalize(value)) return value;
    let result = pair[target];
    if (value.trim() === value.trim().toUpperCase()) result = result.toUpperCase();
    return value.match(/^\s*/)[0] + result + value.match(/\s*$/)[0];
  }
  const originals = new WeakMap();
  const attributes = new WeakMap();
  const bound = new WeakSet();
  const excluded = 'script,style,textarea,[translate="no"],[data-artist="name"],[data-artist="bio"],.team-card h3,.team-card__specialty';
  // Attributes (placeholder, aria-label) of a textarea are UI text and must translate; only its typed value stays untouched.
  const excludedAttributes = excluded.replace('textarea,', '');
  let observer;
  function apply() {
    observer?.disconnect();
    document.documentElement.lang = language;
    document.documentElement.dataset.lang = language;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || node.parentElement.closest(excluded)) continue;
      const previous = originals.get(node);
      const original = previous && previous.output === node.nodeValue ? previous.original : node.nodeValue;
      const output = language === 'es' && normalize(original) === 'size' && node.parentElement.closest('.q') ? 'tamaño' : translate(original);
      if (output !== node.nodeValue) node.nodeValue = output;
      originals.set(node, { original, output });
    }
    document.querySelectorAll('[placeholder],[aria-label]').forEach(el => {
      if (el.closest(excludedAttributes)) return;
      const record = attributes.get(el) || {};
      ['placeholder', 'aria-label'].forEach(name => {
        if (!el.hasAttribute(name)) return;
        const value = el.getAttribute(name), prev = record[name];
        const original = prev && prev.output === value ? prev.original : value;
        const output = translate(original);
        if (value !== output) el.setAttribute(name, output);
        record[name] = { original, output };
      });
      attributes.set(el, record);
    });
    document.querySelectorAll('button,div,span').forEach(label => {
      if (label.children.length || !['EN', 'SP'].includes(label.textContent.trim())) return;
      const button = label.closest('button') || label.parentElement;
      if (!button || button === document.body) return;
      const value = label.textContent.trim() === 'SP' ? 'es' : 'en';
      button.dataset.nmdLanguage = value;
      if (!bound.has(button)) {
        button.setAttribute('role', 'button'); button.tabIndex = 0;
        button.style.cursor = 'pointer';
        button.addEventListener('click', () => setLanguage(value));
        if (button.tagName !== 'BUTTON') button.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setLanguage(value); }
        });
        bound.add(button);
      }
      const active = value === language;
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', value === 'es' ? 'Español' : 'English');
      button.classList.toggle('active', active);
      button.style.background = active ? '#fff' : 'transparent';
      button.style.color = active ? '#000' : '#fff';
      label.style.color = active ? '#000' : '#fff';
    });
    observer?.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['placeholder','aria-label']});
  }
  function setLanguage(value) {
    language = value === 'es' ? 'es' : 'en';
    apply();
    window.dispatchEvent(new CustomEvent('nmd:language', {detail:language}));
    // Same-origin menu iframe and parent update immediately without reloading.
    if (window.parent !== window) window.parent.postMessage({type:'nmd-language', language}, location.origin);
    document.querySelectorAll('iframe').forEach(frame => {
      try { if (new URL(frame.src, location.href).origin === location.origin) frame.contentWindow.postMessage({type:'nmd-language', language}, location.origin); } catch {}
    });
  }
  window.NMDLanguage = { t: translate, get: () => language, set: setLanguage };
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.data?.type !== 'nmd-language') return;
    language = event.data.language === 'es' ? 'es' : 'en'; apply();
  });
  function init() {
    observer = new MutationObserver(apply);
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
