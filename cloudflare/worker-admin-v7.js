import previousWorker from './worker-v15.js';
import {handleAdmin,runPhase7AndEarlierScheduled,VERSION as ADMIN_VERSION} from './admin-api-v7.js';

const EDGE_VERSION='cloudflare-admin-router-v7-integration';
function stamp(response){const h=new Headers(response.headers);h.set('x-heart-connect-admin-router',EDGE_VERSION);h.set('x-heart-connect-admin-version',ADMIN_VERSION);h.set('x-heart-connect-security-core','cloudflare-router-v15');return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h})}

export default {
  async fetch(request,env,ctx){
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
