import { resetData } from "../helpers";
import { expect, test } from "../fixtures/ui.fixture";
import { CARDS, PRODUCTS, SHIPPING, USERS } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test.describe("Checkout", () => {
  test("[BUG-01][UI] an approved payment over $100 shows the order confirmation, not a payment error", async ({
    loginAs, productPage, checkoutPage, orderDetailPage,
  }) => {
    await loginAs(USERS.ana);
    await productPage.addProduct(PRODUCTS.keyboard.id, 2); // $179.80
    await checkoutPage.goto();
    await expect(checkoutPage.total).toHaveText("$179.80");

    await checkoutPage.pay(SHIPPING.default, CARDS.approved);

    // The simulated processor may take a few seconds (docs/API.md).
    await expect(checkoutPage.page).toHaveURL(/\/orders\/\d+\?new=1$/, { timeout: 15_000 });
    await expect(orderDetailPage.success).toBeVisible();
    await expect(checkoutPage.error).toBeHidden();
    await expect(checkoutPage.header.cartLink).toHaveText("Cart (0)");
  });

  test("[BUG-10][UI] a customer can pay with accents in the shipping name and address", async ({
    loginAs, productPage, checkoutPage, orderDetailPage,
  }) => {
    await loginAs(USERS.ana);
    await productPage.addProduct(PRODUCTS.mug.id, 1);
    await checkoutPage.goto();

    await checkoutPage.pay(SHIPPING.withAccents, CARDS.approved);

    await expect(checkoutPage.page).toHaveURL(/\/orders\/\d+\?new=1$/, { timeout: 15_000 });
    await expect(orderDetailPage.shipping).toContainText(SHIPPING.withAccents.name);
  });
});
