(() => {
  const stage = document.getElementById('stage');
  const textNodes = [...stage.querySelectorAll('div')].filter(el => !el.querySelector('div') && el.textContent.trim());
  const question = textNodes.find(el => el.textContent.trim() === 'Realizan Tatuajes sin Cita Previa?');
  if (question) {
    const list = question.parentElement.parentElement;
    const rows = [...list.children];
    const panels = rows.map((row, i) => {
      const texts = [...row.querySelectorAll('div')].filter(el => !el.querySelector('div,svg') && el.textContent.trim());
      const details = document.createElement('details');
      details.open = i === 2;
      const summary = document.createElement('summary');
      summary.textContent = texts[0].textContent;
      const answer = document.createElement('div');
      answer.className = 'faq-answer';
      if (texts.length > 1) answer.textContent = texts.slice(1).map(el => el.textContent.trim()).join(' ');
      else {
        const link = document.createElement('a');
        link.href = '#appointment-studio';
        link.textContent = 'Consulta esta pregunta directamente con el estudio.';
        answer.append(link);
      }
      details.append(summary, answer);
      return details;
    });
    list.replaceChildren(...panels);
    list.classList.add('appointment-faq');
    list.style.height = 'auto';
    list.parentElement.style.overflow = 'visible';
    const style = document.createElement('style');
    style.textContent = `.appointment-faq{display:flex;flex-direction:column;gap:12px;color:#fff;font:24px/24px 'Radio Grotesk',sans-serif}.appointment-faq details{background:#181818;border-radius:8px}.appointment-faq summary{list-style:none;cursor:pointer;padding:20px 24px;position:relative;padding-right:56px}.appointment-faq summary::-webkit-details-marker{display:none}.appointment-faq summary:after{content:'▾';position:absolute;right:24px;color:#d9d9d9}.appointment-faq summary:focus-visible{outline:2px solid #FDDE36;outline-offset:2px}.appointment-faq .faq-answer{padding:0 24px 28px;color:#bcbcbc}.appointment-faq a{color:inherit}`;
    document.head.append(style);
    function resize() {
      const end = 3172 + 552 + list.offsetHeight + 80;
      stage.style.height = Math.max(4836, end) + 'px';
      document.querySelector('.wrap').style.height = Math.max(4836, end) * Math.min(1, innerWidth / 1920) + 'px';
    }
    panels.forEach(panel => panel.addEventListener('toggle', resize));
    window.addEventListener('resize', resize);
  }
})();
