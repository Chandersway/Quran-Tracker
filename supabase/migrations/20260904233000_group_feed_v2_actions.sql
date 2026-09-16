begin;

create or replace function public.update_group_post_v2(
    p_group_id uuid,
    p_post_id uuid,
    p_content text
)
returns public.group_posts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_post public.group_posts%rowtype;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if char_length(trim(p_content)) not between 1 and 10000 then
        raise exception using errcode = '22023', message = 'GROUP_POST_CONTENT_INVALID';
    end if;

    select * into v_post
    from public.group_posts
    where id = p_post_id and group_id = p_group_id;

    if not found or v_post.status <> 'published' then
        raise exception using errcode = 'P0002', message = 'GROUP_POST_NOT_FOUND';
    end if;
    if v_post.created_by <> v_user_id or not public.is_group_member(p_group_id) then
        raise exception using errcode = '42501', message = 'GROUP_POST_EDIT_FORBIDDEN';
    end if;
    if v_post.type <> 'text' then
        raise exception using errcode = '22023', message = 'GROUP_POST_TYPE_NOT_EDITABLE';
    end if;

    update public.group_posts
    set content = trim(p_content), edited_at = now()
    where id = p_post_id and group_id = p_group_id
    returning * into v_post;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id)
    values (p_group_id, v_user_id, 'post.updated', 'post', p_post_id);

    return v_post;
end;
$$;

create or replace function public.set_group_post_pinned_v2(
    p_group_id uuid,
    p_post_id uuid,
    p_pinned boolean
)
returns public.group_posts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_post public.group_posts%rowtype;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'post.pin') then
        raise exception using errcode = '42501', message = 'GROUP_POST_PIN_FORBIDDEN';
    end if;
    if not exists (
        select 1 from public.group_posts
        where id = p_post_id and group_id = p_group_id and status = 'published'
    ) then
        raise exception using errcode = 'P0002', message = 'GROUP_POST_NOT_FOUND';
    end if;

    update public.group_posts
    set
        pinned_at = case when p_pinned then now() else null end,
        pinned_by = case when p_pinned then v_user_id else null end
    where id = p_post_id and group_id = p_group_id
    returning * into v_post;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id)
    values (
        p_group_id,
        v_user_id,
        case when p_pinned then 'post.pinned' else 'post.unpinned' end,
        'post',
        p_post_id
    );

    return v_post;
end;
$$;

create or replace function public.delete_group_post_v2(
    p_group_id uuid,
    p_post_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_post public.group_posts%rowtype;
    v_is_moderation boolean;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;

    select * into v_post
    from public.group_posts
    where id = p_post_id and group_id = p_group_id;

    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_POST_NOT_FOUND';
    end if;
    if v_post.status = 'deleted' then
        return p_post_id;
    end if;

    v_is_moderation := v_post.created_by <> v_user_id;
    if v_is_moderation and not public.has_group_permission(p_group_id, 'post.moderate') then
        raise exception using errcode = '42501', message = 'GROUP_POST_DELETE_FORBIDDEN';
    end if;
    if not v_is_moderation and not public.is_group_member(p_group_id) then
        raise exception using errcode = '42501', message = 'GROUP_POST_DELETE_FORBIDDEN';
    end if;

    update public.group_posts
    set
        status = 'deleted',
        deleted_at = now(),
        pinned_at = null,
        pinned_by = null
    where id = p_post_id and group_id = p_group_id;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id,
        v_user_id,
        case when v_is_moderation then 'post.moderated_delete' else 'post.deleted' end,
        'post',
        p_post_id,
        jsonb_build_object('author_id', v_post.created_by)
    );

    return p_post_id;
end;
$$;

create or replace function public.toggle_group_post_reaction_v2(
    p_group_id uuid,
    p_post_id uuid,
    p_reaction text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_reaction text := lower(trim(p_reaction));
    v_same_exists boolean;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'reaction.create') then
        raise exception using errcode = '42501', message = 'GROUP_REACTION_FORBIDDEN';
    end if;
    if v_reaction not in ('like', 'love', 'dua', 'insightful') then
        raise exception using errcode = '22023', message = 'GROUP_REACTION_INVALID';
    end if;
    if not exists (
        select 1 from public.group_posts
        where id = p_post_id and group_id = p_group_id and status = 'published'
    ) then
        raise exception using errcode = 'P0002', message = 'GROUP_POST_NOT_FOUND';
    end if;

    select exists (
        select 1 from public.post_reactions
        where post_id = p_post_id and group_id = p_group_id
          and user_id = v_user_id and reaction = v_reaction
    ) into v_same_exists;

    delete from public.post_reactions
    where post_id = p_post_id and group_id = p_group_id and user_id = v_user_id;

    if v_same_exists then
        return '';
    end if;

    insert into public.post_reactions(group_id, post_id, user_id, reaction)
    values (p_group_id, p_post_id, v_user_id, v_reaction);
    return v_reaction;
end;
$$;

create or replace function public.delete_group_post_comment_v2(
    p_group_id uuid,
    p_post_id uuid,
    p_comment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_comment public.post_comments%rowtype;
    v_is_moderation boolean;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;

    select * into v_comment
    from public.post_comments
    where id = p_comment_id and post_id = p_post_id and group_id = p_group_id;

    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_COMMENT_NOT_FOUND';
    end if;
    if v_comment.status = 'deleted' then
        return p_comment_id;
    end if;

    v_is_moderation := v_comment.created_by <> v_user_id;
    if v_is_moderation and not public.has_group_permission(p_group_id, 'comment.moderate') then
        raise exception using errcode = '42501', message = 'GROUP_COMMENT_DELETE_FORBIDDEN';
    end if;
    if not v_is_moderation and not public.is_group_member(p_group_id) then
        raise exception using errcode = '42501', message = 'GROUP_COMMENT_DELETE_FORBIDDEN';
    end if;

    update public.post_comments
    set status = 'deleted', deleted_at = now()
    where id = p_comment_id and post_id = p_post_id and group_id = p_group_id;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id, metadata)
    values (
        p_group_id,
        v_user_id,
        case when v_is_moderation then 'comment.moderated_delete' else 'comment.deleted' end,
        'comment',
        p_comment_id,
        jsonb_build_object('post_id', p_post_id, 'author_id', v_comment.created_by)
    );

    return p_comment_id;
end;
$$;

create or replace function public.report_group_post_v2(
    p_group_id uuid,
    p_post_id uuid,
    p_reason text,
    p_details text default ''
)
returns public.moderation_reports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user_id uuid := (select auth.uid());
    v_reason text := lower(trim(p_reason));
    v_report public.moderation_reports%rowtype;
    v_author_id uuid;
begin
    if v_user_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.can_view_group(p_group_id) then
        raise exception using errcode = '42501', message = 'GROUP_REPORT_FORBIDDEN';
    end if;
    if v_reason not in ('spam', 'harassment', 'inappropriate', 'misinformation', 'other') then
        raise exception using errcode = '22023', message = 'GROUP_REPORT_REASON_INVALID';
    end if;
    if char_length(trim(coalesce(p_details, ''))) > 2000 then
        raise exception using errcode = '22023', message = 'GROUP_REPORT_DETAILS_INVALID';
    end if;

    select created_by into v_author_id
    from public.group_posts
    where id = p_post_id and group_id = p_group_id and status = 'published';

    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_POST_NOT_FOUND';
    end if;
    if v_author_id = v_user_id then
        raise exception using errcode = '42501', message = 'GROUP_REPORT_OWN_POST_FORBIDDEN';
    end if;

    select * into v_report
    from public.moderation_reports
    where group_id = p_group_id
      and reporter_id = v_user_id
      and target_type = 'post'
      and target_id = p_post_id
      and status in ('open', 'reviewing')
    order by created_at desc
    limit 1;

    if found then
        return v_report;
    end if;

    insert into public.moderation_reports(
        group_id, reporter_id, target_type, target_id, reason, details
    ) values (
        p_group_id, v_user_id, 'post', p_post_id, v_reason,
        left(trim(coalesce(p_details, '')), 2000)
    ) returning * into v_report;

    insert into public.group_audit_log(group_id, actor_id, action, target_type, target_id)
    values (p_group_id, v_user_id, 'report.created', 'post', p_post_id);

    return v_report;
end;
$$;

revoke all on function public.update_group_post_v2(uuid, uuid, text) from public;
revoke all on function public.set_group_post_pinned_v2(uuid, uuid, boolean) from public;
revoke all on function public.delete_group_post_v2(uuid, uuid) from public;
revoke all on function public.toggle_group_post_reaction_v2(uuid, uuid, text) from public;
revoke all on function public.delete_group_post_comment_v2(uuid, uuid, uuid) from public;
revoke all on function public.report_group_post_v2(uuid, uuid, text, text) from public;

grant execute on function public.update_group_post_v2(uuid, uuid, text) to authenticated;
grant execute on function public.set_group_post_pinned_v2(uuid, uuid, boolean) to authenticated;
grant execute on function public.delete_group_post_v2(uuid, uuid) to authenticated;
grant execute on function public.toggle_group_post_reaction_v2(uuid, uuid, text) to authenticated;
grant execute on function public.delete_group_post_comment_v2(uuid, uuid, uuid) to authenticated;
grant execute on function public.report_group_post_v2(uuid, uuid, text, text) to authenticated;

comment on function public.update_group_post_v2(uuid, uuid, text) is
    'Author-only text post edit with membership validation and audit trail.';
comment on function public.set_group_post_pinned_v2(uuid, uuid, boolean) is
    'Permission-checked pin mutation for published group posts.';
comment on function public.delete_group_post_v2(uuid, uuid) is
    'Author or post moderator soft-delete with audit trail.';
comment on function public.toggle_group_post_reaction_v2(uuid, uuid, text) is
    'Sets one reaction per user and post, or removes the currently selected reaction.';
comment on function public.delete_group_post_comment_v2(uuid, uuid, uuid) is
    'Author or comment moderator soft-delete with audit trail.';
comment on function public.report_group_post_v2(uuid, uuid, text, text) is
    'Creates an idempotent open moderation report for a visible post.';

commit;
