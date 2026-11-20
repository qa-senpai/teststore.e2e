# Example — Locators classes

Two kinds, same shape: only `readonly` `Locator` fields assigned in the constructor.

## Page locators — scoped to `page`

Only elements that belong to this page and do not repeat. Shared blocks (header, product cards, modals) live in
their components.

```typescript
import type { Locator, Page } from '@playwright/test';
import { ProductMiniature } from '../../components';

// The site has no data-test attributes, so ids/classes/names are used.
export class CategoryPageLocators {
  readonly heading: Locator;
  readonly sortDropdown: Locator;
  readonly productsCounter: Locator;
  readonly productMiniatures: Locator;

  constructor(page: Page) {
    this.heading = page.locator('#js-product-list-header');
    this.sortDropdown = page.locator('.products-sort-order');
    this.productsCounter = page.locator('#js-product-list-top .total-products p');
    // List of cards; one card = one ProductMiniature instance (built in the page method).
    this.productMiniatures = page.locator(`#js-product-list ${ProductMiniature.selector}`);
  }
}
```

```typescript
import type { Locator, Page } from '@playwright/test';

// The site has no data-test attributes, so ids/classes/names are used.
export class ProductPageLocators {
  readonly title: Locator;
  readonly sizeSelect: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    this.title = page.locator('h1[itemprop="name"]');
    this.sizeSelect = page.locator('select[name="group[1]"]');
    this.quantityInput = page.locator('#quantity_wanted');
    this.addToCartButton = page.locator('.product-add-to-cart button.add-to-cart');
  }
}
```

## Component / modal locators — scoped to `root`

Never use `page` here: everything is relative to the component's root so the class works for any instance.

```typescript
import type { Locator } from '@playwright/test';

// The site has no data-test attributes, so ids/classes/names are used.
export class CartLineLocators {
  readonly name: Locator;
  readonly unitPrice: Locator;
  readonly quantityInput: Locator;
  readonly removeLink: Locator;

  constructor(root: Locator) {
    this.name = root.locator('.product-line-info a.label');
    this.unitPrice = root.locator('.product-line-info .price');
    this.quantityInput = root.locator('input.js-cart-line-product-quantity');
    this.removeLink = root.locator('a.remove-from-cart');
  }
}
```
