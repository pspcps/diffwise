# HTML resume and print templates

`/resume/` is a gallery of ten layouts. Each opens a complete standalone HTML resume:

- Single column: `/resume/classic/`, `/resume/modern/`, `/resume/executive/`, `/resume/minimal/`, `/resume/technical/`, `/resume/compact/`.
- Two columns: `/resume/sidebar/`, `/resume/editorial/`, `/resume/blueprint/`, `/resume/studio/`.

The portfolio’s Resume links point to the gallery. PDF export uses the browser print command; the unused external Google Drive download URL has been removed.

## Expanded Legal edition

Choose **Legal · Expanded** in the gallery at `/resume/legal/`, or use the Paper selector on any template. Each Legal resume also has its own static URL, for example `/resume/modern/legal/`. These pages include five engineering projects (FleetMind, Project Drishti, PSDevTool, Kafbat UI and ApiDesk Studio) and all four reported open-source contributions/customizations. The focused A4 version includes FleetMind, Project Drishti, PSDevTool and Kafbat UI, and shows only the first open-source contribution (Liquibase in the example). Education/certification is omitted from A4, while Legal retains that section. All headings now use **Engineering Projects** rather than **Selected Projects**. Expanded two-column editions use a full-width project section below the skills/experience columns so the additional content stays readable.

FreeRADIUS, Mikro-Node and jQuery-Draggable are described as the customizations/fixes reported in the owner’s original resume. They are not presented as verified merged upstream PRs, and no nonexistent source links are added.

## Save a PDF

Open a template and choose **Print / Save PDF**, or use Chrome’s print command. Select **Save as PDF**, the selected paper (**A4** or **Legal / 8.5 × 14 in**), and **100% scale**. The stylesheet uses zero page margins with 10 mm internal spacing, removes screen controls and prints selectable text with explicit link text. This suppresses Chrome’s date/title/URL headers in tested Chromium exports even with browser headers enabled. If a browser or printer overrides that spacing, disable **More settings → Headers and footers**. Those decorations belong to the browser, not the resume HTML. Enable background graphics to preserve the shaded two-column designs; content remains readable without it.

Start with Classic, Modern or Minimal for ATS applications. Every layout uses real text and standard headings, but two-column PDF reading order varies across parsers. Template cards and screen-only controls show a deliberately approximate formatting heuristic (95/100 for single column; 80/100 for two columns). Its full points breakdown is available in the gallery. It is not an ATS vendor result or a job-match score, has not been calibrated against screening systems, and does not appear in the PDF. Job relevance, employer requirements and the actual parser matter. The two-column layouts are an optional direct-sharing presentation.

## Content and sources

`src/data/printResume.ts` holds the focused resume, shared by all ten templates. It combines the owner-provided resume PDF with the repository-reviewed portfolio data in `src/data/resumeData.ts`. Company metrics are owner-supplied career claims, not independently audited benchmarks. No new metrics, employers, dates or credentials are invented. The focused resume uses all four employers and four projects; Legal expands to five projects and four contributions; the portfolio carries the fuller project catalog. The Liquibase fix is described from the supplied merged PR, rather than implying general PostgreSQL feature authorship. FleetMind has no public repository link, so none is invented.

Experience is calculated from 2 January 2017 using the existing career utility and updates when the page remains open across a date boundary. Build-time HTML reflects the build date; the live page recalculates on load.

The QR code links directly to `https://psdevtool.online/portfolio/`. It is a local SVG with a quiet border, not an external QR API or tracking redirect. The portfolio URL is also printed as a separate, clickable text link alongside LinkedIn and GitHub. Regenerate the asset with `node scripts/generate-resume-qr.cjs` after changing the URL (keep `PORTFOLIO_URL` in sync).

The resume/gallery are rendered to HTML at build time, so content and normal links work before JavaScript. The print button needs JavaScript; the browser’s own print menu works without it. On narrow screens, two-column layouts stack for reading; print uses the selected desktop composition.

## Validation

Run `npm run build`, `npm run test:seo`, and focused ESLint checks. Chromium print checks export every template at A4 and Legal/100% with browser headers enabled, verify exactly one PDF page, extract text and links, decode the QR, and check direct URLs, mobile layouts and JavaScript-disabled HTML. Tagged PDFs aid navigation but do not establish PDF/UA certification or guarantee ATS parsing.

## Reusable Resume Builder

Resume Builder is the twentieth tool in the shared catalog, picker and command search. The original nineteen tools are retained. Choose **Edit resume** to open the native dialog; content, colors, QR settings and draft controls are available only there. **Done editing** applies the edit session and saves it when device saving is enabled. **Cancel** or Escape discards the session, restores the previous profiles, content, colors, QR, device-saving preference and layout route, then returns to the viewing page. Storage is not changed while the dialog is open; imported profiles and deletions are also staged until Done editing. If saving fails, the dialog stays open with a backup/retry message.

Edit contact details, summary, skill groups, jobs and achievement bullets, engineering projects, education, certification and open-source entries. **Start blank** removes the example content. Change the accent, body text and paper background colors; the dialog reports body-text contrast. The QR code is generated locally from a valid HTTP(S) portfolio URL, with a toggle to omit it from the page and PDF. QR generation does not use a remote QR service.

### Named profiles and backups

In Edit mode, **Resume profiles** offers New blank, Duplicate current, Rename, Switch and Delete (with confirmation). Use a profile per job focus, such as Backend, Cloud or Applied AI. Profiles independently keep contact details, summary, skills, work history, projects, education, contributions, colors, QR preference, template ID and A4/Legal paper. Switching restores that profile’s layout route. Choosing another layout applies the active profile’s content and records its new layout. Reset only restores the current profile to the example; other profiles remain unchanged.

**Save on this device** opts into local storage under `psdev-resume-profiles-v2`. Once enabled, profile changes save when **Done editing** is selected. Layout changes outside the dialog save automatically. Existing version 1 drafts migrate into a “My resume” profile; the previous storage key is removed only after the new library is successfully written. Turning saving off removes stored copies when Done editing is selected, while keeping profiles open for the current page session. Without saving, reloading or leaving the builder can discard edits. Local storage is specific to the browser and origin; it does not sync between devices or preview domains.

**Download all profiles** exports a version 2 JSON backup containing all profiles, the active selection and their template/paper preferences. Download it **before** clearing site data or changing browsers. **Import profiles / draft** restores version 2 backups and accepts older version 1 single-draft files. Imports add independent profiles with new IDs and disambiguated names; they never silently replace existing profiles. The imported active profile is opened. The backup restores layout choices within the builder; it does not bundle the website or template source files.

Imports validate the entire file before applying changes, with a 5 MB file limit, at most 50 profiles and the existing 500 KB draft/schema limits per profile. Website links are limited to HTTP(S); imported content renders as text. A malformed import leaves the current library untouched. A full or unavailable storage error recommends exporting a backup. Longer custom content can span multiple pages; the one-page checks cover shipped examples. The editor has no content-upload endpoint. The site’s existing analytics/advertising are unchanged. Share the exported PDF to share a completed resume; profile data does not become part of a public resume URL.

Run `node scripts/check-resume-draft.cjs` and `node scripts/check-resume-profiles.cjs` for validation, source isolation, safe URLs, legacy imports, independent copies and collision-safe backup merging.

The example phone number is intentionally blank. Add a phone number manually in Edit mode; it is only stored on the device if device saving is enabled. Clearing a previously saved draft restores the blank default.

A4 shows at most one open-source contribution and omits education/certification without deleting those fields from a custom draft; they remain editable and available in Legal. Updated example projects remove InkMind and place Project Drishti directly after FleetMind. Existing customized drafts preserve their project lists; use **Edit resume → Engineering projects → Use example projects** to adopt the new list without changing other details.

## Role defaults and contact update (20 November 2026)

New visitors get seven independent examples: Common / General, Backend Engineer, Cloud Engineer, Applied AI Engineer, Full-Stack Developer, Software Architect and Forward-Deployed Engineer. The common version retains the existing broad positioning and FleetMind → Project Drishti project order. Each focused version uses a targeted summary, relevant skill groups and project order. Titles in the header describe the target role; held employment titles, employers and dates are not changed to imply an unheld role. Recent AI work is distinguished from total software engineering tenure.

Choose **Profile** in the gallery or the toolbar above any resume. The viewing selector changes the displayed content while keeping the current layout and paper size, without opening Edit mode. Gallery paper and template links preserve an unsaved profile selection in the same page session. With device saving enabled the selection persists after reload; otherwise it lasts for the current page session. The selector and gallery status do not print. To change profile details or manage profiles, use **Edit resume → Active profile**; the editor selector continues restoring each profile’s saved layout route. All start with the single-column Modern layout; every profile remains usable with all ten layouts and both paper sizes. Each focused A4 example contains four projects; Legal contains five plus education and the expanded contribution list. Existing customized resumes keep their text and selection. Saved owner resumes receive the six missing focused examples once; unrelated users' saved resumes are not populated automatically. **Restore missing role examples** is available inside Edit mode and never replaces an existing profile. Explicitly deleted examples remain deleted after reload.

Unedited examples regenerate their content from the current career duration, including the completed-years value from 2 January 2017. Editing content or duplicating/blanking a profile detaches that snapshot from automatic example regeneration, preserving user text. Appearance changes do not detach content. Resetting a built-in profile restores its corresponding role example, not the general project's order. Imports restore captured content as independent snapshots, including manually edited backup files, rather than silently regenerating an example over imported text.

The owner requested a new professional email, `prakash63kumar@gmail.com`. The portfolio, public contact page, generated HTML/PDF examples and defaults share `src/data/contact.ts`. Older stored drafts and imported backups replace the exact former owner email in the contact field. Other email addresses and unrelated personal details are preserved. The former address remains only as the explicit migration comparison in source; previously downloaded PDFs and Git history are not rewritten.

The optional version 2 backup fields `presetRole` and `roleDefaultsAdded` distinguish unedited examples and remember that defaults were seeded. Version 1 drafts and older version 2 libraries remain accepted. Storage is still opt-in, and profile edits remain staged until **Done editing**. Cancel/Escape restores the previous session state.

## Simplified editor layout

The editor opens on **Content**, so contact details and summary are available immediately. A compact Active profile selector stays at the top; Cancel and Done editing remain visible while the form scrolls. Four keyboard-accessible tabs separate Content, Appearance, Profiles and Save & backup. Arrow keys and Home/End move between tabs. Content sections use native accordions, with consistent input columns and compact repeatable entries.

Use **Appearance** for colors, contrast feedback and the portfolio QR. Use **Profiles** to rename the selected profile, create a new blank version or duplicate it. A newly created version can be renamed afterward; the name field reflects the selected profile instead of starting blank. Restore/reset actions are grouped under a disclosure, and deletion retains its confirmation. **Save & backup** contains device saving, download/import and storage information, rather than mixing them into the content form.

Switching tabs does not apply, discard or reset edits. Profile management, imports and saving remain staged until Done editing, and Cancel/Escape restore the previous session. The existing per-profile layouts, backup compatibility and print exclusions are unchanged. The editor itself never appears in the exported resume PDF.
