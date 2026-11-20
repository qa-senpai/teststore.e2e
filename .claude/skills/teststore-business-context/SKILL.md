---
name: teststore-business-context
description: Business and domain context for the Test Store web shop (https://teststore.automationtesting.co.uk, PrestaShop demo) that this repo tests. Use BEFORE planning, generating, reviewing or healing any test, test plan, test data, page object or API controller for this site — whenever the user asks to "write/generate/add a test", "cover a scenario", "create a test plan", or asks how the shop behaves (catalog, prices, variants, cart, vouchers, checkout, shipping, payment, account, registration, login, wishlist, contact, newsletter). Gives the product catalog, business rules, validation messages, routes and known site quirks, and points to the skills that do the implementation.
---

# Test Store — business context for test generation

This skill tells you **what the application is and how it behaves**, so the tests you write check real business
rules with real data. It does not tell you how to write code — for that it hands off to other skills (see
[Which skill to use next](#which-skill-to-use-next)).

Facts below were collected with `playwright-cli` on **2026-11-18**. The site is a public shared demo: data can drift.
When a test depends on an exact value (price, count, message), re-check it live with `playwright-cli` first
(use a named session, e.g. `-s=context`, and `close` it at the end).

## The application in one paragraph

"Test Store" is a small US-dollar B2C web shop built on **PrestaShop 1.7/8 (classic theme)**, created as a practice target
for test automation. It sells **19 products** in 3 top-level categories (Clothes, Accessories, Art): printed t-shirts
and sweaters, framed posters, mugs, cushions, notebooks, downloadable vector graphics, a product pack and a
customizable mug. Customers can browse and filter the catalog, search with autocomplete, add products (with
variants) to a cart, apply the promo code `20OFF`, and check out **as a guest or as a registered customer** through a
4-step one-page checkout (Personal information → Addresses → Shipping → Payment). There is one carrier ($7.00) and two
offline payment methods (bank wire, check) — no real payment is taken. Registered customers have an account area
with addresses, order history, vouchers, wishlists, e-mail alerts and GDPR data export. **Taxes are always $0.00**, so
tax-excl. and tax-incl. totals are equal.

## Domain map (where to look)

| Business area | Entry route (path only, `baseURL` is set) | Page object / fixture | Details |
| --- | --- | --- | --- |
| Home (carousel, Popular, On sale) | `/index.php` | `SearchPage` (`searchPage`) | [catalog.md](references/catalog.md) |
| Category listing, facets, sort | `/index.php?id_category=<id>&controller=category` | `ProductPage` (`productPage`) | [catalog.md](references/catalog.md) |
| Product details, variants, qty | `/index.php?id_product=<id>&controller=product` | `ProductPage` | [catalog.md](references/catalog.md) |
| Search + autocomplete | `/index.php?controller=search&s=<q>` | `SearchPage` + data in `tests/e2e/search/data/search/` | [catalog.md](references/catalog.md#search) |
| Cart, add-to-cart modal, vouchers | `/index.php?controller=cart&action=show` | `CartPage` (`cartPage`) | [flows.md](references/flows.md#cart) |
| Checkout (guest / registered) | `/index.php?controller=order` | `CheckoutPage` (`checkoutPage`) | [flows.md](references/flows.md#checkout) |
| Login / logout / password reset | `/index.php?controller=authentication` | `LoginPage` (`loginPage`), `login` fixture | [flows.md](references/flows.md#authentication) |
| Registration | `/index.php?controller=registration` | `RegistrationPage` (`registrationPage`) | [flows.md](references/flows.md#registration) |
| My account area | `/index.php?controller=my-account` | `MyAccountPage` (`myAccountPage`) | [flows.md](references/flows.md#my-account) |
| Contact, newsletter, wishlist, CMS, guest tracking | see flows.md | — (no page object yet) | [flows.md](references/flows.md#other-features) |

Check `app/ui/pages/` and `tests/fixtures/pages.ts` for the current list — a page object may have been added since.

## Business rules you will test most often

- **Prices** are shown in USD with 2 decimals (`$19.12`). Discounted products show the old price, the new price and a
  `-20%` / `Save 20%` badge. Only products 1 and 2 are discounted (20 % specific price) — they make up "Prices drop".
- **Taxes are $0.00** everywhere; `Total (tax excl.)` = `Total (tax incl.)`.
- **Shipping**: a single carrier, "My carrier — Delivery next day!", flat **$7.00** per order. An empty cart shows no
  shipping line.
- **Promo code `20OFF`**: 20 % off product subtotal (shown as `Discount(s) - $X` and a `20OFF -$X` line; rounding:
  20 % of $50.14 = $10.03). Unknown code → `This voucher does not exist.` No vouchers are advertised in the UI.
- **Order total** = subtotal − discount + $7.00 shipping.
- **Variants** change `id_product_attribute` and the URL hash (`#/3-size-l/11-color-black`), not the price.
- **Quantity** minimum is 1; 0 or non-numeric input snaps back to 1. Stock is effectively unlimited (~1,000,000 per
  product), so out-of-stock scenarios cannot be produced on this site.
- **Customizable mug (id 19)**: `Add to cart` is disabled until the customer types text (max 1024 chars) and clicks
  `Save customization`.
- **Pack (id 15)** "Pack Mug + Framed poster", $35.00, has a `Pack` flag and lists its items on the product page.
- **Guest checkout is allowed**; a password field on step 1 is optional ("Create an account (optional)").
- **Names** accept only letters, dots and spaces — digits give server error `Invalid format.`
- **Postcode** format depends on country: United States and France both require `NNNNN` (5 digits). Wrong format →
  `Invalid postcode - should look like "NNNNN"`. US addresses also require a State.
- **Countries available**: France, United States (default United States). Placing an order requires accepting the
  terms of service; `Place order` stays disabled until a payment option and the terms checkbox are selected.
- **Login failure** → `Authentication failed.`; registering an existing e-mail → `The email is already used, please
  choose another one or sign in`. A successful login redirects to the **home page**, and the header shows `Sign out`
  plus the customer's name.
- **Wishlist** needs login; a guest clicking the heart gets a "You need to be logged in to save products in your
  wishlist." modal.

## Known quirks that break naive tests — read before asserting

Full list with reproduction steps: [known-issues.md](references/known-issues.md). The ones that matter most:

1. **First add-to-cart injects 2 × "Hummingbird printed t-shirt (Size M, Color Black)"** into a new cart (guest and
   logged-in). After adding 1 mug the modal says "There are 3 items in your cart". Assert that *your* product is in
   the cart (`expectContainsProduct`), not exact item counts or totals — or remove the injected line first.
2. **`20OFF` is sometimes already applied** to a cart (seen for the shared default account and some sessions). Read
   discount lines before asserting totals.
3. **Product names differ by case between pages**: listing cards title-case them (`Hummingbird Printed T-Shirt`),
   product page/cart use sentence case (`Hummingbird printed t-shirt`), the product page `h1` is CSS-uppercased.
   Compare case-insensitively (`/hummingbird printed t-shirt/i`). Long names are truncated with `...` on cards.
4. Product 2 is named "Hummingbird printed sweater" but its URL slug and image alt say `brown-bear-printed-sweater`.
5. "New products" and "Best sellers" pages are empty; footer "Stores" link is a 404; a non-existent product id
   returns a bare HTTP 404.
6. The header "Sign in" link has a malformed URL (`controller=authentication?back=...`) but still opens the login page.
7. Shared state: the default API-login account (`defaultUser`) is used by everyone running this repo. Don't rely on
   its addresses, orders or cart being empty — clean up what you add, or register a fresh user.

## Test data guidance

- Fresh customer: `createUniqueUser()` from `tests/e2e/search/data/users.ts` (letters-only names, e-mail
  `qa.<timestamp>@example.com`, password `Passw0rd!123`). Password rule: 6–72 chars per hint (HTML pattern allows 5+).
- Existing customer: `defaultUser` (override with `USER_EMAIL` / `USER_PASSWORD`), logged in through the `login`
  fixture (API, no UI).
- Valid address: `1 Test Street`, city `Testville`, postcode `12345`; for United States add a State (e.g. New York,
  `id_state=35`). The current `CheckoutPage.confirmAddress` picks `id_country` index 1 = **France** (no state needed).
- Stable products for cart/checkout tests: mugs (ids 6–8, $11.90, no variants), notebooks (16–18, $12.90).
  Use id 1 for variant/discount scenarios, id 19 for customization, id 15 for packs.
- Placing an order creates a real order on the public demo. Do it only in tests that need the order confirmation
  (`/index.php?controller=order-confirmation...`, title "Your order is confirmed").

## Which skill to use next

This skill is context only. Once you know *what* to test, hand off:

| You need to… | Use |
| --- | --- |
| Explore or verify live behaviour, record steps, get locators | `playwright-cli` skill (named session, close it after) |
| Create or extend a page object / locators | `page-object-creator` skill — remember: **no `data-test` attributes** on this site; use ids, classes, `name` attributes |
| Register a new page object, add setup/teardown or test data fixtures | `playwright-fixtures` skill (every page object goes into `tests/fixtures/pages.ts`) |
| Replace slow UI setup (login, cart, address) with HTTP calls | `api-controller-creator` skill (PrestaShop form POSTs, 302 = success) |
| Write a test plan / generate tests from a plan / fix a failing test | `playwright-test-planner` / `playwright-test-generator` / `playwright-test-healer` agents |

Repo conventions (also in `AGENTS.md`): tests import `test`/`expect` from `tests/fixtures`, never `new XPage(page)`,
assertions live in page-object `expect*` methods, no `waitForTimeout`, no `networkidle`, titles carry
`[E2E-xxxx]` ids and tags such as `@e2e @checkout`.

## How to use this skill when generating a test

1. Identify the business area from the user's request and open the matching reference file.
2. Pick test data from the catalog/flows reference (real ids, prices, messages) — don't invent product names.
3. Check [known-issues.md](references/known-issues.md) for the area and design assertions that survive the quirks.
4. If the test needs a value you can't find here, or the reference may be stale, verify it with `playwright-cli`.
5. Hand off to the implementation skills above. If you discover new behaviour or a reference is wrong, update the
   reference file in this skill (keep the date of observation).
