create or replace function public.hc_redeem_stage8_market_invite_v1(p_user_id uuid,p_market text,p_code text)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_invite stage7_records%rowtype;
  v_existing stage7_records%rowtype;
  v_access uuid;
  v_used integer;
  v_limit integer;
begin
  select * into v_existing
  from public.stage7_records
  where owner = p_user_id
    and kind = 'stage8_market_access'
    and upper(coalesce(payload->>'inviteCode','')) = upper(p_code)
  order by created_at desc
  limit 1;

  if v_existing.id is not null then
    return jsonb_build_object('ok',true,'idempotent',true,'access_id',v_existing.id);
  end if;

  select * into v_invite
  from public.stage7_records
  where owner is null
    and kind = 'stage8_market_invite'
    and upper(coalesce(payload->>'code','')) = upper(p_code)
  order by updated_at desc
  limit 1
  for update;

  if v_invite.id is null then
    return jsonb_build_object('ok',false,'error','invalid');
  end if;

  if coalesce(v_invite.payload->>'market','') <> p_market
     or coalesce(v_invite.payload->>'status','') <> 'active'
     or (nullif(v_invite.payload->>'expiresAt','') is not null
         and nullif(v_invite.payload->>'expiresAt','')::numeric > 0
         and nullif(v_invite.payload->>'expiresAt','')::numeric < extract(epoch from clock_timestamp())*1000)
  then
    return jsonb_build_object('ok',false,'error','invalid');
  end if;

  v_used := greatest(0,coalesce(nullif(v_invite.payload->>'used','')::integer,0));
  v_limit := greatest(1,coalesce(nullif(v_invite.payload->>'usageLimit','')::integer,1));

  if v_used >= v_limit then
    return jsonb_build_object('ok',false,'error','used_up');
  end if;

  insert into public.stage7_records(owner,kind,payload,created_at,updated_at)
  values (
    p_user_id,
    'stage8_market_access',
    jsonb_build_object('owner',p_user_id,'market',p_market,'inviteCode',upper(p_code),'grantedAt',(extract(epoch from clock_timestamp())*1000)::bigint),
    now(),
    now()
  )
  returning id into v_access;

  update public.stage7_records
  set payload = jsonb_set(v_invite.payload,'{used}',to_jsonb(v_used+1),true) || jsonb_build_object('updatedAt',(extract(epoch from clock_timestamp())*1000)::bigint),
      updated_at = now()
  where id = v_invite.id;

  return jsonb_build_object('ok',true,'market',p_market,'access_id',v_access);
end;
$$;

revoke execute on function public.hc_redeem_stage8_market_invite_v1(uuid,text,text) from public, anon, authenticated;
grant execute on function public.hc_redeem_stage8_market_invite_v1(uuid,text,text) to service_role;
