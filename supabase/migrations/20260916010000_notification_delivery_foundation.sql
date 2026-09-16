begin;

-- Account-level group preferences. Local reminders continue to use the device's Room data.
create table public.notification_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    enabled boolean not null default true,
    mention boolean not null default true,
    reaction boolean not null default true,
    announcement boolean not null default true,
    invitation boolean not null default true,
    join_request boolean not null default true,
    "update" boolean not null default true,
    updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
create policy notification_preferences_self on public.notification_preferences
    for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.notification_preferences to authenticated;
create trigger notification_preferences_updated before update on public.notification_preferences
    for each row execute function public.group_v2_set_updated_at();

-- Tokens are separate from profiles and belong to exactly one account at a time.
create table public.user_devices (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    installation_id uuid not null,
    push_token text not null unique check (length(push_token) between 20 and 4096),
    platform text not null check (platform in ('android', 'ios')),
    active boolean not null default true,
    enabled boolean not null default true,
    timezone text not null default 'UTC',
    quiet_enabled boolean not null default false,
    quiet_start integer not null default 1320 check (quiet_start between 0 and 1439),
    quiet_end integer not null default 420 check (quiet_end between 0 and 1439),
    last_seen_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (user_id, installation_id)
);
alter table public.user_devices enable row level security;
create policy user_devices_self on public.user_devices for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.user_devices to authenticated;

create table public.notification_deliveries (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.group_notifications(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    device_id uuid not null references public.user_devices(id) on delete cascade,
    channel text not null default 'push' check (channel = 'push'),
    status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'cancelled', 'failed')),
    scheduled_at timestamptz not null default now(),
    lease_until timestamptz,
    attempts integer not null default 0,
    provider_error_code text,
    created_at timestamptz not null default now(),
    sent_at timestamptz,
    unique (event_id, user_id, device_id, channel)
);
create index notification_deliveries_due on public.notification_deliveries(scheduled_at) where status in ('pending', 'processing');
alter table public.notification_deliveries enable row level security;
create policy notification_deliveries_read_self on public.notification_deliveries
    for select to authenticated using (user_id = auth.uid());
grant select on public.notification_deliveries to authenticated;
revoke insert, update, delete on public.notification_deliveries from authenticated, anon;
grant all on public.notification_preferences, public.user_devices, public.notification_deliveries to service_role;

-- No recipient IDs or message payloads can be supplied by an untrusted client.
create function public.notification_group_push_allowed(p_event uuid, p_device uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
    select exists (
        select 1 from public.group_notifications n
        join public.user_devices d on d.id = p_device and d.user_id = n.user_id and d.active and d.enabled
        join public.group_members m on m.group_id = n.group_id and m.user_id = n.user_id and m.status = 'active'
        join public.groups g on g.id = n.group_id and g.status = 'active'
        left join public.notification_preferences p on p.user_id = n.user_id
        left join public.group_notification_preferences o on o.group_id = n.group_id and o.user_id = n.user_id
        where n.id = p_event and coalesce(p.enabled, true)
          and coalesce(o.push_enabled, true) and coalesce(o.level, 'important') <> 'muted'
          and (o.muted_until is null or o.muted_until <= now())
          and (coalesce(o.level, 'important') <> 'mentions' or n.type = 'mention')
          and case n.type
              when 'mention' then coalesce(p.mention, true)
              when 'reaction' then coalesce(p.reaction, true)
              when 'announcement' then coalesce(p.announcement, true)
              when 'invitation' then coalesce(p.invitation, true)
              when 'join_request' then coalesce(p.join_request, true)
              when 'update' then coalesce(p."update", true)
              when 'post' then coalesce(o.level, 'important') = 'all'
              else false
          end
    );
$$;
revoke all on function public.notification_group_push_allowed(uuid, uuid) from public, anon, authenticated;
grant execute on function public.notification_group_push_allowed(uuid, uuid) to service_role;

create function public.queue_group_notification_delivery() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
    insert into public.notification_deliveries(event_id, user_id, device_id)
    select new.id, new.user_id, d.id from public.user_devices d
    where d.user_id = new.user_id and public.notification_group_push_allowed(new.id, d.id)
    on conflict do nothing;
    return new;
end;
$$;
revoke all on function public.queue_group_notification_delivery() from public, anon, authenticated;
create trigger group_notification_delivery after insert on public.group_notifications
    for each row execute function public.queue_group_notification_delivery();

-- Delivery provider is intentionally not installed by this migration.
-- Its service-role worker must recheck membership/preferences/quiet hours when claiming and sending,
-- lease SKIP LOCKED batches, retry transient errors, and deactivate invalid tokens.
commit;
