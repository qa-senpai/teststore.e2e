# Example

## Action controller — `app/api/UserController.ts` (real, working)

```typescript
import { APIRequestContext, expect } from '@playwright/test';

// PrestaShop has no JSON auth API: login is the same form POST the browser sends
// (captured from the browser's network log). On success the server answers
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

## Controller that reads data — `app/api/CartController.ts` (real, shortened)

The full file also has `deleteProduct`, `cleanupCart` and `expectEmpty`. Extend it for new cart actions instead of
creating another cart controller.

```typescript
import { APIRequestContext, expect } from '@playwright/test';

export interface CartProduct {
  id_product: string | number;
  id_product_attribute: string | number;
  id_customization: string | number | null;
  remove_from_cart_url: string;
}

interface CartUpdateResponse {
  success: boolean;
  cart: { products: CartProduct[] };
}

// Same ajax call the cart page makes. Pass a context that shares cookies with the browser
// (context.request / page.request): the cart belongs to the session.
export class CartController {
  constructor(private readonly request: APIRequestContext) {}

  async getProducts(): Promise<CartProduct[]> {
    const response = await this.request.get('/index.php', {
      params: { controller: 'cart', ajax: '1', action: 'update' },
      failOnStatusCode: true,
    });
    const body = (await response.json()) as CartUpdateResponse;
    expect(body.success, 'read current cart').toBe(true);
    return body.cart.products;
  }
}
```

## New controller with a types file (template — not verified)

Illustrative shape for a new controller whose types are big enough for their own file. Confirm the endpoint, fields
and status codes on the live site with `playwright-cli requests` / `request <n>` before using it.

`app/api/AddressController.types.ts`:

```typescript
export interface AddressInput {
  alias: string;
  firstname: string;
  lastname: string;
  address1: string;
  city: string;
  postcode: string;
  id_country: number;
  id_state?: number;
}
```

`app/api/AddressController.ts`:

```typescript
import { APIRequestContext, expect } from '@playwright/test';
import type { AddressInput } from './AddressController.types';

// Same form POST the "Add a new address" page sends (captured from the browser's network log).
// The form needs the static `token` rendered on the page; success redirects with 302, a validation
// error re-renders the form with 200.
export class AddressController {
  constructor(private readonly request: APIRequestContext) {}

  async addAddress(address: AddressInput): Promise<void> {
    const token = await this.getFormToken();
    const response = await this.request.post('/index.php?controller=address', {
      form: { ...this.toForm(address), token, submitAddress: '1' },
      maxRedirects: 0,
    });
    expect(response.status(), `Add address failed for ${address.alias}`).toBe(302);
  }

  private async getFormToken(): Promise<string> {
    const html = await (await this.request.get('/index.php?controller=address')).text();
    const token = html.match(/name="token" value="([a-f0-9]+)"/)?.[1];
    expect(token, 'address form token').toBeTruthy();
    return token!;
  }

  private toForm(address: AddressInput): Record<string, string> {
    return Object.fromEntries(Object.entries(address).map(([k, v]) => [k, String(v)]));
  }
}
```

## Barrel

`app/api/index.ts`:

```typescript
export { UserController } from './UserController';
export { CartController } from './CartController';
export { AddressController } from './AddressController';
export type { AddressInput } from './AddressController.types';
```

Consumers use `import { AddressController } from '@api'`.

## Fixture that exposes it

`tests/fixtures/api.ts` (built on `context.request`, so the address is added to the same logged-in session the browser
uses):

```typescript
import { test as base } from '@playwright/test';
import { AddressController } from '@api';

type ApiFixtures = {
  addressController: AddressController;
};

export const test = base.extend<ApiFixtures>({
  addressController: async ({ context }, use) => {
    await use(new AddressController(context.request));
  },
});
```

Then append it to the existing call in `tests/fixtures/index.ts`:

```typescript
import { test as apiTest } from './api';
export const test = mergeTests(pagesTest, authTest, consoleTest, cartTest, apiTest);
```
