-- Local, rollback-only test. No provider requests can leave this transaction.
begin;
update public.notification_deliveries set scheduled_at = now() + interval '7 days',
    lease_until = now() + interval '7 days' where status in ('pending','processing');
delete from vault.secrets where name = 'group_push_base_url';
select vault.create_secret('http://127.0.0.1:9', 'group_push_base_url');
do $$
declare a uuid; b uuid; g public.groups%rowtype; p public.group_posts%rowtype;
 e uuid; e_general uuid; d uuid; installation uuid := gen_random_uuid(); code text; r record; v_claim uuid; n integer;
begin
 select id into a from auth.users order by created_at limit 1;
 select id into b from auth.users order by created_at offset 1 limit 1;
 if a is null or b is null then raise exception 'Two local identities required'; end if;
 select 'PST-'||lpad(i::text,4,'0') into code from generate_series(0,9999) i
 where not exists(select 1 from public.groups where groups.code='PST-'||lpad(i::text,4,'0')) limit 1;
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 g := public.create_group_v2_full(code,'Local post push test','','free_reading','page','none',null,'public');
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform public.join_group_v2_by_code(code,'Local recipient');
 insert into public.notification_preferences(user_id,enabled,"update") values(b,true,true)
 on conflict(user_id) do update set enabled=true,"update"=true;
 update public.user_devices set active=false where user_id=b;
 perform public.register_push_device_v2(installation,'local-test-'||installation,'ios',true,'UTC',false,1320,420,'en');
 select id into d from public.user_devices where user_id=b and installation_id=installation;
 delete from public.group_notification_preferences where group_id=g.id and user_id=b;
 perform set_config('request.jwt.claim.sub',a::text,true);
 select count(*) into n from net.http_request_queue;
 p := public.create_group_text_post_v2(g.id,'Private body must not leak');
 if (select count(*) from net.http_request_queue) <= n then raise exception 'No immediate configured dispatch'; end if;
 select id into e from public.group_notifications where user_id=b and source_key='post:'||p.id;
 if e is null then raise exception 'Missing member event'; end if;
 if not public.notification_group_push_allowed(e,d) then raise exception 'Missing override should default all as settings RPC'; end if;
 if exists(select 1 from public.group_notifications where user_id=a and source_key='post:'||p.id) then raise exception 'Self event'; end if;
 if (select count(*) from public.notification_deliveries where event_id=e and device_id=d) <> 1 then raise exception 'Delivery dedupe'; end if;
 if exists(select 1 from public.get_group_push_target_v2(e)) then raise exception 'Wrong account target'; end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 if not exists(select 1 from public.get_group_push_target_v2(e) where kind='group_post' and post_id=p.id and group_code=code) then raise exception 'Missing authenticated target'; end if;
 select * into r from public.claim_group_push_v3() where event_id=e;
 if r.kind is distinct from 'group_post' or r.platform is distinct from 'ios' then raise exception 'v3 kind/platform'; end if;
 v_claim := r.claim;
 if not public.group_push_claim_allowed_v1(r.delivery_id,v_claim) then raise exception 'Claim denied'; end if;
 if exists(select 1 from public.claim_group_push_v3() where event_id=e) then raise exception 'Duplicate leased delivery'; end if;
 perform public.finish_group_push_v1(r.delivery_id,gen_random_uuid(),'sent');
 if not exists(select 1 from public.notification_deliveries where id=r.delivery_id and status='processing') then raise exception 'Wrong claim finished'; end if;
 perform public.update_group_notification_preferences_v2(g.id,'important',true,null);
 if public.notification_group_push_allowed(e,d) then raise exception 'Important includes ordinary posts'; end if;
 insert into public.group_notifications(group_id,user_id,type,title,body,entity_type,entity_id)
 values(g.id,b,'update','General update','','post',p.id) returning id into e_general;
 if not public.notification_group_push_allowed(e_general,d) then raise exception 'Existing update without source key blocked'; end if;
 if exists(select 1 from public.notification_deliveries where event_id=e and status<>'cancelled') then raise exception 'Preference did not cancel claim'; end if;
 perform public.update_group_notification_preferences_v2(g.id,'all',true,null);
 if exists(select 1 from public.notification_deliveries where event_id=e and status<>'cancelled') then raise exception 'Preference resurrected delivery'; end if;
 update public.notification_preferences set "update"=false where user_id=b;
 if public.notification_group_push_allowed(e,d) then raise exception 'Global update disabled'; end if;
 update public.notification_preferences set "update"=true where user_id=b;
 perform public.update_group_notification_preferences_v2(g.id,'mentions',true,null);
 if public.notification_group_push_allowed(e,d) then raise exception 'Mentions includes ordinary posts'; end if;
 perform public.update_group_notification_preferences_v2(g.id,'all',true,null);
 update public.notification_deliveries set status='pending',scheduled_at=now(),attempts=0 where event_id=e;
 update public.user_devices set quiet_enabled=true,quiet_start=extract(hour from now() at time zone 'UTC')::integer*60+extract(minute from now() at time zone 'UTC')::integer,quiet_end=(extract(hour from now() at time zone 'UTC')::integer*60+extract(minute from now() at time zone 'UTC')::integer+1)%1440 where id=d;
 if exists(select 1 from public.claim_group_push_v3() where event_id=e) then raise exception 'Quiet hours claimed'; end if;
 if not exists(select 1 from public.notification_deliveries where event_id=e and scheduled_at>now()) then raise exception 'Quiet not deferred'; end if;
 update public.user_devices set quiet_enabled=false where id=d;
 update public.group_notifications set created_at=now()-interval '25 hours' where id=e;
 update public.notification_deliveries set scheduled_at=now() where event_id=e;
 perform public.claim_group_push_v3();
 if exists(select 1 from public.notification_deliveries where event_id=e and status<>'cancelled') then raise exception 'Expired event not cancelled'; end if;
 update public.group_posts set status='deleted',deleted_at=now() where id=p.id;
 if exists(select 1 from public.get_group_push_target_v2(e)) then raise exception 'Deleted target resolved'; end if;
 if has_function_privilege('authenticated','public.claim_group_push_v3()','execute') then raise exception 'Untrusted worker permission'; end if;
 if has_function_privilege('anon','public.get_group_push_target_v2(uuid)','execute') then raise exception 'Anonymous target permission'; end if;
end $$;
rollback;
select 'PASS: group post recipient/auth/kind/platform/claim/dedupe/preferences/quiet/expiry/deletion' as result;
