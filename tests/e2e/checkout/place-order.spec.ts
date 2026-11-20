import { test } from '../../fixtures';
import { createUniqueUser } from '../search/data';

test.describe('Checkout @e2e @checkout', () => {
  test.beforeEach(async ({ registrationPage, myAccountPage }) => {
    // Parallel tests clean their carts on teardown, so checkout needs its own account.
    const user = createUniqueUser();
    await registrationPage.open();
    await registrationPage.register(user);
    await myAccountPage.expectLoggedIn(`${user.firstName} ${user.lastName}`);
  });

  test('[E2E-0301] registered user verifies the order summary when payment is unavailable', async ({
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    const productName = await productPage.openFirstProduct();

    await productPage.addToCart();
    await productPage.expectAddedToCartModal();
    await productPage.proceedToCheckout();

    await cartPage.expectContainsProduct(productName);
    const expectedSummary = await cartPage.getExpectedSummary();
    await cartPage.proceedToCheckout();

    await checkoutPage.expectAddressStep();
    // Address is only filled in when the account has none saved.
    await checkoutPage.confirmAddress({
      address: '1 Test Street',
      postcode: '12345',
      city: 'Testville',
    });

    await checkoutPage.confirmDelivery('My carrier');
    await checkoutPage.expectPaymentUnavailable();
    await checkoutPage.expectOrderSummary({
      ...expectedSummary,
      shippingCents: 700,
      taxCents: 0,
    });
  });
});
