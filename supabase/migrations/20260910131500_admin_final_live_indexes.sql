-- Heart Connect Admin final-live supporting indexes.
-- These indexes cover foreign-key columns used by the server-only Admin control plane
-- and its CMS/notification support tables. They do not change RLS or member access.

create index if not exists hc_admin_ai_drafts_created_by_idx on public.hc_admin_ai_drafts(created_by);
create index if not exists hc_admin_automation_runs_actor_user_idx on public.hc_admin_automation_runs(actor_user_id);
create index if not exists hc_admin_automation_settings_updated_by_idx on public.hc_admin_automation_settings(updated_by);
create index if not exists hc_admin_health_snapshots_actor_user_idx on public.hc_admin_health_snapshots(actor_user_id);
create index if not exists hc_admin_incidents_acknowledged_by_idx on public.hc_admin_incidents(acknowledged_by);
create index if not exists hc_admin_incidents_created_by_idx on public.hc_admin_incidents(created_by);
create index if not exists hc_admin_incidents_resolved_by_idx on public.hc_admin_incidents(resolved_by);
create index if not exists hc_admin_markets_updated_by_idx on public.hc_admin_markets(updated_by);
create index if not exists hc_admin_readiness_checked_by_idx on public.hc_admin_readiness_checks(checked_by);
create index if not exists hc_admin_report_presets_created_by_idx on public.hc_admin_report_presets(created_by);
create index if not exists hc_admin_report_presets_updated_by_idx on public.hc_admin_report_presets(updated_by);
create index if not exists hc_admin_security_reviews_reviewed_by_idx on public.hc_admin_security_reviews(reviewed_by);
create index if not exists hc_admin_staff_created_by_idx on public.hc_admin_staff(created_by);
create index if not exists hc_admin_trash_events_actor_user_idx on public.hc_admin_trash_events(actor_user_id);
create index if not exists hc_cms_media_deleted_by_idx on public.hc_cms_media(deleted_by);
create index if not exists hc_cms_media_uploaded_by_idx on public.hc_cms_media(uploaded_by);
create index if not exists hc_cms_post_revisions_editor_user_idx on public.hc_cms_post_revisions(editor_user_id);
create index if not exists hc_cms_posts_author_user_idx on public.hc_cms_posts(author_user_id);
create index if not exists hc_cms_posts_deleted_by_idx on public.hc_cms_posts(deleted_by);
create index if not exists hc_cms_posts_featured_media_idx on public.hc_cms_posts(featured_media_id);
create index if not exists hc_cms_posts_last_editor_user_idx on public.hc_cms_posts(last_editor_user_id);
create index if not exists hc_notification_campaigns_created_by_idx on public.hc_notification_campaigns(created_by);
create index if not exists hc_notification_campaigns_deleted_by_idx on public.hc_notification_campaigns(deleted_by);
create index if not exists hc_notification_campaigns_updated_by_idx on public.hc_notification_campaigns(updated_by);
create index if not exists hc_notification_delivery_queue_recipient_idx on public.hc_notification_delivery_queue(recipient_user_id);
create index if not exists hc_site_pages_created_by_idx on public.hc_site_pages(created_by);
create index if not exists hc_site_pages_deleted_by_idx on public.hc_site_pages(deleted_by);
create index if not exists hc_site_pages_updated_by_idx on public.hc_site_pages(updated_by);
create index if not exists hc_site_settings_deleted_by_idx on public.hc_site_settings(deleted_by);
create index if not exists hc_site_settings_updated_by_idx on public.hc_site_settings(updated_by);
create index if not exists hc_social_connections_updated_by_idx on public.hc_social_connections(updated_by);
create index if not exists hc_user_admin_state_last_action_by_idx on public.hc_user_admin_state(last_action_by);
create index if not exists notifications_campaign_id_idx on public.notifications(campaign_id);
create index if not exists notifications_delivery_id_idx on public.notifications(delivery_id);
