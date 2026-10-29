# System Architecture: PSDevTool

## 1. High-Level Architectural Diagram

```mermaid
graph TD
    subgraph Browser_Client_Environment [Client Browser Runtime (Zero Server Dependency)]
        direction TB

        subgraph Presentation_Layer [Presentation & Shell Layer]
            App[App.tsx - Hash Router & Mode Controller]
            Toolbar[Toolbar.tsx - Studio Switcher & Daily Quote]
            CmdPalette[CommandPalette.tsx - ⌘K Fuzzy Search]
            AboutDrawer[AboutPanel.tsx - Slide-over Bio]
            PortPage[PortfolioPage.tsx - Interactive Engineering Showcase]
        end

        subgraph Core_Studio_Engines [Domain Studio Engines (Lazy-Loaded)]
            DiffEngine[TextCompareView & FileCompareView<br/>Monaco Dual Instance + CodeMover]
            ApiStudio[ApiStudioView<br/>REST/GraphQL Runner + Swagger Explorer]
            HarStudio[HarViewerView<br/>HAR Waterfall & Token Sanitizer]
            JwtStudio[JwtStudioView<br/>JWT Decoder & Claims Inspector]
            JsonStudio[JsonToolsView<br/>JSON Table, Tree & XML Bidirectional]
            ArchLab[ArchitectureLabView<br/>Mermaid Live Renderer + ERD Flow Designer]
            PdfStudio[PdfStudioView<br/>Client-side DOCX to PDF, Merge, Split]
            ImageStudio[ImageStudioView & Base64ImageView<br/>Canvas Crop, Compress & SVG Generator]
            UtilEngines[RegexLab, TimeZone, UuidStudio, MarkupStudio, CaseConverter]
        end

        subgraph Client_Processing_Libraries [Client-Side Computing & Parsing Layer]
            MonacoLib[monaco-editor & @monaco-editor/react]
            DiffLib[diff - Myers Diff Algorithm]
            MermaidLib[mermaid v12 - SVG Diagram Engine]
            PdfLib[pdf-lib, mammoth, docx-preview]
            YamlXmlLib[yaml, xml-formatter, sql-formatter]
            RegexppLib[@eslint-community/regexpp]
            XyflowLib[@xyflow/react - Graph Canvas]
        end

        subgraph Browser_Platform_APIs [Browser Hardware & Platform APIs]
            WebWorkers[Web Workers - Syntax & Monaco Background Thread]
            CanvasAPI[HTML5 Canvas 2D - Image Compression & Cropping]
            WebCrypto[Web Crypto API - Crypto RNG & SubtleCrypto HMAC]
            LocalFS[FileReader & Drag-and-Drop File API]
            LocalStorage[Browser localStorage - Preferences & Daily Quotes]
        end
    end

    %% Flow Connections
    App --> Toolbar
    App --> CmdPalette
    App --> AboutDrawer
    App --> PortPage
    App --> Core_Studio_Engines

    DiffEngine --> MonacoLib
    DiffEngine --> DiffLib
    ApiStudio --> YamlXmlLib
    HarStudio --> CanvasAPI
    JwtStudio --> WebCrypto
    JsonStudio --> YamlXmlLib
    ArchLab --> MermaidLib
    ArchLab --> XyflowLib
    PdfStudio --> PdfLib
    ImageStudio --> CanvasAPI
    UtilEngines --> RegexppLib
    UtilEngines --> WebCrypto

    Core_Studio_Engines --> LocalFS
    Core_Studio_Engines --> LocalStorage
    MonacoLib --> WebWorkers
```

---

## 2. Layered Architecture Breakdown

PSDevTool adheres to a clean, modular 4-layer client architecture:

### Layer 1: Shell & Routing Layer
- **Hash-Based Router (`App.tsx`)**: Utilizes URL hash routing (`#/diff-checker`, `#/har`, `#/jwt`, `#/api`, `#/pdf`, `#/portfolio`) to maintain deep-linkable URLs without requiring server-side fallback rules or Express rewrites.
- **Dynamic SEO & Meta Sync**: Dynamically updates `document.title`, `meta[name="description"]`, `og:title`, and `og:description` as the user navigates between studio utilities or views the portfolio.
- **Top Command Shell (`Toolbar.tsx`)**: Provides persistent mode navigation, responsive horizontal tab scrolling with auto-centering, and pinned action triggers (Search `⌘K`, About profile).
- **Global Command Palette (`CommandPalette.tsx`)**: Intercepts `⌘K` / `Ctrl+K` keybindings globally, enabling fast fuzzy keyword search across all studio utilities and portfolio projects.

### Layer 2: Domain Studio Engines (Feature Modules)
Each studio utility operates as an isolated, self-contained functional domain with dedicated state, inputs, controls, and outputs:
- **Diff Checker**: Maintains left and right text buffers, sync-scroll listeners, diff calculation states, and code swap/mover actions.
- **ApiDesk**: Manages active request configurations (method, URL, headers, query params, body), tab selection (REST, GraphQL, Swagger), and response metrics.
- **HAR Viewer**: Handles `.har` file ingestion, parsing, timeline aggregation, search/filter criteria, and waterfall entry inspection.
- **Architecture Lab**: Manages Mermaid code editor state, live SVG compilation, zoom/pan transforms, and ERD visual database entities.
- **PDF Studio**: Manages multi-file drag-and-drop queues, DOCX binary parsing, PDF page merging/splitting, and client-side canvas preview.

### Layer 3: Utility & Parsing Engines
Specialized, high-performance client libraries run within the browser thread:
- `monaco-editor`: Syntax highlighting, tokenize workers, folding, minimap, and diff navigation.
- `diff`: Myers diff algorithm executing in-memory line-by-line and character-by-character delta computations.
- `mermaid`: Client-side AST parsing and vector SVG generation for technical diagrams.
- `pdf-lib` & `mammoth`: Low-level binary manipulation of PDF streams and OpenXML DOCX document trees.
- `yaml`, `xml-formatter`, `sql-formatter`: AST formatting and bidirectional serialization.

### Layer 4: Browser Platform Runtime
- **Web Workers**: Monaco runs language workers (TypeScript, HTML, CSS, JSON) in parallel background threads to prevent UI lockups during syntax parsing.
- **Web Crypto API**: Provides hardware-accelerated cryptographically secure random number generation (`crypto.getRandomValues`) for UUID v4/v7 and signature validation.
- **HTML5 Canvas**: Powers image cropping, aspect ratio resampling, and lossy JPEG/WebP image compression.

---

## 3. Key Architectural Decisions & Trade-Offs

### 1. Hash-Based Routing vs. Path-Based History API
- **Decision**: Implemented `#/diff-checker`, `#/har`, `#/pdf`, etc.
- **Rationale**: Single Page Applications hosted on static CDNs, GitHub Pages, or object stores (S3/Cloud Storage) require complex rewrite rules for path routing (`/diff-checker` yields 404 on hard refresh without server support). Hash routing guarantees 100% reliable deep links across any static hosting environment without backend configuration.

### 2. Code-Splitting & Dynamic Imports for Heavy Engines
- **Decision**: Heavy studio engines (`PdfStudioView`, `ArchitectureLabView`, `HarViewerView`, `JwtStudioView`, `UuidStudioView`, `ApiStudioView`, `ImageStudioView`) are wrapped in `React.lazy()` and `Suspense`.
- **Rationale**: Prevents initial bundle bloat. The initial page load only pulls the lightweight shell and core diff view (~120KB gzipped). Massive libraries like `mermaid` (800KB+) and `pdf-lib` (400KB+) only load when the user switches to those specific tabs.

### 3. Preserving View State Across Tab Switches
- **Decision**: In `App.tsx`, active core views use CSS visibility toggling (`absolute inset-0 invisible pointer-events-none`) rather than unmounting.
- **Rationale**: Developers frequently switch between tabs (e.g. copying a JWT token from Diff Checker to JWT Debugger, or checking an API response while viewing a diagram). Preserving mounted DOM nodes prevents losing unsaved text inputs, undo history, scroll positions, or editor configurations.

### 4. React Portals for Modals
- **Decision**: All modal dialogs (Project Architectural Inspection, Command Palette) are rendered via `createPortal(..., document.body)`.
- **Rationale**: Under CSS specifications, any ancestor element with `transform`, `perspective`, or `filter` properties creates a new containing block for `position: fixed` elements. Portaling directly to `document.body` guarantees modals are always anchored to the true browser viewport without clipping, scroll offsets, or positioning traps.
