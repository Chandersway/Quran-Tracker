begin;

alter table public.groups
    drop constraint if exists groups_goal_period_check;

alter table public.groups
    add constraint groups_goal_period_check
    check (goal_period in ('none', 'daily', 'weekly', 'monthly', 'total'));

create or replace function public.create_group_v2_full(
    p_code text,
    p_name text,
    p_description text default '',
    p_goal_type text default 'free_reading',
    p_progress_unit text default 'page',
    p_goal_period text default 'none',
    p_goal_target integer default null,
    p_privacy text default 'restricted'
)
returns public.groups
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_group public.groups%rowtype;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if upper(trim(p_code)) !~ '^[A-Z0-9]{3}-[0-9]{4}$' then
        raise exception using errcode = '22023', message = 'GROUP_CODE_INVALID';
    end if;
    if char_length(trim(p_name)) not between 3 and 80 then
        raise exception using errcode = '22023', message = 'GROUP_NAME_INVALID';
    end if;
    if p_privacy not in ('public', 'restricted', 'private') then
        raise exception using errcode = '22023', message = 'GROUP_PRIVACY_INVALID';
    end if;
    if p_progress_unit not in ('ayah', 'page', 'hizb', 'juz', 'surah', 'lesson', 'custom') then
        raise exception using errcode = '22023', message = 'GROUP_UNIT_INVALID';
    end if;
    if p_goal_period not in ('none', 'daily', 'weekly', 'monthly', 'total') then
        raise exception using errcode = '22023', message = 'GROUP_GOAL_PERIOD_INVALID';
    end if;
    if p_goal_period <> 'none' and coalesce(p_goal_target, 0) < 1 then
        raise exception using errcode = '22023', message = 'GROUP_GOAL_TARGET_INVALID';
    end if;

    insert into public.groups (
        code, name, description, category, language_code, privacy, owner_id,
        updated_by, data_origin, goal_type, goal_period, goal_target, progress_unit
    ) values (
        upper(trim(p_code)),
        trim(p_name),
        trim(coalesce(p_description, '')),
        case when lower(trim(p_goal_type)) = 'memorization' then 'memorization' else 'quran_reading' end,
        'nl',
        p_privacy,
        v_user_id,
        v_user_id,
        'native',
        lower(trim(coalesce(p_goal_type, 'free_reading'))),
        p_goal_period,
        case when p_goal_period = 'none' then null else p_goal_target end,
        p_progress_unit
    )
    returning * into v_group;

    return v_group;
exception
    when unique_violation then
        raise exception using errcode = '23505', message = 'GROUP_CODE_CONFLICT';
end;
$$;

create or replace function public.update_group_v2_full(
    p_group_id uuid,
    p_name text,
    p_description text,
    p_goal_type text,
    p_progress_unit text,
    p_goal_period text,
    p_goal_target integer,
    p_privacy text
)
returns public.groups
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_current public.groups%rowtype;
    v_group public.groups%rowtype;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    select * into v_current
    from public.groups
    where id = p_group_id and status = 'active' and deleted_at is null;
    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_NOT_FOUND';
    end if;
    if not public.has_group_permission(p_group_id, 'group.update') then
        raise exception using errcode = '42501', message = 'GROUP_UPDATE_FORBIDDEN';
    end if;
    if p_privacy <> v_current.privacy
       and not public.has_group_permission(p_group_id, 'group.security') then
        raise exception using errcode = '42501', message = 'GROUP_SECURITY_FORBIDDEN';
    end if;
    if char_length(trim(p_name)) not between 1 and 80 then
        raise exception using errcode = '22023', message = 'GROUP_NAME_INVALID';
    end if;
    if p_privacy not in ('public', 'restricted', 'private') then
        raise exception using errcode = '22023', message = 'GROUP_PRIVACY_INVALID';
    end if;
    if p_progress_unit not in ('ayah', 'page', 'hizb', 'juz', 'surah', 'lesson', 'custom') then
        raise exception using errcode = '22023', message = 'GROUP_UNIT_INVALID';
    end if;
    if p_goal_period not in ('none', 'daily', 'weekly', 'monthly', 'total') then
        raise exception using errcode = '22023', message = 'GROUP_GOAL_PERIOD_INVALID';
    end if;
    if p_goal_period <> 'none' and coalesce(p_goal_target, 0) < 1 then
        raise exception using errcode = '22023', message = 'GROUP_GOAL_TARGET_INVALID';
    end if;

    update public.groups
    set
        name = trim(p_name),
        description = trim(coalesce(p_description, '')),
        category = case when lower(trim(p_goal_type)) = 'memorization' then 'memorization' else 'quran_reading' end,
        goal_type = lower(trim(coalesce(p_goal_type, 'free_reading'))),
        progress_unit = p_progress_unit,
        goal_period = p_goal_period,
        goal_target = case when p_goal_period = 'none' then null else p_goal_target end,
        privacy = p_privacy,
        updated_by = v_user_id
    where id = p_group_id
    returning * into v_group;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id,
        v_user_id,
        'group.updated',
        'group',
        p_group_id,
        jsonb_build_object('privacy_changed', p_privacy <> v_current.privacy)
    );
    return v_group;
end;
$$;

create or replace function public.join_group_v2_by_code(
    p_code text,
    p_display_name text default null
)
returns public.groups
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_group public.groups%rowtype;
    v_membership public.group_members%rowtype;
    v_member_role_id uuid;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    select * into v_group
    from public.groups
    where code = upper(trim(p_code))
      and status = 'active'
      and deleted_at is null;
    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_NOT_FOUND';
    end if;

    select * into v_membership
    from public.group_members
    where group_id = v_group.id and user_id = v_user_id;

    if found and v_membership.status = 'blocked' then
        raise exception using errcode = '42501', message = 'GROUP_MEMBER_BLOCKED';
    end if;
    if v_group.privacy = 'private' and not found then
        raise exception using errcode = '42501', message = 'GROUP_INVITATION_REQUIRED';
    end if;

    if v_membership.id is null then
        select id into v_member_role_id
        from public.group_roles
        where group_id = v_group.id and key = 'member';

        insert into public.group_members (
            group_id, user_id, role_id, status, display_name_snapshot
        ) values (
            v_group.id,
            v_user_id,
            v_member_role_id,
            'active',
            left(nullif(trim(p_display_name), ''), 80)
        );

        insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id)
        values (v_group.id, v_user_id, 'member.joined_by_code', 'member', v_user_id);
    else
        update public.group_members
        set
            status = 'active',
            display_name_snapshot = coalesce(
                left(nullif(trim(p_display_name), ''), 80),
                display_name_snapshot
            )
        where id = v_membership.id;
    end if;

    return v_group;
end;
$$;

create or replace function public.create_group_text_post_v2(
    p_group_id uuid,
    p_content text,
    p_display_name text default null
)
returns public.group_posts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_post public.group_posts%rowtype;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'post.create') then
        raise exception using errcode = '42501', message = 'GROUP_POST_FORBIDDEN';
    end if;
    if char_length(trim(p_content)) not between 1 and 10000 then
        raise exception using errcode = '22023', message = 'GROUP_POST_CONTENT_INVALID';
    end if;

    insert into public.group_posts (
        group_id, created_by, type, content, display_name_snapshot
    ) values (
        p_group_id, v_user_id, 'text', trim(p_content),
        left(nullif(trim(p_display_name), ''), 80)
    ) returning * into v_post;

    return v_post;
end;
$$;

create or replace function public.record_group_progress_v2(
    p_group_id uuid,
    p_unit text,
    p_amount integer,
    p_source text default 'manual',
    p_share_to_feed boolean default false,
    p_feed_message text default null,
    p_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_post_id uuid;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'progress.create') then
        raise exception using errcode = '42501', message = 'GROUP_PROGRESS_FORBIDDEN';
    end if;
    if p_unit not in ('ayah', 'page', 'hizb', 'juz', 'surah', 'lesson', 'custom')
       or p_amount not between 1 and 10000 then
        raise exception using errcode = '22023', message = 'GROUP_PROGRESS_INVALID';
    end if;

    insert into public.group_progress_entries (
        group_id, user_id, unit, amount, source, occurred_on
    ) values (
        p_group_id, v_user_id, p_unit, p_amount,
        coalesce(nullif(trim(p_source), ''), 'manual'), current_date
    );

    if p_share_to_feed then
        if not public.has_group_permission(p_group_id, 'post.create') then
            raise exception using errcode = '42501', message = 'GROUP_POST_FORBIDDEN';
        end if;
        insert into public.group_posts (
            group_id, created_by, type, content, display_name_snapshot,
            progress_unit, progress_amount
        ) values (
            p_group_id,
            v_user_id,
            'progress',
            coalesce(nullif(trim(p_feed_message), ''), 'Voortgang gedeeld.'),
            left(nullif(trim(p_display_name), ''), 80),
            p_unit,
            p_amount
        ) returning id into v_post_id;
    end if;

    return v_post_id;
end;
$$;

create or replace function public.toggle_group_post_like_v2(
    p_group_id uuid,
    p_post_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'reaction.create') then
        raise exception using errcode = '42501', message = 'GROUP_REACTION_FORBIDDEN';
    end if;
    if not exists (
        select 1 from public.group_posts
        where id = p_post_id and group_id = p_group_id and status = 'published'
    ) then
        raise exception using errcode = 'P0002', message = 'GROUP_POST_NOT_FOUND';
    end if;

    if exists (
        select 1 from public.post_reactions
        where post_id = p_post_id and group_id = p_group_id
          and user_id = v_user_id and reaction = 'like'
    ) then
        delete from public.post_reactions
        where post_id = p_post_id and group_id = p_group_id
          and user_id = v_user_id and reaction = 'like';
        return false;
    end if;

    insert into public.post_reactions(group_id, post_id, user_id, reaction)
    values (p_group_id, p_post_id, v_user_id, 'like');
    return true;
end;
$$;

create or replace function public.add_group_post_comment_v2(
    p_group_id uuid,
    p_post_id uuid,
    p_content text,
    p_display_name text default null
)
returns public.post_comments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_comment public.post_comments%rowtype;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'comment.create') then
        raise exception using errcode = '42501', message = 'GROUP_COMMENT_FORBIDDEN';
    end if;
    if char_length(trim(p_content)) not between 1 and 2000 then
        raise exception using errcode = '22023', message = 'GROUP_COMMENT_CONTENT_INVALID';
    end if;
    if not exists (
        select 1 from public.group_posts
        where id = p_post_id and group_id = p_group_id and status = 'published'
    ) then
        raise exception using errcode = 'P0002', message = 'GROUP_POST_NOT_FOUND';
    end if;

    insert into public.post_comments (
        group_id, post_id, created_by, content, display_name_snapshot
    ) values (
        p_group_id, p_post_id, v_user_id, trim(p_content),
        left(nullif(trim(p_display_name), ''), 80)
    ) returning * into v_comment;

    return v_comment;
end;
$$;

create or replace function public.list_my_groups_v2()
returns table (
    id uuid,
    code text,
    name text,
    description text,
    goal_type text,
    progress_unit text,
    goal_period text,
    goal_target integer,
    privacy text,
    owner_id uuid,
    created_at timestamptz,
    viewer_role text,
    member_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        g.id,
        g.code,
        g.name,
        g.description,
        g.goal_type,
        g.progress_unit,
        g.goal_period,
        g.goal_target,
        g.privacy,
        g.owner_id,
        g.created_at,
        gr.key as viewer_role,
        (
            select count(*)
            from public.group_members member_count_rows
            where member_count_rows.group_id = g.id
              and member_count_rows.status = 'active'
        ) as member_count
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    join public.group_roles gr on gr.id = gm.role_id and gr.group_id = gm.group_id
    where gm.user_id = (select auth.uid())
      and gm.status = 'active'
      and g.status = 'active'
      and g.deleted_at is null
    order by g.created_at desc, lower(g.name);
$$;

create or replace function public.list_group_members_v2(p_group_id uuid)
returns table (
    group_code text,
    user_id uuid,
    display_name text,
    role text,
    avatar_url text,
    joined_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        g.code as group_code,
        gm.user_id,
        coalesce(
            nullif(gm.display_name_snapshot, ''),
            nullif(p.display_name, ''),
            'Lid ' || left(gm.user_id::text, 6)
        ) as display_name,
        gr.key as role,
        p.avatar_url,
        gm.joined_at
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    join public.group_roles gr on gr.id = gm.role_id and gr.group_id = gm.group_id
    left join public.profiles p on p.id = gm.user_id
    where gm.group_id = p_group_id
      and gm.status = 'active'
      and g.status = 'active'
      and g.deleted_at is null
      and public.has_group_permission(p_group_id, 'member.read')
    order by gr.rank desc, lower(coalesce(gm.display_name_snapshot, p.display_name, ''));
$$;

revoke all on function public.create_group_v2_full(text, text, text, text, text, text, integer, text) from public;
revoke all on function public.update_group_v2_full(uuid, text, text, text, text, text, integer, text) from public;
revoke all on function public.join_group_v2_by_code(text, text) from public;
revoke all on function public.create_group_text_post_v2(uuid, text, text) from public;
revoke all on function public.record_group_progress_v2(uuid, text, integer, text, boolean, text, text) from public;
revoke all on function public.toggle_group_post_like_v2(uuid, uuid) from public;
revoke all on function public.add_group_post_comment_v2(uuid, uuid, text, text) from public;
revoke all on function public.list_my_groups_v2() from public;
revoke all on function public.list_group_members_v2(uuid) from public;

grant execute on function public.create_group_v2_full(text, text, text, text, text, text, integer, text) to authenticated;
grant execute on function public.update_group_v2_full(uuid, text, text, text, text, text, integer, text) to authenticated;
grant execute on function public.join_group_v2_by_code(text, text) to authenticated;
grant execute on function public.create_group_text_post_v2(uuid, text, text) to authenticated;
grant execute on function public.record_group_progress_v2(uuid, text, integer, text, boolean, text, text) to authenticated;
grant execute on function public.toggle_group_post_like_v2(uuid, uuid) to authenticated;
grant execute on function public.add_group_post_comment_v2(uuid, uuid, text, text) to authenticated;
grant execute on function public.list_my_groups_v2() to authenticated;
grant execute on function public.list_group_members_v2(uuid) to authenticated;

comment on function public.create_group_v2_full(text, text, text, text, text, text, integer, text) is
    'App-facing atomic group creation contract for the v2 data layer.';
comment on function public.join_group_v2_by_code(text, text) is
    'Code-based join for public/restricted groups; private groups require an invitation workflow.';
comment on function public.record_group_progress_v2(uuid, text, integer, text, boolean, text, text) is
    'Atomically records progress and optionally creates its feed post.';
comment on function public.list_my_groups_v2() is
    'Single-query read model for the signed-in user group overview.';
comment on function public.list_group_members_v2(uuid) is
    'Permission-checked member read model with role and profile snapshot.';

commit;
