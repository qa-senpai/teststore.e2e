# Fixture examples (match this repo: paths are relative to `tests/fixtures/`)

## 1. One fixture per Page Object (`tests/fixtures/pages.ts`)

```ts
import { test as base } from '@playwright/test';
import { CartPage, LoginPage, ProductPage } from '../../app/ui/pages';

type PageFixtures = {
  loginPage: LoginPage;
  productPage: ProductPage;
  cartPage: CartPage;
};

const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

export { test };
export { expect } from '@playwright/test';
```

Only pages are registered. Components and modals are reached through their page (`productPage.addToCartModal`).

## 2. Controller fixtures (`tests/fixtures/api.ts`)

A controller that must act on the browser's session (cart, account) is built on `context.request`, which shares
cookies with the page. A controller that needs its own session gets a standalone context, disposed in `finally`.

```ts
import { test as base } from '@playwright/test';
import { CartController, UserController } from '@api';
import { defaultUser } from '@data';

type ApiFixtures = {
  cartController: CartController;
  loggedInApi: UserController;
};

export const test = base.extend<ApiFixtures>({
  // Same cookies as the browser: products removed here disappear from the page's cart.
  cartController: async ({ context }, use) => {
    await use(new CartController(context.request));
  },

  // Separate session, logged in as defaultUser; not visible to the browser.
  loggedInApi: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({ baseURL });
    try {
      const user = new UserController(api);
      await user.loginAsUser(defaultUser.email, defaultUser.password);
      await use(user);
    } finally {
      await api.dispose();
    }
  },
});
```

Then append `apiTest` to `mergeTests(...)` in `tests/fixtures/index.ts`, keeping the existing entries.

Logging the **browser** in is already handled by `tests/fixtures/auth.ts` — use `test.use({ userToLogin: defaultUser })`
instead of writing a new login fixture.

## 3. Auto cleanup fixture (`tests/fixtures/cleanup.ts` pattern)

```ts
import { test as base } from '@playwright/test';
import { CartController } from '@api';

type CartFixtures = { cartCleanup: void };

export const test = base.extend<CartFixtures>({
  cartCleanup: [
    async ({ context }, use) => {
      await use();
      // Teardown runs even when the test failed.
      await new CartController(context.request).cleanupCart();
    },
    { auto: true, box: true, title: 'cart cleanup', timeout: 30_000 },
  ],
});
```

Using fixtures in a spec (`tests/e2e/cart/remove-line.spec.ts`):

```ts
import { test } from '../../fixtures';
import { defaultUser } from '@data';

test.use({ userToLogin: defaultUser });

test('[E2E-NNNN] removes a line from the cart', { tag: ['@e2e', '@cart'] }, async ({ cartPage, cartController }) => {
  // ...
});
```
