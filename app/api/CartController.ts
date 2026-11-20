import { APIRequestContext, expect } from "@playwright/test";
import type { AddedCartProduct } from "../state/addedCartProducts";

interface CartUpdateResponse {
  success: boolean;
  cart: {
    products: {
      id_product: string | number;
      id_product_attribute: string | number;
    }[];
  };
}

// Same ajax call the cart page makes when you click the trash icon of a cart line.
// Pass a context that shares cookies with the browser (context.request / page.request):
// the cart belongs to the session, a fresh request context sees a different, empty cart.
export class CartController {
  constructor(private readonly request: APIRequestContext) {}

  async deleteProduct(product: AddedCartProduct): Promise<void> {
    const response = await this.request.post("/index.php", {
      params: {
        controller: "cart",
        delete: "1",
        id_product: product.id_product,
        id_product_attribute: product.id_product_attribute,
        id_customization: product.id_customization,
        token: product.token,
      },
      form: { ajax: "1", action: "update" },
      headers: { "x-requested-with": "XMLHttpRequest" },
    });
    const label = `delete product ${product.id_product}/${product.id_product_attribute} from cart`;
    expect(response.status(), label).toBe(200);

    // PrestaShop answers success/quantity 0 even for a line that is not in the cart,
    // so the real check is that the line is gone from the returned cart.
    const body = (await response.json()) as CartUpdateResponse;
    expect(body.success, label).toBe(true);
    const stillInCart = body.cart.products.some(
      (p) =>
        Number(p.id_product) === product.id_product &&
        Number(p.id_product_attribute) === product.id_product_attribute,
    );
    expect(stillInCart, `${label}: line is still in the cart`).toBe(false);
  }
}
