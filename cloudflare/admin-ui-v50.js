import {adminHtml as adminHtmlV49} from './admin-ui-v49.js';

export function adminHtml(version){
  const patch=`<style>
.hc50-hardening{border:1px solid #43d3992a;background:linear-gradient(180deg,#0b1814,#08110f);border-radius:16px;padding:14px;margin-bottom:14px}
.hc50-hardening h3{margin:0;font-size:17px}.hc50-hardening p{margin:4px 0 0;color:#8ca59b;font-size:11px;line-height:1.6}
.hc50-hardening-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:11px}
.hc50-hardening-item{border:1px solid #ffffff0f;background:#07100d;border-radius:11px;padding:10px}
.hc50-hardening-item b{font-size:11px}.hc50-hardening-item span{display:block;color:#7f958c;font-size:9px;line-height:1.5;margin-top:4px}
.hc50-hardening-pill{display:inline-flex;border:1px solid #43d39934;color:#8df0c3;border-radius:999px;padding:5px 7px;font-size:9px;font-weight:850;margin-left:6px}
.hc50-hardening-item.warn{border-color:#ffc86125;background:#171308}.hc50-hardening-item.warn .hc50-hardening-pill{border-color:#ffc86135;color:#ffd58e}
@media(max-width:760px){.hc50-hardening-grid{grid-template-columns:1fr}}
</style><script>
(()=>{
let busy50=false;
const esc50=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function add50(){
  try{
    if(busy50||!title||!view||title.textContent.trim()!=='Security Review'||document.getElementById('hc50Hardening'))return;
    busy50=true;
    const r=await fetch('/api/admin/security/hardening-status',{credentials:'same-origin',headers:{accept:'application/json'}});
    if(!r.ok)return;
    const d=await r.json();
    const box=document.createElement('section');box.id='hc50Hardening';box.className='hc50-hardening';
    const controls=(d.controls||[]).map(x=>'<div class="hc50-hardening-item"><b>'+esc50(x.label)+'</b><span>'+esc50(x.detail)+'</span><span class="hc50-hardening-pill">'+esc50(x.status)+'</span></div>').join('');
    const remaining=(d.remaining||[]).map(x=>'<div class="hc50-hardening-item warn"><b>'+esc50(x.label)+'</b><span>'+esc50(x.detail)+'</span><span class="hc50-hardening-pill">'+esc50(x.status)+'</span></div>').join('');
    box.innerHTML='<div><h3>Admin Security Hardening v50 <span class="hc50-hardening-pill">'+esc50(d.posture||'hardened')+'</span></h3><p>Current edge, session, browser and database hardening controls. Recommended items are shown separately and are not claimed as complete.</p></div><div class="hc50-hardening-grid">'+controls+remaining+'</div>';
    view.prepend(box);
  }catch{}finally{busy50=false}
}
try{
  new MutationObserver(()=>setTimeout(add50,0)).observe(document.body,{childList:true,subtree:true,characterData:true});
  setTimeout(add50,0);setTimeout(add50,350);setTimeout(add50,1000);
}catch{}
})();
</script>`;
  return adminHtmlV49(version).replace('</body>',patch+'</body>');
}
