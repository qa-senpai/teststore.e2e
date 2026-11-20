import fs from 'fs';
import path from 'path';
import { test as base } from '@playwright/test';
import {
  isCookiesValid,
  loginAndSaveStorageState,
  readStorageStateFile,
  type UserToLogin,
} from '@utils';

type AuthFixtures = {
  userToLogin: UserToLogin | undefined;
};

export const test = base.extend<AuthFixtures>({
  userToLogin: [undefined, { option: true }],

  storageState: async ({ baseURL, userToLogin }, use) => {
    if (userToLogin) {
      const fileName = path.resolve(`.auth/${userToLogin.email}.json`);
      const isExist = fs.existsSync(fileName);

      if (isExist) {
        const isValid = await isCookiesValid(
          baseURL as string,
          readStorageStateFile(fileName),
        );

        if (!isValid) {
          await loginAndSaveStorageState(
            baseURL as string,
            userToLogin,
            fileName,
          );
        }
      }

      if (!isExist) {
        await loginAndSaveStorageState(
          baseURL as string,
          userToLogin,
          fileName,
        );
      }

      await use(fileName);
    } else {
      await use(undefined);
    }
  },
});
