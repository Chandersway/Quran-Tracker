begin;

-- Phase 2 compatibility layer for data created by the reading_* implementation.
-- The old tables remain unchanged and are the rollback source until cutover.

alter table public.groups
    drop constraint if exists groups_name_check;

alter table public.groups
    add constraint groups_name_check check (char_length(name) between 1 and 80),
    add column if not exists data_origin text not null default 'native'
        check (data_origin in ('native', 'legacy')),
    add column if not exists goal_type text not null default 'free_reading'
        check (char_length(goal_type) between 2 and 40),
    add column if not exists goal_period text not null default 'none'
        check (goal_period in ('none', 'daily', 'weekly', 'monthly')),
    add column if not exists goal_target integer check (goal_target between 1 and 1000000),
    add column if not exists progress_unit text not null default 'page'
        check (progress_unit in ('ayah', 'page', 'hizb', 'juz', 'surah', 'lesson', 'custom'));

alter table public.group_members
    add column if not exists legacy_id bigint unique,
    add column if not exists display_name_snapshot text;

alter table public.group_posts
    drop constraint if exists group_posts_type_check,
    drop constraint if exists group_posts_progress_check;

alter table public.group_posts
    add column if not exists legacy_id bigint unique,
    add column if not exists display_name_snapshot text,
    add column if not exists progress_unit text
        check (progress_unit in ('ayah', 'page', 'hizb', 'juz', 'surah', 'lesson', 'custom')),
    add column if not exists progress_amount integer check (progress_amount between 1 and 10000),
    add constraint group_posts_type_check
        check (type in ('text', 'ayah', 'poll', 'task', 'system', 'progress')),
    add constraint group_posts_progress_check check (
        type <> 'progress'
        or (progress_unit is not null and progress_amount is not null)
    );

alter table public.post_comments
    add column if not exists legacy_id bigint unique,
    add column if not exists display_name_snapshot text;

alter table public.post_reactions
    add column if not exists legacy_id bigint unique;

alter table public.group_progress_entries
    add column if not exists legacy_id bigint unique;

create index if not exists groups_origin_created_idx
    on public.groups(data_origin, created_at desc)
    where deleted_at is null;

create index if not exists group_members_legacy_idx
    on public.group_members(legacy_id)
    where legacy_id is not null;

create index if not exists group_posts_legacy_idx
    on public.group_posts(legacy_id)
    where legacy_id is not null;

create index if not exists group_progress_legacy_idx
    on public.group_progress_entries(legacy_id)
    where legacy_id is not null;

comment on column public.groups.data_origin is
    'native for v2-created groups; legacy for rows migrated from reading_groups.';
comment on column public.group_posts.legacy_id is
    'Stable reading_group_feed.id mapping used for idempotent migration and rollback tracing.';

commit;
