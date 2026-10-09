begin;

-- Only the trusted server chooses recipients; clients cannot enqueue deliveries.
alter table public.group_notifications add column if not exists source_key text;
create unique index if not exists group_notification_source_recipient
    on public.group_notifications(user_id, source_key) where source_key is not null;
alter table public.user_devices add column if not exists language_code text not null default 'nl';
alter table public.notification_deliveries add column if not exists claim_token uuid;

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
    return new;
end $$;
revoke all on function public.notify_group_comment() from public, anon, authenticated;
create trigger notify_group_comment after insert on public.post_comments
    for each row execute function public.notify_group_comment();

-- Token knowledge is required for registration/transfer; no arbitrary user ID is accepted.
-- One installation belongs to one current account, including after an offline account switch.
create or replace function public.register_push_device_v1(
    p_installation uuid, p_token text, p_enabled boolean,
    p_timezone text, p_quiet boolean, p_quiet_start integer, p_quiet_end integer, p_language text
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid();
begin
    if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
    if length(p_token) not between 20 and 4096 or p_quiet_start not between 0 and 1439
       or p_quiet_end not between 0 and 1439 or not exists(select 1 from pg_timezone_names where name = p_timezone)
       then raise exception 'INVALID_PUSH_DEVICE'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_installation::text, 0));
    update public.user_devices set active = false where installation_id = p_installation and user_id <> v_user;
    -- Reusing a rotated token must cancel deliveries for the old account first.
    update public.notification_deliveries set status = 'cancelled', lease_until = null
      where device_id in (select id from public.user_devices where push_token = p_token and user_id <> v_user)
      and status in ('pending', 'processing');
    delete from public.user_devices where push_token = p_token and (user_id <> v_user or installation_id <> p_installation);
    insert into public.user_devices(user_id, installation_id, push_token, platform, active, enabled,
        timezone, quiet_enabled, quiet_start, quiet_end, language_code)
    values(v_user, p_installation, p_token, 'android', true, p_enabled, p_timezone, p_quiet,
        p_quiet_start, p_quiet_end, case when p_language in ('nl','en','ar','fr') then p_language else 'en' end)
    on conflict(user_id, installation_id) do update set push_token = excluded.push_token,
        active = true, enabled = excluded.enabled, timezone = excluded.timezone,
        quiet_enabled = excluded.quiet_enabled, quiet_start = excluded.quiet_start,
        quiet_end = excluded.quiet_end, language_code = excluded.language_code, last_seen_at = now();
end $$;
create or replace function public.unregister_push_device_v1(p_installation uuid) returns void
language sql security definer set search_path = public, pg_temp as $$
    update public.user_devices set active = false
    where user_id = auth.uid() and installation_id = p_installation;
$$;
revoke all on function public.register_push_device_v1(uuid,text,boolean,text,boolean,integer,integer,text) from public, anon;
revoke all on function public.unregister_push_device_v1(uuid) from public, anon;
grant execute on function public.register_push_device_v1(uuid,text,boolean,text,boolean,integer,integer,text) to authenticated;
grant execute on function public.unregister_push_device_v1(uuid) to authenticated;

create or replace function public.get_group_push_target_v1(p_event uuid)
returns table(group_code text, post_id uuid)
language sql stable security definer set search_path = public, pg_temp as $$
    select g.code, p.id from public.group_notifications n
    join public.groups g on g.id = n.group_id and g.status = 'active'
    join public.group_members m on m.group_id = g.id and m.user_id = auth.uid() and m.status = 'active'
    join public.group_posts p on p.id = n.entity_id and p.group_id = g.id and p.status = 'published'
    where n.id = p_event and n.user_id = auth.uid() and n.entity_type = 'post';
$$;
revoke all on function public.get_group_push_target_v1(uuid) from public, anon;
grant execute on function public.get_group_push_target_v1(uuid) to authenticated;

-- Membership, preference and quiet-hours checks happen at send time, not just enqueue time.
create or replace function public.claim_group_push_v1()
returns table(delivery_id uuid, claim uuid, event_id uuid, recipient uuid, token text, language text, group_code text, post_id uuid)
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_claim uuid; v_minute integer;
begin
    for r in select n.id as delivery, n.event_id, n.user_id, n.device_id, n.attempts,
        e.entity_id, e.created_at as event_created, d.push_token, d.language_code,
        d.timezone, d.quiet_enabled, d.quiet_start, d.quiet_end, g.code,
        public.notification_group_push_allowed(n.event_id, n.device_id) as allowed
        from public.notification_deliveries n
        join public.group_notifications e on e.id = n.event_id
        join public.user_devices d on d.id = n.device_id and d.user_id = n.user_id
        join public.groups g on g.id = e.group_id
        where e.source_key like 'comment:%' and
          ((n.status = 'pending' and n.scheduled_at <= now())
           or (n.status = 'processing' and n.lease_until < now()))
        order by n.scheduled_at limit 5 for update of n skip locked
    loop
        if not r.allowed or r.event_created < now() - interval '24 hours' or r.attempts >= 5
           or not exists(select 1 from public.group_posts where id = r.entity_id and status = 'published') then
            update public.notification_deliveries set status = 'cancelled', lease_until = null where id = r.delivery;
            continue;
        end if;
        v_minute := extract(hour from now() at time zone r.timezone)::integer * 60
            + extract(minute from now() at time zone r.timezone)::integer;
        if r.quiet_enabled and r.quiet_start <> r.quiet_end and
           (case when r.quiet_start < r.quiet_end then v_minute >= r.quiet_start and v_minute < r.quiet_end
            else v_minute >= r.quiet_start or v_minute < r.quiet_end end) then
            update public.notification_deliveries set status = 'pending', scheduled_at = now() + interval '5 minutes',
                lease_until = null where id = r.delivery;
            continue;
        end if;
        v_claim := gen_random_uuid();
        update public.notification_deliveries set status = 'processing', claim_token = v_claim,
            attempts = attempts + 1, lease_until = now() + interval '2 minutes' where id = r.delivery;
        return query select r.delivery, v_claim, r.event_id, r.user_id, r.push_token,
            r.language_code, r.code, r.entity_id;
    end loop;
end $$;
create or replace function public.finish_group_push_v1(p_delivery uuid, p_claim uuid, p_result text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_device uuid;
begin
    if p_result not in ('sent','retry','invalid_token','failed') then raise exception 'INVALID_RESULT'; end if;
    update public.notification_deliveries set
        status = case when p_result = 'sent' then 'sent' when p_result = 'retry' and attempts < 5 then 'pending' else 'failed' end,
        sent_at = case when p_result = 'sent' then now() else null end,
        provider_error_code = case when p_result = 'sent' then null else p_result end,
        scheduled_at = now() + (power(2, attempts)::integer * interval '1 minute'), lease_until = null
    where id = p_delivery and claim_token = p_claim and status = 'processing'
    returning device_id into v_device;
    if p_result = 'invalid_token' and v_device is not null then
        update public.user_devices set active = false where id = v_device;
    end if;
end $$;
revoke all on function public.claim_group_push_v1() from public, anon, authenticated;
revoke all on function public.finish_group_push_v1(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.claim_group_push_v1() to service_role;
grant execute on function public.finish_group_push_v1(uuid,uuid,text) to service_role;
commit;
