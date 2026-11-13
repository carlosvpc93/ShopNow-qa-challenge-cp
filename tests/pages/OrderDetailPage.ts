import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class OrderDetailPage extends BasePage {
  readonly title: Locator;
  readonly date: Locator;
  readonly shipping: Locator;
  readonly total: Locator;
  readonly success: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page, "/orders");
    this.title = page.getByTestId("order-title");
    this.date = page.getByTestId("order-date");
    this.shipping = page.getByTestId("order-shipping");
    this.total = page.getByTestId("order-total");
    this.success = page.getByTestId("order-success");
    this.error = page.getByTestId("order-error");
  }

  async open(orderId: number): Promise<void> {
    await this.page.goto(`/orders/${orderId}`);
  }
}
