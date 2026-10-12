-- Telcohauz BOZ POS administrative API v1.
-- These functions do not grant cashiers direct write access to master tables.
-- BOZ platform OWNER or ADMIN may create a shop only after verified Auth login.
create table if not exists public.pos_stock_receipts (
 id bigint generated always as identity primary key,
 shop_id uuid not null,
 product_id uuid not null,
 received_qty integer not null check(received_qty>0),
 reference text not null,
 received_by uuid not null references auth.users(id) on delete restrict,
 received_at timestamptz not null default now(),
 foreign key(shop_id,product_id) references public.pos_products(shop_id,id) on delete restrict
);
alter table public.pos_stock_receipts enable row level security;
revoke all on public.pos_stock_receipts from public,anon,authenticated;
create policy pos_receipts_member_read on public.pos_stock_receipts for select to authenticated
 using (exists(select 1 from public.pos_memberships m where m.shop_id=pos_stock_receipts.shop_id and m.user_id=(select auth.uid()) and m.active));
grant select on public.pos_stock_receipts to authenticated;

create or replace function pos_private.can_admin_shop(p_shop uuid)
returns boolean language sql stable security definer set search_path = ''
as $fn$
 select exists(
 select 1 from public.pos_shops s
 join public.pos_memberships m on m.shop_id=s.id
 where s.id=p_shop and s.active and m.user_id=auth.uid() and m.active
 and m.role in ('OWNER','ADMIN')
 );
$fn$;

create or replace function pos_private.admin_create_shop_core(p_name text)
returns jsonb language plpgsql security definer set search_path = ''
as $fn$
declare v_actor uuid:=auth.uid();v_shop uuid;
begin
 if v_actor is null then raise exception 'Login required' using errcode='42501';end if;
 if not exists(select 1 from public.profiles p where p.user_id=v_actor and p.active and p.role in ('OWNER','ADMIN'))
 then raise exception 'Verified BOZ OWNER/ADMIN profile required' using errcode='42501';end if;
 if p_name is null or length(trim(p_name)) not between 2 and 120 then raise exception 'Invalid shop name';end if;
 insert into public.pos_shops(name) values(trim(p_name)) returning id into v_shop;
 insert into public.pos_memberships(shop_id,user_id,role) values(v_shop,v_actor,'OWNER');
 insert into public.pos_shop_entitlements(shop_id,ad_free,entitlement_source) values(v_shop,false,'FREE');
 return pg_catalog.jsonb_build_object('shopId',v_shop,'name',trim(p_name));
end;
$fn$;

create or replace function pos_private.admin_upsert_product_core(
 p_shop uuid,p_sku text,p_name text,p_price_cents bigint,p_barcode text
) returns jsonb language plpgsql security definer set search_path = ''
as $fn$
declare v_id uuid;
begin
 if not pos_private.can_admin_shop(p_shop) then raise exception 'Admin access denied' using errcode='42501';end if;
 if p_sku is null or length(trim(p_sku)) not between 1 and 80 or
    p_name is null or length(trim(p_name)) not between 1 and 250 or
    p_price_cents is null or p_price_cents < 0
 then raise exception 'Invalid product data';end if;
 insert into public.pos_products(shop_id,sku,name,price_cents,barcode)
 values(p_shop,trim(p_sku),trim(p_name),p_price_cents,nullif(trim(coalesce(p_barcode,'')),''))
 on conflict (shop_id,sku) do update set name=excluded.name,price_cents=excluded.price_cents,
 barcode=excluded.barcode,updated_at=now()
 returning id into v_id;
 insert into public.pos_stock(shop_id,product_id,available_qty) values(p_shop,v_id,0)
 on conflict(shop_id,product_id) do nothing;
 return pg_catalog.jsonb_build_object('productId',v_id,'shopId',p_shop);
end;
$fn$;

create or replace function pos_private.admin_receive_stock_core(
 p_shop uuid,p_product uuid,p_qty integer,p_reference text
) returns jsonb language plpgsql security definer set search_path = ''
as $fn$
declare v_available integer;
begin
 if not pos_private.can_admin_shop(p_shop) then raise exception 'Admin access denied' using errcode='42501';end if;
 if p_qty is null or p_qty<1 or p_qty>100000 then raise exception 'Invalid receipt quantity';end if;
 if p_reference is null or length(trim(p_reference)) not between 2 and 160 then
  raise exception 'Stock receipt reference required';end if;
 if not exists(select 1 from public.pos_products p where p.id=p_product and p.shop_id=p_shop and p.active) then
  raise exception 'Product is not active in this shop';end if;
 update public.pos_stock set available_qty=available_qty+p_qty,updated_at=now()
 where shop_id=p_shop and product_id=p_product and available_qty<=2147483647-p_qty
 returning available_qty into v_available;
 if not found then raise exception 'Stock row missing or quantity overflow';end if;
 insert into public.pos_stock_receipts(shop_id,product_id,received_qty,reference,received_by)
 values(p_shop,p_product,p_qty,trim(p_reference),auth.uid());
 return pg_catalog.jsonb_build_object('shopId',p_shop,'productId',p_product,'availableQty',v_available);
end;
$fn$;

create or replace function pos_private.admin_assign_member_core(
 p_shop uuid,p_user uuid,p_role text
) returns jsonb language plpgsql security definer set search_path = ''
as $fn$
declare v_actor_role text;
begin
 if not pos_private.can_admin_shop(p_shop) then raise exception 'Admin access denied' using errcode='42501';end if;
 if p_user is null or p_role not in ('OWNER','ADMIN','CASHIER','TECHNICIAN','VIEWER') then
  raise exception 'Invalid staff assignment';end if;
 select role into v_actor_role from public.pos_memberships where shop_id=p_shop and user_id=auth.uid() and active;
 if p_role='OWNER' and v_actor_role<>'OWNER' then
  raise exception 'Only an owner can assign an owner' using errcode='42501';end if;
 if not exists(select 1 from auth.users u where u.id=p_user) then raise exception 'Staff must register first';end if;
 insert into public.pos_memberships(shop_id,user_id,role,active)
 values(p_shop,p_user,p_role,true)
 on conflict(shop_id,user_id) do update set role=excluded.role,active=true;
 return pg_catalog.jsonb_build_object('shopId',p_shop,'userId',p_user,'role',p_role);
end;
$fn$;

create or replace function pos_private.admin_create_repair_core(
 p_shop uuid,p_ticket text,p_device text,p_issue text
) returns jsonb language plpgsql security definer set search_path = ''
as $fn$
declare v_id uuid;
begin
 if auth.uid() is null or not exists(
  select 1 from public.pos_memberships m where m.shop_id=p_shop and m.user_id=auth.uid()
  and m.active and m.role in ('OWNER','ADMIN','TECHNICIAN'))
 then raise exception 'Repair access denied' using errcode='42501';end if;
 if p_ticket is null or length(trim(p_ticket)) not between 1 and 80 or
    p_device is null or length(trim(p_device)) not between 2 and 180 or
    p_issue is null or length(trim(p_issue)) not between 2 and 2000
 then raise exception 'Invalid repair data';end if;
 insert into public.pos_repairs(shop_id,ticket_no,device,issue)
 values(p_shop,trim(p_ticket),trim(p_device),trim(p_issue))
 returning id into v_id;
 return pg_catalog.jsonb_build_object('repairId',v_id,'shopId',p_shop);
end;
$fn$;

create or replace function pos_private.admin_update_repair_core(
 p_shop uuid,p_repair uuid,p_status text
) returns jsonb language plpgsql security definer set search_path = ''
as $fn$
begin
 if auth.uid() is null or not exists(
  select 1 from public.pos_memberships m where m.shop_id=p_shop and m.user_id=auth.uid()
  and m.active and m.role in ('OWNER','ADMIN','TECHNICIAN'))
 then raise exception 'Repair access denied' using errcode='42501';end if;
 if p_status is null or p_status not in ('PENDING','IN_PROGRESS','READY','COMPLETED','CANCELLED')
 then raise exception 'Invalid repair status';end if;
 update public.pos_repairs set status=p_status where id=p_repair and shop_id=p_shop;
 if not found then raise exception 'Repair not found in this shop';end if;
 return pg_catalog.jsonb_build_object('shopId',p_shop,'repairId',p_repair,'status',p_status);
end;
$fn$;

-- Non-exposed, SECURITY DEFINER cores cannot be called via PostgREST.
-- Public invoker wrappers are the only RPC surface; authenticated role only.
create or replace function public.pos_admin_create_shop(p_name text) returns jsonb
 language sql security invoker set search_path='' as $fn$
 select pos_private.admin_create_shop_core(p_name);
 $fn$;
create or replace function public.pos_admin_upsert_product(
 p_shop uuid,p_sku text,p_name text,p_price_cents bigint,p_barcode text
) returns jsonb language sql security invoker set search_path='' as $fn$
 select pos_private.admin_upsert_product_core(p_shop,p_sku,p_name,p_price_cents,p_barcode);
 $fn$;
create or replace function public.pos_admin_receive_stock(
 p_shop uuid,p_product uuid,p_qty integer,p_reference text
) returns jsonb language sql security invoker set search_path='' as $fn$
 select pos_private.admin_receive_stock_core(p_shop,p_product,p_qty,p_reference);
 $fn$;
create or replace function public.pos_admin_assign_member(
 p_shop uuid,p_user uuid,p_role text
) returns jsonb language sql security invoker set search_path='' as $fn$
 select pos_private.admin_assign_member_core(p_shop,p_user,p_role);
 $fn$;
create or replace function public.pos_admin_create_repair(
 p_shop uuid,p_ticket text,p_device text,p_issue text
) returns jsonb language sql security invoker set search_path='' as $fn$
 select pos_private.admin_create_repair_core(p_shop,p_ticket,p_device,p_issue);
 $fn$;
create or replace function public.pos_admin_update_repair(
 p_shop uuid,p_repair uuid,p_status text
) returns jsonb language sql security invoker set search_path='' as $fn$
 select pos_private.admin_update_repair_core(p_shop,p_repair,p_status);
 $fn$;
-- In private schema default function EXECUTE privileges are revoked from PUBLIC.
revoke all on all functions in schema pos_private from public,anon,authenticated;
grant execute on function pos_private.pos_cash_checkout_core(uuid,uuid,jsonb) to authenticated;
grant execute on function pos_private.admin_create_shop_core(text) to authenticated;
grant execute on function pos_private.admin_upsert_product_core(uuid,text,text,bigint,text) to authenticated;
grant execute on function pos_private.admin_receive_stock_core(uuid,uuid,integer,text) to authenticated;
grant execute on function pos_private.admin_assign_member_core(uuid,uuid,text) to authenticated;
grant execute on function pos_private.admin_create_repair_core(uuid,text,text,text) to authenticated;
grant execute on function pos_private.admin_update_repair_core(uuid,uuid,text) to authenticated;
revoke all on function public.pos_admin_create_shop(text) from public,anon;
revoke all on function public.pos_admin_upsert_product(uuid,text,text,bigint,text) from public,anon;
revoke all on function public.pos_admin_receive_stock(uuid,uuid,integer,text) from public,anon;
revoke all on function public.pos_admin_assign_member(uuid,uuid,text) from public,anon;
revoke all on function public.pos_admin_create_repair(uuid,text,text,text) from public,anon;
revoke all on function public.pos_admin_update_repair(uuid,uuid,text) from public,anon;
grant execute on function public.pos_admin_create_shop(text) to authenticated;
grant execute on function public.pos_admin_upsert_product(uuid,text,text,bigint,text) to authenticated;
grant execute on function public.pos_admin_receive_stock(uuid,uuid,integer,text) to authenticated;
grant execute on function public.pos_admin_assign_member(uuid,uuid,text) to authenticated;
grant execute on function public.pos_admin_create_repair(uuid,text,text,text) to authenticated;
grant execute on function public.pos_admin_update_repair(uuid,uuid,text) to authenticated;
