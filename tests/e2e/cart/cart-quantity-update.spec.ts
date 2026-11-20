// spec: specs/critical-flows.plan.md
import { test } from '../../fixtures';

const MUG = /mug the best is yet to come/i;

test.describe('Cart totals', () => {
  test(
    '[E2E-0603] Changing a line quantity recalculates the cart totals; invalid quantity snaps back to 1',
    { tag: ['@e2e', '@cart'] },
    async ({ productPage, cartPage }) => {
      let unitPrice = 0;
      let subtotal = 0;

      await test.step('Add the mug, open the cart page and record the mug unit price and subtotal', async () => {
        await productPage.openById(6);
        await productPage.addToCartAndOpenCart(6, MUG);
        await cartPage.expectQuantity(MUG, 1);
        unitPrice = await cartPage.getLineUnitPriceCents(MUG);
        subtotal = await cartPage.getSubtotalCents();
      });

      await test.step('Increase the mug quantity to 3', async () => {
        await cartPage.setQuantity(MUG, 3);
        await cartPage.expectQuantity(MUG, 3);
        await cartPage.expectSubtotal(subtotal + 2 * unitPrice);
        await cartPage.expectLineTotal(MUG, 3 * unitPrice);
        await cartPage.expectTotalsConsistent();
      });

      await test.step('Decrease the quantity back to 1 with the "-" button', async () => {
        await cartPage.changeQuantityWithButton(MUG, 'down');
        await cartPage.expectQuantity(MUG, 2);
        await cartPage.expectSubtotal(subtotal + unitPrice);
        await cartPage.changeQuantityWithButton(MUG, 'down');
        await cartPage.expectQuantity(MUG, 1);
        await cartPage.expectSubtotal(subtotal);
        await cartPage.expectTotalsConsistent();
      });

      await test.step('Fill the mug quantity with non-numeric text "abc"', async () => {
        await cartPage.enterInvalidQuantity(MUG, 'abc');
        await cartPage.expectQuantity(MUG, 1);
        await cartPage.expectSubtotal(subtotal);
      });

      await test.step('Fill the mug quantity with 0 (the site removes the line)', async () => {
        await cartPage.setQuantity(MUG, 0);
        await cartPage.expectLineAbsent(MUG);
        await cartPage.expectSubtotal(subtotal - unitPrice);
        await cartPage.expectTotalsConsistent();
      });
    },
  );
});
