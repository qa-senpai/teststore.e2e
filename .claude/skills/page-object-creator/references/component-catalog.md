# Component catalog — Test Store

Reusable blocks on https://teststore.automationtesting.co.uk (PrestaShop classic theme). Check this list before
creating a class, reuse the suggested name, and add new blocks here when you discover them.

"Verified" = root selector checked live with `playwright-cli` on 2026-11-18. Anything else: verify before use.

## Components (`app/ui/components/`)

| Class | Root selector | Kind | Where | Contents | Status |
| --- | --- | --- | --- | --- | --- |
| `Header` | `#header` | singleton | every page | `.header-nav` (contact, `#_desktop_user_info .user-info` Sign in/Sign out + name, `#_desktop_cart .blockcart` "Cart (N)"), `.header-top` (logo, `#_desktop_top_menu` / `#top-menu`, `#search_widget`) | verified |
| `SearchWidget` | `#search_widget` | singleton, composed by `Header` | every page | `input[name="s"]` (use `.first()` — the no-results page has a second one), autocomplete `ul.ui-autocomplete li.ui-menu-item` (rendered at `body` level, outside the root) | verified |
| `TopMenu` | `#_desktop_top_menu` | singleton, composed by `Header` | every page | Clothes / Accessories / Art with sub-menus | verified |
| `Footer` | `#footer` | singleton | every page | newsletter, link columns, `#block_myaccount_infos`, `.block-contact` | verified |
| `NewsletterForm` | `#blockEmailSubscription_displayFooterBefore` | singleton, composed by `Footer` | every page | `input[name="email"]`, Subscribe, result message | verified |
| `Breadcrumb` | `nav.breadcrumb` | singleton | all but home | links | verified |
| `ProductMiniature` | `article.product-miniature` (`data-id-product`) | repeatable | home (Popular, On sale), category, search, prices drop | `.product-title a`, `.price`, `.regular-price`, `.product-flags .product-flag`, `a.quick-view` (on hover), `button.wishlist-button-add` | verified |
| `FeaturedProducts` | `section.featured-products` | repeatable (2 on home) | home | heading + `ProductMiniature` list | verified |
| `CartLine` | `.cart-overview li.cart-item` | repeatable | cart page | name `.product-line-info a.label`, qty input, remove link | verified (+ `input.js-cart-line-product-quantity`, `a.remove-from-cart`) |
| `CartSummary` | `.cart-summary` | singleton | cart, checkout | subtotal, shipping, discounts, totals, promo code | root verified, contents: verify |

## Modals (`app/ui/modals/`)

| Class | Root selector | Opened by | Notes | Status |
| --- | --- | --- | --- | --- |
| `AddToCartModal` | `#blockcart-modal` | `Add to cart` on product page / quick view | see `ExampleModal.md` for inner structure | verified |
| `QuickViewModal` | `[id^="quickview-modal-"]` (id is `quickview-modal-<idProduct>-<idAttribute>`) | `Quick view` on a `ProductMiniature` | state class is `in`, not `show`; contains its own Add to cart → `AddToCartModal` | verified |
| `WishlistLoginModal` | `.wishlist-login .wishlist-modal` | heart button as guest | text "You need to be logged in to save products in your wishlist."; Cancel / Sign in. There are 4 `.wishlist-modal` elements in the DOM — always scope by the wrapper or by text | verified (1 match) |
