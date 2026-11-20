export interface NoResultsRow {
  id: string;
  testId: string;
  query: string;
  type: string;
}

// Queries that return the "No matches were found for your search" page (specs/search.md, scenario 2).
export const noResultsRows: NoResultsRow[] = [
  {
    id: 'N-01',
    testId: 'E2E-0201',
    query: 'xyzzyqwerty',
    type: 'nonsense string',
  },
  {
    id: 'N-02',
    testId: 'E2E-0202',
    query: 'qwertyuiop',
    type: 'nonsense string',
  },
  {
    id: 'N-03',
    testId: 'E2E-0203',
    query: 'nonexistentproduct',
    type: 'nonsense words',
  },
  { id: 'N-04', testId: 'E2E-0204', query: '1', type: 'digits only, 1 char' },
  { id: 'N-05', testId: 'E2E-0205', query: '10', type: 'digits only, 2 chars' },
  { id: 'N-06', testId: 'E2E-0206', query: '-1', type: 'digits with sign' },
  {
    id: 'N-07',
    testId: 'E2E-0207',
    query: '20250101',
    type: 'digits only, 8 chars',
  },
  {
    id: 'N-08',
    testId: 'E2E-0208',
    query: '9876543210',
    type: 'digits only, 10 chars',
  },
  {
    id: 'N-09',
    testId: 'E2E-0209',
    query: 'mug OR 1=1',
    type: 'valid word + operator text',
  },
  { id: 'N-10', testId: 'E2E-0210', query: 'mu g', type: 'split word' },
];
