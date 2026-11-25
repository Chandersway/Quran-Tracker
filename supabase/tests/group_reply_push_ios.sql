begin;
do $$
declare a uuid; b uuid; g public.groups%rowtype; p public.group_posts%rowtype;
    installation uuid := gen_random_uuid(); c public.post_comments%rowtype; claimed record;
    code text;
begin
    select id into a from auth.users order by created_at limit 1;
    select id into b from auth.users order by created_at offset 1 limit 1;
    if a is null or b is null then raise exception 'Two test identities required'; end if;
    select 'IOS-'||lpad(i::text,4,'0') into code from generate_series(0,9999) i
      where not exists(select 1 from public.groups where groups.code='IOS-'||lpad(i::text,4,'0')) limit 1;

    perform set_config('request.jwt.claim.sub', a::text, true);
    perform set_config('request.jwt.claim.role', 'authenticated', true);
    g := public.create_group_v2_full(code, 'APNs rollback test', '', 'free_reading', 'page', 'none', null, 'public');
    p := public.create_group_text_post_v2(g.id, 'APNs push contract fixture');
    insert into public.notification_preferences(user_id, enabled, reaction) values(a, true, true)
      on conflict(user_id) do update set enabled=true, reaction=true;
    perform public.register_push_device_v2(installation, 'test-only-apns-device-token-'||installation,
      'ios', true, 'Europe/Amsterdam', false, 1320, 420, 'en');
    if not exists(select 1 from public.user_devices where user_id=a and installation_id=installation
      and platform='ios' and active and enabled) then raise exception 'APNs token was not registered as iOS'; end if;

    perform set_config('request.jwt.claim.sub', b::text, true);
    perform public.join_group_v2_by_code(code, 'iOS member');
    c := public.add_group_post_comment_v2(g.id, p.id, 'Queue an iOS reply');
    perform set_config('request.jwt.claim.sub', a::text, true);
    select * into claimed from public.claim_group_push_v2();
    if claimed.delivery_id is null or claimed.platform <> 'ios' then
      raise exception 'Claimed delivery did not expose the iOS provider';
    end if;
    if claimed.event_id is null or claimed.recipient <> a or claimed.group_code <> code or claimed.post_id <> p.id then
      raise exception 'Claim wrapper changed existing delivery fields';
    end if;
end $$;
rollback;
select 'PASS: APNs registration and platform-aware claim contract' as result;
