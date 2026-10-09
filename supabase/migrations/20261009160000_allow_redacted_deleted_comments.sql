begin;

-- The deployed delete RPC erases the text and marks the comment deleted.
-- Keep the non-empty requirement for visible/hidden comments, but permit
-- an erased body on a deleted tombstone. Authorization policies are unchanged.
alter table public.post_comments drop constraint post_comments_content_check;
alter table public.post_comments add constraint post_comments_content_check
    check (char_length(content) <= 2000 and (status = 'deleted' or char_length(content) >= 1));

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
    set content = '', status = 'deleted', deleted_at = now()
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

commit;
