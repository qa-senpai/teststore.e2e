import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { SearchPageLocators } from './SearchPageLocators';

export class SearchPage extends BasePage {
  url = '/index.php';

  private readonly locators: SearchPageLocators;

  constructor(page: Page) {
    super(page);
    this.locators = new SearchPageLocators(page);
  }

  async openResults(query: string): Promise<void> {
    await this.page.goto(
      `/index.php?controller=search&s=${encodeURIComponent(query)}`,
    );
  }

  /** Fills the query and presses Enter (the search icon does not submit). */
  async search(query: string): Promise<void> {
    await this.locators.searchInput.fill(query);
    await this.locators.searchInput.press('Enter');
  }

  /** Types key by key so the autocomplete is triggered. */
  async typeQuery(query: string): Promise<void> {
    await this.locators.searchInput.click();
    await this.locators.searchInput.pressSequentially(query);
  }

  async submit(): Promise<void> {
    await this.locators.searchInput.press('Enter');
  }

  async pressKey(key: string, times = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await this.locators.searchInput.press(key);
    }
  }

  async clickSearchIcon(): Promise<void> {
    await this.locators.searchIcon.click();
  }

  async selectSuggestion(name: string): Promise<void> {
    await this.locators.autocompleteItems.filter({ hasText: name }).click();
  }

  // ---- results page ----

  async expectResultsPage(): Promise<void> {
    await expect(this.page).toHaveURL(/controller=search/);
    await expect(this.locators.resultsHeading).toHaveText(/Search results/i);
  }

  async expectCounter(text: string): Promise<void> {
    await expect(this.locators.resultsCounter).toHaveText(text);
  }

  /** Compares result cards by product id, in relevance order. */
  async expectProductIds(ids: number[]): Promise<void> {
    await expect(this.locators.productCards.first()).toBeVisible();
    const actual = await this.locators.productCards.evaluateAll((cards) =>
      cards.map((card) => Number(card.getAttribute('data-id-product'))),
    );
    expect(actual).toEqual(ids);
  }

  async expectNoMatches(): Promise<void> {
    await expect(this.locators.noMatchesBlock).toBeVisible();
    await expect(this.locators.noMatchesTitle).toHaveText(
      'No matches were found for your search',
    );
    await expect(this.locators.noMatchesBlock).toContainText(
      'Please try other keywords to describe what you are looking for.',
    );
    await expect(this.locators.productCards).toHaveCount(0);
    await expect(this.locators.resultsCounter).toHaveCount(0);
  }

  async expectNoMatchesGone(): Promise<void> {
    await expect(this.locators.noMatchesBlock).toHaveCount(0);
  }

  async expectNoInjectedElements(): Promise<void> {
    await expect(this.locators.injectedElements).toHaveCount(0);
  }

  async expectQueryValue(value: string): Promise<void> {
    await expect(this.locators.searchInput).toHaveValue(value);
  }

  // ---- autocomplete ----

  async expectSuggestions(names: string[]): Promise<void> {
    await expect(this.locators.autocompleteList).toBeVisible();
    await expect(
      this.locators.autocompleteItems.locator('span.product'),
    ).toHaveText(names);
    await expect(this.locators.autocompleteStatus).toHaveText(
      `${names.length} results are available, use up and down arrow keys to navigate.`,
    );
  }

  async expectNoSuggestions(): Promise<void> {
    await expect(this.locators.autocompleteItems.first()).toBeHidden();
  }

  async expectNoSuggestionsMessage(): Promise<void> {
    await expect(this.locators.autocompleteStatus).toHaveText(
      'No search results.',
    );
  }

  async expectProductPage(name: string): Promise<void> {
    await expect(this.page).toHaveURL(/controller=product/);
    await expect(this.locators.productTitle).toHaveText(name, {
      ignoreCase: true,
    });
  }
}
