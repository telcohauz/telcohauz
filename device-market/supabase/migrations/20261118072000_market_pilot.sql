begin;
revoke execute on function public.market_accept_price(uuid,numeric,text) from authenticated;
revoke select (id,display_name,state,city,buyer_mode,status) on public.market_shops from anon;
revoke select (shop_id) on public.market_listings from anon;
commit;
