# Heart Connect Admin Phase 7

Phase 7 adds final Admin Control Plane reporting, privacy-safe export, global search, least-privilege review, and reconciliation evidence to the isolated `admin-dashboard-upgrade-2026-09-10` branch.

## Scope

- Global admin search across permitted operational datasets.
- Aggregate operational reports for users, moderation, verification, notifications, incidents, audit events, and export activity.
- Role-gated CSV exports with explicit field allowlists.
- Export audit evidence without storing exported file contents.
- Reusable report presets.
- Role-matrix and active-staff review.
- Owner/super-admin security review evidence for permissions, export privacy, and reconciliation planning.
- Phase 7 launch-readiness gates layered on top of the Phase 6 command center.

## Export privacy boundary

Phase 7 exports never intentionally include private message bodies, identity evidence paths/documents, private profile media, credentials, passwords, access tokens, API keys, or payment secrets. Payment exports use an explicit safe-field allowlist rather than serializing the full provider record.

Exports are limited to 1,000 rows per synchronous download and return an `x-hc-export-truncated` response header when that cap is reached. Each export writes an audit event and an `hc_admin_export_log` row containing only metadata about the export, not the exported contents.

## Search privacy boundary

Global search is limited to operational fields such as profile display name/location, CMS title/slug, incident title/summary, and audit action/target for elevated roles. It does not search private conversations, identity evidence, private media, credentials, or payment secrets.

## Security review

Only owner/super-admin can record Phase 7 security sign-off. Recording a review requires typed `REVIEWED` confirmation and a note/evidence entry. A passed review can update the corresponding Phase 7 readiness gate, but it does not merge Git branches, deploy production, apply migrations, or prove the security branch has already been reconciled.

## Reconciliation boundary

The admin branch remains isolated. Phase 7 does not modify authentication, messaging, calling, private media, native dating APIs, or the security branch's Worker core. `worker-admin-v7.js` continues to wrap the existing `worker-v12.js` inherited from the admin branch snapshot.

Before production, the final combined candidate must first inherit the latest `security-stabilization-2026-09-10` changes, then layer the Admin wrapper and migrations on top, run both branches' tests, and pass the combined Cloudflare preview gate.

## Database migration

Do not apply `20260910123000_admin_phase7_reports_security.sql` to the shared Supabase project until the security-stabilization branch has been reconciled and the migration order has been reviewed. The migration is additive and creates server-only export logs, security review evidence, report presets, and three additional readiness checks.
