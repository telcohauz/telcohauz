-- Prevent shop takeover by role reassignment.
create or replace function pos_private.admin_assign_member_core(
 p_shop uuid,p_user uuid,p_role text
) returns jsonb language plpgsql security definer set search_path = ''
as $fn$
declare v_actor_role text;v_target_role text;v_owner_count integer;
begin
 if not pos_private.can_admin_shop(p_shop) then raise exception 'Admin access denied' using errcode='42501';end if;
 if p_user is null or p_role not in ('OWNER','ADMIN','CASHIER','TECHNICIAN','VIEWER') then
  raise exception 'Invalid staff assignment';end if;
 select role into v_actor_role from public.pos_memberships where shop_id=p_shop and user_id=auth.uid() and active;
 select role into v_target_role from public.pos_memberships where shop_id=p_shop and user_id=p_user and active;
 if (p_role='OWNER' or v_target_role='OWNER') and v_actor_role<>'OWNER' then
  raise exception 'Only an owner may change owner membership' using errcode='42501';end if;
 if v_target_role='OWNER' and p_role<>'OWNER' then
  select count(*) into v_owner_count from public.pos_memberships
   where shop_id=p_shop and role='OWNER' and active;
  if v_owner_count<=1 then raise exception 'Cannot demote last shop owner' using errcode='42501';end if;
 end if;
 if not exists(select 1 from auth.users u where u.id=p_user) then raise exception 'Staff must register first';end if;
 insert into public.pos_memberships(shop_id,user_id,role,active)
 values(p_shop,p_user,p_role,true)
 on conflict(shop_id,user_id) do update set role=excluded.role,active=true;
 return pg_catalog.jsonb_build_object('shopId',p_shop,'userId',p_user,'role',p_role);
end;
$fn$;
revoke all on function pos_private.admin_assign_member_core(uuid,uuid,text) from public,anon,authenticated;
grant execute on function pos_private.admin_assign_member_core(uuid,uuid,text) to authenticated;