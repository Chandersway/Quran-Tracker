begin;

-- Phase 2 snapshot migration. Every statement is idempotent. The reading_* source
-- stays intact so the app can keep using it until the data-layer cutover.

insert into public.groups (
    code,
    name,
    description,
    category,
    language_code,
    privacy,
    status,
    owner_id,
    created_at,
    updated_at,
    updated_by,
    data_origin,
    goal_type,
    goal_period,
    goal_target,
    progress_unit
)
select
    upper(trim(rg.code)),
    trim(rg.name),
    trim(coalesce(rg.description, '')),
    case lower(coalesce(rg.goal, ''))
        when 'memorization' then 'memorization'
        else 'quran_reading'
    end,
    'nl',
    'restricted',
    'active',
    rg.owner_id,
    rg.created_at,
    rg.created_at,
    rg.owner_id,
    'legacy',
    coalesce(nullif(lower(trim(rg.goal)), ''), 'free_reading'),
    case lower(coalesce(rg.goal, ''))
        when 'daily' then 'daily'
        when 'week' then 'weekly'
        else 'none'
    end,
    null,
    case lower(coalesce(rg.unit, ''))
        when 'ayah' then 'ayah'
        when 'page' then 'page'
        when 'hizb' then 'hizb'
        when 'juz' then 'juz'
        when 'surah' then 'surah'
        when 'lesson' then 'lesson'
        else 'custom'
    end
from public.reading_groups rg
on conflict (code) do update
set
    name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    language_code = excluded.language_code,
    owner_id = excluded.owner_id,
    updated_by = excluded.updated_by,
    goal_type = excluded.goal_type,
    goal_period = excluded.goal_period,
    progress_unit = excluded.progress_unit
where public.groups.data_origin = 'legacy';

insert into public.group_members (
    group_id,
    user_id,
    role_id,
    status,
    joined_at,
    created_at,
    updated_at,
    legacy_id,
    display_name_snapshot
)
select
    g.id,
    rm.user_id,
    gr.id,
    'active',
    rm.created_at,
    rm.created_at,
    rm.created_at,
    rm.id,
    nullif(trim(rm.display_name), '')
from public.reading_group_members rm
join public.reading_groups rg on rg.code = rm.group_code
join public.groups g on g.code = rg.code and g.data_origin = 'legacy'
join public.group_roles gr
  on gr.group_id = g.id
 and gr.key = case
    when rm.user_id = rg.owner_id or lower(coalesce(rm.role, '')) = 'owner' then 'owner'
    when lower(coalesce(rm.role, '')) = 'admin' then 'admin'
    when lower(coalesce(rm.role, '')) = 'moderator' then 'moderator'
    else 'member'
 end
on conflict (group_id, user_id) do update
set
    role_id = excluded.role_id,
    status = 'active',
    joined_at = least(public.group_members.joined_at, excluded.joined_at),
    legacy_id = excluded.legacy_id,
    display_name_snapshot = excluded.display_name_snapshot;

insert into public.group_posts (
    group_id,
    created_by,
    type,
    content,
    visibility,
    status,
    created_at,
    updated_at,
    legacy_id,
    display_name_snapshot,
    progress_unit,
    progress_amount
)
select
    g.id,
    rf.user_id,
    case lower(coalesce(rf.type, ''))
        when 'progress' then 'progress'
        else 'text'
    end,
    coalesce(rf.message, ''),
    'members',
    'published',
    rf.created_at,
    rf.created_at,
    rf.id,
    nullif(trim(rf.display_name), ''),
    case when lower(coalesce(rf.type, '')) = 'progress' then
        case lower(coalesce(rf.unit, ''))
            when 'ayah' then 'ayah'
            when 'page' then 'page'
            when 'hizb' then 'hizb'
            when 'juz' then 'juz'
            when 'surah' then 'surah'
            when 'lesson' then 'lesson'
            else 'custom'
        end
    end,
    case when lower(coalesce(rf.type, '')) = 'progress' then rf.amount end
from public.reading_group_feed rf
join public.groups g on g.code = rf.group_code and g.data_origin = 'legacy'
on conflict (legacy_id) do update
set
    group_id = excluded.group_id,
    created_by = excluded.created_by,
    type = excluded.type,
    content = excluded.content,
    display_name_snapshot = excluded.display_name_snapshot,
    progress_unit = excluded.progress_unit,
    progress_amount = excluded.progress_amount;

insert into public.post_comments (
    post_id,
    group_id,
    created_by,
    content,
    status,
    created_at,
    updated_at,
    legacy_id,
    display_name_snapshot
)
select
    gp.id,
    gp.group_id,
    rc.user_id,
    rc.content,
    'published',
    rc.created_at,
    rc.updated_at,
    rc.id,
    nullif(trim(rc.display_name), '')
from public.reading_group_feed_comments rc
join public.groups g on g.code = rc.group_code and g.data_origin = 'legacy'
join public.group_posts gp
  on gp.group_id = g.id
 and gp.legacy_id = rc.post_id
on conflict (legacy_id) do update
set
    post_id = excluded.post_id,
    group_id = excluded.group_id,
    created_by = excluded.created_by,
    content = excluded.content,
    updated_at = excluded.updated_at,
    display_name_snapshot = excluded.display_name_snapshot;

insert into public.post_reactions (
    post_id,
    group_id,
    user_id,
    reaction,
    created_at,
    legacy_id
)
select
    gp.id,
    gp.group_id,
    rl.user_id,
    'like',
    rl.created_at,
    rl.id
from public.reading_group_feed_likes rl
join public.groups g on g.code = rl.group_code and g.data_origin = 'legacy'
join public.group_posts gp
  on gp.group_id = g.id
 and gp.legacy_id = rl.post_id
on conflict (legacy_id) do update
set
    post_id = excluded.post_id,
    group_id = excluded.group_id,
    user_id = excluded.user_id,
    reaction = excluded.reaction;

insert into public.group_progress_entries (
    group_id,
    user_id,
    unit,
    amount,
    source,
    occurred_on,
    created_at,
    legacy_id
)
select
    g.id,
    rp.user_id,
    case lower(coalesce(rp.unit, ''))
        when 'ayah' then 'ayah'
        when 'page' then 'page'
        when 'hizb' then 'hizb'
        when 'juz' then 'juz'
        when 'surah' then 'surah'
        when 'lesson' then 'lesson'
        else 'custom'
    end,
    rp.amount,
    coalesce(nullif(trim(rp.source), ''), 'legacy'),
    case
        when rp.date_key ~ '^\\d{4}-\\d{2}-\\d{2}$' then to_date(rp.date_key, 'YYYY-MM-DD')
        else rp.created_at::date
    end,
    rp.created_at,
    rp.id
from public.reading_group_progress rp
join public.groups g on g.code = rp.group_code and g.data_origin = 'legacy'
on conflict (legacy_id) do update
set
    group_id = excluded.group_id,
    user_id = excluded.user_id,
    unit = excluded.unit,
    amount = excluded.amount,
    source = excluded.source,
    occurred_on = excluded.occurred_on;

update public.group_audit_log gal
set metadata = gal.metadata || jsonb_build_object(
    'data_origin', 'legacy',
    'legacy_code', g.code,
    'migration_phase', 2
)
from public.groups g
where gal.group_id = g.id
  and gal.action = 'group.created'
  and g.data_origin = 'legacy'
  and not (gal.metadata ? 'migration_phase');

insert into public.group_audit_log (
    group_id,
    actor_id,
    action,
    target_type,
    target_id,
    metadata,
    created_at
)
select
    g.id,
    g.owner_id,
    'group.legacy_migrated',
    'group',
    g.id,
    jsonb_build_object(
        'legacy_code', g.code,
        'migration_phase', 2,
        'source_tables_retained', true
    ),
    now()
from public.groups g
where g.data_origin = 'legacy'
  and not exists (
      select 1
      from public.group_audit_log gal
      where gal.group_id = g.id
        and gal.action = 'group.legacy_migrated'
  );

commit;
