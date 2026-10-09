# Discover backend hardening — review notes

## Root causes
- Pass is persisted through the existing unique (actor_id,target_id) upsert, but discovery did not filter action='pass'.
- Pagination ordering had no unique final key and a full page was incorrectly treated as proof that more results exist.
- API accepts superlike while the existing swipe_actions constraint uses super_like.
- Inspected function ACL metadata showed PUBLIC EXECUTE on private SECURITY DEFINER helpers. Earlier revokes only named anon/authenticated and therefore did not remove inherited PUBLIC access. Actual PostgREST schema exposure still needs independent confirmation.

## Intended behavior
- Persisted passes suppress the same target; repeated pass is idempotent.
- An existing active mutual match remains visible even if an old pass row exists.
- No pass-undo feature is added. Existing unlike removes likes/superlikes only. A later like upserts the unique swipe row, replacing pass.
- Database canonical action remains super_like; API alias superlike is normalized. No historical rows are rewritten.
- Ordering ends with unique user_id. One lookahead candidate drives hasMore; nextOffset advances by returned item count.
- Offset pagination can still shift if candidates or sort fields change between requests; deterministic ordering is not snapshot isolation.

## Security assessment and prerequisite
The proposed migration revokes client/PUBLIC EXECUTE on the reviewed private functions and makes only hc_discover_v1/hc_connect_v1 SECURITY DEFINER with fixed search_path and schema-qualified calls. The wrappers preserve authenticated execution. Do not apply until a complete call-graph confirms no other public invoker wrapper needs client EXECUTE on these helpers, and live PostgREST exposed schemas/effective production routing are verified. PUBLIC EXECUTE alone is not proof of reachability.

## Storage-policy compatibility amendment

The production Storage RLS policies call `heart_private.can_view_media_path(uuid,text)` and `heart_private.user_restricted(uuid)` directly as the authenticated role. Do not revoke authenticated EXECUTE on these two helpers unless the policies are first changed to use an appropriately secured policy-facing wrapper and that change is tested. The repair branch therefore revokes inherited PUBLIC and anon execution while explicitly preserving authenticated execution for these two functions. This prevents breaking the existing policies, but it does not eliminate direct authenticated helper calls if PostgREST exposes `heart_private`; verify exposed schemas and later consider policy-facing wrappers before removing those grants.

## Pre-apply checklist
1. Confirm the effective production Worker SUPABASE_URL reference from Cloudflare deployment metadata. Repository default is not proof.
2. Confirm PostgREST exposed schemas and effective grants for heart_private.
3. Capture deployed function definitions and ACLs; stop if signatures differ.
4. Review all callers of heart_private helpers, not just Discover.
5. Confirm swipe_actions constraint accepts super_like and unique(actor_id,target_id) exists.
6. Apply only after separate approval. No tables/indexes are added or dropped and no member rows are rewritten. Function/ACL DDL can briefly contend with concurrent RPC/catalog operations.

## Non-destructive validation queries (for a separately approved review)
```sql
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid),p.prosecdef,p.proconfig,pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='public' and p.proname in ('hc_discover_v1','hc_connect_v1'))
   or (n.nspname='heart_private' and p.proname in ('discover_impl','connect_impl','can_view_profile','can_view_media','compliance_ready','user_restricted'));

select n.nspname,p.proname,x.grantee,x.privilege_type
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) x
where n.nspname='heart_private';

select conname,pg_get_constraintdef(oid) from pg_constraint where conrelid='public.swipe_actions'::regclass;
select nspname,nspacl from pg_namespace where nspname='heart_private';
```

## Validation and rollback
Use synthetic users in a disposable database to test repeated pass, pass exclusion, later like replacing pass, active-match preservation, normal like, superlike, lookahead pagination, and direct helper RPC rejection. Do not test against production member accounts.
Capture exact pre-change definitions and ACLs in a secured change artifact before any future application. Restore those exact definitions and wrapper ACLs if compatibility regresses; do not restore PUBLIC execution on privileged helpers as a casual rollback. No member-row rollback is required because this migration rewrites no data.
