import {adminHtml} from './admin-ui-v13.js';

const html=adminHtml('hc-admin-control-plane-v13-test');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
if(!scripts.length)throw new Error('No inline admin scripts found.');
for(const [i,script] of scripts.entries()){
  try{new Function(script)}catch(error){throw new Error(`Admin inline script ${i+1} failed to compile: ${error.message}`)}
}
for(const marker of ['Media & HTML sections','hc13PageImage','hc13PageVideo','Post media uploads','hc13CmsImage','hc13CmsVideo']){
  if(!html.includes(marker))throw new Error(`Missing v13 admin marker: ${marker}`);
}
console.log(`Compiled ${scripts.length} admin inline scripts and verified v13 upload markers.`);
