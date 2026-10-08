-- Discover backend hardening. Forward-only; apply only after production identity and API schema configuration are independently verified.
-- No existing member rows are rewritten. The unique (actor_id,target_id) upsert makes repeated passes idempotent.

create or replace function heart_private.connect_impl(p_target uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_action text := case when lower(trim(coalesce(p_action,''))) = 'superlike' then 'super_like' else lower(trim(coalesce(p_action,''))) end;
  v_reciprocal boolean := false;
  v_match boolean := false;
begin
  if v_uid is null then raise exception 'authentication_required' using errcode='28000'; end if;
  if p_target is null or p_target=v_uid then raise exception 'invalid_target'; end if;
  if heart_private.user_restricted(v_uid) or heart_private.user_restricted(p_target) then raise exception 'account_restricted' using errcode='42501'; end if;
  if not exists(select 1 from public.dating_profiles where user_id=p_target) then raise exception 'profile_unavailable'; end if;

  if v_action='save' then
    if not heart_private.can_view_profile(v_uid,p_target) then raise exception 'profile_unavailable' using errcode='42501'; end if;
    insert into public.saved_profiles(user_id,target_id) values(v_uid,p_target) on conflict do nothing;
  elsif v_action='unsave' then
    delete from public.saved_profiles where user_id=v_uid and target_id=p_target;
  elsif v_action='block' then
    insert into public.blocks(blocker_id,blocked_id,reason) values(v_uid,p_target,'member_block')
      on conflict (blocker_id,blocked_id) do update set reason=excluded.reason;
    update public.matches set status='blocked',updated_at=now(),last_activity_at=now()
      where (user_a=v_uid and user_b=p_target) or (user_a=p_target and user_b=v_uid);
  elsif v_action='unblock' then
    delete from public.blocks where blocker_id=v_uid and blocked_id=p_target;
  elsif v_action in ('like','super_like','pass') then
    if not heart_private.can_view_profile(v_uid,p_target) then raise exception 'connection_unavailable' using errcode='42501'; end if;
    insert into public.swipe_actions(actor_id,target_id,action,created_at,updated_at)
      values(v_uid,p_target,v_action,now(),now())
      on conflict (actor_id,target_id) do update set action=excluded.action,updated_at=now();
    if v_action in ('like','super_like') then
      select exists(select 1 from public.swipe_actions where actor_id=p_target and target_id=v_uid and action in ('like','super_like')) into v_reciprocal;
      if v_reciprocal then
        insert into public.matches(user_a,user_b,status,matched_at,last_activity_at,created_at,updated_at)
          values(least(v_uid,p_target),greatest(v_uid,p_target),'active',now(),now(),now(),now()) on conflict do nothing;
        update public.matches set status='active',updated_at=now(),last_activity_at=now()
          where (user_a=v_uid and user_b=p_target) or (user_a=p_target and user_b=v_uid);
        insert into public.notifications(user_id,event_type,body,actor_id,profile_id)
          values(p_target,'match','You have a new mutual match.',v_uid,v_uid);
      end if;
    end if;
  elsif v_action='unlike' then
    -- Existing semantics: unlike removes only likes/superlikes. No pass-undo feature is added.
    delete from public.swipe_actions where actor_id=v_uid and target_id=p_target and action in ('like','super_like');
    update public.matches set status='unmatched',updated_at=now(),last_activity_at=now()
      where status='active' and ((user_a=v_uid and user_b=p_target) or (user_a=p_target and user_b=v_uid));
  else
    raise exception 'invalid_action';
  end if;

  select exists(select 1 from public.matches m where m.status='active'
    and ((m.user_a=v_uid and m.user_b=p_target) or (m.user_a=p_target and m.user_b=v_uid))) into v_match;
  return jsonb_build_object(
    'ok',true,
    'liked',exists(select 1 from public.swipe_actions where actor_id=v_uid and target_id=p_target and action in ('like','super_like')),
    'saved',exists(select 1 from public.saved_profiles where user_id=v_uid and target_id=p_target),
    'match',v_match,
    'blocked',exists(select 1 from public.blocks where blocker_id=v_uid and blocked_id=p_target)
  );
end;
$function$;

create or replace function heart_private.discover_impl(p_limit integer default 20, p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit,20), 50));
  v_offset integer := greatest(0, coalesce(p_offset,0));
  v_result jsonb;
  v_has_more boolean := false;
begin
  if v_uid is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  with viewer as (select dp.* from public.dating_profiles dp where dp.user_id = v_uid),
  pref as (select * from public.discovery_preferences where user_id = v_uid),
  candidates as (
    select dp.*, pp.photo_visibility, pp.show_online, pp.show_last_seen, pp.show_distance, pp.show_travel,
      exists(select 1 from public.swipe_actions sa where sa.actor_id=v_uid and sa.target_id=dp.user_id and sa.action in ('like','super_like')) as liked,
      exists(select 1 from public.saved_profiles sp where sp.user_id=v_uid and sp.target_id=dp.user_id) as saved,
      exists(select 1 from public.matches m where m.status='active' and ((m.user_a=v_uid and m.user_b=dp.user_id) or (m.user_a=dp.user_id and m.user_b=v_uid))) as matched,
      heart_private.can_view_media(v_uid, dp.user_id) as media_allowed
    from public.dating_profiles dp
    left join public.privacy_preferences pp on pp.user_id=dp.user_id
    left join pref pr on true
    left join viewer vw on true
    where dp.user_id <> v_uid
      and heart_private.can_view_profile(v_uid, dp.user_id)
      and (dp.age is null or (dp.age >= coalesce(pr.min_age,18) and dp.age <= coalesce(pr.max_age,99)))
      and (coalesce(array_length(pr.genders,1),0)=0 or dp.gender = any(pr.genders))
      and (coalesce(array_length(pr.countries,1),0)=0 or dp.country = any(pr.countries))
      and (coalesce(array_length(pr.relationship_intentions,1),0)=0 or dp.relationship_intention = any(pr.relationship_intentions))
      and (coalesce(vw.meet_gender,'Everyone')='Everyone' or dp.gender = vw.meet_gender)
      and (coalesce(dp.meet_gender,'Everyone')='Everyone' or vw.gender = dp.meet_gender)
      -- Passed members are suppressed, but an already-active mutual match remains visible.
      and (
        not exists(select 1 from public.swipe_actions sa where sa.actor_id=v_uid and sa.target_id=dp.user_id and sa.action='pass')
        or exists(select 1 from public.matches m where m.status='active' and ((m.user_a=v_uid and m.user_b=dp.user_id) or (m.user_a=dp.user_id and m.user_b=v_uid)))
      )
  ), page_candidates as (
    select * from candidates
    order by (boost_until is not null and boost_until > now()) desc, last_active_at desc, created_at desc, user_id asc
    limit (v_limit + 1) offset v_offset
  ), page as (
    select * from page_candidates
    order by (boost_until is not null and boost_until > now()) desc, last_active_at desc, created_at desc, user_id asc
    limit v_limit
  )
  select
    coalesce((select jsonb_agg(jsonb_build_object(
      'id',p.user_id,'name',p.display_name,'age',p.age,'city',p.city,'country',p.country,
      'gender',p.gender,'meetGender',p.meet_gender,'relationshipGoal',p.relationship_intention,
      'bio',p.bio,'interests',p.interests,'languages',p.languages,'occupation',p.occupation,'education',p.education,
      'smoking',p.smoking,'drinking',p.drinking,'children',p.children,'wantsChildren',p.wants_children,
      'personality',p.personality,'prompt',p.profile_prompt,
      'travel',case when coalesce(p.show_travel,true) then p.travel else '{}'::jsonb end,
      'tier',p.tier,'verificationLevel',p.verification_level,'liked',p.liked,'saved',p.saved,'match',p.matched,
      'showOnline',coalesce(p.show_online,true),
      'lastSeen',case when coalesce(p.show_last_seen,true) then p.last_active_at else null end,
      'mediaAllowed',p.media_allowed,
      'mediaPaths',case when p.media_allowed then coalesce((select jsonb_agg(pm.storage_path order by pm.position)
        from public.profile_media pm where pm.user_id=p.user_id and pm.moderation_status='approved'),'[]'::jsonb) else '[]'::jsonb end
    ) order by (p.boost_until is not null and p.boost_until > now()) desc,p.last_active_at desc,p.created_at desc,p.user_id asc)
    from page p),'[]'::jsonb),
    (select count(*) > v_limit from page_candidates)
  into v_result,v_has_more;
  return jsonb_build_object('items',v_result,'offset',v_offset,'nextOffset',v_offset+jsonb_array_length(v_result),'hasMore',v_has_more);
end;
$function$;

-- The public RPC wrappers are the only client entry points and use a fixed search_path.
create or replace function public.hc_discover_v1(p_limit integer default 20, p_offset integer default 0)
returns jsonb language sql stable security definer set search_path = public, pg_temp
as $function$ select heart_private.discover_impl(p_limit,p_offset) $function$;

create or replace function public.hc_connect_v1(p_target uuid, p_action text)
returns jsonb language sql security definer set search_path = public, pg_temp
as $function$ select heart_private.connect_impl(p_target,p_action) $function$;

-- Remove inherited PUBLIC execution as well as explicit client grants.
revoke execute on function heart_private.discover_impl(integer, integer) from public, anon, authenticated;
revoke execute on function heart_private.connect_impl(uuid, text) from public, anon, authenticated;
revoke execute on function heart_private.can_view_profile(uuid, uuid) from public, anon, authenticated;
revoke execute on function heart_private.can_view_media(uuid, uuid) from public, anon, authenticated;
revoke execute on function heart_private.compliance_ready(uuid) from public, anon, authenticated;
revoke execute on function heart_private.user_restricted(uuid) from public, anon, authenticated;
revoke execute on function public.hc_discover_v1(integer, integer) from public, anon;
revoke execute on function public.hc_connect_v1(uuid, text) from public, anon;
grant execute on function public.hc_discover_v1(integer, integer) to authenticated;
grant execute on function public.hc_connect_v1(uuid, text) to authenticated;
