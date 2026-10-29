# Data Flow & Processing Architecture: PSDevTool

This document specifies how data enters, transitions through memory, transforms, and exits the PSDevTool system.

---

## 1. End-to-End Data Flow Model

```mermaid
flowchart LR
    subgraph Data_Inputs [Data Entry Ingestion]
        P1[Clipboard Paste<br/>Text, JSON, cURL, JWT]
        P2[Local File API<br/>.docx, .har, .pdf, .png, code]
        P3[URL Hash State<br/>#/diff, #/har, #/pdf]
        P4[Direct User Input<br/>Monaco, Regex, Forms]
    end

    subgraph Memory_Processing_Boundary [Ephemeral Browser RAM (Zero Server Boundary)]
        direction TB

        subgraph Validation_Sanitization [Validation & Pre-Processing]
            V1[cURL Regex Parser]
            V2[Base64 Signature Check]
            V3[HAR Schema Validator]
            V4[DOCX Zip Verifier]
        end

        subgraph In_Memory_Transformation [Transformation & AST Engines]
            T1[diff AST - Myers line chunks]
            T2[Monaco Language Tokenizer Worker]
            T3[Mammoth / pdf-lib Vector Tree]
            T4[Mermaid Diagram Lexer & SVG Generator]
            T5[Web Crypto SHA-256 / HMAC Engine]
            T6[JSON / XML / YAML Serializers]
        end

        subgraph State_Management [Reactive React State]
            S1[ViewMode Hash State]
            S2[Active Editor Buffers & Undo/Redo Stacks]
            S3[Filter Criteria & Search Query State]
            S4[Language Theme Context]
        end
    end

    subgraph Data_Outputs [Data Exit & Presentation]
        O1[Monaco Rendered Viewport]
        O2[Clipboard Copy with Toast]
        O3[Direct Browser File Download - Blob]
        O4[Vector SVG / PNG Export]
        O5[Google Analytics 4 Anonymous Pageview]
    end

    P1 & P2 & P4 --> Validation_Sanitization
    P3 --> State_Management
    Validation_Sanitization --> In_Memory_Transformation
    In_Memory_Transformation <--> State_Management
    State_Management --> O1 & O2 & O3 & O4
    S1 -.-> O5
```

---

## 2. Ingestion Pipelines & Data Sanitization

### A. Clipboard Ingestion
- **Handling**: Intercepted via standard paste events (`onPaste`) or `navigator.clipboard.readText()`.
- **Sanitization**: In `ApiDesk`, raw pasted strings are evaluated against regex patterns (`/^curl\s+/i`). If matching, arguments (`-X`, `-H`, `-d`, `--data-raw`, `-u`, `--url`) are parsed into distinct HTTP elements (method, headers, body, URL) without executing shell sub-processes.

### B. Local File Ingestion
- **Handling**: Ingestion via HTML5 Drag and Drop (`DragEvent`) or `<input type="file">`.
- **Binary vs Text Routing**:
  - Code and text files are ingested via `FileReader.readAsText()`.
  - DOCX, PDF, and HAR files are read into `ArrayBuffer` via `FileReader.readAsArrayBuffer()` to preserve binary headers (PK zip signatures, PDF-1.7 markers).
  - Images are read via `FileReader.readAsDataURL()` for immediate zero-latency canvas rendering.

---

## 3. Transformation & Processing Engines

| Processing Domain | Input Format | Transformation Engine | Output Format | Memory Footprint |
| :--- | :--- | :--- | :--- | :--- |
| **Code Comparison** | UTF-8 String (Left & Right) | Myers Diff Algorithm (`diff`) | Array of Change Objects (`added`, `removed`, `value`) | Ephemeral (O(N+D)) |
| **Word to PDF** | OpenXML Binary `.docx` | `JSZip` + `mammoth` + `pdf-lib` | Synthesized `application/pdf` Blob | Ephemeral buffer |
| **Network Waterfall** | HTTP Archive `.har` JSON | JSON Parser + Timeline Metric Aggregator | Canvas coordinate series + Filtered Entry Map | Proportional to HAR size |
| **JWT Analysis** | Raw Base64URL string | `atob()` + `JSON.parse` + `Intl.DateTimeFormat` | Formatted claims object + human-readable timestamps | < 10 KB |
| **JSON to Table** | Raw JSON array or object | Recursive Key Flattener & Schema Detector | Interactive HTML5 Data Table with Column Sorting | In-memory DOM nodes |
| **Architecture Diagram**| Plain text Mermaid DSL | `mermaid.render()` | Scalable Vector Graphics (`<svg>`) | In-memory SVG DOM |

---

## 4. State Management & Persistence Policy

### Zero-Server Transmission Policy
- **Absolute Privacy Guarantee**: PSDevTool maintains **no backend database** and **no telemetry proxies**. User-entered code, diffs, API endpoints, tokens, and documents never leave the client's local memory.
- **Network Isolation**: The only outbound network requests permitted are:
  1. User-initiated API requests executed via `ApiDesk Studio` (which communicate directly with the user's targeted endpoint).
  2. Anonymous static Google Analytics 4 pageview counters (`gtag.js` for URL hash navigation tracking, with zero payload metadata).
  3. Daily quote rotation fetch (`api.quotable.io`, cached locally for 24 hours).

### Browser Local Storage (`localStorage`)
PSDevTool strictly limits `localStorage` utilization to non-sensitive user preferences:
- `dw_quotes_cache`: Stores the daily quote object (`{ date: YYYY-MM-DD, quotes: [...] }`) to eliminate redundant daily network requests.
- All workspace data (diff buffers, file comparisons, API test bodies, and diagrams) are kept strictly in ephemeral React component state and are discarded upon tab closure, guaranteeing zero local residual footprint on shared workstations.
