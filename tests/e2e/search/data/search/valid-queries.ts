export interface ValidQueryRow {
  id: string;
  testId: string;
  query: string;
  /** Expected text of the results counter. */
  counter: string;
  /** Expected product ids in relevance order. */
  productIds: number[];
  /** Row relies on the fuzzy matching of the site (observed behaviour, not a business rule). */
  fuzzy?: boolean;
}

const MUGS = [19, 6, 7, 8, 15];
const ART = [3, 4, 5, 12, 13, 14];
const FIVE = 'There are 5 products.';

export const validQueries: ValidQueryRow[] = [
  {
    id: 'V-01',
    testId: 'E2E-0101',
    query: 'Customizable mug',
    counter: 'There is 1 product.',
    productIds: [19],
  },
  {
    id: 'V-02',
    testId: 'E2E-0102',
    query: 'Mug The best is yet to come',
    counter: 'There is 1 product.',
    productIds: [6],
  },
  {
    id: 'V-03',
    testId: 'E2E-0103',
    query: 'hummingbird printed t-shirt',
    counter: 'There is 1 product.',
    productIds: [1],
  },
  {
    id: 'V-04',
    testId: 'E2E-0104',
    query: 'mug',
    counter: FIVE,
    productIds: MUGS,
  },
  {
    id: 'V-05',
    testId: 'E2E-0105',
    query: 'MUG',
    counter: FIVE,
    productIds: MUGS,
  },
  {
    id: 'V-06',
    testId: 'E2E-0106',
    query: 'Mug',
    counter: FIVE,
    productIds: MUGS,
  },
  {
    id: 'V-07',
    testId: 'E2E-0107',
    query: '  mug',
    counter: FIVE,
    productIds: MUGS,
  },
  {
    id: 'V-08',
    testId: 'E2E-0108',
    query: 'mug  ',
    counter: FIVE,
    productIds: MUGS,
  },
  {
    id: 'V-09',
    testId: 'E2E-0109',
    query: '  mug  ',
    counter: FIVE,
    productIds: MUGS,
  },
  {
    id: 'V-10',
    testId: 'E2E-0110',
    query: 'cushion',
    counter: 'There are 3 products.',
    productIds: [9, 10, 11],
  },
  {
    id: 'V-11',
    testId: 'E2E-0111',
    query: 'Cushion',
    counter: 'There are 3 products.',
    productIds: [9, 10, 11],
  },
  {
    id: 'V-12',
    testId: 'E2E-0112',
    query: 'art',
    counter: 'There are 6 products.',
    productIds: ART,
  },
  {
    id: 'V-13',
    testId: 'E2E-0113',
    query: 'ART',
    counter: 'There are 6 products.',
    productIds: ART,
  },
  {
    id: 'V-14',
    testId: 'E2E-0114',
    query: 'poster',
    counter: 'There are 4 products.',
    productIds: [3, 4, 5, 15],
  },
  {
    id: 'V-15',
    testId: 'E2E-0115',
    query: 'framed',
    counter: 'There are 4 products.',
    productIds: [3, 4, 5, 15],
  },
  {
    id: 'V-16',
    testId: 'E2E-0116',
    query: 'hummingbird',
    counter: FIVE,
    productIds: [1, 11, 2, 14, 18],
  },
  {
    id: 'V-17',
    testId: 'E2E-0117',
    query: 'T-SHIRT',
    counter: 'There is 1 product.',
    productIds: [1],
  },
  {
    id: 'V-18',
    testId: 'E2E-0118',
    query: 'sweater',
    counter: 'There is 1 product.',
    productIds: [2],
  },
  {
    id: 'V-19',
    testId: 'E2E-0119',
    query: 'notebook',
    counter: 'There are 3 products.',
    productIds: [16, 17, 18],
  },
  {
    id: 'V-20',
    testId: 'E2E-0120',
    query: 'bear',
    counter: 'There are 3 products.',
    productIds: [10, 13, 17],
  },
  {
    id: 'V-21',
    testId: 'E2E-0121',
    query: 'mug the best',
    counter: 'There is 1 product.',
    productIds: [6],
  },
  {
    id: 'V-22',
    testId: 'E2E-0122',
    query: 'pack mug + framed poster',
    counter: 'There is 1 product.',
    productIds: [15],
  },
  {
    id: 'V-23',
    testId: 'E2E-0123',
    query: 'accessories',
    counter: 'There are 8 products.',
    productIds: [6, 7, 8, 9, 10, 11, 15, 19],
  },
  {
    id: 'V-24',
    testId: 'E2E-0124',
    query: 'home',
    counter: 'There are 11 products.',
    productIds: [6, 7, 8, 9, 10, 11, 15, 19, 16, 17, 18],
  },
  {
    id: 'V-25',
    testId: 'E2E-0125',
    query: 'clothes',
    counter: 'There are 9 products.',
    productIds: [3, 4, 5, 12, 13, 14, 16, 17, 18],
  },
  {
    id: 'V-26',
    testId: 'E2E-0126',
    query: 'summer',
    counter: 'There is 1 product.',
    productIds: [19],
  },
  {
    id: 'V-27',
    testId: 'E2E-0127',
    query: 'muug',
    counter: FIVE,
    productIds: MUGS,
    fuzzy: true,
  },
  {
    id: 'V-28',
    testId: 'E2E-0128',
    query: 'mugg',
    counter: FIVE,
    productIds: MUGS,
    fuzzy: true,
  },
];
