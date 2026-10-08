-- Least-privilege reconciliation for member-facing Data API tables.
revoke all privileges on table
  public.dating_profiles, public.profile_media, public.blocks, public.privacy_preferences,
  public.matches, public.swipe_actions, public.saved_profiles, public.messages,
  public.discovery_preferences, public.stage4_profile_details, public.stage4_activity,
  public.stage6_user_state, public.stage6_communities, public.stage6_community_members,
  public.stage6_relationships, public.stage6_date_plans, public.stage6_events,
  public.stage6_event_rsvps, public.stage6_event_checkins, public.stage6_reports,
  public.stage6_date_feedback, public.stage6_safety_escalations, public.stage6_memories,
  public.stage6_private_sparks, public.stage6_introductions, public.stage7_records,
  public.stage7_subscriptions, public.account_profiles, public.consent_events,
  public.verification_requests, public.security_events
from authenticated;

grant select, insert, update on public.dating_profiles to authenticated;
grant select, insert, update, delete on public.profile_media to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert, update, delete on public.privacy_preferences to authenticated;
grant select on public.matches to authenticated;
grant select, insert, update on public.swipe_actions to authenticated;
grant select, insert, delete on public.saved_profiles to authenticated;
grant select, insert, update on public.messages to authenticated;
grant select, insert, update on public.discovery_preferences to authenticated;
grant select, insert, update, delete on public.stage4_profile_details to authenticated;
grant select, insert on public.stage4_activity to authenticated;
grant select, insert, update, delete on public.stage6_user_state to authenticated;
grant select on public.stage6_communities to authenticated;
grant select, insert, update, delete on public.stage6_community_members to authenticated;
grant select, insert, update, delete on public.stage6_relationships to authenticated;
grant select, insert, update, delete on public.stage6_date_plans to authenticated;
grant select, insert, update on public.stage6_events to authenticated;
grant select, insert, update, delete on public.stage6_event_rsvps to authenticated;
grant select, insert on public.stage6_event_checkins to authenticated;
grant select, insert on public.stage6_reports to authenticated;
grant select, insert on public.stage6_date_feedback to authenticated;
grant select, insert on public.stage6_safety_escalations to authenticated;
grant select, insert, update, delete on public.stage6_memories to authenticated;
grant select, insert, update, delete on public.stage6_private_sparks to authenticated;
grant select, insert, update on public.stage6_introductions to authenticated;
grant select, insert, update on public.stage7_records to authenticated;
grant select, insert, delete on public.stage7_subscriptions to authenticated;
grant select, update on public.account_profiles to authenticated;
grant select, insert on public.consent_events to authenticated;
grant select, insert on public.verification_requests to authenticated;
grant select on public.security_events to authenticated;
