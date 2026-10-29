# Project Overview: PSDevTool

## 1. Executive Summary
**PSDevTool** (hosted at `https://psdevtool.online/`) is an enterprise-grade, all-in-one developer diagnostic workstation, code diff engine, and client-side conversion studio. Built entirely with **React 19**, **TypeScript**, and **Vite**, PSDevTool consolidates 15+ essential daily engineering utilities into a unified, zero-install, zero-server-dependency browser application.

The platform was architected and engineered by **Prakash Choudhary**, a Senior Software Engineer with 9+ years of experience leading distributed systems, Kafka pipelines, and cloud-native architectures.

---

## 2. The Problem It Solves

### The Fragmented Developer Tooling Problem
Modern software engineers, devops practitioners, and technical architects frequently switch between disparate, single-purpose web utilities to perform routine diagnostic tasks:
- Online diff checkers often sell ads, leak proprietary code to remote servers, or truncate large payloads.
- JSON formatters, JWT decoders, and HAR viewers often send confidential authorization headers, API keys, or proprietary database schemas across third-party networks.
- Tools for Word-to-PDF conversion often require users to upload sensitive corporate documents (NDAs, contracts, financial tables) to opaque backend servers.
- Developers routinely keep 10–15 tabs open (Postman, JWT.io, Regex101, DiffChecker, EpochConverter, Mermaid Live Editor, Base64 tools), causing memory bloat and workflow interruptions.

### The PSDevTool Solution
PSDevTool solves these pain points by offering:
1. **100% Client-Side Execution (Zero Server Leakage)**: Every operation—diff calculation, token decoding, HAR parsing, PDF synthesis, regex matching, and image processing—happens strictly inside the user's browser memory (WebAssembly, Web Workers, Canvas, and browser DOM APIs). No user code or payload ever leaves the machine.
2. **Integrated Multi-Tool Suite**: Diff Checker, HAR Waterfall Inspector, ApiDesk (REST, GraphQL, Swagger), JWT Debugger, JSON/YAML tools, UUID/Snowflake generator, Architecture Lab, PDF Studio, Image Studio, and more—all synchronized in a single high-performance interface.
3. **Instant Universal Command Palette (`⌘K` / `Ctrl+K`)**: Rapid keyboard-first navigation enabling sub-second switching between all utilities without touching the mouse.
4. **Offline Capability & Zero Latency**: Because there are no backend network hops for computations, operations execute with near-zero latency, even with massive files or offline network conditions.

---

## 3. Main Features & Functionality

| Utility Module | Primary Functionality | Core Technology |
| :--- | :--- | :--- |
| **Monaco Diff Checker** | Side-by-side and unified text/code comparison with syntax highlighting for 50+ languages, folder/directory tree diff, synchronized scrolling, and line moving. | `monaco-editor`, `diff` |
| **ApiDesk Studio** | Postman-like REST & GraphQL runner, automatic cURL paste parser, request parameters/headers/body, and bidirectional OpenAPI/Swagger YAML ↔ JSON explorer. | `yaml`, native Fetch API |
| **HAR File Viewer** | HTTP Archive inspector, waterfall request timeline, TTFB analysis, status codes, payload headers, and sensitive token sanitization. | JSON stream parsing, Canvas |
| **JWT Debugger** | Client-side JSON Web Token decoder, header/claims inspector, expiration date calculator, and signature verification. | Web Crypto API |
| **JSON & YAML Tools** | JSON to interactive Table viewer, collapsible tree view, syntax validator with error line markers, minifier, and bidirectional JSON ↔ XML converter. | `yaml`, `xml-formatter` |
| **UUID & Snowflake** | High-throughput generator for UUID v4, UUID v7 (time-ordered), Twitter Snowflake IDs, ULID, NanoID, and MongoDB ObjectIds. | Crypto RNG |
| **Regex Lab** | Real-time pattern matcher, flag toggles, capture group inspector, syntax explanation, and regex preset library. | `@eslint-community/regexpp` |
| **Architecture Lab** | Live Mermaid diagram renderer (Flowchart, Sequence, Class, State, ERD) and visual database schema builder with vector SVG/PNG export. | `mermaid`, `@xyflow/react` |
| **PDF & Word Studio** | Convert Word (.docx) to PDF without uploading, merge, split, compress, and image-to-PDF generator. | `pdf-lib`, `docx-preview`, `mammoth` |
| **Image Studio** | Precision image cropper (1:1, 16:9, 4:3), aspect ratio resizer, canvas-based image compressor with quality control, and SVG converter. | HTML5 Canvas, `html-to-image` |
| **Timezone & Epoch** | Global world clocks, UTC to local mapping, Unix epoch timestamp converter (seconds/milliseconds), and ISO 8601 formatter. | `Intl.DateTimeFormat` |
| **Markup Studio** | Live HTML/CSS/JS preview sandbox, Markdown parser, SQL formatter, and XML beautifier. | `sql-formatter`, `xml-formatter` |
| **Developer Portfolio** | Interactive engineering showcase presenting 10 production projects, 5 language themes (Node.js, Python, TS, Go, Rust), and resume download. | React 19, Tailwind CSS |

---

## 4. Target Users and Personas

1. **Software Engineers & Backend Developers**:
   - Inspecting Git diffs, comparing API payloads, generating UUID v7/Snowflake IDs, and testing REST/GraphQL endpoints with cURL.
2. **Site Reliability Engineers (SRE) & DevOps**:
   - Debugging production outages via HAR network waterfalls, analyzing TTFB delays, and checking JWT auth token expiry and claims without logging secrets.
3. **System Architects & Engineering Leads**:
   - Creating cloud system architecture flowcharts, sequence diagrams, and database ERD schemas for documentation and RFC proposals.
4. **Security Engineers & Analysts**:
   - Inspecting raw JSON Web Tokens, sanitizing sensitive authorization headers, and verifying base64-encoded binary assets.
5. **Product Managers & Technical Recruiters**:
   - Evaluating the architect's engineering breadth, hands-on technical depth, design discipline, and real-world project achievements.

---

## 5. Business Value & ROI

- **Data Privacy & Compliance**: Fully client-side architecture guarantees zero compliance exposure under GDPR, HIPAA, and SOC-2. Confidential code and credentials never hit external servers.
- **Zero Operating Costs**: Because all processing runs on the client's device, cloud hosting costs are virtually zero (static CDN delivery on Cloud Run / Vercel / GitHub Pages).
- **Engineering Productivity**: Eliminates context-switching between 10+ disjointed browser tabs, saving developers an estimated 15–30 minutes daily.
- **High Availability**: Immune to third-party API downtime, rate limits, or paywalls. Functions completely offline once loaded in the browser.
