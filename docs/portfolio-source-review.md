# Portfolio source review

The twelve portfolio projects were reviewed against their GitHub repositories. Public implementation links are pinned to the reviewed commits in `src/data/projectCaseStudies.ts`. FleetMind's private README was used only for a high-level summary; private source paths, identifiers, hosts, and configuration are not published.

- Project Drishti: camera capture, Firebase analysis functions, and hackathon progress report. Present as an MVP; do not convert progress estimates into measured model accuracy or production validation.
- FleetMind: correct the AI stack to AWS Bedrock/Claude, Strands Agents SDK, FastMCP, and FastAPI. Keep repository access private.
- PSDevTool: describe browser-based transformations and explicitly networked API workflows separately; remove absolute zero-network guarantees and unsupported FPS claims.
- KafkaUI: Go/Gin/Sarama control plane, Kubernetes worker provisioning, Python replication, destination adapters, schema validation, and JWT implementation. Remove unsubstantiated memory/latency/throughput figures and the impossible zero-GC guarantee for Go.
- Resume AI: Firebase Functions extraction and Vertex AI Gemini 2.5 Pro analysis. Describe model scores as estimates, not validated ATS scores.
- Ask My Docs: correct the running app's vector store to Chroma despite Redis references in the README/dependency list.
- Safety App: Flask/FFmpeg/Ollama frame analysis prototype, not a validated safety detector.
- InkMind: FastAPI RAG, Chroma persistence, streamed Ollama responses, structured agent actions, and diagram simulation. Simulation output is not production infrastructure telemetry.
- ApiDesk Studio: React/Express/Electron, local request proxy, Autocannon, streamed local scripts, and workspace persistence. Do not describe child-process execution as a security sandbox.
- Wealth Management Portfolio Tracker: correct the stack to Kotlin, Compose, Room, StateFlow, and Android; inspect financial domain and unit-test source.

Liquibase PR https://github.com/liquibase/liquibase/pull/2102 is merged (23 November 2021). Its description establishes the PostgreSQL generated-column fix: omit invalid DEFAULT before GENERATED ALWAYS AS in generated CREATE TABLE SQL. The profile links the exact PR; an unverified release-version claim was removed.

Existing employer outcomes are user-provided resume claims and were not independently established through personal repositories. Ambiguous tracking-accuracy percentages and SDE promotion ordering were rephrased without guessing new values or chronology. No new performance or business-impact figures were invented.

The downloadable text profile uses standard recruiting headings and descriptive technology keywords. No guaranteed ATS score or recruiting outcome is claimed. Source code inspection does not establish deployment status, test success, or measured performance in the reviewed projects; project applications were not run during this audit.

Two additional projects were appended after the existing ten, in the requested order: RentMeter, then SharpForge.

- RentMeter (`pspcps1/RentMeter`, commit `58be3c44131919fc39928b4358ab58df31de2960`): no README at this revision. Reviewed Android Gradle dependencies, the Room repository, OCR/parser engines, PDF generator and ZIP backup code. Describe Compose/Room rental and billing workflows, CameraX/ML Kit/Tesseract meter processing and local exports. Do not invent OCR accuracy, cloud synchronization, production adoption or runtime benchmarks.
- SharpForge (`pspcps/SharpForge`, commit `7c41d949945d60b99e827a8929603a39a54ff950`): reviewed README, package entry point, active `electron-main.cjs` handlers and solution/debug/test/language modules. Describe Electron/React/Monaco editing, .NET process execution, netcoredbg DAP, tests, NuGet and Git workflows. The active package entry is `electron-main.cjs`; do not infer that every README language-server claim is wired into that entry point. The desktop app was not installed or run during this review.

Both new case studies have responsibility-based architecture stages and implementation links pinned to these revisions. They are portfolio additions; the focused resume project lists are unchanged.
