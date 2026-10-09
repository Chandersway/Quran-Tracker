begin;
-- Transaction-scoped fixtures: no notifications or device records survive this test.
do $$
declare a uuid; b uuid; g public.groups%rowtype; p public.group_posts%rowtype;
 c public.post_comments%rowtype; e uuid; d uuid; installation uuid := gen_random_uuid();
 code text; claimed record; n integer;
begin
 select id into a from auth.users order by created_at limit 1;
 select id into b from auth.users order by created_at offset 1 limit 1;
 if a is null or b is null then raise exception 'Two test identities required'; end if;
 select 'PUS-'||lpad(i::text,4,'0') into code from generate_series(0,9999) i
 where not exists(select 1 from public.groups where groups.code='PUS-'||lpad(i::text,4,'0')) limit 1;
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 g := public.create_group_v2_full(code,'Push rollback test','','free_reading','page','none',null,'public');
 p := public.create_group_text_post_v2(g.id,'Push rollback test');
 insert into public.notification_preferences(user_id,enabled,reaction) values(a,true,true)
 on conflict(user_id) do update set enabled=true,reaction=true;
 perform public.register_push_device_v1(installation,'test-only-'||installation,true,'Europe/Amsterdam',false,1320,420,'nl');
 select id into d from public.user_devices where user_id=a and installation_id=installation;
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform public.join_group_v2_by_code(code,'Test member');
 select count(*) into n from net.http_request_queue;
 c := public.add_group_post_comment_v2(g.id,p.id,'Test reply');
 if (select count(*) from net.http_request_queue) <= n then raise exception 'No immediate dispatcher request'; end if;
 select id into e from public.group_notifications where user_id=a and source_key='comment:'||c.id;
 if e is null then raise exception 'Author did not get event'; end if;
 if exists(select 1 from public.group_notifications where user_id=b and source_key='comment:'||c.id) then raise exception 'Self notification'; end if;
 if not exists(select 1 from public.notification_deliveries where event_id=e and device_id=d) then raise exception 'No queued delivery'; end if;
 if exists(select 1 from public.get_group_push_target_v1(e)) then raise exception 'Wrong account can open event'; end if;
 perform set_config('request.jwt.claim.sub',a::text,true);
 if not exists(select 1 from public.get_group_push_target_v1(e) where post_id=p.id) then raise exception 'Target not resolved'; end if;
 perform public.update_group_notification_preferences_v2(g.id,'muted',false,null);
 if public.notification_group_push_allowed(e,d) then raise exception 'Muted allowed'; end if;
 if exists(select 1 from public.notification_deliveries where event_id=e and device_id=d and status<>'cancelled') then raise exception 'Mute did not cancel queued work'; end if;
 perform public.update_group_notification_preferences_v2(g.id,'all',true,null);
 if not public.notification_group_push_allowed(e,d) then raise exception 'Unmuted denied'; end if;
 if exists(select 1 from public.notification_deliveries where event_id=e and device_id=d and status<>'cancelled') then raise exception 'Unmute resurrected old push'; end if;
 update public.notification_deliveries set status='processing',claim_token=gen_random_uuid(),lease_until=now()+interval '2 minutes' where event_id=e and device_id=d;
 update public.notification_preferences set enabled=false where user_id=a;
 if public.notification_group_push_allowed(e,d) then raise exception 'Global disable allowed'; end if;
 if exists(select 1 from public.notification_deliveries where event_id=e and device_id=d and status<>'cancelled') then raise exception 'Global disable did not cancel claimed work'; end if;
 update public.notification_preferences set enabled=true where user_id=a;
 perform public.unregister_push_device_v1(installation);
 if public.notification_group_push_allowed(e,d) then raise exception 'Signed out device allowed'; end if;
 perform public.register_push_device_v1(installation,'test-only-'||installation,true,'Europe/Amsterdam',false,1320,420,'nl');
 c := public.add_group_post_comment_v2(g.id,p.id,'Author replying to discussion');
 if not exists(select 1 from public.group_notifications where user_id=b and source_key='comment:'||c.id) then raise exception 'Participant not notified'; end if;
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform public.register_push_device_v1(installation,'test-only-'||installation,true,'Europe/Amsterdam',false,1320,420,'en');
 if exists(select 1 from public.user_devices where installation_id=installation and user_id=a and active) then raise exception 'Old account still registered'; end if;
 if has_function_privilege('authenticated','public.claim_group_push_v1()','execute') then raise exception 'Untrusted dispatcher access'; end if;
end $$;
rollback;
select 'PASS: immediate dispatch, mute cancellation, no resurrection, global disable, recipients, account isolation and sign-out' as result;
