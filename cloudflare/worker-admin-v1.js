import previousWorker from './worker-v12.js';
import {handleAdmin,VERSION as ADMIN_VERSION} from './admin-api-v1.js';

const EDGE_VERSION='cloudflare-admin-router-v1';
function stamp(response){const h=new Headers(response.headers);h.set('x-heart-connect-admin-router',EDGE_VERSION);h.set('x-heart-connect-admin-version',ADMIN_VERSION);return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h})}

export default {
  async fetch(request,env,ctx){
    const admin=await handleAdmin(request,env);
    if(admin)return stamp(admin);
    return previousWorker.fetch(request,env,ctx);
  }
};
