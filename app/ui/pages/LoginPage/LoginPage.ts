import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { LoginPageLocators } from './LoginPageLocators';

export class LoginPage extends BasePage {
  url = '/index.php?controller=authentication';

  private readonly locators: LoginPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new LoginPageLocators(page);
  }

  async login(email: string, password: string): Promise<void> {
    await this.locators.emailInput.fill(email);
    await this.locators.passwordInput.fill(password);
    await this.locators.signInButton.click();
  }

  async openCreateAccount(): Promise<void> {
    await this.locators.createAccountLink.click();
  }

  async expectAuthenticationError(): Promise<void> {
    await expect(this.locators.errorAlert).toContainText(
      'Authentication failed',
    );
  }
}
