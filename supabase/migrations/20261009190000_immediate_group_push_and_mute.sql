begin;

-- Cancel already queued/claimed work when preferences become more restrictive.
-- Re-enabling never resurrects messages that were muted.
create or replace function public.cancel_muted_group_push_v1() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
    update public.notification_deliveries d set status = 'cancelled', lease_until = null
    where d.user_id = new.user_id and d.status in ('pending', 'processing')
      and not public.notification_group_push_allowed(d.event_id, d.device_id);
    return new;
end $$;
revoke all on function public.cancel_muted_group_push_v1() from public, anon, authenticated;
create trigger cancel_muted_group_push after insert or update on public.group_notification_preferences
for each row execute function public.cancel_muted_group_push_v1();
create trigger cancel_disabled_group_push after insert or update on public.notification_preferences
for each row execute function public.cancel_muted_group_push_v1();

create or replace function public.dispatch_group_push_v1() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_token text; v_count integer; i integer;
begin
    -- One worker claims five rows. Bounded fan-out avoids making other recipients
    -- wait a minute; excess/retries are still recovered by the existing cron job.
    select count(*) into v_count from (
        select d.id from public.notification_deliveries d
        join public.group_notifications n on n.id = d.event_id
        where n.source_key like 'comment:%' and
          ((d.status = 'pending' and d.scheduled_at <= now())
          or (d.status = 'processing' and d.lease_until < now()))
        limit 50
    ) due;
    if v_count = 0 then return; end if;
    select decrypted_secret into v_token from vault.decrypted_secrets where name = 'group_push_dispatcher';
    for i in 1..((v_count + 4) / 5) loop
        perform net.http_post(url := 'https://tboaaxcdnajgttdanfmb.supabase.co/functions/v1/group-push',
            headers := jsonb_build_object('Authorization', 'Bearer ' || v_token, 'Content-Type', 'application/json'),
            body := '{}'::jsonb, timeout_milliseconds := 60000);
    end loop;
end $$;
revoke all on function public.dispatch_group_push_v1() from public, anon, authenticated;

create or replace function public.notify_group_comment() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
    if new.status <> 'published' then return new; end if;
    insert into public.group_notifications(group_id, user_id, type, title, body, entity_type, entity_id, source_key)
    select new.group_id, m.user_id, 'reaction', 'Nieuwe reactie', '', 'post', new.post_id, 'comment:' || new.id
    from public.group_members m
    where m.group_id = new.group_id and m.status = 'active' and m.user_id <> new.created_by
      and exists (select 1 from public.group_posts p where p.id = new.post_id and p.status = 'published'
        and (p.created_by = m.user_id or exists (
            select 1 from public.post_comments c where c.post_id = p.id
            and c.created_by = m.user_id and c.status = 'published' and c.id <> new.id)))
    on conflict do nothing;
    -- pg_net executes after commit: posting a reply never waits for FCM.
    begin
        perform public.dispatch_group_push_v1();
    exception when others then
        raise warning 'Immediate group push deferred to scheduled retry';
    end;
    return new;
end $$;
revoke all on function public.notify_group_comment() from public, anon, authenticated;
commit;
