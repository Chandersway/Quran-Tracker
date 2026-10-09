begin;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Generated inside the database: never copied to SQL source, app, Git or logs.
do $$ begin
    if not exists(select 1 from vault.secrets where name = 'group_push_dispatcher') then
        perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'group_push_dispatcher');
    end if;
end $$;

create or replace function public.verify_group_push_dispatcher_v1(p_token text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
    select exists(select 1 from vault.decrypted_secrets where name = 'group_push_dispatcher'
        and extensions.digest(decrypted_secret, 'sha256') = extensions.digest(p_token, 'sha256'));
$$;
create or replace function public.group_push_claim_allowed_v1(p_delivery uuid, p_claim uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
    select exists(select 1 from public.notification_deliveries d
        join public.group_notifications n on n.id = d.event_id
        join public.user_devices u on u.id = d.device_id and u.user_id = d.user_id
        join public.group_posts p on p.id = n.entity_id and p.status = 'published'
        where d.id = p_delivery and d.claim_token = p_claim and d.status = 'processing'
          and d.lease_until > now() and public.notification_group_push_allowed(d.event_id, d.device_id));
$$;
revoke all on function public.verify_group_push_dispatcher_v1(text) from public, anon, authenticated;
revoke all on function public.group_push_claim_allowed_v1(uuid,uuid) from public, anon, authenticated;
grant execute on function public.verify_group_push_dispatcher_v1(text) to service_role;
grant execute on function public.group_push_claim_allowed_v1(uuid,uuid) to service_role;

create or replace function public.dispatch_group_push_v1() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_token text;
begin
    if not exists(select 1 from public.notification_deliveries where
        (status = 'pending' and scheduled_at <= now()) or (status = 'processing' and lease_until < now())) then return; end if;
    select decrypted_secret into v_token from vault.decrypted_secrets where name = 'group_push_dispatcher';
    perform net.http_post(url := 'https://tboaaxcdnajgttdanfmb.supabase.co/functions/v1/group-push',
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_token, 'Content-Type', 'application/json'),
        body := '{}'::jsonb, timeout_milliseconds := 60000);
end $$;
revoke all on function public.dispatch_group_push_v1() from public, anon, authenticated;
-- pg_cron owns the only automatic invocation; retries also recover missed invocations.
select cron.schedule('group-push-dispatch-v1', '* * * * *', 'select public.dispatch_group_push_v1();');
commit;
