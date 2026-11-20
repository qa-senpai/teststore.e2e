# Catalog: categories, products, listings, search

Observed 2026-11-18. Re-verify exact values with `playwright-cli` if a test depends on them.

## Category tree

`id_category` is what the URL uses: `/index.php?id_category=<id>&controller=category`.

| id | Category | Parent | Products (ids) | Count text |
| --- | --- | --- | --- | --- |
| 2 | Home ("All products") | — | all 19 | `There are 19 products.` |
| 3 | Clothes | Home | 1, 2 | `There are 2 products.` |
| 4 | Men | Clothes | 1 | `There is 1 product.` (singular) |
| 5 | Women | Clothes | 2 | `There is 1 product.` |
| 6 | Accessories | Home | 6, 7, 8, 9, 10, 11, 15, 16, 17, 18, 19 | `There are 11 products.` |
| 7 | Stationery | Accessories | 16, 17, 18 | `There are 3 products.` |
| 8 | Home Accessories | Accessories | 6, 7, 8, 9, 10, 11, 15, 19 | `There are 8 products.` |
| 9 | Art | Home | 3, 4, 5, 12, 13, 14, 15 | `There are 7 products.` |

Top menu shows Clothes, Accessories, Art. Product 15 (pack) belongs to both Home Accessories and Art.
An unknown category id (e.g. 99) shows the PrestaShop "page not found" content.

## Products

Prices are the current (sale) price, USD, tax $0. Brand = manufacturer shown on the product page.

| id | Name (product page / cart) | Price | Regular | Ref | Category path | Variants (default first) | Features | Brand |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Hummingbird printed t-shirt | $19.12 | $23.90 (-20%) | demo_1 | Clothes > Men | Size S/M/L/XL (select `#group_1`), Color White/Black (radio) | Cotton, Short sleeves | Studio Design |
| 2 | Hummingbird printed sweater | $28.72 | $35.90 (-20%) | demo_3 | Clothes > Women | Size S/M/L/XL | Cotton, Long sleeves | Studio Design |
| 3 | The best is yet to come' Framed poster | $29.00 | — | demo_6 | Art | Dimension 40x60cm/60x90cm/80x120cm | Matt paper | Graphic Corner |
| 4 | The adventure begins Framed poster | $29.00 | — | demo_5 | Art | Dimension 40x60cm/60x90cm/80x120cm | Matt paper | Graphic Corner |
| 5 | Today is a good day Framed poster | $29.00 | — | demo_7 | Art | Dimension 40x60cm/60x90cm/80x120cm | Matt paper | Graphic Corner |
| 6 | Mug The best is yet to come | $11.90 | — | demo_11 | Accessories > Home Accessories | none | Ceramic | Studio Design |
| 7 | Mug The adventure begins | $11.90 | — | demo_12 | Accessories > Home Accessories | none | Ceramic | Studio Design |
| 8 | Mug Today is a good day | $11.90 | — | demo_13 | Accessories > Home Accessories | none | Ceramic | Studio Design |
| 9 | Mountain fox cushion | $18.90 | — | demo_15 | Accessories > Home Accessories | Color White/Black | Polyester, Removable cover | Studio Design |
| 10 | Brown bear cushion | $18.90 | — | demo_16 | Accessories > Home Accessories | Color White/Black | Polyester, Removable cover | Studio Design |
| 11 | Hummingbird cushion | $18.90 | — | demo_17 | Accessories > Home Accessories | Color White/Black | Polyester, Removable cover | Studio Design |
| 12 | Mountain fox - Vector graphics | $9.00 | — | demo_18 | Art | none (virtual/downloadable, svg) | — | Graphic Corner |
| 13 | Brown bear - Vector graphics | $9.00 | — | demo_19 | Art | none (virtual) | — | Graphic Corner |
| 14 | Hummingbird - Vector graphics | $9.00 | — | demo_20 | Art | none (virtual) | — | Graphic Corner |
| 15 | Pack Mug + Framed poster | $35.00 | — | demo_21 | Accessories > Home Accessories | none; flag `Pack` | — | — |
| 16 | Mountain fox notebook | $12.90 | — | demo_8 | Accessories > Stationery | Paper Type Ruled/Plain/Squarred/Doted | Recycled cardboard, 120 pages | Graphic Corner |
| 17 | Brown bear notebook | $12.90 | — | demo_9 | Accessories > Stationery | Paper Type Ruled/Plain/Squarred/Doted | Recycled cardboard, 120 pages | Graphic Corner |
| 18 | Hummingbird notebook | $12.90 | — | demo_10 | Accessories > Stationery | Paper Type Ruled/Plain/Squarred/Doted | Recycled cardboard, 120 pages | Graphic Corner |
| 19 | Customizable mug | $13.90 | — | demo_14 | Accessories > Home Accessories | none; text customization | Ceramic | Studio Design |

Spelling "Squarred" and "Doted" is the site's own — assert it as is.

Pack 15 contents (shown on its product page): "Today is a good day Framed poster, Dimension-40x60cm" and
"Mug The adventure begins". Its page has only a "Product Details" tab (no Description).

Price range facet: $9.00 – $36.00. Cheapest: vector graphics ($9.00). Most expensive: pack ($35.00).

## Product page

- URL: `/index.php?id_product=<id>&controller=product`; choosing a variant rewrites it to
  `...&id_product_attribute=<n>&rewrite=<slug>&controller=product#/<attr-id>-<group>-<value>/...`
  (example: size L + Black → `id_product_attribute=6`, `#/3-size-l/11-color-black`).
- Elements: `h1` (name, CSS-uppercased in display — the DOM text is sentence case), regular + current price,
  `Save 20%` badge for discounted items, short description, variant selectors, `Quantity` spinbutton
  (`#quantity_wanted`, min 1, up/down buttons), `Add to cart`, wishlist heart (`favorite_border`), Share links
  (Facebook "Share", "Tweet", Pinterest), reassurance block (Security/Delivery/Return policy placeholders),
  tabs `Description` | `Product Details` (reference, `<n> Items` in stock, Data sheet features), "Comments (0)" with
  "No customer reviews for the moment.", and a "Viewed products" block.
- Quantity 0, negative or letters → reset to 1. Stock shows ~1,000,000 items per product.
- Customizable mug (19): block "Product customization — Don't forget to save your customization to be able to add to
  cart", textarea `textField1` (1024 char. max), button `Save customization` (`submitCustomizedData`). Add to cart
  is **disabled** until saved; after saving the block shows "Your customization: <text>".
- Non-existent product id (e.g. 999): bare HTTP 404 response with no shop page.

## Listing pages (category, search results, special lists)

- 12 products per page; pagination text `Showing 1-12 of 19 item(s)`, page 2 via `&page=2`.
- Product card (`article.product-miniature`, `data-id-product`): image, `Quick view` (on hover), title (title-cased,
  truncated with `...` when long), price (+ regular price and `-20%` flag for sale items), wishlist heart, colour
  swatches for product 1.
- **Sort by** (`order=` param): `Sales, highest to lowest` (`product.sales.desc`), `Relevance`
  (`product.position.asc`, default), `Name, A to Z` (`product.name.asc`), `Name, Z to A`, `Price, low to high`
  (`product.price.asc`), `Price, high to low`, `Reference, A to Z`, `Reference, Z to A`.
- **Facets** (left column, "Filter By"); selecting one adds `&q=<Facet>-<Value>` (e.g. `q=Categories-Clothes`) and
  shows an "Active filters" bar. Values on All products:
  - Availability: In stock (19)
  - Selections: Discounted (2), New product (19)
  - Price slider: $9.00 – $36.00
  - Categories: Accessories (11), Art (7), Clothes (2)
  - Size: S, M, L, XL (2 each) · Color: White (4), Black (4)
  - Composition: Ceramic (4), Cotton (2), Matt paper (3), Polyester (3), Recycled cardboard (3)
  - Property: 120 pages (3), Long sleeves (1), Removable cover (3), Short sleeves (1)
  - Brand: Graphic Corner (9), Studio Design (9)
  - Dimension: 40x60cm, 60x90cm, 80x120cm (3 each) · Paper Type: Ruled, Plain, Squarred, Doted (3 each)
- Quick view modal: name, price, short description, quantity, Add to cart, share links.

Special lists:

| Route | Content |
| --- | --- |
| `/index.php?controller=prices-drop` | "Prices drop" — 2 products (ids 1, 2), default sort Name A–Z |
| `/index.php?controller=new-products` | "New products" — **empty**: "No products available yet" |
| `/index.php?controller=best-sales` | "Best sellers" — **empty** |

Home page: carousel (Sample 1–3, Lorem ipsum), "Popular Products" (ids 1–8) + "All products" link, "Custom Text
Block", "On sale" (ids 2, 1) + "All sale products" link, newsletter block, footer.

## Search

- Widget `#search_widget`, input `name="s"`, placeholder "Search our catalog". Enter → results page
  `/index.php?controller=search&s=<query>`; no hits → "No matches were found for your search".
- Autocomplete dropdown (`ul.ui-autocomplete`) appears while typing. Case-insensitive, trims spaces.
- The repo already has data-driven search tests and expected results in `tests/e2e/search/data/search/`
  (`valid-queries.ts`, `no-results.ts`, `special-input.ts`, `autocomplete.ts`). Read them before adding search
  cases, reuse their row format and the next free `E2E-0xxx` id.
- Example: `mug` suggests Customizable mug, Mug The best is yet to come, Mug The adventure begins, Mug Today is a good
  day, Pack Mug + Framed poster. `cushion` → the three cushions. Digits-only queries (`1`, `10`) find nothing.
