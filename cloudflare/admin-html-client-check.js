import vm from 'node:vm';
import {adminHtml} from './admin-ui-v29.js';

const html=adminHtml('hc-admin-control-plane-v29-test');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
if(!scripts.length)throw new Error('No inline admin scripts found.');
for(const [i,script] of scripts.entries()){
  try{
    new vm.Script(script,{filename:`admin-inline-${i+1}.js`});
  }catch(error){
    console.error(`Admin inline script ${i+1} failed to compile.`);
    console.error(error.stack||error.message);
    const m=String(error.stack||'').match(/admin-inline-\d+\.js:(\d+)/);
    if(m){
      const line=Number(m[1]),rows=script.split('\n'),from=Math.max(0,line-4),to=Math.min(rows.length,line+3);
      for(let n=from;n<to;n++)console.error(`${String(n+1).padStart(4,' ')} | ${rows[n]}`);
    }
    process.exit(1);
  }
}
for(const marker of ['Media & HTML sections','Post media uploads','+ Add User','Profile editor','Discover visibility','Upload profile photo','AI admin assistant','Back to Users','Location & discovery','Save location','✦ AI Help','Heart Connect Admin AI','Profile photos','hc19AddPhotos','Mapbox place picker','Search Mapbox','hc16AddGender','hc16Gender','Select gender','📍 Nearby','🌍 Global','Maximum distance','Choose from country and city lists instead','Member location','hc21-location-shell','Choose interests','hc22-interest-box','Multiple selections are allowed','Heart Connect control center','Needs your attention','Platform operations','Launch readiness','AI management brief','Advanced Platform Analytics','Period-over-period growth','Engagement & trust ratios','Operations pulse','AI analytics analyst','Advanced Moderation','Trust & safety command center','Advanced Verification Center','Member Verification','BnB & Booking Verification','Short-lived evidence access','AI verification assistant','Advanced Payment Operations','Transaction ledger','Provider distribution','AI payment analyst','Payment sources','never fabricates a payment result']){
  if(!html.includes(marker))throw new Error(`Missing current Admin marker: ${marker}`);
}
if(html.includes("const TYPES=['home','legal','help','landing','content'];"))throw new Error('Broken v11 browser override was not removed.');
if(html.includes('function esc13'))throw new Error('Broken v13 browser bridge was not removed.');
console.log(`Compiled ${scripts.length} admin inline scripts and verified v29 payments, verification, moderation, analytics, overview, interests, gender and location controls.`);
