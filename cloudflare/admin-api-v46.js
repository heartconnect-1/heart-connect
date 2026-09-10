import {handleAdmin as handleAdminV45,runPhase7AndEarlierScheduled} from './admin-api-v45.js';
import {adminHtml} from './admin-ui-v46.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v46';

const DEFAULT_SUPABASE_URL='https://zzhzkikezjtbntaqiurk.supabase.co';
const BUCKET='admin-staff-photos';

function cfg(env){return{url:String(env.SUPABASE_URL||DEFAULT_SUPABASE_URL).replace(/\/+$/,''),service:String(env.SUPABASE_SERVICE_ROLE_KEY||'')}}
function j(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-heart-connect-admin':VERSION}})}
function page(html,head=false){const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store, max-age=0','pragma':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()','cross-origin-opener-policy':'same-origin','cross-origin-resource-policy':'same-origin','strict-transport-security':'max-age=31536000; includeSubDomains','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://api.mapbox.com; script-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src blob:; child-src blob:; frame-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",'x-heart-connect-admin':VERSION};return new Response(head?null:html,{status:200,headers})}
function text(v,n=1000){return String(v??'').trim().slice(0,n)}
function uuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''))}
function sameOrigin(request){if(['GET','HEAD','OPTIONS'].includes(request.method))return true;const site=request.headers.get('sec-fetch-site');if(site==='cross-site')return false;const origin=request.headers.get('origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}}
async function body(request,max=8_000_000){const raw=await request.text();if(raw.length>max)throw Object.assign(new Error('Photo request is too large.'),{status:413});try{return raw?JSON.parse(raw):{}}catch{throw Object.assign(new Error('Valid JSON is required.'),{status:400})}}
async function svc(env,path,{method='GET',body,headers:extra}={}){const c=cfg(env);if(!c.service)return{ok:false,status:503,data:{message:'Admin data service is not configured.'}};const headers=new Headers({apikey:c.service,authorization:'Bearer '+c.service,accept:'application/json',...(extra||{})});if(body!==undefined)headers.set('content-type','application/json');const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);try{const r=await fetch(c.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:ctl.signal}),raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}return{ok:r.ok,status:r.status,data,headers:r.headers}}catch(e){return{ok:false,status:503,data:{message:e?.name==='AbortError'?'Admin data request timed out.':'Admin data service is temporarily unavailable.'}}}finally{clearTimeout(timer)}}
async function rawStorage(env,path,{method='POST',bytes,contentType='application/octet-stream'}={}){const c=cfg(env);if(!c.service)return{ok:false,status:503,data:{message:'Admin data service is not configured.'}};const headers=new Headers({apikey:c.service,authorization:'Bearer '+c.service,accept:'application/json','content-type':contentType,'x-upsert':'true'});const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(c.url+path,{method,headers,body:bytes,signal:ctl.signal}),raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}return{ok:r.ok,status:r.status,data}}catch(e){return{ok:false,status:503,data:{message:e?.name==='AbortError'?'Staff photo upload timed out.':'Staff photo storage is temporarily unavailable.'}}}finally{clearTimeout(timer)}}
async function delegatedJson(request,env,path){const u=new URL(path,request.url),r=await handleAdminV45(new Request(u,{method:'GET',headers:request.headers}),env);let d={};try{d=await r.clone().json()}catch{}return{ok:r.ok,status:r.status,data:d,response:r}}
async function writeActor(request,env){const d=await delegatedJson(request,env,'/api/admin/capabilities');if(!d.ok)return{error:d.response};const a=d.data?.actor||null;if(!a||!['owner','super_admin'].includes(String(a.role||'')))return{error:j({error:'Only the owner or super-admin can manage staff photos.'},403)};const id=String(a.userId||a.id||'');if(!id)return{error:j({error:'Admin session is missing an account identifier.'},401)};return{actor:{...a,id}}}
function decodeData(input,ct){const prefix='data:'+ct+';base64,',raw=String(input||'').startsWith(prefix)?String(input).slice(prefix.length):String(input||'');if(!raw||!/^[A-Za-z0-9+/]*={0,2}$/.test(raw))return null;try{const bin=atob(raw),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out}catch{return null}}
function ascii(bytes,start,len){return String.fromCharCode(...bytes.slice(start,start+len))}
function validMagic(bytes,ct){if(bytes.length<12)return false;if(ct==='image/jpeg')return bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;if(ct==='image/png')return bytes[0]===0x89&&ascii(bytes,1,3)==='PNG';if(ct==='image/webp')return ascii(bytes,0,4)==='RIFF'&&ascii(bytes,8,4)==='WEBP';return false}
function ext(ct){return ct==='image/jpeg'?'jpg':ct==='image/png'?'png':'webp'}
async function sign(env,bucket,path){if(!path)return'';const r=await svc(env,'/storage/v1/object/sign/'+bucket+'/'+String(path).split('/').map(encodeURIComponent).join('/'),{method:'POST',body:{expiresIn:900}});return r.ok&&r.data?.signedURL?cfg(env).url+'/storage/v1'+r.data.signedURL:''}
async function audit(env,a,action,target,metadata={}){await svc(env,'/rest/v1/hc_admin_audit_log',{method:'POST',body:{actor_user_id:a.id,actor_email:a.email,actor_role:a.role,action,target,reason:null,metadata,created_at:new Date().toISOString()},headers:{Prefer:'return=minimal'}}).catch(()=>{})}

async function intelligence(request,env){
  const base=await delegatedJson(request,env,'/api/admin/staff/intelligence');if(!base.ok)return base.response;
  const items=Array.isArray(base.data?.items)?base.data.items:[],ids=items.map(x=>String(x.user_id||'')).filter(uuid),adminPhotos=new Map();
  if(ids.length&&cfg(env).service){
    const r=await svc(env,'/rest/v1/hc_admin_staff?select=user_id,photo_storage_path&user_id=in.('+ids.join(',')+')');
    if(r.ok&&Array.isArray(r.data))for(const x of r.data)if(x.photo_storage_path)adminPhotos.set(String(x.user_id),String(x.photo_storage_path));
  }
  const enriched=[];
  for(const x of items){
    const p=adminPhotos.get(String(x.user_id));let photoUrl=x.photoUrl||null,photoSource=x.photoSource||'initials_fallback';
    if(p){photoUrl=await sign(env,BUCKET,p);photoSource=photoUrl?'staff_directory_photo':photoSource}
    enriched.push({...x,photoUrl,photoSource,hasCustomStaffPhoto:!!p});
  }
  const withPhoto=enriched.filter(x=>x.photoUrl).length,customStaffPhotos=enriched.filter(x=>x.hasCustomStaffPhoto).length;
  return j({...base.data,version:VERSION,items:enriched,summary:{...(base.data?.summary||{}),withPhoto,customStaffPhotos},photoPolicy:'Staff directory photos can now be uploaded directly by the owner/super-admin. A private staff photo is preferred; otherwise the approved Heart Connect profile photo is used, then initials. Signed image links expire automatically.'});
}
async function uploadPhoto(request,env,userId){
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);if(!uuid(userId))return j({error:'Invalid staff member.'},400);
  const auth=await writeActor(request,env);if(auth.error)return auth.error;let b;try{b=await body(request)}catch(e){return j({error:e.message},e.status||400)}
  const ct=text(b.contentType,80),allowed=['image/jpeg','image/png','image/webp'];if(!allowed.includes(ct))return j({error:'Use a JPG, PNG or WebP image.'},400);
  const bytes=decodeData(b.data,ct);if(!bytes||bytes.length<16||bytes.length>5_000_000||!validMagic(bytes,ct))return j({error:'Use a valid JPG, PNG or WebP image up to 5 MB.'},400);
  const cur=await svc(env,'/rest/v1/hc_admin_staff?select=user_id,photo_storage_path&user_id=eq.'+encodeURIComponent(userId)+'&limit=1');const row=cur.ok&&Array.isArray(cur.data)?cur.data[0]:null;if(!row)return j({error:'Staff member not found.'},404);
  const path=userId+'/'+crypto.randomUUID()+'.'+ext(ct),objectPath='/storage/v1/object/'+BUCKET+'/'+path.split('/').map(encodeURIComponent).join('/'),up=await rawStorage(env,objectPath,{bytes,contentType:ct});if(!up.ok)return j({error:text(up.data?.message||'Staff photo could not be uploaded.')},up.status>=500?503:400);
  const patch=await svc(env,'/rest/v1/hc_admin_staff?user_id=eq.'+encodeURIComponent(userId),{method:'PATCH',body:{photo_storage_path:path,updated_at:new Date().toISOString()},headers:{Prefer:'return=representation'}});if(!patch.ok){await rawStorage(env,objectPath,{method:'DELETE'}).catch(()=>{});return j({error:text(patch.data?.message||'Staff photo record could not be saved.')},500)}
  if(row.photo_storage_path&&row.photo_storage_path!==path){const old='/storage/v1/object/'+BUCKET+'/'+String(row.photo_storage_path).split('/').map(encodeURIComponent).join('/');await rawStorage(env,old,{method:'DELETE'}).catch(()=>{})}
  await audit(env,auth.actor,'admin.staff.photo.update',userId,{bucket:BUCKET,contentType:ct,size:bytes.length});
  return j({ok:true,userId,photoUrl:await sign(env,BUCKET,path),notice:'Staff directory photo updated. The image remains private and is served through an expiring signed URL.'});
}
async function removePhoto(request,env,userId){
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);if(!uuid(userId))return j({error:'Invalid staff member.'},400);
  const auth=await writeActor(request,env);if(auth.error)return auth.error;
  const cur=await svc(env,'/rest/v1/hc_admin_staff?select=user_id,photo_storage_path&user_id=eq.'+encodeURIComponent(userId)+'&limit=1');const row=cur.ok&&Array.isArray(cur.data)?cur.data[0]:null;if(!row)return j({error:'Staff member not found.'},404);
  await svc(env,'/rest/v1/hc_admin_staff?user_id=eq.'+encodeURIComponent(userId),{method:'PATCH',body:{photo_storage_path:null,updated_at:new Date().toISOString()},headers:{Prefer:'return=minimal'}});
  if(row.photo_storage_path){const old='/storage/v1/object/'+BUCKET+'/'+String(row.photo_storage_path).split('/').map(encodeURIComponent).join('/');await rawStorage(env,old,{method:'DELETE'}).catch(()=>{})}
  await audit(env,auth.actor,'admin.staff.photo.remove',userId,{bucket:BUCKET});
  return j({ok:true,userId});
}

export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&(request.method==='GET'||request.method==='HEAD'))return page(adminHtml(VERSION),request.method==='HEAD');
  if(p==='/api/admin/staff/intelligence'&&request.method==='GET')return intelligence(request,env);
  const m=p.match(/^\/api\/admin\/staff\/([0-9a-f-]+)\/photo$/i);
  if(m&&request.method==='POST')return uploadPhoto(request,env,m[1]);
  if(m&&request.method==='DELETE')return removePhoto(request,env,m[1]);
  return handleAdminV45(request,env);
}
