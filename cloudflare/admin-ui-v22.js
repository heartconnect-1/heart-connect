import {adminHtml as adminHtmlV21} from './admin-ui-v21.js';

export function adminHtml(version){
  const upgrade=`<style>
.hc22-interest-wrap{position:relative}.hc22-interest-hidden{display:none!important}.hc22-interest-box{border:1px solid #ffffff18;background:#080d15;border-radius:12px;padding:10px}.hc22-interest-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.hc22-interest-title{font-size:11px;color:#9da9ba}.hc22-interest-count{font-size:10px;color:#ff8da2;font-weight:900}.hc22-interest-toggle{width:100%;margin-top:7px;border:1px solid #ffffff16;background:#0d1420;color:#fff;border-radius:10px;padding:10px 11px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;text-align:left}.hc22-interest-menu{display:none;margin-top:8px;border:1px solid #ffffff14;background:#070b11;border-radius:12px;padding:10px;max-height:260px;overflow:auto}.hc22-interest-menu.open{display:block}.hc22-interest-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.hc22-interest-option{display:flex;gap:8px;align-items:center;border:1px solid #ffffff10;background:#0d131c;border-radius:10px;padding:8px 9px;font-size:11px;color:#dce4ef;cursor:pointer}.hc22-interest-option:hover{border-color:#ff66834a}.hc22-interest-option input{accent-color:#ff4458}.hc22-interest-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.hc22-interest-chip{border:1px solid #ff66833d;background:#ff445813;color:#ff9bad;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800}.hc22-interest-empty{color:#7f8b9d;font-size:10px;margin-top:7px}.hc22-interest-actions{display:flex;justify-content:flex-end;margin-top:8px}.hc22-interest-clear{border:0;background:transparent;color:#9da9ba;font-size:10px;cursor:pointer}.hc22-interest-help{font-size:10px;color:#758398;line-height:1.45;margin-top:6px}
@media(max-width:650px){.hc22-interest-grid{grid-template-columns:1fr}}
</style><script>
(()=>{
  const INTERESTS=['Travel','Music','Movies & TV','Reading','Cooking','Food & dining','Fitness','Gym','Running','Hiking','Nature','Beach','Sports','Football','Basketball','Gaming','Photography','Art','Dancing','Fashion','Technology','Business','Entrepreneurship','Cars','Pets','Dogs','Cats','Coffee','Volunteering','Languages','Culture','Gardening','Wellness','Meditation','Family','Live music','Comedy','Adventure'];
  function parse(v){return [...new Set(String(v||'').split(',').map(x=>x.trim()).filter(Boolean))].slice(0,30)}
  function esc(v){return String(v==null?'':v).replace(/[&<>\\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#39;'}[m]))}
  function enhanceInterests(id,label){
    const input=document.getElementById(id);if(!input||input.dataset.hc22)return;input.dataset.hc22='1';input.classList.add('hc22-interest-hidden');
    const holder=input.closest('label')||input.parentElement;if(!holder)return;holder.classList.add('hc22-interest-wrap');
    const selected=new Set(parse(input.value));const options=[...new Set([...INTERESTS,...selected])];
    const box=document.createElement('div');box.className='hc22-interest-box';box.innerHTML='<div class="hc22-interest-head"><span class="hc22-interest-title">'+esc(label||'Interests')+'</span><span class="hc22-interest-count"></span></div><button class="hc22-interest-toggle" type="button"><span>Choose interests</span><span>⌄</span></button><div class="hc22-interest-menu"><div class="hc22-interest-grid">'+options.map(x=>'<label class="hc22-interest-option"><input type="checkbox" value="'+esc(x)+'"'+(selected.has(x)?' checked':'')+'><span>'+esc(x)+'</span></label>').join('')+'</div><div class="hc22-interest-actions"><button class="hc22-interest-clear" type="button">Clear selections</button></div></div><div class="hc22-interest-chips"></div><div class="hc22-interest-help">Select the interests the member actually provided. Multiple selections are allowed.</div>';
    holder.appendChild(box);
    const menu=box.querySelector('.hc22-interest-menu'),toggle=box.querySelector('.hc22-interest-toggle'),chips=box.querySelector('.hc22-interest-chips'),count=box.querySelector('.hc22-interest-count');
    function sync(){
      const vals=[...box.querySelectorAll('input[type=checkbox]:checked')].map(x=>x.value).slice(0,30);input.value=vals.join(', ');input.dispatchEvent(new Event('input',{bubbles:true}));count.textContent=vals.length?vals.length+' selected':'None selected';chips.innerHTML=vals.length?vals.map(x=>'<span class="hc22-interest-chip">'+esc(x)+'</span>').join(''):'<span class="hc22-interest-empty">No interests selected yet.</span>';toggle.querySelector('span').textContent=vals.length?vals.slice(0,3).join(', ')+(vals.length>3?' +'+(vals.length-3):''):'Choose interests';
    }
    toggle.onclick=()=>menu.classList.toggle('open');box.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.onchange=sync);box.querySelector('.hc22-interest-clear').onclick=()=>{box.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.checked=false);sync()};sync();
  }
  function enhance(){
    enhanceInterests('hc16AddInterests','Interests');
    enhanceInterests('hc16Interests','Interests');
  }
  const target=document.getElementById('modalBody')||document.body;new MutationObserver(()=>setTimeout(enhance,25)).observe(target,{childList:true,subtree:true});enhance();
})();
</script>`;
  return adminHtmlV21(version).replace('</body>',upgrade+'</body>');
}
