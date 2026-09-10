# Heart Connect Admin + Security Database Reconciliation Review

Status: **REVIEWED FOR INTEGRATION / NOT YET PRODUCTION-APPLIED**

This review was performed against the shared Heart Connect Supabase project after the security checkpoint `d691c1e45a7699c1b9066e471ae09c3066a6866a` and the combined integration candidate were assembled.

## Compatibility confirmed

- `dating_profiles` contains the fields used by the native Admin user-management APIs.
- `reports` uses statuses `new`, `reviewing`, `actioned`, and `dismissed`, which match the Admin moderation workflow.
- `verification_requests` uses statuses `pending`, `approved`, `rejected`, and `expired`, which match the Admin verification workflow.
- `dating_profiles.verification_level` supports `unverified`, `email`, `phone`, `photo`, and `identity`, matching Admin verification promotion logic.
- The security layer uses `public.account_enforcements` as the canonical restriction source. `heart_private.user_restricted()` blocks active temporary/permanent suspensions and feature/visibility restrictions.
- `heart_private.can_view_profile()` calls `user_restricted()` for both viewer and target, so security enforcement also removes restricted accounts from native discovery/profile visibility.
- The message insert guard calls `user_restricted()` for both participants, preserving enforcement at the database layer even if an edge route is bypassed.

## Admin account-state bridge

Migration `20260910124500_admin_security_reconciliation.sql` bridges `hc_user_admin_state` into `account_enforcements`.

Mappings:

- `restricted` -> `feature_restriction`
- `suspended` -> `temporary_suspension`
- `banned` -> `permanent_suspension`
- `deletion_pending` -> `visibility_restriction`
- `active` -> lifts only active enforcements whose `reason_code` begins with `admin_control_plane_`

The bridge deliberately does **not** lift unrelated moderation/security enforcements.

The bridge also stores `member_discoverable_before_enforcement` before an administrative restriction. This allows activation to restore the member's own prior discoverability choice instead of forcing all reactivated members visible or leaving formerly-visible members permanently hidden.

## Notification reconciliation

The security schema already contains `public.notifications` with member inbox fields and own-row RLS. Admin Phase 5 adds campaign/delivery metadata and native in-app delivery support.

Because the table already exists, the Phase 5 `CREATE TABLE IF NOT EXISTS` statement cannot add foreign keys that were only present in that table definition. The integration reconciliation migration therefore adds:

- `notifications_campaign_id_fkey`
- `notifications_delivery_id_fkey`

It also removes the older duplicate notification policy names only after the canonical `hc_notifications_*` policies from Phase 5 exist. RLS remains enabled, authenticated users receive SELECT access to their own rows, and updates remain limited to `is_read` and `read_at`.

## Native Admin bootstrap

The reconciliation migration bootstraps trusted existing `user_roles` into `hc_admin_staff` with `ON CONFLICT(user_id) DO NOTHING`, so explicit Admin Control Plane assignments take precedence. `content_editor` maps to `content_manager`; supported existing moderator/support/admin/super-admin roles map directly.

This bootstrap reduces the risk of locking the current super-admin out after the native Admin tables are enabled. Cloudflare owner allow-list configuration remains supported and recommended as an additional owner recovery path.

## Payments

No native `payment_transactions` or `hc_payment_transactions` table was detected during this review. The Admin Control Plane therefore remains read-only/unavailable for native payment operations rather than fabricating or duplicating legacy payment records. Existing secured legacy fallback remains in place.

## Legacy role RPC

`public.heart_connect_role_for_email(text)` still exists and has executable grants. No PostgreSQL dependency was detected, and repository search did not identify a current source reference, but this is not sufficient evidence that the live legacy/AppDeploy CMS no longer calls it. It must remain in place until live compatibility is confirmed after the combined preview/reconciliation process.

## Remaining environment prerequisites

The native Admin Control Plane requires `SUPABASE_SERVICE_ROLE_KEY` to be configured as a Cloudflare secret. Owner recovery should use `HEART_CONNECT_OWNER_EMAILS` and/or the existing owner/admin allow-list as a secret/secure environment value. These secrets must never be committed to Git.

Workers AI remains optional for core Admin operation but requires the `AI` binding for the Admin AI workspace.

## Production boundary

This review does not authorize a merge to `main`. Before production, the combined Cloudflare preview must be smoke-tested for public security flows and Admin flows, required Cloudflare secrets must be present, required migrations must be applied in order, readiness evidence must be captured, and explicit owner/super-admin production approval must be recorded.
