---
name: playwright-fixtures
description: Create, extend and use Playwright test fixtures in this repo (fixtures/). Use when the user asks for a fixture, when a new Page Object is created (it MUST be registered in the page fixtures file), when a test needs setup/teardown shared across tests (login, API token, API client, test data), or when tests build page objects by hand with `new XPage(page)`.
---

# Playwright fixtures

Fixtures give each test a fresh, isolated environment and replace `beforeEach`/`afterEach` boilerplate and
`new XPage(page)` calls inside tests. Official docs: https://playwright.dev/docs/test-fixtures — check them
whenever you are unsure about an API (scope, `auto`, `option`, `mergeTests`, teardown order). Do not guess.

## Layout

```
fixtures/
  pages.ts        # page-object fixtures (one per Page Object) + re-exported `expect`
  <topic>.ts      # other fixtures (auth, api, data), one file per concern
  index.ts        # only when 2+ fixture files exist: mergeTests(...) of all of them
```

Tests import `test` and `expect` from `fixtures/`, never from `@playwright/test` directly:

```ts
import { test, expect } from '../../fixtures/pages';
```

> The page fixtures file in this repo is `fixtures/pages.ts` (the user may call it "pageFixtures.ts"). If the user
> asks to rename it, rename the file and update every import in `tests/`.

## MANDATORY: register every new Page Object

Whenever a Page Object (or component) is created in `pages/` — including via the `page-object-creator` skill —
add it to `fixtures/pages.ts` in the same change. No page object is finished until this is done. Three edits:

1. `import { XPage } from '../pages/XPage';`
2. Add `xPage: XPage;` to the `PageFixtures` type.
3. Add the fixture to `base.extend<PageFixtures>({ ... })`:
   ```ts
   xPage: async ({ page }, use) => {
     await use(new XPage(page));
   },
   ```

Rules:
- Fixture name = class name with a lowercase first letter (`MyAccountPage` → `myAccountPage`).
- Keep the three lists in the same order (imports, type members, fixtures) — append at the end.
- Read `fixtures/pages.ts` first; if the fixture already exists, do not duplicate it.
- Keep `export { expect } from '@playwright/test';` at the bottom of the file.
- If the Page Object needs more than `page` (e.g. a token), add that fixture to the destructured arguments
  instead of constructing dependencies in the test.
- After registering, if tests in `tests/` still do `new XPage(page)` for this class, mention it to the user; migrate
  them only if asked or if they are part of the current task.

## Writing fixtures

Shape: `name: async ({ deps }, use) => { /* setup */ await use(value); /* teardown */ }`

- **Setup before `use`, teardown after it.** Code after `await use(...)` runs even when the test fails, but if a
  setup step can throw halfway, wrap the resource in `try { await use(x) } finally { await x.dispose() }` (see
  `references/fixtures-example.md`).
- **Declare dependencies by destructuring.** A fixture can request other fixtures (`page`, `context`, `request`,
  `baseURL`, `playwright`, or your own). Playwright runs only the fixtures a test or its dependencies actually use,
  and resolves order itself — never call one fixture from another by hand.
- **Type everything.** Put every custom fixture in a `type XFixtures = { ... }` and pass it to `base.extend<...>`.
  A fixture that only does setup/teardown has type `void` (`login: void`).
- **Isolation.** Default scope is `'test'`: a fresh instance per test. Use worker scope only for expensive, read-only
  or stateless things, with the tuple form and a second generic: `base.extend<TestFixtures, WorkerFixtures>({ db: [async ({}, use) => { ... }, { scope: 'worker' }] })`.
  A worker fixture cannot depend on test-scoped ones (`page`, `context`).
- **Auto fixtures** (`[async ({}, use) => {...}, { auto: true }]`) run for every test without being requested. Use
  sparingly (global logging, screenshots on failure) — they hide behavior.
- **Fixture options** (`[defaultValue, { option: true }]`) let a project or `test.use({ ... })` override a value.
- **Overriding built-ins** (`page`, `context`, `request`, `baseURL`): define a fixture with the same name in `extend`.
  It may destructure the original of the same name (`page: async ({ page, baseURL }, use) => { await page.goto(baseURL!); await use(page); }`).
  See "Overriding fixtures" in the docs.
- **Titles and steps.** Optionally pass `{ title: '...' }` or use `test.step` inside the fixture for readable
  reports; not required.
- No `waitForTimeout`, no assertions inside fixtures unless that is the fixture's explicit purpose.

## Composing fixture files

- One `base.extend` per concern, each file extending `base`; combine them with `mergeTests` in `fixtures/index.ts`:
  ```ts
  import { mergeTests } from '@playwright/test';
  import { test as pagesTest } from './pages';
  import { test as authTest } from './auth';
  export const test = mergeTests(pagesTest, authTest);
  export { expect } from '@playwright/test';
  ```
- Alternatively a file can extend another file's `test` (`pagesTest.extend<AuthFixtures>({...})`) when the second
  genuinely depends on the first. Prefer `mergeTests` for independent concerns.
- Once `fixtures/index.ts` exists, tests import from it, and new page fixtures still go to `fixtures/pages.ts`.

## Data and secrets

- Test users come from `data/users.ts` (`createUniqueUser()`); import them in the fixture. Do not hardcode credentials.
- Prefer API/storage-state setup in a fixture over driving the UI in `beforeEach` when it makes tests faster
  (see the `login`/`token` example). This shop has no seeded account, so UI registration is the fallback.

## Workflow

1. Read `fixtures/` and the relevant `pages/` files. Reuse existing fixtures.
2. Make the edit (new fixture, or the three-step page registration above).
3. Run `npx tsc --noEmit` (note: root `tsconfig.json` `include` must cover `fixtures/**/*.ts` to type-check them — add
   it if missing) and, if tests use the fixture, `PLAYWRIGHT_HTML_OPEN=never npx playwright test`. Report results
   faithfully; if tests were not run, say so.
4. Update affected tests only when asked or when they are the task. Do not change config.

## Reference

`references/fixtures-example.md` has two complete examples: (1) composed fixtures — `pages`, `token`, `login`,
overridden `request` — and (2) the one-fixture-per-page-object pattern used in `fixtures/pages.ts`.
