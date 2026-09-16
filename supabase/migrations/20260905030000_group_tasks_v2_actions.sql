begin;

create or replace function public.list_group_tasks_v2(
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
        gt.starts_at,
        gt.due_at,
        gt.status,
        gt.created_by,
        coalesce(nullif(p.display_name, ''), 'Beheerder'),
        gt.created_at,
        count(gtc.user_id) filter (where gtc.progress > 0),
        count(gtc.user_id) filter (where gtc.completed_at is not null),
        coalesce(max(gtc.progress) filter (where gtc.user_id = (select auth.uid())), 0),
        coalesce(bool_or(gtc.completed_at is not null) filter (where gtc.user_id = (select auth.uid())), false),
        public.has_group_permission(p_group_id, 'task.create')
    from public.group_tasks gt
    left join public.profiles p on p.id = gt.created_by
    left join public.group_task_completions gtc
      on gtc.group_id = gt.group_id and gtc.task_id = gt.id
    where gt.group_id = p_group_id
      and gt.status <> 'deleted'
      and gt.deleted_at is null
      and public.can_view_group(p_group_id)
    group by gt.id, p.display_name
    order by
        case gt.status when 'active' then 0 when 'completed' then 1 else 2 end,
        gt.due_at asc nulls last,
        gt.created_at desc
    limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;

create or replace function public.create_group_task_v2(
    p_group_id uuid,
    p_title text,
    p_description text default '',
    p_task_type text default 'challenge',
    p_target_value integer default 1,
    p_target_unit text default 'page',
    p_duration_days integer default 7
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
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'task.create') then
        raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED';
    end if;
    if char_length(v_title) not between 3 and 120 then
        raise exception using errcode = '22023', message = 'TASK_TITLE_INVALID';
    end if;
    if char_length(v_description) > 3000 then
        raise exception using errcode = '22023', message = 'TASK_DESCRIPTION_INVALID';
    end if;
    if v_task_type not in ('challenge', 'reading', 'memorization', 'custom') then
        raise exception using errcode = '22023', message = 'TASK_TYPE_INVALID';
    end if;
    if p_target_value not between 1 and 10000 then
        raise exception using errcode = '22023', message = 'TASK_TARGET_INVALID';
    end if;
    if v_target_unit not in ('ayah', 'page', 'hizb', 'juz', 'surah', 'lesson', 'custom') then
        raise exception using errcode = '22023', message = 'TASK_UNIT_INVALID';
    end if;
    if p_duration_days is not null and p_duration_days not between 1 and 365 then
        raise exception using errcode = '22023', message = 'TASK_DURATION_INVALID';
    end if;

    insert into public.group_tasks(
        group_id, title, description, task_type, target_value, target_unit,
        starts_at, due_at, status, created_by
    ) values (
        p_group_id, v_title, v_description, v_task_type, p_target_value, v_target_unit,
        now(), case when p_duration_days is null then null else now() + make_interval(days => p_duration_days) end,
        'active', v_actor_id
    ) returning * into v_task;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id, v_actor_id, 'task.created', 'task', v_task.id,
        jsonb_build_object('target_value', p_target_value, 'target_unit', v_target_unit, 'duration_days', p_duration_days)
    );

    return next v_task;
end;
$$;

create or replace function public.set_group_task_progress_v2(
    p_group_id uuid,
    p_task_id uuid,
    p_progress integer
)
returns table (
    progress integer,
    completed_at timestamptz,
    is_completed boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_task public.group_tasks%rowtype;
    v_completed_at timestamptz;
begin
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.is_group_member(p_group_id) then
        raise exception using errcode = '42501', message = 'GROUP_MEMBERSHIP_REQUIRED';
    end if;

    select gt.* into v_task
    from public.group_tasks gt
    where gt.id = p_task_id
      and gt.group_id = p_group_id
      and gt.status = 'active'
      and gt.deleted_at is null
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_TASK_NOT_ACTIVE';
    end if;
    if p_progress not between 0 and v_task.target_value then
        raise exception using errcode = '22023', message = 'TASK_PROGRESS_INVALID';
    end if;

    v_completed_at := case when p_progress >= v_task.target_value then now() else null end;
    insert into public.group_task_completions(
        task_id, group_id, user_id, progress, completed_at, updated_at
    ) values (
        p_task_id, p_group_id, v_actor_id, p_progress, v_completed_at, now()
    )
    on conflict (task_id, user_id) do update
    set progress = excluded.progress,
        completed_at = excluded.completed_at,
        updated_at = now();

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id, v_actor_id,
        case when v_completed_at is null then 'task.progress_updated' else 'task.completed_by_member' end,
        'task', p_task_id,
        jsonb_build_object('progress', p_progress, 'target_value', v_task.target_value)
    );

    return query select p_progress, v_completed_at, v_completed_at is not null;
end;
$$;

create or replace function public.set_group_task_status_v2(
    p_group_id uuid,
    p_task_id uuid,
    p_status text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_status text := lower(trim(coalesce(p_status, '')));
begin
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'task.create') then
        raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED';
    end if;
    if v_status not in ('active', 'completed', 'cancelled', 'deleted') then
        raise exception using errcode = '22023', message = 'TASK_STATUS_INVALID';
    end if;

    update public.group_tasks
    set status = v_status,
        deleted_at = case when v_status = 'deleted' then now() else null end,
        updated_at = now()
    where id = p_task_id
      and group_id = p_group_id
      and status <> 'deleted';
    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_TASK_NOT_FOUND';
    end if;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id, v_actor_id, 'task.status_changed', 'task', p_task_id,
        jsonb_build_object('status', v_status)
    );
    return true;
end;
$$;

revoke all on function public.list_group_tasks_v2(uuid, integer) from public;
revoke all on function public.create_group_task_v2(uuid, text, text, text, integer, text, integer) from public;
revoke all on function public.set_group_task_progress_v2(uuid, uuid, integer) from public;
revoke all on function public.set_group_task_status_v2(uuid, uuid, text) from public;

grant execute on function public.list_group_tasks_v2(uuid, integer) to authenticated;
grant execute on function public.create_group_task_v2(uuid, text, text, text, integer, text, integer) to authenticated;
grant execute on function public.set_group_task_progress_v2(uuid, uuid, integer) to authenticated;
grant execute on function public.set_group_task_status_v2(uuid, uuid, text) to authenticated;

comment on function public.list_group_tasks_v2(uuid, integer) is 'Lists visible group challenges with aggregate and viewer progress.';
comment on function public.create_group_task_v2(uuid, text, text, text, integer, text, integer) is 'Creates a validated active group challenge for authorized managers.';
comment on function public.set_group_task_progress_v2(uuid, uuid, integer) is 'Upserts only the authenticated member own progress for an active task.';
comment on function public.set_group_task_status_v2(uuid, uuid, text) is 'Changes task lifecycle state after server-side task.create authorization.';

commit;
