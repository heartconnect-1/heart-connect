import previousWorker from './worker-v12.js';

const EDGE_VERSION='cloudflare-router-v13';
const RETIRED_BOOKING_SCRIPTS=new Set([
  '/_hc/booking-dashboard.js',
  '/_hc/booking-fix-v9.js',
  '/_hc/booking-fix.js',
  '/_hc/booking-polish.js',
  '/_hc/countries.js'
]);

function isNavigation(request){
  if(request.method!=='GET'&&request.method!=='HEAD')return false;
  const mode=request.headers.get('sec-fetch-mode')||'';
  const accept=request.headers.get('accept')||'';
  return mode==='navigate'||accept.includes('text/html');
}

function isBookingPage(request){
  if(!isNavigation(request))return false;
  const p=new URL(request.url).pathname;
  return p==='/bookings'||p.startsWith('/bookings/');
}

function edge(response){
  const headers=new Headers(response.headers);
  headers.set('x-heart-connect-edge',EDGE_VERSION);
  headers.set('x-heart-connect-booking-hang-guard','active');
  if((headers.get('content-type')||'').includes('text/html')){
    headers.set('cache-control','no-store, max-age=0');
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}

const removeLegacyBookingScripts={
  element(element){
    const src=element.getAttribute('src')||'';
    let pathname='';
    try{pathname=new URL(src,'https://heart-connect.invalid').pathname}catch{}
    if(RETIRED_BOOKING_SCRIPTS.has(pathname))element.remove();
  }
};

export default {
  async fetch(request,env,ctx){
    let response=await previousWorker.fetch(request,env,ctx);
    if(!isBookingPage(request))return edge(response);
    const ct=(response.headers.get('content-type')||'').toLowerCase();
    if(!response.ok||!ct.includes('text/html'))return edge(response);
    response=new HTMLRewriter()
      .on('script[src]',removeLegacyBookingScripts)
      .transform(response);
    return edge(response);
  }
};
