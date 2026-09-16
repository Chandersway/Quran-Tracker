begin;

alter table public.group_members
    add column if not exists avatar_url_snapshot text;

alter table public.group_tasks
    add column if not exists points_reward integer not null default 50;

alter table public.group_tasks
    drop constraint if exists group_tasks_points_reward_check;
alter table public.group_tasks
    add constraint group_tasks_points_reward_check check (points_reward between 0 and 1000);

create table if not exists public.group_point_awards (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    source_type text not null check (source_type in ('task', 'event', 'manual')),
    source_id uuid not null,
    points integer not null check (points between 1 and 10000),
    awarded_at timestamptz not null default now(),
    awarded_by uuid references auth.users(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    unique (group_id, user_id, source_type, source_id)
);

create index if not exists group_point_awards_group_user_idx
    on public.group_point_awards(group_id, user_id, awarded_at desc);
create index if not exists group_events_group_start_idx
    on public.group_events(group_id, status, starts_at);

alter table public.group_point_awards enable row level security;

drop policy if exists group_point_awards_select_visible on public.group_point_awards;
create policy group_point_awards_select_visible
on public.group_point_awards for select to authenticated
using (public.can_view_group(group_id));

revoke insert, update, delete on public.group_point_awards from authenticated;
grant select on public.group_point_awards to authenticated;

-- Existing completed tasks receive the same one-time reward after upgrading.
insert into public.group_point_awards(
    group_id, user_id, source_type, source_id, points, awarded_at, awarded_by, metadata
)
select
    gtc.group_id,
    gtc.user_id,
    'task',
    gtc.task_id,
    gt.points_reward,
    coalesce(gtc.completed_at, now()),
    gt.created_by,
    jsonb_build_object('task_title', gt.title, 'backfilled', true)
from public.group_task_completions gtc
join public.group_tasks gt on gt.id = gtc.task_id and gt.group_id = gtc.group_id
where gtc.completed_at is not null
  and gt.points_reward > 0
on conflict (group_id, user_id, source_type, source_id) do nothing;

create or replace function public.get_my_group_profile_v2(p_group_id uuid)
returns table (
    user_id uuid,
    display_name text,
    avatar_url text,
    custom_display_name text,
    custom_avatar_url text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        gm.user_id,
        coalesce(nullif(gm.display_name_snapshot, ''), nullif(p.display_name, ''), 'Lid'),
        coalesce(nullif(gm.avatar_url_snapshot, ''), nullif(p.avatar_url, '')),
        nullif(gm.display_name_snapshot, ''),
        nullif(gm.avatar_url_snapshot, '')
    from public.group_members gm
    left join public.profiles p on p.id = gm.user_id
    where gm.group_id = p_group_id
      and gm.user_id = (select auth.uid())
      and gm.status = 'active';
$$;

create or replace function public.update_my_group_profile_v2(
    p_group_id uuid,
    p_display_name text default null,
    p_avatar_url text default null
)
returns table (
    user_id uuid,
    display_name text,
    avatar_url text,
    custom_display_name text,
    custom_avatar_url text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_name text := nullif(trim(coalesce(p_display_name, '')), '');
    v_avatar text := nullif(trim(coalesce(p_avatar_url, '')), '');
begin
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.is_group_member(p_group_id) then
        raise exception using errcode = '42501', message = 'GROUP_MEMBERSHIP_REQUIRED';
    end if;
    if v_name is not null and char_length(v_name) not between 2 and 40 then
        raise exception using errcode = '22023', message = 'GROUP_PROFILE_NAME_INVALID';
    end if;
    if v_avatar is not null and (
        char_length(v_avatar) > 2048
        or v_avatar !~ '^https://tboaaxcdnajgttdanfmb[.]supabase[.]co/storage/v1/object/public/avatars/'
    ) then
        raise exception using errcode = '22023', message = 'GROUP_PROFILE_AVATAR_INVALID';
    end if;

    update public.group_members gm
    set display_name_snapshot = v_name,
        avatar_url_snapshot = v_avatar,
        updated_at = now()
    where gm.group_id = p_group_id
      and gm.user_id = v_actor_id
      and gm.status = 'active';

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id, v_actor_id, 'member.group_profile_updated', 'member', v_actor_id,
        jsonb_build_object('custom_name', v_name is not null, 'custom_avatar', v_avatar is not null)
    );

    return query select * from public.get_my_group_profile_v2(p_group_id);
end;
$$;

create or replace function public.list_group_members_v3(p_group_id uuid)
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
        g.code,
        gm.user_id,
        coalesce(nullif(gm.display_name_snapshot, ''), nullif(p.display_name, ''), 'Lid ' || left(gm.user_id::text, 6)),
        gr.key,
        coalesce(nullif(gm.avatar_url_snapshot, ''), nullif(p.avatar_url, '')),
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

create or replace function public.list_group_tasks_v3(
    p_group_id uuid,
    p_limit integer default 50
)
returns table (
    id uuid,
    title text,
    description text,
    task_type text,
    target_value integer,
    target_unit text,
    points_reward integer,
    starts_at timestamptz,
    due_at timestamptz,
    status text,
    created_by uuid,
    display_name text,
    created_at timestamptz,
    participant_count bigint,
    completed_count bigint,
    my_progress integer,
    my_completed boolean,
    my_points_awarded boolean,
    can_manage boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        gt.id,
        gt.title,
        gt.description,
        gt.task_type,
        gt.target_value,
        gt.target_unit,
        gt.points_reward,
        gt.starts_at,
        gt.due_at,
        gt.status,
        gt.created_by,
        coalesce(nullif(gm.display_name_snapshot, ''), nullif(p.display_name, ''), 'Beheerder'),
        gt.created_at,
        count(gtc.user_id) filter (where gtc.progress > 0),
        count(gtc.user_id) filter (where gtc.completed_at is not null),
        coalesce(max(gtc.progress) filter (where gtc.user_id = (select auth.uid())), 0),
        coalesce(bool_or(gtc.completed_at is not null) filter (where gtc.user_id = (select auth.uid())), false),
        exists (
            select 1 from public.group_point_awards gpa
            where gpa.group_id = p_group_id
              and gpa.user_id = (select auth.uid())
              and gpa.source_type = 'task'
              and gpa.source_id = gt.id
        ),
        public.has_group_permission(p_group_id, 'task.create')
    from public.group_tasks gt
    left join public.profiles p on p.id = gt.created_by
    left join public.group_members gm on gm.group_id = gt.group_id and gm.user_id = gt.created_by
    left join public.group_task_completions gtc on gtc.group_id = gt.group_id and gtc.task_id = gt.id
    where gt.group_id = p_group_id
      and gt.status <> 'deleted'
      and gt.deleted_at is null
      and public.can_view_group(p_group_id)
    group by gt.id, gm.display_name_snapshot, p.display_name
    order by case gt.status when 'active' then 0 when 'completed' then 1 else 2 end,
             gt.due_at asc nulls last,
             gt.created_at desc
    limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

create or replace function public.create_group_task_v3(
    p_group_id uuid,
    p_title text,
    p_description text default '',
    p_task_type text default 'challenge',
    p_target_value integer default 1,
    p_target_unit text default 'page',
    p_duration_days integer default 7,
    p_points_reward integer default 50
)
returns setof public.group_tasks
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_task public.group_tasks%rowtype;
    v_title text := trim(coalesce(p_title, ''));
    v_description text := trim(coalesce(p_description, ''));
    v_task_type text := lower(trim(coalesce(p_task_type, '')));
    v_target_unit text := lower(trim(coalesce(p_target_unit, '')));
begin
    if v_actor_id is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
    if not public.has_group_permission(p_group_id, 'task.create') then
        raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED';
    end if;
    if char_length(v_title) not between 3 and 120 then raise exception using errcode = '22023', message = 'TASK_TITLE_INVALID'; end if;
    if char_length(v_description) > 3000 then raise exception using errcode = '22023', message = 'TASK_DESCRIPTION_INVALID'; end if;
    if v_task_type not in ('challenge', 'reading', 'memorization', 'custom') then raise exception using errcode = '22023', message = 'TASK_TYPE_INVALID'; end if;
    if p_target_value not between 1 and 10000 then raise exception using errcode = '22023', message = 'TASK_TARGET_INVALID'; end if;
    if v_target_unit not in ('ayah', 'page', 'hizb', 'juz', 'surah', 'lesson', 'custom') then raise exception using errcode = '22023', message = 'TASK_UNIT_INVALID'; end if;
    if p_duration_days is not null and p_duration_days not between 1 and 365 then raise exception using errcode = '22023', message = 'TASK_DURATION_INVALID'; end if;
    if p_points_reward not between 0 and 1000 then raise exception using errcode = '22023', message = 'TASK_POINTS_INVALID'; end if;

    insert into public.group_tasks(
        group_id, title, description, task_type, target_value, target_unit,
        points_reward, starts_at, due_at, status, created_by
    ) values (
        p_group_id, v_title, v_description, v_task_type, p_target_value, v_target_unit,
        p_points_reward, now(), case when p_duration_days is null then null else now() + make_interval(days => p_duration_days) end,
        'active', v_actor_id
    ) returning * into v_task;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (p_group_id, v_actor_id, 'task.created', 'task', v_task.id,
            jsonb_build_object('points_reward', p_points_reward, 'target_value', p_target_value, 'target_unit', v_target_unit));
    return next v_task;
end;
$$;

create or replace function public.set_group_task_progress_v3(
    p_group_id uuid,
    p_task_id uuid,
    p_progress integer
)
returns table (progress integer, completed_at timestamptz, is_completed boolean, awarded_points integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_task public.group_tasks%rowtype;
    v_completed_at timestamptz;
    v_awarded integer := 0;
begin
    if v_actor_id is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
    if not public.is_group_member(p_group_id) then raise exception using errcode = '42501', message = 'GROUP_MEMBERSHIP_REQUIRED'; end if;

    select gt.* into v_task from public.group_tasks gt
    where gt.id = p_task_id and gt.group_id = p_group_id and gt.status = 'active' and gt.deleted_at is null
    for update;
    if not found then raise exception using errcode = 'P0002', message = 'GROUP_TASK_NOT_ACTIVE'; end if;
    if p_progress not between 0 and v_task.target_value then raise exception using errcode = '22023', message = 'TASK_PROGRESS_INVALID'; end if;

    v_completed_at := case when p_progress >= v_task.target_value then now() else null end;
    insert into public.group_task_completions(task_id, group_id, user_id, progress, completed_at, updated_at)
    values (p_task_id, p_group_id, v_actor_id, p_progress, v_completed_at, now())
    on conflict (task_id, user_id) do update
    set progress = excluded.progress, completed_at = excluded.completed_at, updated_at = now();

    if v_completed_at is not null and v_task.points_reward > 0 then
        insert into public.group_point_awards(group_id, user_id, source_type, source_id, points, awarded_by, metadata)
        values (p_group_id, v_actor_id, 'task', p_task_id, v_task.points_reward, v_task.created_by,
                jsonb_build_object('task_title', v_task.title))
        on conflict (group_id, user_id, source_type, source_id) do nothing;
        if found then v_awarded := v_task.points_reward; end if;
    end if;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (p_group_id, v_actor_id,
            case when v_completed_at is null then 'task.progress_updated' else 'task.completed_by_member' end,
            'task', p_task_id, jsonb_build_object('progress', p_progress, 'awarded_points', v_awarded));
    return query select p_progress, v_completed_at, v_completed_at is not null, v_awarded;
end;
$$;

create or replace function public.list_group_point_totals_v2(p_group_id uuid)
returns table (user_id uuid, total_points bigint, weekly_points bigint, monthly_points bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        gpa.user_id,
        sum(gpa.points),
        coalesce(sum(gpa.points) filter (where gpa.awarded_at >= now() - interval '7 days'), 0),
        coalesce(sum(gpa.points) filter (where gpa.awarded_at >= now() - interval '30 days'), 0)
    from public.group_point_awards gpa
    where gpa.group_id = p_group_id and public.can_view_group(p_group_id)
    group by gpa.user_id;
$$;

create or replace function public.list_group_events_v2(p_group_id uuid, p_limit integer default 50)
returns table (
    id uuid,
    title text,
    description text,
    starts_at timestamptz,
    ends_at timestamptz,
    timezone text,
    location text,
    status text,
    created_by uuid,
    display_name text,
    created_at timestamptz,
    going_count bigint,
    maybe_count bigint,
    declined_count bigint,
    my_response text,
    can_manage boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        ge.id, ge.title, ge.description, ge.starts_at, ge.ends_at, ge.timezone, ge.location, ge.status,
        ge.created_by,
        coalesce(nullif(gm.display_name_snapshot, ''), nullif(p.display_name, ''), 'Beheerder'),
        ge.created_at,
        count(gea.user_id) filter (where gea.response = 'going'),
        count(gea.user_id) filter (where gea.response = 'maybe'),
        count(gea.user_id) filter (where gea.response = 'declined'),
        max(gea.response) filter (where gea.user_id = (select auth.uid())),
        public.has_group_permission(p_group_id, 'event.create')
    from public.group_events ge
    left join public.profiles p on p.id = ge.created_by
    left join public.group_members gm on gm.group_id = ge.group_id and gm.user_id = ge.created_by
    left join public.group_event_attendees gea on gea.group_id = ge.group_id and gea.event_id = ge.id
    where ge.group_id = p_group_id
      and ge.status not in ('draft', 'deleted')
      and ge.deleted_at is null
      and public.can_view_group(p_group_id)
    group by ge.id, gm.display_name_snapshot, p.display_name
    order by case when ge.status = 'scheduled' and ge.starts_at >= now() then 0 else 1 end,
             ge.starts_at asc
    limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

create or replace function public.create_group_event_v2(
    p_group_id uuid,
    p_title text,
    p_description text,
    p_starts_at timestamptz,
    p_ends_at timestamptz default null,
    p_timezone text default 'Europe/Amsterdam',
    p_location text default null
)
returns setof public.group_events
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_event public.group_events%rowtype;
    v_title text := trim(coalesce(p_title, ''));
    v_description text := trim(coalesce(p_description, ''));
    v_location text := nullif(trim(coalesce(p_location, '')), '');
begin
    if v_actor_id is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
    if not public.has_group_permission(p_group_id, 'event.create') then raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED'; end if;
    if char_length(v_title) not between 3 and 120 then raise exception using errcode = '22023', message = 'EVENT_TITLE_INVALID'; end if;
    if char_length(v_description) > 3000 then raise exception using errcode = '22023', message = 'EVENT_DESCRIPTION_INVALID'; end if;
    if p_starts_at is null or p_starts_at < now() - interval '1 hour' then raise exception using errcode = '22023', message = 'EVENT_START_INVALID'; end if;
    if p_ends_at is not null and p_ends_at <= p_starts_at then raise exception using errcode = '22023', message = 'EVENT_END_INVALID'; end if;
    if char_length(coalesce(v_location, '')) > 180 then raise exception using errcode = '22023', message = 'EVENT_LOCATION_INVALID'; end if;
    if char_length(trim(coalesce(p_timezone, ''))) not between 1 and 64 then raise exception using errcode = '22023', message = 'EVENT_TIMEZONE_INVALID'; end if;

    insert into public.group_events(group_id, title, description, starts_at, ends_at, timezone, location, status, created_by)
    values (p_group_id, v_title, v_description, p_starts_at, p_ends_at, trim(p_timezone), v_location, 'scheduled', v_actor_id)
    returning * into v_event;
    insert into public.group_event_attendees(event_id, group_id, user_id, response)
    values (v_event.id, p_group_id, v_actor_id, 'going')
    on conflict (event_id, user_id) do update set response = 'going', responded_at = now();
    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id)
    values (p_group_id, v_actor_id, 'event.created', 'event', v_event.id);
    return next v_event;
end;
$$;

create or replace function public.respond_group_event_v2(p_group_id uuid, p_event_id uuid, p_response text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_actor_id uuid := (select auth.uid()); v_response text := lower(trim(coalesce(p_response, '')));
begin
    if v_actor_id is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
    if not public.is_group_member(p_group_id) then raise exception using errcode = '42501', message = 'GROUP_MEMBERSHIP_REQUIRED'; end if;
    if v_response not in ('going', 'maybe', 'declined') then raise exception using errcode = '22023', message = 'EVENT_RESPONSE_INVALID'; end if;
    if not exists (select 1 from public.group_events where id = p_event_id and group_id = p_group_id and status = 'scheduled' and deleted_at is null) then
        raise exception using errcode = 'P0002', message = 'GROUP_EVENT_NOT_SCHEDULED';
    end if;
    insert into public.group_event_attendees(event_id, group_id, user_id, response)
    values (p_event_id, p_group_id, v_actor_id, v_response)
    on conflict (event_id, user_id) do update set response = excluded.response, responded_at = now();
    return true;
end;
$$;

create or replace function public.set_group_event_status_v2(p_group_id uuid, p_event_id uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_actor_id uuid := (select auth.uid()); v_status text := lower(trim(coalesce(p_status, '')));
begin
    if v_actor_id is null then raise exception using errcode = '42501', message = 'AUTH_REQUIRED'; end if;
    if not public.has_group_permission(p_group_id, 'event.create') then raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED'; end if;
    if v_status not in ('scheduled', 'completed', 'cancelled', 'deleted') then raise exception using errcode = '22023', message = 'EVENT_STATUS_INVALID'; end if;
    update public.group_events
    set status = v_status, deleted_at = case when v_status = 'deleted' then now() else null end, updated_at = now()
    where id = p_event_id and group_id = p_group_id and status <> 'deleted';
    if not found then raise exception using errcode = 'P0002', message = 'GROUP_EVENT_NOT_FOUND'; end if;
    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (p_group_id, v_actor_id, 'event.status_changed', 'event', p_event_id, jsonb_build_object('status', v_status));
    return true;
end;
$$;

revoke all on function public.get_my_group_profile_v2(uuid) from public;
revoke all on function public.update_my_group_profile_v2(uuid, text, text) from public;
revoke all on function public.list_group_members_v3(uuid) from public;
revoke all on function public.list_group_tasks_v3(uuid, integer) from public;
revoke all on function public.create_group_task_v3(uuid, text, text, text, integer, text, integer, integer) from public;
revoke all on function public.set_group_task_progress_v3(uuid, uuid, integer) from public;
revoke all on function public.list_group_point_totals_v2(uuid) from public;
revoke all on function public.list_group_events_v2(uuid, integer) from public;
revoke all on function public.create_group_event_v2(uuid, text, text, timestamptz, timestamptz, text, text) from public;
revoke all on function public.respond_group_event_v2(uuid, uuid, text) from public;
revoke all on function public.set_group_event_status_v2(uuid, uuid, text) from public;

grant execute on function public.get_my_group_profile_v2(uuid) to authenticated;
grant execute on function public.update_my_group_profile_v2(uuid, text, text) to authenticated;
grant execute on function public.list_group_members_v3(uuid) to authenticated;
grant execute on function public.list_group_tasks_v3(uuid, integer) to authenticated;
grant execute on function public.create_group_task_v3(uuid, text, text, text, integer, text, integer, integer) to authenticated;
grant execute on function public.set_group_task_progress_v3(uuid, uuid, integer) to authenticated;
grant execute on function public.list_group_point_totals_v2(uuid) to authenticated;
grant execute on function public.list_group_events_v2(uuid, integer) to authenticated;
grant execute on function public.create_group_event_v2(uuid, text, text, timestamptz, timestamptz, text, text) to authenticated;
grant execute on function public.respond_group_event_v2(uuid, uuid, text) to authenticated;
grant execute on function public.set_group_event_status_v2(uuid, uuid, text) to authenticated;

commit;
