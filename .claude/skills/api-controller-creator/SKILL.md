---
name: api-controller-creator
description: Create or extend an API Controller for the teststore Playwright project in this repo. Use when the user asks for a new controller class, new API methods (login, cart, address, order, account requests), or wants to replace slow UI setup with HTTP calls under app/api/.
---

# API Controller creator

Create API controllers that follow the conventions already used in `app/api/`. Read the reference example
(`references/ExampleController.md` in this skill's folder) and the existing `app/api/UserController.ts` before
writing a new controller, and match their style.

## What a controller is here

The shop is PrestaShop. It has **no JSON/REST API and no auth tokens**: every "API call" replays the HTTP request the
browser sends (form POSTs and `index.php?controller=...` GETs). Session state lives in the `PrestaShop-<hash>`
cookie that the server sets on the `APIRequestContext`. Controllers therefore wrap an `APIRequestContext`, send
those browser-equivalent requests, and check the status code the browser would get.

## File layout

Put every controller in a single file named after the class, directly in `app/api/`:

```text
app/api/
  index.ts
  UserController.ts
  CartController.ts
  CartController.types.ts   # optional controller-specific interfaces and types
```

- `<Name>Controller.ts` holds the endpoints (paths and form payloads) and the request methods.
- Keep controller-specific interfaces and types (request payloads, parsed responses) in
  `<Name>Controller.types.ts` next to it when needed; do not create empty type files.
- `app/api/index.ts` re-exports every controller and its public types.
- There is no locators split: a controller has no selectors, so a folder per controller adds nothing.
  If a controller grows big helpers of its own, move it to `app/api/<Name>Controller/` with an `index.ts` barrel,
  mirroring the page-object layout.

## Barrel imports and TypeScript paths

- Consumers import from the barrel: `import { UserController } from '@api'`. Export types with `export type`.
- Inside `app/api/`, import sibling files directly (`./UserController`, `./CartController.types`), never through
  `@api`, to avoid circular imports through the barrel.
- The `@api` alias already exists in `tsconfig.json` (`"@api": ["./app/api/index.ts"]`). Preserve existing options and
  paths; add an alias only for a new module you actually create.

## Controller class

```ts
import { APIRequestContext, expect } from '@playwright/test';

// Why this endpoint looks the way it does (form POST, source of the payload, success status).
export class CartController {
  constructor(private readonly request: APIRequestContext) {}
}
```

- Take the `APIRequestContext` in the constructor as `private readonly request`. Never create or dispose contexts
  inside a controller — the fixture owns the context's lifetime.
- Use path-only URLs (`/index.php?controller=cart`); the base URL comes from `playwright.config.ts` or the
  `baseURL` passed to `playwright.request.newContext`.
- Keep endpoints and fixed form fields (`submitLogin: '1'`, `token`, `action`) inside the controller, so tests only
  pass business data.
- Leave a short comment at the top explaining where the request shape came from (the HAR file or a captured network
  request) and what status means success. This site has no documented API, so the comment is the documentation.
- Import only what is used.

## Methods

- Name methods for the business action: `loginAsUser`, `addProductToCart`, `addAddress`, `logout`.
- Use `form: {...}` for PrestaShop form POSTs (it sends `application/x-www-form-urlencoded` like the browser).
  Use `params` for query strings instead of string concatenation when values are dynamic.
- Check success inside the method with `expect(response.status(), '<what failed> for <key input>').toBe(<code>)`.
  PrestaShop often answers **200 on failure** (it re-renders the form) and **302 on success**; send
  `maxRedirects: 0` and assert the exact code, as `UserController.loginAsUser` does. Never treat `response.ok()` as
  success without checking what the failure case returns.
- Action methods return `Promise<void>`. Methods that read data return a typed value (`Promise<CartSummary>`) parsed
  from the response (`await response.json()` for ajax endpoints, or the specific field you need). Do not return the
  raw `APIResponse` to tests.
- Requests that need a CSRF-style `token` (cart, address forms) obtain it inside the controller (from a prior GET
  of the page that renders it) rather than asking the test for it.
- No `waitForTimeout`, no retries in loops; one request per action.

## Data

- Users come from `tests/e2e/search/data/users.ts` (`defaultUser`, `createUniqueUser()`), exported through `@data`.
  Pass them into controller methods from fixtures or tests. Do not hardcode credentials, emails or product ids in
  controllers.

## Using controllers: fixtures, not `new` in tests

- Tests never do `new XController(request)`. Controllers are used from fixtures (see the `playwright-fixtures`
  skill, `.claude/skills/playwright-fixtures/SKILL.md`).
- Setup that a test should not see (logging in, filling the cart) goes in a `void` or value fixture, like
  `authCookies`/`login` in `tests/fixtures/auth.ts`, which builds `UserController` on a standalone context.
- If tests need to call a controller directly, expose it as a fixture named after the class with a lowercase first
  letter (`CartController` → `cartController`) in `tests/fixtures/api.ts`, built on the test's `request` fixture
  (or on `context.request` when the browser page must share the same session cookies), and add that file to the
  `mergeTests(...)` call in `tests/fixtures/index.ts`.

## Reference example

Read the reference template before writing a controller:

- `references/ExampleController.md` contains a controller, its optional types file, the barrel and a fixture that
  uses it.

Copy its structure into `app/api/<Name>Controller.ts`, rename the class for the new controller, and expose it through
`app/api/index.ts`.

## Workflow

1. Find the exact request the browser sends. First search `teststore.automationtesting.co.uk.har` at the repo root
   (method, URL, form fields, response status). If the flow is not there, perform it on the live site with
   `playwright-cli` (see `.claude/skills/playwright-cli/SKILL.md`) and read the network request. Note both the success
   and the failure status.
2. Create `app/api/<Name>Controller.ts` (and `<Name>Controller.types.ts` if needed). Update `app/api/index.ts`.
3. Wire it into a fixture when a test or another fixture uses it (`tests/fixtures/auth.ts` for login-type setup,
   `tests/fixtures/api.ts` for direct controller access), following the `playwright-fixtures` skill.
4. Run `npx tsc --noEmit` and `npx eslint app/api tests/fixtures`. If a test uses the controller, run
   `PLAYWRIGHT_HTML_OPEN=never npx playwright test --project=chromium <spec>` and report the result faithfully. If no
   test uses it yet, say that the controller is unchecked against the live site.
5. Updating the barrel and wiring fixtures are part of creating a controller. Do not edit tests, unrelated
   configuration, or other controllers unless the user asked for it.
