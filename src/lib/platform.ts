import { supabase } from './supabase';

type ApiResponse<T=any>={data:T};
type ApiClient={
  get<T=any>(path:string):Promise<ApiResponse<T>>;
  post<T=any>(path:string,body?:unknown):Promise<ApiResponse<T>>;
  put<T=any>(path:string,body?:unknown):Promise<ApiResponse<T>>;
  delete<T=any>(path:string):Promise<ApiResponse<T>>;
};

type RealtimeMessageHandler=(message:any)=>void;
type RealtimeConnection={
  connectionId:string;
  ready:Promise<void>;
  onMessage(cb:RealtimeMessageHandler):void;
  onError(cb:(error:any)=>void):void;
  onClose(cb:()=>void):void;
  disconnect():void;
  subscribe(type:string,id:string):Promise<void>;
  unsubscribe(type:string,id:string):Promise<void>;
};

let activeConnection:RealtimeConnection|null=null;
let refreshPromise:Promise<any>|null=null;
let cachedSession:any=null;
let authInitialized=false;

supabase.auth.onAuthStateChange((_event,session)=>{
  cachedSession=session;
  authInitialized=true;
});

async function currentSession(){
  const now=Math.floor(Date.now()/1000);
  if(authInitialized&&cachedSession?.access_token&&Number(cachedSession.expires_at||0)>now+60)return cachedSession;
  const result=await Promise.race([
    supabase.auth.getSession(),
    new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('Authentication session check timed out.')),10000))
  ]);
  if(result.error)throw result.error;
  cachedSession=result.data.session;
  authInitialized=true;
  return result.data.session;
}

async function refreshSessionOnce(){
  if(refreshPromise)return refreshPromise;
  refreshPromise=supabase.auth.refreshSession().then(result=>{
    if(result.data.session){cachedSession=result.data.session;authInitialized=true}
    return result;
  }).finally(()=>{refreshPromise=null});
  return refreshPromise;
}

async function request<T>(path:string,init:RequestInit={},retried=false):Promise<ApiResponse<T>>{
  const session=await currentSession();
  const headers=new Headers(init.headers||{});
  headers.set('accept','application/json');
  headers.set('content-type','application/json');
  if(session?.access_token)headers.set('authorization','Bearer '+session.access_token);
  const response=await fetch(path,{...init,credentials:'include',headers});
  const text=await response.text();
  let data:any=null;
  try{data=text?JSON.parse(text):null}catch{data=text}
  if(response.status===401&&!retried){
    const refreshed=await refreshSessionOnce();
    if(refreshed.data.session?.access_token)return request(path,init,true);
  }
  if(!response.ok){
    const error=Object.assign(new Error(String(data?.error||data?.message||'Request failed.')),{status:response.status,data});
    throw error;
  }
  return {data:data as T};
}

async function localSubscription(path:string,body:any){
  if(!activeConnection)throw new Error('Live connection is not ready.');
  const [action,type,id]=path==='/api/subscriptions'?['add',String(body?.entity_type||''),String(body?.entity_id||'')]:['remove',String(body?.entity_type||''),String(body?.entity_id||'')];
  if(!type||!id)throw new Error('Invalid realtime subscription.');
  if(action==='add')await activeConnection.subscribe(type,id);else await activeConnection.unsubscribe(type,id);
  return {data:{ok:true,connectionId:activeConnection.connectionId}};
}

export const api:ApiClient={
  get:<T=any>(path:string)=>request<T>(path,{method:'GET'}),
  post:<T=any>(path:string,body?:unknown)=>{
    if(path==='/api/subscriptions'||path==='/api/subscriptions/remove')return localSubscription(path,body) as Promise<ApiResponse<T>>;
    return request<T>(path,{method:'POST',body:JSON.stringify(body??{})});
  },
  put:<T=any>(path:string,body?:unknown)=>request<T>(path,{method:'PUT',body:JSON.stringify(body??{})}),
  delete:<T=any>(path:string)=>request<T>(path,{method:'DELETE'})
};

export const auth={
  async getSession(){return currentSession();},
  async bootstrap(){
    const session=await currentSession();
    if(!session?.user)throw Object.assign(new Error('Authentication required.'),{status:401});
    const me=await api.get('/api/me');
    const compliance=await api.get('/api/compliance/state');
    return {session,me:me.data,compliance:compliance.data};
  },
  async getUser(){
    const {data:{user}}=await supabase.auth.getUser();
    return user;
  },
  async signIn(provider:'google'|'apple'='google'){
    const {error}=await supabase.auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin+'/app'}});
    if(error)throw error;
  },
  async signOut(){
    const {error}=await supabase.auth.signOut({scope:'local'});
    cachedSession=null;
    authInitialized=true;
    if(error)throw error;
  }
};

function createRealtimeConnection():RealtimeConnection{
  const connectionId=crypto.randomUUID();
  let messageHandler:RealtimeMessageHandler=()=>{};
  let errorHandler:(error:any)=>void=()=>{};
  let closeHandler=()=>{};
  const channels=new Map<string,any>();

  const connection:RealtimeConnection={
    connectionId,
    ready:Promise.resolve(),
    onMessage(cb){messageHandler=cb},
    onError(cb){errorHandler=cb},
    onClose(cb){closeHandler=cb},
    async subscribe(type,id){
      const key=type+':'+id;
      if(channels.has(key))return;
      const channelName='hc-'+type+'-'+id;
      const channel=supabase.channel(channelName);
      if(type==='user'){
        channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:'user_id=eq.'+id},payload=>{
          const n:any=payload.new||{};
          const event=String(n.event_type||'');
          messageHandler({type:'entity.update',payload:{entity_type:'user',entity_id:id,data:{kind:event,profileId:n.actor_id||n.profile_id,text:n.body||n.title||''}}});
        });
      }else if(type==='conversation'){
        channel.on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'match_id=eq.'+id},payload=>{
          const m:any=payload.new||{};
          messageHandler({type:'entity.update',payload:{entity_type:'conversation',entity_id:id,data:{kind:'message',message:{id:m.id,sender:m.sender_id,text:m.body||'',time:Date.parse(m.created_at||'')||Date.now(),mine:false}}}});
        });
      }else{
        return;
      }
      await new Promise<void>((resolve,reject)=>{
        let settled=false;
        const finish=(ok:boolean,error?:any)=>{if(settled)return;settled=true;if(ok){channels.set(key,channel);resolve()}else{errorHandler(error||new Error('Realtime subscription failed.'));try{supabase.removeChannel(channel)}catch{};reject(error||new Error('Realtime subscription failed.'))}};
        channel.subscribe((status:any,error:any)=>{
          if(status==='SUBSCRIBED')finish(true);
          else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')finish(false,error||new Error(status));
        });
        setTimeout(()=>finish(false,new Error('Realtime subscription timed out.')),10000);
      });
    },
    async unsubscribe(type,id){
      const key=type+':'+id,channel=channels.get(key);
      if(!channel)return;
      channels.delete(key);
      await supabase.removeChannel(channel);
    },
    async disconnect(){
      for(const channel of channels.values())await supabase.removeChannel(channel);
      channels.clear();
      closeHandler();
      if(activeConnection===connection)activeConnection=null;
    }
  };
  activeConnection=connection;
  return connection;
}

export const ws={connect:createRealtimeConnection};
