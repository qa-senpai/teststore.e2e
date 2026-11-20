import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { test as base, expect } from "../fixtures";
import { defaultUser } from "../e2e/search/data";
import { getUserStorageState } from "../fixtures/auth/storageState";

type AuthServer = {
  url: string;
  logins: number;
  rejectLogin: boolean;
  sessions: Set<string>;
  files: Set<string>;
};

// Exercise real HTTP cookies and Playwright contexts without changing demo-shop data.
const test = base.extend<{ authServer: AuthServer }>({
  authServer: async ({}, use) => {
    const authServer: AuthServer = {
      url: "",
      logins: 0,
      rejectLogin: false,
      sessions: new Set(),
      files: new Set(),
    };
    const server = createServer((request, response) => {
      if (request.method === "POST") {
        request.resume();
        authServer.logins++;
        if (authServer.rejectLogin) {
          response.end("Authentication failed");
          return;
        }
        const session = randomUUID();
        authServer.sessions.add(session);
        response.writeHead(302, {
          "Set-Cookie": `PrestaShop-test=${session}; Path=/; HttpOnly`,
          Location: "/index.php?controller=my-account",
        });
        response.end();
        return;
      }

      const session = request.headers.cookie?.match(
        /PrestaShop-test=([^;]+)/,
      )?.[1];
      if (session && authServer.sessions.has(session)) {
        response.end(
          '<a class="account">Cached User</a><a class="logout">Logout</a>',
        );
      } else if (request.url?.includes("controller=my-account")) {
        response.writeHead(302, {
          Location: "/index.php?controller=authentication",
        });
        response.end();
      } else {
        response.end(
          '<div id="_desktop_user_info"><a title="Log in to your customer account">Sign in</a></div>',
        );
      }
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("Missing server port");
    authServer.url = `http://127.0.0.1:${address.port}`;
    try {
      await use(authServer);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await Promise.all(
        [...authServer.files].map((file) => rm(file, { force: true })),
      );
    }
  },
  baseURL: async ({ authServer }, use) => {
    await use(authServer.url);
  },
});

test.afterEach(async ({ storageState, authServer }) => {
  if (typeof storageState === "string") authServer.files.add(storageState);
});

const user = { email: "cache-test@example.com", password: "test-password" };

test("reuses a saved session and refreshes revoked or corrupt state", async ({
  playwright,
  authServer,
}) => {
  const first = await getUserStorageState(playwright, authServer.url, user);
  authServer.files.add(first.fileName);
  expect(authServer.logins).toBe(1);
  expect(JSON.parse(await readFile(first.fileName, "utf8"))).toEqual(
    first.state,
  );

  const reused = await getUserStorageState(playwright, authServer.url, user);
  expect(reused).toEqual(first);
  expect(authServer.logins).toBe(1);

  authServer.sessions.clear();
  const refreshed = await getUserStorageState(playwright, authServer.url, user);
  expect(authServer.logins).toBe(2);
  expect(refreshed.state.cookies).not.toEqual(first.state.cookies);

  await writeFile(first.fileName, "{broken-json");
  await getUserStorageState(playwright, authServer.url, user);
  expect(authServer.logins).toBe(3);

  const other = await getUserStorageState(playwright, authServer.url, {
    ...user,
    email: "another@example.com",
  });
  authServer.files.add(other.fileName);
  expect(other.fileName).not.toBe(first.fileName);
  expect(authServer.logins).toBe(4);
});

test("failed login does not replace the saved state", async ({
  playwright,
  authServer,
}) => {
  const first = await getUserStorageState(playwright, authServer.url, user);
  authServer.files.add(first.fileName);
  authServer.sessions.clear();
  authServer.rejectLogin = true;

  await expect(
    getUserStorageState(playwright, authServer.url, user),
  ).rejects.toThrow("API login failed");
  expect(JSON.parse(await readFile(first.fileName, "utf8"))).toEqual(
    first.state,
  );
});

test.describe("userToLogin", () => {
  test.use({ userToLogin: user });

  test("restores authentication before opening the page", async ({
    myAccountPage,
    authServer,
  }) => {
    await myAccountPage.open();
    await myAccountPage.expectLoggedIn("Cached User");
    expect(authServer.logins).toBe(1);
  });
});

test("without userToLogin the browser remains a guest", async ({
  myAccountPage,
  authServer,
}) => {
  await myAccountPage.open();
  await myAccountPage.expectLoggedOut();
  expect(authServer.logins).toBe(0);
});

test("legacy login fixture uses the same saved session", async ({
  login: _login,
  myAccountPage,
  authCookies,
  playwright,
  authServer,
}) => {
  // The legacy fixture defaults to the existing account data.
  const saved = await getUserStorageState(
    playwright,
    authServer.url,
    defaultUser,
  );
  authServer.files.add(saved.fileName);
  expect(saved.state.cookies).toEqual(authCookies);
  await myAccountPage.open();
  await myAccountPage.expectLoggedIn("Cached User");
  expect(authServer.logins).toBe(1);
});
