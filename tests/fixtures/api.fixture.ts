import { test as base, expect, type APIRequestContext } from "@playwright/test";
import { ShopNowApi } from "../clients/ShopNowApi";
import { USERS } from "../data/testData";

type User = { email: string; password: string };

type ApiFixtures = {
  /** Anonymous client (no session). */
  api: ShopNowApi;
  /** Client already logged in as Ana. */
  anaApi: ShopNowApi;
  /** Client already logged in as Bruno. */
  brunoApi: ShopNowApi;
};

/** Each user gets an isolated request context, so their session cookies never mix. */
async function loggedInClient(
  playwright: { request: { newContext: (o: { baseURL?: string }) => Promise<APIRequestContext> } },
  baseURL: string | undefined,
  user: User,
  use: (api: ShopNowApi) => Promise<void>,
) {
  const context = await playwright.request.newContext({ baseURL });
  const api = new ShopNowApi(context);
  const res = await api.login(user.email, user.password);
  // Setup guard (not a bug assertion): fail fast if the precondition can't be met.
  if (!res.ok()) throw new Error(`Setup failed: could not log in as ${user.email} (HTTP ${res.status()})`);
  await use(api);
  await context.dispose();
}

export const test = base.extend<ApiFixtures>({
  api: async ({ request }, use) => {
    await use(new ShopNowApi(request));
  },
  anaApi: async ({ playwright, baseURL }, use) => {
    await loggedInClient(playwright, baseURL, USERS.ana, use);
  },
  brunoApi: async ({ playwright, baseURL }, use) => {
    await loggedInClient(playwright, baseURL, USERS.bruno, use);
  },
});

export { expect };
