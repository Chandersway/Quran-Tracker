begin;

-- Fail closed. Shared group content has RESTRICT foreign keys by design.
-- Do not silently delete other members' conversations or group tasks.
create or replace function public.account_deletion_status_v1()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    caller uuid := auth.uid();
    dependency record;
    linked boolean;
begin
    if caller is null or not exists (select 1 from auth.users where id = caller) then
        raise exception 'authentication_required' using errcode = '28000';
    end if;
    if exists (select 1 from public.groups where owner_id = caller) then
        return 'owns_groups';
    end if;
    if exists (
        select 1 from storage.objects o
        where coalesce(to_jsonb(o)->>'owner_id', to_jsonb(o)->>'owner') = caller::text
    ) then
        return 'linked_data';
    end if;
    -- Account data with ON DELETE CASCADE / SET NULL is handled by Postgres.
    -- Unknown/custom restrictive dependencies must be reviewed, never bypassed.
    for dependency in
        select n.nspname, t.relname, a.attname
        from pg_catalog.pg_constraint c
        join pg_catalog.pg_class t on t.oid = c.conrelid
        join pg_catalog.pg_namespace n on n.oid = t.relnamespace
        join pg_catalog.pg_attribute a on a.attrelid = t.oid and a.attnum = c.conkey[1]
        where c.contype = 'f' and c.confrelid = 'auth.users'::regclass
          and c.confdeltype in ('a', 'r') and cardinality(c.conkey) = 1
    loop
        execute format('select exists(select 1 from %I.%I where %I = $1)',
            dependency.nspname, dependency.relname, dependency.attname)
            into linked using caller;
        if linked then return 'linked_data'; end if;
    end loop;
    return 'ready';
end;
$$;

create or replace function public.delete_my_account_v1(confirmation_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    caller uuid := auth.uid();
    account_email text;
    deletion_status text;
    recent_auth boolean;
begin
    if caller is null then raise exception 'authentication_required' using errcode = '28000'; end if;
    -- A signed but revoked session must not be able to delete an account.
    if not exists (
        select 1 from auth.sessions
        where user_id = caller and id::text = (auth.jwt()->>'session_id')
    ) then raise exception 'recent_login_required' using errcode = '28000'; end if;

    select email into account_email from auth.users where id = caller for update;
    if account_email is null or lower(trim(confirmation_email)) <> lower(account_email)
       or confirmation_email is null then
        raise exception 'confirmation_required' using errcode = '22023';
    end if;
    -- Refreshing a token does NOT count as reauthentication. Use the signed
    -- authentication-method timestamp, not JWT iat or last_sign_in_at.
    select exists (
        select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr', '[]'::jsonb)) method
        where method->>'method' in ('password', 'oauth', 'otp')
          and case when method->>'timestamp' ~ '^[0-9]+$'
              then (method->>'timestamp')::numeric between
                  extract(epoch from now()) - 300 and extract(epoch from now()) + 30
              else false end
    ) into recent_auth;
    if not recent_auth then raise exception 'recent_login_required' using errcode = '28000'; end if;

    deletion_status := public.account_deletion_status_v1();
    if deletion_status <> 'ready' then
        raise exception '%', deletion_status using errcode = '23503';
    end if;
    -- Atomic: any unanticipated FK/trigger error rolls back the entire action.
    -- No client-selected user ID, service key, or arbitrary table name accepted.
    delete from auth.users where id = caller;
end;
$$;

revoke all on function public.account_deletion_status_v1() from public, anon;
revoke all on function public.delete_my_account_v1(text) from public, anon;
grant execute on function public.account_deletion_status_v1() to authenticated;
grant execute on function public.delete_my_account_v1(text) to authenticated;

commit;
