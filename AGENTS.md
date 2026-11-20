# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Playwright + TypeScript end-to-end tests against the live PrestaShop demo shop https://teststore.automationtesting.co.uk (set as `baseURL` in `playwright.config.ts`). There is no app to build or start — tests hit the public site, so results depend on its current state.

## Commands

`package.json` has no npm scripts; use the tools directly.

```bash
npm ci && npx playwright install --with-deps    # setup
npx playwright test                             # all tests
npx playwright test tests/e2e/search/no-results.spec.ts   # one file
npx playwright test -g "E2E-0201"               # one test by title (titles carry [testId])
npx playwright test --grep @autocomplete        # by tag (@e2e, @search, @autocomplete, ...)
PLAYWRIGHT_HTML_OPEN=never npx playwright test  # non-interactive run (use this from Claude)
FAIL_ON_CONSOLE_ERRORS=true npx playwright test # fail tests that log unfiltered console errors
npx tsc --noEmit                                # type-check
npx eslint .                                    # lint (eslint.config.mts, prettier via eslint-plugin-prettier)
```

Note: the `chromium` and `search` projects are both plain Desktop Chrome with no `testMatch`, so a run without `--project` executes every test twice. Use `--project=chromium` for a single pass. CI (`.github/workflows/playwright.yml`) is manual `workflow_dispatch` only, with a project choice.

## Architecture

Three layers, wired together with TypeScript path aliases from `tsconfig.json` (`@pages`, `@api`, `@fixtures`, `@data`, `@utils`):

- **`app/ui/pages/`** — Page Objects. Each page is a folder `<Name>Page/` with `<Name>Page.ts` (extends `BasePage`, sets path-only `url`, holds actions and `expect*` assertion methods), `<Name>PageLocators.ts` (readonly `Locator` fields only), and an `index.ts` barrel; `app/ui/pages/index.ts` re-exports all. Inside a page folder import siblings/`../BasePage` directly to avoid barrel cycles.
- **`app/api/`** — API controllers over `APIRequestContext`. PrestaShop has no JSON auth API: `UserController.loginAsUser` replays the browser's login form POST and treats only a 302 as success (failed login returns 200).
- **`tests/fixtures/`** — `pages.ts` (one fixture per page object, `xPage` naming), `auth.ts` (option `userToLogin`; when set, the overridden `storageState` logs in via `UserController` and caches cookies in `.auth/<email>.json`, re-validating them per test — helpers in `app/utils/auth/storageState.ts`), `cleanup.ts` (auto `cartCleanup` empties the cart through `CartController.cleanupCart()` after each test), `console.ts` (below), merged with `mergeTests` in `index.ts`. **Every new page object must be registered in `tests/fixtures/pages.ts`.**
- **`tests/fixtures/console.ts`** — auto fixture `consoleErrors` that collects errors using `page.on('console')` and `page.on('pageerror')` on all context pages and attaches a text report after the test. `FAIL_ON_CONSOLE_ERRORS=true` (or `test.use({ failOnConsoleErrors: true })`) fails the test afterwards. Known non-bug errors go into `app/utils/console/knownConsoleErrors.ts` (with a `reason`) or per-spec `test.use({ ignoredConsoleErrors: [...] })`. The helper is `app/utils/console/checkPageConsoleError.ts`; `consoleErrors.errors` is a string array. Listeners are removed during fixture teardown.
- **Tests** live in `tests/e2e/<area>/` and import `test`/`expect` from `../../fixtures` (or `@fixtures`), never from `@playwright/test`, and never do `new XPage(page)`. Log an existing user in with `test.use({ userToLogin: defaultUser })`.
- **Test data** lives in `tests/e2e/search/data/` (`@data`; shared by all areas despite the folder name): `users.ts` (`createUniqueUser()` for fresh registrations; `defaultUser` for API login, overridable via `USER_EMAIL`/`USER_PASSWORD`), and `search/*.ts` row tables. Search specs are data-driven: they loop over rows and generate one test per row titled `[<testId>] <id> ...` with tags.

## Conventions specific to this site

- The site has **no `data-test` attributes**; locators use ids, classes and `name` attributes. Leave a short comment in the locators class saying so.
- Assertions belong in page-object `expect*` methods using web-first assertions; no `waitForTimeout`, no `networkidle` (ESLint errors on the latter).
- `tests/e2e/auth/authentication.spec.ts` registers a new user per test via the UI because the shop has no seeded account for that flow.

## Claude tooling in `.claude/`

- Skills: `teststore-business-context` (domain facts, quirks — read before planning/generating tests), `page-object-creator`, `playwright-fixtures`, `api-controller-creator`, `playwright-network`, `playwright-cli` (vendor CLI reference).
- Agents: `playwright-test-planner` (writes `specs/<feature>.plan.md`), `playwright-test-generator` (plan → `tests/e2e/<area>/*.spec.ts` + page-object changes), `playwright-test-healer` (runs tests with `--project=chromium`, debugs with `--debug=cli` + `playwright-cli attach`).
- There is no seed test; plans describe their start route and auth state in a `**Start:**` line instead. The seed flow in `playwright-cli`'s `references/test-generation.md` is generic vendor text — follow the agents.
- `page-object-creator` describes the target component/modal structure (`app/ui/components`, `app/ui/modals`); those folders don't exist yet.
