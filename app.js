/* =============== state =============== */
let dirty=false, enterprise=false, live=false, salesRequested=false, curCat=null;
let persona='admin', tone='warm', sandboxFromSetup=false;
const CH={chat:false, where:null};
const WELCOME_DEFAULT='Hi! I can help with billing, ID cards, and checking on a claim. For anything about changing your coverage, I’ll connect you with a licensed agent.';
let welcomeMsg=WELCOME_DEFAULT;
const TONEPREV={
  warm:'Happy to help - your balance is $132.40, due Aug 15.',
  neutral:'Your balance is $132.40, due Aug 15.',
  formal:'Your current balance is $132.40, due 15 August.'
};

/* =============== helpers =============== */
function toast(msg){const t=document.getElementById('toast'); t.textContent=msg; t.style.display='block';
  clearTimeout(t._h); t._h=setTimeout(()=>{t.style.display='none';},3200);}
function openModal(html,wide){const b=document.getElementById('modalbody'); b.innerHTML=html; b.style.maxWidth=wide?'600px':'440px'; document.getElementById('modal').classList.add('on');}
function closeModal(){document.getElementById('modal').classList.remove('on');}
function markDirty(){dirty=true; const d=document.getElementById('testdot'); if(d) d.classList.remove('ok');}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;');}

function setView(v){
  document.getElementById('view-landing').classList.toggle('on', v==='landing');
  document.getElementById('view-onboard').classList.toggle('on', v==='onboard');
  const shell=document.getElementById('shell');
  const wiz=document.getElementById('wiz');
  if(v==='landing'){shell.classList.remove('on'); wiz.classList.remove('on'); document.getElementById('demonav').classList.remove('on');
    document.getElementById('testfab').style.display='none'; window.scrollTo({top:0}); demoHi('landing'); return;}
  document.getElementById('demonav').classList.add('on');
  if(v==='onboard'){shell.classList.remove('on'); wiz.classList.remove('on');
    document.getElementById('testfab').style.display='none'; window.scrollTo({top:0}); demoHi('onboard'); return;}
  if(v==='sandbox') sandboxFromSetup = wiz.classList.contains('on');
  shell.classList.add('on');
  wiz.classList.toggle('on', v==='wizard');
  document.querySelector('.sbslot').style.display = (v==='owner') ? 'none':'';
  ['config','home','sandbox','upgrade','connections','owner','users','builder'].forEach(x=>{const e=document.getElementById('view-'+x); if(!e)return; e.style.display = x===v ? 'flex':'none'; e.classList.toggle('on',x===v);});
  const navMap={wizard:'home', config:'home', owner:'home', builder:'home'};
  const hi=navMap[v]||v;
  document.querySelectorAll('.sitem').forEach(b=>b.classList.toggle('active', b.dataset.nav===hi));
  document.getElementById('testfab').style.display = (v==='sandbox'||v==='owner') ? 'none':'flex';
  if(v==='config') cfgTab(curCfgTab);
  if(v==='home') renderHome();
  if(v==='upgrade') renderUpgrade();
  if(v==='connections') renderConnections();
  if(v==='owner') renderOwner();
  if(v==='sandbox') sandboxOpen();
  if(v==='users') renderUsers();
  if(v==='builder') renderBuilder();
  demoHi(v);
}
const EXTRAS=[];
/* Ema-asks: needs discovered from rules, answered with pills, routed to Connections */
const NEEDS=[];
function emaAsksFor(c){
  if(!c.easks) return '';
  return c.easks.map((q,qi)=>{
    if(q.done) return kEma(q.doneMsg);
    if(q.thinking) return kEma(q.q)+kThink();
    const pills=q.opts.map((o,oi)=>'<div class="apchip" onclick="eAnswer(&#39;'+c.id+'&#39;,'+qi+','+oi+')">'+o[0]+'</div>').join('');
    return kEma(q.q)+'<div style="display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 10px;">'+pills+'</div>';
  }).join('');
}
function eAnswer(cid,qi,oi){
  const c=CATS.find(x=>x.id===cid); if(!c) return;
  const q=c.easks[qi]; const o=q.opts[oi];
  q.thinking=true; refreshCat();
  setTimeout(()=>{
    delete q.thinking;
    q.done=true; q.doneMsg=o[1];
    if(o[2]) NEEDS.push({conn:o[2].conn, need:o[2].need, from:c.name, done:false});
    markDirty(); refreshCat();
  },650);
}
function obRole(el){
  document.querySelectorAll('#rolechips .chip').forEach(x=>x.classList.remove('on'));
  el.classList.add('on');
  const c=document.getElementById('obcompany');
  if(c.style.display==='none'){c.style.display='block'; c.classList.add('fadeup');}
}
function obDone(){ setView('home'); toast('Workspace ready'); }
let builderInit=false;
const AP_PROMPTS=[
 ['storefront','A returns and refunds agent for our store'],
 ['wrench','An IT helpdesk agent for employees'],
 ['calendar-check','An appointment rescheduling agent']
];
function apEma(html){document.getElementById('aplog').insertAdjacentHTML('beforeend','<div class="apmsg">'+html+'</div>'); apScroll();}
function apUser(text){document.getElementById('aplog').insertAdjacentHTML('beforeend','<div class="apbub"><div>'+esc(text)+'</div></div>'); apScroll();}
function apScroll(){const t=document.getElementById('apthread'); t.scrollTop=t.scrollHeight;}
function renderBuilder(){
  if(builderInit) return;
  builderInit=true;
  const box=document.getElementById('approm');
  AP_PROMPTS.forEach(pm=>{
    const b=document.createElement('button');
    b.setAttribute('style','display:flex;align-items:center;gap:10px;padding:10px 12px;width:100%;background:#fff;border:1px solid var(--beige-300);border-radius:10px;cursor:pointer;text-align:left;font-family:inherit;font-size:13px;font-weight:500;');
    b.innerHTML='<i class="ph ph-'+pm[0]+'" style="font-size:16px;color:var(--green-800);"></i>'+pm[1];
    b.onclick=()=>apStart(pm[1]);
    box.appendChild(b);
  });
}
function apStart(text){
  document.getElementById('apwelcome').style.display='none';
  const t=document.getElementById('apthread'); t.style.justifyContent='flex-start'; t.style.display='block';
  document.getElementById('aplog').style.display='block';
  apUser(text);
  setTimeout(()=>{
    apEma('On it. Here&rsquo;s my plan:');
    const steps=[
      ['globe','Reading your website for products, policies and tone'],
      ['squares-four','Drafting sections - Orders, Returns, Refunds, Shipping'],
      ['shield-check','Writing rules - 9 drafted, each editable'],
      ['plugs-connected','Selecting connections - Shopify, Zendesk'],
      ['flask','Packaging test suites - one per section']
    ];
    const sid='apsteps'+Date.now();
    document.getElementById('aplog').insertAdjacentHTML('beforeend','<div id="'+sid+'" style="margin:2px 0 6px;border-left:2px solid var(--beige-300);padding-left:14px;"></div>');
    steps.forEach((s,i)=>setTimeout(()=>{
      const box=document.getElementById(sid); if(!box) return;
      box.insertAdjacentHTML('beforeend','<div id="'+sid+'_'+i+'" style="display:flex;gap:9px;align-items:center;padding:5px 0;font-size:12.5px;color:var(--fg2);"><i class="ph ph-circle-notch" style="animation:sp .8s linear infinite;color:var(--fg3);"></i><i class="ph ph-'+s[0]+'" style="color:var(--fg3);font-size:13px;"></i>'+s[1]+'</div>');
      apScroll();
      setTimeout(()=>{const r=document.getElementById(sid+'_'+i); if(r) r.firstChild.outerHTML='<i class="ph-bold ph-check" style="color:var(--green-800);"></i>';},900);
    }, 500+i*1100));
    setTimeout(()=>{
      apEma('Draft ready: 4 sections, 9 rules, 2 connections, 4 test suites. Open it in setup - you review each section and invite its experts, exactly like any other AI Employee.');
      document.getElementById('aplog').insertAdjacentHTML('beforeend','<div style="padding:2px 4px 12px;"><button class="btn primary sm" onclick="openWizard();toast(&#39;Draft opened in setup&#39;)">Open draft setup <i class="ph ph-arrow-right"></i></button></div>');
      apScroll();
    }, 500+steps.length*1100+700);
  },600);
}
function bSend(){
  const inp=document.getElementById('bin'); if(!inp.value.trim())return;
  const v=inp.value; inp.value='';
  if(document.getElementById('apwelcome').style.display!=='none'){ apStart(v); return; }
  apUser(v);
  setTimeout(()=>apEma('I&rsquo;ll fold that in - the draft updates before you open it.'),700);
}

/* ===== RECONSTRUCTED CORE (framework, data, steps) ===== */
let cur=0, demoState='fresh';
function togglePersona(){
  if(persona==='admin' && !(CATS[2]&&CATS[2].owners&&CATS[2].owners.length)){toast('Invite an expert first, or load the worked example'); return;}
  persona = persona==='admin' ? 'owner' : 'admin';
  const pill=document.getElementById('personapill');
  if(pill) pill.textContent = persona==='owner' ? 'View as maria' : 'View as r.patel';
  if(persona==='owner'){ setView('owner'); } else { setView('config'); }
}
function refreshCat(){ if(persona==='owner'){renderOwner();} else {renderStep();} }
function demoHi(v){document.querySelectorAll('.demonav .dpill').forEach(p=>p.classList.toggle('on',p.dataset.v===v));}
function demoGo(v){ if(v==='wizard'){openWizard();} else {setView(v);} }
function openWizard(){setView('wizard'); renderStepper(); renderStep();}
function exitWizard(){setView('home');}

/* ---- sign-in (Google mock) + boot ---- */
const GLOGO='<svg width="40" height="40" viewBox="0 0 24 24"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.4z"/><path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 21.4 7.6 24 12 24z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7.5H1.8C1 9.1.6 10.9.6 12.6s.4 3.5 1.2 5.1l3.8-2.9z"/><path fill="#EA4335" d="M12 5.2c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.6 15.1.5 12 .5 7.6.5 3.7 3.1 1.8 7l3.8 2.9c.9-2.7 3.4-4.7 6.4-4.7z"/></svg>';
function signIn(){gAuthChooser();}
function gAuthChooser(){
  document.getElementById('gauth').classList.add('on');
  document.getElementById('gbody').innerHTML=`
    <div class="gbar"><span style="font-weight:500;color:#202124">Sign in with Google</span></div>
    <div class="gcard">
      <div class="glogo">${GLOGO}</div>
      <div class="gtitle">Choose an account</div>
      <div class="gsub">to continue to <span class="appname">Ema</span></div>
      <div class="gacct" onclick="gAuthConsent()"><span class="gav">M</span><div><div class="gname">Maria Chen</div><div class="gmail">maria.chen@northlakeauto.com</div></div></div>
      <div class="gacct" onclick="gAuthConsent()"><span class="gav" style="background:#0b8043">M</span><div><div class="gname">Maria Chen (personal)</div><div class="gmail">mariachen91@gmail.com</div></div></div>
      <div class="gacct"><span class="gav grey">&#128100;</span><div><div class="gname" style="font-weight:400">Use another account</div></div></div>
    </div>
    <div class="gfoot"><span>English (United States)</span><span>Help</span><span>Privacy</span><span>Terms</span></div>`;
}
function gAuthConsent(){
  document.getElementById('gbody').innerHTML=`
    <div class="gbar"><span style="font-weight:500;color:#202124">Sign in with Google</span></div>
    <div class="gcard">
      <div class="glogo">${GLOGO}</div>
      <div class="gtitle">Sign in to Ema</div>
      <div class="gsub">maria.chen@northlakeauto.com</div>
      <div class="gconsent">By continuing, Google will share your name, email address and profile picture with <a href="#">Ema</a>.</div>
      <div class="gbtnrow"><button class="gbtn ghost" onclick="gAuthCancel()">Cancel</button><button class="gbtn" onclick="gAuthLoading()">Continue</button></div>
    </div>
    <div class="gfoot"><span>English (United States)</span><span>Help</span><span>Privacy</span><span>Terms</span></div>`;
}
function gAuthLoading(){
  document.getElementById('gbody').innerHTML=`
    <div class="gbar"><span style="font-weight:500;color:#202124">Sign in with Google</span></div>
    <div class="gcard" style="text-align:center;">
      <div class="glogo">${GLOGO}</div>
      <div class="gtitle">Signing you in</div>
      <div class="gspin"></div>
    </div>`;
  setTimeout(()=>{document.getElementById('gauth').classList.remove('on'); bootRun(BOOT_STAGES,()=>{
    setView('onboard');
  });},1400);
}
function gAuthCancel(){document.getElementById('gauth').classList.remove('on');}
const BOOT_STAGES=['Setting up your workspace','Reading northlakeauto.com','Installing the Insurance Servicing Pack','Creating your sandbox policyholders','Your workspace is ready'];
const UPG_STAGES=['Applying your contract','Unlocking evaluations','Provisioning production connections','Assigning your Ema team','Enterprise workspace ready'];
function bootRun(stages,onDone,capText){
  const w=document.getElementById('boot'); w.classList.add('on');
  document.getElementById('bootcap').textContent=capText||'Ema · Setting up your workspace';
  const lbl=document.getElementById('bootstage'), fill=document.getElementById('bootbarfill');
  const MS=1400;
  stages.forEach((s,i)=>setTimeout(()=>{
    lbl.style.animation='none'; void lbl.offsetWidth; lbl.style.animation='';
    lbl.textContent=s; fill.style.width=Math.round(((i+1)/stages.length)*100)+'%';
  }, i*MS));
  setTimeout(()=>{w.classList.remove('on'); fill.style.width='8%'; onDone();}, stages.length*MS+600);
}

/* ---- wizard framework ---- */
const GROUPS=[
 ['Set up',['Select channels','What it handles','Global rules & knowledge']],
 ['Check',['Connections','Safety tests']],
 ['Launch',['Widget','Go live']]
];
const STEPS=GROUPS.flatMap(g=>g[1]);
function numWord(n){return ['No','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'][n]||n;}
const STEPMETA=[
 ['Select channels','Pick where this assistant meets customers. Chat is live today; voice and email are on the way.'],
 ['What it handles',()=>{const n=decisionCount(); return 'Each section owns its answers, rules and documents.'+(n?' '+numWord(n)+' item'+(n>1?'s':'')+' need your decision.':'');}],
 ['Global rules & knowledge','What applies across every section: the rules the assistant always follows, and the shared knowledge it answers from.'],
 ['Connect your systems','Nothing needs connecting to test in the sandbox. Connect now, or invite your IT team and finish later.'],
 ['Safety tests','Each section has a test suite. Counts track your rules.'],
 ['Put it on your site','Name it and take the snippet. Live traffic waits for go-live.'],
 ['Go live','Test freely in the sandbox. Live customer traffic runs on an enterprise contract.']
];
let done=STEPS.map(()=>false);
function renderStepper(){
  let idx=0;
  let html='<div class="sn-eyebrow">Set up your assistant</div><div class="sn-progress">Step '+(cur+1)+' of '+STEPS.length+'<div class="sn-bar"><i style="width:'+Math.round(((cur+1)/STEPS.length)*100)+'%"></i></div></div>';
  GROUPS.forEach(g=>{
    html+='<div class="sn-group">'+g[0]+'</div>';
    g[1].forEach(()=>{
      const i2=idx;
      const cls=i2===cur?'sn-step active':(done[i2]?'sn-step done':'sn-step');
      const inner=done[i2]&&i2!==cur?'<i class="ph-bold ph-check" style="font-size:10px"></i>':(i2+1);
      html+='<div class="'+cls+'" onclick="go('+i2+')"><span class="sn-n">'+inner+'</span>'+STEPS[i2]+'</div>';
      idx++;
    });
  });
  html+='<div class="sn-acct"><span class="sn-av">M</span><span>maria.chen@<br>northlakeauto.com</span></div>';
  document.getElementById('stepper').innerHTML=html;
}
function go(i){done[cur]=true; cur=i; curCat=null; renderStepper(); renderStep(); const m=document.querySelector('.wizmain'); if(m)m.scrollTo({top:0});}
function next(){go(Math.min(cur+1,STEPS.length-1));}
function back(){ if(curCat!==null){curCat=null; renderStep(); return;} go(Math.max(cur-1,0)); }
function renderFooter(){
  const el=document.getElementById('wizfootin'); if(!el) return;
  let html='';
  if(cur>0||curCat!==null) html+='<button class="btn ghost" onclick="back()"><i class="ph ph-arrow-left"></i> Back</button>';
  html+='<span style="flex:1"></span>';
  if(curCat!==null){ html+='<button class="btn primary" onclick="curCat=null;renderStep()">Done <i class="ph ph-check"></i></button>'; }
  else if(cur<STEPS.length-1){
    if(cur===3||cur===4) html+='<button class="skiplink" onclick="next()">Skip for now</button>';
    html+='<button class="btn primary" onclick="next()">Continue <i class="ph ph-arrow-right"></i></button>';
  }
  el.innerHTML=html;
}
function renderStep(){
  const col=document.getElementById('steps'); if(!col) return;
  if(curCat!==null){ col.innerHTML=catDetailHtml(curCat); if(typeof wireCatDetail==='function') wireCatDetail(curCat); renderFooter(); return; }
  const meta=STEPMETA[cur];
  const sub = typeof meta[1]==='function' ? meta[1]() : meta[1];
  col.innerHTML='<div class="steph fadeup"><h1>'+meta[0]+'</h1><p>'+sub+'</p></div><div class="fadeup">'+S[cur]()+'</div>';
  wireStep(); if(cur===2) fillKnow(); renderFooter();
}

/* ---- open items / chips ---- */
function openItems(c){ return (c.issues?c.issues.filter(x=>!x.done).length:0); }
function covData(){
  let conf=0,gap=0,uncov=0;
  CATS.forEach(c=>{ (c.issues||[]).forEach(x=>{if(!x.done){if(x.kind==='conflict')conf++;else gap++;}});
    uncov+=flatRules(c).filter(r=>r.cfg==='sop'&&!r.cite).length; });
  const unowned=CATS.filter(c=>!(c.owners&&c.owners.length)).length;
  return {conf,gap,uncov,unowned};
}
function decisionCount(){const d=covData(); return d.conf+d.gap;}
function reviewChip(c){ return ''; }
function covChips(){ return ''; }

/* ---- category data ---- */
const CATS=[
 {id:'cov', icon:'book-open-text', name:'Coverage questions', desc:'What plans cover, definitions, how claims work', tier:'g', tiert:'Handles it',
  answers:[], resolves:[], docs:['northlake_auto_policy_TC_2026.pdf'],
  pack:[
   {q:'What does comprehensive cover?', a:'Explains comprehensive covers most physical damage that isn&rsquo;t a collision - theft, hail, fire, animals - and cites the customer&rsquo;s terms.', cite:'northlake_auto_policy_TC_2026.pdf · p.8', v:'ok', d:'answers'},
   {q:'Is a rental car covered while mine is in the shop?', a:'Answers only from the customer&rsquo;s own elected coverages - rental reimbursement is optional, so it checks before answering.', cite:'northlake_auto_policy_TC_2026.pdf · p.11', v:'ok', d:'answers'}
  ], more:10, signed:null, rerun:null,
  cfg:true, qshow:true,
  rules:[
   {t:'Answer what the customer&rsquo;s own plan covers', cfg:'policy', src:'Ema pack · GLBA'},
   {t:'General coverage questions answered from your documents, labelled general', cfg:'sop', cite:'northlake_auto_policy_TC_2026.pdf · p.8', src:'Ema pack · GLBA'},
   {t:'Explain terms - deductible, comprehensive vs collision', cfg:'sop', cite:'northlake_auto_policy_TC_2026.pdf · p.3', src:'Ema pack'},
   {t:'Walk through the filing steps and required documents', cfg:'sop', cite:'northlake_auto_policy_TC_2026.pdf · p.5', src:'Ema pack'}],
  issues:[
   {kind:'conflict', title:'Your SOP vs Ema&rsquo;s state facts', body:'Your SOP appendix quotes Texas minimum liability figures that do not match the current Texas Department of Insurance figures in Ema&rsquo;s state facts.',
    a:['Use current figures','Using Ema&rsquo;s current figures, kept up to date from the Texas DOI. Your SOP appendix is flagged for updating.'], b:['Keep SOP figures','Keeping your SOP figures. Logged on the audit trail.']},
   {kind:'gap', title:'4 of your 12 states have no state-specific wording', body:'Your terms &amp; conditions names 8 states. For CA, NY, WA and CO the assistant answers from general knowledge and Ema&rsquo;s state facts only.',
    fix:['Upload state documents','All 12 states covered - state plan documents uploaded and cited in this section&rsquo;s next test run.']}],
  dest:'support@northlakeauto.com', deps:[['Website crawl','ok'],['Pre-built insurance knowledge','ok']], owner:null},
 {id:'clm', icon:'wrench', name:'Claim status', desc:'Where is my claim, adjuster, repair timing', tier:'a', tiert:'Verify first',
  answers:[], resolves:[], docs:[],
  pack:[
   {q:'Where is my claim?', a:'Reads the claim stage and adjuster back after identity is verified.', cite:'Live read from claim records', v:null, d:'answers'},
   {q:'When will my repair be done?', a:'Shares the shop&rsquo;s current estimate and says it can change - never a promised date.', cite:'Rule: never promise a repair date', v:null, d:'answers'}
  ], more:8, signed:null, rerun:null,
  cfg:true, qshow:true,
  rules:[
   {t:'Read back the claim stage and adjuster', cfg:'policy', src:'Ema pack · GLBA'},
   {t:'Never promise a repair completion date', cfg:'sop', cite:null, src:'Ema pack · CA claims code'},
   {t:'Capture complaints and file them to your team', cfg:'ticket', src:'Ema pack'}],
  issues:[
   {kind:'gap', title:'No claims SOP uploaded', body:'The assistant can read a claim&rsquo;s status, and will answer process questions from general knowledge only.',
    fix:['Upload claims SOP','claims_handling_SOP.docx uploaded · rules extracted for your review.']}],
  dest:'support@northlakeauto.com', deps:[['Policy records','ok'],['Salesforce','miss']], owner:null},
 {id:'bil', icon:'credit-card', name:'Billing & payments', desc:'Balance, pay a bill, ID card, disputes', tier:'a', tiert:'Verify first',
  answers:[], resolves:[], docs:['billing_and_disputes_SOP_v3.docx'],
  pack:[
   {q:'What&rsquo;s my balance and when is it due?', a:'Reads the balance and due date back after identity is verified, and offers the payment link.', cite:'Live read from policy records', v:'ok', d:'answers'},
   {q:'Why did my bill go up this month?', a:'Explains the premium change from the billing history, and offers a licensed agent for anything about coverage pricing.', cite:'billing_and_disputes_SOP_v3.docx · p.4', v:'ok', d:'answers'},
   {q:'I want to dispute a charge', a:'Captures the dispute with the details and files it to your billing team.', cite:'billing_and_disputes_SOP_v3.docx · p.5', v:'ok', d:'ticket'}
  ], more:22, signed:null, rerun:null,
  cfg:true, qshow:true,
  easks:[
   {q:'Quick one: customers will ask why a bill changed. Today I can read totals only. Should I read individual charges too?',
    opts:[
     ['Yes, read charges','Noted. I&rsquo;ll set up charge-level reads with your IT admin when Guidewire connects - it shows on the Guidewire card in Connections.',{conn:'gw', need:'Invoice line items (charge-level reads) - asked by Billing'}],
     ['Totals are enough','Understood - I&rsquo;ll answer from totals and hand charge-detail questions to your team.',null]]}],
  rules:[
   {t:'Read back balance and due date only after the identity check', cfg:'policy', src:'Ema pack · GLBA'},
   {t:'Take payment through the secure payment link only', cfg:'other', other:'Send the hosted payment link; confirm when the processor reports success.', src:'Ema pack'},
   {t:'No payments on accounts in collections', cfg:'sop', cite:'billing_and_disputes_SOP_v3.docx · p.9'},
   {t:'Refunds above $500 go to a supervisor', cfg:'ticket', sopAdded:true, cite:'billing_and_disputes_SOP_v3.docx · p.7'},
   {t:'Capture disputes and file them to your billing team', cfg:'ticket', src:'Ema pack'}],
  issues:[
   {kind:'conflict', title:'Your SOP vs your website', body:'Your SOP (p.9) says no payments on accounts in collections. Your website FAQ says any account can pay online.',
    a:['Follow the SOP','Following the SOP. Collections accounts route to your billing team; the website FAQ is flagged for updating.'], b:['Follow the website','Following the website. Any account gets the payment link.']},
   {kind:'gap', title:'Your SOP has no dispute section', body:'The assistant will capture a dispute and file it, and cannot explain your dispute process.', dispute:true}],
  dest:'Billing team queue · Salesforce', deps:[['Policy records','ok'],['Payment provider','ok'],['Salesforce','miss']], owner:{email:'r.patel@northlakeauto.com', status:'Joined'}},
 {id:'pol', icon:'user-switch', name:'Policy changes & advice', desc:'Add or remove a car or driver, advice, quotes', tier:'r', tiert:'Always to a person',
  answers:[], resolves:[], docs:[],
  pack:[
   {q:'Can you add my new car right now?', a:'Collects the details, files the request to a producer, and never says the car is covered before the change is final.', cite:'Rule: never &ldquo;covered&rdquo; before final', v:'ok', d:'ticket'},
   {q:'How much would a second driver cost?', a:'Declines to quote - a licensed act - and opens a producer request with the details attached.', cite:'Rule: licensed-act routing', v:'ok', d:'ticket'}
  ], more:6, signed:null, rerun:null,
  cfg:true, qshow:true,
  rules:[
   {t:'Collect the full details, then file to a producer', cfg:'ticket', src:'Ema pack · State licensing'},
   {t:'Never say &ldquo;covered&rdquo; before the change is final', cfg:'sop', cite:'producer_manual_2026.pdf · p.11', src:'Ema pack · State licensing'},
   {t:'Quotes and pricing go to a licensed producer', cfg:'ticket', src:'Ema pack · State licensing'}],
  issues:[
   {kind:'conflict', title:'Your SOP vs an Ema built-in rule', body:'Your SOP (p.11) tells agents a newly added car <i>is covered</i> during the 14-day grace period. Ema&rsquo;s built-in rule never says &ldquo;covered&rdquo; before the change is final.',
    a:['Keep Ema&rsquo;s rule','Keeping Ema&rsquo;s rule. The assistant explains the grace period and a licensed agent confirms coverage.'], b:['Follow the SOP','Following your SOP. Logged on the audit trail.']}],
  dest:'Producer queue · Salesforce', deps:[['Salesforce','miss']], owner:null}
];
const WSRULES=[
 {t:'Never share anything personal before identity is verified', small:'Required by federal privacy law (GLBA).'},
 {t:'Never say a car, driver or change &ldquo;is covered&rdquo; before the change is final', small:'Otherwise a customer can drive uninsured believing they are covered.'},
 {t:'Never disclose claim reserves, adjuster notes, fraud flags, or disputed fault', small:'Regulated claim information.'},
 {t:'Never interpret coverage, recommend limits, or quote a price - hand to a licensed agent', small:'Licensed acts in your 12 states.'},
 {t:'General knowledge is always labelled general - never presented as the customer&rsquo;s own policy terms', small:'Ships with the pre-built knowledge base.'}
];
const SUITES=[
 {id:'ws',  name:'Universal rules', cat:null,  n:62, beh:[['Prompt injection','error'],['Abuse','error'],['Accuracy','success']], desc:'identity gate, never-disclose list, never-covered phrasing'},
 {id:'cov', name:'Coverage questions', cat:'cov', n:22, beh:[['Accuracy','success'],['Hallucination','warning']], desc:'grounded answers with citations'},
 {id:'clm', name:'Claim status', cat:'clm', n:24, beh:[['Accuracy','success'],['Hallucination','warning']], desc:'no repair-date promises; reserves and adjuster notes stay hidden'},
 {id:'bil', name:'Billing & payments', cat:'bil', n:34, beh:[['Accuracy','success'],['Prompt injection','error']], desc:'payment-link only; collections and refund rules enforced'},
 {id:'red', name:'Red team', cat:null, n:40, beh:[['Prompt injection','error'],['Angry user','warning'],['Abuse','error']], desc:'jailbreaks, social engineering, hostile and off-policy requests'}
];
function suiteTotal(){return SUITES.reduce((a,s)=>a+s.n,0);}
function bumpSuite(catId,delta){const s=SUITES.find(x=>x.cat===catId)||SUITES[0]; const was=s.n; s.n+=delta;
  toast(s.name+' suite: '+was+' to '+s.n+' scenarios');}
const DOCS=[
 {file:'northlake_auto_policy_TC_2026.pdf', icon:'file-pdf', ver:'v1', date:'12 May', pill:'Customer-facing', pillCls:'ok', cites:[['cov',2]]},
 {file:'billing_and_disputes_SOP_v3.docx', icon:'file-doc', ver:'v3', date:'12 May', pill:'Internal', pillCls:'grey', cites:[['bil',5]], extracted:2},
 {file:'producer_manual_2026.pdf', icon:'file-pdf', ver:'v1', date:'12 May', pill:'Internal', pillCls:'grey', cites:[['pol',2]]}
];
function shortCat(id){const c=CATS.find(x=>x.id===id); if(!c) return id;
  return c.name.replace(' questions','').replace(' & payments','').replace(' & advice','');}
function docsFor(catId){return DOCS.filter(d=> d.cites.some(x=>x[0]===catId) || d.tag===catId);}
function docRowHtml(d){
  const chips=[];
  const cites=d.cites.filter(x=>x[1]>0).map(x=>shortCat(x[0])+' ('+x[1]+' rules)').join(', ');
  if(cites) chips.push('<span class="depchip ok"><i class="ph-bold ph-check"></i>Covers '+cites+'</span>');
  if(d.extracted) chips.push('<span class="depchip ok">'+d.extracted+' rules extracted</span>');
  if(d.uploaded) chips.push('<span class="depchip">'+(d.tag?'Tagged to '+shortCat(d.tag):'In the library')+'</span>');
  const meta=d.ver+' · '+d.date;
  return '<div class="item"><span class="ii"><i class="ph ph-'+d.icon+'"></i></span><div><div class="it">'+d.file+'</div><div class="is">'+meta+'</div>'
    +(chips.length?'<div style="margin-top:5px;display:flex;gap:5px;flex-wrap:wrap;">'+chips.join('')+'</div>':'')
    +'</div><span class="rightctl"><span class="pillst '+d.pillCls+'">'+d.pill+'</span></span></div>';
}
function uploadDoc(catId){
  const ci=CATS.findIndex(c=>c.id===catId);
  if(ci>-1 && typeof SOPSIM!=='undefined' && SOPSIM[catId] && !DOCS.some(d=>d.file===SOPSIM[catId].file) && document.getElementById('soparse_'+catId)){ parseSOP(ci); return; }
  if(DOCS.some(d=>d.file==='claims_handling_SOP.docx')){toast('Already uploaded'); return;}
  DOCS.push({file:'claims_handling_SOP.docx', icon:'file-doc', ver:'v1', date:'today', pill:'Internal', pillCls:'grey',
    cites: catId?[[catId,0]]:[], uploaded:true, tag:catId||null});
  markDirty(); toast('Uploaded'); refreshCat();
}
CATS.forEach(c=>{c.owners = c.owner?[c.owner]:[];});
const WORKED={cats:JSON.parse(JSON.stringify(CATS)), docs:JSON.parse(JSON.stringify(DOCS))};
function applyWorkedSeeds(){
  DOCS.length=0; JSON.parse(JSON.stringify(WORKED.docs)).forEach(d=>DOCS.push(d));
  CATS.length=0; JSON.parse(JSON.stringify(WORKED.cats)).forEach(c=>CATS.push(c));
  CATS.forEach(c=>{c.owners = c.owners && c.owners.length ? c.owners : (c.owner?[c.owner]:[]); c.kstate='done';});
}
function applyFreshSeeds(){
  applyWorkedSeeds();
  DOCS.length=0;
  CATS.forEach(c=>{
    c.signed=null; c.rerun=null; c.issues=[]; c.owner=null; c.owners=[];
    c.cfg=false; c.qshow=false; c.qsel=0;
    c.rules=(c.rules||[]).filter(r=>!r.sopAdded&&!r.user); c.rules.forEach(r=>{ if(r.cfg==='sop') r.cite=null; }); c.suiteRun=false; c.tlog=[]; c.facts=[]; c.kstate='ask'; c.ksel={}; c.kext=[];
    (c.easks||[]).forEach(q=>{delete q.done; delete q.doneMsg;});
    c.pack.forEach(x=>{ x.v=null;
      if(x.cite.includes('.pdf')||x.cite.includes('.docx')) x.cite='Pack answer · drafted from general knowledge'; });
  });
}
function setDemoState(s){
  demoState=s; EXTRAS.length=0; NEEDS.length=0;
  if(s==='fresh'){CH.chat=false; CH.where=null;} else {CH.chat=true; CH.where='website';}
  if(s==='fresh') applyFreshSeeds(); else applyWorkedSeeds();
  curCat=null; dirty=false; persona='admin';
  const pp=document.getElementById('personapill'); if(pp) pp.textContent='View as r.patel';
  const sp=document.getElementById('statepill'); if(sp) sp.textContent = s==='fresh' ? 'Load worked example' : 'Back to day 0';
  if(document.getElementById('wiz').classList.contains('on')){renderStepper(); renderStep();}
  if(typeof curCfgTab!=='undefined' && curCfgTab) cfgTab(curCfgTab);
  toast(s==='fresh' ? 'Day-0 state loaded' : 'Worked example loaded');
}
function removeCat(i){
  if(!confirm('Remove '+CATS[i].name+'? Its test suite goes too. Removals are logged.')) return;
  const id=CATS[i].id;
  CATS.splice(i,1);
  const si=SUITES.findIndex(s=>s.cat===id); if(si>-1) SUITES.splice(si,1);
  curCat=null; markDirty(); renderStep(); toast('Section removed');
}
const TIERS=[['g','Handles it','Answers and completes this alone.'],['a','Verify first','Acts only after the customer proves who they are.'],['r','Always to a person','Prepares everything; your team completes it.']];
function setTier(i,t){
  const def=TIERS.find(x=>x[0]===t);
  CATS[i].tier=t; CATS[i].tiert=def[1];
  markDirty(); refreshCat();
}
function tierControl(i){
  const c=CATS[i];
  const chips=TIERS.map(t=>'<div class="chip'+(c.tier===t[0]?' on':'')+'" onclick="setTier('+i+',&#39;'+t[0]+'&#39;)">'+t[1]+'</div>').join('');
  const note=TIERS.find(t=>t[0]===c.tier)[2];
  return '<div class="seclabel">How it handles this</div><div class="chips">'+chips+'</div><div style="font-size:11.5px;color:var(--fg3);margin:7px 0 14px;">'+note+'</div>';
}

/* ---- steps 0-2 + shared panels ---- */
const S=[];
S[0]=()=>{
  const tile=(id,icon,name,sub,on,click,dim)=>'<div onclick="'+click+'" style="cursor:pointer;position:relative;border:1.5px solid '+(on?'var(--green-500)':'var(--beige-300)')+';background:'+(on?'var(--green-50)':'#fff')+';border-radius:12px;padding:14px 15px;'+(dim?'opacity:.55;':'')+'">'
    +(on?'<i class="ph-fill ph-check-circle" style="position:absolute;top:8px;right:9px;color:var(--green-800);font-size:15px;"></i>':'')
    +'<i class="ph ph-'+icon+'" style="font-size:20px;color:'+(on?'var(--green-800)':'var(--fg2)')+';"></i>'
    +'<div style="font-size:13px;font-weight:700;margin-top:6px;">'+name+'</div>'
    +'<div style="font-size:11px;color:var(--fg3);margin-top:1px;">'+sub+'</div></div>';
  return `
<div class="card">
  <div class="ct">Select channels</div>
  <div class="cs">Where this assistant meets customers. Start with one.</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:10px;">
    ${tile('ch','chat-circle-text','Chat','Website or in-app',CH.chat,'chPick()',false)}
    ${tile('vo','phone','Voice','Coming soon',false,"toast('Voice is coming soon')",true)}
    ${tile('em','envelope-simple','Email','Coming soon',false,"toast('Email is coming soon')",true)}
  </div>
  <div id="wherewrap" style="display:${CH.chat?'block':'none'};" class="fadeup">
    <div class="seclabel" style="margin-top:18px;">Where does the chat live?</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:10px;">
      ${tile('ww','globe','Website','northlakeauto.com',CH.where==='website',"wPick('website')",false)}
      ${tile('wa','device-mobile','In our app','Uses your app login',CH.where==='app',"wPick('app')",false)}
    </div>
    <div id="placewrap" style="display:${CH.where==='website'?'block':'none'};" class="fadeup">
      <div class="seclabel" style="margin-top:18px;">Who can open it?</div>
      <div class="chips" id="placement">
        <div class="chip on" data-p="public"><i class="ph ph-lock-simple-open" style="font-size:12px;margin-right:4px;"></i>Anyone, before login</div>
        <div class="chip" data-p="login"><i class="ph ph-lock-simple" style="font-size:12px;margin-right:4px;"></i>Customers, after login</div>
        <div class="chip" data-p="both"><i class="ph ph-arrows-left-right" style="font-size:12px;margin-right:4px;"></i>Both</div>
      </div>
      <div style="font-size:12px;color:var(--fg2);margin-top:9px;" id="placenote"><b>Before login:</b> anyone can chat. Before anything personal, the assistant verifies the customer - it matches them to their policy record and sends a one-time passcode to the phone or email on file.</div>
    </div>
  </div>
</div>`;};
function chPick(){ CH.chat=true; markDirty(); renderStep(); }
function wPick(w){ CH.where=w; markDirty(); renderStep(); if(w==='app') toast('In-app chat uses your app login for identity'); }
function catRowsHtml(){
  return CATS.map((c,i)=>{
    return `<div class="catrow" onclick="openCat(${i})">
      <span class="ctile"><i class="ph ph-${c.icon}"></i></span>
      <div style="flex:1;min-width:0">
        <div class="cname">${c.name}</div>
        <div class="cmeta">${c.desc}</div>
      </div>
      <span class="iconbtn" title="Remove" onclick="event.stopPropagation();removeCat(${i})"><i class="ph ph-x"></i></span>
      <i class="ph ph-caret-right"></i>
    </div>`;
  }).join('');
}
S[1]=()=>`
<div class="card">
  <div id="catlist">${catRowsHtml()}</div>
  <button class="addbtn" onclick="openAddCat()">+ Add a section</button>
</div>`;
S[2]=()=>gkCard('gkr','Universal rules','The always-on layer: tone, honesty, and the never list.',universalRulesBody(),true)
 +gkCard('gkd','Global documents','For every section: terms, brand guides, FAQs. Section SOPs are uploaded inside their sections.',globalDocsBody(),false)
 +gkCard('gkp','Built-in knowledge','What Ema knows before you upload anything.',prebuiltBody(),false);
function gkCard(id,title,sub,body,open){
  return '<div class="card">'
    +'<div class="ct" style="cursor:pointer;justify-content:space-between;" onclick="gkTog(&#39;'+id+'&#39;)"><span style="display:flex;gap:7px;align-items:center;">'+title+'</span><i id="c_'+id+'" class="ph ph-caret-'+(open?'up':'down')+'"></i></div>'
    +'<div class="cs" style="margin-bottom:'+(open?'13px':'0')+';">'+sub+'</div>'
    +'<div id="'+id+'" style="display:'+(open?'block':'none')+';">'+body+'</div></div>';
}
function gkTog(id){const b=document.getElementById(id); const c=document.getElementById('c_'+id); const open=b.style.display==='none'; b.style.display=open?'block':'none'; if(c)c.className='ph ph-caret-'+(open?'up':'down');}
function universalRulesBody(){return `
  <div class="seclabel">Tone</div>
  <div class="chips" id="tonechips">
    <div class="chip${tone==='warm'?' on':''}" data-tone="warm">Warm and plain-spoken</div><div class="chip${tone==='neutral'?' on':''}" data-tone="neutral">Neutral and efficient</div><div class="chip${tone==='formal'?' on':''}" data-tone="formal">Formal</div>
  </div>
  <div id="tonepreview" style="font-size:12px;color:var(--fg2);margin-top:8px;background:var(--beige-50);border:1px solid var(--beige-200);border-radius:8px;padding:8px 11px;">&ldquo;${TONEPREV[tone]}&rdquo;</div>
  <div class="seclabel" style="margin-top:16px;">When it doesn&rsquo;t know</div>
  <textarea rows="2" onchange="markDirty()">Say so plainly. Answer from general knowledge if that helps, and offer the right person to ask.</textarea>
  <div class="seclabel" style="margin-top:16px;">The never list - hard limits that always apply</div>
  <div id="rules">${WSRULES.map(r=>ruleHtml(r)).join('')}</div>
  <div style="display:flex;gap:8px;margin-top:4px;">
    <button class="addbtn" id="addrule">+ Add a rule</button>
    <button class="addbtn" id="upsop">+ Extract rules from a document</button>
  </div>
  <div id="composer"></div>`;}
function universalPanel(forOwner){
  const id='uni_'+(forOwner?'o':'a');
  const rows=WSRULES.map(r=>'<div style="font-size:12px;padding:7px 0;border-bottom:1px solid var(--beige-100);"><b>'+r.t+'</b><div style="font-size:11px;color:var(--fg3);margin-top:1px;">'+r.small+'</div></div>').join('');
  const req=forOwner?'<div style="margin-top:9px;"><button class="btn sm" onclick="toast(&#39;Request sent to maria.chen&#39;)">Request a change</button></div>':'';
  return `<div style="margin-top:12px;border:1px solid var(--beige-200);border-radius:10px;overflow:hidden;">
    <div style="padding:9px 12px;font-size:12px;color:var(--fg2);cursor:pointer;display:flex;align-items:center;gap:7px;background:var(--beige-50);" onclick="toggleUni('${id}')"><i class="ph ph-caret-down"></i> Universal rules (${WSRULES.length}) · set by maria.chen · apply to every section</div>
    <div id="${id}" style="display:none;padding:2px 12px 10px;">${rows}${req}</div>
  </div>`;
}
function toggleUni(id){const p=document.getElementById(id); p.style.display = p.style.display==='none' ? 'block':'none';}
function ruleHtml(r){
  const badge=r.badge?'<span class="rbadge '+(r.badge==='pack'?'sop':r.badge)+'">'+r.badget+'</span>':'';
  const dot=(r.badge&&r.badge!=='pack')?'style="background:var(--orange-800)"':'';
  return '<div class="rule"><span class="rdot" '+dot+'></span><div class="rmain">'+r.t+badge+(r.small?'<small>'+r.small+'</small>':'')+'</div><span class="ricons" style="align-items:center;"><span class="iconbtn ed"><i class="ph ph-pencil-simple"></i></span><span class="iconbtn rm"><i class="ph ph-x"></i></span></span></div>';
}
function answersCard(i){
  const c=CATS[i];
  if(!c.pack) return '';
  const rows=c.pack.map(x=>{
    const disp = x.d==='ticket'
      ? '<span class="badge warning" style="height:18px;font-size:10px;"><i class="ph-bold ph-ticket"></i> Files a ticket</span>'
      : '<span class="badge success" style="height:18px;font-size:10px;"><i class="ph-bold ph-chat-circle"></i> Bot answers</span>';
    return '<div style="border:1px solid var(--beige-200);border-radius:10px;padding:11px 13px;margin-bottom:8px;background:#fff;">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;"><span style="font-size:12.5px;font-weight:700;flex:1;">&ldquo;'+x.q+'&rdquo;</span>'+disp+'</div>'
      +'<div style="font-size:12px;color:var(--fg2);line-height:1.5;margin-bottom:6px;">'+x.a+'</div>'
      +'<span class="depchip"><i class="ph-bold ph-quotes"></i>'+x.cite+'</span></div>';
  }).join('');
  return `<div class="card">
    <div class="ct">What Ema already answers</div>
    <div class="cs">Preloaded from the pack. Each shows whether the bot answers or files a ticket.</div>
    ${rows}
    <div style="font-size:11.5px;color:var(--fg3);">+ ${c.more} more in this pack.</div>
  </div>`;
}
function inviteCard(i){
  const c=CATS[i];
  if(persona==='owner') return '';
  const chips=(c.owners||[]).map(o=>'<span class="badge '+(o.status==='Joined'?'success':'pending')+'">'+o.email.split('@')[0]+' · '+o.status+'</span>').join(' ');
  return `<div class="card" style="border-color:var(--green-500);background:var(--green-50);">
    <div class="ct"><i class="ph-fill ph-user-plus" style="color:var(--green-800)"></i> Invite your team</div>
    <div class="cs">Invite the team members who are subject-matter experts of this area. They fill in its rules and SOPs.</div>
    ${chips?'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">'+chips+'</div>':''}
    <div class="invrow"><input type="text" id="ownmail_${c.id}" placeholder="Emails, comma-separated"><button class="btn primary" onclick="inviteOwnerInline(${i})">Invite</button><button class="btn ghost sm" onclick="toast('CSV upload started')">Upload a CSV</button></div>
  </div>`;
}
function inviteOwnerInline(i){
  const inp=document.getElementById('ownmail_'+CATS[i].id);
  const raw=(inp&&inp.value.trim())||'r.patel@northlakeauto.com';
  const emails=raw.split(',').map(x=>x.trim()).filter(Boolean);
  CATS[i].owners=CATS[i].owners||[];
  emails.forEach(e=>CATS[i].owners.push({email:e, status:'Invite sent'}));
  CATS[i].owner=CATS[i].owners[0];
  markDirty(); refreshCat(); toast(emails.length>1?emails.length+' invites sent':'Invite sent');
}
/* ===== END RECONSTRUCTED CORE ===== */

/* ---- users tab ---- */
function allUsers(){
  const rows=[{email:'maria.chen@northlakeauto.com', role:'Workspace admin', sees:'Everything', status:'Joined'}];
  CATS.forEach(c=>(c.owners||[]).forEach(o=>rows.push({email:o.email, role:'Expert', sees:c.name+' only', status:o.status})));
  EXTRAS.forEach(x=>rows.push(x));
  if(enterprise) rows.push({email:'compliance@northlakeauto.com', role:'Compliance reviewer', sees:'Eval report, never-list, audit trail', status:'Invite sent'});
  return rows;
}
function renderUsers(){
  const el=document.getElementById('usersbody'); if(!el) return;
  const rows=allUsers().map(u=>{
    const st=u.status==='Joined' ? '<span class="badge success">Joined</span>'
      : '<span class="badge pending">Invite sent</span> <button class="btn sm ghost" onclick="toast(&#39;Reminder sent&#39;)">Resend</button>';
    return '<tr><td><b>'+u.email.split('@')[0]+'</b><div style="font-size:11px;color:var(--fg3)">'+u.email+'</div></td><td>'+u.role+'</td><td>'+u.sees+'</td><td>'+st+'</td></tr>';
  }).join('');
  const note=allUsers().length===1?'<div class="cs" style="margin-top:10px;">Only you so far. Invite experts from their sections, your IT team from Connections, or anyone from here.</div>':'';
  el.innerHTML='<div class="card"><table class="simple"><tr><th>Person</th><th>Role</th><th>Sees</th><th>Status</th></tr>'+rows+'</table>'+note+'</div>';
}
function openInviteUser(){
  const sects=CATS.map(c=>'<option>'+c.name+'</option>').join('');
  openModal(`
    <div class="mt">Invite to the workspace</div>
    <div class="mlabel">Emails</div>
    <input type="text" id="invmails" placeholder="Comma-separated">
    <div class="mlabel">Role</div>
    <select id="invrole"><option>Expert - one section only</option><option>Integration admin - Connections only</option><option>Workspace admin - everything</option></select>
    <div class="mlabel">Section (for experts)</div>
    <select id="invsect">${sects}</select>
    <div class="mfoot"><button class="btn ghost" onclick="toast('CSV upload started')">Upload a CSV</button><span style="flex:1"></span><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="confirmInviteUser()">Invite</button></div>`);
}
function confirmInviteUser(){
  const raw=(document.getElementById('invmails').value.trim())||'new.user@northlakeauto.com';
  const emails=raw.split(',').map(x=>x.trim()).filter(Boolean);
  const role=document.getElementById('invrole').value;
  const sect=document.getElementById('invsect').value;
  emails.forEach(e=>{
    if(role.startsWith('Expert')){ const c=CATS.find(x=>x.name===sect); if(c){c.owners=c.owners||[]; c.owners.push({email:e,status:'Invite sent'});} }
    else if(role.startsWith('Integration')) EXTRAS.push({email:e, role:'Integration admin', sees:'Connections only', status:'Invite sent'});
    else EXTRAS.push({email:e, role:'Workspace admin', sees:'Everything', status:'Invite sent'});
  });
  closeModal(); renderUsers(); toast(emails.length>1?emails.length+' invites sent':'Invite sent');
}
function goConnections(){ if(document.getElementById('wiz').classList.contains('on')){go(3);} else {setView('connections');} }
function universalCard(i){ return '<div class="card"><div class="ct">Universal rules</div><div class="cs">Apply to every section, always.</div>'+universalPanel(persona==='owner')+'</div>'; }
function kEma(t){return '<div class="apmsg">'+t+'</div>';}
function kThink(){return '<div class="apthink"><i></i><i></i><i></i></div>';}
function sopSection(i){
  const c=CATS[i];
  if(c.kstate!=='done') return kAsk(i);
  const uploaded=docsFor(c.id);
  const live=(c.deps||[]).map(d=>'<span class="depchip '+(d[1]==='ok'?'ok':'miss')+'">'+d[0]+(d[1]==='ok'?' &#10003;':' · not connected')+'</span>').join(' ');
  return `<div class="card">
    <div class="ct">Knowledge</div>
    ${uploaded.length?uploaded.map(d=>docRowHtml(d)).join(''):'<div class="cs">Nothing uploaded yet - this section runs on the pack and general knowledge.</div>'}
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:11.5px;color:var(--fg3);margin-top:10px;">Also reads live sources: ${live} <button class="connectlink" onclick="goConnections()">Open Connections</button></div>
    <div id="soparse_${c.id}" style="margin-top:10px;"></div>
    ${emaAsksFor(c)}
    <div style="margin-top:12px;"><button class="btn sm primary" onclick="kReopen(${i})"><i class="ph-fill ph-sparkle"></i> Have more rules to add? Let Ema know</button></div>
  </div>`;
}
function kReopen(i){CATS[i].kstate='ask'; refreshCat();}
function kUpload(i){
  const c=CATS[i]; c.kstate='ask'; c.ksel=c.ksel||{}; c.ksel.docs=true;
  refreshCat();
  const m=document.querySelector('.wizmain')||document.getElementById('ownerbody');
  if(m&&m.scrollTo) m.scrollTo({top:0, behavior:'smooth'});
  toast('Upload is open at the top');
}
function kDone(i){CATS[i].kstate='done'; CATS[i].qshow=true; refreshCat();}
function kTog(i,k){const c=CATS[i]; c.ksel=c.ksel||{}; c.ksel[k]=!c.ksel[k]; refreshCat();}
function kExt(i,name){const c=CATS[i]; c.kext=c.kext||[]; if(!c.kext.includes(name)) c.kext.push(name); refreshCat();}
function kAsk(i){
  const c=CATS[i]; c.ksel=c.ksel||{}; c.kext=c.kext||[];
  const pill=(k,label,icon)=>'<div class="apchip'+(c.ksel[k]?' on':'')+'" onclick="kTog('+i+',&#39;'+k+'&#39;)">'+(c.ksel[k]?'<i class="ph-bold ph-check"></i>':'<i class="ph ph-'+icon+'"></i>')+label+'</div>';
  let follow='';
  if(c.ksel.docs){
    follow+=kEma('Upload them. I&rsquo;ll split facts from procedures and cite every rule back to its page.')
      +`<div style="border:2px dashed var(--beige-500);border-radius:14px;padding:26px 20px;text-align:center;background:var(--beige-50);cursor:pointer;margin:4px 0 10px;" onclick="parseSOP(${i})">
        <i class="ph ph-upload-simple" style="font-size:24px;color:var(--green-800)"></i>
        <div style="font-size:13.5px;font-weight:700;margin-top:7px;">Upload documents</div>
        <div style="font-size:11.5px;color:var(--fg3);margin-top:2px;">SOPs, plan documents, FAQs</div>
      </div><div id="soparse_${c.id}"></div>`;
  }
  if(c.ksel.ext){
    const sysPill=(n)=>'<div class="apchip'+(c.kext.includes(n)?' on':'')+'" onclick="kExt('+i+',&#39;'+n+'&#39;)">'+(c.kext.includes(n)?'<i class="ph-bold ph-check"></i>':'')+n+'</div>';
    follow+=kEma('Which systems?')
      +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">'+sysPill('Salesforce')+sysPill('Guidewire')+sysPill('Payment provider')+'<div class="apchip" onclick="toast(&#39;Type it below and Ema will work out how to read it&#39;)">Something else</div></div>';
    if(c.kext.length) follow+=kEma(c.kext.join(', ')+' noted. Connect '+(c.kext.length>1?'them':'it')+' once in Connections and I&rsquo;ll read from there - every section shares the same connection.')
      +'<div style="margin-bottom:10px;"><button class="btn sm" onclick="goConnections()">Open Connections <i class="ph ph-arrow-right"></i></button></div>';
  }
  if(c.ksel.other){
    follow+=kEma('Tell me where - type it below and I&rsquo;ll work out how to read it.');
  }
  follow+=emaAsksFor(c);
  const log=(c.tlog||[]).map(m=>m.role==='user'
    ? '<div class="apbub"><div>'+m.t+'</div></div>'
    : kEma(m.t)).join('') + (c.kthink?kThink():'');
  return `<div class="card" style="border-color:var(--purple-300);">
    <div class="ct"><i class="ph-fill ph-sparkle" style="color:var(--purple-800)"></i> Knowledge</div>
    ${kEma('Where do the rules on '+c.name.toLowerCase().replace('&amp;','and')+' live?')}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px;">${pill('docs','Documents','file-text')}${pill('ext','External systems','plugs-connected')}${pill('other','Somewhere else','chats-circle')}</div>
    ${follow}
    ${log}
    <div class="apcomposer" style="margin-top:8px;">
      <input type="text" id="tell_${c.id}" placeholder="Or just tell Ema&hellip;" onkeydown="if(event.key==='Enter')tellEma(${i})">
      <button class="apsend" onclick="tellEma(${i})"><i class="ph ph-arrow-up"></i></button>
    </div>
    <div style="text-align:center;margin-top:10px;"><button class="skiplink" onclick="kDone(${i})">Done for now</button></div>
  </div>`;
}
const CFGS=[['policy','Answer from customer policy'],['sop','Answer from SOP'],['ticket','File a ticket'],['other','Do something else']];
function ruleAux(i,qi,ri,r){
  if(r.cfg==='sop') return r.cite
    ? '<span class="depchip ok"><i class="ph-bold ph-quotes"></i>Cites '+r.cite+'</span>'
    : '<button class="apchip" onclick="kUpload('+i+')"><i class="ph ph-upload-simple"></i>Upload your SOP to make it yours</button>';
  if(r.cfg==='ticket'){
    return CONN.sf==='connected'
      ? '<span class="depchip ok"><i class="ph-bold ph-check"></i>Files a case in Salesforce</span>'
      : '<span class="depchip miss"><i class="ph-bold ph-warning"></i>Salesforce not connected yet</span> <button class="btn sm primary" style="height:24px;font-size:11px;" onclick="goConnections()">Connect Salesforce <i class="ph ph-arrow-right"></i></button>';
  }
  if(r.cfg==='policy'){
    return CONN.gw==='connected'
      ? '<span class="depchip ok"><i class="ph-bold ph-check"></i>Reads live policy records</span>'
      : '<span class="depchip"><i class="ph-bold ph-database"></i>Reads policy records · sandbox data</span> <button class="btn sm" style="height:24px;font-size:11px;" onclick="goConnections()">Connect live source <i class="ph ph-arrow-right"></i></button>';
  }
  if(r.cfg==='other'){
    if(r.otherEdit) return '<div style="width:100%;margin-top:6px;"><textarea rows="2" id="oth_'+i+'_'+qi+'_'+ri+'" placeholder="Describe what the agent should do">'+(r.other||'')+'</textarea><div style="margin-top:6px;"><button class="btn sm primary" onclick="saveOther('+i+','+qi+','+ri+')">Save</button></div></div>';
    return '<span class="depchip">'+esc(r.other||'Describe what to do')+'</span> <button class="connectlink" onclick="CATS['+i+'].qtypes['+qi+'].rules['+ri+'].otherEdit=true;refreshCat()">Edit</button>';
  }
  return '';
}
function inferCfg(text,prev){
  const t=text.toLowerCase();
  if(/ticket|file(s|d)? (it|to)|route|hand(s)? (off|to)|escalat/.test(t)) return 'ticket';
  if(/policy record|balance|their (own )?(policy|coverage|plan)|customer&rsquo;s own|customer's own|read(s)? back/.test(t)) return 'policy';
  if(/sop|procedure|document/.test(t)) return 'sop';
  return prev||'sop';
}
function cfgLabel(r){
  if(r.cfg==='ticket') return ['ticket','Files a ticket'];
  if(r.cfg==='policy') return ['identification-card','Reads the customer&rsquo;s policy'];
  if(r.cfg==='other') return ['sparkle', esc(r.other||'Custom behaviour')];
  return ['quotes', r.cite?('Answers from your SOP'):'Answers from general knowledge, labelled general'];
}
function qRuleRow(i,ri,r){
  const badges=[];
  if(r.src && r.src!=='Ema pack') badges.push('<span class="rbadge sop">'+r.src.replace('Ema pack · ','')+'</span>');
  if(r.sopAdded) badges.push('<span class="rbadge sop">From your SOP</span>');
  if(r.user) badges.push('<span class="rbadge you">Yours</span>');
  const [ic,lbl]=cfgLabel(r);
  const inferred='<span class="depchip" style="background:var(--purple-100);border-color:var(--purple-300);color:var(--purple-800);"><i class="ph-bold ph-'+ic+'"></i>'+lbl+'</span>';
  const flash=r.flash?'<div class="fadeup" style="font-size:11px;color:var(--purple-800);margin-top:5px;"><i class="ph-fill ph-sparkle"></i> Ema understood: '+r.flash+'</div>':'';
  return '<div style="border:1px solid var(--beige-200);border-radius:10px;padding:11px 13px;margin-bottom:8px;background:#fff;" id="qr_'+i+'_'+ri+'">'
    +'<div style="display:flex;gap:8px;align-items:flex-start;">'
    +'<div style="flex:1;font-size:12.5px;font-weight:600;line-height:1.5;">'+r.t+' '+badges.join(' ')+'</div>'
    +'<span class="iconbtn" title="Edit" onclick="editQRule('+i+','+ri+')"><i class="ph ph-pencil-simple"></i></span>'
    +'<span class="iconbtn" title="Remove" onclick="removeQRule('+i+','+ri+')"><i class="ph ph-x"></i></span></div>'
    +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11.5px;margin-top:7px;">'+inferred+ruleAux(i,0,ri,r)+'</div>'
    +flash+'</div>';
}
function editQRule(i,ri){
  const r=CATS[i].rules[ri];
  const box=document.getElementById('qr_'+i+'_'+ri);
  box.innerHTML='<textarea rows="2" id="qredit" style="font-size:12.5px;">'+r.t.replace(/&rsquo;/g,String.fromCharCode(8217)).replace(/&ldquo;|&rdquo;/g,String.fromCharCode(34))+'</textarea>'
    +'<div style="margin-top:7px;display:flex;gap:6px;align-items:center;"><button class="btn sm primary" onclick="saveQRule('+i+','+ri+')">Save</button><button class="btn sm" onclick="refreshCat()">Cancel</button>'
    +'<span style="font-size:11px;color:var(--fg3);">Write it in your words. Ema reads the sentence and sets the behaviour.</span></div>';
  box.querySelector('textarea').focus();
}
function saveQRule(i,ri){
  const r=CATS[i].rules[ri];
  const v=(document.getElementById('qredit').value.trim())||r.t;
  r.t=esc(v);
  const was=r.cfg;
  r.cfg=inferCfg(v,r.cfg);
  if(r.cfg!=='sop') r.cite=r.cite||null;
  const [ic,lbl]=cfgLabel(r);
  r.flash=lbl+(was!==r.cfg?' (changed)':'');
  markDirty(); refreshCat();
  setTimeout(()=>{delete r.flash;},2600);
}
function removeQRule(i,ri){
  if(!confirm('Remove this rule? Removals are logged.')) return;
  CATS[i].rules.splice(ri,1);
  markDirty(); refreshCat(); toast('Rule removed');
}
/* ---- Tell Ema: conversational section config ---- */
function tellEmaCard(i){
  const c=CATS[i];
  const log=(c.tlog||[]).map(m=>m.role==='user'
    ? '<div style="display:flex;justify-content:flex-end;margin:6px 0;"><div style="max-width:85%;background:var(--green-100);border-radius:14px;padding:8px 13px;font-size:12.5px;">'+m.t+'</div></div>'
    : '<div style="font-size:12.5px;line-height:1.55;margin:6px 0;color:var(--fg1);"><i class="ph-fill ph-sparkle" style="color:var(--purple-800);font-size:12px;"></i> '+m.t+'</div>').join('');
  return `<div class="card" style="border-color:var(--purple-300);">
    <div class="ct"><i class="ph-fill ph-sparkle" style="color:var(--purple-800)"></i> Tell Ema</div>
    <div class="cs">Say what this section should do. Ema turns it into rules and routing.</div>
    ${log?'<div style="margin-bottom:8px;">'+log+'</div>':''}
    <div style="display:flex;gap:8px;align-items:center;border:1px solid var(--beige-400);border-radius:12px;padding:5px 5px 5px 13px;background:#fff;">
      <input type="text" id="tell_${c.id}" placeholder="e.g. Never promise refund timelines; route disputes to billing" style="border:none;box-shadow:none;padding:5px 0;flex:1;" onkeydown="if(event.key==='Enter')tellEma(${i})">
      <button class="btn primary sm" onclick="tellEma(${i})"><i class="ph ph-arrow-up"></i></button>
    </div>
  </div>`;
}
function tellEma(i){
  const c=CATS[i];
  const inp=document.getElementById('tell_'+c.id);
  const v=(inp&&inp.value.trim()); if(!v) return;
  c.tlog=c.tlog||[];
  c.tlog.push({role:'user', t:esc(v)});
  const parts=v.split(/;|(?:\.\s+)/).map(x=>x.trim()).filter(Boolean);
  const added=[];
  parts.forEach(pt=>{
    const cfg=inferCfg(pt,null);
    c.rules.push({t:esc(pt.charAt(0).toUpperCase()+pt.slice(1)), cfg:cfg, cite:null, user:true});
    const [ic,lbl]=cfgLabel({cfg:cfg});
    added.push(lbl.toLowerCase());
  });
  c.kthink=true; refreshCat();
  setTimeout(()=>{
    c.kthink=false;
    c.tlog.push({role:'ema', t:'Got it. '+added.length+' rule'+(added.length>1?'s':'')+' added to '+c.name+' ('+added.join(', ')+'). Applied to your config - edit any of them below.'});
    if(c.tlog.length>4) c.tlog=c.tlog.slice(-4);
    const su=SUITES.find(x=>x.cat===c.id); if(su) su.n+=added.length*2;
    markDirty(); refreshCat();
  },700);
}
function flatRulesCard(i){
  const c=CATS[i];
  const s=covStat(c);
  const sumCls = s.total===0 ? '' : (s.covered===s.total ? 'background:var(--green-200);color:var(--green-800)' : 'background:var(--orange-200);color:var(--orange-930)');
  const summary = s.total===0 ? '' : `<div class="sumchips" style="margin-bottom:10px;"><span class="sumchip" style="${sumCls}">${s.covered} of ${s.total} rules covered by your documents</span></div>`;
  return `<div class="card">
    <div class="ct">Rules</div>
    <div class="cs">Three sources: Ema&rsquo;s regulation pack, your SOPs with page citations, and anything you write.</div>
    ${summary}
    ${c.rules.map((r,ri)=>qRuleRow(i,ri,r)).join('')}
    <div style="font-size:11.5px;color:var(--fg3);margin-top:2px;">Want another rule? Tell Ema above, in your own words.</div>
  </div>`;
}
function addFlatRule(i){
  openModal(`
    <div class="mt">Add a rule</div>
    <div class="ms">Write it in your words. Ema reads the sentence and sets the behaviour. Written rules are marked as not supported by an SOP until an upload covers them.</div>
    <textarea rows="2" id="nfrule" placeholder="e.g. Never quote a settlement amount."></textarea>
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="confirmFlatRule(${i})">Add rule</button></div>`);
}
function confirmFlatRule(i){
  const v=(document.getElementById('nfrule').value.trim())||'Never quote a settlement amount';
  CATS[i].rules.push({t:esc(v), cfg:inferCfg(v,null), cite:null, user:true});
  closeModal(); bumpSuite(CATS[i].id,2); markDirty(); refreshCat();
}
function suiteCard(i){
  const c=CATS[i];
  const su=SUITES.find(x=>x.cat===c.id);
  if(!su) return '';
  const behs=su.beh.map(b=>'<span class="badge '+b[1]+'" style="height:18px;font-size:10px;">'+b[0]+'</span>').join(' ');
  let rail;
  if(!enterprise){
    rail='<span class="lockchip"><i class="ph-fill ph-lock-simple"></i> Enterprise</span> <button class="btn sm" onclick="setView(&#39;upgrade&#39;)">See what unlocks</button>';
  } else if(c.suiteRun){
    rail='<span class="passrate" style="font-size:20px;">100%</span> <span class="badge success" style="height:18px;font-size:10px;">'+su.n+'/'+su.n+'</span> <button class="btn sm" onclick="runSectionSuite('+i+')">Run again</button>';
  } else {
    rail='<button class="btn sm primary" onclick="runSectionSuite('+i+')"><i class="ph ph-play"></i> Run suite</button>';
  }
  return `<div class="card">
    <div class="ct" style="justify-content:space-between;"><span style="display:flex;gap:7px;align-items:center;"><i class="ph ph-flask" style="color:var(--green-800)"></i> Test suite</span></div>
    <div class="cs">${su.n} scenarios, generated from this section&rsquo;s rules. The count moves when the rules change.</div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">${behs}<span style="flex:1"></span>${rail}</div>
    <div id="srun_${c.id}"></div>
  </div>`;
}
function runSectionSuite(i){
  const c=CATS[i];
  const su=SUITES.find(x=>x.cat===c.id);
  const box=document.getElementById('srun_'+c.id);
  box.innerHTML='<div style="margin-top:12px;height:5px;background:var(--beige-200);border-radius:99px;overflow:hidden;"><div id="srb_'+c.id+'" style="height:100%;width:4%;background:var(--green-700);transition:width .5s ease;border-radius:99px;"></div></div><div id="srn_'+c.id+'" style="font-size:11.5px;color:var(--fg3);margin-top:7px;">Running '+su.n+' scenarios against the sandbox&hellip;</div>';
  [30,62,100].forEach((wd,ix)=>setTimeout(()=>{const b=document.getElementById('srb_'+c.id); if(b)b.style.width=wd+'%';},600*(ix+1)));
  setTimeout(()=>{ c.suiteRun=true; refreshCat(); toast('All '+su.n+' scenarios passed'); },2300);
}
function setRuleCfg(i,qi,ri,cfg){
  const r=CATS[i].qtypes[qi].rules[ri];
  r.cfg=cfg; markDirty();
  if(cfg==='other'&&!r.other) r.otherEdit=true;
  refreshCat();
  if(cfg==='ticket') toast('Tickets file via Salesforce · set up in Connections');
  if(cfg==='policy') toast('Uses the policy records connection');
}
function saveOther(i,qi,ri){
  const el=document.getElementById('oth_'+i+'_'+qi+'_'+ri);
  const r=CATS[i].qtypes[qi].rules[ri];
  r.other=(el&&el.value.trim())||r.other||''; r.otherEdit=false;
  markDirty(); refreshCat();
}
function addQt(i){
  openModal(`
    <div class="mt">Add a query type</div>
    <input type="text" id="newqt" placeholder="e.g. Roadside assistance">
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="confirmAddQt(${i})">Add</button></div>`);
}
function confirmAddQt(i){
  const v=(document.getElementById('newqt').value.trim())||'New query type';
  CATS[i].qtypes.push({name:esc(v), icon:'sparkle', rules:[{t:'Answer from your documents, labelled general until an SOP covers it', cfg:'sop', cite:null, user:true}]});
  CATS[i].qsel=CATS[i].qtypes.length-1;
  closeModal(); markDirty(); refreshCat();
}
function removeQt(i,qi){
  if(!confirm('Remove this query type and its rules?')) return;
  CATS[i].qtypes.splice(qi,1); CATS[i].qsel=0; markDirty(); refreshCat();
}
function addQRule(i,qi){
  openModal(`
    <div class="mt">Add a rule</div>
    <div class="ms">Written rules are marked as not supported by an SOP until an upload covers them.</div>
    <textarea rows="2" id="nqrule" placeholder="e.g. Never quote a settlement amount."></textarea>
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="confirmAddQRule(${i},${qi})">Add rule</button></div>`);
}
function confirmAddQRule(i,qi){
  const v=(document.getElementById('nqrule').value.trim())||'Never quote a settlement amount';
  CATS[i].qtypes[qi].rules.push({t:esc(v), cfg:'sop', cite:null, user:true});
  CATS[i].qsel=qi;
  closeModal(); markDirty(); refreshCat(); toast('Rule added');
}

/* ---- category detail ---- */
function openCat(i){curCat=i; renderStep(); document.querySelector('.wizmain').scrollTo({top:0});}
function abilityRows(list,kind,ci){
  if(!list.length) return '<div style="font-size:12px;color:var(--fg3);padding:6px 0;">'+(kind==='answers'?'All of this category&rsquo;s abilities take an action.':'This category only answers questions.')+'</div>';
  return list.map((s,si)=>'<div class="abrow"><span class="sw'+(s[1]?' on':'')+'" onclick="togAb('+ci+',\''+kind+'\','+si+',this)"></span>'+s[0]+'</div>').join('');
}
function flatRules(c){return c.rules||[];}
function covStat(c){
  const sop=flatRules(c).filter(r=>r.cfg==='sop');
  return {covered:sop.filter(r=>r.cite).length, total:sop.length};
}
function rulesCard(i,forOwner){
  const c=CATS[i];
  const s=covStat(c);
  const sumCls = s.total===0 ? '' : (s.covered===s.total ? 'background:var(--green-200);color:var(--green-800)' : 'background:var(--orange-200);color:var(--orange-930)');
  const summary = s.total===0 ? '' : `<div class="sumchips" style="margin-bottom:10px;"><span class="sumchip" style="${sumCls}">${s.covered} of ${s.total} rules covered by your SOPs</span></div>`;
  const note = (s.covered<s.total) ? '<div style="font-size:11.5px;color:var(--fg3);margin:2px 0 10px;">Uncovered rules run on pack defaults. Upload an SOP and Ema checks every rule against it.</div>' : '';
  return `<div class="card">
    <div class="ct">Rules &amp; coverage</div>
    ${summary}${note}
    <div id="catrules">${c.rules.length?c.rules.map(r=>ruleHtml(r)).join(''):'<div style="font-size:12px;color:var(--fg3);padding:2px 0 8px;">No category rules yet.</div>'}</div>
    <div id="soparse_${c.id}"></div>
    <div style="display:flex;gap:8px;">
      <button class="addbtn" onclick="addCatRule(${i})">+ Add a rule</button>
      <button class="addbtn" onclick="parseSOP(${i})">+ Upload an SOP</button>
    </div>
    ${universalPanel(!!forOwner)}
  </div>`;
}
const SOPSIM={
 bil:{file:'billing_and_disputes_SOP_v3.docx', cites:[[2,'p.9']],
   newRules:[{t:'Refunds above $500 go to a supervisor', cfg:'ticket', sopAdded:true, cite:'billing_and_disputes_SOP_v3.docx · p.7'}],
   facts:[{t:'Payments post to the account within one business day', p:'p.2'},{t:'Refunds return to the original payment method', p:'p.7'}],
   conflict:{kind:'conflict', title:'Your SOP vs your website', body:'Your SOP (p.9) says no payments on accounts in collections. Your website FAQ says any account can pay online.',
    a:['Follow the SOP','Following the SOP. Collections accounts route to your billing team; the website FAQ is flagged for updating.'], b:['Follow the website','Following the website. Any account gets the payment link.']}},
 clm:{file:'claims_handling_SOP.docx', cites:[[1,'p.4']],
   facts:[{t:'Repair timelines are estimates, revised as parts arrive', p:'p.3'},{t:'Replacement-vehicle dropoffs can be rescheduled twice with 24 hours&rsquo; notice', p:'p.8'}],
   newRules:[{t:'Total-loss questions go to the adjuster, never estimated', cfg:'ticket', sopAdded:true, cite:'claims_handling_SOP.docx · p.9'}]},
 cov:{file:'northlake_auto_policy_TC_2026.pdf', facts:[{t:'Rental reimbursement covers up to $40 a day for 30 days when elected', p:'p.11'},{t:'Comprehensive covers theft, hail, fire and animal strikes', p:'p.8'}], cites:[[1,'p.8'],[2,'p.3'],[3,'p.5']], newRules:[]},
 pol:{file:'producer_manual_2026.pdf', cites:[[1,'p.11']],
   facts:[{t:'A newly added vehicle has a 14-day grace period pending underwriting', p:'p.11'}],
   newRules:[{t:'Log every producer hand-off with a case number', cfg:'ticket', sopAdded:true, cite:'producer_manual_2026.pdf · p.16'}]}
};
function parseSOP(i){
  const c=CATS[i];
  const sim=SOPSIM[c.id];
  if(!sim || DOCS.some(d=>d.file===sim.file)){ toast('All demo SOPs for this section are uploaded'); return; }
  const box=document.getElementById('soparse_'+c.id);
  const nRules=flatRules(c).length;
  box.innerHTML=`<div class="loaderbox" style="margin-bottom:10px;text-align:left;padding:16px 18px;"><div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;"><div class="spin" style="margin:0;width:16px;height:16px;"></div><b style="font-size:12.5px;">Parsing ${sim.file}&hellip;</b></div>
    <div class="lline" id="sp1">Reading the document&hellip;</div>
    <div class="lline" id="sp2">Extracting rules&hellip;</div>
    <div class="lline" id="sp3">Splitting facts from procedures&hellip; facts indexed for answers</div>
    <div class="lline" id="sp4">Checking your ${nRules} rules against it&hellip;</div></div>`;
  setTimeout(()=>{const e=document.getElementById('sp1'); if(e)e.classList.add('show');},250);
  setTimeout(()=>{const e=document.getElementById('sp2'); if(e)e.classList.add('show');},1000);
  setTimeout(()=>{const e=document.getElementById('sp3'); if(e)e.classList.add('show');},1500);
  setTimeout(()=>{const e=document.getElementById('sp4'); if(e)e.classList.add('show');},2000);
  setTimeout(()=>{
    sim.cites.forEach(x=>{ const r=c.rules[x[0]]; if(r&&r.cfg==='sop'&&!r.cite) r.cite=sim.file+' · '+x[1]; });
    sim.newRules.forEach(nr=>{ c.rules.push(JSON.parse(JSON.stringify(nr))); });
    c.kstate='done';
    if(sim.conflict && !c.issues.some(x=>x.title===sim.conflict.title)) c.issues.push(JSON.parse(JSON.stringify(sim.conflict)));
    DOCS.push({file:sim.file, icon:sim.file.includes('.pdf')?'file-pdf':'file-doc', ver:'v1', date:'today', pill:'Internal', pillCls:'grey',
      cites:[[c.id, sim.cites.length+sim.newRules.length]], uploaded:true, tag:c.id});
    const su=SUITES.find(x=>x.cat===c.id); if(su) su.n+=Math.max(2,sim.newRules.length*2);
    c.qshow=true;
    markDirty(); refreshCat();
    const s=covStat(c);
    toast('Parsed · '+sim.newRules.length+' rule'+(sim.newRules.length!==1?'s':'')+' extracted');
  },2400);
}
function docsCard(i){
  const c=CATS[i];
  const list=docsFor(c.id);
  const rows=list.length ? list.map(d=>docRowHtml(d)).join('') : '<div class="cs" style="margin-bottom:8px;">No documents yet. Upload this category&rsquo;s SOP.</div>';
  return `<div class="card">
    <div class="ct">Documents</div>
    ${rows}
    <button class="addbtn" onclick="uploadDoc('${c.id}')">+ Upload</button>
  </div>`;
}
function whatItDoesCard(i){
  const c=CATS[i];
  return `<div class="card">
    <div class="ct">What it does</div>
    ${tierControl(i)}
    <div class="seclabel">Answers</div>
    <div class="cs">Switch off anything it should not answer.</div>
    ${abilityRows(c.answers,'answers',i)}
    <div class="seclabel" style="margin-top:14px;">Actions</div>
    <div class="cs">Identity is verified first.</div>
    ${abilityRows(c.resolves,'resolves',i)}
  </div>`;
}
function routingRow(i){
  const c=CATS[i];
  const chips=c.deps.map(d=>'<span class="depchip '+d[1]+'" style="font-size:11.5px;padding:5px 11px;"><i class="ph-bold '+(d[1]==='ok'?'ph-check':'ph-warning')+'"></i>'+d[0]+(d[1]==='ok'?'':' · not connected')+'</span>').join('');
  return `<div class="card">
    <div class="ct" style="cursor:pointer;justify-content:space-between;" onclick="toggleUni('routing_${c.id}')"><span style="display:flex;gap:7px;align-items:center;"><i class="ph ph-arrow-bend-up-right"></i> Routing</span><span style="font-size:11px;color:var(--fg3);font-weight:400;">${c.dest}</span></div>
    <div id="routing_${c.id}" style="display:none;">
      <div class="item"><span class="ii"><i class="ph ph-arrow-bend-up-right"></i></span><div style="flex:1"><div class="it dest" id="dest_${c.id}">${c.dest}</div><div class="is">Hand-offs include the transcript and collected details.</div></div><span class="rightctl"><span class="iconbtn" onclick="editDest('dest_${c.id}',${i})"><i class="ph ph-pencil-simple"></i></span></span></div>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px;">${chips}</div>
    </div>
  </div>`;
}
function inviteOwnerModal(i){
  openModal(`
    <div class="mt">Invite an owner · ${CATS[i].name}</div>
    <div class="ms">They see and sign this category only.</div>
    <input type="text" id="ownmail_modal" placeholder="name@northlakeauto.com">
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="inviteOwner(${i})">Invite</button></div>`);
}
function catDetailHtml(i){
  const c=CATS[i];
  const gate = (!c.cfg && persona!=='owner')
    ? `<div style="margin:4px 0 20px;"><button class="btn lg primary" onclick="CATS[${i}].cfg=true;refreshCat()"><i class="ph ph-sliders"></i> Configure this section</button>
       <div style="font-size:11.5px;color:var(--fg3);margin-top:8px;">Pack defaults run until you or an invited expert configures it.</div></div>`
    : sopSection(i)+issuesBlock(i)+((c.qshow||persona==='owner')?(flatRulesCard(i)+suiteCard(i)):'');
  return `
  <div class="steph fadeup">
    <div style="font-size:12px;color:var(--fg3);margin-bottom:8px;cursor:pointer;" onclick="curCat=null;renderStep()"><i class="ph ph-arrow-left"></i> All sections</div>
    <h1 style="display:flex;align-items:center;gap:12px;"><span class="ctile" style="width:40px;height:40px;font-size:19px;"><i class="ph ph-${c.icon}"></i></span>${c.name}</h1>
    <p>${c.desc}</p>
  </div>
  <div class="fadeup">
  ${inviteCard(i)}
  ${gate}
  <div style="margin:4px 0 24px;"><button class="btn sm ghost" style="color:var(--red-900)" onclick="removeCat(${i})"><i class="ph ph-trash"></i> Remove this section</button></div>
  </div>`;
}
function renderOwner(){
  const i=2, c=CATS[i];
  const sig=document.getElementById('ownersig');
  const cs=covStat(c);
  if(sig) sig.innerHTML = (cs.total&&cs.covered===cs.total)
    ? '<span class="badge success"><i class="ph-bold ph-check"></i> All '+cs.total+' SOP rules covered</span>'
    : '<span class="badge pending">'+cs.covered+' of '+cs.total+' SOP rules covered</span>';
  document.getElementById('ownerbody').innerHTML =
    sopSection(i)+issuesBlock(i)+flatRulesCard(i)+suiteCard(i);
}
function needsRule(i,xi){
  openModal(`
    <div class="mt">Add a rule from this answer</div>
    <div class="ms">Write what should hold - Ema enforces it, updates this category&rsquo;s test suite, and reruns the answer. You approve the revised answer when you have read it.</div>
    <textarea rows="2" id="vruletext" placeholder="e.g. Always say the refund amount is an estimate until billing confirms it."></textarea>
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="confirmVerdictRule(${i},${xi})">Add rule &amp; rerun</button></div>`);
}
function confirmVerdictRule(i,xi){
  const v=(document.getElementById('vruletext').value.trim())||'Always say the refund amount is an estimate until billing confirms it';
  CATS[i].rules.push({t:esc(v), small:'Added from testing - enforced at runtime, covered by this category&rsquo;s suite.', badge:'you', badget:'Your rule'});
  if(evalFixPending){evalFixPending=false; evalRuleAdded=true;}
  closeModal(); bumpSuite(CATS[i].id,2); markDirty(); refreshCat();
}
function issuesBlock(i){
  const c=CATS[i];
  if(!c.issues||!c.issues.length) return '';
  const cards=c.issues.map((x,xi)=>{
    if(x.done) return '<div class="cov ok"><div class="cvt"><i class="ph-bold ph-check" style="color:var(--green-800)"></i> Resolved - '+x.title+'</div><div class="cvs">'+x.done+'</div></div>';
    if(x.kind==='conflict'){
      return '<div class="cov err"><div class="cvt"><i class="ph-fill ph-warning" style="color:var(--red-800)"></i> '+x.title+'</div><div class="cvs">'+x.body+'<br>'
        +'<button class="btn sm primary" style="margin-top:7px" onclick="resolveIssue('+i+','+xi+',0)">'+x.a[0]+'</button> '
        +'<button class="btn sm" style="margin-top:7px" onclick="resolveIssue('+i+','+xi+',1)">'+x.b[0]+'</button></div></div>';
    }
    const act = x.dispute
      ? '<button class="btn sm" style="margin-top:6px" onclick="openDispute('+i+','+xi+')">Add dispute process</button>'
      : '<button class="btn sm" style="margin-top:6px" onclick="fixIssue('+i+','+xi+')">'+x.fix[0]+'</button>';
    return '<div class="cov warn"><div class="cvt">'+x.title+'</div><div class="cvs">'+x.body+' '+act+'</div></div>';
  }).join('');
  const nOpen=c.issues.filter(x=>!x.done).length;
  return '<div class="card"><div class="ct">Open items ('+nOpen+')</div>'+cards+'</div>';
}
function resolveIssue(ci,xi,choice){
  const x=CATS[ci].issues[xi];
  x.done = choice===0 ? x.a[1] : x.b[1];
  markDirty(); refreshCat(); toast('Resolved');
}
function fixIssue(ci,xi,msg){
  const x=CATS[ci].issues[xi];
  x.done = msg || x.fix[1];
  markDirty(); refreshCat(); toast('Done');
}
function togAb(ci,kind,si,el){el.classList.toggle('on'); CATS[ci][kind][si][1]^=1; markDirty();}
function inviteOwner(i){
  const inp=document.getElementById('ownmail_modal');
  const v=(inp&&inp.value.trim())||'';
  if(!v){toast('Enter an email address'); return;}
  CATS[i].owner={email:v,status:'Invite sent'};
  closeModal(); markDirty(); refreshCat(); toast('Invite sent');
}
function addCatRule(i){
  openModal(`
    <div class="mt">Add a rule to ${CATS[i].name}</div>
    <div class="ms">Write it in your own words - Ema turns it into an enforced rule and updates this category&rsquo;s test suite.</div>
    <textarea rows="2" id="catruletext" placeholder="e.g. Never promise a specific date for when a repair will be finished."></textarea>
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="confirmCatRule(${i})">Add rule</button></div>`);
}
function confirmCatRule(i){
  const v=(document.getElementById('catruletext').value.trim())||'Never promise a specific date for when a repair will be finished';
  CATS[i].rules.push({t:esc(v), small:'Your rule - enforced at runtime and covered by this category&rsquo;s test suite.', badge:'you', badget:'Your rule'});
  closeModal(); bumpSuite(CATS[i].id,2); markDirty(); refreshCat();
}
function editDest(id,ci){
  const el=document.getElementById(id);
  if(el.dataset.editing) return;
  el.dataset.editing='1';
  const orig=el.textContent;
  el.innerHTML='<input type="text" value="'+orig+'" style="font-size:12px;padding:6px 9px;"><div style="margin-top:5px;display:flex;gap:6px;"><button class="btn sm primary">Save</button><button class="btn sm">Cancel</button></div>';
  const [save,cancel]=el.querySelectorAll('button');
  save.onclick=()=>{const v=el.querySelector('input').value; el.textContent=v; if(ci!==undefined)CATS[ci].dest=v; delete el.dataset.editing; markDirty(); toast('Destination updated');};
  cancel.onclick=()=>{el.textContent=orig; delete el.dataset.editing;};
}
function openAddCat(){
  openModal(`
    <div class="mt">Add a category <i class="ph-fill ph-info" style="color:var(--green-800);font-size:15px;" title="A category owns what it answers, what it resolves, its rules, its documents and where it escalates."></i></div>
    <div class="ms">Name it and describe it in a sentence. Ema drafts its abilities and rules from the pack and your documents - you review everything next.</div>
    <div class="mlabel">Category name <span class="req">*</span></div>
    <input type="text" id="newcatname" placeholder="e.g. Roadside assistance">
    <div class="mlabel">What belongs in it?</div>
    <textarea rows="2" id="newcatdesc" placeholder="e.g. Tow requests, battery jumps, and questions about what roadside cover includes."></textarea>
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="confirmAddCat()"><i class="ph ph-check"></i> Create category</button></div>`);
}
function confirmAddCat(){
  const name=(document.getElementById('newcatname').value.trim())||'Roadside assistance';
  const desc=(document.getElementById('newcatdesc').value.trim())||'Tow requests, battery jumps, and what roadside cover includes';
  const catId='c'+Date.now();
  CATS.push({id:catId, icon:'car', name:esc(name), desc:esc(desc), tier:'a', tiert:'Verify first',
    answers:[['Explain what this covers, from your documents',1]], resolves:[['Capture the request and file it to your team',1]],
    rules:[], docs:[], dest:'support@northlakeauto.com', deps:[['Pre-built insurance knowledge','ok']], owner:null});
  SUITES.splice(SUITES.length-1,0,{id:catId,name:esc(name),cat:catId,n:12,beh:[['Accuracy','success']],desc:'drafted from the pack for this category'});
  closeModal(); markDirty(); refreshCat(); toast('Category created · test suite drafted');
}

/* =============== knowledge step =============== */
const KNOW={
 'Help centre - 42 articles':'How to read your declarations page\n\nYour declarations page is the one-page summary at the front of your policy. It lists each coverage you carry, its limit, your deductible, the vehicles and drivers on the policy, and your policy period.\n\nIf a coverage is not listed, it is not part of your policy.',
 'Claim-filing page and document checklist':'Filing a claim with Northlake\n\n1. Make sure everyone is safe. If anyone is hurt, call 911 first.\n2. Have your policy number ready.\n3. Tell us when and where it happened, what happened, and who was involved.\n4. Photos help - the vehicles, the scene, and any documents.\n\nYou can start a claim with partial information and add the rest later.',
 'Guest pay-my-bill page link':'pay.northlakeauto.com\n\nCustomers can pay without logging in, using their policy number and ZIP code. Payments post to the account within one business day.',
 'Hours, phone numbers, contact routes':'Customer service: Mon-Fri 8am-8pm CT, Sat 9am-2pm CT\nPhone: 1-800-555-0147\nLicensed agents: 1-800-555-0198\nClaims (24/7): 1-800-555-0112',
 'Coverage terms - deductibles, limits, comprehensive vs collision':'What is a deductible?\n\nA deductible is the part of a covered loss you pay yourself before insurance pays the rest. If your repair costs $2,000 and your deductible is $500, you pay $500 and insurance pays $1,500.\n\nComprehensive vs collision: collision covers damage from hitting another vehicle or object. Comprehensive covers most other physical damage - theft, hail, fire, animals.',
 'How a claim proceeds, step by step':'After you file a claim\n\n1. You get a claim number right away.\n2. An adjuster is assigned and reviews the details.\n3. For vehicle damage, a repair estimate is prepared.\n4. Once approved, repairs are scheduled or payment is issued.\n\nYour adjuster is your main contact throughout.',
 'Total-loss basics':'When a car is a total loss\n\nA car is declared a total loss when repair costs approach its value. The threshold varies by state. If your car is totalled, the settlement is based on its market value just before the loss.',
 'ID cards and proof of insurance':'Your insurance ID card\n\nYour ID card shows your policy number, effective dates, and the vehicles covered. Almost every state accepts an electronic ID card on your phone.',
 'Minimum liability limits per state':'Minimum liability limits\n\nEach state sets the minimum liability coverage a driver must carry. Ema keeps these current from each state insurance department and cites the state when answering.\n\n(Preview - Texas entry)\nTexas requires liability coverage meeting the state minimum. For current figures, Ema cites the Texas Department of Insurance.',
 'Claims-handling clocks (e.g. acknowledge in 15 days in California)':'Claims-handling deadlines\n\nStates set deadlines for how fast an insurer must respond to a claim. For example, California requires insurers to acknowledge a claim within 15 days and decide within 40 days of receiving proof of claim.\n\nEma uses these to answer "how long can this take?" questions, citing the state rule.',
 'Cancellation and nonrenewal notice rules':'Cancellation rules\n\nMid-term cancellation is limited in most states to reasons such as nonpayment or fraud, with advance written notice required. Nonrenewal requires longer notice. Ema answers with the rule for the customer’s state.',
 'Where to complain in each state (off by default)':'State complaint routes\n\nEvery state insurance department runs a consumer complaint portal. When enabled, Ema shares the correct portal for the customer’s state when asked how to file a complaint.'
};
const KSETS={
 kb1:['Help centre - 42 articles','Claim-filing page and document checklist','Guest pay-my-bill page link','Hours, phone numbers, contact routes'],
 kb2:['Coverage terms - deductibles, limits, comprehensive vs collision','How a claim proceeds, step by step','Total-loss basics','ID cards and proof of insurance'],
 kb3:['Minimum liability limits per state','Claims-handling clocks (e.g. acknowledge in 15 days in California)','Cancellation and nonrenewal notice rules','Where to complain in each state (off by default)']
};
function globalDocsBody(){return `
  ${DOCS.length?DOCS.map(d=>docRowHtml(d)).join(''):'<div class="cs" style="margin-bottom:8px;">Nothing global yet. The assistant runs on your website and built-in knowledge until you add workspace-wide files.</div>'}
  <button class="addbtn" onclick="uploadDoc(null)">+ Upload a global document</button>`;}
function prebuiltBody(){return `
  <div class="item" id="k1"><span class="ii"><i class="ph ph-globe"></i></span><div style="flex:1"><div class="it">Your public website</div><div class="is">Crawled at signup · re-crawled weekly</div>
    <div class="kbody" id="kb1"></div></div>
    <span class="rightctl"><button class="btn sm" onclick="toggleK('k1')">View &amp; edit</button></span></div>
  <div class="item" id="k2"><span class="ii"><i class="ph ph-books"></i></span><div style="flex:1"><div class="it">General insurance knowledge</div><div class="is">Curated from Insurance Information Institute and NAIC consumer material</div>
    <div class="kbody" id="kb2"></div></div>
    <span class="rightctl"><button class="btn sm" onclick="toggleK('k2')">View &amp; edit</button></span></div>
  <div class="item" id="k3"><span class="ii"><i class="ph ph-scales"></i></span><div style="flex:1"><div class="it">State facts &amp; consumer law - your 12 states</div><div class="is">Kept current by Ema from each state&rsquo;s insurance code and consumer guides</div>
    <div class="kbody" id="kb3"></div></div>
    <span class="rightctl"><button class="btn sm" onclick="toggleK('k3')">View &amp; edit</button></span></div>`;}
function fillKnow(){
  Object.keys(KSETS).forEach(k=>{
    const el=document.getElementById(k); if(!el) return;
    el.innerHTML='';
    KSETS[k].forEach(name=>{
      const row=document.createElement('div'); row.className='krow';
      const sw=document.createElement('span'); sw.className='sw'+(name.includes('off by default')?'':' on');
      sw.onclick=()=>{sw.classList.toggle('on');markDirty();};
      const t=document.createElement('span'); t.className='kt'; t.textContent=name;
      t.onclick=()=>openKnow(name);
      row.appendChild(sw); row.appendChild(t); el.appendChild(row);
    });
  });
}
function toggleK(id){document.getElementById(id).classList.toggle('open');}
function openKnow(name){
  const body=KNOW[name]||'Content preview.';
  openModal(`
    <div class="mt">${name}</div>
    <div class="ms">Preview - edit and save, or leave as is.</div>
    <textarea rows="10" id="knowtext" style="font-size:12.5px;">${body}</textarea>
    <div class="mfoot"><button class="btn" onclick="closeModal()">Close</button>
    <button class="btn primary" onclick="closeModal();markDirty();toast('Saved')">Save</button></div>`);
}


function openDispute(ci,xi){
  openModal(`
    <div class="mt">Add your dispute process</div>
    <div class="ms">Three questions - Ema drafts the process from your answers.</div>
    <div class="mlabel">How does a customer start a dispute?</div><input type="text" placeholder="e.g. In writing, or through their agent">
    <div class="mlabel">Who reviews it?</div><input type="text" placeholder="e.g. Billing team lead">
    <div class="mlabel">How long until a first response?</div><input type="text" placeholder="e.g. 5 business days">
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="closeModal();fixIssue(${ci},${xi},'Dispute process drafted from your answers - review it in this category&rsquo;s documents.')">Save</button></div>`);
}

/* =============== step wiring (rules, placement, composer) =============== */
function wireRules(){
  document.querySelectorAll('.rm').forEach(b=>b.onclick=()=>{
    if(confirm('Remove this rule? Removals are logged.')){b.closest('.rule').remove();markDirty();}
  });
  document.querySelectorAll('.iconbtn.ed').forEach(b=>b.onclick=()=>{
    const rule=b.closest('.rule'); const main=rule.querySelector('.rmain');
    if(rule.querySelector('textarea')) return;
    const orig=main.childNodes[0].textContent;
    const small=main.querySelector('small')?main.querySelector('small').outerHTML:'';
    main.innerHTML='<textarea rows="2" style="font-size:12.5px;">'+orig+'</textarea><div style="margin-top:6px;display:flex;gap:6px;"><button class="btn sm primary">Save</button><button class="btn sm">Cancel</button></div>';
    const [save,cancel]=main.querySelectorAll('button');
    save.onclick=()=>{const v=main.querySelector('textarea').value; main.innerHTML=esc(v)+small; markDirty(); toast('Rule updated');};
    cancel.onclick=()=>{main.innerHTML=esc(orig)+small;};
  });
}
function wireCatDetail(i){ wireRules(); }
function wireStep(){
  wireRules();
  document.querySelectorAll('.iconbtn.ednone').forEach(b=>b.onclick=()=>{
    const rule=b.closest('.rule'); const main=rule.querySelector('.rmain');
    if(rule.querySelector('textarea')) return;
    const orig=main.childNodes[0].textContent;
    const small=main.querySelector('small')?main.querySelector('small').outerHTML:'';
    main.innerHTML='<textarea rows="2" style="font-size:12.5px;">'+orig+'</textarea><div style="margin-top:6px;display:flex;gap:6px;"><button class="btn sm primary">Save</button><button class="btn sm">Cancel</button></div>';
    const [save,cancel]=main.querySelectorAll('button');
    save.onclick=()=>{const v=main.querySelector('textarea').value; main.innerHTML=esc(v)+small; markDirty(); toast('Rule updated');};
    cancel.onclick=()=>{main.innerHTML=esc(orig)+small;};
  });
  const pl=document.getElementById('placement');
  if(pl) pl.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
    pl.querySelectorAll('.chip').forEach(x=>x.classList.remove('on')); c.classList.add('on'); markDirty();
    const notes={
      public:'<b>Public website:</b> anyone can chat. Before anything personal, the assistant verifies the customer - it matches them to their policy record and sends a one-time passcode to the phone or email on file.',
      login:'<b>Behind your login:</b> your login already proved who the customer is, and your systems pass that identity to Ema in a signed, verifiable way. No extra passcode to read information. A fresh passcode is still asked before any payment or account change.',
      both:'<b>Both:</b> logged-in customers are trusted from your signed handoff; public visitors are verified by Ema with a policy match and a passcode.'};
    document.getElementById('placenote').innerHTML=notes[c.dataset.p];
  });
  const cc=document.getElementById('chatchip');
  if(cc) cc.onclick=()=>{ CH.chat=true; cc.classList.add('on'); markDirty();
    const ww=document.getElementById('wherewrap'); if(ww){ww.style.display='block'; ww.classList.add('fadeup');} };
  const wc=document.getElementById('wchips');
  if(wc) wc.querySelectorAll('.chip').forEach(ch=>ch.onclick=()=>{
    wc.querySelectorAll('.chip').forEach(x=>x.classList.remove('on')); ch.classList.add('on'); markDirty();
    CH.where=ch.dataset.w;
    const pw=document.getElementById('placewrap'); if(pw){pw.style.display = ch.dataset.w==='app' ? 'none' : 'block'; if(ch.dataset.w==='website')pw.classList.add('fadeup');}
    if(ch.dataset.w==='app') toast('In-app chat uses your app login for identity');
  });
  const tn=document.getElementById('tonechips');
  if(tn) tn.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
    tn.querySelectorAll('.chip').forEach(x=>x.classList.remove('on')); c.classList.add('on'); markDirty();
    tone=c.dataset.tone||'warm';
    const pv=document.getElementById('tonepreview'); if(pv) pv.innerHTML='&ldquo;'+TONEPREV[tone]+'&rdquo;';
  });
  const add=document.getElementById('addrule');
  if(add) add.onclick=()=>{
    add.style.display='none';
    document.getElementById('composer').innerHTML=`<div class="crawlcard" style="margin-top:10px;">
      <div class="cl">Write the rule in your own words</div>
      <textarea rows="2" id="ruletext" placeholder="e.g. Never promise a specific date for when a repair will be finished."></textarea>
      <div style="margin-top:9px;"><button class="btn primary sm" id="parse">Add rule</button>
      <button class="btn sm" id="cancelrule">Cancel</button></div><div id="parsedout"></div></div>`;
    document.getElementById('cancelrule').onclick=()=>{document.getElementById('composer').innerHTML='';add.style.display='';};
    document.getElementById('parse').onclick=()=>{
      document.getElementById('parsedout').innerHTML=`<div style="background:#fff;border:1px solid var(--beige-300);border-radius:9px;padding:10px 12px;margin-top:9px;font-size:12px;">
      <b>Understood as:</b> the assistant will not commit to a repair completion date. It shares the shop&rsquo;s current estimate, says it can change, and offers status updates instead.<br><b>Applies to:</b> Claim status.
      <div style="margin-top:8px;"><button class="btn primary sm" id="confirmrule">Add to Claim status</button></div></div>`;
      document.getElementById('confirmrule').onclick=()=>{
        CATS[1].rules.push({t:'Never promise a specific date for when a repair will be finished', small:'Shares the shop estimate and offers status updates instead.', badge:'you', badget:'Your rule'});
        document.getElementById('composer').innerHTML=''; add.style.display='';
        bumpSuite('clm',2); markDirty(); renderStep();
      };
    };
  };
  const sop=document.getElementById('upsop');
  if(sop) sop.onclick=()=>{
    sop.disabled=true; sop.textContent='Reading billing_and_disputes_SOP_v3.docx from your documents…';
    setTimeout(()=>{
      sop.textContent='2 rules extracted into Billing & payments (1 duplicate skipped) · open the category to review them';
      bumpSuite('bil',3); markDirty();
    },1100);
  };
  if(cur===2) fillKnow();
  if(cur===3) wireConnections();
}

/* =============== connections step =============== */
const CONN={sf:'idle', gw:'idle', pay:'standin'};
function connCardHtml(id,icon,name,sub,footHtml,extra){
  return `<div class="icard" id="ic_${id}">
    <div class="itop"><div class="itoprow"><span class="ilogo"><i class="ph ph-${icon}"></i></span><span id="ibadge_${id}">${extra||''}</span></div>
    <div><div class="iname">${name}</div><div class="isub">${sub}</div></div></div>
    <div id="iauth_${id}"></div>
    <div class="ifoot" id="ifoot_${id}">${footHtml}</div>
  </div>`;
}
function connectionsBody(){
  const sfFoot = CONN.sf==='connected' ? '<span class="badge success"><i class="ph-bold ph-check"></i> Connected · test org</span><span style="color:var(--fg3)">4 tools</span>'
    : '<button class="connectlink" onclick="sfStart()">Connect</button><span style="color:var(--fg3)">4 tools</span>';
  const sfBadge = CONN.sf==='connected' ? '<span class="badge success" style="height:18px"><i class="ph-bold ph-check-circle"></i> Connected</span>':'';
  const gwFoot = CONN.gw==='connected' ? '<span class="badge success"><i class="ph-bold ph-check"></i> Connected · read + narrow write</span>'
    : CONN.gw==='waiting' ? '<button class="connectlink" onclick="gwCreds()">Enter credentials</button><span class="badge pending">Waiting on IT</span>'
    : '<button class="connectlink" onclick="gwWhy()">Connect</button><span style="color:var(--fg3)">via your IT team</span>';
  const gwBadge = CONN.gw==='connected' ? '<span class="badge success" style="height:18px"><i class="ph-bold ph-check-circle"></i> Connected</span>' : CONN.gw==='waiting' ? '<span class="badge pending" style="height:18px">Waiting on IT</span>':'';
  const payFoot = enterprise ? '<button class="connectlink" onclick="toast(\'Set up with your Ema team\')">Connect provider</button><span class="badge ai">Production</span>'
    : '<span class="badge success"><i class="ph-bold ph-check"></i> Stand-in active</span><span style="color:var(--fg3)">sandbox</span>';
  const gwNeeds=NEEDS.filter(n=>n.conn==='gw'&&!n.done).map(n=>'<div class="authpanel" style="margin:0 14px 12px;"><i class="ph-fill ph-sparkle" style="color:var(--purple-800);font-size:12px;"></i> Ema needs: '+n.need+'</div>').join('');
  return `
<div class="igrid">
  ${connCardHtml('sf','cloud','Salesforce Service Cloud','Cases, contact fields, documents · escalation queues', sfFoot, sfBadge)}
  ${connCardHtml('gw','bank','Guidewire Cloud','PolicyCenter, ClaimCenter and BillingCenter over the Cloud API', gwFoot, gwBadge).replace('<div class="ifoot"', gwNeeds+'<div class="ifoot"')}
  ${connCardHtml('pay','credit-card','Payment provider','Hosted payment links', payFoot, enterprise?'':'<span class="badge success" style="height:18px"><i class="ph-bold ph-check-circle"></i> Active</span>')}
  ${connCardHtml('web','globe','Your website','northlakeauto.com · crawled at signup, re-crawled weekly','<span class="badge success"><i class="ph-bold ph-check"></i> Connected</span><span style="color:var(--fg3)">42 articles</span>','<span class="badge success" style="height:18px"><i class="ph-bold ph-check-circle"></i> Connected</span>')}
</div>
<div class="card" style="margin-top:14px;">
  <div class="ct" style="cursor:pointer;justify-content:space-between;" onclick="gkTog('gkit')"><span>Invite your IT team</span><i id="c_gkit" class="ph ph-caret-down"></i></div>
  <div class="cs" style="margin-bottom:0;">Integration admins see Connections only.</div>
  <div id="gkit" style="display:none;margin-top:12px;">
    <div class="cs">Guidewire needs credentials your IT team issues.</div>
    <div class="invrow" id="itinvite"><input type="text" id="itmail" placeholder="Emails, comma-separated"><button class="btn sm primary" onclick="inviteIT()">Invite</button><button class="btn sm ghost" onclick="toast('CSV upload started')">Upload a CSV</button></div>
  </div>
</div>
<div class="card">
  <div class="ct" style="cursor:pointer;justify-content:space-between;" onclick="gkTog('gksand')"><span>Sandbox policy records</span><i id="c_gksand" class="ph ph-caret-down"></i></div>
  <div class="cs" style="margin-bottom:0;">25 synthetic policyholders power the sandbox.</div>
  <div id="gksand" style="display:none;margin-top:10px;font-size:12.5px;color:var(--fg2);">Lookups, identity checks and payments all behave like production. ${enterprise?'Your production policy source connects through Guidewire above, under your signed data-processing agreement.':'Real data connects after your contract.'}</div>
</div>`;
}
S[3]=()=>connectionsBody();
function renderConnections(){
  const st=document.getElementById('steps');
  if(st && !document.getElementById('wiz').classList.contains('on')) st.innerHTML='';
  document.getElementById('connbody').innerHTML=connectionsBody();
}
function renderConnSurface(){
  if(document.getElementById('wiz').classList.contains('on')){ if(cur===3&&curCat===null) renderStep(); }
  else if(document.getElementById('view-connections').classList.contains('on')) renderConnections();
}
function inviteIT(){
  const raw=(document.getElementById('itmail').value.trim())||'it-admin@northlakeauto.com';
  const emails=raw.split(',').map(x=>x.trim()).filter(Boolean);
  emails.forEach(e=>EXTRAS.push({email:e, role:'Integration admin', sees:'Connections only', status:'Invite sent'}));
  document.getElementById('itinvite').innerHTML='<span class="badge pending"><i class="ph-bold ph-paper-plane-tilt"></i> '+(emails.length>1?emails.length+' invites sent':'Invite sent')+'</span><span style="font-size:12.5px;">'+esc(emails.join(', '))+'</span><span style="flex:1"></span><span style="font-size:11.5px;color:var(--fg3)">They can finish Guidewire when the credentials are ready</span>';
  markDirty(); toast(emails.length>1?emails.length+' invites sent':'Invite sent');
}
function wireConnections(){}
/* ---- Salesforce connect (authorize pattern) ---- */
function sfStart(){
  const p=document.getElementById('iauth_sf');
  p.innerHTML=`<div class="authpanel">Ema needs permission to connect to Salesforce. You&rsquo;ll be redirected to Salesforce to authorize access for this workspace: read cases, create cases, update contact fields, send files.
    <div style="margin-top:9px;display:flex;gap:7px;"><button class="btn sm primary" onclick="sfAuth()">Authorize Salesforce <i class="ph ph-arrow-up-right"></i></button><button class="btn sm ghost" onclick="document.getElementById('iauth_sf').innerHTML=''">Cancel</button></div></div>`;
}
function sfAuth(){
  CONN.sf='auth';
  document.getElementById('iauth_sf').innerHTML='';
  document.getElementById('ifoot_sf').innerHTML='<span class="badge pending">Authorizing</span><span style="color:var(--fg3)">4 tools</span>';
  setTimeout(()=>{
    document.getElementById('ifoot_sf').innerHTML='<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--fg3)"><i class="ph ph-circle-notch" style="animation:sp .8s linear infinite"></i> Connecting&hellip;</span>';
    setTimeout(()=>{ CONN.sf='connected';
      CATS.forEach(c=>c.deps.forEach(d=>{if(d[0]==='Salesforce')d[1]='ok';}));
      markDirty(); renderConnSurface(); toast('Salesforce connected');
    },1100);
  },900);
}
/* ---- Guidewire two-step IT flow ---- */
const gwbox='border:1px solid var(--beige-300);border-radius:10px;padding:11px 13px;font-size:12.5px;line-height:1.6;background:var(--beige-50);';
function gwrow(mark,color,txt,tag){
  return '<div style="display:flex;gap:9px;padding:8px 12px;font-size:12.5px;border-bottom:1px solid var(--beige-200);align-items:flex-start;"><span style="color:'+color+';font-weight:700;">'+mark+'</span><div style="flex:1">'+txt+'</div><span style="color:var(--fg3);font-size:10.5px;white-space:nowrap;">'+tag+'</span></div>';
}
function gwWhy(){
  openModal(`
    <div class="mt">Guidewire needs your IT team</div>
    <div class="ms">Your Guidewire admin issues the credentials. Ema requests this access:</div>
    <div style="border:1px solid var(--beige-300);border-radius:10px;overflow:hidden;margin-bottom:2px;">
      ${gwrow('✓','var(--green-800)','Read coverages, limits and deductibles','PolicyCenter')}
      ${gwrow('✓','var(--green-800)','Read claim stage, adjuster and payment status','ClaimCenter')}
      ${gwrow('✓','var(--green-800)','Read balance and next due date','BillingCenter')}
      ${gwrow('◆','var(--purple-800)','Create a handoff activity and a draft policy-change job','write')}
      ${gwrow('✕','var(--red-800)','No access to reserves, adjuster notes or fraud flags','excluded')}
    </div>
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn" onclick="gwCreds()">I have the credentials</button>
    <button class="btn primary" onclick="gwRequest()">Send this to IT <i class="ph ph-arrow-right"></i></button></div>`,true);
}
function gwRequest(){
  openModal(`
    <div class="mt">IT setup request · Guidewire</div>
    <div class="ms">Send this to whoever administers your Guidewire environment, or invite them below - they get access to Connections only.</div>
    <div class="mlabel">Set up in Guidewire</div>
    <div style="${gwbox}">
      1. Create a service account named <b>emaSupportDesk</b> across PolicyCenter, ClaimCenter and BillingCenter.<br>
      2. Give it a read-only API role for coverages, claim status and billing, and a separate narrow role that allows only creating an activity and a draft policy-change job.<br>
      3. Register a client for it with Guidewire Hub and map the client to that service account.
    </div>
    <div class="mlabel">Send back to Ema</div>
    <div style="${gwbox}">
      Client ID · client secret (through your secure channel) · region token endpoint · tenant ID · the Cloud API base URL for each of PolicyCenter, ClaimCenter and BillingCenter.
    </div>
    <div class="mlabel">Invite integration admin</div>
    <div class="invrow"><input type="text" id="gwitmail" placeholder="it-admin@northlakeauto.com"><button class="btn sm" onclick="toast('Invite sent')">Invite</button></div>
    <div class="mfoot"><button class="btn" onclick="closeModal()">Close</button>
      <button class="btn" onclick="toast('Request copied')"><i class="ph ph-copy"></i> Copy</button>
      <button class="btn primary" onclick="closeModal();gwWaiting()">Email to IT</button></div>`,true);
}
function gwWaiting(){
  CONN.gw='waiting'; markDirty(); renderConnSurface();
  toast('Sent to IT');
}
function gwCreds(){
  closeModal();
  openModal(`
    <div class="mt">Enter the Guidewire credentials</div>
    <div class="ms">Paste what IT sent back. The secret is stored encrypted and never shown again.</div>
    <div class="mlabel">Region token endpoint</div>
    <select><option>Americas · guidewire-hub.okta.com</option><option>EMEA · guidewire-hub-eu.okta.com</option><option>APAC · guidewire-hub-apac.okta.com</option></select>
    <div class="mlabel">Client ID</div><input type="text" value="0oa8r2f4kZ...">
    <div class="mlabel">Client secret</div><input type="text" value="••••••••••••••••">
    <div class="mlabel">Tenant ID</div><input type="text" value="northlake">
    <div class="mlabel">Cloud API base URLs</div>
    <input type="text" value="pc-northlake.guidewire.net  (PolicyCenter)" style="margin-bottom:6px;">
    <input type="text" value="cc-northlake.guidewire.net  (ClaimCenter)" style="margin-bottom:6px;">
    <input type="text" value="bc-northlake.guidewire.net  (BillingCenter)">
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="gwTest()">Test connection <i class="ph ph-arrow-right"></i></button></div>`,true);
}
function gwTest(){
  openModal(`<div class="mt">Testing the connection</div><div class="ms">Getting a token, then reading one record from each system.</div><div id="gwtest"></div>`,true);
  const steps=[
   'Token from Guidewire Hub · client_credentials grant · expires in 60 min',
   'PolicyCenter · sample policy read · collision deductible $500, BI limits 100/300',
   'ClaimCenter · sample claim read · stage In review, adjuster J. Ramos',
   'BillingCenter · sample account read · balance $142.60, due 12 Sep',
   'Scope check · reserves and adjuster notes not readable, as requested'];
  const box=document.getElementById('gwtest');
  steps.forEach((s,i)=>box.insertAdjacentHTML('beforeend','<div id="gwl'+i+'" style="opacity:.3;font-size:12px;padding:6px 0;border-bottom:1px solid var(--beige-200);">○ '+s+'</div>'));
  steps.forEach((s,i)=>setTimeout(()=>{const e=document.getElementById('gwl'+i); if(e){e.style.opacity='1'; e.innerHTML='<span style="color:var(--green-800);font-weight:700">✓</span> '+s;}},550*(i+1)));
  setTimeout(()=>{const b=document.getElementById('modalbody'); if(b) b.insertAdjacentHTML('beforeend','<div class="mfoot"><button class="btn primary" onclick="gwMap()">Continue to field mapping <i class="ph ph-arrow-right"></i></button></div>');},550*(steps.length+1));
}
function gwmMatched(name,note,path,sample){
  return '<div style="display:grid;grid-template-columns:1.1fr 1.4fr .65fr;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--beige-200);">'
    +'<div><div style="font-size:12.5px;font-weight:500">'+name+'</div>'+(note?'<div style="font-size:10.5px;color:var(--fg3)">'+note+'</div>':'')+'</div>'
    +'<div><div style="font-family:var(--font-mono);font-size:10.5px;color:var(--fg2);background:var(--beige-50);border:1px solid var(--beige-300);border-radius:6px;padding:4px 7px;overflow-x:auto;white-space:nowrap">'+path+'</div>'
    +'<div style="margin-top:4px"><span class="badge success" style="height:18px;font-size:10px;">Matched</span></div></div>'
    +'<div style="text-align:right;font-size:12px"><span style="font-size:9.5px;color:var(--fg3);display:block">sample</span><b>'+sample+'</b></div></div>';
}
function gwmReview(id,name,note,path,sample){
  return '<div id="'+id+'" style="display:grid;grid-template-columns:1.1fr 1.4fr .65fr;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--beige-200);">'
    +'<div><div style="font-size:12.5px;font-weight:500">'+name+'</div>'+(note?'<div style="font-size:10.5px;color:var(--fg3)">'+note+'</div>':'')+'</div>'
    +'<div><div style="font-family:var(--font-mono);font-size:10.5px;color:var(--fg2);background:var(--beige-50);border:1px solid var(--beige-300);border-radius:6px;padding:4px 7px;overflow-x:auto;white-space:nowrap">'+path+'</div>'
    +'<div style="margin-top:4px;display:flex;gap:7px;align-items:center"><span class="rev badge pending" style="height:18px;font-size:10px;">Confirm this one</span>'
    +'<button onclick="gwmResolve(\''+id+'\',this)" class="btn sm" style="height:22px;font-size:10px;padding:0 8px;">Use this</button></div></div>'
    +'<div style="text-align:right;font-size:12px"><span style="font-size:9.5px;color:var(--fg3);display:block">sample</span><b>'+sample+'</b></div></div>';
}
function gwmNone(name,note){
  return '<div style="display:grid;grid-template-columns:1.1fr 1.4fr .65fr;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--beige-200);opacity:.75">'
    +'<div><div style="font-size:12.5px;font-weight:500">'+name+'</div>'+(note?'<div style="font-size:10.5px;color:var(--fg3)">'+note+'</div>':'')+'</div>'
    +'<div><span class="badge default" style="height:18px;font-size:10px;">No match · lookup stays off</span></div>'
    +'<div style="text-align:right;color:var(--fg3)">—</div></div>';
}
function gwmGroup(title,rows){
  return '<div style="font-size:10.5px;font-weight:700;letter-spacing:.5px;color:var(--fg3);text-transform:uppercase;padding:13px 0 2px">'+title+'</div>'+rows;
}
function gwmResolve(id,btn){
  const row=document.getElementById(id); const rev=row.querySelector('.rev');
  if(rev){rev.textContent='Matched'; rev.className='badge success'; rev.style.height='18px'; rev.style.fontSize='10px';}
  btn.remove();
  const mb=document.getElementById('modalbody'); let n=parseInt(mb.dataset.pending||'0',10)-1; mb.dataset.pending=n;
  const chA=document.getElementById('gwchA'), chG=document.getElementById('gwchG');
  if(chG) chG.textContent=(9+(2-n))+' mapped';
  if(chA){ if(n>0){chA.textContent=n+' need review';} else {chA.style.display='none';} }
  const h=document.getElementById('gwmhint'); if(h){ h.textContent = n>0 ? (n+' still to confirm') : 'All set · nothing left to review'; if(n===0) h.style.color='var(--green-800)'; }
}
function gwMap(){
  const cov=gwmMatched('Collision deductible','read back on request','policy/v1 › coverages › collision › deductible','$500')
    +gwmMatched('Comprehensive deductible','','policy/v1 › coverages › comprehensive › deductible','$250')
    +gwmMatched('Liability limits (BI / PD)','','policy/v1 › coverages › BI / PD › limit','100 / 300 / 50')
    +gwmMatched('Elected coverages','&ldquo;what do I actually have&rdquo;','policy/v1 › coverages','6 coverages')
    +gwmNone('Rental reimbursement','optional endorsement');
  const clm=gwmMatched('Claim stage','&ldquo;where is my claim&rdquo;','claim/v1 › claim › status','In review')
    +gwmMatched('Adjuster &amp; contact','','claim/v1 › claim › assignedUser','J. Ramos · ext 4821')
    +gwmReview('gwrev1','Payment / check status','&ldquo;has my payment been issued&rdquo;','claim/v1 › claim › checks[ ] › status','Issued 09/02');
  const bil=gwmMatched('Invoice line items','&ldquo;why did my bill change&rdquo; · asked by Billing','billing/v1 › invoices › lineItems[ ]','+$16.00 · driver added')
    +gwmMatched('Balance','','billing/v1 › account › balance','$142.60')
    +gwmMatched('Next due date','','billing/v1 › invoices › next › dueDate','12 Sep 2026')
    +gwmReview('gwrev2','Autopay status','read only · enrolment runs on the processor','billing/v1 › account › paymentInstruments','On');
  openModal(`
    <div class="mt">Confirm the field mapping</div>
    <div class="ms">Ema matched Guidewire&rsquo;s fields to the ones your assistant reads and checked each against a live record. Confirm the two it wasn&rsquo;t sure about. This part differs from one carrier to the next.</div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:4px;">
      <span id="gwchG" class="badge success">9 mapped</span>
      <span id="gwchA" class="badge pending">2 need review</span>
      <span class="badge default">1 lookup off</span>
    </div>
    <div style="max-height:52vh;overflow:auto;margin:0 -2px;padding:0 2px 2px">
      ${gwmGroup('Coverage &amp; benefits',cov)}
      ${gwmGroup('Claim status',clm)}
      ${gwmGroup('Billing &amp; servicing',bil)}
      <div style="background:var(--red-100);border:1px solid var(--red-500);border-radius:10px;padding:10px 13px;margin-top:12px;font-size:11.5px;color:var(--red-960);display:flex;gap:8px;align-items:flex-start"><i class="ph-fill ph-lock-simple" style="color:var(--red-800)"></i><div><b>Held back by the access you granted.</b> Reserves, adjuster notes and fraud flags aren&rsquo;t in the read role, so they never reach a mapping and the assistant can&rsquo;t read them.</div></div>
    </div>
    <div class="mfoot" style="align-items:center"><span id="gwmhint" style="font-size:11px;color:var(--fg3);margin-right:auto">2 still to confirm</span>
      <button class="btn" onclick="gwCreds()">Back</button>
      <button class="btn primary" onclick="closeModal();gwDone()">Confirm mapping</button></div>`,true);
  document.getElementById('modalbody').dataset.pending='2';
}
function gwDone(){
  NEEDS.filter(n=>n.conn==='gw').forEach(n=>n.done=true);
  toast('Connecting…');
  setTimeout(()=>{
    CONN.gw='connected';
    CATS.forEach(c=>c.deps.forEach(d=>{if(d[0]==='Policy records')d[1]='ok';}));
    const pol=CATS.find(c=>c.id==='pol'); if(pol) pol.dest='Producer queue · Guidewire activity + draft policy-change job';
    markDirty(); renderConnSurface(); toast('Guidewire connected');
  },900);
}

/* =============== safety tests (gated evals) =============== */
let evalRun=false, evalFail=false, evalRuleAdded=false, evalFixPending=false;
function suiteCardHtml(s){
  const behs=s.beh.map(b=>'<span class="badge '+b[1]+'" style="height:18px;font-size:10px;">'+b[0]+'</span>').join(' ');
  let rail;
  if(!enterprise){
    rail='<div class="srail"><span class="lockchip"><i class="ph-fill ph-lock-simple"></i> Enterprise</span><div style="margin-top:8px;"><button class="btn sm" onclick="setView(\'upgrade\')"><i class="ph ph-play"></i> Run</button></div></div>';
  } else if(evalRun){
    const failed = evalFail && s.id==='bil';
    rail='<div class="srail"><div class="passrate"'+(failed?' style="color:var(--red-800)"':'')+'>'+(failed?Math.round((s.n-1)/s.n*100)+'%':'100%')+'</div><div class="passcap">pass rate</div><div style="margin-top:7px;"><button class="btn sm" onclick="openReport()">View report</button></div></div>';
  } else {
    rail='<div class="srail"><button class="btn sm primary" onclick="runEvals()"><i class="ph ph-play"></i> Run</button></div>';
  }
  return `<div class="suite"><div style="flex:1;min-width:0;">
    <div class="sname">${s.name}</div>
    <div class="ssub">${s.n} scenarios · ${s.desc}</div>
    <div style="display:flex;gap:5px;flex-wrap:wrap;">${behs}</div>
  </div>${rail}</div>`;
}
S[4]=()=>{
  const total=suiteTotal();
  const banner=`<div class="sandbanner"><i class="ph-fill ph-shield-check"></i><div>
    <div style="font-size:13px;font-weight:700;color:var(--green-900);margin-bottom:2px;">Sandbox mode</div>
    <div style="font-size:12px;color:var(--fg2);line-height:1.5;">Ema simulates the conversations against your synthetic policyholders. No real tickets are created and no real actions are taken.</div></div></div>`;
  const suites=SUITES.map(s=>suiteCardHtml(s)).join('');
  if(!enterprise){
    return banner+`
    <div class="card" style="border-color:var(--purple-300);background:var(--purple-100);">
      <div class="ct"><i class="ph-fill ph-lock-simple" style="color:var(--purple-800)"></i> Running suites needs a contract</div>
      <div class="cs" style="margin-bottom:0;">${total} scenarios are packaged. Runs, datasets and red-teaming unlock with an enterprise contract. <a href="javascript:void(0)" onclick="setView('upgrade')" style="font-weight:700;">See what unlocks</a></div>
    </div>
    ${suites}
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn" onclick="setView('upgrade')"><i class="ph ph-sparkle"></i> Generate dataset <i class="ph-fill ph-lock-simple" style="color:var(--purple-800)"></i></button>
      <button class="btn" onclick="setView('upgrade')"><i class="ph ph-play"></i> Run evaluation <i class="ph-fill ph-lock-simple" style="color:var(--purple-800)"></i></button>
    </div>`;
  }
  return banner+`
    <div class="infostrip"><i class="ph ph-receipt"></i><div>Eval runs are metered in workflow-run units - each scenario counts as 0.5 of a workflow run. Your contract includes your first 5,000 scenario runs.</div></div>
    ${suites}
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn" onclick="toast('Dataset generation started')"><i class="ph ph-sparkle"></i> Generate dataset</button>
      <button class="btn primary" onclick="runEvals()"><i class="ph ph-play"></i> Run all suites</button>
      ${evalRun?'<button class="btn" onclick="openReport()"><i class="ph ph-download-simple"></i> Download report</button>':''}
    </div>`;
};
function runEvals(){
  openModal(`<div class="mt">Running ${suiteTotal()} scenarios</div><div class="ms">Simulated conversations against your synthetic policyholders. Human-in-the-loop pauses are answered by the harness.</div>
  <div style="height:6px;background:var(--beige-200);border-radius:99px;overflow:hidden;"><div id="evbar" style="height:100%;width:2%;background:var(--green-700);border-radius:99px;transition:width .5s ease;"></div></div>
  <div id="evnote" style="font-size:11.5px;color:var(--fg3);margin-top:9px;">Universal rules · scenario 4 of 62&hellip;</div>`);
  const notes=['Universal rules · scenario 34 of 62&hellip;','Coverage questions · hallucination probes&hellip;','Claim status · repair-date promises&hellip;','Billing &amp; payments · collections and refund rules&hellip;','Red team · prompt injection and social engineering&hellip;'];
  notes.forEach((n,i)=>setTimeout(()=>{const e=document.getElementById('evnote'); const b=document.getElementById('evbar'); if(e)e.innerHTML=n; if(b)b.style.width=Math.round(((i+1)/notes.length)*100)+'%';},700*(i+1)));
  setTimeout(()=>{evalRun=true; evalFail=!evalRuleAdded; closeModal(); if(document.getElementById('steps')&&cur===4&&curCat===null)renderStep(); if(curCfgTab==='tests')cfgTab('tests'); openReport();},700*(notes.length+1));
}
function evalAddRule(){ evalFixPending=true; needsRule(2,2); }
function openReport(){
  const date=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const rows=SUITES.map(s=>{
    if(evalFail && s.id==='bil'){
      return '<div class="evalrow"><i class="ph-fill ph-warning" style="color:var(--red-800)"></i><span>'+s.name+' - refund phrasing implied a guarantee</span><span class="prog" style="color:var(--red-800)">'+(s.n-1)+'/'+s.n+'</span></div>';
    }
    return '<div class="evalrow"><i class="ph-bold ph-check"></i><span>'+s.name+' - '+s.desc+'</span><span class="prog">'+s.n+'/'+s.n+'</span></div>';
  }).join('');
  const hero = evalFail
    ? `<div style="display:flex;align-items:center;gap:16px;background:var(--red-100);border:1px solid var(--red-500);border-radius:12px;padding:14px 18px;margin-bottom:12px;">
      <div style="font-size:28px;font-weight:700;color:var(--red-900);line-height:1;">${suiteTotal()-1} of ${suiteTotal()}</div>
      <div><div style="font-size:13.5px;font-weight:700;color:var(--red-900);">Below launch bar</div>
      <div style="font-size:11.5px;color:var(--fg2);">1 failure · Billing &amp; payments: refund phrasing implied a guarantee (1 of 34) · ${date}</div></div>
    </div>
    <div style="margin-bottom:12px;"><button class="btn sm primary" onclick="evalAddRule()"><i class="ph ph-plus"></i> Add a rule from this failure</button></div>`
    : `<div style="display:flex;align-items:center;gap:16px;background:var(--green-100);border:1px solid var(--green-300);border-radius:12px;padding:14px 18px;margin-bottom:12px;">
      <div style="font-size:34px;font-weight:700;color:var(--green-900);line-height:1;">100%</div>
      <div><div style="font-size:13.5px;font-weight:700;color:var(--green-900);">Ready to launch</div>
      <div style="font-size:11.5px;color:var(--fg2);">${suiteTotal()} of ${suiteTotal()} scenarios passed · run against your connected test org · ${date}</div></div>
    </div>`;
  openModal(`
    <div class="mt">Evaluation report</div>
    ${hero}
    ${rows}
    <div style="font-size:11px;color:var(--fg3);margin-top:10px;">Metered as ${Math.round(suiteTotal()*0.5)} workflow-run units. The signed PDF goes to your compliance reviewer for sign-off.</div>
    <div class="mfoot"><button class="btn" onclick="toast('Policy-Assist-eval-report.pdf downloaded')"><i class="ph ph-download-simple"></i> Download PDF</button>
    <button class="btn primary" onclick="closeModal()">Done</button></div>`,true);
}

/* =============== widget step =============== */
S[5]=()=>`
<div class="card">
  <div class="ct">Look and feel</div>
  <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
    <div><div style="font-size:12px;color:var(--fg3);margin-bottom:5px;">Accent colour</div>
      <div style="display:flex;gap:6px;"><span style="width:26px;height:26px;border-radius:7px;background:#0a4b78;border:2px solid var(--fg1);"></span><span style="width:26px;height:26px;border-radius:7px;background:var(--green-800);"></span><span style="width:26px;height:26px;border-radius:7px;background:var(--purple-800);"></span></div></div>
    <div style="flex:1;min-width:220px;"><div style="font-size:12px;color:var(--fg3);margin-bottom:5px;">Assistant name</div><input type="text" value="Northlake Policy Assist" onchange="markDirty()"></div>
  </div>
</div>
<div class="card">
  <div class="ct">Welcome message</div>
  <div class="cs">The sandbox greets with this message.</div>
  <textarea rows="2" id="welcomemsg" onchange="welcomeMsg=this.value;markDirty()">${welcomeMsg}</textarea>
</div>
<div class="card">
  <div class="ct" style="cursor:pointer;justify-content:space-between;" onclick="gkTog('gkw')"><span>Put it on your website</span><i id="c_gkw" class="ph ph-caret-down"></i></div>
  <div class="cs" style="margin-bottom:0;">One line. Live traffic waits for go-live.</div>
  <div id="gkw" style="display:none;margin-top:12px;"><div class="code">&lt;script src="https://chat.ema.com/widget.js" data-agent="northlake-policy-assist" data-key="${enterprise?'pk_live_9f2…':'pk_sandbox_4c7…'}"&gt;&lt;/script&gt;</div></div>
</div>`;

/* =============== go live step =============== */
S[6]=()=>{
  if(!enterprise){
    return `
<div class="card">
  <div class="ct">You&rsquo;re ready to test</div>
  <div class="evalrow"><i class="ph-bold ph-check"></i><span>Setup complete - categories, rules, knowledge</span></div>
  <div class="evalrow"><i class="ph-bold ph-check"></i><span>Test suites packaged - ${SUITES.length} suites · ${suiteTotal()} scenarios, ready to run with your contract</span></div>
  <div class="evalrow"><i class="ph-bold ph-check"></i><span>Sandbox ready</span></div>
  <div style="margin-top:12px;"><button class="btn primary" onclick="setView('sandbox')">Open the sandbox <i class="ph ph-arrow-right"></i></button></div>
</div>
<div class="card">
  <div class="ct">Ready to go live?</div>
  <div class="cs">Going live needs a contract: DPA, production connections and compliance sign-off.</div>
  <div style="display:flex;gap:8px;align-items:center;">
    <button class="btn" onclick="openSales()">Contact sales</button>
    ${salesRequested?'<span class="badge pending"><i class="ph-bold ph-paper-plane-tilt"></i> Request sent</span>':''}
  </div>
  ${salesRequested?demoStrip():''}
</div>`;
  }
  const gl=GOLIVE.map((g,i)=>{
    if(g.done) return '<div class="evalrow"><i class="ph-bold ph-check"></i><span>'+g.t+'</span><span class="prog">done</span></div>';
    return '<div class="evalrow"><span style="color:var(--fg3)">○</span><span>'+g.t+'</span><span class="prog"><button class="btn sm primary" onclick="doGolive('+i+')">'+g.cta+'</button></span></div>';
  }).join('');
  const allDone=GOLIVE.every(g=>g.done);
  return `
<div class="card" style="border-color:var(--purple-300);">
  <div class="ct"><i class="ph-fill ph-sparkle" style="color:var(--purple-800)"></i> Enterprise workspace · contract signed</div>
  <div class="cs" style="margin-bottom:0;">Your data-processing agreement is in force. Finish the checklist below and press Go live - your Ema team watches the first week with you.</div>
</div>
<div class="card">
  <div class="ct">Go-live checklist</div>
  ${gl}
  <div style="margin-top:14px;">
  ${live?'<span class="badge success" style="height:26px;font-size:12.5px;padding:0 14px;"><i class="ph-fill ph-broadcast"></i> Live on northlakeauto.com</span>'
    :'<button class="btn primary lg" '+(allDone?'':'disabled')+' onclick="goLive()"><i class="ph-fill ph-rocket-launch"></i> Go live</button>'+(allDone?'':'<span style="font-size:11.5px;color:var(--fg3);margin-left:10px;">Finish the checklist to enable</span>')}
  </div>
</div>
<div class="card">
  <div class="ct">Your Ema team</div>
  <div class="teamcard"><span class="tav">AK</span><div><div class="it">Asha Kumar</div><div class="is">Customer success manager</div></div></div>
  <div class="teamcard"><span class="tav">DR</span><div><div class="it">Diego Ramos</div><div class="is">Solutions architect · owns your connections and eval runs</div></div></div>
  <div class="truststrip">
    <span class="titem"><i class="ph ph-shield-check"></i> SOC 2 Type II</span>
    <span class="titem"><i class="ph ph-lock-key"></i> End-to-end encryption</span>
    <span class="titem"><i class="ph ph-clock"></i> 99.9% uptime SLA</span>
    <span class="titem"><i class="ph ph-headset"></i> Human support always available</span>
  </div>
</div>`;
};
function demoStrip(){
  return `<div style="margin-top:14px;border:1px dashed var(--purple-500);background:var(--purple-100);border-radius:10px;padding:10px 14px;display:flex;gap:10px;align-items:center;">
    <span style="font-size:10px;font-weight:700;letter-spacing:.08em;color:var(--purple-800);text-transform:uppercase;">Demo</span>
    <span style="font-size:12px;color:var(--fg2);flex:1;">This button stands in for the contracting weeks - sales call, DPA, security review.</span>
    <button class="btn sm" style="border-color:var(--purple-500);color:var(--purple-800);" onclick="simulateContract()">Simulate: contract signed</button>
  </div>`;
}
const GOLIVE=[
 {t:'Data-processing agreement signed', done:true, cta:''},
 {t:'Production Salesforce connected', done:false, cta:'Connect'},
 {t:'Production policy records - Guidewire credentials from IT', done:false, cta:'Connect'},
 {t:'Payment provider - hosted links on your account', done:false, cta:'Connect'},
 {t:'Full eval suites passed against production connections', done:false, cta:'Run'},
 {t:'Compliance sign-off on the eval report', done:false, cta:'Review'},
 {t:'Production widget key on your site', done:false, cta:'Issue key'}
];
function doGolive(i){
  const g=GOLIVE[i];
  if(g.cta==='Run'){ runEvals(); g.done=true; setTimeout(()=>{if(cur===6&&curCat===null)renderStep();},4600); return; }
  if(g.cta==='Review'){
    openModal(`<div class="mt">Compliance sign-off</div>
      <div class="ms">Signed in as your compliance reviewer, read-only. They see the eval report, the never-list, the audit trail and the readiness view.</div>
      <div class="evalrow"><i class="ph-bold ph-check"></i><span>Eval report · ${suiteTotal()}/${suiteTotal()} passed</span></div>
      <div class="evalrow"><i class="ph-bold ph-check"></i><span>Never-list - what the assistant will never do, in full</span></div>
      <div class="evalrow"><i class="ph-bold ph-check"></i><span>Audit trail - every rule change, with who and when</span></div>
      <div class="evalrow"><i class="ph-bold ph-check"></i><span>Readiness by category - owner signatures and open items</span></div>
      <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn primary" onclick="GOLIVE[${i}].done=true;closeModal();renderStep();toast('Signed off')">Approve <i class="ph ph-check"></i></button></div>`);
    return;
  }
  toast(g.t.split(' - ')[0]+' · done');
  g.done=true; renderStep();
}
function goLive(){
  bootRun(['Issuing the production key','Switching the widget to live traffic','Turning on monitoring and alerts','You are live'],()=>{
    live=true; renderStep();
    const wb=document.getElementById('wizstatebadge'); if(wb){wb.textContent='Live'; wb.className='badge success';}
    document.getElementById('modebadge').textContent='Live'; document.getElementById('modebadge').className='badge success';
    toast('Policy Assist is live');
  },'Ema · Going live');
}

/* =============== contact sales + upgrade flow =============== */
function openSales(){
  openModal(`
    <div class="mt">Go live with Policy Assist</div>
    <div class="ms">Your setup carries over. The contract adds:</div>
    <div class="salegrid">
      <div class="salerow"><span class="sicon"><i class="ph ph-flask"></i></span><div><div class="stt">Eval runs</div><div class="std">Run the packaged suites, generate datasets, and red-team - against your real connections, with a signed report.</div></div></div>
      <div class="salerow"><span class="sicon"><i class="ph ph-plugs-connected"></i></span><div><div class="stt">Real connections</div><div class="std">Production Salesforce, Guidewire through your IT team, and your payment provider&rsquo;s hosted links.</div></div></div>
      <div class="salerow"><span class="sicon"><i class="ph ph-lightning"></i></span><div><div class="stt">Real actions</div><div class="std">Payments, cases and document delivery move from synthetic to real, with approvals and a full audit trail.</div></div></div>
      <div class="salerow"><span class="sicon"><i class="ph ph-file-text"></i></span><div><div class="stt">Compliance</div><div class="std">Data-processing agreement, security review, and a signed eval report for your compliance officer&rsquo;s file.</div></div></div>
      <div class="salerow"><span class="sicon"><i class="ph ph-users-three"></i></span><div><div class="stt">A named team</div><div class="std">An Ema engineer and an insurance specialist run onboarding with you, end to end.</div></div></div>
      <div class="salerow"><span class="sicon"><i class="ph ph-chart-line-up"></i></span><div><div class="stt">Live monitoring</div><div class="std">Containment, transcripts and alerts from day one, with agreed response times when you need us.</div></div></div>
    </div>
    <div class="saledivider"></div>
    <div class="mlabel">Work email</div><input type="text" value="maria.chen@northlakeauto.com">
    <div class="mlabel">Company</div><input type="text" value="Northlake Auto Insurance">
    <div class="mfoot"><button class="btn" onclick="closeModal()">Cancel</button>
    <button class="btn primary" onclick="salesDone()">Request a call</button></div>`,true);
}
function salesDone(){
  salesRequested=true; closeModal();
  toast('Request sent. We’ll be in touch within one business day.');
  if(cur===6&&curCat===null&&document.getElementById('wiz').classList.contains('on')) renderStep();
  if(document.getElementById('view-upgrade').classList.contains('on')) renderUpgrade();
}
function simulateContract(){
  bootRun(UPG_STAGES,()=>{
    enterprise=true; evalRun=false;
    document.getElementById('planlabel').textContent='Enterprise';
    document.getElementById('modebadge').textContent='Enterprise · pre-launch';
    document.getElementById('modebadge').className='badge ai';
    document.getElementById('scta').style.display='none';
    const cta=document.getElementById('gheadcta'); if(cta){cta.textContent='Go live'; cta.onclick=()=>{go(6);openWizard();};}
    if(document.getElementById('wiz').classList.contains('on')) renderStep();
    toast('Enterprise workspace ready');
  },'Ema · Upgrading your workspace');
}

/* =============== upgrade page =============== */
function renderUpgrade(){
  const el=document.getElementById('upgradebody');
  if(enterprise){
    el.innerHTML=`
    <div class="card" style="border-color:var(--purple-300);">
      <div class="ct"><i class="ph-fill ph-sparkle" style="color:var(--purple-800)"></i> You&rsquo;re on Enterprise</div>
      <div class="cs" style="margin-bottom:0;">Contract signed, data-processing agreement in force. Finish the go-live checklist from the Go live step.</div>
    </div>
    <div class="card">
      <div class="ct">Your Ema team</div>
      <div class="teamcard"><span class="tav">AK</span><div><div class="it">Asha Kumar</div><div class="is">Customer success manager</div></div></div>
      <div class="teamcard"><span class="tav">DR</span><div><div class="it">Diego Ramos</div><div class="is">Solutions architect</div></div></div>
    </div>
    <div style="margin-top:4px;"><button class="btn primary" onclick="go(6);openWizard()">Open the go-live checklist <i class="ph ph-arrow-right"></i></button></div>`;
    return;
  }
  el.innerHTML=`
  <div class="planwrap">
    <div class="plancard hl">
      <div class="phead">
        <div class="pname">Sandbox <span class="badge success" style="text-transform:none;letter-spacing:0;">You&rsquo;re here</span></div>
        <div class="pprice">Free</div>
        <div class="pnote">Build, edit and test for as long as you need</div>
      </div>
      <div class="pfeats">
        <div class="pfeat"><span class="fic"><i class="ph ph-magic-wand"></i></span>Full guided setup - categories, rules, knowledge</div>
        <div class="pfeat"><span class="fic"><i class="ph ph-flask"></i></span>Sandbox with synthetic policyholders and payments</div>
        <div class="pfeat"><span class="fic"><i class="ph ph-package"></i></span>Test suites packaged with the pack</div>
        <div class="pfeat"><span class="fic"><i class="ph ph-users"></i></span>Invite category owners, IT and compliance</div>
        <div class="pfeat"><span class="fic"><i class="ph ph-globe"></i></span>Website crawl and pre-built insurance knowledge</div>
      </div>
      <div class="pcta"><button class="btn lg" style="width:100%" onclick="setView('sandbox')">Keep testing free</button></div>
    </div>
    <div class="plancard">
      <div class="phead">
        <div class="pname purple">Enterprise <span class="badge ai" style="text-transform:none;letter-spacing:0;">To go live</span></div>
        <div class="pprice">Custom</div>
        <div class="pnote">Live traffic runs on a contract</div>
      </div>
      <div class="pfeats">
        <div class="pfeat"><span class="fic"><i class="ph ph-play"></i></span>Run the full eval suites, datasets and red team</div>
        <div class="pfeat"><span class="fic"><i class="ph ph-plugs-connected"></i></span>Production Salesforce, Guidewire and payments</div>
        <div class="pfeat"><span class="fic"><i class="ph ph-database"></i></span>Real policyholder data under a signed DPA</div>
        <div class="pfeat"><span class="fic"><i class="ph ph-scales"></i></span>Compliance sign-off, audit retention, security review</div>
        <div class="pfeat"><span class="fic"><i class="ph ph-star"></i></span>Named team and live monitoring from day one</div>
      </div>
      <div class="pcta"><button class="btn primary lg" style="width:100%" onclick="openSales()"><i class="ph ph-envelope-simple"></i> Contact sales</button></div>
    </div>
  </div>
  ${salesRequested?'<div style="margin-top:16px;padding:13px 18px;border-radius:8px;background:var(--purple-100);border:1px solid var(--purple-300);display:flex;align-items:center;gap:10px;font-size:13px;color:var(--purple-900);font-weight:500;"><i class="ph-fill ph-envelope-simple" style="font-size:17px;color:var(--purple-800)"></i> We&rsquo;ll have someone from our enterprise team reach out within one business day.</div>'+demoStrip():''}
  <div style="margin-top:40px;background:#fff;border:1px solid var(--beige-300);border-radius:12px;overflow:hidden;">
    <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:8px;padding:13px 22px;background:var(--beige-50);border-bottom:1px solid var(--beige-200);">
      <span style="font-size:11.5px;font-weight:700;color:var(--beige-800);letter-spacing:.07em;text-transform:uppercase;">Feature</span>
      <span style="font-size:11.5px;font-weight:700;color:var(--green-800);letter-spacing:.07em;text-transform:uppercase;text-align:center;">Sandbox</span>
      <span style="font-size:11.5px;font-weight:700;color:var(--purple-800);letter-spacing:.07em;text-transform:uppercase;text-align:center;">Enterprise</span>
    </div>
    <div style="padding:4px 22px 8px;">
      <div class="comprow"><span>Guided setup and editing</span><span>✓</span><span>✓</span></div>
      <div class="comprow"><span>Sandbox testing, synthetic data</span><span>✓</span><span>✓</span></div>
      <div class="comprow"><span>Packaged test suites</span><span>Included</span><span>Included</span></div>
      <div class="comprow"><span>Running evals, datasets, red team</span><span>-</span><span>✓ · metered in workflow-run units</span></div>
      <div class="comprow"><span>Production connectors</span><span>-</span><span>✓</span></div>
      <div class="comprow"><span>Real policyholder data (DPA)</span><span>-</span><span>✓</span></div>
      <div class="comprow"><span>Compliance sign-off and audit retention</span><span>-</span><span>✓</span></div>
      <div class="comprow"><span>Named team, live monitoring, SLA</span><span>-</span><span>✓</span></div>
    </div>
  </div>
  <div class="truststrip">
    <span class="titem"><i class="ph ph-shield-check"></i> SOC 2 Type II</span>
    <span class="titem"><i class="ph ph-lock-key"></i> End-to-end encryption</span>
    <span class="titem"><i class="ph ph-clock"></i> 99.9% uptime SLA</span>
    <span class="titem"><i class="ph ph-headset"></i> Human support always available</span>
  </div>
  <p style="text-align:center;margin-top:22px;font-size:12.5px;color:var(--beige-800);">Questions? <a href="mailto:sales@ema.co" style="font-weight:600;">sales@ema.co</a></p>`;
}

/* =============== home =============== */
function renderHome(){
  const st = live ? '<span class="badge success"><i class="ph-fill ph-broadcast"></i> Live</span>' : '<span class="badge warning">Draft · in setup</span>';
  const route = live ? "setView('config')" : "openWizard()";
  document.getElementById('homebody').innerHTML=`
  <div class="catrow" onclick="${route}" style="padding:18px 20px;">
    <span class="ctile" style="width:44px;height:44px;font-size:20px;"><i class="ph ph-chat-circle-text"></i></span>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:9px;"><span class="cname" style="font-size:15px;">AI Assistant</span>${st}</div>
      <div class="cmeta">Always on, AI powered contact center on chat, voice and email</div>
    </div>
    <i class="ph ph-caret-right"></i>
  </div>
  <div class="catrow" style="padding:18px 20px;opacity:.6;cursor:default;" onclick="toast('Live Agent Assist is coming soon')">
    <span class="ctile" style="width:44px;height:44px;font-size:20px;background:var(--beige-100);border-color:var(--beige-300);color:var(--fg3);"><i class="ph ph-headset"></i></span>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:9px;"><span class="cname" style="font-size:15px;">Live Agent Assist</span><span class="badge default">Coming soon</span></div>
      <div class="cmeta">Live assistance to supercharge your contact center</div>
    </div>
  </div>
  <div class="catrow" onclick="setView('builder')" style="padding:18px 20px;">
    <span class="ctile" style="width:44px;height:44px;font-size:20px;background:var(--purple-100);border-color:var(--purple-300);color:var(--purple-800);"><i class="ph ph-magic-wand"></i></span>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:9px;"><span class="cname" style="font-size:15px;">Build your own Support Agent</span><span class="badge ai">Beta</span></div>
      <div class="cmeta">Describe it in chat. Ema drafts the sections, rules and connections.</div>
    </div>
    <i class="ph ph-caret-right"></i>
  </div>
  <div style="font-size:11.5px;color:var(--fg3);margin-top:14px;">The Insurance Servicing Pack is installed: ${CATS.length} sections, ${SUITES.length} test suites, state facts for all 50 states.</div>`;
}

/* =============== assistant home tabs =============== */
let curCfgTab='overview';
function cfgTab(t){
  curCfgTab=t;
  document.querySelectorAll('#cfgtabs .tab').forEach(x=>x.classList.toggle('on',x.dataset.t===t));
  const el=document.getElementById('cfgbody');
  if(demoState==='fresh' && t!=='overview' && t!=='tests'){
    el.innerHTML='<div class="card"><div class="cs" style="margin-bottom:0;">Nothing here yet. Conversations, audit entries and metrics appear once the sandbox is used. The Load worked example pill fills this view.</div></div>';
    return;
  }
  if(t==='overview'){
    const catRows=CATS.map(c=>{
      const items=openItems(c);
      const cs=covStat(c);
      const ready=(cs.total>0&&cs.covered===cs.total)&&items===0&&!!(c.owners&&c.owners.length);
      const sigBit=(cs.covered===cs.total&&cs.total>0)?('all '+cs.total+' rules covered'):(cs.covered+' of '+cs.total+' rules covered');
      const itemBit=items?(' · '+items+' open item'+(items>1?'s':'')):'';
      return '<div class="evalrow">'+(ready?'<i class="ph-bold ph-check"></i>':'<span style="color:var(--fg3)">○</span>')+'<span>'+c.name+' - '+sigBit+itemBit+'</span></div>';
    }).join('');
    let checklist;
    if(live){
      checklist='<div class="evalrow"><i class="ph-bold ph-check"></i><span>Live on northlakeauto.com - monitoring on, alerts to your Ema team</span><span class="prog">live</span></div>';
    } else if(enterprise){
      checklist=GOLIVE.map(g=>'<div class="evalrow">'+(g.done?'<i class="ph-bold ph-check"></i>':'<span style="color:var(--fg3)">○</span>')+'<span>'+g.t+'</span><span class="prog">'+(g.done?'done':'open')+'</span></div>').join('')
        +'<div style="margin-top:10px;"><button class="btn sm primary" onclick="go(6);openWizard()">Open go-live checklist</button></div>';
    } else {
      checklist=`
      <div class="evalrow"><i class="ph-bold ph-check"></i><span>Setup, rules and knowledge configured</span><span class="prog">done</span></div>
      <div class="evalrow"><i class="ph-bold ph-check"></i><span>Test suites packaged - ${SUITES.length} suites · ${suiteTotal()} scenarios</span><span class="prog">ready</span></div>
      <div class="evalrow">${CATS.reduce((a,c)=>a+openItems(c),0)?'<span style="color:var(--fg3)">○</span>':'<i class="ph-bold ph-check"></i>'}<span>Open items - ${CATS.reduce((a,c)=>a+openItems(c),0)} across categories</span><span class="prog">view</span></div>
      <div class="evalrow"><span style="color:var(--fg3)">○</span><span>Data-processing agreement</span><span class="prog" style="color:var(--fg3)">with sales</span></div>
      <div class="evalrow"><span style="color:var(--fg3)">○</span><span>Real connections and eval runs against them</span><span class="prog" style="color:var(--fg3)">with sales</span></div>
      <div class="evalrow"><span style="color:var(--fg3)">○</span><span>Compliance sign-off on the eval report</span><span class="prog" style="color:var(--fg3)">with sales</span></div>`;
    }
    el.innerHTML=`
    <div class="card">
      <div class="ct">${live?'Status: live':(enterprise?'Status: enterprise · pre-launch':'Status: testing in the sandbox')}</div>
      <div class="cs">${live?'Customers are talking to Policy Assist right now.':(enterprise?'Contract signed - finish the checklist and go live.':'Self-serve items are done. The rest happens with our team after you contact sales.')}</div>
      ${checklist}
    </div>
    <div class="statgrid">
      <div class="stat"><div class="k">${CATS.length}</div><div class="l">categories (1 always to a person)</div></div>
      <div class="stat"><div class="k">${WSRULES.length+CATS.reduce((a,c)=>a+c.rules.length,0)}</div><div class="l">rules (${WSRULES.length} universal, ${CATS.reduce((a,c)=>a+c.rules.length,0)} category)</div></div>
      <div class="stat"><div class="k">${DOCS.length+Object.keys(KSETS).length}</div><div class="l">knowledge sources</div></div>
      <div class="stat"><div class="k">${suiteTotal()}</div><div class="l">test scenarios packaged</div></div>
    </div>
    <div class="card">
      <div class="ct">Go-live readiness by category</div>
      <div class="cs">Owners keep their categories covered with SOPs. Compliance reviews the eval report before go-live.</div>
      ${catRows}
    </div>`;
  }
  if(t==='transcripts'){
    el.innerHTML=`
    <div class="card">
      <div class="ct">Sandbox conversations</div>
      <div class="cs">Last 5 of 312. Open one to read the transcript and the rules that fired.</div>
      <table class="simple"><tr><th>When</th><th>Category</th><th>Asked about</th><th>Outcome</th><th>Rules fired</th></tr>
      <tr><td>Today 14:22</td><td>Billing &amp; payments</td><td>Pay my bill</td><td><span class="tag g">Resolved</span></td><td>identity gate, payment link</td></tr>
      <tr><td>Today 14:20</td><td>Claim status</td><td>Claim status</td><td><span class="tag g">Resolved</span></td><td>identity gate, no-date-promise</td></tr>
      <tr><td>Today 13:57</td><td>Policy changes</td><td>Add a car</td><td><span class="tag a">Assisted → Producer queue</span></td><td>licensed act, never-covered</td></tr>
      <tr><td>Today 13:41</td><td>Coverage questions</td><td>What does the plan cover</td><td><span class="tag g">Resolved</span></td><td>general-knowledge label</td></tr>
      <tr><td>Today 11:16</td><td>Claim status</td><td>Adjuster notes</td><td><span class="tag r">Declined → routed</span></td><td>never-disclose list</td></tr></table>
    </div>`;
  }
  if(t==='tests'){
    el.innerHTML=(enterprise?'':'<div class="card" style="border-color:var(--purple-300);background:var(--purple-100);"><div class="cs" style="margin-bottom:0;"><i class="ph-fill ph-lock-simple" style="color:var(--purple-800)"></i> Runs unlock with your contract. <a href="javascript:void(0)" onclick="setView(\'upgrade\')" style="font-weight:700;">See what unlocks</a></div></div>')
      +SUITES.map(s=>suiteCardHtml(s)).join('');
  }
  if(t==='audit'){
    el.innerHTML=`
    <div class="card">
      <div class="ct">Audit trail</div>
      <table class="simple"><tr><th>When</th><th>Who</th><th>Event</th></tr>
      <tr><td>Today 14:22</td><td>Jordan Reyes (sandbox)</td><td>Payment simulated - $132.40, ref NLP-99031</td></tr>
      <tr><td>Today 14:21</td><td>Jordan Reyes (sandbox)</td><td>Identity verified - policy match + passcode</td></tr>
      <tr><td>Today 11:04</td><td>maria.chen</td><td>Rule added to Claim status: no repair-date promises · suite 24 → 26</td></tr>
      <tr><td>Today 11:02</td><td>maria.chen</td><td>2 rules extracted from billing_and_disputes_SOP_v3.docx into Billing &amp; payments</td></tr>
      <tr><td>Today 10:58</td><td>maria.chen</td><td>Coverage conflict resolved: grace period - kept Ema&rsquo;s rule</td></tr>
      <tr><td>Today 10:12</td><td>system</td><td>Open item raised on Billing &amp; payments: SOP p.9 conflicts with the website FAQ</td></tr>
      <tr><td>2 Aug</td><td>r.patel</td><td>Uploaded billing_and_disputes_SOP_v3.docx - 3 rules covered, 2 new rules extracted</td></tr>
      <tr><td>29 Jul</td><td>r.patel</td><td>Joined · category owner · Billing &amp; payments only</td></tr>
      <tr><td>28 Jul</td><td>maria.chen</td><td>Invited r.patel as category owner · Billing &amp; payments only</td></tr>
      <tr><td>27 Jul</td><td>system</td><td>Insurance Servicing Pack installed · ${SUITES.length} suites packaged</td></tr></table>
    </div>`;
  }
  if(t==='metrics'){
    el.innerHTML=`
    <div class="statgrid">
      <div class="stat"><div class="k">312</div><div class="l">conversations (sandbox)</div></div>
      <div class="stat"><div class="k">78%</div><div class="l">resolved without a person</div></div>
      <div class="stat"><div class="k">22%</div><div class="l">handed off with context</div></div>
      <div class="stat"><div class="k">0</div><div class="l">rule violations</div></div>
    </div>
    <div class="card"><div class="ct">What customers asked about</div>
    <table class="simple"><tr><th>Category</th><th>Share</th><th>Mostly ends as</th></tr>
    <tr><td>Billing &amp; payments</td><td>41%</td><td>resolved</td></tr>
    <tr><td>Claim status</td><td>27%</td><td>resolved</td></tr>
    <tr><td>Coverage questions</td><td>19%</td><td>resolved</td></tr>
    <tr><td>Policy changes &amp; advice</td><td>13%</td><td>handed to the producer queue</td></tr></table></div>`;
  }
}

/* =============== sandbox =============== */
let sbVerified=false;
const SBQ=[["Reschedule my replacement car dropoff - I’m not home","resched"],["What’s my deductible?","ded"],["Where is my claim?","claim"],["I want to pay my bill","pay"],["Add my new car to my policy","car"]];
function greetText(){
  if(welcomeMsg!==WELCOME_DEFAULT) return esc(welcomeMsg);
  if(tone==='neutral') return 'I can help with billing, ID cards, and claim status. Coverage changes go to a licensed agent.';
  if(tone==='formal') return 'Good day. I can assist with billing, ID cards, and claim status. A licensed agent handles coverage changes.';
  return WELCOME_DEFAULT;
}
function sandboxOpen(){
  const lbl=document.getElementById('sbbacklbl');
  if(lbl) lbl.textContent = sandboxFromSetup ? 'Back to setup' : 'Back to Policy Assist';
  const log=document.getElementById('sblog');
  if(dirty){
    document.getElementById('sbq').innerHTML='';
    log.innerHTML=`<div class="bub sys" style="text-align:left;">
      <div class="lline show" style="font-weight:600;color:var(--fg1)">Applying your latest changes…</div>
      <div class="lline" id="sl1">Rules synced</div>
      <div class="lline" id="sl2">Knowledge synced</div>
      <div class="lline" id="sl3">Categories and destinations synced</div></div>`;
    setTimeout(()=>{const e=document.getElementById('sl1');if(e)e.classList.add('show');},400);
    setTimeout(()=>{const e=document.getElementById('sl2');if(e)e.classList.add('show');},900);
    setTimeout(()=>{const e=document.getElementById('sl3');if(e)e.classList.add('show');},1400);
    setTimeout(()=>{dirty=false; const d=document.getElementById('testdot'); if(d)d.classList.add('ok'); sbInit();},2000);
  } else sbInit();
}
function sbInit(){
  const log=document.getElementById('sblog');
  log.innerHTML='<div class="bub bot">'+greetText()+'</div>';
  const q=document.getElementById('sbq'); q.innerHTML='';
  SBQ.forEach(x=>{const b=document.createElement('span'); b.className='qbtn'; b.textContent=x[0];
    b.onclick=()=>sbAsk(x[1],x[0]); q.appendChild(b);});
}
function sbPush(html,cls){const log=document.getElementById('sblog');log.insertAdjacentHTML('beforeend','<div class="bub '+cls+'">'+html+'</div>');log.scrollTop=log.scrollHeight;}
function sbVerify(cb){
  sbPush("To share anything about your policy I first need to confirm it’s you. What’s your policy number and date of birth?","bot");
  setTimeout(()=>{sbPush("NL-4821, March 14 1991","usr");
    setTimeout(()=>{sbPush("Thanks Jordan. I’ve sent a passcode to the phone ending 4407.","bot");
      sbPush("Sandbox filled the passcode in for you: 882140 ✓ Identity verified","sys");
      sbVerified=true; cb();},600);},600);
}
function sbAsk(kind,label){
  sbPush(label,"usr");
  const answers={
    ded:()=>sbPush("Your collision deductible is <b>$500</b>, per your declarations page (NL-4821, 2023 Toyota Camry). Comprehensive is $250. Anything else on your coverage? <i>[cited: northlake_auto_policy_TC_2026.pdf]</i>","bot"),
    claim:()=>sbPush("Claim <b>CLM-2287</b> is at <b>estimate approved</b>. Your adjuster is Dana Whitfield. The shop’s current estimate is next Friday, and that can change - want status updates by text? <i>[rule: never promise a repair date]</i>","bot"),
    pay:()=>{sbPush(TONEPREV[tone]+" Here is your secure payment link:","bot");
      sbPush('<button class="btn primary sm" onclick="openPay()">Pay $132.40 →</button>',"bot");},
    resched:()=>{
      sbPush("Your replacement car dropoff is <b>Tuesday 2pm</b> with AutoLend, on claim CLM-2287.","bot");
      sbPush("Connection · read: appointment record","sys");
      setTimeout(()=>{
        sbPush("Your plan allows two reschedules with 24 hours&rsquo; notice, and you&rsquo;ve used none. I can offer <b>Wednesday 10-12</b> or <b>Thursday 2-4</b>.","bot");
        sbPush("Knowledge · claims SOP p.8: reschedules allowed twice, 24h notice","sys");
        setTimeout(()=>{sbPush("Thursday 2-4 works","usr");
          setTimeout(()=>{
            sbPush("Done - moved to <b>Thursday 2-4pm</b>. AutoLend is confirmed and a text is on its way. <i>[rule: chat-completable within entitlement]</i>","bot");
            sbPush("Connection · write: reschedule confirmed · logged on the claim","sys");
          },900);},900);},1100);
    },
    car:()=>{sbPush("Adding a vehicle needs a licensed agent - I’ll collect the details for them. What’s the VIN, purchase date, main driver, and where the car is parked overnight?","bot");
      setTimeout(()=>{sbPush("VIN 4T1G11AK5PU034821, bought Saturday, me, home garage","usr");
        setTimeout(()=>{sbPush("That’s a <b>2023 Toyota Camry</b> (VIN decoded). I’ve filed request <b>#00413</b> to our licensed producer team with your details and this conversation attached - they’ll confirm once it’s final. Until then I can’t say the car is covered. <i>[rule: never “covered” before final]</i>","bot");
          sbPush("Case created in Salesforce · Producer queue · logs as an assisted resolution","sys");},900);},900);}
  };
  if(kind==='ded'||kind==='claim'||kind==='pay'||kind==='resched'){
    if(!sbVerified){sbVerify(answers[kind]);} else {answers[kind]();}
  } else answers[kind]();
}
function sbSend(){
  const inp=document.getElementById('sbin'); if(!inp.value.trim())return;
  sbPush(esc(inp.value),"usr");
  sbPush("In general terms, I’d answer that from Northlake’s plan documents with a citation. For anything about your own policy, I’d verify your identity first. (Sandbox canned reply)","bot");
  inp.value='';
}
function openPay(){document.getElementById('paypage').classList.add('on');}
function payDone(){
  document.getElementById('paypage').classList.remove('on');
  sbPush("Payment received - reference <b>NLP-99031</b>. A receipt is on its way to your email. Want me to set up autopay?","bot");
  sbPush("Synthetic payment confirmed - production uses your payment provider","sys");
}

/* =============== init =============== */
applyFreshSeeds();
sbInit();
