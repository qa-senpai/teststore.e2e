import { test as base } from '@playwright/test';
import { CartController } from '@api';

type CartFixtures = {
  cartCleanup: void;
};

export const test = base.extend<CartFixtures>({
  // Runs after the test and its afterEach hooks, before the browser context is disposed.
  cartCleanup: [
    async ({ request }, use) => {
      await use();
      // Shares the test's cookies, so cleanup targets its guest or authenticated cart.
      await new CartController(request).cleanupCart();
    },
    { auto: true, box: true, title: 'cart cleanup', timeout: 30_000 },
  ],
});
