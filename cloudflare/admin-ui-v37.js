import {adminHtml as adminHtmlV36} from './admin-ui-v36.js';

export function adminHtml(version){
  const upgrade=`<style>
/* v37: advanced automation + AI command center */
.hc37{display:grid;gap:14px}
.hc37-hero{position:relative;overflow:hidden;border:1px solid #ffffff14;background:radial-gradient(circle at 88% -10%,#8f5cff2d,transparent 34%),radial-gradient(circle at 10% 120%,#ef3f721f,transparent 36%),linear-gradient(135deg,#111824,#090e16);border-radius:24px;padding:20px;box-shadow:0 22px 68px #0007}
.hc37-hero:after{content:"";position:absolute;right:-80px;bottom:-120px;width:320px;height:320px;border-radius:50%;border:1px solid #ffffff09;box-shadow:0 0 0 42px #ffffff03,0 0 0 84px #ffffff02;pointer-events:none}
.hc37-hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;position:relative;z-index:1}
.hc37-kicker{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#bba8ff;font-weight:900}
.hc37-hero h2{margin:5px 0 7px;font-size:25px;letter-spacing:-.02em}
.hc37-hero p{margin:0;color:#95a2b5;font-size:11px;line-height:1.6;max-width:850px}
.hc37-actions{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
.hc37-btn{border:1px solid #ffffff17;background:#09101a;color:#f5f7fb;border-radius:10px;padding:9px 12px;font-size:10px;font-weight:850;cursor:pointer;min-height:34px}
.hc37-btn:hover{border-color:#9f7bff55;background:#111a27}
.hc37-btn.primary{border-color:transparent;background:linear-gradient(135deg,#e83f72,#8158f3)}
.hc37-btn.good{border-color:#43d39938;color:#8af0c1;background:#43d3990d}
.hc37-btn.warn{border-color:#ffc86138;color:#ffd48d;background:#ffc8610d}
.hc37-btn.danger{border-color:#ff657b38;color:#ff9eae;background:#ff657b0d}
.hc37-btn:disabled{opacity:.45;cursor:not-allowed}
.hc37-badges{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px;position:relative;z-index:1}
.hc37-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid #ffffff12;background:#080e17;border-radius:999px;padding:6px 9px;color:#9eabba;font-size:9px;font-weight:850}
.hc37-pill.good{color:#72e5b0;border-color:#43d39930;background:#43d3990a}
.hc37-pill.warn{color:#ffd27c;border-color:#ffc86130;background:#ffc8610a}
.hc37-pill.bad{color:#ff9cad;border-color:#ff657b30;background:#ff657b0a}
.hc37-pill.purple{color:#c4b6ff;border-color:#8b66ff36;background:#8b66ff0b}
.hc37-alert{border:1px solid #ffc86133;background:linear-gradient(90deg,#6f4b151f,#111722);border-radius:15px;padding:12px 14px;color:#e8c98c;font-size:10px;line-height:1.55}
.hc37-kpis{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px}
.hc37-kpi{border:1px solid #ffffff10;background:linear-gradient(180deg,#111824,#0b1119);border-radius:16px;padding:13px;min-height:98px}
.hc37-kpi small{display:block;color:#7e8b9f;font-size:8px;text-transform:uppercase;letter-spacing:.1em}
.hc37-kpi strong{display:block;font-size:23px;margin-top:9px;letter-spacing:-.02em}
.hc37-kpi span{display:block;color:#7f8da1;font-size:8px;margin-top:4px;line-height:1.4}
.hc37-grid2{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.65fr);gap:14px}
.hc37-panel{border:1px solid #ffffff11;background:linear-gradient(180deg,#0f161f,#090f16);border-radius:18px;padding:16px}
.hc37-panel-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:13px}
.hc37-panel h3{margin:0;font-size:14px}
.hc37-panel p{margin:4px 0 0;color:#7f8c9f;font-size:9px;line-height:1.5}
.hc37-pipelines{display:grid;gap:9px}
.hc37-pipe{border:1px solid #ffffff10;background:#080e16;border-radius:15px;padding:13px}
.hc37-pipe-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.hc37-pipe h4{margin:0;font-size:11px}
.hc37-pipe small{display:block;color:#768397;font-size:8px;line-height:1.5;margin-top:4px}
.hc37-switch{display:inline-flex;align-items:center;gap:7px;color:#a8b4c5;font-size:9px;white-space:nowrap}
.hc37-switch input{accent-color:#8f63ff}
.hc37-config{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
.hc37-config span{border:1px solid #ffffff0d;background:#0c131d;border-radius:8px;padding:5px 7px;color:#8d9aad;font-size:8px}
.hc37-runbook{display:grid;gap:8px}
.hc37-run{border:1px solid #ffffff0f;background:#080e16;border-radius:13px;padding:11px}
.hc37-run b{display:block;font-size:10px}
.hc37-run span{display:block;color:#7c899c;font-size:8px;line-height:1.5;margin:4px 0 8px}
.hc37-progress{height:7px;background:#070c12;border:1px solid #ffffff0d;border-radius:999px;overflow:hidden;margin-top:8px}
.hc37-progress i{display:block;height:100%;background:linear-gradient(90deg,#43d399,#7f63ff);border-radius:999px}
.hc37-ai{display:grid;grid-template-columns:minmax(300px,.8fr) minmax(0,1.2fr);gap:12px}
.hc37-field{display:grid;gap:5px;margin-bottom:9px}
.hc37-field span{font-size:8px;color:#7e8b9e;text-transform:uppercase;letter-spacing:.08em}
.hc37-field input,.hc37-field select,.hc37-field textarea,.hc37-filter input,.hc37-filter select{width:100%;box-sizing:border-box;border:1px solid #ffffff14;background:#070c13;color:#f4f6fb;border-radius:10px;padding:10px;font-size:10px;outline:0}
.hc37-field textarea{min-height:145px;resize:vertical;line-height:1.5}
.hc37-presets{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px}
.hc37-chip{border:1px solid #ffffff11;background:#0a111a;color:#9ba8ba;border-radius:999px;padding:6px 8px;font-size:8px;cursor:pointer}
.hc37-chip:hover{border-color:#8d6bff45;color:#d3c8ff}
.hc37-ai-output{border:1px solid #8d63ff22;background:radial-gradient(circle at 100% 0,#8d63ff12,transparent 28%),#070c13;border-radius:14px;padding:13px;min-height:260px}
.hc37-ai-output pre{white-space:pre-wrap;word-break:break-word;margin:0;color:#d4dbe6;font-family:inherit;font-size:10px;line-height:1.65;max-height:460px;overflow:auto}
.hc37-ai-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.hc37-note{border:1px solid #ffffff0f;background:#080e16;border-radius:12px;padding:10px;color:#8996a8;font-size:8px;line-height:1.55}
.hc37-filter{display:grid;grid-template-columns:minmax(220px,1fr) 160px 160px;gap:7px;margin-bottom:10px}
.hc37-list{display:grid;gap:8px}
.hc37-draft,.hc37-evidence{border:1px solid #ffffff0e;background:#080e16;border-radius:13px;padding:12px}
.hc37-draft-top,.hc37-evidence-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.hc37-draft h4,.hc37-evidence h4{margin:0;font-size:10px}
.hc37-draft .preview{margin-top:7px;color:#9aa6b7;font-size:9px;line-height:1.55;white-space:pre-wrap}
.hc37-meta{display:flex;gap:8px;flex-wrap:wrap;color:#707f93;font-size:8px;margin-top:8px}
.hc37-stats{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.hc37-stat{border:1px solid #ffffff0d;background:#0b121c;border-radius:8px;padding:5px 7px;color:#91a0b3;font-size:8px}
.hc37-stat.good{color:#72e5b0;border-color:#43d39923}
.hc37-stat.bad{color:#ff9cad;border-color:#ff657b23}
.hc37-error{margin-top:8px;border:1px solid #ff657b22;background:#ff657b09;border-radius:9px;padding:8px;color:#ff9dad;font-size:8px;line-height:1.45}
.hc37-empty{border:1px dashed #ffffff16;border-radius:13px;padding:24px;text-align:center;color:#8390a3;font-size:9px}
.hc37-empty b{display:block;color:#e8edf5;font-size:12px;margin-bottom:4px}
.hc37-safety{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.hc37-check{border:1px solid #ffffff0f;background:#080e16;border-radius:12px;padding:11px}
.hc37-check b{display:block;font-size:9px}
.hc37-check span{display:block;color:#758397;font-size:8px;line-height:1.5;margin-top:4px}
.hc37-live-dot{width:7px;height:7px;border-radius:50%;background:#43d399;box-shadow:0 0 0 4px #43d39916}
@media(max-width:1500px){.hc37-kpis{grid-template-columns:repeat(4,1fr)}}
@media(max-width:1050px){.hc37-grid2,.hc37-ai{grid-template-columns:1fr}.hc37-safety{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){.hc37-hero-top{display:block}.hc37-hero .hc37-actions{margin-top:12px}.hc37-kpis{grid-template-columns:repeat(2,1fr)}.hc37-filter{grid-template-columns:1fr}.hc37-draft-top,.hc37-evidence-top{display:grid}.hc37-safety{grid-template-columns:1fr}}
@media(max-width:430px){.hc37-kpis{grid-template-columns:1fr}}
</style><script>
(()=>{
  let phase=null,runtime=null,drafts=[],lastAi=null,loading=false,auto=false,autoTimer=null;
  let draftQuery='',draftStatus='all',runJob='all',runStatus='all',runTrigger='all',aiTask='operations_brief',aiInstruction='';
  const q=s=>document.querySelector(s);
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const n=v=>Number.isFinite(Number(v))?Number(v):0;
  const taskLabels={operations_brief:'Operations brief',moderation_summary:'Moderation summary',verification_summary:'Verification summary',payment_summary:'Payment summary',content_plan:'Content plan',notification_draft:'Notification draft'};
  const presets=[
    ['Daily pulse','operations_brief','Summarize the current operational state. Highlight failures, queue pressure, safety concerns and the five highest-priority admin checks.'],
    ['Safety review','moderation_summary','Summarize moderation workload and operational risk. Separate observed facts from recommendations and give a human-review checklist.'],
    ['Verification queue','verification_summary','Summarize verification workload, bottlenecks and what an authorized reviewer should check next. Do not make approval decisions.'],
    ['Payments watch','payment_summary','Summarize payment operations, failed or unusual transaction states, and the next finance review steps.'],
    ['Content plan','content_plan','Create a concise content operations plan from current publishing state, with priorities and review checkpoints.'],
    ['Campaign draft','notification_draft','Draft a clear member notification based on current campaign and market context. Do not claim it has been sent.']
  ];
  async function get(url){const r=await fetch(url,{credentials:'same-origin',headers:{accept:'application/json'}});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Object.assign(new Error(d.error||'Request failed'),{status:r.status,data:d});return d}
  async function post(url,b){const r=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify(b)});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Object.assign(new Error(d.error||'Request failed'),{status:r.status,data:d});return d}
  function fmt(v){if(!v)return 'Not recorded';const d=new Date(v);if(Number.isNaN(d.getTime()))return String(v);return d.toLocaleString()}
  function ago(v){if(!v)return 'No run yet';const t=new Date(v).getTime();if(!Number.isFinite(t))return String(v);const s=Math.max(0,Math.floor((Date.now()-t)/1000));if(s<60)return s+'s ago';if(s<3600)return Math.floor(s/60)+'m ago';if(s<86400)return Math.floor(s/3600)+'h ago';return Math.floor(s/86400)+'d ago'}
  function duration(a,b){if(!a||!b)return '—';const ms=new Date(b)-new Date(a);if(!Number.isFinite(ms)||ms<0)return '—';if(ms<1000)return ms+'ms';if(ms<60000)return (ms/1000).toFixed(1)+'s';return (ms/60000).toFixed(1)+'m'}
  function nextCron(){const d=new Date();const m=d.getMinutes();d.setSeconds(0,0);d.setMinutes(m+(5-(m%5||5)));if(d<=new Date())d.setMinutes(d.getMinutes()+5);return fmt(d)}
  function setting(key){return (phase?.automation?.settings||[]).find(x=>x.key===key)||null}
  function runs(){return Array.isArray(phase?.automation?.recentRuns)?phase.automation.recentRuns:[]}
  function runHealth(){const rows=runs().filter(x=>!['running','disabled'].includes(String(x.status||'')));if(!rows.length)return 100;return Math.round(rows.filter(x=>x.status==='completed').length/rows.length*100)}
  function deliveryRate(){const rows=runs(),ok=rows.reduce((a,x)=>a+n(x.success_count),0),bad=rows.reduce((a,x)=>a+n(x.failed_count),0);return ok+bad?Math.round(ok/(ok+bad)*100):100}
  function kpi(label,value,note){return '<div class="hc37-kpi"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(note||'')+'</span></div>'}
  function pill(text,cls){return '<span class="hc37-pill '+(cls||'')+'">'+esc(text)+'</span>'}
  function configPills(cfg){cfg=cfg||{};const pairs=Object.entries(cfg).slice(0,6);return pairs.map(([k,v])=>'<span>'+esc(k.replaceAll('_',' '))+': '+esc(typeof v==='object'?JSON.stringify(v):v)+'</span>').join('')}
  function statusClass(s){s=String(s||'');return s==='completed'||s==='draft'?'good':s==='failed'||s==='blocked'?'bad':s==='partial'||s==='running'?'warn':'purple'}
  function externalCard(name,enabled,reason){return '<div class="hc37-pipe"><div class="hc37-pipe-top"><div><h4>'+esc(name)+'</h4><small>'+esc(reason)+'</small></div>'+pill(enabled?'connected':'locked off',enabled?'good':'warn')+'</div></div>'}
  function runCard(x){const meta=x.metadata&&typeof x.metadata==='object'?x.metadata:{};return '<article class="hc37-evidence"><div class="hc37-evidence-top"><div><h4>'+esc(String(x.automation_key||'automation').replaceAll('_',' '))+'</h4><div class="hc37-meta"><span>'+esc(x.trigger_source||'system')+' trigger</span><span>'+esc(ago(x.started_at))+'</span><span>'+esc(duration(x.started_at,x.finished_at))+'</span></div></div>'+pill(x.status||'unknown',statusClass(x.status))+'</div><div class="hc37-stats"><span class="hc37-stat">scanned '+esc(n(x.scanned_count))+'</span><span class="hc37-stat">processed '+esc(n(x.processed_count))+'</span><span class="hc37-stat good">success '+esc(n(x.success_count))+'</span><span class="hc37-stat bad">failed '+esc(n(x.failed_count))+'</span><span class="hc37-stat">skipped '+esc(n(x.skipped_count))+'</span>'+(meta.nativeQueued!=null?'<span class="hc37-stat">queued '+esc(meta.nativeQueued)+'</span>':'')+'</div>'+(x.error_summary?'<div class="hc37-error">'+esc(x.error_summary)+'</div>':'')+'</article>'}
  function draftCard(x){const action=x.status==='archived'?'restore':'archive';return '<article class="hc37-draft"><div class="hc37-draft-top"><div><h4>'+esc(x.title||taskLabels[x.metadata?.task]||x.draft_type||'AI draft')+'</h4><div class="hc37-meta"><span>'+esc(String(x.draft_type||'draft').replaceAll('_',' '))+'</span><span>'+esc(x.workspace||'admin')+'</span><span>'+esc(fmt(x.created_at))+'</span></div></div><div class="hc37-actions">'+pill(x.status||'draft',statusClass(x.status))+'<button class="hc37-btn" type="button" data-hc37-draft="'+esc(x.id)+'" data-hc37-action="'+action+'">'+(action==='restore'?'Restore':'Archive')+'</button></div></div><details style="margin-top:8px"><summary style="cursor:pointer;color:#aab6c8;font-size:9px">Preview AI draft</summary><div class="preview">'+esc(x.content||'')+'</div></details></article>'}
  function filteredDrafts(){return drafts.filter(x=>{const sm=draftStatus==='all'||x.status===draftStatus,hay=[x.title,x.draft_type,x.workspace,x.content].join(' ').toLowerCase();return sm&&(!draftQuery||hay.includes(draftQuery.toLowerCase()))})}
  function filteredRuns(){return runs().filter(x=>(runJob==='all'||x.automation_key===runJob)&&(runStatus==='all'||x.status===runStatus)&&(runTrigger==='all'||x.trigger_source===runTrigger))}
  function renderDrafts(){const box=q('#hc37DraftList'),shown=q('#hc37DraftShown');if(!box)return;const rows=filteredDrafts();if(shown)shown.textContent=rows.length+' shown';box.innerHTML=rows.length?rows.map(draftCard).join(''):'<div class="hc37-empty"><b>No matching AI drafts</b><span>Save an AI result or change the filters.</span></div>';box.querySelectorAll('[data-hc37-draft]').forEach(b=>b.onclick=()=>draftAction(b.dataset.hc37Draft,b.dataset.hc37Action))}
  function renderRuns(){const box=q('#hc37RunList'),shown=q('#hc37RunShown');if(!box)return;const rows=filteredRuns();if(shown)shown.textContent=rows.length+' shown';box.innerHTML=rows.length?rows.map(runCard).join(''):'<div class="hc37-empty"><b>No matching automation evidence</b><span>Change filters or run one bounded operation.</span></div>'}
  function aiOutputHtml(){if(!lastAi)return '<div class="hc37-ai-meta">'+pill('advisory only','purple')+pill(phase?.configuration?.adminAiModel||'Workers AI','good')+'</div><pre>Choose a task, use a preset or write an instruction. AI receives bounded operational context and cannot execute high-impact admin actions.</pre>';return '<div class="hc37-ai-meta">'+pill(taskLabels[lastAi.task]||lastAi.task,'purple')+pill(lastAi.model||'Workers AI','good')+(lastAi.correlationId?pill('trace '+String(lastAi.correlationId).slice(0,8),''):'')+'</div><pre>'+esc(lastAi.answer||'No AI response returned.')+'</pre><div class="hc37-actions" style="margin-top:10px"><button class="hc37-btn" id="hc37CopyAi" type="button">Copy output</button><button class="hc37-btn primary" id="hc37SaveAi" type="button" '+(!lastAi.canSaveDraft?'disabled':'')+'>Save as draft</button></div><div class="hc37-note" style="margin-top:10px">'+esc(lastAi.privacy||'AI output is advisory and requires human review.')+'</div>'}
  function draw(){
    const a=phase?.automation||{},counts=a.counts||{},rs=runs(),sched=setting('notification_scheduler'),native=setting('native_in_app_delivery'),health=runHealth(),rate=deliveryRate(),last=rs[0],failed=rs.filter(x=>x.status==='failed').length,partial=rs.filter(x=>x.status==='partial').length;
    const owner=runtime?.ownerAllowlistConfigured===true,ai=phase?.configuration?.workersAiConfigured===true,data=phase?.configuration?.serviceRoleConfigured===true;
    const v=q('#view');if(!v)return;
    v.innerHTML='<div class="hc37"><section class="hc37-hero"><div class="hc37-hero-top"><div><div class="hc37-kicker">Production operations intelligence</div><h2>Automation & AI Command Center</h2><p>Control bounded scheduled work, inspect delivery evidence, use privacy-limited AI for operational analysis, and keep high-impact decisions under human authorization.</p><div class="hc37-badges">'+pill('Live environment','good')+pill(data?'Admin data connected':'Admin data unavailable',data?'good':'bad')+pill(owner?'Owner access configured':'Owner access not configured',owner?'good':'warn')+pill(ai?'Workers AI online':'Workers AI unavailable',ai?'purple':'bad')+pill('Cron every 5 minutes','')+'</div></div><div class="hc37-actions"><button class="hc37-btn" id="hc37Refresh" type="button">Refresh</button><button class="hc37-btn" id="hc37Auto" type="button">'+(auto?'Auto refresh: ON':'Auto refresh: OFF')+'</button><button class="hc37-btn primary" id="hc37RunAllTop" type="button">Run full cycle</button></div></div></section>'+(!owner?'<div class="hc37-alert"><b>Owner recovery path is not active in this runtime.</b> Super Admin access can still work through delegated staff roles, but the explicit Cloudflare owner allow-list should remain configured for recovery and highest-level control.</div>':'')+'<div class="hc37-kpis">'+kpi('Automation health',health+'%',rs.length+' recent runs')+kpi('Delivery success',rate+'%',failed+' failed · '+partial+' partial')+kpi('Due campaigns',counts.dueCampaigns??'—','Waiting to queue')+kpi('Queued in-app',counts.queuedInApp??'—','Native delivery backlog')+kpi('Failed in-app',counts.failedInApp??'—','Needs operational review')+kpi('Unread notices',counts.unreadNotifications??'—','Member inbox total')+kpi('AI drafts',drafts.length,'Saved advisory outputs')+kpi('Last automation',last?ago(last.started_at):'None',last?String(last.automation_key||'').replaceAll('_',' '):'No run evidence')+'</div><div class="hc37-grid2"><section class="hc37-panel"><div class="hc37-panel-head"><div><h3>Automation pipelines</h3><p>Enable or pause native pipelines. Changes require explicit confirmation and are written to the admin audit trail.</p></div>'+pill(a.ready?'runtime ready':'setup required',a.ready?'good':'bad')+'</div><div class="hc37-pipelines"><div class="hc37-pipe"><div class="hc37-pipe-top"><div><h4>Scheduled campaign queueing</h4><small>Scans due notification campaigns and resolves bounded recipient audiences before preparing native delivery rows.</small></div><label class="hc37-switch"><input id="hc37Scheduler" type="checkbox" '+(sched?.enabled?'checked':'')+'> '+(sched?.enabled?'Enabled':'Paused')+'</label></div><div class="hc37-config">'+configPills(sched?.config)+'</div></div><div class="hc37-pipe"><div class="hc37-pipe-top"><div><h4>Native in-app delivery</h4><small>Processes queued native notifications with idempotent source keys and capped retries.</small></div><label class="hc37-switch"><input id="hc37Native" type="checkbox" '+(native?.enabled?'checked':'')+'> '+(native?.enabled?'Enabled':'Paused')+'</label></div><div class="hc37-config">'+configPills(native?.config)+'</div></div>'+externalCard('External email delivery',false,'Provider adapter is not implemented. No email send claims are made.')+externalCard('External push delivery',false,'Push provider, consent handling and delivery evidence are not implemented.')+externalCard('Social publishing',false,'Facebook, TikTok and Google Business publishing remain outside the active automation boundary.')+'</div></section><aside class="hc37-panel"><div class="hc37-panel-head"><div><h3>Bounded runbook</h3><p>Manual operations execute one capped batch only.</p></div></div><div class="hc37-runbook"><div class="hc37-run"><b>Queue due campaigns</b><span>Resolve due scheduled campaigns and prepare supported native delivery rows.</span><button class="hc37-btn" id="hc37Schedule" type="button">Queue one batch</button></div><div class="hc37-run"><b>Deliver in-app batch</b><span>Process one bounded group of queued Heart Connect notifications.</span><button class="hc37-btn" id="hc37Deliver" type="button">Deliver one batch</button></div><div class="hc37-run"><b>Run full native cycle</b><span>Queue due campaigns, then process one native delivery batch. External adapters remain disabled.</span><button class="hc37-btn primary" id="hc37RunAll" type="button">Run both</button></div><div class="hc37-note"><b>Next expected cron</b><br>'+esc(nextCron())+'<br><br>Manual runs do not change the five-minute recurring cron schedule.</div><div><div class="hc37-meta"><span>Recent automation health</span><span>'+health+'%</span></div><div class="hc37-progress"><i style="width:'+Math.max(0,Math.min(100,health))+'%"></i></div></div></div></aside></div><section class="hc37-panel"><div class="hc37-panel-head"><div><h3>Admin AI mission console</h3><p>Ask operational questions against bounded context. AI can analyze and draft, but cannot ban, suspend, verify, refund, delete, publish or send.</p></div>'+pill(ai?'AI configured':'AI unavailable',ai?'purple':'bad')+'</div><div class="hc37-ai"><div><div class="hc37-presets">'+presets.map((x,i)=>'<button class="hc37-chip" type="button" data-hc37-preset="'+i+'">'+esc(x[0])+'</button>').join('')+'</div><label class="hc37-field"><span>AI task</span><select id="hc37AiTask">'+Object.entries(taskLabels).map(([k,l])=>'<option value="'+k+'" '+(aiTask===k?'selected':'')+'>'+esc(l)+'</option>').join('')+'</select></label><label class="hc37-field"><span>Instruction</span><textarea id="hc37AiInstruction" maxlength="1800" placeholder="Example: Summarize today’s operational risks and give me the top five items an admin should review.">'+esc(aiInstruction)+'</textarea></label><div class="hc37-actions"><button class="hc37-btn primary" id="hc37RunAi" type="button" '+(!ai?'disabled':'')+'>Run Admin AI</button><span class="hc37-pill" id="hc37AiChars">'+esc(aiInstruction.length)+' / 1800</span></div><div class="hc37-note" style="margin-top:9px">Shortcut: Ctrl/Cmd + Enter runs the selected AI task. Private message bodies, credentials, identity evidence and payment secrets are excluded from AI context.</div></div><div class="hc37-ai-output" id="hc37AiOutput">'+aiOutputHtml()+'</div></div></section><section class="hc37-panel"><div class="hc37-panel-head"><div><h3>Saved AI draft library</h3><p>Review and archive advisory outputs. Drafts never execute an operational action.</p></div>'+pill(drafts.length+' total','')+'</div><div class="hc37-filter"><input id="hc37DraftSearch" placeholder="Search title, workspace or draft text" value="'+esc(draftQuery)+'"><select id="hc37DraftStatus"><option value="all">All draft states</option><option value="draft" '+(draftStatus==='draft'?'selected':'')+'>Draft</option><option value="archived" '+(draftStatus==='archived'?'selected':'')+'>Archived</option></select><span class="hc37-pill" id="hc37DraftShown"></span></div><div class="hc37-list" id="hc37DraftList"></div></section><section class="hc37-panel"><div class="hc37-panel-head"><div><h3>Automation evidence explorer</h3><p>Append-oriented execution history with run duration, trigger source, counters and recorded errors.</p></div><span class="hc37-pill" id="hc37RunShown"></span></div><div class="hc37-filter"><select id="hc37RunJob"><option value="all">All automation jobs</option><option value="notification_scheduler" '+(runJob==='notification_scheduler'?'selected':'')+'>Notification scheduler</option><option value="native_in_app_delivery" '+(runJob==='native_in_app_delivery'?'selected':'')+'>Native in-app delivery</option><option value="phase5_run_all" '+(runJob==='phase5_run_all'?'selected':'')+'>Full Phase 5 cycle</option></select><select id="hc37RunStatus"><option value="all">All statuses</option>'+['completed','partial','failed','running','disabled'].map(s=>'<option value="'+s+'" '+(runStatus===s?'selected':'')+'>'+s+'</option>').join('')+'</select><select id="hc37RunTrigger"><option value="all">All triggers</option>'+['cron','admin','system'].map(s=>'<option value="'+s+'" '+(runTrigger===s?'selected':'')+'>'+s+'</option>').join('')+'</select></div><div class="hc37-list" id="hc37RunList"></div></section><section class="hc37-panel"><div class="hc37-panel-head"><div><h3>Control boundaries & readiness</h3><p>Operational safeguards enforced by the current automation and AI layer.</p></div></div><div class="hc37-safety"><div class="hc37-check"><b>✓ Human authority retained</b><span>AI cannot perform high-impact account, safety, verification, payment or publishing decisions.</span></div><div class="hc37-check"><b>✓ Native delivery idempotent</b><span>Member notifications use source keys to reduce duplicate delivery risk.</span></div><div class="hc37-check"><b>✓ Bounded batches</b><span>Native delivery is capped at '+esc(phase?.safety?.maxNativeBatch??200)+' per batch and campaigns at '+esc(phase?.safety?.maxRecipientsPerCampaign??500)+' recipients.</span></div><div class="hc37-check"><b>✓ Sensitive AI context excluded</b><span>Private messages, credentials, identity evidence and sensitive payment secrets are not supplied to Admin AI.</span></div></div></section></div>';
    wire();
  }
  function wire(){
    q('#hc37Refresh').onclick=()=>load37(true);
    q('#hc37Auto').onclick=()=>{auto=!auto;if(auto){clearInterval(autoTimer);autoTimer=setInterval(()=>load37(false),30000)}else{clearInterval(autoTimer);autoTimer=null}draw()};
    q('#hc37RunAllTop').onclick=()=>runAutomation('run_all');
    q('#hc37Schedule').onclick=()=>runAutomation('schedule_due');
    q('#hc37Deliver').onclick=()=>runAutomation('deliver_in_app');
    q('#hc37RunAll').onclick=()=>runAutomation('run_all');
    const s=q('#hc37Scheduler'),nbox=q('#hc37Native');if(s)s.onchange=e=>changeSetting('notification_scheduler',e.target.checked,e.target);if(nbox)nbox.onchange=e=>changeSetting('native_in_app_delivery',e.target.checked,e.target);
    q('#hc37AiTask').onchange=e=>{aiTask=e.target.value};
    q('#hc37AiInstruction').oninput=e=>{aiInstruction=e.target.value;const c=q('#hc37AiChars');if(c)c.textContent=aiInstruction.length+' / 1800'};
    q('#hc37AiInstruction').onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();runAi()}};
    q('#hc37RunAi').onclick=runAi;
    q('#hc37AiOutput').querySelector('#hc37CopyAi')?.addEventListener('click',copyAi);
    q('#hc37AiOutput').querySelector('#hc37SaveAi')?.addEventListener('click',saveAi);
    document.querySelectorAll('[data-hc37-preset]').forEach(b=>b.onclick=()=>{const x=presets[Number(b.dataset.hc37Preset)];if(!x)return;aiTask=x[1];aiInstruction=x[2];q('#hc37AiTask').value=aiTask;q('#hc37AiInstruction').value=aiInstruction;q('#hc37AiChars').textContent=aiInstruction.length+' / 1800'});
    q('#hc37DraftSearch').oninput=e=>{draftQuery=e.target.value;renderDrafts()};
    q('#hc37DraftStatus').onchange=e=>{draftStatus=e.target.value;renderDrafts()};
    q('#hc37RunJob').onchange=e=>{runJob=e.target.value;renderRuns()};
    q('#hc37RunStatus').onchange=e=>{runStatus=e.target.value;renderRuns()};
    q('#hc37RunTrigger').onchange=e=>{runTrigger=e.target.value;renderRuns()};
    renderDrafts();renderRuns();
  }
  async function changeSetting(key,enabled,box){const word=enabled?'ENABLE':'PAUSE';const answer=(prompt('Type '+word+' to '+(enabled?'enable ':'pause ')+key.replaceAll('_',' ')+':')||'').trim().toUpperCase();if(answer!==word){box.checked=!enabled;return}box.disabled=true;try{await post('/api/admin/automation/settings',{key,enabled});await load37(true)}catch(e){alert(e.message);box.checked=!enabled;box.disabled=false}}
  async function runAutomation(action){const label=action==='schedule_due'?'queue one due-campaign batch':action==='deliver_in_app'?'deliver one native in-app batch':'run one full native automation cycle';if((prompt('Type RUN to '+label+':')||'').trim()!=='RUN')return;document.querySelectorAll('#hc37Schedule,#hc37Deliver,#hc37RunAll,#hc37RunAllTop').forEach(b=>b.disabled=true);try{const d=await post('/api/admin/automation/run',{action,confirmation:'RUN'});alert(d.ok===false?'Automation completed with errors. Review the evidence explorer.':'Bounded automation completed. Review the evidence explorer for recorded results.');await load37(true)}catch(e){alert(e.message);await load37(true)}}
  async function runAi(){const btn=q('#hc37RunAi');if(!btn)return;aiInstruction=q('#hc37AiInstruction').value.trim();aiTask=q('#hc37AiTask').value;if(aiInstruction.length<3){alert('Enter an instruction for Admin AI.');return}btn.disabled=true;btn.textContent='Analyzing...';const out=q('#hc37AiOutput');out.innerHTML='<div class="hc37-ai-meta">'+pill('Working','warn')+'</div><pre>Admin AI is analyzing bounded operational context...</pre>';try{lastAi=await post('/api/admin/ai/operations',{task:aiTask,instruction:aiInstruction});out.innerHTML=aiOutputHtml();out.querySelector('#hc37CopyAi')?.addEventListener('click',copyAi);out.querySelector('#hc37SaveAi')?.addEventListener('click',saveAi)}catch(e){lastAi=null;out.innerHTML='<div class="hc37-ai-meta">'+pill('AI unavailable','bad')+'</div><pre>'+esc(e.message)+'</pre>'}finally{btn.disabled=false;btn.textContent='Run Admin AI'}}
  async function copyAi(){if(!lastAi?.answer)return;try{await navigator.clipboard.writeText(lastAi.answer);alert('AI output copied.')}catch{alert('Copy is unavailable in this browser. Select the text manually.')}}
  async function saveAi(){if(!lastAi?.answer)return;const title=(prompt('Draft title:',taskLabels[lastAi.task]||'Admin AI draft')||'').trim();if(!title)return;try{await post('/api/admin/ai/drafts',{draftType:lastAi.draftType,workspace:lastAi.workspace,title,content:lastAi.answer,metadata:{correlationId:lastAi.correlationId,task:lastAi.task,model:lastAi.model}});await load37(true);alert('AI output saved as an advisory draft.')}catch(e){alert(e.message)}}
  async function draftAction(id,action){try{await post('/api/admin/ai/drafts/'+encodeURIComponent(id)+'/action',{action});await load37(true)}catch(e){alert(e.message)}}
  async function load37(showLoading){
    if(loading)return;loading=true;const v=q('#view');if(showLoading&&v)v.innerHTML='<div class="hc37-empty"><b>Loading Automation & AI Command Center...</b><span>Reading runtime, bounded automation evidence and AI drafts.</span></div>';
    try{
      const out=await Promise.all([get('/api/admin/phase5/status'),get('/api/admin/runtime').catch(()=>null),get('/api/admin/ai/drafts').catch(()=>({items:[]}))]);
      const title=q('#title');if(!title||!['Automation & AI','Phase 5 Operations'].includes(title.textContent.trim()))return;
      phase=out[0];runtime=out[1];drafts=Array.isArray(out[2]?.items)?out[2].items:[];title.textContent='Automation & AI';draw()
    }catch(e){if(v)v.innerHTML='<div class="hc37-empty"><b>Automation & AI unavailable</b><span>'+esc(e.message)+'</span></div>'}finally{loading=false}
  }
  function should(){const t=q('#title'),v=q('#view');if(!t||!v)return false;const name=t.textContent.trim();return ['Automation & AI','Phase 5 Operations'].includes(name)&&!v.querySelector('.hc37')&&/Phase 5 control center|Automation controls|Admin AI Operations/i.test(v.textContent||'')}
  function apply(){if(should())load37(true)}
  new MutationObserver(()=>setTimeout(apply,0)).observe(document.body,{childList:true,subtree:true,characterData:true});
  setTimeout(apply,0);setTimeout(apply,350);setTimeout(apply,900);
})();
</script>`;
  return adminHtmlV36(version).replace('</body>',upgrade+'</body>');
}
