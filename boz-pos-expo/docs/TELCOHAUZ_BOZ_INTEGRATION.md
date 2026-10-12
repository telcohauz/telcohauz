# Telcohauz BOZ ↔ BOZ POS: Shared Platform Integration Contract v1.0

## Single source of truth
BOZ POS is an **application module of Telcohauz BOZ**, not an independent platform. The Flutter starter and old local BOS must not be rewritten without mapping existing tests and proven workflows. The React Native/Expo Android app is a mobile client, not the database owner.

**Current implementation state:** This document is a contract and migration plan, **not evidence of a deployed live integration**. Remote Windows BOS is offline at the time of this version; the cloud-built Expo debug APK contains demo data and a read-only API adapter.

## Ownership / boundaries
| Ownership | Telcohauz BOZ platform and web admin | BOZ POS mobile app |
|---|---|---|
| Authentication | Central identity, shop memberships, session issuance and revocation | Sign in and short-lived authorized session |
| Product master | Add/edit SKU, barcode, names, selling/cost price, supplier and links | View assigned-shop products and scan product barcodes |
| Operations | Atomic sales, stock ledger, repair workflow, authorization | Request narrowly scoped authorized operations; never direct database writes |
| Supplier purchasing | Admin Website only | Read allowed public selling fields; no purchase cost editing |
| Historical migration | Web-only review/approval, OCR provenance, import audit | Optional view of authorized historical read-only summaries |
| AI | Central BOZ AI gateway, tenant-aware tool registry, action approvals | Local safe read-only helper until real AI service is deployed |
| Ads | Entitlement source and billing reconciliation managed centrally | Show banner only when server-confirmed free entitlement; never show during checkout |
| Analytics / logs | Tenant-scoped audit, retention and backups | Read authorized data only, minimize local caching |

## Identity and tenancy
- One Telcohauz BOZ identity can be assigned to multiple shops with separate roles.
- Staff must choose among **server-authorized shop IDs**; every endpoint independently checks membership and permission.
- A POS device cannot switch a shop merely by changing a client ID; reject cross-shop results and clear stale carts when switching.
- Never embed database passwords, Supabase service keys, company-wide admin credentials or API secrets in APK.
- Central session revocation, rate limits, device tokens, HTTPS and logging without leaking tokens are required before production.

## Versioned APIs
- Keep existing **proposed** `/mobile/v1/` routes in [MOBILE_API_CONTRACT.md](MOBILE_API_CONTRACT.md) as the reference.
- Separate authorization for read-inventory, read-repairs, propose-quotation, approved-checkout and permitted repair updates.
- For sales: server-calculated totals, idempotency key, atomic stock decrement, serial/IMEI tracking, receipt, audit.
- For master-data edits: secure web admin endpoints only; mobile requests may create review tasks, **not** directly apply changes.
- Reuse existing Telcohauz BOS stock, reservation, purchasing, finance and repair logic where verified (80 prior tests), instead of implementing a second ledger.

## AI
The present BOZ POS helper supports stock/price/repair summaries using **already loaded authorized shop records only**. It does not use an LLM, external AI model, private historical files or operational actions. Full BOZ AI requires a tenant-enforcing authenticated gateway and explicit human approval for modifying data.

## Google Photos / migration
Only user-selected Google Photos Picker assets or user-initiated exports are allowed; unrestricted scanning of every old photo is not supported by current Google Photos API access. Stage records, preserve originals, flag uncertain matches, review in Admin Website, then import approved historical records without modifying current stock.

## Required acceptance evidence before declaring DONE
1. Central identity/login and role isolation tested on at least two real test shops.
2. Shop A cannot fetch, modify, or prompt for Shop B data.
3. Admin web can manage product/supplier/cost while APK cannot.
4. Real POS checkout and stock ledger atomicity tested with retries/conflicts.
5. Camera barcode scanning and receipt printer verified on real supported Android hardware.
6. Correct ad entitlement and minimal banner verified, without forcing payment.
7. Real approved historical import and rollback tested.
8. Backend deployment/backup and Android release APK build, install and QA reports delivered.

**Current blocker:** Central BOZ backend endpoint, deployed authentication and production API implementation are not verified; Windows Remote Desktop is offline. Continue cloud-side tests and demo client, never mark live integration DONE.
