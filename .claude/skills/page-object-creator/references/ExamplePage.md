# Example — pages composed of components and modals

## `app/ui/pages/BasePage.ts`

Header and footer are on every page, so `BasePage` creates them once.

```typescript
import type { Page } from '@playwright/test';
import { Footer, Header } from '../../components';

export abstract class BasePage {
  abstract url: string;

  readonly header: Header;
  readonly footer: Footer;

  constructor(protected readonly page: Page) {
    this.header = new Header(page);
    this.footer = new Footer(page);
  }

  async open(): Promise<void> {
    await this.page.goto(this.url);
  }
}
```

## `app/ui/pages/ProductPage/ProductPage.ts`

Product details page: composes the add-to-cart modal (singleton → field). Page-only elements stay in
`ProductPageLocators`.

```typescript
import { expect, type Page } from '@playwright/test';
import { AddToCartModal } from '../../modals';
import { BasePage } from '../BasePage';
import { ProductPageLocators } from './ProductPageLocators';

export class ProductPage extends BasePage {
  url = '/index.php?controller=product';

  readonly addToCartModal: AddToCartModal;

  private readonly locators: ProductPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new ProductPageLocators(page);
    this.addToCartModal = new AddToCartModal(page);
  }

  async openById(id: number): Promise<void> {
    await this.page.goto(`/index.php?id_product=${id}&controller=product`);
  }

  async selectSize(size: string): Promise<void> {
    await this.locators.sizeSelect.selectOption({ label: size });
  }

  async addToCart(): Promise<AddToCartModal> {
    await this.locators.addToCartButton.click();
    await this.addToCartModal.expectOpen();
    return this.addToCartModal;
  }

  async expectTitle(name: string): Promise<void> {
    await expect(this.locators.title).toHaveText(name, { ignoreCase: true });
  }
}
```

## `app/ui/pages/CategoryPage/CategoryPage.ts`

Listing page: repeatable components are returned by methods, built from a list locator.

```typescript
import { expect, type Page } from '@playwright/test';
import { ProductMiniature } from '../../components';
import { BasePage } from '../BasePage';
import { CategoryPageLocators } from './CategoryPageLocators';

export class CategoryPage extends BasePage {
  url = '/index.php?id_category=2&controller=category';

  private readonly locators: CategoryPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new CategoryPageLocators(page);
  }

  productAt(index: number): ProductMiniature {
    return new ProductMiniature(this.locators.productMiniatures.nth(index));
  }

  /** Cards title-case names — pass a case-insensitive RegExp or the exact card text. */
  productByName(name: string | RegExp): ProductMiniature {
    const title = typeof name === 'string' ? new RegExp(name, 'i') : name;
    return new ProductMiniature(
      this.locators.productMiniatures.filter({
        has: this.page.locator('.product-title', { hasText: title }),
      }),
    );
  }

  async expectProductsCount(count: number): Promise<void> {
    await expect(this.locators.productMiniatures).toHaveCount(count);
  }
}
```

## Usage in a test

```typescript
// tests/e2e/cart/add-sweater.spec.ts
import { test } from '../../fixtures';

test('[E2E-NNNN] adds a sweater from the product page', { tag: ['@e2e', '@cart'] }, async ({ productPage, cartPage }) => {
  await productPage.openById(2);
  await productPage.selectSize('S');

  const modal = await productPage.addToCart();
  await modal.expectProduct({ name: 'Hummingbird printed sweater', price: '$28.72', attributes: { Size: 'S' } });
  await modal.expectShipping('$7.00');
  await modal.proceedToCheckout();

  await cartPage.expectContainsProduct('Hummingbird printed sweater');
});
```

- Header/footer are reached through any page: `await cartPage.header.expectCartCount(3)`.
- The modal can also be reached by field: `await productPage.addToCartModal.continueShopping()`.

## Barrels

`app/ui/pages/ProductPage/index.ts`

```typescript
export { ProductPage } from './ProductPage';
```

`app/ui/pages/index.ts`

```typescript
export { BasePage } from './BasePage';
export { ProductPage } from './ProductPage';
export { CategoryPage } from './CategoryPage';
```

Register every new page in `tests/fixtures/pages.ts` (see the `playwright-fixtures` skill). Components and modals
are not fixtures.
