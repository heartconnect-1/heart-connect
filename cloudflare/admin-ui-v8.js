import {adminHtml as adminHtmlV7} from './admin-ui-v7.js';

export function adminHtml(version){
  const extra=`<script>
(()=>{
  function esc8(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function roleLabel8(v){return String(v||'').split('_').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')}
  async function staffEditor8(x){
    x=x||{};
    let d={roles:[]};try{d=await req('/api/admin/staff')}catch(e){say(e.message);return}
    const roles=d.roles||[];
    open(x.user_id?'Manage staff member':'Add staff member','<div class="form-grid"><label class="field wide"><span>Heart Connect account email</span><input id="s8email" type="email" autocomplete="off" placeholder="person@example.com" value="'+esc8(x.email||'')+'"></label><label class="field"><span>Display name</span><input id="s8name" placeholder="Optional" value="'+esc8(x.display_name||'')+'"></label><label class="field"><span>Role</span><select id="s8role">'+roles.map(v=>'<option value="'+esc8(v)+'" '+(x.role===v?'selected':'')+'>'+esc8(roleLabel8(v))+'</option>').join('')+'</select></label><label class="field"><span>Status</span><select id="s8status">'+['active','inactive','suspended'].map(v=>'<option value="'+v+'" '+((x.status||'active')===v?'selected':'')+'>'+roleLabel8(v)+'</option>').join('')+'</select></label></div><button class="btn primary" id="s8save">'+(x.user_id?'Save changes':'Add staff member')+'</button><p class="note">Enter only the email used for the person’s existing Heart Connect account. The server securely resolves the account ID; you no longer need to copy a UUID. This does not create a dating account or ask for the person’s password.</p>');
    document.getElementById('s8save').onclick=async()=>{
      const email=(document.getElementById('s8email').value||'').trim();
      if(!email){say('Enter the staff member’s Heart Connect email address.');return}
      const btn=document.getElementById('s8save');btn.disabled=true;btn.textContent='Saving…';
      try{
        await post('/api/admin/staff',{email,displayName:document.getElementById('s8name').value,role:document.getElementById('s8role').value,status:document.getElementById('s8status').value});
        modal.close();say(x.user_id?'Staff role updated.':'Staff member added.');load('staff');
      }catch(e){say(e.message);btn.disabled=false;btn.textContent=x.user_id?'Save changes':'Add staff member'}
    };
  }
  function enhanceStaff8(){
    const add=document.getElementById('newStaff');
    if(add&&!add.dataset.v8){add.dataset.v8='1';add.textContent='+ Add Staff Member';add.onclick=()=>staffEditor8(null)}
    document.querySelectorAll('[data-staff]').forEach(b=>{if(b.dataset.v8)return;b.dataset.v8='1';try{const x=JSON.parse(decodeURIComponent(b.dataset.staff));b.onclick=()=>staffEditor8(x)}catch{}})
  }
  const view8=document.getElementById('view');
  if(view8){const obs8=new MutationObserver(()=>enhanceStaff8());obs8.observe(view8,{childList:true,subtree:true});}
  setTimeout(enhanceStaff8,0);
})();
</script>`;
  return adminHtmlV7(version).replaceAll('PHASE 7','PHASE 8').replace('</body>',extra+'</body>');
}
