import {adminHtml as adminHtmlV33} from './admin-ui-v33.js';

export function adminHtml(version){
  const upgrade=`<style>
.hc34-upload{grid-column:1/-1;border:1px solid #ffffff10;background:linear-gradient(180deg,#0a1119,#070c12);border-radius:14px;padding:12px;display:grid;gap:10px}.hc34-upload-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.hc34-upload-head h4{margin:0;font-size:12px}.hc34-upload-head p{margin:4px 0 0;color:#79879a;font-size:9px;line-height:1.5}.hc34-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.hc34-grid label{display:grid;gap:5px}.hc34-grid span{font-size:9px;color:#8391a4}.hc34-grid input{width:100%;border:1px solid #ffffff14;background:#070c13;color:#fff;border-radius:11px;padding:10px;font-size:10px;outline:0}.hc34-actions{display:flex;gap:7px;flex-wrap:wrap}.hc34-btn{border:1px solid #ffffff15;background:#0a1018;color:#fff;border-radius:999px;padding:8px 11px;font-size:10px;font-weight:850;cursor:pointer}.hc34-btn.primary{border-color:transparent;background:linear-gradient(135deg,#2ca7ff,#765cff)}.hc34-btn:disabled{opacity:.45;cursor:not-allowed}.hc34-state{font-size:9px;color:#8492a5;min-height:14px}.hc34-note{border:1px solid #4fa8ff20;background:#4fa8ff0a;border-radius:11px;padding:9px;color:#93a8bb;font-size:9px;line-height:1.5}.hc34-library{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.hc34-media{border:1px solid #ffffff10;background:#080d14;border-radius:12px;overflow:hidden}.hc34-media img,.hc34-media video{width:100%;aspect-ratio:4/3;object-fit:cover;background:#05080d}.hc34-media div{padding:9px}.hc34-media b{font-size:9px}.hc34-media small{display:block;color:#748195;font-size:9px;margin-top:3px}
@media(max-width:720px){.hc34-grid{grid-template-columns:1fr}.hc34-library{grid-template-columns:1fr 1fr}}@media(max-width:430px){.hc34-library{grid-template-columns:1fr}}
</style><script>
(()=>{
  window.__hcPageUploadV34Available=true;
  const q=s=>document.querySelector(s);
  let applying=false;
  function esc(v){return String(v==null?'':v).replace(/[&<>\\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\"':'&quot;',"'":'&#39;'}[m]))}
  async function get(url){const r=await fetch(url,{credentials:'same-origin',headers:{accept:'application/json'}});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'Request failed');return d}
  async function upload(file,alt){const fd=new FormData();fd.append('file',file);fd.append('altText',alt||'');const r=await fetch('/api/admin/cms/media',{method:'POST',credentials:'same-origin',body:fd});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'Upload failed');return d.item}
  function addMediaSection(item){
    if(!item)return;
    const wrap=q('#hc33Sections');if(!wrap)return;
    const s=item.media_type==='video'
      ?{type:'media',title:'Video',kind:'video',url:item.public_url,alt:item.alt_text||''}
      :{type:'media',title:'Image',kind:'image',url:item.public_url,alt:item.alt_text||''};
    const section=document.createElement('div');
    section.className='hc33-section';
    const count=wrap.querySelectorAll('.hc33-section').length+1;
    section.innerHTML='<div class="hc33-section-head"><b>media · #'+count+'</b><div class="hc33-section-tools"><span class="hc33-mini">uploaded</span></div></div><textarea>'+esc(JSON.stringify(s,null,2))+'</textarea>';
    if(wrap.querySelector('.hc33-empty'))wrap.innerHTML='';
    wrap.appendChild(section);
    const all=[...wrap.querySelectorAll('.hc33-section textarea')];
    all.forEach((a,i)=>{a.setAttribute('data-section',String(i));a.onchange=()=>{try{JSON.parse(a.value);a.style.borderColor=''}catch{a.style.borderColor='#ff6278'}}});
    const st=q('#hc34UploadState');if(st)st.textContent=(item.media_type==='video'?'Video':'Image')+' uploaded and added as a page section.';
  }
  async function library(){
    const d=await get('/api/admin/cms/media'),items=Array.isArray(d.items)?d.items:[];
    const modal=document.createElement('dialog');
    modal.innerHTML='<div class="modal-head"><b>Choose page media</b><button type="button">×</button></div><div class="modal-body">'+(items.length?'<div class="hc34-library">'+items.map(x=>'<article class="hc34-media">'+(x.media_type==='video'?'<video controls muted preload="metadata" src="'+esc(x.public_url||'')+'"></video>':'<img loading="lazy" src="'+esc(x.public_url||'')+'" alt="'+esc(x.alt_text||'')+'">')+'<div><b>'+esc(x.alt_text||x.media_type||'Media')+'</b><small>'+esc(x.mime_type||'')+'</small><button class="hc34-btn primary" type="button" data-hc34-pick="'+esc(x.id)+'" style="margin-top:7px">Add to page</button></div></article>').join('')+'</div>':'<div class="hc33-empty"><b>No media uploaded yet</b><span>Upload an image or video from the page editor first.</span></div>')+'</div>';
    document.body.appendChild(modal);modal.querySelector('.modal-head button').onclick=()=>{modal.close();modal.remove()};
    modal.querySelectorAll('[data-hc34-pick]').forEach(b=>b.onclick=()=>{const item=items.find(x=>String(x.id)===b.dataset.hc34Pick);if(item)addMediaSection(item);modal.close();modal.remove()});
    modal.showModal();
  }
  function enhance(){
    if(applying)return;
    const form=q('.hc33-form[data-page-id]'),sections=q('#hc33Sections');if(!form||!sections||q('#hc34PageUpload'))return;
    applying=true;
    try{
      const panel=document.createElement('section');panel.id='hc34PageUpload';panel.className='hc34-upload';
      panel.innerHTML='<div class="hc34-upload-head"><div><h4>Page media upload</h4><p>Upload photos or videos while creating this page, then add them directly as structured media sections.</p></div><span class="hc33-badge">secure CMS storage</span></div><div class="hc34-grid"><label><span>Image or video</span><input id="hc34File" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"></label><label><span>Alt text / description</span><input id="hc34Alt" maxlength="500" placeholder="Describe this media"></label></div><div class="hc34-actions"><button class="hc34-btn primary" id="hc34UploadAdd" type="button">Upload & add to page</button><button class="hc34-btn" id="hc34Library" type="button">Choose from media library</button></div><div class="hc34-state" id="hc34UploadState"></div><div class="hc34-note">Supported: JPEG, PNG, WebP, GIF up to 8 MB; MP4 or WebM up to 20 MB. The upload is stored in the existing CMS media library and the page receives only the structured media reference.</div>';
      const target=sections.closest('.wide')||sections.parentElement;form.insertBefore(panel,target);
      q('#hc34UploadAdd').onclick=async()=>{const file=q('#hc34File').files[0],state=q('#hc34UploadState'),btn=q('#hc34UploadAdd');if(!file){state.textContent='Choose an image or video first.';return}state.textContent='Uploading '+file.name+'…';btn.disabled=true;try{const item=await upload(file,q('#hc34Alt').value);addMediaSection(item);q('#hc34File').value='';q('#hc34Alt').value=''}catch(e){state.textContent=e.message}finally{btn.disabled=false}};
      q('#hc34Library').onclick=()=>library().catch(e=>{const st=q('#hc34UploadState');if(st)st.textContent=e.message});
    }finally{applying=false}
  }
  new MutationObserver(()=>setTimeout(enhance,0)).observe(document.body,{childList:true,subtree:true});setTimeout(enhance,0);setTimeout(enhance,450);setTimeout(enhance,1100);
})();
</script>`;
  return adminHtmlV33(version).replace('</body>',upgrade+'</body>');
}
