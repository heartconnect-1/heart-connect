# Heart Connect Security Checkpoint

Branch: `security-stabilization-2026-09-10`

Status: **READY FOR RECONCILIATION**

This checkpoint is intentionally isolated from `main` and from `admin-dashboard-upgrade-2026-09-10`.

## Completed security scope

- Authentication/session hardening is complete for the security branch: Cloudflare-native Supabase sessions use `__Host-` HttpOnly Secure cookies, bounded access-token lifetime, refresh-token rotation handling, same-origin checks for unsafe requests, no-store API responses, explicit logout/revocation, strong password rules, adult/Terms/Privacy registration gates, and legacy self-migration strips native Supabase credentials before forwarding any legacy request.
- Mutual-match messaging is complete: recovered messaging code and Cloudflare/Supabase-native messaging require both participants to have liked each other, deny blocked/suspended connections, enforce message rate limits and retry/idempotency keys, and restrict inbox/conversation access to active mutual matches.
- Voice/video calling security is complete: call creation, signaling, ICE/TURN retrieval, mode changes and call actions require an active eligible mutual match and participant ownership; call attempts are rate-limited and member call/privacy preferences are enforced.
- Private media protection is complete: profile-media upload/list/delete/reorder is owner-scoped, file type/magic/size are validated, new uploads start `pending`, signed URLs are short-lived, Supabase Storage RLS controls object access, and the edge privacy sanitizer prevents legacy Stage 4 responses from leaking private/matches-only media.
- Security/firewall work is complete: the secured Worker runs native account safety, migration, media and API handlers before the legacy fallback, applies pre-request mutual-match gates and post-response privacy sanitization, applies security headers, and keeps private/API responses out of public caching.
- Performance/loading work is complete for this checkpoint: the old monolithic frontend bundle was split into cached vendor/feature chunks, immutable public assets are safely cached at the edge, Server-Timing is emitted, and the booking renderer hang caused by legacy DOM observers is neutralized by the outer Worker.
- CI is a hard gate: committed-secret scan, runtime dependency audit, TypeScript, production build and Wrangler Worker validation must all pass.

## Reconciliation rules

- Do not merge this branch directly into `main`.
- Do not merge `admin-dashboard-upgrade-2026-09-10` directly into this branch.
- Create a new integration/reconciliation branch from the latest security checkpoint and combine the Admin branch there.
- Preserve the latest security Worker as the core Worker.
- The Admin Worker must wrap the secured Worker during reconciliation.
- Do not apply Admin Supabase migrations until reconciliation review explicitly approves them.

## Deferred production/account actions

These are deliberately not blockers for creating the reconciliation branch, but must be resolved before final production cutover:

1. Supabase leaked-password protection is an account-level Auth setting and remains disabled; enable it before production cutover.
2. `public.heart_connect_role_for_email(text)` remains executable for legacy live AppDeploy CMS compatibility. The recovered security-branch CMS no longer depends on it. Revoke its public/authenticated execute permission only after reconciliation confirms no live caller remains.
3. Production `royal-heart.com` remains on the existing deployment until the reconciliation branch passes integration/runtime tests.
