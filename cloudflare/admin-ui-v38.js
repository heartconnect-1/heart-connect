import {adminHtml as adminHtmlV37} from './admin-ui-v37.js';

export function adminHtml(version){
  const upgrade=`<style>
/* v38: enterprise reliability, recovery, simulation and provider readiness */
.hc38-enhance{display:grid;gap:14px}
.hc38-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}
.hc38-card{border:1px solid #ffffff10;background:linear-gradient(180deg,#111824,#0a1018);border-radius:15px;padding:12px;min-height:92px}
.hc38-card small{display:block;color:#7d899c;font-size:8px;text-transform:uppercase;letter-spacing:.09em}
.hc38-card strong{display:block;font-size:21px;margin-top:7px}
.hc38-card span{display:block;color:#7b899c;font-size:8px;line-height:1.4;margin-top:4px}
.hc38-panel{border:1px solid #ffffff11;background:linear-gradient(180deg,#0f161f,#090f16);border-radius:18px;padding:16px}
.hc38-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}
.hc38-head h3{margin:0;font-size:14px}.hc38-head p{margin:4px 0 0;color:#7f8c9f;font-size:9px;line-height:1.5}
.hc38-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
.hc38-btn{border:1px solid #ffffff17;background:#09101a;color:#f4f6fb;border-radius:10px;padding:9px 11px;font-size:9px;font-weight:850;cursor:pointer}
.hc38-btn.primary{border-color:transparent;background:linear-gradient(135deg,#e83f72,#8158f3)}
.hc38-btn.warn{border-color:#ffc86138;color:#ffd48d;background:#ffc8610d}
.hc38-btn.danger{border-color:#ff657b38;color:#ff9dad;background:#ff657b0d}
.hc38-btn.good{border-color:#43d39938;color:#8cf0c2;background:#43d3990d}
.hc38-btn:disabled{opacity:.45;cursor:not-allowed}
.hc38-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid #ffffff11;background:#08101a;border-radius:999px;padding:5px 8px;color:#95a3b6;font-size:8px;font-weight:850}
.hc38-pill.good{color:#77e7b3;border-color:#43d3992e}.hc38-pill.warn{color:#ffd37e;border-color:#ffc8612e}.hc38-pill.bad{color:#ff9eae;border-color:#ff657b2e}.hc38-pill.purple{color:#c7baff;border-color:#8d63ff32}
.hc38-incidents{display:grid;gap:7px}
.hc38-incident{border:1px solid #ffc86122;background:#ffc86108;border-radius:11px;padding:9px 10px;color:#d9bc82;font-size:9px;line-height:1.45}
.hc38-incident.high{border-color:#ff657b28;background:#ff657b09;color:#ff9dad}
.hc38-grid2{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(330px,.9fr);gap:12px}
.hc38-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
.hc38-stat{border:1px solid #ffffff0f;background:#080e16;border-radius:12px;padding:10px}
.hc38-stat small{display:block;color:#758397;font-size:8px}.hc38-stat b{display:block;font-size:15px;margin-top:5px}.hc38-stat span{display:block;color:#7c899c;font-size:8px;margin-top:3px}
.hc38-table{display:grid;gap:7px}
.hc38-row{display:grid;grid-template-columns:26px minmax(180px,1.4fr) repeat(4,minmax(90px,.6fr));gap:8px;align-items:center;border:1px solid #ffffff0e;background:#080e16;border-radius:11px;padding:9px}
.hc38-row b{font-size:9px}.hc38-row small{display:block;color:#768397;font-size:8px;margin-top:3px}.hc38-row span{font-size:8px;color:#94a1b3}
.hc38-row input{accent-color:#8d63ff}
.hc38-form{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:8px;align-items:end}
.hc38-field{display:grid;gap:5px}.hc38-field span{font-size:8px;color:#7b899b;text-transform:uppercase;letter-spacing:.08em}
.hc38-field select,.hc38-field input{width:100%;box-sizing:border-box;border:1px solid #ffffff14;background:#070c13;color:#f4f6fb;border-radius:10px;padding:10px;font-size:9px}
.hc38-result{margin-top:9px;border:1px solid #8d63ff22;background:#8d63ff08;border-radius:11px;padding:10px;color:#b7c0cf;font-size:9px;line-height:1.55}
.hc38-providers{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.hc38-provider{border:1px solid #ffffff0f;background:#080e16;border-radius:12px;padding:10px}.hc38-provider b{display:block;font-size:9px}.hc38-provider small{display:block;color:#788699;font-size:8px;line-height:1.45;margin-top:4px}
.hc38-empty{border:1px dashed #ffffff16;border-radius:12px;padding:20px;text-align:center;color:#8190a3;font-size:9px}
.hc38-note{border:1px solid #ffffff0f;background:#080e16;border-radius:11px;padding:9px;color:#8592a5;font-size:8px;line-height:1.5}
@media(max-width:1300px){.hc38-strip{grid-template-columns:repeat(3,1fr)}.hc38-providers{grid-template-columns:repeat(2,1fr)}}
@media(max-width:900px){.hc38-grid2,.hc38-form{grid-template-columns:1fr}.hc38-row{grid-template-columns:26px minmax(170px,1fr) repeat(2,90px)}.hc38-row>*:nth-child(5),.hc38-row>*:nth-child(6){display:none}}
@media(max-width:650px){.hc38-strip,.hc38-grid3,.hc38-providers{grid-template-columns:1fr}}
</style><script>
(()=>{
  let ent=null,campaigns=[],busy=false,lastMounted=null;
  const q=s=>document.querySelector(s);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  async function get(url){const r=await fetch(url,{credentials:'same-origin',headers:{accept:'application/json'}});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'Request failed');return d}
  async function post(url,b){const r=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify(b)});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Object.assign(new Error(d.error||'Request failed'),{data:d,status:r.status});return d}
  function pill(t,c=''){return '<span class="hc38-pill '+c+'">'+esc(t)+'</span>'}
  function card(l,v,n){return '<div class="hc38-card"><small>'+esc(l)+'</small><strong>'+esc(v)+'</strong><span>'+esc(n||'')+'</span></div>'}
  function fmt(v){if(!v)return 'not recorded';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString()}
  function agoMin(v){const x=Number(v);if(!Number.isFinite(x))return 'unknown';if(x<1)return '<1 min';if(x<60)return Math.round(x)+' min';return (x/60).toFixed(1)+' h'}
  function provider(name,x){return '<div class="hc38-provider"><div class="hc38-actions">'+pill(x?.ready?'ready':'not connected',x?.ready?'good':'warn')+'</div><b style="margin-top:7px">'+esc(name)+'</b><small>'+esc(x?.label||'Provider not configured')+'</small></div>'}
  function incidentBox(){const rows=ent?.incidents||[];if(!rows.length)return '<div class="hc38-incident" style="border-color:#43d39925;background:#43d39908;color:#85eabc">No automation incidents detected in the current operational window.</div>';return '<div class="hc38-incidents">'+rows.map(x=>'<div class="hc38-incident '+(x.severity==='high'?'high':'')+'"><b>'+esc(String(x.severity||'info').toUpperCase())+' · '+esc(String(x.code||'incident').replaceAll('_',' '))+'</b><br>'+esc(x.message||'')+'</div>').join('')+'</div>'}
  function aiStats(){const a24=ent?.ai?.last24h||{},a7=ent?.ai?.last7d||{},tasks=a7.tasks||{};const taskText=Object.entries(tasks).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>String(k).replaceAll('_',' ')+' '+v).join(' · ')||'No AI usage yet';return '<div class="hc38-grid3">'+
    '<div class="hc38-stat"><small>AI requests · 24h</small><b>'+esc(a24.requests??0)+'</b><span>'+esc(a24.successRate??100)+'% successful</span></div>'+
    '<div class="hc38-stat"><small>AI requests · 7d</small><b>'+esc(a7.requests??0)+'</b><span>'+esc(a7.failed??0)+' failed · '+esc(a7.unavailable??0)+' unavailable</span></div>'+
    '<div class="hc38-stat"><small>Context rows · 7d</small><b>'+esc(a7.contextRows??0)+'</b><span>'+esc(a7.outputChars??0)+' output characters</span></div>'+
    '</div><div class="hc38-note" style="margin-top:8px"><b>Top AI tasks:</b> '+esc(taskText)+(ent?.ai?.model?'<br><b>Recent model:</b> '+esc(ent.ai.model):'')+'</div>'}
  function reliabilityStats(){const r24=ent?.runs?.last24h||{},r7=ent?.runs?.last7d||{};return '<div class="hc38-grid3">'+
    '<div class="hc38-stat"><small>24h run health</small><b>'+esc(r24.health??100)+'%</b><span>'+esc(r24.runs??0)+' runs · '+esc(r24.failed??0)+' failed</span></div>'+
    '<div class="hc38-stat"><small>7d run health</small><b>'+esc(r7.health??100)+'%</b><span>'+esc(r7.runs??0)+' evidence rows loaded</span></div>'+
    '<div class="hc38-stat"><small>24h delivery success</small><b>'+esc(r24.deliverySuccess??100)+'%</b><span>'+esc(r24.success??0)+' success · '+esc(r24.failedItems??0)+' failed items</span></div>'+
    '</div>'}
  function failedRows(){const rows=ent?.failedDeliveries||[];if(!rows.length)return '<div class="hc38-empty"><b>No failed native deliveries</b><br>The recovery queue is clear.</div>';return '<div class="hc38-table">'+rows.slice(0,25).map(x=>'<label class="hc38-row"><input type="checkbox" data-hc38-retry="'+esc(x.id)+'"><div><b>'+esc(x.campaignTitle||'Campaign')+'</b><small>'+esc(x.error_code||'delivery_failed')+'</small></div><span>'+esc(x.deadLetter?'dead letter':'retryable')+'</span><span>attempt '+esc(x.attempt_count??0)+'</span><span>'+esc(fmt(x.updated_at))+'</span><span>'+esc(x.campaignStatus||'')+'</span></label>').join('')+'</div>'}
  function simulationOptions(){return '<option value="">Select notification campaign</option>'+campaigns.filter(x=>x && x.id).map(x=>'<option value="'+esc(x.id)+'">'+esc((x.title||'Untitled')+' · '+(x.status||'draft'))+'</option>').join('')}
  function makeEnterprise(){
    const qv=ent?.queue||{},cr=ent?.cron||{},score=ent?.score??0;
    const wrap=document.createElement('div');wrap.className='hc38-enhance';wrap.dataset.hc38='1';
    wrap.innerHTML='<div class="hc38-strip">'+
      card('System health',score+'%',(ent?.incidents||[]).length+' active signal(s)')+
      card('Cron monitor',cr.healthy?'Healthy':'Attention', 'scheduler '+agoMin(cr.scheduler?.ageMinutes)+' · delivery '+agoMin(cr.delivery?.ageMinutes))+
      card('Dead letters',qv.deadLetters??0,'retry budget exhausted')+
      card('Queue state',(qv.queued??0)+' queued',(qv.sending??0)+' sending · '+(qv.failed??0)+' failed')+
      card('24h automation',ent?.runs?.last24h?.runs??0,(ent?.runs?.last24h?.health??100)+'% healthy')+
      card('24h AI',ent?.ai?.last24h?.requests??0,(ent?.ai?.last24h?.successRate??100)+'% successful')+
      '</div><section class="hc38-panel"><div class="hc38-head"><div><h3>Reliability intelligence</h3><p>24-hour and 7-day automation health, cron freshness and automatically derived incident signals.</p></div>'+pill('v38 enterprise','purple')+'</div>'+incidentBox()+'<div style="margin-top:10px">'+reliabilityStats()+'</div></section>'+
      '<div class="hc38-grid2"><section class="hc38-panel"><div class="hc38-head"><div><h3>Recovery & dead-letter queue</h3><p>Inspect failed native deliveries and requeue a bounded set through the normal idempotent delivery worker.</p></div><div class="hc38-actions"><button class="hc38-btn" id="hc38SelectAll" type="button">Select failed</button><button class="hc38-btn warn" id="hc38Retry" type="button">Retry selected</button></div></div>'+failedRows()+'<div class="hc38-note" style="margin-top:9px">Recovery is capped at 25 items per request. Requeueing is not proof of delivery; the native worker still records the actual result.</div></section>'+
      '<section class="hc38-panel"><div class="hc38-head"><div><h3>Campaign dry-run simulator</h3><p>Estimate the current audience before queueing. This is read-only and creates no delivery rows.</p></div></div><div class="hc38-form"><label class="hc38-field"><span>Campaign</span><select id="hc38Campaign">'+simulationOptions()+'</select></label><button class="hc38-btn primary" id="hc38DryRun" type="button">Simulate audience</button></div><div id="hc38DryResult" class="hc38-result">Select a campaign to preview the estimated recipient count and configured delivery cap.</div><div class="hc38-head" style="margin-top:14px"><div><h3>Emergency automation control</h3><p>Owner-only global pause leaves the website online while stopping the native scheduler and delivery pipeline.</p></div></div><div class="hc38-actions">'+(ent?.ownerOnlyControls?'<button class="hc38-btn danger" id="hc38PauseAll" type="button">Pause all automation</button><button class="hc38-btn good" id="hc38ResumeAll" type="button">Resume all automation</button>':pill('Owner permission required','warn'))+'</div></section></div>'+
      '<div class="hc38-grid2"><section class="hc38-panel"><div class="hc38-head"><div><h3>AI usage analytics</h3><p>Operational AI usage, success rate, context volume and task distribution. No prompt or sensitive source content is displayed here.</p></div>'+pill(ent?.ai?.model||'Workers AI','purple')+'</div>'+aiStats()+'</section>'+
      '<section class="hc38-panel"><div class="hc38-head"><div><h3>Provider readiness center</h3><p>Live connectivity boundary for automation channels and supporting services.</p></div></div><div class="hc38-providers">'+
        provider('In-app',ent?.providers?.inApp)+provider('Workers AI',ent?.providers?.workersAI)+provider('Email',ent?.providers?.email)+provider('Push',ent?.providers?.push)+provider('SMS',ent?.providers?.sms)+provider('WhatsApp',ent?.providers?.whatsapp)+provider('Social',ent?.providers?.social)+
      '</div></section></div>';
    return wrap
  }
  async function refreshEnterprise(){
    if(busy)return;busy=true;
    try{
      const out=await Promise.all([get('/api/admin/automation/enterprise-status'),get('/api/admin/notifications/campaigns').catch(()=>({items:[]}))]);
      ent=out[0];campaigns=Array.isArray(out[1]?.items)?out[1].items:[];
      mount()
    }catch(e){const root=q('.hc37');if(root&&!q('[data-hc38-error]')){const x=document.createElement('div');x.dataset.hc38Error='1';x.className='hc38-panel';x.innerHTML='<b>Enterprise automation intelligence unavailable</b><div class="hc38-note" style="margin-top:8px">'+esc(e.message)+'</div>';root.prepend(x)}}finally{busy=false}
  }
  function mount(){
    const root=q('.hc37');if(!root||!ent)return;
    root.querySelectorAll('[data-hc38],[data-hc38-error]').forEach(x=>x.remove());
    const enh=makeEnterprise(),hero=root.querySelector('.hc37-hero');if(hero&&hero.parentNode){hero.insertAdjacentElement('afterend',enh)}else root.prepend(enh);
    wire();lastMounted=Date.now()
  }
  function wire(){
    const all=q('#hc38SelectAll');if(all)all.onclick=()=>document.querySelectorAll('[data-hc38-retry]').forEach(x=>x.checked=true);
    const retry=q('#hc38Retry');if(retry)retry.onclick=retrySelected;
    const dry=q('#hc38DryRun');if(dry)dry.onclick=dryRun;
    const pause=q('#hc38PauseAll');if(pause)pause.onclick=()=>controlAll('pause');
    const resume=q('#hc38ResumeAll');if(resume)resume.onclick=()=>controlAll('resume')
  }
  async function dryRun(){const sel=q('#hc38Campaign'),box=q('#hc38DryResult'),id=sel?.value;if(!id){box.textContent='Choose a campaign first.';return}const btn=q('#hc38DryRun');btn.disabled=true;box.textContent='Calculating current audience...';try{const d=await post('/api/admin/automation/dry-run',{campaignId:id});box.innerHTML='<b>'+esc(d.campaign?.title||'Campaign')+'</b><br>Estimated recipients: <b>'+esc(d.estimatedRecipients)+'</b> · Will queue this cycle: <b>'+esc(d.willQueue)+'</b> · Max per campaign: '+esc(d.maxRecipientsPerCampaign)+(d.limited?' · <b>cap reached</b>':'')+'<br>Audience: '+esc(String(d.audienceType||'all').replaceAll('_',' '))+' · Status: '+esc(d.campaign?.status||'')+'<br><span style="color:#7f8da1">'+esc(d.note||'')+'</span>'}catch(e){box.textContent=e.message}finally{btn.disabled=false}}
  async function retrySelected(){const ids=[...document.querySelectorAll('[data-hc38-retry]:checked')].map(x=>x.dataset.hc38Retry);if(!ids.length){alert('Select at least one failed delivery.');return}const reason=(prompt('Recovery reason:')||'').trim();if(reason.length<3)return;if((prompt('Type RETRY to requeue '+ids.length+' failed delivery item(s):')||'').trim()!=='RETRY')return;const btn=q('#hc38Retry');btn.disabled=true;try{const d=await post('/api/admin/automation/retry-failed',{ids,reason,confirmation:'RETRY'});alert('Requeued '+d.requeued+' item(s). '+d.skipped+' skipped.');await refreshEnterprise()}catch(e){alert(e.message)}finally{if(btn)btn.disabled=false}}
  async function controlAll(action){const pausing=action==='pause',expected=pausing?'PAUSE ALL':'RESUME ALL',reason=(prompt((pausing?'Pause':'Resume')+' reason:')||'').trim();if(reason.length<3)return;if((prompt('Type '+expected+' to continue:')||'').trim()!==expected)return;try{const d=await post('/api/admin/automation/control-all',{action,reason,confirmation:expected});alert(d.note||'Automation control updated.');await refreshEnterprise();setTimeout(()=>{const b=q('#hc37Refresh');if(b)b.click()},200)}catch(e){alert(e.message)}}
  function should(){const t=q('#title'),root=q('.hc37');return t&&root&&t.textContent.trim()==='Automation & AI'}
  function maybe(){if(!should())return;const mounted=q('[data-hc38]');if(!mounted)refreshEnterprise()}
  new MutationObserver(()=>setTimeout(maybe,0)).observe(document.body,{childList:true,subtree:true,characterData:true});
  setInterval(()=>{if(should()&&(!lastMounted||Date.now()-lastMounted>45000))refreshEnterprise()},45000);
  setTimeout(maybe,200);setTimeout(maybe,900);
})();
</script>`;
  return adminHtmlV37(version).replace('</body>',upgrade+'</body>');
}
