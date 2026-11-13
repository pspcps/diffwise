export interface ProjectCaseStudy {
  problem: string;
  engineering: string;
  scope: string;
  access: string;
  stages: { title: string; description: string }[];
  sources: { label: string; url: string }[];
}
export const PROJECT_CASE_STUDIES: Record<string, ProjectCaseStudy> = {
  "Project Drishti": {
    problem:
      "Help venue operators turn camera observations into actionable incident and responder information.",
    engineering:
      "Integration of multimodal inference with operational state, incident handling, and a live dashboard.",
    scope:
      "Hackathon/MVP implementation. Repository documentation distinguishes implemented incident workflows from incomplete forecasting and advanced features; autonomy percentages are project estimates, not benchmark results.",
    stages: [
      {
        title: "Camera capture",
        description:
          "React samples webcam or mobile camera frames for analysis.",
      },
      {
        title: "Perception and reasoning",
        description:
          "Vertex AI Vision and Gemini analyze images and produce structured crowd/risk observations.",
      },
      {
        title: "Incident workflows",
        description:
          "Firebase Functions manage incidents, zones, and responder assignments in Firestore.",
      },
      {
        title: "Operations dashboard",
        description:
          "React displays operational state and incident/responder information.",
      },
    ],
    sources: [
      {
        label: "ProjectDrishti_Hackathon_Report.md",
        url: "https://github.com/pspcps/project-drishti/blob/d27e86569fce1de4240cb957dc6a6b55319c16e3/ProjectDrishti_Hackathon_Report.md",
      },
      {
        label: "src/components/CameraCapture.jsx",
        url: "https://github.com/pspcps/project-drishti/blob/d27e86569fce1de4240cb957dc6a6b55319c16e3/src/components/CameraCapture.jsx",
      },
      {
        label: "drishti-mvp-functions/analyzeWithGemini.js",
        url: "https://github.com/pspcps/project-drishti/blob/d27e86569fce1de4240cb957dc6a6b55319c16e3/drishti-mvp-functions/analyzeWithGemini.js",
      },
    ],
    access: "Public source",
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
      "Local file transformations run in the browser. API testing explicitly contacts user-selected endpoints, and optional analytics, ads, or editor assets may use the network. No unmeasured FPS or throughput guarantees.",
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
        url: "https://github.com/pspcps/diffwise/blob/2c87f1f2098277758cff613e497bdeb2b29e0b18/src/App.tsx",
      },
      {
        label: "src/components/TextCompare/TextCompareView.tsx",
        url: "https://github.com/pspcps/diffwise/blob/2c87f1f2098277758cff613e497bdeb2b29e0b18/src/components/TextCompare/TextCompareView.tsx",
      },
      {
        label: "src/components/JsonTools/JsonToolsView.tsx",
        url: "https://github.com/pspcps/diffwise/blob/2c87f1f2098277758cff613e497bdeb2b29e0b18/src/components/JsonTools/JsonToolsView.tsx",
      },
    ],
    access: "Public source",
  },
  "Kafbat UI": {
    problem:
      "Bring Kafka cluster administration, message inspection, and data-replication jobs into one control plane.",
    engineering:
      "Separation of the management API from replication workers, extensible destination adapters, and explicit job/error state.",
    scope:
      "Source includes deployment and worker implementations. The review did not establish production load, memory use, p95 latency, or message throughput; controlled performance benchmarks are not included.",
    stages: [
      {
        title: "Management UI",
        description:
          "Next.js exposes Kafka administration and replication job controls.",
      },
      {
        title: "Go control plane",
        description:
          "Gin/Sarama handlers manage clusters, schemas, authentication, and job metadata.",
      },
      {
        title: "Replication workers",
        description:
          "Kubernetes client-go provisions Python consumers for replication jobs.",
      },
      {
        title: "Destination adapters",
        description:
          "Workers map messages into configured relational or MongoDB destinations and record errors/metrics.",
      },
    ],
    sources: [
      {
        label: "backend/go.mod",
        url: "https://github.com/pspcps/kafkaUI/blob/7d77c949eb7ed81b787c494bace5b350d109d9e7/backend/go.mod",
      },
      {
        label: "backend/internal/k8s/client.go",
        url: "https://github.com/pspcps/kafkaUI/blob/7d77c949eb7ed81b787c494bace5b350d109d9e7/backend/internal/k8s/client.go",
      },
      {
        label: "worker/main.py",
        url: "https://github.com/pspcps/kafkaUI/blob/7d77c949eb7ed81b787c494bace5b350d109d9e7/worker/main.py",
      },
      {
        label: "worker/destinations/postgresql.py",
        url: "https://github.com/pspcps/kafkaUI/blob/7d77c949eb7ed81b787c494bace5b350d109d9e7/worker/destinations/postgresql.py",
      },
    ],
    access: "Public source",
  },
  "Resume AI": {
    problem:
      "Turn an uploaded resume into structured skills, improvement suggestions, and potential job-role matches.",
    engineering:
      "Structured model output parsing and defensive normalization between the AI backend and frontend.",
    scope:
      "Scores are model-generated resume-quality estimates, not independently validated ATS results or hiring predictions.",
    stages: [
      {
        title: "Resume upload",
        description: "The frontend uploads a resume for backend analysis.",
      },
      {
        title: "Text extraction",
        description: "Firebase Functions extract PDF or plain-text content.",
      },
      {
        title: "Gemini analysis",
        description:
          "Vertex AI generates structured feedback, skill extraction, and suggested job roles.",
      },
      {
        title: "Career interface",
        description:
          "React renders results and resume-building or job-match views.",
      },
    ],
    sources: [
      {
        label: "functions/analyzeResume.js",
        url: "https://github.com/pspcps/resume-ai/blob/88d9369812596e42bb782fbcc6f1932766c13362/functions/analyzeResume.js",
      },
      {
        label: "src/pages/AnalysisPage.tsx",
        url: "https://github.com/pspcps/resume-ai/blob/88d9369812596e42bb782fbcc6f1932766c13362/src/pages/AnalysisPage.tsx",
      },
      {
        label: "src/pages/ResumeBuilderPage.tsx",
        url: "https://github.com/pspcps/resume-ai/blob/88d9369812596e42bb782fbcc6f1932766c13362/src/pages/ResumeBuilderPage.tsx",
      },
    ],
    access: "Public source",
  },
  "Ask My Docs": {
    problem:
      "Make personal PDFs and notes searchable through questions using locally hosted model inference.",
    engineering:
      "Document ingestion, embedding persistence, retrieval configuration, and grounded prompt construction.",
    scope:
      "Local inference still depends on model downloads, local services, and sufficient machine resources; generated answers require review.",
    stages: [
      {
        title: "Document ingestion",
        description:
          "A document processor loads supported files and prepares chunks.",
      },
      {
        title: "Embedding and persistence",
        description:
          "Ollama embeddings are stored in a persistent Chroma collection.",
      },
      {
        title: "Context retrieval",
        description:
          "LangChain retrieves relevant chunks for the user question.",
      },
      {
        title: "Local answer",
        description:
          "An Ollama model answers with supplied context through Streamlit or the API.",
      },
    ],
    sources: [
      {
        label: "app.py",
        url: "https://github.com/pspcps/ask-my-docs/blob/24a25ab78faceaa6622ed4d8d6ca4bda24fa38a9/app.py",
      },
      {
        label: "data_ingest.py",
        url: "https://github.com/pspcps/ask-my-docs/blob/24a25ab78faceaa6622ed4d8d6ca4bda24fa38a9/data_ingest.py",
      },
      {
        label: "api.py",
        url: "https://github.com/pspcps/ask-my-docs/blob/24a25ab78faceaa6622ed4d8d6ca4bda24fa38a9/api.py",
      },
    ],
    access: "Public source",
  },
  "Safety App": {
    problem:
      "Explore frame-based analysis of in-cabin behavior and road-facing hazards without a hosted vision-model API.",
    engineering:
      "Video-to-frame processing, local multimodal inference, structured-output parsing, and distinct analysis modes.",
    scope:
      "Prototype for assisted inspection. Model-produced flags and confidence fields are not validated safety measurements or a certified driver-monitoring system.",
    stages: [
      {
        title: "Upload",
        description: "Flask accepts an image or video and analysis category.",
      },
      {
        title: "Frame extraction",
        description: "FFmpeg samples video frames at a configured rate.",
      },
      {
        title: "Vision inference",
        description:
          "Ollama runs llama3.2-vision with category-specific prompts.",
      },
      {
        title: "Result inspection",
        description: "Jinja pages display summaries and parsed model flags.",
      },
    ],
    sources: [
      {
        label: "app.py",
        url: "https://github.com/pspcps/safety_app/blob/7d109272e9d05c227725a029bc2ec778468e470e/app.py",
      },
      {
        label: "templates/result.html",
        url: "https://github.com/pspcps/safety_app/blob/7d109272e9d05c227725a029bc2ec778468e470e/templates/result.html",
      },
    ],
    access: "Public source",
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
      "MVVM with reactive StateFlow/Flow, financial domain logic separated from UI, and unit tests for calculations and privacy behavior.",
    scope:
      "Financial calculations depend on user-entered data and assumptions. Repository tests were inspected, not executed in this web workspace.",
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
          "Kotlin engines calculate cash-flow-aware returns, XIRR, and planning scenarios.",
      },
      {
        title: "Local persistence",
        description:
          "Room/SQLite stores records; utilities handle statement parsing, backups, and privacy controls.",
      },
    ],
    sources: [
      {
        label: "app/build.gradle.kts",
        url: "https://github.com/pspcps/Wealth-Management-Portfolio-Tracker/blob/019e7b4a2ea442a69778f86a78874c01be1b6d6f/app/build.gradle.kts",
      },
      {
        label: "app/src/main/java/com/example/domain/finance/XirrEngine.kt",
        url: "https://github.com/pspcps/Wealth-Management-Portfolio-Tracker/blob/019e7b4a2ea442a69778f86a78874c01be1b6d6f/app/src/main/java/com/example/domain/finance/XirrEngine.kt",
      },
      {
        label: "app/src/test/java/com/example/PortfolioCalculationsTest.kt",
        url: "https://github.com/pspcps/Wealth-Management-Portfolio-Tracker/blob/019e7b4a2ea442a69778f86a78874c01be1b6d6f/app/src/test/java/com/example/PortfolioCalculationsTest.kt",
      },
    ],
    access: "Public source",
  },
};
