# BOZ POS Production Readiness & Verified Rollout — 2026-10-12

## Architecture and scope
**TELCOHAUZ BOZ** is the primary platform. BOZ POS consists of:
- Supabase BOZ Postgres `public.pos_*` tables with RLS, centralized Auth and role-guarded RPCs.
- Web-only admin portal: https://ocqcmdigylxasxsuxaxt.supabase.co/functions/v1/boz-pos-admin-site
- Expo Android mobile POS: logged-in cashier with shop-scoped inventory, repair read, camera scanner and an explicitly confirmed cash-checkout flow.
- GitHub Actions cloud APK: https://github.com/telcohauz/telcohauz/actions/workflows/boz-pos-expo-apk.yml
- App code isolated in branch `boz-pos-expo-mvp-20261012`; never push unfinished work to main without gate.

## Verified DONE (source, backend and tests; not an end-to-end production acceptance sign-off)
- [x] Additive POS tables deployed to *existing* TELCOHAUZ BOZ V1 Supabase project.
- [x] RLS and authenticated reads for shop-scoped POS products, stock, repairs, sales.
- [x] Admin-only master product/price/supplier operations; supplier cost history not visible to cashier.
- [x] Secure server-side checkout validates cashier role, shop membership, server price; updates stock and logs stock movements atomically.
- [x] Same-key duplicate checkout returns existing sale ID without reducing stock twice.
- [x] Privileged checkout and admin operations contained in `pos_private`; public invoker wrappers.
- [x] SQL fixture test verified cash total, idempotency, stock qty and cross-shop rejection, then rolled back synthetic users/shops/products/sales. Post-test count of each remained zero.
- [x] Supabase Security Advisor reported zero active security lint findings after supplier policy hardening.
- [x] Admin Edge Function deployed ACTIVE v3 with real Auth login and signup interface, real CRUD RPCs and supplier history. Deployment status is not browser acceptance.
- [x] Android Expo source connects using **publishable key only** and staff JWT, no service-role secret.
- [x] Old BOZ project and separate Windows backup previously preserved; original local BOS source remains on offline Windows PC.

## Not completed: DO NOT claim production
- [ ] **Verified owner enrollment:** Auth account and verified BOZ `public.profiles` OWNER/ADMIN profile. At audit time both counts were ZERO.
- [ ] **Real authorized shop onboarding:** A shop, staff accounts, product inventory and repairs created through verified web-admin session (not fixtures).
- [ ] **HTTP API integration tests:** login, invalid accounts, revoked accounts, shop A vs B, role changes and actual PostgREST cash sale.
- [ ] **Admin browser acceptance:** portal GET, CSP, signup confirmation, login and each form verified in an actual browser.
- [ ] **Physical Android acceptance:** actual installed APK, valid server login, camera scan real item, checkout and correct after-sale stock.
- [ ] **Thermal receipt printing:** supported printer model, Bluetooth/USB/network pairing, valid test receipt and repeated printing.
- [ ] **Android signed RELEASE package:** owner-controlled long-term signing key/EAS signing credentials and installation/upgrade proof. Debug APK alone does not count.
- [ ] **Ad network + free/ad-free entitlement:** central server truth, billing provider terms and owner approval. No real billing active.
- [ ] **Full BOZ AI:** authenticated tenant-scoped gateway with human confirmation for changes; current local helper is rule-based.
- [ ] **Legacy files import:** invoice OCR, product/IMEI matching and reviewed historical import (separate from live sales).
- [ ] **Production monitoring/backups/recovery and liability/tax/receipt-compliance review** with real shop requirements. Free plans may not guarantee production SLA.
- [ ] **Windows desktop POS installer** and native printer tests if Windows POS remains a scope requirement.

## Verified owner setup (only by the authorized account holder)
1. Open the above admin portal. Register a real BOZ email/password and confirm email as required.
2. In the corresponding Supabase Dashboard, an authorized BOZ platform owner must **verify the same Auth user ID and email** under Authentication → Users.
3. An authorized database administrator must assign that verified user a row in `public.profiles` with `role = OWNER` and `active = true`. Do not auto-elevate every new signup.
4. Sign in again to Admin portal, create first real shop. It creates OWNER shop membership and FREE entitlement.
5. Create products and receive real stock using invoice/GRN references. Review supplier cost and link history.
6. Invite staff to register, then assign only the required shop roles to their verified Auth user IDs.
7. Install the latest GitHub Actions APK **for testing only** and sign in with test staff accounts. Validate that unauthorized shops remain hidden.
8. Run one supervised low-value REAL TEST SALE only after shop has been configured, cash has truly been received, and reconciliation plan is approved; transaction must use proper receipt and be reconciled. Do not create fictional paid sales in production.
9. Finish physical printer tests, backups, security/merchant compliance checks, and owner-managed release signing before declaring production.

## Technical caution
- The `BozSupabaseApi.submitCashSale` is live-capable, but network uncertainty can leave the client unsure whether a sale was recorded. Retries must preserve the **same idempotency key** and operators must reconcile against admin sales; broader offline queue/reconciliation still needs end-to-end QA.
- No client may directly write master products, price costs or staff roles.
- Do not seed fictitious historical invoices or demo purchases as real revenue.
- Never include Auth secrets, service-role keys or signing private keys in source control.
- Commercial deployments require checking host plan eligibility (Vercel Hobby is not for commercial use); no paid subscription has been authorized.
