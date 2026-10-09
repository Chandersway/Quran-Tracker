begin;

-- Store the four member switches in the same role grants used by RPCs and RLS.
create or replace function public.get_group_member_permissions_v1(p_group_id uuid)
returns jsonb language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare v_result jsonb;
begin
    if auth.uid() is null or not public.can_view_group(p_group_id) then
        raise exception using errcode = '42501', message = 'GROUP_ACCESS_FORBIDDEN';
    end if;
    select jsonb_build_object(
        'canPostMessages', coalesce(bool_or(p.allowed) filter (where p.permission_key = 'post.create'), false),
        'canShareProgress', coalesce(bool_or(p.allowed) filter (where p.permission_key = 'progress.create'), false),
        'canComment', coalesce(bool_or(p.allowed) filter (where p.permission_key = 'comment.create'), false),
        'canInviteMembers', coalesce(bool_or(p.allowed) filter (where p.permission_key = 'invitation.create'), false)
    ) into v_result
    from public.group_roles r left join public.group_role_permissions p on p.role_id = r.id
    where r.group_id = p_group_id and r.key = 'member';
    return v_result;
end;
$$;

create or replace function public.set_group_member_permissions_v1(p_group_id uuid, p_member_permissions jsonb)
returns void language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_role_id uuid;
begin
    if auth.uid() is null or not public.has_group_permission(p_group_id, 'group.update') then
        raise exception using errcode = '42501', message = 'GROUP_UPDATE_FORBIDDEN';
    end if;
    if p_member_permissions is null or jsonb_typeof(p_member_permissions) <> 'object'
       or not (p_member_permissions ?& array['canPostMessages','canShareProgress','canComment','canInviteMembers'])
       or exists (select 1 from jsonb_each(p_member_permissions) e
           where e.key not in ('canPostMessages','canShareProgress','canComment','canInviteMembers')
              or jsonb_typeof(e.value) <> 'boolean') then
        raise exception using errcode = '22023', message = 'GROUP_PERMISSIONS_INVALID';
    end if;
    select id into strict v_role_id from public.group_roles
    where group_id = p_group_id and key = 'member' for update;
    insert into public.group_role_permissions(role_id, permission_key, allowed)
    select v_role_id, v.permission_key, (p_member_permissions ->> v.setting_key)::boolean
    from (values ('post.create','canPostMessages'), ('progress.create','canShareProgress'),
                 ('comment.create','canComment'), ('invitation.create','canInviteMembers')) v(permission_key, setting_key)
    on conflict (role_id, permission_key) do update set allowed = excluded.allowed;
    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (p_group_id, auth.uid(), 'group.member_permissions_updated', 'role', v_role_id, p_member_permissions);
end;
$$;

create or replace function public.create_group_v3_full(
    p_code text, p_name text, p_description text, p_goal_type text, p_progress_unit text,
    p_goal_period text, p_goal_target integer, p_privacy text, p_member_permissions jsonb
)
returns public.groups language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_group public.groups%rowtype;
begin
    v_group := public.create_group_v2_full(p_code, p_name, p_description, p_goal_type,
        p_progress_unit, p_goal_period, p_goal_target, p_privacy);
    perform public.set_group_member_permissions_v1(v_group.id, p_member_permissions);
    return v_group;
end;
$$;

create or replace function public.update_group_v3_full(
    p_group_id uuid, p_name text, p_description text, p_goal_type text, p_progress_unit text,
    p_goal_period text, p_goal_target integer, p_privacy text, p_member_permissions jsonb
)
returns public.groups language plpgsql security definer
set search_path = public, pg_temp
as $$
declare v_group public.groups%rowtype;
begin
    v_group := public.update_group_v2_full(p_group_id, p_name, p_description, p_goal_type,
        p_progress_unit, p_goal_period, p_goal_target, p_privacy);
    perform public.set_group_member_permissions_v1(v_group.id, p_member_permissions);
    return v_group;
end;
$$;

-- Direct inserts must not bypass the progress RPC's permission check.
drop policy if exists group_posts_progress_permission on public.group_posts;
create policy group_posts_progress_permission on public.group_posts as restrictive
for insert to authenticated with check (
    type <> 'progress' or public.has_group_permission(group_id, 'progress.create')
);

revoke all on function public.get_group_member_permissions_v1(uuid) from public;
revoke all on function public.set_group_member_permissions_v1(uuid, jsonb) from public;
revoke all on function public.create_group_v3_full(text,text,text,text,text,text,integer,text,jsonb) from public;
revoke all on function public.update_group_v3_full(uuid,text,text,text,text,text,integer,text,jsonb) from public;
grant execute on function public.get_group_member_permissions_v1(uuid) to authenticated;
grant execute on function public.set_group_member_permissions_v1(uuid,jsonb) to authenticated;
grant execute on function public.create_group_v3_full(text,text,text,text,text,text,integer,text,jsonb) to authenticated;
grant execute on function public.update_group_v3_full(uuid,text,text,text,text,text,integer,text,jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
