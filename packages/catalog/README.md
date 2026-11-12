# BOZ Master Product

Canonical review registry shared by web and HERO. `data/products.json` contains
27 imported candidate records from the existing public telco source at its
recorded commit. These are not 558 verified EasyApply products. No price,
commission, stock, supplier approval or eligibility has been invented.

All candidates start on HOLD. `publicProduct()` suppresses price and application
permission until `canSell()` passes. HERO admits only explicitly approved,
available EasyApply telco plans with commission and dated HTTPS source evidence.
The 90-day freshness limit is an internal conservative policy, not a provider
rule; change it only through an explicit reviewed policy change.

Physical stock, telco plans and digital credit services are distinct domains.
Prices use integer MYR sen; null means unknown. Candidate duplicate detection
never deletes or merges records automatically. Product IDs survive name changes.

Authorized catalogue review happens through a reviewed data change: validate
current supplier evidence, commission, conditions and dates, set reviewer,
evidence URL, approved channels and availability, then run the tests. A label
such as EA-PUBLIC in the old source is not independent verification.

No real customer records are stored here. Existing Supabase services or Android
seed data must not be promoted into this registry without a mapping and review.
