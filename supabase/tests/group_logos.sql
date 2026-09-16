-- Synthetic fixtures only; all changes roll back.
begin;
select set_config('request.jwt.claim.sub',(select id::text from auth.users order by created_at limit 1),true);
select set_config('request.jwt.claim.role','authenticated',true);
set local role authenticated;
do $$
declare g public.groups%rowtype; c text; p text; owner_uid uuid := auth.uid();
begin
  select 'LOG-'||lpad(n::text,4,'0') into c from generate_series(0,9999) n
  where not exists(select 1 from public.groups where code='LOG-'||lpad(n::text,4,'0')) order by n desc limit 1;
  g := public.create_group_v2_full(c,'Logo contract test','Temporary fixture','free_reading','page','none',null,'restricted');
  if (select logo_path from public.get_group_logo_v1(c)) is not null then raise exception 'Default failed'; end if;
  p := g.id::text||'/test.png';
  insert into storage.objects(bucket_id,name) values('group-logos',p);
  perform public.set_group_logo_v1(g.id,p);
  if (select logo_path from public.get_group_logo_v1(c)) is distinct from p then raise exception 'Save failed'; end if;
  if not exists(select 1 from storage.objects where bucket_id='group-logos' and name=p) then raise exception 'Read policy failed'; end if;
  begin
    perform public.set_group_logo_v1(g.id,gen_random_uuid()::text||'/other.png');
    raise exception 'Foreign path accepted';
  exception when sqlstate '22023' then null; end;
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  begin
    perform public.set_group_logo_v1(g.id,null);
    raise exception 'Unauthorized write accepted';
  exception when sqlstate '42501' then null; end;
  begin
    perform public.get_group_logo_v1(c);
    raise exception 'Unauthorized read accepted';
  exception when sqlstate '42501' then null; end;
  if exists(select 1 from storage.objects where bucket_id='group-logos' and name=p) then raise exception 'Storage leak'; end if;
  perform set_config('request.jwt.claim.sub',owner_uid::text,true);
  perform public.set_group_logo_v1(g.id,null);
  if (select logo_path from public.get_group_logo_v1(c)) is not null then raise exception 'Reset failed'; end if;
end $$;
rollback;
select 'Group logo tests passed; fixtures rolled back' as result;
