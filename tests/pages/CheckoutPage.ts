import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CheckoutPage extends BasePage {
  readonly total: Locator;
  readonly name: Locator;
  readonly address: Locator;
  readonly cardNumber: Locator;
  readonly payButton: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page, "/checkout");
    this.total = page.getByTestId("checkout-total");
    this.name = page.getByTestId("shipping-name");
    this.address = page.getByTestId("shipping-address");
    this.cardNumber = page.getByTestId("card-number");
    this.payButton = page.getByTestId("pay-button");
    this.error = page.getByTestId("checkout-error");
  }

  async fill(shipping: { name: string; address: string }, card: string): Promise<void> {
    await this.name.fill(shipping.name);
    await this.address.fill(shipping.address);
    await this.cardNumber.fill(card);
  }

  /** Fills the form and clicks Pay. Doesn't wait for the result: specs assert on it. */
  async pay(shipping: { name: string; address: string }, card: string): Promise<void> {
    await this.fill(shipping, card);
    await this.payButton.click();
  }
}
