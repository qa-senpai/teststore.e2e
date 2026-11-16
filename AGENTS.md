# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Playwright + TypeScript end-to-end tests against the live PrestaShop demo shop https://teststore.automationtesting.co.uk (set as `baseURL` in `playwright.config.ts`). There is no app to build or start — tests hit the public site, so results depend on its current state.

## Commands

`package.json` has no npm scripts; use the tools directly.

```bash
npm ci && npx playwright install --with-deps    # setup
npx playwright test                             # all tests
npx playwright test tests/search/no-results.spec.ts   # one file
npx playwright test -g "E2E-0201"               # one test by title (titles carry [testId])
npx playwright test --grep @autocomplete        # by tag (@e2e, @search, @autocomplete, ...)
PLAYWRIGHT_HTML_OPEN=never npx playwright test  # non-interactive run (use this from Claude)
npx tsc --noEmit                                # type-check
npx eslint .                                    # lint (eslint.config.mts, prettier via eslint-plugin-prettier)
```

Note: the `chromium` and `search` projects are both plain Desktop Chrome with no `testMatch`, so a run without `--project` executes every test twice. Use `--project=chromium` for a single pass. CI (`.github/workflows/playwright.yml`) is manual `workflow_dispatch` only, with a project choice.

## Architecture

Three layers, wired together with TypeScript path aliases from `tsconfig.json` (`@pages`, `@api`, `@fixtures`, `@data`):

- **`app/pages/`** — Page Objects. Each page is a folder `<Name>Page/` with `<Name>Page.ts` (extends `BasePage`, sets path-only `url`, holds actions and `expect*` assertion methods), `<Name>PageLocators.ts` (readonly `Locator` fields only), and an `index.ts` barrel; `app/pages/index.ts` re-exports all. Inside a page folder import siblings/`../BasePage` directly to avoid barrel cycles.
- **`app/api/`** — API controllers over `APIRequestContext`. PrestaShop has no JSON auth API: `UserController.loginAsUser` replays the browser's login form POST (captured in `teststore.automationtesting.co.uk.har`) and treats only a 302 as success (failed login returns 200).
- **`tests/fixtures/`** — `pages.ts` (one fixture per page object, `xPage` naming), `auth.ts` (`authCookies` logs in via API in a separate request context; `login` injects those cookies into the browser context), merged with `mergeTests` in `index.ts`. **Every new page object must be registered in `tests/fixtures/pages.ts`.**
- **Tests** import `test`/`expect` from `../fixtures`, never from `@playwright/test`, and never do `new XPage(page)`. Request a `void` fixture like `login` by destructuring it as `login: _login`.
- **Test data** lives in `tests/search/data/`: `users.ts` (`createUniqueUser()` for fresh registrations; `defaultUser` for API login, overridable via `USER_EMAIL`/`USER_PASSWORD`), and `search/*.ts` row tables. Search specs are data-driven: they loop over rows and generate one test per row titled `[<testId>] <id> ...` with tags.

## Conventions specific to this site

- The site has **no `data-test` attributes**; locators use ids, classes and `name` attributes. Leave a short comment in the locators class saying so.
- Assertions belong in page-object `expect*` methods using web-first assertions; no `waitForTimeout`, no `networkidle` (ESLint errors on the latter).
- `tests/auth/authentication.spec.ts` registers a new user per test via the UI because the shop has no seeded account for that flow.

## Claude tooling in `.claude/` — known staleness

Skills (`page-object-creator`, `playwright-fixtures`, `playwright-cli`) and agents (`playwright-test-planner`, `-generator`, `-healer`) live in `.claude/`. Some of their text predates the current layout — prefer the actual repo over them where they disagree:

- They refer to `pages/`, `fixtures/` and `data/` at the repo root; the real locations are `app/pages/`, `tests/fixtures/` and `tests/search/data/`.
- `page-object-creator` describes Sauce Demo with `getByTestId`/`data-test`; this site has none (see above).
- Agents default to `https://coffee-cart.app`; use the teststore URL.
- Spec headers reference `specs/search.md` and `tests/seed.spec.ts`, which no longer exist.
