import {handleAdmin as handleAdminV14,runPhase7AndEarlierScheduled} from './admin-api-v14.js';
import {adminHtml} from './admin-ui-v15.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v15';

function page(html,head=false){
  const headers={
    'content-type':'text/html; charset=utf-8',
    'cache-control':'no-store, max-age=0',
    'pragma':'no-cache',
    'x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer',
    'x-frame-options':'DENY',
    'permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()',
    'cross-origin-opener-policy':'same-origin',
    'cross-origin-resource-policy':'same-origin',
    'strict-transport-security':'max-age=31536000; includeSubDomains',
    'content-security-policy':"default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self'; frame-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
    'x-heart-connect-admin':VERSION
  };
  return new Response(head?null:html,{status:200,headers});
}

export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&(request.method==='GET'||request.method==='HEAD'))return page(adminHtml(VERSION),request.method==='HEAD');
  return handleAdminV14(request,env);
}
