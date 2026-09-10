import {handleAdmin as handleAdminV42,runPhase7AndEarlierScheduled} from './admin-api-v42.js';
import {adminHtml} from './admin-ui-v43.js';

export {runPhase7AndEarlierScheduled};
export const VERSION='hc-admin-control-plane-v43';
const ROUTER_VERSION='cloudflare-admin-router-v43-current-command-center';

function j(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff','x-heart-connect-admin':VERSION}})}
function page(html,head=false){const headers={'content-type':'text/html; charset=utf-8','cache-control':'no-store, max-age=0','pragma':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY','permissions-policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()','cross-origin-opener-policy':'same-origin','cross-origin-resource-policy':'same-origin','strict-transport-security':'max-age=31536000; includeSubDomains','content-security-policy':"default-src 'self'; style-src 'self' 'unsafe-inline' https://api.mapbox.com; script-src 'self' 'unsafe-inline' https://api.mapbox.com; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; worker-src blob:; child-src blob:; frame-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",'x-heart-connect-admin':VERSION};return new Response(head?null:html,{status:200,headers})}
async function delegatedJson(request,env,path,required=false){
  try{
    const u=new URL(path,request.url),r=await handleAdminV42(new Request(u,{method:'GET',headers:request.headers}),env);
    let d={};try{d=await r.clone().json()}catch{}
    if(!r.ok){if(required)return{errorResponse:r,data:d,ok:false};return{ok:false,status:r.status,data:d}}
    return{ok:true,status:r.status,data:d}
  }catch(e){return{ok:false,status:503,data:{error:String(e?.message||e)}}}
}
async function gh(path){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),6000);
  try{
    const r=await fetch('https://api.github.com'+path,{headers:{accept:'application/vnd.github+json','user-agent':'Heart-Connect-Admin-Command-Center-v43','x-github-api-version':'2022-11-28'},signal:c.signal});
    if(!r.ok)return{ok:false,status:r.status,data:null};
    return{ok:true,status:r.status,data:await r.json()}
  }catch{return{ok:false,status:503,data:null}}finally{clearTimeout(t)}
}
async function githubEvidence(){
  const runsR=await gh('/repos/heartconnect-1/heart-connect/actions/runs?branch=main&event=push&per_page=10');
  if(!runsR.ok)return{available:false,reason:'GitHub public workflow evidence is temporarily unavailable.',runs:[]};
  const runs=(runsR.data?.workflow_runs||[]).map(x=>({id:x.id,name:x.name,status:x.status,conclusion:x.conclusion,headSha:x.head_sha,createdAt:x.created_at,updatedAt:x.updated_at,htmlUrl:x.html_url,event:x.event,branch:x.head_branch}));
  const latest=runs[0]||null,successful=runs.filter(x=>x.status==='completed'&&x.conclusion==='success'),latestSuccessful=successful[0]||null,rollback=successful[1]||null;
  let smoke=null;
  if(latestSuccessful){
    const jobsR=await gh('/repos/heartconnect-1/heart-connect/actions/runs/'+latestSuccessful.id+'/jobs?per_page=100');
    if(jobsR.ok){
      const jobs=jobsR.data?.jobs||[];
      for(const job of jobs){
        const step=(job.steps||[]).find(s=>/smoke test production admin/i.test(String(s.name||'')));
        if(step){smoke={status:step.status,conclusion:step.conclusion,jobName:job.name,runId:latestSuccessful.id};break}
      }
    }
  }
  return{available:true,repository:'heartconnect-1/heart-connect',latestRun:latest,latestSuccessful,rollbackReference:rollback,smokeTest:smoke,runs};
}
function freshness(item,deployAt){
  if(item?.automatic)return{state:'current',reason:'Automatic check reflects current runtime state.',ageHours:null};
  const stamp=item?.checked_at||item?.updated_at||null;if(!stamp)return{state:'pending',reason:'No dated evidence has been recorded.',ageHours:null};
  const age=Math.max(0,(Date.now()-Date.parse(stamp))/3600000),deploy=deployAt?Date.parse(deployAt):NaN,checked=Date.parse(stamp);
  if(Number.isFinite(deploy)&&Number.isFinite(checked)&&checked>=deploy)return{state:'current',reason:'Evidence was recorded after the latest successful production deployment.',ageHours:age};
  if(age>168)return{state:'stale',reason:'Evidence is more than 7 days old and predates current production.',ageHours:age};
  return{state:'historical',reason:'Evidence remains useful as launch history but predates the latest successful production deployment.',ageHours:age};
}
function readinessScore({phase6,automation,runtime,github}){
  let earned=0,total=0;
  const add=(weight,known,pass,partial=0)=>{if(!known)return;total+=weight;earned+=weight*(pass?1:partial)};
  add(30,true,phase6?.health?.overallStatus==='healthy',phase6?.health?.overallStatus==='degraded'?0.6:0);
  const r=phase6?.readiness||{},ratio=(r.requiredTotal||0)?Number(r.requiredPassed||0)/Number(r.requiredTotal||1):0;
  add(25,Number(r.requiredTotal||0)>0,ratio===1,ratio);
  const as=Number(automation?.score);add(20,Number.isFinite(as),as>=100,Number.isFinite(as)?Math.max(0,Math.min(1,as/100)):0);
  add(10,github?.available&&!!github.latestRun,true===!!(github?.latestRun?.status==='completed'&&github?.latestRun?.conclusion==='success'));
  add(5,github?.available&&!!github.latestSuccessful,github?.smokeTest?.conclusion==='success');
  add(5,!!runtime,runtime?.serviceRoleConfigured===true);
  add(5,!!runtime,runtime?.ownerAllowlistConfigured===true);
  return total?Math.round(earned/total*100):0;
}
function incidentSla(rows){
  const targets={critical:15,high:60,medium:240,low:1440};
  return (rows||[]).map(x=>{
    const at=x.detected_at||x.last_seen_at||x.updated_at,ageMinutes=at?Math.max(0,(Date.now()-Date.parse(at))/60000):null,target=targets[String(x.severity||'').toLowerCase()]||240;
    return{...x,ageMinutes,responseTargetMinutes:target,attention:ageMinutes!==null&&ageMinutes>target&&x.status!=='resolved'}
  })
}
async function liveStatus(request,env){
  const [p6,inc,hist,runtime,auto,ai,github]=await Promise.all([
    delegatedJson(request,env,'/api/admin/phase6/status',true),
    delegatedJson(request,env,'/api/admin/incidents'),
    delegatedJson(request,env,'/api/admin/health/history'),
    delegatedJson(request,env,'/api/admin/runtime'),
    delegatedJson(request,env,'/api/admin/automation/enterprise-status'),
    delegatedJson(request,env,'/api/admin/ai/copilot/status?range=24h'),
    githubEvidence()
  ]);
  if(p6.errorResponse)return p6.errorResponse;
  const phase6=p6.data||{},readiness=phase6.readiness||{},deployAt=github?.latestSuccessful?.createdAt||null;
  const readinessItems=(readiness.items||[]).map(x=>({...x,freshness:freshness(x,deployAt)}));
  const freshnessCounts=readinessItems.reduce((a,x)=>{const k=x.freshness?.state||'pending';a[k]=(a[k]||0)+1;return a},{current:0,historical:0,stale:0,pending:0});
  const incidents=incidentSla(inc.ok?(inc.data?.items||[]):[]);
  const score=readinessScore({phase6,automation:auto.ok?auto.data:null,runtime:runtime.ok?runtime.data:null,github});
  const currentHealth={
    overall:phase6?.health?.overallStatus||'unknown',
    checks:phase6?.health?.checks||[],
    metrics:phase6?.health?.metrics||{},
    automation:auto.ok?auto.data:null,
    ai:ai.ok?ai.data:null,
    runtime:runtime.ok?runtime.data:null,
    incidentsOpen:incidents.filter(x=>x.status!=='resolved').length,
    incidentsAttention:incidents.filter(x=>x.attention).length
  };
  return j({version:VERSION,routerVersion:ROUTER_VERSION,generatedAt:new Date().toISOString(),productionReadinessScore:score,currentHealth,readiness:{...readiness,items:readinessItems,freshnessCounts},incidents,healthHistory:hist.ok?(hist.data?.items||[]):[],github,release:{adminVersion:VERSION,routerVersion:ROUTER_VERSION,latestSuccessfulCommit:github?.latestSuccessful?.headSha||null,latestSuccessfulRunId:github?.latestSuccessful?.id||null,rollbackCommit:github?.rollbackReference?.headSha||null}});
}
export async function handleAdmin(request,env){
  const u=new URL(request.url),p=u.pathname;
  if((p==='/admin'||p==='/admin/')&&(request.method==='GET'||request.method==='HEAD'))return page(adminHtml(VERSION),request.method==='HEAD');
  if(p==='/api/admin/command-center/live-status'&&request.method==='GET')return liveStatus(request,env);
  return handleAdminV42(request,env);
}
