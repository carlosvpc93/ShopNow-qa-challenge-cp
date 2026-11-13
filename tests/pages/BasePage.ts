import type { Page } from "@playwright/test";
import { Header } from "./components/Header";

/** Shared contract for every page object: a page, a path and the common header. */
export abstract class BasePage {
  readonly page: Page;
  readonly header: Header;
  protected readonly path: string;

  constructor(page: Page, path: string) {
    this.page = page;
    this.path = path;
    this.header = new Header(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }
}
