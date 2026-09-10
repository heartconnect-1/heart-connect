const VERSION='hc-edge-security-firewall-v1';
const inflightDiscovery=new Map();

function origin(env){return String(env.APPDEPLOY_ORIGIN||'https://heart-connect-n8dpuu.v2.appdeploy.ai').replace(/\/+$/,'')}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-heart-connect-firewall':VERSION}})}
function requestHeaders(request){const h=new Headers();for(const k of ['cookie','authorization','user-agent','accept-language']){const v=request.headers.get(k);if(v)h.set(k,v)}h.set('accept','application/json');return h}
async function upstreamJson(request,env,path){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(origin(env)+path,{method:'GET',headers:requestHeaders(request),redirect:'manual',signal:controller.signal});if(!r.ok)return null;const ct=r.headers.get('content-type')||'';if(!ct.includes('application/json'))return null;return await r.json()}catch{return null}finally{clearTimeout(timer)}}
async function digest(v){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v));return Array.from(new Uint8Array(b)).slice(0,12).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function sessionKey(request){return digest(String(request.headers.get('cookie')||'anonymous')+'|'+String(request.headers.get('authorization')||''))}
async function connections(request,env){const data=await upstreamJson(request,env,'/api/stage4/connections');if(!data)return null;const matches=Array.isArray(data.matches)?data.matches:[];return new Set(matches.map(x=>String(x?.id||'')).filter(Boolean))}
async function mutualTarget(request,env,targetId){const set=await connections(request,env);return !!set&&set.has(String(targetId||''))}
async function safeDiscovery(request,env){const key=await sessionKey(request);if(inflightDiscovery.has(key))return inflightDiscovery.get(key);const work=(async()=>{const map=new Map();let cursor='';for(let page=0;page<10;page++){const path='/api/discover'+(cursor?'?cursor='+encodeURIComponent(cursor):''),data=await upstreamJson(request,env,path);if(!data||!Array.isArray(data.items))return null;for(const item of data.items){const id=String(item?.id||'');if(id)map.set(id,item)}cursor=String(data.cursor||'');if(!cursor)break}return map})().finally(()=>inflightDiscovery.delete(key));inflightDiscovery.set(key,work);return work}
function isProfileObject(x){return !!x&&typeof x==='object'&&typeof x.id==='string'&&(typeof x.name==='string'||typeof x.age==='number'||x.preview===true)}
function mediaFromSafe(x,safe){return{...x,photos:Array.isArray(safe?.photos)?safe.photos:[],photo:String(safe?.photo||''),video:String(safe?.video||''),voice:String(safe?.voice||''),travel:safe&&Object.prototype.hasOwnProperty.call(safe,'travel')?safe.travel:undefined}}
function sanitize(value,map){if(Array.isArray(value)){const out=[];for(const item of value){const s=sanitize(item,map);if(s!==null&&s!==undefined)out.push(s)}return out}if(!value||typeof value!=='object')return value;if(value.profile&&isProfileObject(value.profile)){const id=String(value.profile.id);const safe=map.get(id);if(!safe)return null;const next={...value,profile:mediaFromSafe(value.profile,safe)};for(const [k,v] of Object.entries(next))if(k!=='profile')next[k]=sanitize(v,map);return next}if(isProfileObject(value)){const id=String(value.id),safe=map.get(id);if(!safe)return null;const next=mediaFromSafe(value,safe);for(const [k,v] of Object.entries(next)){if(['photos','photo','video','voice','travel'].includes(k))continue;next[k]=sanitize(v,map)}return next}const out={...value};for(const [k,v] of Object.entries(out))out[k]=sanitize(v,map);return out}
function rewriteJson(response,data){const h=new Headers(response.headers);h.delete('content-length');h.set('content-type','application/json; charset=utf-8');h.set('cache-control','private, no-store');h.set('x-heart-connect-firewall',VERSION);return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:h})}
async function bodyClone(request){try{return await request.clone().json()}catch{return null}}
async function peerForCall(request,env,callId){const data=await upstreamJson(request,env,'/api/calls/'+encodeURIComponent(callId));return String(data?.peerProfile||'')}
function denied(kind='connection'){return json({error:kind==='call'?'Calls require a mutual match.':'Messaging requires a mutual match.'},403)}

export async function firewallBefore(request,env){const u=new URL(request.url),p=u.pathname;
  const convo=p.match(/^\/api\/messaging\/conversations\/([^/]+)(?:\/|$)/);
  if(convo&&!await mutualTarget(request,env,decodeURIComponent(convo[1])))return denied('message');
  const start=p.match(/^\/api\/calls\/([^/]+)\/start$/);
  if(start&&request.method==='POST'&&!await mutualTarget(request,env,decodeURIComponent(start[1])))return denied('call');
  const active=p.match(/^\/api\/calls\/([^/]+)\/(ice-config|transport|action|signal|mode)$/);
  if(active){const peer=await peerForCall(request,env,decodeURIComponent(active[1]));if(!peer||!await mutualTarget(request,env,peer))return denied('call')}
  if(p==='/api/subscriptions'&&request.method==='POST'){
    const b=await bodyClone(request);if(b?.entity_type==='conversation'){
      const parts=String(b.entity_id||'').split(':').filter(Boolean);if(parts.length!==2)return denied('message');
      const set=await connections(request,env);if(!set||!parts.some(x=>set.has(x)))return denied('message');
    }
  }
  return null;
}

export async function firewallAfter(request,env,response){const u=new URL(request.url),p=u.pathname,ct=response.headers.get('content-type')||'';if(!response.ok||!ct.includes('application/json'))return response;
  if(request.method==='GET'&&p==='/api/messaging/inbox'){
    const set=await connections(request,env);if(!set)return response;try{const data=await response.clone().json(),keep=x=>set.has(String(x?.profile?.id||''));data.conversations=Array.isArray(data.conversations)?data.conversations.filter(keep):[];data.newMatches=Array.isArray(data.newMatches)?data.newMatches.filter(keep):[];data.messageMatches=Array.isArray(data.messageMatches)?data.messageMatches.filter(keep):[];data.unreadTotal=data.conversations.filter(x=>!x?.prefs?.archived).reduce((n,x)=>n+Number(x?.unread||0),0);return rewriteJson(response,data)}catch{return response}
  }
  const privacyRoute=request.method==='GET'&&(p==='/api/stage4/home'||p==='/api/stage4/explore'||p==='/api/stage4/connections'||p==='/api/stage4/messages'||/^\/api\/stage4\/profile\/[^/]+$/.test(p));
  if(privacyRoute){const map=await safeDiscovery(request,env);try{const data=await response.clone().json();if(!map){const stripped=sanitize(data,new Map());return rewriteJson(response,stripped??{})}const target=p.match(/^\/api\/stage4\/profile\/([^/]+)$/);if(target&&!map.has(decodeURIComponent(target[1])))return json({error:'Profile unavailable.'},404);return rewriteJson(response,sanitize(data,map)??{})}catch{return response}}
  return response;
}

export {VERSION};
