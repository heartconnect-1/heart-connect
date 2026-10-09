import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const sql = await readFile(new URL('../supabase/migrations/20261009030000_harden_discover_backend.sql', import.meta.url), 'utf8');

test('pass suppression is server-side and preserves active matches', () => {
  assert.match(sql, /sa\.action='pass'/);
  assert.match(sql, /or exists\(select 1 from public\.matches m where m\.status='active'/);
  assert.match(sql, /heart_private\.can_view_profile\(v_uid, dp\.user_id\)/);
});
test('pagination is deterministic and uses a lookahead row', () => {
  assert.match(sql, /last_active_at desc, created_at desc, user_id asc/);
  assert.match(sql, /limit \(v_limit \+ 1\) offset v_offset/);
  assert.match(sql, /select count\(\*\) > v_limit from page_candidates/);
  assert.match(sql, /'nextOffset',v_offset\+jsonb_array_length\(v_result\)/);
});
test('superlike input normalizes to existing constraint value', () => {
  assert.match(sql, /then 'super_like'/);
  assert.match(sql, /action in \('like','super_like','pass'\)/);
});
test('private privileged functions revoke inherited and explicit client execution', () => {
  for (const sig of ['heart_private.discover_impl(integer, integer)','heart_private.connect_impl(uuid, text)','heart_private.inbox_impl(integer)','heart_private.match_for_peer_impl(uuid)','heart_private.privacy_update_impl(jsonb)','heart_private.can_view_profile(uuid, uuid)','heart_private.can_view_media(uuid, uuid)','heart_private.compliance_ready(uuid)']) {
    assert.ok(sql.includes('revoke execute on function ' + sig + ' from public, anon, authenticated;'));
  }
  assert.match(sql, /security definer set search_path = public, pg_temp/i);
  assert.match(sql, /create or replace function public\.hc_inbox_v1[\s\S]*?security definer set search_path = public, pg_temp/i);
  assert.match(sql, /create or replace function public\.hc_match_for_peer_v1[\s\S]*?security definer set search_path = public, pg_temp/i);
  assert.match(sql, /create or replace function public\.hc_privacy_update_v1[\s\S]*?security definer set search_path = public, pg_temp/i);
  assert.match(sql, /grant execute on function public\.hc_discover_v1\(integer, integer\) to authenticated/);
  assert.match(sql, /grant execute on function public\.hc_connect_v1\(uuid, text\) to authenticated/);
  assert.match(sql, /grant execute on function public\.hc_inbox_v1\(integer\) to authenticated/);
  assert.match(sql, /grant execute on function public\.hc_match_for_peer_v1\(uuid\) to authenticated/);
  assert.match(sql, /grant execute on function public\.hc_privacy_update_v1\(jsonb\) to authenticated/);
});
test('no historical swipe rewrite or pass-undo feature is introduced', () => {
  assert.doesNotMatch(sql, /update public\.swipe_actions\s+set action/i);
  assert.match(sql, /unlike removes only likes\/superlikes/);
});


test('storage-policy helper grants preserve existing authenticated policy execution', () => {
  assert.match(sql, /revoke execute on function heart_private\\.can_view_media_path\\(uuid, text\\) from public, anon;/i);
  assert.match(sql, /grant execute on function heart_private\\.can_view_media_path\\(uuid, text\\) to authenticated;/i);
  assert.match(sql, /revoke execute on function heart_private\\.user_restricted\\(uuid\\) from public, anon;/i);
  assert.match(sql, /grant execute on function heart_private\\.user_restricted\\(uuid\\) to authenticated;/i);
  assert.doesNotMatch(sql, /revoke execute on function heart_private\\.can_view_media_path\\(uuid, text\\) from public, anon, authenticated;/i);
  assert.doesNotMatch(sql, /revoke execute on function heart_private\\.user_restricted\\(uuid\\) from public, anon, authenticated;/i);
});

test('incognito visibility uses the canonical super_like database action', () => {
  const start = sql.indexOf('create or replace function heart_private.can_view_profile');
  const end = sql.indexOf('$function$;', start);
  assert.notEqual(start, -1, 'can_view_profile definition exists');
  assert.notEqual(end, -1, 'can_view_profile definition closes');
  const definition = sql.slice(start, end);
  assert.match(definition, /pp\.profile_visibility.*incognito/i);
  assert.match(definition, /sa\.action in \('like','super_like'\)/);
  assert.doesNotMatch(definition, /sa\.action in \('like','superlike'\)/);
});

test('connect implementation authenticates caller and normalizes superlike before persistence', () => {
  const start = sql.indexOf('create or replace function heart_private.connect_impl');
  const end = sql.indexOf('$function$;', start);
  assert.notEqual(start, -1, 'connect_impl definition exists');
  const definition = sql.slice(start, end);
  assert.match(definition, /v_uid uuid := auth\.uid\(\)/);
  assert.match(definition, /if v_uid is null then raise exception 'authentication_required'/);
  assert.match(definition, /case when lower\(trim\(coalesce\(p_action,''\)\)\) = 'superlike' then 'super_like'/);
  assert.match(definition, /if p_target is null or p_target=v_uid then raise exception 'invalid_target'/);
  assert.match(definition, /heart_private\.can_view_profile\(v_uid,p_target\)/);
});

test('privacy update wrapper uses fixed-search-path SECURITY DEFINER and keeps helper private', () => {
  const start = sql.indexOf('create or replace function public.hc_privacy_update_v1');
  const end = sql.indexOf('$function$;', start);
  assert.notEqual(start, -1, 'privacy wrapper exists');
  const definition = sql.slice(start, end);
  assert.match(definition, /security definer set search_path = public, pg_temp/i);
  assert.match(definition, /heart_private\.privacy_update_impl\(coalesce\(p_patch,'\{\}'::jsonb\)\)/);
  assert.match(sql, /revoke execute on function heart_private\.privacy_update_impl\(jsonb\) from public, anon, authenticated;/i);
  assert.doesNotMatch(sql, /grant execute on function heart_private\.privacy_update_impl\(jsonb\) to authenticated/i);
});
