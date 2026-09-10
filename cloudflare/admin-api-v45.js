import {handleAdmin as handleAdminV44,runPhase7AndEarlierScheduled} from './admin-api-v44.js';
import {adminHtml} from './admin-ui-v45.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v45';

const DEFAULT_SUPABASE_URL='https://zzhzkikezjtbntaqiurk.supabase.co';
const ROLE_MATRIX={
  owner:['all'],
  super_admin:['all'],
  admin:['overview','users','payments','markets','moderation','verification','cms','notifications','analytics','settings','audit','ai','incidents','reports','exports'],
  moderator:['overview','users:read','moderation'],
  senior_moderator:['overview','users:read','moderation','verification:read','audit:read','incidents','reports:moderation'],
  safety_specialist:['overview','users:read','moderation','verification','audit:read','incidents','reports:moderation'],
  payment_specialist:['overview','users:read','payments','audit:read','incidents:payments','reports:payments'],
  support_agent:['overview','users:read','notifications:read'],
  content_manager:['overview','cms','notifications','analytics:read','reports:content'],
  verification_specialist:['overview','users:read','verification','audit:read','reports:verification'],
  finance:['overview','users:read','payments','analytics:read','audit:read','reports:payments']
};
const ROLE_INFO={
  super_admin:{label:'Super Admin',summary:'Full delegated administration. Treat as highly privileged.'},
  admin:{label:'Admin',summary:'Broad operational administration across core control-plane areas.'},
  moderator:{label:'Moderator',summary:'Member lookup and moderation work.'},
  senior_moderator:{label:'Senior Moderator',summary:'Moderation plus incident, report and verification-read access.'},
  safety_specialist:{label:'Safety Specialist',summary:'Safety, moderation, verification and incident response.'},
  payment_specialist:{label:'Payment Specialist',summary:'Payment operations, payment incidents and payment reports.'},
  support_agent:{label:'Support Agent',summary:'Member lookup and read-only notification support.'},
  content_manager:{label:'Content Manager',summary:'CMS, notifications and content reporting.'},
  verification_specialist:{label:'Verification Specialist',summary:'Verification operations and verification reporting.'},
  finance:{label:'Finance',summary:'Payments, analytics-read and payment reporting.'}
};

function cfg(env){return{url:String(env.SUPABASE_URL||DEFAULT_SUPABASE_URL).replace(/\/+$/,''),service:String(env.SUPABASE_SERVICE_ROLE_KEY||'')}}
function j(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-heart-connect-admin':VERSION}})}
function page(html,head=false){const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store, max-age=0','pragma':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()','cross-origin-opener-policy':'same-origin','cross-origin-resource-policy':'same-origin','strict-transport-security':'max-age=31536000; includeSubDomains','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://api.mapbox.com; script-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src blob:; child-src blob:; frame-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",'x-heart-connect-admin':VERSION};return new Response(head?null:html,{status:200,headers})}
async function svc(env,path,{method='GET',body,headers:extra}={}){const c=cfg(env);if(!c.service)return{ok:false,status:503,data:{message:'Admin data service is not configured.'},headers:new Headers()};const headers=new Headers({apikey:c.service,authorization:'Bearer '+c.service,accept:'application/json',...(extra||{})});if(body!==undefined)headers.set('content-type','application/json');const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(c.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:ctl.signal}),raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}return{ok:r.ok,status:r.status,data,headers:r.headers}}catch(e){return{ok:false,status:503,data:{message:e?.name==='AbortError'?'Admin data request timed out.':'Admin data service is temporarily unavailable.'},headers:new Headers()}}finally{clearTimeout(timer)}}
async function delegateJson(request,env,path){const u=new URL(path,request.url),r=await handleAdminV44(new Request(u,{method:'GET',headers:request.headers}),env);let d={};try{d=await r.clone().json()}catch{}return{ok:r.ok,status:r.status,data:d,response:r}}
async function signPhoto(env,storagePath){if(!storagePath)return'';const path=String(storagePath).split('/').map(encodeURIComponent).join('/'),r=await svc(env,'/storage/v1/object/sign/profile-media/'+path,{method:'POST',body:{expiresIn:900}});const signed=r.ok?r.data?.signedURL:'';return signed?cfg(env).url+'/storage/v1'+signed:''}

async function staffIntelligence(request,env){
  const base=await delegateJson(request,env,'/api/admin/staff');if(!base.ok)return base.response;
  const caps=await delegateJson(request,env,'/api/admin/capabilities');
  const actor=caps.ok?(caps.data?.actor||{}):{},items=Array.isArray(base.data?.items)?base.data.items:[],ids=items.map(x=>String(x.user_id||'')).filter(Boolean);
  let profiles=[],media=[],audit=[];
  if(cfg(env).service&&ids.length){
    const inList='('+ids.join(',')+')';
    const [pr,mr,ar]=await Promise.all([
      svc(env,'/rest/v1/dating_profiles?select=user_id,display_name,country,city,verification_level,profile_completion,last_active_at,created_at&user_id=in.'+inList),
      svc(env,'/rest/v1/profile_media?select=user_id,storage_path,is_primary,position,moderation_status,media_type,created_at&user_id=in.'+inList+'&media_type=eq.photo&moderation_status=eq.approved&order=position.asc'),
      svc(env,'/rest/v1/hc_admin_audit_log?select=id,actor_email,actor_role,action,target,metadata,created_at&action=like.admin.staff.*&order=created_at.desc&limit=60')
    ]);
    if(pr.ok&&Array.isArray(pr.data))profiles=pr.data;
    if(mr.ok&&Array.isArray(mr.data))media=mr.data;
    if(ar.ok&&Array.isArray(ar.data))audit=ar.data;
  }else if(cfg(env).service){
    const ar=await svc(env,'/rest/v1/hc_admin_audit_log?select=id,actor_email,actor_role,action,target,metadata,created_at&action=like.admin.staff.*&order=created_at.desc&limit=60');
    if(ar.ok&&Array.isArray(ar.data))audit=ar.data;
  }
  const profileBy=new Map(profiles.map(x=>[String(x.user_id),x]));
  const mediaBy=new Map();
  for(const x of media){const k=String(x.user_id||'');if(!mediaBy.has(k)||x.is_primary)mediaBy.set(k,x)}
  const signTargets=items.slice(0,50).map(async x=>{const m=mediaBy.get(String(x.user_id));return[String(x.user_id),m?await signPhoto(env,m.storage_path):'']});
  const signed=new Map(await Promise.all(signTargets));
  const enriched=items.map(x=>{
    const id=String(x.user_id||''),p=profileBy.get(id)||{},m=mediaBy.get(id)||null;
    return{...x,photoUrl:signed.get(id)||null,photoSource:m?'approved_profile_photo':'initials_fallback',profile:{country:p.country||null,city:p.city||null,verificationLevel:p.verification_level||'unverified',profileCompletion:p.profile_completion??null,lastActiveAt:p.last_active_at||null,memberSince:p.created_at||null}}
  });
  const total=enriched.length,active=enriched.filter(x=>x.status==='active').length,suspended=enriched.filter(x=>x.status==='suspended').length,inactive=enriched.filter(x=>x.status==='inactive').length,highPrivilege=enriched.filter(x=>x.status==='active'&&['super_admin','admin'].includes(x.role)).length,withPhoto=enriched.filter(x=>x.photoUrl).length,recentlyActive=enriched.filter(x=>{const t=Date.parse(x.profile?.lastActiveAt||'');return Number.isFinite(t)&&Date.now()-t<7*86400000}).length;
  return j({version:VERSION,actor:{role:actor.role||null,displayName:actor.displayName||actor.email||null},canManage:['owner','super_admin'].includes(String(actor.role||'')),items:enriched,roles:base.data?.roles||Object.keys(ROLE_INFO),roleMatrix:ROLE_MATRIX,roleInfo:ROLE_INFO,summary:{total,active,inactive,suspended,highPrivilege,withPhoto,recentlyActive},recentStaffActivity:audit,photoPolicy:'Staff cards use the member account’s approved primary profile photo when available. Otherwise an initials avatar is shown. Signed photo links expire automatically.',rule:'Only owner/super-admin can add or change staff roles. Role changes are audit-logged and resolve existing Heart Connect accounts by exact email.'});
}

export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&(request.method==='GET'||request.method==='HEAD'))return page(adminHtml(VERSION),request.method==='HEAD');
  if(p==='/api/admin/staff/intelligence'&&request.method==='GET')return staffIntelligence(request,env);
  return handleAdminV44(request,env);
}
