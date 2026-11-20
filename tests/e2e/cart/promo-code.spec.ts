// spec: specs/critical-flows.plan.md
import { test } from '../../fixtures';

const MUG = /mug the best is yet to come/i;

test.describe('Promo code', () => {
  test(
    '[E2E-0605] An unknown promo code is rejected and the valid code 20OFF applies a 20% discount that can be removed',
    { tag: ['@e2e', '@cart', '@voucher'] },
    async ({ productPage, cartPage }) => {
      let subtotal = 0;
      let total = 0;

      await test.step('Add the mug, open the cart page, remove any pre-applied voucher and record the subtotal', async () => {
        await productPage.openById(6);
        await productPage.addToCartAndOpenCart(6, MUG);
        await cartPage.expectLine(MUG, { quantity: 1 });
        await cartPage.removeAppliedVouchers();
        await cartPage.expectNoDiscount();
        await cartPage.expectPromoLinkVisible();
        const summary = await cartPage.getSummary();
        subtotal = summary.subtotalCents;
        total = summary.totalCents;
      });

      await test.step('Apply the unknown promo code BADCODE', async () => {
        await cartPage.applyPromoCode('BADCODE');
        await cartPage.expectPromoError('This voucher does not exist.');
        await cartPage.expectNoDiscount();
        await cartPage.expectSubtotal(subtotal);
        await cartPage.expectTotal(total);
      });

      await test.step('Apply the promo code 20OFF', async () => {
        await cartPage.applyPromoCode('20OFF');
        await cartPage.expectVoucherApplied('20OFF');
        await cartPage.expectDiscountPercentOf(subtotal, 20);
        await cartPage.expectSubtotal(subtotal);
      });

      await test.step('Remove the 20OFF voucher', async () => {
        await cartPage.removeVoucher();
        await cartPage.expectVoucherRemoved();
        await cartPage.expectSubtotal(subtotal);
        await cartPage.expectTotal(total);
      });
    },
  );
});
