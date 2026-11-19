# BOZ consolidation — 12 November 2026

## Implemented source organization
- Recovery changes plus POS and commerce source combined without conflicting files.
- BusinessHQ and Digital Audit source imported under `apps/`, with source commits
  recorded in SOURCE.json. Original repos and histories retained.
- 34 byte-identical UI components extracted to `packages/ui`; original import
  paths re-export shared components.
- Product registry under `packages/catalog`, stable source IDs, integer sen,
  explicit HOLD/approval and duplicate proposals that preserve source records.
- Audit client/server now require actual authorized sessions; no demo identity
  fallback and no request-triggered seeding.
- BusinessHQ dashboard reads company-scoped record counts; hardcoded financial
  charts and health/compliance KPIs removed.

## Source of truth and mapping rules
| Domain | Owner / key | Migration rule |
|---|---|---|
| Corporate entity | BusinessHQ companies.id | Map to organization identity after authorized confirmation |
| Shop | POS pos_shops.id | Belongs to confirmed company; never infer from matching names |
| User | Existing verified auth identity | Explicit mapping by provider + subject; email match alone never grants roles |
| Telco plan | Existing BOZ products.id + source ref | Retain provenance; supplier confirms price, commission and availability |
| Physical stock | POS shop + product + ledger | Separate from catalogue and listing; never import demo stock |
| Marketplace listing | shop + listing + master product | Listing links to stock, does not create a second stock ledger |
| Invoice | company + invoice id | Link to sale; never duplicate as new paid revenue |
| Repair | shop + job id | Preserve detailed courier/QC status separately from coarse POS status |
| Audit evidence | source + record + version | Private evidence retained behind authorized access |

Main legacy services use credit pricing; POS uses integer sen; old Kotlin data
uses Double monthly prices; company invoices can have different currencies.
These are not interchangeable money fields. Migration must preserve original
currency, unit, tax basis and source snapshot.

## Production acceptance still required
1. Confirm canonical backend and existing business data; preserve backups.
2. Provision authorized owner/company/shop identities without auto-elevation.
3. Negative-test two companies/shops and reader/writer boundaries on live APIs.
4. Verify supplier catalogue, commission and evidence; approve eligible products.
5. Test actual sign-in, documents, invoices and application persistence.
6. Configure hosting credentials/URLs and run browser acceptance on deployment.
7. Verify physical Android installation, barcode scanning, supported printer,
   signed release and upgrade path. Debug source/build alone is insufficient.

No production database migration, paid service, real sale or bulk data deletion
is performed by this source merge. Websites for drama/TV and upstream n8n remain
separate projects because they have different objectives.

## Backend reconciliation observed during this task

The existing BOZ project used by POS is active. Its products table already holds
EasyApply source records under RLS, all currently READY and PRIVATE in the
read-only aggregate inspection. Existing owner/shop enrollment is present,
contrary to older October readiness documents. No private catalogue rows or
credentials were exported to GitHub and no visibility/status was changed.
The new `/master-products` screen reads that registry through the signed-in
owner/admin session. A real owner login and downstream application submission
still require interactive acceptance; they are not inferred from metadata.


## One-app function mapping — audit 19 November 2026

**Decision:** Telcohauz BOZ in this repository is the existing primary user entry, not a proof that all legacy Lovable projects share one deployment, user store, or database. Continue issue #9; do not launch another replacement application. This section documents the required consolidation gates without changing production.

| Function | Existing implementation | Authoritative boundary | Current gate |
|---|---|---|---|
| F01 Owner dashboard | Lovable TelcoHauz Owner Insights (separate project) | BOZ owner view, verified finance and company permissions | Check owner auth mapping and source-of-truth orders/payments before importing UI |
| F02 POS / cashier | `src/routes/pos.tsx` + `boz-pos-expo` + Lovable Boz Boss POS | Existing shop-scoped POS backend | Previous POS Supabase project is inactive; checkout remains OFF |
| F03 Inventory and repairs | BOZ POS shop-scoped transactions | One shop-owned stock ledger | Do not merge owner-scoped Device Market stock until shop-to-owner mapping and atomicity tests pass |
| F04 Market / public Shop | `src/routes/market.tsx`, `/catalog`, Lovable Shop & Discover | Reviewed public product projection; independent customer eligibility | Shop server API/consent status not yet verified; no product auto-publishing |
| F08 Invoices / payments | Lovable Boz Boss POS draft invoice, existing BOZ finance | Verified sale + immutable invoice record | Final numbering, settlement, receipt printer and RLS acceptance pending |
| F11 HERO agent platform | Separate Agenttelco/HERO | EasyApply-approved agent offerings only | Keep segregated from physical inventory and POS |

**Verified differences:**
- Lovable POS uses `shop_id`, `price_cents`, `pos_stock`, `pos_sale_lines` and sale idempotency keys.
- Active Device Market Supabase `rkxcioziaxrbqqpduunq` uses `owner_id`, `price_sen`, `pos_products.stock_qty`, `pos_sale_items`; it is **not** a drop-in POS replacement.
- The prior POS endpoint `ocqcmdigylxasxsuxaxt` is currently INACTIVE. Different Supabase project IDs mean separate identity and data stores unless an explicit authenticated integration is verified.
- Lovable Owner Insights reads `orders`/`payments`/`bos_tasks`, unlike the POS sale ledger. Lovable Shop & Discover calls a server BOS catalogue provider, and without a configured backend may use temporary in-memory application records.
- Both Lovable POS and Owner Insights use Supabase clients; the Shop app uses server provider interfaces. All three are separate Lovable project IDs; shared UI framework is **not** proof of shared deployment.

**Safety and acceptance gates:**
1. Recover/read old POS schema and owner/shop access **read-only**, then compare against Device Market schema; no new substitute database.
2. Verify authenticated OWNER/ADMIN/CASHIER, two-tenant RLS negative tests, product and sale ownership and security-definer RPC role checks.
3. Define explicit mapping `company_id -> shop_id -> owner_id` with human-approved account verification. Email/name similarity is not sufficient.
4. Decide master inventory ledger only after backup/restore verification, stock/idempotency concurrency tests and payment reconciliation.
5. Only then port Owner Insights and Shop functions into BOZ routes; preserve original Lovable projects as rollback sources.
6. Run `npm run typecheck`, `npm run test:contracts`, `npm run test:catalog`, `npm run test:commerce`, `npm run test:pos`, `npm run build` and authenticated browser/physical printer checks. CI pass does not replace authenticated operational QA.
7. Deploy/publish only after explicit owner approval. Keep `VITE_BOZ_POS_CHECKOUT_ENABLED=false` meanwhile.

**Status:** Navigation makes the ownership and pending gates visible; merging source and live databases is still **BLOCKED / NOT DONE**. No sales, deployment, data transfer, key replacement or schema migration is authorized by this change.
