begin;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from auth.users order by created_at limit 1),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
    'test.second_user_id',
    coalesce((select id::text from auth.users order by created_at offset 1 limit 1), ''),
    true
);
set local role authenticated;

do $$
declare
    v_group public.groups%rowtype;
    v_owner_id uuid := (select auth.uid());
    v_second_user_id uuid := nullif(current_setting('test.second_user_id', true), '')::uuid;
    v_invitation record;
    v_request public.group_join_requests%rowtype;
begin
    v_group := public.create_group_v2_full(
        'MEM-6001', 'Membership action test', 'Rolled back after verification',
        'free_reading', 'page', 'none', null, 'restricted'
    );

    if (select count(*) from public.list_group_roles_v2(v_group.id)) <> 4 then
        raise exception 'Role list contract failed';
    end if;

    select * into v_invitation
    from public.create_group_invitation_v2(v_group.id, null, 7, 4);
    if v_invitation.token is null or v_invitation.max_uses <> 4 then
        raise exception 'Invitation creation contract failed';
    end if;

    if v_second_user_id is not null then
        perform set_config('request.jwt.claim.sub', v_second_user_id::text, true);
        perform public.accept_group_invitation_v2(v_invitation.token, 'Membership Tester');

        if not exists (
            select 1
            from public.group_members gm
            join public.group_roles gr on gr.id = gm.role_id
            where gm.group_id = v_group.id
              and gm.user_id = v_second_user_id
              and gm.status = 'active'
              and gr.key = 'member'
        ) then
            raise exception 'Invitation acceptance contract failed';
        end if;

        begin
            perform public.set_group_member_role_v2(v_group.id, v_owner_id, 'admin');
            raise exception 'Member unexpectedly managed owner role';
        exception
            when insufficient_privilege then null;
        end;

        perform set_config('request.jwt.claim.sub', v_owner_id::text, true);
        perform public.set_group_member_role_v2(v_group.id, v_second_user_id, 'moderator');
        if not exists (
            select 1
            from public.group_members gm
            join public.group_roles gr on gr.id = gm.role_id
            where gm.group_id = v_group.id
              and gm.user_id = v_second_user_id
              and gr.key = 'moderator'
        ) then
            raise exception 'Role assignment contract failed';
        end if;

        perform public.remove_group_member_v2(v_group.id, v_second_user_id, false);
        if (select status from public.group_members where group_id = v_group.id and user_id = v_second_user_id) <> 'left' then
            raise exception 'Member removal contract failed';
        end if;

        perform set_config('request.jwt.claim.sub', v_second_user_id::text, true);
        v_request := public.create_group_join_request_v2(v_group.code, 'Ik wil opnieuw deelnemen');
        if v_request.status <> 'pending' then
            raise exception 'Join request creation contract failed';
        end if;

        perform set_config('request.jwt.claim.sub', v_owner_id::text, true);
        perform public.review_group_join_request_v2(v_group.id, v_request.id, true);
        if (select status from public.group_members where group_id = v_group.id and user_id = v_second_user_id) <> 'active' then
            raise exception 'Join request approval contract failed';
        end if;

        perform public.remove_group_member_v2(v_group.id, v_second_user_id, true);
        if (select status from public.group_members where group_id = v_group.id and user_id = v_second_user_id) <> 'blocked' then
            raise exception 'Member block contract failed';
        end if;

        perform set_config('request.jwt.claim.sub', v_second_user_id::text, true);
        begin
            perform public.create_group_join_request_v2(v_group.code, 'Geblokkeerd verzoek');
            raise exception 'Blocked member unexpectedly created a join request';
        exception
            when insufficient_privilege then null;
        end;
        perform set_config('request.jwt.claim.sub', v_owner_id::text, true);
    end if;

    if (select count(*) from public.list_group_invitations_v2(v_group.id)) <> 1 then
        raise exception 'Invitation list contract failed';
    end if;
    perform public.revoke_group_invitation_v2(v_group.id, v_invitation.id);
    if (select status from public.group_invitations where id = v_invitation.id) <> 'revoked' then
        raise exception 'Invitation revocation contract failed';
    end if;

    if (
        select count(*) < (case when v_second_user_id is null then 2 else 7 end)
        from public.group_audit_log
        where group_id = v_group.id
          and action in (
              'invitation.created', 'invitation.revoked', 'member.role_changed',
              'member.removed', 'member.blocked', 'join_request.created',
              'join_request.approved'
          )
    ) then
        raise exception 'Membership audit events are missing';
    end if;
end;
$$;

reset role;
rollback;

select 'Group membership v2 actions OK; test data rolled back' as result;
