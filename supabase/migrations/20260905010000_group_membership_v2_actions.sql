begin;

create or replace function public.list_group_roles_v2(p_group_id uuid)
returns table (
    key text,
    name text,
    rank smallint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select gr.key, gr.name, gr.rank
    from public.group_roles gr
    where gr.group_id = p_group_id
      and public.can_view_group(p_group_id)
    order by gr.rank desc, gr.name;
$$;

create or replace function public.set_group_member_role_v2(
    p_group_id uuid,
    p_user_id uuid,
    p_role_key text
)
returns public.group_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_actor_rank smallint;
    v_target public.group_members%rowtype;
    v_target_rank smallint;
    v_role public.group_roles%rowtype;
begin
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if v_actor_id = p_user_id then
        raise exception using errcode = '42501', message = 'MEMBER_SELF_MANAGEMENT_DENIED';
    end if;
    if not public.has_group_permission(p_group_id, 'role.assign') then
        raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED';
    end if;

    v_actor_rank := public.group_role_rank(p_group_id);

    select gm.* into v_target
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
      and gm.status = 'active'
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_MEMBER_NOT_FOUND';
    end if;

    select gr.rank into v_target_rank
    from public.group_roles gr
    where gr.id = v_target.role_id and gr.group_id = p_group_id;

    select gr.* into v_role
    from public.group_roles gr
    where gr.group_id = p_group_id
      and gr.key = lower(trim(p_role_key));
    if not found or v_role.key = 'owner' then
        raise exception using errcode = '22023', message = 'GROUP_ROLE_INVALID';
    end if;
    if v_target_rank >= v_actor_rank or v_role.rank >= v_actor_rank then
        raise exception using errcode = '42501', message = 'GROUP_ROLE_RANK_DENIED';
    end if;

    update public.group_members
    set role_id = v_role.id
    where id = v_target.id
    returning * into v_target;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id,
        v_actor_id,
        'member.role_changed',
        'member',
        p_user_id,
        jsonb_build_object('role', v_role.key)
    );
    return v_target;
end;
$$;

create or replace function public.remove_group_member_v2(
    p_group_id uuid,
    p_user_id uuid,
    p_block boolean default false
)
returns public.group_members
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_actor_rank smallint;
    v_target_rank smallint;
    v_target public.group_members%rowtype;
begin
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if v_actor_id = p_user_id then
        raise exception using errcode = '42501', message = 'MEMBER_SELF_MANAGEMENT_DENIED';
    end if;
    if not public.has_group_permission(p_group_id, 'member.remove') then
        raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED';
    end if;

    v_actor_rank := public.group_role_rank(p_group_id);
    select gm.* into v_target
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
      and gm.status in ('active', 'suspended')
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_MEMBER_NOT_FOUND';
    end if;
    select gr.rank into v_target_rank
    from public.group_roles gr
    where gr.id = v_target.role_id and gr.group_id = p_group_id;
    if v_target_rank >= v_actor_rank then
        raise exception using errcode = '42501', message = 'GROUP_ROLE_RANK_DENIED';
    end if;

    update public.group_members
    set status = case when p_block then 'blocked' else 'left' end
    where id = v_target.id
    returning * into v_target;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id,
        v_actor_id,
        case when p_block then 'member.blocked' else 'member.removed' end,
        'member',
        p_user_id,
        jsonb_build_object('blocked', p_block)
    );
    return v_target;
end;
$$;

create or replace function public.create_group_invitation_v2(
    p_group_id uuid,
    p_invited_email text default null,
    p_expires_days integer default 7,
    p_max_uses integer default 10
)
returns table (
    id uuid,
    token text,
    invited_email text,
    status text,
    max_uses integer,
    use_count integer,
    expires_at timestamptz,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_role_id uuid;
    v_token text;
    v_email text := nullif(lower(trim(p_invited_email)), '');
    v_max_uses integer;
    v_invitation public.group_invitations%rowtype;
begin
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'invitation.create') then
        raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED';
    end if;
    if p_expires_days not between 1 and 30 then
        raise exception using errcode = '22023', message = 'INVITATION_EXPIRY_INVALID';
    end if;
    if v_email is not null and v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
        raise exception using errcode = '22023', message = 'INVITATION_EMAIL_INVALID';
    end if;

    select gr.id into v_role_id
    from public.group_roles gr
    where gr.group_id = p_group_id and gr.key = 'member';
    if v_role_id is null then
        raise exception using errcode = 'P0002', message = 'GROUP_ROLE_NOT_FOUND';
    end if;

    v_max_uses := case
        when v_email is not null then 1
        else greatest(2, least(coalesce(p_max_uses, 10), 100))
    end;
    v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');

    insert into public.group_invitations (
        group_id, token_hash, role_id, invited_email, status,
        max_uses, use_count, expires_at, created_by
    ) values (
        p_group_id,
        encode(extensions.digest(v_token, 'sha256'), 'hex'),
        v_role_id,
        v_email,
        'active',
        v_max_uses,
        0,
        now() + make_interval(days => p_expires_days),
        v_actor_id
    ) returning * into v_invitation;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id,
        v_actor_id,
        'invitation.created',
        'member',
        v_invitation.id,
        jsonb_build_object('email_targeted', v_email is not null, 'max_uses', v_max_uses)
    );

    return query select
        v_invitation.id,
        v_token,
        v_invitation.invited_email,
        v_invitation.status,
        v_invitation.max_uses,
        v_invitation.use_count,
        v_invitation.expires_at,
        v_invitation.created_at;
end;
$$;

create or replace function public.list_group_invitations_v2(p_group_id uuid)
returns table (
    id uuid,
    invited_email text,
    status text,
    max_uses integer,
    use_count integer,
    expires_at timestamptz,
    created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        gi.id, gi.invited_email, gi.status, gi.max_uses,
        gi.use_count, gi.expires_at, gi.created_at
    from public.group_invitations gi
    where gi.group_id = p_group_id
      and public.has_group_permission(p_group_id, 'invitation.create')
    order by gi.created_at desc
    limit 50;
$$;

create or replace function public.revoke_group_invitation_v2(
    p_group_id uuid,
    p_invitation_id uuid
)
returns public.group_invitations
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_invitation public.group_invitations%rowtype;
begin
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'invitation.create') then
        raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED';
    end if;

    update public.group_invitations
    set status = 'revoked'
    where id = p_invitation_id
      and group_id = p_group_id
      and status = 'active'
    returning * into v_invitation;
    if not found then
        raise exception using errcode = 'P0002', message = 'INVITATION_NOT_FOUND';
    end if;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id)
    values (p_group_id, v_actor_id, 'invitation.revoked', 'member', p_invitation_id);
    return v_invitation;
end;
$$;

create or replace function public.accept_group_invitation_v2(
    p_token text,
    p_display_name text default null
)
returns public.groups
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_user_email text := lower(coalesce((select auth.jwt() ->> 'email'), ''));
    v_invitation public.group_invitations%rowtype;
    v_membership public.group_members%rowtype;
    v_group public.groups%rowtype;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;

    select gi.* into v_invitation
    from public.group_invitations gi
    where gi.token_hash = encode(extensions.digest(trim(p_token), 'sha256'), 'hex')
      and gi.status = 'active'
      and gi.expires_at > now()
      and gi.use_count < gi.max_uses
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'INVITATION_INVALID_OR_EXPIRED';
    end if;
    if v_invitation.invited_email is not null
       and lower(v_invitation.invited_email) <> v_user_email then
        raise exception using errcode = '42501', message = 'INVITATION_EMAIL_MISMATCH';
    end if;

    select gm.* into v_membership
    from public.group_members gm
    where gm.group_id = v_invitation.group_id and gm.user_id = v_user_id
    for update;
    if found and v_membership.status = 'blocked' then
        raise exception using errcode = '42501', message = 'GROUP_MEMBER_BLOCKED';
    end if;

    insert into public.group_members (
        group_id, user_id, role_id, status, invited_by, display_name_snapshot, joined_at
    ) values (
        v_invitation.group_id,
        v_user_id,
        v_invitation.role_id,
        'active',
        v_invitation.created_by,
        left(nullif(trim(p_display_name), ''), 80),
        now()
    )
    on conflict (group_id, user_id) do update
    set role_id = excluded.role_id,
        status = 'active',
        invited_by = excluded.invited_by,
        joined_at = now(),
        display_name_snapshot = coalesce(excluded.display_name_snapshot, public.group_members.display_name_snapshot);

    update public.group_invitations
    set use_count = use_count + 1,
        status = case when use_count + 1 >= max_uses then 'accepted' else 'active' end
    where id = v_invitation.id;

    select g.* into v_group
    from public.groups g
    where g.id = v_invitation.group_id and g.status = 'active' and g.deleted_at is null;
    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_NOT_FOUND';
    end if;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        v_group.id,
        v_user_id,
        'invitation.accepted',
        'member',
        v_user_id,
        jsonb_build_object('invitation_id', v_invitation.id)
    );
    return v_group;
end;
$$;

create or replace function public.create_group_join_request_v2(
    p_code text,
    p_message text default ''
)
returns public.group_join_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_group public.groups%rowtype;
    v_membership public.group_members%rowtype;
    v_request public.group_join_requests%rowtype;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if char_length(trim(coalesce(p_message, ''))) > 500 then
        raise exception using errcode = '22023', message = 'JOIN_REQUEST_MESSAGE_TOO_LONG';
    end if;

    select g.* into v_group
    from public.groups g
    where g.code = upper(trim(p_code)) and g.status = 'active' and g.deleted_at is null;
    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_NOT_FOUND';
    end if;
    if v_group.privacy = 'private' then
        raise exception using errcode = '42501', message = 'GROUP_INVITATION_REQUIRED';
    end if;

    select gm.* into v_membership
    from public.group_members gm
    where gm.group_id = v_group.id and gm.user_id = v_user_id;
    if found and v_membership.status = 'blocked' then
        raise exception using errcode = '42501', message = 'GROUP_MEMBER_BLOCKED';
    end if;
    if found and v_membership.status = 'active' then
        raise exception using errcode = '23505', message = 'ALREADY_GROUP_MEMBER';
    end if;

    select gjr.* into v_request
    from public.group_join_requests gjr
    where gjr.group_id = v_group.id
      and gjr.user_id = v_user_id
      and gjr.status = 'pending';
    if found then
        return v_request;
    end if;

    insert into public.group_join_requests(group_id, user_id, message, status)
    values (v_group.id, v_user_id, trim(coalesce(p_message, '')), 'pending')
    returning * into v_request;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id)
    values (v_group.id, v_user_id, 'join_request.created', 'member', v_request.id);
    return v_request;
end;
$$;

create or replace function public.list_group_join_requests_v2(p_group_id uuid)
returns table (
    id uuid,
    user_id uuid,
    display_name text,
    avatar_url text,
    message text,
    status text,
    created_at timestamptz,
    reviewed_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        gjr.id,
        gjr.user_id,
        coalesce(nullif(p.display_name, ''), 'Lid ' || left(gjr.user_id::text, 6)),
        p.avatar_url,
        gjr.message,
        gjr.status,
        gjr.created_at,
        gjr.reviewed_at
    from public.group_join_requests gjr
    left join public.profiles p on p.id = gjr.user_id
    where gjr.group_id = p_group_id
      and public.has_group_permission(p_group_id, 'join_request.manage')
    order by (gjr.status = 'pending') desc, gjr.created_at desc
    limit 100;
$$;

create or replace function public.review_group_join_request_v2(
    p_group_id uuid,
    p_request_id uuid,
    p_approve boolean
)
returns public.group_join_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_request public.group_join_requests%rowtype;
    v_member_role_id uuid;
begin
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'join_request.manage') then
        raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED';
    end if;

    select gjr.* into v_request
    from public.group_join_requests gjr
    where gjr.id = p_request_id
      and gjr.group_id = p_group_id
      and gjr.status = 'pending'
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'JOIN_REQUEST_NOT_FOUND';
    end if;

    if p_approve then
        select gr.id into v_member_role_id
        from public.group_roles gr
        where gr.group_id = p_group_id and gr.key = 'member';

        insert into public.group_members(group_id, user_id, role_id, status, invited_by, joined_at)
        values (p_group_id, v_request.user_id, v_member_role_id, 'active', v_actor_id, now())
        on conflict (group_id, user_id) do update
        set role_id = excluded.role_id,
            status = 'active',
            invited_by = excluded.invited_by,
            joined_at = now();
    end if;

    update public.group_join_requests
    set status = case when p_approve then 'approved' else 'rejected' end,
        reviewed_by = v_actor_id,
        reviewed_at = now()
    where id = v_request.id
    returning * into v_request;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id,
        v_actor_id,
        case when p_approve then 'join_request.approved' else 'join_request.rejected' end,
        'member',
        v_request.user_id,
        jsonb_build_object('request_id', v_request.id)
    );
    return v_request;
end;
$$;

revoke all on function public.list_group_roles_v2(uuid) from public;
revoke all on function public.set_group_member_role_v2(uuid, uuid, text) from public;
revoke all on function public.remove_group_member_v2(uuid, uuid, boolean) from public;
revoke all on function public.create_group_invitation_v2(uuid, text, integer, integer) from public;
revoke all on function public.list_group_invitations_v2(uuid) from public;
revoke all on function public.revoke_group_invitation_v2(uuid, uuid) from public;
revoke all on function public.accept_group_invitation_v2(text, text) from public;
revoke all on function public.create_group_join_request_v2(text, text) from public;
revoke all on function public.list_group_join_requests_v2(uuid) from public;
revoke all on function public.review_group_join_request_v2(uuid, uuid, boolean) from public;

grant execute on function public.list_group_roles_v2(uuid) to authenticated;
grant execute on function public.set_group_member_role_v2(uuid, uuid, text) to authenticated;
grant execute on function public.remove_group_member_v2(uuid, uuid, boolean) to authenticated;
grant execute on function public.create_group_invitation_v2(uuid, text, integer, integer) to authenticated;
grant execute on function public.list_group_invitations_v2(uuid) to authenticated;
grant execute on function public.revoke_group_invitation_v2(uuid, uuid) to authenticated;
grant execute on function public.accept_group_invitation_v2(text, text) to authenticated;
grant execute on function public.create_group_join_request_v2(text, text) to authenticated;
grant execute on function public.list_group_join_requests_v2(uuid) to authenticated;
grant execute on function public.review_group_join_request_v2(uuid, uuid, boolean) to authenticated;

comment on function public.set_group_member_role_v2(uuid, uuid, text) is
    'Rank-safe group role assignment. Owners are immutable and actors may only assign roles below their own rank.';
comment on function public.accept_group_invitation_v2(text, text) is
    'Single-use or limited-use invitation acceptance using a SHA-256 token digest.';
comment on function public.review_group_join_request_v2(uuid, uuid, boolean) is
    'Permission-checked join request approval or rejection with membership upsert and audit trail.';

commit;
