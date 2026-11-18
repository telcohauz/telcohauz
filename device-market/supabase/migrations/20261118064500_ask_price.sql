begin;
alter table public.market_listings add column model_key text
  check (model_key is null or model_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
alter table public.market_listings alter column price drop not null;
alter table public.market_listings add constraint market_listing_price_required
  check (price is not null or (type = 'market' and model_key is not null and shop_id is not null));
grant insert (model_key) on public.market_listings to authenticated;
grant select (model_key) on public.market_listings to anon;
create index market_listing_model_match on public.market_listings(model_key, shop_id)
  where active and type = 'market';

create table public.market_price_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users on delete cascade,
  model_key text not null check (char_length(model_key) <= 90 and model_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'open' check (status in ('open','accepted')),
  created_at timestamptz not null default now()
);
create unique index market_one_open_request on public.market_price_requests(customer_id,model_key) where status='open';

create table public.market_price_recipients (
  request_id uuid not null references public.market_price_requests on delete cascade,
  shop_id uuid not null references public.market_shops on delete cascade,
  shop_owner_id uuid not null references auth.users on delete cascade,
  model_key text not null,
  created_at timestamptz not null default now(),
  primary key (request_id, shop_id)
);
create index market_price_recipient_owner on public.market_price_recipients(shop_owner_id, created_at desc);

create table public.market_price_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null,
  shop_id uuid not null,
  amount_myr numeric(9,2) not null check (amount_myr > 0 and amount_myr <= 100000),
  terms text not null check (char_length(trim(terms)) between 1 and 500),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (request_id, shop_id) references public.market_price_recipients on delete cascade,
  unique (request_id, shop_id)
);

create table public.market_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.market_price_requests,
  quote_id uuid not null unique references public.market_price_quotes,
  customer_id uuid not null references auth.users,
  shop_id uuid not null references public.market_shops,
  amount_myr numeric(9,2) not null check (amount_myr > 0),
  terms text not null,
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','paid','cancelled')),
  created_at timestamptz not null default now()
);
alter table public.market_price_requests enable row level security;
alter table public.market_price_recipients enable row level security;
alter table public.market_price_quotes enable row level security;
alter table public.market_purchase_orders enable row level security;
revoke all on public.market_price_requests,public.market_price_recipients,public.market_price_quotes,public.market_purchase_orders from anon,authenticated;
grant select on public.market_price_requests,public.market_price_recipients,public.market_price_quotes,public.market_purchase_orders to authenticated;
grant all on public.market_price_requests,public.market_price_recipients,public.market_price_quotes,public.market_purchase_orders to service_role;

create policy "Customers see their requests" on public.market_price_requests for select to authenticated
  using (customer_id=(select auth.uid()));
create policy "Shops see their inbox" on public.market_price_recipients for select to authenticated
  using (shop_owner_id=(select auth.uid()));
create policy "Quoted parties see quotes" on public.market_price_quotes for select to authenticated
  using (exists(select 1 from public.market_price_requests r where r.id=request_id and r.customer_id=(select auth.uid()))
    or exists(select 1 from public.market_price_recipients r where r.request_id=market_price_quotes.request_id and r.shop_id=market_price_quotes.shop_id and r.shop_owner_id=(select auth.uid())));
create policy "Order parties see orders" on public.market_purchase_orders for select to authenticated
  using (customer_id=(select auth.uid()) or exists(select 1 from public.market_shops s where s.id=shop_id and s.owner_id=(select auth.uid())));

-- Create the request and inbox entries in one transaction. A duplicate open request is reused.
create function public.market_ask_price(p_model_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_customer uuid:=auth.uid(); v_request uuid; v_count integer;
begin
  if v_customer is null then raise exception 'Sign-in required'; end if;
  insert into public.market_price_requests(customer_id,model_key) values(v_customer,p_model_key)
  on conflict(customer_id,model_key) where status='open' do update set model_key=excluded.model_key returning id into v_request;
  insert into public.market_price_recipients(request_id,shop_id,shop_owner_id,model_key)
  select distinct v_request,s.id,s.owner_id,p_model_key from public.market_listings l
  join public.market_shops s on s.id=l.shop_id
  where l.model_key=p_model_key and l.active and l.type='market' and s.status='approved' and s.owner_id<>v_customer
  on conflict do nothing;
  select count(*) into v_count from public.market_price_recipients where request_id=v_request;
  return jsonb_build_object('request_id',v_request,'shops',v_count);
end;
$$;

create function public.market_quote_price(p_request_id uuid,p_amount_myr numeric,p_terms text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_caller uuid:=auth.uid(); v_shop uuid; v_quote uuid;
begin
  if v_caller is null then raise exception 'Sign-in required'; end if;
  perform 1 from public.market_price_requests where id=p_request_id and status='open' for update;
  if not found then raise exception 'Request is closed'; end if;
  select s.id into v_shop from public.market_price_recipients r join public.market_shops s on s.id=r.shop_id
  where r.request_id=p_request_id and r.shop_owner_id=v_caller and s.status='approved'
    and exists(select 1 from public.market_listings l where l.shop_id=s.id and l.active and l.type='market' and l.model_key=r.model_key);
  if v_shop is null then raise exception 'Shop is not eligible to quote'; end if;
  insert into public.market_price_quotes(request_id,shop_id,amount_myr,terms,expires_at)
  values(p_request_id,v_shop,p_amount_myr,p_terms,now()+interval '48 hours')
  on conflict(request_id,shop_id) do update set amount_myr=excluded.amount_myr,terms=excluded.terms,expires_at=excluded.expires_at
  returning id into v_quote;
  return v_quote;
end;
$$;

create function public.market_accept_price(p_quote_id uuid, p_expected_amount numeric, p_expected_terms text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_customer uuid:=auth.uid(); v_request_id uuid; v_quote public.market_price_quotes; v_order uuid;
begin
  if v_customer is null then raise exception 'Sign-in required'; end if;
  select r.id into v_request_id from public.market_price_requests r
  join public.market_price_quotes q on q.request_id=r.id
  where q.id=p_quote_id and r.customer_id=v_customer for update of r;
  if not found then raise exception 'Quote not available'; end if;
  select id into v_order from public.market_purchase_orders where request_id=v_request_id and quote_id=p_quote_id;
  if found then return v_order; end if;
  if exists(select 1 from public.market_purchase_orders where request_id=v_request_id) then raise exception 'A different quote was accepted'; end if;
  select q.* into v_quote from public.market_price_quotes q join public.market_shops s on s.id=q.shop_id
    where q.id=p_quote_id and q.expires_at>now() and s.status='approved';
  if not found or v_quote.amount_myr is distinct from p_expected_amount or v_quote.terms is distinct from p_expected_terms
    then raise exception 'Quote changed or expired. Refresh and confirm again'; end if;
  insert into public.market_purchase_orders(request_id,quote_id,customer_id,shop_id,amount_myr,terms)
  values(v_request_id,p_quote_id,v_customer,v_quote.shop_id,v_quote.amount_myr,v_quote.terms) returning id into v_order;
  update public.market_price_requests set status='accepted' where id=v_request_id;
  return v_order;
end;
$$;

revoke all on function public.market_ask_price(text),public.market_quote_price(uuid,numeric,text),public.market_accept_price(uuid,numeric,text) from public,anon,authenticated;
grant execute on function public.market_ask_price(text),public.market_quote_price(uuid,numeric,text),public.market_accept_price(uuid,numeric,text) to authenticated;
commit;
