import { db,ws,json,error,requireAuth } from '@appdeploy/sdk';
const TABLE='entity_subscriptions';
type S={id:string;owner?:string;entity_type:string;entity_id:string;connection_id:string;created_at:number};
type Call={owners:string[]};
type PairState={likes:string[];blocked:boolean};
async function own(uid:string){return (await db.list<{pid:string}>('owner:'+uid,{limit:1})).items[0]}
async function all(){return (await db.list<S>(TABLE,{limit:1000})).items}
async function allowed(uid:string,type:string,id:string){
  const ref=await own(uid);if(!ref)return false;
  if(type==='user')return id===ref.pid;
  if(type==='conversation'){
    const parts=id.split(':');
    if(parts.length!==2||!parts.includes(ref.pid))return false;
    const state=(await db.list<PairState>('pair:'+id,{limit:1})).items[0];
    return !!state&&!state.blocked&&state.likes.includes(parts[0])&&state.likes.includes(parts[1]);
  }
  if(type==='call'){
    const [c]=await db.get<Call>('calls',[id]);
    return !!c&&c.owners.includes(uid);
  }
  return false;
}
export async function removeSubscriptionsByConnection(connectionId:string){
  const ids=(await all()).filter(x=>x.connection_id===connectionId).map(x=>x.id);
  if(ids.length)await db.delete(TABLE,ids);
}
export async function notifySubscribers(entityType:string,entityId:string,payload:unknown,excludeConnectionId?:string){
  const ids=(await all())
    .filter(x=>!!x.owner&&x.entity_type===entityType&&x.entity_id===entityId)
    .map(x=>x.connection_id)
    .filter(x=>x!==excludeConnectionId);
  const unique=[...new Set(ids)];
  if(unique.length)await ws.send(unique,{v:1,type:'entity.update',payload:{entity_type:entityType,entity_id:entityId,data:payload}});
}
export const realtimeSubscriptionRoutes={
  'POST /api/subscriptions':[requireAuth(),async c=>{
    const b=c.body as {entity_type?:string;entity_id?:string;connection_id?:string};
    if(!b.entity_type||!b.entity_id||!b.connection_id)return error('Subscription fields are required.',400);
    if(!(await allowed(c.user!.userId,b.entity_type,b.entity_id)))return error('Subscription unavailable.',403);
    const existing=(await all()).some(x=>x.owner===c.user!.userId&&x.entity_type===b.entity_type&&x.entity_id===b.entity_id&&x.connection_id===b.connection_id);
    if(!existing)await db.add(TABLE,[{owner:c.user!.userId,entity_type:b.entity_type,entity_id:b.entity_id,connection_id:b.connection_id,created_at:Date.now()}]);
    return json({ok:true});
  }],
  'POST /api/subscriptions/remove':[requireAuth(),async c=>{
    const b=c.body as {entity_type?:string;entity_id?:string;connection_id?:string};
    if(!b.entity_type||!b.entity_id||!b.connection_id)return error('Subscription fields are required.',400);
    if(!(await allowed(c.user!.userId,b.entity_type,b.entity_id)))return error('Subscription unavailable.',403);
    const ids=(await all()).filter(x=>x.owner===c.user!.userId&&x.entity_type===b.entity_type&&x.entity_id===b.entity_id&&x.connection_id===b.connection_id).map(x=>x.id);
    if(ids.length)await db.delete(TABLE,ids);
    return json({ok:true});
  }]
};
