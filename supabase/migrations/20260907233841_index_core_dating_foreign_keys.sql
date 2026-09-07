create index if not exists messages_reply_to_id_idx on public.messages(reply_to_id) where reply_to_id is not null;
create index if not exists reports_reporter_id_idx on public.reports(reporter_id, created_at desc);
