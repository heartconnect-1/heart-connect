# Heart Connect Security + Admin Integration Candidate

Status: **INTEGRATION CANDIDATE — NOT PRODUCTION**

This branch was created from the approved security checkpoint:

- Security branch: `security-stabilization-2026-09-10`
- Security checkpoint: `d691c1e45a7699c1b9066e471ae09c3066a6866a`
- Security Worker entry point at reconciliation: `cloudflare/worker-v15.js`

The completed Admin Control Plane was then layered on top from:

- Admin branch: `admin-dashboard-upgrade-2026-09-10`
- Admin checkpoint: `43be0dc688ca4ca346d47fd0ec50323f94074c18`
- Admin wrapper: `cloudflare/worker-admin-v7.js`

## Reconciliation rule

The Admin wrapper imports and delegates non-admin traffic to `worker-v15.js`. Security-owned authentication, messaging, calling, private-media, firewall, privacy and performance code is preserved from the security checkpoint and is not replaced by Admin code.

`wrangler.router.jsonc` preserves the security configuration while changing the integration entry point to the Admin wrapper and adding the Workers AI binding and five-minute cron required by the Admin automation features.

## Database rule

The Admin migrations are present in this branch for review, but this commit does **not** apply them to Supabase. Before applying them, review the current security schema and `public.notifications` compatibility in timestamp order.

## Production blockers

Do not merge this candidate into `main` until all of the following have evidence:

1. Integration CI passes, including secret scan, dependency audit, TypeScript, production build and Wrangler dry-run.
2. Cloudflare creates a non-production preview from this integration branch.
3. Public authentication/session refresh, discovery, mutual-match messaging, calls and private media pass smoke testing on that preview.
4. Admin access, role permissions, users, moderation, verification, payments visibility, CMS, notifications, AI, trash/restore, incidents, readiness, reports, search and exports pass on the same preview.
5. Admin migrations are reviewed and applied only after schema compatibility is confirmed.
6. Required Cloudflare secrets are configured outside Git.
7. Supabase leaked-password protection is enabled as a production hardening step.
8. The legacy `heart_connect_role_for_email` RPC is revoked only after confirming the live legacy/AppDeploy CMS no longer depends on it.
9. Owner/super-admin explicitly approves the final production merge.

No item in this document itself authorizes production deployment.
