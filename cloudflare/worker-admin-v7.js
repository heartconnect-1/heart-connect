import previousWorker from './worker-v15.js';
import {handleAdmin,runPhase7AndEarlierScheduled,VERSION as ADMIN_VERSION} from './admin-api-v37.js';
import {handleAdminLogin} from './admin-login-v2.js';
import BOOKING_ADVANCED from './booking-advanced-v10.txt';

const EDGE_VERSION='cloudflare-admin-router-v38-automation-ai-command-center';
const BOOKING_ASSET='/_hc/booking-advanced-v10.js';
const BOOKING_LOCATION_SEARCH='/_hc/booking-location-search';

function stamp(response){const h=new Headers(response.headers);h.set('x-heart-connect-admin-router',EDGE_VERSION);h.set('x-heart-connect-admin-version',ADMIN_VERSION);h.set('x-heart-connect-security-core','cloudflare-router-v15');h.set('x-content-type-options','nosniff');h.set('referrer-policy','strict-origin-when-cross-origin');h.set('permissions-policy','camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()');h.set('strict-transport-security','max-age=31536000; includeSubDomains');return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h})}
function hasNativeSessionCookie(request){return /(?:^|;\s*)__Host-hc_cf_access=/.test(String(request.headers.get('cookie')||''))}
function clean(v,n=300){return String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,n)}
function isBookingNavigation(request,url){if(request.method!=='GET'&&request.method!=='HEAD')return false;if(!(url.pathname==='/bookings'||url.pathname.startsWith('/bookings/')))return false;const accept=request.headers.get('accept')||'',mode=request.headers.get('sec-fetch-mode')||'';return mode==='navigate'||accept.includes('text/html')}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin','x-heart-connect-booking':'advanced-v10'}})}
async function bookingLocationSearch(request,env){
  const url=new URL(request.url),q=clean(url.searchParams.get('q'),120),token=String(env.MAPBOX_PUBLIC_TOKEN||'').trim();
  if(q.length<2)return json({error:'Type at least 2 characters to search for a location.'},400);
  if(!token.startsWith('pk.'))return json({error:'Location search is temporarily unavailable.'},503);
  const endpoint=new URL('https://api.mapbox.com/search/geocode/v6/forward');
  endpoint.searchParams.set('q',q);endpoint.searchParams.set('access_token',token);endpoint.searchParams.set('limit','6');endpoint.searchParams.set('types','place,locality,neighborhood,district,region');endpoint.searchParams.set('language','en');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
    const r=await fetch(endpoint.toString(),{headers:{accept:'application/json','user-agent':'Heart Connect Booking Location/1.0'},signal:controller.signal});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)return json({error:'Location search is temporarily unavailable.'},503);
    const items=(Array.isArray(d.features)?d.features:[]).slice(0,6).map(f=>{
      const p=f?.properties||{},c=p.context||{},featureType=String(p.feature_type||'');
      const country=clean(c.country?.name||p.country||'',80);
      const region=clean(c.region?.name||'',100);
      let locality=clean(c.place?.name||c.locality?.name||'',100);
      let area=clean(c.neighborhood?.name||c.district?.name||'',100);
      const own=clean(p.name_preferred||p.name||'',100);
      if((featureType==='place'||featureType==='locality')&&!locality)locality=own;
      if((featureType==='neighborhood'||featureType==='district')&&!area)area=own;
      if(!locality)locality=own;
      const fullName=clean(p.full_address||[own,p.place_formatted].filter(Boolean).join(', ')||[area,locality,region,country].filter(Boolean).join(', '),220);
      return{name:own||locality||area,fullName,country,region,locality,area};
    }).filter(x=>x.country||x.locality||x.area);
    return json({items,storesExactCoordinates:false,note:'Search results are used to fill country, region, locality and area fields. Exact coordinates are not stored by this helper.'});
  }catch{return json({error:'Location search is temporarily unavailable.'},503)}
  finally{clearTimeout(timer)}
}
function bookingTransform(response){
  const ct=(response.headers.get('content-type')||'').toLowerCase();
  if(!response.ok||!ct.includes('text/html'))return response;
  const out=new HTMLRewriter().on('body',{element(el){el.append('<script src="'+BOOKING_ASSET+'" defer></script>',{html:true})}}).transform(response);
  const h=new Headers(out.headers);h.set('cache-control','no-store, max-age=0');h.set('x-heart-connect-booking','advanced-v10');h.set('x-heart-connect-security-core','cloudflare-router-v15');
  return new Response(out.body,{status:out.status,statusText:out.statusText,headers:h});
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname===BOOKING_ASSET&&request.method==='GET')return new Response(BOOKING_ADVANCED,{headers:{'content-type':'application/javascript; charset=utf-8','cache-control':'public, max-age=300','x-content-type-options':'nosniff','x-heart-connect-booking':'advanced-v10'}});
    if(url.pathname===BOOKING_LOCATION_SEARCH&&request.method==='GET')return bookingLocationSearch(request,env);
    if((url.pathname==='/admin'||url.pathname==='/admin/')&&!hasNativeSessionCookie(request))return Response.redirect(new URL('/admin/login',url),302);
    const login=await handleAdminLogin(request,env);
    if(login)return stamp(login);
    const admin=await handleAdmin(request,env);
    if(admin)return stamp(admin);
    const response=await previousWorker.fetch(request,env,ctx);
    return isBookingNavigation(request,url)?bookingTransform(response):response;
  },

  async scheduled(controller,env,ctx){
    const jobs=[runPhase7AndEarlierScheduled(env)];
    if(typeof previousWorker.scheduled==='function')jobs.push(previousWorker.scheduled(controller,env,ctx));
    const work=Promise.allSettled(jobs);
    if(ctx&&typeof ctx.waitUntil==='function')ctx.waitUntil(work);
    else await work;
  }
};
