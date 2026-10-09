begin;
select set_config('request.jwt.claim.sub', (select id::text from public.profiles order by id limit 1), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
do $$
declare g public.groups%rowtype; post public.group_posts%rowtype; c public.post_comments%rowtype; code text;
begin
    update public.profiles set display_name = 'Chosen profile' where id = auth.uid();
    select 'NAM-' || lpad(n::text,4,'0') into code from generate_series(0,9999) n
    where not exists (select 1 from public.groups where groups.code = 'NAM-' || lpad(n::text,4,'0')) limit 1;
    g := public.create_group_v2_full(code, 'Name regression test', '', 'free_reading', 'page', 'none', null, 'public');
    post := public.create_group_text_post_v2(g.id, 'Test post', 'Old provider name');
    c := public.add_group_post_comment_v2(g.id, post.id, 'Test comment', 'Old provider name');
    if post.display_name_snapshot <> 'Chosen profile' or c.display_name_snapshot <> 'Chosen profile' then
        raise exception 'Provider name leaked into content';
    end if;
    update public.profiles set display_name = 'Renamed profile' where id = auth.uid();
    if (select display_name_snapshot from public.post_comments where id = c.id) <> 'Renamed profile'
       or (select display_name_snapshot from public.group_posts where id = post.id) <> 'Renamed profile' then
        raise exception 'Existing content did not follow rename';
    end if;
    perform public.update_my_group_profile_v2(g.id, 'Group alias', null);
    update public.profiles set display_name = 'Another profile' where id = auth.uid();
    if (select display_name_snapshot from public.post_comments where id = c.id) <> 'Group alias' then
        raise exception 'Explicit group alias was overwritten';
    end if;
    perform public.update_my_group_profile_v2(g.id, null, null);
    if (select display_name_snapshot from public.post_comments where id = c.id) <> 'Another profile' then
        raise exception 'Reset alias did not restore current profile';
    end if;
end; $$;
rollback;
select 'PASS: current names, historical comments, rename, group aliases, reset' as result;
