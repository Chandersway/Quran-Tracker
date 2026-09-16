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
    v_task public.group_tasks%rowtype;
    v_event public.group_events%rowtype;
    v_code text;
    v_awarded integer;
begin
    select 'EVT-' || lpad(candidate::text, 4, '0')
    into v_code
    from generate_series(0, 9999) candidate
    where not exists (
        select 1 from public.groups g
        where g.code = 'EVT-' || lpad(candidate::text, 4, '0')
    )
    order by candidate desc
    limit 1;

    v_group := public.create_group_v2_full(
        v_code, 'Event profile points test', 'Rolled back after verification',
        'free_reading', 'page', 'none', null, 'restricted'
    );

    perform public.update_my_group_profile_v2(v_group.id, 'Mijn groepsnaam', null);
    if (select custom_display_name from public.get_my_group_profile_v2(v_group.id)) <> 'Mijn groepsnaam'
       or (select display_name from public.list_group_members_v3(v_group.id) where user_id = auth.uid()) <> 'Mijn groepsnaam' then
        raise exception 'Group profile contract failed';
    end if;

    select * into v_task from public.create_group_task_v3(
        v_group.id, 'Lees zeven pagina''s', 'Punten worden eenmaal toegekend',
        'reading', 7, 'page', 7, 75
    );
    select awarded_points into v_awarded
    from public.set_group_task_progress_v3(v_group.id, v_task.id, 7);
    if v_awarded <> 75
       or (select count(*) from public.group_point_awards where group_id = v_group.id and source_id = v_task.id) <> 1
       or not (select my_points_awarded from public.list_group_tasks_v3(v_group.id, 50) where id = v_task.id) then
        raise exception 'First task award contract failed';
    end if;
    select awarded_points into v_awarded
    from public.set_group_task_progress_v3(v_group.id, v_task.id, 7);
    if v_awarded <> 0
       or (select total_points from public.list_group_point_totals_v2(v_group.id) where user_id = auth.uid()) <> 75 then
        raise exception 'Idempotent task award contract failed';
    end if;

    select * into v_event from public.create_group_event_v2(
        v_group.id, 'Samen lezen', 'Online leessessie',
        now() + interval '1 day', now() + interval '1 day 1 hour',
        'Europe/Amsterdam', 'Online'
    );
    if (select my_response from public.list_group_events_v2(v_group.id, 50) where id = v_event.id) <> 'going'
       or not (select can_manage from public.list_group_events_v2(v_group.id, 50) where id = v_event.id) then
        raise exception 'Event create/list contract failed';
    end if;
    perform public.respond_group_event_v2(v_group.id, v_event.id, 'maybe');
    if (select my_response from public.list_group_events_v2(v_group.id, 50) where id = v_event.id) <> 'maybe'
       or (select maybe_count from public.list_group_events_v2(v_group.id, 50) where id = v_event.id) <> 1 then
        raise exception 'Event RSVP contract failed';
    end if;
    perform public.set_group_event_status_v2(v_group.id, v_event.id, 'completed');
    perform public.set_group_event_status_v2(v_group.id, v_event.id, 'deleted');
    if exists (select 1 from public.list_group_events_v2(v_group.id, 50) where id = v_event.id)
       or not exists (
           select 1 from public.group_audit_log
           where group_id = v_group.id and target_id = v_event.id
             and action = 'event.status_changed' and metadata ->> 'status' = 'deleted'
       ) then
        raise exception 'Event soft-delete/audit contract failed';
    end if;
end;
$$;

reset role;
rollback;

select 'Group events, profile and points v3 OK; test data rolled back' as result;
