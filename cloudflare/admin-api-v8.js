import {handleAdmin as handleAdminV7,runPhase7AndEarlierScheduled} from './admin-api-v7.js';
import {adminHtml} from './admin-ui-v8.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v8';

const DEFAULT_SUPABASE_URL='https://zzhzkikezjtbntaqiurk.supabase.co';
const ROLES=['super_admin','admin','moderator','senior_moderator','safety_specialist','payment_specialist','support_agent','content_manager','verification_specialist','finance'];

function cfg(env){return{url:String(env.SUPABASE_URL||DEFAULT_SUPABASE_URL).replace(/\/+$/,''),service:String(env.SUPABASE_SERVICE_ROLE_KEY||'')}}
function text(v,n=1000){return String(v??'').trim().slice(0,n)}
function email(v){const s=text(v,320).toLowerCase();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:''}
function j(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-heart-connect-admin':VERSION}})}
function page(html){return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin','x-frame-options':'DENY','content-security-policy':"default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",'x-heart-connect-admin':VERSION}})}
function sameOrigin(request){const site=request.headers.get('sec-fetch-site');if(site==='cross-site')return false;const origin=request.headers.get('origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}}
async function jsonBody(request,max=50000){const raw=await request.text();if(raw.length>max)throw Object.assign(new Error('Request is too large.'),{status:413});try{return raw?JSON.parse(raw):{}}catch{throw Object.assign(new Error('Valid JSON is required.'),{status:400})}}
async function svc(env,path,{method='GET',body,headers:extra}={}){const c=cfg(env);if(!c.service)return{ok:false,status:503,data:{message:'Admin data service is not configured.'},headers:new Headers()};const headers=new Headers({apikey:c.service,authorization:'Bearer '+c.service,accept:'application/json',...extra});if(body!==undefined)headers.set('content-type','application/json');try{const r=await fetch(c.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)}),raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}return{ok:r.ok,status:r.status,data,headers:r.headers}}catch{return{ok:false,status:503,data:{message:'Supabase admin service is temporarily unavailable.'},headers:new Headers()}}}

async function writeActor(request,env){
  const u=new URL(request.url);u.pathname='/api/admin/capabilities';u.search='';
  const r=await handleAdminV7(new Request(u.toString(),{method:'GET',headers:request.headers}),env);
  if(!r)return{error:j({error:'Admin authentication could not be verified.'},401)};
  let d={};try{d=await r.clone().json()}catch{}
  if(!r.ok)return{error:j({error:d.error||'Admin authentication required.'},r.status)};
  const actor=d.actor||null;
  if(!actor||!['owner','super_admin'].includes(String(actor.role||'')))return{error:j({error:'Only the owner or super-admin can add or change staff roles.'},403)};
  return{actor};
}

async function resolveUser(env,mail){
  const r=await svc(env,'/rest/v1/rpc/hc_admin_resolve_auth_user_by_email',{method:'POST',body:{p_email:mail}});
  if(!r.ok)return{error:j({error:text(r.data?.message||'Heart Connect account lookup failed.')},r.status===503?503:500)};
  const row=Array.isArray(r.data)?r.data[0]:r.data;
  if(!row?.user_id)return{error:j({error:'No Heart Connect account exists with that email. Ask the person to create and verify their Heart Connect account first.'},404)};
  return{row};
}

async function saveStaffByEmail(request,env){
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);
  const auth=await writeActor(request,env);if(auth.error)return auth.error;
  let b;try{b=await jsonBody(request)}catch(e){return j({error:e.message},e.status||400)}
  const mail=email(b.email),role=text(b.role,40),status=text(b.status||'active',20),requestedName=text(b.displayName,100);
  if(!mail||!ROLES.includes(role)||!['active','inactive','suspended'].includes(status))return j({error:'Provide a valid email, staff role and status.'},400);
  const found=await resolveUser(env,mail);if(found.error)return found.error;
  const userId=String(found.row.user_id||'');
  if(userId===String(auth.actor.userId||'')&&(status!=='active'||role!==String(auth.actor.role||''))){
    return j({error:'For safety, you cannot deactivate or change your own current admin role from this screen.'},409);
  }
  const displayName=requestedName||text(found.row.display_name,100)||mail.split('@')[0];
  const row={user_id:userId,email:mail,display_name:displayName,role,status,created_by:auth.actor.userId,updated_at:new Date().toISOString()};
  const saved=await svc(env,'/rest/v1/hc_admin_staff?on_conflict=user_id',{method:'POST',body:row,headers:{Prefer:'resolution=merge-duplicates,return=representation'}});
  if(!saved.ok)return j({error:text(saved.data?.message||'Staff role could not be saved.')},saved.status===503?503:500);
  await svc(env,'/rest/v1/hc_admin_audit_log',{method:'POST',body:{actor_user_id:auth.actor.userId,actor_email:auth.actor.email,actor_role:auth.actor.role,action:'admin.staff.save_by_email',target:userId,reason:null,metadata:{email:mail,role,status,resolution:'exact_email_service_role_rpc'},created_at:new Date().toISOString()},headers:{Prefer:'return=minimal'}}).catch(()=>{});
  return j({ok:true,item:Array.isArray(saved.data)?saved.data[0]:saved.data,resolvedBy:'email'});
}

export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&request.method==='GET')return page(adminHtml(VERSION));
  if(p==='/api/admin/staff'&&request.method==='POST')return saveStaffByEmail(request,env);
  return handleAdminV7(request,env);
}
