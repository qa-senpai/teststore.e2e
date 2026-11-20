import { APIRequestContext, expect } from '@playwright/test';

export interface CartProduct {
  id_product: string | number;
  id_product_attribute: string | number;
  id_customization: string | number | null;
  remove_from_cart_url: string;
}

interface CartUpdateResponse {
  success: boolean;
  cart: {
    products: CartProduct[];
  };
}

// Same ajax call the cart page makes when you click the trash icon of a cart line.
// Pass a context that shares cookies with the browser (context.request / page.request):
// the cart belongs to the session, a fresh request context sees a different, empty cart.
export class CartController {
  constructor(private readonly request: APIRequestContext) {}

  async getProducts(): Promise<CartProduct[]> {
    const response = await this.request.get('/index.php', {
      params: { controller: 'cart', ajax: '1', action: 'update' },
      failOnStatusCode: true,
    });

    const body = (await response.json()) as CartUpdateResponse;

    expect(body.success, 'read current cart').toBe(true);
    expect(
      Array.isArray(body.cart?.products),
      'cart products are present',
    ).toBe(true);

    return body.cart.products;
  }

  async deleteProduct(product: CartProduct): Promise<void> {
    // Use the current server-issued URL: it includes the CSRF token and customization.
    expect(
      product.remove_from_cart_url,
      'cart line has a removal URL',
    ).toBeTruthy();
    const response = await this.request.post(product.remove_from_cart_url, {
      form: { ajax: '1', action: 'update' },
      headers: { 'x-requested-with': 'XMLHttpRequest' },
    });
    const label = `delete product ${product.id_product}/${product.id_product_attribute} from cart`;
    expect(response.status(), label).toBe(200);

    // PrestaShop answers success/quantity 0 even for a line that is not in the cart,
    // so the real check is that the line is gone from the returned cart.
    const body = (await response.json()) as CartUpdateResponse;
    expect(body.success, label).toBe(true);
    const stillInCart = body.cart.products.some(
      (p) =>
        Number(p.id_product) === Number(product.id_product) &&
        Number(p.id_product_attribute) ===
          Number(product.id_product_attribute) &&
        Number(p.id_customization ?? 0) ===
          Number(product.id_customization ?? 0),
    );
    expect(stillInCart, `${label}: line is still in the cart`).toBe(false);
  }

  async cleanupCart(): Promise<void> {
    // Read actual server state, including leftovers and additions made outside page objects.
    const products = await this.getProducts();
    const errors: string[] = [];
    for (const product of products.reverse()) {
      try {
        await this.deleteProduct(product);
      } catch (error) {
        // One failed deletion must not prevent attempts to remove the other lines.
        errors.push(String(error));
      }
    }

    await this.expectEmpty();
  }

  async expectEmpty(): Promise<void> {
    expect(
      await this.getProducts(),
      'cart must be empty after cleanup',
    ).toEqual([]);
  }
}
