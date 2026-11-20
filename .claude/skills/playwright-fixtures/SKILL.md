---
name: playwright-fixtures
description: Create, extend and use Playwright test fixtures in this repo (tests/fixtures/). Use when the user asks for a fixture, when a new Page Object is created (it MUST be registered in tests/fixtures/pages.ts), when a test needs setup/teardown shared across tests (login via storage state, API controller, cleanup, test data), or when tests build page objects by hand with `new XPage(page)`.
---

# Playwright fixtures

Fixtures give each test a fresh, isolated environment and replace `beforeEach`/`afterEach` boilerplate and
`new XPage(page)` calls inside tests. Official docs: https://playwright.dev/docs/test-fixtures — check them
whenever you are unsure about an API (scope, `auto`, `option`, `mergeTests`, teardown order). Do not guess.

## Layout

```
tests/fixtures/
  pages.ts        # page-object fixtures (one per Page Object) + re-exported `expect`
  auth.ts         # `userToLogin` option + `storageState` override (API login, cached in .auth/<email>.json)
  console.ts      # auto `consoleErrors` + options `failOnConsoleErrors`, `ignoredConsoleErrors`
  cleanup.ts      # auto `cartCleanup` (empties the cart through CartController after each test)
  index.ts        # mergeTests(...) of all the files above — tests import from here
```

Tests import `test` and `expect` from the merged index, never from `@playwright/test` or from a single fixture file.
Specs live in `tests/e2e/<area>/`, so:

```ts
import { test, expect } from '../../fixtures'; // or: from '@fixtures'
```

## MANDATORY: register every new Page Object

Whenever a Page Object is created in `app/ui/pages/` — including via the `page-object-creator` skill —
add it to `tests/fixtures/pages.ts` in the same change. Components (`app/ui/components/`) and modals
(`app/ui/modals/`) are NOT registered: tests reach them through their owning page (`productPage.addToCartModal`,
`cartPage.header`). No page object is finished until this is done. Three edits:

1. Add `XPage` to the import list from the pages barrel: `import { ..., XPage } from '../../app/ui/pages';`
   (export it from `app/ui/pages/index.ts` first).
2. Add `xPage: XPage;` to the `PageFixtures` type.
3. Add the fixture to `base.extend<PageFixtures>({ ... })`:
   ```ts
   xPage: async ({ page }, use) => {
     await use(new XPage(page));
   },
   ```

Rules:
- Fixture name = class name with a lowercase first letter (`MyAccountPage` → `myAccountPage`).
- Keep the type members and fixtures in the same order — append at the end.
- Read `tests/fixtures/pages.ts` first; if the fixture already exists, do not duplicate it.
- Keep `export { expect } from '@playwright/test';` at the bottom of the file.
- If the Page Object needs more than `page` (e.g. a controller), add that fixture to the destructured arguments
  instead of constructing dependencies in the test.
- After registering, if tests in `tests/` still do `new XPage(page)` for this class, mention it to the user; migrate
  them only if asked or if they are part of the current task.

## Authentication (existing fixtures — reuse, don't duplicate)

- A test or describe logs in with `test.use({ userToLogin: defaultUser })` (`defaultUser` from `@data`).
- `tests/fixtures/auth.ts` overrides the built-in `storageState`: it logs in through `UserController.loginAsUser`
  (helpers in `app/utils/auth/storageState.ts`, exported via `@utils`), saves cookies to `.auth/<email>.json`,
  re-validates them with a `my-account` request and re-logs in when they expired. Without `userToLogin` the test
  runs as a guest.
- Fresh users (`createUniqueUser()`) are registered through the UI (`registrationPage.register`), because there is no
  registration API; see `tests/e2e/checkout/place-order.spec.ts`.

## Writing fixtures

Shape: `name: async ({ deps }, use) => { /* setup */ await use(value); /* teardown */ }`

- **Setup before `use`, teardown after it.** Code after `await use(...)` runs even when the test fails, but if a
  setup step can throw halfway, wrap the resource in `try { await use(x) } finally { await x.dispose() }` (see
  `references/fixtures-example.md`).
- **Declare dependencies by destructuring.** A fixture can request other fixtures (`page`, `context`, `request`,
  `baseURL`, `playwright`, or your own). Playwright runs only the fixtures a test or its dependencies actually use,
  and resolves order itself — never call one fixture from another by hand.
- **Session sharing.** The PrestaShop session lives in cookies. Use `page.request` / `context.request` when an API call
  must act on the browser's cart or account; a separate `playwright.request.newContext()` (or the built-in `request`
  fixture) has its own cookie jar.
- **Type everything.** Put every custom fixture in a `type XFixtures = { ... }` and pass it to `base.extend<...>`.
  A fixture that only does setup/teardown has type `void` (`cartCleanup: void`).
- **Isolation.** Default scope is `'test'`: a fresh instance per test. Use worker scope only for expensive, read-only
  or stateless things, with the tuple form and a second generic: `base.extend<TestFixtures, WorkerFixtures>({ db: [async ({}, use) => { ... }, { scope: 'worker' }] })`.
  A worker fixture cannot depend on test-scoped ones (`page`, `context`).
- **Auto fixtures** (`[async ({}, use) => {...}, { auto: true }]`) run for every test without being requested. Use
  sparingly (global logging, cleanup) — they hide behavior. This repo has two: `consoleErrors` and `cartCleanup`.
- **Fixture options** (`[defaultValue, { option: true }]`) let a project or `test.use({ ... })` override a value
  (`userToLogin`, `failOnConsoleErrors`, `ignoredConsoleErrors`).
- **Overriding built-ins** (`page`, `context`, `request`, `baseURL`, `storageState`): define a fixture with the same
  name in `extend`. It may destructure the original of the same name. `auth.ts` overrides `storageState` this way.
- **Titles and steps.** Optionally pass `{ title: '...', box: true }` or use `test.step` inside the fixture for
  readable reports; not required.
- No `waitForTimeout`, no assertions inside fixtures unless that is the fixture's explicit purpose.

## Composing fixture files

- One `base.extend` per concern, each file extending `base`; combine them with `mergeTests` in
  `tests/fixtures/index.ts`. When you add a file, append it to the existing call — keep all current entries:
  ```ts
  import { mergeTests } from '@playwright/test';
  import { test as pagesTest } from './pages';
  import { test as authTest } from './auth';
  import { test as consoleTest } from './console';
  import { test as cartTest } from './cleanup';
  import { test as apiTest } from './api'; // new file

  export const test = mergeTests(pagesTest, authTest, consoleTest, cartTest, apiTest);
  export { expect } from '@playwright/test';
  ```
- Alternatively a file can extend another file's `test` (`pagesTest.extend<ApiFixtures>({...})`) when the second
  genuinely depends on the first. Prefer `mergeTests` for independent concerns.
- New page fixtures always go to `tests/fixtures/pages.ts`, never to `index.ts`.

## Data and secrets

- Test users come from `tests/e2e/search/data/users.ts` via `@data`: `createUniqueUser()` for fresh registrations,
  `defaultUser` (override with `USER_EMAIL` / `USER_PASSWORD`) for the existing shared account. Do not hardcode
  credentials.
- Prefer API/storage-state setup over driving the UI in `beforeEach` when it makes tests faster.

## Workflow

1. Read `tests/fixtures/` and the relevant `app/ui/pages/` files. Reuse existing fixtures.
2. Make the edit (new fixture, or the three-step page registration above).
3. Run `npx tsc --noEmit` and, if tests use the fixture,
   `PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=chromium <spec>`. Report results faithfully; if tests
   were not run, say so.
4. Update affected tests only when asked or when they are the task. Do not change config.

## Reference

`references/fixtures-example.md` has complete examples in this repo's style: (1) the one-fixture-per-page-object
pattern of `tests/fixtures/pages.ts`, (2) a controller fixture with a `finally` teardown, (3) an auto cleanup fixture.
