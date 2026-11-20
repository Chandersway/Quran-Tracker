begin;

-- Keep the Android v1 RPC stable for the existing Kotlin client. The Expo app
-- registers the native APNs token through this platform-aware successor.
create or replace function public.register_push_device_v2(
    p_installation uuid, p_token text, p_platform text, p_enabled boolean,
    p_timezone text, p_quiet boolean, p_quiet_start integer, p_quiet_end integer, p_language text
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid := auth.uid();
begin
    if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
    if p_platform not in ('android', 'ios') or length(p_token) not between 20 and 4096
       or p_quiet_start not between 0 and 1439 or p_quiet_end not between 0 and 1439
       or not exists(select 1 from pg_timezone_names where name = p_timezone)
       then raise exception 'INVALID_PUSH_DEVICE'; end if;
    perform pg_advisory_xact_lock(hashtextextended(p_installation::text, 0));
    update public.user_devices set active = false where installation_id = p_installation and user_id <> v_user;
    update public.notification_deliveries set status = 'cancelled', lease_until = null
      where device_id in (select id from public.user_devices where push_token = p_token and user_id <> v_user)
      and status in ('pending', 'processing');
    delete from public.user_devices where push_token = p_token and (user_id <> v_user or installation_id <> p_installation);
    insert into public.user_devices(user_id, installation_id, push_token, platform, active, enabled,
        timezone, quiet_enabled, quiet_start, quiet_end, language_code)
    values(v_user, p_installation, p_token, p_platform, true, p_enabled, p_timezone, p_quiet,
        p_quiet_start, p_quiet_end, case when p_language in ('nl','en','ar','fr') then p_language else 'en' end)
    on conflict(user_id, installation_id) do update set push_token = excluded.push_token,
        platform = excluded.platform, active = true, enabled = excluded.enabled, timezone = excluded.timezone,
        quiet_enabled = excluded.quiet_enabled, quiet_start = excluded.quiet_start,
        quiet_end = excluded.quiet_end, language_code = excluded.language_code, last_seen_at = now();
end $$;

revoke all on function public.register_push_device_v2(uuid,text,text,boolean,text,boolean,integer,integer,text) from public, anon;
grant execute on function public.register_push_device_v2(uuid,text,text,boolean,text,boolean,integer,integer,text) to authenticated;

-- v1 claims rows and takes locks. This wrapper adds the provider discriminator
-- from the claimed device without changing the existing v1 result contract.
create or replace function public.claim_group_push_v2()
returns table(delivery_id uuid, claim uuid, event_id uuid, recipient uuid, token text, language text,
    group_code text, post_id uuid, platform text)
language sql security definer set search_path = public, pg_temp as $$
    select c.delivery_id, c.claim, c.event_id, c.recipient, c.token, c.language,
        c.group_code, c.post_id, d.platform
    from public.claim_group_push_v1() c
    join public.notification_deliveries n on n.id = c.delivery_id
    join public.user_devices d on d.id = n.device_id;
$$;
revoke all on function public.claim_group_push_v2() from public, anon, authenticated;
grant execute on function public.claim_group_push_v2() to service_role;

commit;
