# Heart Connect Admin Phase 5

Phase 5 adds an advisory Admin AI workspace, native in-app notification delivery, and bounded operational automation to the isolated `admin-dashboard-upgrade-2026-09-10` branch.

## Scope

- Admin AI operations briefs and role-scoped summaries.
- Explicitly saved AI drafts. Saving a draft never executes an admin action.
- Scheduled campaign queueing for due notification campaigns.
- Native Heart Connect in-app delivery into `public.notifications`.
- Idempotent delivery using a unique `source_key` per queue item.
- Bounded manual automation runs with typed `RUN` confirmation.
- A five-minute Cloudflare cron entry in the branch-only Wrangler configuration.
- Append-oriented automation run evidence.

## Deliberately disabled

Phase 5 does **not** send email or push notifications and does not publish to Facebook, TikTok, or Google Business. Queue records for unsupported email/push channels are marked `skipped` with `adapter_not_implemented`; they are never represented as delivered.

Provider credentials remain Cloudflare secrets and are never editable or readable from the browser admin dashboard.

## AI safety boundary

Admin AI is advisory only. It cannot ban or suspend a member, approve or reject identity verification, refund or mark payments successful, delete content, publish content, or send notifications. High-impact decisions require an authorized human admin.

AI context is bounded to operational fields and aggregate counts. Private message bodies, identity evidence, credentials, payment secrets, private media, and sensitive profile traits are excluded.

## Notification delivery behavior

The native delivery worker claims one queue item before inserting a notification. A unique source key (`admin-campaign:<delivery-id>`) prevents duplicate member notifications if a Worker retries after a partial failure.

Failed native delivery attempts use exponential retry delays and stop after the configured maximum attempt count. Campaign completion is derived from delivery queue evidence; a campaign is not marked sent merely because it was queued.

## Deployment prerequisites

Do not apply `20260910120000_admin_phase5_ai_notifications_automation.sql` to the shared Supabase project until the security-stabilization branch has been reconciled and reviewed. The Cloudflare Worker also requires `SUPABASE_SERVICE_ROLE_KEY` as a secret for server-side admin data access. Admin AI requires the `AI` binding and may optionally use `ADMIN_AI_MODEL`.

The branch validation workflow enforces that this branch changes only approved admin paths and performs a Wrangler dry-run without deploying to production.
