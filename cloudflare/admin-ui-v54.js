import {adminHtml as adminHtmlV53} from './admin-ui-v53.js';

export function adminHtml(version){
  const patch=`<style>
.hc52-route.hc54-route-link{cursor:pointer;transition:transform .16s ease,border-color .16s ease,background .16s ease;position:relative;padding-right:38px}
.hc52-route.hc54-route-link:hover{transform:translateY(-2px);border-color:#8d5cf455;background:#0b1320}
.hc52-route.hc54-route-link:focus-visible{outline:2px solid #9a7bff;outline-offset:2px}
.hc52-route.hc54-route-link::after{content:'↗';position:absolute;right:14px;top:14px;color:#b9a8ff;font-size:16px;font-weight:900}
.hc52-route.hc54-route-link code{cursor:pointer}
.hc54-home-switch{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.hc54-home-chip{display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid #ffffff14;border-radius:999px;background:#080e16;color:#c7cfdd;font-size:10px;font-weight:850;cursor:pointer}
.hc54-home-chip.active{border-color:#8d5cf455;background:#8d5cf414;color:#efeaff}
</style><script>
(()=>{
  let busy54=false;
  function routeHref54(card){
    const code=String(card.querySelector('code')?.textContent||'').trim();
    if(code==='/')return '/';
    if(code==='/app')return '/app';
    return '';
  }
  function install54(){
    if(busy54)return;
    const view=document.getElementById('view'),title=document.getElementById('title');
    if(!view||!title||title.textContent.trim()!=='Homepage'||!view.querySelector('.hc52'))return;
    busy54=true;
    try{
      const hero=view.querySelector('.hc52-hero');
      if(hero&&!hero.querySelector('.hc54-home-switch')){
        const sw=document.createElement('div');
        sw.className='hc54-home-switch';
        sw.innerHTML='<button type="button" class="hc54-home-chip active" data-hc54-home="/">General Home <code>/</code></button><button type="button" class="hc54-home-chip" data-hc54-home="/app">Member Home <code>/app</code></button>';
        hero.appendChild(sw);
        sw.querySelector('[data-hc54-home="/"]').onclick=()=>window.open('/','_blank','noopener');
        sw.querySelector('[data-hc54-home="/app"]').onclick=()=>window.open('/app','_blank','noopener');
      }
      [...view.querySelectorAll('.hc52-route')].forEach(card=>{
        if(card.dataset.hc54Bound)return;
        const href=routeHref54(card);if(!href)return;
        card.dataset.hc54Bound='1';card.classList.add('hc54-route-link');card.tabIndex=0;card.setAttribute('role','link');
        if(href==='/'){
          const b=card.querySelector('b');if(b)b.textContent='General Home';
          card.setAttribute('aria-label','Open General Home at /');
          card.setAttribute('title','Open General Home');
        }else{
          card.setAttribute('aria-label','Open Member Home at /app');
          card.setAttribute('title','Open Member Home');
        }
        const open=()=>window.open(href,'_blank','noopener');
        card.addEventListener('click',open);
        card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
      });
    }finally{busy54=false}
  }
  try{
    new MutationObserver(()=>queueMicrotask(install54)).observe(document.body,{childList:true,subtree:true});
    install54();setTimeout(install54,300);setTimeout(install54,900);
  }catch{}
})();
</script>`;
  return adminHtmlV53(version).replace('</body>',patch+'</body>');
}
