const STORAGE_KEY = 'netZeroPathwayCourse.v1';
const defaultState = {
  completed: [], checks: {}, fields: {}, quizzes: {},
  boundarySources: [],
  baseline: [
    {source:'Grid electricity',scope:'2',activity:'',unit:'kWh',factor:'',confidence:'High'},
    {source:'Petrol',scope:'1',activity:'',unit:'litres',factor:'',confidence:'High'},
    {source:'Diesel',scope:'1',activity:'',unit:'litres',factor:'',confidence:'High'},
    {source:'Business flights',scope:'3',activity:'',unit:'passenger-km',factor:'',confidence:'Medium'},
    {source:'Waste',scope:'3',activity:'',unit:'tonnes',factor:'',confidence:'Low'}
  ],
  actions: [
    {name:'Optimise HVAC controls',impact:3,cost:5,feasibility:4,speed:5},
    {name:'LED lighting upgrade',impact:3,cost:4,feasibility:5,speed:4},
    {name:'Rooftop solar',impact:5,cost:2,feasibility:3,speed:2}
  ]
};
let state = loadState();
const pages = [...document.querySelectorAll('.page')];
const navLinks = [...document.querySelectorAll('.nav-link')];
const boundarySources = ['Purchased electricity','Company vehicles','Stationary fuel','Refrigerants','Business travel','Employee commuting','Waste','Purchased goods','Freight and deliveries'];

function loadState(){
  try{return {...structuredClone(defaultState),...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch{return structuredClone(defaultState)}
}
function saveState(message){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));updateProgress();renderRoadmap();if(message)toast(message)}
function toast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),1800)}
function showPage(name){
  pages.forEach(p=>p.classList.toggle('active',p.dataset.pagePanel===name));
  navLinks.forEach(b=>b.classList.toggle('active',b.dataset.page===name));
  const current=navLinks.find(b=>b.dataset.page===name);
  document.querySelector('#breadcrumb').textContent=current?.textContent.trim().replace(/^\d+/, '')||'';
  document.querySelector('#page-kicker').textContent=name.startsWith('module')?'Course module':name==='toolkit'?'Resources':'Course';
  document.querySelector('.course-nav').classList.remove('open');
  document.querySelector('#nav-toggle').setAttribute('aria-expanded','false');
  window.scrollTo({top:0,behavior:'smooth'});document.querySelector('#main').focus({preventScroll:true});
}
document.addEventListener('click',e=>{const go=e.target.closest('[data-go]');if(go)showPage(go.dataset.go)});
navLinks.forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
document.querySelector('#nav-toggle').addEventListener('click',e=>{const nav=document.querySelector('.course-nav');const open=nav.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open))});
document.querySelector('#print-page').addEventListener('click',()=>window.print());

document.querySelectorAll('[data-save]').forEach(el=>{
  el.value=state.fields[el.dataset.save]||'';
  el.addEventListener('input',()=>{state.fields[el.dataset.save]=el.value;saveState()});
  el.addEventListener('change',()=>saveState('Saved'));
});
document.querySelectorAll('[data-check]').forEach(el=>{
  el.checked=Boolean(state.checks[el.dataset.check]);
  el.addEventListener('change',()=>{state.checks[el.dataset.check]=el.checked;saveState();updateDiagnostic()});
});
function updateDiagnostic(){const n=['diag1','diag2','diag3','diag4'].filter(k=>state.checks[k]).length;const f=document.querySelector('#diag-feedback');f.textContent=n===4?'You have a strong starting pack. Validate its reporting period before calculation.':n>=2?'Good start. Record missing evidence as an assumption and identify who can help.':'Begin with electricity bills and operational knowledge. Estimates are acceptable when clearly labelled.'}
updateDiagnostic();

function renderBoundary(){
  const box=document.querySelector('#boundary-options');box.innerHTML='';
  boundarySources.forEach(source=>{const label=document.createElement('label');label.className='boundary-option';const input=document.createElement('input');input.type='checkbox';input.checked=state.boundarySources.includes(source);input.addEventListener('change',()=>{state.boundarySources=input.checked?[...new Set([...state.boundarySources,source])]:state.boundarySources.filter(x=>x!==source);saveState()});label.append(input,document.createTextNode(source));box.append(label)})
}
renderBoundary();

document.querySelectorAll('.knowledge-check').forEach(quiz=>{
  const id=quiz.dataset.quiz;quiz.querySelectorAll('[data-answer]').forEach(button=>{
    if(state.quizzes[id]===button.dataset.answer)button.classList.add('selected');
    button.addEventListener('click',()=>{
      if(id==='q3'&&!state.fields.solarReason?.trim()){toast('Write your reason before revealing the analysis');document.querySelector('#solar-reason').focus();return}
      quiz.querySelectorAll('[data-answer]').forEach(b=>b.classList.remove('selected'));button.classList.add('selected');state.quizzes[id]=button.dataset.answer;renderQuiz(quiz);saveState();
    });
  });renderQuiz(quiz);
});
function renderQuiz(quiz){const answer=state.quizzes[quiz.dataset.quiz];const out=quiz.querySelector('.quiz-feedback');if(!answer){out.textContent='';out.className='quiz-feedback';return}const messages={q1:{correct:'Correct. Purchased grid electricity is an indirect Scope 2 emission. The organisation uses the energy, while generation happens elsewhere.',wrong:'Not quite. Purchased grid electricity is normally Scope 2 because the electricity is generated elsewhere for the organisation’s use.'},q2:{correct:'Exactly. The baseline reveals different hotspots, so the sequence and mix of actions should differ.',wrong:'A universal list can waste effort. Reduction priorities should respond to each organisation’s material sources and constraints.'},q3:{correct:'Right. Solar may be valuable, but the answer depends on the electricity hotspot, roof area, ownership, load profile, cost and efficiency opportunities.',wrong:'Solar can be valuable, but not automatically first. Test it against the baseline, roof and building constraints, cost, load profile and competing efficiency actions.'}};out.textContent=messages[quiz.dataset.quiz][answer];out.className=`quiz-feedback ${answer}`}

function safe(value){return String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function renderBaseline(){
  const tbody=document.querySelector('#baseline-rows');tbody.innerHTML='';
  state.baseline.forEach((row,i)=>{const tr=document.createElement('tr');tr.innerHTML=`<td><input aria-label="Emission source ${i+1}" value="${safe(row.source)}"></td><td><select aria-label="Scope ${i+1}">${['1','2','3'].map(x=>`<option ${row.scope===x?'selected':''}>${x}</option>`).join('')}</select></td><td><input aria-label="Activity amount ${i+1}" type="number" min="0" step="any" value="${safe(row.activity)}"></td><td><input aria-label="Activity unit ${i+1}" value="${safe(row.unit)}"></td><td><input aria-label="Emission factor ${i+1}" type="number" min="0" step="any" value="${safe(row.factor)}"></td><td><select aria-label="Confidence ${i+1}">${['High','Medium','Low'].map(x=>`<option ${row.confidence===x?'selected':''}>${x}</option>`).join('')}</select></td><td class="row-emissions">0</td><td><button class="remove-row" aria-label="Remove ${safe(row.source)}">×</button></td>`;
    const controls=tr.querySelectorAll('input,select');const keys=['source','scope','activity','unit','factor','confidence'];controls.forEach((el,n)=>el.addEventListener('input',()=>{state.baseline[i][keys[n]]=el.value;saveState();renderBaselineSummary()}));tr.querySelector('.remove-row').addEventListener('click',()=>{state.baseline.splice(i,1);saveState();renderBaseline()});tbody.append(tr)});renderBaselineSummary();
}
function baselineStats(){const rows=state.baseline.map(r=>({...r,emissions:(Number(r.activity)||0)*(Number(r.factor)||0)}));const total=rows.reduce((s,r)=>s+r.emissions,0);const sorted=[...rows].sort((a,b)=>b.emissions-a.emissions);return {rows,total,largest:sorted[0]}}
function renderBaselineSummary(){const {rows,total,largest}=baselineStats();document.querySelectorAll('.row-emissions').forEach((cell,i)=>cell.textContent=rows[i].emissions.toLocaleString(undefined,{maximumFractionDigits:1}));document.querySelector('#baseline-total').textContent=`${total.toLocaleString(undefined,{maximumFractionDigits:1})} kgCO₂e`;document.querySelector('#baseline-tonnes').textContent=`${(total/1000).toFixed(2)} tCO₂e`;document.querySelector('#largest-source').textContent=largest?.emissions?largest.source:'Add your data';document.querySelector('#largest-share').textContent=largest?.emissions&&total?`${Math.round(largest.emissions/total*100)}% of estimated total`:'—';const used=rows.filter(r=>r.emissions>0);const low=used.filter(r=>r.confidence==='Low').length;document.querySelector('#confidence-summary').textContent=!used.length?'Not assessed':low?`${low} low-confidence source${low>1?'s':''}`:'No low-confidence sources';renderRoadmap()}
document.querySelector('#add-baseline-row').addEventListener('click',()=>{state.baseline.push({source:'New source',scope:'3',activity:'',unit:'unit',factor:'',confidence:'Low'});saveState();renderBaseline()});
const exampleBaseline=[{source:'Grid electricity',scope:'2',activity:'85000',unit:'kWh',factor:'0.55',confidence:'High'},{source:'Petrol',scope:'1',activity:'2400',unit:'litres',factor:'2.31',confidence:'High'},{source:'Diesel',scope:'1',activity:'1100',unit:'litres',factor:'2.68',confidence:'High'},{source:'Business flights',scope:'3',activity:'12000',unit:'passenger-km',factor:'0.15',confidence:'Medium'},{source:'Waste',scope:'3',activity:'9',unit:'tonnes',factor:'450',confidence:'Low'}];
function loadExample(){state.baseline=structuredClone(exampleBaseline);state.fields.baselineAssumptions='Illustrative learning factors only. Electricity uses a sample grid factor; flights use a distance proxy; waste tonnage is estimated.';document.querySelector('#baseline-assumptions').value=state.fields.baselineAssumptions;saveState('Greenfield example loaded');renderBaseline();showPage('module2')}
document.querySelector('#load-example').addEventListener('click',loadExample);document.querySelector('#toolkit-example').addEventListener('click',loadExample);renderBaseline();

function renderActions(){const tbody=document.querySelector('#action-rows');tbody.innerHTML='';state.actions.forEach((row,i)=>{const score=actionScore(row);const tr=document.createElement('tr');tr.innerHTML=`<td><input aria-label="Action ${i+1}" value="${safe(row.name)}"></td>${['impact','cost','feasibility','speed'].map(k=>`<td><select aria-label="${k} score ${i+1}">${[1,2,3,4,5].map(n=>`<option ${Number(row[k])===n?'selected':''}>${n}</option>`).join('')}</select></td>`).join('')}<td><strong>${score.toFixed(1)}</strong></td><td><button class="remove-row" aria-label="Remove ${safe(row.name)}">×</button></td>`;const controls=tr.querySelectorAll('input,select');const keys=['name','impact','cost','feasibility','speed'];controls.forEach((el,n)=>el.addEventListener('input',()=>{state.actions[i][keys[n]]=n?Number(el.value):el.value;saveState();renderActions()}));tr.querySelector('.remove-row').addEventListener('click',()=>{state.actions.splice(i,1);saveState();renderActions()});tbody.append(tr)});renderTopActions();renderRoadmap()}
function actionScore(row){return Number(row.impact)*.4+Number(row.cost)*.2+Number(row.feasibility)*.25+Number(row.speed)*.15}
function sortedActions(){return [...state.actions].sort((a,b)=>actionScore(b)-actionScore(a))}
function renderTopActions(){const ol=document.querySelector('#top-actions');const top=sortedActions().filter(a=>a.name.trim()).slice(0,3);ol.innerHTML=top.length?top.map(a=>`<li>${safe(a.name)} — ${actionScore(a).toFixed(1)}/5</li>`).join(''):'<li>Add and score your options</li>'}
document.querySelector('#add-action-row').addEventListener('click',()=>{state.actions.push({name:'New action',impact:3,cost:3,feasibility:3,speed:3});saveState();renderActions()});renderActions();

function renderRoadmap(){const out=document.querySelector('#roadmap-preview');if(!out)return;const {total,rows}=baselineStats();const hotspots=[...rows].sort((a,b)=>b.emissions-a.emissions).filter(r=>r.emissions>0).slice(0,3).map(r=>r.source).join(' · ')||'Complete your baseline';const top=sortedActions().slice(0,3);const f=state.fields;out.innerHTML=`<div class="roadmap-meta"><div><span class="eyebrow">One-page pathway</span><h2>${safe(f.orgName||'Your organisation')}</h2></div><strong>${safe(f.baselineYear||'Baseline year')}</strong></div><div class="roadmap-baseline"><div><span class="eyebrow">Baseline</span><h3>${total?(total/1000).toFixed(2)+' tCO₂e':'Not yet calculated'}</h3><small>${safe(f.targetStatement||'Add a direction or target')}</small></div><div><span class="eyebrow">Hotspots</span><h3>${safe(hotspots)}</h3><small>${safe(f.baselineAssumptions||'Document assumptions and factor sources')}</small></div></div><div class="roadmap-actions">${[0,1,2].map(i=>{const a=top[i];return `<article><span>Priority ${i+1}</span><h4>${safe(a?.name||'Add and score an action')}</h4><p>${a?`Decision score ${actionScore(a).toFixed(1)}/5`:'Impact · cost · timeline'}</p></article>`}).join('')}</div><div class="roadmap-footer"><div><b>Owners</b><span>${safe(f.roadmapOwners||'Assign accountable owners')}</span></div><div><b>Indicators</b><span>${safe(f.roadmapIndicators||'Choose 2–4 progress measures')}</span></div><div><b>Review</b><span>${safe(f.roadmapReview||'Set a review point')}</span></div></div><div class="callout green"><strong>Longer-term direction</strong><p>${safe(f.longerDirection||'Describe the next-stage transition after the three priorities.')}</p></div>`}

document.querySelectorAll('[data-complete]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.complete;if(!state.completed.includes(id))state.completed.push(id);saveState('Progress saved')}));
function updateProgress(){const required=['journey','module1','module2','module3','module4'];const percent=Math.round(required.filter(x=>state.completed.includes(x)).length/required.length*100);document.querySelector('#progress-text').textContent=`${percent}%`;document.querySelector('#progress-bar').style.width=`${percent}%`;document.querySelector('#completion-ring strong').textContent=`${percent}%`;document.querySelector('#completion-ring').style.background=`conic-gradient(var(--amber) ${percent}%, transparent 0)`;const items=[['Boundary map','module1'],['Carbon baseline','module2'],['Prioritisation matrix','module3'],['One-page roadmap','module4']];document.querySelector('#evidence-list').innerHTML=items.map(([label,id])=>{const done=state.completed.includes(id);return `<div class="evidence-item ${done?'done':'pending'}"><strong>${label}</strong><span>${done?'Ready for review':'In progress'}</span></div>`}).join('')}
document.querySelector('#reset-course').addEventListener('click',()=>{if(confirm('Reset all saved responses, calculations and progress on this device?')){localStorage.removeItem(STORAGE_KEY);location.reload()}});
renderRoadmap();updateProgress();
