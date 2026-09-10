import {handleAdmin as handleAdminV47,runPhase7AndEarlierScheduled} from './admin-api-v47.js';
import {adminHtml} from './admin-ui-v48.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v48';

function j(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff','x-heart-connect-admin':VERSION}})}
function page(html,head=false){const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store, no-cache, must-revalidate, max-age=0','pragma':'no-cache','expires':'0','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()','cross-origin-opener-policy':'same-origin','cross-origin-resource-policy':'same-origin','strict-transport-security':'max-age=31536000; includeSubDomains','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://api.mapbox.com; script-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src blob:; child-src blob:; frame-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",'x-heart-connect-admin':VERSION};return new Response(head?null:html,{status:200,headers})}
async function delegatedJson(request,env,path){
  const u=new URL(path,request.url);
  const r=await handleAdminV47(new Request(u,{method:'GET',headers:request.headers}),env);
  let d={};try{d=await r.clone().json()}catch{}
  return{ok:r.ok,status:r.status,data:d,response:r};
}
function bool(v){return !!v}
function socialRowMap(rows){const out={};for(const x of Array.isArray(rows)?rows:[])out[String(x.provider||'')]=x;return out}
function latest(items){return (items||[]).map(x=>x.updated_at).filter(Boolean).sort().reverse()[0]||null}
async function settingsIntelligence(request,env){
  const base=await delegatedJson(request,env,'/api/admin/settings');if(!base.ok)return base.response;
  const [caps,audit,automation]=await Promise.all([
    delegatedJson(request,env,'/api/admin/capabilities'),
    delegatedJson(request,env,'/api/admin/audit?limit=80'),
    delegatedJson(request,env,'/api/admin/automation/enterprise-status')
  ]);
  const actor=caps.ok?(caps.data?.actor||{}):{};
  const settings=Array.isArray(base.data?.settings)?base.data.settings:[],social=Array.isArray(base.data?.social)?base.data.social:[],socialBy=socialRowMap(social);
  const categories=[...new Set(settings.map(x=>String(x.category||'general')))].sort();
  const runtime=[
    {key:'supabase_service_role',label:'Supabase admin service role',group:'Core',configured:bool(env.SUPABASE_SERVICE_ROLE_KEY),sensitive:true,note:'Server-only database administration secret.'},
    {key:'owner_allowlist',label:'Owner allowlist',group:'Core',configured:bool(env.HEART_CONNECT_OWNER_EMAILS||env.HEART_CONNECT_ADMIN_EMAILS),sensitive:true,note:'Controls owner access to the native Admin Control Plane.'},
    {key:'workers_ai',label:'Cloudflare Workers AI',group:'AI',configured:bool(env.AI),sensitive:false,note:'Binding used for Admin AI and Copilot features.'},
    {key:'mapbox',label:'Mapbox public token',group:'Maps',configured:bool(env.MAPBOX_PUBLIC_TOKEN),sensitive:false,note:'Public client token used by supported location experiences.'},
    {key:'facebook',label:'Facebook publishing credential',group:'Social',configured:bool(env.FACEBOOK_PAGE_ACCESS_TOKEN),sensitive:true,note:'Credential value is never exposed to the browser.'},
    {key:'tiktok',label:'TikTok publishing credential',group:'Social',configured:bool(env.TIKTOK_ACCESS_TOKEN),sensitive:true,note:'Credential value is never exposed to the browser.'},
    {key:'google_business',label:'Google Business publishing credential',group:'Social',configured:bool(env.GOOGLE_BUSINESS_ACCESS_TOKEN),sensitive:true,note:'Credential value is never exposed to the browser.'}
  ];
  const configuredRuntime=runtime.filter(x=>x.configured).length;
  const socialCards=['facebook','tiktok','google_business'].map(key=>{
    const row=socialBy[key]||{},ready=base.data?.providerReadiness?.[key]?.credentialConfigured===true;
    return{provider:key,credentialConfigured:ready,status:row.status||'not_connected',externalAccountName:row.external_account_name||null,externalAccountId:row.external_account_id||null,capabilities:row.capabilities||{},lastTestedAt:row.last_tested_at||null,lastErrorCode:row.last_error_code||null,updatedAt:row.updated_at||null,credentialLocation:row.credential_location||'cloudflare_secret'}
  });
  const staffEvents=(audit.ok&&Array.isArray(audit.data?.items)?audit.data.items:[]).filter(x=>String(x.action||'').startsWith('admin.setting.')).slice(0,30);
  const autoProviders=automation.ok?(automation.data?.providers||{}):{};
  return j({
    version:VERSION,
    actor:{role:actor.role||null,displayName:actor.displayName||actor.email||null},
    canEdit:['owner','super_admin','admin'].includes(String(actor.role||'')),
    settings,
    categories,
    social:socialCards,
    runtime,
    recentSettingActivity:staffEvents,
    automationProviders:autoProviders,
    summary:{
      settings:settings.length,
      categories:categories.length,
      configuredRuntime,
      runtimeTotal:runtime.length,
      socialCredentials:socialCards.filter(x=>x.credentialConfigured).length,
      socialReady:socialCards.filter(x=>x.credentialConfigured&&['configured'].includes(x.status)).length,
      lastUpdatedAt:latest(settings)
    },
    rules:[
      'Admin browser settings are non-secret only.',
      'Passwords, access tokens, private keys and API secrets remain in Cloudflare encrypted secrets.',
      'Secret readiness exposes only configured/not-configured state; values are never returned.',
      'Settings changes remain role-controlled and are written to the Admin audit trail.'
    ]
  });
}

export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&(request.method==='GET'||request.method==='HEAD'))return page(adminHtml(VERSION),request.method==='HEAD');
  if(p==='/api/admin/settings/intelligence'&&request.method==='GET')return settingsIntelligence(request,env);
  return handleAdminV47(request,env);
}
