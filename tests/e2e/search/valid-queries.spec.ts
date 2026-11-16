// spec: specs/search.md
// seed: tests/seed.spec.ts
import { test } from '@fixtures';
import { validQueries } from './data/search/valid-queries';

test.describe('Search - valid queries', () => {
  for (const row of validQueries) {
    test(
      `[${row.testId}] ${row.id} ${JSON.stringify(row.query)}`,
      { tag: ['@e2e', '@search', ...(row.fuzzy ? ['@fuzzy'] : [])] },
      async ({ searchPage }) => {
        await test.step('Open the home page as an anonymous user', async () => {
          await searchPage.open();
        });

        await test.step(`Submit the query ${JSON.stringify(row.query)} with Enter`, async () => {
          await searchPage.search(row.query);
        });

        await test.step('Verify the search results page', async () => {
          await searchPage.expectResultsPage();
          await searchPage.expectCounter(row.counter);
          await searchPage.expectProductIds(row.productIds);
          await searchPage.expectQueryValue(row.query);
        });
      },
    );
  }
});
