import {handleAdmin as handleAdminV2} from './admin-api-v2.js';

export const VERSION='hc-admin-control-plane-v2.1';
const ACCESS_COOKIE='__Host-hc_cf_access';
const DEFAULT_SUPABASE_URL='https://zzhzkikezjtbntaqiurk.supabase.co';
const DEFAULT_PUBLISHABLE_KEY='sb_publishable_HB0Irz6bxug1hHs518oPZQ_LC83i4qT';

function cfg(env){return{url:String(env.SUPABASE_URL||DEFAULT_SUPABASE_URL).replace(/\/+$/,''),publishable:String(env.SUPABASE_PUBLISHABLE_KEY||DEFAULT_PUBLISHABLE_KEY),service:String(env.SUPABASE_SERVICE_ROLE_KEY||'')}}
function cookies(request){const out={};for(const part of String(request.headers.get('cookie')||'').split(';')){const i=part.indexOf('=');if(i>0){const k=part.slice(0,i).trim();try{out[k]=decodeURIComponent(part.slice(i+1).trim())}catch{out[k]=part.slice(i+1).trim()}}}return out}
function j(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-heart-connect-admin-guard':VERSION}})}
function email(v){return String(v||'').trim().toLowerCase()}
function emails(v){return String(v||'').split(',').map(email).filter(Boolean)}
async function session(request,env){const c=cfg(env),token=cookies(request)[ACCESS_COOKIE]||'';if(!token)return null;try{const r=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.publishable,authorization:'Bearer '+token,accept:'application/json'}});if(!r.ok)return null;const u=await r.json();return u?.id?{id:u.id,email:email(u.email)}:null}catch{return null}}
async function service(env,path){const c=cfg(env);if(!c.service)return{ok:false,status:503,data:{message:'Admin data service is not configured.'}};try{const r=await fetch(c.url+path,{headers:{apikey:c.service,authorization:'Bearer '+c.service,accept:'application/json'}}),raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{data=raw}return{ok:r.ok,status:r.status,data}}catch{return{ok:false,status:503,data:{message:'Supabase admin data service is temporarily unavailable.'}}}}
async function actor(request,env){const u=await session(request,env);if(!u)return null;const owners=[...emails(env.HEART_CONNECT_OWNER_EMAILS),...emails(env.HEART_CONNECT_ADMIN_EMAILS)];if(owners.includes(u.email))return{...u,role:'owner'};const r=await service(env,'/rest/v1/hc_admin_staff?select=role,status&user_id=eq.'+encodeURIComponent(u.id)+'&status=eq.active&limit=1'),row=r.ok&&Array.isArray(r.data)?r.data[0]:null;return row?{...u,role:String(row.role||'')}:null}
async function requireRole(request,env,roles){const a=await actor(request,env);if(!a)return j({error:'Admin access denied.'},403);if(!roles.includes(a.role))return j({error:'Your admin role is read-only for this action.',role:a.role},403);return null}

const USER_WRITERS=['owner','super_admin','admin'];
const MOD_WRITERS=['owner','super_admin','admin','moderator','senior_moderator','safety_specialist'];
const VERIFY_WRITERS=['owner','super_admin','admin','verification_specialist','safety_specialist'];
const CMS_WRITERS=['owner','super_admin','admin','content_manager'];
const AI_WRITERS=['owner','super_admin','admin'];

export async function handleAdmin(request,env){const u=new URL(request.url),p=u.pathname;
  if(request.method==='GET'&&p==='/api/admin/cms/posts'){
    const denied=await requireRole(request,env,CMS_WRITERS);if(denied)return denied;
    const r=await service(env,'/rest/v1/hc_cms_posts?select=id,title,slug,excerpt,body,status,featured_media_id,seo_title,seo_description,publish_channels,scheduled_for,published_at,created_at,updated_at&order=updated_at.desc&limit=40');
    if(!r.ok)return j({error:String(r.data?.message||'CMS posts could not be loaded.').slice(0,500)},r.status===503?503:500);
    return j({items:Array.isArray(r.data)?r.data:[],socialPublishing:'External Facebook/TikTok/Google Business publishing remains API-gated and is not simulated.'});
  }
  if(request.method==='POST'){
    let roles=null;
    if(/^\/api\/admin\/users\/[^/]+\/(state|features)$/.test(p))roles=USER_WRITERS;
    else if(/^\/api\/admin\/moderation\/[^/]+\/review$/.test(p))roles=MOD_WRITERS;
    else if(/^\/api\/admin\/verifications\/[^/]+\/review$/.test(p))roles=VERIFY_WRITERS;
    else if(p==='/api/admin/cms/posts'||p==='/api/admin/cms/media')roles=CMS_WRITERS;
    else if(p==='/api/admin/ai/ask')roles=AI_WRITERS;
    if(roles){const denied=await requireRole(request,env,roles);if(denied)return denied}
    if(p==='/api/admin/cms/media'){
      const copy=request.clone();
      try{const form=await copy.formData(),postId=String(form.get('postId')||'');if(postId&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(postId))return j({error:'Invalid post ID.'},400)}catch{return j({error:'Use multipart form data with a file field.'},415)}
    }
  }
  return handleAdminV2(request,env);
}
