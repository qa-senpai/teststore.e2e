import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { MyAccountPageLocators } from './MyAccountPageLocators';

export class MyAccountPage extends BasePage {
  url = '/index.php?controller=my-account';

  private readonly locators: MyAccountPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new MyAccountPageLocators(page);
  }

  async signOut(): Promise<void> {
    await this.locators.signOutLink.click();
  }

  async expectLoggedIn(fullName: string): Promise<void> {
    await expect(this.locators.accountLink).toContainText(fullName);
    await expect(this.locators.signOutLink).toBeVisible();
  }

  async expectLoggedOut(): Promise<void> {
    await expect(this.locators.signOutLink).toHaveCount(0);
    await expect(this.locators.signInLink).toBeVisible();
  }
}
