# TELCOHAUZ — Accepted domain-independent rollout plan
Approved by project owner on 2026-11-18. This is a preparation plan, not deployment certification.

## Ownership and URLs
- telcohauz.com is NOT yet purchased or under owner control. Never assume DNS/SSL access.
- Intended future names: telcohauz.com (public), admin.telcohauz.com (BOZ BOSS), pos.telcohauz.com (store POS), market.telcohauz.com (Market).
- Existing selected Market reference: https://telcohauz-device-market.telcohauzphonetrd.chatgpt.site
- The reference URL is not proof that the site is reachable, editable, linked to GitHub, or production ready.
- For now use independently verified temporary hostnames, configured via environment variables. Do not hardcode final hostnames in API calls or OAuth settings.

## Architecture
- BOZ BOSS: owner/admin control plane with company, staff, catalog review, inventory oversight, finance, orders, repair and reports.
- POS: staff-only store app and web UI; cashier sales, cash reconciliation, shop-scoped stock, repair, invoice/receipt workflow. Android first, iOS subsequently.
- Market: customer mobile/web storefront, buy/sell/trade-in, prices, orders. Android and iOS targets.
- Use existing source in this repository: apps/businesshq, boz-pos-expo, packages/catalog, services/commerce-sync. The Marketplace is a separate user-selected hosted project until source ownership and integration are verified.
- One authoritative inventory ledger per shop; Market listings reference eligible POS inventory, never create a competing ledger.
- Keep HERO EasyApply-only and separate from physical POS stock.

## Preparatory milestones
1. Inventory the working source, versions, current deployments and backend projects; preserve backups and freeze destructive migrations.
2. Verify admin/owner identity, per-shop RLS and role matrix. No automatic elevation and no credentials in client code.
3. Reconcile company ID -> shop ID -> listing IDs with reversible migrations; do not infer from display names.
4. Prove checkout end-to-end: server priced totals, payment verification, idempotent sale, atomic stock movement, receipt/invoice and reconciliation.
5. Implement explicit Market publishing and reservation/order lifecycle without double-selling; test cancellation/refund and cross-channel stock race.
6. Test web temporary hosts, authentication redirects, CORS, TLS, privacy policy and mobile links.
7. Build and install Android debug QA APKs, test actual barcode camera and printer; then sign release when approved.
8. Prepare iOS project/build; Apple account, testing and distribution prerequisites are separate and not assumed free.
9. Obtain written production acceptance for identity, tenant isolation, invoice/tax rules, backup restore, payment and live orders.
10. Only AFTER confirmed domain purchase: verify registrar control, configure DNS/SSL and subdomains, OAuth redirects, app links, canonical URLs, and monitor rollback.

## Release gates — currently NOT verified
- Accessible production BOZ Admin and POS: unverified.
- Checkout with real authorized users and actual shop inventory: unverified.
- Marketplace source integration and payments: unverified.
- Unified SSO: unverified.
- Android release APK and iOS distribution: unverified.
- Domain ownership and DNS: pending purchase.

## Rules
Prefer RM0 incremental tools where practical; never incur expenses or launch financial transactions without owner approval. Do not state production ready merely because a repository, database schema, workflow or deployment URL exists. Protect customer identifiers and private supplier cost. Changes to live inventory/sales must be authorized and logged.
