// spec: specs/search.md
// seed: tests/seed.spec.ts
import { test, expect } from '../../fixtures';
import { noResultsRows } from './data/search/no-results';

test.describe('Search - no results', () => {
  for (const row of noResultsRows) {
    test(
      `[${row.testId}] ${row.id} ${row.query} (${row.type})`,
      { tag: ['@e2e', '@search'] },
      async ({ page, searchPage }) => {
        await test.step('Open the home page as an anonymous user', async () => {
          await searchPage.open();
        });

        await test.step(`Search for "${row.query}" and press Enter`, async () => {
          const [response] = await Promise.all([
            page.waitForResponse(
              (res) =>
                res.url().includes('controller=search') &&
                res.request().resourceType() === 'document',
            ),
            searchPage.search(row.query),
          ]);
          expect(response.status()).toBe(200);
        });

        await test.step('Verify the results page shows the "no matches" message', async () => {
          await searchPage.expectResultsPage();
          await searchPage.expectNoMatches();
        });

        await test.step('Verify the search box keeps the typed query', async () => {
          await searchPage.expectQueryValue(row.query);
        });
      },
    );
  }
});
