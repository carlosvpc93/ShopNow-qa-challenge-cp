import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ProductDetailPage extends BasePage {
  readonly name: Locator;
  readonly price: Locator;
  readonly stock: Locator;
  readonly quantity: Locator;
  readonly addToCartButton: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    super(page, "/");
    this.name = page.getByTestId("product-name");
    this.price = page.getByTestId("product-price");
    this.stock = page.getByTestId("product-stock");
    this.quantity = page.getByTestId("quantity-select");
    this.addToCartButton = page.getByTestId("add-to-cart");
    this.message = page.getByTestId("detail-message");
  }

  async open(productId: number): Promise<void> {
    await this.page.goto(`/product/${productId}`);
    await this.name.waitFor();
  }

  async addToCart(quantity = 1): Promise<void> {
    await this.quantity.selectOption(String(quantity));
    await this.addToCartButton.click();
    await this.message.waitFor();
  }

  /** Opens the product and adds it in one step. */
  async addProduct(productId: number, quantity = 1): Promise<void> {
    await this.open(productId);
    await this.addToCart(quantity);
  }
}
