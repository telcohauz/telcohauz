# Telcohauz BOZ · BOZ POS integration contract

Status: approved direction, not deployed integration.
Owner: Telcohauz. Component: BOZ POS. Approved development branch: `boz-pos-expo-mvp-20261012`.
Android source: `boz-pos-expo/`. Existing BOS reference implementation on authorized Windows: `telcohauz-bos` (not hosted in this GitHub repository).

## One ecosystem, not a separate standalone company/product
BOZ POS is a Telcohauz BOZ module. Mobile POS, web-only Shop Admin, BOZ AI, marketplace and analytics will share a versioned backend/API strategy and tenant/branch identity model. Preserve existing BOS backend business logic and historical data; do not assume the mobile demo stores are real customers.

## Responsibility boundaries
1. **Telcohauz BOZ platform:** organization and shop registry, staff identity, roles, subscription entitlements, audit logs and integration management.
2. **Shop Admin website:** create/change products, supplier and purchase cost/links, selling price, permissions, stock count approvals and historical import approvals. The mobile app may request changes, never arbitrarily mutate master data.
3. **BOZ POS Android / Windows:** authorized sale workflows, barcode/camera scanning, stock lookup, repair status with permission, and compatible printer output; all via narrow transactional APIs.
4. **BOZ AI:** shared AI gateway with shop-scoped read tools and owner-approved write actions. No direct database credentials in AI/mobile clients.
5. **Marketplace and analytics:** may consume approved projections/events, not read arbitrary tenant tables or expose competitors' private costs.
6. **Ads and ad-free:** banner entitlements bound to shop/account after trusted server verification; never require subscription for core POS or place ads in checkout.

## Security/API nonnegotiables
- Production API under a trusted HTTPS origin. The existing `/mobile/v1` contract is a PROPOSAL; no deployed URL or credentials have been verified.
- Server verifies authenticated user, current shop membership, role and branch for each endpoint. Client-side shop checks are useful only as defense-in-depth.
- Session tokens should be short-lived/revocable and stored via secure OS facilities, not bundled secrets or unencrypted shared storage.
- Checkout shall be server-calculated, transactional and idempotent, update stock ledger once, preserve history, deny negative stock and require allowed till/shift/payment methods.
- Shared product identity and supplier offers include owner shop/branch identifiers. Never reuse sample demo identifiers as production tenant IDs.
- Historical imports retain originals/provenance and require web-admin approval; old sales must not mutate present inventory.
- Hardware support is by tested capability adapter and actual device compatibility, not a universal compatibility claim.
- Payments: the POS does not require a payment gateway at MVP; ad removal subscription billing cannot be marked active until permitted and integrated.
- Audit and backup/recovery tests required before multi-shop production.

## Backend acceptance gate (must all pass)
- [ ] Identify the canonical Telcohauz BOZ backend repository, deployment URL, and authorized service account using trusted metadata; do not guess.
- [ ] Map existing BOS tables and identifiers for organization, shop, branch, staff, customer, product, supplier and historical ledger.
- [ ] Implement backend authentication and `/mobile/v1` endpoints with tenant-scoped authorization.
- [ ] Connect Android read-only product/repair screens and validate actual records behind server enforcement.
- [ ] Verify multiple shop and employee role boundaries with negative tests.
- [ ] Implement checkout API with server-computed amounts, atomic stock, idempotency and audit.
- [ ] Integrate BOZ AI read-only tools with delegated shop permissions; approval-gate writes.
- [ ] Implement approved sync, safe retries, printer adapter tests, API monitoring and deployment rollback.
- [ ] Verify signed release APK on physical Android devices and confirm backend connectivity.

## Observed state (2026-10-12)
- Android Expo demonstration app exists with Cashier, Inventory, Repairs, BOZ AI and Settings.
- GitHub debug APK cloud build previously succeeded; source does NOT establish production deployment or completed Android hardware tests.
- Optional `BozMobileApi` adapter reads a proposed API contract; when endpoint missing app uses synthetic sample data.
- Telcohauz BOS local project previously passed 80 tests; cloud integration and exact production backend are unverified.
- Keep separate admin website and prevent mobile master-data editing.

## Builder execution
Never replace the approved central BOZ architecture. Progress module-by-module; report DONE, BLOCKED, REMAINING backed by commits/build logs. No paid activation without itemized approval.
