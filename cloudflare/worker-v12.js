import previousWorker from './worker-v11.js';
import {handleNativeApi,securityHeaders,VERSION as NATIVE_VERSION} from './native-api-v2.js';
import {handleNativeProfileMedia,VERSION as MEDIA_VERSION} from './native-profile-media-v1.js';
import {handleLegacySelfMigration,VERSION as MIGRATION_VERSION} from './legacy-self-migration-v1.js';
import {firewallBefore,firewallAfter,VERSION as FIREWALL_VERSION} from './security-firewall-v1.js';
import {staticResponse,timed,VERSION as PERFORMANCE_VERSION} from './performance-v1.js';

const EDGE_VERSION='cloudflare-router-v12';

function edge(response){const secured=securityHeaders(response);const headers=new Headers(secured.headers);headers.set('x-heart-connect-edge',EDGE_VERSION);headers.set('x-heart-connect-native-version',NATIVE_VERSION);headers.set('x-heart-connect-media-version',MEDIA_VERSION);headers.set('x-heart-connect-migration-version',MIGRATION_VERSION);headers.set('x-heart-connect-firewall-version',FIREWALL_VERSION);headers.set('x-heart-connect-performance-version',PERFORMANCE_VERSION);return new Response(secured.body,{status:secured.status,statusText:secured.statusText,headers})}

export default {
  async fetch(request,env,ctx){
    const migration=await handleLegacySelfMigration(request,env);
    if(migration)return edge(migration);
    const media=await handleNativeProfileMedia(request,env);
    if(media)return edge(media);
    const native=await handleNativeApi(request,env);
    if(native)return edge(native);
    const blocked=await firewallBefore(request,env);
    if(blocked)return edge(blocked);
    const cached=await staticResponse(request,ctx,()=>previousWorker.fetch(request,env,ctx));
    if(cached)return edge(cached);
    const start=performance.now();
    let response=await previousWorker.fetch(request,env,ctx);
    response=await firewallAfter(request,env,response);
    response=timed(response,performance.now()-start);
    return edge(response);
  }
};
