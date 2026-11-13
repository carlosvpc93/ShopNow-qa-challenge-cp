import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class CatalogPage extends BasePage {
  readonly search: Locator;
  readonly category: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    super(page, "/");
    this.search = page.getByTestId("search-input");
    this.category = page.getByTestId("category-select");
    this.message = page.getByTestId("catalog-message");
  }

  productCard(productId: number): Locator {
    return this.page.getByTestId(`product-card-${productId}`);
  }

  async quickAdd(productId: number): Promise<void> {
    await this.page.getByTestId(`quick-add-${productId}`).click();
    await this.message.waitFor();
  }
}
