# Example — components

Selectors verified live on 2026-11-18.

## `app/ui/components/BaseComponent.ts`

```typescript
import { expect, type Locator, type Page } from '@playwright/test';

export abstract class BaseComponent {
  constructor(protected readonly root: Locator) {}

  protected get page(): Page {
    return this.root.page();
  }

  async expectVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async expectHidden(): Promise<void> {
    await expect(this.root).toBeHidden();
  }
}
```

## Singleton component — `app/ui/components/Header/`

`HeaderLocators.ts`

```typescript
import type { Locator } from '@playwright/test';

// The site has no data-test attributes, so ids/classes/names are used.
export class HeaderLocators {
  readonly signInLink: Locator;
  readonly signOutLink: Locator;
  readonly customerName: Locator;
  readonly cartLink: Locator;
  readonly cartCount: Locator;

  constructor(root: Locator) {
    const userInfo = root.locator('#_desktop_user_info .user-info');
    this.signInLink = userInfo.getByRole('link', { name: /sign in/i });
    // Sign-out/name links are only rendered when logged in (verify classes live before relying on them).
    this.signOutLink = userInfo.getByRole('link', { name: /sign out/i });
    this.customerName = userInfo.locator('a.account');
    // The cart block has no link while the cart is empty (.blockcart.inactive).
    this.cartLink = root.locator('#_desktop_cart .blockcart a');
    this.cartCount = root.locator(
      '#_desktop_cart .blockcart .cart-products-count',
    );
  }
}
```

`Header.ts`

```typescript
import { expect, type Page } from '@playwright/test';
import { BaseComponent } from '../BaseComponent';
import { HeaderLocators } from './HeaderLocators';

export class Header extends BaseComponent {
  private readonly locators: HeaderLocators;

  constructor(page: Page) {
    super(page.locator('#header'));
    this.locators = new HeaderLocators(this.root);
  }

  async openCart(): Promise<void> {
    await this.locators.cartLink.click();
  }

  async signOut(): Promise<void> {
    await this.locators.signOutLink.click();
  }

  /** "Cart (N)" — N is the total quantity, not the number of lines. */
  async expectCartCount(count: number): Promise<void> {
    await expect(this.locators.cartCount).toHaveText(`(${count})`);
  }

  async expectSignedInAs(fullName: string): Promise<void> {
    await expect(this.locators.signOutLink).toBeVisible();
    await expect(this.locators.customerName).toContainText(fullName);
  }
}
```

`index.ts`

```typescript
export { Header } from './Header';
```

## Repeatable component — `app/ui/components/ProductMiniature/`

The product card `article.product-miniature` (attribute `data-id-product`) is shown on home, category, search and
"prices drop" pages. The page owns the list; one class instance = one card.

`ProductMiniatureLocators.ts`

```typescript
import type { Locator } from '@playwright/test';

// The site has no data-test attributes, so ids/classes/names are used.
export class ProductMiniatureLocators {
  readonly thumbnailLink: Locator;
  readonly titleLink: Locator;
  readonly price: Locator;
  readonly regularPrice: Locator;
  readonly flags: Locator;
  readonly quickViewLink: Locator;
  readonly wishlistButton: Locator;

  constructor(root: Locator) {
    this.thumbnailLink = root.locator('a.product-thumbnail');
    this.titleLink = root.locator('.product-title a');
    this.price = root.locator('.product-price-and-shipping .price');
    this.regularPrice = root.locator(
      '.product-price-and-shipping .regular-price',
    );
    this.flags = root.locator('.product-flags .product-flag');
    this.quickViewLink = root.locator('a.quick-view');
    this.wishlistButton = root.locator('button.wishlist-button-add');
  }
}
```

`ProductMiniature.ts`

```typescript
import { expect, type Locator } from '@playwright/test';
import { BaseComponent } from '../BaseComponent';
import { ProductMiniatureLocators } from './ProductMiniatureLocators';

export class ProductMiniature extends BaseComponent {
  /** Selector of one card — pages use it to build their list locator. */
  static readonly selector = 'article.product-miniature';

  private readonly locators: ProductMiniatureLocators;

  constructor(root: Locator) {
    super(root);
    this.locators = new ProductMiniatureLocators(root);
  }

  async open(): Promise<void> {
    await this.locators.titleLink.click();
  }

  /** Quick view is shown on hover only. */
  async openQuickView(): Promise<void> {
    await this.root.hover();
    await this.locators.quickViewLink.click();
  }

  async addToWishlist(): Promise<void> {
    await this.locators.wishlistButton.click();
  }

  async getPrice(): Promise<string> {
    return (await this.locators.price.innerText()).trim();
  }

  /** Cards title-case names ("Hummingbird Printed T-Shirt"), so compare case-insensitively. */
  async expectTitle(name: string): Promise<void> {
    await expect(this.locators.titleLink).toHaveText(name, {
      ignoreCase: true,
    });
  }

  async expectPrice(price: string): Promise<void> {
    await expect(this.locators.price).toHaveText(price);
  }

  async expectDiscounted(oldPrice: string): Promise<void> {
    await expect(this.locators.regularPrice).toHaveText(oldPrice);
  }

  async expectFlag(flag: string | RegExp): Promise<void> {
    await expect(this.locators.flags.filter({ hasText: flag })).toBeVisible();
  }
}
```

## `app/ui/components/index.ts`

```typescript
export { BaseComponent } from './BaseComponent';
export { Header } from './Header';
export { Footer } from './Footer';
export { ProductMiniature } from './ProductMiniature';
```
