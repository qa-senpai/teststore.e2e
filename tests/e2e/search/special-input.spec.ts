// spec: specs/search.md
// seed: tests/seed.spec.ts
import type { Page, Response } from '@playwright/test';
import { test, expect } from '../../fixtures';
import {
  SQL_INJECTION_QUERY,
  specialInputRows,
} from './data/search/special-input';

const isSearchResponse = (response: Response) =>
  response.url().includes('controller=search') &&
  response.request().resourceType() === 'document';

/** Records any dialog (alert/confirm/prompt) and dismisses it so the page does not hang. */
function trackDialogs(page: Page): string[] {
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    await dialog.dismiss();
  });
  return dialogs;
}

test.describe('Search - special and boundary input', () => {
  for (const row of specialInputRows) {
    test(
      `[${row.testId}] ${row.id} ${row.description}`,
      {
        tag: [
          '@e2e',
          '@search',
          '@negative',
          ...(row.security ? ['@security'] : []),
          ...(row.fuzzy ? ['@fuzzy'] : []),
        ],
      },
      async ({ page, searchPage }) => {
        const dialogs = trackDialogs(page);

        await test.step('Open the home page as an anonymous user', async () => {
          await searchPage.open();
        });

        const response =
          await test.step(`Submit the query ${JSON.stringify(row.query.slice(0, 40))} with Enter`, async () => {
            const responsePromise = page.waitForResponse(isSearchResponse);
            await searchPage.search(row.query);
            return responsePromise;
          });

        await test.step(`The search responds with HTTP ${row.httpStatus}`, async () => {
          expect(response.status()).toBe(row.httpStatus);
        });

        await test.step('Verify the outcome', async () => {
          const { outcome } = row;
          switch (outcome.type) {
            case 'no-matches':
              await searchPage.expectResultsPage();
              await searchPage.expectNoMatches();
              break;
            case 'counter':
              await searchPage.expectResultsPage();
              await searchPage.expectCounter(outcome.counter);
              if (outcome.productIds)
                await searchPage.expectProductIds(outcome.productIds);
              break;
            case 'error-503':
              await expect(page).toHaveTitle('503 Service Unavailable');
              break;
          }
        });

        if (row.expectedInputValue !== null) {
          await test.step('The search box keeps the literal query text', async () => {
            await searchPage.expectQueryValue(row.expectedInputValue as string);
          });

          await test.step('No HTML from the query is injected into the page', async () => {
            await searchPage.expectNoInjectedElements();
          });
        }

        await test.step('No dialog was raised by the query', async () => {
          expect(dialogs).toEqual([]);
        });
      },
    );
  }

  test(
    '[E2E-0336] catalog is intact after SQL-injection input',
    { tag: ['@e2e', '@search', '@negative', '@security'] },
    async ({ page, searchPage }) => {
      const dialogs = trackDialogs(page);

      await test.step('Open the home page as an anonymous user', async () => {
        await searchPage.open();
      });

      await test.step('Search for the SQL-injection string', async () => {
        await searchPage.search(SQL_INJECTION_QUERY);
        await searchPage.expectResultsPage();
        await searchPage.expectCounter('There is 1 product.');
        await searchPage.expectQueryValue(SQL_INJECTION_QUERY);
      });

      await test.step('Search for "mug" in the same session and get all 5 mugs', async () => {
        await searchPage.search('mug');
        await searchPage.expectCounter('There are 5 products.');
        await searchPage.expectProductIds([19, 6, 7, 8, 15]);
        await searchPage.expectQueryValue('mug');
      });

      await test.step('No dialog was raised', async () => {
        expect(dialogs).toEqual([]);
      });
    },
  );
});
