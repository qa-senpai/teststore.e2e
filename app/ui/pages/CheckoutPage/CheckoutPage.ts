import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { CheckoutPageLocators } from './CheckoutPageLocators';

export interface Address {
  address: string;
  postcode: string;
  city: string;
}

export class CheckoutPage extends BasePage {
  url = '/index.php?controller=order';

  private readonly locators: CheckoutPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new CheckoutPageLocators(page);
  }

  async expectAddressStep(): Promise<void> {
    await expect(this.page).toHaveURL(/controller=order/);
    await expect(this.locators.addressesStep).toHaveClass(/-current/);
  }

  /** Fills the address form only when the account has no saved address, then confirms the step. */
  async confirmAddress(address: Address): Promise<void> {
    if (await this.locators.addressField.isVisible()) {
      await this.locators.addressField.fill(address.address);
      await this.locators.postcodeField.fill(address.postcode);
      await this.locators.cityField.fill(address.city);
      await this.locators.countrySelect.selectOption({ index: 1 });
    }
    await this.locators.confirmAddressButton.click();
  }

  async confirmDelivery(): Promise<void> {
    await expect(this.locators.deliveryStep).toHaveClass(/-current/);
    await this.locators.confirmDeliveryButton.click();
  }

  async payAndPlaceOrder(): Promise<void> {
    await expect(this.locators.paymentStep).toHaveClass(/-current/);
    await this.locators.paymentOptions.first().check();
    await this.locators.termsCheckbox.check();
    await this.locators.placeOrderButton.click();
  }

  async expectOrderConfirmed(): Promise<void> {
    await expect(this.page).toHaveURL(/controller=order-confirmation/);
    await expect(this.locators.orderConfirmationTitle).toContainText(
      /Your order is confirmed/i,
    );
  }
}
