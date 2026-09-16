begin;

-- A parent comment may be removed without clearing the child's non-null group_id.
alter table public.post_comments
    drop constraint if exists post_comments_group_id_parent_comment_id_fkey;

alter table public.post_comments
    add constraint post_comments_parent_comment_id_fkey
    foreign key (parent_comment_id)
    references public.post_comments(id)
    on delete set null;

create or replace function public.validate_post_comment_parent_scope()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if new.parent_comment_id is not null and not exists (
        select 1
        from public.post_comments parent
        where parent.id = new.parent_comment_id
          and parent.group_id = new.group_id
          and parent.post_id = new.post_id
    ) then
        raise exception using errcode = '23514', message = 'POST_COMMENT_PARENT_SCOPE_MISMATCH';
    end if;
    return new;
end;
$$;

create trigger post_comments_validate_parent_scope
before insert or update of parent_comment_id, group_id, post_id
on public.post_comments
for each row execute function public.validate_post_comment_parent_scope();

revoke all on function public.validate_post_comment_parent_scope() from public;

commit;
