import { resetData } from "../helpers";
import { expect, test } from "../fixtures/api.fixture";
import { checkoutBody } from "../data/builders";
import { COUPONS, PRODUCTS, SHIPPING } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test.describe("Checkout API", () => {
  const invalidQuantities: { label: string; value: unknown }[] = [
    { label: "negative", value: -3 },
    { label: "zero", value: 0 },
    { label: "decimal", value: 0.5 },
    { label: "non-numeric", value: "abc" },
  ];

  for (const { label, value } of invalidQuantities) {
    test(`[BUG-03][API] rejects a ${label} quantity with 400 and leaves stock unchanged`, async ({ anaApi }) => {
      const res = await anaApi.checkout(checkoutBody([{ productId: PRODUCTS.mug.id, quantity: value }]));

      expect(res.status(), `quantity ${JSON.stringify(value)} must be rejected`).toBe(400);
      const product = await (await anaApi.getProduct(PRODUCTS.mug.id)).json();
      expect(product.stock).toBe(PRODUCTS.mug.stock);
    });
  }

  test("[BUG-04][API] rejects buying more than the available stock with 409", async ({ anaApi }) => {
    const res = await anaApi.checkout(checkoutBody([{ productId: PRODUCTS.chair.id, quantity: PRODUCTS.chair.stock + 1 }]));

    expect(res.status()).toBe(409);
    const product = await (await anaApi.getProduct(PRODUCTS.chair.id)).json();
    expect(product.stock).toBe(PRODUCTS.chair.stock);
  });

  test("[BUG-06][API] rejects two different coupons in the same purchase", async ({ anaApi }) => {
    const res = await anaApi.checkout(
      checkoutBody([{ productId: PRODUCTS.tshirt.id, quantity: 1 }], { coupons: [COUPONS.flock10, COUPONS.bienvenida15] }),
    );

    expect(res.status()).toBe(400);
  });

  test("[BUG-06][API] rejects the same coupon applied twice", async ({ anaApi }) => {
    const res = await anaApi.checkout(
      checkoutBody([{ productId: PRODUCTS.tshirt.id, quantity: 1 }], { coupons: [COUPONS.flock10, COUPONS.flock10] }),
    );

    expect(res.status()).toBe(400);
  });

  test("[BUG-08][API] order and payment amounts are rounded to the nearest cent (8.35 × 3 = 25.05)", async ({ anaApi }) => {
    const res = await anaApi.checkout(checkoutBody([{ productId: PRODUCTS.mug.id, quantity: 3 }]));

    expect(res.status()).toBe(201);
    const order = await res.json();
    expect(order.subtotal).toBe(25.05);
    expect(order.total).toBe(25.05);
    const payments = await (await anaApi.listPayments()).json();
    expect(payments.find((p: { orderId: number }) => p.orderId === order.id)?.amount).toBe(25.05);
  });

  test("[BUG-10][API] accepts shipping name and address with accents", async ({ anaApi }) => {
    const res = await anaApi.checkout(
      checkoutBody([{ productId: PRODUCTS.mug.id, quantity: 1 }], { shipping: { ...SHIPPING.withAccents } }),
    );

    expect(res.status()).toBe(201);
  });
});
