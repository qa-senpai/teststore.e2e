import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { CheckoutPageLocators } from './CheckoutPageLocators';
import { formatUsd } from '../../../utils/moneyFormatter';

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

  async confirmDelivery(carrierName: string): Promise<void> {
    await expect(this.locators.deliveryStep).toHaveClass(/-current/);
    const radio = this.locators.deliveryOptions
      .filter({ hasText: carrierName })
      .getByRole('radio');
    // Picking a carrier fires an ajax selectDeliveryOption call that re-renders the step.
    // Clicking "Continue" before it finishes is swallowed, leaving payment unreachable.
    if (!(await radio.isChecked())) {
      const saved = this.page.waitForResponse(
        (r) => r.url().includes('selectDeliveryOption'),
        { timeout: 15_000 },
      );
      await radio.check();
      await saved;
    }
    await expect(radio).toBeChecked();
    await expect(this.locators.confirmDeliveryButton).toBeEnabled();
    await this.locators.confirmDeliveryButton.click();
  }

  async expectPaymentUnavailable(): Promise<void> {
    await expect(this.locators.paymentStep).toHaveClass(/-current/);
    await expect(this.locators.noPaymentMessage).toBeVisible();
    await expect(this.locators.paymentOptions).toHaveCount(0);
    await expect(this.locators.placeOrderButton).toBeDisabled();
  }

  async expectOrderSummary(expected: {
    itemCount: number;
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    taxCents: number;
  }): Promise<void> {
    const { itemCount, subtotalCents, discountCents, shippingCents, taxCents } =
      expected;
    const totalTaxExcl = subtotalCents - discountCents + shippingCents;
    await expect(this.locators.summaryItemCount).toHaveText(
      `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`,
    );
    await expect(this.locators.summarySubtotal).toHaveText(
      formatUsd(subtotalCents),
    );
    await expect(this.locators.summaryShipping).toHaveText(
      formatUsd(shippingCents),
    );
    if (discountCents > 0) {
      await expect(this.locators.summaryDiscount).toHaveText(
        `- ${formatUsd(discountCents)}`,
      );
    } else {
      await expect(this.locators.summaryDiscount).toHaveCount(0);
    }
    await expect(this.locators.summaryTaxes).toHaveText(formatUsd(taxCents));
    await expect(this.locators.summaryTotalTaxExcl).toHaveText(
      formatUsd(totalTaxExcl),
    );
    await expect(this.locators.summaryTotalTaxIncl).toHaveText(
      formatUsd(totalTaxExcl + taxCents),
    );
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
