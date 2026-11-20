// spec: specs/critical-flows.plan.md
import { test } from '../../fixtures';

const TSHIRT = /hummingbird printed t-shirt/i;

test.describe('Variant selection', () => {
  test(
    '[E2E-0602] Selected size and colour end up on the cart line and in the URL hash',
    { tag: ['@e2e', '@cart', '@variants'] },
    async ({ productPage, cartPage }) => {
      let price = '';

      await test.step('Open the Hummingbird printed t-shirt page', async () => {
        await productPage.openById(1);
        price = await productPage.getPrice();
        await productPage.expectSizeOptions(['S', 'M', 'L', 'XL']);
        await productPage.expectColorOptions(['Black', 'White']);
      });

      await test.step('Select size L and colour White', async () => {
        await productPage.selectSize('L');
        await productPage.expectUrlHash(/#\/3-size-l\/\d+-color-/);
        await productPage.selectColor('White');
        await productPage.expectUrlHash(/#\/3-size-l\/\d+-color-white/);
        await productPage.expectPrice(price);
      });

      await test.step('Click "Add to cart"', async () => {
        await productPage.addToCart();
        await productPage.expectAddedToCartModal();
        await productPage.expectModalProduct(TSHIRT, {
          quantity: 1,
          price,
          size: 'L',
          color: 'White',
        });
      });

      await test.step('Open the cart page via "Proceed to checkout"', async () => {
        await productPage.proceedToCheckout();
        await cartPage.expectLine(TSHIRT, {
          size: 'L',
          color: 'White',
          quantity: 1,
          unitPrice: price,
        });
      });

      await test.step('Go back to the product page, add size S and Black, open the cart', async () => {
        await productPage.openById(1);
        await productPage.selectSize('S');
        await productPage.selectColor('Black');
        await productPage.expectUrlHash(/#\/1-size-s\/\d+-color-black/);
        await productPage.expectPrice(price);
        await productPage.addToCart();
        await productPage.expectAddedToCartModal();
        await productPage.expectModalProduct(TSHIRT, {
          quantity: 1,
          price,
          size: 'S',
          color: 'Black',
        });
        await productPage.proceedToCheckout();
        await cartPage.expectLine(TSHIRT, {
          size: 'S',
          color: 'Black',
          quantity: 1,
          unitPrice: price,
        });
        await cartPage.expectLine(TSHIRT, {
          size: 'L',
          color: 'White',
          quantity: 1,
          unitPrice: price,
        });
      });
    },
  );
});
