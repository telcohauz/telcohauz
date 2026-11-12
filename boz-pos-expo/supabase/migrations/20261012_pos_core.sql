-- Telcohauz BOZ POS foundational backend v1.
-- Additive migration; preserves all existing BOZ tables and values.
-- No real shop, staff, sale, stock or paid entitlement is seeded.
create table if not exists public.pos_shops (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 1 and 120),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists public.pos_memberships (
 shop_id uuid not null references public.pos_shops(id) on delete restrict,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('OWNER','ADMIN','CASHIER','TECHNICIAN','VIEWER')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 primary key(shop_id,user_id)
);
create index if not exists pos_memberships_user_idx on public.pos_memberships(user_id,shop_id) where active;
create table if not exists public.pos_products (
 id uuid primary key default gen_random_uuid(),
 shop_id uuid not null references public.pos_shops(id) on delete restrict,
 sku text not null check(length(trim(sku)) between 1 and 80),
 barcode text,
 name text not null check(length(trim(name)) between 1 and 250),
 price_cents bigint not null check(price_cents>=0),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(shop_id,sku),
 unique(shop_id,id)
);
create unique index if not exists pos_products_barcode_idx on public.pos_products(shop_id,barcode) where barcode is not null;
create table if not exists public.pos_stock (
 shop_id uuid not null,
 product_id uuid not null,
 available_qty integer not null default 0 check(available_qty>=0),
 updated_at timestamptz not null default now(),
 primary key(shop_id,product_id),
 foreign key(shop_id,product_id) references public.pos_products(shop_id,id) on delete restrict
);
create table if not exists public.pos_repairs (
 id uuid primary key default gen_random_uuid(),
 shop_id uuid not null references public.pos_shops(id) on delete restrict,
 ticket_no text not null,
 device text not null,
 issue text not null,
 status text not null default 'PENDING' check(status in ('PENDING','IN_PROGRESS','READY','COMPLETED','CANCELLED')),
 created_at timestamptz not null default now(),
 unique(shop_id,ticket_no),
 unique(shop_id,id)
);
create table if not exists public.pos_sales (
 id uuid primary key default gen_random_uuid(),
 shop_id uuid not null references public.pos_shops(id) on delete restrict,
 idempotency_key uuid not null,
 cashier_user_id uuid not null references auth.users(id) on delete restrict,
 total_cents bigint not null check(total_cents>=0),
 tender_method text not null check(tender_method in ('CASH')),
 created_at timestamptz not null default now(),
 unique(shop_id,idempotency_key),
 unique(shop_id,id)
);
create index if not exists pos_sales_shop_date_idx on public.pos_sales(shop_id,created_at desc);
create table if not exists public.pos_sale_lines (
 sale_id uuid not null,
 shop_id uuid not null,
 product_id uuid not null,
 quantity integer not null check(quantity>0 and quantity<=1000),
 unit_price_cents bigint not null check(unit_price_cents>=0),
 line_total_cents bigint not null check(line_total_cents>=0),
 primary key(sale_id,product_id),
 foreign key(shop_id,sale_id) references public.pos_sales(shop_id,id) on delete restrict,
 foreign key(shop_id,product_id) references public.pos_products(shop_id,id) on delete restrict,
 check(line_total_cents=unit_price_cents*quantity)
);
create table if not exists public.pos_stock_movements (
 id bigint generated always as identity primary key,
 shop_id uuid not null,
 product_id uuid not null,
 sale_id uuid not null,
 delta_qty integer not null check(delta_qty<0),
 created_at timestamptz not null default now(),
 foreign key(shop_id,product_id) references public.pos_products(shop_id,id) on delete restrict,
 foreign key(shop_id,sale_id) references public.pos_sales(shop_id,id) on delete restrict
);
create index if not exists pos_movements_shop_date_idx on public.pos_stock_movements(shop_id,created_at desc);
create table if not exists public.pos_suppliers (
 id uuid primary key default gen_random_uuid(),
 shop_id uuid not null references public.pos_shops(id) on delete restrict,
 name text not null,
 source_url text,
 created_at timestamptz not null default now(),
 unique(shop_id,id)
);
create table if not exists public.pos_supplier_quotes (
 id uuid primary key default gen_random_uuid(),
 shop_id uuid not null,
 product_id uuid not null,
 supplier_id uuid not null,
 cost_cents bigint not null check(cost_cents>=0),
 source_url text,
 observed_at timestamptz not null default now(),
 foreign key(shop_id,product_id) references public.pos_products(shop_id,id) on delete restrict,
 foreign key(shop_id,supplier_id) references public.pos_suppliers(shop_id,id) on delete restrict
);
create table if not exists public.pos_shop_entitlements (
 shop_id uuid primary key references public.pos_shops(id) on delete restrict,
 ad_free boolean not null default false,
 entitlement_source text not null default 'FREE',
 current_period_end timestamptz,
 updated_at timestamptz not null default now()
);
-- No direct authenticated write permissions on ANY business table.
revoke all on public.pos_shops,public.pos_memberships,public.pos_products,public.pos_stock,public.pos_repairs,
 public.pos_sales,public.pos_sale_lines,public.pos_stock_movements,public.pos_suppliers,
 public.pos_supplier_quotes,public.pos_shop_entitlements from anon,authenticated;
alter table public.pos_shops enable row level security;
alter table public.pos_memberships enable row level security;
alter table public.pos_products enable row level security;
alter table public.pos_stock enable row level security;
alter table public.pos_repairs enable row level security;
alter table public.pos_sales enable row level security;
alter table public.pos_sale_lines enable row level security;
alter table public.pos_stock_movements enable row level security;
alter table public.pos_suppliers enable row level security;
alter table public.pos_supplier_quotes enable row level security;
alter table public.pos_shop_entitlements enable row level security;
create policy pos_memberships_own_read on public.pos_memberships for select to authenticated
 using (user_id=(select auth.uid()));
create policy pos_shops_member_read on public.pos_shops for select to authenticated
 using (exists(select 1 from public.pos_memberships m where m.shop_id=id and m.user_id=(select auth.uid()) and m.active));
create policy pos_products_member_read on public.pos_products for select to authenticated
 using (exists(select 1 from public.pos_memberships m where m.shop_id=pos_products.shop_id and m.user_id=(select auth.uid()) and m.active));
create policy pos_stock_member_read on public.pos_stock for select to authenticated
 using (exists(select 1 from public.pos_memberships m where m.shop_id=pos_stock.shop_id and m.user_id=(select auth.uid()) and m.active));
create policy pos_repairs_member_read on public.pos_repairs for select to authenticated
 using (exists(select 1 from public.pos_memberships m where m.shop_id=pos_repairs.shop_id and m.user_id=(select auth.uid()) and m.active));
create policy pos_sales_member_read on public.pos_sales for select to authenticated
 using (exists(select 1 from public.pos_memberships m where m.shop_id=pos_sales.shop_id and m.user_id=(select auth.uid()) and m.active));
create policy pos_lines_member_read on public.pos_sale_lines for select to authenticated
 using (exists(select 1 from public.pos_memberships m where m.shop_id=pos_sale_lines.shop_id and m.user_id=(select auth.uid()) and m.active));
create policy pos_movements_member_read on public.pos_stock_movements for select to authenticated
 using (exists(select 1 from public.pos_memberships m where m.shop_id=pos_stock_movements.shop_id and m.user_id=(select auth.uid()) and m.active));
create policy pos_entitlements_member_read on public.pos_shop_entitlements for select to authenticated
 using (exists(select 1 from public.pos_memberships m where m.shop_id=pos_shop_entitlements.shop_id and m.user_id=(select auth.uid()) and m.active));
-- Explicit Data API grants for reads; no supplier cost access or master-data writes.
grant select on public.pos_shops,public.pos_memberships,public.pos_products,public.pos_stock,
 public.pos_repairs,public.pos_sales,public.pos_sale_lines,public.pos_stock_movements,
 public.pos_shop_entitlements to authenticated;
-- Server-side checkout computes prices, enforces tenant + role, atomically adjusts stock.
-- SECURITY DEFINER has a fixed empty search_path; no user-provided schema or SQL.
create or replace function public.pos_cash_checkout(
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
 select id,total_cents,shop_id into v_existing from public.pos_sales
 where shop_id=p_shop_id and idempotency_key=p_idempotency_key;
 if found then
  return pg_catalog.jsonb_build_object('saleId',v_existing.id,'shopId',v_existing.shop_id,
   'totalCents',v_existing.total_cents,'replayed',true);
 end if;
 -- Quantity and type checks also reject over-large or malformed client payloads.
 if exists(select 1 from pg_catalog.jsonb_array_elements(p_items) as item(value)
           where pg_catalog.jsonb_typeof(item.value) <> 'object'
              or item.value->>'productId' is null
              or item.value->>'quantity' is null)
 then raise exception 'Malformed sale line'; end if;
 insert into public.pos_sales(shop_id,idempotency_key,cashier_user_id,total_cents,tender_method)
 values(p_shop_id,p_idempotency_key,v_user,0,'CASH') returning id into v_sale_id;
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
revoke all on function public.pos_cash_checkout(uuid,uuid,jsonb) from public,anon;
grant execute on function public.pos_cash_checkout(uuid,uuid,jsonb) to authenticated;
