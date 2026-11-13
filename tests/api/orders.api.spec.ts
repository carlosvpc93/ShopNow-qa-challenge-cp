import { resetData } from "../helpers";
import { expect, test } from "../fixtures/api.fixture";
import { SEED_ORDERS } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test.describe("Orders API", () => {
  test("[BUG-02][API] a user gets 404 when requesting another user's order", async ({ brunoApi }) => {
    const res = await brunoApi.getOrder(SEED_ORDERS.anaFirst.id);

    expect(res.status()).toBe(404);
    expect(await res.text()).not.toContain("Ana Garcia");
  });

  test("[BUG-09][API] order display date and time are both in Argentina time", async ({ anaApi }) => {
    const res = await anaApi.getOrder(SEED_ORDERS.anaLateNight.id);

    expect(res.status()).toBe(200);
    const order = await res.json();
    expect(order.displayDate).toBe("10/14/2026");
    expect(order.displayTime).toBe("23:30");
  });
});
