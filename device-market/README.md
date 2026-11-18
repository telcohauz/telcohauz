# Telcohauz Device Market

Serve `dist/` as a static site. The preview uses browser-local records. Litar Mobile AI is a fictional virtual storefront with six reference products and no verified inventory or prices. Product photographs are model references from GSMArena. The catalogue links to each model and the complete GSMArena finder.

## Supabase backend

Apply `supabase/migrations/20261118063500_device_market.sql` to a dedicated Supabase project. It defines shop applications, listings, buyback requests and offers with ownership checks and row-level access controls. A shop starts pending. Approve it through a trusted administrative connection after reviewing the application. Only that approved shop can create a shop listing or quote on an assigned request. Private request and offer rows are visible to the relevant parties.

The static preview currently has no project credentials. The Ask Price workflow uses the signed-in user's Supabase session after configuration. Legacy preview tools continue to use browser-local storage. Use a publishable key in the browser. Keep service-role keys on the server. The virtual shop is a frontend catalogue.

## Ask Price

Apply `20261118064500_ask_price.sql` after the first migration. Add the dedicated project's URL and publishable key to `dist/assets/market-backend.js`. Buyers and sellers can sign in from **Tawaran Kedai**. Print or store no service key in the browser. Once approved, sellers list models from the canonical catalogue, optionally leaving prices blank.

An Ask Price request creates one inbox entry for each approved shop selling the exact active model. Shops respond with private quotes valid for 48 hours. Accept uses the amount and terms shown to the customer and creates one order awaiting payment. Inbox delivery is available via the app, with no external mail or payment provider wired in.

## Malaysian storefront and commission

The public reference view displays MYR only. Its original cited figures and dated conversion rate are kept in source for traceability. Listings omit shop names in the catalogue. Before enabling production checkout, complete the Malaysian seller identity, full price, shipping, payment, terms and complaint disclosures.

Apply `20261118065500_market_commission.sql` after the Ask Price migration. An authorised reconciliation service records a confirmed settlement once, using an agreed 5–10% rate on the order amount. No rate is selected by default. The function records commission and changes order status in one database transaction. It does not collect money or transfer funds.

Apply `20261118070000_market_roles.sql` after the commission migration. Ordinary accounts sign up as customers. Shop applications start pending, and only approved shops can list inventory and quote. Assign the Admin claim `app_metadata.market_role=admin` through trusted Supabase Auth administration. The user cannot assign that privilege from the website.

Location uses browser permission and a locally served geoBoundaries Malaysia ADM1 file. Attribution and the ODbL link are in the footer. Coordinates are processed in the browser.
