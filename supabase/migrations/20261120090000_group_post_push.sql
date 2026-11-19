begin;

-- Ordinary published posts require all-updates mode, matching the settings RPC's
-- default when there is no per-group override. Explicit important excludes posts.
create or replace function public.notification_group_push_allowed(p_event uuid, p_device uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
    select exists (
        select 1 from public.group_notifications n
        join public.user_devices d on d.id = p_device and d.user_id = n.user_id and d.active and d.enabled
        join public.group_members m on m.group_id = n.group_id and m.user_id = n.user_id and m.status = 'active'
        join public.groups g on g.id = n.group_id and g.status = 'active'
        left join public.notification_preferences p on p.user_id = n.user_id
        left join public.group_notification_preferences o on o.group_id = n.group_id and o.user_id = n.user_id
        where n.id = p_event and coalesce(p.enabled, true)
          and coalesce(o.push_enabled, true) and coalesce(o.level, 'all') <> 'muted'
          and (o.muted_until is null or o.muted_until <= now())
          and (coalesce(o.level, 'all') <> 'mentions' or n.type = 'mention')
          and case n.type
              when 'mention' then coalesce(p.mention, true)
              when 'reaction' then coalesce(p.reaction, true)
              when 'announcement' then coalesce(p.announcement, true)
              when 'invitation' then coalesce(p.invitation, true)
              when 'join_request' then coalesce(p.join_request, true)
              when 'update' then coalesce(p."update", true)
                  and (coalesce(n.source_key, '') not like 'post:%' or coalesce(o.level, 'all') = 'all')
              when 'post' then coalesce(o.level, 'all') = 'all'
              else false
          end
    );
$$;

-- Existing reply RPCs remain stable for installed clients. New workers claim both
-- categories, carrying an explicit kind that the recipient validates on opening.
create function public.claim_group_push_v3()
returns table(delivery_id uuid, claim uuid, event_id uuid, recipient uuid, token text, language text, group_code text, post_id uuid, platform text, kind text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_claim uuid; v_minute integer;
begin
    for r in select n.id as delivery, n.event_id, n.user_id, n.device_id, n.attempts,
        e.entity_id, e.created_at as event_created, d.push_token, d.language_code,
        d.timezone, d.quiet_enabled, d.quiet_start, d.quiet_end, d.platform, g.code,
        case when e.type = 'update' and e.source_key = 'post:' || e.entity_id then 'group_post'
             when e.type = 'reaction' and e.source_key like 'comment:%' then 'group_reply' end as kind,
        public.notification_group_push_allowed(n.event_id, n.device_id) as allowed
        from public.notification_deliveries n
        join public.group_notifications e on e.id = n.event_id
        join public.user_devices d on d.id = n.device_id and d.user_id = n.user_id
        join public.groups g on g.id = e.group_id
        where e.entity_type = 'post' and
          ((e.type = 'update' and e.source_key = 'post:' || e.entity_id)
           or (e.type = 'reaction' and e.source_key like 'comment:%')) and
          ((n.status = 'pending' and n.scheduled_at <= now())
           or (n.status = 'processing' and n.lease_until < now()))
        order by n.scheduled_at limit 5 for update of n skip locked
    loop
        if not r.allowed or r.event_created < now() - interval '24 hours' or r.attempts >= 5
           or not exists(select 1 from public.group_posts p where p.id = r.entity_id
               and p.group_id = (select e.group_id from public.group_notifications e where e.id = r.event_id)
               and p.status = 'published') then
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
            r.language_code, r.code, r.entity_id, r.platform, r.kind;
    end loop;
end $$;
revoke all on function public.claim_group_push_v3() from public, anon, authenticated;
grant execute on function public.claim_group_push_v3() to service_role;

create function public.get_group_push_target_v2(p_event uuid)
returns table(group_code text, post_id uuid, kind text)
language sql stable security definer set search_path = public, pg_temp as $$
    select g.code, p.id,
        case when n.type = 'update' then 'group_post' else 'group_reply' end
    from public.group_notifications n
    join public.groups g on g.id = n.group_id and g.status = 'active'
    join public.group_members m on m.group_id = g.id and m.user_id = auth.uid() and m.status = 'active'
    join public.group_posts p on p.id = n.entity_id and p.group_id = g.id and p.status = 'published'
    where n.id = p_event and n.user_id = auth.uid() and n.entity_type = 'post'
      and ((n.type = 'update' and n.source_key = 'post:' || p.id)
        or (n.type = 'reaction' and n.source_key like 'comment:%'));
$$;
revoke all on function public.get_group_push_target_v2(uuid) from public, anon;
grant execute on function public.get_group_push_target_v2(uuid) to authenticated;

-- Do not fall back to a hosted project. Missing configuration keeps queued work
-- available for the existing minute-based cron retry after configuration is fixed.
create or replace function public.dispatch_group_push_v1() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_token text; v_base text; v_count integer; i integer;
begin
    select rtrim(decrypted_secret, '/') into v_base from vault.decrypted_secrets where name = 'group_push_base_url';
    if v_base is null or not (v_base ~ '^https://[a-zA-Z0-9][a-zA-Z0-9.-]*(:[0-9]{1,5})?$'
        or v_base ~ '^http://(localhost|127[.]0[.]0[.]1)(:[0-9]{1,5})?$') then return; end if;
    select decrypted_secret into v_token from vault.decrypted_secrets where name = 'group_push_dispatcher';
    if v_token is null or length(v_token) < 32 then return; end if;
    select count(*) into v_count from (
        select d.id from public.notification_deliveries d
        join public.group_notifications n on n.id = d.event_id
        where n.entity_type = 'post' and
          ((n.type = 'update' and n.source_key = 'post:' || n.entity_id)
           or (n.type = 'reaction' and n.source_key like 'comment:%')) and
          ((d.status = 'pending' and d.scheduled_at <= now())
           or (d.status = 'processing' and d.lease_until < now())) limit 50
    ) due;
    for i in 1..((v_count + 4) / 5) loop
        perform net.http_post(url := v_base || '/functions/v1/group-push',
            headers := jsonb_build_object('Authorization', 'Bearer ' || v_token, 'Content-Type', 'application/json'),
            body := '{}'::jsonb, timeout_milliseconds := 60000);
    end loop;
end $$;
revoke all on function public.dispatch_group_push_v1() from public, anon, authenticated;

create function public.notify_group_post() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
    if new.status <> 'published' then return new; end if;
    insert into public.group_notifications(group_id, user_id, type, title, body, entity_type, entity_id, source_key)
    select new.group_id, m.user_id, 'update', 'Nieuw groepsbericht', '', 'post', new.id, 'post:' || new.id
    from public.group_members m join public.groups g on g.id = m.group_id and g.status = 'active'
    where m.group_id = new.group_id and m.status = 'active' and m.user_id <> new.created_by
    on conflict do nothing;
    begin
        perform public.dispatch_group_push_v1();
    exception when others then
        raise warning 'Immediate group push deferred to scheduled retry';
    end;
    return new;
end $$;
revoke all on function public.notify_group_post() from public, anon, authenticated;
create trigger notify_group_post after insert on public.group_posts
for each row execute function public.notify_group_post();

commit;
