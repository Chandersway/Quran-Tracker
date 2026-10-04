begin;

-- Supabase default grants can include TRUNCATE, which is not protected by RLS.
-- Allow only the operations needed by the client, in addition to existing RLS.
revoke all on public.notification_preferences, public.user_devices, public.notification_deliveries
    from public, anon, authenticated;
grant select, insert, update, delete on public.notification_preferences, public.user_devices to authenticated;
grant select on public.notification_deliveries to authenticated;

-- Retain historical rows for administrators. Current clients use the v2 tables.
alter table public.reading_group_feed_likes enable row level security;
alter table public.reading_group_feed_comments enable row level security;
revoke all on public.reading_group_feed_likes, public.reading_group_feed_comments
    from public, anon, authenticated;

commit;
