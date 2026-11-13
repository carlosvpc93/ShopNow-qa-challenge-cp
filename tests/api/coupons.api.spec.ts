import { resetData } from "../helpers";
import { expect, test } from "../fixtures/api.fixture";
import { checkoutBody } from "../data/builders";
import { COUPONS, PRODUCTS } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test.describe("Coupons API", () => {
  test("[BUG-05][API] validating a lowercase code returns the real percent", async ({ api }) => {
    const res = await api.validateCoupon(COUPONS.flock10.toLowerCase());

    expect(res.status()).toBe(200);
    expect((await res.json()).percent).toBe(10);
  });

  test("[BUG-05][API] checkout with a lowercase code applies the 10% discount", async ({ anaApi }) => {
    const res = await anaApi.checkout(
      checkoutBody([{ productId: PRODUCTS.tshirt.id, quantity: 1 }], { coupons: [COUPONS.flock10.toLowerCase()] }),
    );

    expect(res.status()).toBe(201);
    const order = await res.json();
    expect(order.discount).toBe(1.44);
    expect(order.total).toBe(12.91);
  });
});
