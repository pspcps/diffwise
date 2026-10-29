# Codebase Structure & Directory Guide: PSDevTool

This guide provides a comprehensive map of the PSDevTool repository, outlining directory structures, file responsibilities, application entry points, and component connections.

---

## 1. Directory Tree Overview

```
psdevtool/
├── index.html                   # HTML entry point, SEO meta, JSON-LD schemas, dark preloader
├── package.json                 # Dependencies, npm scripts, and build targets
├── vite.config.ts               # Vite configuration, React plugin, dev server host & port
├── tsconfig.json                # TypeScript compiler configuration & strict rules
├── tsconfig.app.json            # Application-specific TypeScript compilation config
├── tsconfig.node.json           # Node environment build TypeScript config
├── tailwind.config.js           # Tailwind CSS theme extensions and content paths
├── postcss.config.js            # PostCSS configuration with Tailwind and Autoprefixer
├── eslint.config.js             # ESLint flat config with TypeScript & React hooks plugins
├── public/
│   ├── favicon.svg              # PSDevTool vector SVG brand mark
│   ├── og-image.svg             # Social share card vector (1200x630)
│   ├── robots.txt               # Search crawler indexing rules
│   └── sitemap.xml              # Search engine XML URL index
├── docs/                        # Complete technical & architecture documentation
└── src/
    ├── main.tsx                 # React DOM mount point (`createRoot(root).render(<App />)`)
    ├── App.tsx                  # Root application router, hash listener, view mode switch
    ├── index.css                # Global Tailwind CSS imports and utility classes
    ├── types/
    │   ├── index.ts             # Core domain types (ViewMode, FileEntry, MoveOperation)
    │   └── mammoth.d.ts         # TypeScript declarations for Mammoth DOCX reader
    ├── utils/
    │   ├── diffFormatters.ts    # Diff formatters and syntax highlighting utilities
    │   ├── fileUtils.ts         # File ingestion, reading, and blob handling helpers
    │   └── jsonXml.ts           # Bidirectional JSON ↔ XML converter with attribute parsing
    ├── data/
    │   └── resumeData.ts        # Prakash Choudhary's real portfolio data, projects & experience
    ├── pages/
    │   └── PortfolioPage.tsx    # Full-page portfolio, tech themes, timeline, and resume links
    └── components/
        ├── Common/
        │   └── PSDevLogo.tsx    # Reusable vector brand logo with developer brackets
        ├── Layout/
        │   └── Toolbar.tsx      # Persistent top navigation bar, tabs, and rotating quotes
        ├── CommandPalette/
        │   └── CommandPalette.tsx # ⌘K global quick search across all tools & portfolio
        ├── About/
        │   └── AboutPanel.tsx   # Slide-over builder drawer with bio, LinkedIn, and CTAs
        ├── Ads/
        │   └── AdBanner.tsx     # Google AdSense responsive ad container
        ├── TextCompare/
        │   └── TextCompareView.tsx # Side-by-side & unified Monaco text diff engine
        ├── FileCompare/
        │   └── FileCompareView.tsx # Multi-file & folder directory tree diff comparator
        ├── FolderCompare/       # Recursive folder tree comparison components
        ├── CodeMover/           # Per-line diff moving and cherry-picking strip
        ├── ApiStudio/
        │   └── ApiStudioView.tsx # ApiDesk: Postman runner, GraphQL builder & Swagger explorer
        ├── HarViewer/
        │   └── HarViewerView.tsx # HAR Network Waterfall inspector & token sanitizer
        ├── JwtStudio/
        │   └── JwtStudioView.tsx # JWT debugger, claims decoder & signature inspector
        ├── JsonTools/
        │   └── JsonToolsView.tsx # JSON to Table, tree explorer, validator & XML converter
        ├── UuidStudio/
        │   └── UuidStudioView.tsx # UUID v4/v7, Snowflake, ULID & NanoID generator
        ├── RegexLab/
        │   └── RegexLabView.tsx # Interactive regex matcher, flag toggles & preset library
        ├── ArchitectureLab/
        │   └── ArchitectureLabView.tsx # Mermaid diagram renderer & ERD visual designer
        ├── PdfStudio/
        │   └── PdfStudioView.tsx # Client-side Word DOCX to PDF, merge, split & compress
        ├── ImageStudio/
        │   └── ImageStudioView.tsx # Image crop, aspect ratio resizer, compressor & SVG
        ├── Base64Image/
        │   └── Base64ImageView.tsx # Drag-and-drop Image ↔ Base64 bidirectional tool
        ├── TimeZone/
        │   └── TimeZoneView.tsx # World timezones, Unix epoch clock & ISO 8601 converter
        ├── MarkupStudio/
        │   └── MarkupStudioView.tsx # Live HTML sandbox, Markdown, SQL & XML formatters
        ├── CaseConverter/
        │   └── CaseConverterView.tsx # CamelCase, snake_case, kebab-case string converter
        ├── UrlTools/
        │   └── UrlToolsView.tsx # URL encoder/decoder and query parameter parser
        └── Portfolio/
            ├── Projects3DSection.tsx # Projects gallery with portal modal & filter pills
            ├── LanguageThemes.ts     # 5 developer themes (Node, Python, TS, Go, Rust)
            └── SoundFX.ts            # Web Audio API synthesizers for micro-interactions
```

---

## 2. Key Modules & Functional Responsibilities

### 1. `src/main.tsx`
- The application bootstrap entry point.
- Attaches the React root to `<div id="root">` in `index.html`.
- Renders the root `<App />` component in StrictMode.

### 2. `src/App.tsx`
- **Hash Router**: Listens to `window.location.hash` changes via the custom `useHashRoute` hook and maps paths (e.g. `#/diff-checker`, `#/har`, `#/pdf`) to the `ViewMode` enum.
- **Dynamic SEO Engine**: Updates `document.title`, `meta[name="description"]`, and OpenGraph properties upon route transitions, and fires anonymous Google Analytics 4 pageview events.
- **View Concurrency**: Mounts all studio utilities in an absolute-positioned container, using visibility toggling (`invisible pointer-events-none`) to preserve editor undo histories, inputs, and scroll positions across tool switches.
- **Portfolio Takeover**: Renders `PortfolioPage.tsx` as a full-page takeover when `hash === '#/portfolio'`.

### 3. `src/components/Layout/Toolbar.tsx`
- Renders the primary application header.
- Displays `PSDevLogo` on the left.
- Contains the horizontally scrollable tool navigation tabs with auto-centering on the active tab (`scrollIntoView({ inline: 'center' })`).
- Houses the daily inspirational engineering quote fetched from `Quotable API` (with local storage caching and cross-fade animation).
- Action buttons pinned on the right: Command Palette trigger (`⌘K`), About Drawer trigger, and full-screen view controls.
- **Constraint**: `PDF Studio` is positioned strictly as the final tab in the navigation list.

### 4. `src/components/CommandPalette/CommandPalette.tsx`
- Global search modal listening for `⌘K` (macOS) and `Ctrl+K` (Windows/Linux).
- Searches across all 15+ utilities and developer projects using keyword matching.
- Supports keyboard navigation (Arrow Up, Arrow Down, Enter to select, Escape to close).

### 5. `src/pages/PortfolioPage.tsx`
- Full-page showcase highlighting Prakash Choudhary's career achievements, leadership stats, work history, skills matrix, and project portfolio.
- **5 Language Themes (`LanguageThemes.ts`)**: Supports instantaneous palette switching between Node.js (Emerald), Python (Sky & Gold), TypeScript (Blue & Cyan), Go (Aqua), and Rust (Bronze & Crimson).
- **Direct Resume PDF Download**: Integrates verified Google Drive direct download and web preview links.

### 6. `src/components/Portfolio/Projects3DSection.tsx`
- Interactive project showcase grid presenting 10 real production systems (Kafbat UI, PSDevTool, ApiDesk, Wealth Management, Drishti, Resume AI, Ask My Docs, Safety App, InkMind, FleetMind).
- Category filtering pills: All, Kafka & Distributed Systems, AI & GenAI Systems, Developer Workspaces, and FinTech & Analytics.
- **Architectural Inspection Modal**: Rendered via `createPortal(..., document.body)` with automated body scroll lock and Escape key handling, ensuring it opens centered in the user's viewport without clipping.
