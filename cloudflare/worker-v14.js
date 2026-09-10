import previousWorker from './worker-v13.js';
import TRAVEL_PAGE from './travel-page-v1.txt';
import TRAVEL_INTERACTIONS from './travel-interactions-v1.txt';

const EDGE_VERSION='cloudflare-router-v14';
const TRAVEL_PATH='/services/travel-planning-holiday-packages/';
const ENQUIRY_PATH='/_hc/travel-enquiry';
const INTERACTIONS_PATH='/_hc/travel-interactions-v1.js';

function clean(value,max=500){return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
function validEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254}
function travelHeaders(){return{
  'content-type':'text/html; charset=utf-8',
  'cache-control':'public, max-age=300, stale-while-revalidate=3600',
  'x-content-type-options':'nosniff',
  'x-frame-options':'DENY',
  'referrer-policy':'strict-origin-when-cross-origin',
  'permissions-policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'content-security-policy':"default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; style-src 'unsafe-inline'; font-src 'self'; connect-src 'self' https://api-v2.appdeploy.ai https://zzhzkikezjtbntaqiurk.supabase.co",
  'x-heart-connect-edge':EDGE_VERSION,
  'x-heart-connect-travel-page':'professional-v1'
}}
function render(url){
  const status=url.searchParams.get('enquiry');
  const sent=status==='sent',failed=status==='failed';
  return TRAVEL_PAGE
    .replace('{{STATUS_CLASS}}',sent?'success':failed?'failed':'')
    .replace('{{STATUS_HIDDEN}}',sent||failed?'':'hidden')
    .replace('{{STATUS_TEXT}}',sent?'Travel enquiry sent successfully. The Heart Connect team can now review your trip brief.':failed?'Your enquiry could not be delivered right now. Please email info@royal-heart.com.':'')
    .replace('</body>','<script src="'+INTERACTIONS_PATH+'" defer></script></body>');
}
function redirect(request,state){const u=new URL(TRAVEL_PATH,request.url);u.searchParams.set('enquiry',state);u.hash='enquiry';return Response.redirect(u.toString(),303)}
async function enquiry(request,env,ctx){
  const size=Number(request.headers.get('content-length')||0);if(size>30000)return redirect(request,'failed');
  let form;try{form=await request.formData()}catch{return redirect(request,'failed')}
  if(clean(form.get('website'),100))return redirect(request,'sent');
  const name=clean(form.get('name'),80),email=clean(form.get('email'),254).toLowerCase(),destination=clean(form.get('destination'),100),month=clean(form.get('month'),40),travellers=clean(form.get('travellers'),20),tripType=clean(form.get('tripType'),60),budget=clean(form.get('budget'),80),notes=clean(form.get('message'),1800);
  if(name.length<2||!validEmail(email)||destination.length<2||notes.length<10)return redirect(request,'failed');
  const message=[
    'Travel planning enquiry',
    '',
    'Destination / region: '+destination,
    month?'Preferred travel month: '+month:'',
    travellers?'Travellers: '+travellers:'',
    tripType?'Trip type: '+tripType:'',
    budget?'Approximate budget: '+budget:'',
    '',
    notes
  ].filter(Boolean).join('\n');
  const apiUrl=new URL('/api/contact',request.url);
  const apiRequest=new Request(apiUrl.toString(),{method:'POST',headers:{'content-type':'application/json','accept':'application/json','user-agent':request.headers.get('user-agent')||'Heart Connect Travel'},body:JSON.stringify({name,email,department:'general',subject:'Travel planning enquiry — '+destination,message,website:''})});
  try{
    const response=await previousWorker.fetch(apiRequest,env,ctx);
    return redirect(request,response.ok?'sent':'failed');
  }catch{return redirect(request,'failed')}
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(url.pathname===INTERACTIONS_PATH&&request.method==='GET')return new Response(TRAVEL_INTERACTIONS,{headers:{'content-type':'application/javascript; charset=utf-8','cache-control':'public, max-age=604800, immutable','x-content-type-options':'nosniff','x-heart-connect-edge':EDGE_VERSION}});
    if(url.pathname==='/services/travel-planning-holiday-packages'&&(request.method==='GET'||request.method==='HEAD')){
      url.pathname=TRAVEL_PATH;return Response.redirect(url.toString(),308);
    }
    if(url.pathname===TRAVEL_PATH&&(request.method==='GET'||request.method==='HEAD')){
      const html=render(url),headers=travelHeaders();
      return new Response(request.method==='HEAD'?null:html,{status:200,headers});
    }
    if(url.pathname===ENQUIRY_PATH&&request.method==='POST')return enquiry(request,env,ctx);
    return previousWorker.fetch(request,env,ctx);
  }
};