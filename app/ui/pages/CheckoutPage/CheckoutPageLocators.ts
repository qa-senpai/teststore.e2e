import { Locator, Page } from '@playwright/test';

// The site has no data-test attributes, so ids/classes/names are used.
export class CheckoutPageLocators {
  readonly addressesStep: Locator;
  readonly addressForm: Locator;
  readonly addressField: Locator;
  readonly postcodeField: Locator;
  readonly cityField: Locator;
  readonly countrySelect: Locator;
  readonly confirmAddressButton: Locator;
  readonly deliveryStep: Locator;
  readonly deliveryOptions: Locator;
  readonly confirmDeliveryButton: Locator;
  readonly paymentStep: Locator;
  readonly paymentOptions: Locator;
  readonly noPaymentMessage: Locator;
  readonly summaryItemCount: Locator;
  readonly summarySubtotal: Locator;
  readonly summaryShipping: Locator;
  readonly summaryDiscount: Locator;
  readonly summaryTotalTaxExcl: Locator;
  readonly summaryTotalTaxIncl: Locator;
  readonly summaryTaxes: Locator;
  readonly termsCheckbox: Locator;
  readonly placeOrderButton: Locator;
  readonly orderConfirmationTitle: Locator;

  constructor(page: Page) {
    this.addressesStep = page.locator('#checkout-addresses-step');
    this.addressForm = this.addressesStep.locator(
      'form#delivery-address, section.js-address-form',
    );
    this.addressField = this.addressesStep.locator('input[name="address1"]');
    this.postcodeField = this.addressesStep.locator('input[name="postcode"]');
    this.cityField = this.addressesStep.locator('input[name="city"]');
    this.countrySelect = this.addressesStep.locator(
      'select[name="id_country"]',
    );
    this.confirmAddressButton = this.addressesStep.locator(
      'button[name="confirm-addresses"]',
    );
    this.deliveryStep = page.locator('#checkout-delivery-step');
    this.deliveryOptions = this.deliveryStep.locator('.delivery-option');
    this.confirmDeliveryButton = this.deliveryStep.locator(
      'button[name="confirmDeliveryOption"]',
    );
    this.paymentStep = page.locator('#checkout-payment-step');
    this.paymentOptions = this.paymentStep.locator(
      'input[name="payment-option"]',
    );
    this.noPaymentMessage = this.paymentStep.getByText(
      'Unfortunately, there is no payment method available.',
      { exact: true },
    );
    const summary = page.locator('#js-checkout-summary');
    this.summaryItemCount = summary
      .locator('.cart-summary-products > p')
      .first();
    this.summarySubtotal = summary.locator('#cart-subtotal-products .value');
    this.summaryShipping = summary.locator('#cart-subtotal-shipping .value');
    this.summaryDiscount = summary.locator('#cart-subtotal-discount .value');
    this.summaryTotalTaxExcl = summary
      .locator('.cart-summary-totals .cart-summary-line')
      .filter({ hasText: /Total\s*\(tax excl\.\)/ })
      .locator('.value');
    this.summaryTotalTaxIncl = summary.locator('.cart-total .value');
    this.summaryTaxes = summary
      .locator('.cart-summary-totals .cart-summary-line')
      .filter({ hasText: 'Taxes:' })
      .locator('.value');
    this.termsCheckbox = page.locator('input[id^="conditions_to_approve"]');
    this.placeOrderButton = page.locator(
      '#payment-confirmation button[type="submit"]',
    );
    this.orderConfirmationTitle = page.locator(
      '#content-hook_order_confirmation h3.card-title',
    );
  }
}
