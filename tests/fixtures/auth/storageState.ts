import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { APIRequestContext, PlaywrightWorkerArgs } from "@playwright/test";
import { UserController } from "@api";

export type UserToLogin = { email: string; password: string };
type StorageState = Awaited<ReturnType<APIRequestContext["storageState"]>>;
type Playwright = PlaywrightWorkerArgs["playwright"];

export async function readStorageStateFile(
  fileName: string,
): Promise<StorageState | undefined> {
  try {
    const state = JSON.parse(await readFile(fileName, "utf8"));
    if (!Array.isArray(state?.cookies) || !Array.isArray(state?.origins)) {
      return undefined;
    }
    return state;
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return undefined;
    }
    throw error;
  }
}

export async function isCookiesValid(
  playwright: Playwright,
  baseURL: string,
  state: StorageState,
): Promise<boolean> {
  const api = await playwright.request.newContext({
    baseURL,
    storageState: state,
  });
  try {
    // Guests are redirected to authentication. Do not follow that redirect.
    const response = await api.get("/index.php?controller=my-account", {
      maxRedirects: 0,
    });
    return (
      response.status() === 200 &&
      /<a\b[^>]*\bclass=["'][^"']*\blogout\b/i.test(await response.text())
    );
  } finally {
    await api.dispose();
  }
}

export async function loginAndSaveStorageState(
  playwright: Playwright,
  baseURL: string,
  userToLogin: UserToLogin,
  fileName: string,
): Promise<StorageState> {
  const api = await playwright.request.newContext({ baseURL });
  const temporaryFile = `${fileName}.${randomUUID()}.tmp`;
  try {
    await new UserController(api).loginAsUser(
      userToLogin.email,
      userToLogin.password,
    );
    const state = await api.storageState();
    await mkdir(path.dirname(fileName), { recursive: true });
    // Publish complete JSON atomically when multiple Playwright workers log in.
    await writeFile(temporaryFile, JSON.stringify(state), { mode: 0o600 });
    await rename(temporaryFile, fileName);
    return state;
  } finally {
    await api.dispose();
    await rm(temporaryFile, { force: true });
  }
}

export async function getUserStorageState(
  playwright: Playwright,
  baseURL: string | undefined,
  userToLogin: UserToLogin,
): Promise<{ fileName: string; state: StorageState }> {
  if (!baseURL) throw new Error("User storage state requires a baseURL.");

  // Separate accounts and environments without putting credentials in file names.
  const key = createHash("sha256")
    .update(JSON.stringify([new URL(baseURL).origin, userToLogin.email]))
    .digest("hex");
  const fileName = path.resolve("playwright/.auth", `${key}.json`);
  const savedState = await readStorageStateFile(fileName);
  if (savedState && (await isCookiesValid(playwright, baseURL, savedState))) {
    return { fileName, state: savedState };
  }

  const state = await loginAndSaveStorageState(
    playwright,
    baseURL,
    userToLogin,
    fileName,
  );
  return { fileName, state };
}
