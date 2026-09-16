begin;

select set_config(
    'request.jwt.claim.sub',
    (select id::text from auth.users order by created_at limit 1),
    true
);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
    v_group public.groups%rowtype;
    v_post public.group_posts%rowtype;
    v_comment public.post_comments%rowtype;
    v_progress_post_id uuid;
    v_liked boolean;
begin
    v_group := public.create_group_v2_full(
        'API-3001',
        'App API test',
        'Rolled back after verification',
        'free_reading',
        'page',
        'weekly',
        14,
        'restricted'
    );

    if v_group.goal_period <> 'weekly' or v_group.goal_target <> 14 then
        raise exception 'Full group configuration was not stored';
    end if;
    if (select count(*) from public.list_my_groups_v2() listed where listed.id = v_group.id) <> 1 then
        raise exception 'My groups read model did not return the new group';
    end if;
    if (select count(*) from public.list_group_members_v2(v_group.id)) <> 1 then
        raise exception 'Member read model did not return the owner';
    end if;

    v_group := public.update_group_v2_full(
        v_group.id,
        'App API updated',
        'Updated safely',
        'memorization',
        'ayah',
        'total',
        25,
        'private'
    );
    if v_group.privacy <> 'private' or v_group.progress_unit <> 'ayah' then
        raise exception 'Group update contract failed';
    end if;

    v_post := public.create_group_text_post_v2(
        v_group.id,
        'Testbericht',
        'API Tester'
    );
    if v_post.type <> 'text' or v_post.content <> 'Testbericht' then
        raise exception 'Text post contract failed';
    end if;

    v_progress_post_id := public.record_group_progress_v2(
        v_group.id,
        'ayah',
        5,
        'api_test',
        true,
        '5 ayat gelezen',
        'API Tester'
    );
    if v_progress_post_id is null then
        raise exception 'Progress feed post was not created';
    end if;
    if (select count(*) from public.group_progress_entries where group_id = v_group.id) <> 1 then
        raise exception 'Progress entry was not created exactly once';
    end if;

    v_liked := public.toggle_group_post_like_v2(v_group.id, v_post.id);
    if not v_liked then
        raise exception 'Like was not created';
    end if;
    v_liked := public.toggle_group_post_like_v2(v_group.id, v_post.id);
    if v_liked then
        raise exception 'Like was not removed';
    end if;

    v_comment := public.add_group_post_comment_v2(
        v_group.id,
        v_post.id,
        'Testreactie',
        'API Tester'
    );
    if v_comment.content <> 'Testreactie' then
        raise exception 'Comment contract failed';
    end if;

    if (select count(*) from public.group_audit_log
        where group_id = v_group.id and action = 'group.updated') <> 1 then
        raise exception 'Group update audit event is missing';
    end if;
end;
$$;

reset role;
rollback;

select 'Group Detail v2 app API OK; test data rolled back' as result;
