---
name: page-object-creator
description: Create or extend a Page Object for the Sauce Demo Playwright project in this repo. Use when the user asks for a new page class, new page methods, or locators for a page under pages/.
---

# Page Object creator

Create page objects that follow the conventions already used in `pages/`. Read the reference example
(`references/ExamplePage.md` and `references/ExamplePageLocators.md` in this skill's folder) before writing a new page, and match its
style.

## File layout

Put every page object in its own folder named after the page class. For example:

```text
pages/
  index.ts
  BasePage.ts
  LoginPage/
    index.ts
    LoginPage.ts
    LoginPageLocators.ts
    LoginPage.types.ts  # optional page-specific interfaces and types
```

- `<Name>Page/<Name>PageLocators.ts` holds the locators only.
- `<Name>Page/<Name>Page.ts` holds the URL and the actions and assertions.
- Keep page-specific interfaces and types in the same folder when needed; do not create empty type files.
- `<Name>Page/index.ts` exports the page class and any public types. `pages/index.ts` re-exports each page folder and `BasePage`.

## Barrel imports and TypeScript paths

- Organize public imports through `index.ts` barrels for page objects and other modules created or changed as part of the task, including `helpers`, `utils`, and `enums`.
- Consumers import from the module barrel, for example `import { LoginPage } from '@pages'`, `import { formatPrice } from '@utils'`, or `import { UserRole } from '@enums'`. Export types with `export type`.
- Within a page folder, import its implementation files directly (`./LoginPageLocators`) to avoid circular imports through its own barrel. A page can import `BasePage` directly from `../BasePage` for the same reason.
- Add or update aliases in `compilerOptions.paths` in the project's actual TypeScript configuration (`tsconfig.json` in this repository, not `tsconfig.ts`). Preserve existing options and paths. Set `baseUrl` to `"."` if needed, and map aliases to the relevant barrels, for example:

  ```json
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@pages": ["pages/index.ts"],
        "@helpers": ["helpers/index.ts"],
        "@utils": ["utils/index.ts"],
        "@enums": ["enums/index.ts"]
      }
    }
  }
  ```

- Add aliases only for modules that exist or are created in the task, using their actual project paths. Ensure the TypeScript `include` covers the new files and that the project's runner supports the aliases.

Both extend or use the shared base: `pages/BasePage.ts` provides `page`, `url` and `open()`.

- Declare every locator as a `readonly` field with the `Locator` type, then assign it in the constructor.
- Use `getByTestId`. The project sets `testIdAttribute: 'data-test'` in `playwright.config.js`, so
  `getByTestId('checkout')` matches `data-test="checkout"`. Do not use `getByRole`, `getByPlaceholder` or CSS
  selectors unless an element has no `data-test` attribute (then say so in your reply).
- Name locators after the element and its kind: `usernameInput`, `loginButton`, `taxLabel`, `cartItems`.
- Locators that depend on a value (a product title) are not fields. Keep a list locator as the field and narrow it
  inside the method.

## Page class

```ts
import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { CartPageLocators } from './CartPageLocators';

export class CartPage extends BasePage {
  url = '/cart.html';

  private readonly locators: CartPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new CartPageLocators(page);
  }
}
```

- Set `url` to the path only (the base URL comes from `playwright.config.js`).
- Keep one `private readonly locators` field and use `this.locators.<name>` in methods.
- Import only what is used.

## Methods

- Name methods for what the user does: `addToCartByTitle`, `fillFirstName`, `checkout`, `continueShopping`.
- Assertion methods start with `expect`, return `Promise<void>`, and use web-first assertions that retry:
  `await expect(locator).toBeVisible()`, `toHaveCount(0)`, `toHaveURL(/regex/)`. Do not return booleans from
  `isVisible()` and assert on them in tests.
- Getter methods return the value as the page shows it. Prices stay strings (`'$29.99'`); sums and totals that tests
  compare are returned as numbers.
- Per-product actions find the row first, then the element inside it:
  `this.locators.cartItems.filter({ hasText: title }).getByTestId(/^remove-/).click()`.
  Button ids contain the product name (`add-to-cart-sauce-labs-backpack`), so match them with a regex.
- Never use `waitForTimeout` or `networkidle`.

## Data

- Users come from `data/users.ts` (`USERS.standard`), products from `data/products.ts` (`PRODUCTS.backpack`).
  Pass these into page methods from the tests. Do not hardcode credentials or product names in page objects.

## Reference example

Read both reference templates before writing a page:

- `references/ExamplePageLocators.md` contains the locators class.
- `references/ExamplePage.md` contains the page class that uses it.

Copy their structure into `pages/<Name>Page/` and rename the classes and files for the new page.
Use `../BasePage` and `./<Name>PageLocators` inside the page implementation, then expose the page through the barrels.

## Workflow

1. Look at the live page to confirm the `data-test` attributes. Use `playwright-cli` (see
   `.claude/skills/playwright-cli/SKILL.md`). Its browser session does not read `playwright.config.js`, so inspect
   attributes with `[data-test="..."]` selectors there instead of
   `getByTestId`.
2. Create `pages/<Name>Page/` with the locators class, page class, optional page-specific types, and `index.ts`. Update `pages/index.ts` and the relevant TypeScript path aliases.
3. If the page is used in a test, run `PLAYWRIGHT_HTML_OPEN=never npx playwright test` and report the result. If a
   page has no test yet, say that its locators are unchecked against the live site.
4. Register the new page in `fixtures/pages.ts` (import from the page barrel, `PageFixtures` type member, fixture entry) following the
   `playwright-fixtures` skill (`.claude/skills/playwright-fixtures/SKILL.md`). This is mandatory for every new page.
5. Registering the fixture, updating the relevant barrels, and configuring TypeScript paths/include are part of creating a page. Do not edit tests, unrelated configuration, or other page implementations unless the user asked for it.
