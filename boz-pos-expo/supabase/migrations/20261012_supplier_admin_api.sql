-- Secure supplier directory and quote history for BOZ POS.
create policy pos_suppliers_admin_read on public.pos_suppliers for select to authenticated
 using (exists(
  select 1 from public.pos_memberships m
  where m.shop_id=pos_suppliers.shop_id and m.user_id=(select auth.uid())
  and m.active and m.role in ('OWNER','ADMIN')
 ));
create policy pos_quotes_admin_read on public.pos_supplier_quotes for select to authenticated
 using (exists(
  select 1 from public.pos_memberships m
  where m.shop_id=pos_supplier_quotes.shop_id and m.user_id=(select auth.uid())
  and m.active and m.role in ('OWNER','ADMIN')
 ));
grant select on public.pos_suppliers,public.pos_supplier_quotes to authenticated;
create or replace function pos_private.admin_add_supplier_core(
 p_shop uuid,p_name text,p_source_url text
) returns jsonb language plpgsql security definer set search_path='' as $fn$
declare v_id uuid;
begin
 if not pos_private.can_admin_shop(p_shop) then raise exception 'Admin access denied' using errcode='42501';end if;
 if p_name is null or length(trim(p_name)) not between 2 and 180 then raise exception 'Invalid supplier name';end if;
 if p_source_url is not null and p_source_url<>'' and (length(p_source_url)>1000 or p_source_url!~*'^https?://')
 then raise exception 'Supplier link must be HTTP(S)';end if;
 insert into public.pos_suppliers(shop_id,name,source_url)
 values(p_shop,trim(p_name),nullif(trim(coalesce(p_source_url,'')),''))
 returning id into v_id;
 return pg_catalog.jsonb_build_object('supplierId',v_id,'shopId',p_shop);
end;$fn$;
create or replace function pos_private.admin_quote_cost_core(
 p_shop uuid,p_product uuid,p_supplier uuid,p_cost_cents bigint,p_source_url text
) returns jsonb language plpgsql security definer set search_path='' as $fn$
declare v_id uuid;
begin
 if not pos_private.can_admin_shop(p_shop) then raise exception 'Admin access denied' using errcode='42501';end if;
 if p_cost_cents is null or p_cost_cents<0 then raise exception 'Invalid supplier cost';end if;
 if p_source_url is not null and p_source_url<>'' and (length(p_source_url)>1000 or p_source_url!~*'^https?://')
 then raise exception 'Supplier price URL must be HTTP(S)';end if;
 insert into public.pos_supplier_quotes(shop_id,product_id,supplier_id,cost_cents,source_url)
 values(p_shop,p_product,p_supplier,p_cost_cents,nullif(trim(coalesce(p_source_url,'')),''))
 returning id into v_id;
 return pg_catalog.jsonb_build_object('quoteId',v_id,'shopId',p_shop);
end;$fn$;
create or replace function public.pos_admin_add_supplier(p_shop uuid,p_name text,p_source_url text)
 returns jsonb language sql security invoker set search_path='' as $fn$
 select pos_private.admin_add_supplier_core(p_shop,p_name,p_source_url);$fn$;
create or replace function public.pos_admin_quote_cost(
 p_shop uuid,p_product uuid,p_supplier uuid,p_cost_cents bigint,p_source_url text
) returns jsonb language sql security invoker set search_path='' as $fn$
 select pos_private.admin_quote_cost_core(p_shop,p_product,p_supplier,p_cost_cents,p_source_url);$fn$;
revoke all on function pos_private.admin_add_supplier_core(uuid,text,text) from public,anon,authenticated;
revoke all on function pos_private.admin_quote_cost_core(uuid,uuid,uuid,bigint,text) from public,anon,authenticated;
grant execute on function pos_private.admin_add_supplier_core(uuid,text,text) to authenticated;
grant execute on function pos_private.admin_quote_cost_core(uuid,uuid,uuid,bigint,text) to authenticated;
revoke all on function public.pos_admin_add_supplier(uuid,text,text) from public,anon;
revoke all on function public.pos_admin_quote_cost(uuid,uuid,uuid,bigint,text) from public,anon;
grant execute on function public.pos_admin_add_supplier(uuid,text,text) to authenticated;
grant execute on function public.pos_admin_quote_cost(uuid,uuid,uuid,bigint,text) to authenticated;