---
name: page-object-creator
description: Create or extend Page Objects, Components and Modals for the Test Store (PrestaShop) Playwright project in this repo, using a component-based structure (app/ui/pages, app/ui/modals, app/ui/components) and composition. Use when the user asks for a new page class, page methods or locators, or for a reusable UI block (header, footer, product miniature/card, cart line, search widget, breadcrumb) or a modal/dialog (add-to-cart modal, quick view, wishlist sign-in), or when a page object duplicates locators that belong to a shared block.
---

# Page Object creator (component-based)

The shop UI is built from repeated blocks: every page has the same header and footer, product cards
(`article.product-miniature`) appear on home, category, search and "prices drop" pages, and actions open modals
(add-to-cart, quick view, wishlist sign-in). Model the UI the same way: **pages are composed of components and
modals**, and each block is described exactly once.

Read the references in this skill's folder before writing code and match their style:

| File | Shows |
| --- | --- |
| `references/ExampleComponent.md` | `BaseComponent`, a singleton component (`Header`) and a repeatable one (`ProductMiniature`) |
| `references/ExampleModal.md` | `BaseModal` and `AddToCartModal` (the `#blockcart-modal` dialog) |
| `references/ExamplePage.md` | `BasePage` with header/footer, and a page that composes components and a modal |
| `references/ExamplePageLocators.md` | Locators classes for pages (scoped to `page`) and components (scoped to `root`) |
| `references/component-catalog.md` | Known reusable blocks on this site with **verified root selectors** |

## Folder structure

```text
app/ui/
  components/
    BaseComponent.ts
    index.ts                      # barrel: BaseComponent + every component folder
    Header/
      Header.ts
      HeaderLocators.ts
      index.ts
    Footer/ ...
    ProductMiniature/ ...
  modals/
    BaseModal.ts                  # extends BaseComponent
    index.ts
    AddToCartModal/
      AddToCartModal.ts
      AddToCartModalLocators.ts
      AddToCartModal.types.ts     # optional, only when there are types
      index.ts
  pages/
    BasePage.ts                   # owns header + footer
    index.ts
    ProductPage/
      ProductPage.ts
      ProductPageLocators.ts
      index.ts
```

- One folder per class, named after the class: `<Name>.ts`, `<Name>Locators.ts`, optional `<Name>.types.ts`,
  `index.ts`. Pages end in `Page`, modals end in `Modal`, components have no suffix (`Header`, `ProductMiniature`,
  `CartLine`, `SearchWidget`).
- Each layer has a barrel (`components/index.ts`, `modals/index.ts`, `pages/index.ts`) that re-exports its base class
  and every folder. Export types with `export type`.
- Path aliases in `tsconfig.json` (`compilerOptions.paths`), next to the existing `@pages`:
  `"@components": ["./app/ui/components/index.ts"]`, `"@modals": ["./app/ui/modals/index.ts"]`. Add an alias only when
  the folder exists. `include` already covers `app/**/*.ts`.

> **Current state of the repo (check before relying on the tree above):** only `app/ui/pages/` exists. `BasePage`
> has just `url` + `open()` — no header/footer yet — and `components/`, `modals/`, `@components`, `@modals` do not
> exist. The tree is the target design: create a block (and its base class, barrel and alias) the first time a page
> needs it, and move duplicated locators from existing pages into it only when that is part of the task.

## Dependency rules (prevents import cycles)

```text
pages  ──►  modals  ──►  components
  └───────────────────────►┘
```

- Pages may use modals and components; modals may use components; components may use other components.
  **Never import upward** (a component never imports a modal or page; a modal never imports a page).
- Inside `app/ui`, import another layer through its barrel with a relative path (`../../components`,
  `../../modals`). Inside a folder, import siblings directly (`./HeaderLocators`, `../BaseComponent`) — never your
  own layer's barrel.
- Tests and fixtures may use the aliases (`@pages`, `@modals`, `@components`).

## When to extract a component or modal

Extract when **any** of these is true:

1. The block appears on 2+ pages (header, footer, product miniature, breadcrumb, search widget, newsletter).
2. The block repeats within one page (product cards, cart lines, address cards, order-history rows).
3. It is a dialog with an open/close lifecycle → **modal** (overlay over the page, opened by an action, has a close
   button/Escape). Everything else embedded in the layout is a **component**.

Keep a locator in the page's own Locators class when it exists only on that page and does not repeat (e.g. the
checkout step headers). Do not create speculative components for single-use elements.

If you touch a page that still holds a shared block's locators (e.g. `#blockcart-modal` inside
`ProductPageLocators`, `#search_widget` inside `SearchPageLocators`), move them into the component/modal and keep
the page's public methods working by delegating — existing tests must not change unless the user asked for it.
Mention any remaining duplicates you saw in your reply instead of refactoring unrelated pages.

## Composition rules

- `BaseComponent` holds a `root: Locator`. Every locator of a component is built **from `root`**, never from `page`,
  so the same class works for any instance (the 3rd product card, the header on any page).
- Constructors:
  - **Singleton** components and modals take `Page` and choose their own root: `super(page.locator('#header'))`.
  - **Repeatable** components take the `root: Locator` of one instance: `new ProductMiniature(cardLocator)`.
- `BasePage` creates `header` and `footer` once; every page inherits them (`cartPage.header.expectCartCount(3)`).
- A page exposes the components/modals it contains as **`readonly` public fields** named after the block in
  camelCase (`addToCartModal`, `quickViewModal`, `searchWidget`). Tests reach them through the page:
  `productPage.addToCartModal.proceedToCheckout()`.
- Repeatable components are returned by **page methods**, not stored as fields, because the instance depends on data:
  `productByName(name: string | RegExp): ProductMiniature`, `productAt(index: number): ProductMiniature`. The page
  keeps the list locator (`productMiniatures`) and narrows it with `.filter({ has: ... })` / `.nth()`.
- A page action that opens a modal may return it for fluent use, but the field remains the source of truth:
  `async addToCart(): Promise<AddToCartModal> { ...; await this.addToCartModal.expectOpen(); return this.addToCartModal; }`.
- Components and modals are **not** registered as fixtures — they are reached through their owning page. Only pages
  go into `tests/fixtures/pages.ts`.
- Do not wrap a component method in a pass-through page method just to shorten the call. Add a page method only when
  it combines steps (open page → pick card → add to cart).

## Locators

- The site has **no `data-test` attributes**. Use ids, classes, `name` attributes, and `getByRole`/`getByText`
  where they are stable. Leave the comment `// The site has no data-test attributes, so ids/classes/names are used.`
  at the top of each Locators class.
- Locators classes contain only `readonly` `Locator` fields assigned in the constructor. Page locators take
  `page: Page`; component and modal locators take `root: Locator`.
- Name fields after element + kind: `cartCount`, `signInLink`, `titleLink`, `closeButton`, `productMiniatures`.
- Value-dependent locators are not fields; keep the list and narrow it inside a method.
- Prefer stable PrestaShop hooks (`#blockcart-modal`, `.product-miniature`, `.cart-products-count`) over layout
  classes (`.col-md-6`). Check `references/component-catalog.md` first; verify new roots live.

## Methods

- Name methods for what the user does: `addToCart`, `openQuickView`, `continueShopping`, `signOut`.
- Assertions start with `expect`, return `Promise<void>`, and use web-first assertions (`toBeVisible`, `toHaveText`,
  `toContainText`, `toHaveCount`, `toHaveURL`). Never return booleans from `isVisible()` for tests to assert.
- Modal open/closed is asserted with `toBeVisible()` / `toBeHidden()` on the root. Do not assert Bootstrap state
  classes: the quick view uses `in`, other modals use `show`.
- Product names differ by case between pages (cards are title-cased, modal/cart are sentence-cased): compare with
  `{ ignoreCase: true }` or `/.../i` (see `teststore-business-context` → known-issues).
- Getters return what the UI shows: prices stay strings (`'$28.72'`); counts and totals that tests compare are
  returned as numbers.
- No `waitForTimeout`, no `networkidle` (ESLint errors).
- Don't hardcode test data (users, product names) in page objects; tests pass it in from `tests/e2e/search/data/`.

## Workflow

1. Read `teststore-business-context` for the area (routes, rules, quirks).
2. Inspect the live page with `playwright-cli` (named session, e.g. `-s=po`, `close` it at the end). Its browser
   does not use `playwright.config.ts`, so pass the full URL. Identify the blocks on the page and check which
   already exist in `app/ui/components/` and `app/ui/modals/`.
3. Create missing components/modals first (bottom-up): base class if missing → Locators → class → folder `index.ts`
   → layer barrel → tsconfig alias.
4. Create or update the page: Locators for page-only elements, `readonly` fields for composed blocks, methods.
   Update `app/ui/pages/index.ts`.
5. Register every **new page** in `tests/fixtures/pages.ts` (import, `PageFixtures` member, fixture) — follow the
   `playwright-fixtures` skill. Components and modals are not registered.
6. Run `npx tsc --noEmit` and `npx eslint app`. If a test uses the code, run
   `PLAYWRIGHT_HTML_OPEN=never npx playwright test <file> --project=chromium` and report the result; otherwise say the
   locators are unchecked against the live site.
7. Don't edit tests, unrelated pages or config unless the user asked. In your reply, list the components/modals you
   created or reused, and any duplicates you noticed but left alone.
