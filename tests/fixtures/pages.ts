import { test as base } from '@playwright/test';
import {
  CartPage,
  CheckoutPage,
  LoginPage,
  MyAccountPage,
  ProductPage,
  RegistrationPage,
  SearchPage,
} from '../../app/ui/pages';

type PageFixtures = {
  loginPage: LoginPage;
  myAccountPage: MyAccountPage;
  registrationPage: RegistrationPage;
  searchPage: SearchPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
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
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});

export { expect } from '@playwright/test';
