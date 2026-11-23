# Portfolio source review — 23 November 2026

The public portfolio repositories were checked again against current default branches and relevant public development branches, with implementation files, tests, evaluation records and feature/release notes inspected where relevant. FleetMind retains its previously published public summary; this document adds no private implementation or evaluation details. Public evidence links in `src/data/projectCaseStudies.ts` are pinned to the reviewed revisions. This review does not rerun every application or independently reproduce upstream benchmarks. Employer outcomes remain owner-provided resume claims.

## Reviewed changes

| Project | Reviewed default-branch revision | Portfolio/resume update |
| --- | --- | --- |
| Project Drishti | `dba2457fc2c13daf205e7f50709483db0181086d` | Still JPEG/PNG analysis, validated findings, uncertainty/failure semantics and operator review. Twelve scripted cases are software checks, not live detection accuracy. Video is planned. |
| FleetMind | Existing public portfolio description | Existing high-level summary retained. No private repository changes or evaluation details are published. |
| PSDevTool | `6c21119be125bd5c01c7c41c20152c36aac67dc3` | Twenty tools, saved resume profiles, local transformations and explicit networked workflows. The separately tested VS Code extension remains open PR #11. |
| KafkaUI | `a7319aec9a4d3186178dd0b7e203e477b7d0c304` | Use the independent project's KafkaUI name. Keep main's behavior separate from newer delivery-contract work. |
| Resume AI | `6ccad996d830d391ad836135df6db0e8ebfa7625` | Bounded Gemini evidence tools, verified identity, source-access/schema validation, Career Coach, approved rewrites and PSDevTool-compatible export. No employer ATS score claim. |
| Ask My Docs | `fb3291f071ca98a26259a697b6677bfc817a44fe` | Shared SQLite WAL/NumPy/Ollama library; durable indexing, versions, leases, atomic replacement, citations and abstention. Remove obsolete Chroma/LangChain implementation claims for this project. |
| Safety App | `0d2676102f84185e10f6fe9d5432ac68bb02868c` | Isolated durable jobs, two worker slots, bounded extraction, cancellation/retry, temporal events, reviewer decisions and report export. |
| InkMind | `9a9b342b9dbfc9e4fcbe460c14cebc6e111b5b53` | Existing local notebook/RAG/diagram description remains applicable; simulation is not production telemetry and grounding is not infallibility. |
| ApiDesk Studio | `4c8ce60a06ecc70ac7c6b444bb499cfc366fe0ab` | Existing React/Express/Electron, request proxy, load-test and script-execution description remains applicable. A child process is not a security sandbox. |
| Wealth Management Portfolio Tracker | `28f9d1fe832e9b7936cb5b6003843fca3b880e40` | Unified asset/liability and capital-flow rules, principal/interest separation, XIRR/TWRR and financial tests. README showcase images are labeled UI mockups. |
| RentMeter | `a7eec4bf21349a598da651f20819a0828813422c` | Utility billing modes, tenant documents, agreement images, reminders and Robolectric/Compose billing/UI coverage, alongside the existing ledger/OCR work. No legal-validity or OCR-accuracy guarantee. |
| Cairn IDE | `fc37e678844b7cdeba53e91594b88a4ff9c66a7f` | Current product name; repository remains SharpForge. Dependency views, optional Roslyn resolution, advanced developer tools and PTY terminals. Full active-editor LSP and signed macOS distribution remain incomplete. |

Drishti and Resume AI now use 2025–2026 project periods, consistent with their public 2025 history and 2026 updates. These are project-history labels, not changes to employment dates. React remains explicit in the professional summary. Dynamic experience, the requested contact email, blank phone, profile editing and custom user content are preserved.

## Recorded evidence and its limits

### Ask My Docs

The [public checked-in baseline](https://github.com/pspcps/ask-my-docs/blob/fb3291f071ca98a26259a697b6677bfc817a44fe/evaluations/baseline-v1.json) records a small CPU-only run with retrieval, citation, expected-fact, abstention and latency measurements. It includes incomplete answers as well as successes. The portfolio links to that evidence without turning small-corpus results into a general accuracy claim. These upstream measurements were not independently reproduced in this review.

### KafkaUI development branch

The `codex/delivery-contract` revision `2b48b6084281c0c76d29e10f580e5ca87c42c40c` includes the newer delivery/replay implementation and lab. It is not merged to main. The `codex/operator-workflows` branch also contains that lab; the public card still links to the repository and the case study links directly to pinned branch evidence.

The branch adds bounded retries then pause without advancing the failed record, optional acknowledged dead-letter handling, and a PostgreSQL transaction combining source-identity ledger and business effects. Other destination adapters are disabled in that implementation pending equivalent safeguards. This is not a cross-system exactly-once guarantee.

The [public recorded report](https://github.com/pspcps/kafkaUI/blob/2b48b6084281c0c76d29e10f580e5ca87c42c40c/docs/benchmarks/20261122T161829Z-dc6d21/README.md) documents its offered load, hardware, topology, raw samples, source fingerprint and limitations. It includes recovery/replay assertions but does not establish maximum throughput, broker-loss durability, cloud authentication or production Kubernetes recovery. Resume copy describes the development-branch lab without asserting its figures as general performance guarantees. Upstream benchmark results were inspected, not independently reproduced.

### FleetMind and PSDevTool pending work

FleetMind remains private. Its existing public portfolio summary and private-source label are retained. No new private architecture, source paths, integration details or evaluation figures are included in this public refresh.

PSDevTool's locally installable VS Code extension is open PR #11. It was built and tested in the preceding implementation task, but is not part of the deployed default branch. The portfolio and default resume identify its open-PR status.

### Other evaluation boundaries

Drishti's recorded 12/12 run uses scripted model responses. Safety App's regression suite uses generated media/scripted detections; its interval evaluator needs independently labeled held-out clips for meaningful model-quality figures. Resume AI's cited-line validation does not prove semantic entailment or guarantee hiring outcomes. Cairn's CI/browser/.NET checks do not establish packaged macOS acceptance.

## Hiring assessment

The strongest senior-backend evidence is the Kafka control-plane/worker design and the delivery branch's explicit trade-offs and reproducible lab. The existing public FleetMind summary supports applied AI/integration positioning; PSDevTool demonstrates complete product delivery. Ask My Docs is now a substantially stronger RAG example because its lifecycle and imperfect evaluation are inspectable. Resume AI and Safety App now demonstrate better failure boundaries and human review. The Android projects support domain modeling and transactional integrity; Cairn demonstrates complex local-tool integration.

For a candidate with 9+ years, this is credible interview material for senior backend/full-stack roles with applied AI work. A portfolio alone does not establish staff/principal-level organizational influence, sustained production ownership or measured adoption. The next gains are making the reviewed work easy to find on default branches, offering working sanitized demos, documenting real user feedback and being ready to defend the employer metrics and design decisions in an interview.

All twelve projects remain in the owner's chosen order. Compact evidence notes and direct public source links reduce the work needed to verify claims. No employer ATS score, recruiter approval probability or hiring guarantee is invented.
