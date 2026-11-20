# User flows: cart, checkout, authentication, account, other features

Observed 2026-11-18 with `playwright-cli`. Messages are quoted exactly as the site shows them.
Field names are the HTML `name` attributes (the site has no `data-test` attributes).

## Cart

### Add to cart (product page or quick view)

- `Add to cart` sends `POST /index.php?controller=cart` then refreshes the header via
  `POST /index.php?fc=module&module=ps_shoppingcart&controller=ajax`.
- Modal `#blockcart-modal`: title "Product successfully added to your shopping cart", product name, unit price,
  chosen variant lines (`Size: L`, `Color: Black`), `Quantity: 3`, "There are N items in your cart." (or
  "There is 1 item in your cart."), `Subtotal`, `Shipping: $7.00`, `Total`, `Total (tax incl.)`, `Taxes: $0.00`,
  buttons `Continue shopping` and `Proceed to checkout`.
- Header counter: `Cart (N)` — N is the total quantity, not the number of lines.
- Adding the same product+variant again increases the line's quantity; a different variant is a separate line.
- **Quirk:** the very first add to a new cart also adds 2 × Hummingbird printed t-shirt (M, Black). See
  [known-issues.md](known-issues.md#1-first-add-to-cart-injects-2-t-shirts).

### Cart page `/index.php?controller=cart&action=show`

- Heading "Shopping Cart". Each line (`.cart-item`): product link, regular price + `-20%` + current price for sale
  items, variant lines, quantity spinbutton ("<name> product quantity field", up/down buttons), line total, `delete`
  link (`.remove-from-cart`).
- Summary: `<N> items $<subtotal>`, `Discount(s) - $<x>` (only when a voucher is applied), `Shipping $7.00`,
  `Total (tax excl.)`, `Total (tax incl.)`, `Taxes: $0.00`, applied voucher lines (`20OFF -$<x>` with a remove
  icon), link `Have a promo code?`, button `Proceed to checkout`. "Continue shopping" link goes back.
- Empty cart: "There are no more items in your cart", `0 items $0.00`, totals $0.00, no shipping line.
- Changing quantity or deleting a line updates totals via ajax (no page reload) — wait with web-first assertions
  on the totals, not timeouts.

### Vouchers (cart rules)

- `Have a promo code?` reveals input `discount_name` + `Add` button.
- `20OFF` = 20 % off the products subtotal. Examples: subtotal $50.14 → `- $10.03`, total $47.11;
  subtotal $95.60 → `- $19.12`, total $83.48.
- Unknown code → `This voucher does not exist.`
- No vouchers are listed as "available" in the cart, and the account "Vouchers" page says "You do not have any
  vouchers.".

## Checkout

Route `/index.php?controller=order`. One page with 4 accordion steps; the active one has class `-current`
(`#checkout-personal-information-step`, `#checkout-addresses-step`, `#checkout-delivery-step`,
`#checkout-payment-step`). The right column repeats the cart summary (`show details`, subtotal, shipping, totals,
promo code).

### Step 1 — Personal information (guests only; skipped as done for a logged-in customer)

Tabs `Order as a guest` (default) | `Sign in`. Guest form `#customer-form`:

| Field | name | Required | Notes |
| --- | --- | --- | --- |
| Social title | `id_gender` (1 = Mr., 2 = Mrs.) | no | radios |
| First name | `firstname` | yes | "Only letters and the dot (.) character, followed by a space, are allowed." |
| Last name | `lastname` | yes | same rule |
| Email | `email` | yes | type=email |
| Password | `password` | no | "Create an account (optional) And save time on your next order!" |
| Birthdate | `birthday` | no | `MM/DD/YYYY`, e.g. 05/31/1970 |
| Receive offers from our partners | `optin` | no | checkbox |
| I agree to the terms and conditions and the privacy policy | `psgdpr` | **yes** | checkbox |
| Sign up for our newsletter | `newsletter` | no | checkbox |

Button `Continue` (`name="continue"`). Empty submit is blocked by native HTML5 validation (browser tooltips such as
"Please fill in this field.", "Please tick this box if you want to proceed."). A name with digits passes the browser
but the server returns `Invalid format.` and stays on step 1.

### Step 2 — Addresses

Form `.js-address-form`:

| Field | name | Required | Notes |
| --- | --- | --- | --- |
| First name / Last name | `firstname`, `lastname` | yes | prefilled from step 1 |
| Company | `company` | no | |
| Address | `address1` | yes | |
| Address Complement | `address2` | no | |
| City | `city` | yes | |
| State | `id_state` | yes for United States | US states + AA/AE/AP, DC, Puerto Rico, US Virgin Islands (e.g. New York = 35); hidden for France |
| Zip/Postal Code | `postcode` | yes | `NNNNN`; < 5 chars blocked by HTML5 ("Please lengthen this text to 5 characters or more"), wrong format → `Invalid postcode - should look like "NNNNN"` |
| Country | `id_country` | yes | `21` United States (default), `8` France |
| Phone | `phone` | no | |
| Use this address for invoice too | `use_same_address` | — | checked by default |

Button `Continue` (`name="confirm-addresses"`). A logged-in customer with saved addresses sees address cards instead
of the form (the existing `CheckoutPage.confirmAddress` handles both).

### Step 3 — Shipping method

One carrier: radio `delivery_option[...]` "My carrier — Delivery next day! — $7.00". Optional comment textarea
`delivery_message` ("If you would like to add a comment about your order, please write it in the field below.").
Button `Continue` (`name="confirmDeliveryOption"`).

### Step 4 — Payment

- Radios `payment-option`: `#payment-option-1` "Pay by bank wire" (module `ps_wirepayment`),
  `#payment-option-2` "Pay by Check" (module `ps_checkpayment`).
- Checkbox `conditions_to_approve[terms-and-conditions]` "I agree to the terms of service and will adhere to them
  unconditionally." (links to the terms CMS page).
- `Place order` (`#payment-confirmation button`) is **disabled** until a payment option and the terms are selected.
- Success → `/index.php?controller=order-confirmation...`, `#content-hook_order_confirmation` with
  "Your order is confirmed" (asserted by `CheckoutPage.expectOrderConfirmed`).
- Every placed order is a real order on the shared demo — place one only when the scenario needs it.

## Authentication

### Login `/index.php?controller=authentication`

- Fields `email` (`#field-email`), `password` (`#field-password`, `SHOW` toggle), button `#submit-login` "Sign in",
  links "Forgot your password?" (`controller=password`) and "No account? Create one here" (`controller=registration`).
- Wrong credentials → `Authentication failed.` (HTTP 200, stays on the page).
- Success → redirect to the **home page** `/index.php` (HTTP 302 on the form POST — the API login relies on this);
  header `.user-info` shows `Sign out` and the customer's first + last name (link to my-account).
- Logout: `Sign out` → `/index.php?mylogout=`; header shows `Sign in` again.
- Fast login in tests: `test.use({ userToLogin: defaultUser })` — `tests/fixtures/auth.ts` logs in over HTTP and
  reuses the saved storage state (`.auth/<email>.json`) while the cookies stay valid.

### Forgot password `/index.php?controller=password`

"Forgot your password?" — "Please enter the email address you used to register. You will receive a temporary link to
reset your password." Field `email`, button `Send reset link`, link `Back to login`. No mailbox is available, so
only the confirmation message can be tested.

### Guest order tracking `/index.php?controller=guest-tracking`

"Guest Order Tracking" — fields Order Reference ("For example: QIIXJXNUI or QIIXJXNUI#1") and Email, button `Send`.

## Registration

Route `/index.php?controller=registration`, heading "Create an account". Same `#customer-form` fields as checkout
step 1, but **password is required**.

- Password hint: "Enter a password between 6 and 72 characters" and "The minimum score must be: Very weak"
  (strength meter). The HTML `pattern` is `.{5,}`, so 1–4 chars are blocked by the browser
  ("Please match the format requested.").
- Existing e-mail → `The email is already used, please choose another one or sign in`.
- Names with digits → `Invalid format.`
- Success logs the new customer in. `tests/e2e/auth/authentication.spec.ts` covers registration with
  `createUniqueUser()`.

## My account

`/index.php?controller=my-account` (requires login — standard PrestaShop redirect to the login page for guests, not re-checked). Heading "Your account". Tiles:

| Tile | Route | Empty state for a new account |
| --- | --- | --- |
| Information | `controller=identity` | form with Social title, names, Email, Password (current, required to save), New password (optional), Birthdate, opt-ins, `Save` |
| Add first address / Addresses | `controller=address` / `controller=addresses` | "No addresses are available. Add a new address" + `Create new address` |
| Order history and details | `controller=history` | "You have not placed any orders." |
| Credit slips | `controller=order-slip` | "You have not received any credit slips." |
| Vouchers | `controller=discount` | "You do not have any vouchers." |
| My wishlists | `fc=module&module=blockwishlist&controller=lists` | default list + `Create new list` |
| GDPR - Personal data | `fc=module&module=psgdpr&controller=gdpr` | `Get my data to CSV`, `Get my data to PDF` |
| My alerts | `fc=module&module=ps_emailalerts&controller=account` | "No mail alerts yet." |

Plus a `Sign out` link. The tile text changes to "Addresses" once the customer has one.

## Other features

- **Wishlist**: heart button (`favorite_border`) on cards and the product page. Guest → modal "Sign in — You need to
  be logged in to save products in your wishlist." with `Cancel` / `Sign in`. Logged in → choose/create a list.
- **Contact us** `/index.php?controller=contact`: Subject select `id_contact` (`2` Customer service, `1` Webmaster),
  Email `from`, Message `message`, hidden honeypot `url`, submit `submitMessage` ("Send").
  Valid e-mail + empty message → `The message cannot be blank.` Left column: "Store information — Test Store,
  United States, Email us: test@test.com". A successful send e-mails the shop — avoid in routine runs.
- **Newsletter** (footer, every page): "Get our latest news and special sales", input `email` (type=email,
  placeholder "Your email address"), `Subscribe`. Invalid e-mail blocked by HTML5. Subscribing a real address
  changes shared data — use unique `@example.com` addresses.
- **CMS pages** `/index.php?id_cms=<id>&controller=cms`: 1 Delivery, 2 Legal Notice, 3 Terms and conditions of use,
  4 About us, 5 Secure payment. Plus `controller=sitemap` (lists offers, brands, categories, account and pages).
- **Brands**: Graphic Corner (9 products), Studio Design (9 products).
- No language or currency switcher (English, USD only).
