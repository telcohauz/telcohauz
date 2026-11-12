# Telcohauz BOZ workspace

One organized source workspace, independent deployable modules and a shared
public product review registry. Existing repository histories and deployments remain
available. This source consolidation does not claim merged production databases,
single sign-on, verified merchant stock or a production Android release.

| Module | Directory | Run / check |
|---|---|---|
| Telcohauz web | repository root | `npm ci`, `npm run dev`, `npm run build` |
| Company management | `apps/businesshq` | `npm ci`, `npm run dev`, `npm run typecheck`, `npm run build` |
| Documents & audit | `apps/digital-audit` | `npm ci`, `npm run dev`, `npm test`, `npm run lint`, `npm run build` |
| BOZ POS Android | `boz-pos-expo` | `npm run unit`; see production readiness document |
| Master product | `packages/catalog` | `npm run test:catalog`; `npm run catalog:build` |
| Commerce staging | `services/commerce-sync` | `npm run test:commerce` |
| Shared UI | `packages/ui` | built and typechecked by consuming apps |

Run commands in the module's directory, except root `test:*` scripts.
Use separate ports for simultaneous apps. Each module keeps its own package
lock and environment settings. Root lint is scoped to the root web application;
module and shared-package checks are explicit in the workspace CI.

## Public catalogue

`/catalog` supports product search, provider filters and web/HERO channel views.
Build generates `/catalog/v1/web.json` and `/catalog/v1/hero.json` from the same
registry. The internal audit app uses the same registry. Unknown products remain
**Belum tersedia**, with no price/commission or application permission exposed.
The current import contains 27 candidates, zero verified sellable products.

## Configuration and access

Copy only the relevant `.env.example` locally. Never copy a database from another
module or elevate users automatically. Root web, BusinessHQ and POS currently
have different role schemas. Digital Audit uses verified Firebase credentials
and organization grants. Read each module README before provisioning accounts.

No SQL migration runs on application startup. Company-to-shop mapping and
identity migration require confirmed backend ownership and tenant tests first.
See `docs/consolidation/PLAN.md` and `workspace.json` for boundaries and gates.

Private Telcohauzmap source is deliberately kept in its private repository.
Its data is not copied to this public workspace. HERO remains EasyApply-only;
physical POS inventory is not a HERO product catalogue.

## Existing canonical BOZ products

`/master-products` signs in against the existing BOZ Supabase backend used by
POS. Only an active server-assigned OWNER/ADMIN profile can open the internal
registry. Queries retain RLS and use only a publishable key and the user's JWT.
No service-role key, private supplier costs or private catalogue dump is bundled.
The existing database remains the master; the 27 legacy web candidates are a
separate review/projection queue, not a replacement for existing EasyApply data.
READY/PRIVATE records are not automatically changed to LIVE/PUBLIC.
