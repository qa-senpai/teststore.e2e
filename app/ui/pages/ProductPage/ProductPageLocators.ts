import { Locator, Page } from '@playwright/test';

// The site has no data-test attributes, so ids/classes/names are used.
export class ProductPageLocators {
  readonly categoryProductLinks: Locator;
  readonly productTitle: Locator;
  readonly addToCartButton: Locator;
  readonly cartModal: Locator;
  readonly cartModalTitle: Locator;
  readonly proceedToCheckoutButton: Locator;
  readonly productPrice: Locator;
  readonly sizeSelect: Locator;
  readonly colorGroup: Locator;
  readonly colorInputs: Locator;
  readonly headerCartCount: Locator;
  readonly headerCartLink: Locator;
  readonly modalProductName: Locator;
  readonly modalProductPrice: Locator;
  readonly modalSize: Locator;
  readonly modalColor: Locator;
  readonly modalQuantity: Locator;
  readonly modalItemCount: Locator;
  readonly modalSubtotal: Locator;
  readonly modalShipping: Locator;
  readonly modalTotal: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.categoryProductLinks = page.locator(
      '#js-product-list article.product-miniature a.product-thumbnail',
    );
    // The product h1 has no itemprop (the theme uses JSON-LD), only class "h1".
    this.productTitle = page.locator('#main').getByRole('heading', {
      level: 1,
    });
    this.addToCartButton = page.locator(
      '.product-add-to-cart button.add-to-cart',
    );
    this.cartModal = page.locator('#blockcart-modal');
    this.cartModalTitle = this.cartModal.locator('#myModalLabel');
    this.proceedToCheckoutButton = this.cartModal.locator('a.btn-primary');
    this.productPrice = page.locator('.product-prices .current-price-value');
    this.sizeSelect = page.locator('#group_1');
    this.colorGroup = page.locator('#group_2');
    this.colorInputs = this.colorGroup.locator('input[type="radio"]');
    this.headerCartCount = page.locator('.blockcart .cart-products-count');
    this.headerCartLink = page.locator('.blockcart .header a');
    this.modalProductName = this.cartModal.locator('.product-name');
    this.modalProductPrice = this.cartModal.locator('.product-price');
    this.modalSize = this.cartModal.locator('.size strong');
    this.modalColor = this.cartModal.locator('.color strong');
    this.modalQuantity = this.cartModal.locator('.product-quantity strong');
    this.modalItemCount = this.cartModal.locator('p.cart-products-count');
    this.modalSubtotal = this.cartModal.locator('.subtotal.value');
    this.modalShipping = this.cartModal.locator('.shipping.value');
    this.modalTotal = this.cartModal.locator('.product-total .value');
    this.continueShoppingButton = this.cartModal.locator('.btn-secondary');
  }
}
