-- Isolated QA only. The runner pins the local Docker project. Every change rolls back.
begin;
select set_config('test.owner', (select id::text from auth.users where email like 'wirdna-qa-%@example.invalid' order by created_at limit 1), true);
select set_config('test.member', (select id::text from auth.users where email like 'wirdna-qa-%@example.invalid' order by created_at offset 1 limit 1), true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;
do $$
declare
  g public.groups%rowtype;
  owner_id uuid := current_setting('test.owner')::uuid;
  member_id uuid := current_setting('test.member')::uuid;
  code text;
  denied boolean := false;
  settings jsonb := '{"canPostMessages":false,"canShareProgress":true,"canComment":false,"canInviteMembers":false}';
begin
  if owner_id is null or member_id is null then raise exception 'Two fabricated QA users required'; end if;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  select 'PAR-' || lpad(n::text, 4, '0') into code from generate_series(0,9999) n
  where not exists (select 1 from public.groups where groups.code = 'PAR-' || lpad(n::text,4,'0')) limit 1;
  g := public.create_group_v3_full(code, 'Progress parity fixture', '', 'free_reading', 'page', 'total', 10, 'public', settings);
  perform set_config('request.jwt.claim.sub', member_id::text, true);
  perform public.join_group_v2_by_code(code, 'Parity member');
  perform public.record_group_progress_v2(g.id, 'page', 2, 'parity-private', false, 'Must not publish');
  if (select count(*) from public.group_progress_entries where group_id = g.id) <> 1 then raise exception 'Private save missing'; end if;
  if (select count(*) from public.group_posts where group_id = g.id) <> 0 then raise exception 'Private save published a post'; end if;
  begin
    perform public.record_group_progress_v2(g.id, 'page', 3, 'parity-denied-share', true, 'Denied share');
  exception when insufficient_privilege then
    if sqlerrm <> 'GROUP_POST_FORBIDDEN' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'Share without post permission was accepted'; end if;
  if (select count(*) from public.group_progress_entries where group_id = g.id) <> 1 then raise exception 'Rejected sharing partially saved progress'; end if;
  if (select count(*) from public.group_posts where group_id = g.id) <> 0 then raise exception 'Rejected sharing inserted a post'; end if;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform public.set_group_member_permissions_v1(g.id, settings || '{"canPostMessages":true}');
  perform set_config('request.jwt.claim.sub', member_id::text, true);
  perform public.record_group_progress_v2(g.id, 'page', 3, 'parity-explicit-share', true, 'Read 3 pages.');
  if (select count(*) from public.group_progress_entries where group_id = g.id) <> 2 then raise exception 'Allowed share failed to save progress'; end if;
  if (select count(*) from public.group_posts where group_id = g.id and content = 'Read 3 pages.') <> 1 then raise exception 'Allowed share failed to publish exact message'; end if;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  perform public.set_group_member_permissions_v1(g.id, settings || '{"canPostMessages":true,"canShareProgress":false}');
  perform set_config('request.jwt.claim.sub', member_id::text, true);
  denied := false;
  begin
    perform public.record_group_progress_v2(g.id, 'page', 4, 'parity-no-progress', false);
  exception when insufficient_privilege then
    if sqlerrm <> 'GROUP_PROGRESS_FORBIDDEN' then raise; end if;
    denied := true;
  end;
  if not denied or (select count(*) from public.group_progress_entries where group_id = g.id) <> 2 then raise exception 'Progress permission was not enforced'; end if;
end;
$$;
rollback;
select 'PASS: private progress, denied-share rollback, explicit atomic share and revoked progress permission' as result;
