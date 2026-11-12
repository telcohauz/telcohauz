# BOZ POS Mobile API contract v1 — Not yet deployed
App is separate from web-only Shop Admin. This contract describes proposed *operational* routes for integration into the original Telcohauz BOS server after access is restored. Do not claim these endpoints already work.

- `GET /mobile/v1/health` -> `{"status":"ok"}`
- `POST /mobile/v1/session` JSON email/password -> `{"accessToken":"short-lived","userId":"u","shops":[{"id":"shop1","name":"Shop","role":"cashier"}]}`
- `GET /mobile/v1/shops/:shopId/inventory` -> `{"items":[{"id":"p1","shopId":"shop1","sku":"S1","barcode":"123","name":"Cable","priceCents":1500,"availableQty":12}]}`
- `GET /mobile/v1/shops/:shopId/repairs` -> `{"jobs":[{"id":"r1","shopId":"shop1","device":"Phone","issue":"Battery","status":"Pending"}]}`
All prices use integer MYR sen. Shop membership MUST be verified by the server for every request; client validation alone does not secure tenants. Staff POS credentials must NEVER receive master product, purchase cost, staff role or database configuration write permissions.
A production authentication design should include short sessions, revocation, rate limits, secure logging and independently tested shop isolation.
Future checkout needs server-computed totals, approved cash/register workflow, idempotency, atomic stock movement and audit logs. There is **no operational checkout route in this client version**.
Only configure a trusted `EXPO_PUBLIC_BOZ_API_URL` during build (not a secret); no backend endpoint has been verified. Until then the app remains synthetic demo mode.
