// spec: specs/search.md (Scenario 4)
// seed: tests/seed.spec.ts
import { test } from '../../fixtures';
import { autocompleteRows } from './data/search/autocomplete';

test.describe('Search - autocomplete', () => {
  for (const row of autocompleteRows) {
    test(
      `[${row.testId}] ${row.id} ${row.description}`,
      { tag: ['@e2e', '@search', '@autocomplete'] },
      async ({ searchPage }) => {
        await test.step('Open the home page', async () => {
          await searchPage.open();
        });

        await test.step(`Type the query "${row.query}" key by key`, async () => {
          await searchPage.typeQuery(row.query);
        });

        await test.step('Verify the autocomplete dropdown', async () => {
          if (row.suggestions.length > 0) {
            await searchPage.expectSuggestions(row.suggestions);
          } else {
            await searchPage.expectNoSuggestions();
            await searchPage.expectNoSuggestionsMessage();
          }
        });
      },
    );
  }
});
