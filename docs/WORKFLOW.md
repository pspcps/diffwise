# Application Workflows & User Journeys: PSDevTool

This document maps the end-to-end application workflows, user interaction cycles, and execution pipelines across PSDevTool's core utilities.

---

## 1. Monaco Code & Text Diff Comparison Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as Developer
    participant UI as Diff UI (TextCompareView)
    participant Parser as File & Format Parser
    participant Myers as Diff Calculation Engine (diff npm)
    participant Monaco as Dual Monaco Editor Instance
    participant Mover as Line Mover Strip (CodeMover)

    User->>UI: Pastes Left Text (Original) & Right Text (Modified)
    opt User drops files
        User->>UI: Drops .ts, .json, .py, or .sql files
        UI->>Parser: Read file content via FileReader API
        Parser-->>UI: Return extracted strings & detected language
    end
    UI->>Monaco: Set Left Model & Right Model values
    UI->>Myers: Request computeDiff(leftText, rightText, options)
    Note over Myers: Options: ignoreWhitespace, ignoreCase, lineByLine
    Myers-->>UI: Return ChangeChunks [added, removed, count, lines]
    UI->>Monaco: Inject ViewZone line markers & decoration classes
    UI->>Mover: Calculate line offset deltas and render swap arrows [→] [←]
    User->>Mover: Clicks [→] on Line Chunk 14-22
    Mover->>Monaco: Replace Target Line range in Right Editor
    Monaco-->>UI: Trigger onDidChangeModelContent
    UI->>Myers: Recalculate incremental diff delta
    Myers-->>UI: Update difference stats (X additions, Y deletions)
```

### Step-by-Step Execution:
1. **Input Ingestion**: Text can be directly typed, pasted from clipboard, or loaded by dragging and dropping local files.
2. **Language Auto-Detection**: Monaco's language worker detects the syntax (JavaScript, TypeScript, Python, JSON, SQL, HTML, CSS, YAML, Markdown, etc.).
3. **Diff Computation**: The in-memory Myers diff algorithm parses line-by-line differences, grouping them into added, removed, and unmodified spans.
4. **Synchronized Viewport**: The custom scroll listener synchronizes the vertical and horizontal positions of both editors.
5. **Interactive Code Transfer (`CodeMover`)**: Hovering over diff blocks displays inline transfer buttons (`→` or `←`) allowing granular cherry-picking of specific lines between buffers.

---

## 2. ApiDesk Studio: REST / GraphQL & Swagger Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as API Developer
    participant Bar as URL & Method Bar
    participant Parser as cURL & OpenAPI Parser
    participant Runner as Request Execution Engine
    participant Remote as External API Endpoint
    participant Inspector as Response & Headers Inspector

    alt User pastes cURL command
        User->>Bar: Pastes `curl -X POST https://api.example.com...`
        Bar->>Parser: Auto-detect cURL prefix
        Parser->>Bar: Populate Method=POST, URL, Headers, and JSON Body
    else User manually configures request
        User->>Bar: Selects Method (GET/POST/PUT/DELETE) & enters URL
        User->>Bar: Adds Query Params, Bearer Token, or Body payload
    end

    User->>Bar: Clicks "Send Request"
    Bar->>Runner: Initialize Request & Start High-Resolution Timer (performance.now())
    Runner->>Remote: fetch(url, { method, headers, body, mode: 'cors' })
    alt Successful Response (HTTP 200/201/etc)
        Remote-->>Runner: Return Response Stream, Status & Headers
        Runner->>Runner: Calculate elapsed latency (e.g. 142ms) & payload size (e.g. 14.2 KB)
        Runner->>Inspector: Format response (JSON prettify, raw text, or headers table)
    else CORS or Network Failure
        Remote-->>Runner: NetworkError / CORS blocked
        Runner->>Inspector: Display CORS remediation guidance & direct cURL fallback command
    end
    Inspector-->>User: Render syntax-highlighted response body, timing badges & status
```

---

## 3. Client-Side Word to PDF Conversion Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Analyst
    participant Drop as PDF Studio Drop Zone
    participant JSZip as JSZip Archive Reader
    participant Mammoth as Mammoth / docx-preview AST Parser
    participant PdfLib as pdf-lib Synthesis Engine
    participant Browser as Browser Blob & Download Trigger

    User->>Drop: Drops confidential `Contract.docx` file
    Drop->>JSZip: Extract `.docx` package (document.xml, styles.xml, media/)
    JSZip-->>Mammoth: Provide OpenXML XML DOM nodes & style definitions
    Mammoth->>Mammoth: Parse paragraphs, headings, tables, bullet lists & embedded images
    Mammoth-->>Drop: Render live in-browser preview container
    User->>Drop: Clicks "Convert & Download PDF"
    Drop->>PdfLib: Initialize PDFDocument.create()
    loop For each page & layout block
        PdfLib->>PdfLib: Embed fonts, draw text strings, render table borders, draw image buffers
    end
    PdfLib->>PdfLib: pdfDoc.save() -> Uint8Array buffer
    PdfLib->>Browser: Create Blob([buffer], { type: 'application/pdf' })
    Browser-->>User: Trigger immediate browser file download (Zero server upload)
```

---

## 4. HAR Network Waterfall Inspection Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as SRE / Developer
    participant Drop as HAR Drag-and-Drop Zone
    participant Stream as JSON Stream Parser
    participant Aggregator as Timing & TTFB Aggregator
    participant Canvas as Waterfall Timeline Renderer
    participant Sanitizer as Token & Cookie Sanitizer

    User->>Drop: Drops `network-dump.har` file (up to 50MB)
    Drop->>Stream: Parse HAR JSON structure (log.entries, log.pages)
    Stream->>Aggregator: Compute start timestamps, DNS lookup, Connect, SSL, TTFB, and Content Download
    Aggregator->>Canvas: Compute relative timeline percentages and status code color mappings
    Canvas-->>User: Render visual waterfall chart with search & filter controls (Status, MIME type, Domain)
    User->>Canvas: Clicks on suspicious request (`POST /auth/token`)
    Canvas->>Sanitizer: Read Request & Response Headers
    Sanitizer-->>User: Display masked Bearer tokens & cookies with 1-click "Sanitize & Export Clean HAR"
```
