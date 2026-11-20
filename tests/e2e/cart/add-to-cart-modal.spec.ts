// spec: specs/critical-flows.plan.md
import { test } from '../../fixtures';

const MUG = /mug the best is yet to come/i;

test.describe('Add to cart', () => {
  test(
    '[E2E-0601] Add a product from its page shows the confirmation modal and updates the header cart count',
    { tag: ['@e2e', '@cart'] },
    async ({ productPage, cartPage }) => {
      let countBefore = 0;
      let countInModal = 0;

      await test.step('Open the product page of "Mug The best is yet to come"', async () => {
        await productPage.openById(6);
        await productPage.expectProductDetails(MUG, '$11.90');
        countBefore = await productPage.getHeaderCartCount();
      });

      await test.step('Click "Add to cart"', async () => {
        await productPage.addToCartConfirmed(MUG, () =>
          productPage.openById(6),
        );
        await productPage.expectModalProduct(MUG, { quantity: 1 });
        countInModal = await productPage.getModalItemCount();
        await productPage.expectModalControlsAndSummary();
      });

      await test.step('Click "Continue shopping"', async () => {
        await productPage.continueShopping();
        await productPage.expectHeaderCartCount(countInModal);
        await productPage.expectHeaderCartCountAbove(countBefore);
      });

      await test.step('Click the header cart link', async () => {
        await productPage.openCartFromHeader();
        await cartPage.expectContainsProduct('Mug The best is yet to come');
        await cartPage.expectLine(MUG, { unitPrice: '$11.90', quantity: 1 });
        await cartPage.expectSummaryItemCount(countInModal);
      });
    },
  );
});
