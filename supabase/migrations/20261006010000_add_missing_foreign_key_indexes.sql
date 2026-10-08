-- Performance hardening: add covering indexes for all foreign keys
-- identified by Supabase's unindexed_foreign_keys advisor.
-- No RLS, grants, or application behavior are changed.

create index if not exists hc_payment_transactions_profile_id_idx on public.hc_payment_transactions (profile_id);
create index if not exists hc_site_page_revisions_editor_user_id_idx on public.hc_site_page_revisions (editor_user_id);
create index if not exists reports_reviewed_by_idx on public.reports (reviewed_by);
create index if not exists stage4_activity_profile_id_idx on public.stage4_activity (profile_id);
create index if not exists stage6_community_members_user_id_idx on public.stage6_community_members (user_id);
create index if not exists stage6_date_feedback_target_user_id_idx on public.stage6_date_feedback (target_user_id);
create index if not exists stage6_date_feedback_user_id_idx on public.stage6_date_feedback (user_id);
create index if not exists stage6_date_plans_created_by_idx on public.stage6_date_plans (created_by);
create index if not exists stage6_date_plans_participant_a_idx on public.stage6_date_plans (participant_a);
create index if not exists stage6_date_plans_participant_b_idx on public.stage6_date_plans (participant_b);
create index if not exists stage6_event_checkins_user_id_idx on public.stage6_event_checkins (user_id);
create index if not exists stage6_event_rsvps_user_id_idx on public.stage6_event_rsvps (user_id);
create index if not exists stage6_events_owner_idx on public.stage6_events (owner);
create index if not exists stage6_introductions_first_user_idx on public.stage6_introductions (first_user);
create index if not exists stage6_introductions_introducer_idx on public.stage6_introductions (introducer);
create index if not exists stage6_introductions_second_user_idx on public.stage6_introductions (second_user);
create index if not exists stage6_memories_author_idx on public.stage6_memories (author);
create index if not exists stage6_memories_relationship_id_idx on public.stage6_memories (relationship_id);
create index if not exists stage6_moments_owner_idx on public.stage6_moments (owner);
create index if not exists stage6_private_sparks_user_b_idx on public.stage6_private_sparks (user_b);
create index if not exists stage6_relationships_user_a_idx on public.stage6_relationships (user_a);
create index if not exists stage6_relationships_user_b_idx on public.stage6_relationships (user_b);
create index if not exists stage6_reports_reporter_idx on public.stage6_reports (reporter);
create index if not exists stage6_safety_escalations_date_plan_id_idx on public.stage6_safety_escalations (date_plan_id);
create index if not exists stage6_safety_escalations_reporter_idx on public.stage6_safety_escalations (reporter);
create index if not exists stage6_safety_escalations_target_user_id_idx on public.stage6_safety_escalations (target_user_id);
create index if not exists verification_requests_reviewed_by_idx on public.verification_requests (reviewed_by);
