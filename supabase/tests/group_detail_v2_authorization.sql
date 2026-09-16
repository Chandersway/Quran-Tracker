-- Transactional authorization test. ROLLBACK guarantees that no test group remains.
begin;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from auth.users order by created_at limit 1),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
    v_group public.groups%rowtype;
    v_role_count integer;
    v_member_count integer;
    v_audit_count integer;
    v_owner_permission_count integer;
    v_admin_permission_count integer;
    v_moderator_permission_count integer;
    v_member_permission_count integer;
begin
    v_group := public.create_group_v2(
        'TST-9001',
        'Foundation test group',
        'Rolled back after the test',
        'test',
        'nl',
        'private'
    );

    if not public.can_view_group(v_group.id) then
        raise exception 'Owner cannot view newly created group';
    end if;
    if public.group_role_rank(v_group.id) <> 100 then
        raise exception 'Owner rank was not bootstrapped';
    end if;
    if not public.has_group_permission(v_group.id, 'group.delete') then
        raise exception 'Owner does not have group.delete';
    end if;

    select count(*) into v_role_count
    from public.group_roles where group_id = v_group.id;
    if v_role_count <> 4 then
        raise exception 'Expected 4 roles, found %', v_role_count;
    end if;

    select count(*) into v_member_count
    from public.group_members where group_id = v_group.id;
    if v_member_count <> 1 then
        raise exception 'Expected one owner membership, found %', v_member_count;
    end if;

    select count(*) into v_audit_count
    from public.group_audit_log
    where group_id = v_group.id and action = 'group.created';
    if v_audit_count <> 1 then
        raise exception 'Creation audit event is missing';
    end if;

    select count(*) into v_owner_permission_count
    from public.group_role_permissions grp
    join public.group_roles gr on gr.id = grp.role_id
    where gr.group_id = v_group.id and gr.key = 'owner' and grp.allowed;

    select count(*) into v_admin_permission_count
    from public.group_role_permissions grp
    join public.group_roles gr on gr.id = grp.role_id
    where gr.group_id = v_group.id and gr.key = 'admin' and grp.allowed;

    select count(*) into v_moderator_permission_count
    from public.group_role_permissions grp
    join public.group_roles gr on gr.id = grp.role_id
    where gr.group_id = v_group.id and gr.key = 'moderator' and grp.allowed;

    select count(*) into v_member_permission_count
    from public.group_role_permissions grp
    join public.group_roles gr on gr.id = grp.role_id
    where gr.group_id = v_group.id and gr.key = 'member' and grp.allowed;

    if v_owner_permission_count <> 24
       or v_admin_permission_count <> 21
       or v_moderator_permission_count <> 12
       or v_member_permission_count <> 6 then
        raise exception 'Unexpected permission matrix: owner %, admin %, moderator %, member %',
            v_owner_permission_count, v_admin_permission_count,
            v_moderator_permission_count, v_member_permission_count;
    end if;

    begin
        insert into public.groups(code, name, owner_id)
        values ('TST-9002', 'Forbidden direct insert', (select auth.uid()));
        raise exception 'Direct group insert unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    perform public.soft_delete_group_v2(v_group.id);
    if public.can_view_group(v_group.id) then
        raise exception 'Soft-deleted group is still visible';
    end if;
end;
$$;

reset role;
rollback;

select 'Group Detail v2 authorization OK; test data rolled back' as result;
