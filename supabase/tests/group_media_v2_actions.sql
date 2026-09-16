begin;

do $$
begin
    if not exists (
        select 1 from storage.buckets where id = 'group-media' and public = false
    ) then
        raise exception 'Private group-media bucket is missing';
    end if;
end;
$$;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from auth.users order by created_at limit 1),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
    'test.second_user_id',
    coalesce((select id::text from auth.users order by created_at offset 1 limit 1), ''),
    true
);
set local role authenticated;

do $$
declare
    v_group public.groups%rowtype;
    v_owner_id uuid := (select auth.uid());
    v_second_user_id uuid := nullif(current_setting('test.second_user_id', true), '')::uuid;
    v_group_code text;
    v_owner_media record;
    v_member_media record;
begin
    select 'MDA-' || lpad(candidate::text, 4, '0')
    into v_group_code
    from generate_series(0, 9999) candidate
    where not exists (
        select 1 from public.groups g
        where g.code = 'MDA-' || lpad(candidate::text, 4, '0')
    )
    order by candidate desc
    limit 1;
    if v_group_code is null then
        raise exception 'No free media test group code is available';
    end if;

    v_group := public.create_group_v2_full(
        v_group_code, 'Media action test', 'Rolled back after verification',
        'free_reading', 'page', 'none', null, 'restricted'
    );
    if not public.has_group_permission(v_group.id, 'media.upload') then
        raise exception 'Owner media.upload permission is missing';
    end if;
    if (storage.foldername(
        v_group.id::text || '/' || v_owner_id::text || '/00000000-0000-0000-0000-000000000701.jpg'
    ))[1] <> v_group.id::text then
        raise exception 'Storage group folder parsing failed';
    end if;

    insert into storage.objects(bucket_id, name)
    values (
        'group-media',
        v_group.id::text || '/' || v_owner_id::text || '/00000000-0000-0000-0000-000000000701.jpg'
    );

    select * into v_owner_media
    from public.register_group_media_v2(
        v_group.id,
        v_group.id::text || '/' || v_owner_id::text || '/00000000-0000-0000-0000-000000000701.jpg',
        'image/jpeg',
        'owner-photo.jpg',
        2048,
        'Media test owner'
    );

    if v_owner_media.can_delete is not true
       or (select count(*) from public.list_group_media_v2(v_group.id, 30, null)) <> 1 then
        raise exception 'Owner media registration/list contract failed';
    end if;

    if v_second_user_id is not null then
        perform set_config('request.jwt.claim.sub', v_second_user_id::text, true);
        perform public.join_group_v2_by_code(v_group.code, 'Media Tester');

        if (select can_delete from public.list_group_media_v2(v_group.id, 30, null) limit 1) is not false then
            raise exception 'Member unexpectedly received delete permission for owner media';
        end if;

        begin
            perform public.delete_group_media_v2(v_group.id, v_owner_media.id);
            raise exception 'Member unexpectedly deleted owner media';
        exception
            when insufficient_privilege then null;
        end;

        insert into storage.objects(bucket_id, name)
        values (
            'group-media',
            v_group.id::text || '/' || v_second_user_id::text || '/00000000-0000-0000-0000-000000000702.png'
        );

        select * into v_member_media
        from public.register_group_media_v2(
            v_group.id,
            v_group.id::text || '/' || v_second_user_id::text || '/00000000-0000-0000-0000-000000000702.png',
            'image/png',
            'member-photo.png',
            4096,
            'Media test member'
        );

        perform public.delete_group_media_v2(v_group.id, v_member_media.id);
        if (select status from public.group_media where id = v_member_media.id) <> 'deleted' then
            raise exception 'Uploader self-delete contract failed';
        end if;

        perform set_config('request.jwt.claim.sub', v_owner_id::text, true);
    end if;

    perform public.delete_group_media_v2(v_group.id, v_owner_media.id);
    if (select status from public.group_media where id = v_owner_media.id) <> 'deleted'
       or (select status from public.post_attachments where id = v_owner_media.attachment_id) <> 'deleted'
       or (select status from public.group_posts where id = v_owner_media.source_post_id) <> 'deleted' then
        raise exception 'Media soft-delete cascade contract failed';
    end if;

    if (
        select count(*) < (case when v_second_user_id is null then 2 else 4 end)
        from public.group_audit_log
        where group_id = v_group.id
          and action in ('media.uploaded', 'media.deleted')
    ) then
        raise exception 'Media audit events are missing';
    end if;
end;
$$;

reset role;
rollback;

select 'Group media v2 actions OK; test data rolled back' as result;
