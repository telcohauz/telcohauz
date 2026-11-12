-- Checkout idempotency payload binding. A retry must use the SAME idempotency key AND identical items.
-- No existing POS sales in this project at migration time (confirmed 0).
alter table public.pos_sales add column if not exists request_items jsonb not null default '[]'::jsonb;

create or replace function pos_private.pos_cash_checkout_core(
 p_shop_id uuid, p_idempotency_key uuid, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $fn$
declare
 v_user uuid := auth.uid();
 v_sale_id uuid;
 v_existing record;
 v_product record;
 v_line record;
 v_total bigint:=0;
 v_line_total bigint;
 v_count integer:=0;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_shop_id is null or p_idempotency_key is null then raise exception 'Shop and idempotency key required'; end if;
 if not exists(
  select 1 from public.pos_memberships m join public.pos_shops s on s.id=m.shop_id
  where m.shop_id=p_shop_id and m.user_id=v_user and m.active and s.active
    and m.role in ('OWNER','ADMIN','CASHIER')
 ) then raise exception 'Cashier access denied' using errcode='42501'; end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 100
 then raise exception '1-100 sale items required'; end if;
 -- A transaction-scoped advisory lock serializes identical retry requests.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_shop_id::text||':'||p_idempotency_key::text,0));
 select id,total_cents,shop_id,request_items into v_existing from public.pos_sales
 where shop_id=p_shop_id and idempotency_key=p_idempotency_key;
 if found then
  if v_existing.request_items is distinct from p_items then raise exception 'Idempotency key reused with different item payload';end if;
  return pg_catalog.jsonb_build_object('saleId',v_existing.id,'shopId',v_existing.shop_id,
   'totalCents',v_existing.total_cents,'replayed',true);
 end if;
 -- Quantity and type checks also reject over-large or malformed client payloads.
 if exists(select 1 from pg_catalog.jsonb_array_elements(p_items) as item(value)
           where pg_catalog.jsonb_typeof(item.value) <> 'object'
              or item.value->>'productId' is null
              or item.value->>'quantity' is null)
 then raise exception 'Malformed sale line'; end if;
 insert into public.pos_sales(shop_id,idempotency_key,cashier_user_id,total_cents,tender_method,request_items)
 values(p_shop_id,p_idempotency_key,v_user,0,'CASH',p_items) returning id into v_sale_id;
 for v_line in
   select (item.value->>'productId')::uuid as product_id,
     sum((item.value->>'quantity')::integer)::integer as quantity
   from pg_catalog.jsonb_array_elements(p_items) as item(value)
   group by (item.value->>'productId')::uuid
 loop
  if v_line.quantity < 1 or v_line.quantity > 1000
  then raise exception 'Invalid item quantity'; end if;
  select p.price_cents into v_product
   from public.pos_products p
   where p.shop_id=p_shop_id and p.id=v_line.product_id and p.active
   for share;
  if not found then raise exception 'Product unavailable in this shop'; end if;
  update public.pos_stock
    set available_qty=available_qty-v_line.quantity, updated_at=now()
   where shop_id=p_shop_id and product_id=v_line.product_id and available_qty>=v_line.quantity;
  if not found then raise exception 'Insufficient stock'; end if;
  v_line_total := v_product.price_cents * v_line.quantity;
  v_total := v_total + v_line_total;
  if v_total < 0 then raise exception 'Invalid total'; end if;
  insert into public.pos_sale_lines(sale_id,shop_id,product_id,quantity,unit_price_cents,line_total_cents)
   values(v_sale_id,p_shop_id,v_line.product_id,v_line.quantity,v_product.price_cents,v_line_total);
  insert into public.pos_stock_movements(shop_id,product_id,sale_id,delta_qty)
   values(p_shop_id,v_line.product_id,v_sale_id,-v_line.quantity);
  v_count := v_count+1;
 end loop;
 update public.pos_sales set total_cents=v_total where id=v_sale_id;
 return pg_catalog.jsonb_build_object('saleId',v_sale_id,'shopId',p_shop_id,
  'totalCents',v_total,'lineCount',v_count,'replayed',false);
end;
$fn$;
revoke all on function pos_private.pos_cash_checkout_core(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function pos_private.pos_cash_checkout_core(uuid,uuid,jsonb) to authenticated;
