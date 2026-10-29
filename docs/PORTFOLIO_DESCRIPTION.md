# Portfolio Showcase: PSDevTool

## 1. Project Overview & Quick Facts

- **Project Name**: PSDevTool (All-in-One Developer Diagnostic & Code Studio)
- **Live Production URL**: [https://psdevtool.online/](https://psdevtool.online/)
- **GitHub Repository**: [https://github.com/pspcps/diffwise](https://github.com/pspcps/diffwise)
- **Architect & Lead Engineer**: Prakash Choudhary (Senior Software Engineer & Systems Architect)
- **Period**: 2026 – Present
- **Primary Tech Stack**: React 19, TypeScript, Vite, Monaco Editor, Tailwind CSS, Mermaid, pdf-lib, Web Crypto API

---

## 2. Recruiter & Hiring Manager Summary

> **"A high-performance, privacy-first developer workstation and diagnostic studio running 100% in the client's browser with zero server data leakage. Consolidates Monaco code diffing across 50+ languages, an interactive Postman/Swagger API workbench, HAR network waterfall inspector, JWT debugger, Mermaid architecture diagram compiler, and client-side Word-to-PDF conversion into a unified, zero-install workspace."**

### Why It Matters:
- **Zero Compliance Exposure**: Unlike traditional web utilities (DiffChecker, JWT.io, online PDF converters) that ingest and expose confidential corporate code, tokens, and contracts to remote servers, PSDevTool operates entirely inside the browser's V8 memory.
- **Enterprise-Grade Craftsmanship**: Built with strict TypeScript (`verbatimModuleSyntax`), React 19 concurrent features, Monaco Web Workers, and hardware-accelerated Canvas/Web Crypto APIs.
- **Extreme User Experience**: Instantaneous keyboard navigation (`⌘K` Command Palette), 5 language developer color themes (Node.js, Python, TypeScript, Go, Rust), and zero layout shift (CLS = 0).

---

## 3. Engineering Highlights & Complex Challenges Solved

### Challenge 1: Running VS Code's Monaco Diff Engine at Scale in a Browser SPA
- **Problem**: Mounting dual Monaco instances with syntax highlighting for 50+ languages can cause substantial DOM bloat, high initial bundle sizes, and UI frame drops on large files.
- **Engineering Solution**: 
  - Integrated Monaco's background Web Workers to decouple tokenizer compute from the UI thread.
  - Implemented DOM virtualization, ensuring only visible lines are rendered in the DOM, maintaining 60 fps scrolling even on 100,000+ line diff comparisons.
  - Built an interactive per-line diff mover strip (`CodeMover`) that dynamically injects ViewZones and allows cherry-picking line chunks across buffers with live delta recalculation.

### Challenge 2: Client-Side Word (.docx) to PDF Synthesis Without Server Uploads
- **Problem**: Most PDF conversion tools upload files to heavy backend LibreOffice or headless Chromium containers. Running this in-browser requires parsing complex OpenXML XML trees and re-synthesizing low-level PDF vector instructions.
- **Engineering Solution**: 
  - Architected a client-side parsing pipeline leveraging `JSZip`, `mammoth`, and `docx-preview` to inspect XML document structures, tables, font hierarchies, and embedded image assets.
  - Piped the resulting layout model directly into `pdf-lib` to construct a compliant, binary PDF stream in memory, triggering a direct Blob download with zero bytes transmitted over the network.

### Challenge 3: Eliminating CSS Transform Coordinate Traps for Modals
- **Problem**: In complex CSS animations, ancestor elements with `transform`, `perspective`, or `filter` act as containing blocks for `position: fixed` elements, causing modal dialogs to appear thousands of pixels down the page when clicked.
- **Engineering Solution**: 
  - Restructured modal rendering through React Portals (`createPortal(..., document.body)`).
  - Paired with automated document scroll locking (`overflow: hidden`), Escape key listener, and `max-h-[88vh]` flexbox internal scrolling, ensuring dialogs always appear centered in the user's active screen viewport across mobile and desktop.

### Challenge 4: Zero Layout Shift (CLS = 0) While Preserving High-Intent SEO
- **Problem**: Single Page Applications often show raw fallback text or blank white screens before React hydration, hurting Cumulative Layout Shift (CLS) and user trust.
- **Engineering Solution**: 
  - Replaced raw fallback text with a dark `#11111b` styled preloader matching the exact production UI theme.
  - Preserved 100% of rich semantic crawlability by placing SEO structured articles in `<noscript>` containers and screen-reader accessible DOM containers (`clip: rect(0,0,0,0)`), alongside complete JSON-LD `WebApplication` and `FAQPage` schemas in `<head>`.

---

## 4. Verified Technology Matrix

| Category | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19.2.4, TypeScript (Strict Mode), Vite 8.0.4 |
| **Code & Editor Core** | Monaco Editor 0.55.1, diff (Myers Diff Algorithm) |
| **Visual Architecture** | Mermaid 12.2.0, @xyflow/react (ReactFlow) 12.12.0 |
| **Document & Media Engine** | pdf-lib 1.17.1, mammoth 1.13.0, docx-preview 0.4.1, HTML5 Canvas 2D |
| **Data & Serialization** | yaml 2.9.1, xml-formatter 3.7.0, sql-formatter 15.9.0, prettier |
| **Styling & UI Shell** | Tailwind CSS 3.4.19, Lucide React Icons |
| **Security & Privacy** | W3C Web Crypto API, iframe sandboxing, 1-Click HAR token sanitizer |

---

## 5. Summary for Engineering Managers

PSDevTool demonstrates deep systems thinking, user empathy, and frontend architectural rigor:
- **Architectural Discipline**: Strict separation of concerns between Shell, Studio Domain Engines, Parsing Layer, and Hardware Platform APIs.
- **Code Quality**: Zero TypeScript `any` escapes, zero compiler warnings, and robust error boundaries preventing cascading component failures.
- **Product Velocity & Scale**: Demonstrates the ability to build, optimize, and ship production-ready developer tooling used by thousands of engineers worldwide.
