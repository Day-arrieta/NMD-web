const STEPS=[
 {key:'idea',req:1,type:'single',q:'Do you already have a clear idea of your tattoo, including: design, size, and placement?',
  options:['Yes, I know what I want','No, I need help & guidance']},
 {key:'when',req:1,type:'single',q:'When do you want your new tattoo?',
  options:['As soon as possible','Within the next few weeks','Within the next 2-3 months','Within the next 4-5 months','More than 6 months from now']},
 // The artist and torso-placement hints are part of the Figma heading (see heading()), so they have no separate hint.
 {key:'artist',req:1,type:'single',q:'Which artist do you prefer?',
  options:['Recommend me an Artist','Rubén','Zionele','Marisa','Guest Artists']},
 {key:'price',req:1,type:'single',q:'Do you have a preferred price range in mind?',
  hint:'If you have a range in mind, you can mention it in your description on the next step.',
  options:['Yes, I do',"No, I don't","I'm Flexible"]},
 {key:'description',req:1,type:'textarea',q:'Please share a brief description of your tattoo idea and any thoughts you have on your inspirations.',
  placeholder:'Tell us about your idea, references, story…'},
 {key:'styles',type:'multi',q:'What tattoo styles do you like?',hint:'Select all that apply.',
  options:['Fine line','Black & grey','Traditional','Neo-traditional','Realism','Lettering','Ornamental','Blackwork','Japanese','Illustrative']},
 {key:'elements',type:'multi',q:'What elements do you want in your tattoo?',hint:'Select all that apply.',
  options:['Florals','Animals','Figures','Geometry','Lettering','Symbols','Abstract']},
 {key:'color',req:1,type:'single',q:'Do you want your tattoo in color or black/grey?',
  options:['Color','Black and grey']},
 {key:'placement',req:1,type:'single',q:'Where on your body do you want the tattoo?',
  hint:'Choose the closest area. Placement can be reviewed and adjusted before your session begins.',
  options:['Arm','Leg','Torso','Back','Chest','Hand','Neck','Other']},
 {key:'placement_detail',req:1,type:'single',q:'Where exactly on your Torso?',
  options:['Upper abdomen (just below ribs)','Upper abdomen (near to the hip bone)','Ribs (left side)','Ribs (right side)']},
 {key:'size',req:1,type:'single',q:'What approximate size are you thinking?',
  hint:'Choose the range that most closely matches your idea.',
  options:['Small (under 8 cm)','Medium (8–15 cm)','Large (15–25 cm)','Extra large / sleeve or back']},
 {key:'travel',req:1,type:'single',q:'Will you be traveling for this appointment?',
  options:["No, I'm local to CDMX","Yes, I'm from elsewhere in Mexico","Yes, I'm from out of the country"]},
 {key:'name',req:1,type:'text',q:'What should we call you?',placeholder:'Your name',autocomplete:'name'},
 {key:'contact',req:1,type:'text',q:"Last step — what's the best email or WhatsApp number to reach you?",
  hint:'Enter an email address or a phone/WhatsApp number, including country code.',
  placeholder:'email@example.com  /  +52…',autocomplete:'email'},
];

// Status messages are written in English; language.js translates them (translations.js) while SP is active.
const MESSAGES={
 required:'Please answer this question to continue.',
 contact:'Please enter a valid email or a phone/WhatsApp number (at least 8 digits).',
 local:'Local preview: your answers have not been sent. Submission will be available after publishing and enabling Netlify Forms.',
 network:'Could not send. Your answers are still here; please try again.',
 artists:'Could not load artists. You can ask the studio to recommend one.',
};
// Fixed artist tiles: labels shown in the grid and sent to Netlify instead of the internal ids.
const ARTIST_CHOICES={recommend:'Recommend me an Artist',guest:'Guest Artists'};

let index = 0, artists = [], submitting = false;
const answers = {};
const $ = id => document.getElementById(id);
const host = $('host'), next = $('next'), back = $('back'), error = $('err');
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function availableSteps(){return STEPS.filter(s => s.key !== 'placement_detail' || answers.placement === 'Torso');}
function heading(s){
 if(s.key==='idea')return 'Do you already have a clear idea of your tattoo, including: <u>design</u>, <u>size</u>, and <u>placement</u>?';
 if(s.key==='artist')return "Which artist do you prefer?<br>Not sure which artist you'd like to work with? <u>Don't worry</u>, our experienced studio booking team <u>will gladly make recommendations based on your design details</u>.";
 if(s.key==='placement_detail')return 'Where exactly on your Torso?<br>(Placement can be <u>reviewed</u> and <u>adjusted</u> before your session begins)';
 return escapeHTML(s.q);
}
// Email, or a phone/WhatsApp number using only digits, a leading +, spaces, dashes, dots or parentheses (8–15 digits).
function validContact(value){
 const v=String(value||'').trim();
 if(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))return true;
 const digits=v.replace(/\D/g,'').length;
 return /^\+?[\d\s().-]+$/.test(v)&&digits>=8&&digits<=15;
}
function showError(message,invalid){
 error.textContent=message;
 const field=host.querySelector('.field');
 if(invalid&&field){field.setAttribute('aria-invalid','true');field.focus();}
}
function select(value){const s=availableSteps()[index];answers[s.key]=value;error.textContent='';host.querySelector('[aria-invalid]')?.removeAttribute('aria-invalid');}
function draw(){
 const steps=availableSteps(),s=steps[index],last=index===steps.length-1;error.textContent='';host.replaceChildren();
 const h=document.createElement('h1');h.className='q';h.id='question';h.innerHTML=heading(s);h.tabIndex=-1;host.append(h);
 if(s.hint){const hint=document.createElement('p');hint.className='hint';hint.id='hint';hint.textContent=s.hint;host.append(hint);}
 const required=document.createElement('p');required.className='required';required.textContent=s.req?'This question is required.*':'Optional';host.append(required);
 if(s.key==='artist'){
  const grid=document.createElement('div');grid.className='artist-grid';grid.setAttribute('role','radiogroup');grid.setAttribute('aria-label','Preferred artist');
  // "Recommend" and "Guest" are not specific people, so both use a neutral placeholder tile instead of a photo.
  const options=[{id:'recommend',name:ARTIST_CHOICES.recommend,glyph:'?'},...artists,{id:'guest',name:ARTIST_CHOICES.guest,glyph:'G'}];
  options.forEach(a=>{
   const b=document.createElement('button');b.type='button';b.className='artist-choice';b.classList.toggle('selected',answers.artist===a.id);b.setAttribute('role','radio');b.setAttribute('aria-checked',String(answers.artist===a.id));
   if(a.image){const img=document.createElement('img');img.src=a.image;img.alt='';b.append(img);}else{const box=document.createElement('span');box.className='artist-placeholder';box.setAttribute('aria-hidden','true');box.textContent=a.glyph||'';b.append(box);}
   const label=document.createElement('span');label.className='artist-label';label.textContent=a.name;if(!ARTIST_CHOICES[a.id])label.setAttribute('translate','no');b.append(label);
   b.onclick=()=>{select(a.id);grid.querySelectorAll('button').forEach(el=>{el.classList.remove('selected');el.setAttribute('aria-checked','false');});b.classList.add('selected');b.setAttribute('aria-checked','true');};grid.append(b);
  });host.append(grid);
 }else if(s.key==='placement_detail'){
  const control=document.createElement('div');control.className='placement-control';
  control.innerHTML='<div class="placement-input"><input class="field" aria-label="Specific torso placement" placeholder="Type or Select an option" autocomplete="off"><button class="placement-toggle" type="button" aria-label="Show placement options" aria-expanded="false">▼</button></div><div class="placement-options" hidden></div>';
  const input=control.querySelector('input'),toggle=control.querySelector('button'),list=control.querySelector('.placement-options');
  const label=o=>window.NMDLanguage?.t(o)||o;
  input.value=label(answers[s.key]||'');
  function close(){list.hidden=true;toggle.setAttribute('aria-expanded','false');}
  // all=true (botón ▼): lista completa sin borrar lo elegido; si no, filtra por lo escrito.
  function show(all){list.hidden=false;toggle.setAttribute('aria-expanded','true');list.replaceChildren();const q=all?'':input.value.toLowerCase();s.options.filter(o=>label(o).toLowerCase().includes(q)).forEach(o=>{const b=document.createElement('button');b.type='button';b.className='placement-option';b.textContent=o;b.classList.toggle('selected',answers[s.key]===o);b.onclick=()=>{input.value=label(o);select(o);close();toggle.focus();};list.append(b);});}
  toggle.onclick=()=>{if(list.hidden)show(true);else close();};
  // Lo escrito se guarda en inglés si coincide con una opción traducida (el estudio recibe valores consistentes).
  input.oninput=()=>{const typed=input.value.trim().toLowerCase();const match=s.options.find(o=>label(o).toLowerCase()===typed);select(match||input.value);show(false);};
  input.onclick=()=>show(false);// se abre al tocar o escribir, no al recibir foco (elegir una opción o un error no la reabren)
  input.onkeydown=e=>{if(e.key==='Escape')close();if(e.key==='ArrowDown'){e.preventDefault();if(list.hidden)show(false);list.querySelector('button')?.focus();}};
  list.onkeydown=e=>{const items=[...list.querySelectorAll('button')],i=items.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=e.key==='ArrowDown'?Math.min(items.length-1,i+1):i-1;(n<0?input:items[n]).focus();}else if(e.key==='Escape'){e.preventDefault();close();input.focus();}};
  // Tocar una opción no debe quitarle el foco al campo (Safari no enfoca botones; el focusout cerraría la lista antes del clic).
  list.addEventListener('mousedown',e=>e.preventDefault());
  control.addEventListener('focusout',e=>{if(!control.contains(e.relatedTarget))close();});
  host.append(control);
 }else if(s.type==='single'||s.type==='multi'){
  const multi=s.type==='multi';
  // "multi" switches the round radio dots to square checkboxes (booking-form.css).
  const opts=document.createElement('div');opts.className=multi?'opts multi':'opts';opts.setAttribute('role',multi?'group':'radiogroup');opts.setAttribute('aria-labelledby',s.hint?'question hint':'question');
  s.options.forEach(o=>{const b=document.createElement('button');b.type='button';b.className='opt';b.innerHTML='<span class="dot" aria-hidden="true"></span><span>'+escapeHTML(o)+'</span>';const on=multi?(answers[s.key]||[]).includes(o):answers[s.key]===o;b.classList.toggle('sel',on);b.setAttribute('role',multi?'checkbox':'radio');b.setAttribute('aria-checked',String(on));b.onclick=()=>{if(multi){const values=answers[s.key]||[];answers[s.key]=values.includes(o)?values.filter(v=>v!==o):[...values,o];b.classList.toggle('sel');b.setAttribute('aria-checked',String(b.classList.contains('sel')));}else{select(o);opts.querySelectorAll('button').forEach(el=>{el.classList.remove('sel');el.setAttribute('aria-checked','false');});b.classList.add('sel');b.setAttribute('aria-checked','true');if(s.key==='placement'&&o!=='Torso')delete answers.placement_detail;if(s.key==='placement')$('count').textContent=`${index+1} / ${availableSteps().length}`;}};opts.append(b);});host.append(opts);
 }else{
  const input=document.createElement(s.type==='textarea'?'textarea':'input');input.className='field';input.placeholder=s.placeholder||'';
  input.setAttribute('aria-labelledby','question');input.setAttribute('aria-describedby',s.hint?'hint err':'err');
  if(s.autocomplete)input.autocomplete=s.autocomplete;
  if(s.key==='contact'){input.spellcheck=false;input.setAttribute('autocapitalize','off');}
  // Typed answers are shown exactly as written; only the fixed options are translated.
  input.value=answers[s.key]||'';input.oninput=()=>select(input.value);
  // Enter on a single-line field acts like the Next / Submit button.
  if(s.type==='text')input.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();next.click();}};
  host.append(input);
 }
 back.hidden=index===0;next.textContent=last?'Submit':'Next →';$('count').textContent=`${index+1} / ${steps.length}`;
 $('consent').hidden=!last;
 window.scrollTo(0,0);h.focus({preventScroll:true});
}
// Netlify Forms payload: "form-name" plus one field per answered step. Every name here is declared in the hidden form in booking-form.html.
function payload(){
 const data=new URLSearchParams({'form-name':'appointments'});
 availableSteps().forEach(s=>{const v=answers[s.key];if(v==null)return;data.set(s.key,(Array.isArray(v)?v.join(', '):String(v)).trim());});
 const a=artists.find(a=>a.id===answers.artist);
 if(a)data.set('artist',a.name+' ('+a.id+')');else if(ARTIST_CHOICES[answers.artist])data.set('artist',ARTIST_CHOICES[answers.artist]);
 return data;
}
next.onclick=async()=>{
 if(submitting)return;
 const steps=availableSteps(),s=steps[index];
 if(s.req&&!String(answers[s.key]||'').trim()){showError(MESSAGES.required,true);return;}
 if(s.key==='contact'&&!validContact(answers.contact)){showError(MESSAGES.contact,true);return;}
 if(index<steps.length-1){index++;draw();return;}
 if(['127.0.0.1','localhost'].includes(location.hostname)){showError(MESSAGES.local);return;}
 submitting=true;next.disabled=true;next.textContent='Sending…';
 try{
  const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:payload().toString()});
  if(!response.ok)throw new Error('Submission failed');
  $('form').style.display='none';$('done').classList.add('show');$('done').querySelector('h2')?.focus({preventScroll:true});
 }
 catch{showError(MESSAGES.network);}finally{submitting=false;next.disabled=false;next.textContent='Submit';}
};
back.onclick=()=>{if(index>0){index--;draw();}};
// Al cambiar de idioma, el campo de ubicación del torso se vuelve a pintar con el valor traducido.
window.addEventListener('nmd:language',()=>{
 if(availableSteps()[index]?.key!=='placement_detail')return;
 // Solo se actualiza el valor visible del campo; redibujar el paso movería el foco fuera del selector de idioma.
 const input=host.querySelector('.placement-input input');
 if(input)input.value=window.NMDLanguage?.t(answers.placement_detail||'')||answers.placement_detail||'';
});
$('form').style.display='block';error.setAttribute('role','alert');draw();
NMDContent.artists().then(data=>{artists=data;if(availableSteps()[index].key==='artist')draw();}).catch(()=>{error.textContent=MESSAGES.artists;});
