import fs from 'fs';
import { request, type APIRequestContext } from '@playwright/test';
import { UserController } from '@api';

export type UserToLogin = { email: string; password: string };

type StorageState = Awaited<ReturnType<APIRequestContext['storageState']>>;

export function readStorageStateFile(fileName: string): StorageState {
  return JSON.parse(fs.readFileSync(fileName, 'utf-8')) as StorageState;
}

// A logged-in user stays on my-account; a guest is redirected (302) to the login form.
export async function isCookiesValid(
  baseURL: string,
  storageState: StorageState,
): Promise<boolean> {
  const api = await request.newContext({ baseURL, storageState });
  const response = await api.get('/index.php?controller=my-account', {
    maxRedirects: 0,
  });
  const isValid = response.status() === 200;
  await api.dispose();

  return isValid;
}

export async function loginAndSaveStorageState(
  baseURL: string,
  userToLogin: UserToLogin,
  fileName: string,
): Promise<void> {
  const api = await request.newContext({ baseURL });

  await new UserController(api).loginAsUser(
    userToLogin.email,
    userToLogin.password,
  );
  await api.storageState({ path: fileName });

  await api.dispose();
}
