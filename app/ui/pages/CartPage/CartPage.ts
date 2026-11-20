import { expect, Locator, Page, Response } from '@playwright/test';
import { BasePage } from '../BasePage';
import { CartPageLocators } from './CartPageLocators';
import { formatUsd, usdToCents } from '../../../utils/moneyFormatter';

export interface CartSummary {
  itemCount: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  taxCents: number;
}

// Quantity changes post to controller=cart&update=1 (or delete=1 when quantity 0 removes the line).
const isCartLineUpdate = (r: Response) =>
  r.url().includes('controller=cart') && /[?&](update|delete)=1/.test(r.url());

/** Parses amounts like "$7.00", "- $10.03" (nbsp) or "Free" into cents. */
const amountToCents = (text: string): number =>
  /\$/.test(text) ? usdToCents(text.replace(/^-\s*/, '').trim()) : 0;

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

  /** Cart line of a product, e.g. `line('Mug The best')`; optional variant attributes narrow it. */
  private line(
    name: string | RegExp,
    attributes?: { size?: string; color?: string },
  ): Locator {
    let line = this.locators.cartItems.filter({
      has: this.page
        .locator('.product-line-info a.label')
        .filter({ hasText: name }),
    });
    const exact = (value: string) => new RegExp(`^\\s*${value}\\s*$`);
    if (attributes?.size) {
      line = line.filter({
        has: this.page
          .locator('.product-line-info.size .value')
          .filter({ hasText: exact(attributes.size) }),
      });
    }
    if (attributes?.color) {
      line = line.filter({
        has: this.page
          .locator('.product-line-info.color .value')
          .filter({ hasText: exact(attributes.color) }),
      });
    }
    return line;
  }

  private quantityInput(name: string | RegExp): Locator {
    return this.line(name).locator('input.js-cart-line-product-quantity');
  }

  async expectLine(
    name: string | RegExp,
    expected: {
      size?: string;
      color?: string;
      quantity?: number;
      unitPrice?: string;
    },
  ): Promise<void> {
    const line = this.line(name, expected);
    await expect(line).toHaveCount(1);
    if (expected.quantity !== undefined) {
      await expect(
        line.locator('input.js-cart-line-product-quantity'),
      ).toHaveValue(String(expected.quantity));
    }
    if (expected.unitPrice) {
      await expect(line.locator('.current-price .price')).toHaveText(
        expected.unitPrice,
      );
    }
  }

  async expectLineAbsent(name: string | RegExp): Promise<void> {
    await expect(this.line(name)).toHaveCount(0);
  }

  async getLineUnitPriceCents(name: string | RegExp): Promise<number> {
    const price = this.line(name).locator('.current-price .price');
    await expect(price).toBeVisible();
    return usdToCents(await price.innerText());
  }

  async getLineQuantity(name: string | RegExp): Promise<number> {
    const input = this.quantityInput(name);
    await expect(input).toBeVisible();
    return Number(await input.inputValue());
  }

  async expectQuantity(name: string | RegExp, quantity: number): Promise<void> {
    await expect(this.quantityInput(name)).toHaveValue(String(quantity));
  }

  async expectLineTotal(
    name: string | RegExp,
    totalCents: number,
  ): Promise<void> {
    await expect(this.line(name).locator('.price .product-price')).toHaveText(
      formatUsd(totalCents),
    );
  }

  /** Types a quantity into the line input and blurs it; waits for the ajax update. */
  async setQuantity(name: string | RegExp, quantity: number): Promise<void> {
    const input = this.quantityInput(name);
    const responsePromise = this.page.waitForResponse(isCartLineUpdate);
    await input.fill(String(quantity));
    await input.press('Tab');
    expect((await responsePromise).status()).toBe(200);
  }

  /** Types text a quantity field cannot hold (no ajax update is expected). */
  async enterInvalidQuantity(
    name: string | RegExp,
    text: string,
  ): Promise<void> {
    const input = this.quantityInput(name);
    await input.click();
    await input.press('ControlOrMeta+a');
    await input.pressSequentially(text);
    await input.press('Tab');
  }

  async changeQuantityWithButton(
    name: string | RegExp,
    direction: 'up' | 'down',
  ): Promise<void> {
    const button = this.line(name).locator(
      direction === 'up'
        ? '.js-increase-product-quantity'
        : '.js-decrease-product-quantity',
    );
    const responsePromise = this.page.waitForResponse(isCartLineUpdate);
    await button.click();
    expect((await responsePromise).status()).toBe(200);
  }

  async removeLine(name: string | RegExp): Promise<void> {
    await this.line(name).locator('a.remove-from-cart').click();
  }

  /** Deletes lines one by one; the number of lines is not fixed (demo may inject extras). */
  async removeAllLines(): Promise<void> {
    let remaining = await this.locators.cartItems.count();
    while (remaining > 0) {
      await this.locators.cartItems
        .first()
        .locator('a.remove-from-cart')
        .click();
      remaining -= 1;
      await expect(this.locators.cartItems).toHaveCount(remaining);
    }
  }

  async readSummary(): Promise<CartSummary> {
    const count = await this.locators.summaryItemCount.innerText();
    const shippingVisible = await this.locators.shippingLine.isVisible();
    return {
      itemCount: Number(/\d+/.exec(count)?.[0]),
      subtotalCents: usdToCents(await this.locators.subtotalValue.innerText()),
      discountCents: await this.locators.discountAmount
        .allInnerTexts()
        .then((texts) =>
          texts.reduce((sum, text) => sum + amountToCents(text), 0),
        ),
      shippingCents: shippingVisible
        ? amountToCents(await this.locators.shippingValue.innerText())
        : 0,
      totalCents: usdToCents(await this.locators.totalValue.innerText()),
      taxCents: usdToCents(await this.locators.taxesValue.innerText()),
    };
  }

  async getSubtotalCents(): Promise<number> {
    await expect(this.locators.cartItems.first()).toBeVisible();
    return (await this.readSummary()).subtotalCents;
  }

  async getSummary(): Promise<CartSummary> {
    await expect(this.locators.cartItems.first()).toBeVisible();
    return this.readSummary();
  }

  async expectSubtotal(cents: number): Promise<void> {
    await expect(this.locators.subtotalValue).toHaveText(formatUsd(cents));
  }

  async expectTotal(cents: number): Promise<void> {
    await expect(this.locators.totalValue).toHaveText(formatUsd(cents));
  }

  async expectSummaryItemCount(count: number): Promise<void> {
    await expect(this.locators.summaryItemCount).toHaveText(
      count === 1 ? '1 item' : `${count} items`,
    );
  }

  async expectHeaderCartCount(count: number): Promise<void> {
    await expect(this.locators.headerCartCount).toHaveText(`(${count})`);
  }

  /** Total = subtotal - discounts + shipping and zero taxes, from page values. */
  async expectTotalsConsistent(): Promise<void> {
    await expect
      .poll(async () => {
        const s = await this.readSummary();
        return [
          s.totalCents - (s.subtotalCents - s.discountCents + s.shippingCents),
          s.taxCents,
        ];
      })
      .toEqual([0, 0]);
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.locators.cartItems).toHaveCount(0);
    await expect(this.locators.emptyCartMessage).toHaveText(
      'There are no more items in your cart',
    );
    await expect(this.locators.summaryItemCount).toHaveText('0 items');
    await expect(this.locators.subtotalValue).toHaveText('$0.00');
    await expect(this.locators.shippingLine).toHaveCount(0);
    await expect(this.locators.headerCartCount).toHaveText('(0)');
  }

  async continueShopping(): Promise<void> {
    await this.locators.continueShoppingLink.click();
  }

  async expectHomePage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(index\.php)?$/);
  }

  /** Removes a voucher the demo may have pre-applied (shared quirk). */
  async removeAppliedVouchers(): Promise<void> {
    let remaining = await this.locators.voucherLines.count();
    while (remaining > 0) {
      await this.locators.voucherRemoveLinks.first().click();
      remaining -= 1;
      await expect(this.locators.voucherLines).toHaveCount(remaining);
    }
    await expect(this.locators.discountLine).toHaveCount(0);
  }

  async expectNoDiscount(): Promise<void> {
    await expect(this.locators.discountLine).toHaveCount(0);
    await expect(this.locators.voucherLines).toHaveCount(0);
  }

  async expectPromoLinkVisible(): Promise<void> {
    await expect(this.locators.promoLink).toBeVisible();
  }

  async applyPromoCode(code: string): Promise<void> {
    if (!(await this.locators.promoInput.isVisible())) {
      await this.locators.promoLink.click();
    }
    await expect(this.locators.promoInput).toBeVisible();
    await this.locators.promoInput.fill(code);
    await this.locators.promoAddButton.click();
  }

  async expectPromoError(message: string): Promise<void> {
    await expect(this.locators.promoError).toHaveText(message);
  }

  async removeVoucher(): Promise<void> {
    await this.locators.voucherRemoveLinks.first().click();
  }

  async expectVoucherApplied(code: string): Promise<void> {
    await expect(this.locators.discountLine).toBeVisible();
    await expect(this.locators.voucherLines).toContainText([code]);
  }

  async expectVoucherRemoved(): Promise<void> {
    await expect(this.locators.discountLine).toHaveCount(0);
    await expect(this.locators.voucherLines).toHaveCount(0);
  }

  /** Discount is `percent`% of the subtotal read from the page, rounded to cents. */
  async expectDiscountPercentOf(
    subtotalCents: number,
    percent: number,
  ): Promise<void> {
    const expected = Math.round((subtotalCents * percent) / 100);
    await expect(this.locators.discountAmount).toHaveText(
      `- ${formatUsd(expected)}`,
    );
    await this.expectTotalsConsistent();
  }
}
