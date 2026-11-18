begin;

create table public.market_commissions (
  order_id uuid primary key references public.market_purchase_orders(id),
  settlement_reference text not null unique check (char_length(trim(settlement_reference)) between 1 and 160),
  amount_myr numeric(9,2) not null check (amount_myr > 0),
  rate_percent numeric(5,2) not null check (rate_percent between 5 and 10),
  fee_myr numeric(9,2) generated always as (round(amount_myr * rate_percent / 100, 2)) stored,
  settled_at timestamptz not null default now()
);
alter table public.market_commissions enable row level security;
revoke all on public.market_commissions from public, anon, authenticated;
grant select, insert on public.market_commissions to service_role;

-- Invoke only from a trusted reconciliation process after payment confirmation.
create function public.market_record_settlement(p_order_id uuid, p_reference text, p_rate numeric)
returns numeric language plpgsql security invoker set search_path='' as $$
declare purchase public.market_purchase_orders; recorded public.market_commissions;
begin
  if p_rate is null or p_rate not between 5 and 10 or p_rate <> round(p_rate, 2) then
    raise exception 'Commission must be between 5 and 10 percent with at most two decimals';
  end if;
  select * into purchase from public.market_purchase_orders where id=p_order_id for update;
  if not found then raise exception 'Order does not exist'; end if;

  select * into recorded from public.market_commissions where order_id=p_order_id;
  if found then
    if recorded.settlement_reference is distinct from p_reference or recorded.rate_percent is distinct from p_rate then
      raise exception 'Order has already been reconciled';
    end if;
    return recorded.fee_myr;
  end if;
  if purchase.status <> 'awaiting_payment' then raise exception 'Order is not awaiting payment'; end if;

  insert into public.market_commissions(order_id, settlement_reference, amount_myr, rate_percent)
  values (p_order_id, p_reference, purchase.amount_myr, p_rate) returning * into recorded;
  update public.market_purchase_orders set status='paid' where id=p_order_id;
  return recorded.fee_myr;
end;
$$;
revoke all on function public.market_record_settlement(uuid,text,numeric) from public, anon, authenticated;
grant execute on function public.market_record_settlement(uuid,text,numeric) to service_role;
commit;
