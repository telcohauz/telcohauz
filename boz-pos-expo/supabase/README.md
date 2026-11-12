# BOZ POS Production Core — Supabase migration
Source-controlled SQL for Telcohauz BOZ V1. **Do not confuse this database component with an end-to-end production release.**

- All tables namespaced with `pos_` and existing BOZ data untouched.
- Tenant memberships, per-shop product and stock records, repairs, sales, stock movement logs and server-managed ad entitlements.
- Explicit authenticated read-only grants and per-shop RLS; POS may not edit product master, supplier quotes or prices directly.
- Server-side `pos_cash_checkout` validates authenticated cashier and shop membership, takes an idempotency key, computes totals from server prices, and decrements stock atomically in one transaction.
- No shop or staff is auto-provisioned. A verified web-admin workflow is needed for that.
- No online payment or subscription billing is enabled.
- The migration MUST be tested and reviewed against Supabase security advisors. Physical receipt printer and phone installation must pass separately.
