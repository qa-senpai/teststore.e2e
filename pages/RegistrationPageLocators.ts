import { Locator, Page } from '@playwright/test';

// The site has no data-test attributes, so name attributes are used.
export class RegistrationPageLocators {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly gdprCheckbox: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    const form = page.locator('#customer-form');
    this.firstNameInput = form.locator('input[name="firstname"]');
    this.lastNameInput = form.locator('input[name="lastname"]');
    this.emailInput = form.locator('input[name="email"]');
    this.passwordInput = form.locator('input[name="password"]');
    this.gdprCheckbox = form.locator('input[name="psgdpr"]');
    this.saveButton = form.locator('[data-link-action="save-customer"]');
  }
}
