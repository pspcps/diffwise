# Branding and search deployment

PSDevTool has a PS monogram, matching app/favicons, and build-time HTML for 32 canonical pages: the homepage, 19 tool pages, the portfolio, a resume gallery and ten resume templates. A separate 404 document is excluded from the sitemap and marked noindex.

## What the build produces

- The homepage tool catalog is rendered from the real React component. Each tool page contains its own visible guide, steps, FAQs and related links before JavaScript runs. The interactive workspace opens above the same guide after the app loads.
- Per-page title, description, canonical, Open Graph/Twitter metadata and structured data. The sharing image is a broadly supported 1200 × 630 PNG.
- A clean-URL sitemap with no hash fragments, plus crawler rules.
- A custom 404 page and noindex metadata for unknown routes.
- Preview noindex metadata and crawler exclusion when `VERCEL_ENV=preview`; production is indexable. Vercel deployment protection may separately require sign-in on previews.

Source data lives in `src/seo/tool-pages.json`; page rendering and metadata are shared with the app. `scripts/generate-seo.cjs` runs after Vite. All 85 existing tool hash aliases still resolve, and coordinate-link query strings are preserved.

## Hosting

Deploy the entire `dist/` directory. Keep generated `/tools/<slug>/index.html` pages available as directory indexes. A catch-all rewrite to `/index.html` would return homepage HTML and defeat per-page metadata. Vercel configuration uses filesystem routing and trailing slashes, preserving asset/security headers and redirecting the www hostname to the canonical hostname when that domain is connected.

On another host, configure genuine 404 responses using `404.html`. For example, an Nginx deployment should check `$uri` and `$uri/` before returning a 404; it should not use the homepage as its unknown-route fallback. Test the actual host after deployment.

## Google Search Console: account-owner steps

1. Merge and deploy the changes to the public production domain. A protected preview is not the URL to submit for indexing.
2. Add and verify `psdevtool.online` in Google Search Console. DNS verification belongs to the domain owner. For URL-prefix HTML-tag verification, set the public verification value as `GOOGLE_SITE_VERIFICATION` in the hosting build environment, rebuild, and complete verification in Search Console.
3. Submit `https://psdevtool.online/sitemap.xml`.
4. Use URL Inspection on the homepage and representative tool pages such as `/tools/json-formatter/` and `/tools/distance-calculator/`. Confirm that Google can access them and sees the expected canonical.
5. Monitor indexing, impressions, queries and click-through rate. Improve useful guides and tool reliability based on real usage and search data.

No Search Console account or verification token was available in this session, so ownership verification, submission and indexing requests have not been performed. Rankings, rich-result presentation and indexing schedules are Google's decisions. Meta keywords, fabricated reviews and repetitive keyword text are not used.

## Validation

```sh
npm run build
npm run test:seo
npm run test:catalog
npm run test:measurements
```

The SEO check validates all generated pages, metadata, schema, sitemap paths, aliases, icon dimensions, manifest and preview/production indexing flags. Browser checks cover direct clean routes, source HTML, JavaScript-disabled guides, normal tool navigation, Back/Forward, old links, coordinate queries, mobile layout and not-found metadata. They do not establish a Google ranking, real Core Web Vitals score or successful indexing.

## Logo assets

`public/brand/logo.svg` is the vector master. `BrandMark.tsx` uses the same geometry with the chosen theme accent. App PNG sizes are 192/512, Apple touch size is 180, and search/favicon sizes include 16/32/48/96. `favicon.ico` packages the small PNG sizes. `og-image.svg` is the editable sharing-card source and `og-image.png` is its exported version. There is no service worker or offline guarantee implied by the manifest.
