# PSDevTool — Developer Tools for Code & Files

> **Live Production URL**: [https://psdevtool.online/](https://psdevtool.online/)

**PSDevTool** (DevBench) is an all-in-one, client-side developer workspace designed to streamline everyday software engineering, document processing, and formatting tasks. All operations run directly in your browser with privacy, high performance, and zero server upload dependencies.

---

## 🚀 Key Modules & Capabilities

### 1. 📄 PDF Studio & Word-to-PDF Converter
- **Word (.docx) to PDF Converter**:
  - Direct conversion of Microsoft Word documents into accurate, print-ready PDF files.
  - Complete preservation of OpenXML tables, borders, font weights, colors, embedded figures, alignments, and multi-page pagination.
  - Automatic download and secondary Vector Print option via the browser's native print engine.
  - Off-screen rendering engine with cross-origin font protection.
- **Merge PDF**: Combine multiple PDF files in any order with drag-and-drop reordering.
- **Split PDF**: Extract specific page ranges or split documents into separate files.
- **Images to PDF**: Convert collections of JPG, PNG, and WebP images into a single formatted PDF with configurable page size (A4, Letter, Fit) and margins.
- **PDF to Images**: Extract high-resolution pages as JPG or PNG images bundled in a ZIP download.
- **Protect & Unlock**: Secure PDFs with AES password protection or decrypt known password-protected PDFs.
- **Text & Markdown to PDF**: Rapidly generate formatted PDF documents from plain text and markdown notes.

### 2. 🖼️ Image Studio
- **Precision Crop Tool**: Interactive draggable and resizable crop box with 8 corner/edge handles supporting both mouse and touch input. Includes aspect ratio presets (Free, 1:1 Square, 16:9, 4:3, 9:16 Story), quick coverage sizes (Full 100%, Center 80%, Center 50%), and pixel/percentage inputs.
- **Image Compression**: Adjustable quality slider with real-time estimated file size and percentage savings.
- **Format Converter**: Instant conversion between PNG, JPEG, and WebP formats.
- **Transformations**: 90° rotation, horizontal flip, and vertical flip.
- **Base64 Image Encoder/Decoder**: Two-way conversion between image files, data URLs, CSS background snippets, and HTML `<img>` tags.

### 3. ⚖️ Code & File Comparison (Diff Tools)
- **Side-by-Side & Unified Diff**: Syntax-aware diff viewer powered by Monaco Editor.
- **File Compare**: Drag and drop two local files to inspect additions, deletions, modifications, and line statistics.
- **Formatting & Comparison Options**: Ignore whitespace, ignore letter case, and toggle word wrap.

### 4. 🏗️ Architecture & Diagram Lab
- **System Architecture Canvas**: Drag-and-drop visual builder for distributed architectures (clients, APIs, databases, message queues, caches).
- **Database Schema Designer**: Entity-relationship diagrams with interactive table nodes, column types, keys, and relational cardinality (1:1, 1:N, N:M) with directional handles.
- **Live Mermaid Diagrams**: Real-time rendering of Mermaid code with high-contrast themes, zoom/pan controls, and SVG export.

### 5. 🔣 JSON & Data Tools
- **JSON Validator & Formatter**: Syntax verification, error pointer, pretty-print (2 spaces, 4 spaces, tabs), and minification.
- **Interactive Views**: Collapsible tree inspector and tabular data view.
- **Converter**: Bidirectional JSON ↔ XML converter with root element management.

### 6. 🔍 Regex Lab
- **Live Regex Debugger**: Pattern syntax validation and real-time match highlighting across test inputs.
- **Capture Groups**: Detailed group breakdown with match indices and extracted text.
- **Pattern Presets**: Quick templates for emails, URLs, IP addresses, dates, phone numbers, and slug validation.

### 7. 🏷️ Markup Studio & Code Formatters
- **HTML Sandbox**: Live sandbox preview with isolated iframe rendering.
- **XML Formatter**: Pretty-print XML documents with customizable indent levels.
- **SQL Formatter**: Standardize queries across PostgreSQL, MySQL, BigQuery, and SQLite syntax.

### 8. 🌐 Utilities
- **URL Tools**: Encode/decode URLs, parse query parameters into an editable table, and copy normalized strings.
- **Timezone & Epoch Converter**: Convert Unix timestamps (seconds, milliseconds) to human dates, UTC, ISO 8601, and local timezones.
- **Case Converter**: Convert text between `camelCase`, `snake_case`, `kebab-case`, `PascalCase`, `UPPER_CASE`, and Title Case.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor (`@monaco-editor/react`)
- **Canvas & Graphing**: React Flow (`@xyflow/react`), Mermaid.js
- **Document Processing**: `pdf-lib`, `docx-preview`, `jszip`, `html-to-image`
- **Icons**: Lucide React

---

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   The application runs on `http://localhost:3000`.

3. **Compile and typecheck**:
   ```bash
   npm run build
   ```

4. **Lint codebase**:
   ```bash
   npm run lint
   ```

---

## 🔒 Privacy & Security

DevBench operates **100% in the client browser**. Uploaded Word documents, PDFs, images, source code files, and sensitive strings are never sent to external servers or third-party APIs. All processing occurs locally within your device memory.
