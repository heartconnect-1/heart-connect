import {handleNativeApi,securityHeaders,VERSION as NATIVE_VERSION} from './native-api-v2.js';
import {handleNativeProfileMedia,VERSION as MEDIA_VERSION} from './native-profile-media-v1.js';
import {handleNativeAccountSafety,VERSION as ACCOUNT_SAFETY_VERSION} from './native-account-safety-v1.js';
import {handleAdmin,runPhase7AndEarlierScheduled,VERSION as ADMIN_VERSION} from './admin-api-v54.js';
import {handleAdminLogin} from './admin-login-v2.js';
import {handleAdminAuth,validateAdminSession} from './admin-auth-v2.js';
import {handleHomepage} from './homepage-public-v1.js';

const EDGE_VERSION='cloudflare-native-router-v1';

function stamp(response){
  const h=new Headers(response.headers);
  h.set('x-heart-connect-edge',EDGE_VERSION);
  h.set('x-heart-connect-native-version',NATIVE_VERSION);
  h.set('x-heart-connect-media-version',MEDIA_VERSION);
  h.set('x-heart-connect-account-safety-version',ACCOUNT_SAFETY_VERSION);
  h.set('x-heart-connect-admin-version',ADMIN_VERSION);
  h.set('x-content-type-options','nosniff');
  h.set('referrer-policy','strict-origin-when-cross-origin');
  h.set('strict-transport-security','max-age=31536000; includeSubDomains');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});
}

function json(data,status=200){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store',
      'x-content-type-options':'nosniff'
    }
  });
}

function isAssetRequest(request){
  const url=new URL(request.url);
  return !url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/admin');
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);

    const safety=await handleNativeAccountSafety(request,env);
    if(safety)return stamp(safety);

    const media=await handleNativeProfileMedia(request,env);
    if(media)return stamp(media);

    const native=await handleNativeApi(request,env);
    if(native)return stamp(native);

    const adminAuth=await handleAdminAuth(request,env);
    if(adminAuth)return stamp(adminAuth);

    if(url.pathname==='/admin'||url.pathname==='/admin/'){
      const session=await validateAdminSession(request,env);
      if(!session.ok)return Response.redirect(new URL('/admin/login',url),302);
    }

    const adminLogin=await handleAdminLogin(request,env);
    if(adminLogin)return stamp(adminLogin);

    const admin=await handleAdmin(request,env);
    if(admin)return stamp(admin);

    const homepage=await handleHomepage(request,env);
    if(homepage)return stamp(homepage);

    if(isAssetRequest(request)&&env.ASSETS){
      return stamp(await env.ASSETS.fetch(request));
    }

    return stamp(json({error:'Route not found.'},404));
  },

  async scheduled(controller,env,ctx){
    const work=runPhase7AndEarlierScheduled(env);
    if(ctx&&typeof ctx.waitUntil==='function')ctx.waitUntil(work);
    else await work;
  }
};
