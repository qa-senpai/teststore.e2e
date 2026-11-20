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

  async openById(id: number): Promise<void> {
    await this.page.goto(`/index.php?id_product=${id}&controller=product`);
  }

  async expectProductDetails(name: RegExp, price: string): Promise<void> {
    await expect(this.locators.productTitle).toHaveText(name);
    await expect(this.locators.productPrice).toHaveText(price);
    await expect(this.locators.addToCartButton).toBeEnabled();
  }

  async getPrice(): Promise<string> {
    await expect(this.locators.productPrice).toBeVisible();
    return (await this.locators.productPrice.innerText()).trim();
  }

  async expectPrice(price: string): Promise<void> {
    await expect(this.locators.productPrice).toHaveText(price);
  }

  async getHeaderCartCount(): Promise<number> {
    await expect(this.locators.headerCartCount).toHaveText(/^\(\d+\)$/);
    const text = await this.locators.headerCartCount.innerText();
    return Number(/\d+/.exec(text)?.[0]);
  }

  async expectHeaderCartCount(count: number): Promise<void> {
    await expect(this.locators.headerCartCount).toHaveText(`(${count})`);
  }

  async expectHeaderCartCountAbove(count: number): Promise<number> {
    await expect
      .poll(async () =>
        Number(
          /\d+/.exec(await this.locators.headerCartCount.innerText())?.[0],
        ),
      )
      .toBeGreaterThan(count);
    return this.getHeaderCartCount();
  }

  async openCartFromHeader(): Promise<void> {
    await this.locators.headerCartLink.click();
  }

  async expectSizeOptions(sizes: string[]): Promise<void> {
    await expect(this.locators.sizeSelect.locator('option')).toHaveText(sizes);
  }

  async expectColorOptions(colors: string[]): Promise<void> {
    await expect(this.locators.colorInputs).toHaveCount(colors.length);
    for (const color of colors) {
      await expect(
        this.locators.colorGroup.locator(`input[title="${color}"]`),
      ).toHaveCount(1);
    }
  }

  async selectSize(size: string): Promise<void> {
    await this.locators.sizeSelect.selectOption({ label: size });
  }

  async selectColor(color: string): Promise<void> {
    await this.locators.colorGroup
      .locator(`label[aria-label="${color}"]`)
      .click();
    await expect(
      this.locators.colorGroup.locator(`input[title="${color}"]`),
    ).toBeChecked();
  }

  async expectUrlHash(hash: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(hash);
  }

  /** Waits for the added-to-cart modal and returns the announced item count. */
  async getModalItemCount(): Promise<number> {
    await expect(this.locators.modalItemCount).toHaveText(
      /There (is|are) \d+ items? in your cart\./,
    );
    const text = await this.locators.modalItemCount.innerText();
    return Number(/(\d+) item/.exec(text)?.[1]);
  }

  async expectModalProduct(
    name: RegExp,
    options: {
      quantity: number;
      price?: string;
      size?: string;
      color?: string;
    },
  ): Promise<void> {
    await expect(this.locators.modalProductName).toHaveText(name);
    await expect(this.locators.modalQuantity).toHaveText(
      String(options.quantity),
    );
    if (options.price) {
      await expect(this.locators.modalProductPrice).toHaveText(options.price);
    }
    if (options.size) {
      await expect(this.locators.modalSize).toHaveText(options.size);
    }
    if (options.color) {
      await expect(this.locators.modalColor).toHaveText(options.color);
    }
  }

  async expectModalControlsAndSummary(): Promise<void> {
    await expect(this.locators.continueShoppingButton).toBeVisible();
    await expect(this.locators.proceedToCheckoutButton).toBeVisible();
    await expect(this.locators.modalSubtotal).toBeVisible();
    await expect(this.locators.modalShipping).toBeVisible();
    await expect(this.locators.modalTotal).toBeVisible();
  }

  async continueShopping(): Promise<void> {
    await this.locators.continueShoppingButton.click();
    await expect(this.locators.cartModal).toBeHidden();
  }

  /**
   * Adds the product and opens the cart page. The live demo occasionally returns a cart
   * without the product it just confirmed (its cart state is shared/unstable), so the
   * add is repeated when the cart page does not list the product.
   */
  async addToCartAndOpenCart(productId: number, name: RegExp): Promise<void> {
    const attempts = 3;
    const cartLine = this.page
      .locator('.cart-overview li.cart-item .product-line-info a.label')
      .filter({ hasText: name });
    for (let attempt = 1; attempt <= attempts; attempt++) {
      if (attempt > 1) await this.openById(productId);
      await this.addToCart();
      await this.expectAddedToCartModal();
      await this.proceedToCheckout();
      await expect(this.page).toHaveURL(/controller=cart/);
      await expect(this.page.locator('.cart-grid')).toBeVisible();
      if ((await cartLine.count()) > 0) return;
    }
    throw new Error(
      `Product ${productId} is missing from the cart after ${attempts} add-to-cart attempts`,
    );
  }

  /**
   * Adds the open product and waits until the modal shows it. The live demo sometimes
   * confirms the add but renders an empty modal (the cart is lost server-side), so the
   * add is repeated after `reopen` restores the product page state.
   */
  async addToCartConfirmed(
    name: RegExp,
    reopen: () => Promise<void>,
  ): Promise<void> {
    const attempts = 3;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      if (attempt > 1) await reopen();
      await this.addToCart();
      await this.expectAddedToCartModal();
      try {
        await expect(this.locators.modalProductName).toHaveText(name, {
          timeout: 3_000,
        });
        return;
      } catch {
        // Empty modal: retry on a fresh page.
      }
    }
    throw new Error(
      `The add-to-cart modal never showed ${name} after ${attempts} attempts`,
    );
  }
}
