---
name: teststore-business-context
description: Business and domain context for the Test Store web shop (https://teststore.automationtesting.co.uk, PrestaShop demo) that this repo tests. Use BEFORE planning, generating, reviewing or healing any test, test plan, test data, page object or API controller for this site — whenever the user asks to "write/generate/add a test", "cover a scenario", "create a test plan", or asks how the shop behaves (catalog, prices, variants, cart, vouchers, checkout, shipping, payment, account, registration, login, wishlist, contact, newsletter). Gives the product catalog, business rules, validation messages, routes and known site quirks, and points to the skills that do the implementation.
---

# Test Store — business context for test generation

This skill tells you **what the application is and how it behaves**, so the tests you write check real business
rules with real data. It does not tell you how to write code — for that it hands off to other skills (see
[Which skill to use next](#which-skill-to-use-next)).

Facts below were collected with `playwright-cli` on **2026-11-18** and corrected on **2026-11-20** (while
implementing E2E-0601…0607, plan `specs/critical-flows.plan.md`). The site is a public shared demo: data can drift.
When a test depends on an exact value (price, count, message), re-check it live with `playwright-cli` first
(use a named session, e.g. `-s=context`, and `close` it at the end).

## The application in one paragraph

"Test Store" is a small US-dollar B2C web shop built on **PrestaShop 1.7/8 (classic theme)**, created as a practice target
for test automation. It sells **19 products** in 3 top-level categories (Clothes, Accessories, Art): printed t-shirts
and sweaters, framed posters, mugs, cushions, notebooks, downloadable vector graphics, a product pack and a
customizable mug. Customers can browse and filter the catalog, search with autocomplete, add products (with
variants) to a cart, apply the promo code `20OFF`, and check out **as a guest or as a registered customer** through a
4-step one-page checkout (Personal information → Addresses → Shipping → Payment). For a US address there is one carrier
($7.00) and two offline payment methods (bank wire, check); for a France address the Payment step says
"Unfortunately, there is no payment method available." — no real payment is taken. Registered customers have an account area
with addresses, order history, vouchers, wishlists, e-mail alerts and GDPR data export. **Taxes are always $0.00**, so
tax-excl. and tax-incl. totals are equal.

## Domain map (where to look)

| Business area | Entry route (path only, `baseURL` is set) | Page object / fixture | Details |
| --- | --- | --- | --- |
| Home (carousel, Popular, On sale) | `/index.php` | `SearchPage` (`searchPage`) | [catalog.md](references/catalog.md) |
| Category listing, facets, sort | `/index.php?id_category=<id>&controller=category` | `CategoryPage` (`categoryPage`) | [catalog.md](references/catalog.md) |
| Product details, variants, qty | `/index.php?id_product=<id>&controller=product` | `ProductPage` | [catalog.md](references/catalog.md) |
| Search + autocomplete | `/index.php?controller=search&s=<q>` | `SearchPage` + data in `tests/e2e/search/data/search/` | [catalog.md](references/catalog.md#search) |
| Cart, add-to-cart modal, vouchers | `/index.php?controller=cart&action=show` | `CartPage` (`cartPage`) | [flows.md](references/flows.md#cart) |
| Checkout (guest / registered) | `/index.php?controller=order` | `CheckoutPage` (`checkoutPage`) | [flows.md](references/flows.md#checkout) |
| Login / logout / password reset | `/index.php?controller=authentication` | `LoginPage` (`loginPage`), `test.use({ userToLogin })` | [flows.md](references/flows.md#authentication) |
| Registration | `/index.php?controller=registration` | `RegistrationPage` (`registrationPage`) | [flows.md](references/flows.md#registration) |
| My account area | `/index.php?controller=my-account` | `MyAccountPage` (`myAccountPage`) | [flows.md](references/flows.md#my-account) |
| Contact, newsletter, wishlist, CMS, guest tracking | see flows.md | — (no page object yet) | [flows.md](references/flows.md#other-features) |

Check `app/ui/pages/` and `tests/fixtures/pages.ts` for the current list — a page object may have been added since.

## Business rules you will test most often

- **Prices** are shown in USD with 2 decimals (`$19.12`). Discounted products show the old price, the new price and a
  `-20%` / `Save 20%` badge. Only products 1 and 2 are discounted (20 % specific price) — they make up "Prices drop".
- **Taxes are $0.00** everywhere; `Total (tax excl.)` = `Total (tax incl.)`.
- **Shipping**: for a US address (New York) a single carrier, "My carrier — Delivery next day!", flat **$7.00**,
  pre-selected. On 2026-11-20 the planner also saw a free "Click and collect" carrier once (not reproduced, maybe
  country/session dependent) — select the carrier **by name**, never by count or index. An empty cart shows no
  shipping line.
- **Promo code `20OFF`**: 20 % off product subtotal (shown as `Discount(s) - $X` and a `20OFF -$X` line; rounding:
  20 % of $50.14 = $10.03). Unknown code → `This voucher does not exist.` No vouchers are advertised in the UI.
- **Order total** = subtotal − discount + $7.00 shipping.
- **Variants** change `id_product_attribute` and the URL hash (`#/3-size-l/11-color-black`), not the price.
  Product 1 defaults to S/White.
- **Quantity** on the product page: minimum 1; 0 or non-numeric input snaps back to 1. **In the cart**, quantity `0`
  **removes the line**; letters can't be typed into the `type=number` field (value stays, no request). Stock is effectively unlimited (~1,000,000 per
  product), so out-of-stock scenarios cannot be produced on this site.
- **Customizable mug (id 19)**: `Add to cart` is disabled until the customer types text (max 1024 chars) and clicks
  `Save customization`.
- **Pack (id 15)** "Pack Mug + Framed poster", $35.00, has a `Pack` flag and lists its items on the product page.
- **Guest checkout is allowed**; a password field on step 1 is optional ("Create an account (optional)").
- **Names** accept only letters, dots and spaces — digits give server error `Invalid format.`
- **Postcode** format depends on country: United States and France both require `NNNNN` (5 digits). Fewer than 5
  chars is blocked by the browser (minlength); a 5-char wrong value (e.g. `ABCDE`) gives the server error
  `Invalid postcode - should look like "NNNNN"`. US addresses also require a State — a missing State is blocked by
  native validation (`select:invalid`), there is no server message.
- **Countries available**: France, United States (default United States). Placing an order requires accepting the
  terms of service; `Place order` stays disabled until a payment option and the terms checkbox are selected.
- **Login failure** → `Authentication failed.`; registering an existing e-mail → `The email is already used, please
  choose another one or sign in`. A successful login redirects to the **home page**, and the header shows `Sign out`
  plus the customer's name.
- **Wishlist** needs login; a guest clicking the heart gets a "You need to be logged in to save products in your
  wishlist." modal.

## Known quirks that break naive tests — read before asserting

Full list with reproduction steps: [known-issues.md](references/known-issues.md). The ones that matter most:

1. **First add-to-cart may inject "Hummingbird printed t-shirt" lines** into a new cart (guest and logged-in). The
   number varies: 2 × M/Black on 2026-11-18; 1 or 0 on 2026-11-20, sometimes S/White. Never assert exact item counts,
   line counts or totals after the first add — assert *your* line by name/attributes and compare totals as deltas or
   relationships (line total = unit × qty, discount = 20 % of the read subtotal).
2. **The guest cart sometimes loses the product right after a confirmed add** (~10 % of sessions on 2026-11-20): the
   add response says success, but the modal shows "There is 0 item" or the cart page is empty. It sticks to the
   session — only a new session (cleared cookies) helps. Use `ProductPage.addToCartAndOpenCart(id, name)` /
   `addToCartConfirmed(name, reopen)`: they retry up to 3 times in a new guest session and record a `site-flake`
   annotation in the report.
3. **Random HTTP 500s** on product pages, variant refreshes and cart refreshes. Page objects assert the status of
   each request they wait for, so a 500 fails with the URL in the message — don't hide it with blind retries; CI
   has `retries: 2`.
4. **`20OFF` is sometimes already applied** to a cart (seen for the shared default account and some sessions). Read
   discount lines before asserting totals.
5. **Product names differ by case between pages**: listing cards title-case them (`Hummingbird Printed T-Shirt`),
   product page/cart use sentence case (`Hummingbird printed t-shirt`), the product page `h1` is CSS-uppercased.
   Compare case-insensitively (`/hummingbird printed t-shirt/i`). Long names are truncated with `...` on cards.
6. Product 2 is named "Hummingbird printed sweater" but its URL slug and image alt say `brown-bear-printed-sweater`.
7. "New products" and "Best sellers" pages are empty; footer "Stores" link is a 404; a non-existent product id
   returns a bare HTTP 404.
8. The header "Sign in" link has a malformed URL (`controller=authentication?back=...`) but still opens the login page.
9. Shared state: the default API-login account (`defaultUser`) is used by everyone running this repo. Don't rely on
   its addresses, orders or cart being empty — clean up what you add, or register a fresh user.

## Test data guidance

- Fresh customer: `createUniqueUser()` from `tests/e2e/search/data/users.ts` (letters-only names, e-mail
  `qa.<timestamp>@example.com`, password `Passw0rd!123`). Password rule: 6–72 chars per hint (HTML pattern allows 5+).
- Existing customer: `defaultUser` (override with `USER_EMAIL` / `USER_PASSWORD`), logged in through
  `test.use({ userToLogin: defaultUser })` (API login + cached storage state in `tests/fixtures/auth.ts`, no UI).
- Valid address: `1 Test Street`, city `Testville`, postcode `12345`; for United States add a State (e.g. New York,
  `id_state=35`). The current `CheckoutPage.confirmAddress` picks `id_country` index 1 = **France** (no state needed).
- Stable products for cart/checkout tests: mugs (ids 6–8, $11.90, no variants), notebooks (16–18, $12.90).
  Use id 1 for variant/discount scenarios, id 19 for customization, id 15 for packs. Categories: Clothes 3 (2
  products), Accessories 6 (11 products, several equal prices — sort checks must use `<=`/`>=`), Art 9.
- Address country decides the Payment step: **United States** (state New York) shows bank wire + check; **France**
  (what `CheckoutPage.confirmAddress` picks) shows "no payment method available".
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
