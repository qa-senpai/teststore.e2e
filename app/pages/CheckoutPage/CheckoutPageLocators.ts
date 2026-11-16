import { Locator, Page } from "@playwright/test";

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
  readonly confirmDeliveryButton: Locator;
  readonly paymentStep: Locator;
  readonly paymentOptions: Locator;
  readonly termsCheckbox: Locator;
  readonly placeOrderButton: Locator;
  readonly orderConfirmationTitle: Locator;

  constructor(page: Page) {
    this.addressesStep = page.locator("#checkout-addresses-step");
    this.addressForm = this.addressesStep.locator(
      "form#delivery-address, section.js-address-form",
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
    this.deliveryStep = page.locator("#checkout-delivery-step");
    this.confirmDeliveryButton = this.deliveryStep.locator(
      'button[name="confirmDeliveryOption"]',
    );
    this.paymentStep = page.locator("#checkout-payment-step");
    this.paymentOptions = this.paymentStep.locator(
      'input[name="payment-option"]',
    );
    this.termsCheckbox = page.locator('input[id^="conditions_to_approve"]');
    this.placeOrderButton = page.locator(
      '#payment-confirmation button[type="submit"]',
    );
    this.orderConfirmationTitle = page.locator(
      "#content-hook_order_confirmation h3.card-title",
    );
  }
}
