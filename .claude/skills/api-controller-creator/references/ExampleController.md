# Example

The real, working controller in this repo is `app/api/UserController.ts`:

```typescript
import { APIRequestContext, expect } from '@playwright/test';

// PrestaShop has no JSON auth API: login is the same form POST the browser sends
// (captured in teststore.automationtesting.co.uk.har). On success the server answers
// 302 and sets the `PrestaShop-<hash>` session cookie on the request context.
export class UserController {
  constructor(private readonly request: APIRequestContext) {}

  async loginAsUser(email: string, password: string): Promise<void> {
    const response = await this.request.post('/index.php?controller=authentication', {
      form: { email, password, submitLogin: '1', back: 'my-account' },
      maxRedirects: 0,
    });
    // A failed login re-renders the form with 200, so only a redirect means success.
    expect(response.status(), `API login failed for ${email}`).toBe(302);
  }
}
```

## Controller that reads data (template)

Illustrative shape for a controller with a typed result. Confirm the endpoint, fields and status codes in the HAR
or on the live site before using it — they are not verified here.

`app/api/CartController.types.ts`:

```typescript
export interface CartSummary {
  productsCount: number;
}
```

`app/api/CartController.ts`:

```typescript
import { APIRequestContext, expect } from '@playwright/test';
import type { CartSummary } from './CartController.types';

// Same ajax request the product page sends on "Add to cart" (see the HAR / network tab).
// PrestaShop answers 200 with JSON; `hasError: true` in the body means the add failed.
export class CartController {
  constructor(private readonly request: APIRequestContext) {}

  async addProductToCart(productId: number, quantity = 1): Promise<CartSummary> {
    const response = await this.request.post('/index.php?controller=cart', {
      form: { id_product: String(productId), qty: String(quantity), add: '1', action: 'update', ajax: '1' },
    });
    expect(response.status(), `Add to cart failed for product ${productId}`).toBe(200);
    const body = await response.json();
    expect(body.hasError, `Add to cart returned an error for product ${productId}`).toBeFalsy();
    return { productsCount: body.cart.products_count };
  }
}
```

## Barrel

`app/api/index.ts`:

```typescript
export { UserController } from './UserController';
export { CartController } from './CartController';
export type { CartSummary } from './CartController.types';
```

Consumers use `import { CartController } from '@api'`.

## Fixture that exposes it

`tests/fixtures/api.ts` (shares the browser's cookies through `context.request`, so a product added here shows up in
the page's cart):

```typescript
import { test as base } from '@playwright/test';
import { CartController } from '@api';

type ApiFixtures = {
  cartController: CartController;
};

export const test = base.extend<ApiFixtures>({
  cartController: async ({ context }, use) => {
    await use(new CartController(context.request));
  },
});
```

Then add it to `tests/fixtures/index.ts`:

```typescript
import { test as apiTest } from './api';
export const test = mergeTests(pagesTest, authTest, apiTest);
```
