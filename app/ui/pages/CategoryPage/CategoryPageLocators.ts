import { Locator, Page } from '@playwright/test';

// The site has no data-test attributes, so ids/classes/names are used.
export class CategoryPageLocators {
  readonly headerMenu: Locator;
  readonly heading: Locator;
  readonly counter: Locator;
  readonly productCards: Locator;
  readonly cardTitles: Locator;
  readonly cardPrices: Locator;
  readonly sortDropdownToggle: Locator;
  readonly sortSelected: Locator;
  readonly productPageTitle: Locator;

  constructor(page: Page) {
    this.headerMenu = page.locator('#_desktop_top_menu #top-menu');
    this.heading = page.locator('#js-product-list-header h1');
    this.counter = page.locator('#js-product-list-top .total-products p');
    this.productCards = page.locator(
      '#js-product-list article.product-miniature',
    );
    this.cardTitles = this.productCards.locator('.product-title');
    this.cardPrices = this.productCards.locator('.price');
    this.sortDropdownToggle = page.locator(
      '#js-product-list-top .products-sort-order .select-title',
    );
    this.sortSelected = this.sortDropdownToggle;
    this.productPageTitle = page.locator('h1');
  }
}
