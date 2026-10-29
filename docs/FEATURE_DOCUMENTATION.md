# Detailed Feature Documentation: PSDevTool

This document provides exhaustive technical specifications, user interactions, data processing flows, and edge cases for each core feature in PSDevTool.

---

## 1. Monaco Diff Checker (`TextCompareView.tsx` & `FileCompareView.tsx`)

### Purpose & Behavior
Provides high-performance side-by-side or unified code and text difference detection powered by Microsoft's Monaco Editor (the editor engine behind VS Code) and the Myers diff algorithm. Supports 50+ programming languages.

### Execution Flow
1. **Input**: User pastes or types text into the Left (Original) and Right (Modified) editor panes, or drops local files into the drop zones.
2. **Diff Processing**:
   - The in-memory diff engine computes line-by-line delta chunks (`diffLines`).
   - Line markers (green for additions, red for deletions, blue for modifications) are calculated.
3. **Monaco Decoration**: Monaco applies custom CSS classes (`diff-line-added`, `diff-line-deleted`, `diff-char-highlight`) directly onto the editor viewport buffer.
4. **Synchronized Scrolling**: Dual editor viewports bind to a shared scroll handler, synchronizing line positions automatically.
5. **Code Mover**: Hovering over a diff block reveals transfer buttons (`[→]` / `[←]`), allowing lines to be copied or replaced directly across buffers.

### Edge Cases Handled
- **Large Files (>10,000 lines)**: Monaco virtualizes the DOM, rendering only visible lines in the viewport for 60fps scrolling.
- **Whitespace / Formatting Differences**: Toggle switches ("Ignore Whitespace", "Ignore Case") filter out indentation changes without modifying the underlying text.

---

## 2. ApiDesk Studio: REST, GraphQL & Swagger Explorer (`ApiStudioView.tsx`)

### Purpose & Behavior
A lightweight, zero-install alternative to Postman and Swagger UI. Allows engineers to construct HTTP requests, test GraphQL queries, inspect response timing metrics, and explore OpenAPI specs without sending credentials to remote servers.

### Execution Flow
1. **cURL Auto-Detection**:
   - Pasting a cURL snippet into the URL bar triggers a regex parser that extracts HTTP method, target URL, header flags (`-H`), and request body (`-d` or `--data-raw`).
2. **GraphQL Query Builder**:
   - Offers dedicated syntax-highlighted editor tabs for the GraphQL query string and JSON variables object.
   - Automatically injects `Content-Type: application/json` and packages the payload into `{ "query": "...", "variables": { ... } }`.
3. **Execution & Latency Timer**:
   - Measures exact round-trip network latency via `performance.now()` delta before and after `fetch()`.
   - Formats the response body (JSON pretty-printing, raw text, or headers table).
4. **Swagger / OpenAPI Hub**:
   - Allows pasting raw OpenAPI 3.0 or Swagger 2.0 specs in YAML or JSON format.
   - The parser converts YAML to JSON (`yaml` npm package) and renders an interactive explorer with method badges, path parameters, and schema models.

### Edge Cases Handled
- **CORS Violations**: Captures browser network CORS restrictions and displays an explanatory modal with copyable cURL commands to bypass browser security sandbox from a terminal.

---

## 3. HAR Network Waterfall Inspector (`HarViewerView.tsx`)

### Purpose & Behavior
Inspects HTTP Archive (`.har`) files exported from Chrome, Edge, Safari, or Firefox developer tools to analyze network latency, page load bottlenecks, status codes, and HTTP payloads.

### Execution Flow
1. **File Drop**: User drops a `.har` file (supporting archives up to 50MB).
2. **Aggregation**: Aggregates timing phases for each request:
   - Blocked / Queued
   - DNS Lookup
   - Initial Connection / TCP Handshake
   - SSL / TLS Negotiation
   - Time to First Byte (TTFB) / Waiting
   - Content Download
3. **Waterfall Chart**: Renders a proportional horizontal timeline chart.
4. **Sanitizer Mode**: Offers a 1-click "Sanitize & Export" button that removes authorization headers (`Bearer ...`), `Cookie`, and `Set-Cookie` tokens before sharing the HAR file with third-party vendors.

---

## 4. JWT Debugger & Token Claims Inspector (`JwtStudioView.tsx`)

### Purpose & Behavior
Decodes and inspects JSON Web Tokens (JWT) client-side. Breaks down the JOSE Header, Payload Claims, and Signature verification status without leaking tokens over the network.

### Execution Flow
1. **Input**: User pastes a raw JWT string (`header.payload.signature`).
2. **Base64URL Decoding**: Decodes URL-safe Base64 strings using standard Unicode-safe conversion:
   ```typescript
   const jsonString = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
   ```
3. **Claims Analysis**:
   - Formats `exp` (Expiration Time), `iat` (Issued At), and `nbf` (Not Before) into human-readable local dates and relative times (e.g., "Expired 2 hours ago").
   - Identifies standard RFC claims (`sub`, `iss`, `aud`, `jti`).
4. **Signature Verification**: Validates HMAC-SHA256 signatures using the browser's native `window.crypto.subtle` API when an optional secret key is entered.

---

## 5. Word to PDF & PDF Studio (`PdfStudioView.tsx`)

### Purpose & Behavior
Converts Microsoft Word `.docx` documents into high-quality PDF files entirely inside the browser. Also provides PDF merge, split, compress, and image-to-PDF synthesis tools.

### Execution Flow
1. **DOCX Parsing**:
   - Reads the `.docx` archive via `JSZip`.
   - Parses the XML document structure using `mammoth` and `docx-preview`.
   - Extracts typography, font weights, paragraph spacing, tables, lists, and embedded images.
2. **PDF Vector Generation**:
   - Uses `pdf-lib` to construct a new `PDFDocument`.
   - Embeds standard Helvetica/Times fonts and renders page content into vector PDF streams.
3. **Download**: Creates a binary Blob and triggers immediate browser download.

---

## 6. Architecture Lab & Mermaid Studio (`ArchitectureLabView.tsx`)

### Purpose & Behavior
A full system architecture design suite featuring a live, interactive Mermaid diagram code compiler and a visual database ERD schema designer.

### Execution Flow
1. **Mermaid Live Compiler**:
   - Compiles Mermaid DSL code in real time into vector SVG graphics.
   - Supports Flowcharts, Sequence Diagrams, Class Diagrams, State Diagrams, Entity Relationship Diagrams (ERD), Git Graphs, and Gantt charts.
   - Provides instant zoom, pan, reset, and 1-click SVG / high-resolution PNG export.
2. **Visual ERD Designer (`@xyflow/react`)**:
   - Allows visual creation of database tables, column types (`UUID`, `VARCHAR`, `TIMESTAMP`, etc.), primary keys, and foreign-key relation connections.

---

## 7. JSON Tools & JSON to Table (`JsonToolsView.tsx`)

### Purpose & Behavior
Transforms raw JSON into interactive tables, navigable tree views, minified strings, and bidirectional XML formats.

### Execution Flow
1. **Table Mode**: Detects arrays of objects, extracts unique keys across all items to construct columns, and formats cell data into an interactive, sortable data table.
2. **Tree Mode**: Displays collapsible nodes with colored syntax indicators for strings, numbers, booleans, and null values.
3. **XML Converter**: Converts JSON into clean, indented XML with custom root wrappers, and parses raw XML into formatted JSON objects with attribute preservation.

---

## 8. UUID, Snowflake & ULID Studio (`UuidStudioView.tsx`)

### Purpose & Behavior
High-throughput identifier generator supporting UUID v4, UUID v7 (time-ordered), Twitter Snowflake IDs, ULID, NanoID, and MongoDB ObjectIds.

### Execution Flow
- **UUID v7 (RFC 9562)**: Encodes 48-bit millisecond timestamp into the high bits combined with cryptographically secure random bits, producing database-friendly, sequentially sortable primary keys.
- **Twitter Snowflake**: Deconstructs 64-bit integer IDs into Timestamp (milliseconds since custom epoch), Worker ID, Datacenter ID, and Sequence Number.

---

## 9. Regex Lab & Interactive Debugger (`RegexLabView.tsx`)

### Purpose & Behavior
Real-time regular expression tester with visual match highlighting, flag toggles (`g`, `i`, `m`, `s`, `u`), capture group extraction, syntax error explanation, and pre-built presets for common patterns (Email, IP address, UUID, SemVer, URL, Dates).

---

## 10. Timezone Converter & Unix Epoch Clock (`TimeZoneView.tsx`)

### Purpose & Behavior
Calculates Unix epoch timestamps in both seconds and milliseconds, converts timestamps between UTC, GMT, EST, PST, IST, and JST time zones, and formats ISO 8601 strings.
