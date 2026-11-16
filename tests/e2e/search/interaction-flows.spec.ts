// spec: specs/search.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../fixtures';

const MUG_SUGGESTIONS = [
  'Customizable mug',
  'Mug The best is yet to come',
  'Mug The adventure begins',
  'Mug Today is a good day',
  'Pack Mug + Framed poster',
];
const MUG_PRODUCT_IDS = [19, 6, 7, 8, 15];

test.describe('Search - interaction flows', () => {
  test.beforeEach(async ({ searchPage }) => {
    await test.step('Open the store home page as a fresh anonymous user', async () => {
      await searchPage.open();
    });
  });

  test(
    '[E2E-0501] Clicking an autocomplete suggestion opens the product page',
    { tag: ['@e2e', '@search', '@autocomplete'] },
    async ({ page, searchPage }) => {
      await test.step('Click the header search box and type `mug` (character by character)', async () => {
        await searchPage.typeQuery('mug');
      });

      await test.step('Wait for the dropdown with 5 suggestions', async () => {
        await searchPage.expectSuggestions(MUG_SUGGESTIONS);
      });

      await test.step('Click the suggestion `Mug Today is a good day`', async () => {
        await searchPage.selectSuggestion('Mug Today is a good day');
        await expect(page).toHaveURL(
          /index\.php\?id_product=8&rewrite=mug-today-is-a-good-day&controller=product/,
        );
        await expect(page).toHaveTitle('Mug Today is a good day');
        await searchPage.expectProductPage('Mug Today is a good day');
        await searchPage.expectNoSuggestions();
      });
    },
  );

  test(
    '[E2E-0502] Keyboard selection of a suggestion',
    { tag: ['@e2e', '@search', '@autocomplete'] },
    async ({ page, searchPage }) => {
      await test.step('Type `mug` in the header search box and wait for the dropdown', async () => {
        await searchPage.typeQuery('mug');
        await searchPage.expectSuggestions(MUG_SUGGESTIONS);
      });

      await test.step('Press ArrowDown twice, then Enter', async () => {
        await searchPage.pressKey('ArrowDown', 2);
        await searchPage.submit();
        await expect(page).toHaveURL(
          /id_product=6&rewrite=mug-the-best-is-yet-to-come&controller=product/,
        );
        await searchPage.expectProductPage('Mug The best is yet to come');
        await expect(page).not.toHaveURL(/controller=search/);
      });
    },
  );

  test(
    '[E2E-0503] Submit with the Enter key',
    { tag: ['@e2e', '@search'] },
    async ({ page, searchPage }) => {
      await test.step('Fill `cushion` in the search box and press Enter', async () => {
        await searchPage.search('cushion');
      });

      await test.step('Verify the results page for `cushion`', async () => {
        await expect(page).toHaveURL(
          /index\.php\?controller=search&s=cushion$/,
        );
        await searchPage.expectResultsPage();
        await searchPage.expectCounter('There are 3 products.');
        await searchPage.expectQueryValue('cushion');
      });
    },
  );

  test(
    '[E2E-0504] Clicking the search icon does not submit (observed behaviour)',
    { tag: ['@e2e', '@search', '@known-issue'] },
    async ({ page, searchPage }) => {
      await test.step('Fill `cushion` in the search box without pressing Enter', async () => {
        await searchPage.typeQuery('cushion');
        await searchPage.expectQueryValue('cushion');
      });

      await test.step('Click the search icon: nothing is submitted', async () => {
        await searchPage.clickSearchIcon();
        await expect(page).toHaveURL(/index\.php$/);
        await expect(page.locator('#js-product-list-header')).toHaveCount(0);
        await searchPage.expectQueryValue('cushion');
      });
    },
  );

  test(
    '[E2E-0505] Search term is kept after submit and after navigating back',
    { tag: ['@e2e', '@search'] },
    async ({ page, searchPage }) => {
      await test.step('Search for `Mug` (capital M) with Enter', async () => {
        await searchPage.search('Mug');
      });

      await test.step('Verify the search box on the results page contains exactly `Mug`', async () => {
        await searchPage.expectResultsPage();
        await searchPage.expectQueryValue('Mug');
      });

      await test.step('Open a result and use the browser Back button', async () => {
        await page
          .locator('#js-product-list article.product-miniature')
          .filter({ hasText: 'Customizable mug' })
          .getByRole('link', { name: 'Customizable mug' })
          .first()
          .click();
        await searchPage.expectProductPage('Customizable mug');
        await page.goBack();
      });

      await test.step('Verify the results page is shown again with the term kept', async () => {
        await searchPage.expectResultsPage();
        await searchPage.expectCounter('There are 5 products.');
        await searchPage.expectQueryValue('Mug');
      });
    },
  );

  test(
    '[E2E-0506] Search from a non-home page',
    { tag: ['@e2e', '@search'] },
    async ({ page, searchPage }) => {
      await test.step('Open the `Art` category from the home page', async () => {
        await page.getByRole('link', { name: 'Art' }).first().click();
        await expect(page).toHaveURL(/id_category=9&controller=category/);
      });

      await test.step('Type `mug` in the header search box and press Enter', async () => {
        await searchPage.search('mug');
      });

      await test.step('Verify the search ignores the current category', async () => {
        await searchPage.expectResultsPage();
        await searchPage.expectCounter('There are 5 products.');
        await searchPage.expectProductIds(MUG_PRODUCT_IDS);
      });
    },
  );

  test(
    '[E2E-0507] Searching again from the "no matches" page',
    { tag: ['@e2e', '@search'] },
    async ({ page, searchPage }) => {
      await test.step('Search for `xyzzyqwerty` and see the "no matches" page', async () => {
        await searchPage.search('xyzzyqwerty');
        await searchPage.expectResultsPage();
        await searchPage.expectNoMatches();
      });

      await test.step('Replace the text in the HEADER search box with `mug` and press Enter', async () => {
        await searchPage.search('mug');
      });

      await test.step('Verify the results page and that the "No matches" block is gone', async () => {
        await expect(page).toHaveURL(/controller=search&s=mug$/);
        await searchPage.expectCounter('There are 5 products.');
        await searchPage.expectProductIds(MUG_PRODUCT_IDS);
        await searchPage.expectNoMatchesGone();
      });
    },
  );

  test(
    '[E2E-0508] Direct URL access',
    { tag: ['@e2e', '@search'] },
    async ({ page, searchPage }) => {
      await test.step('Open the search results URL for `mug` directly', async () => {
        await searchPage.openResults('mug');
      });

      await test.step('Verify the same results as typing `mug`', async () => {
        await searchPage.expectResultsPage();
        await searchPage.expectCounter('There are 5 products.');
        await searchPage.expectProductIds(MUG_PRODUCT_IDS);
        await searchPage.expectQueryValue('mug');
      });

      await test.step('Open the search URL without a query', async () => {
        await page.goto('/index.php?controller=search');
      });

      await test.step('Verify the "No matches were found" page is shown', async () => {
        await searchPage.expectResultsPage();
        await searchPage.expectNoMatches();
      });
    },
  );
});
