import { expect, Page, Response } from '@playwright/test';
import {
  AddedCartProduct,
  rememberAddedCartProduct,
} from '../../../state/addedCartProducts';
import { BasePage } from '../BasePage';
import { ProductPageLocators } from './ProductPageLocators';

// The add-to-cart ajax call: POST /index.php?controller=cart with add=1 in the form body.
const isAddToCart = (r: Response) =>
  r.url().includes('controller=cart') &&
  r.request().method() === 'POST' &&
  new URLSearchParams(r.request().postData() ?? '').get('add') === '1';

export class ProductPage extends BasePage {
  url = '/index.php?id_category=2&controller=category';

  private readonly locators: ProductPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new ProductPageLocators(page);
  }

  /** Opens the first product of the catalogue and returns its name. */
  async openFirstProduct(): Promise<string> {
    await this.open();
    await this.locators.categoryProductLinks.first().click();
    await expect(this.page).toHaveURL(/controller=product|\.html/);
    await expect(this.locators.productTitle).toBeVisible();
    return (await this.locators.productTitle.innerText()).trim();
  }

  /**
   * Adds the open product to the cart and remembers the cart line so the
   * `cartCleanup` fixture removes it after the test.
   */
  async addToCart(): Promise<AddedCartProduct> {
    // The theme binds the ajax add-to-cart handler on window load; clicking
    // earlier submits the form natively and navigates to the cart page instead
    // of opening #blockcart-modal.
    await this.page.waitForLoadState('load');
    const responsePromise = this.page.waitForResponse(isAddToCart);
    await this.locators.addToCartButton.click();
    const response = await responsePromise;

    expect(response.status(), 'add-to-cart request failed').toBe(200);
    const body = (await response.json()) as Omit<AddedCartProduct, 'token'>;
    const sent = new URLSearchParams(response.request().postData() ?? '');
    const product: AddedCartProduct = {
      id_product: Number(body.id_product),
      id_product_attribute: Number(body.id_product_attribute),
      id_customization: Number(body.id_customization ?? 0),
      token: sent.get('token') ?? '',
    };
    // Remember before any assertion so a failing test is still cleaned up.
    rememberAddedCartProduct(product);
    return product;
  }

  async expectAddedToCartModal(): Promise<void> {
    await expect(this.locators.cartModal).toBeVisible();
    await expect(this.locators.cartModalTitle).toContainText(
      'Product successfully added to your shopping cart',
    );
  }

  async proceedToCheckout(): Promise<void> {
    await this.locators.proceedToCheckoutButton.click();
  }
}
