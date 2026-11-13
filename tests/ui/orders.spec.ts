import { resetData } from "../helpers";
import { expect, test } from "../fixtures/ui.fixture";
import { SEED_ORDERS, USERS } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test.describe("My orders", () => {
  test("[BUG-02][UI] a user cannot open another user's order by URL", async ({ loginAs, orderDetailPage }) => {
    await loginAs(USERS.bruno);

    await orderDetailPage.open(SEED_ORDERS.anaFirst.id);

    await expect(orderDetailPage.error).toHaveText("Order not found.");
    await expect(orderDetailPage.title).toBeHidden();
  });

  test("[BUG-09][UI] order dates are shown in Argentina time (23:30 ART on Oct 14 is not Oct 15)", async ({
    loginAs, ordersPage, orderDetailPage,
  }) => {
    await loginAs(USERS.ana);

    await ordersPage.goto();
    await expect(ordersPage.row(SEED_ORDERS.anaLateNight.id)).toContainText("10/14/2026");

    await orderDetailPage.open(SEED_ORDERS.anaLateNight.id);
    await expect(orderDetailPage.date).toHaveText("Date: 10/14/2026 · 23:30");
  });
});
