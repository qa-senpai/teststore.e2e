import { test as base, Cookie } from '@playwright/test';
import { UserController } from '@api';
import { defaultUser } from '../e2e/search/data';

type AuthFixtures = {
  authCookies: Cookie[];
  login: void;
};

export const test = base.extend<AuthFixtures>({
  // Logs in through a standalone API context and returns its session cookies.
  authCookies: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({ baseURL });
    try {
      await new UserController(api).loginAsUser(
        defaultUser.email,
        defaultUser.password,
      );
      const { cookies } = await api.storageState();
      await use(cookies);
    } finally {
      await api.dispose();
    }
  },
  // Puts the session cookies into the browser context: every page opened after this is logged in.
  login: async ({ context, authCookies }, use) => {
    await context.addCookies(authCookies);
    await use();
  },
});
