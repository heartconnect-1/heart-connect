import vm from 'node:vm';
import {adminHtml} from './admin-ui-v17.js';

const html=adminHtml('hc-admin-control-plane-v17-test');
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
for(const marker of ['Media & HTML sections','hc15PageImage','hc15PageVideo','Post media uploads','+ Add User','Profile editor','Discover visibility','Upload profile photo','Upload profile video','AI admin assistant','Back to Users','Location & discovery','hc17Country','hc17City','hc17SaveLocation']){
  if(!html.includes(marker))throw new Error(`Missing current Admin marker: ${marker}`);
}
if(html.includes("const TYPES=['home','legal','help','landing','content'];"))throw new Error('Broken v11 browser override was not removed.');
if(html.includes('function esc13'))throw new Error('Broken v13 browser bridge was not removed.');
console.log(`Compiled ${scripts.length} admin inline scripts and verified the v17 Pages/CMS/User/location workspaces.`);
