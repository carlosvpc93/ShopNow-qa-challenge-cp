import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class OrdersPage extends BasePage {
  constructor(page: Page) {
    super(page, "/orders");
  }

  row(orderId: number): Locator {
    return this.page.getByTestId(`order-row-${orderId}`);
  }
}
