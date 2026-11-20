// spec: specs/critical-flows.plan.md
import { test } from '../../fixtures';

const MUG = /mug the best is yet to come/i;

test.describe('Cart removal', () => {
  test(
    '[E2E-0604] Removing every line empties the cart and shows the empty-cart state',
    { tag: ['@e2e', '@cart'] },
    async ({ productPage, cartPage }) => {
      await test.step('Add the mug from its product page and open the cart page', async () => {
        await productPage.openById(6);
        await productPage.addToCart();
        await productPage.expectAddedToCartModal();
        await productPage.proceedToCheckout();
        await cartPage.expectLine(MUG, { quantity: 1 });
      });

      await test.step('Click the delete link of the mug line', async () => {
        await cartPage.removeLine(MUG);
        await cartPage.expectLineAbsent(MUG);
      });

      await test.step('Delete the remaining lines until no line remains', async () => {
        await cartPage.removeAllLines();
        await cartPage.expectEmptyState();
      });

      await test.step('Click "Continue shopping"', async () => {
        await cartPage.continueShopping();
        await cartPage.expectHomePage();
      });

      await test.step('Reload the cart page', async () => {
        await cartPage.open();
        await cartPage.expectEmptyState();
      });
    },
  );
});
