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
