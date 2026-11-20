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
  readonly summaryItemCount: Locator;
  readonly subtotalValue: Locator;
  readonly shippingLine: Locator;
  readonly shippingValue: Locator;
  readonly totalValue: Locator;
  readonly taxesValue: Locator;
  readonly discountLine: Locator;
  readonly voucherLines: Locator;
  readonly voucherRemoveLinks: Locator;
  readonly promoLink: Locator;
  readonly promoInput: Locator;
  readonly promoAddButton: Locator;
  readonly promoError: Locator;
  readonly continueShoppingLink: Locator;
  readonly headerCartCount: Locator;

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
    this.summaryItemCount = page.locator(
      '#cart-subtotal-products .js-subtotal',
    );
    this.subtotalValue = page.locator('#cart-subtotal-products .value');
    this.shippingLine = page.locator('#cart-subtotal-shipping');
    this.shippingValue = this.shippingLine.locator('.value').first();
    this.totalValue = page.locator('.cart-summary-line.cart-total .value');
    this.taxesValue = page
      .locator('.cart-summary-totals .cart-summary-line')
      .filter({ hasText: 'Taxes:' })
      .locator('.value');
    this.discountLine = page.locator('#cart-subtotal-discount');
    this.voucherLines = page.locator('.cart-voucher .promo-name li');
    this.voucherRemoveLinks = page.locator(
      '.cart-voucher a[data-link-action="remove-voucher"]',
    );
    this.promoLink = page.locator('.promo-code-button.display-promo a');
    this.promoInput = page.locator('.promo-code input.promo-input');
    this.promoAddButton = page.locator(
      '.promo-code form button[type="submit"]',
    );
    this.promoError = page.locator('.promo-code .js-error-text');
    this.continueShoppingLink = page
      .locator('.cart-grid-body')
      .getByRole('link', { name: /Continue shopping/ });
    this.headerCartCount = page.locator('.blockcart .cart-products-count');
  }
}
