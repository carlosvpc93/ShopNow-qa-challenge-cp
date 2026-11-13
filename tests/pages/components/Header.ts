import type { Locator, Page } from "@playwright/test";

/** Top navigation shared by all pages. */
export class Header {
  readonly cartLink: Locator;
  readonly ordersLink: Locator;
  readonly paymentsLink: Locator;
  readonly loginLink: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.cartLink = page.getByTestId("nav-cart");
    this.ordersLink = page.getByTestId("nav-orders");
    this.paymentsLink = page.getByTestId("nav-payments");
    this.loginLink = page.getByTestId("nav-login");
    this.logoutButton = page.getByTestId("logout");
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
