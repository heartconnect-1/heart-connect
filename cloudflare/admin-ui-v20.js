import {adminHtml as adminHtmlV19} from './admin-ui-v19.js';

export function adminHtml(version){
  const upgrade=`<link href="https://api.mapbox.com/mapbox-gl-js/v3.30.0/mapbox-gl.css" rel="stylesheet"><script src="https://api.mapbox.com/mapbox-gl-js/v3.30.0/mapbox-gl.js"></script><style>
.hc20-mapbox{border:1px solid #68a8ff3b;background:linear-gradient(180deg,#0e1724,#081019);border-radius:14px;padding:14px;margin:12px 0}.hc20-mapbox-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px}.hc20-mapbox h3{margin:0}.hc20-mapbox p{margin:5px 0 0;color:#92a1b6;font-size:12px;line-height:1.5}.hc20-badge{display:inline-flex;border:1px solid #68a8ff44;background:#68a8ff12;color:#9dcbff;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.hc20-search-row{display:flex;gap:8px}.hc20-search{flex:1;background:#070d15;border:1px solid #ffffff1a;color:#fff;border-radius:10px;padding:10px 11px}.hc20-search-btn{border:1px solid #66a7ff55;background:#173250;color:#eaf4ff;border-radius:10px;padding:9px 12px;cursor:pointer}.hc20-results{display:grid;gap:6px;margin-top:8px}.hc20-result{width:100%;text-align:left;border:1px solid #ffffff12;background:#0c1420;color:#e8eef7;border-radius:10px;padding:9px 10px;cursor:pointer}.hc20-result small{display:block;color:#8594a8;margin-top:2px}.hc20-map{height:280px;border:1px solid #ffffff18;border-radius:12px;overflow:hidden;margin-top:10px;background:#05090e}.hc20-map-state{font-size:11px;color:#94a2b5;margin-top:8px;line-height:1.45}.hc20-map-state.warn{color:#ffd27a}.hc20-map-state.good{color:#78e4ac}.hc20-gender{width:100%;background:#080d15;border:1px solid #ffffff18;color:#fff;border-radius:10px;padding:10px 11px}.hc20-mapbox .mapboxgl-ctrl-logo{opacity:.75}
@media(max-width:650px){.hc20-search-row{flex-direction:column}.hc20-map{height:240px}}
</style><script>
(()=>{
  const maps=new Map(),markers=new Map();
  let configPromise=null;
  function h(v){return String(v==null?'':v).replace(/[&<>\\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#39;'}[m]))}
  async function rq(url,opt){const r=await fetch(url,Object.assign({credentials:'same-origin'},opt||{}));let d={};try{d=await r.json()}catch(e){}if(!r.ok){const er=new Error(d.error||'Request failed.');er.data=d;throw er}return d}
  function genderSelect(id){
    const old=document.getElementById(id);if(!old||old.tagName==='SELECT')return;
    const current=(old.value||'').trim(),sel=document.createElement('select');sel.id=id;sel.className='hc20-gender';sel.setAttribute('aria-label','Gender');
    const vals=['','Woman','Man','Non-binary','Another gender','Prefer not to say'];let html='';
    if(current&&!vals.includes(current))html+='<option value="'+h(current)+'" selected>'+h(current)+'</option>';
    for(const v of vals)html+='<option value="'+h(v)+'"'+(v===current?' selected':'')+'>'+(v?h(v):'Select gender')+'</option>';
    old.replaceWith(sel);
  }
  function config(){if(!configPromise)configPromise=rq('/api/admin/mapbox/config');return configPromise}
  function ids(scope){return scope==='add'?{country:'hc16AddCountry',city:'hc16AddCity',box:'hc20AddMap',search:'hc20AddSearch',results:'hc20AddResults',map:'hc20AddMapCanvas',state:'hc20AddMapState'}:{country:'hc17Country',city:'hc17City',box:'hc20ManageMap',search:'hc20ManageSearch',results:'hc20ManageResults',map:'hc20ManageMapCanvas',state:'hc20ManageMapState'}}
  function ensureOption(sel,value){if(!sel||!value)return;let opt=[...sel.options].find(o=>o.value===value);if(!opt){opt=document.createElement('option');opt.value=value;opt.textContent=value;sel.appendChild(opt)}sel.value=value;sel.dispatchEvent(new Event('change',{bubbles:true}))}
  function setPlace(scope,item,move=true){
    if(!item)return;const x=ids(scope),country=document.getElementById(x.country),city=document.getElementById(x.city);
    if(item.country)ensureOption(country,item.country);
    setTimeout(()=>{const c=document.getElementById(x.city);if(item.city)ensureOption(c,item.city)},180);
    const st=document.getElementById(x.state);if(st){st.textContent='Selected: '+([item.city,item.country].filter(Boolean).join(', ')||item.fullName||item.name)+'. Only city/country will be saved.';st.className='hc20-map-state good'}
    if(move&&item.longitude!=null&&item.latitude!=null){const m=maps.get(scope);if(m){m.flyTo({center:[item.longitude,item.latitude],zoom:9});let marker=markers.get(scope);if(!marker){marker=new mapboxgl.Marker();markers.set(scope,marker)}marker.setLngLat([item.longitude,item.latitude]).addTo(m)}}
  }
  async function search(scope){
    const x=ids(scope),input=document.getElementById(x.search),host=document.getElementById(x.results),st=document.getElementById(x.state),q=(input?.value||'').trim();if(q.length<2){if(st)st.textContent='Type at least 2 characters, then choose a result.';return}
    if(st)st.textContent='Searching Mapbox…';try{const d=await rq('/api/admin/mapbox/forward?q='+encodeURIComponent(q)),items=d.items||[];host.innerHTML=items.length?items.map((it,i)=>'<button class="hc20-result" type="button" data-i="'+i+'"><b>'+h(it.name||it.city||it.country)+'</b><small>'+h(it.fullName||[it.city,it.country].filter(Boolean).join(', '))+'</small></button>').join(''):'<div class="hc20-map-state">No matching places found.</div>';host.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{setPlace(scope,items[Number(b.dataset.i)]);host.innerHTML=''});if(st)st.textContent=items.length?'Choose one of the Mapbox results or click the map.':'No matching place found.'}catch(e){if(st){st.textContent=e.message;st.className='hc20-map-state warn'}}
  }
  async function reverse(scope,lng,lat){
    const x=ids(scope),st=document.getElementById(x.state);if(st)st.textContent='Looking up that point…';try{const d=await rq('/api/admin/mapbox/reverse?lng='+encodeURIComponent(lng)+'&lat='+encodeURIComponent(lat));if(d.item)setPlace(scope,d.item,false);else if(st)st.textContent='Mapbox could not resolve that point to a city/country.'}catch(e){if(st){st.textContent=e.message;st.className='hc20-map-state warn'}}
  }
  async function initMap(scope){
    const x=ids(scope),canvas=document.getElementById(x.map),st=document.getElementById(x.state);if(!canvas||maps.has(scope))return;
    try{const cfg=await config();if(!cfg.configured){st.textContent='Mapbox map is ready in the code but needs MAPBOX_PUBLIC_TOKEN in Cloudflare to activate.';st.className='hc20-map-state warn';canvas.innerHTML='<div style="padding:18px;color:#9aa8bb">Mapbox not configured yet.</div>';return}
      if(!window.mapboxgl){st.textContent='Mapbox GL JS could not load.';st.className='hc20-map-state warn';return}
      mapboxgl.accessToken=cfg.publicToken;const m=new mapboxgl.Map({container:x.map,style:cfg.style||'mapbox://styles/mapbox/standard',center:[25,10],zoom:1.4,attributionControl:true});maps.set(scope,m);m.addControl(new mapboxgl.NavigationControl(),'top-right');m.on('click',e=>{let marker=markers.get(scope);if(!marker){marker=new mapboxgl.Marker();markers.set(scope,marker)}marker.setLngLat(e.lngLat).addTo(m);reverse(scope,e.lngLat.lng,e.lngLat.lat)});st.textContent='Search and select a place, or click the map. Exact coordinates are not saved.';st.className='hc20-map-state good';
    }catch(e){st.textContent=e.message;st.className='hc20-map-state warn'}
  }
  function addMapBox(scope){
    const x=ids(scope);if(document.getElementById(x.box))return;
    const anchor=scope==='add'?document.getElementById('hc17AddLocation'):document.getElementById('hc17ManageLocation');if(!anchor)return;
    const box=document.createElement('section');box.id=x.box;box.className='hc20-mapbox';box.innerHTML='<div class="hc20-mapbox-head"><div><h3>Mapbox place picker</h3><p>Search for a city/place or click the map. Admin must select a Mapbox result; typed text alone is never saved as the location.</p></div><span class="hc20-badge">Mapbox</span></div><div class="hc20-search-row"><input class="hc20-search" id="'+x.search+'" placeholder="Search city or place" autocomplete="off"><button class="hc20-search-btn" id="'+x.search+'Btn" type="button">Search Mapbox</button></div><div class="hc20-results" id="'+x.results+'"></div><div class="hc20-map" id="'+x.map+'"></div><div class="hc20-map-state" id="'+x.state+'">Loading Mapbox…</div>';
    anchor.insertAdjacentElement('afterend',box);document.getElementById(x.search+'Btn').onclick=()=>search(scope);document.getElementById(x.search).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search(scope)}});setTimeout(()=>initMap(scope),30)
  }
  function enhance(){
    genderSelect('hc16AddGender');genderSelect('hc16Gender');
    if(document.getElementById('hc16AddEmail'))addMapBox('add');
    if(document.getElementById('hc17ManageLocation'))addMapBox('manage');
  }
  const target=document.getElementById('modalBody')||document.body;new MutationObserver(()=>setTimeout(enhance,20)).observe(target,{childList:true,subtree:true});enhance();
})();
</script>`;
  return adminHtmlV19(version).replace('</body>',upgrade+'</body>');
}
