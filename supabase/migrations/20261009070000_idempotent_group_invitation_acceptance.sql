begin;

-- Existing active members only open the group; never rewrite their membership.
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
    v_changed_id uuid;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;

    -- Lock even exhausted invitations, so a retry can find the original group.
    select gi.* into v_invitation
    from public.group_invitations gi
    where gi.token_hash = encode(extensions.digest(trim(p_token), 'sha256'), 'hex')
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'INVITATION_INVALID_OR_EXPIRED';
    end if;

    select g.* into v_group from public.groups g
    where g.id = v_invitation.group_id and g.status = 'active' and g.deleted_at is null;
    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_NOT_FOUND';
    end if;

    select gm.* into v_membership from public.group_members gm
    where gm.group_id = v_group.id and gm.user_id = v_user_id
    for update;
    if found then
        if v_membership.status in ('blocked', 'suspended') then
            raise exception using errcode = '42501', message = 'GROUP_MEMBER_BLOCKED';
        end if;
        if v_membership.status = 'active' then
            -- Membership itself authorizes access, even if this link has expired.
            return v_group;
        end if;
    end if;

    if v_invitation.status <> 'active' or v_invitation.expires_at <= now()
       or v_invitation.use_count >= v_invitation.max_uses then
        raise exception using errcode = 'P0002', message = 'INVITATION_INVALID_OR_EXPIRED';
    end if;
    if v_invitation.invited_user_id is not null and v_invitation.invited_user_id <> v_user_id then
        raise exception using errcode = '42501', message = 'INVITATION_EMAIL_MISMATCH';
    end if;
    if v_invitation.invited_email is not null and lower(v_invitation.invited_email) <> v_user_email then
        raise exception using errcode = '42501', message = 'INVITATION_EMAIL_MISMATCH';
    end if;

    insert into public.group_members (
        group_id, user_id, role_id, status, invited_by, display_name_snapshot, joined_at
    ) values (
        v_group.id, v_user_id, v_invitation.role_id, 'active', v_invitation.created_by,
        left(nullif(trim(p_display_name), ''), 80), now()
    )
    on conflict (group_id, user_id) do update
    set role_id = excluded.role_id,
        status = 'active',
        invited_by = excluded.invited_by,
        joined_at = now(),
        display_name_snapshot = coalesce(excluded.display_name_snapshot, public.group_members.display_name_snapshot)
    -- Also protect a membership created concurrently through another invitation/join route.
    where public.group_members.status in ('left', 'pending')
    returning id into v_changed_id;

    if v_changed_id is null then
        select gm.* into v_membership from public.group_members gm
        where gm.group_id = v_group.id and gm.user_id = v_user_id for update;
        if v_membership.status = 'active' then
            return v_group;
        end if;
        raise exception using errcode = '42501', message = 'GROUP_MEMBER_BLOCKED';
    end if;

    update public.group_invitations
    set use_count = use_count + 1,
        status = case when use_count + 1 >= max_uses then 'accepted' else 'active' end
    where id = v_invitation.id;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (v_group.id, v_user_id, 'invitation.accepted', 'member', v_user_id,
            jsonb_build_object('invitation_id', v_invitation.id));
    return v_group;
end;
$$;

revoke all on function public.accept_group_invitation_v2(text, text) from public, anon;
grant execute on function public.accept_group_invitation_v2(text, text) to authenticated;

commit;
