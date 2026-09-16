create policy "groups delete owner"
on public.reading_groups
for delete
to authenticated
using ((select auth.uid()) = owner_id);
