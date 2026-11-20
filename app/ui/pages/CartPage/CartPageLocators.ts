import { Locator, Page } from '@playwright/test';

// The site has no data-test attributes, so ids/classes/names are used.
export class CartPageLocators {
  readonly cartItems: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly discountAmount: Locator;
  readonly emptyCartMessage: Locator;
  readonly proceedToCheckoutButton: Locator;

  constructor(page: Page) {
    this.cartItems = page.locator('.cart-overview li.cart-item');
    this.itemNames = this.cartItems.locator('.product-line-info a.label');
    this.itemPrices = this.cartItems.locator('.current-price .price');
    this.itemQuantities = this.cartItems.locator(
      'input.js-cart-line-product-quantity',
    );
    this.discountAmount = page.locator('#cart-subtotal-discount .value');
    this.emptyCartMessage = page.locator('.cart-overview .no-items');
    this.proceedToCheckoutButton = page.locator(
      '.cart-detailed-actions a.btn-primary',
    );
  }
}
