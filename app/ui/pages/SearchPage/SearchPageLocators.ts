import { Locator, Page } from '@playwright/test';

// The site has no data-test attributes, so ids/classes/names are used (see specs/search.md).
export class SearchPageLocators {
  readonly searchInput: Locator;
  readonly searchIcon: Locator;
  readonly autocompleteList: Locator;
  readonly autocompleteItems: Locator;
  readonly autocompleteStatus: Locator;
  readonly resultsHeading: Locator;
  readonly resultsCounter: Locator;
  readonly productCards: Locator;
  readonly noMatchesBlock: Locator;
  readonly noMatchesTitle: Locator;
  readonly productTitle: Locator;
  readonly injectedElements: Locator;

  constructor(page: Page) {
    const widget = page.locator('#search_widget');
    // The "no matches" page has a second input[name="s"] inside #search_widget (content area); the header one is first.
    this.searchInput = widget.locator('input[name="s"]').first();
    this.searchIcon = widget.locator('i.search');
    this.autocompleteList = page.locator('ul.ui-autocomplete');
    this.autocompleteItems = page.locator('ul.ui-autocomplete li.ui-menu-item');
    this.autocompleteStatus = widget.locator('[role="status"]');
    this.resultsHeading = page.locator('#js-product-list-header');
    this.resultsCounter = page.locator(
      '#js-product-list-top .total-products p',
    );
    this.productCards = page.locator(
      '#js-product-list article.product-miniature',
    );
    this.noMatchesBlock = page.locator('section#content.page-not-found');
    this.noMatchesTitle = page.locator('#product-search-no-matches');
    this.productTitle = page.locator('h1');
    // Elements that would only exist if markup from the query were rendered unescaped.
    this.injectedElements = page.locator(
      '#js-product-list-top b, img[src="x"], #main script',
    );
  }
}
