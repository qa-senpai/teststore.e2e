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

The `storageState` fixture follows the Content Hub algorithm:

1. File `playwright/.auth/<email>.json` exists → check the cookies with
   `isCookiesValid` (`/index.php?controller=my-account` returns 200 only for a
   logged-in user). Invalid → `loginAndSaveStorageState`.
2. File does not exist → `loginAndSaveStorageState` (API form login, then save the
   storage state to the file).
3. Pass the file path to Playwright.

`playwright/.auth/` is ignored by Git. Delete the JSON to force a fresh login.
Cached sessions do not isolate server-side data such as carts between tests using
the same account.

## Cart cleanup

The automatic `cartCleanup` fixture runs `EntityCleanup.runEntityCleanup()` after
every test and its `afterEach` hooks, including failed tests. Like the Content Hub
cleanup helper, it delegates deletion to the API controller. It has a separate
30-second teardown timeout and runs before the browser context is disposed.

`CartController.cleanupCart()` reads the actual cart using the test's shared
`context.request`, removes every line through its current server-issued removal
URL, and verifies the cart is empty. This includes pre-existing leftovers and
items added outside `ProductPage`; a completed checkout's empty cart is also valid.
Deletion failures do not stop attempts to remove other lines, and cleanup errors
fail the test. No global product registry or manual cleanup call is needed.

Tests sharing an account also share server-side cart data. Run such scenarios
sequentially (`--workers=1`) or use separate accounts when running them in parallel.

The cleanup regression checks both the API and the cart page **after fixture
teardown** and attaches `cart-after-cleanup` (`[]`) to the HTML report. It covers
a guest and a freshly registered user, independently of the shared demo account:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e/cart/cart-cleanup.spec.ts --project=chromium --workers=1
```

## Console errors

Every test listens to `page.on('console')` and `page.on('pageerror')` on all pages
of its context (`tests/fixtures/console.ts`). Errors are collected without interrupting
the test. After it finishes, `console-errors.txt` is attached to the HTML report with
each error's type, message, page URL and source URL. The report is also printed to the
terminal, or used as the failure message when `failOnConsoleErrors` is enabled.

```bash
FAIL_ON_CONSOLE_ERRORS=true npx playwright test   # fail tests that logged unknown console errors
```

Known, non-bug errors are skipped using rules in `app/utils/console/knownConsoleErrors.ts`
(`message` and optional `url` as substring or RegExp, plus a `reason`). For one spec or describe:

```ts
test.use({
  ignoredConsoleErrors: [{ message: /ResizeObserver loop/, reason: "browser noise" }],
  failOnConsoleErrors: true, // overrides the env var for this block
});
```

Tests can read the collected messages via the `consoleErrors` fixture (`consoleErrors.errors`,
a string array). The helper lives in `app/utils/console/checkPageConsoleError.ts`;
the fixture removes its listeners during teardown.

## Project structure

```text
pages/   Page objects and their locators
tests/   Test specs
data/    Test data
.claude/ Claude Code skills and agents
```
