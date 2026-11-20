import { test as base, type Cookie } from "@playwright/test";
import { defaultUser } from "../e2e/search/data";
import { getUserStorageState, type UserToLogin } from "./auth/storageState";

type AuthFixtures = {
  userToLogin: UserToLogin | undefined;
  authCookies: Cookie[];
  login: void;
};

export const test = base.extend<AuthFixtures>({
  userToLogin: [undefined, { option: true }],

  // Like the Content Hub fixture: reuse a valid saved session or log in again.
  storageState: async ({ playwright, baseURL, userToLogin }, use) => {
    if (!userToLogin) {
      await use(undefined);
      return;
    }

    const { fileName } = await getUserStorageState(
      playwright,
      baseURL,
      userToLogin,
    );
    await use(fileName);
  },

  // Keep existing tests using `login: _login` working with the same session cache.
  authCookies: async ({ playwright, baseURL, userToLogin }, use) => {
    const { state } = await getUserStorageState(
      playwright,
      baseURL,
      userToLogin ?? defaultUser,
    );
    await use(state.cookies);
  },
  login: async ({ context, authCookies }, use) => {
    await context.addCookies(authCookies);
    await use();
  },
});
