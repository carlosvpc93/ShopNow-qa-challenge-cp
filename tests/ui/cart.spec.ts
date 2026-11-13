import { resetData } from "../helpers";
import { expect, test } from "../fixtures/ui.fixture";
import { COUPONS, PRODUCTS } from "../data/testData";
import { usd } from "../utils/money";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test.describe("Cart", () => {
  // Replaces the team's original test, which only checked visibility and could not catch a wrong total.
  test("the cart total is calculated correctly", async ({ productPage, cartPage }) => {
    await productPage.addProduct(PRODUCTS.mug.id, 2);
    await cartPage.goto();

    await expect(cartPage.lineTotal(PRODUCTS.mug.id)).toHaveText(usd(16.7));
    await expect(cartPage.subtotal).toHaveText(usd(16.7));
    await expect(cartPage.total).toHaveText(usd(16.7));
  });

  test("[BUG-08][UI] line total and cart total are rounded to the nearest cent (8.35 × 3 = $25.05)", async ({ productPage, cartPage }) => {
    await productPage.addProduct(PRODUCTS.mug.id, 3);
    await cartPage.goto();

    await expect(cartPage.lineTotal(PRODUCTS.mug.id)).toHaveText("$25.05");
    await expect(cartPage.total).toHaveText("$25.05");
  });

  test("[BUG-07][UI] a product added from the catalog stays in the cart after reloading", async ({ catalogPage, cartPage }) => {
    await catalogPage.goto();
    await catalogPage.quickAdd(PRODUCTS.tshirt.id);
    await expect(catalogPage.header.cartLink).toHaveText("Cart (1)");

    await catalogPage.reload();

    await expect(catalogPage.header.cartLink).toHaveText("Cart (1)");
    await cartPage.goto();
    await expect(cartPage.line(PRODUCTS.tshirt.id)).toBeVisible();
  });

  test("[BUG-05][UI] a lowercase coupon code gives the same 10% discount as the uppercase one", async ({ productPage, cartPage }) => {
    await productPage.addProduct(PRODUCTS.tshirt.id, 1); // $14.35
    await cartPage.goto();

    await cartPage.applyCoupon(COUPONS.flock10.toLowerCase());

    await expect(cartPage.appliedCoupons).toContainText("(10%)");
    await expect(cartPage.discount).toHaveText("-$1.44");
    await expect(cartPage.total).toHaveText("$12.91");
  });

  test("[BUG-06][UI] a second coupon cannot be applied after reloading the cart", async ({ productPage, cartPage }) => {
    await productPage.addProduct(PRODUCTS.tshirt.id, 1);
    await cartPage.goto();
    await cartPage.applyCoupon(COUPONS.flock10);
    await expect(cartPage.appliedCoupons).toHaveCount(1);

    await cartPage.reload();
    await cartPage.applyCoupon(COUPONS.bienvenida15);

    await expect(cartPage.appliedCoupons).toHaveCount(1);
    await expect(cartPage.couponError).toContainText("Only one coupon");
    await expect(cartPage.discount).toHaveText("-$1.44"); // still only 10% of $14.35
  });

  test("[BUG-04][UI] the cart never holds more units than the available stock", async ({ productPage, cartPage }) => {
    // Ergonomic chair: stock 2
    await productPage.addProduct(PRODUCTS.chair.id, 2);
    await productPage.addToCart(2);
    await cartPage.goto();

    await expect(cartPage.quantity(PRODUCTS.chair.id)).toHaveValue(String(PRODUCTS.chair.stock));
  });
});
