import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const sql = await readFile(new URL('../supabase/migrations/20261009030000_harden_discover_backend.sql', import.meta.url), 'utf8');

test('pass suppression is server-side and preserves active matches', () => {
  assert.match(sql, /sa\\.action='pass'/);
  assert.match(sql, /or exists\\(select 1 from public\\.matches m where m\\.status='active'/);
  assert.match(sql, /heart_private\\.can_view_profile\\(v_uid, dp\\.user_id\\)/);
});
test('pagination is deterministic and uses a lookahead row', () => {
  assert.match(sql, /last_active_at desc, created_at desc, user_id asc/);
  assert.match(sql, /limit \\(v_limit \\+ 1\\) offset v_offset/);
  assert.match(sql, /select count\\(\\*\\) > v_limit from page_candidates/);
  assert.match(sql, /'nextOffset',v_offset\\+jsonb_array_length\\(v_result\\)/);
});
test('superlike input normalizes to existing constraint value', () => {
  assert.match(sql, /then 'super_like'/);
  assert.match(sql, /action in \\('like','super_like','pass'\\)/);
});
test('private privileged functions revoke inherited and explicit client execution', () => {
  for (const sig of ['heart_private.discover_impl(integer, integer)','heart_private.connect_impl(uuid, text)','heart_private.can_view_profile(uuid, uuid)','heart_private.can_view_media(uuid, uuid)','heart_private.compliance_ready(uuid)','heart_private.user_restricted(uuid)']) {
    assert.ok(sql.includes('revoke execute on function ' + sig + ' from public, anon, authenticated;'));
  }
  assert.match(sql, /security definer set search_path = public, pg_temp/i);
  assert.match(sql, /grant execute on function public\\.hc_discover_v1\\(integer, integer\\) to authenticated/);
  assert.match(sql, /grant execute on function public\\.hc_connect_v1\\(uuid, text\\) to authenticated/);
});
test('no historical swipe rewrite or pass-undo feature is introduced', () => {
  assert.doesNotMatch(sql, /update public\\.swipe_actions\\s+set action/i);
  assert.match(sql, /unlike removes only likes\\/superlikes/);
});
