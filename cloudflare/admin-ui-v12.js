import {adminHtml as adminHtmlV11} from './admin-ui-v11.js';

export function adminHtml(version){
  const upgrade=`<style>
.hc12-upload-panel{border:1px solid #ef54802e;background:linear-gradient(180deg,#15101a,#0b1119);border-radius:16px;padding:15px;margin:12px 0}.hc12-upload-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}.hc12-upload-head h3{margin:0}.hc12-upload-head p{margin:5px 0 0;color:#909bae;font-size:12px;line-height:1.5}.hc12-upload-badge{display:inline-flex;border:1px solid #ef54803c;background:#ef548014;color:#ff8cac;border-radius:999px;padding:6px 9px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.hc12-upload-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.hc12-upload-action{min-height:78px;border:1px solid #ffffff16;background:#0d1520;color:#eef2f8;border-radius:12px;padding:12px;text-align:left;cursor:pointer}.hc12-upload-action:hover{border-color:#ef548055;background:#121c2a}.hc12-upload-action b{display:block;font-size:13px;margin-bottom:5px}.hc12-upload-action small{display:block;color:#8f9caf;line-height:1.4}.hc12-upload-note{margin-top:10px;color:#8d99ab;font-size:11px;line-height:1.5}.hc12-upload-state{margin-top:8px;min-height:18px;color:#a7b3c4;font-size:11px}.hc12-upload-action.primary{border-color:#ef54803f;background:#331321}.hc12-upload-action.primary:hover{background:#421827}
@media(max-width:760px){.hc12-upload-grid{grid-template-columns:1fr}.hc12-upload-head{flex-direction:column}}
</style><script>
(()=>{
  function trigger12(id){const el=document.getElementById(id);if(el){el.click();return true}return false}
  function pagePanel12(){
    const editor=document.querySelector('#modalBody .hc11-editor');
    if(!editor||!document.getElementById('p11Save')||document.getElementById('hc12PageUploads'))return;
    const panels=[...editor.querySelectorAll(':scope > .panel')];
    const details=panels[0];
    if(!details)return;
    const hasHero=!!document.getElementById('p11media');
    const panel=document.createElement('section');
    panel.id='hc12PageUploads';panel.className='hc12-upload-panel';
    panel.innerHTML='<div class="hc12-upload-head"><div><h3>Media uploads</h3><p>Upload photos or videos directly to this page. If there is no content section yet, Heart Connect will create a media section automatically.</p></div><span class="hc12-upload-badge">Always available</span></div><div class="hc12-upload-grid">'
      +(hasHero?'<button class="hc12-upload-action primary" type="button" data-hc12="hero-image"><b>Upload hero image</b><small>Use a photo as the main hero media.</small></button><button class="hc12-upload-action primary" type="button" data-hc12="hero-video"><b>Upload hero video</b><small>Use MP4 or WebM as hero media.</small></button>':'')
      +'<button class="hc12-upload-action" type="button" data-hc12="page-image"><b>Upload page image</b><small>Add an image into a page content section.</small></button><button class="hc12-upload-action" type="button" data-hc12="page-video"><b>Upload page video</b><small>Add a video into a page content section.</small></button><button class="hc12-upload-action" type="button" data-hc12="library"><b>Open media library</b><small>Reuse an image or video already uploaded.</small></button></div><div class="hc12-upload-state" id="hc12PageUploadState"></div><div class="hc12-upload-note">Images: JPEG, PNG, WebP or GIF. Videos: MP4 or WebM. Uploaded media is stored through the existing secured CMS media service.</div>';
    details.insertAdjacentElement('afterend',panel);
    panel.querySelector('[data-hc12="page-image"]').onclick=()=>{document.getElementById('hc12PageUploadState').textContent='Opening image picker…';trigger12('p11UploadSectionImage')};
    panel.querySelector('[data-hc12="page-video"]').onclick=()=>{document.getElementById('hc12PageUploadState').textContent='Opening video picker…';trigger12('p11UploadSectionVideo')};
    panel.querySelector('[data-hc12="library"]').onclick=()=>trigger12('p11LibraryBtn');
    const hi=panel.querySelector('[data-hc12="hero-image"]');if(hi)hi.onclick=()=>trigger12('p11UploadImage');
    const hv=panel.querySelector('[data-hc12="hero-video"]');if(hv)hv.onclick=()=>trigger12('p11UploadVideo');
  }
  function cmsPanel12(){
    const editor=document.querySelector('#modalBody .hc11-editor');
    if(!editor||!document.getElementById('c11Save')||document.getElementById('hc12CmsUploads'))return;
    const panels=[...editor.querySelectorAll(':scope > .panel')];
    const details=panels[0];if(!details)return;
    const panel=document.createElement('section');panel.id='hc12CmsUploads';panel.className='hc12-upload-panel';
    panel.innerHTML='<div class="hc12-upload-head"><div><h3>Post media uploads</h3><p>Upload photos and videos without leaving the post editor. Media is inserted into the HTML body at your current editing position.</p></div><span class="hc12-upload-badge">CMS media</span></div><div class="hc12-upload-grid"><button class="hc12-upload-action primary" type="button" data-hc12="cms-image"><b>Upload image</b><small>JPEG, PNG, WebP or GIF.</small></button><button class="hc12-upload-action primary" type="button" data-hc12="cms-video"><b>Upload video</b><small>MP4 or WebM.</small></button><button class="hc12-upload-action" type="button" data-hc12="cms-library"><b>Open media library</b><small>Insert existing media into this post.</small></button></div><div class="hc12-upload-state" id="hc12CmsUploadState"></div>';
    details.insertAdjacentElement('afterend',panel);
    panel.querySelector('[data-hc12="cms-image"]').onclick=()=>{document.getElementById('hc12CmsUploadState').textContent='Opening image picker…';trigger12('c11UploadImage')};
    panel.querySelector('[data-hc12="cms-video"]').onclick=()=>{document.getElementById('hc12CmsUploadState').textContent='Opening video picker…';trigger12('c11UploadVideo')};
    panel.querySelector('[data-hc12="cms-library"]').onclick=()=>trigger12('c11Library');
  }
  let pending=false;function enhance12(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;pagePanel12();cmsPanel12()})}
  const target=document.getElementById('modalBody')||document.body;new MutationObserver(enhance12).observe(target,{childList:true,subtree:true});enhance12();
})();
</script>`;
  return adminHtmlV11(version).replace('</body>',upgrade+'</body>');
}
