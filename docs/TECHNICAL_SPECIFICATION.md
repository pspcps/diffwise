# Technical Specifications: PSDevTool

## 1. System Technology Stack

| Dimension | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime Environment** | Node.js (build), Modern Web Browsers (runtime) | Node 20+, Chrome 110+, Firefox 110+, Safari 16+ | Execution environment |
| **Frontend Framework** | React | 19.2.4 | Declarative reactive UI components |
| **DOM Renderer** | React DOM | 19.2.4 | Concurrent DOM mounting & Portals |
| **Type System** | TypeScript | 6.0.2 / 5.x | Strict type safety (`verbatimModuleSyntax`) |
| **Build Tooling & Dev Server**| Vite | 8.0.4 | ES module dev server, Rollup bundler |
| **Code Editor Engine** | Monaco Editor | 0.55.1 (`@monaco-editor/react` 4.7.0) | Multi-language code editor & diff viewer |
| **Styling & Design System** | Tailwind CSS + PostCSS | 3.4.19 / 8.5.9 | Utility-first responsive CSS, dark theme |
| **Diagram & Visual Graphs** | Mermaid + @xyflow/react | 12.2.0 / 12.12.0 | Architecture diagrams, flowcharts, ERD |
| **Document Processing** | pdf-lib + mammoth + docx-preview | 1.17.1 / 1.13.0 / 0.4.1 | In-browser PDF synthesis and DOCX parsing |
| **Diff Engine** | diff (npm) | 8.0.4 | Myers diff calculation algorithm |
| **Formatters & Serializers** | prettier, sql-formatter, xml-formatter, yaml | Latest stable | Multi-format code beautification |
| **Regex Parser** | @eslint-community/regexpp | 4.12.2 | AST regex parsing & validation |
| **Iconography** | Lucide React | 1.8.0 | Minimalist vector SVG icons |

---

## 2. Compiler & TypeScript Configuration

The project operates under strict TypeScript rules (`tsconfig.json`):
- `target`: `ES2022`
- `module`: `ESNext`
- `moduleResolution`: `bundler`
- `strict`: `true` (enforces strict null checks, no implicit any, and strict function types)
- `verbatimModuleSyntax`: `true` (ensures explicit type imports `import type { ... }`)
- `jsx`: `react-jsx` (React 19 JSX runtime)

---

## 3. Core Data Structures & Type Definitions (`src/types/index.ts`)

```typescript
// Active Studio Utility View Mode
export type ViewMode = 
  | 'text'          // Monaco Diff Checker
  | 'file'          // Folder & Directory Tree Diff
  | 'case'          // Text Case Converter
  | 'json'          // JSON Table, Tree & Validator
  | 'time'          // Time Zone & Unix Epoch Clock
  | 'base64'        // Base64 Image Encoder / Decoder
  | 'markup'        // HTML, Markdown & XML Sandbox
  | 'regex'         // Regex Lab & Debugger
  | 'url'           // URL Encoder / Decoder & Query Parser
  | 'architecture'  // Architecture Lab & ERD Designer
  | 'image_studio'  // Image Crop, Resizer & Compressor
  | 'har'           // HAR File Network Waterfall Viewer
  | 'jwt'           // JWT Debugger & Token Claims Inspector
  | 'uuid'          // UUID v4/v7, Snowflake & ULID Generator
  | 'api'           // ApiDesk REST & GraphQL Runner
  | 'pdf';          // Word to PDF & PDF Studio

// Folder Tree File Entry
export interface FileEntry {
  name: string;
  path: string;
  content: string;
  language?: string;
}

// Folder Tree Directory Entry
export interface FolderEntry {
  name: string;
  path: string;
  children: (FolderEntry | FileEntry)[];
  isDirectory: true;
}

// Diff Status Indicator
export type DiffStatus = 'added' | 'removed' | 'modified' | 'identical';

// Folder Comparison Item Model
export interface FolderDiffItem {
  path: string;
  name: string;
  isDirectory: boolean;
  status: DiffStatus;
  leftContent?: string;
  rightContent?: string;
  children?: FolderDiffItem[];
}

// Interactive Code Selection for Line Mover
export interface CodeSelection {
  startLine: number;
  endLine: number;
  content: string;
  sourceFile: 'left' | 'right';
}

// Code Transfer Operation between Buffers
export interface MoveOperation {
  selection: CodeSelection;
  targetFile: 'left' | 'right';
  targetLine: number;
}
```

---

## 4. Third-Party Integrations & External Endpoints

1. **Google Analytics 4 (GA4)**:
   - Measurement ID: `G-2TGC5PMVX7`
   - Purpose: Real-time traffic, country distribution, and view mode popularity.
   - Behavior: Sends zero personal data or user code; only emits standard `page_view` events triggered by hash route transitions.
2. **Google AdSense**:
   - Client ID: `ca-pub-4337594386208236`
   - Purpose: Monetization support via non-intrusive banner slots (`AdBanner.tsx`).
3. **Quotable API (`api.quotable.io`)**:
   - Endpoint: `https://api.quotable.io/quotes/random?limit=8&maxLength=110`
   - Purpose: Daily developer quote rotation displayed in `Toolbar.tsx`.
   - Fallback: Local array of 5 pre-compiled quotes cached if offline or rate-limited.
4. **Monaco Editor CDN**:
   - Base URL: `https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs`
   - Purpose: Lazy-loads Monaco workers and syntax grammars on demand.

---

## 5. Error Handling & Resilience Architecture

1. **JSON & YAML Parsing Fault Isolation**:
   - Uses `try/catch` with regex line-pointer extraction (`at line X, column Y`).
   - Rather than crashing the component, errors are rendered in a dedicated red diagnostic badge highlighting the exact line number.
2. **Mermaid Rendering Sandbox**:
   - Mermaid parse errors are trapped via `mermaid.parse()`. Syntax errors display an inline warning with the offending keyword rather than corrupting the DOM.
3. **DOCX Parsing Error Recovery**:
   - If a corrupted `.docx` or invalid ZIP is dropped into PDF Studio, a localized toast notification reports "Invalid or corrupted DOCX archive" without crashing the tab.
4. **Network CORS Fallback in ApiDesk**:
   - When external APIs block browser requests due to CORS policies, ApiDesk captures the `TypeError: Failed to fetch` and renders clear remediation instructions, accompanied by a copyable `cURL` command for terminal execution.
