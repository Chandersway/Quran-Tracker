-- QA ONLY. Preserve the original migrations, then prevent their hosted dispatcher
-- endpoint from ever being contacted by fabricated local-account tests.
begin;
create or replace function public.dispatch_group_push_v1() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
    return;
end $$;
select cron.unschedule(jobid) from cron.job where jobname = 'group-push-dispatch-v1';
commit;
