import {handleAdmin as handleAdminV39,runPhase7AndEarlierScheduled} from './admin-api-v39.js';
import {adminHtml} from './admin-ui-v42.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v42';

const ACCESS_COOKIE='__Host-hc_cf_access';
const DEFAULT_SUPABASE_URL='https://zzhzkikezjtbntaqiurk.supabase.co';
const DEFAULT_PUBLISHABLE_KEY='sb_publishable_HB0Irz6bxug1hHs518oPZQ_LC83i4qT';
const ALL_ADMIN_ROLES=['owner','super_admin','admin','moderator','senior_moderator','safety_specialist','payment_specialist','support_agent','content_manager','verification_specialist','finance'];
const WORKSPACES={
  overview:{label:'Overview',roles:ALL_ADMIN_ROLES,draftType:'operations_brief'},
  moderation:{label:'Moderation',roles:['owner','super_admin','admin','moderator','senior_moderator','safety_specialist'],draftType:'moderation_note'},
  verification:{label:'Verification',roles:['owner','super_admin','admin','verification_specialist','safety_specialist'],draftType:'verification_note'},
  payments:{label:'Payments',roles:['owner','super_admin','admin','payment_specialist','finance'],draftType:'payment_note'},
  cms:{label:'Content & CMS',roles:['owner','super_admin','admin','content_manager'],draftType:'cms'},
  notifications:{label:'Notifications',roles:['owner','super_admin','admin','content_manager','support_agent'],draftType:'notification'}
};

function cfg(env){return{url:String(env.SUPABASE_URL||DEFAULT_SUPABASE_URL).replace(/\/+$/,''),publishable:String(env.SUPABASE_PUBLISHABLE_KEY||DEFAULT_PUBLISHABLE_KEY),service:String(env.SUPABASE_SERVICE_ROLE_KEY||'')}}
function cookies(request){const out={};for(const part of String(request.headers.get('cookie')||'').split(';')){const i=part.indexOf('=');if(i>0){const k=part.slice(0,i).trim();try{out[k]=decodeURIComponent(part.slice(i+1).trim())}catch{out[k]=part.slice(i+1).trim()}}}return out}
function text(v,n=1000){return String(v??'').trim().slice(0,n)}
function email(v){const s=text(v,320).toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:''}
function emails(v){return String(v||'').split(',').map(email).filter(Boolean)}
function safe(v){if(Array.isArray(v))return v.slice(0,120).map(safe);if(v&&typeof v==='object'){const out={};for(const [k,x] of Object.entries(v)){if(/secret|password|token|authorization|api.?key|private.?key|credential|evidence|document_path|media_path|recipient_user_id|actor_user_id|user_id/i.test(k))continue;out[text(k,100)]=safe(x)}return out}if(typeof v==='string')return v.slice(0,5000);if(typeof v==='number'||typeof v==='boolean'||v===null)return v;return String(v??'').slice(0,5000)}
function j(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-heart-connect-admin':VERSION}})}
function page(html,head=false){const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store, max-age=0','pragma':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()','cross-origin-opener-policy':'same-origin','cross-origin-resource-policy':'same-origin','strict-transport-security':'max-age=31536000; includeSubDomains','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://api.mapbox.com; script-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src blob:; child-src blob:; frame-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",'x-heart-connect-admin':VERSION};return new Response(head?null:html,{status:200,headers})}
function unsafe(request){return !['GET','HEAD','OPTIONS'].includes(request.method)}
function sameOrigin(request){if(!unsafe(request))return true;const site=request.headers.get('sec-fetch-site');if(site==='cross-site')return false;const origin=request.headers.get('origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}}
async function jsonBody(request,max=30000){const raw=await request.text();if(raw.length>max)throw Object.assign(new Error('Request is too large.'),{status:413});try{return raw?JSON.parse(raw):{}}catch{throw Object.assign(new Error('Valid JSON is required.'),{status:400})}}
async function session(request,env){const c=cfg(env),token=cookies(request)[ACCESS_COOKIE]||'';if(!token)return null;try{const r=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.publishable,authorization:'Bearer '+token,accept:'application/json'}});if(!r.ok)return null;const u=await r.json();return u?.id?{id:u.id,email:email(u.email)}:null}catch{return null}}
async function svc(env,path,{method='GET',body,headers:extra}={}){const c=cfg(env);if(!c.service)return{ok:false,status:503,data:{message:'Admin data service is not configured.'},headers:new Headers()};const headers=new Headers({apikey:c.service,authorization:'Bearer '+c.service,accept:'application/json',...(extra||{})});if(body!==undefined)headers.set('content-type','application/json');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(c.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});const raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}return{ok:r.ok,status:r.status,data,headers:r.headers}}catch(e){return{ok:false,status:503,data:{message:e?.name==='AbortError'?'Supabase admin request timed out.':'Supabase admin service is temporarily unavailable.'},headers:new Headers()}}finally{clearTimeout(timer)}}
async function actor(request,env){const u=await session(request,env);if(!u)return null;const owners=[...emails(env.HEART_CONNECT_OWNER_EMAILS),...emails(env.HEART_CONNECT_ADMIN_EMAILS)];if(owners.includes(u.email))return{...u,role:'owner',displayName:'Platform Owner'};const r=await svc(env,'/rest/v1/hc_admin_staff?select=role,status,display_name&user_id=eq.'+encodeURIComponent(u.id)+'&status=eq.active&limit=1'),row=r.ok&&Array.isArray(r.data)?r.data[0]:null;return row?{...u,role:String(row.role||''),displayName:text(row.display_name,100)||u.email}:null}
async function requireAdmin(request,env){const a=await actor(request,env);if(!a)return{error:j({error:'Admin access denied.'},403)};return{actor:a}}
async function audit(env,a,action,target='',metadata={}){if(!a)return;await svc(env,'/rest/v1/hc_admin_audit_log',{method:'POST',body:{actor_user_id:a.id,actor_email:a.email,actor_role:a.role,action:text(action,120),target:text(target,240),reason:null,metadata:safe(metadata),created_at:new Date().toISOString()},headers:{Prefer:'return=minimal'}})}
async function list(env,table,select,order='created_at.desc',limit=100,filter=''){return svc(env,'/rest/v1/'+table+'?select='+encodeURIComponent(select)+(filter?'&'+filter:'')+'&order='+encodeURIComponent(order)+'&limit='+Math.max(1,Math.min(500,Number(limit)||100)))}
async function count(env,table,filter=''){const r=await svc(env,'/rest/v1/'+table+'?select=id&limit=1'+(filter?'&'+filter:''),{headers:{Prefer:'count=exact',Range:'0-0'}});if(!r.ok)return{ok:false,value:null};const cr=String(r.headers.get('content-range')||''),n=Number(cr.split('/')[1]);return{ok:true,value:Number.isFinite(n)?n:(Array.isArray(r.data)?r.data.length:0)}}
function rangeSpec(v){const key=['24h','7d','30d'].includes(String(v))?String(v):'7d';const ms=key==='24h'?86400000:key==='30d'?30*86400000:7*86400000;return{key,since:new Date(Date.now()-ms).toISOString()}}
function allowedWorkspace(role,key){return !!WORKSPACES[key]?.roles.includes(role)}
function rowsOf(r){return r?.ok&&Array.isArray(r.data)?r.data:[]}
async function paymentContext(env,since){for(const table of ['payment_transactions','hc_payment_transactions']){const r=await list(env,table,'status,currency,amount_minor,created_at','created_at.desc',80,'created_at=gte.'+encodeURIComponent(since));if(r.ok)return{source:table,rows:r.data||[]}}return{source:null,rows:[]}}

async function buildContext(env,workspace,since){
  if(workspace==='moderation'){const r=await list(env,'reports','category,status,priority,created_at,reviewed_at','created_at.desc',80,'created_at=gte.'+encodeURIComponent(since));return{rows:rowsOf(r),coverage:r.ok?'available':'unavailable',privacy:'No report narrative, reporter identity, private messages or evidence is included.'}}
  if(workspace==='verification'){const r=await list(env,'verification_requests','verification_type,status,submitted_at,reviewed_at','submitted_at.desc',80,'submitted_at=gte.'+encodeURIComponent(since));return{rows:rowsOf(r),coverage:r.ok?'available':'unavailable',privacy:'No identity documents, evidence paths or member identifiers are included.'}}
  if(workspace==='payments'){const p=await paymentContext(env,since);return{source:p.source,rows:p.rows,coverage:p.source?'available':'unavailable',privacy:'Only operational transaction status, currency, amount and timestamp fields are included. No payment credentials or account secrets are included.'}}
  if(workspace==='cms'){const [posts,pages]=await Promise.all([list(env,'hc_cms_posts','title,status,scheduled_for,published_at,updated_at','updated_at.desc',60,'updated_at=gte.'+encodeURIComponent(since)+'&deleted_at=is.null'),list(env,'hc_site_pages','title,slug,page_type,status,updated_at','updated_at.desc',40,'updated_at=gte.'+encodeURIComponent(since)+'&deleted_at=is.null')]);return{posts:rowsOf(posts),pages:rowsOf(pages),coverage:posts.ok||pages.ok?'available':'unavailable',privacy:'Only operational publishing metadata is included.'}}
  if(workspace==='notifications'){const r=await list(env,'hc_notification_campaigns','title,status,audience,channels,scheduled_for,sent_at,result_summary,updated_at','updated_at.desc',60,'updated_at=gte.'+encodeURIComponent(since)+'&deleted_at=is.null');return{campaigns:rowsOf(r),coverage:r.ok?'available':'unavailable',privacy:'Campaign metadata is included without recipient identifiers or private message content.'}}
  const [profiles,reports,verify,matches,messages,campaigns,runs]=await Promise.all([
    count(env,'dating_profiles','created_at=gte.'+encodeURIComponent(since)),
    count(env,'reports','created_at=gte.'+encodeURIComponent(since)),
    count(env,'verification_requests','submitted_at=gte.'+encodeURIComponent(since)),
    count(env,'matches','created_at=gte.'+encodeURIComponent(since)),
    count(env,'messages','created_at=gte.'+encodeURIComponent(since)),
    count(env,'hc_notification_campaigns','created_at=gte.'+encodeURIComponent(since)+'&deleted_at=is.null'),
    list(env,'hc_admin_automation_runs','automation_key,status,processed_count,success_count,failed_count,skipped_count,started_at,finished_at','started_at.desc',40,'started_at=gte.'+encodeURIComponent(since))
  ]);
  return{metrics:{newProfiles:profiles.value,reports:reports.value,verificationRequests:verify.value,matches:matches.value,messages:messages.value,notificationCampaigns:campaigns.value},automationRuns:rowsOf(runs),coverage:'aggregate',privacy:'Messages are represented only by aggregate count. No member identity, private message body, private media, credentials or sensitive traits are included.'}
}

async function copilotStatus(request,env){
  const auth=await requireAdmin(request,env);if(auth.error)return auth.error;const u=new URL(request.url),range=rangeSpec(u.searchParams.get('range')),role=auth.actor.role;
  const [usage,drafts]=await Promise.all([
    list(env,'hc_admin_ai_usage','workspace,task_type,model,outcome,context_rows,output_chars,created_at','created_at.desc',200,'created_at=gte.'+encodeURIComponent(range.since)),
    list(env,'hc_admin_ai_drafts','id,draft_type,workspace,title,status,created_at,archived_at','created_at.desc',60)
  ]);
  const rows=rowsOf(usage),metrics={requests:rows.length,success:0,failed:0,unavailable:0,contextRows:0,outputChars:0};
  for(const x of rows){if(x.outcome==='success')metrics.success++;else if(x.outcome==='failed')metrics.failed++;else if(x.outcome==='unavailable')metrics.unavailable++;metrics.contextRows+=Number(x.context_rows||0);metrics.outputChars+=Number(x.output_chars||0)}
  metrics.successRate=metrics.requests?Math.round(metrics.success/metrics.requests*100):100;
  const workspaces=Object.entries(WORKSPACES).map(([key,w])=>({key,label:w.label,allowed:w.roles.includes(role),draftType:w.draftType}));
  return j({version:VERSION,actor:{role,displayName:auth.actor.displayName},range:range.key,configured:!!env.AI,model:text(env.ADMIN_AI_MODEL,160)||'@cf/meta/llama-3.1-8b-instruct',metrics,recentActivity:rows.slice(0,30),drafts:rowsOf(drafts),workspaces,privacy:{promptsStoredInUsageTelemetry:false,generatedTextStoredInUsageTelemetry:false,privateMessagesExcluded:true,identityEvidenceExcluded:true,paymentSecretsExcluded:true},capabilities:{structuredAnalysis:true,rangeAwareContext:true,workspaceContext:true,draftSaving:true,sessionHistory:true,autonomousHighImpactActions:false}});
}

async function copilotRun(request,env){
  const auth=await requireAdmin(request,env);if(auth.error)return auth.error;let b;try{b=await jsonBody(request,25000)}catch(e){return j({error:e.message},e.status||400)}
  const workspace=text(b.workspace||'overview',30),def=WORKSPACES[workspace];if(!def)return j({error:'Choose a supported Copilot workspace.'},400);if(!allowedWorkspace(auth.actor.role,workspace))return j({error:'Your admin role does not allow this Copilot workspace.',role:auth.actor.role,workspace},403);
  const prompt=text(b.prompt,1800),range=rangeSpec(b.range);if(prompt.length<3)return j({error:'Enter a question or instruction for AI Copilot.'},400);
  const model=text(env.ADMIN_AI_MODEL,160)||'@cf/meta/llama-3.1-8b-instruct',correlationId=crypto.randomUUID();
  if(!env.AI)return j({error:'Cloudflare Workers AI is not configured for this Worker.',configured:false},503);
  const bounded=await buildContext(env,workspace,range.since),context=safe(bounded),contextRows=Array.isArray(bounded.rows)?bounded.rows.length:(Array.isArray(bounded.posts)?bounded.posts.length:0)+(Array.isArray(bounded.pages)?bounded.pages.length:0)+(Array.isArray(bounded.campaigns)?bounded.campaigns.length:0)+(Array.isArray(bounded.automationRuns)?bounded.automationRuns.length:0);
  const system='You are Heart Connect Admin Intelligence Copilot. You are an advisory analysis and drafting assistant, never an autonomous administrator. Use only the bounded operational context provided. Never infer protected or highly sensitive traits. Never request, reveal or reconstruct private messages, identity documents, credentials, passwords, tokens, payment secrets or private media. Never claim you banned, suspended, verified, refunded, deleted, published, sent or otherwise changed platform state. For moderation, verification, payments, deletion, bans, suspensions and safety decisions, provide analysis and a human-review checklist only. Format operational analysis using these headings when relevant: Facts observed, Risks or anomalies, Recommendations, Next admin actions. If the provided data is insufficient, say so clearly rather than guessing.';
  const user='Workspace: '+workspace+'\nTime range: '+range.key+'\nBounded context: '+JSON.stringify(context).slice(0,30000)+'\nAdmin request: '+prompt;
  try{
    const r=await env.AI.run(model,{messages:[{role:'system',content:system},{role:'user',content:user}]});const answer=text(r?.response||r?.result?.response||r?.text||'',10000)||'The configured AI provider returned no text.';
    await svc(env,'/rest/v1/hc_admin_ai_usage',{method:'POST',body:{actor_user_id:auth.actor.id,actor_email:auth.actor.email,actor_role:auth.actor.role,workspace,prompt_chars:prompt.length,provider:'cloudflare-workers-ai',outcome:'success',task_type:'copilot_'+workspace,model,context_rows:contextRows,output_chars:answer.length,correlation_id:correlationId,created_at:new Date().toISOString()},headers:{Prefer:'return=minimal'}});
    await audit(env,auth.actor,'admin.v42.copilot.run',workspace,{range:range.key,promptChars:prompt.length,outputChars:answer.length,contextRows,correlationId});
    return j({ok:true,answer,workspace,workspaceLabel:def.label,range:range.key,model,correlationId,contextRows,coverage:text(bounded.coverage||'available',40),privacy:text(bounded.privacy||'',1000),draftType:def.draftType,canSaveDraft:true,requiresHumanReview:true});
  }catch(e){
    await svc(env,'/rest/v1/hc_admin_ai_usage',{method:'POST',body:{actor_user_id:auth.actor.id,actor_email:auth.actor.email,actor_role:auth.actor.role,workspace,prompt_chars:prompt.length,provider:'cloudflare-workers-ai',outcome:'failed',task_type:'copilot_'+workspace,model,context_rows:contextRows,output_chars:0,correlation_id:correlationId,created_at:new Date().toISOString()},headers:{Prefer:'return=minimal'}});
    return j({error:'AI Copilot is temporarily unavailable.',correlationId},503);
  }
}

export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&(request.method==='GET'||request.method==='HEAD'))return page(adminHtml(VERSION),request.method==='HEAD');
  if(!p.startsWith('/api/admin/'))return handleAdminV39(request,env);
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{allow:'GET, POST, HEAD, OPTIONS'}});
  if(p==='/api/admin/ai/copilot/status'&&request.method==='GET')return copilotStatus(request,env);
  if(p==='/api/admin/ai/copilot/run'&&request.method==='POST')return copilotRun(request,env);
  return handleAdminV39(request,env);
}
