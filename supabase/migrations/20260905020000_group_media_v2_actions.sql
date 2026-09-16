begin;

alter table public.group_posts
    drop constraint if exists group_posts_type_check;

alter table public.group_posts
    add constraint group_posts_type_check
        check (type in ('text', 'ayah', 'poll', 'task', 'system', 'progress', 'media'));

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
) values (
    'group-media',
    'group-media',
    false,
    10485760,
    array[
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'image/heic', 'image/heif'
    ]::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists group_media_objects_select_v2 on storage.objects;
drop policy if exists group_media_objects_insert_v2 on storage.objects;
drop policy if exists group_media_objects_delete_v2 on storage.objects;

create policy group_media_objects_select_v2
on storage.objects for select to authenticated
using (
    bucket_id = 'group-media'
    and exists (
        select 1
        from public.groups g
        where g.id::text = (storage.foldername(objects.name))[1]
          and public.can_view_group(g.id)
    )
);

create policy group_media_objects_insert_v2
on storage.objects for insert to authenticated
with check (
    bucket_id = 'group-media'
    and (storage.foldername(name))[2] = (select auth.uid())::text
    and exists (
        select 1
        from public.groups g
        where g.id::text = (storage.foldername(objects.name))[1]
          and public.has_group_permission(g.id, 'media.upload')
    )
);

create policy group_media_objects_delete_v2
on storage.objects for delete to authenticated
using (
    bucket_id = 'group-media'
    and exists (
        select 1
        from public.groups g
        where g.id::text = (storage.foldername(objects.name))[1]
          and (
              (storage.foldername(name))[2] = (select auth.uid())::text
              or public.has_group_permission(g.id, 'media.manage')
          )
    )
);

create or replace function public.register_group_media_v2(
    p_group_id uuid,
    p_storage_path text,
    p_mime_type text,
    p_file_name text,
    p_byte_size bigint,
    p_caption text default '',
    p_width integer default null,
    p_height integer default null
)
returns table (
    id uuid,
    attachment_id uuid,
    source_post_id uuid,
    storage_path text,
    mime_type text,
    file_name text,
    byte_size bigint,
    width integer,
    height integer,
    created_by uuid,
    display_name text,
    avatar_url text,
    caption text,
    created_at timestamptz,
    can_delete boolean
)
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_post public.group_posts%rowtype;
    v_attachment public.post_attachments%rowtype;
    v_media public.group_media%rowtype;
    v_display_name text;
    v_avatar_url text;
    v_caption text := trim(coalesce(p_caption, ''));
    v_file_name text := trim(coalesce(p_file_name, ''));
    v_mime_type text := lower(trim(coalesce(p_mime_type, '')));
    v_expected_prefix text;
begin
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;
    if not public.has_group_permission(p_group_id, 'media.upload') then
        raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED';
    end if;
    if v_mime_type not in (
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'image/heic', 'image/heif'
    ) then
        raise exception using errcode = '22023', message = 'MEDIA_TYPE_NOT_ALLOWED';
    end if;
    if p_byte_size not between 1 and 10485760 then
        raise exception using errcode = '22023', message = 'MEDIA_SIZE_INVALID';
    end if;
    if char_length(v_caption) > 1000 then
        raise exception using errcode = '22023', message = 'MEDIA_CAPTION_TOO_LONG';
    end if;
    if char_length(v_file_name) not between 1 and 255
       or v_file_name ~ '[/\\]' then
        raise exception using errcode = '22023', message = 'MEDIA_FILE_NAME_INVALID';
    end if;
    if (p_width is not null and p_width <= 0)
       or (p_height is not null and p_height <= 0) then
        raise exception using errcode = '22023', message = 'MEDIA_DIMENSIONS_INVALID';
    end if;

    v_expected_prefix := p_group_id::text || '/' || v_actor_id::text || '/';
    if p_storage_path is null
       or left(p_storage_path, char_length(v_expected_prefix)) <> v_expected_prefix
       or char_length(p_storage_path) > 512
       or p_storage_path ~ '(\.\.|//|\\)'
       or p_storage_path !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.[a-z0-9]{2,5}$' then
        raise exception using errcode = '22023', message = 'MEDIA_STORAGE_PATH_INVALID';
    end if;
    if not exists (
        select 1
        from storage.objects so
        where so.bucket_id = 'group-media'
          and so.name = p_storage_path
    ) then
        raise exception using errcode = 'P0002', message = 'MEDIA_OBJECT_NOT_FOUND';
    end if;

    select
        coalesce(nullif(p.display_name, ''), split_part(coalesce(u.email, ''), '@', 1), 'Lid'),
        p.avatar_url
    into v_display_name, v_avatar_url
    from auth.users u
    left join public.profiles p on p.id = u.id
    where u.id = v_actor_id;

    insert into public.group_posts (
        group_id, created_by, type, content, display_name_snapshot
    ) values (
        p_group_id, v_actor_id, 'media', v_caption, left(v_display_name, 80)
    )
    returning * into v_post;

    insert into public.post_attachments (
        post_id, group_id, uploaded_by, storage_path, mime_type,
        file_name, byte_size, width, height, status
    ) values (
        v_post.id, p_group_id, v_actor_id, p_storage_path, v_mime_type,
        v_file_name, p_byte_size, p_width, p_height, 'ready'
    )
    returning * into v_attachment;

    insert into public.group_media (
        group_id, attachment_id, source_post_id, created_by, status
    ) values (
        p_group_id, v_attachment.id, v_post.id, v_actor_id, 'visible'
    )
    returning * into v_media;

    insert into public.group_audit_log(
        group_id, actor_id, action, target_type, target_id, metadata
    ) values (
        p_group_id,
        v_actor_id,
        'media.uploaded',
        'media',
        v_media.id,
        jsonb_build_object(
            'attachment_id', v_attachment.id,
            'mime_type', v_mime_type,
            'byte_size', p_byte_size
        )
    );

    return query select
        v_media.id,
        v_attachment.id,
        v_post.id,
        v_attachment.storage_path,
        v_attachment.mime_type,
        v_attachment.file_name,
        v_attachment.byte_size,
        v_attachment.width,
        v_attachment.height,
        v_actor_id,
        v_display_name,
        v_avatar_url,
        v_post.content,
        v_media.created_at,
        true;
end;
$$;

create or replace function public.list_group_media_v2(
    p_group_id uuid,
    p_limit integer default 30,
    p_before timestamptz default null
)
returns table (
    id uuid,
    attachment_id uuid,
    source_post_id uuid,
    storage_path text,
    mime_type text,
    file_name text,
    byte_size bigint,
    width integer,
    height integer,
    created_by uuid,
    display_name text,
    avatar_url text,
    caption text,
    created_at timestamptz,
    can_delete boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        gm.id,
        pa.id,
        gm.source_post_id,
        pa.storage_path,
        pa.mime_type,
        pa.file_name,
        pa.byte_size,
        pa.width,
        pa.height,
        pa.uploaded_by,
        coalesce(
            nullif(p.display_name, ''),
            nullif(gp.display_name_snapshot, ''),
            'Lid ' || left(pa.uploaded_by::text, 6)
        ),
        p.avatar_url,
        gp.content,
        gm.created_at,
        (
            pa.uploaded_by = (select auth.uid())
            or public.has_group_permission(p_group_id, 'media.manage')
        )
    from public.group_media gm
    join public.post_attachments pa
      on pa.id = gm.attachment_id and pa.group_id = gm.group_id
    left join public.group_posts gp
      on gp.id = gm.source_post_id and gp.group_id = gm.group_id
    left join public.profiles p on p.id = pa.uploaded_by
    where gm.group_id = p_group_id
      and gm.status = 'visible'
      and gm.deleted_at is null
      and pa.status = 'ready'
      and pa.deleted_at is null
      and public.can_view_group(p_group_id)
      and (p_before is null or gm.created_at < p_before)
    order by gm.created_at desc, gm.id desc
    limit greatest(1, least(coalesce(p_limit, 30), 60));
$$;

create or replace function public.delete_group_media_v2(
    p_group_id uuid,
    p_media_id uuid
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_actor_id uuid := (select auth.uid());
    v_media public.group_media%rowtype;
    v_uploaded_by uuid;
    v_storage_path text;
begin
    if v_actor_id is null then
        raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
    end if;

    select gm.* into v_media
    from public.group_media gm
    where gm.id = p_media_id
      and gm.group_id = p_group_id
      and gm.status = 'visible'
    for update;
    if not found then
        raise exception using errcode = 'P0002', message = 'GROUP_MEDIA_NOT_FOUND';
    end if;

    select pa.uploaded_by, pa.storage_path
    into v_uploaded_by, v_storage_path
    from public.post_attachments pa
    where pa.id = v_media.attachment_id
      and pa.group_id = p_group_id;

    if v_uploaded_by <> v_actor_id
       and not public.has_group_permission(p_group_id, 'media.manage') then
        raise exception using errcode = '42501', message = 'GROUP_PERMISSION_DENIED';
    end if;

    update public.group_media
    set status = 'deleted', deleted_at = now()
    where id = v_media.id;

    update public.post_attachments
    set status = 'deleted', deleted_at = now()
    where id = v_media.attachment_id and group_id = p_group_id;

    if v_media.source_post_id is not null then
        update public.group_posts
        set status = 'deleted', deleted_at = now()
        where id = v_media.source_post_id
          and group_id = p_group_id
          and status <> 'deleted';
    end if;

    insert into public.group_audit_log(
        group_id, actor_id, action, target_type, target_id, metadata
    ) values (
        p_group_id,
        v_actor_id,
        'media.deleted',
        'media',
        v_media.id,
        jsonb_build_object(
            'attachment_id', v_media.attachment_id,
            'source_post_id', v_media.source_post_id
        )
    );

    return v_storage_path;
end;
$$;

revoke all on function public.register_group_media_v2(uuid, text, text, text, bigint, text, integer, integer) from public;
revoke all on function public.list_group_media_v2(uuid, integer, timestamptz) from public;
revoke all on function public.delete_group_media_v2(uuid, uuid) from public;

grant execute on function public.register_group_media_v2(uuid, text, text, text, bigint, text, integer, integer) to authenticated;
grant execute on function public.list_group_media_v2(uuid, integer, timestamptz) to authenticated;
grant execute on function public.delete_group_media_v2(uuid, uuid) to authenticated;

comment on function public.register_group_media_v2(uuid, text, text, text, bigint, text, integer, integer) is
    'Registers an uploaded private group image as a feed post, attachment and gallery item after server-side validation.';
comment on function public.list_group_media_v2(uuid, integer, timestamptz) is
    'Cursor-ready group media gallery endpoint. Storage paths are resolved to short-lived signed URLs by the app.';
comment on function public.delete_group_media_v2(uuid, uuid) is
    'Soft-deletes media metadata and its source post. Uploaders may delete their own media; media managers may moderate all.';

commit;
