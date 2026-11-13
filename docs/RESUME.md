# HTML resume and print templates

`/resume/` is a gallery of ten layouts. Each opens a complete standalone HTML resume:

- Single column: `/resume/classic/`, `/resume/modern/`, `/resume/executive/`, `/resume/minimal/`, `/resume/technical/`, `/resume/compact/`.
- Two columns: `/resume/sidebar/`, `/resume/editorial/`, `/resume/blueprint/`, `/resume/studio/`.

The portfolio’s Resume links point to the gallery. PDF export uses the browser print command; the unused external Google Drive download URL has been removed.

## Expanded Legal edition

Choose **Legal · Expanded** in the gallery at `/resume/legal/`, or use the Paper selector on any template. Each Legal resume also has its own static URL, for example `/resume/modern/legal/`. These pages include six engineering projects (FleetMind, PSDevTool, Kafbat UI, Project Drishti, InkMind and ApiDesk Studio) and all four reported open-source contributions/customizations. The focused A4 version retains three projects and the source-linked Liquibase contribution. All headings now use **Engineering Projects** rather than **Selected Projects**. Expanded two-column editions use a full-width project section below the skills/experience columns so the additional content stays readable.

FreeRADIUS, Mikro-Node and jQuery-Draggable are described as the customizations/fixes reported in the owner’s original resume. They are not presented as verified merged upstream PRs, and no nonexistent source links are added.

## Save a PDF

Open a template and choose **Print / Save PDF**, or use Chrome’s print command. Select **Save as PDF**, the selected paper (**A4** or **Legal / 8.5 × 14 in**), and **100% scale**. The stylesheet uses zero page margins with 10 mm internal spacing, removes screen controls and prints selectable text with explicit link text. This suppresses Chrome’s date/title/URL headers in tested Chromium exports even with browser headers enabled. If a browser or printer overrides that spacing, disable **More settings → Headers and footers**. Those decorations belong to the browser, not the resume HTML. Enable background graphics to preserve the shaded two-column designs; content remains readable without it.

Start with Classic, Modern or Minimal for ATS applications. Every layout uses real text and standard headings, but two-column PDF reading order varies across parsers. Template cards and screen-only controls show a deliberately approximate formatting heuristic (95/100 for single column; 80/100 for two columns). Its full points breakdown is available in the gallery. It is not an ATS vendor result or a job-match score, has not been calibrated against screening systems, and does not appear in the PDF. Job relevance, employer requirements and the actual parser matter. The two-column layouts are an optional direct-sharing presentation.

## Content and sources

`src/data/printResume.ts` holds the focused resume, shared by all ten templates. It combines the owner-provided resume PDF with the repository-reviewed portfolio data in `src/data/resumeData.ts`. Company metrics are owner-supplied career claims, not independently audited benchmarks. No new metrics, employers, dates or credentials are invented. The focused resume uses all four employers and three projects; Legal expands to six projects and four contributions; the portfolio carries the fuller project catalog. The Liquibase fix is described from the supplied merged PR, rather than implying general PostgreSQL feature authorship. FleetMind has no public repository link, so none is invented.

Experience is calculated from 2 January 2017 using the existing career utility and updates when the page remains open across a date boundary. Build-time HTML reflects the build date; the live page recalculates on load.

The QR code links directly to `https://psdevtool.online/portfolio/`. It is a local SVG with a quiet border, not an external QR API or tracking redirect. The portfolio URL is also printed as a separate, clickable text link alongside LinkedIn and GitHub. Regenerate the asset with `node scripts/generate-resume-qr.cjs` after changing the URL (keep `PORTFOLIO_URL` in sync).

The resume/gallery are rendered to HTML at build time, so content and normal links work before JavaScript. The print button needs JavaScript; the browser’s own print menu works without it. On narrow screens, two-column layouts stack for reading; print uses the selected desktop composition.

## Validation

Run `npm run build`, `npm run test:seo`, and focused ESLint checks. Chromium print checks export every template at A4 and Legal/100% with browser headers enabled, verify exactly one PDF page, extract text and links, decode the QR, and check direct URLs, mobile layouts and JavaScript-disabled HTML. Tagged PDFs aid navigation but do not establish PDF/UA certification or guarantee ATS parsing.

## Reusable Resume Builder

Resume Builder is the twentieth tool in the shared catalog, picker and command search. The original nineteen tools are retained. Choose **Edit resume** to open the native dialog; content, colors, QR settings and draft controls are available only there. Escape or **Done editing** returns to the clean viewing page.

Edit contact details, summary, skill groups, jobs and achievement bullets, engineering projects, education, certification and open-source entries. **Start blank** removes the example content. Change the accent, body text and paper background colors; the dialog reports body-text contrast. The QR code is generated locally from a valid HTTP(S) portfolio URL, with a toggle to omit it from the page and PDF. QR generation does not use a remote QR service.

**Save on this device** opts into local storage under `psdev-resume-draft-v1`. Once enabled, edits save automatically and apply across all templates and both papers. The same custom content is preserved on paper changes, so a long custom draft can span multiple pages; the one-page checks cover the shipped examples, not unlimited edits. The gallery/URLs do not publish customized details. Share the exported PDF to share a completed resume.

Turning saving off removes the stored draft while retaining edits in the open page. **Clear saved draft / reset sample** removes storage and restores the example. **Download draft / Import draft** provides a versioned JSON backup for moving devices. Imports are size/schema checked; website links are limited to HTTP(S), so pasted `javascript:` or `data:` links are not clickable. Storage corruption falls back to the example, and a storage-full error offers draft export instead. Local storage is per browser/origin and does not sync across devices or different preview domains. The site’s existing analytics/advertising are unchanged; the editor itself has no content-upload endpoint.

Run `node scripts/check-resume-draft.cjs` for draft validation, source-isolation and URL checks.

The example phone number is intentionally blank. Add a phone number manually in Edit mode; it is only stored on the device if device saving is enabled. Clearing a previously saved draft restores the blank default.
