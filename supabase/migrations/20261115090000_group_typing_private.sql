-- Private typing notifications. No chat posts, draft text or typing-state table.
-- realtime.send has Realtime's internal transport retention; clients never replay it.
-- Fan out only to CURRENT eligible recipients: a removed member's cached channel
-- authorization must not keep receiving new group activity.
begin;

create or replace function public.can_receive_group_typing_v1(p_topic text)
returns boolean
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
    v_group_id uuid;
    v_recipient uuid;
begin
    if p_topic is null or p_topic !~ '^group-typing:v1:[0-9a-f-]{36}:[0-9a-f-]{36}$' then
        return false;
    end if;
    begin
        v_group_id := split_part(p_topic, ':', 3)::uuid;
        v_recipient := split_part(p_topic, ':', 4)::uuid;
    exception when invalid_text_representation then
        return false;
    end;
    return v_recipient = (select auth.uid())
       and public.is_group_member(v_group_id)
       and public.has_group_permission(v_group_id, 'member.read');
end;
$$;

create or replace function public.get_group_typing_channel_v1(p_code text)
returns jsonb
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
declare
    v_actor uuid := (select auth.uid());
    v_group_id uuid;
    v_topic text;
begin
    if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
    select id into v_group_id from public.groups
    where code = upper(btrim(p_code)) and status = 'active' and deleted_at is null;
    v_topic := 'group-typing:v1:' || v_group_id::text || ':' || v_actor::text;
    if not coalesce(public.can_receive_group_typing_v1(v_topic), false) then
        raise exception 'GROUP_ACCESS_DENIED';
    end if;
    return jsonb_build_object('group_id', v_group_id, 'topic', v_topic, 'server_time', clock_timestamp());
end;
$$;

create or replace function public.publish_group_typing_v1(p_group_id uuid, p_typing boolean)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
    v_actor uuid := (select auth.uid());
    v_recipient uuid;
    v_payload jsonb;
begin
    if v_actor is null then raise exception 'AUTH_REQUIRED'; end if;
    if p_typing is null then raise exception 'INVALID_TYPING_STATE'; end if;
    if not public.is_group_member(p_group_id)
       or not public.has_group_permission(p_group_id, 'post.create') then
        raise exception 'GROUP_ACCESS_DENIED';
    end if;
    -- Both start AND stop use the same server timestamp formula. It is also an
    -- ordering key, so an old delayed start cannot override a newer stop.
    v_payload := jsonb_build_object(
        'user_id', v_actor,
        'typing', p_typing,
        'expires_at', clock_timestamp() + interval '8 seconds'
    );
    for v_recipient in
        select gm.user_id
        from public.group_members gm
        join public.groups g on g.id = gm.group_id
        where gm.group_id = p_group_id and gm.status = 'active'
          and gm.user_id <> v_actor and g.status = 'active' and g.deleted_at is null
          and (gm.user_id = g.owner_id or exists (
              select 1 from public.group_role_permissions rp
              where rp.role_id = gm.role_id and rp.permission_key = 'member.read' and rp.allowed
          ))
    loop
        perform realtime.send(v_payload, 'typing',
            'group-typing:v1:' || p_group_id::text || ':' || v_recipient::text, true);
    end loop;
end;
$$;

revoke all on function public.can_receive_group_typing_v1(text) from public, anon;
revoke all on function public.get_group_typing_channel_v1(text) from public, anon;
revoke all on function public.publish_group_typing_v1(uuid, boolean) from public, anon;
grant execute on function public.can_receive_group_typing_v1(text) to authenticated;
grant execute on function public.get_group_typing_channel_v1(text) to authenticated;
grant execute on function public.publish_group_typing_v1(uuid, boolean) to authenticated;

-- Realtime owns this table and already enables RLS. Do not ALTER its ownership
-- or RLS settings. Namespace-scoped restrictive guards survive broader future
-- policies: clients cannot spoof server identities or read another recipient.
drop policy if exists group_typing_receive_v1 on realtime.messages;
create policy group_typing_receive_v1 on realtime.messages
for select to authenticated
using (extension = 'broadcast' and topic = (select realtime.topic())
       and public.can_receive_group_typing_v1(topic));

drop policy if exists group_typing_read_guard_v1 on realtime.messages;
create policy group_typing_read_guard_v1 on realtime.messages
as restrictive for select to public
using (topic not like 'group-typing:%' or
       (extension = 'broadcast' and topic = (select realtime.topic())
        and public.can_receive_group_typing_v1(topic)));

drop policy if exists group_typing_write_guard_v1 on realtime.messages;
create policy group_typing_write_guard_v1 on realtime.messages
as restrictive for insert to public
with check (topic not like 'group-typing:%');

commit;
