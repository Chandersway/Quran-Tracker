-- Run in a TEST database after applying the migration, as postgres.
-- Requires one active membership and an invitation belonging to the same group.
-- All test mutations are rolled back, including counters and audit records.
begin;
do $$
declare
    m public.group_members%rowtype;
    i public.group_invitations%rowtype;
    before_member jsonb;
    after_member jsonb;
    before_invite jsonb;
    after_invite jsonb;
    before_audit bigint;
    result public.groups;
    test_token text := gen_random_uuid()::text;
begin
    select gm.* into m from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.status = 'active' and g.status = 'active' and g.deleted_at is null
      and exists (select 1 from public.group_invitations gi where gi.group_id = gm.group_id)
    limit 1;
    if not found then
        raise exception 'TEST FIXTURE REQUIRED: active member and invitation in an active test group';
    end if;
    select gi.* into i from public.group_invitations gi where gi.group_id = m.group_id limit 1;
    perform set_config('request.jwt.claim.sub', m.user_id::text, true);
    perform set_config('request.jwt.claims', jsonb_build_object('sub', m.user_id, 'role', 'authenticated')::text, true);
    update public.group_invitations set
        token_hash = encode(extensions.digest(test_token, 'sha256'), 'hex'),
        use_count = max_uses, status = 'accepted', expires_at = now() - interval '1 day'
    where id = i.id;
    select to_jsonb(gm) into before_member from public.group_members gm where id = m.id;
    select to_jsonb(gi) into before_invite from public.group_invitations gi where id = i.id;
    select count(*) into before_audit from public.group_audit_log where group_id = m.group_id;

    result := public.accept_group_invitation_v2(test_token, 'Must not overwrite');
    result := public.accept_group_invitation_v2(test_token, 'Retry must not overwrite');
    if result.id <> m.group_id then raise exception 'Wrong group returned'; end if;
    select to_jsonb(gm) into after_member from public.group_members gm where id = m.id;
    select to_jsonb(gi) into after_invite from public.group_invitations gi where id = i.id;
    if before_member is distinct from after_member then raise exception 'Membership changed'; end if;
    if before_invite is distinct from after_invite then raise exception 'Invitation changed'; end if;
    if before_audit <> (select count(*) from public.group_audit_log where group_id = m.group_id) then
        raise exception 'Duplicate audit event';
    end if;

    update public.group_members set status = 'blocked' where id = m.id;
    begin
        perform public.accept_group_invitation_v2(test_token, null);
        raise exception 'Blocked member was accepted';
    exception when insufficient_privilege then
        if sqlerrm <> 'GROUP_MEMBER_BLOCKED' then raise; end if;
    end;
    raise notice 'PASS: repeated exhausted/expired invite preserves membership, role, counter and audit; blocked member denied';
end;
$$;
rollback;
