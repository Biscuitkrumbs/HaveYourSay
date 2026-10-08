(() => {
  'use strict';
  const VALUES = [
    {id:'fun',name:'Fun',description:'Enjoying banter and laughter.'},
    {id:'teamwork',name:'Teamwork',description:'Under one roof, working together.'},
    {id:'integrity',name:'Integrity',description:'Being a respectful, open and honest team.'},
    {id:'recognition',name:'Recognition',description:'Together acknowledging efforts and achievements.'},
    {id:'innovation',name:'Innovation',description:'Taking ownership and being open to find better ways.'}
  ];
  const $ = id => document.getElementById(id);
  const config = window.AWARDS_CONFIG;
  const preview = config.preview === true;
  const key = preview ? 'values-awards-preview-v1' : 'values-awards-v1';
  const blank = () => Object.fromEntries(VALUES.map(v=>[v.id,{name:'',reason:''}]));
  let state = {voterId:crypto.randomUUID(),voterName:'',answers:blank(),savedAt:null,campaign:null};
  let storageOK = true, busy = false, current = 0, ready = preview, closed = false;
  try {const stored=JSON.parse(localStorage.getItem(key));if(stored && /^[\w-]{36}$/.test(stored.voterId)){state={...state,...stored,answers:blank()};for(const v of VALUES){state.answers[v.id]={name:String(stored.answers?.[v.id]?.name||'').slice(0,100),reason:String(stored.answers?.[v.id]?.reason||'').slice(0,1500)};}}}catch{storageOK=false;}
  state.voterName=String(state.voterName||'').slice(0,100);
  $('voter-name').value=state.voterName;
  $('voter-name').addEventListener('input',()=>{state.voterName=$('voter-name').value;persist();});
  const order=[...VALUES];
  for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  function persist(){try{localStorage.setItem(key,JSON.stringify(state));}catch{storageOK=false;} $('draft-status').textContent=storageOK?'Draft remembered on this browser. Submit to save your votes.':'This browser cannot remember your draft. Keep this page open until you submit.';}
  function notice(text){$('notice').hidden=!text;$('notice').textContent=text;}
  function show(id){document.querySelectorAll('.screen').forEach(s=>s.hidden=s.id!==id);$('steps').hidden=id!=='voting';window.scrollTo({top:0,behavior:'auto'});}
  function marks(){for(const b of $('steps').children){const v=order[Number(b.dataset.index)];b.classList.toggle('filled',!!state.answers[v.id].name.trim());b.querySelector('.mark').textContent=state.answers[v.id].name.trim()?'✓':'';if(Number(b.dataset.index)===current)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}}
  function visit(index){if(busy)return;current=index;const value=order[current];$('value-title').textContent=value.name;$('value-description').textContent=value.description;$('step-label').textContent=`OUR VALUES · ${current+1} OF 5`;$('nominee').value=state.answers[value.id].name;$('reason').value=state.answers[value.id].reason;$('next').textContent=current===4?'Submit my votes':'Next value →';$('submit-early').hidden=current===4;$('error').hidden=true;marks();persist();show('voting');$('value-title').focus({preventScroll:true});}
  for(const [i,v] of order.entries()){const b=document.createElement('button');b.className='step';b.dataset.index=i;b.setAttribute('aria-label',`Go to ${v.name}`);const t=document.createElement('span');t.className='track';const m=document.createElement('span');m.className='mark';b.append(t,document.createTextNode(v.name),m);b.addEventListener('click',()=>visit(i));$('steps').append(b);}
  function collect(){state.answers[order[current].id]={name:$('nominee').value,reason:$('reason').value};persist();marks();}
  $('nominee').addEventListener('input',collect);$('reason').addEventListener('input',collect);
  $('home').addEventListener('click',e=>{e.preventDefault();if(!busy)show('welcome');});
  $('start').addEventListener('click',()=>visit(0));$('back').addEventListener('click',()=>current?visit(current-1):show('welcome'));
  $('next').addEventListener('click',()=>current<4?visit(current+1):submit());$('submit-early').addEventListener('click',submit);$('update').addEventListener('click',()=>visit(0));
  function setBusy(value){busy=value;document.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=value);$('next').textContent=value?'Saving…':current===4?'Submit my votes':'Next value →';}
  function finish(){show('complete');$('completion-title').textContent=preview?'Your preview is complete.':'Your votes are in.';$('save-time').textContent=preview?'No votes were sent. This is a preview of the finished experience.':'Saved successfully. You can return on this browser to update your votes until voting closes.';$('start').textContent='Update my nominations →';if(!matchMedia('(prefers-reduced-motion: reduce)').matches){$('confetti').replaceChildren();for(let i=0;i<30;i++){const p=document.createElement('span');p.className='confetti-piece';p.style.left=`${Math.random()*100}%`;p.style.animationDelay=`${Math.random()*.45}s`;p.style.background=['#78955d','#c1ce9d','#c7ac69','#42634c'][i%4];$('confetti').append(p);}setTimeout(()=>$('confetti').replaceChildren(),2600);}}
  async function request(body){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);try{const r=await fetch(config.apiUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),signal:controller.signal,redirect:'follow'});if(!r.ok)throw Error('The connection failed. Please try again.');const result=await r.json();if(!result.ok)throw Error(result.error||'Your votes could not be saved.');return result;}finally{clearTimeout(timer);}}
  async function submit(){if(busy)return;collect();$('error').hidden=true;const answers=Object.fromEntries(VALUES.map(v=>[v.id,{name:state.answers[v.id].name.trim(),reason:state.answers[v.id].reason.trim()}]));const incomplete=VALUES.find(v=>answers[v.id].name&&!answers[v.id].reason||!answers[v.id].name&&answers[v.id].reason);if(incomplete){visit(order.findIndex(v=>v.id===incomplete.id));$('error').textContent='Please add both a name and a short reason, or leave both fields blank to skip this value.';$('error').hidden=false;return;}if(!state.savedAt&&!VALUES.some(v=>answers[v.id].name)){$('error').textContent='Please nominate someone for at least one value before submitting.';$('error').hidden=false;return;}if(!ready||closed){$('error').textContent=closed?'Voting is closed.':'The voting connection is not ready. Please reload and try again. Your draft stays on this browser.';$('error').hidden=false;return;}
    setBusy(true);try{if(preview){state.savedAt=new Date().toISOString();}else{const result=await request({action:'save',campaign:state.campaign,voterId:state.voterId,voterName:state.voterName.trim(),answers});state.savedAt=result.savedAt;}state.answers=answers;persist();finish();}catch(e){$('error').textContent=e.name==='AbortError'?'We could not confirm your save. Your draft is safe here; try submitting again.':e.message;$('error').hidden=false;}finally{setBusy(false);}}
  async function connect(){if(preview){$('mode-banner').hidden=false;return;}if(!config.apiUrl){notice('Voting is being prepared. Please check back soon.');$('start').disabled=true;return;}notice('Connecting to voting…');$('start').disabled=true;try{const r=await request({action:'status'});if(state.campaign!==r.campaign){state={voterId:crypto.randomUUID(),voterName:'',answers:blank(),savedAt:null,campaign:r.campaign};$('voter-name').value='';persist();}ready=true;closed=!r.open;$('start').disabled=closed;notice(closed?'Voting has closed. Thank you for taking part.':'');if(r.hasVotes){$('participation').textContent='The team is sharing nominations. Add your voice.';$('participation').classList.add('active');}}catch{notice('We couldn’t connect to voting. Please reload to try again.');}if(state.savedAt)$('start').textContent='Update my nominations →';}
  if(config.testing&&!preview){$('mode-banner').textContent='Test voting · Nominations are saved to the awards test round.';$('mode-banner').hidden=false;}
  persist();if(state.savedAt)$('start').textContent='Update my nominations →';connect();
})();
