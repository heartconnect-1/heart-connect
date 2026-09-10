# Heart Connect Admin Phase 6

Phase 6 adds an operational command center to the isolated `admin-dashboard-upgrade-2026-09-10` branch. It does not modify the active security branch or production `main`.

## Scope

- Live privacy-minimized operational health checks.
- Click-through command-center cards for users, moderation, verification, notifications and other admin sections.
- Human-owned incident management with open, acknowledge, resolve and reopen states.
- Critical incident resolution confirmation.
- Launch-readiness gates with explicit evidence.
- Required launch gates cannot be waived.
- Manual and periodic health snapshots.
- Automatic creation/reopening of operational incidents only when a critical health condition is detected.
- Existing Phase 5 notification automation remains bounded and is still the only scheduled delivery action.

## Safety boundaries

Phase 6 health/incident automation does **not** ban or suspend members, approve or reject verification, refund or alter payments, delete content, publish content, or send social posts.

Health data excludes private message bodies, identity evidence, private media, credentials, payment secrets and sensitive profile traits. It uses aggregate counts, queue state, incident state and automation timestamps.

Automatic incidents are alerts for human review. They are not enforcement actions.

## Readiness gates

Required readiness items cover:

- Admin service-role configuration.
- Owner access configuration.
- Ordered admin migration review.
- Reconciliation with the latest security branch.
- Admin Worker CI.
- Combined Cloudflare preview testing.
- Healthy operational queues.
- Explicit production merge approval.

Workers AI and external social adapters are optional readiness items. Missing optional integrations do not make the core Admin Control Plane launch-ready or unready by themselves.

## Health logic

The command center reports `healthy`, `degraded`, `critical`, or `setup_required`.

Examples of operational signals include critical moderation cases, failed native in-app deliveries, moderation/verification backlog size, due notification campaigns, and automation heartbeat age. Thresholds are intentionally conservative and may be tuned after real staging traffic is observed.

Periodic snapshots are rate-limited in code: the five-minute Worker cron continues to run Phase 5 automation, while Phase 6 stores a health snapshot only when status changes or approximately once per hour. Critical health signals can create or reopen idempotent incidents.

## Deployment prerequisites

Do not apply `20260910121500_admin_phase6_command_center.sql` to the shared Supabase project until the active security branch is checkpointed and reconciliation is reviewed.

The combined candidate must preserve the security branch's latest Worker/native API implementation. The Admin wrapper should be layered on top only after both branches are reconciled.

No production merge is authorized by Phase 6 itself. The `production_merge_approved` readiness gate must be explicitly marked passed by the owner/super-admin with evidence after combined preview testing.
