// spec: specs/critical-flows.plan.md
import { test } from '../../fixtures';
import { createUniqueUser } from '@data';

const MUG = /mug the best is yet to come/i;
const CARRIER = 'My carrier';

test.describe('Guest checkout', () => {
  test(
    '[E2E-0606] Guest completes personal information, address and shipping and reaches the payment step without placing an order',
    { tag: ['@e2e', '@checkout'] },
    async ({ productPage, cartPage, checkoutPage }) => {
      const guest = createUniqueUser();
      let carrierPrice = '';

      await test.step('Add the mug from its product page, proceed to checkout from the modal and from the cart page', async () => {
        await productPage.openById(6);
        await productPage.addToCartAndOpenCart(6, MUG);
        await cartPage.proceedToCheckout();
        await checkoutPage.expectPersonalInformationStep();
        await checkoutPage.expectStepTitles([
          'Personal Information',
          'Addresses',
          'Shipping Method',
          'Payment',
        ]);
      });

      await test.step('Submit the guest form with a digit in the First name', async () => {
        await checkoutPage.submitGuestForm({
          ...guest,
          firstName: 'Test1',
        });
        await checkoutPage.expectGuestFirstNameInvalid('Invalid format.');
      });

      await test.step('Correct the First name to letters only and continue to the Addresses step', async () => {
        await checkoutPage.correctGuestFirstName(guest.firstName);
        await checkoutPage.expectAddressFormStep();
      });

      await test.step('Fill the address for United States and leave State empty', async () => {
        await checkoutPage.fillGuestAddress(
          { address: '1 Test Street', city: 'Testville', postcode: '12345' },
          'United States',
        );
        await checkoutPage.submitAddressStep();
        await checkoutPage.expectStateRequiredBlocksSubmit();
      });

      await test.step('Choose State New York and set a postcode in the wrong format', async () => {
        await checkoutPage.selectState('New York');
        await checkoutPage.setPostcode('ABCDE');
        await checkoutPage.submitAddressStep();
        await checkoutPage.expectPostcodeError(
          'Invalid postcode - should look like "NNNNN"',
        );
      });

      await test.step('Set postcode 12345 and continue to the Shipping Method step', async () => {
        await checkoutPage.setPostcode('12345');
        await checkoutPage.submitAddressStep();
        carrierPrice =
          await checkoutPage.expectDeliveryStepWithCarrier(CARRIER);
      });

      await test.step('Select My carrier and continue to the Payment step', async () => {
        await checkoutPage.confirmDelivery(CARRIER);
        await checkoutPage.expectPaymentStepReached();
        await checkoutPage.expectSummaryListsProduct(MUG, 1);
        await checkoutPage.expectShippingEqualsCarrierPrice(carrierPrice);
        await checkoutPage.expectTotalFollowsSummaryLines();
      });
    },
  );
});
