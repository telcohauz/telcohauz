-- Hardening follow-up for BOZ POS checkout.
-- SECURITY DEFINER implementation moves to a non-exposed schema.
-- Public /rest/v1/rpc/pos_cash_checkout stays SECURITY INVOKER and auth-gated.
create schema if not exists pos_private;
revoke all on schema pos_private from public,anon;
alter function public.pos_cash_checkout(uuid,uuid,jsonb) set schema pos_private;
alter function pos_private.pos_cash_checkout(uuid,uuid,jsonb) rename to pos_cash_checkout_core;
grant usage on schema pos_private to authenticated;
revoke all on function pos_private.pos_cash_checkout_core(uuid,uuid,jsonb) from public,anon;
grant execute on function pos_private.pos_cash_checkout_core(uuid,uuid,jsonb) to authenticated;
create function public.pos_cash_checkout(p_shop_id uuid,p_idempotency_key uuid,p_items jsonb)
returns jsonb language sql security invoker set search_path = ''
as $fn$
 select pos_private.pos_cash_checkout_core(p_shop_id,p_idempotency_key,p_items);
$fn$;
revoke all on function public.pos_cash_checkout(uuid,uuid,jsonb) from public,anon;
grant execute on function public.pos_cash_checkout(uuid,uuid,jsonb) to authenticated;
comment on function public.pos_cash_checkout(uuid,uuid,jsonb)
is 'Invoker wrapper for authenticated and server-validated atomic shop cash checkout; no anonymous permissions.';
