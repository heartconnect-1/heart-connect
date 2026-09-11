import {adminHtml as adminHtmlV52} from './admin-ui-v52.js';

export function adminHtml(version){
  const patch=`<style>
.hc33-kpi.hc53-clickable{cursor:pointer;transition:transform .16s ease,border-color .16s ease,background .16s ease;position:relative}
.hc33-kpi.hc53-clickable:hover{transform:translateY(-2px);border-color:#72cfff55;background:linear-gradient(180deg,#142234,#0a111b)}
.hc33-kpi.hc53-clickable:focus-visible{outline:2px solid #72cfff;outline-offset:2px}
.hc33-kpi.hc53-clickable::after{content:'Open';position:absolute;right:10px;top:10px;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#72cfff;opacity:.75}
.hc33-kpi.hc53-active{border-color:#72cfff88;background:linear-gradient(180deg,#142a3d,#0a121d);box-shadow:0 0 0 1px #72cfff20 inset}
.hc33-kpi.hc53-active::after{content:'Filtered'}
.hc53-seo-hidden{display:none!important}
</style><script>
(()=>{
  let mode53='all',busy53=false;
  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];
  function label53(card){return String(card.querySelector('small')?.textContent||'').trim().toLowerCase()}
  function setSelect53(id,value){
    const el=q(id);if(!el)return;
    el.value=value;
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }
  function setSearch53(value=''){
    const el=q('#hc33Search');if(!el)return;
    el.value=value;
    el.dispatchEvent(new Event('input',{bubbles:true}));
  }
  function clearSeo53(){document.documentElement.dataset.hc53PagesFilter='';qa('.hc33-page').forEach(x=>x.classList.remove('hc53-seo-hidden'))}
  function applySeo53(){
    if(document.documentElement.dataset.hc53PagesFilter!=='seo')return;
    const cards=qa('#hc33List .hc33-page');let visible=0;
    cards.forEach(card=>{const good=/good seo/i.test(card.textContent||'');card.classList.toggle('hc53-seo-hidden',!good);if(good)visible++});
    const shown=q('#hc33Shown');if(shown)shown.textContent=visible+' SEO complete';
  }
  function mark53(){
    qa('.hc33-kpi').forEach(k=>k.classList.toggle('hc53-active',label53(k)===mode53));
  }
  function choose53(key){
    if(busy53)return;busy53=true;
    try{
      clearSeo53();setSearch53('');
      if(key==='drafts'){mode53='drafts';setSelect53('#hc33TypeFilter','all');setSelect53('#hc33StatusFilter','draft')}
      else if(key==='published'){mode53='published';setSelect53('#hc33TypeFilter','all');setSelect53('#hc33StatusFilter','published')}
      else if(key==='legal pages'){mode53='legal pages';setSelect53('#hc33StatusFilter','all');setSelect53('#hc33TypeFilter','legal')}
      else if(key==='seo complete'){mode53='seo complete';setSelect53('#hc33StatusFilter','all');setSelect53('#hc33TypeFilter','all');document.documentElement.dataset.hc53PagesFilter='seo';setTimeout(applySeo53,0);setTimeout(applySeo53,80)}
      else{mode53='pages';setSelect53('#hc33StatusFilter','all');setSelect53('#hc33TypeFilter','all')}
      mark53();q('#hc33List')?.scrollIntoView({behavior:'smooth',block:'start'});
    }finally{setTimeout(()=>{busy53=false},0)}
  }
  function install53(){
    if(q('#title')?.textContent.trim()!=='Pages'||!q('.hc33-kpis'))return;
    qa('.hc33-kpi').forEach(card=>{
      if(card.dataset.hc53Bound)return;
      card.dataset.hc53Bound='1';card.classList.add('hc53-clickable');card.tabIndex=0;card.setAttribute('role','button');
      const key=label53(card);card.setAttribute('aria-label','Filter pages by '+key);
      card.addEventListener('click',()=>choose53(key));
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose53(key)}});
    });
    if(document.documentElement.dataset.hc53PagesFilter==='seo')applySeo53();
    mark53();
  }
  try{
    new MutationObserver(()=>queueMicrotask(install53)).observe(document.body,{childList:true,subtree:true});
    install53();setTimeout(install53,350);setTimeout(install53,900);
  }catch{}
})();
</script>`;
  return adminHtmlV52(version).replace('</body>',patch+'</body>');
}
