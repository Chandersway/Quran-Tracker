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
    v_group_code text;
    v_task public.group_tasks%rowtype;
begin
    select 'TSA-' || lpad(candidate::text, 4, '0')
    into v_group_code
    from generate_series(0, 9999) candidate
    where not exists (
        select 1 from public.groups g
        where g.code = 'TSA-' || lpad(candidate::text, 4, '0')
    )
    order by candidate desc
    limit 1;

    v_group := public.create_group_v2_full(
        v_group_code, 'Task action test', 'Rolled back after verification',
        'free_reading', 'page', 'none', null, 'restricted'
    );
    select * into v_task from public.create_group_task_v2(
        v_group.id, 'Read five pages', 'Task contract test', 'reading', 5, 'page', 7
    );

    if (select count(*) from public.list_group_tasks_v2(v_group.id, 50)) <> 1
       or not (select can_manage from public.list_group_tasks_v2(v_group.id, 50) limit 1) then
        raise exception 'Owner task create/list contract failed';
    end if;
    perform public.set_group_task_progress_v2(v_group.id, v_task.id, 3);

    if v_second_user_id is not null then
        perform set_config('request.jwt.claim.sub', v_second_user_id::text, true);
        perform public.join_group_v2_by_code(v_group.code, 'Task Tester');
        perform public.set_group_task_progress_v2(v_group.id, v_task.id, 5);
        if not (select my_completed from public.list_group_tasks_v2(v_group.id, 50) limit 1) then
            raise exception 'Member completion contract failed';
        end if;
        begin
            perform public.set_group_task_status_v2(v_group.id, v_task.id, 'cancelled');
            raise exception 'Member unexpectedly managed task status';
        exception
            when insufficient_privilege then null;
        end;
        perform set_config('request.jwt.claim.sub', v_owner_id::text, true);
    end if;

    perform public.set_group_task_status_v2(v_group.id, v_task.id, 'completed');
    perform public.set_group_task_status_v2(v_group.id, v_task.id, 'deleted');
    if (select count(*) from public.list_group_tasks_v2(v_group.id, 50)) <> 0
       or not exists (
           select 1
           from public.group_audit_log
           where group_id = v_group.id
             and target_id = v_task.id
             and action = 'task.status_changed'
             and metadata ->> 'status' = 'deleted'
       ) then
        raise exception 'Task soft-delete contract failed';
    end if;
    if (
        select count(*) < (case when v_second_user_id is null then 4 else 5 end)
        from public.group_audit_log
        where group_id = v_group.id and target_id = v_task.id
    ) then
        raise exception 'Task audit events are missing';
    end if;
end;
$$;

reset role;
rollback;

select 'Group tasks v2 actions OK; test data rolled back' as result;
