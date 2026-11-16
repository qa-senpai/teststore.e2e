# Fixture examples (templates — adapt names, paths and data to this repo)

## 1. Composed fixtures: pages, token, login, authenticated request

Each fixture builds on the previous via destructuring; teardown goes in `finally`.

```ts
import { test as base, expect } from '@playwright/test';
import { Pages } from '../../pages/Pages';
import { UserController } from '../../controllers/UserController';
import { defaultUser } from '../test-data';

type MyFixtures = {
  login: void;
  token: string;
  pages: Pages;
};

const test = base.extend<MyFixtures>({
  pages: async ({ page }, use) => {
    await use(new Pages(page));
  },
  token: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({ baseURL });
    try {
      const token = await new UserController(api).loginAsUser(defaultUser.email, defaultUser.password);
      await use(token);
    } finally {
      await api.dispose();
    }
  },
  // Pre-authenticates the browser context by seeding localStorage, so the test starts logged in.
  login: async ({ context, baseURL, token }, use) => {
    await context.setStorageState({
      cookies: [],
      origins: [{
        origin: new URL(baseURL!).origin,
        localStorage: [{ name: 'qa-dojo.token', value: token }],
      }],
    });
    await use();
  },
  // Overrides the built-in `request` fixture so API calls carry the auth header.
  request: async ({ playwright, baseURL, token }, use) => {
    const api = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Token ${token}` },
    });
    try {
      await use(api);
    } finally {
      await api.dispose();
    }
  },
});

export { test, expect };
```

Using it: `test('...', async ({ login, pages }) => { ... })` — requesting `login` pulls in `token` automatically.

## 2. One fixture per Page Object (the `fixtures/pages.ts` pattern)

```ts
import { test as base } from '@playwright/test';
import { RegisterPage } from '../../src/pages/RegisterPage/RegisterPage';
import { LoginPage } from '../../src/pages/LoginPage/LoginPage';
import { HeaderComponent } from '../../src/pages/Components/HeaderComponent/HeaderComponent';

type PagesFixtures = {
  registerPage: RegisterPage;
  loginPage: LoginPage;
  headerComponent: HeaderComponent;
};

export const test = base.extend<PagesFixtures>({
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  headerComponent: async ({ page }, use) => {
    await use(new HeaderComponent(page));
  },
});
```

Pages and components are registered the same way. In this repo the imports are relative to `fixtures/`
(`../pages/LoginPage`) and the file ends with `export { expect } from '@playwright/test';`.
