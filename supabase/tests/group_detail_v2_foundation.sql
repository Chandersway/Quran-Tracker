-- Non-destructive schema contract checks for Group Detail v2.
do $$
declare
    v_missing_tables text[];
    v_permission_count integer;
    v_rls_missing text[];
begin
    select array_agg(expected.name order by expected.name)
    into v_missing_tables
    from unnest(array[
        'groups', 'group_members', 'group_roles', 'group_permissions',
        'group_role_permissions', 'group_invitations', 'group_join_requests',
        'group_posts', 'post_comments', 'post_reactions', 'post_attachments',
        'group_media', 'group_events', 'group_event_attendees', 'group_tasks',
        'group_task_completions', 'group_progress_entries', 'group_rules',
        'group_notification_preferences', 'group_notifications',
        'moderation_reports', 'group_audit_log'
    ]) as expected(name)
    where to_regclass('public.' || expected.name) is null;

    if v_missing_tables is not null then
        raise exception 'Missing Group Detail v2 tables: %', v_missing_tables;
    end if;

    select count(*) into v_permission_count from public.group_permissions;
    if v_permission_count <> 24 then
        raise exception 'Expected 24 permissions, found %', v_permission_count;
    end if;

    select array_agg(c.relname order by c.relname)
    into v_rls_missing
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(array[
          'groups', 'group_members', 'group_roles', 'group_permissions',
          'group_role_permissions', 'group_invitations', 'group_join_requests',
          'group_posts', 'post_comments', 'post_reactions', 'post_attachments',
          'group_media', 'group_events', 'group_event_attendees', 'group_tasks',
          'group_task_completions', 'group_progress_entries', 'group_rules',
          'group_notification_preferences', 'group_notifications',
          'moderation_reports', 'group_audit_log'
      ])
      and not c.relrowsecurity;

    if v_rls_missing is not null then
        raise exception 'RLS is disabled for: %', v_rls_missing;
    end if;

    if to_regprocedure('public.has_group_permission(uuid,text)') is null then
        raise exception 'Missing has_group_permission(uuid,text)';
    end if;
    if to_regprocedure('public.can_request_group_access(uuid)') is null then
        raise exception 'Missing can_request_group_access(uuid)';
    end if;
    if to_regprocedure('public.create_group_v2(text,text,text,text,text,text)') is null then
        raise exception 'Missing create_group_v2(...)';
    end if;
    if to_regprocedure('public.soft_delete_group_v2(uuid)') is null then
        raise exception 'Missing soft_delete_group_v2(uuid)';
    end if;
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.post_comments'::regclass
          and conname = 'post_comments_parent_comment_id_fkey'
          and confdeltype = 'n'
    ) then
        raise exception 'Parent comment ON DELETE SET NULL constraint is missing';
    end if;
    if not exists (
        select 1 from pg_trigger
        where tgrelid = 'public.post_comments'::regclass
          and tgname = 'post_comments_validate_parent_scope'
          and not tgisinternal
    ) then
        raise exception 'Parent comment scope trigger is missing';
    end if;
end;
$$;

select
    (select count(*) from public.group_permissions) as permission_count,
    (select count(*) from pg_policies where schemaname = 'public' and tablename in (
        'groups', 'group_members', 'group_roles', 'group_permissions',
        'group_role_permissions', 'group_invitations', 'group_join_requests',
        'group_posts', 'post_comments', 'post_reactions', 'post_attachments',
        'group_media', 'group_events', 'group_event_attendees', 'group_tasks',
        'group_task_completions', 'group_progress_entries', 'group_rules',
        'group_notification_preferences', 'group_notifications',
        'moderation_reports', 'group_audit_log'
    )) as policy_count,
    'Group Detail v2 foundation OK' as result;
