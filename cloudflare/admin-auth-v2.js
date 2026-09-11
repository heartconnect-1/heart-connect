export const VERSION='hc-admin-auth-v2-browser-session';

const COOKIE='__Host-hc_cf_access';
const DEFAULT_SUPABASE_URL='https://zzhzkikezjtbntaqiurk.supabase.co';
const DEFAULT_PUBLISHABLE_KEY='sb_publishable_HB0Irz6bxug1hHs518oPZQ_LC83i4qT';
const WINDOW_SECONDS=15*60;
const ACCOUNT_LIMIT=5;
const IP_LIMIT=20;

function cfg(env){
  return {
    url:String(env.SUPABASE_URL||DEFAULT_SUPABASE_URL).replace(/\/+$/,''),
    publishable:String(env.SUPABASE_PUBLISHABLE_KEY||DEFAULT_PUBLISHABLE_KEY),
    service:String(env.SUPABASE_SERVICE_ROLE_KEY||'')
  };
}
function json(data,status=200,extra={}){
  return new Response(JSON.stringify(data),{status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store, no-cache, must-revalidate, max-age=0',
    'pragma':'no-cache',
    'x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer',
    'cross-origin-resource-policy':'same-origin',
    'permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()',
    'x-heart-connect-admin-auth':VERSION,
    ...extra
  }});
}
function cookies(request){
  const out={};
  for(const part of String(request.headers.get('cookie')||'').split(';')){
    const i=part.indexOf('=');
    if(i>0){
      const k=part.slice(0,i).trim();
      try{out[k]=decodeURIComponent(part.slice(i+1).trim())}
      catch{out[k]=part.slice(i+1).trim()}
    }
  }
  return out;
}
function cleanEmail(v){
  const s=String(v||'').trim().toLowerCase().slice(0,320);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:'';
}
function ownerEmails(env){
  return [...new Set(String(env.HEART_CONNECT_OWNER_EMAILS||'').split(',').concat(String(env.HEART_CONNECT_ADMIN_EMAILS||'').split(',')).map(cleanEmail).filter(Boolean))];
}
function sameOrigin(request){
  const site=String(request.headers.get('sec-fetch-site')||'');
  if(site==='cross-site')return false;
  const origin=request.headers.get('origin');
  if(!origin)return true;
  try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}
}
function clientIp(request){
  return String(request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim().slice(0,80);
}
async function digest(v){
  const bytes=new TextEncoder().encode(v);
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function rateRequest(scope,value){
  const h=await digest(scope+'|'+value);
  return new Request('https://heart-connect-rate.invalid/admin/'+scope+'/'+h);
}
async function rateRead(scope,value){
  try{
    const key=await rateRequest(scope,value),r=await caches.default.match(key);
    if(!r)return{key,count:0};
    const d=await r.json().catch(()=>({}));
    return{key,count:Math.max(0,Number(d.count)||0)};
  }catch{return{key:null,count:0}}
}
async function rateWrite(entry,count){
  if(!entry.key)return;
  try{
    await caches.default.put(entry.key,new Response(JSON.stringify({count,updatedAt:Date.now()}),{
      headers:{'content-type':'application/json','cache-control':'public, max-age='+WINDOW_SECONDS}
    }));
  }catch{}
}
async function rateDelete(entry){
  if(!entry.key)return;
  try{await caches.default.delete(entry.key)}catch{}
}
async function rateState(request,email){
  const ip=clientIp(request);
  const [account,ipOnly]=await Promise.all([
    rateRead('account',ip+'|'+email),
    rateRead('ip',ip)
  ]);
  return {ip,account,ipOnly,blocked:account.count>=ACCOUNT_LIMIT||ipOnly.count>=IP_LIMIT};
}
async function recordFailure(state){
  await Promise.all([
    rateWrite(state.account,state.account.count+1),
    rateWrite(state.ipOnly,state.ipOnly.count+1)
  ]);
}
async function clearFailure(state){
  await Promise.all([rateDelete(state.account),rateDelete(state.ipOnly)]);
}
async function readJson(request,max=5000){
  const raw=await request.text();
  if(raw.length>max)throw Object.assign(new Error('Request is too large.'),{status:413});
  try{return raw?JSON.parse(raw):{}}
  catch{throw Object.assign(new Error('Valid JSON is required.'),{status:400})}
}
async function authUser(env,token){
  const c=cfg(env);
  if(!token)return null;
  try{
    const r=await fetch(c.url+'/auth/v1/user',{headers:{apikey:c.publishable,authorization:'Bearer '+token,accept:'application/json'}});
    if(!r.ok)return null;
    const u=await r.json();
    return u?.id?u:null;
  }catch{return null}
}
async function adminRole(env,user){
  const email=cleanEmail(user?.email);
  if(!user?.id||!email)return null;
  if(ownerEmails(env).includes(email))return'owner';
  const c=cfg(env);
  if(!c.service)return null;
  try{
    const r=await fetch(c.url+'/rest/v1/hc_admin_staff?select=role,status&user_id=eq.'+encodeURIComponent(user.id)+'&status=eq.active&limit=1',{
      headers:{apikey:c.service,authorization:'Bearer '+c.service,accept:'application/json'}
    });
    if(!r.ok)return null;
    const rows=await r.json();
    return Array.isArray(rows)&&rows[0]?.role?String(rows[0].role):null;
  }catch{return null}
}
function setCookie(token){
  const safe=String(token||'').replace(/[\r\n;]/g,'');
  // Deliberately omit Max-Age/Expires so this is a browser-session cookie.
  // Closing the browser ends the Admin browser session and requires sign-in again.
  return COOKIE+'='+safe+'; Path=/; Secure; HttpOnly; SameSite=Strict; Priority=High';
}
function clearCookie(){
  return COOKIE+'=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0; Priority=High';
}
async function signIn(request,env){
  if(request.method!=='POST')return json({error:'Method not allowed.'},405,{allow:'POST'});
  if(!sameOrigin(request))return json({error:'Cross-site authentication request blocked.'},403);
  let b;try{b=await readJson(request)}catch(e){return json({error:e.message},e.status||400)}
  const email=cleanEmail(b.email),password=String(b.password||'');
  if(!email||password.length<1||password.length>1024)return json({error:'Invalid email or password.'},401);

  const state=await rateState(request,email);
  if(state.blocked){
    return json({error:'Too many sign-in attempts. Try again later.'},429,{'retry-after':String(WINDOW_SECONDS)});
  }

  const c=cfg(env);
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
  try{
    const r=await fetch(c.url+'/auth/v1/token?grant_type=password',{
      method:'POST',
      headers:{apikey:c.publishable,'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({email,password}),
      signal:ctl.signal
    });
    const d=await r.json().catch(()=>({}));
    if(!r.ok||!d.access_token){
      await recordFailure(state);
      return json({error:'Invalid email or password.'},401);
    }

    const user=d.user?.id?d.user:await authUser(env,d.access_token);
    const role=await adminRole(env,user);
    if(!role){
      await recordFailure(state);
      return json({error:'Admin access denied.'},403);
    }

    await clearFailure(state);
    return json({ok:true,role,browserSessionOnly:true},200,{'set-cookie':setCookie(d.access_token)});
  }catch(e){
    return json({error:e?.name==='AbortError'?'Authentication service timed out.':'Authentication service is temporarily unavailable.'},503);
  }finally{clearTimeout(timer)}
}
export async function validateAdminSession(request,env){
  const token=cookies(request)[COOKIE]||'';
  if(!token)return{ok:false,token:'',user:null,role:null};
  const user=await authUser(env,token);
  const role=user?await adminRole(env,user):null;
  return user&&role?{ok:true,token,user,role}:{ok:false,token,user:null,role:null};
}
async function session(request,env){
  if(request.method!=='GET'&&request.method!=='HEAD')return json({error:'Method not allowed.'},405,{allow:'GET, HEAD'});
  const state=await validateAdminSession(request,env);
  if(!state.ok)return json({error:'Admin session is no longer valid.'},401,{'set-cookie':clearCookie()});
  const payload={ok:true,user:{id:state.user.id,email:cleanEmail(state.user.email)},role:state.role};
  return request.method==='HEAD'?new Response(null,{status:200,headers:{'cache-control':'no-store','x-heart-connect-admin-auth':VERSION}}):json(payload);
}
async function logout(request,env){
  if(request.method!=='POST')return json({error:'Method not allowed.'},405,{allow:'POST'});
  if(!sameOrigin(request))return json({error:'Cross-site authentication request blocked.'},403);
  const token=cookies(request)[COOKIE]||'';
  if(token){
    const c=cfg(env);
    try{
      await fetch(c.url+'/auth/v1/logout',{method:'POST',headers:{apikey:c.publishable,authorization:'Bearer '+token,accept:'application/json'}});
    }catch{}
  }
  return json({ok:true},200,{'set-cookie':clearCookie()});
}

export async function handleAdminAuth(request,env){
  const p=new URL(request.url).pathname;
  if(p==='/api/_cf/auth/signin')return signIn(request,env);
  if(p==='/api/_cf/auth/session')return session(request,env);
  if(p==='/api/_cf/auth/logout')return logout(request,env);
  return null;
}
