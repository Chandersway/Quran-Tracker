begin;

-- Joining copied the account name into the field also used for explicit group aliases.
-- Only retain an override when the user actually saved a custom group profile.
update public.group_members gm set display_name_snapshot = null
where gm.display_name_snapshot is not null and not exists (
    select 1 from public.group_audit_log a
    where a.group_id = gm.group_id and a.actor_id = gm.user_id
      and a.action = 'member.group_profile_updated'
      and a.metadata ->> 'custom_name' = 'true'
);

create or replace function public.group_join_uses_profile_name()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
    new.display_name_snapshot := null;
    return new;
end; $$;
create trigger group_join_uses_profile_name before insert on public.group_members
for each row execute function public.group_join_uses_profile_name();

create or replace function public.sync_group_author_names()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_user uuid; v_group uuid;
begin
    if tg_table_name = 'profiles' then
        v_user := new.id;
    else
        v_user := new.user_id;
        v_group := new.group_id;
    end if;
    update public.group_posts post set display_name_snapshot = coalesce(nullif(gm.display_name_snapshot,''), nullif(p.display_name,''), 'Lid')
    from public.group_members gm left join public.profiles p on p.id = gm.user_id
    where gm.user_id = v_user and (v_group is null or gm.group_id = v_group)
      and post.created_by = gm.user_id and post.group_id = gm.group_id;
    update public.post_comments comment set display_name_snapshot = coalesce(nullif(gm.display_name_snapshot,''), nullif(p.display_name,''), 'Lid')
    from public.group_members gm left join public.profiles p on p.id = gm.user_id
    where gm.user_id = v_user and (v_group is null or gm.group_id = v_group)
      and comment.created_by = gm.user_id and comment.group_id = gm.group_id;
    return new;
end; $$;
create trigger profile_name_updates_group_authors after update of display_name on public.profiles
for each row when (old.display_name is distinct from new.display_name) execute function public.sync_group_author_names();
create trigger group_alias_updates_authors after update of display_name_snapshot on public.group_members
for each row when (old.display_name_snapshot is distinct from new.display_name_snapshot) execute function public.sync_group_author_names();

create or replace function public.group_content_uses_current_name()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
    select coalesce(nullif(gm.display_name_snapshot,''), nullif(p.display_name,''), 'Lid')
    into new.display_name_snapshot from public.group_members gm
    left join public.profiles p on p.id = gm.user_id
    where gm.group_id = new.group_id and gm.user_id = new.created_by;
    new.display_name_snapshot := coalesce(new.display_name_snapshot, 'Lid');
    return new;
end; $$;
create trigger group_post_current_author before insert on public.group_posts
for each row execute function public.group_content_uses_current_name();
create trigger group_comment_current_author before insert on public.post_comments
for each row execute function public.group_content_uses_current_name();

-- Bring existing posts and comments in line without changing their content or authorship.
update public.group_posts post set display_name_snapshot = coalesce(nullif(gm.display_name_snapshot,''), nullif(p.display_name,''), 'Lid')
from public.group_members gm left join public.profiles p on p.id = gm.user_id
where post.created_by = gm.user_id and post.group_id = gm.group_id;
update public.post_comments comment set display_name_snapshot = coalesce(nullif(gm.display_name_snapshot,''), nullif(p.display_name,''), 'Lid')
from public.group_members gm left join public.profiles p on p.id = gm.user_id
where comment.created_by = gm.user_id and comment.group_id = gm.group_id;

revoke all on function public.group_join_uses_profile_name() from public;
revoke all on function public.sync_group_author_names() from public;
revoke all on function public.group_content_uses_current_name() from public;
commit;
