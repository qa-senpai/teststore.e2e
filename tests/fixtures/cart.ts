import { test as base } from "@playwright/test";
import { CartController } from "@api";
import { takeAddedCartProducts } from "../../app/state/addedCartProducts";

type CartFixtures = {
  cartCleanup: void;
};

export const test = base.extend<CartFixtures>({
  // Auto fixture: after every test, removes from the cart only the products this test added
  // (ProductPage.addToCart remembers them in app/state/addedCartProducts.ts). Runs even if the test failed.
  cartCleanup: [
    async ({ context }, use) => {
      takeAddedCartProducts(); // drop leftovers of a previous test whose teardown broke

      await use();

      const products = takeAddedCartProducts();
      if (products.length === 0) return;

      // context.request shares cookies with the browser, so it sees the same (guest or user) cart.
      const cart = new CartController(context.request);
      const errors: string[] = [];
      for (const product of products) {
        try {
          await cart.deleteProduct(product);
        } catch (error) {
          errors.push((error as Error).message);
        }
      }
      if (errors.length > 0) {
        throw new Error(`Cart cleanup failed:\n${errors.join("\n")}`);
      }
    },
    { auto: true, box: true, title: "cart cleanup" },
  ],
});
