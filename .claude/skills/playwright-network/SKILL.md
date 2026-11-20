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

Add to cart sends `POST /index.php?controller=cart` and gets back JSON
`{ success, id_product, id_product_attribute, id_customization, quantity, cart: { products, totals, products_count, ... }, errors }`.
The request body is a form: `token=...&id_product=1&group[1]=1&qty=1&add=1&action=update`. Shapes checked on the
live site on 2026-11-18.

```ts
// app/ui/pages/ProductPage/ProductPage.ts
export interface CartUpdateResponse {
  success: boolean;
  id_product: number;
  id_product_attribute: number;
  quantity: number;
  cart: { products_count: number };
}
export interface AddedCartLine extends CartUpdateResponse {
  token: string; // PrestaShop static token from the request. Needed to delete the line later.
}

const isCartUpdate = (r: Response) =>
  r.url().includes('controller=cart') && r.request().method() === 'POST';

async addToCart(): Promise<AddedCartLine> {
  const responsePromise = this.page.waitForResponse(isCartUpdate);
  await this.locators.addToCartButton.click();
  const response = await responsePromise;

  expect(response.status(), 'add-to-cart request failed').toBe(200);
  const body = (await response.json()) as CartUpdateResponse;
  const token = new URLSearchParams(response.request().postData() ?? '').get('token') ?? '';
  return { ...body, token };
}

async expectCartUpdated(line: CartUpdateResponse, expected: Partial<CartUpdateResponse>): Promise<void> {
  expect(line).toMatchObject({ success: true, ...expected });
  await expect(this.locators.addedToCartModal).toBeVisible(); // UI check after the data check
}
```

## Cleanup: capture the created id, delete it in teardown

Use this pattern when the UI creates something (cart line, address, wishlist) that must not stay behind:

1. The page-object action reads the new id from the response (or from the request, for example the token) and
   returns it (see `addToCart` above).
2. The test passes that id to a **cleanup fixture**. The fixture deletes everything after `use()`, even when the
   test failed.
3. Teardown calls the API through **`page.request`**. It shares cookies with the browser context, so it acts as the
   same guest or logged-in user. A separate `playwright.request.newContext()` would have a different session and an
   empty cart. If the delete call is reused, put it in an `app/api/` controller (skill `api-controller-creator`).

```ts
// tests/fixtures/cleanup.ts  (add it to mergeTests in tests/fixtures/index.ts)
import { test as base, expect } from '@playwright/test';
import type { AddedCartLine } from '@pages';

type CleanupFixtures = { cartCleanup: (line: AddedCartLine) => void };

export const test = base.extend<CleanupFixtures>({
  cartCleanup: async ({ page }, use) => {
    const lines: AddedCartLine[] = [];
    await use((line) => lines.push(line));
    for (const line of lines.reverse()) {
      const res = await page.request.post('/index.php?controller=cart', {
        form: {
          delete: '1', action: 'update', ajax: '1', token: line.token,
          id_product: String(line.id_product),
          id_product_attribute: String(line.id_product_attribute),
        },
      });
      expect(res.ok(), `cleanup: delete product ${line.id_product}`).toBeTruthy();
    }
  },
});
```

```ts
// test
test('[E2E-0301] add product to cart @e2e @cart', async ({ productPage, cartCleanup }) => {
  await productPage.open();
  const line = await productPage.addToCart();
  cartCleanup(line); // register right after creation, before any assertion that can fail
  await productPage.expectCartUpdated(line, { id_product: 1, quantity: 1 });
});
```

Rules for cleanup:

- Register the id **right after** it is captured, before any assertion that can fail.
- Teardown deletes in reverse order (LIFO) and asserts every delete. A cleanup that fails silently leaves dirty
  data behind.
- If a delete endpoint returns 200 even on failure (PrestaShop often does), check the body as well. For a cart
  delete, `quantity` is `0`.
- If the site has no delete endpoint for an entity, say so in a comment. Do not leave a fake cleanup.
