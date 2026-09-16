begin;

alter table public.groups add column if not exists group_logo_path text;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('group-logos', 'group-logos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

create policy group_logos_read on storage.objects for select to authenticated
using (bucket_id = 'group-logos' and exists (
  select 1 from public.groups g where g.id::text = split_part(storage.objects.name,'/',1)
  and g.group_logo_path = storage.objects.name and g.deleted_at is null and g.status = 'active'
  and public.can_view_group(g.id)
));
create policy group_logos_insert on storage.objects for insert to authenticated
with check (bucket_id = 'group-logos' and exists (
  select 1 from public.groups g where g.id::text = split_part(storage.objects.name,'/',1)
  and g.deleted_at is null and g.status = 'active'
  and public.has_group_permission(g.id, 'group.update')
));
create policy group_logos_delete on storage.objects for delete to authenticated
using (bucket_id = 'group-logos' and exists (
  select 1 from public.groups g where g.id::text = split_part(storage.objects.name,'/',1)
  and g.group_logo_path is distinct from storage.objects.name
  and public.has_group_permission(g.id, 'group.update')
));

create or replace function public.get_group_logo_v1(p_code text)
returns table(logo_path text)
language plpgsql security definer set search_path = public, auth
as $$
declare v_group public.groups%rowtype;
begin
  if auth.uid() is null then raise exception 'Log opnieuw in.' using errcode='28000'; end if;
  select * into v_group from public.groups where upper(code)=upper(trim(p_code))
    and status='active' and deleted_at is null;
  if not found then raise exception 'Groep niet gevonden.' using errcode='P0002'; end if;
  if not public.can_view_group(v_group.id) then raise exception 'Geen toegang.' using errcode='42501'; end if;
  return query select v_group.group_logo_path;
end $$;

create or replace function public.set_group_logo_v1(p_group_id uuid, p_logo_path text)
returns void language plpgsql security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null then raise exception 'Log opnieuw in.' using errcode='28000'; end if;
  perform 1 from public.groups where id=p_group_id and status='active' and deleted_at is null for update;
  if not found then raise exception 'Groep niet gevonden.' using errcode='P0002'; end if;
  if not public.has_group_permission(p_group_id,'group.update') then
    raise exception 'Alleen groepsbeheerders mogen het logo wijzigen.' using errcode='42501';
  end if;
  if p_logo_path is not null and (
    split_part(p_logo_path,'/',1) <> p_group_id::text or not exists (
      select 1 from storage.objects where bucket_id='group-logos' and name=p_logo_path
    )
  ) then raise exception 'Ongeldige groepsafbeelding.' using errcode='22023'; end if;
  update public.groups set group_logo_path=p_logo_path, updated_at=now() where id=p_group_id;
  insert into public.group_audit_log(group_id,actor_id,action,target_type,target_id,metadata)
  values(p_group_id,auth.uid(),'group.logo_updated','group',p_group_id,
    jsonb_build_object('removed',p_logo_path is null));
end $$;

revoke all on function public.get_group_logo_v1(text) from public;
revoke all on function public.set_group_logo_v1(uuid,text) from public;
grant execute on function public.get_group_logo_v1(text) to authenticated;
grant execute on function public.set_group_logo_v1(uuid,text) to authenticated;
notify pgrst, 'reload schema';
commit;
