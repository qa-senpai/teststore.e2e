import { Locator, Page } from "@playwright/test";

// The site has no data-test attributes, so ids/classes/names are used.
export class ProductPageLocators {
  readonly categoryProductLinks: Locator;
  readonly productTitle: Locator;
  readonly addToCartButton: Locator;
  readonly cartModal: Locator;
  readonly cartModalTitle: Locator;
  readonly proceedToCheckoutButton: Locator;

  constructor(page: Page) {
    this.categoryProductLinks = page.locator(
      "#js-product-list article.product-miniature a.product-thumbnail",
    );
    this.productTitle = page.locator('h1[itemprop="name"]');
    this.addToCartButton = page.locator(
      ".product-add-to-cart button.add-to-cart",
    );
    this.cartModal = page.locator("#blockcart-modal");
    this.cartModalTitle = this.cartModal.locator("#myModalLabel");
    this.proceedToCheckoutButton = this.cartModal.locator("a.btn-primary");
  }
}
