import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { CartPageLocators } from './CartPageLocators';
import { usdToCents } from '../../../utils/moneyFormatter';

export class CartPage extends BasePage {
  url = '/index.php?controller=cart&action=show';

  private readonly locators: CartPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new CartPageLocators(page);
  }

  async expectContainsProduct(name: string): Promise<void> {
    await expect(this.page).toHaveURL(/controller=cart/);
    // The demo may inject extra cart lines; only require the requested product.
    await expect(this.locators.itemNames).toContainText([name], {
      ignoreCase: true,
    });
  }

  async proceedToCheckout(): Promise<void> {
    await this.locators.proceedToCheckoutButton.click();
  }

  /** Calculate from unit prices and quantities, independently of the displayed total. */
  async getExpectedSummary(): Promise<{
    itemCount: number;
    subtotalCents: number;
    discountCents: number;
  }> {
    await expect(this.locators.cartItems.first()).toBeVisible();
    let itemCount = 0;
    let subtotalCents = 0;
    const lineCount = await this.locators.cartItems.count();
    for (let index = 0; index < lineCount; index++) {
      const quantity = Number(
        await this.locators.itemQuantities.nth(index).inputValue(),
      );
      expect(
        Number.isInteger(quantity) && quantity > 0,
        'cart quantity is a positive integer',
      ).toBe(true);
      const unitPrice = usdToCents(
        await this.locators.itemPrices.nth(index).innerText(),
      );
      itemCount += quantity;
      subtotalCents += unitPrice * quantity;
    }
    // Preserve any voucher already applied to this shared demo account.
    const discounts = await this.locators.discountAmount.allInnerTexts();
    const discountCents = discounts.reduce(
      (sum, text) => sum + usdToCents(text.trim().replace(/^-\s*/, '')),
      0,
    );
    return { itemCount, subtotalCents, discountCents };
  }

  async expectEmpty(): Promise<void> {
    await expect(this.locators.cartItems).toHaveCount(0);
    await expect(this.locators.emptyCartMessage).toBeVisible();
  }
}
