import { test as base, expect } from "@playwright/test";
import { ShopNowApi } from "../clients/ShopNowApi";
import { login } from "../helpers";
import { CartPage } from "../pages/CartPage";
import { CatalogPage } from "../pages/CatalogPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { LoginPage } from "../pages/LoginPage";
import { OrderDetailPage } from "../pages/OrderDetailPage";
import { OrdersPage } from "../pages/OrdersPage";
import { ProductDetailPage } from "../pages/ProductDetailPage";

type User = { email: string; password: string };

type UiFixtures = {
  loginPage: LoginPage;
  catalogPage: CatalogPage;
  productPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  ordersPage: OrdersPage;
  orderDetailPage: OrderDetailPage;
  /** Logs the browser in through the UI (uses helpers.login). */
  loginAs: (user: User) => Promise<void>;
  /** Browser-context API client (shares cookies with the page). For setup and side-checks only. */
  api: ShopNowApi;
};

export const test = base.extend<UiFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  catalogPage: async ({ page }, use) => use(new CatalogPage(page)),
  productPage: async ({ page }, use) => use(new ProductDetailPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  ordersPage: async ({ page }, use) => use(new OrdersPage(page)),
  orderDetailPage: async ({ page }, use) => use(new OrderDetailPage(page)),
  loginAs: async ({ page }, use) => use((user) => login(page, user)),
  api: async ({ page }, use) => use(new ShopNowApi(page.request)),
});

export { expect };
