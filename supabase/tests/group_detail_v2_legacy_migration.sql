do $$
declare
    v_expected_members bigint;
begin
    if (select count(*) from public.groups where data_origin = 'legacy')
       <> (select count(*) from public.reading_groups) then
        raise exception 'Legacy group count mismatch';
    end if;

    if exists (
        select 1
        from public.reading_groups rg
        left join public.groups g on g.code = rg.code and g.data_origin = 'legacy'
        where g.id is null
           or g.owner_id <> rg.owner_id
           or g.name <> trim(rg.name)
           or g.description <> trim(coalesce(rg.description, ''))
    ) then
        raise exception 'Legacy group identity or content mismatch';
    end if;

    select count(*) into v_expected_members
    from public.reading_group_members;

    if (select count(*)
        from public.group_members gm
        join public.groups g on g.id = gm.group_id
        where g.data_origin = 'legacy' and gm.legacy_id is not null)
       <> v_expected_members then
        raise exception 'Legacy member count mismatch';
    end if;

    if exists (
        select 1
        from public.groups g
        left join public.group_members gm
          on gm.group_id = g.id and gm.user_id = g.owner_id and gm.status = 'active'
        left join public.group_roles gr
          on gr.id = gm.role_id and gr.group_id = g.id
        where g.data_origin = 'legacy'
          and (gm.id is null or gr.key <> 'owner')
    ) then
        raise exception 'Migrated owner membership mismatch';
    end if;

    if (select count(*) from public.group_posts where legacy_id is not null)
       <> (select count(*) from public.reading_group_feed) then
        raise exception 'Legacy post count mismatch';
    end if;

    if (select count(*) from public.post_comments where legacy_id is not null)
       <> (select count(*) from public.reading_group_feed_comments) then
        raise exception 'Legacy comment count mismatch';
    end if;

    if (select count(*) from public.post_reactions where legacy_id is not null)
       <> (select count(*) from public.reading_group_feed_likes) then
        raise exception 'Legacy reaction count mismatch';
    end if;

    if (select count(*) from public.group_progress_entries where legacy_id is not null)
       <> (select count(*) from public.reading_group_progress) then
        raise exception 'Legacy progress count mismatch';
    end if;

    if exists (
        select 1
        from public.group_posts gp
        join public.reading_group_feed rf on rf.id = gp.legacy_id
        join public.groups g on g.id = gp.group_id
        where g.code <> rf.group_code
           or gp.created_by <> rf.user_id
           or gp.type <> case when lower(rf.type) = 'progress' then 'progress' else 'text' end
    ) then
        raise exception 'Legacy post mapping mismatch';
    end if;

    if exists (
        select 1
        from public.post_comments pc
        join public.group_posts gp on gp.id = pc.post_id and gp.group_id = pc.group_id
        where pc.legacy_id is not null and gp.legacy_id is null
    ) then
        raise exception 'Migrated comment points to a non-legacy post';
    end if;

    if exists (
        select 1
        from public.post_reactions pr
        join public.group_posts gp on gp.id = pr.post_id and gp.group_id = pr.group_id
        where pr.legacy_id is not null and gp.legacy_id is null
    ) then
        raise exception 'Migrated reaction points to a non-legacy post';
    end if;

    if (select count(*)
        from public.group_audit_log gal
        join public.groups g on g.id = gal.group_id
        where g.data_origin = 'legacy' and gal.action = 'group.legacy_migrated')
       <> (select count(*) from public.reading_groups) then
        raise exception 'Legacy migration audit count mismatch';
    end if;
end;
$$;

select jsonb_build_object(
    'groups', (select count(*) from public.groups where data_origin = 'legacy'),
    'members', (
        select count(*)
        from public.group_members gm
        join public.groups g on g.id = gm.group_id
        where g.data_origin = 'legacy' and gm.legacy_id is not null
    ),
    'posts', (select count(*) from public.group_posts where legacy_id is not null),
    'comments', (select count(*) from public.post_comments where legacy_id is not null),
    'reactions', (select count(*) from public.post_reactions where legacy_id is not null),
    'progress', (select count(*) from public.group_progress_entries where legacy_id is not null),
    'source_groups_unchanged', (select count(*) from public.reading_groups),
    'source_posts_unchanged', (select count(*) from public.reading_group_feed)
) as migration_result;
