import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { CategoryPageLocators } from './CategoryPageLocators';

const escapeRegExp = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePrice = (text: string): number =>
  Number(text.replace(/[^0-9.]/g, ''));

export class CategoryPage extends BasePage {
  url = '/index.php?id_category=3&controller=category';

  private readonly locators: CategoryPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new CategoryPageLocators(page);
  }

  async openHome(): Promise<void> {
    await this.page.goto('/index.php');
  }

  async openById(id: number): Promise<void> {
    await this.page.goto(`/index.php?id_category=${id}&controller=category`);
  }

  /** Hovers the top-level header menu entry and clicks it. */
  async openFromMenu(name: string): Promise<void> {
    const link = this.locators.headerMenu.getByRole('link', {
      name,
      exact: true,
    });
    await link.hover();
    await link.click();
  }

  async sortBy(option: string): Promise<void> {
    await this.locators.sortDropdownToggle.click();
    await this.page.getByRole('link', { name: option, exact: true }).click();
  }

  private async cardNames(): Promise<string[]> {
    return this.locators.cardTitles
      .allTextContents()
      .then((names) => names.map((name) => name.trim()));
  }

  private async cardPriceValues(): Promise<number[]> {
    const prices = await this.locators.cardPrices.allTextContents();
    return prices.map(parsePrice);
  }

  async getCardCount(): Promise<number> {
    await expect(this.locators.productCards.first()).toBeVisible();
    return this.locators.productCards.count();
  }

  // ---- assertions ----

  async expectCategoryPage(id: number, heading: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`id_category=${id}(&|$)`));
    await expect(this.locators.heading).toHaveText(heading, {
      ignoreCase: true,
    });
  }

  /** The "There are N products." text must agree with the cards shown. */
  async expectCounterMatchesCards(): Promise<void> {
    await expect(this.locators.productCards.first()).toBeVisible();
    await expect
      .poll(async () => {
        const count = await this.locators.productCards.count();
        const text = (await this.locators.counter.textContent()) ?? '';
        return text.trim() === `There are ${count} products.` ||
          (count === 1 && text.trim() === 'There is 1 product.')
          ? count
          : -1;
      })
      .toBeGreaterThan(0);
  }

  async expectCardsHaveNameAndPrice(): Promise<void> {
    await expect(this.locators.productCards.first()).toBeVisible();
    const count = await this.locators.productCards.count();
    await expect(this.locators.cardTitles).toHaveCount(count);
    await expect(this.locators.cardPrices).toHaveCount(count);
    for (const name of await this.cardNames()) {
      expect(name).not.toBe('');
    }
    for (const price of await this.locators.cardPrices.allTextContents()) {
      expect(price.trim()).toMatch(/^\$\d+\.\d{2}$/);
    }
  }

  async expectCardCount(count: number): Promise<void> {
    await expect(this.locators.productCards).toHaveCount(count);
  }

  /** Sync point of the ajax refresh: URL and dropdown label both reflect the sort. */
  async expectSortApplied(order: string, label: string): Promise<void> {
    await expect(this.page).toHaveURL(
      new RegExp(`order=${escapeRegExp(order)}`),
    );
    await expect(this.locators.sortSelected).toContainText(label);
  }

  async expectPricesSorted(direction: 'asc' | 'desc'): Promise<void> {
    await expect
      .poll(async () => {
        const prices = await this.cardPriceValues();
        return (
          prices.length > 0 &&
          prices.every((price, i) =>
            i === 0
              ? true
              : direction === 'asc'
                ? prices[i - 1] <= price
                : prices[i - 1] >= price,
          )
        );
      })
      .toBe(true);
  }

  async expectNamesAlphabetical(): Promise<void> {
    await expect
      .poll(async () => {
        const names = (await this.cardNames()).map((name) =>
          name.toLowerCase(),
        );
        return (
          names.length > 0 &&
          names.every(
            (name, i) => i === 0 || names[i - 1].localeCompare(name, 'en') <= 0,
          )
        );
      })
      .toBe(true);
  }

  // ---- product navigation ----

  /** Opens the first card and returns its title as shown on the card. */
  async openFirstProduct(): Promise<string> {
    const first = this.locators.cardTitles.first();
    await expect(first).toBeVisible();
    const title = ((await first.textContent()) ?? '').trim();
    await first.getByRole('link').click();
    return title;
  }

  /** Card titles may be truncated with "...", so compare the prefix only. */
  async expectProductPage(cardTitle: string): Promise<void> {
    await expect(this.page).toHaveURL(/controller=product/);
    const prefix = cardTitle.split('...')[0].trim();
    await expect(this.locators.productPageTitle).toHaveText(
      new RegExp(`^${escapeRegExp(prefix)}`, 'i'),
    );
  }
}
