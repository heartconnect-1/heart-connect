import {handleAdmin as handleAdminV49,runPhase7AndEarlierScheduled} from './admin-api-v49.js';
import {adminHtml} from './admin-ui-v50.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v50';

function j(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store, max-age=0',
    'x-content-type-options':'nosniff',
    'x-heart-connect-admin':VERSION
  }});
}
function page(html,head=false){
  const headers={
    'content-type':'text/html; charset=utf-8',
    'cache-control':'no-store, no-cache, must-revalidate, max-age=0',
    'pragma':'no-cache',
    'expires':'0',
    'x-content-type-options':'nosniff',
    'referrer-policy':'strict-origin-when-cross-origin',
    'x-frame-options':'DENY',
    'permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()',
    'cross-origin-opener-policy':'same-origin',
    'cross-origin-resource-policy':'same-origin',
    'strict-transport-security':'max-age=31536000; includeSubDomains',
    'content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://api.mapbox.com; script-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src blob:; child-src blob:; frame-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
    'x-heart-connect-admin':VERSION
  };
  return new Response(head?null:html,{status:200,headers});
}
async function delegatedJson(request,env,path){
  const u=new URL(path,request.url);
  const r=await handleAdminV49(new Request(u,{method:'GET',headers:request.headers}),env);
  let d={};try{d=await r.clone().json()}catch{}
  return{ok:r.ok,status:r.status,data:d,response:r};
}
async function hardeningStatus(request,env){
  const caps=await delegatedJson(request,env,'/api/admin/capabilities');
  if(!caps.ok)return caps.response;
  return j({
    version:VERSION,
    posture:'hardened',
    controls:[
      {key:'native_admin_auth',label:'Native Admin authentication',status:'enabled',detail:'Admin sign-in is terminated at the Cloudflare Worker and no longer depends on an upstream auth route.'},
      {key:'strict_cookie',label:'Strict secure session cookie',status:'enabled',detail:'Session cookie uses __Host- prefix, Secure, HttpOnly, SameSite=Strict, Path=/ and a maximum 45-minute lifetime.'},
      {key:'session_validation',label:'Server-side session validation',status:'enabled',detail:'Opening /admin validates the Supabase session and current Admin role before rendering the dashboard.'},
      {key:'login_throttle',label:'Login attempt throttling',status:'enabled',detail:'Repeated failures are throttled by account/IP and IP-only windows before authentication is attempted again.'},
      {key:'generic_auth_errors',label:'Reduced account enumeration',status:'enabled',detail:'Invalid email/password failures return a generic response instead of revealing which field was correct.'},
      {key:'legacy_role_rpc',label:'Legacy role RPC exposure',status:'restricted',detail:'heart_connect_role_for_email can no longer be executed by anon or authenticated browser roles.'},
      {key:'same_origin',label:'Cross-site write protection',status:'enabled',detail:'Admin write/authentication routes reject cross-site browser requests.'},
      {key:'admin_cache',label:'Admin cache isolation',status:'enabled',detail:'Public PWA service worker excludes /admin and /api routes; Admin HTML is no-store.'}
    ],
    remaining:[
      {key:'leaked_password_protection',label:'Supabase leaked-password protection',status:'recommended',detail:'Enable in Supabase Auth settings when available.'},
      {key:'admin_mfa',label:'Mandatory MFA for owner/super-admin',status:'recommended',detail:'The current release does not force MFA enrollment for every privileged Admin account.'}
    ]
  });
}

export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&(request.method==='GET'||request.method==='HEAD'))return page(adminHtml(VERSION),request.method==='HEAD');
  if(p==='/api/admin/security/hardening-status'&&request.method==='GET')return hardeningStatus(request,env);
  return handleAdminV49(request,env);
}
