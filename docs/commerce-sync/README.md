# Telcohauz BOZ · Shopee ⇄ BOZ POS ⇄ Loyverse
Status: staging-only. Implemented on 15 October 2026. Live seller order syncing: NOT CONNECTED.

## Source of truth
- **BOZ / Supabase** is the business control center and canonical product/SKU identity and approved stock-ledger owner.
- **BOZ POS** is a first-party sales client. It must use existing tenant-scoped authenticated checkout and write stock once.
- **Loyverse** is a second POS channel. Read receipts/inventory with an authorized integration; never re-post the same sale as a fresh BOZ sale or create another receipt without an explicit reconciliation rule.
- **Shopee Seller** is an online marketplace channel. Authorize only with Shopee Open Platform approved merchant app/OAuth. The available ChatGPT Shopee catalog search connector is NOT seller-account authorization.

## Confirmed environment
- Supabase project: `telcohauzzzzz` (`ocqcmdigylxasxsuxaxt`). It currently has no registered active POS shops/products/orders and must not use demo customers or fake order records.
- Private `boz_channel` schema deployed with 6 RLS-enabled, initially empty tables: `accounts`, `sku_map`, `orders`, `order_lines`, `events`, `stock_intents`.
- Schema restricted from anon/authenticated roles; service-role only. Never publish it as an anonymous Data API surface.
- Source catalog: prior product pack including 16,606 physical/POS staging rows, 71 EasyApply service plans, seller SKU mappings; these are NOT uploaded to active POS, Loyverse or Shopee. No photos were matched to each SKU.
- Source cost and AI prices are DRAFT, older vendor snapshots + estimated Shopee logistics, not verified current Shopee merchant fees.

## Enable only after verification
1. Create a real owner identity and shop in BOZ, then configure current stock & POS permissions.
2. Verify products, images, costs, AI-suggested prices, Shopee shipping class and stock at the exact shop; match BOZ SKU to Shopee Seller SKU + variant ID and Loyverse variant/store ID.
3. Use official seller authorization at https://open.shopee.com/ and obtain merchant-approved order API permissions. Do not share seller login, OTP or secret in chat, GitHub, browser source, or Blogger.
4. Use Loyverse API OAuth or merchant-generated access token (server-side only). Required scopes should start READ-only: ITEMS_READ, INVENTORY_READ, RECEIPTS_READ, STORES_READ. Writes are a separate owner-gated phase.
5. Build backend provider adapters. Shopee pushes must be validated using the officially documented scheme before order details are fetched from the authorized API. Loyverse signed webhook verification is only available with app OAuth webhooks; personal-token webhooks are unsigned, so verify by authenticated API readback.
6. Dry-run end-to-end with authorized test orders and stock without affecting live ledger, then separately approve production stock publishing.
7. Enable reconciliation and owner alerts for new orders, cancellations, refunds, payment mismatches, inventory mismatches and failed sync. Backfill uses an explicit bounded time window and must not change existing stock without approval.

## State machine & duplication controls
- Initial channel accounts: `DISCONNECTED` + all sync flags `false`.
- Duplicate events collapse on `(account_id, external_event_key)`. Duplicate Shopee orders collapse on `(account_id, external_order_id)`.
- No stock change from a mere order notification, from unpaid/cancelled/returned status, from a SKU mismatch, or an unverified seller message.
- `core.mjs` validates normalized input and only plans `HOLD` reservations after payment and API readback, shop authorization, owner approval, and verified mappings. A future server-side transactional writer must check stock, post once to the BOZ ledger, and atomically mark the intent applied.
- The same physical sale must have one canonical BOZ sale ID and optional Loyverse/Shopee references, not multiple sales. Loyverse receipt export remains OFF by default.
- Refund/release/restock requires reconciliation with provider status and real physical return; do not auto-increase inventory on a cancellation callback.

## Security / privacy
- No personally identifying buyer fields, shipping addresses or API credentials in the integration staging schema.
- All workers must use server-only scoped credentials and verify active shop membership; never ship a service-role key in mobile or public Blogger content.
- Require signed webhook checks where available; otherwise authenticated API readback before trusting data.
- RLS has no client policies intentionally, because the schema is private backend-only. RLS scanner INFO lint `rls_enabled_no_policy` is expected here; do not add permissive policies.
- Prevent accidental public exposure from repository secrets, `.env` files or web logs.

## Local tests
`node --test services/commerce-sync/core.test.mjs` (8 tests validated locally).

## Not complete
- Shopee Seller app authorization and API secrets.
- Loyverse merchant authorization and POS store/variant mapping.
- A real BOZ owner/shop and production-ready catalog stock.
- Provider webhook adapters, transactional writer, live notification delivery, dashboards and completed cross-channel acceptance tests.

This module is safe to review now, but **do not call it a live marketplace/POS connection**.
