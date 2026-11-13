import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CartPage extends BasePage {
  readonly empty: Locator;
  readonly subtotal: Locator;
  readonly discount: Locator;
  readonly total: Locator;
  readonly couponInput: Locator;
  readonly couponApplyButton: Locator;
  readonly couponError: Locator;
  readonly appliedCoupons: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page, "/cart");
    this.empty = page.getByTestId("cart-empty");
    this.subtotal = page.getByTestId("cart-subtotal");
    this.discount = page.getByTestId("cart-discount");
    this.total = page.getByTestId("cart-total");
    this.couponInput = page.getByTestId("coupon-input");
    this.couponApplyButton = page.getByTestId("coupon-apply");
    this.couponError = page.getByTestId("coupon-error");
    this.appliedCoupons = page.getByTestId("coupon-applied");
    this.checkoutButton = page.getByTestId("go-to-checkout");
  }

  line(productId: number): Locator {
    return this.page.getByTestId(`cart-line-${productId}`);
  }

  lineTotal(productId: number): Locator {
    return this.page.getByTestId(`cart-line-total-${productId}`);
  }

  quantity(productId: number): Locator {
    return this.page.getByTestId(`cart-qty-${productId}`);
  }

  /** Types a code and clicks Apply; waits until the UI reacts (applied line or error). */
  async applyCoupon(code: string): Promise<void> {
    const appliedBefore = await this.appliedCoupons.count();
    await this.couponInput.fill(code);
    await this.couponApplyButton.click();
    await this.page.waitForFunction(
      (before) =>
        document.querySelectorAll('[data-testid="coupon-applied"]').length !== before ||
        !!document.querySelector('[data-testid="coupon-error"]'),
      appliedBefore,
    );
  }

  async goToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
