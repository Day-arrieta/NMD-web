const STEPS=[
 {key:'idea',req:1,type:'single',q:'Do you already have a clear idea of your tattoo, including: design, size, and placement?',
  options:['Yes, i know what i want','No, I need help & guidance']},
 {key:'when',req:1,type:'single',q:'When do you want your new tattoo?',
  options:['As soon as possible','Within the next few weeks','Within the next 2-3 months','Within the next 4-5 months','More than 6 months from now']},
 {key:'artist',req:1,type:'single',q:'Which artist do you prefer?',
  hint:"Not sure which artist you'd like to work with? Don't worry, our experienced studio booking team will gladly make recommendations based on your design details.",
  options:['Recommend me an Artist','Rubén','Zionele','Marisa','Guest Artists']},
 {key:'price',req:1,type:'single',q:'Do you have a preferred price range in mind?',
  options:['Yes, I do',"No, I don't","I'm Flexible"]},
 {key:'description',req:1,type:'textarea',q:'Please share a brief description of your tattoo idea and any thoughts you have on your inspirations.',
  placeholder:'Tell us about your idea, references, story…'},
 {key:'styles',type:'multi',q:'What tattoo styles do you like?',hint:'Choose as many as you like.',
  options:['Fine line','Black & grey','Traditional','Neo-traditional','Realism','Lettering','Ornamental','Blackwork','Japanese','Illustrative']},
 {key:'elements',type:'multi',q:'What elements do you want in your tattoo?',hint:'Choose as many as you like.',
  options:['Florals','Animals','Figures','Geometry','Lettering','Symbols','Abstract']},
 {key:'color',req:1,type:'single',q:'Do you want your tattoo in color or black/grey?',
  options:['Color','Black and grey']},
 {key:'placement',req:1,type:'single',q:'Where on your body do you want the tattoo?',
  options:['Arm','Leg','Torso','Back','Chest','Hand','Neck','Other']},
 {key:'placement_detail',req:1,type:'single',q:'Where exactly on your Torso?',
  hint:'(Placement can be reviewed and adjusted before your session begins)',
  options:['Upper abdomen (just below ribs)','Upper abdomen (near to the hip bone)','Ribs (left side)','Ribs (right side)']},
 {key:'size',req:1,type:'single',q:'What approximate size are you thinking?',
  hint:'Choose the range that most closely matches your idea.',
  options:['Small (under 8 cm)','Medium (8–15 cm)','Large (15–25 cm)','Extra large / sleeve or back']},
 {key:'travel',req:1,type:'single',q:'Will you be traveling for this appointment?',
  options:["No, I'm local to CDMX","Yes, I'm from elsewhere in Mexico","Yes, I'm from out of the country"]},
 {key:'name',req:1,type:'text',q:'Last step — what should we call you?',placeholder:'Your name'},
 {key:'contact',req:1,type:'text',q:'Best email or WhatsApp to reach you?',placeholder:'email@example.com  /  +52…'},
];

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
function select(value){const s=availableSteps()[index];answers[s.key]=value;error.textContent='';}
function draw(){
 const steps=availableSteps(),s=steps[index];error.textContent='';host.replaceChildren();
 const h=document.createElement('h1');h.className='q';h.innerHTML=heading(s);h.tabIndex=-1;host.append(h);
 const required=document.createElement('p');required.className='required';required.textContent=s.req?'This question is required.*':'Optional';host.append(required);
 if(s.key==='artist'){
  const grid=document.createElement('div');grid.className='artist-grid';grid.setAttribute('role','radiogroup');grid.setAttribute('aria-label','Preferred artist');
  const options=[{id:'recommend',name:'Recommend me an Artist',image:artists[0]?.image},...artists,{id:'guest',name:'Guest Artists'}];
  options.forEach(a=>{
   const b=document.createElement('button');b.type='button';b.className='artist-choice';b.classList.toggle('selected',answers.artist===a.id);b.setAttribute('role','radio');b.setAttribute('aria-checked',String(answers.artist===a.id));
   if(a.image){const img=document.createElement('img');img.src=a.image;img.alt='';b.append(img);}else{const box=document.createElement('span');box.className='artist-placeholder';box.textContent='G';b.append(box);}
   const label=document.createElement('span');label.className='artist-label';label.textContent=a.name;if(a.id!=='recommend'&&a.id!=='guest')label.setAttribute('translate','no');b.append(label);
   b.onclick=()=>{select(a.id);grid.querySelectorAll('button').forEach(el=>{el.classList.remove('selected');el.setAttribute('aria-checked','false');});b.classList.add('selected');b.setAttribute('aria-checked','true');};grid.append(b);
  });host.append(grid);
 }else if(s.key==='placement_detail'){
  const control=document.createElement('div');control.className='placement-control';
  control.innerHTML='<div class="placement-input"><input class="field" aria-label="Specific torso placement" placeholder="Type or Select an option" autocomplete="off"><button class="placement-toggle" type="button" aria-label="Show placement options" aria-expanded="false">▼</button></div><div class="placement-options" hidden></div>';
  const input=control.querySelector('input'),toggle=control.querySelector('button'),list=control.querySelector('.placement-options');input.value=window.NMDLanguage?.t(answers[s.key]||'')||answers[s.key]||'';
  function show(){list.hidden=false;toggle.setAttribute('aria-expanded','true');list.replaceChildren();s.options.filter(o=>(window.NMDLanguage?.t(o)||o).toLowerCase().includes(input.value.toLowerCase())).forEach(o=>{const b=document.createElement('button');b.type='button';b.className='placement-option';b.textContent=o;b.classList.toggle('selected',answers[s.key]===o);b.onclick=()=>{input.value=window.NMDLanguage?.t(o)||o;select(o);list.hidden=true;toggle.setAttribute('aria-expanded','false');input.focus();};list.append(b);});}
  toggle.onclick=()=>{if(list.hidden){input.value='';show();}else{list.hidden=true;toggle.setAttribute('aria-expanded','false');}};
  input.oninput=()=>{select(input.value);show();};input.onfocus=show;input.onkeydown=e=>{if(e.key==='Escape'){list.hidden=true;toggle.setAttribute('aria-expanded','false');}if(e.key==='ArrowDown'){e.preventDefault();show();list.querySelector('button')?.focus();}};host.append(control);
 }else if(s.type==='single'||s.type==='multi'){
  const opts=document.createElement('div');opts.className='opts';opts.setAttribute('role',s.type==='multi'?'group':'radiogroup');opts.setAttribute('aria-label',s.q);
  s.options.forEach(o=>{const b=document.createElement('button');b.type='button';b.className='opt';b.innerHTML='<span class="dot" aria-hidden="true"></span><span>'+escapeHTML(o)+'</span>';const on=s.type==='multi'?(answers[s.key]||[]).includes(o):answers[s.key]===o;b.classList.toggle('sel',on);b.setAttribute('role',s.type==='multi'?'checkbox':'radio');b.setAttribute('aria-checked',String(on));b.onclick=()=>{if(s.type==='multi'){const values=answers[s.key]||[];answers[s.key]=values.includes(o)?values.filter(v=>v!==o):[...values,o];b.classList.toggle('sel');b.setAttribute('aria-checked',String(b.classList.contains('sel')));}else{select(o);opts.querySelectorAll('button').forEach(el=>{el.classList.remove('sel');el.setAttribute('aria-checked','false');});b.classList.add('sel');b.setAttribute('aria-checked','true');if(s.key==='placement'&&o!=='Torso')delete answers.placement_detail;}};opts.append(b);});host.append(opts);
 }else{const input=document.createElement(s.type==='textarea'?'textarea':'input');input.className='field';input.placeholder=s.placeholder||'';input.setAttribute('aria-label',s.q);input.value=window.NMDLanguage?.t(answers[s.key]||'')||answers[s.key]||'';input.oninput=()=>select(input.value);host.append(input);}
 back.hidden=index===0;next.textContent=index===steps.length-1?'Submit':'Next →';$('count').textContent=`${index+1} / ${steps.length}`;
 window.scrollTo(0,0);h.focus({preventScroll:true});
}
next.onclick=async()=>{
 if(submitting)return;
 const steps=availableSteps(),s=steps[index];if(s.req&&!String(answers[s.key]||'').trim()){error.textContent='This question is required.*';return;}
 if(index<steps.length-1){index++;draw();return;}
 if(['127.0.0.1','localhost'].includes(location.hostname)){error.textContent='Vista local: las respuestas no se han enviado. El envío estará disponible al publicar y activar Netlify Forms.';return;}
 submitting=true;next.disabled=true;next.textContent='Sending…';
 try{const data=new URLSearchParams({'form-name':'appointments'});Object.entries(answers).forEach(([k,v])=>data.set(k,Array.isArray(v)?v.join(', '):v));const a=artists.find(a=>a.id===answers.artist);if(a)data.set('artist',a.name+' ('+a.id+')');const response=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:data});if(!response.ok)throw new Error('Submission failed');$('form').style.display='none';$('done').classList.add('show');}
 catch{error.textContent='No se pudo enviar. Tus respuestas siguen aquí; intenta de nuevo.';}finally{submitting=false;next.disabled=false;next.textContent='Submit';}
};
back.onclick=()=>{if(index>0){index--;draw();}};
$('form').style.display='block';error.setAttribute('role','alert');draw();
NMDContent.artists().then(data=>{artists=data;if(availableSteps()[index].key==='artist')draw();}).catch(()=>{error.textContent='No se pudieron cargar los artistas. Puedes elegir que el estudio te recomiende uno.';});
