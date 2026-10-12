-- Cover foreign keys frequently used by BOZ POS shop-scoped operations and reporting.
create index if not exists pos_lines_shop_product_idx on public.pos_sale_lines(shop_id,product_id);
create index if not exists pos_lines_shop_sale_idx on public.pos_sale_lines(shop_id,sale_id);
create index if not exists pos_sales_cashier_idx on public.pos_sales(cashier_user_id);
create index if not exists pos_movements_shop_product_idx on public.pos_stock_movements(shop_id,product_id);
create index if not exists pos_movements_shop_sale_idx on public.pos_stock_movements(shop_id,sale_id);
create index if not exists pos_stock_receipts_actor_idx on public.pos_stock_receipts(received_by);
create index if not exists pos_stock_receipts_shop_product_idx on public.pos_stock_receipts(shop_id,product_id);
create index if not exists pos_quote_shop_product_idx on public.pos_supplier_quotes(shop_id,product_id);
create index if not exists pos_quote_shop_supplier_idx on public.pos_supplier_quotes(shop_id,supplier_id);
