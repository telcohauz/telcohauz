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
