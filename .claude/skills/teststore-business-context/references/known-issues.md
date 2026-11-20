# Known issues and quirks of the live site

The shop is a shared public demo; some behaviour looks like bugs (possibly planted on purpose for practice).
A test must either **avoid depending on** these, or **target them explicitly** (e.g. a bug-documenting test marked
`test.fail()` with a comment). Each item lists how it was observed (2026-11-18, items 1 and 10–12 updated
2026-11-20) so it can be re-checked.

## 1. First add-to-cart injects t-shirts

- **What:** when a cart is created (first `Add to cart` of a session), the cart also gets
  **2 × "Hummingbird printed t-shirt", Size M, Color Black** ($19.12 each, line $38.24).
- **Seen for:** guests in fresh isolated browser contexts (3 times, with mug 6, mug 7 and notebook 16) and for the
  logged-in default account. Later adds in the same cart do not inject again. The injected line can be deleted.
- **Reproduce:** `playwright-cli -s=check open https://teststore.automationtesting.co.uk/index.php?id_product=6&controller=product`
  → click `.add-to-cart` → modal says "There are 3 items in your cart." and Subtotal $50.14 (= 11.90 + 38.24).
- **Update 2026-11-20:** the count varies — mug 6 got 1 injected t-shirt ($31.02 subtotal), product 1 got none, and
  the injected variant was sometimes S/White instead of M/Black.
- **Impact on tests:** don't assert `Cart (1)`, "There is 1 item", line counts or exact totals right after the
  first add. Assert the product you added is present (`cartPage.expectContainsProduct(name)`), or delete the
  injected line before checking totals, or compute expected totals from the lines on the page.

## 2. Promo `20OFF` sometimes pre-applied

- **What:** some carts already contain the `20OFF` cart rule (20 % off) without the customer entering it. Seen for
  the default API-login account and in one guest session; not in other fresh guest sessions.
- **Impact:** read the `Discount(s)` line before asserting totals; in voucher tests remove any existing voucher
  first, or use a fresh guest context and assert the "before" state too.

## 3. Product name casing differs per page

- Listing cards: title case, truncated (`The Best Is Yet To Come'...`, `Hummingbird Printed T-Shirt`).
- Product page `h1`: sentence case in the DOM, displayed uppercase via CSS (`innerText` returns UPPERCASE, `textContent`
  returns sentence case). Cart, modal, autocomplete: sentence case (`Hummingbird printed t-shirt`).
- **Impact:** compare names case-insensitively (`new RegExp(name, 'i')`) and never compare a truncated card title with
  a full name.

## 4. Sweater naming mismatch

Product 2 is "Hummingbird printed sweater", but its URL slug is `brown-bear-printed-sweater` and its image alt is
"Brown bear printed sweater". Assert on the visible name, not on the slug or alt.

## 5. Empty or broken pages

- "New products" (`controller=new-products`) and "Best sellers" (`controller=best-sales`) show "No products available
  yet", although the "New product" facet counts 19 products.
- Footer "Stores" (`controller=stores`) → 404 page ("The page you are looking for was not found.").
- Unknown product id (`id_product=999`) → bare HTTP 404 with no shop layout; unknown category → 404 content inside
  the layout.

## 6. Malformed header "Sign in" link

The header link is `index.php?controller=authentication?back=https%3A%2F%2F...` (two `?`). It still opens the login
page. Don't assert the `back` redirect from this link; the footer "Sign in" points to `controller=my-account`.

## 7. Validation is split between browser and server

Required fields, e-mail format, postcode length and password length are HTML5-only (native tooltips, no DOM
message). Name format, postcode format, duplicate e-mail and voucher errors come from the server and appear in the
page (`.help-block`, `.alert-danger`, `.js-error`). For HTML5 cases assert `validationMessage` / `:invalid`, or that
the step did not advance.

## 8. Password length hint vs. pattern

Hint says 6–72 characters, the input pattern accepts 5+. A 5-character password's server-side outcome was not
verified — check live before writing a boundary test.

## 9. Shared default account

`defaultUser` (`testsenp@gm.com`) is shared by everyone running this repo and CI. On 2026-11-18 it had no addresses
and no orders, but tests may add them at any time. Don't assert its order count or cart
contents; clean up the cart in tests that fill it, or register a fresh user when state must be known.

## 10. Guest cart loses the product after a confirmed add

- **What:** the add-to-cart response says success, but the modal shows "There is 0 item" or the cart page is empty.
  Cart counts in add responses also grew across parallel contexts (3, then 5), which suggests carts may be shared
  between sessions from one IP (not confirmed).
- **Rate:** ~10 % of sessions run one at a time on 2026-11-20 (3 of 30); 25–33 % of parallel cart runs failed before
  the workaround.
- **Sticky:** retrying in the same session doesn't help; clearing cookies (new guest session) does.
- **Workaround:** `ProductPage.addToCartAndOpenCart` / `addToCartConfirmed` retry up to 3 times in a new guest
  session and add a `site-flake` annotation, so the bug stays visible in the report.

## 11. Random HTTP 500s

- **What:** on 2026-11-20 product pages, variant refreshes (`controller=product` with `group[...]`) and cart refreshes
  (`controller=cart&action=refresh`) sometimes returned 500. The same requests with `curl` returned 200, so no single
  bad variant causes it.
- **Impact:** wait for the request and assert its status in the page object (`ProductPage.openById`,
  `changeVariant`, `CartPage.changeLine`) so the failure names the URL instead of timing out on the UI. Rely on CI
  `retries: 2`; don't add blind retries.

## 12. Payment methods depend on the address country

- United States address → "Pay by bank wire" and "Pay by Check".
- France address (`CheckoutPage.confirmAddress`) → "Unfortunately, there is no payment method available."
- Shipping for US / New York lists only "My carrier" ($7.00). A free "Click and collect" was seen once by the planner
  and not reproduced — select carriers by name.
