
-- Telcohauz BOZ commerce sync. Non-operational until seller consent, tenant onboarding and approval.
-- Store no buyer PII, API tokens, or raw webhook payloads in this database.
create schema if not exists boz_channel;
revoke all on schema boz_channel from public, anon, authenticated;

create table if not exists boz_channel.accounts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.pos_shops(id),
  provider text not null check (provider in ('shopee','loyverse')),
  account_alias text not null check (length(btrim(account_alias)) > 0),
  external_account_id text,
  connection_state text not null default 'DISCONNECTED'
    check(connection_state in ('DISCONNECTED','AUTHORIZED','ERROR')),
  ingest_enabled boolean not null default false,
  stock_publish_enabled boolean not null default false,
  receipt_export_enabled boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (shop_id, provider, account_alias)
);

create table if not exists boz_channel.sku_map (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references boz_channel.accounts(id),
  channel_sku text not null check(length(btrim(channel_sku))>0),
  boz_sku text not null check(length(btrim(boz_sku))>0),
  provider_item_id text,
  provider_variant_id text,
  pos_product_id uuid references public.pos_products(id),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique(account_id, channel_sku)
);
create index if not exists boz_channel_sku_map_boz_sku_idx on boz_channel.sku_map(boz_sku);

create table if not exists boz_channel.orders (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references boz_channel.accounts(id),
  external_order_id text not null check(length(btrim(external_order_id))>0),
  external_status text not null,
  payment_verified boolean not null default false,
  review_state text not null default 'HOLD'
    check(review_state in ('HOLD','REVIEWED','REJECTED')),
  last_remote_update timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id, external_order_id)
);
create index if not exists boz_channel_orders_created_idx on boz_channel.orders(account_id, created_at desc);

create table if not exists boz_channel.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references boz_channel.orders(id) on delete cascade,
  external_line_key text not null,
  channel_sku text not null,
  boz_sku text,
  quantity integer not null check (quantity > 0),
  unit_price_sen bigint check (unit_price_sen >= 0),
  created_at timestamptz not null default now(),
  unique(order_id,external_line_key)
);

create table if not exists boz_channel.events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references boz_channel.accounts(id),
  external_event_key text not null,
  event_type text not null,
  external_order_id text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_state text not null default 'PENDING'
    check(processing_state in ('PENDING','PROCESSED','HOLD','ERROR')),
  unique(account_id,external_event_key)
);

create table if not exists boz_channel.stock_intents (
  id uuid primary key default gen_random_uuid(),
  order_line_id uuid not null references boz_channel.order_lines(id),
  action text not null check(action in ('RESERVE','RELEASE','SALE','RETURN')),
  quantity integer not null check(quantity > 0),
  idempotency_key text not null unique,
  approval_state text not null default 'HOLD'
    check(approval_state in ('HOLD','APPROVED','REJECTED','APPLIED')),
  applied_at timestamptz,
  created_at timestamptz not null default now()
);
-- Inventory intentionally not changed by this migration.
-- Actual stock ledger updates must be server-side, shop-scoped, transactional and idempotent.
alter table boz_channel.accounts enable row level security;
alter table boz_channel.sku_map enable row level security;
alter table boz_channel.orders enable row level security;
alter table boz_channel.order_lines enable row level security;
alter table boz_channel.events enable row level security;
alter table boz_channel.stock_intents enable row level security;
revoke all on all tables in schema boz_channel from public, anon, authenticated;
grant usage on schema boz_channel to service_role;
grant select,insert,update,delete on all tables in schema boz_channel to service_role;
