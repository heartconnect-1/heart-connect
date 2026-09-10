import {handleAdmin as handleAdminV18,runPhase7AndEarlierScheduled} from './admin-api-v18.js';
import {adminHtml} from './admin-ui-v19.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v19';

const FALLBACK_COUNTRIES=['Argentina','Australia','Austria','Bahrain','Belgium','Botswana','Brazil','Bulgaria','Cameroon','Canada','Chile','China','Colombia','Croatia','Cyprus','Czechia','Denmark','Egypt','Estonia','Ethiopia','Finland','France','Germany','Ghana','Greece','Hungary','Iceland','India','Indonesia','Ireland','Israel','Italy','Japan','Jordan','Kenya','Kuwait','Latvia','Lithuania','Luxembourg','Malaysia','Malta','Mauritius','Mexico','Morocco','Namibia','Netherlands','New Zealand','Nigeria','Norway','Oman','Pakistan','Philippines','Poland','Portugal','Qatar','Romania','Rwanda','Saudi Arabia','Serbia','Singapore','Slovakia','Slovenia','South Africa','South Korea','Spain','Sri Lanka','Sweden','Switzerland','Tanzania','Thailand','Tunisia','Türkiye','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Vietnam','Zambia','Zimbabwe'];
const FALLBACK_CITIES={
  Kenya:['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Kisii','Thika','Nyeri','Machakos','Naivasha','Kitale','Meru','Malindi','Garissa','Kericho'],
  Canada:['Toronto','Vancouver','Montreal','Calgary','Edmonton','Ottawa','Winnipeg','Quebec City','Halifax','Victoria'],
  'United Kingdom':['London','Birmingham','Manchester','Glasgow','Liverpool','Leeds','Edinburgh','Bristol','Cardiff','Belfast'],
  'United States':['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','Miami'],
  Australia:['Sydney','Melbourne','Brisbane','Perth','Adelaide','Canberra','Gold Coast','Newcastle','Hobart','Darwin'],
  'New Zealand':['Auckland','Wellington','Christchurch','Hamilton','Tauranga','Dunedin','Palmerston North','Napier','Rotorua','Nelson'],
  'United Arab Emirates':['Dubai','Abu Dhabi','Sharjah','Ajman','Al Ain','Ras Al Khaimah','Fujairah','Umm Al Quwain'],
  Qatar:['Doha','Al Rayyan','Al Wakrah','Umm Salal','Al Khor','Lusail'],
  'Saudi Arabia':['Riyadh','Jeddah','Mecca','Medina','Dammam','Khobar','Taif','Tabuk'],
  Germany:['Berlin','Hamburg','Munich','Cologne','Frankfurt','Stuttgart','Düsseldorf','Leipzig','Dortmund','Essen'],
  France:['Paris','Marseille','Lyon','Toulouse','Nice','Nantes','Montpellier','Strasbourg','Bordeaux','Lille'],
  Italy:['Rome','Milan','Naples','Turin','Palermo','Genoa','Bologna','Florence','Bari','Venice'],
  Spain:['Madrid','Barcelona','Valencia','Seville','Zaragoza','Málaga','Murcia','Palma','Bilbao','Alicante'],
  Ireland:['Dublin','Cork','Limerick','Galway','Waterford','Drogheda'],
  Luxembourg:['Luxembourg City','Esch-sur-Alzette','Differdange','Dudelange'],
  'South Africa':['Johannesburg','Cape Town','Durban','Pretoria','Gqeberha','Bloemfontein','East London','Polokwane'],
  Nigeria:['Lagos','Abuja','Kano','Ibadan','Port Harcourt','Benin City','Kaduna','Enugu'],
  Uganda:['Kampala','Entebbe','Jinja','Mbarara','Gulu','Mbale'],
  Tanzania:['Dar es Salaam','Dodoma','Arusha','Mwanza','Mbeya','Zanzibar City']
};

function text(v,n=160){return String(v??'').trim().slice(0,n)}
function j(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, max-age=3600','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-heart-connect-admin':VERSION}})}
function page(html,head=false){const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store, max-age=0','pragma':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()','cross-origin-opener-policy':'same-origin','cross-origin-resource-policy':'same-origin','strict-transport-security':'max-age=31536000; includeSubDomains','content-security-policy':"default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' blob: https:; connect-src 'self'; frame-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",'x-heart-connect-admin':VERSION};return new Response(head?null:html,{status:200,headers})}
function sameOrigin(request){const site=request.headers.get('sec-fetch-site');if(site==='cross-site')return false;const origin=request.headers.get('origin');if(!origin)return true;try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}}
async function actorFor(request,env){const u=new URL(request.url);u.pathname='/api/admin/capabilities';u.search='';const r=await handleAdminV18(new Request(u.toString(),{method:'GET',headers:request.headers}),env);if(!r)return null;let d={};try{d=await r.clone().json()}catch{}if(!r.ok)return null;const actor=d.actor||null,p=actor?.permissions||[];return actor&&(p.includes('*')||p.includes('users')||p.includes('users:read')||p.includes('users:write'))?actor:null}
async function externalJson(url,init={}){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),9000);try{const r=await fetch(url,{...init,signal:ctl.signal,headers:{accept:'application/json','content-type':'application/json',...(init.headers||{})}});if(!r.ok)return null;return await r.json()}catch{return null}finally{clearTimeout(timer)}}
function uniqSorted(items){return [...new Set((items||[]).map(x=>text(x,120)).filter(Boolean))].sort((a,b)=>a.localeCompare(b)).slice(0,3000)}
async function countries(request,env){const actor=await actorFor(request,env);if(!actor)return j({error:'Admin authentication required.'},401);const d=await externalJson('https://countriesnow.space/api/v0.1/countries/positions');const remote=Array.isArray(d?.data)?d.data.map(x=>x?.name):[];const items=uniqSorted(remote.length?remote:FALLBACK_COUNTRIES);return j({items,source:remote.length?'directory':'fallback'})}
async function cities(request,env){const actor=await actorFor(request,env);if(!actor)return j({error:'Admin authentication required.'},401);const u=new URL(request.url),country=text(u.searchParams.get('country'),120);if(!country)return j({error:'Choose a country first.'},400);const d=await externalJson('https://countriesnow.space/api/v0.1/countries/cities',{method:'POST',body:JSON.stringify({country})});const remote=Array.isArray(d?.data)?d.data:[];const fallback=FALLBACK_CITIES[country]||[];const items=uniqSorted(remote.length?remote:fallback);return j({country,items,source:remote.length?'directory':(fallback.length?'fallback':'unavailable')})}

export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&(request.method==='GET'||request.method==='HEAD'))return page(adminHtml(VERSION),request.method==='HEAD');if(!p.startsWith('/api/admin/'))return handleAdminV18(request,env);
  if(!sameOrigin(request))return j({error:'Cross-site admin request blocked.'},403);
  if(p==='/api/admin/locations/countries'&&request.method==='GET')return countries(request,env);
  if(p==='/api/admin/locations/cities'&&request.method==='GET')return cities(request,env);
  return handleAdminV18(request,env);
}
