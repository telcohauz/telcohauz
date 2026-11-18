# Telcohauz Device Market

Serve `dist/` as a static site. The preview uses browser-local records. Litar Mobile AI is a fictional virtual storefront with six reference products and no verified inventory or prices. Product photographs are model references from GSMArena. The catalogue links to each model and the complete GSMArena finder.

## Supabase backend

Apply `supabase/migrations/20261118063500_device_market.sql` to a dedicated Supabase project. It defines shop applications, listings, buyback requests and offers with ownership checks and row-level access controls. A shop starts pending. Approve it through a trusted administrative connection after reviewing the application. Only that approved shop can create a shop listing or quote on an assigned request. Private request and offer rows are visible to the relevant parties.

The static preview currently has no project credentials. For a shared rollout, connect Supabase Auth and replace browser-only writes with calls under the signed-in user's session. Use a publishable key in the browser. Keep service-role keys on the server. The virtual shop is a frontend catalogue.
