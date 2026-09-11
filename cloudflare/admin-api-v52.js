import {handleAdmin as handleAdminV51,runPhase7AndEarlierScheduled} from './admin-api-v51.js';
import {adminHtml} from './admin-ui-v52.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v52-homepage-cms';

const DEFAULT_SUPABASE_URL='https://zzhzkikezjtbntaqiurk.supabase.co';
const BUCKET='homepage-showcase';

function cfg(env){return{url:String(env.SUPABASE_URL||DEFAULT_SUPABASE_URL).replace(/\/+$/,''),service:String(env.SUPABASE_SERVICE_ROLE_KEY||'')}}
function j(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-heart-connect-admin':VERSION}})}
function page(html,head=false){const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store, no-cache, must-revalidate, max-age=0','pragma':'no-cache','expires':'0','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()','cross-origin-opener-policy':'same-origin','cross-origin-resource-policy':'same-origin','strict-transport-security':'max-age=31536000; includeSubDomains','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://api.mapbox.com; script-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src blob:; child-src blob:; frame-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",'x-heart-connect-admin':VERSION};return new Response(head?null:html,{status:200,headers})}
function text(v,n=1000){return String(v??'').trim().slice(0,n)}
function uuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''))}
function sameOrigin(request){if(['GET','HEAD','OPTIONS'].includes(request.method))return true;const site=request.headers.get('sec-fetch-site');if(site==='cross-site')return false;const origin=request.headers.get('origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}}
async function body(request,max=8_000_000){const raw=await request.text();if(raw.length>max)throw Object.assign(new Error('Request is too large.'),{status:413});try{return raw?JSON.parse(raw):{}}catch{throw Object.assign(new Error('Valid JSON is required.'),{status:400})}}
async function svc(env,path,{method='GET',body,headers:extra}={}){const c=cfg(env);if(!c.service)return{ok:false,status:503,data:{message:'Admin data service is not configured.'}};const headers=new Headers({apikey:c.service,authorization:'Bearer '+c.service,accept:'application/json',...(extra||{})});if(body!==undefined)headers.set('content-type','application/json');const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(c.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:ctl.signal}),raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}return{ok:r.ok,status:r.status,data,headers:r.headers}}catch(e){return{ok:false,status:503,data:{message:e?.name==='AbortError'?'Homepage CMS request timed out.':'Homepage CMS is temporarily unavailable.'}}}finally{clearTimeout(timer)}}
async function rawStorage(env,path,{method='POST',bytes,contentType='application/octet-stream'}={}){const c=cfg(env);if(!c.service)return{ok:false,status:503,data:{message:'Admin data service is not configured.'}};const headers=new Headers({apikey:c.service,authorization:'Bearer '+c.service,accept:'application/json','content-type':contentType,'x-upsert':'true'});const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(c.url+path,{method,headers,body:bytes,signal:ctl.signal}),raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}return{ok:r.ok,status:r.status,data}}catch(e){return{ok:false,status:503,data:{message:e?.name==='AbortError'?'Homepage photo upload timed out.':'Homepage photo storage is temporarily unavailable.'}}}finally{clearTimeout(timer)}}
async function delegatedJson(request,env,path){const u=new URL(path,request.url),r=await handleAdminV51(new Request(u,{method:'GET',headers:request.headers}),env);let d={};try{d=await r.clone().json()}catch{}return{ok:r.ok,status:r.status,data:d,response:r}}
async function actor(request,env,write=false){const d=await delegatedJson(request,env,'/api/admin/capabilities');if(!d.ok)return{error:d.response};const a=d.data?.actor||null,role=String(a?.role||'');const allowed=write?['owner','super_admin','admin','content_manager']:['owner','super_admin','admin','content_manager','support_agent'];if(!a||!allowed.includes(role))return{error:j({error:write?'Your admin role cannot edit the main homepage.':'Your admin role cannot view homepage management.',role},403)};const id=String(a.userId||a.id||'');if(!id)return{error:j({error:'Admin session is missing an account identifier.'},401)};return{actor:{...a,id,role}}}
function publicPhoto(env,path){if(!path)return'';return cfg(env).url+'/storage/v1/object/public/'+BUCKET+'/'+String(path).split('/').map(encodeURIComponent).join('/')}
function decorate(env,x){return{...x,photoUrl:publicPhoto(env,x.photo_storage_path)}}
async function audit(env,a,action,target,metadata={}){await svc(env,'/rest/v1/hc_admin_audit_log',{method:'POST',body:{actor_user_id:a.id,actor_email:a.email,actor_role:a.role,action,target,reason:null,metadata,created_at:new Date().toISOString()},headers:{Prefer:'return=minimal'}}).catch(()=>{})}
function decodeData(input,ct){const prefix='data:'+ct+';base64,',raw=String(input||'').startsWith(prefix)?String(input).slice(prefix.length):String(input||'');if(!raw||!/^[A-Za-z0-9+/]*={0,2}$/.test(raw))return null;try{const bin=atob(raw),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out}catch{return null}}
function ascii(bytes,start,len){return String.fromCharCode(...bytes.slice(start,start+len))}
function validMagic(bytes,ct){if(bytes.length<12)return false;if(ct==='image/jpeg')return bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;if(ct==='image/png')return bytes[0]===0x89&&ascii(bytes,1,3)==='PNG';if(ct==='image/webp')return ascii(bytes,0,4)==='RIFF'&&ascii(bytes,8,4)==='WEBP';return false}
function ext(ct){return ct==='image/jpeg'?'jpg':ct==='image/png'?'png':'webp'}
async function deleteObject(env,path){if(!path)return;const p='/storage/v1/object/'+BUCKET+'/'+String(path).split('/').map(encodeURIComponent).join('/');await rawStorage(env,p,{method:'DELETE',bytes:undefined}).catch(()=>{})}

async function homepageGet(request,env){
  const a=await actor(request,env,false);if(a.error)return a.error;
  const [p,s]=await Promise.all([
    svc(env,'/rest/v1/hc_homepage_showcase?select=*&order=sort_order.asc,updated_at.desc&limit=100'),
    svc(env,'/rest/v1/hc_homepage_stories?select=*&order=sort_order.asc,updated_at.desc&limit=100')
  ]);
  if(!p.ok||!s.ok)return j({error:'Homepage content could not be loaded.'},503);
  return j({version:VERSION,actor:a.actor,canEdit:['owner','super_admin','admin','content_manager'].includes(a.actor.role),mainHome:'/',memberHome:'/app',profiles:(p.data||[]).map(x=>decorate(env,x)),stories:(s.data||[]).map(x=>decorate(env,x)),photoPolicy:'Homepage images are intentionally public marketing assets. Upload only images you have permission to publish.',boundary:'This editor controls the main marketing homepage (/). It does not edit the signed-in member home (/app).'});
}
async function saveProfile(request,env){
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);
  const a=await actor(request,env,true);if(a.error)return a.error;let b;try{b=await body(request,120000)}catch(e){return j({error:e.message},e.status||400)}
  const id=text(b.id,80),name=text(b.name,100),age=b.age===''||b.age==null?null:Number(b.age),city=text(b.city,100)||null,country=text(b.country,100)||null,intention=text(b.relationshipIntention,120)||null,tagline=text(b.tagline,500)||null,isActive=b.isActive!==false,sortOrder=Math.max(0,Math.min(9999,Number(b.sortOrder)||100));
  if(id&&!uuid(id))return j({error:'Invalid showcase item.'},400);if(!name)return j({error:'Name is required.'},400);if(age!==null&&(!Number.isInteger(age)||age<18||age>100))return j({error:'Age must be between 18 and 100.'},400);
  const row={name,age,city,country,relationship_intention:intention,tagline,is_active:isActive,sort_order:sortOrder,updated_by:a.actor.id,updated_at:new Date().toISOString()};
  let r;if(id)r=await svc(env,'/rest/v1/hc_homepage_showcase?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:row,headers:{Prefer:'return=representation'}});else r=await svc(env,'/rest/v1/hc_homepage_showcase',{method:'POST',body:{...row,created_by:a.actor.id,created_at:new Date().toISOString()},headers:{Prefer:'return=representation'}});
  if(!r.ok)return j({error:text(r.data?.message||'Showcase profile could not be saved.')},500);const item=Array.isArray(r.data)?r.data[0]:r.data;
  await audit(env,a.actor,id?'admin.homepage.profile.update':'admin.homepage.profile.create',item?.id||id||name,{isActive,sortOrder});
  return j({ok:true,item:decorate(env,item)});
}
async function saveStory(request,env){
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);
  const a=await actor(request,env,true);if(a.error)return a.error;let b;try{b=await body(request,120000)}catch(e){return j({error:e.message},e.status||400)}
  const id=text(b.id,80),names=text(b.names,140),location=text(b.location,160)||null,quote=text(b.quote,1200)||null,isActive=b.isActive!==false,sortOrder=Math.max(0,Math.min(9999,Number(b.sortOrder)||100));
  if(id&&!uuid(id))return j({error:'Invalid story item.'},400);if(!names)return j({error:'Names are required.'},400);
  const row={names,location,quote,is_active:isActive,sort_order:sortOrder,updated_by:a.actor.id,updated_at:new Date().toISOString()};
  let r;if(id)r=await svc(env,'/rest/v1/hc_homepage_stories?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:row,headers:{Prefer:'return=representation'}});else r=await svc(env,'/rest/v1/hc_homepage_stories',{method:'POST',body:{...row,created_by:a.actor.id,created_at:new Date().toISOString()},headers:{Prefer:'return=representation'}});
  if(!r.ok)return j({error:text(r.data?.message||'Homepage story could not be saved.')},500);const item=Array.isArray(r.data)?r.data[0]:r.data;
  await audit(env,a.actor,id?'admin.homepage.story.update':'admin.homepage.story.create',item?.id||id||names,{isActive,sortOrder});
  return j({ok:true,item:decorate(env,item)});
}
async function uploadPhoto(request,env,kind,id){
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);if(!uuid(id))return j({error:'Invalid homepage item.'},400);
  const a=await actor(request,env,true);if(a.error)return a.error;let b;try{b=await body(request)}catch(e){return j({error:e.message},e.status||400)}
  const ct=text(b.contentType,80),allowed=['image/jpeg','image/png','image/webp'];if(!allowed.includes(ct))return j({error:'Use a JPG, PNG or WebP image.'},400);
  const bytes=decodeData(b.data,ct);if(!bytes||bytes.length<16||bytes.length>5_000_000||!validMagic(bytes,ct))return j({error:'Use a valid JPG, PNG or WebP image up to 5 MB.'},400);
  const table=kind==='profile'?'hc_homepage_showcase':'hc_homepage_stories',folder=kind==='profile'?'profiles':'stories';
  const cur=await svc(env,'/rest/v1/'+table+'?select=id,photo_storage_path&id=eq.'+encodeURIComponent(id)+'&limit=1'),row=cur.ok&&Array.isArray(cur.data)?cur.data[0]:null;if(!row)return j({error:'Homepage item not found.'},404);
  const path=folder+'/'+id+'/'+crypto.randomUUID()+'.'+ext(ct),objectPath='/storage/v1/object/'+BUCKET+'/'+path.split('/').map(encodeURIComponent).join('/'),up=await rawStorage(env,objectPath,{bytes,contentType:ct});
  if(!up.ok)return j({error:text(up.data?.message||'Homepage photo could not be uploaded.')},up.status>=500?503:400);
  const patch=await svc(env,'/rest/v1/'+table+'?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{photo_storage_path:path,updated_by:a.actor.id,updated_at:new Date().toISOString()},headers:{Prefer:'return=representation'}});
  if(!patch.ok){await deleteObject(env,path);return j({error:'Homepage photo record could not be saved.'},500)}
  if(row.photo_storage_path&&row.photo_storage_path!==path)await deleteObject(env,row.photo_storage_path);
  await audit(env,a.actor,'admin.homepage.'+kind+'.photo.update',id,{bucket:BUCKET,contentType:ct,size:bytes.length});
  return j({ok:true,id,photoUrl:publicPhoto(env,path),notice:'Homepage photo updated.'});
}
async function removePhoto(request,env,kind,id){
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);if(!uuid(id))return j({error:'Invalid homepage item.'},400);
  const a=await actor(request,env,true);if(a.error)return a.error;const table=kind==='profile'?'hc_homepage_showcase':'hc_homepage_stories';
  const cur=await svc(env,'/rest/v1/'+table+'?select=id,photo_storage_path&id=eq.'+encodeURIComponent(id)+'&limit=1'),row=cur.ok&&Array.isArray(cur.data)?cur.data[0]:null;if(!row)return j({error:'Homepage item not found.'},404);
  await svc(env,'/rest/v1/'+table+'?id=eq.'+encodeURIComponent(id),{method:'PATCH',body:{photo_storage_path:null,updated_by:a.actor.id,updated_at:new Date().toISOString()},headers:{Prefer:'return=minimal'}});
  if(row.photo_storage_path)await deleteObject(env,row.photo_storage_path);
  await audit(env,a.actor,'admin.homepage.'+kind+'.photo.remove',id,{bucket:BUCKET});return j({ok:true,id});
}
async function removeItem(request,env,kind,id){
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);if(!uuid(id))return j({error:'Invalid homepage item.'},400);
  const a=await actor(request,env,true);if(a.error)return a.error;let b;try{b=await body(request,10000)}catch(e){return j({error:e.message},e.status||400)}if(text(b.confirmation,30)!=='DELETE')return j({error:'Type DELETE to confirm removal.',confirmation:'DELETE'},409);
  const table=kind==='profile'?'hc_homepage_showcase':'hc_homepage_stories',cur=await svc(env,'/rest/v1/'+table+'?select=id,photo_storage_path&id=eq.'+encodeURIComponent(id)+'&limit=1'),row=cur.ok&&Array.isArray(cur.data)?cur.data[0]:null;if(!row)return j({error:'Homepage item not found.'},404);
  const r=await svc(env,'/rest/v1/'+table+'?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:{Prefer:'return=minimal'}});if(!r.ok)return j({error:'Homepage item could not be removed.'},500);
  if(row.photo_storage_path)await deleteObject(env,row.photo_storage_path);await audit(env,a.actor,'admin.homepage.'+kind+'.delete',id);return j({ok:true,id});
}

export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&(request.method==='GET'||request.method==='HEAD'))return page(adminHtml(VERSION),request.method==='HEAD');
  if(p==='/api/admin/homepage'&&request.method==='GET')return homepageGet(request,env);
  if(p==='/api/admin/homepage/profiles'&&request.method==='POST')return saveProfile(request,env);
  if(p==='/api/admin/homepage/stories'&&request.method==='POST')return saveStory(request,env);
  let m=p.match(/^\/api\/admin\/homepage\/profiles\/([0-9a-f-]+)\/photo$/i);if(m&&request.method==='POST')return uploadPhoto(request,env,'profile',m[1]);if(m&&request.method==='DELETE')return removePhoto(request,env,'profile',m[1]);
  m=p.match(/^\/api\/admin\/homepage\/stories\/([0-9a-f-]+)\/photo$/i);if(m&&request.method==='POST')return uploadPhoto(request,env,'story',m[1]);if(m&&request.method==='DELETE')return removePhoto(request,env,'story',m[1]);
  m=p.match(/^\/api\/admin\/homepage\/profiles\/([0-9a-f-]+)\/delete$/i);if(m&&request.method==='POST')return removeItem(request,env,'profile',m[1]);
  m=p.match(/^\/api\/admin\/homepage\/stories\/([0-9a-f-]+)\/delete$/i);if(m&&request.method==='POST')return removeItem(request,env,'story',m[1]);
  return handleAdminV51(request,env);
}
