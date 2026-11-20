import { Locator, Page } from '@playwright/test';

// The site has no data-test attributes, so name/id attributes are used.
export class LoginPageLocators {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly errorAlert: Locator;
  readonly createAccountLink: Locator;

  constructor(page: Page) {
    const form = page.locator('#login-form');
    this.emailInput = form.locator('input[name="email"]');
    this.passwordInput = form.locator('input[name="password"]');
    this.signInButton = form.locator('#submit-login');
    this.errorAlert = page.locator('.alert-danger');
    this.createAccountLink = page.locator(
      '[data-link-action="display-register-form"]',
    );
  }
}
