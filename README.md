# FreeDev Hub — V5.1

A static, searchable directory interface for discovering developer tools and services.

## Run locally (Windows)

Install Node.js, open PowerShell in this folder, then run:

```powershell
npx.cmd --yes http-server -p 5500
```

Open http://localhost:5500

## Build SEO pages

Without a production domain, generated category pages are marked `noindex,follow` and no placeholder canonical URLs are published.

When your real HTTPS domain is ready, run in PowerShell:

```powershell
$env:SITE_URL = "https://your-real-domain.com"
node scripts/generate-seo.js
```

Commit the generated `index.html`, `categories/`, `sitemap.xml`, and `robots.txt` changes, then redeploy.

## Important data and listing notes

- Resource descriptions and free-plan details can become outdated. Verify every provider's current offer, limits, account/card requirements, commercial-use terms and eligibility on its official website.
- Blank descriptions are explicitly labelled as not independently verified; they are not product claims.
- Duplicate exact provider URLs were consolidated. Similar services with different official URLs may still require human review.
- The directory is a discovery aid, not a guarantee that every listed service remains free.
- Confirm the applicable upstream license and redistribution permissions for any imported source data before public redistribution. Attribution alone does not grant permission.
- The local site has no server-side accounts or shared admin database.

## Project scripts

- `npm run serve` — local static preview
- `npm run build:seo` — generate category landing pages and sitemap
- `npm run check` — JavaScript syntax checks
