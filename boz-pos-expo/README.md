# BOZ POS — Expo Android demo (Telcohauz)
**Status: source starter only. Not production or a tested APK.**
Five screens: Cashier, Inventory, Repairs, BOZ AI, Settings. Camera barcode/QR scanning, sample products, a cart that CANNOT finalize transactions, shop-specific synthetic data, and non-network ads placeholder. All records are sample only. Production backend, POS authentication, tenant enforcement, real AI, payment, subscription and printer adapters still need work.
## Phone-only build with Expo EAS
From an Android browser, open this branch in GitHub Codespaces. In the terminal:
```
cd boz-pos-expo
npm install
npx expo install --fix
npm run typecheck
npm run check
npx expo-doctor
npx eas-cli login
npx eas-cli build:configure --platform android
npx eas-cli build -p android --profile preview
```
Login to Expo only through official sign-in; never paste tokens into code or chat. EAS needs an Expo account and may be subject to free build quotas. It will show an APK link **only after a successful build**. Config uses `distribution: internal` and Android `buildType: apk`.
## GitHub Actions fallback
The workflow `BOZ POS Android Test APK` builds a **debug** APK without Expo login. Open GitHub Actions > workflow run > artifact `boz-pos-debug-apk`, provided the run actually succeeds. Debug APK is only for testing.
## Security rule
Only the separate admin website may change master products, cost/price, suppliers, roles, or approve imports. The POS APK must use secure APIs for authorized operations and may never hold admin database credentials. Demo cart is intentionally read-only and never posts sales.

## Phase 2 — Read-only mobile API client
Android has a **gated optional authentication UI** and documented versioned mobile API adapter. Real BOS API is **not yet deployed or verified**. By default `EXPO_PUBLIC_BOZ_API_URL` is empty, so the app remains synthetic demo only. Once a trusted backend implements [the contract](docs/MOBILE_API_CONTRACT.md), supply its HTTPS URL at build time (never secrets), run tenant-isolation tests, then enable real data.
No live sales, database/master-data writes or AI private-record access are possible from this prototype. Staff token exists in memory only and clears upon logout. Run `npm run unit` for API boundary tests.

## Phase 3 — Cart integrity + shareable draft
Pure functions validate current shop ownership, integer sen, stock quantity and cart totals. Camera scanning uses a synchronous callback guard against repeated barcode events. Staff can generate and share an **UNSAVED DRAFT** marked not a receipt/tax invoice; this does not print on a Bluetooth receipt printer or finalize any sale. Cloud workflow runs `npm run unit` and compiles APK. Physical camera installation/printing remains unverified.
