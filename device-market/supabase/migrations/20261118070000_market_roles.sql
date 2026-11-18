begin;

create function public.market_role() returns text
language sql stable security invoker set search_path='' as $$
  select case
   when auth.uid() is null then 'guest'
   when auth.jwt()->'app_metadata'->>'market_role' = 'admin' then 'admin'
   when exists(select 1 from public.market_shops where owner_id=auth.uid() and status='approved') then 'partner'
   else 'user'
  end;
$$;

create function public.market_admin_applications()
returns table(id uuid, display_name text, state text, city text, buyer_mode text, terms text, status text)
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.jwt()->'app_metadata'->>'market_role' is distinct from 'admin' then
    raise exception 'Administrator required';
  end if;
  return query select s.id,s.display_name,s.state,s.city,s.buyer_mode,s.terms,s.status
  from public.market_shops s order by (s.status='pending') desc,s.created_at desc limit 100;
end;
$$;

create function public.market_admin_decide(p_shop_id uuid, p_status text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.jwt()->'app_metadata'->>'market_role' is distinct from 'admin' then
    raise exception 'Administrator required';
  end if;
  if p_status is null or p_status not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  update public.market_shops set status=p_status where id=p_shop_id and status='pending';
  if not found then raise exception 'Application no longer pending'; end if;
end;
$$;

revoke all on function public.market_role(),public.market_admin_applications(),public.market_admin_decide(uuid,text) from public,anon,authenticated;
grant execute on function public.market_role(),public.market_admin_applications(),public.market_admin_decide(uuid,text) to authenticated;
commit;
