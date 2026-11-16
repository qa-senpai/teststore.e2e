import { Locator, Page } from "@playwright/test";

// The site has no data-test attributes, so ids/classes/names are used.
export class CartPageLocators {
  readonly cartItems: Locator;
  readonly itemNames: Locator;
  readonly proceedToCheckoutButton: Locator;

  constructor(page: Page) {
    this.cartItems = page.locator(".cart-overview li.cart-item");
    this.itemNames = this.cartItems.locator(".product-line-info a.label");
    this.proceedToCheckoutButton = page.locator(
      ".cart-detailed-actions a.btn-primary",
    );
  }
}
