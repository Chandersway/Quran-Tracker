-- Run after 20261009120000. Uses two existing users only inside a rolled-back test group.
begin;
select set_config('test.owner', (select id::text from auth.users order by created_at limit 1), true);
select set_config('test.member', (select id::text from auth.users order by created_at offset 1 limit 1), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
do $$
declare
    g public.groups%rowtype;
    post public.group_posts%rowtype;
    off_settings jsonb := '{"canPostMessages":false,"canShareProgress":false,"canComment":false,"canInviteMembers":false}';
    on_settings jsonb := '{"canPostMessages":true,"canShareProgress":true,"canComment":true,"canInviteMembers":true}';
    owner_id uuid := current_setting('test.owner')::uuid;
    member_id uuid := current_setting('test.member')::uuid;
    code text;
begin
    if owner_id is null or member_id is null then raise exception 'Two test users required'; end if;
    perform set_config('request.jwt.claim.sub', owner_id::text, true);
    select 'PRM-' || lpad(n::text, 4, '0') into code from generate_series(0,9999) n
    where not exists (select 1 from public.groups where groups.code = 'PRM-' || lpad(n::text,4,'0')) limit 1;
    g := public.create_group_v3_full(code, 'Permission regression test', '', 'free_reading', 'page', 'none', null, 'public', off_settings);
    if public.get_group_member_permissions_v1(g.id) <> off_settings then raise exception 'Create did not persist settings'; end if;
    post := public.create_group_text_post_v2(g.id, 'Owner remains allowed');
    perform public.record_group_progress_v2(g.id, 'page', 1, 'test', true);

    perform set_config('request.jwt.claim.sub', member_id::text, true);
    perform public.join_group_v2_by_code(code, 'Regression member');
    if public.get_group_member_permissions_v1(g.id) <> off_settings then raise exception 'Cross-user settings mismatch'; end if;
    begin
        perform public.create_group_text_post_v2(g.id, 'Must be denied');
        raise exception 'Member post unexpectedly succeeded';
    exception when insufficient_privilege then null; end;
    begin
        perform public.record_group_progress_v2(g.id, 'page', 1, 'test', true);
        raise exception 'Member progress unexpectedly succeeded';
    exception when insufficient_privilege then null; end;
    begin
        perform public.add_group_post_comment_v2(g.id, post.id, 'Must be denied');
        raise exception 'Member comment unexpectedly succeeded';
    exception when insufficient_privilege then null; end;
    begin
        perform public.create_group_invitation_v2(g.id, null, 7, 2);
        raise exception 'Member invitation unexpectedly succeeded';
    exception when insufficient_privilege then null; end;
    begin
        perform public.set_group_member_permissions_v1(g.id, on_settings);
        raise exception 'Member changed settings';
    exception when insufficient_privilege then null; end;
    begin
        insert into public.group_posts(group_id, created_by, type, content)
        values(g.id, member_id, 'text', 'Direct bypass');
        raise exception 'Direct post bypass succeeded';
    exception when insufficient_privilege then null; end;

    perform set_config('request.jwt.claim.sub', owner_id::text, true);
    perform public.update_group_v3_full(g.id, g.name, '', g.goal_type, g.progress_unit, g.goal_period, null, g.privacy, on_settings);
    if public.get_group_member_permissions_v1(g.id) <> on_settings then raise exception 'Update did not persist settings'; end if;
    -- Invalid settings must roll back the group update too.
    begin
        perform public.update_group_v3_full(g.id, 'Must not persist', '', g.goal_type, g.progress_unit, g.goal_period, null, g.privacy, '{}');
        raise exception 'Invalid payload accepted';
    exception when invalid_parameter_value then null; end;
    if (select name from public.groups where id = g.id) <> g.name then raise exception 'Non-atomic update'; end if;

    perform set_config('request.jwt.claim.sub', member_id::text, true);
    perform public.create_group_text_post_v2(g.id, 'Re-enabled post');
    perform public.record_group_progress_v2(g.id, 'page', 1, 'test', true);
    perform public.add_group_post_comment_v2(g.id, post.id, 'Re-enabled comment');
    perform public.create_group_invitation_v2(g.id, null, 7, 2);

    -- Allow messages but disallow progress, including direct feed inserts.
    perform set_config('request.jwt.claim.sub', owner_id::text, true);
    perform public.set_group_member_permissions_v1(g.id, on_settings || '{"canShareProgress":false}');
    perform set_config('request.jwt.claim.sub', member_id::text, true);
    perform public.create_group_text_post_v2(g.id, 'Text still allowed');
    begin
        insert into public.group_posts(group_id, created_by, type, content, progress_unit, progress_amount)
        values(g.id, member_id, 'progress', 'Direct bypass', 'page', 1);
        raise exception 'Direct progress bypass succeeded';
    exception when insufficient_privilege then null; end;
end;
$$;
rollback;
select 'PASS: member permissions, persistence, authorization, RLS, re-enable and atomic rollback' as result;
