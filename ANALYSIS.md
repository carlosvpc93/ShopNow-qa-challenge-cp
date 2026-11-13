# Spec analysis

Scope: `SPEC.md` (cart and checkout) read together with `docs/API.md`. Questions are ordered by business risk: money and data first, then UX.

## Questions for the PO (prioritized)

1. **Payment timeouts / idempotency.** The processor "may take a few seconds". How long should the UI wait before showing an error? If the UI gives up but the payment is approved later, what should the user see, and how do we stop a second charge when they retry? Should checkout be idempotent (one order per cart/attempt)?
2. **Stock reservation.** Is stock checked only at checkout, or reserved when the item goes into the cart? If two users buy the last unit at the same time, who wins? The API documents `409 out of stock`. Is that the only expected behavior when the requested quantity exceeds stock?
3. **Coupon rules.** "Only one per purchase": per order, per user, or per user for life? (`BIENVENIDA15` sounds like a first-purchase coupon.) Do coupons expire, have usage limits or a minimum purchase? Can a coupon be combined with other promotions?
4. **Rounding.** How are line totals, discount and total rounded: half-up to the cent per line, or only on the final total? Is the discount computed on the subtotal before or after rounding? We need a reference example to accept prices like `$8.35 × 3`.
5. **Order visibility and privacy.** Confirm that a user can only see **their own** orders and payments, including when opening `/orders/:id` directly. What should happen when someone opens another user's order: `404` or `403`?
6. **Valid quantities.** Minimum 1 in the cart. Is there a maximum per order (the detail page caps the selector at 10)? Should the API reject `0`, negative, decimal or non-numeric quantities with `400`?
7. **Cart and identity.** The cart "persists even if the user closes the browser". Is that per browser (local storage) or per account (across devices)? What happens to a guest cart when the user logs in, and to the cart when a different user logs in on the same browser? Should the coupon also persist?
8. **Shipping data rules.** What characters are allowed in name and address? Accents and `ñ` are common in Argentina. Required fields, max length, and do we need city or postal code?
9. **Card rules.** Only "16 digits"? Do we need expiry date, CVV, Luhn check, brand detection? What message should the user see for a declined card versus a technical error?
10. **Confirmation email.** Content, sender, and when it is sent: on order creation or on payment approval? Not verifiable in this local environment.
11. **Payments list.** What fields should "My payments" show (date? status values other than approved: declined, refunded, pending)? Should declined attempts appear?
12. **Dates.** "Argentina time" applies to every date shown (orders list, order detail, payments)? Format `MM/DD/YYYY` or `DD/MM/YYYY` (the Argentine convention)?
13. **Search and filter.** Is the search by name only, partial and case-insensitive? Should accents be ignored ("cafe" finds "café")? Can search and category be combined?
14. **Out-of-stock products.** Should they be listed, hidden or shown as unavailable?

## Ambiguities found

- **"Users can't buy more than the available stock"**: only stated for the detail page. It doesn't say whether the cart, the catalog quick-add and the API must also enforce it, or whether stock is the stock at add-time or at payment-time.
- **"Only one coupon per purchase"**: the UI rule (remove before adding another) is defined, but not the server rule. Nothing says whether the API must reject several coupons.
- **"Case-insensitive codes"**: doesn't say how the code is stored or displayed on the order (as typed or canonical `FLOCK10`).
- **"The discount is a percentage of the subtotal"**: no rounding rule, and nothing about whether the discount can exceed the subtotal.
- **"Totals are shown in dollars with two decimals"**: says nothing about how amounts are *calculated* (the spec covers display, not arithmetic). Thousands separator not defined.
- **"On confirmation, the payment is processed and the order is created"**: order of operations and failure handling are undefined (payment approved but order fails, or UI timeout).
- **"Must log in before paying"**: at which step (when entering checkout or when pressing Pay)? Is the cart kept after login?
- **"Change quantities (minimum 1)"**: no maximum, and no rule for what happens if the user types an invalid value.
- **"Dates and times in Argentina time"**: date format not given. The orders list shows only the date, the detail shows date and time.
- **"See their payments"**: no fields or statuses defined.
- **Search**: no rule for empty results, accents or partial matches.

## Assumptions I make to move forward

- **A1 — Money:** each line total = price × quantity **rounded half-up to the cent**, subtotal = sum of lines, discount = subtotal × % rounded half-up, total = subtotal − discount. So `$8.35 × 3 = $25.05`.
- **A2 — Stock:** the stock limit applies everywhere: detail page, quick-add, cart and **API** (`409` as documented). Stock never goes negative.
- **A3 — Quantities:** valid quantities are positive integers (≥ 1). Anything else is `400 invalid data` from the API.
- **A4 — Coupons:** at most **one** coupon per order, enforced by both UI and API. The API rejects more than one with `400`. Lowercase codes give the same discount as uppercase.
- **A5 — Privacy:** users only see their own orders and payments. Another user's order returns `404` (don't reveal it exists).
- **A6 — Payment result:** the UI must never show "failed" for a payment that was approved. A UI timeout must be longer than the processor's maximum response time, or the UI must check the real result.
- **A7 — Cart persistence:** per browser, via local storage. Every way of adding a product (detail page and catalog quick-add) persists the same way.
- **A8 — Dates:** date **and** time are both in `America/Argentina/Buenos_Aires`. I keep the current `MM/DD/YYYY` format, pending the PO.
- **A9 — Shipping text:** real Argentine names and addresses (accents, `ñ`, `º`) must be accepted.
- **A10 — Not verifiable here:** the confirmation email, real card processing and multi-device cart persistence. I record them as open questions and don't test them.
- **A11 — Existing tests:** `tests/cart.spec.ts` claims to check that "the total is calculated correctly" but only asserts that elements are visible, so it can't catch a wrong total. I replace it with value-based assertions.
