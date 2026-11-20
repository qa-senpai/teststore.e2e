import { test as base } from '@playwright/test';
import { CartController } from '@api';

type CartFixtures = {
  cartCleanup: void;
};

export const test = base.extend<CartFixtures>({
  // Runs after the test and its afterEach hooks, before the browser context is disposed.
  cartCleanup: [
    async ({ context }, use) => {
      await use();
      // Uses current browser cookies, including guest carts and UI logins.
      await new CartController(context.request).cleanupCart();
    },
    { auto: true, box: true, title: 'cart cleanup', timeout: 30_000 },
  ],
});
