import previousWorker from './worker-v10.js';
import COUNTRIES_V11 from './countries-v11.txt';

const EDGE_VERSION='cloudflare-router-v11';
const NEW_PATH='/_hc/countries-v11.js';

function isNavigation(request){if(request.method!=='GET'&&request.method!=='HEAD')return false;const mode=request.headers.get('sec-fetch-mode')||'',accept=request.headers.get('accept')||'';return mode==='navigate'||accept.includes('text/html')}
function edge(response){const headers=new Headers(response.headers);headers.set('x-heart-connect-edge',EDGE_VERSION);return new Response(response.body,{status:response.status,statusText:response.statusText,headers})}

export default {async fetch(request,env,ctx){const incoming=new URL(request.url);if(request.method==='GET'&&incoming.pathname==='/_hc/countries.js')return new Response('/* superseded by countries-v11 */',{headers:{'content-type':'application/javascript; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-heart-connect-edge':EDGE_VERSION}});if(request.method==='GET'&&incoming.pathname===NEW_PATH)return new Response(COUNTRIES_V11,{headers:{'content-type':'application/javascript; charset=utf-8','cache-control':'public, max-age=604800, immutable','x-content-type-options':'nosniff','x-heart-connect-edge':EDGE_VERSION}});let response=await previousWorker.fetch(request,env,ctx);const booking=isNavigation(request)&&!incoming.pathname.startsWith('/api/')&&(incoming.pathname==='/bookings'||incoming.pathname.startsWith('/bookings/'));if(booking&&response.ok&&(response.headers.get('content-type')||'').includes('text/html'))response=new HTMLRewriter().on('head',{element(element){element.append('<script src="'+NEW_PATH+'" defer></script>',{html:true})}}).transform(response);return edge(response)}};