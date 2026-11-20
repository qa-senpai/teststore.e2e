import { expect, Page, Response } from '@playwright/test';
import { BasePage } from '../BasePage';
import { ProductPageLocators } from './ProductPageLocators';

interface AddedCartLine {
  id_product: string | number;
  id_product_attribute: string | number;
  id_customization: string | number | null;
  quantity: number;
}

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

  /** Adds the open product; the automatic fixture cleans the cart after the test. */
  async addToCart(): Promise<void> {
    // The theme binds the ajax add-to-cart handler on window load; clicking
    // earlier submits the form natively and navigates to the cart page instead
    // of opening #blockcart-modal.
    await this.page.waitForLoadState('load');
    // Start listening before the click so a fast response cannot be missed.
    const responsePromise = this.page.waitForResponse(isAddToCart);
    await this.locators.addToCartButton.click();
    const response = await responsePromise;

    expect(response.status(), 'add-to-cart request failed').toBe(200);
    // json() waits for the full response body, not just the response headers.
    const body = await response.json();
    expect(body.success, 'server confirmed adding the product').toBe(true);
    expect(body.hasError, 'add-to-cart response contains errors').not.toBe(
      true,
    );

    const sent = new URLSearchParams(response.request().postData() ?? '');
    const productId = Number(sent.get('id_product'));
    expect(
      productId,
      'add-to-cart request contains a product ID',
    ).toBeGreaterThan(0);
    expect(
      Number(body.id_product),
      'response matches the requested product',
    ).toBe(productId);
    expect(
      Array.isArray(body.cart?.products),
      'response includes cart products',
    ).toBe(true);

    const addedProduct = (body.cart.products as AddedCartLine[]).find(
      (product) =>
        Number(product.id_product) === productId &&
        Number(product.id_product_attribute) ===
          Number(body.id_product_attribute) &&
        Number(product.id_customization ?? 0) ===
          Number(sent.get('id_customization') ?? 0),
    );
    expect(
      addedProduct,
      'requested product variant is present in the cart',
    ).toBeDefined();
    expect(
      Number(addedProduct?.quantity),
      'cart contains at least the requested quantity',
    ).toBeGreaterThanOrEqual(Number(sent.get('qty') ?? 1));
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
