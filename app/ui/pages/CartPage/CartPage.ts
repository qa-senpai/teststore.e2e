import { expect, Page } from "@playwright/test";
import { BasePage } from "../BasePage";
import { CartPageLocators } from "./CartPageLocators";

export class CartPage extends BasePage {
  url = "/index.php?controller=cart&action=show";

  private readonly locators: CartPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new CartPageLocators(page);
  }

  async expectContainsProduct(name: string): Promise<void> {
    await expect(this.page).toHaveURL(/controller=cart/);
    await expect(this.locators.cartItems).toHaveCount(1);
    await expect(this.locators.itemNames).toHaveText(name, {
      ignoreCase: true,
    });
  }

  async proceedToCheckout(): Promise<void> {
    await this.locators.proceedToCheckoutButton.click();
  }
}
