-- Isolated local fixture actors, transaction rolled back including broad test policies.
begin;
select set_config('test.owner', (select id::text from auth.users order by created_at limit 1), true);
select set_config('test.member', (select id::text from auth.users order by created_at offset 1 limit 1), true);
select set_config('test.outsider', (select id::text from auth.users order by created_at offset 2 limit 1), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
    g public.groups%rowtype;
    v_code text;
    v_topic text;
begin
    if current_setting('test.outsider') = '' then raise exception 'Three fabricated local actors required'; end if;
    perform set_config('request.jwt.claim.sub', current_setting('test.owner'), true);
    select 'QPR-' || lpad(n::text, 4, '0') into v_code from generate_series(0,9999) n
    where not exists (select 1 from public.groups where code = 'QPR-' || lpad(n::text,4,'0')) limit 1;
    g := public.create_group_v3_full(v_code, 'Typing privacy SQL test', '', 'free_reading', 'page', 'none', null, 'public',
        '{"canPostMessages":true,"canShareProgress":true,"canComment":true,"canInviteMembers":false}');
    perform set_config('test.group', g.id::text, true);
    perform set_config('test.code', g.code, true);
    v_topic := public.get_group_typing_channel_v1(g.code)->>'topic';
    if v_topic <> 'group-typing:v1:' || g.id::text || ':' || current_setting('test.owner') then
        raise exception 'Owner recipient scope incorrect';
    end if;
    perform set_config('request.jwt.claim.sub', current_setting('test.member'), true);
    perform public.join_group_v2_by_code(g.code, 'Continue');
    if public.can_receive_group_typing_v1(v_topic) then raise exception 'Member can read owner channel'; end if;
    if public.can_receive_group_typing_v1('group-typing:v1:------------------------------------:------------------------------------') then
        raise exception 'Malformed topic accepted';
    end if;
    perform public.publish_group_typing_v1(g.id, true);
    perform set_config('request.jwt.claim.sub', current_setting('test.outsider'), true);
    if not public.can_view_group(g.id) then raise exception 'Test must cover public group viewer'; end if;
    if public.can_receive_group_typing_v1('group-typing:v1:' || g.id::text || ':' || current_setting('test.outsider')) then
        raise exception 'Public non-member sees typing';
    end if;
    begin
        perform public.publish_group_typing_v1(g.id, true);
        raise exception 'Outsider published typing';
    exception when raise_exception then
        if sqlerrm <> 'GROUP_ACCESS_DENIED' then raise; end if;
    end;
end;
$$;
reset role;

-- Prove future permissive policies cannot accidentally bypass this reserved namespace.
create policy qa_typing_broad_read on realtime.messages for select to authenticated using (true);
create policy qa_typing_broad_write on realtime.messages for insert to authenticated with check (true);
select realtime.send('{"typing":false}', 'typing',
    'group-typing:v1:' || current_setting('test.group') || ':' || current_setting('test.member'), true);
select set_config('request.jwt.claim.sub', current_setting('test.member'), true);
select set_config('realtime.topic', 'group-typing:v1:' || current_setting('test.group') || ':' || current_setting('test.member'), true);
set local role authenticated;
do $$
declare
    v_own text := 'group-typing:v1:' || current_setting('test.group') || ':' || current_setting('test.member');
    v_other text := 'group-typing:v1:' || current_setting('test.group') || ':' || current_setting('test.owner');
begin
    if not exists(select 1 from realtime.messages where topic = v_own) then raise exception 'Own authorized message missing'; end if;
    if exists(select 1 from realtime.messages where topic = v_other) then raise exception 'Broad SELECT bypassed recipient guard'; end if;
    begin
        insert into realtime.messages(topic, extension, event, payload, private)
        values(v_own, 'broadcast', 'typing', '{"user_id":"forged"}', true);
        raise exception 'Broad INSERT bypassed server identity guard';
    exception when insufficient_privilege then null; end;
end;
$$;
reset role;

do $$
begin
    if has_function_privilege('anon', 'public.get_group_typing_channel_v1(text)', 'EXECUTE')
       or has_function_privilege('anon', 'public.publish_group_typing_v1(uuid,boolean)', 'EXECUTE') then
        raise exception 'Anonymous RPC execution granted';
    end if;
end;
$$;
rollback;
select 'PASS: exact recipient privacy, outsider/public-group denial, actor-bound RPC, anonymous denial and restrictive guards' as result;
