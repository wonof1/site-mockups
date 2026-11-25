# Won of One storefront

Use Node.js 22 or newer. Run `npm ci` and `npm run dev`, then open [the storefront](http://127.0.0.1:3101/). Use `npm run build` followed by `npm start` for a production preview.

The active Next.js pages render `src/components/storefront/Storefront.tsx`. The [men’s](http://127.0.0.1:3101/men) and [women’s](http://127.0.0.1:3101/women) departments share the two unisex styles. The approved CAD prices and Shopify placeholder images are in `src/components/storefront/launch-styles.ts`. The homepage rail, department pages, and product routes all use the same launch assortment.

## Tapstitch image cross-reference

Use the SKU and retail name from the merchandising brief for product pages. The Drive folders use production names. Front and back PNGs with the same colour name form a pair.

| Tapstitch folder | Product in the retail brief | Image mapping |
| --- | --- | --- |
| Mens / Tops / Athletic | M01 · Men’s Athletic T-Shirt | Black, White and Light Gray match directly. Blue is the dark Navy Blue tee. Light Blue is an optional colour in the brief. |
| Mens / Bottoms / Athletic / 1 | M02 · Men’s Athletic Shorts — WON OF ONE | Black, Army Green and Khaki carry the full wordmark on the front hem. Gray is optional. M03 has a separate WO1 logo treatment. |
| Mens / Tops / Casual | Pending supplier-style identification | The boxy tee has a WO1 chest logo. Drive labels the colours Black, Navy Blue, Dark Gray, Dull Red, Dark Green, Gray Blue and Brown. The brief lists both U01 (RT0070) and U02 (UT0001), each with Black, White, Dark Blue and Charcoal. |

## Shopify checkout

The preview works without credentials. To enable checkout for launch, configure the server environment variable `SHOPIFY_STOREFRONT_ACCESS_TOKEN` with a Storefront API public access token for the Won of One store. Publish the products to the appropriate sales channels, including the Online Store for cart permalinks. Keep product handles and colour option values in sync with the snapshot.

Product pages offer sizes returned by Shopify for the selected colour when the variant is available and its Canadian price matches the displayed price. Buy now opens Shopify Checkout with one unit of that size and colour. Draft styles display Coming soon.

Run `npm run typecheck` and `npm run build` to check changes. Motion attribution is in MOTION-LICENSE.txt and font licensing is in public/fonts/.

## Instagram section

The storefront displays six curated posts from @wo1_padel, saved on October 1, 2026. Post links and local thumbnail paths live in src/components/storefront/instagram.json; images live in public/storefront/instagram. These are real posts, not a live API feed. Automatic refresh requires an authorized Instagram integration. No access tokens or third-party widget scripts are included.

Product-image transitions run in the browser and respect reduced-motion settings. Modified clicks retain normal link behavior, and scrolling or keyboard input cancels an active transition.
