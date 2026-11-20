// Global (per worker) record of the cart lines the current test added through the UI.
// A worker runs one test at a time, so this list only ever holds the current test's products.
// The `cartCleanup` auto fixture (tests/fixtures/cart.ts) clears it before every test and
// deletes everything in it after the test, so products already in the cart are left alone.

export interface AddedCartProduct {
  id_product: number;
  id_product_attribute: number;
  id_customization: number;
  // PrestaShop static token sent with the add-to-cart request; the delete call needs it.
  token: string;
}

const addedCartProducts: AddedCartProduct[] = [];

export function rememberAddedCartProduct(product: AddedCartProduct): void {
  addedCartProducts.push(product);
}

/** Returns the remembered products (latest first) and empties the list. */
export function takeAddedCartProducts(): AddedCartProduct[] {
  return addedCartProducts.splice(0).reverse();
}
