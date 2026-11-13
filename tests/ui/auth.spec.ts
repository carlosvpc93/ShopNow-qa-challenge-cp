import { resetData } from "../helpers";
import { expect, test } from "../fixtures/ui.fixture";
import { USERS } from "../data/testData";

test.beforeEach(async ({ request }) => {
  await resetData(request);
});

test.describe("Auth", () => {
  test("[EXAMPLE] a test user can log in", async ({ loginPage }) => {
    await loginPage.loginAs(USERS.ana);
    await expect(loginPage.header.ordersLink).toBeVisible();
  });
});
