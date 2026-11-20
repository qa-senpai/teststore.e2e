# Example — modals

Selectors verified live on 2026-11-18 (product id 2, size S).

## `app/ui/modals/BaseModal.ts`

A modal is a component with an open/close lifecycle. Assert visibility on the root; never assert Bootstrap state
classes (the quick view uses `in`, other modals use `show`).

```typescript
import { expect, type Locator } from '@playwright/test';
import { BaseComponent } from '../components';

export abstract class BaseModal {
  protected readonly closeButton: Locator;

  constructor(root: Locator) {
    super(root);
    this.closeButton = root.locator('button.close');
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.expectClosed();
  }

  async expectOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.root).toBeHidden();
  }
}
```

## `app/ui/modals/AddToCartModal/`

The dialog shown after `Add to cart`:

```text
#blockcart-modal
  h4#myModalLabel                 "Product successfully added to your shopping cart"
  .product-name                   "Hummingbird printed sweater"
  .product-price                  "$28.72"
  span.size > strong              "Size: S"        (one span per attribute: span.size, span.color, ...)
  .product-quantity > strong      "Quantity: 1"
  p.cart-products-count           "There are 2 items in your cart."
  .subtotal.value                 "$57.44"
  .shipping.value                 "$7.00"
  .product-total .value           "$52.95"         (Total (tax incl.))
  .product-tax .value             "$0.00"
  button.btn-secondary            "Continue shopping"
  a.btn-primary                   "Proceed to checkout"
```

Remember the known quirks: the first add-to-cart injects 2 extra t-shirts, and `20OFF` may already be applied, so
`Total` can be lower than `Subtotal + Shipping` (as in the example above). Assert _your_ product line; avoid exact
counts and totals unless the test controls the cart.

`AddToCartModalLocators.ts`

```typescript
import type { Locator } from '@playwright/test';

// The site has no data-test attributes, so ids/classes/names are used.
export class AddToCartModalLocators {
  readonly title: Locator;
  readonly productName: Locator;
  readonly productPrice: Locator;
  readonly productQuantity: Locator;
  readonly cartProductsCount: Locator;
  readonly subtotal: Locator;
  readonly shipping: Locator;
  readonly totalTaxIncl: Locator;
  readonly taxes: Locator;
  readonly continueShoppingButton: Locator;
  readonly proceedToCheckoutButton: Locator;

  constructor(root: Locator) {
    this.title = root.locator('#myModalLabel');
    this.productName = root.locator('.product-name');
    this.productPrice = root.locator('.product-price');
    this.productQuantity = root.locator('.product-quantity strong');
    this.cartProductsCount = root.locator('.cart-products-count');
    this.subtotal = root.locator('.subtotal.value');
    this.shipping = root.locator('.shipping.value');
    this.totalTaxIncl = root.locator('.product-total .value');
    this.taxes = root.locator('.product-tax .value');
    this.continueShoppingButton = root.getByRole('button', {
      name: /continue shopping/i,
    });
    this.proceedToCheckoutButton = root.getByRole('link', {
      name: /proceed to checkout/i,
    });
  }
}
```

`AddToCartModal.types.ts`

```typescript
export interface AddedProduct {
  name: string;
  price?: string;
  quantity?: number;
  /** e.g. { Size: 'S', Color: 'White' } */
  attributes?: Record<string, string>;
}
```

`AddToCartModal.ts`

```typescript
import { expect, type Page } from '@playwright/test';
import { BaseModal } from '../BaseModal';
import { AddToCartModalLocators } from './AddToCartModalLocators';
import type { AddedProduct } from './AddToCartModal.types';

export class AddToCartModal extends BaseModal {
  private readonly locators: AddToCartModalLocators;

  constructor(page: Page) {
    super(page.locator('#blockcart-modal'));
    this.locators = new AddToCartModalLocators(this.root);
  }

  async continueShopping(): Promise<void> {
    await this.locators.continueShoppingButton.click();
    await this.expectClosed();
  }

  async proceedToCheckout(): Promise<void> {
    await this.locators.proceedToCheckoutButton.click();
  }

  async expectOpen(): Promise<void> {
    await super.expectOpen();
    await expect(this.locators.title).toHaveText(
      'Product successfully added to your shopping cart',
    );
  }

  async expectProduct({
    name,
    price,
    quantity,
    attributes,
  }: AddedProduct): Promise<void> {
    await expect(this.locators.productName).toHaveText(name, {
      ignoreCase: true,
    });
    if (price) await expect(this.locators.productPrice).toHaveText(price);
    if (quantity !== undefined)
      await expect(this.locators.productQuantity).toHaveText(String(quantity));
    for (const [label, value] of Object.entries(attributes ?? {})) {
      const attribute = this.root
        .locator('span', { hasText: `${label}:` })
        .locator('strong');
      await expect(attribute).toHaveText(value);
    }
  }

  async expectShipping(amount: string): Promise<void> {
    await expect(this.locators.shipping).toHaveText(amount);
  }

  async getItemsCount(): Promise<number> {
    const text = await this.locators.cartProductsCount.innerText();
    return Number(text.match(/\d+/)?.[0] ?? 0);
  }
}
```

`index.ts`

```typescript
export { AddToCartModal } from './AddToCartModal';
export type { AddedProduct } from './AddToCartModal.types';
```

## `app/ui/modals/index.ts`

```typescript
export { BaseModal } from './BaseModal';
export { AddToCartModal } from './AddToCartModal';
export type { AddedProduct } from './AddToCartModal';
```
