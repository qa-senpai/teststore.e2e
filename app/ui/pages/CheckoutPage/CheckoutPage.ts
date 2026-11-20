import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { CheckoutPageLocators } from './CheckoutPageLocators';
import { formatUsd, usdToCents } from '../../../utils/moneyFormatter';

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

  // ---- Guest checkout steps (E2E-0606) ----

  async expectPersonalInformationStep(): Promise<void> {
    await expect(this.page).toHaveURL(/controller=order/);
    await expect(this.locators.personalInfoStep).toHaveClass(/-current/);
    await expect(this.locators.guestTab).toBeVisible();
    await expect(this.locators.guestFirstNameField).toBeVisible();
    await expect(this.locators.guestLastNameField).toBeVisible();
    await expect(this.locators.guestEmailField).toBeVisible();
    await expect(this.locators.guestPasswordField).toBeVisible();
    await expect(this.locators.guestPrivacyCheckbox).toBeVisible();
    await expect(this.locators.guestContinueButton).toBeVisible();
  }

  async expectStepTitles(titles: string[]): Promise<void> {
    await expect(this.locators.stepTitles).toContainText(titles);
  }

  async submitGuestForm(guest: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<void> {
    await this.locators.guestFirstNameField.fill(guest.firstName);
    await this.locators.guestLastNameField.fill(guest.lastName);
    await this.locators.guestEmailField.fill(guest.email);
    await this.locators.guestPrivacyCheckbox.check();
    await this.locators.guestContinueButton.click();
  }

  async correctGuestFirstName(firstName: string): Promise<void> {
    await this.locators.guestFirstNameField.fill(firstName);
    await this.locators.guestContinueButton.click();
  }

  async expectGuestFirstNameInvalid(message: string): Promise<void> {
    await expect(this.locators.guestFirstNameGroup).toContainText(message);
    await expect(this.locators.personalInfoStep).toHaveClass(/-current/);
    await expect(this.locators.addressesStep).not.toHaveClass(/-current/);
  }

  async expectAddressFormStep(): Promise<void> {
    await expect(this.locators.addressesStep).toHaveClass(/-current/);
    await expect(this.locators.addressField).toBeVisible();
    await expect(this.locators.cityField).toBeVisible();
    await expect(this.locators.stateSelect).toBeVisible();
    await expect(this.locators.postcodeField).toBeVisible();
    await expect(this.locators.countrySelect).toBeVisible();
    await expect(this.locators.phoneField).toBeVisible();
    await expect(this.locators.personalInfoStep).toHaveClass(/-complete/);
    await expect(this.locators.personalInfoEditLink).toBeVisible();
  }

  async fillGuestAddress(address: Address, country: string): Promise<void> {
    await this.locators.addressField.fill(address.address);
    await this.locators.cityField.fill(address.city);
    await this.locators.countrySelect.selectOption({ label: country });
    await expect(this.locators.countrySelect).toHaveValue(/\d+/);
    await this.locators.postcodeField.fill(address.postcode);
  }

  async selectState(state: string): Promise<void> {
    await this.locators.stateSelect.selectOption({ label: state });
  }

  async setPostcode(postcode: string): Promise<void> {
    await this.locators.postcodeField.fill(postcode);
  }

  async submitAddressStep(): Promise<void> {
    await this.locators.confirmAddressButton.click();
  }

  /** The browser itself blocks submit while State (required for the US) is empty. */
  async expectStateRequiredBlocksSubmit(): Promise<void> {
    await expect(this.locators.invalidStateSelect).toHaveCount(1);
    await expect(this.locators.addressesStep).toHaveClass(/-current/);
    await expect(this.locators.deliveryStep).not.toHaveClass(/-current/);
  }

  async expectPostcodeError(message: string): Promise<void> {
    await expect(this.locators.postcodeGroup).toContainText(message);
    await expect(this.locators.addressesStep).toHaveClass(/-current/);
    await expect(this.locators.deliveryStep).not.toHaveClass(/-current/);
  }

  /** Waits for the Shipping step, checks the carrier is listed and pre-selected, returns its displayed price. */
  async expectDeliveryStepWithCarrier(carrierName: string): Promise<string> {
    await expect(this.locators.deliveryStep).toHaveClass(/-current/);
    const option = this.locators.deliveryOptions.filter({
      hasText: carrierName,
    });
    await expect(option).toBeVisible();
    await expect(option.getByRole('radio')).toBeVisible();
    await expect(
      this.locators.deliveryOptions.locator('input[type="radio"]:checked'),
    ).toHaveCount(1);
    const match = /\$[\d,]+\.\d{2}/.exec(await option.innerText());
    if (!match) throw new Error(`No price shown for carrier ${carrierName}`);
    return match[0];
  }

  /** Reaches the Payment step without placing an order; the payment options depend on the country. */
  async expectPaymentStepReached(): Promise<void> {
    await expect(this.locators.paymentStep).toHaveClass(/-current/);
    await expect(this.locators.deliveryStep).toHaveClass(/-complete/);
    await expect(this.locators.placeOrderButton).toBeDisabled();
  }

  async expectSummaryListsProduct(
    name: RegExp,
    quantity: number,
  ): Promise<void> {
    const line = this.locators.summaryProducts
      .locator('.media-body')
      .filter({ hasText: name });
    await expect(line).toContainText(`x${quantity}`);
  }

  /** Total must equal subtotal - discount + shipping, all read from the page. */
  async expectTotalFollowsSummaryLines(): Promise<void> {
    await expect(async () => {
      const subtotal = usdToCents(
        await this.locators.summarySubtotal.innerText(),
      );
      const shipping = usdToCents(
        await this.locators.summaryShipping.innerText(),
      );
      const discountText = (await this.locators.summaryDiscount.count())
        ? await this.locators.summaryDiscount.innerText()
        : '$0.00';
      const discount = usdToCents(discountText.replace(/^-\s*/, ''));
      const total = usdToCents(
        await this.locators.summaryTotalTaxIncl.innerText(),
      );
      expect(total).toBe(subtotal - discount + shipping);
    }).toPass();
  }

  async expectShippingEqualsCarrierPrice(price: string): Promise<void> {
    await expect(this.locators.summaryShipping).toHaveText(price);
  }
}
