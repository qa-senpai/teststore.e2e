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
  readonly personalInfoStep: Locator;
  readonly stepTitles: Locator;
  readonly guestForm: Locator;
  readonly guestTab: Locator;
  readonly guestFirstNameField: Locator;
  readonly guestLastNameField: Locator;
  readonly guestEmailField: Locator;
  readonly guestPasswordField: Locator;
  readonly guestPrivacyCheckbox: Locator;
  readonly guestContinueButton: Locator;
  readonly guestFirstNameGroup: Locator;
  readonly personalInfoEditLink: Locator;
  readonly stateSelect: Locator;
  readonly invalidStateSelect: Locator;
  readonly phoneField: Locator;
  readonly postcodeGroup: Locator;
  readonly summaryProducts: Locator;

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
    this.personalInfoStep = page.locator('#checkout-personal-information-step');
    this.stepTitles = page.locator('.checkout-step .step-title');
    this.guestForm = page.locator('#checkout-guest-form form#customer-form');
    this.guestTab = this.personalInfoStep.getByRole('tab', {
      name: 'Order as a guest',
    });
    this.guestFirstNameField = this.guestForm.locator(
      'input[name="firstname"]',
    );
    this.guestLastNameField = this.guestForm.locator('input[name="lastname"]');
    this.guestEmailField = this.guestForm.locator('input[name="email"]');
    this.guestPasswordField = this.guestForm.locator('input[name="password"]');
    this.guestPrivacyCheckbox = this.guestForm.locator('input[name="psgdpr"]');
    this.guestContinueButton = this.guestForm.locator(
      'button[name="continue"]',
    );
    this.guestFirstNameGroup = this.guestForm
      .locator('.form-group.has-error')
      .filter({ has: page.locator('input[name="firstname"]') });
    this.personalInfoEditLink = this.personalInfoStep.locator('.step-edit');
    this.stateSelect = this.addressesStep.locator('select[name="id_state"]');
    this.invalidStateSelect = this.addressesStep.locator(
      'select[name="id_state"]:invalid',
    );
    this.phoneField = this.addressesStep.locator('input[name="phone"]');
    this.postcodeGroup = this.addressesStep
      .locator('.form-group.has-error')
      .filter({ has: page.locator('input[name="postcode"]') });
    this.summaryProducts = summary.locator('.cart-summary-products');
  }
}
