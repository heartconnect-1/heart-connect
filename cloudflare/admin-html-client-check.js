import vm from 'node:vm';
import {adminHtml} from './admin-ui-v31.js';

const html=adminHtml('hc-admin-control-plane-v31-test');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
if(!scripts.length)throw new Error('No inline admin scripts found.');
for(const [i,script] of scripts.entries()){
  try{new vm.Script(script,{filename:`admin-inline-${i+1}.js`})}
  catch(error){console.error(`Admin inline script ${i+1} failed to compile.`);console.error(error.stack||error.message);process.exit(1)}
}
for(const marker of ['Advanced Verification Center','Advanced Payment Operations','Advanced Market Control','Advanced Content Studio','Editorial posts','Media library','Distribution','AI writing assistant','Check publishing readiness','revision snapshot']){
  if(!html.includes(marker))throw new Error(`Missing current Admin marker: ${marker}`);
}
if(html.includes("const TYPES=['home','legal','help','landing','content'];"))throw new Error('Broken v11 browser override was not removed.');
if(html.includes('function esc13'))throw new Error('Broken v13 browser bridge was not removed.');
console.log(`Compiled ${scripts.length} admin inline scripts and verified v31 CMS plus prior admin layers.`);
