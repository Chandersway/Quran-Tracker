begin;

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
    v_post public.group_posts%rowtype;
    v_comment public.post_comments%rowtype;
    v_reaction text;
    v_owner_id uuid := (select auth.uid());
    v_second_user_id uuid := nullif(current_setting('test.second_user_id', true), '')::uuid;
    v_report public.moderation_reports%rowtype;
    v_duplicate_report public.moderation_reports%rowtype;
begin
    v_group := public.create_group_v2_full(
        'FED-5001', 'Feed action test', 'Rolled back after verification',
        'free_reading', 'page', 'none', null, 'restricted'
    );

    v_post := public.create_group_text_post_v2(v_group.id, 'Origineel', 'Feed Tester');
    v_post := public.update_group_post_v2(v_group.id, v_post.id, 'Bewerkt');
    if v_post.content <> 'Bewerkt' or v_post.edited_at is null then
        raise exception 'Post edit contract failed';
    end if;

    v_post := public.set_group_post_pinned_v2(v_group.id, v_post.id, true);
    if v_post.pinned_at is null then
        raise exception 'Post pin contract failed';
    end if;
    v_post := public.set_group_post_pinned_v2(v_group.id, v_post.id, false);
    if v_post.pinned_at is not null then
        raise exception 'Post unpin contract failed';
    end if;

    v_reaction := public.toggle_group_post_reaction_v2(v_group.id, v_post.id, 'dua');
    if v_reaction <> 'dua' then
        raise exception 'Reaction create contract failed';
    end if;
    v_reaction := public.toggle_group_post_reaction_v2(v_group.id, v_post.id, 'love');
    if v_reaction <> 'love' or (
        select count(*) from public.post_reactions
        where group_id = v_group.id and post_id = v_post.id
    ) <> 1 then
        raise exception 'Reaction replacement contract failed';
    end if;
    v_reaction := public.toggle_group_post_reaction_v2(v_group.id, v_post.id, 'love');
    if v_reaction <> '' then
        raise exception 'Reaction removal contract failed';
    end if;

    begin
        perform public.report_group_post_v2(v_group.id, v_post.id, 'other', 'Own post');
        raise exception 'Reporting an own post unexpectedly succeeded';
    exception
        when insufficient_privilege then null;
    end;

    if v_second_user_id is not null then
        perform set_config('request.jwt.claim.sub', v_second_user_id::text, true);
        perform public.join_group_v2_by_code(v_group.code, 'Report Tester');

        v_report := public.report_group_post_v2(
            v_group.id, v_post.id, 'spam', 'Transactional report test'
        );
        v_duplicate_report := public.report_group_post_v2(
            v_group.id, v_post.id, 'spam', 'Should return the existing report'
        );
        if v_report.id <> v_duplicate_report.id then
            raise exception 'Report idempotency contract failed';
        end if;

        begin
            perform public.set_group_post_pinned_v2(v_group.id, v_post.id, true);
            raise exception 'Member pin unexpectedly succeeded';
        exception
            when insufficient_privilege then null;
        end;
        begin
            perform public.delete_group_post_v2(v_group.id, v_post.id);
            raise exception 'Member moderation delete unexpectedly succeeded';
        exception
            when insufficient_privilege then null;
        end;

        perform set_config('request.jwt.claim.sub', v_owner_id::text, true);
    end if;

    v_comment := public.add_group_post_comment_v2(
        v_group.id, v_post.id, 'Tijdelijke reactie', 'Feed Tester'
    );
    perform public.delete_group_post_comment_v2(v_group.id, v_post.id, v_comment.id);
    if (select status from public.post_comments where id = v_comment.id) <> 'deleted' then
        raise exception 'Comment soft-delete contract failed';
    end if;

    perform public.delete_group_post_v2(v_group.id, v_post.id);
    if (select status from public.group_posts where id = v_post.id) <> 'deleted' then
        raise exception 'Post soft-delete contract failed';
    end if;

    if (select count(*) from public.group_audit_log
        where group_id = v_group.id and action in (
            'post.updated', 'post.pinned', 'post.unpinned', 'comment.deleted', 'post.deleted'
        )) <> 5 then
        raise exception 'Expected feed audit events are missing';
    end if;
end;
$$;

reset role;
rollback;

select 'Group feed v2 actions OK; test data rolled back' as result;
