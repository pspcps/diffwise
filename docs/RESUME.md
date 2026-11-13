# HTML resume and print templates

`/resume/` is a gallery of ten layouts. Each opens a complete standalone HTML resume:

- Single column: `/resume/classic/`, `/resume/modern/`, `/resume/executive/`, `/resume/minimal/`, `/resume/technical/`, `/resume/compact/`.
- Two columns: `/resume/sidebar/`, `/resume/editorial/`, `/resume/blueprint/`, `/resume/studio/`.

The portfolio’s Resume links point to the gallery. Old external resume-download data is retained for other consumers; the new page does not claim to download a PDF automatically.

## Save a PDF

Open a template and choose **Print / Save PDF**, or use Chrome’s print command. Select **Save as PDF**, **A4**, **100% scale**, default margins, and disable browser headers and footers. The stylesheet sets a 10 mm page margin, removes screen controls and prints selectable text with explicit link text. Enable background graphics to preserve the shaded two-column designs; content remains readable without it.

Start with Classic, Modern or Minimal for ATS applications. Every layout uses real text and standard headings, but two-column PDF reading order varies across parsers. Template cards and screen-only controls show a deliberately approximate formatting heuristic (95/100 for single column; 80/100 for two columns). Its full points breakdown is available in the gallery. It is not an ATS vendor result or a job-match score, has not been calibrated against screening systems, and does not appear in the PDF. Job relevance, employer requirements and the actual parser matter. The two-column layouts are an optional direct-sharing presentation.

## Content and sources

`src/data/printResume.ts` holds the focused resume, shared by all ten templates. It combines the owner-provided resume PDF with the repository-reviewed portfolio data in `src/data/resumeData.ts`. Company metrics are owner-supplied career claims, not independently audited benchmarks. No new metrics, employers, dates or credentials are invented. The resume uses all four employers and three selected projects; the portfolio carries the fuller project catalog. The Liquibase fix is described from the supplied merged PR, rather than implying general PostgreSQL feature authorship. FleetMind has no public repository link, so none is invented.

Experience is calculated from 2 January 2017 using the existing career utility and updates when the page remains open across a date boundary. Build-time HTML reflects the build date; the live page recalculates on load.

The QR code links directly to `https://psdevtool.online/portfolio/`. It is a local SVG with a quiet border, not an external QR API or tracking redirect. The portfolio URL is also printed as a separate, clickable text link alongside LinkedIn and GitHub. Regenerate the asset with `node scripts/generate-resume-qr.cjs` after changing the URL (keep `PORTFOLIO_URL` in sync).

The resume/gallery are rendered to HTML at build time, so content and normal links work before JavaScript. The print button needs JavaScript; the browser’s own print menu works without it. On narrow screens, two-column layouts stack for reading; print uses the selected desktop composition.

## Validation

Run `npm run build`, `npm run test:seo`, and focused ESLint checks. Chromium print checks export every template at A4/100%, verify exactly one PDF page, extract text and links, decode the QR, and check direct URLs, mobile layouts and JavaScript-disabled HTML. Tagged PDFs aid navigation but do not establish PDF/UA certification or guarantee ATS parsing.
