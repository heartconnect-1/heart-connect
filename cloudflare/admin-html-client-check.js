import vm from 'node:vm';
import {adminHtml} from './admin-ui-v36.js';

const html=adminHtml('hc-admin-control-plane-v36-test');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
if(!scripts.length)throw new Error('No inline admin scripts found.');
for(const [i,script] of scripts.entries()){
  try{new vm.Script(script,{filename:`admin-inline-${i+1}.js`})}
  catch(error){console.error(`Admin inline script ${i+1} failed to compile.`);console.error(error.stack||error.message);process.exit(1)}
}
for(const marker of ['Advanced Verification Center','Advanced Payment Operations','Advanced Market Control','Advanced Content Studio','Featured image / cover','Category','Tags','Visual editor','Search preview','Save draft','Schedule post','Publish now','Autosave ready','min read','Advanced Page Manager','Page registry','Page templates','Publishing boundary','Revisions','PUBLISH LEGAL','Page media upload','Upload & add to page','Choose from media library','secure CMS storage','Choose','Notification Control Center','Campaign registry','Process queued batch','Generate AI draft','Native in-app only','Queue now']){
  if(!html.includes(marker))throw new Error(`Missing current Admin marker: ${marker}`);
}
if(html.includes("const TYPES=['home','legal','help','landing','content'];"))throw new Error('Broken v11 browser override was not removed.');
if(html.includes('function esc13'))throw new Error('Broken v13 browser bridge was not removed.');
console.log(`Compiled ${scripts.length} admin inline scripts and verified v36 notification control center plus prior admin layers.`);
