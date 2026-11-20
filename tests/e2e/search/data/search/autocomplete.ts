export interface AutocompleteRow {
  id: string;
  testId: string;
  description: string;
  query: string;
  /** Product names in dropdown order; empty means the dropdown is not shown. */
  suggestions: string[];
}

const mugSuggestions = [
  'Customizable mug',
  'Mug The best is yet to come',
  'Mug The adventure begins',
  'Mug Today is a good day',
  'Pack Mug + Framed poster',
];

export const autocompleteRows: AutocompleteRow[] = [
  {
    id: 'A-01',
    testId: 'E2E-0401',
    description: 'lower case query "mug"',
    query: 'mug',
    suggestions: mugSuggestions,
  },
  {
    id: 'A-02',
    testId: 'E2E-0402',
    description: 'upper case query "MUG"',
    query: 'MUG',
    suggestions: mugSuggestions,
  },
  {
    id: 'A-03',
    testId: 'E2E-0403',
    description: 'query with leading spaces "  mug"',
    query: '  mug',
    suggestions: mugSuggestions,
  },
  {
    id: 'A-04',
    testId: 'E2E-0404',
    description: 'query with trailing spaces "mug  "',
    query: 'mug  ',
    suggestions: mugSuggestions,
  },
  {
    id: 'A-05',
    testId: 'E2E-0405',
    description: 'query "cushion"',
    query: 'cushion',
    suggestions: [
      'Mountain fox cushion',
      'Brown bear cushion',
      'Hummingbird cushion',
    ],
  },
  {
    id: 'A-06',
    testId: 'E2E-0406',
    description: 'query "art"',
    query: 'art',
    suggestions: [
      "The best is yet to come' Framed poster",
      'The adventure begins Framed poster',
      'Today is a good day Framed poster',
      'Mountain fox - Vector graphics',
      'Brown bear - Vector graphics',
      'Hummingbird - Vector graphics',
    ],
  },
  {
    id: 'A-07',
    testId: 'E2E-0407',
    description: 'query "hummingbird"',
    query: 'hummingbird',
    suggestions: [
      'Hummingbird printed t-shirt',
      'Hummingbird cushion',
      'Hummingbird printed sweater',
      'Hummingbird - Vector graphics',
      'Hummingbird notebook',
    ],
  },
  {
    id: 'A-08',
    testId: 'E2E-0408',
    description: 'HTML markup query "<b>mug</b>"',
    query: '<b>mug</b>',
    suggestions: mugSuggestions,
  },
  {
    id: 'A-09',
    testId: 'E2E-0409',
    description: 'nonsense query "xyzzyqwerty" shows no suggestions',
    query: 'xyzzyqwerty',
    suggestions: [],
  },
  {
    id: 'A-10',
    testId: 'E2E-0410',
    description: 'query below the 3-character minimum "mu"',
    query: 'mu',
    suggestions: [],
  },
  {
    id: 'A-11',
    testId: 'E2E-0411',
    description: 'single character query "a"',
    query: 'a',
    suggestions: [],
  },
];
