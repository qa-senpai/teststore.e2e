// spec: specs/critical-flows.plan.md
import { test } from '../../fixtures';

test.describe('Category browsing', () => {
  test(
    '[E2E-0607] Category navigation lists its products, sorts by price and opens a product page',
    { tag: ['@e2e', '@catalog'] },
    async ({ categoryPage }) => {
      let cardCount = 0;
      let firstCardTitle = '';

      await test.step('From the home page hover the header menu and click Accessories', async () => {
        await categoryPage.openHome();
        await categoryPage.openFromMenu('Accessories');
        await categoryPage.expectCategoryPage(6, 'Accessories');
        await categoryPage.expectCounterMatchesCards();
        await categoryPage.expectCardsHaveNameAndPrice();
        cardCount = await categoryPage.getCardCount();
      });

      await test.step('Choose "Price, low to high" in the Sort by dropdown', async () => {
        await categoryPage.sortBy('Price, low to high');
        await categoryPage.expectSortApplied(
          'product.price.asc',
          'Price, low to high',
        );
        await categoryPage.expectPricesSorted('asc');
      });

      await test.step('Choose "Price, high to low"', async () => {
        await categoryPage.sortBy('Price, high to low');
        await categoryPage.expectSortApplied(
          'product.price.desc',
          'Price, high to low',
        );
        await categoryPage.expectPricesSorted('desc');
        await categoryPage.expectCardCount(cardCount);
      });

      await test.step('Choose "Name, A to Z"', async () => {
        await categoryPage.sortBy('Name, A to Z');
        await categoryPage.expectSortApplied(
          'product.name.asc',
          'Name, A to Z',
        );
        await categoryPage.expectNamesAlphabetical();
      });

      await test.step('Click the first product card', async () => {
        firstCardTitle = await categoryPage.openFirstProduct();
        await categoryPage.expectProductPage(firstCardTitle);
      });

      await test.step('Navigate to the Clothes category', async () => {
        await categoryPage.open();
        await categoryPage.expectCategoryPage(3, 'Clothes');
        await categoryPage.expectCounterMatchesCards();
      });
    },
  );
});
