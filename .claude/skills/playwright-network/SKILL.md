---
name: playwright-network
description: Rules for page.waitForResponse / page.waitForRequest in this repo's Playwright tests. Use when generating or fixing a test that must confirm a background (ajax) request finished, check its status or JSON body (add to cart, cart update, voucher, search autocomplete), check what the browser sent, or capture the id of an entity the UI created so a fixture can delete it in teardown (cleanup).
---

# Network waits: waitForResponse / waitForRequest

Docs: [page.waitForResponse](https://playwright.dev/docs/api/class-page#page-wait-for-response),
[page.waitForRequest](https://playwright.dev/docs/api/class-page#page-wait-for-request). Check them when unsure.

## When to use which

| Need | Use |
|---|---|
| Request finished + status / JSON body | `page.waitForResponse(predicate)` |
| What the browser **sent** (payload, query, headers) | `page.waitForRequest(predicate)` → `request.postData()` / `postDataJSON()` |
| Both | `waitForResponse`, then `response.request()` gives you the request |
| Only "the UI updated" | No network wait. Use a web-first assertion on the UI |

## Rules

1. **Start waiting before the action.** Create the promise, do the action, then await the promise. Never
   `await page.waitForResponse(...)` after a click, because the response may already be gone.
   ```ts
   const responsePromise = this.page.waitForResponse(isCartUpdate);
   await this.locators.addToCartButton.click();
   const response = await responsePromise;
   ```
2. **Make the predicate narrow:** check the URL part and the method, `r.url().includes('controller=cart') &&
   r.request().method() === 'POST'`. Glob strings (`'**/index.php?controller=cart'`) break on PrestaShop query
   strings, so use a function. **Do not filter by status in the predicate.** A 500 would then end in a timeout
   instead of a clear failure. Assert the status after the wait.
3. **Assert in this order:** status (`expect(response.status()).toBe(200)` or `response.ok()`), then the body with
   `toMatchObject` (only the fields you care about), then the UI with web-first assertions. A finished request does
   not prove the UI rendered it.
4. **Big or slow requests:** pass `{ timeout: 30_000 }` to the wait. Never use `waitForTimeout` or `networkidle`
   (ESLint errors on `networkidle`).
5. **Keep it in the page object.** The action method that triggers the request owns the wait. It checks the status
   and returns the typed body. Data checks go in an `expect*` method of the page object. Tests never call
   `page.waitForResponse` themselves.
6. Use **one wait per expected request**. If one click fires several requests (add to cart → `controller=cart` +
   `ps_shoppingcart` ajax), wait for the one whose data you need.
7. Do not mock with `page.route` unless the test asks for it. This repo tests the live site.

## Example: confirm the request and its data

The reference implementation is `ProductPage.addToCart()` in `app/ui/pages/ProductPage/ProductPage.ts`. Add to cart
sends `POST /index.php?controller=cart` (form `token=...&id_product=1&group[1]=1&qty=1&add=1&action=update`) and
gets back JSON `{ success, hasError, id_product, id_product_attribute, quantity, cart: { products, totals,
products_count, ... }, errors }`. Shapes checked on the live site on 2026-11-18.

```ts
// app/ui/pages/ProductPage/ProductPage.ts (shortened)
// The add-to-cart ajax call: POST /index.php?controller=cart with add=1 in the form body.
const isAddToCart = (r: Response) =>
  r.url().includes('controller=cart') &&
  r.request().method() === 'POST' &&
  new URLSearchParams(r.request().postData() ?? '').get('add') === '1';

async addToCart(): Promise<void> {
  // The theme binds the ajax handler on window load; clicking earlier submits the form natively.
  await this.page.waitForLoadState('load');
  const responsePromise = this.page.waitForResponse(isAddToCart);
  await this.locators.addToCartButton.click();
  const response = await responsePromise;

  expect(response.status(), 'add-to-cart request failed').toBe(200);
  const body = await response.json();
  expect(body.success, 'server confirmed adding the product').toBe(true);

  const sent = new URLSearchParams(response.request().postData() ?? '');
  expect(Number(body.id_product), 'response matches the requested product').toBe(Number(sent.get('id_product')));
}

async expectAddedToCartModal(): Promise<void> {
  await expect(this.locators.cartModal).toBeVisible(); // UI check after the data check
}
```

If a test needs the response data, return a typed value from the action (`Promise<AddedCartLine>`) and export the
type from the page folder's `index.ts` so it is available through `@pages`.

## Cleanup: capture the created id, delete it in teardown

**Cart lines are already cleaned up.** `tests/fixtures/cleanup.ts` is an auto fixture (`cartCleanup: void`) that
calls `CartController.cleanupCart()` after every test: it reads the real cart from the server and deletes every line,
so a test does not need to register what it added. Do not write another cart cleanup.

For other things the UI creates (address, wishlist, account data) use this pattern:

1. The page-object action reads the new id from the response (or from the request) and returns it.
2. The test passes that id to a **cleanup fixture**. The fixture deletes everything after `use()`, even when the
   test failed.
3. Teardown calls the API through **`context.request`** (or `page.request`). It shares cookies with the browser
   context, so it acts as the same guest or logged-in user. A separate `playwright.request.newContext()` has a
   different session. Put the delete call in an `app/api/` controller (skill `api-controller-creator`).

```ts
// tests/fixtures/addressCleanup.ts  (append it to mergeTests in tests/fixtures/index.ts)
import { test as base } from '@playwright/test';
import { AddressController } from '@api';

type AddressCleanupFixtures = { addressCleanup: (addressId: number) => void };

export const test = base.extend<AddressCleanupFixtures>({
  addressCleanup: async ({ context }, use) => {
    const ids: number[] = [];
    await use((id) => ids.push(id));
    const addresses = new AddressController(context.request);
    for (const id of ids.reverse()) {
      await addresses.deleteAddress(id); // asserts the delete inside the controller
    }
  },
});
```

```ts
// tests/e2e/account/add-address.spec.ts
import { test } from '../../fixtures';
import { defaultUser } from '@data';

test.use({ userToLogin: defaultUser });

test('[E2E-NNNN] user adds an address', { tag: ['@e2e', '@account'] }, async ({ addressPage, addressCleanup }) => {
  await addressPage.open();
  const addressId = await addressPage.addAddress({ alias: 'Home' /* ... */ });
  addressCleanup(addressId); // register right after creation, before any assertion that can fail
  await addressPage.expectAddressSaved('Home');
});
```

(`AddressPage`, `AddressController` and `deleteAddress` do not exist yet — create them with the `page-object-creator`
and `api-controller-creator` skills.)

Rules for cleanup:

- Register the id **right after** it is captured, before any assertion that can fail.
- Teardown deletes in reverse order (LIFO) and asserts every delete. A cleanup that fails silently leaves dirty
  data behind.
- If a delete endpoint returns 200 even on failure (PrestaShop often does), check the body or re-read the state
  (as `CartController.deleteProduct` does: the line must be gone from the returned cart).
- If the site has no delete endpoint for an entity, say so in a comment. Do not leave a fake cleanup.
