begin;
select set_config('test.owner',(select id::text from auth.users order by created_at limit 1),true);
select set_config('test.member',(select id::text from auth.users order by created_at offset 1 limit 1),true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$
declare g public.groups%rowtype; p public.group_posts%rowtype; c public.post_comments%rowtype; r public.moderation_reports%rowtype; code text;
begin
    perform set_config('request.jwt.claim.sub',current_setting('test.owner'),true);
    select 'DEL-'||lpad(n::text,4,'0') into code from generate_series(0,9999) n
    where not exists(select 1 from public.groups where groups.code='DEL-'||lpad(n::text,4,'0')) limit 1;
    g:=public.create_group_v2_full(code,'Comment delete test','','free_reading','page','none',null,'public');
    p:=public.create_group_text_post_v2(g.id,'Test post');
    perform set_config('request.jwt.claim.sub',current_setting('test.member'),true);
    perform public.join_group_v2_by_code(code,'Test member');
    c:=public.add_group_post_comment_v2(g.id,p.id,'Test own comment');
    begin
        insert into public.post_comments(group_id,post_id,created_by,content)
        values (g.id,p.id,auth.uid(),'');
        raise exception 'Empty published comment accepted';
    exception when check_violation then null; end;
    perform public.delete_group_post_comment_v2(g.id,p.id,c.id);
    if exists(select 1 from public.post_comments where id=c.id and status='published') then
        raise exception 'Deleted comment still published';
    end if;
    perform public.delete_group_post_comment_v2(g.id,p.id,c.id);
    r:=public.report_group_post_v2(g.id,p.id,'spam','Rollback test');
    if r.status<>'open' then raise exception 'Report not open'; end if;
    if (select status from public.group_posts where id=p.id)<>'published' then
        raise exception 'Report unexpectedly removed post';
    end if;
end; $$;
rollback;
select 'PASS: member deletes own comment; retry safe; report stored without deleting post' as result;
