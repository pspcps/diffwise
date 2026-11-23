export interface ProjectCaseStudy {
  problem: string;
  engineering: string;
  scope: string;
  access: string;
  stages: { title: string; description: string }[];
  evidence?: string;
  sources: { label: string; url: string }[];
}
export const PROJECT_CASE_STUDIES: Record<string, ProjectCaseStudy> = {
  "Project Drishti": {
    problem:
      "Help venue operators turn camera observations into actionable incident and responder information.",
    engineering:
      "Input validation, structured model findings, explicit uncertainty/error semantics and operator-controlled side effects.",
    scope:
      "Still-image MVP. The recorded 12-case run uses scripted responses and synthetic images; it tests software behavior, not live detection accuracy. Video and multi-source fusion remain planned; forecasting and automated handoff are experimental.",
    stages: [
      {
        title: "Validated upload",
        description:
          "A required zone and one JPEG/PNG pass size/type/pixel checks through a signed Cloud Storage upload.",
      },
      {
        title: "Structured inference",
        description:
          "Gemini findings are schema-validated, with a 20-second transport timeout and at most one transient retry.",
      },
      {
        title: "Operator decision",
        description:
          "Detected, no-detection, uncertain and failed outcomes are distinct; uncertain and failed results skip automation.",
      },
      {
        title: "Evaluation",
        description:
          "Synthetic inputs and injected failures exercise API/software behavior; live model evaluation is a separate optional run.",
      },
    ],
    sources: [
      {
        label: "README.md",
        url: "https://github.com/pspcps/Agentic-Project-Drishti/blob/dba2457fc2c13daf205e7f50709483db0181086d/README.md",
      },
      {
        label: "backend/utils/image_analysis.py",
        url: "https://github.com/pspcps/Agentic-Project-Drishti/blob/dba2457fc2c13daf205e7f50709483db0181086d/backend/utils/image_analysis.py",
      },
      {
        label: "backend/evaluation/run.py",
        url: "https://github.com/pspcps/Agentic-Project-Drishti/blob/dba2457fc2c13daf205e7f50709483db0181086d/backend/evaluation/run.py",
      },
      {
        label: "backend/evaluation/test_api.py",
        url: "https://github.com/pspcps/Agentic-Project-Drishti/blob/dba2457fc2c13daf205e7f50709483db0181086d/backend/evaluation/test_api.py",
      },
    ],
    access: "Public source",
    evidence: "12 scripted cases · live accuracy unmeasured",
  },
  FleetMind: {
    problem:
      "Let fleet operators investigate device health and events through natural-language questions instead of manually joining data across tools.",
    engineering:
      "Domain-specific agent routing, read-only tool boundaries, and synthesis across multiple operational data sources.",
    scope:
      "Private repository reviewed. This case study summarizes the architecture without publishing internal endpoints, device identifiers, configuration, or source files. Deployment and latency claims have not been independently benchmarked.",
    stages: [
      {
        title: "Operator question",
        description:
          "A React dashboard or CLI accepts a natural-language diagnostic question.",
      },
      {
        title: "Agent orchestration",
        description:
          "Claude on AWS Bedrock routes work to specialist agents using the Strands Agents SDK.",
      },
      {
        title: "Read-only MCP tools",
        description:
          "FastMCP services retrieve relevant fleet and observability data.",
      },
      {
        title: "Diagnostic synthesis",
        description:
          "Agent responses are combined into an answer for the operator.",
      },
    ],
    sources: [],
    access: "Private repository",
  },
  PSDevTool: {
    problem:
      "Reduce context switching across code comparison, data inspection, document processing, and debugging tasks.",
    engineering:
      "Reusable editor lifecycle management, lazy-loaded modules, semantic navigation, and browser-based processing.",
    scope:
      "Local file transformations run in the browser; API requests and maps explicitly use the network. The hosted site can load analytics/ads. A locally bundled VS Code extension with native clipboard/save dialogs is available in open PR #11, not yet merged to master.",
    stages: [
      {
        title: "Input and navigation",
        description:
          "React routes users to developer tools and accepts text or local files.",
      },
      {
        title: "Tool processing",
        description:
          "Specialized modules handle comparison, data transformation, documents, or diagnostics.",
      },
      {
        title: "Editor and visualization",
        description:
          "Monaco, React Flow, and Mermaid provide interactive inspection.",
      },
      {
        title: "Results and export",
        description:
          "Users inspect, copy, download, or explicitly send API requests.",
      },
    ],
    sources: [
      {
        label: "src/App.tsx",
        url: "https://github.com/pspcps/diffwise/blob/6c21119be125bd5c01c7c41c20152c36aac67dc3/src/App.tsx",
      },
      {
        label: "src/components/TextCompare/TextCompareView.tsx",
        url: "https://github.com/pspcps/diffwise/blob/6c21119be125bd5c01c7c41c20152c36aac67dc3/src/components/TextCompare/TextCompareView.tsx",
      },
      {
        label: "src/components/JsonTools/JsonToolsView.tsx",
        url: "https://github.com/pspcps/diffwise/blob/6c21119be125bd5c01c7c41c20152c36aac67dc3/src/components/JsonTools/JsonToolsView.tsx",
      },
      {
        label: "VS Code extension — open PR #11",
        url: "https://github.com/pspcps/diffwise/pull/11",
      },
    ],
    access: "Public source",
    evidence: "20 tools · VS Code extension in open PR",
  },
  "Resume AI": {
    problem:
      "Help applicants compare vacancy requirements against their actual resume evidence and review tailored wording before export.",
    engineering:
      "Bounded model/tool execution, verified identity, source-access validation and human-approved rewrites.",
    scope:
      "Gemini returns evidence coverage rather than a calibrated ATS score or hiring prediction. Source references and report schemas are checked, but semantic support and proposed wording still require human review. Sample activity is prerecorded; live analysis requires configured Vertex AI access.",
    stages: [
      {
        title: "Verified inputs",
        description:
          "Firebase ID tokens and bounded PDF/text inputs are validated; caller-selected user IDs and storage paths are rejected.",
      },
      {
        title: "Read-only evidence tools",
        description:
          "Gemini reads the vacancy, pages through resume lines and searches supplied content within model-turn/tool-call budgets.",
      },
      {
        title: "Validated report and coach",
        description:
          "The server rejects out-of-range or unread citations. React shows requirement evidence, tool activity and document-aware Career Coach replies.",
      },
      {
        title: "Review and export",
        description:
          "Users review introduced terms, approve rewrites and export a PSDevTool-compatible profile or open the tailored resume builder.",
      },
    ],
    sources: [
      {
        label: "functions/applicationAgent.js",
        url: "https://github.com/pspcps/resume-ai/blob/6ccad996d830d391ad836135df6db0e8ebfa7625/functions/applicationAgent.js",
      },
      {
        label: "functions/evidence.js",
        url: "https://github.com/pspcps/resume-ai/blob/6ccad996d830d391ad836135df6db0e8ebfa7625/functions/evidence.js",
      },
      {
        label: "functions/applicationAgent.test.js",
        url: "https://github.com/pspcps/resume-ai/blob/6ccad996d830d391ad836135df6db0e8ebfa7625/functions/applicationAgent.test.js",
      },
      {
        label: "src/psDevTool.ts",
        url: "https://github.com/pspcps/resume-ai/blob/6ccad996d830d391ad836135df6db0e8ebfa7625/src/psDevTool.ts",
      },
    ],
    access: "Public source",
    evidence: "Agent/schema tests · evidence-backed rewrite approval",
  },
  "Ask My Docs": {
    problem:
      "Maintain a local document library whose answers can be checked against the current source version and page.",
    engineering:
      "Durable indexing leases, atomic version publication, exact cosine retrieval, embedding compatibility and source-resolved citations.",
    scope:
      "Local-library design using SQLite/NumPy, not a distributed vector database. The checked-in CPU baseline reports retrieval, citation support, answer completeness, abstention and latency on a small corpus. It records incomplete answers as well as successes; it is not a general accuracy guarantee. Remote Ollama hosts receive document text.",
    stages: [
      {
        title: "Queued lifecycle",
        description:
          "Upload/update/rebuild jobs record content hashes and versions; identical content deduplicates and failed updates preserve the last ready version.",
      },
      {
        title: "Shared index",
        description:
          "One SQLite WAL database stores source bytes, chunks, job leases and normalized vectors for both Streamlit and Flask.",
      },
      {
        title: "Retrieved evidence",
        description:
          "NumPy cosine search selects current-version passages; incompatible embedding versions require a rebuild.",
      },
      {
        title: "Cited answer or abstention",
        description:
          "Ollama returns references resolved to retrieved chunks, pages and excerpts. The evaluator records retrieval, fact matching, abstention and latency separately.",
      },
    ],
    sources: [
      {
        label: "service.py",
        url: "https://github.com/pspcps/ask-my-docs/blob/fb3291f071ca98a26259a697b6677bfc817a44fe/service.py",
      },
      {
        label: "test_integration.py",
        url: "https://github.com/pspcps/ask-my-docs/blob/fb3291f071ca98a26259a697b6677bfc817a44fe/test_integration.py",
      },
      {
        label: "evaluate.py",
        url: "https://github.com/pspcps/ask-my-docs/blob/fb3291f071ca98a26259a697b6677bfc817a44fe/evaluate.py",
      },
      {
        label: "evaluations/baseline-v1.json",
        url: "https://github.com/pspcps/ask-my-docs/blob/fb3291f071ca98a26259a697b6677bfc817a44fe/evaluations/baseline-v1.json",
      },
    ],
    access: "Public source",
    evidence: "Lifecycle tests · recorded 8-question Ollama baseline",
  },
  "Safety App": {
    problem:
      "Let reviewers inspect local video observations as evidence-backed events rather than treating individual model flags as final decisions.",
    engineering:
      "Job isolation, durable state/retry, temporal grouping, reviewer decisions and event-level evaluation.",
    scope:
      "Two local worker slots and bounded media processing are implemented. Scripted regression tests verify concurrent job/review behavior. The evaluator supports held-out interval labels, but representative model precision/recall and false-alert rates have not been established. Private job URLs act as bearer links; local deployment is assumed.",
    stages: [
      {
        title: "Isolated job",
        description:
          "Flask records a bounded upload in its own persistent job directory with progress, cancellation and retry.",
      },
      {
        title: "Bounded local processing",
        description:
          "FFmpeg/FFprobe sample bounded video input; Ollama produces per-frame observations with a model-call timeout.",
      },
      {
        title: "Temporal event review",
        description:
          "Consecutive positives form timestamped events with evidence frames; reviewers accept or dismiss them before exporting reports.",
      },
      {
        title: "Event evaluation",
        description:
          "A development/held-out manifest runner calculates temporal matching, precision/recall, false alerts per hour and processing speed.",
      },
    ],
    sources: [
      {
        label: "workbench.py",
        url: "https://github.com/pspcps/safety_app/blob/0d2676102f84185e10f6fe9d5432ac68bb02868c/workbench.py",
      },
      {
        label: "tests/test_workbench.py",
        url: "https://github.com/pspcps/safety_app/blob/0d2676102f84185e10f6fe9d5432ac68bb02868c/tests/test_workbench.py",
      },
      {
        label: "evaluate.py",
        url: "https://github.com/pspcps/safety_app/blob/0d2676102f84185e10f6fe9d5432ac68bb02868c/evaluate.py",
      },
    ],
    access: "Public source",
    evidence: "Concurrent-job regressions · event evaluator",
  },
  InkMind: {
    problem:
      "Combine writing, document retrieval, and visual system-design experiments in one local-first workspace.",
    engineering:
      "Streaming RAG responses, persistent embeddings, structured agent actions, and visual simulation controls.",
    scope:
      "Simulation metrics describe a configured diagram model rather than measured production infrastructure. Android connects to a separate backend; answer grounding reduces but does not eliminate model errors.",
    stages: [
      {
        title: "Notes and diagrams",
        description:
          "React supports editing, document import, and visual diagrams in desktop/mobile shells.",
      },
      {
        title: "FastAPI services",
        description:
          "API routes handle notes, imports, ingestion, chat, and agent actions.",
      },
      {
        title: "Local retrieval",
        description:
          "ChromaDB stores embeddings generated by Ollama and retrieves relevant note chunks.",
      },
      {
        title: "AI and simulation",
        description:
          "Ollama streams contextual answers; the diagram UI simulates configured traffic behavior.",
      },
    ],
    sources: [
      {
        label: "backend/core/rag.py",
        url: "https://github.com/pspcps/inkMind/blob/9a9b342b9dbfc9e4fcbe460c14cebc6e111b5b53/backend/core/rag.py",
      },
      {
        label: "backend/core/vector_store.py",
        url: "https://github.com/pspcps/inkMind/blob/9a9b342b9dbfc9e4fcbe460c14cebc6e111b5b53/backend/core/vector_store.py",
      },
      {
        label: "frontend/src/components/DiagramEditor.tsx",
        url: "https://github.com/pspcps/inkMind/blob/9a9b342b9dbfc9e4fcbe460c14cebc6e111b5b53/frontend/src/components/DiagramEditor.tsx",
      },
    ],
    access: "Public source",
  },
  "ApiDesk Studio": {
    problem:
      "Unify API request authoring, load testing, and scripted regression work without requiring cloud workspace storage.",
    engineering:
      "Dual request-execution paths, process/log streaming, and local persistence across related engineering workflows.",
    scope:
      "API requests contact the selected target; script execution runs local processes. The reviewed implementation is not a security-isolated sandbox, and benchmark results depend on the test configuration.",
    stages: [
      {
        title: "Request workspace",
        description:
          "React authors requests, collections, environments, tests, and load-test settings.",
      },
      {
        title: "Local runtime",
        description:
          "Express provides proxying, workspace persistence, and execution endpoints.",
      },
      {
        title: "Execution engines",
        description:
          "HTTP clients, Autocannon, and local Node/Bash processes perform requested work.",
      },
      {
        title: "Inspection",
        description:
          "Responses, timing, assertions, and SSE logs return to the UI.",
      },
    ],
    sources: [
      {
        label: "server.ts",
        url: "https://github.com/pspcps/ApiDesk-Studio/blob/4c8ce60a06ecc70ac7c6b444bb499cfc366fe0ab/server.ts",
      },
      {
        label: "src/utils/requestExecutor.ts",
        url: "https://github.com/pspcps/ApiDesk-Studio/blob/4c8ce60a06ecc70ac7c6b444bb499cfc366fe0ab/src/utils/requestExecutor.ts",
      },
      {
        label: "src/components/LoadTesterView.tsx",
        url: "https://github.com/pspcps/ApiDesk-Studio/blob/4c8ce60a06ecc70ac7c6b444bb499cfc366fe0ab/src/components/LoadTesterView.tsx",
      },
      {
        label: "src/components/ScriptRegressionRunnerView.tsx",
        url: "https://github.com/pspcps/ApiDesk-Studio/blob/4c8ce60a06ecc70ac7c6b444bb499cfc366fe0ab/src/components/ScriptRegressionRunnerView.tsx",
      },
    ],
    access: "Public source",
  },
  "Wealth Management Portfolio Tracker": {
    problem:
      "Give individuals a consolidated view of assets, cash flows, expenses, liabilities, and investment performance.",
    engineering:
      "Unified financial accounting rules separate balance-sheet liabilities, market returns, capital flows and loan interest; reactive ViewModels connect them to local persistence.",
    scope:
      "Native Android source and financial tests reviewed, not executed in this web workspace. Calculations depend on entered data and financial assumptions. README showcase images are explicitly labeled UI mockups, not runtime screenshots.",
    stages: [
      {
        title: "Compose interface",
        description:
          "Android screens show portfolio, expenses, recurring flows, and planning tools.",
      },
      {
        title: "ViewModels and repositories",
        description:
          "StateFlow and Kotlin Flow connect UI state to data operations.",
      },
      {
        title: "Financial domain",
        description:
          "Kotlin engines separate assets/liabilities, internal transfers and loan principal/interest, and compute XIRR/TWRR and cash-flow reports.",
      },
      {
        title: "Local persistence",
        description:
          "Room/SQLite stores records; utilities handle statement parsing, backups, and privacy controls.",
      },
    ],
    sources: [
      {
        label:
          "app/src/main/java/com/example/domain/engine/UnifiedFinancialEngine.kt",
        url: "https://github.com/pspcps/Wealth-Management-Portfolio-Tracker/blob/28f9d1fe832e9b7936cb5b6003843fca3b880e40/app/src/main/java/com/example/domain/engine/UnifiedFinancialEngine.kt",
      },
      {
        label: "app/src/test/java/com/example/PortfolioCalculationsTest.kt",
        url: "https://github.com/pspcps/Wealth-Management-Portfolio-Tracker/blob/28f9d1fe832e9b7936cb5b6003843fca3b880e40/app/src/test/java/com/example/PortfolioCalculationsTest.kt",
      },
      {
        label: "README.md",
        url: "https://github.com/pspcps/Wealth-Management-Portfolio-Tracker/blob/28f9d1fe832e9b7936cb5b6003843fca3b880e40/README.md",
      },
    ],
    access: "Public source",
    evidence: "Unified financial engine · calculation tests",
  },
  RentMeter: {
    problem:
      "Help property owners manage tenant balances and turn meter readings into traceable rent and utility invoices.",
    engineering:
      "Room transactions connect readings, invoices and outstanding balances; an on-device OCR pipeline separates image processing from reading validation and billing.",
    scope:
      "Native Android implementation reviewed from source. OCR candidates need review, and invoice totals depend on entered readings and configured rates. Android installation, OCR accuracy and runtime performance were not tested in this portfolio review.",
    access: "Public source",
    stages: [
      {
        title: "Properties and tenancies",
        description:
          "Compose screens and reactive Kotlin flows organize properties, units, active leases and tenant check-in/check-out records.",
      },
      {
        title: "Meter capture and OCR",
        description:
          "Camera/gallery images are cropped and preprocessed; Tesseract and ML Kit feed a parser that proposes readings and exposes validation warnings.",
      },
      {
        title: "Billing and local ledger",
        description:
          "Room-backed transactions store readings and invoices, apply utility rates and previous dues, allocate shared charges, and record payments.",
      },
      {
        title: "Documents and backups",
        description:
          "PDF invoices, dual-signature agreement images and scheduled bill-preparation reminders complement ZIP backup/restore of the ledger and private media.",
      },
    ],
    sources: [
      {
        label:
          "app/src/main/java/com/example/data/repository/RentLedgerRepository.kt",
        url: "https://github.com/pspcps1/RentMeter/blob/a7eec4bf21349a598da651f20819a0828813422c/app/src/main/java/com/example/data/repository/RentLedgerRepository.kt",
      },
      {
        label: "app/src/main/java/com/example/engine/RentReminderManager.kt",
        url: "https://github.com/pspcps1/RentMeter/blob/a7eec4bf21349a598da651f20819a0828813422c/app/src/main/java/com/example/engine/RentReminderManager.kt",
      },
      {
        label: "app/src/main/java/com/example/engine/RentAgreementGenerator.kt",
        url: "https://github.com/pspcps1/RentMeter/blob/a7eec4bf21349a598da651f20819a0828813422c/app/src/main/java/com/example/engine/RentAgreementGenerator.kt",
      },
      {
        label: "app/src/test/java/com/example/ExampleRobolectricTest.kt",
        url: "https://github.com/pspcps1/RentMeter/blob/a7eec4bf21349a598da651f20819a0828813422c/app/src/test/java/com/example/ExampleRobolectricTest.kt",
      },
    ],
    evidence: "Transactional billing · Robolectric/Compose tests",
  },
  KafkaUI: {
    problem:
      "Bring Kafka cluster administration, message inspection, and data-replication jobs into one control plane.",
    engineering:
      "Separate Go control plane and Python workers, with newer development-branch work making destination acknowledgment, replay identities and offset commits explicit.",
    scope:
      "Main retains the older commit-on-insert-error policy. The delivery-contract branch adds bounded retries/pause, acknowledged DLQ handling and a transactional PostgreSQL replay guard. Its recorded lab covers one local Kafka/PostgreSQL setup; other destination adapters are disabled in that branch. No end-to-end exactly-once or general throughput guarantee.",
    stages: [
      {
        title: "Control plane",
        description:
          "Next.js and Go/Gin expose clusters, messages, consumer groups, schemas and replication job controls.",
      },
      {
        title: "Worker orchestration",
        description:
          "Kubernetes provisions Python consumers. Main and the delivery-contract branch have different failure behavior.",
      },
      {
        title: "Delivery-contract branch",
        description:
          "PostgreSQL business writes and source-identity ledger entries share a transaction; offset commits follow acknowledgment. Bounded retry, pause and optional acknowledged DLQ paths are explicit.",
      },
      {
        title: "Reproduction lab",
        description:
          "A published branch report covers eight failure/replay scenarios and 4,000 records at 200/s offered load. Hardware, topology, timings and limitations accompany the raw samples.",
      },
    ],
    sources: [
      {
        label: "Default branch overview",
        url: "https://github.com/pspcps/kafkaUI/blob/a7319aec9a4d3186178dd0b7e203e477b7d0c304/README.md",
      },
      {
        label: "Delivery contract — development branch",
        url: "https://github.com/pspcps/kafkaUI/blob/2b48b6084281c0c76d29e10f580e5ca87c42c40c/docs/DELIVERY_CONTRACT.md",
      },
      {
        label: "Executable recovery lab — development branch",
        url: "https://github.com/pspcps/kafkaUI/blob/2b48b6084281c0c76d29e10f580e5ca87c42c40c/docs/DELIVERY_LAB.md",
      },
      {
        label: "Recorded offered-load run — development branch",
        url: "https://github.com/pspcps/kafkaUI/blob/2b48b6084281c0c76d29e10f580e5ca87c42c40c/docs/benchmarks/20261122T161829Z-dc6d21/README.md",
      },
    ],
    access: "Public source",
    evidence: "Development branch: recovery lab + recorded load test",
  },
  "Cairn IDE": {
    problem:
      "Give C#/.NET developers a connected editing, execution, debugging and investigation workbench on macOS.",
    engineering:
      "Electron process/IPC boundaries, DAP debugging, optional Roslyn dependency resolution and integrated developer tooling.",
    scope:
      "Cairn IDE is the current product name; the repository remains SharpForge. It is experimental: full active-editor LSP, crash recovery, download verification and signed/notarized macOS releases remain incomplete. CI and browser/.NET checks do not establish packaged macOS acceptance.",
    access: "Public source",
    stages: [
      {
        title: "Editor and solution",
        description:
          "Electron/React hosts local Monaco assets and .sln/.slnx project browsing.",
      },
      {
        title: ".NET and DAP",
        description:
          "Local SDK processes and netcoredbg expose builds, tests, breakpoints and runtime inspection through IPC.",
      },
      {
        title: "Dependency intelligence",
        description:
          "Project/package/type/call views support navigation and impact exploration; optional Roslyn resolution adds compiler-derived relationships.",
      },
      {
        title: "Developer workbench",
        description:
          "API, log, Git, quality and local utilities run alongside independent PTY terminals; feature and release documents state remaining limits.",
      },
    ],
    sources: [
      {
        label: "docs/ADVANCED_TOOLS.md",
        url: "https://github.com/pspcps/SharpForge/blob/fc37e678844b7cdeba53e91594b88a4ff9c66a7f/docs/ADVANCED_TOOLS.md",
      },
      {
        label: "docs/FEATURE_STATUS.md",
        url: "https://github.com/pspcps/SharpForge/blob/fc37e678844b7cdeba53e91594b88a4ff9c66a7f/docs/FEATURE_STATUS.md",
      },
      {
        label: "docs/RELEASE_CHECKS.md",
        url: "https://github.com/pspcps/SharpForge/blob/fc37e678844b7cdeba53e91594b88a4ff9c66a7f/docs/RELEASE_CHECKS.md",
      },
      {
        label: ".github/workflows/verify.yml",
        url: "https://github.com/pspcps/SharpForge/blob/fc37e678844b7cdeba53e91594b88a4ff9c66a7f/.github/workflows/verify.yml",
      },
    ],
    evidence: "CI + browser/.NET checks · experimental macOS app",
  },
};
