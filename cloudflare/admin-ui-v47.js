import {adminHtml as adminHtmlV46} from './admin-ui-v46.js';

export function adminHtml(version){
  const patch=`<style>
.hc47-badge{display:inline-flex;align-items:center;border:1px solid #ffffff14;background:#0a111a;border-radius:999px;padding:6px 9px;font-size:10px;color:#aab5c5}
.hc47-photo-upload{display:flex;gap:12px;align-items:center;padding:12px;border:1px dashed #ffffff20;background:#080d15;border-radius:13px;margin:10px 0}
.hc47-photo-upload input{color:#cbd3df;font-size:12px}
.hc47-permission-note{margin-top:8px;color:#8f9cad;font-size:10px;line-height:1.5}
</style><script>
(async()=>{
  try{
    if(location.pathname.startsWith('/admin')&&'serviceWorker' in navigator&&sessionStorage.getItem('hc-admin-sw-clean-v47')!=='1'){
      sessionStorage.setItem('hc-admin-sw-clean-v47','1');
      const regs=await navigator.serviceWorker.getRegistrations();
      if(regs.length)await Promise.all(regs.map(r=>r.unregister().catch(()=>false)));
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>k.startsWith('heart-connect-shell-')).map(k=>caches.delete(k)));
      }
      if(navigator.serviceWorker.controller)location.reload();
    }
  }catch{}
})();

(()=>{
  const esc47=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const human47=v=>String(v||'').split('_').map(x=>x?x[0].toUpperCase()+x.slice(1):'').join(' ');
  const fmt47=v=>{if(!v)return'Not recorded';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString()};
  const rel47=v=>{if(!v)return'No activity';const ms=Date.now()-Date.parse(v);if(!Number.isFinite(ms))return'Unknown';const m=Math.max(0,Math.round(ms/60000));if(m<60)return m+' min ago';const h=Math.round(m/60);if(h<48)return h+' h ago';return Math.round(h/24)+' d ago'};
  const initials47=x=>String(x?.display_name||x?.email||'?').trim().split(/\s+/).slice(0,2).map(y=>y[0]||'').join('').toUpperCase()||'?';
  const pill47=(t,c='')=>'<span class="hc45-pill '+c+'">'+esc47(t)+'</span>';
  const kpi47=(l,v,n)=>'<div class="hc45-kpi"><small>'+esc47(l)+'</small><strong>'+esc47(v)+'</strong><span>'+esc47(n||'')+'</span></div>';
  const avatar47=x=>'<div class="hc45-avatar">'+(x?.photoUrl?'<img src="'+esc47(x.photoUrl)+'" alt="'+esc47((x.display_name||'Staff')+' photo')+'" loading="lazy">':esc47(initials47(x)))+'</div>';
  const st47=v=>v==='active'?'good':v==='suspended'?'bad':'warn';

  let state47=null,filters47={q:'',role:'all',status:'all'};

  async function get47(url){
    const r=await fetch(url,{credentials:'same-origin',headers:{accept:'application/json'}});
    let d={};try{d=await r.json()}catch{}
    if(!r.ok)throw new Error(d.error||'Request failed.');
    return d;
  }
  async function post47(url,b){
    const r=await fetch(url,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify(b)});
    let d={};try{d=await r.json()}catch{}
    if(!r.ok)throw new Error(d.error||'Request failed.');
    return d;
  }
  async function del47(url){
    const r=await fetch(url,{method:'DELETE',credentials:'same-origin',headers:{accept:'application/json'}});
    let d={};try{d=await r.json()}catch{}
    if(!r.ok)throw new Error(d.error||'Request failed.');
    return d;
  }
  function rows47(){
    return (state47?.items||[]).filter(x=>{
      const term=filters47.q.toLowerCase();
      const hay=[x.display_name,x.email,x.role,x.profile?.country,x.profile?.city].join(' ').toLowerCase();
      return(!term||hay.includes(term))&&(filters47.role==='all'||x.role===filters47.role)&&(filters47.status==='all'||x.status===filters47.status);
    });
  }
  function roleOptions47(selected){
    return (state47?.roles||[]).map(r=>'<option value="'+esc47(r)+'" '+(r===selected?'selected':'')+'>'+esc47(human47(r))+'</option>').join('');
  }
  function cards47(){
    const rows=rows47();
    if(!rows.length)return '<div class="hc45-empty" style="grid-column:1/-1">No staff match the current filters.</div>';
    return rows.map(x=>'<article class="hc45-card"><div class="hc45-card-top">'+avatar47(x)+'<div style="min-width:0"><div class="hc45-pills" style="margin:0 0 6px">'+pill47(human47(x.role),['super_admin','admin'].includes(x.role)?'purple':'')+pill47(x.status,st47(x.status))+'</div><h4>'+esc47(x.display_name||'Unnamed staff')+'</h4><div class="mail">'+esc47(x.email||'')+'</div></div></div><div class="hc45-meta"><div><span>Last active</span><b>'+esc47(rel47(x.profile?.lastActiveAt))+'</b></div><div><span>Verification</span><b>'+esc47(human47(x.profile?.verificationLevel||'unverified'))+'</b></div><div><span>Location</span><b>'+esc47([x.profile?.city,x.profile?.country].filter(Boolean).join(', ')||'Not set')+'</b></div><div><span>Photo</span><b>'+esc47(x.hasCustomStaffPhoto?'Staff photo':x.photoUrl?'Profile photo':'Initials')+'</b></div></div><div class="hc45-actions"><button class="hc45-btn primary" data-hc47-manage="'+esc47(x.user_id)+'">Manage</button>'+(state47?.canManage?'<button class="hc45-btn" data-hc47-upload="'+esc47(x.user_id)+'">'+(x.hasCustomStaffPhoto?'Replace photo':'Upload photo')+'</button>':'')+(x.photoUrl?'<button class="hc45-btn" data-hc47-view="'+esc47(x.user_id)+'">View photo</button>':'')+'</div></article>').join('');
  }
  function roles47(){
    const info=state47?.roleInfo||{},matrix=state47?.roleMatrix||{};
    return Object.entries(info).map(([key,v])=>'<div class="hc45-role"><div class="hc45-rowtop"><div><b>'+esc47(v.label||human47(key))+'</b><p>'+esc47(v.summary||'')+'</p></div>'+pill47((matrix[key]||[]).includes('all')?'full access':(matrix[key]||[]).length+' grants',(matrix[key]||[]).includes('all')?'purple':'')+'</div><div class="hc45-perms">'+(matrix[key]||[]).map(p=>'<span class="hc45-perm">'+esc47(human47(p))+'</span>').join('')+'</div></div>').join('');
  }
  function audit47(){
    const rows=state47?.recentStaffActivity||[];
    if(!rows.length)return '<div class="hc45-empty">No staff-access changes recorded yet.</div>';
    return '<div class="hc45-list">'+rows.slice(0,20).map(x=>'<div class="hc45-audit"><div class="hc45-rowtop"><div><b>'+esc47(human47(String(x.action||'staff update').replace(/^admin\./,'')))+'</b><small>'+esc47(x.actor_email||'Admin')+' · '+esc47(human47(x.actor_role||''))+' · '+esc47(fmt47(x.created_at))+'</small></div>'+pill47('audited','good')+'</div></div>').join('')+'</div>';
  }
  function wire47(){
    document.getElementById('hc47refresh')?.addEventListener('click',()=>loadStaff47());
    document.getElementById('hc47add')?.addEventListener('click',()=>editor47(null));
    document.getElementById('hc47q')?.addEventListener('input',e=>{filters47.q=e.target.value;render47()});
    document.getElementById('hc47role')?.addEventListener('change',e=>{filters47.role=e.target.value;render47()});
    document.getElementById('hc47status')?.addEventListener('change',e=>{filters47.status=e.target.value;render47()});
    document.getElementById('hc47clear')?.addEventListener('click',()=>{filters47={q:'',role:'all',status:'all'};render47()});
    document.querySelectorAll('[data-hc47-manage]').forEach(b=>b.onclick=()=>editor47((state47.items||[]).find(x=>String(x.user_id)===String(b.dataset.hc47Manage))));
    document.querySelectorAll('[data-hc47-upload]').forEach(b=>b.onclick=()=>pick47(b.dataset.hc47Upload));
    document.querySelectorAll('[data-hc47-view]').forEach(b=>b.onclick=()=>view47(b.dataset.hc47View));
  }
  function render47(){
    if(!state47)return;
    const s=state47.summary||{},roles=state47.roles||[];
    view.innerHTML='<div class="hc45 hc47"><section class="hc45-hero"><div class="hc45-top"><div><div class="hc45-kicker">Least-privilege access control</div><h2>Staff & Roles Control Center</h2><p>Manage staff accounts, upload private staff directory photos, review activity and role permissions, and keep all access changes auditable.</p><div class="hc45-pills">'+pill47('Staff v47','purple')+pill47(state47.canManage?'Owner controls available':'Read-only access',state47.canManage?'good':'warn')+pill47('Direct photo upload','good')+pill47('Role changes audited','good')+'</div></div><div class="hc45-actions"><button class="hc45-btn" id="hc47refresh">Refresh staff</button><button class="hc45-btn primary" id="hc47add" '+(!state47.canManage?'disabled':'')+'>+ Add Staff Member</button></div></div></section><div class="hc45-kpis">'+
      kpi47('Total staff',s.total||0,'Delegated admin registry')+
      kpi47('Active',s.active||0,'Can use assigned role')+
      kpi47('High privilege',s.highPrivilege||0,'Super Admin + Admin')+
      kpi47('Suspended',s.suspended||0,'Access disabled')+
      kpi47('With photo',s.withPhoto||0,(s.customStaffPhotos||0)+' direct upload(s)')+
      kpi47('Active in 7d',s.recentlyActive||0,'Member-account activity')+
    '</div><section class="hc45-panel"><div class="hc45-head"><div><h3>Staff directory</h3><p>Owner/super-admin can upload a private staff photo directly. If none exists, an approved profile photo or initials are used.</p></div>'+pill47(rows47().length+' shown')+'</div><div class="hc45-filterbar"><input id="hc47q" placeholder="Search name, email, role or location" value="'+esc47(filters47.q)+'"><select id="hc47role"><option value="all">All roles</option>'+roles.map(r=>'<option value="'+esc47(r)+'" '+(filters47.role===r?'selected':'')+'>'+esc47(human47(r))+'</option>').join('')+'</select><select id="hc47status"><option value="all">All statuses</option><option value="active" '+(filters47.status==='active'?'selected':'')+'>Active</option><option value="inactive" '+(filters47.status==='inactive'?'selected':'')+'>Inactive</option><option value="suspended" '+(filters47.status==='suspended'?'selected':'')+'>Suspended</option></select><button class="hc45-btn" id="hc47clear">Clear filters</button></div><div class="hc45-staff-grid">'+cards47()+'</div><div class="hc45-note" style="margin-top:12px">'+esc47(state47.photoPolicy||'')+'</div></section><div class="hc45-grid2"><section class="hc45-panel"><div class="hc45-head"><div><h3>Role capability matrix</h3><p>Choose the least powerful role that still allows each person to do their job.</p></div>'+pill47('least privilege','good')+'</div><div class="hc45-role-grid">'+roles47()+'</div></section><section class="hc45-panel"><div class="hc45-head"><div><h3>Recent staff access activity</h3><p>Role, status and staff-photo changes are recorded in the Admin audit trail.</p></div>'+pill47((state47.recentStaffActivity||[]).length+' events')+'</div>'+audit47()+'</section></div></div>';
    wire47();
  }
  async function loadStaff47(){
    view.innerHTML='<div class="hc45-empty">Loading Staff & Roles Control Center…</div>';
    try{state47=await get47('/api/admin/staff/intelligence');render47()}catch(e){view.innerHTML='<div class="hc45-empty"><b>Staff & Roles unavailable</b><br>'+esc47(e.message)+'</div>'}
  }
  function modal47(title,html){
    modalTitle.textContent=title;
    modalBody.innerHTML=html;
    modal.showModal();
  }
  async function fileData47(file){
    if(!file)return null;
    if(file.size>5000000)throw new Error('Use a JPG, PNG or WebP image up to 5 MB.');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use a JPG, PNG or WebP image.');
    return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({contentType:file.type,data:String(r.result||'')});r.onerror=()=>reject(new Error('The selected photo could not be read.'));r.readAsDataURL(file)});
  }
  async function upload47(userId,file){
    if(!file)return;
    const payload=await fileData47(file);
    await post47('/api/admin/staff/'+encodeURIComponent(userId)+'/photo',payload);
  }
  function editor47(x){
    const editing=!!x;
    modal47(editing?'Manage staff member':'Add staff member','<div class="hc45-profile">'+(editing?avatar47(x):'<div class="hc45-avatar">+</div>')+'<div><h3 style="margin:0">'+esc47(editing?(x.display_name||x.email):'New staff member')+'</h3><p>'+(editing?esc47(x.email||''):'Assign an existing Heart Connect account')+'</p></div></div><div class="hc45-form"><label class="hc45-field wide"><span>Heart Connect account email</span><input id="hc47email" type="email" '+(editing?'readonly':'')+' value="'+esc47(x?.email||'')+'" placeholder="person@example.com"></label><label class="hc45-field"><span>Display name</span><input id="hc47name" value="'+esc47(x?.display_name||'')+'" placeholder="Optional"></label><label class="hc45-field"><span>Role</span><select id="hc47mrole">'+roleOptions47(x?.role||'support_agent')+'</select></label><label class="hc45-field"><span>Status</span><select id="hc47mstatus"><option value="active" '+((x?.status||'active')==='active'?'selected':'')+'>Active</option><option value="inactive" '+(x?.status==='inactive'?'selected':'')+'>Inactive</option><option value="suspended" '+(x?.status==='suspended'?'selected':'')+'>Suspended</option></select></label></div><div class="hc47-photo-upload"><div><b>Staff photo</b><div class="hc47-permission-note">Optional private directory photo · JPG, PNG or WebP · max 5 MB</div></div><input id="hc47file" type="file" accept="image/jpeg,image/png,image/webp"></div><div class="hc45-safety">The email must belong to an existing Heart Connect account. This screen never asks for a password. Use the least-privilege role appropriate for the person.</div><div class="hc45-actions" style="margin-top:14px"><button class="hc45-btn primary" id="hc47save">'+(editing?'Save changes':'Add staff member')+'</button>'+(editing&&x.hasCustomStaffPhoto?'<button class="hc45-btn warn" id="hc47remove">Remove custom photo</button>':'')+'<button class="hc45-btn" id="hc47cancel">Cancel</button></div>');
    document.getElementById('hc47cancel').onclick=()=>modal.close();
    if(document.getElementById('hc47remove'))document.getElementById('hc47remove').onclick=async()=>{if((prompt('Type REMOVE PHOTO to confirm:')||'').trim()!=='REMOVE PHOTO')return;try{await del47('/api/admin/staff/'+encodeURIComponent(x.user_id)+'/photo');modal.close();await loadStaff47();say('Staff photo removed.')}catch(e){say(e.message)}};
    document.getElementById('hc47save').onclick=async()=>{
      const btn=document.getElementById('hc47save');btn.disabled=true;btn.textContent='Saving…';
      try{
        const result=await post47('/api/admin/staff',{email:document.getElementById('hc47email').value.trim(),displayName:document.getElementById('hc47name').value.trim(),role:document.getElementById('hc47mrole').value,status:document.getElementById('hc47mstatus').value});
        const userId=result.item?.user_id||x?.user_id;
        const file=document.getElementById('hc47file').files?.[0];
        if(file&&userId)await upload47(userId,file);
        modal.close();await loadStaff47();say(editing?'Staff access updated.':'Staff member added.');
      }catch(e){say(e.message);btn.disabled=false;btn.textContent=editing?'Save changes':'Add staff member'}
    };
  }
  function pick47(id){
    const x=(state47?.items||[]).find(y=>String(y.user_id)===String(id));if(!x)return;
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';input.style.display='none';document.body.appendChild(input);
    input.onchange=async()=>{const f=input.files?.[0];input.remove();if(!f)return;try{await upload47(id,f);await loadStaff47();say('Staff photo updated.')}catch(e){say(e.message)}};
    input.click();
  }
  function view47(id){
    const x=(state47?.items||[]).find(y=>String(y.user_id)===String(id));if(!x?.photoUrl)return;
    modal47((x.display_name||'Staff')+' photo','<div style="display:grid;place-items:center"><img src="'+esc47(x.photoUrl)+'" alt="'+esc47((x.display_name||'Staff')+' photo')+'" style="max-width:100%;max-height:70vh;border-radius:18px;border:1px solid #ffffff18"></div><div class="hc45-note" style="margin-top:12px">Private staff-directory photos are served using expiring signed URLs.</div>');
  }

  try{
    if(typeof renderStaff==='function'){
      renderStaff=function(){loadStaff47()};
    }
    if(typeof staffEditor==='function'){
      staffEditor=function(x){if(!state47){loadStaff47().then(()=>editor47(x));return}editor47(x)};
    }
  }catch{}
})();
</script>`;
  return adminHtmlV46(version).replace('</body>',patch+'</body>');
}
