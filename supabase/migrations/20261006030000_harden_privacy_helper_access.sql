-- Harden privacy helper functions so clients cannot directly probe private
-- visibility/compliance decisions for arbitrary users. Public member RPCs
-- continue to call these helpers internally under SECURITY DEFINER.

revoke execute on function heart_private.compliance_ready(uuid) from anon, authenticated;
revoke execute on function heart_private.can_view_profile(uuid, uuid) from anon, authenticated;
revoke execute on function heart_private.can_view_media(uuid, uuid) from anon, authenticated;
revoke execute on function heart_private.can_view_media_path(uuid, text) from anon, authenticated;

-- Keep inbox responses consistent with the same privacy gate used by discovery.
create or replace function heart_private.inbox_impl(p_limit integer default 50)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1,least(coalesce(p_limit,50),100));
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'authentication_required' using errcode='28000';
  end if;

  with active_matches as (
    select m.*,case when m.user_a=v_uid then m.user_b else m.user_a end as peer_id
    from public.matches m
    where m.status='active' and (m.user_a=v_uid or m.user_b=v_uid)
    order by m.last_activity_at desc
    limit v_limit
  ),
  rows as (
    select am.id as match_id,am.peer_id,am.matched_at,am.last_activity_at,dp,
      heart_private.can_view_media(v_uid,am.peer_id) as media_allowed,
      (select row_to_json(x) from (
        select msg.id,msg.sender_id,msg.body,msg.message_type,msg.media_path,msg.client_id,
               msg.safety_level,msg.safety_notice,msg.delivered_at,msg.read_at,
               msg.edited_at,msg.deleted_at,msg.created_at
        from public.messages msg where msg.match_id=am.id
        order by msg.created_at desc limit 1
      ) x) as last_message,
      (select count(*)::int from public.messages um
       where um.match_id=am.id and um.sender_id=am.peer_id
         and um.deleted_at is null and um.read_at is null) as unread_count
    from active_matches am
    join public.dating_profiles dp on dp.user_id=am.peer_id
    where heart_private.can_view_profile(v_uid,am.peer_id)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'matchId',r.match_id,
    'matchedAt',r.matched_at,
    'lastActivityAt',r.last_activity_at,
    'unreadCount',r.unread_count,
    'lastMessage',r.last_message,
    'profile',jsonb_build_object(
      'id',r.peer_id,'name',(r.dp).display_name,'age',(r.dp).age,
      'city',(r.dp).city,'country',(r.dp).country,
      'relationshipGoal',(r.dp).relationship_intention,
      'verificationLevel',(r.dp).verification_level,
      'mediaAllowed',r.media_allowed,
      'mediaPaths',case when r.media_allowed then
        coalesce((select jsonb_agg(pm.storage_path order by pm.position)
                  from public.profile_media pm
                  where pm.user_id=r.peer_id and pm.moderation_status='approved'),
                 '[]'::jsonb)
        else '[]'::jsonb end
    )
  ) order by r.last_activity_at desc),'[]'::jsonb) into v_result from rows r;

  return jsonb_build_object(
    'items',v_result,
    'unreadTotal',coalesce((select sum((x->>'unreadCount')::int)
                            from jsonb_array_elements(v_result) x),0)
  );
end;
$function$;
