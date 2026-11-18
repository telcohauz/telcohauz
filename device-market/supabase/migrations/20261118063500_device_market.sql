begin;

create table public.market_shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 90),
  state text not null check (state in ('Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','Kuala Lumpur','Putrajaya','Labuan')),
  city text not null check (char_length(trim(city)) between 2 and 70),
  buyer_mode text not null check (buyer_mode in ('buyback','trade_in','both')),
  terms text not null check (char_length(trim(terms)) between 3 and 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table public.market_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid references public.market_shops(id) on delete set null,
  type text not null check (type in ('market','rent','trade','broken','wanted')),
  title text not null check (char_length(trim(title)) between 2 and 90),
  category smallint not null check (category between 0 and 4),
  condition smallint not null check (condition between 0 and 3),
  state text not null check (state in ('Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','Kuala Lumpur','Putrajaya','Labuan')),
  city text not null check (char_length(trim(city)) between 2 and 70),
  price numeric(9,2) not null check (price > 0 and price <= 100000),
  description text not null check (char_length(trim(description)) between 1 and 500),
  quantity integer not null default 1 check (quantity between 1 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.market_buyback_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  assigned_shop_id uuid references public.market_shops(id) on delete set null,
  model text not null check (char_length(trim(model)) between 2 and 90),
  condition smallint not null check (condition between 0 and 3),
  state text not null check (state in ('Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis','Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','Kuala Lumpur','Putrajaya','Labuan')),
  summary text not null check (char_length(trim(summary)) between 1 and 500),
  created_at timestamptz not null default now()
);

create table public.market_buyback_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.market_buyback_requests(id) on delete cascade,
  shop_id uuid not null references public.market_shops(id) on delete cascade,
  amount numeric(9,2) not null check (amount > 0 and amount <= 100000),
  inspection_terms text not null check (char_length(trim(inspection_terms)) between 1 and 500),
  created_at timestamptz not null default now(),
  unique(request_id, shop_id)
);

create index market_listings_browse on public.market_listings(type, state, created_at desc) where active;
create index market_listings_owner on public.market_listings(owner_id);
create index market_requests_customer on public.market_buyback_requests(customer_id);
create index market_requests_shop on public.market_buyback_requests(assigned_shop_id);
create index market_offers_shop on public.market_buyback_offers(shop_id);

alter table public.market_shops enable row level security;
alter table public.market_listings enable row level security;
alter table public.market_buyback_requests enable row level security;
alter table public.market_buyback_offers enable row level security;

revoke all on public.market_shops, public.market_listings, public.market_buyback_requests, public.market_buyback_offers from anon, authenticated;
grant select (id, display_name, state, city, buyer_mode, status) on public.market_shops to anon;
grant select on public.market_shops to authenticated;
grant insert (owner_id, display_name, state, city, buyer_mode, terms) on public.market_shops to authenticated;
grant select (id, shop_id, type, title, category, condition, state, city, price, description, quantity, active, created_at) on public.market_listings to anon;
grant select on public.market_listings to authenticated;
grant insert (owner_id, shop_id, type, title, category, condition, state, city, price, description, quantity) on public.market_listings to authenticated;
grant update (active) on public.market_listings to authenticated;
grant select on public.market_buyback_requests, public.market_buyback_offers to authenticated;
grant insert (customer_id, assigned_shop_id, model, condition, state, summary) on public.market_buyback_requests to authenticated;
grant insert (request_id, shop_id, amount, inspection_terms) on public.market_buyback_offers to authenticated;

create policy "Anonymous can read approved businesses" on public.market_shops for select to anon using (status = 'approved');
create policy "Members can read their own application" on public.market_shops for select to authenticated using (owner_id = (select auth.uid()));
create policy "Members can submit their own pending application" on public.market_shops for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'pending');

create policy "Active listings are browsable" on public.market_listings for select to anon, authenticated using (active);
create policy "Members can read their listings" on public.market_listings for select to authenticated using (owner_id = (select auth.uid()));
create policy "Members can list under their approved shop" on public.market_listings for insert to authenticated
  with check (owner_id = (select auth.uid()) and (shop_id is null or exists
    (select 1 from public.market_shops s where s.id = shop_id and s.owner_id = (select auth.uid()) and s.status = 'approved')));
create policy "Members can change their own listing visibility" on public.market_listings for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "Customers can submit their own requests" on public.market_buyback_requests for insert to authenticated
  with check (customer_id = (select auth.uid()));
create policy "Only the customer or assigned approved shop can see a request" on public.market_buyback_requests for select to authenticated
  using (customer_id = (select auth.uid()) or exists
    (select 1 from public.market_shops s where s.id = assigned_shop_id and s.owner_id = (select auth.uid()) and s.status = 'approved'));

create policy "Approved assigned shops can quote" on public.market_buyback_offers for insert to authenticated
  with check (exists (select 1 from public.market_shops s
    join public.market_buyback_requests r on r.assigned_shop_id = s.id
    where r.id = request_id and s.id = shop_id and s.owner_id = (select auth.uid()) and s.status = 'approved' and r.customer_id <> (select auth.uid())));
create policy "Only the customer or quoting shop can see an offer" on public.market_buyback_offers for select to authenticated
  using (exists (select 1 from public.market_buyback_requests r where r.id = request_id and r.customer_id = (select auth.uid()))
     or exists (select 1 from public.market_shops s where s.id = shop_id and s.owner_id = (select auth.uid())));

grant all on public.market_shops, public.market_listings, public.market_buyback_requests, public.market_buyback_offers to service_role;
commit;
