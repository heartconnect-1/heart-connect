import {handleAdmin as handleAdminV37,runPhase7AndEarlierScheduled} from './admin-api-v37.js';
import {adminHtml} from './admin-ui-v38.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v38';

const ACCESS_COOKIE='__Host-hc_cf_access';
const DEFAULT_SUPABASE_URL='https://zzhzkikezjtbntaqiurk.supabase.co';
const DEFAULT_PUBLISHABLE_KEY='sb_publishable_HB0Irz6bxug1hHs518oPZQ_LC83i4qT';
const ALL_ADMIN_ROLES=['owner','super_admin','admin','moderator','senior_moderator','safety_specialist','payment_specialist','support_agent','content_manager','verification_specialist','finance'];
const RECOVERY_ROLES=['owner','super_admin','admin'];

function cfg(env){return{url:String(env.SUPABASE_URL||DEFAULT_SUPABASE_URL).replace(/\/+$/,''),publishable:String(env.SUPABASE_PUBLISHABLE_KEY||DEFAULT_PUBLISHABLE_KEY),service:String(env.SUPABASE_SERVICE_ROLE_KEY||'')}}
function cookies(request){const out={};for(const part of String(request.headers.get('cookie')||'').split(';')){const i=part.indexOf('=');if(i>0){const k=part.slice(0,i).trim();try{out[k]=decodeURIComponent(part.slice(i+1).trim())}catch{out[k]=part.slice(i+1).trim()}}}return out}
function text(v,n=1000){return String(v??'').trim().slice(0,n)}
function email(v){const s=text(v,320).toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:''}
function emails(v){return String(v||'').split(',').map(email).filter(Boolean)}
function uuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''))}
function clamp(v,min,max,fallback=min){const x=Number(v);return Math.max(min,Math.min(max,Number.isFinite(x)?Math.floor(x):fallback))}
function clean(v){if(Array.isArray(v))return v.slice(0,100).map(clean);if(v&&typeof v==='object'){const out={};for(const [k,x] of Object.entries(v)){if(/secret|password|token|authorization|api.?key|private.?key|credential|recipient_user_id/i.test(k))continue;out[text(k,100)]=clean(x)}return out}if(typeof v==='string')return v.slice(0,5000);if(typeof v==='number'||typeof v==='boolean'||v===null)return v;return String(v??'').slice(0,5000)}
function j(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-heart-connect-admin':VERSION,...extra}})}
function page(html,head=false){const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store, max-age=0','pragma':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()','cross-origin-opener-policy':'same-origin','cross-origin-resource-policy':'same-origin','strict-transport-security':'max-age=31536000; includeSubDomains','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://api.mapbox.com; script-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src blob:; child-src blob:; frame-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",'x-heart-connect-admin':VERSION};return new Response(head?null:html,{status:200,headers})}
function unsafe(request){return !['GET','HEAD','OPTIONS'].includes(request.method)}
function sameOrigin(request){if(!unsafe(request))return true;const site=request.headers.get('sec-fetch-site');if(site==='cross-site')return false;const origin=request.headers.get('origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}}
async function jsonBody(request,max=30000){const raw=await request.text();if(raw.length>max)throw Object.assign(new Error('Request is too large.'),{status:413});try{return raw?JSON.parse(raw):{}}catch{throw Object.assign(new Error('Valid JSON is required.'),{status:400})}}
async function session(request,env){const c=cfg(env),token=cookies(request)[ACCESS_COOKIE]||'';if(!token)return null;try{const r=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.publishable,authorization:'Bearer '+token,accept:'application/json'}});if(!r.ok)return null;const u=await r.json();return u?.id?{id:u.id,email:email(u.email)}:null}catch{return null}}
async function svc(env,path,{method='GET',body,headers:extra}={}){const c=cfg(env);if(!c.service)return{ok:false,status:503,data:{message:'Admin data service is not configured.'},headers:new Headers()};const headers=new Headers({apikey:c.service,authorization:'Bearer '+c.service,accept:'application/json',...(extra||{})});if(body!==undefined)headers.set('content-type','application/json');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(c.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});const raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}return{ok:r.ok,status:r.status,data,headers:r.headers}}catch(e){return{ok:false,status:503,data:{message:e?.name==='AbortError'?'Supabase admin request timed out.':'Supabase admin service is temporarily unavailable.'},headers:new Headers()}}finally{clearTimeout(timer)}}
async function actor(request,env){const u=await session(request,env);if(!u)return null;const owners=[...emails(env.HEART_CONNECT_OWNER_EMAILS),...emails(env.HEART_CONNECT_ADMIN_EMAILS)];if(owners.includes(u.email))return{...u,role:'owner',displayName:'Platform Owner'};const r=await svc(env,'/rest/v1/hc_admin_staff?select=role,status,display_name&user_id=eq.'+encodeURIComponent(u.id)+'&status=eq.active&limit=1'),row=r.ok&&Array.isArray(r.data)?r.data[0]:null;return row?{...u,role:String(row.role||''),displayName:text(row.display_name,100)||u.email}:null}
async function requireRoles(request,env,roles){const a=await actor(request,env);if(!a)return{error:j({error:'Admin access denied.'},403)};if(!roles.includes(a.role))return{error:j({error:'Your admin role does not allow this operation.',role:a.role},403),actor:a};return{actor:a}}
async function audit(env,a,action,target='',reason='',metadata={}){if(!a)return;await svc(env,'/rest/v1/hc_admin_audit_log',{method:'POST',body:{actor_user_id:a.id,actor_email:a.email,actor_role:a.role,action:text(action,120),target:text(target,240),reason:text(reason,1000)||null,metadata:clean(metadata),created_at:new Date().toISOString()},headers:{Prefer:'return=minimal'}}).catch(()=>{})}
async function list(env,table,select,order='created_at.desc',limit=100,filter=''){return svc(env,'/rest/v1/'+table+'?select='+encodeURIComponent(select)+(filter?'&'+filter:'')+'&order='+encodeURIComponent(order)+'&limit='+clamp(limit,1,500,100))}
async function one(env,table,select,filter){const r=await svc(env,'/rest/v1/'+table+'?select='+encodeURIComponent(select)+'&'+filter+'&limit=1');return{...r,row:r.ok&&Array.isArray(r.data)?(r.data[0]||null):null}}
async function count(env,table,filter=''){const r=await svc(env,'/rest/v1/'+table+'?select=id&limit=1'+(filter?'&'+filter:''),{headers:{Prefer:'count=exact',Range:'0-0'}});if(!r.ok)return{ok:false,value:null,response:r};const cr=String(r.headers.get('content-range')||''),n=Number(cr.split('/')[1]);return{ok:true,value:Number.isFinite(n)?n:(Array.isArray(r.data)?r.data.length:0),response:r}}
function aggregateRuns(rows){const out={runs:rows.length,completed:0,partial:0,failed:0,processed:0,success:0,failedItems:0,skipped:0};for(const x of rows){if(x.status==='completed')out.completed++;if(x.status==='partial')out.partial++;if(x.status==='failed')out.failed++;out.processed+=Number(x.processed_count||0);out.success+=Number(x.success_count||0);out.failedItems+=Number(x.failed_count||0);out.skipped+=Number(x.skipped_count||0)}out.health=out.runs?Math.round(out.completed/out.runs*100):100;out.deliverySuccess=(out.success+out.failedItems)?Math.round(out.success/(out.success+out.failedItems)*100):100;return out}
function aggregateAi(rows){const out={requests:rows.length,success:0,failed:0,unavailable:0,contextRows:0,outputChars:0,tasks:{}};for(const x of rows){const o=String(x.outcome||'unknown');if(o==='success')out.success++;else if(o==='failed')out.failed++;else if(o==='unavailable')out.unavailable++;out.contextRows+=Number(x.context_rows||0);out.outputChars+=Number(x.output_chars||0);const t=String(x.task_type||'unknown');out.tasks[t]=(out.tasks[t]||0)+1}out.successRate=out.requests?Math.round(out.success/out.requests*100):100;return out}
function ageMinutes(v){const ms=Date.now()-Date.parse(String(v||''));return Number.isFinite(ms)?Math.max(0,ms/60000):null}

async function enterpriseStatus(request,env){
  const auth=await requireRoles(request,env,ALL_ADMIN_ROLES);if(auth.error)return auth.error;
  const now=Date.now(),since24=new Date(now-86400000).toISOString(),since7=new Date(now-7*86400000).toISOString();
  const [settingsR,runsR,aiR,failedR,queued,sending,sent,failedCount]=await Promise.all([
    list(env,'hc_admin_automation_settings','key,enabled,config,locked,updated_at','key.asc',20),
    list(env,'hc_admin_automation_runs','id,automation_key,trigger_source,status,scanned_count,processed_count,success_count,failed_count,skipped_count,metadata,error_summary,started_at,finished_at','started_at.desc',500,'started_at=gte.'+encodeURIComponent(since7)),
    list(env,'hc_admin_ai_usage','task_type,model,context_rows,output_chars,outcome,workspace,created_at','created_at.desc',500,'created_at=gte.'+encodeURIComponent(since7)),
    list(env,'hc_notification_delivery_queue','id,campaign_id,channel,status,provider,error_code,attempt_count,next_attempt_at,created_at,updated_at','updated_at.desc',50,'channel=eq.in_app&status=eq.failed'),
    count(env,'hc_notification_delivery_queue','channel=eq.in_app&status=eq.queued'),
    count(env,'hc_notification_delivery_queue','channel=eq.in_app&status=eq.sending'),
    count(env,'hc_notification_delivery_queue','channel=eq.in_app&status=eq.sent'),
    count(env,'hc_notification_delivery_queue','channel=eq.in_app&status=eq.failed')
  ]);
  const settings=settingsR.ok?(settingsR.data||[]):[],runs7=runsR.ok?(runsR.data||[]):[],runs24=runs7.filter(x=>Date.parse(x.started_at)>=Date.parse(since24)),ai7=aiR.ok?(aiR.data||[]):[],ai24=ai7.filter(x=>Date.parse(x.created_at)>=Date.parse(since24));
  const nativeSetting=settings.find(x=>x.key==='native_in_app_delivery'),maxAttempts=clamp(nativeSetting?.config?.max_attempts,1,10,5);
  const failedRows=(failedR.ok?(failedR.data||[]):[]).map(x=>({...x,deadLetter:Number(x.attempt_count||0)>=maxAttempts}));
  const ids=[...new Set(failedRows.map(x=>x.campaign_id).filter(uuid))];
  let titles={};
  if(ids.length){const c=await list(env,'hc_notification_campaigns','id,title,status','updated_at.desc',Math.min(ids.length,100),'id=in.('+ids.join(',')+')');if(c.ok)for(const x of c.data||[])titles[x.id]={title:x.title,status:x.status}}
  const safeFailed=failedRows.map(x=>({...x,campaignTitle:titles[x.campaign_id]?.title||'Campaign',campaignStatus:titles[x.campaign_id]?.status||null}));
  const latestScheduler=runs7.find(x=>x.automation_key==='notification_scheduler'),latestDelivery=runs7.find(x=>x.automation_key==='native_in_app_delivery'),schedulerAge=ageMinutes(latestScheduler?.started_at),deliveryAge=ageMinutes(latestDelivery?.started_at),cronHealthy=schedulerAge!==null&&deliveryAge!==null&&schedulerAge<=8&&deliveryAge<=8;
  const r24=aggregateRuns(runs24),r7=aggregateRuns(runs7),a24=aggregateAi(ai24),a7=aggregateAi(ai7),deadLetters=safeFailed.filter(x=>x.deadLetter).length;
  const incidents=[];if(!cronHealthy)incidents.push({severity:'high',code:'cron_stale',message:'One or more recurring automation jobs have not produced recent evidence within the expected window.'});if(deadLetters)incidents.push({severity:'high',code:'dead_letters',message:deadLetters+' delivery item(s) exhausted the configured retry budget.'});if(r24.failed)incidents.push({severity:'medium',code:'failed_runs',message:r24.failed+' automation run(s) failed in the last 24 hours.'});if(Number(failedCount.value||0)>10)incidents.push({severity:'medium',code:'queue_failures',message:'Failed delivery backlog is above the normal review threshold.'});
  let score=100;if(!cfg(env).service)score-=30;if(!env.AI)score-=10;if(!cronHealthy)score-=25;if(deadLetters)score-=15;if(r24.failed)score-=10;if(Number(failedCount.value||0)>10)score-=10;score=Math.max(0,score);
  await audit(env,auth.actor,'admin.phase8.enterprise_status','','',{score,incidentCount:incidents.length});
  return j({version:VERSION,actor:{role:auth.actor.role,displayName:auth.actor.displayName},score,cron:{healthy:cronHealthy,expectedMinutes:5,staleAfterMinutes:8,scheduler:{lastAt:latestScheduler?.started_at||null,ageMinutes:schedulerAge},delivery:{lastAt:latestDelivery?.started_at||null,ageMinutes:deliveryAge}},runs:{last24h:r24,last7d:r7},ai:{last24h:a24,last7d:a7,model:ai24[0]?.model||ai7[0]?.model||null},queue:{queued:queued.value,sending:sending.value,sent:sent.value,failed:failedCount.value,deadLetters,maxAttempts},failedDeliveries:safeFailed,incidents,providers:{inApp:{ready:true,label:'Heart Connect native'},workersAI:{ready:!!env.AI,label:'Cloudflare Workers AI'},email:{ready:false,label:'Email adapter'},push:{ready:false,label:'Push adapter'},sms:{ready:false,label:'SMS adapter'},whatsapp:{ready:false,label:'WhatsApp adapter'},social:{ready:false,label:'Social publishing'}},ownerOnlyControls:auth.actor.role==='owner'});
}

async function dryRun(request,env){
  const auth=await requireRoles(request,env,ALL_ADMIN_ROLES);if(auth.error)return auth.error;let b;try{b=await jsonBody(request)}catch(e){return j({error:e.message},e.status||400)}
  const id=text(b.campaignId,80);if(!uuid(id))return j({error:'Choose a valid campaign.'},400);
  const c=await one(env,'hc_notification_campaigns','id,title,status,audience,channels,scheduled_for,deleted_at','id=eq.'+encodeURIComponent(id));if(!c.ok)return j({error:text(c.data?.message||'Campaign could not be loaded.')},500);if(!c.row||c.row.deleted_at)return j({error:'Campaign not found.'},404);
  const a=c.row.audience&&typeof c.row.audience==='object'?c.row.audience:{type:'all'},type=text(a.type||'all',30);
  let exact=0,availability=true,filter='';
  if(type==='user_list')exact=(Array.isArray(a.userIds)?a.userIds:[]).filter(uuid).length;
  else{if(type==='country')filter='country=eq.'+encodeURIComponent(text(a.country,100));else if(type==='verified')filter='verification_level=neq.unverified';else if(type==='inactive'){const days=clamp(a.inactiveDays,7,365,30),before=new Date(Date.now()-days*86400000).toISOString();filter='last_active_at=lt.'+encodeURIComponent(before)}else if(type==='tier')filter='tier=eq.'+encodeURIComponent(text(a.tier,30));const cr=await count(env,'dating_profiles',filter);availability=cr.ok;exact=cr.ok?Number(cr.value||0):0}
  const s=await one(env,'hc_admin_automation_settings','key,config','key=eq.notification_scheduler'),maxRecipients=clamp(s.row?.config?.max_recipients_per_campaign,1,500,500),willQueue=Math.min(exact,maxRecipients);
  await audit(env,auth.actor,'admin.phase8.campaign_dry_run',id,'',{audienceType:type,estimatedRecipients:exact,willQueue});
  return j({ok:true,campaign:{id:c.row.id,title:c.row.title,status:c.row.status,scheduledFor:c.row.scheduled_for},audienceType:type,estimatedRecipients:exact,willQueue,limited:exact>maxRecipients,maxRecipientsPerCampaign:maxRecipients,channels:clean(c.row.channels||{}),availability,note:'Read-only simulation. No campaign, notification, queue row or member account was changed.'});
}

async function retryFailed(request,env){
  const auth=await requireRoles(request,env,RECOVERY_ROLES);if(auth.error)return auth.error;let b;try{b=await jsonBody(request)}catch(e){return j({error:e.message},e.status||400)}
  if(text(b.confirmation,20)!=='RETRY')return j({error:'Type RETRY to requeue failed native deliveries.',confirmation:'RETRY'},409);
  const reason=text(b.reason,500);if(reason.length<3)return j({error:'Add a short recovery reason.'},400);
  let ids=(Array.isArray(b.ids)?b.ids:[]).filter(uuid).slice(0,25);
  if(!ids.length){const r=await list(env,'hc_notification_delivery_queue','id','updated_at.asc',25,'channel=eq.in_app&status=eq.failed');if(r.ok)ids=(r.data||[]).map(x=>x.id).filter(uuid)}
  if(!ids.length)return j({ok:true,requeued:0,note:'No failed native deliveries are waiting for recovery.'});
  let requeued=0,skipped=0;
  for(const id of ids){const r=await svc(env,'/rest/v1/hc_notification_delivery_queue?id=eq.'+encodeURIComponent(id)+'&channel=eq.in_app&status=eq.failed',{method:'PATCH',body:{status:'queued',attempt_count:0,next_attempt_at:null,error_code:null,updated_at:new Date().toISOString()},headers:{Prefer:'return=representation'}});if(r.ok&&Array.isArray(r.data)&&r.data.length)requeued++;else skipped++}
  await audit(env,auth.actor,'admin.phase8.retry_failed','native_in_app',reason,{requested:ids.length,requeued,skipped});
  return j({ok:true,requeued,skipped,limit:25,note:'Recovered rows were reset to queued for the normal bounded native delivery worker. This response is not proof of delivery.'});
}

async function controlAll(request,env){
  const auth=await requireRoles(request,env,['owner']);if(auth.error)return auth.error;let b;try{b=await jsonBody(request)}catch(e){return j({error:e.message},e.status||400)}
  const action=text(b.action,20),pause=action==='pause',resume=action==='resume';if(!pause&&!resume)return j({error:'Choose pause or resume.'},400);const expected=pause?'PAUSE ALL':'RESUME ALL';if(text(b.confirmation,30)!==expected)return j({error:'Type '+expected+' to continue.',confirmation:expected},409);const reason=text(b.reason,500);if(reason.length<3)return j({error:'Add a short operational reason.'},400);
  const enabled=resume;let changed=0;
  for(const key of ['notification_scheduler','native_in_app_delivery']){const r=await svc(env,'/rest/v1/hc_admin_automation_settings?key=eq.'+encodeURIComponent(key),{method:'PATCH',body:{enabled,updated_by:auth.actor.id,updated_at:new Date().toISOString()},headers:{Prefer:'return=representation'}});if(r.ok&&Array.isArray(r.data)&&r.data.length)changed++}
  await audit(env,auth.actor,pause?'admin.phase8.pause_all':'admin.phase8.resume_all','automation',reason,{changed});
  return j({ok:true,action,changed,note:pause?'Native scheduler and delivery are paused. The site remains online.':'Native scheduler and delivery are enabled again.'});
}

export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&(request.method==='GET'||request.method==='HEAD'))return page(adminHtml(VERSION),request.method==='HEAD');
  if(!p.startsWith('/api/admin/'))return handleAdminV37(request,env);
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{allow:'GET, POST, HEAD, OPTIONS'}});
  if(p==='/api/admin/automation/enterprise-status'&&request.method==='GET')return enterpriseStatus(request,env);
  if(p==='/api/admin/automation/dry-run'&&request.method==='POST')return dryRun(request,env);
  if(p==='/api/admin/automation/retry-failed'&&request.method==='POST')return retryFailed(request,env);
  if(p==='/api/admin/automation/control-all'&&request.method==='POST')return controlAll(request,env);
  return handleAdminV37(request,env);
}
