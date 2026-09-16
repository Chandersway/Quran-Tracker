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
    v_rule record;
    v_pref record;
    v_report public.moderation_reports%rowtype;
    v_owner_id uuid := auth.uid();
    v_second_user_id uuid := nullif(current_setting('test.second_user_id', true), '')::uuid;
    v_code text;
    v_notification_id uuid;
begin
    select 'API-' || lpad(candidate::text, 4, '0')
    into v_code
    from generate_series(0, 9999) candidate
    where not exists (
        select 1 from public.groups g
        where g.code = 'API-' || lpad(candidate::text, 4, '0')
    )
    order by candidate desc
    limit 1;

    v_group := public.create_group_v2_full(
        v_code, 'Group API contract test', 'Rolled back after verification',
        'free_reading', 'page', 'none', null, 'restricted'
    );

    if (select viewer_role from public.get_group_detail_v3(v_code)) <> 'owner'
       or not ((select permissions from public.get_group_detail_v3(v_code)) @> array['audit.view']::text[]) then
        raise exception 'Group detail capability contract failed';
    end if;

    select * into v_rule from public.publish_group_rules_v2(v_group.id, 'Wees respectvol.');
    if v_rule.version <> 1
       or (select content from public.get_group_rules_v2(v_group.id)) <> 'Wees respectvol.' then
        raise exception 'First rules publication contract failed';
    end if;
    select * into v_rule from public.publish_group_rules_v2(v_group.id, 'Wees respectvol en blijf bij het onderwerp.');
    if v_rule.version <> 2
       or (select count(*) from public.group_rules where group_id = v_group.id and status = 'active') <> 1 then
        raise exception 'Versioned rules publication contract failed';
    end if;

    select * into v_pref from public.get_group_notification_preferences_v2(v_group.id);
    if v_pref.level <> 'all' or not v_pref.push_enabled then
        raise exception 'Default notification preference contract failed';
    end if;
    select * into v_pref from public.update_group_notification_preferences_v2(
        v_group.id, 'important', false, null
    );
    if v_pref.level <> 'important' or v_pref.push_enabled then
        raise exception 'Notification preference update contract failed';
    end if;

    if public.send_group_notification_v2(
        v_group.id, 'Belangrijke update', 'Lees de nieuwe groepsregels.', 'important', 'group', v_group.id
    ) <> 1 then
        raise exception 'Notification fan-out contract failed';
    end if;
    select id into v_notification_id
    from public.list_group_notifications_v2(v_group.id, 30, null, null)
    limit 1;
    if v_notification_id is null
       or (select unread_notification_count from public.get_group_detail_v3(v_code)) <> 1 then
        raise exception 'Notification inbox contract failed';
    end if;
    if public.mark_group_notification_read_v2(v_group.id, v_notification_id, true) <> 1
       or (select read_at from public.list_group_notifications_v2(v_group.id, 30, null, null)
           where id = v_notification_id) is null then
        raise exception 'Notification read-state contract failed';
    end if;

    insert into public.moderation_reports(
        group_id, reporter_id, target_type, target_id, reason, details
    ) values (
        v_group.id, v_owner_id, 'group', v_group.id, 'other', 'API queue verification'
    ) returning * into v_report;

    if not exists (
        select 1 from public.list_group_moderation_reports_v2(v_group.id, 'open', 30, null, null)
        where id = v_report.id
    ) then
        raise exception 'Moderation queue contract failed';
    end if;
    v_report := public.review_group_moderation_report_v2(
        v_group.id, v_report.id, 'resolved', 'Gecontroleerd tijdens contracttest.'
    );
    if v_report.status <> 'resolved' or v_report.resolved_by <> v_owner_id then
        raise exception 'Moderation review contract failed';
    end if;

    if not exists (
        select 1 from public.list_group_audit_log_v2(v_group.id, 100, null)
        where action = 'rules.published'
    ) or not exists (
        select 1 from public.list_group_audit_log_v2(v_group.id, 100, null)
        where action = 'notification.sent'
    ) or not exists (
        select 1 from public.list_group_audit_log_v2(v_group.id, 100, null)
        where action = 'report.resolved'
    ) then
        raise exception 'Audit log contract failed';
    end if;

    if v_second_user_id is not null then
        perform set_config('request.jwt.claim.sub', v_second_user_id::text, true);
        perform public.join_group_v2_by_code(v_group.code, 'API Member');
        begin
            perform public.publish_group_rules_v2(v_group.id, 'Dit mag niet.');
            raise exception 'Member rules publication unexpectedly succeeded';
        exception
            when insufficient_privilege then null;
        end;
        begin
            perform public.list_group_moderation_reports_v2(v_group.id, null, 30, null, null);
            raise exception 'Member moderation queue unexpectedly succeeded';
        exception
            when insufficient_privilege then null;
        end;
        perform set_config('request.jwt.claim.sub', v_owner_id::text, true);
    end if;
end;
$$;

reset role;
rollback;

select 'Group management API v2 OK; test data rolled back' as result;
