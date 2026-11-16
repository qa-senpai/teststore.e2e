import { test as base } from '@playwright/test';
import { LoginPage, MyAccountPage, RegistrationPage, SearchPage } from '@pages';

type PageFixtures = {
  loginPage: LoginPage;
  myAccountPage: MyAccountPage;
  registrationPage: RegistrationPage;
  searchPage: SearchPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  myAccountPage: async ({ page }, use) => {
    await use(new MyAccountPage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
});

export { expect } from '@playwright/test';
