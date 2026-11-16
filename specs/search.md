# Product Search - Test Plan (Data-Driven)

Application: PrestaShop demo store, `https://teststore.automationtesting.co.uk/index.php`
Feature: header search box (`Search our catalog`), autocomplete dropdown and the search results page
(`index.php?controller=search&s=<query>`).

All observed values in this plan were verified against the live site on 2026-11-16.

## Conventions

- **Seed file:** every scenario uses `tests/seed.spec.ts` as its setup. It opens
  `https://teststore.automationtesting.co.uk/index.php` as a fresh anonymous user (new browser context, no cookies,
  no local storage, not signed in, cart empty) and waits for the page to load.
- **DDT:** scenarios 1 to 4 are parameterised. Each data row is one run of the scenario steps (for example one
  Playwright test generated in a `for (const row of rows)` loop). Row IDs (for example `V-03`) are used as test names.
- **Fresh state:** all scenarios are independent and can run in any order. None needs data created by another.
- **Query encoding:** "Submit the query" means type or fill the text into the search box and press Enter (unless the
  scenario says otherwise). The resulting URL is `index.php?controller=search&s=<url-encoded query>`.

## Stable locators discovered (no `data-test` attributes exist)

| Element | Locator | Notes |
|---|---|---|
| Search input | `getByRole('textbox', { name: 'Search' })`, `input[name="s"]`, `#search_widget input[name="s"]` | `aria-label="Search"`, `placeholder="Search our catalog"`, class `ui-autocomplete-input`. **On the "no matches" page there are TWO `input[name="s"]`** (header and the one inside the content area), so scope to `#search_widget` and use `.first()`, or the strict-mode locator will fail. |
| Search widget / form | `#search_widget` (class `search-widgets`), form `GET` to `index.php?controller=search` with a hidden `controller=search` field | |
| Search icon | `#search_widget i.search` (text `search`, `aria-hidden="true"`) | It is an `<i>` icon, **not a button**. Clicking it does NOT submit (see S-02). |
| Clear icon | `#search_widget i.clear` | `display: none` on desktop, not usable. |
| Autocomplete list | `ul.ui-autocomplete` (also `.searchbar-autocomplete`, `#ui-id-1`) | Items: `ul.ui-autocomplete li.ui-menu-item`, each `a` with `img.autocomplete-thumbnail` and `span.product` holding the product name. |
| Autocomplete status (a11y) | `#search_widget [role="status"]` (`.ui-helper-hidden-accessible`) | Text `5 results are available, use up and down arrow keys to navigate.` for `mug`, `No search results.` for nonsense. |
| Results page heading | `#js-product-list-header` (`h1.h2`), text `Search results` (rendered upper-case by CSS) | Page `<title>` is `Search`. Body id `search`, class `page-search`. Breadcrumb: `Home > Search results`. |
| Results counter | `#js-product-list-top .total-products p` | Text `There are N products.` or `There is 1 product.` (singular). |
| Result cards | `#js-product-list article.product-miniature` (attribute `data-id-product`), name in `.product-title a` | Name is CSS-capitalised and visually truncated with `...` for long names, so assert on `data-id-product` or on the product page name, not on the visual text, for the "Framed poster" items. |
| "No matches" block | `section#content.page-not-found`, heading `#product-search-no-matches` (`h4`) | Text: `No matches were found for your search` and paragraph `Please try other keywords to describe what you are looking for.` The results counter (`#js-product-list-top`) does NOT exist on this page. |

## Catalog reference (observed product IDs, used in the data tables)

| ID | Name |
|---|---|
| 1 | Hummingbird printed t-shirt |
| 2 | Hummingbird printed sweater |
| 3 | The best is yet to come' Framed poster |
| 4 | The adventure begins Framed poster |
| 5 | Today is a good day Framed poster |
| 6 | Mug The best is yet to come |
| 7 | Mug The adventure begins |
| 8 | Mug Today is a good day |
| 9 | Mountain fox cushion |
| 10 | Brown bear cushion |
| 11 | Hummingbird cushion |
| 12 | Mountain fox - Vector graphics |
| 13 | Brown bear - Vector graphics |
| 14 | Hummingbird - Vector graphics |
| 15 | Pack Mug + Framed poster |
| 16 | Mountain fox notebook |
| 17 | Brown bear notebook |
| 18 | Hummingbird notebook |
| 19 | Customizable mug |

## Important observations about site behaviour (read before writing assertions)

1. **Fuzzy matching is enabled.** The PrestaShop search is tolerant: typos (`muug`, `mugg`) still return all mugs, and
   unrelated words or digit strings can return products (`12345` returns the 3 notebooks, `zzzzzz` returns the 3 vector
   graphics, `blablabla` returns the 3 cushions). Results are deterministic, so they are recorded below, but the test
   should treat them as "current observed behaviour", not as a business rule. These rows are tagged `[fuzzy]`.
2. **Minimum query length is 3 characters.** Queries of 1 or 2 characters (`a`, `m`, `mu`, `ab`, `7`) return the
   "no matches" page, and the autocomplete does not appear for 2 characters.
3. **"Every result relates to the query"** means: the query appears in the product name, OR in its description or
   category. Example: `art` matches no product name, it matches the `Art` category (Framed posters and Vector
   graphics); `home` and `accessories` match category names.
4. **Query `0` loses its value.** The input is empty on the results page (PHP `empty("0")` behaviour) and the "no
   matches" page is shown.
5. **`<script>` in the query causes `HTTP 503 Service Unavailable`** (server/WAF filter), see scenario 3. Other special
   characters and HTML tags (for example `<b>mug</b>`) are accepted.
6. Whitespace is **trimmed for matching**, but the input keeps the original text (including spaces) on the results page.

---

## Scenario 1 - Valid queries return relevant results (DDT)

**Starting state:** `tests/seed.spec.ts` (home page, fresh anonymous user).

**Steps (per data row):**
1. Click the `Search our catalog` search box in the header.
2. Type the value from the `Query` column (keep leading/trailing spaces exactly as given).
3. Press Enter.
4. Wait for the URL to match `index.php?controller=search&s=`.
5. Verify the heading, counter, product list and input value against the row.

**Expected result for every row:**
- Page heading `Search results` is visible (`#js-product-list-header`) and the page title is `Search`.
- The counter text equals the `Counter` column.
- The set of result cards (compared by product ID, order = relevance) equals the `Expected product IDs` column.
- Every result relates to the query (see observation 3). No "No matches were found" block is shown.
- The search box still contains the exact text typed (including spaces and original case).

| Row | Query | Counter | Expected product IDs (order) | Expected names / note |
|---|---|---|---|---|
| V-01 | `Customizable mug` (full name) | There is 1 product. | 19 | Customizable mug |
| V-02 | `Mug The best is yet to come` (full name) | There is 1 product. | 6 | Mug The best is yet to come |
| V-03 | `hummingbird printed t-shirt` (full name, lower case) | There is 1 product. | 1 | Hummingbird printed t-shirt |
| V-04 | `mug` (partial / category-like) | There are 5 products. | 19, 6, 7, 8, 15 | Customizable mug, Mug The best is yet to come, Mug The adventure begins, Mug Today is a good day, Pack Mug + Framed poster |
| V-05 | `MUG` (upper case) | There are 5 products. | 19, 6, 7, 8, 15 | Same set and order as V-04, input keeps `MUG` |
| V-06 | `Mug` (capitalised) | There are 5 products. | 19, 6, 7, 8, 15 | Same as V-04 |
| V-07 | `  mug` (leading spaces) | There are 5 products. | 19, 6, 7, 8, 15 | Same as V-04, input value remains `  mug` |
| V-08 | `mug  ` (trailing spaces) | There are 5 products. | 19, 6, 7, 8, 15 | Same as V-04 |
| V-09 | `  mug  ` (leading and trailing) | There are 5 products. | 19, 6, 7, 8, 15 | Same as V-04 |
| V-10 | `cushion` | There are 3 products. | 9, 10, 11 | Mountain fox cushion, Brown bear cushion, Hummingbird cushion |
| V-11 | `Cushion` (capitalised) | There are 3 products. | 9, 10, 11 | Same as V-10 |
| V-12 | `art` (category word, matches no product name) | There are 6 products. | 3, 4, 5, 12, 13, 14 | 3 Framed posters + 3 Vector graphics (all in the `Art` category) |
| V-13 | `ART` (upper case) | There are 6 products. | 3, 4, 5, 12, 13, 14 | Same as V-12 |
| V-14 | `poster` | There are 4 products. | 3, 4, 5, 15 | 3 Framed posters + Pack Mug + Framed poster |
| V-15 | `framed` | There are 4 products. | 3, 4, 5, 15 | Same as V-14 |
| V-16 | `hummingbird` | There are 5 products. | t-shirt, cushion, sweater, vector graphics, notebook (relevance order: 1, 11, 2, 14, 18) | Hummingbird printed t-shirt, cushion, printed sweater, Vector graphics, notebook |
| V-17 | `T-SHIRT` | There is 1 product. | 1 | Hummingbird printed t-shirt (hyphen and case tolerated) |
| V-18 | `sweater` | There is 1 product. | 2 | Hummingbird printed sweater |
| V-19 | `notebook` | There are 3 products. | 16, 17, 18 | The 3 notebooks |
| V-20 | `bear` | There are 3 products. | 10, 13, 17 | Brown bear cushion, Brown bear - Vector graphics, Brown bear notebook |
| V-21 | `mug the best` (multi-word partial) | There is 1 product. | 6 | Mug The best is yet to come |
| V-22 | `pack mug + framed poster` (full name with `+`) | There is 1 product. | 15 | Pack Mug + Framed poster |
| V-23 | `accessories` (category word) | There are 8 products. | 6, 7, 8, 9, 10, 11, 15, 19 | All Home Accessories products (mugs, cushions, pack) |
| V-24 | `home` (category word) | There are 11 products. | 6, 7, 8, 9, 10, 11, 15, 19, 16, 17, 18 | Home Accessories products incl. notebooks |
| V-25 | `clothes` (category word) | There are 9 products. | 3, 4, 5, 12, 13, 14, 16, 17, 18 | Observed set; the site matches by description/category here |
| V-26 | `summer` (description word) | There is 1 product. | 19 | Customizable mug |
| V-27 | `muug` `[fuzzy]` (typo) | There are 5 products. | 19, 6, 7, 8, 15 | Typo still returns all mugs |
| V-28 | `mugg` `[fuzzy]` (typo) | There are 5 products. | 19, 6, 7, 8, 15 | Typo still returns all mugs |

**Success criteria:** all assertions above hold for every row.
**Failure conditions:** a row returns a different count or product set, a product unrelated to the query appears
(other than documented `[fuzzy]` rows), the counter uses the wrong singular/plural form, or the input value is changed
or cleared.

---

## Scenario 2 - Queries with no results show the "no matches" message (DDT)

**Starting state:** `tests/seed.spec.ts`.

**Steps (per data row):**
1. Click the search box in the header and type the `Query` value.
2. Press Enter.
3. Wait for `index.php?controller=search&s=`.

**Expected result for every row:**
- Page heading `Search results` is shown.
- `section#content.page-not-found` is visible with the heading `No matches were found for your search` and the text
  `Please try other keywords to describe what you are looking for.`
- No product cards are present and no `There are N products.` counter is shown.
- No error, no HTTP error status (page loads with HTTP 200), no console errors.
- The header search box contains the typed query.

| Row | Query | Type | Expected outcome |
|---|---|---|---|
| N-01 | `xyzzyqwerty` | nonsense string | No matches message |
| N-02 | `qwertyuiop` | nonsense string | No matches message |
| N-03 | `nonexistentproduct` | nonsense words | No matches message |
| N-04 | `1` | digits only, 1 char | No matches message |
| N-05 | `10` | digits only, 2 chars | No matches message |
| N-06 | `-1` | digits with sign | No matches message |
| N-07 | `20250101` | digits only (8) | No matches message |
| N-08 | `9876543210` | digits only (10) | No matches message |
| N-09 | `mug OR 1=1` | valid word + operator text | No matches message (multi-term AND behaviour) |
| N-10 | `mu g` | split word | No matches message |

**Note on digits:** some digit strings DO return products because of fuzzy search (`12345` returns the 3 notebooks,
`2024`/`123`/`1=1` return the 3 notebooks, `99999` returns the 3 Mug items 6, 7, 8, `000`/`0000` return 4 products,
`555555` returns 4 mugs, `3.14` returns the 5 mugs). A separate small DDT table `[fuzzy-digits]` may be used to pin
these as observed behaviour, but they must not be used as "no result" examples.

**Success criteria:** every row shows the exact no-matches message above. **Failure conditions:** products are listed,
the message text differs, or an error page is displayed.

---

## Scenario 3 - Special and boundary input is handled safely (DDT)

**Starting state:** `tests/seed.spec.ts`.

**Steps (per data row):**
1. Click the search box in the header and fill the `Query` value (use `fill`, not key-by-key typing, for long values).
2. Press Enter.
3. Record the HTTP status, page title, counter / message and the input value.
4. Verify no script executed (no `alert` dialog was raised) and no injected element exists in the page
   (for example `document.querySelectorAll('#js-product-list-top b, img[src="x"], #main script').length === 0`).

**Expected result for every row:** no crash or stack trace, no unescaped reflection of the query in the page markup,
the header and navigation still render, unless the row says `503`.

| Row | Query | HTTP | Observed outcome | Input value after submit |
|---|---|---|---|---|
| S-01 | `` (empty, Enter on empty box) | 200 | URL becomes `...&s=`, heading `Search results` + "No matches were found for your search" | empty |
| S-02 | `   ` (3 spaces) | 200 | "No matches were found for your search" | `   ` (spaces kept) |
| S-03 | `a` (1 char) | 200 | "No matches were found for your search" | `a` |
| S-04 | `m` (1 char) | 200 | "No matches were found for your search" | `m` |
| S-05 | `ab` (2 chars) | 200 | "No matches were found for your search" | `ab` |
| S-06 | `abc` (3 chars, boundary) `[fuzzy]` | 200 | There are 6 products. (IDs 3, 4, 5, 12, 13, 14) | `abc` |
| S-07 | `0` | 200 | "No matches were found for your search" | **empty** (value `0` is dropped) |
| S-08 | `a` repeated 300 times | 200 | "No matches were found for your search", page intact | first characters retained in input |
| S-09 | `mug` repeated 700 times (2100 chars) | 200 | "No matches were found for your search", no 414/500 error | value retained |
| S-10 | `<` | 200 | "No matches were found for your search" | `<` (shown as text) |
| S-11 | `>` | 200 | "No matches were found for your search" | `>` |
| S-12 | `'` | 200 | "No matches were found for your search" | `'` |
| S-13 | `"` | 200 | "No matches were found for your search" | `"` |
| S-14 | `%` | 200 | "No matches were found for your search" | `%` |
| S-15 | `%%` | 200 | "No matches were found for your search" | `%%` |
| S-16 | `&` | 200 | "No matches were found for your search" | `&` |
| S-17 | `\` | 200 | "No matches were found for your search" | `\` |
| S-18 | `*` | 200 | "No matches were found for your search" | `*` |
| S-19 | `mug&x=1` (ampersand inside term) | 200 | There are 5 products. (mugs) | `mug&x=1` |
| S-20 | `mug<` | 200 | There are 5 products. | `mug<` |
| S-21 | `mug%` | 200 | There are 5 products. | `mug%` |
| S-22 | `100%` `[fuzzy]` | 200 | There are 4 products. (Hummingbird printed sweater, 3 cushions) | `100%` |
| S-23 | `<b>mug</b>` (HTML tag) | 200 | There are 5 products. (tags stripped for matching); `<b>` is NOT rendered as bold, input shows the literal text | `<b>mug</b>` |
| S-24 | `<img src=x onerror=alert(1)>` (HTML injection) | 200 | "No matches were found for your search"; no image element injected, no dialog | literal text, escaped |
| S-25 | `<script>alert(1)</script>` (XSS) | **503** | Apache page `Service Unavailable` ("The server is temporarily unable to service your request..."), page title `503 Service Unavailable`, no script executed | n/a (error page) |
| S-26 | `<script>` | **503** | Same 503 page | n/a |
| S-27 | `' OR '1'='1` (SQL injection) | 200 | There are 3 products. (the 3 notebooks, fuzzy). Not "all products": the whole catalog (19) is NOT returned; no SQL error | `' OR '1'='1` |
| S-28 | `"; DROP TABLE ps_product;--` (SQL injection) | 200 | There is 1 product. (Hummingbird printed t-shirt); no SQL error, catalog intact (a following `mug` search still returns 5 products) | literal text |
| S-29 | `mug' --` (SQL comment) | 200 | There are 5 products. | literal text |
| S-30 | `alert(1)` | 200 | There are 2 products. (IDs 1, 2) | `alert(1)` |
| S-31 | `кружка` (Cyrillic, "mug") | 200 | There are 3 products. (IDs 16, 17, 18 notebooks, fuzzy; no real "mug" translation match) | `кружка` (correctly encoded) |
| S-32 | `Кружка` (Cyrillic, capital) | 200 | Same as S-31 | `Кружка` |
| S-33 | `日本` (CJK) | 200 | There are 3 products. (cushions 9, 10, 11, fuzzy) | `日本` |
| S-34 | `café` (accent) `[fuzzy]` | 200 | There are 4 products. (IDs 3, 6, 4, 5) | `café` |
| S-35 | `😀` (emoji) `[fuzzy]` | 200 | There are 19 products. (paginated, first page shows 12) | emoji retained |

**Cross-checks for the whole table:**
- After S-28, run a normal `mug` search in the same session: still `There are 5 products.` (data not damaged).
- For S-25 and S-26 the browser console shows a single `Failed to load resource: 503` error. This is a legitimate
  expected error for these two rows only; the test must not fail on it. Treat the 503 as the current observed
  behaviour, and raise a defect/question if the product owner expects the "no matches" page instead.
- Whenever the input value is shown, it must be the literal typed text (HTML-escaped when rendered), never executed.

**Success criteria:** each row matches the observed outcome and no dialog, injected element or server error other than
the documented 503 occurs. **Failure conditions:** an `alert` dialog fires, HTML from the query is rendered
unescaped, a PHP/SQL error or stack trace is shown, the whole catalog is returned for the SQL-injection rows, or the
site becomes unavailable for later requests.

---

## Scenario 4 - Autocomplete suggestions for a typed query (DDT)

**Starting state:** `tests/seed.spec.ts` (home page). The autocomplete appears after typing at least 3 characters.

**Steps (per data row):**
1. Click the search box in the header.
2. Type the `Query` value character by character (use `type` / `pressSequentially`, not `fill`, so key events fire).
3. Wait up to 3 seconds for the dropdown to settle.
4. Read the items of `ul.ui-autocomplete li` (the `span.product` text) and the dropdown visibility.

**Expected result:** for rows with suggestions, the dropdown `ul.ui-autocomplete` is visible, each item shows a
thumbnail and a product name, the names equal the `Expected suggestions` column (same order), and the accessible
status reads `N results are available, use up and down arrow keys to navigate.` For rows with no suggestions the
dropdown is hidden (`display: none`, 0 visible items) and the status reads `No search results.`

| Row | Query | Suggestion count | Expected suggestions (order) |
|---|---|---|---|
| A-01 | `mug` | 5 | Customizable mug, Mug The best is yet to come, Mug The adventure begins, Mug Today is a good day, Pack Mug + Framed poster |
| A-02 | `MUG` (upper case) | 5 | Same as A-01 |
| A-03 | `  mug` (leading spaces) | 5 | Same as A-01 |
| A-04 | `mug  ` (trailing spaces) | 5 | Same as A-01 |
| A-05 | `cushion` | 3 | Mountain fox cushion, Brown bear cushion, Hummingbird cushion |
| A-06 | `art` | 6 | The best is yet to come' Framed poster, The adventure begins Framed poster, Today is a good day Framed poster, Mountain fox - Vector graphics, Brown bear - Vector graphics, Hummingbird - Vector graphics |
| A-07 | `hummingbird` | 5 | Hummingbird printed t-shirt, Hummingbird cushion, Hummingbird printed sweater, Hummingbird - Vector graphics, Hummingbird notebook |
| A-08 | `<b>mug</b>` | 5 | Same as A-01 (no markup rendered inside the dropdown) |
| A-09 | `xyzzyqwerty` | 0 (dropdown hidden) | none, status `No search results.` |
| A-10 | `mu` (below the 3-char minimum) | 0 (dropdown hidden) | none |
| A-11 | `a` | 0 (dropdown hidden) | none |

**Success criteria:** counts, names and visibility match. **Failure conditions:** suggestions appear for nonsense or
sub-3-character input, suggestions are unrelated to the query, or markup from the query is rendered inside the
dropdown.

---

## Scenario 5 - Non-parameterised interaction flows

These cannot be reasonably parameterised; each is a single test. Starting state for all: `tests/seed.spec.ts`.

### 5.1 Clicking an autocomplete suggestion opens the product page
1. Click the header search box and type `mug` (character by character).
2. Wait for the dropdown with 5 suggestions.
3. Click the suggestion `Mug Today is a good day`.

**Expected:** URL becomes `index.php?id_product=8&rewrite=mug-today-is-a-good-day&controller=product`, page title and
`h1` are `Mug Today is a good day` (h1 rendered upper-case), and the dropdown is closed.

### 5.2 Keyboard selection of a suggestion
1. Type `mug` in the header search box and wait for the dropdown.
2. Press ArrowDown twice, then Enter.

**Expected:** the second suggestion (`Mug The best is yet to come`) is selected and the product page opens
(`id_product=6`). The search results page is NOT shown.

### 5.3 Submit with the Enter key
1. Fill `cushion` in the search box and press Enter (with no suggestion highlighted).

**Expected:** URL `index.php?controller=search&s=cushion`, heading `Search results`, `There are 3 products.`, the
search box still contains `cushion`.

### 5.4 Clicking the search icon does not submit (observed behaviour)
1. Fill `cushion` in the search box (do not press Enter).
2. Click the magnifier icon (`#search_widget i.search`, text `search`) inside the search box.

**Expected (current behaviour):** nothing happens: the URL stays `index.php`, no results page loads, the text remains
in the box. There is no submit button. Record this as a usability note: users must press Enter. If the product
owner decides the icon should submit, this test should be inverted.

### 5.5 Search term is kept after submit and after navigating back
1. Search for `Mug` (capital M) with Enter.
2. Verify the search box on the results page contains exactly `Mug`.
3. Click a result (for example `Customizable mug`) to open the product page, then use the browser Back button.

**Expected:** the results page is shown again with `There are 5 products.` and the search box still contains `Mug`.

### 5.6 Search from a non-home page
1. From the home page open the `Art` category, then type `mug` in the header search box and press Enter.

**Expected:** the search ignores the current category and returns the same 5 mug products as scenario 1 row V-04.

### 5.7 Searching again from the "no matches" page
1. Search for `xyzzyqwerty` (no matches page appears, with a second search box inside the content area).
2. In the HEADER search box (`#search_widget` first match) replace the text with `mug` and press Enter.

**Expected:** the results page shows `There are 5 products.` and the "No matches" block is gone. (The content-area
search box on the no-matches page is a second `input[name="s"]`; its behaviour can be checked the same way and should
also submit the form.)

### 5.8 Direct URL access
1. Open `https://teststore.automationtesting.co.uk/index.php?controller=search&s=mug` directly.

**Expected:** the same results as typing `mug` (5 products, input prefilled with `mug`). Opening
`index.php?controller=search` without `s` shows the `Search results` page with "No matches were found".

---

## Out of scope

- Sorting, pagination and filters on the results page (the `Sort by` dropdown exists; `Relevance` is the default).
- Mobile layout and the responsive search box.
- Add to cart / quick view from search results.
- Search performance and load.

## Open questions / defects to raise

1. Fuzzy search returns unrelated products for digit strings and nonsense (`12345`, `zzzzzz`, `blablabla`, emoji).
2. `<script>` in the query returns HTTP 503 instead of an escaped "no matches" page.
3. The search icon does not submit the form and there is no search button.
4. A query of `0` is dropped from the input and cannot be searched.
5. Queries of 1 to 2 characters silently return "No matches" with no guidance about the 3-character minimum.
