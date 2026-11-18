-- Additive opt-in for community feed invalidations. Deployment is deferred.
-- Authorization stays in existing SELECT RLS policies. No user data is rewritten.
-- A VPS adapter may publish equivalent invalidations through its own transport.
do $$
declare
    table_name text;
begin
    -- Local isolated QA can run with Realtime disabled and no publication.
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        create publication supabase_realtime;
    end if;
    foreach table_name in array array[
        'group_posts', 'post_comments', 'post_reactions', 'group_media', 'post_attachments'
    ] loop
        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public' and tablename = table_name
        ) then
            execute format('alter publication supabase_realtime add table public.%I', table_name);
        end if;
    end loop;
end;
$$;

-- Consumers subscribe to INSERT/UPDATE with a group filter and ignore raw payload
-- content. DELETE cannot be reliably filtered under Realtime RLS; authorized
-- polling every 30 seconds reconciles deletions and hidden rows. No FULL replica
-- identity is needed or enabled. Existing RLS is intentionally unchanged.
