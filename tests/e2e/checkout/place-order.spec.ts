import { test } from '../../fixtures';

test.describe('Checkout @e2e @checkout', () => {
  test('[E2E-0301] registered user adds a product to the cart and places an order', async ({
    login: _login,
    productPage,
    cartPage,
    checkoutPage,
  }) => {
    const productName = await productPage.openFirstProduct();

    await productPage.addToCart();
    await productPage.expectAddedToCartModal();
    await productPage.proceedToCheckout();

    await cartPage.expectContainsProduct(productName);
    await cartPage.proceedToCheckout();

    await checkoutPage.expectAddressStep();
    // Address is only filled in when the account has none saved.
    await checkoutPage.confirmAddress({
      address: '1 Test Street',
      postcode: '12345',
      city: 'Testville',
    });
    await checkoutPage.confirmDelivery();
    await checkoutPage.payAndPlaceOrder();

    await checkoutPage.expectOrderConfirmed();
  });
});
