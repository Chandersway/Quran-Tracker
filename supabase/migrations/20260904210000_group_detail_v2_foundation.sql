begin;

-- Group Detail v2 is additive. The current reading_* tables remain untouched.

create table public.groups (
    id uuid primary key default gen_random_uuid(),
    code text not null unique check (code ~ '^[A-Z0-9]{3}-[0-9]{4}$'),
    name text not null check (char_length(name) between 3 and 80),
    description text not null default '' check (char_length(description) <= 1000),
    category text not null default 'general' check (char_length(category) between 2 and 40),
    language_code text not null default 'nl' check (language_code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
    privacy text not null default 'restricted' check (privacy in ('public', 'restricted', 'private')),
    status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
    avatar_path text,
    banner_path text,
    owner_id uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    updated_by uuid references auth.users(id) on delete set null,
    deleted_at timestamptz,
    constraint groups_deleted_state_check check (
        (status = 'deleted' and deleted_at is not null)
        or (status <> 'deleted' and deleted_at is null)
    )
);

create table public.group_permissions (
    key text primary key check (key ~ '^[a-z_]+\.[a-z_]+$'),
    description text not null,
    created_at timestamptz not null default now()
);

create table public.group_roles (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    key text not null check (key ~ '^[a-z_]+$'),
    name text not null check (char_length(name) between 2 and 40),
    rank smallint not null check (rank between 0 and 100),
    is_system boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (group_id, key),
    unique (group_id, id)
);

create table public.group_role_permissions (
    role_id uuid not null references public.group_roles(id) on delete cascade,
    permission_key text not null references public.group_permissions(key) on delete cascade,
    allowed boolean not null default true,
    created_at timestamptz not null default now(),
    primary key (role_id, permission_key)
);

create table public.group_members (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role_id uuid not null,
    status text not null default 'active' check (status in ('active', 'pending', 'suspended', 'left', 'blocked')),
    invited_by uuid references auth.users(id) on delete set null,
    joined_at timestamptz not null default now(),
    last_active_at timestamptz,
    notification_level text not null default 'all' check (notification_level in ('all', 'mentions', 'muted')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (group_id, user_id),
    foreign key (group_id, role_id) references public.group_roles(group_id, id) on delete restrict
);

create table public.group_invitations (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    token_hash text not null unique,
    role_id uuid not null,
    invited_user_id uuid references auth.users(id) on delete cascade,
    invited_email text,
    status text not null default 'active' check (status in ('active', 'accepted', 'revoked', 'expired')),
    max_uses integer not null default 1 check (max_uses between 1 and 10000),
    use_count integer not null default 0 check (use_count >= 0 and use_count <= max_uses),
    expires_at timestamptz not null,
    created_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    foreign key (group_id, role_id) references public.group_roles(group_id, id) on delete restrict,
    constraint group_invitation_target_check check (invited_user_id is not null or invited_email is not null or max_uses > 1)
);

create table public.group_join_requests (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    message text not null default '' check (char_length(message) <= 500),
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
    reviewed_by uuid references auth.users(id) on delete set null,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index group_join_requests_one_pending_idx
    on public.group_join_requests(group_id, user_id)
    where status = 'pending';

create table public.group_posts (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    created_by uuid not null references auth.users(id) on delete restrict,
    type text not null default 'text' check (type in ('text', 'ayah', 'poll', 'task', 'system')),
    content text not null default '' check (char_length(content) <= 10000),
    ayah_surah integer check (ayah_surah between 1 and 114),
    ayah_number integer check (ayah_number > 0),
    visibility text not null default 'members' check (visibility in ('members', 'public')),
    status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
    client_request_id uuid,
    pinned_at timestamptz,
    pinned_by uuid references auth.users(id) on delete set null,
    edited_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    unique (group_id, created_by, client_request_id),
    unique (group_id, id),
    constraint group_posts_ayah_check check (
        type <> 'ayah' or (ayah_surah is not null and ayah_number is not null)
    ),
    constraint group_posts_deleted_state_check check (
        (status = 'deleted' and deleted_at is not null)
        or (status <> 'deleted' and deleted_at is null)
    )
);

create table public.post_comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null,
    group_id uuid not null references public.groups(id) on delete cascade,
    parent_comment_id uuid,
    created_by uuid not null references auth.users(id) on delete restrict,
    content text not null check (char_length(content) between 1 and 2000),
    status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    edited_at timestamptz,
    deleted_at timestamptz,
    unique (group_id, id),
    foreign key (group_id, post_id) references public.group_posts(group_id, id) on delete cascade,
    foreign key (group_id, parent_comment_id) references public.post_comments(group_id, id) on delete set null
);

create table public.post_reactions (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null,
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    reaction text not null default 'like' check (reaction in ('like', 'love', 'dua', 'insightful')),
    created_at timestamptz not null default now(),
    unique (post_id, user_id, reaction),
    foreign key (group_id, post_id) references public.group_posts(group_id, id) on delete cascade
);

create table public.post_attachments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null,
    group_id uuid not null references public.groups(id) on delete cascade,
    uploaded_by uuid not null references auth.users(id) on delete restrict,
    storage_path text not null unique,
    mime_type text not null,
    file_name text not null check (char_length(file_name) between 1 and 255),
    byte_size bigint not null check (byte_size between 1 and 26214400),
    width integer check (width > 0),
    height integer check (height > 0),
    sort_order smallint not null default 0,
    status text not null default 'ready' check (status in ('processing', 'ready', 'rejected', 'deleted')),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    unique (group_id, id),
    foreign key (group_id, post_id) references public.group_posts(group_id, id) on delete cascade
);

create table public.group_media (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    attachment_id uuid not null,
    source_post_id uuid,
    created_by uuid not null references auth.users(id) on delete restrict,
    status text not null default 'visible' check (status in ('visible', 'hidden', 'deleted')),
    created_at timestamptz not null default now(),
    deleted_at timestamptz,
    unique (group_id, attachment_id),
    foreign key (group_id, attachment_id) references public.post_attachments(group_id, id) on delete cascade,
    foreign key (group_id, source_post_id) references public.group_posts(group_id, id) on delete cascade
);

create table public.group_events (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    title text not null check (char_length(title) between 3 and 120),
    description text not null default '' check (char_length(description) <= 3000),
    starts_at timestamptz not null,
    ends_at timestamptz,
    timezone text not null default 'Europe/Amsterdam',
    location text,
    status text not null default 'scheduled' check (status in ('draft', 'scheduled', 'cancelled', 'completed', 'deleted')),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    unique (group_id, id),
    check (ends_at is null or ends_at >= starts_at)
);

create table public.group_event_attendees (
    event_id uuid not null,
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    response text not null default 'going' check (response in ('going', 'maybe', 'declined')),
    responded_at timestamptz not null default now(),
    primary key (event_id, user_id),
    foreign key (group_id, event_id) references public.group_events(group_id, id) on delete cascade
);

create table public.group_tasks (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    title text not null check (char_length(title) between 3 and 120),
    description text not null default '' check (char_length(description) <= 3000),
    task_type text not null default 'challenge' check (task_type in ('challenge', 'reading', 'memorization', 'custom')),
    target_value integer check (target_value > 0),
    target_unit text,
    starts_at timestamptz,
    due_at timestamptz,
    status text not null default 'active' check (status in ('draft', 'active', 'completed', 'cancelled', 'deleted')),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    unique (group_id, id),
    check (due_at is null or starts_at is null or due_at >= starts_at)
);

create table public.group_task_completions (
    task_id uuid not null,
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    progress integer not null default 0 check (progress >= 0),
    completed_at timestamptz,
    updated_at timestamptz not null default now(),
    primary key (task_id, user_id),
    foreign key (group_id, task_id) references public.group_tasks(group_id, id) on delete cascade
);

create table public.group_progress_entries (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    unit text not null check (unit in ('ayah', 'page', 'hizb', 'juz', 'surah', 'lesson', 'custom')),
    amount integer not null check (amount between 1 and 10000),
    source text not null default 'manual',
    reference_type text,
    reference_value integer,
    occurred_on date not null default current_date,
    created_at timestamptz not null default now()
);

create table public.group_rules (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    version integer not null check (version > 0),
    content text not null check (char_length(content) between 1 and 10000),
    status text not null default 'active' check (status in ('draft', 'active', 'archived')),
    created_by uuid not null references auth.users(id) on delete restrict,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (group_id, version)
);

create unique index group_rules_one_active_idx on public.group_rules(group_id) where status = 'active';

create table public.group_notification_preferences (
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    level text not null default 'all' check (level in ('all', 'mentions', 'important', 'muted')),
    push_enabled boolean not null default true,
    muted_until timestamptz,
    updated_at timestamptz not null default now(),
    primary key (group_id, user_id)
);

create table public.group_notifications (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null,
    title text not null check (char_length(title) between 1 and 160),
    body text not null default '' check (char_length(body) <= 1000),
    entity_type text,
    entity_id uuid,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

create table public.moderation_reports (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    reporter_id uuid not null references auth.users(id) on delete restrict,
    target_type text not null check (target_type in ('group', 'member', 'post', 'comment', 'media')),
    target_id uuid,
    reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
    details text not null default '' check (char_length(details) <= 2000),
    status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
    assigned_to uuid references auth.users(id) on delete set null,
    resolved_by uuid references auth.users(id) on delete set null,
    resolved_at timestamptz,
    resolution_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.group_audit_log (
    id bigint generated always as identity primary key,
    group_id uuid not null references public.groups(id) on delete cascade,
    actor_id uuid references auth.users(id) on delete set null,
    action text not null,
    target_type text,
    target_id uuid,
    metadata jsonb not null default '{}'::jsonb,
    request_id uuid,
    created_at timestamptz not null default now()
);

insert into public.group_permissions(key, description) values
    ('group.update', 'Edit group profile and settings'),
    ('group.delete', 'Soft-delete the group'),
    ('group.transfer', 'Transfer ownership'),
    ('group.security', 'Change sensitive access settings'),
    ('invitation.create', 'Create and revoke invitations'),
    ('join_request.manage', 'Approve or reject join requests'),
    ('member.read', 'View the member directory'),
    ('member.remove', 'Remove or restrict members'),
    ('role.assign', 'Assign roles below the actor rank'),
    ('post.create', 'Create posts'),
    ('post.moderate', 'Hide or delete posts'),
    ('post.pin', 'Pin and unpin posts'),
    ('comment.create', 'Create comments'),
    ('comment.moderate', 'Hide or delete comments'),
    ('reaction.create', 'Add reactions'),
    ('rules.update', 'Create a new active rules version'),
    ('media.upload', 'Upload media'),
    ('media.manage', 'Hide or delete group media'),
    ('event.create', 'Create and manage events'),
    ('task.create', 'Create and manage tasks'),
    ('progress.create', 'Record Quran progress'),
    ('report.manage', 'Review moderation reports'),
    ('audit.view', 'View the group audit log'),
    ('notification.send', 'Send important group notifications')
on conflict (key) do update set description = excluded.description;

create or replace function public.group_v2_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger groups_set_updated_at before update on public.groups
for each row execute function public.group_v2_set_updated_at();
create trigger group_roles_set_updated_at before update on public.group_roles
for each row execute function public.group_v2_set_updated_at();
create trigger group_members_set_updated_at before update on public.group_members
for each row execute function public.group_v2_set_updated_at();
create trigger group_invitations_set_updated_at before update on public.group_invitations
for each row execute function public.group_v2_set_updated_at();
create trigger group_join_requests_set_updated_at before update on public.group_join_requests
for each row execute function public.group_v2_set_updated_at();
create trigger group_posts_set_updated_at before update on public.group_posts
for each row execute function public.group_v2_set_updated_at();
create trigger post_comments_set_updated_at before update on public.post_comments
for each row execute function public.group_v2_set_updated_at();
create trigger group_events_set_updated_at before update on public.group_events
for each row execute function public.group_v2_set_updated_at();
create trigger group_tasks_set_updated_at before update on public.group_tasks
for each row execute function public.group_v2_set_updated_at();
create trigger group_task_completions_set_updated_at before update on public.group_task_completions
for each row execute function public.group_v2_set_updated_at();
create trigger group_rules_set_updated_at before update on public.group_rules
for each row execute function public.group_v2_set_updated_at();
create trigger group_notification_preferences_set_updated_at before update on public.group_notification_preferences
for each row execute function public.group_v2_set_updated_at();
create trigger moderation_reports_set_updated_at before update on public.moderation_reports
for each row execute function public.group_v2_set_updated_at();

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.group_members gm
        where gm.group_id = p_group_id
          and gm.user_id = (select auth.uid())
          and gm.status = 'active'
    );
$$;

create or replace function public.can_view_group(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.groups g
        where g.id = p_group_id
          and g.deleted_at is null
          and g.status <> 'deleted'
          and (
              g.privacy = 'public'
              or g.owner_id = (select auth.uid())
              or public.is_group_member(g.id)
          )
    );
$$;

create or replace function public.can_request_group_access(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.groups g
        where g.id = p_group_id
          and g.status = 'active'
          and g.deleted_at is null
          and g.privacy in ('public', 'restricted')
          and g.owner_id <> (select auth.uid())
          and not public.is_group_member(g.id)
    );
$$;

create or replace function public.group_role_rank(p_group_id uuid)
returns smallint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select coalesce(max(gr.rank), 0)::smallint
    from public.group_members gm
    join public.group_roles gr on gr.id = gm.role_id and gr.group_id = gm.group_id
    where gm.group_id = p_group_id
      and gm.user_id = (select auth.uid())
      and gm.status = 'active';
$$;

create or replace function public.has_group_permission(p_group_id uuid, p_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (
        select 1
        from public.groups g
        left join public.group_members gm
          on gm.group_id = g.id
         and gm.user_id = (select auth.uid())
         and gm.status = 'active'
        left join public.group_role_permissions grp
          on grp.role_id = gm.role_id
         and grp.permission_key = p_permission_key
         and grp.allowed
        where g.id = p_group_id
          and g.status = 'active'
          and g.deleted_at is null
          and (g.owner_id = (select auth.uid()) or grp.role_id is not null)
    );
$$;

create or replace function public.group_v2_bootstrap()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_owner_role_id uuid;
begin
    insert into public.group_roles(group_id, key, name, rank, is_system)
    values
        (new.id, 'owner', 'Owner', 100, true),
        (new.id, 'admin', 'Admin', 80, true),
        (new.id, 'moderator', 'Moderator', 50, true),
        (new.id, 'member', 'Member', 10, true);

    insert into public.group_role_permissions(role_id, permission_key, allowed)
    select gr.id, gp.key, true
    from public.group_roles gr
    cross join public.group_permissions gp
    where gr.group_id = new.id
      and (
          gr.key = 'owner'
          or (gr.key = 'admin' and gp.key not in ('group.delete', 'group.transfer', 'group.security'))
          or (gr.key = 'moderator' and gp.key in (
              'member.read', 'post.create', 'post.moderate', 'post.pin',
              'comment.create', 'comment.moderate', 'reaction.create',
              'media.upload', 'media.manage', 'progress.create',
              'report.manage', 'notification.send'
          ))
          or (gr.key = 'member' and gp.key in (
              'member.read', 'post.create', 'comment.create',
              'reaction.create', 'media.upload', 'progress.create'
          ))
      );

    select id into v_owner_role_id
    from public.group_roles
    where group_id = new.id and key = 'owner';

    insert into public.group_members(group_id, user_id, role_id, status)
    values (new.id, new.owner_id, v_owner_role_id, 'active');

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id)
    values (new.id, new.owner_id, 'group.created', 'group', new.id);

    return new;
end;
$$;

create trigger groups_bootstrap_after_insert
after insert on public.groups
for each row execute function public.group_v2_bootstrap();

create or replace function public.create_group_v2(
    p_code text,
    p_name text,
    p_description text default '',
    p_category text default 'general',
    p_language_code text default 'nl',
    p_privacy text default 'restricted'
)
returns public.groups
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_group public.groups%rowtype;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if upper(trim(p_code)) !~ '^[A-Z0-9]{3}-[0-9]{4}$' then
        raise exception using errcode = '22023', message = 'GROUP_CODE_INVALID';
    end if;
    if char_length(trim(p_name)) not between 3 and 80 then
        raise exception using errcode = '22023', message = 'GROUP_NAME_INVALID';
    end if;
    if p_privacy not in ('public', 'restricted', 'private') then
        raise exception using errcode = '22023', message = 'GROUP_PRIVACY_INVALID';
    end if;

    insert into public.groups(
        code, name, description, category, language_code, privacy, owner_id, updated_by
    ) values (
        upper(trim(p_code)), trim(p_name), trim(coalesce(p_description, '')),
        lower(trim(coalesce(p_category, 'general'))), trim(coalesce(p_language_code, 'nl')),
        p_privacy, v_user_id, v_user_id
    )
    returning * into v_group;

    return v_group;
exception
    when unique_violation then
        raise exception using errcode = '23505', message = 'GROUP_CODE_CONFLICT';
end;
$$;

create or replace function public.soft_delete_group_v2(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not exists (
        select 1 from public.groups
        where id = p_group_id and owner_id = v_user_id and deleted_at is null
    ) then
        raise exception using errcode = '42501', message = 'GROUP_OWNER_REQUIRED';
    end if;

    update public.groups
    set status = 'deleted', deleted_at = now(), updated_by = v_user_id
    where id = p_group_id;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id)
    values (p_group_id, v_user_id, 'group.soft_deleted', 'group', p_group_id);
end;
$$;

revoke all on function public.group_v2_set_updated_at() from public;
revoke all on function public.group_v2_bootstrap() from public;
revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.can_view_group(uuid) from public;
revoke all on function public.can_request_group_access(uuid) from public;
revoke all on function public.group_role_rank(uuid) from public;
revoke all on function public.has_group_permission(uuid, text) from public;
revoke all on function public.create_group_v2(text, text, text, text, text, text) from public;
revoke all on function public.soft_delete_group_v2(uuid) from public;

grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.can_view_group(uuid) to authenticated;
grant execute on function public.can_request_group_access(uuid) to authenticated;
grant execute on function public.group_role_rank(uuid) to authenticated;
grant execute on function public.has_group_permission(uuid, text) to authenticated;
grant execute on function public.create_group_v2(text, text, text, text, text, text) to authenticated;
grant execute on function public.soft_delete_group_v2(uuid) to authenticated;

alter table public.groups enable row level security;
alter table public.group_permissions enable row level security;
alter table public.group_roles enable row level security;
alter table public.group_role_permissions enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invitations enable row level security;
alter table public.group_join_requests enable row level security;
alter table public.group_posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_attachments enable row level security;
alter table public.group_media enable row level security;
alter table public.group_events enable row level security;
alter table public.group_event_attendees enable row level security;
alter table public.group_tasks enable row level security;
alter table public.group_task_completions enable row level security;
alter table public.group_progress_entries enable row level security;
alter table public.group_rules enable row level security;
alter table public.group_notification_preferences enable row level security;
alter table public.group_notifications enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.group_audit_log enable row level security;

create policy groups_select_visible on public.groups for select to authenticated
using (public.can_view_group(id));

create policy group_permissions_select on public.group_permissions for select to authenticated using (true);

create policy group_roles_select_visible on public.group_roles for select to authenticated
using (public.can_view_group(group_id));

create policy group_role_permissions_select_visible on public.group_role_permissions for select to authenticated
using (exists (
    select 1 from public.group_roles gr
    where gr.id = role_id and public.can_view_group(gr.group_id)
));

create policy group_members_select_visible on public.group_members for select to authenticated
using (public.can_view_group(group_id) and public.has_group_permission(group_id, 'member.read'));

create policy group_invitations_select_scoped on public.group_invitations for select to authenticated
using (
    created_by = (select auth.uid())
    or invited_user_id = (select auth.uid())
    or public.has_group_permission(group_id, 'invitation.create')
);
create policy group_invitations_insert_allowed on public.group_invitations for insert to authenticated
with check (created_by = (select auth.uid()) and public.has_group_permission(group_id, 'invitation.create'));

create policy group_join_requests_select_scoped on public.group_join_requests for select to authenticated
using (user_id = (select auth.uid()) or public.has_group_permission(group_id, 'join_request.manage'));
create policy group_join_requests_insert_self on public.group_join_requests for insert to authenticated
with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and public.can_request_group_access(group_id)
);

create policy group_posts_select_visible on public.group_posts for select to authenticated
using (
    public.can_view_group(group_id)
    and (status = 'published' or public.has_group_permission(group_id, 'post.moderate'))
);
create policy group_posts_insert_allowed on public.group_posts for insert to authenticated
with check (
    created_by = (select auth.uid())
    and status = 'published'
    and public.has_group_permission(group_id, 'post.create')
);

create policy post_comments_select_visible on public.post_comments for select to authenticated
using (
    public.can_view_group(group_id)
    and (status = 'published' or public.has_group_permission(group_id, 'comment.moderate'))
);
create policy post_comments_insert_allowed on public.post_comments for insert to authenticated
with check (
    created_by = (select auth.uid())
    and status = 'published'
    and public.has_group_permission(group_id, 'comment.create')
);

create policy post_reactions_select_visible on public.post_reactions for select to authenticated
using (public.can_view_group(group_id));
create policy post_reactions_insert_self on public.post_reactions for insert to authenticated
with check (user_id = (select auth.uid()) and public.has_group_permission(group_id, 'reaction.create'));
create policy post_reactions_delete_self on public.post_reactions for delete to authenticated
using (user_id = (select auth.uid()));

create policy post_attachments_select_visible on public.post_attachments for select to authenticated
using (public.can_view_group(group_id) and status = 'ready');
create policy post_attachments_insert_allowed on public.post_attachments for insert to authenticated
with check (uploaded_by = (select auth.uid()) and public.has_group_permission(group_id, 'media.upload'));

create policy group_media_select_visible on public.group_media for select to authenticated
using (public.can_view_group(group_id) and status = 'visible');

create policy group_events_select_visible on public.group_events for select to authenticated
using (public.can_view_group(group_id) and status not in ('draft', 'deleted'));
create policy group_events_insert_allowed on public.group_events for insert to authenticated
with check (created_by = (select auth.uid()) and public.has_group_permission(group_id, 'event.create'));

create policy group_event_attendees_select_visible on public.group_event_attendees for select to authenticated
using (public.can_view_group(group_id));
create policy group_event_attendees_insert_self on public.group_event_attendees for insert to authenticated
with check (user_id = (select auth.uid()) and public.is_group_member(group_id));

create policy group_tasks_select_visible on public.group_tasks for select to authenticated
using (public.can_view_group(group_id) and status not in ('draft', 'deleted'));
create policy group_tasks_insert_allowed on public.group_tasks for insert to authenticated
with check (created_by = (select auth.uid()) and public.has_group_permission(group_id, 'task.create'));

create policy group_task_completions_select_visible on public.group_task_completions for select to authenticated
using (public.can_view_group(group_id));
create policy group_task_completions_insert_self on public.group_task_completions for insert to authenticated
with check (user_id = (select auth.uid()) and public.is_group_member(group_id));

create policy group_progress_select_visible on public.group_progress_entries for select to authenticated
using (public.can_view_group(group_id));
create policy group_progress_insert_self on public.group_progress_entries for insert to authenticated
with check (user_id = (select auth.uid()) and public.has_group_permission(group_id, 'progress.create'));

create policy group_rules_select_visible on public.group_rules for select to authenticated
using (public.can_view_group(group_id) and status = 'active');
create policy group_rules_insert_allowed on public.group_rules for insert to authenticated
with check (created_by = (select auth.uid()) and public.has_group_permission(group_id, 'rules.update'));

create policy group_notification_preferences_select_self on public.group_notification_preferences for select to authenticated
using (user_id = (select auth.uid()));
create policy group_notification_preferences_insert_self on public.group_notification_preferences for insert to authenticated
with check (user_id = (select auth.uid()) and public.is_group_member(group_id));
create policy group_notification_preferences_update_self on public.group_notification_preferences for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy group_notifications_select_self on public.group_notifications for select to authenticated
using (user_id = (select auth.uid()));
create policy group_notifications_update_self on public.group_notifications for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy moderation_reports_select_scoped on public.moderation_reports for select to authenticated
using (reporter_id = (select auth.uid()) or public.has_group_permission(group_id, 'report.manage'));
create policy moderation_reports_insert_self on public.moderation_reports for insert to authenticated
with check (reporter_id = (select auth.uid()) and public.can_view_group(group_id) and status = 'open');

create policy group_audit_log_select_allowed on public.group_audit_log for select to authenticated
using (public.has_group_permission(group_id, 'audit.view'));

grant select on public.groups, public.group_permissions, public.group_roles,
    public.group_role_permissions, public.group_members, public.group_invitations,
    public.group_join_requests, public.group_posts, public.post_comments,
    public.post_reactions, public.post_attachments, public.group_media,
    public.group_events, public.group_event_attendees, public.group_tasks,
    public.group_task_completions, public.group_progress_entries, public.group_rules,
    public.group_notification_preferences, public.group_notifications,
    public.moderation_reports, public.group_audit_log to authenticated;

grant insert on public.group_invitations, public.group_join_requests, public.group_posts,
    public.post_comments, public.post_reactions, public.post_attachments,
    public.group_events, public.group_event_attendees, public.group_tasks,
    public.group_task_completions, public.group_progress_entries, public.group_rules,
    public.group_notification_preferences, public.moderation_reports to authenticated;

grant update on public.group_notification_preferences, public.group_notifications to authenticated;
grant delete on public.post_reactions to authenticated;
grant usage, select on sequence public.group_audit_log_id_seq to authenticated;

create index groups_owner_active_idx on public.groups(owner_id, created_at desc) where deleted_at is null;
create index groups_privacy_active_idx on public.groups(privacy, created_at desc) where status = 'active' and deleted_at is null;
create index group_members_group_status_idx on public.group_members(group_id, status, joined_at);
create index group_members_user_status_idx on public.group_members(user_id, status, joined_at desc);
create index group_roles_group_rank_idx on public.group_roles(group_id, rank desc);
create index group_invitations_group_status_idx on public.group_invitations(group_id, status, expires_at);
create index group_join_requests_queue_idx on public.group_join_requests(group_id, status, created_at);
create index group_posts_feed_idx on public.group_posts(group_id, status, created_at desc, id desc);
create index group_posts_pinned_idx on public.group_posts(group_id, pinned_at desc) where pinned_at is not null and status = 'published';
create index post_comments_post_idx on public.post_comments(post_id, status, created_at, id);
create index post_reactions_post_idx on public.post_reactions(post_id, reaction);
create index post_attachments_post_idx on public.post_attachments(post_id, sort_order);
create index group_media_gallery_idx on public.group_media(group_id, status, created_at desc, id desc);
create index group_events_schedule_idx on public.group_events(group_id, status, starts_at);
create index group_tasks_active_idx on public.group_tasks(group_id, status, due_at);
create index group_progress_user_date_idx on public.group_progress_entries(group_id, user_id, occurred_on desc);
create index group_notifications_inbox_idx on public.group_notifications(user_id, read_at, created_at desc);
create index moderation_reports_queue_idx on public.moderation_reports(group_id, status, created_at);
create index group_audit_log_timeline_idx on public.group_audit_log(group_id, created_at desc, id desc);

comment on table public.groups is 'Group Detail v2 root entity. Legacy reading_groups remains active during migration.';
comment on function public.has_group_permission(uuid, text) is 'Server-side capability check used by RLS and secured mutations.';
comment on table public.group_audit_log is 'Append-only audit trail. Clients receive SELECT only when audit.view is granted.';

commit;
