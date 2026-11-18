begin;
create table public.market_price_reference_sources (
  model text primary key,
  amount_myr numeric(9,2) not null check (amount_myr > 0),
  original_amount numeric(9,2) not null check (original_amount > 0),
  original_currency text not null check (original_currency ~ '^[A-Z]{3}$'),
  conversion_rate numeric(10,4) not null check (conversion_rate > 0),
  source_name text not null,
  source_url text not null,
  rate_source_url text not null,
  checked_on date not null
);
alter table public.market_price_reference_sources enable row level security;
revoke all on public.market_price_reference_sources from public, anon, authenticated;
grant select on public.market_price_reference_sources to authenticated;
grant all on public.market_price_reference_sources to service_role;
create policy "Marketplace admins see price references"
 on public.market_price_reference_sources for select to authenticated
 using ((select auth.uid()) is not null and (select auth.jwt())->'app_metadata'->>'market_role'='admin');
commit;
