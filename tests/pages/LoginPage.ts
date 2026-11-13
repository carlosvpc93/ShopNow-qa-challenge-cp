import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page, "/login");
    this.email = page.getByTestId("login-email");
    this.password = page.getByTestId("login-password");
    this.submit = page.getByTestId("login-submit");
    this.error = page.getByTestId("login-error");
  }

  async loginAs(user: { email: string; password: string }): Promise<void> {
    await this.goto();
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.submit.click();
    await this.header.logoutButton.waitFor(); // wait for the session, not an assertion
  }
}
