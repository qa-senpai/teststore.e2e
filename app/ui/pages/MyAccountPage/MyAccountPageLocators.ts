import { Locator, Page } from '@playwright/test';

// The site has no data-test attributes, so CSS classes are used.
export class MyAccountPageLocators {
  readonly accountLink: Locator;
  readonly signOutLink: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.accountLink = page.locator('a.account');
    this.signOutLink = page.locator('a.logout');
    this.signInLink = page.locator(
      '#_desktop_user_info a[title="Log in to your customer account"]',
    );
  }
}
