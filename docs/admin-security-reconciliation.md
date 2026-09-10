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

The security branch owns this file and currently has newer security/native/performance wiring. The admin branch wraps `worker-v12.js` rather than replacing its core logic. When the branches are eventually reconciled, the merged admin wrapper must inherit the security branch's latest `worker-v12.js`.

### 2. `wrangler.router.jsonc`

The admin branch intentionally points `main` at the latest `worker-admin-v*.js` wrapper for its non-production preview. At final reconciliation, preserve all security-branch Wrangler settings and change only the Worker entry point needed to wrap the final secured worker.

### 3. Legacy `backend/admin-dashboard.ts`

The security branch currently contains an AppDeploy-backed admin route set. The Cloudflare-native Admin Control Plane overlaps several `/api/admin/*` routes. The native admin implementation is intended to become canonical only after its Supabase migrations and Cloudflare secrets are ready. Until then, unmatched native admin routes must fall through to the existing secured worker/backend. `worker-admin-v4.js` contains a fallback for native `Admin route not found.` responses for this reason.

### 4. Shared Supabase

Do **not** apply these admin migrations while the security branch is actively changing shared database/security behavior:

- `20260910100000_admin_control_plane_foundation.sql`
- `20260910111500_admin_phase2_actions_cms.sql`
- `20260910113000_admin_phase3_operations.sql`
- `20260910114500_admin_phase4_lifecycle.sql`

Apply them only after a reconciliation review. They are designed to be additive, but the timing still matters because both branches use the same Supabase project.

## Required pre-merge checks

1. Freeze or checkpoint the security branch.
2. Compare both branches from their merge base.
3. Bring the latest security-owned files into the combined candidate first.
4. Layer the admin wrapper on top; do not replace the secured Worker core.
5. Review `/api/admin/*` route ownership and retain fallback for any admin features not yet migrated.
6. Review all Supabase migrations in timestamp/order sequence before applying anything.
7. Configure required secrets in Cloudflare, never in committed Wrangler vars.
8. Run Admin Control Plane CI and the security branch's own tests.
9. Test the combined Cloudflare preview with production traffic still on `main`.
10. Merge to `main` only after both security and admin acceptance checks pass.

## Secrets expected later

Values are deliberately not stored in this repository. Depending on enabled features, the admin control plane expects secret/binding configuration such as:

- `SUPABASE_SERVICE_ROLE_KEY`
- `HEART_CONNECT_OWNER_EMAILS`
- optional Workers AI binding (`AI`)
- optional Facebook/TikTok/Google Business credentials only after API approval and adapter implementation

Never commit secret values to this file or to Wrangler `vars`.
