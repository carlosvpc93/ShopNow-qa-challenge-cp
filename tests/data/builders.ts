import type { CheckoutBody, CheckoutItem } from "../clients/ShopNowApi";
import { CARDS, SHIPPING } from "./testData";

/** Builds a valid checkout body; override only what the test is about. */
export function checkoutBody(items: CheckoutItem[], overrides: Partial<CheckoutBody> = {}): CheckoutBody {
  return {
    items,
    coupons: [],
    shipping: { ...SHIPPING.default },
    card: { number: CARDS.approved },
    ...overrides,
  };
}
