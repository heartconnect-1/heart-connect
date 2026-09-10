import previousWorker from './worker-v12.js';
import {handleAdmin,VERSION as ADMIN_VERSION} from './admin-api-v4.js';

const EDGE_VERSION='cloudflare-admin-router-v4';
function stamp(response){const h=new Headers(response.headers);h.set('x-heart-connect-admin-router',EDGE_VERSION);h.set('x-heart-connect-admin-version',ADMIN_VERSION);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h})}
async function isNativeRouteMiss(response){if(response.status!==404)return false;try{const d=await response.clone().json();return d?.error==='Admin route not found.'}catch{return false}}

export default {
  async fetch(request,env,ctx){
    const admin=await handleAdmin(request,env);
    if(admin){
      // Preserve admin endpoints that still exist in the legacy/security backend but
      // have not yet been migrated to the native Cloudflare admin control plane.
      if(await isNativeRouteMiss(admin))return previousWorker.fetch(request,env,ctx);
      return stamp(admin);
    }
    return previousWorker.fetch(request,env,ctx);
  }
};
