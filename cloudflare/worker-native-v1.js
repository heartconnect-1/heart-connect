import {handleNativeApi,securityHeaders,VERSION as NATIVE_VERSION} from './native-api-v2.js';
import {handleNativeProfileMedia,VERSION as MEDIA_VERSION} from './native-profile-media-v1.js';
import {handleNativeAccountSafety,VERSION as ACCOUNT_SAFETY_VERSION} from './native-account-safety-v1.js';
import {handleAdmin,runPhase7AndEarlierScheduled,VERSION as ADMIN_VERSION} from './admin-api-v54.js';
import {handleAdminLogin} from './admin-login-v2.js';
import {handleAdminAuth,validateAdminSession} from './admin-auth-v2.js';
import {handleHomepage} from './homepage-public-v1.js';
import {handleNativeCoreCompat} from './native-core-compat-v1.js';

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

function legacyRequest(request){
  const u=new URL(request.url),p=u.pathname;
  const map=[
    ['/api/auth/signin','/api/_cf/auth/signin'],['/api/auth/register','/api/_cf/auth/register'],['/api/auth/session','/api/_cf/auth/session'],['/api/auth/refresh','/api/_cf/auth/refresh'],['/api/auth/logout','/api/_cf/auth/logout'],
    ['/api/me','/api/_cf/me'],['/api/discover','/api/_cf/discover'],['/api/media/sign','/api/_cf/media/sign'],['/api/photos','/api/_cf/profile-media'],['/api/media/profile','/api/_cf/profile-media'],['/api/privacy','/api/_cf/privacy'],['/api/notifications','/api/_cf/notifications'],['/api/reports','/api/_cf/reports'],
    ['/api/account/export-request','/api/_cf/account/export-request'],['/api/account/export-requests','/api/_cf/account/export-requests'],['/api/account/delete-request','/api/_cf/account/delete-request'],['/api/account/delete-requests','/api/_cf/account/delete-requests'],['/api/appeals','/api/_cf/enforcement-appeals']
  ];
  for(const [from,to] of map)if(p===from)return new Request(new URL(to+u.search,u.origin),request);
  const m=p.match(/^\\/api\\/connect\\/([^/]+)$/);if(m)return new Request(new URL('/api/_cf/connect/'+m[1]+u.search,u.origin),request);
  const mm=p.match(/^\\/api\\/messages\\/([^/]+)$/);if(mm)return new Request(new URL('/api/_cf/messages/'+mm[1]+u.search,u.origin),request);
  const nr=p.match(/^\\/api\\/notifications\\/([^/]+)\\/read$/);if(nr)return new Request(new URL('/api/_cf/notifications/'+nr[1]+'/read'+u.search,u.origin),request);
  const rr=p.match(/^\\/api\\/reports$/);if(rr)return new Request(new URL('/api/_cf/reports'+u.search,u.origin),request);
  const er=p.match(/^\\/api\\/compliance\\/appeals\\/([^/]+)$/);if(er)return new Request(new URL('/api/_cf/enforcements/'+er[1]+'/appeal'+u.search,u.origin),request);
  return null;
}

function isAssetRequest(request){
  const url=new URL(request.url);
  return !url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/admin');
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);

    const compat=await handleNativeCoreCompat(request,env,handleNativeProfileMedia);
    if(compat)return stamp(compat);

    const legacy=legacyRequest(request);\n    if(legacy){\n      const safety=await handleNativeAccountSafety(legacy,env);\n      if(safety)return stamp(safety);\n      const native=await handleNativeApi(legacy,env);\n      if(native)return stamp(native);\n    }\n\n    const safety=await handleNativeAccountSafety(request,env);
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
