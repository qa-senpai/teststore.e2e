import { expect, Page } from "@playwright/test";
import { BasePage } from "../BasePage";
import { ProductPageLocators } from "./ProductPageLocators";

export class ProductPage extends BasePage {
  url = "/index.php?id_category=2&controller=category";

  private readonly locators: ProductPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new ProductPageLocators(page);
  }

  /** Opens the first product of the catalogue and returns its name. */
  async openFirstProduct(): Promise<string> {
    await this.open();
    await this.locators.categoryProductLinks.first().click();
    await expect(this.page).toHaveURL(/controller=product|\.html/);
    await expect(this.locators.productTitle).toBeVisible();
    return (await this.locators.productTitle.innerText()).trim();
  }

  async addToCart(): Promise<void> {
    await this.locators.addToCartButton.click();
  }

  async expectAddedToCartModal(): Promise<void> {
    await expect(this.locators.cartModal).toBeVisible();
    await expect(this.locators.cartModalTitle).toContainText(
      "Product successfully added to your shopping cart",
    );
  }

  async proceedToCheckout(): Promise<void> {
    await this.locators.proceedToCheckoutButton.click();
  }
}
