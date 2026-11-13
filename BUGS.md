# Bugs found

Sorted by priority (most important first). All bugs were reproduced on a fresh install (`npm run reset`) with the test users, through the UI and/or the API. Root causes are pointed out in `app/` (optional extension).

| ID | Title | Severity | Priority | Source |
|---|---|---|---|---|
| BUG-01 | Payment shown as failed but the customer is charged (and can be charged twice) | Critical | P1 | Report 1 |
| BUG-02 | Any logged-in user can read any other user's order (IDOR) | Critical | P1 | Found by me |
| BUG-03 | Checkout accepts invalid quantities: negative/zero totals and corrupted stock ✅ fixed | Critical | P1 | Found by me |
| BUG-04 | Stock is not enforced: overselling and negative stock | High | P1 | Found by me |
| BUG-05 | Lowercase coupon code is accepted but gives 0% discount | High | P1 | Report 2 |
| BUG-06 | More than one coupon can be applied to the same purchase ✅ fixed | High | P2 | Found by me |
| BUG-07 | Products added with the catalog "Add" button disappear on reload | High | P2 | Report 3 |
| BUG-08 | Line totals are rounded down: totals off by one cent | Medium | P2 | Found by me |
| BUG-09 | Order date shows the next day for orders placed after 21:00 Argentina time | Medium | P2 | Found by me |
| BUG-10 | Shipping name/address with accents or "ñ" is rejected with a misleading message | Medium | P2 | Found by me |
| BUG-11 | Quantity selector capped at 10 even when more stock is available | Low | P3 | Found by me (assumption) |

---

## BUG-01 — Payment shown as failed but the customer is charged (and can be charged twice)

- **Source:** user report 1 ("Sometimes when I pay it says it failed, but I still got charged.")
- **Type:** Integration
- **Severity:** Critical
- **Priority:** P1. Direct money loss and trust issue: the customer is charged, told it failed, and the cart is still full, so retrying charges them again. It happens on every purchase over $100.
- **Preconditions:** logged in as Ana. Cart total > $100.00.
- **Steps to reproduce:**
  1. Log in as `ana@shopnow.test`.
  2. Open `/product/6` (Mechanical keyboard, $89.90), select quantity 2, click **Add to cart** (total $179.80).
  3. Go to `/checkout`, fill name `Ana Garcia`, address `1234 Corrientes Ave`, card `4242424242424242`, click **Pay**.
  4. Wait for the response, then open **My payments** and **My orders**.
- **Expected result:** the payment is approved and the user lands on the order confirmation (`/orders/{id}?new=1`) with the success message. The cart is emptied.
- **Actual result:** after about 3 s the checkout shows *"We couldn't process your payment. Please try again."* and stays on `/checkout` with the cart full ("Cart (2)"). But **My payments** shows a new **Approved $179.80** payment and **My orders** shows the order. Clicking **Pay** again creates a second order and charges again. Declined cards over $100 also get the generic message instead of "declined by the bank".
- **Evidence:** UI probe: `checkout-error` = "We couldn't process your payment…", URL `/checkout`; `GET /api/payments` → `[[4,179.8,"approved"], …]`.
- **Automated test:** `tests/ui/checkout.spec.ts` → `[BUG-01][UI] …`
- **Root cause in the code:** `app/web/src/pages/Checkout.tsx` aborts the request after `PAYMENT_TIMEOUT_MS = 3000`, while `app/server/api.ts` (`/checkout`) waits `sleep(totals.total > 100 ? 4000 : 700)` before answering. The server still finishes and saves the order and payment. Fix: a longer timeout, or poll the real order/payment status; make checkout idempotent.

---

## BUG-02 — Any logged-in user can read any other user's order (IDOR)

- **Source:** found by me
- **Type:** Security
- **Severity:** Critical
- **Priority:** P1. Exposes personal data (full name, shipping address, purchased items, totals) of every customer by just changing an ID. Order IDs are sequential, so they are trivial to enumerate.
- **Preconditions:** fresh data. Order #1 belongs to Ana.
- **Steps to reproduce:**
  1. Log in as `bruno@shopnow.test`.
  2. `GET /api/orders`: Bruno sees only order #3 (correct).
  3. `GET /api/orders/1` (or open `/orders/1` in the UI).
- **Expected result:** `404` "Order not found." (A5). The UI shows the error.
- **Actual result:** `200` with Ana's order: `"userId":1, "shipping":{"name":"Ana Garcia","address":"1234 Corrientes Ave, Buenos Aires"}`, items and totals. The UI renders it completely.
- **Evidence:** `curl -b bruno /api/orders/1` → `{"id":1,"userId":1,…,"shipping":{"name":"Ana Garcia",…}}` HTTP 200.
- **Automated test:** `tests/api/orders.api.spec.ts` → `[BUG-02][API] …`, `tests/ui/orders.spec.ts` → `[BUG-02][UI] …`
- **Root cause in the code:** `app/server/api.ts`, `GET /orders/:id` finds the order by id only and never compares `order.userId` with the logged-in user (unlike `GET /orders`).

---

## BUG-03 — Checkout accepts invalid quantities: negative/zero totals and corrupted stock

- **Source:** found by me
- **Type:** Data / Logic
- **Severity:** Critical
- **Priority:** P1. One request can create orders with negative totals, *increase* stock, or set a product's stock to `null`. After that the product shows "Out of stock" for every customer until the data is fixed by hand.
- **Preconditions:** logged in as Ana (API).
- **Steps to reproduce:**
  1. `POST /api/checkout` with `items: [{ "productId": 1, "quantity": -3 }]` and valid shipping/card.
  2. Repeat with `quantity: 0`, `quantity: 0.5` and `quantity: "abc"` (product 3).
  3. `GET /api/products/1` and `GET /api/products/3`.
- **Expected result:** `400 invalid data` for any quantity that is not a positive integer (A3). No order, no payment, stock unchanged.
- **Actual result:**
  - `-3` → `201`, `subtotal: -25.05`, `total: -25.05`, and an approved payment of -$25.05. Mug stock goes **up** from 25 to 28.
  - `0` → `201` order with total $0.00.
  - `0.5` → `201`, half a T-shirt for $7.17.
  - `"abc"` → `201` with `total: null`, and the product's `stock` becomes **`null`**. The catalog then shows the T-shirt as "Out of stock" for everyone.
  - Found while fixing: `items: [null]` (any non-object line item) throws `TypeError: Cannot read properties of null (reading 'productId')` inside the async handler. The rejection is unhandled, so **the whole server process crashes** and ShopNow is down for every user. Any logged-in user can do this with one request.
- **Evidence:** `HTTP201 … "subtotal":-25.05,"total":-25.05`; `quantity "abc"` → `"total":null`, then `GET /products/3` → `"stock":null`.
- **Automated test:** `tests/api/checkout.api.spec.ts` → `[BUG-03][API] …` (negative, zero, decimal, non-numeric). The malformed-item crash is **verified manually** and not automated on purpose: on the unfixed build it would kill the shared app server, so every test that runs after it would fail for an unrelated reason.
- **Root cause in the code:** `app/server/api.ts`, `/checkout` trusts the shape of `items`. It reads `item.productId` without checking that `item` is an object (so it crashes on `null`), and it does `const quantity = Number(item.quantity)` with no validation (integer ≥ 1). The bad value then goes into the totals and into `product.stock -= line.quantity`. Secondary cause of the crash: Express 4 doesn't catch errors thrown in `async` handlers.
- **Status: fixed** (commit `fix(BUG-03)`). `/checkout` now rejects with `400`, before any payment or stock change, (a) any line item that isn't an object (`"Invalid cart item."`) and (b) any quantity that isn't an integer ≥ 1 (numeric strings like `"2"` included: the documented contract uses numbers). Kept to the API on purpose (highest ROI): the server is the single gate every client goes through, and the UI already only sends valid integers (select 1–10, cart input clamped to ≥ 1). The 4 `[BUG-03]` tests now pass. The rest of the suite is unchanged (the other 18 bug tests still fail, valid checkouts still return `201` and decrement stock 25 → 23). `items:[null]` now returns `400` and the server stays up. *Recommended follow-up (not done):* an error-handling wrapper for async routes, so an unexpected error returns 500 instead of crashing the process.

---

## BUG-04 — Stock is not enforced: overselling and negative stock

- **Source:** found by me
- **Type:** Logic
- **Severity:** High
- **Priority:** P1. Breaks a spec rule ("users can't buy more than the available stock"). We sell items we don't have, and stock goes negative. The documented `409 out of stock` is never returned.
- **Preconditions:** fresh data. Ergonomic chair (id 8) has stock 2.
- **Steps to reproduce (API):**
  1. Log in as Ana. `POST /api/checkout` with `items: [{ "productId": 8, "quantity": 5 }]`.
  2. `GET /api/products/8`.
- **Steps to reproduce (UI):**
  1. Open `/product/8`, select 2, click **Add to cart** twice (or click **Add** in the catalog afterwards).
  2. Open `/cart`.
- **Expected result:** API returns `409` and stock stays 2. In the UI the cart quantity never exceeds 2 (a message explains the limit).
- **Actual result:** API `201`, order for 5 chairs, stock becomes **-3**. UI cart shows **4** chairs (stock 2), and checkout is allowed.
- **Evidence:** `GET /products/8` → `"stock":-3`. UI `cart-qty-8` = `4`.
- **Automated test:** `tests/api/checkout.api.spec.ts` → `[BUG-04][API] …`, `tests/ui/cart.spec.ts` → `[BUG-04][UI] …`
- **Root cause in the code:** `app/server/api.ts`, `/checkout` never compares `quantity` with `product.stock` (no 409 branch). `app/web/src/cart.tsx` `mergeItem` adds quantities without capping at stock, and `add()` and the catalog quick-add don't check stock.

---

## BUG-05 — Lowercase coupon code is accepted but gives 0% discount

- **Source:** user report 2 ("The discount code is accepted but the price doesn't change.")
- **Type:** Logic
- **Severity:** High
- **Priority:** P1. Breaks the explicit spec rule "codes are case-insensitive", hits every user who types the code in lowercase, and looks like the store doesn't honor its promotions.
- **Preconditions:** any product in the cart.
- **Steps to reproduce:**
  1. Add a T-shirt ($14.35) to the cart, open `/cart`.
  2. Type `flock10` in **Discount code**, click **Apply**.
- **Expected result:** "Coupon … applied (10%)", discount -$1.44, total $12.91, the same as `FLOCK10`.
- **Actual result:** "Coupon flock10 applied **(0%)**", discount **-$0.00**, total unchanged. `POST /api/coupons/validate {"code":"flock10"}` → `{"code":"flock10","percent":0}`. Checkout with `coupons:["flock10"]` charges the full price.
- **Evidence:** API response above. UI `coupon-applied` = "Coupon flock10 applied (0%)".
- **Automated test:** `tests/api/coupons.api.spec.ts` → `[BUG-05][API] …`, `tests/ui/cart.spec.ts` → `[BUG-05][UI] …`
- **Root cause in the code:** `app/server/api.ts` `findCoupon()` finds the key case-insensitively but then reads `COUPONS[typed]` (with the typed case) instead of `COUPONS[key]`, so it gets `undefined ?? 0`.

---

## BUG-06 — More than one coupon can be applied to the same purchase

- **Source:** found by me
- **Type:** Logic
- **Severity:** High
- **Priority:** P2. Breaks "only one per purchase". Customers can stack 10% + 15%, or the same coupon twice, so revenue is lost. It needs a reload or a direct API call, so it's less likely by accident than BUG-05.
- **Preconditions:** a product in the cart.
- **Steps to reproduce (UI):**
  1. Add product 1 (×3) to the cart, open `/cart`, apply `FLOCK10`.
  2. Reload the page.
  3. Apply `BIENVENIDA15`.
- **Steps to reproduce (API):** `POST /api/checkout` with `coupons: ["FLOCK10", "BIENVENIDA15"]` (or `["FLOCK10","FLOCK10"]`).
- **Expected result:** UI shows "Only one coupon can be used per purchase." API returns `400` (A4).
- **Actual result:** UI shows **two** "Coupon … applied" lines and adds both discounts. API `201` with discount 25% ($3.59 on $14.35, total $10.76). With the same coupon twice it's 20% ($2.88).
- **Evidence:** UI `coupon-applied` count = 2. API `"subtotal":14.35,"discount":3.59,"total":10.76`.
- **Automated test:** `tests/api/checkout.api.spec.ts` → `[BUG-06][API] …`, `tests/ui/cart.spec.ts` → `[BUG-06][UI] …`
- **Root cause in the code:** `app/web/src/cart.tsx` keeps the "one coupon" flag in `couponAppliedRef` (memory only, starts `false` on every load) instead of checking the persisted `coupons.length`. `app/server/api.ts` `/checkout` loops over every code in `coupons` without limiting to one.
- **Status: fixed** (commit `fix(BUG-06)`). Both root causes are fixed, because the rule must hold in the UI and on the server:
  - `app/web/src/cart.tsx`: removed `couponAppliedRef`. `applyCoupon` now checks the persisted state (`coupons.length > 0`), so the rule survives reloads, and it stores `[coupon]` instead of appending. This also fixes a related stale-flag case: after emptying the cart, the flag stayed `true` without any coupon applied.
  - `app/server/api.ts` `/checkout`: more than one code (different or repeated) → `400 "Only one coupon can be used per purchase."`. This closes the API bypass.
  - Verified: the 3 `[BUG-06]` tests pass. Single coupon still works (FLOCK10 on $14.35 → $12.91). Unknown code still returns 400. In the UI, remove → apply another coupon still works (spec flow), and so does empty cart → re-add → apply. The other 15 bug tests still fail as expected (no regression).

---

## BUG-07 — Products added with the catalog "Add" button disappear on reload

- **Source:** user report 3 ("Some things disappear from my cart when I reload the page.")
- **Type:** Data / UI
- **Severity:** High
- **Priority:** P2. Silent loss of cart items, so lost sales. Breaks "the cart persists even if the user closes the browser". The detail-page flow still works.
- **Preconditions:** empty cart.
- **Steps to reproduce:**
  1. Open `/` and click **Add** on "Basic T-shirt". The header shows "Cart (1)".
  2. Reload the page (or close and reopen the browser).
- **Expected result:** cart still has the T-shirt, "Cart (1)".
- **Actual result:** "Cart (0)", the T-shirt is gone. Mixed case: one item from the detail page plus one quick-add → "Cart (2)", after reload "Cart (1)". Only the quick-added item disappears.
- **Evidence:** probe output `before Cart (1)` / `after Cart (0)`.
- **Automated test:** `tests/ui/cart.spec.ts` → `[BUG-07][UI] …`
- **Root cause in the code:** `app/web/src/pages/Catalog.tsx` calls `cart.setItems(...)` (React state only) instead of `cart.add()`, which calls `persist()` and writes `localStorage`. It also skips the stock validation.

---

## BUG-08 — Line totals are rounded down: totals off by one cent

- **Source:** found by me
- **Type:** Logic
- **Severity:** Medium
- **Priority:** P2. Wrong amount on the cart, the order and the charge. Small per order, but it affects any price that isn't exact in binary floating point (e.g. $8.35), and it's an accounting and trust issue.
- **Preconditions:** none.
- **Steps to reproduce:**
  1. Open `/product/1` (Ceramic mug, $8.35), select 3, **Add to cart**.
  2. Open `/cart`. Optionally check out through the API with the same item.
- **Expected result:** line total and total **$25.05** (8.35 × 3, A1).
- **Actual result:** **$25.04** in the cart line, subtotal and total. The API order/payment is also `25.04`.
- **Evidence:** UI `cart-line-total-1` = "$25.04". API `"subtotal":25.04,"total":25.04`.
- **Automated test:** `tests/ui/cart.spec.ts` → `[BUG-08][UI] …`, `tests/api/checkout.api.spec.ts` → `[BUG-08][API] …`
- **Root cause in the code:** `app/shared/money.ts` `lineTotal()` uses `Math.floor(price * quantity * 100) / 100`. `8.35 * 3 = 25.049999…` floors to 25.04. It should round (e.g. `Math.round`), ideally working in cents.

---

## BUG-09 — Order date shows the next day for orders placed after 21:00 Argentina time

- **Source:** found by me
- **Type:** Logic
- **Severity:** Medium
- **Priority:** P2. Wrong dates in order history and confirmation. Breaks "dates and times are shown in Argentina time", and it's confusing for support and for customers checking their purchase.
- **Preconditions:** fresh data. Ana's order #2 was created at `2026-10-15T02:30:00Z` = **Oct 14, 23:30** Argentina time.
- **Steps to reproduce:**
  1. Log in as Ana, open `/orders` and `/orders/2`.
- **Expected result:** `10/14/2026 · 23:30`.
- **Actual result:** `10/15/2026 · 23:30`. The time is in Argentina time but the date is the UTC date. Every order placed between 21:00 and 23:59 ART shows the next day (it also happens to new orders).
- **Evidence:** UI `order-date` = "Date: 10/15/2026 · 23:30". API `displayDate: "10/15/2026"` for `createdAt 2026-10-15T02:30:00.000Z`.
- **Automated test:** `tests/api/orders.api.spec.ts` → `[BUG-09][API] …`, `tests/ui/orders.spec.ts` → `[BUG-09][UI] …`
- **Root cause in the code:** `app/server/api.ts` `formatOrderDate()` builds the date from `iso.slice(0, 10)` (UTC) but formats the time with the Argentina time zone.

---

## BUG-10 — Shipping name/address with accents or "ñ" is rejected with a misleading message

- **Source:** found by me
- **Type:** Logic / UI
- **Severity:** Medium
- **Priority:** P2. Blocks real Argentine customers ("Ana García", "Av. Córdoba", "Peña", "3º B") from paying, and the message ("Please fill in the shipping details") tells them to fill fields they already filled. *Assumption A9: if the PO confirms that only ASCII is allowed, this is still a bug in the error message.*
- **Preconditions:** logged in as Ana, a product in the cart.
- **Steps to reproduce:**
  1. Go to `/checkout`. Name `Ana García`, address `Av. Córdoba 1234`, card `4242424242424242`. Click **Pay**.
- **Expected result:** payment processed, order created.
- **Actual result:** `400` "Please fill in the shipping details." The fields are filled.
- **Evidence:** API `{"error":"Please fill in the shipping details."} HTTP400`.
- **Automated test:** `tests/api/checkout.api.spec.ts` → `[BUG-10][API] …`, `tests/ui/checkout.spec.ts` → `[BUG-10][UI] …`
- **Root cause in the code:** `app/server/api.ts` `/checkout` validates name and address with `SAFE_TEXT = /^[A-Za-z0-9 .,#/-]+$/` (ASCII only) and reuses the "empty fields" message.

---

## BUG-11 — Quantity selector capped at 10 even when more stock is available

- **Source:** found by me (assumption, needs PO confirmation, see question 6)
- **Type:** UI
- **Severity:** Low
- **Priority:** P3. Workaround exists (add again, or change the quantity in the cart). Only a bug if there's no business max of 10 per order.
- **Preconditions:** Ceramic mug (id 1) has stock 25.
- **Steps to reproduce:** open `/product/1`, open the **Quantity** select.
- **Expected result:** options up to the available stock (25), or a documented per-order limit.
- **Actual result:** options 1–10 only.
- **Evidence:** `quantity-select` has 10 options.
- **Automated test:** not automated on purpose: the expected behavior depends on the PO's answer.
- **Root cause in the code:** `app/web/src/pages/ProductDetail.tsx`: `Math.min(product.stock, 10)`.

---

## Notes on the existing tests

- `tests/cart.spec.ts` ("the cart total is calculated correctly") only checks that the line and total are **visible**. It passes even with BUG-08. I moved it to `tests/ui/cart.spec.ts` and made it assert real values.
- `tests/login.spec.ts` is fine as a smoke test. It moved to `tests/ui/auth.spec.ts`.
- Not verifiable locally (recorded in `ANALYSIS.md`): the confirmation email and real card processing.
