import previousWorker from './worker-v15.js';
import {handleAdmin,runPhase7AndEarlierScheduled,VERSION as ADMIN_VERSION} from './admin-api-v8.js';
import {handleAdminLogin} from './admin-login-v1.js';

const EDGE_VERSION='cloudflare-admin-router-v8-integration';
function stamp(response){const h=new Headers(response.headers);h.set('x-heart-connect-admin-router',EDGE_VERSION);h.set('x-heart-connect-admin-version',ADMIN_VERSION);h.set('x-heart-connect-security-core','cloudflare-router-v15');return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h})}
function hasNativeSessionCookie(request){return /(?:^|;\s*)__Host-hc_cf_access=/.test(String(request.headers.get('cookie')||''))}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname==='/admin'&&!hasNativeSessionCookie(request))return Response.redirect(new URL('/admin/login',url),302);
    const login=await handleAdminLogin(request,env);
    if(login)return stamp(login);
    const admin=await handleAdmin(request,env);
    if(admin)return stamp(admin);
    return previousWorker.fetch(request,env,ctx);
  },

  async scheduled(controller,env,ctx){
    const jobs=[runPhase7AndEarlierScheduled(env)];
    if(typeof previousWorker.scheduled==='function')jobs.push(previousWorker.scheduled(controller,env,ctx));
    const work=Promise.allSettled(jobs);
    if(ctx&&typeof ctx.waitUntil==='function')ctx.waitUntil(work);
    else await work;
  }
};
