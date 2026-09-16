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
React/Next.js source, animations, cursor, four sample apparel styles, colour selectors, sample bag and checkout screens, local images and fonts. Edit src/components/storefront-mockup/.

## Not included
Commerce backend, Supabase, Stripe, admin, database, credentials or deployment infrastructure. No environment variables are required. Products are hardcoded; the bag resets on reload. Checkout and contact forms are demonstrations only. Apparel images are concepts, not final retail photography.

The original repository and branch remain unchanged by this export.

## Checks
npm run typecheck
npm run build

Motion reference attribution is in MOTION-LICENSE.txt; font licensing is in public/fonts/.
