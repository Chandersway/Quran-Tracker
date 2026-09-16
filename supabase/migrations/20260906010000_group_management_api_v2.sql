begin;

-- Phase 10: stable, permission-checked API contracts for the remaining
-- Group Detail management surfaces. Clients only call these RPCs and never
-- rely on hidden UI controls as authorization.

create or replace function public.get_group_detail_v3(p_code text)
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
    language_code text,
    owner_id uuid,
    created_at timestamptz,
    viewer_role text,
    member_count bigint,
    permissions text[],
    join_request_status text,
    unread_notification_count bigint,
    active_rules_version integer
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid := auth.uid();
    v_group public.groups%rowtype;
begin
    if v_user_id is null then
        raise exception 'Log opnieuw in om deze groep te bekijken.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;

    select g.* into v_group
    from public.groups g
    where upper(g.code) = upper(trim(p_code))
      and g.status = 'active'
      and g.deleted_at is null;

    if not found then
        raise exception 'Deze groep bestaat niet of is verwijderd.'
            using errcode = 'P0002', detail = 'GROUP_NOT_FOUND';
    end if;

    if not public.can_view_group(v_group.id) then
        raise exception 'Je hebt geen toegang tot deze groep.'
            using errcode = '42501', detail = 'GROUP_NOT_VISIBLE';
    end if;

    return query
    with viewer as (
        select gr.key as role_key, gm.role_id
        from public.group_members gm
        join public.group_roles gr on gr.id = gm.role_id
        where gm.group_id = v_group.id
          and gm.user_id = v_user_id
          and gm.status = 'active'
        limit 1
    )
    select
        v_group.id,
        v_group.code,
        v_group.name,
        v_group.description,
        v_group.goal_type,
        v_group.progress_unit,
        v_group.goal_period,
        v_group.goal_target,
        v_group.privacy,
        v_group.language_code,
        v_group.owner_id,
        v_group.created_at,
        coalesce((select viewer.role_key from viewer), 'guest')::text,
        (select count(*) from public.group_members gm
         where gm.group_id = v_group.id and gm.status = 'active'),
        coalesce((
            select array_agg(gp.key order by gp.key)
            from viewer
            join public.group_role_permissions grp
              on grp.role_id = viewer.role_id and grp.allowed
            join public.group_permissions gp on gp.key = grp.permission_key
        ), array[]::text[]),
        (select gjr.status
         from public.group_join_requests gjr
         where gjr.group_id = v_group.id and gjr.user_id = v_user_id
         order by gjr.created_at desc
         limit 1),
        (select count(*)
         from public.group_notifications gn
         where gn.group_id = v_group.id
           and gn.user_id = v_user_id
           and gn.read_at is null),
        (select gr.version
         from public.group_rules gr
         where gr.group_id = v_group.id and gr.status = 'active'
         limit 1);
end;
$$;

create or replace function public.get_group_rules_v2(p_group_id uuid)
returns table (
    id uuid,
    version integer,
    content text,
    updated_at timestamptz,
    created_by uuid,
    display_name text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    if auth.uid() is null then
        raise exception 'Log opnieuw in om de groepsregels te bekijken.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;
    if not public.can_view_group(p_group_id) then
        raise exception 'Je hebt geen toegang tot deze groepsregels.'
            using errcode = '42501', detail = 'GROUP_NOT_VISIBLE';
    end if;

    return query
    select
        gr.id,
        gr.version,
        gr.content,
        gr.updated_at,
        gr.created_by,
        coalesce(
            nullif(gm.display_name_snapshot, ''),
            nullif(p.display_name, ''),
            'Beheerder'
        )::text as display_name
    from public.group_rules gr
    left join public.group_members gm
      on gm.group_id = gr.group_id and gm.user_id = gr.created_by
    left join public.profiles p on p.id = gr.created_by
    where gr.group_id = p_group_id
      and gr.status = 'active'
    order by gr.version desc
    limit 1;
end;
$$;

create or replace function public.publish_group_rules_v2(p_group_id uuid, p_content text)
returns table (
    id uuid,
    version integer,
    content text,
    updated_at timestamptz,
    created_by uuid,
    display_name text
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid := auth.uid();
    v_content text := trim(coalesce(p_content, ''));
    v_rule public.group_rules%rowtype;
begin
    if v_user_id is null then
        raise exception 'Log opnieuw in om groepsregels te wijzigen.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'rules.update') then
        raise exception 'Je hebt geen rechten om groepsregels te wijzigen.'
            using errcode = '42501', detail = 'GROUP_PERMISSION_DENIED';
    end if;
    if char_length(v_content) not between 1 and 10000 then
        raise exception 'Groepsregels moeten tussen 1 en 10.000 tekens bevatten.'
            using errcode = '22023', detail = 'RULES_CONTENT_INVALID';
    end if;

    perform pg_advisory_xact_lock(hashtext(p_group_id::text));

    update public.group_rules gr
    set status = 'archived', updated_at = now()
    where gr.group_id = p_group_id and gr.status = 'active';

    insert into public.group_rules(group_id, version, content, status, created_by)
    values (
        p_group_id,
        coalesce((select max(gr.version) + 1 from public.group_rules gr where gr.group_id = p_group_id), 1),
        v_content,
        'active',
        v_user_id
    )
    returning * into v_rule;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id,
        v_user_id,
        'rules.published',
        'rules',
        v_rule.id,
        jsonb_build_object('version', v_rule.version)
    );

    return query
    select
        v_rule.id,
        v_rule.version,
        v_rule.content,
        v_rule.updated_at,
        v_rule.created_by,
        coalesce(
            nullif(gm.display_name_snapshot, ''),
            nullif(p.display_name, ''),
            'Beheerder'
        )::text
    from (values (1)) marker(value)
    left join public.group_members gm
      on gm.group_id = p_group_id and gm.user_id = v_user_id
    left join public.profiles p on p.id = v_user_id;
end;
$$;

create or replace function public.get_group_notification_preferences_v2(p_group_id uuid)
returns table (
    level text,
    push_enabled boolean,
    muted_until timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    if auth.uid() is null then
        raise exception 'Log opnieuw in om meldingsinstellingen te bekijken.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;
    if not public.is_group_member(p_group_id) then
        raise exception 'Alleen groepsleden kunnen meldingsinstellingen beheren.'
            using errcode = '42501', detail = 'GROUP_MEMBERSHIP_REQUIRED';
    end if;

    return query
    select
        coalesce(gnp.level, 'all')::text,
        coalesce(gnp.push_enabled, true),
        gnp.muted_until,
        coalesce(gnp.updated_at, now())
    from (values (1)) marker(value)
    left join public.group_notification_preferences gnp
      on gnp.group_id = p_group_id and gnp.user_id = auth.uid();
end;
$$;

create or replace function public.update_group_notification_preferences_v2(
    p_group_id uuid,
    p_level text,
    p_push_enabled boolean,
    p_muted_until timestamptz default null
)
returns table (
    level text,
    push_enabled boolean,
    muted_until timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid := auth.uid();
    v_level text := lower(trim(coalesce(p_level, '')));
begin
    if v_user_id is null then
        raise exception 'Log opnieuw in om meldingsinstellingen te wijzigen.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;
    if not public.is_group_member(p_group_id) then
        raise exception 'Alleen groepsleden kunnen meldingsinstellingen beheren.'
            using errcode = '42501', detail = 'GROUP_MEMBERSHIP_REQUIRED';
    end if;
    if v_level not in ('all', 'mentions', 'important', 'muted') then
        raise exception 'Kies een geldig meldingsniveau.'
            using errcode = '22023', detail = 'NOTIFICATION_LEVEL_INVALID';
    end if;

    return query
    insert into public.group_notification_preferences(
        group_id, user_id, level, push_enabled, muted_until, updated_at
    )
    values (
        p_group_id,
        v_user_id,
        v_level,
        coalesce(p_push_enabled, true),
        case when v_level = 'muted' then p_muted_until else null end,
        now()
    )
    on conflict (group_id, user_id) do update
    set level = excluded.level,
        push_enabled = excluded.push_enabled,
        muted_until = excluded.muted_until,
        updated_at = now()
    returning
        group_notification_preferences.level,
        group_notification_preferences.push_enabled,
        group_notification_preferences.muted_until,
        group_notification_preferences.updated_at;
end;
$$;

create or replace function public.list_group_notifications_v2(
    p_group_id uuid,
    p_limit integer default 30,
    p_before_created_at timestamptz default null,
    p_before_id uuid default null
)
returns table (
    id uuid,
    type text,
    title text,
    body text,
    entity_type text,
    entity_id uuid,
    read_at timestamptz,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid := auth.uid();
    v_limit integer := least(greatest(coalesce(p_limit, 30), 1), 100);
begin
    if v_user_id is null then
        raise exception 'Log opnieuw in om meldingen te bekijken.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;
    if not public.is_group_member(p_group_id) then
        raise exception 'Alleen groepsleden kunnen meldingen bekijken.'
            using errcode = '42501', detail = 'GROUP_MEMBERSHIP_REQUIRED';
    end if;

    return query
    select gn.id, gn.type, gn.title, gn.body, gn.entity_type, gn.entity_id, gn.read_at, gn.created_at
    from public.group_notifications gn
    where gn.group_id = p_group_id
      and gn.user_id = v_user_id
      and (
          p_before_created_at is null
          or (gn.created_at, gn.id) < (p_before_created_at, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
      )
    order by gn.created_at desc, gn.id desc
    limit v_limit;
end;
$$;

create or replace function public.mark_group_notification_read_v2(
    p_group_id uuid,
    p_notification_id uuid default null,
    p_read boolean default true
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid := auth.uid();
    v_count integer;
begin
    if v_user_id is null then
        raise exception 'Log opnieuw in om meldingen bij te werken.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;

    update public.group_notifications gn
    set read_at = case when coalesce(p_read, true) then coalesce(gn.read_at, now()) else null end
    where gn.group_id = p_group_id
      and gn.user_id = v_user_id
      and (p_notification_id is null or gn.id = p_notification_id);
    get diagnostics v_count = row_count;
    return v_count;
end;
$$;

create or replace function public.send_group_notification_v2(
    p_group_id uuid,
    p_title text,
    p_body text default '',
    p_type text default 'important',
    p_entity_type text default null,
    p_entity_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid := auth.uid();
    v_title text := trim(coalesce(p_title, ''));
    v_body text := trim(coalesce(p_body, ''));
    v_type text := lower(trim(coalesce(p_type, 'important')));
    v_count integer;
begin
    if v_user_id is null then
        raise exception 'Log opnieuw in om een groepsmelding te versturen.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'notification.send') then
        raise exception 'Je hebt geen rechten om groepsmeldingen te versturen.'
            using errcode = '42501', detail = 'GROUP_PERMISSION_DENIED';
    end if;
    if char_length(v_title) not between 1 and 160 or char_length(v_body) > 1000 then
        raise exception 'Controleer de titel en tekst van de melding.'
            using errcode = '22023', detail = 'NOTIFICATION_CONTENT_INVALID';
    end if;
    if v_type not in ('important', 'announcement', 'event', 'task', 'moderation') then
        raise exception 'Kies een geldig meldingstype.'
            using errcode = '22023', detail = 'NOTIFICATION_TYPE_INVALID';
    end if;
    if (
        select count(*)
        from public.group_audit_log gal
        where gal.group_id = p_group_id
          and gal.actor_id = v_user_id
          and gal.action = 'notification.sent'
          and gal.created_at > now() - interval '1 hour'
    ) >= 20 then
        raise exception 'Je hebt te veel meldingen kort na elkaar verstuurd.'
            using errcode = 'P0001', detail = 'RATE_LIMITED';
    end if;

    insert into public.group_notifications(group_id, user_id, type, title, body, entity_type, entity_id)
    select p_group_id, gm.user_id, v_type, v_title, v_body, p_entity_type, p_entity_id
    from public.group_members gm
    where gm.group_id = p_group_id and gm.status = 'active';
    get diagnostics v_count = row_count;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id,
        v_user_id,
        'notification.sent',
        coalesce(p_entity_type, 'group'),
        p_entity_id,
        jsonb_build_object('type', v_type, 'recipients', v_count, 'title', v_title)
    );
    return v_count;
end;
$$;

create or replace function public.list_group_moderation_reports_v2(
    p_group_id uuid,
    p_status text default null,
    p_limit integer default 30,
    p_before_created_at timestamptz default null,
    p_before_id uuid default null
)
returns table (
    id uuid,
    reporter_id uuid,
    reporter_name text,
    target_type text,
    target_id uuid,
    reason text,
    details text,
    status text,
    assigned_to uuid,
    resolved_by uuid,
    resolved_at timestamptz,
    resolution_note text,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_status text := nullif(lower(trim(coalesce(p_status, ''))), '');
    v_limit integer := least(greatest(coalesce(p_limit, 30), 1), 100);
begin
    if auth.uid() is null then
        raise exception 'Log opnieuw in om rapportages te bekijken.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'report.manage') then
        raise exception 'Je hebt geen rechten om rapportages te beheren.'
            using errcode = '42501', detail = 'GROUP_PERMISSION_DENIED';
    end if;
    if v_status is not null and v_status not in ('open', 'reviewing', 'resolved', 'dismissed') then
        raise exception 'Kies een geldige rapportagestatus.'
            using errcode = '22023', detail = 'REPORT_STATUS_INVALID';
    end if;

    return query
    select
        mr.id,
        mr.reporter_id,
        coalesce(nullif(gm.display_name_snapshot, ''), nullif(p.display_name, ''), 'Lid')::text,
        mr.target_type,
        mr.target_id,
        mr.reason,
        mr.details,
        mr.status,
        mr.assigned_to,
        mr.resolved_by,
        mr.resolved_at,
        mr.resolution_note,
        mr.created_at,
        mr.updated_at
    from public.moderation_reports mr
    left join public.group_members gm
      on gm.group_id = mr.group_id and gm.user_id = mr.reporter_id
    left join public.profiles p on p.id = mr.reporter_id
    where mr.group_id = p_group_id
      and (v_status is null or mr.status = v_status)
      and (
          p_before_created_at is null
          or (mr.created_at, mr.id) < (p_before_created_at, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))
      )
    order by mr.created_at desc, mr.id desc
    limit v_limit;
end;
$$;

create or replace function public.review_group_moderation_report_v2(
    p_group_id uuid,
    p_report_id uuid,
    p_status text,
    p_resolution_note text default null
)
returns public.moderation_reports
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_user_id uuid := auth.uid();
    v_status text := lower(trim(coalesce(p_status, '')));
    v_note text := nullif(trim(coalesce(p_resolution_note, '')), '');
    v_report public.moderation_reports%rowtype;
begin
    if v_user_id is null then
        raise exception 'Log opnieuw in om rapportages te beheren.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'report.manage') then
        raise exception 'Je hebt geen rechten om rapportages te beheren.'
            using errcode = '42501', detail = 'GROUP_PERMISSION_DENIED';
    end if;
    if v_status not in ('reviewing', 'resolved', 'dismissed') then
        raise exception 'Kies reviewing, resolved of dismissed.'
            using errcode = '22023', detail = 'REPORT_STATUS_INVALID';
    end if;
    if char_length(coalesce(v_note, '')) > 2000 then
        raise exception 'De afhandelnotitie mag maximaal 2.000 tekens bevatten.'
            using errcode = '22023', detail = 'REPORT_NOTE_TOO_LONG';
    end if;

    update public.moderation_reports mr
    set status = v_status,
        assigned_to = case when v_status = 'reviewing' then v_user_id else mr.assigned_to end,
        resolved_by = case when v_status in ('resolved', 'dismissed') then v_user_id else null end,
        resolved_at = case when v_status in ('resolved', 'dismissed') then now() else null end,
        resolution_note = case when v_status in ('resolved', 'dismissed') then v_note else null end,
        updated_at = now()
    where mr.id = p_report_id and mr.group_id = p_group_id
    returning * into v_report;

    if not found then
        raise exception 'Deze rapportage bestaat niet.'
            using errcode = 'P0002', detail = 'REPORT_NOT_FOUND';
    end if;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id,
        v_user_id,
        'report.' || v_status,
        v_report.target_type,
        v_report.target_id,
        jsonb_build_object('report_id', v_report.id, 'note', v_note)
    );
    return v_report;
end;
$$;

create or replace function public.list_group_audit_log_v2(
    p_group_id uuid,
    p_limit integer default 30,
    p_before_id bigint default null
)
returns table (
    id bigint,
    actor_id uuid,
    actor_name text,
    action text,
    target_type text,
    target_id uuid,
    metadata jsonb,
    created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_limit integer := least(greatest(coalesce(p_limit, 30), 1), 100);
begin
    if auth.uid() is null then
        raise exception 'Log opnieuw in om het activiteitenlogboek te bekijken.'
            using errcode = '28000', detail = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'audit.view') then
        raise exception 'Je hebt geen rechten om het activiteitenlogboek te bekijken.'
            using errcode = '42501', detail = 'GROUP_PERMISSION_DENIED';
    end if;

    return query
    select
        gal.id,
        gal.actor_id,
        coalesce(nullif(gm.display_name_snapshot, ''), nullif(p.display_name, ''), 'Systeem')::text,
        gal.action,
        gal.target_type,
        gal.target_id,
        gal.metadata,
        gal.created_at
    from public.group_audit_log gal
    left join public.group_members gm
      on gm.group_id = gal.group_id and gm.user_id = gal.actor_id
    left join public.profiles p on p.id = gal.actor_id
    where gal.group_id = p_group_id
      and (p_before_id is null or gal.id < p_before_id)
    order by gal.id desc
    limit v_limit;
end;
$$;

revoke all on function public.get_group_detail_v3(text) from public;
revoke all on function public.get_group_rules_v2(uuid) from public;
revoke all on function public.publish_group_rules_v2(uuid, text) from public;
revoke all on function public.get_group_notification_preferences_v2(uuid) from public;
revoke all on function public.update_group_notification_preferences_v2(uuid, text, boolean, timestamptz) from public;
revoke all on function public.list_group_notifications_v2(uuid, integer, timestamptz, uuid) from public;
revoke all on function public.mark_group_notification_read_v2(uuid, uuid, boolean) from public;
revoke all on function public.send_group_notification_v2(uuid, text, text, text, text, uuid) from public;
revoke all on function public.list_group_moderation_reports_v2(uuid, text, integer, timestamptz, uuid) from public;
revoke all on function public.review_group_moderation_report_v2(uuid, uuid, text, text) from public;
revoke all on function public.list_group_audit_log_v2(uuid, integer, bigint) from public;

grant execute on function public.get_group_detail_v3(text) to authenticated;
grant execute on function public.get_group_rules_v2(uuid) to authenticated;
grant execute on function public.publish_group_rules_v2(uuid, text) to authenticated;
grant execute on function public.get_group_notification_preferences_v2(uuid) to authenticated;
grant execute on function public.update_group_notification_preferences_v2(uuid, text, boolean, timestamptz) to authenticated;
grant execute on function public.list_group_notifications_v2(uuid, integer, timestamptz, uuid) to authenticated;
grant execute on function public.mark_group_notification_read_v2(uuid, uuid, boolean) to authenticated;
grant execute on function public.send_group_notification_v2(uuid, text, text, text, text, uuid) to authenticated;
grant execute on function public.list_group_moderation_reports_v2(uuid, text, integer, timestamptz, uuid) to authenticated;
grant execute on function public.review_group_moderation_report_v2(uuid, uuid, text, text) to authenticated;
grant execute on function public.list_group_audit_log_v2(uuid, integer, bigint) to authenticated;

comment on function public.get_group_detail_v3(text) is
    'Versioned Group Detail read contract with role, capabilities and UI counters.';
comment on function public.publish_group_rules_v2(uuid, text) is
    'Publishes an immutable rules version after a server-side rules.update check.';
comment on function public.send_group_notification_v2(uuid, text, text, text, text, uuid) is
    'Creates an in-app group notification for active members, rate limited to 20 sends per actor per hour.';
comment on function public.list_group_moderation_reports_v2(uuid, text, integer, timestamptz, uuid) is
    'Cursor-paginated moderation queue protected by report.manage.';
comment on function public.list_group_audit_log_v2(uuid, integer, bigint) is
    'Cursor-paginated append-only audit log protected by audit.view.';

commit;
