import previousWorker from './worker-v14.js';

const EDGE_VERSION='cloudflare-router-v15';
const TRAVEL_RETURN='/services/travel-planning-holiday-packages/#travel-services';

function isNavigation(request){
  if(request.method!=='GET'&&request.method!=='HEAD')return false;
  const mode=request.headers.get('sec-fetch-mode')||'';
  const accept=request.headers.get('accept')||'';
  return mode==='navigate'||accept.includes('text/html');
}

function returnContext(url){
  if(url.pathname==='/bookings'||url.pathname.startsWith('/bookings/')){
    return url.searchParams.get('type')==='date'?'Date & Experience Booking':'BnB Accommodation';
  }
  if(url.pathname==='/safety'||url.pathname.startsWith('/safety/'))return 'Travel & Dating Safety';
  return '';
}

function returnCss(){return `<style id="hc-travel-return-style">
.hc-travel-return{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#121735;color:#fff;border-bottom:1px solid rgba(255,255,255,.12)}
.hc-travel-return-inner{width:min(1160px,calc(100% - 32px));margin:auto;min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:18px}
.hc-travel-return-copy{display:flex;align-items:center;gap:10px;min-width:0}.hc-travel-return-mark{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,#ec4875,#8d5cf4);font-weight:900;font-size:12px;flex:0 0 auto}.hc-travel-return-copy b{display:block;font-size:12px}.hc-travel-return-copy small{display:block;color:#cfd3e9;font-size:10px;margin-top:1px}.hc-travel-return a{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 13px;border-radius:10px;background:#fff;color:#121735;text-decoration:none;font-size:11px;font-weight:900;white-space:nowrap}.hc-travel-return a:hover{background:#fff1f5;color:#b71f4e}.hc-travel-return a:focus-visible{outline:3px solid rgba(255,255,255,.45);outline-offset:2px}@media(max-width:600px){.hc-travel-return-inner{min-height:68px;align-items:center}.hc-travel-return-copy small{max-width:180px}.hc-travel-return a{padding:0 10px;font-size:10px}}
</style>`}

function returnBar(context){return `<section class="hc-travel-return" aria-label="Return to Heart Connect Travel & Experiences"><div class="hc-travel-return-inner"><div class="hc-travel-return-copy"><span class="hc-travel-return-mark">HC</span><span><b>${context}</b><small>Opened from Heart Connect Travel & Experiences</small></span></div><a href="${TRAVEL_RETURN}">← Back to Travel & Experiences</a></div></section>`}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    let response=await previousWorker.fetch(request,env,ctx);
    const context=url.searchParams.get('from')==='travel'&&isNavigation(request)?returnContext(url):'';
    if(!context||!response.ok||!(response.headers.get('content-type')||'').toLowerCase().includes('text/html'))return response;
    response=new HTMLRewriter()
      .on('head',{element(element){element.append(returnCss(),{html:true})}})
      .on('body',{element(element){element.prepend(returnBar(context),{html:true})}})
      .transform(response);
    const headers=new Headers(response.headers);headers.set('x-heart-connect-edge',EDGE_VERSION);headers.set('x-heart-connect-travel-return','active');headers.set('cache-control','no-store, max-age=0');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }
};
