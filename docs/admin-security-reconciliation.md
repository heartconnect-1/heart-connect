# Heart Connect Admin ↔ Security Branch Reconciliation Gate

This document exists to prevent the Admin Dashboard work from overwriting or bypassing the active security-stabilization work.

## Branch ownership

- `main`: production only. Do not use for experiments.
- `security-stabilization-2026-09-10`: authentication, messaging, calls, media privacy, security firewall, native API and performance work.
- `admin-dashboard-upgrade-2026-09-10`: Admin Control Plane only.

## Current intentional admin branch footprint

The admin branch should modify only:

- `.github/workflows/admin-*`
- `cloudflare/admin-*`
- `cloudflare/worker-admin-*`
- admin-named Supabase migrations
- `wrangler.router.jsonc` (branch-local entry point only)
- `docs/admin-*`

Do not modify the security branch's authentication, messaging, calling, privacy, firewall, performance, native dating API, or frontend implementation from this branch.

## Known reconciliation points

### 1. `cloudflare/worker-v12.js`

The security branch owns this file and currently has newer security/native/performance wiring. The admin branch wraps `worker-v12.js` rather than replacing its core logic. When the branches are eventually reconciled, the merged admin wrapper must inherit the security branch's latest secured Worker implementation, even if its filename/version changes before reconciliation.

### 2. `wrangler.router.jsonc`

The admin branch intentionally points `main` at the latest `worker-admin-v*.js` wrapper for its non-production preview. At final reconciliation, preserve all security-branch Wrangler settings and change only the Worker entry point/bindings needed to wrap the final secured worker. Preserve the Workers AI binding and scheduled trigger only if Phase 5/6 remain enabled in the combined candidate.

### 3. Legacy `backend/admin-dashboard.ts`

The security branch currently contains an AppDeploy-backed admin route set. The Cloudflare-native Admin Control Plane overlaps several `/api/admin/*` routes. The native admin implementation is intended to become canonical only after its Supabase migrations and Cloudflare secrets are ready. Until then, unmatched native admin routes must fall through to the existing secured worker/backend. The current admin wrappers preserve that fallback behavior.

### 4. Shared Supabase

Do **not** apply these admin migrations while the security branch is actively changing shared database/security behavior:

- `20260910100000_admin_control_plane_foundation.sql`
- `20260910111500_admin_phase2_actions_cms.sql`
- `20260910113000_admin_phase3_operations.sql`
- `20260910114500_admin_phase4_lifecycle.sql`
- `20260910120000_admin_phase5_ai_notifications_automation.sql`
- `20260910121500_admin_phase6_command_center.sql`

Apply them only after a reconciliation review. They are designed to be additive, but ordering and compatibility still matter because both branches use the same Supabase project.

Phase 5/6 specifically touch notification compatibility and operational tables. Before applying them, compare the security branch's current `public.notifications` shape and RLS policies against the additive compatibility statements in the admin migration.

## Required pre-merge checks

1. Freeze or checkpoint the security branch.
2. Compare both branches from their merge base.
3. Bring the latest security-owned files into the combined candidate first.
4. Layer the admin wrapper on top; do not replace the secured Worker core.
5. Review `/api/admin/*` route ownership and retain fallback for any admin features not yet migrated.
6. Review all Supabase migrations in timestamp/order sequence before applying anything.
7. Review `public.notifications` columns, foreign keys, grants and RLS before Phase 5/6 migration application.
8. Configure required secrets in Cloudflare, never in committed Wrangler vars.
9. Run Admin Control Plane CI and the security branch's own tests.
10. Test authentication/session refresh, discovery, messaging, calls and private-media access on the combined preview.
11. Test admin users, moderation, verification, payments, CMS, notifications, AI, trash/restore, incidents and readiness on the combined preview.
12. Capture Phase 6 health/readiness evidence and resolve any critical operational incidents.
13. Mark `combined_preview_tested` passed only with real preview evidence.
14. Mark `production_merge_approved` passed only after owner/super-admin review.
15. Merge to `main` only after both security and admin acceptance checks pass.

## Secrets and bindings expected later

Values are deliberately not stored in this repository. Depending on enabled features, the admin control plane expects secret/binding configuration such as:

- `SUPABASE_SERVICE_ROLE_KEY`
- `HEART_CONNECT_OWNER_EMAILS` and/or the existing admin owner allow-list
- Workers AI binding (`AI`) if Admin AI is enabled
- optional `ADMIN_AI_MODEL`
- optional Facebook/TikTok/Google Business credentials only after API approval and adapter implementation

Never commit secret values to this file or to Wrangler `vars`.

## Phase 6 production gate

Phase 6 adds explicit readiness tracking but does not authorize deployment. Required readiness gates cannot be waived. Automatic health checks can open/reopen incidents but cannot perform account enforcement, verification decisions, payment actions, deletion, publishing or other high-impact actions.
