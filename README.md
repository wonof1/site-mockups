# WON OF ONE standalone mockup

A copy of the current design prototype, separated from the main store repository.

## Run
Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:3101/#home. Port 3101 avoids the original preview on 3100.

## Included
React/Next.js source, animations, cursor, 14 clothing-drop styles and a separate Limited Edition gallery with 12 player tees, colour selectors, sample bag and checkout screens, local images and fonts. The catalogue and all supplied colour variants live in src/components/storefront-mockup/drop-data.json. Hoodies are intentionally excluded. Edit src/components/storefront-mockup/.

## Not included
Commerce backend, Supabase, Stripe, admin, database, credentials or deployment infrastructure. No environment variables are required. Products are hardcoded; the bag resets on reload. Checkout and contact forms are demonstrations only. Apparel images are concepts, not final retail photography.

The original repository and branch remain unchanged by this export.

## Checks
npm run typecheck
npm run build

Motion reference attribution is in MOTION-LICENSE.txt; font licensing is in public/fonts/.

## Clothing drop preview

- Main catalogue: http://127.0.0.1:3101/#shop
- Player tees: http://127.0.0.1:3101/#limited
- Source: user-supplied September 2026 PDFs. Surrounding document copy is not used.
- Product artwork was extracted from the PDFs; pale garments and overlapping socks received background cleanup. Front/back pairs remain together to preserve the supplied design.
- No retail prices, inventory, release dates, or edition quantities are asserted.

If reusing dependencies via a symlink from the original repository, use `npm run dev -- --webpack`. A normal `npm install` does not need this override.
