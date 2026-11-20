# teststore.e2e

End-to-end tests for [teststore.automationtesting.co.uk](https://teststore.automationtesting.co.uk), built with [Playwright](https://playwright.dev) and TypeScript.

> **AI-generated tests.** The tests and page objects in this repo are generated with [Claude Code](https://claude.com/claude-code).
> To extend or maintain them, use Claude Code with the project skills and agents in [`.claude/`](.claude):
>
> - Skills: `page-object-creator`, `playwright-cli`
> - Agents: `playwright-test-planner`, `playwright-test-generator`, `playwright-test-healer`

## Prerequisites

- [Node.js](https://nodejs.org) latest 22.x, 24.x or 26.x.
- [Claude Code](https://claude.com/claude-code), only needed to generate or update tests

## Setup

```bash
npm ci
npx playwright install --with-deps
```

## Running tests

```bash
npx playwright test                    # all tests, all browsers
npx playwright test --project=chromium # single browser
npx playwright test tests/auth         # single folder or file
npx playwright test --ui               # interactive UI mode
npx playwright show-report             # open the last HTML report
```

## Saved user sessions

Authenticated specs select an account before Playwright creates the browser context:

```ts
import { test } from '../../fixtures';
import { defaultUser } from '../search/data';

test.use({ userToLogin: defaultUser });

test('opens the account', async ({ myAccountPage }) => {
  await myAccountPage.open();
});
```

`userToLogin` accepts `{ email, password }`; `defaultUser` uses `USER_EMAIL` /
`USER_PASSWORD` when set. Without `userToLogin`, tests start as guests.

The `storageState` fixture follows the Content Hub pattern: read the saved JSON,
validate the session against the server, and log in again if it is missing or invalid.
Here validation requests `/index.php?controller=my-account` without following redirects
and checks for the logout link. Login uses the existing PrestaShop form API controller.
Malformed JSON is recreated; network and filesystem errors are surfaced.

Full Playwright storage state (`cookies` and `origins`) is stored under
`playwright/.auth/`, which is already ignored by Git. Filenames are hashes of the
site origin and user email, so accounts and environments have separate caches.
Files are replaced atomically for parallel workers. Delete the corresponding JSON
to force a fresh login. Test changes and logout are not saved back to the cache;
an invalidated server session is refreshed on the next use.

Existing `login: _login` and `authCookies` fixtures remain supported and use the same
cache, injecting cookies into the current context. Prefer `userToLogin` for new tests
to restore the complete storage state when the context is created. Cached sessions
do not isolate server-side data such as carts between tests using the same account.

## Console errors

Every test automatically tracks browser console errors (`console.error`) and uncaught page
exceptions on all pages of its context (`tests/fixtures/console.ts`). The test is **not**
interrupted; after it finishes, the HTML report gets:

- `console-errors.txt` — for each error: message, browser stack/source, page URL, time since
  test start, the last Playwright call our code made, its call chain and a code snippet;
- `console-error-N.png` — a screenshot taken at the moment the error was logged;
- `console-errors-ignored.txt` — errors matched by a known-error rule;
- a `console errors` annotation on the test.

A short summary is also printed to the terminal.

```bash
FAIL_ON_CONSOLE_ERRORS=true npx playwright test   # fail tests that logged unknown console errors
```

Known, non-bug errors are filtered by rules in `tests/fixtures/console/knownConsoleErrors.ts`
(`message` and optional `url` as substring or RegExp, plus a `reason`). For one spec or describe:

```ts
test.use({
  ignoredConsoleErrors: [{ message: /ResizeObserver loop/, reason: "browser noise" }],
  failOnConsoleErrors: true, // overrides the env var for this block
});
```

Tests can read the collected errors via the `consoleErrors` fixture (`consoleErrors.errors`).

## Project structure

```text
pages/   Page objects and their locators
tests/   Test specs
data/    Test data
.claude/ Claude Code skills and agents
```
