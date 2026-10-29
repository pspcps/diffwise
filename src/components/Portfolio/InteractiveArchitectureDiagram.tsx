import React, { useState } from 'react';
import {
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Database,
  Lock,
  Globe,
  FileCode2,
  FileText,
  Workflow,
  Sparkles,
  Camera,
  Bot,
  BellRing,
  LineChart,
} from 'lucide-react';

interface ArchitectureNode {
  id: string;
  layer: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  metric: string;
  tech: string[];
  description: string;
  files: string[];
}

interface ProjectKPI {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}

// 1. Project Drishti (Agentic AI Crowd Safety Platform)
const DRISHTI_NODES: ArchitectureNode[] = [
  {
    id: 'stream',
    layer: 'Layer 1: Stream Ingestion',
    title: 'Camera & Mobile Feed Gateway',
    subtitle: 'Real-Time Video Sampling & Edge Preprocessing',
    icon: <Camera size={18} />,
    color: '#38bdf8',
    metric: '< 120ms Latency',
    tech: ['WebRTC', 'HTML5 Media Stream', 'Canvas Frame Grabber', 'Vite / React'],
    description: 'Captures continuous live video feeds from fixed surveillance cameras and mobile devices, downsampling frames at 5–15 FPS to minimize bandwidth consumption while preserving crucial visual fidelity.',
    files: ['src/components/CameraStream.tsx', 'src/services/videoFeed.ts', 'src/hooks/useCamera.ts'],
  },
  {
    id: 'vision',
    layer: 'Layer 2: Vision Perception',
    title: 'Vertex AI Vision Pipeline',
    subtitle: 'Object Recognition, Density & Flow Tracking',
    icon: <EyeIcon size={18} />,
    color: '#818cf8',
    metric: 'Real-Time Crowd Count',
    tech: ['Google Vertex AI', 'Vision APIs', 'TensorFlow Heatmaps', 'Edge Sampling'],
    description: 'Processes video frames through deep neural networks to extract spatial coordinates, person counts, directional movement vectors, and optical surge heatmaps without storing raw personal PII.',
    files: ['api/vision/density_pipeline.py', 'services/vertex_client.ts', 'models/crowd_detector.py'],
  },
  {
    id: 'agent',
    layer: 'Layer 3: Agentic Reasoning',
    title: 'Autonomous Gemini LLM Engine',
    subtitle: 'Multi-Modal Hazard Assessment & Decision Protocol',
    icon: <Bot size={18} />,
    color: '#ec4899',
    metric: '85–90% Autonomous',
    tech: ['Gemini 2.5 Flash / Pro', 'Autonomous Agents', 'Prompt Chaining', 'Risk Matrix Evaluator'],
    description: 'Autonomously analyzes vision telemetry, detecting anomalies such as stampedes, fire/smoke, fallen individuals, or blocked evacuation corridors. Determines risk severity (P1–P4) without human bottlenecks.',
    files: ['agents/incident_evaluator.py', 'prompts/emergency_triage.json', 'services/geminiAgent.ts'],
  },
  {
    id: 'dispatch',
    layer: 'Layer 4: Incident Dispatch',
    title: 'Cloud Run Responder Hub',
    subtitle: 'Sub-Second Routing & Live Incident Command',
    icon: <BellRing size={18} />,
    color: '#10b981',
    metric: 'Sub-Second Dispatch',
    tech: ['Google Cloud Run', 'Docker Container', 'Firebase Realtime', 'Push Webhooks'],
    description: 'Instantly broadcasts verified incidents to emergency personnel, assigns nearest field responders with GPS waypoints, and updates the real-time incident command dashboard.',
    files: ['server/dispatch_controller.ts', 'firebase/incident_schema.json', 'deploy/Dockerfile.cloudrun'],
  },
];

// Helper Eye icon for vision
function EyeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// 2. FleetMind (Agentic Natural-Language Query System for Fleet Ops)
const FLEETMIND_NODES: ArchitectureNode[] = [
  {
    id: 'command_hub',
    layer: 'Layer 1: Operator Interface',
    title: 'Natural Language Command Hub',
    subtitle: 'Zero-SQL Telematics Query & Webhook CLI',
    icon: <Globe size={18} />,
    color: '#06b6d4',
    metric: '< 150ms Parsing',
    tech: ['React 18', 'CLI Terminal Interface', 'Intent Classification', 'Tailwind CSS'],
    description: 'Provides fleet managers and dispatchers with a conversational natural-language console, allowing them to ask questions like "Which delivery vans in Region 4 have engine warnings?" without writing complex SQL or switching tools.',
    files: ['src/components/Console.tsx', 'src/parser/intentParser.ts', 'cli/fleetmind.go'],
  },
  {
    id: 'orchestrator',
    layer: 'Layer 2: Multi-Agent Dispatcher',
    title: 'Agentic Query Orchestrator',
    subtitle: 'Task Decomposition & Dynamic Fan-Out Pipeline',
    icon: <Bot size={18} />,
    color: '#8b5cf6',
    metric: 'Parallel Fan-Out',
    tech: ['AI Agent Swarm', 'Query Planner', 'Vector Routing', 'JSON Schema Validation'],
    description: 'Deconstructs natural-language queries into targeted sub-tasks, allocating execution across specialized telematics, telemetry, and observability agents simultaneously.',
    files: ['agents/orchestrator.ts', 'agents/telematics_agent.ts', 'agents/diagnostics_agent.ts'],
  },
  {
    id: 'datastores',
    layer: 'Layer 3: Telematics Datastores',
    title: 'DynamoDB & MySQL Tier',
    subtitle: 'High-Volume IoT Telemetry & Relational Assets',
    icon: <Database size={18} />,
    color: '#f59e0b',
    metric: 'Sub-10ms Lookup',
    tech: ['Amazon DynamoDB', 'MySQL 8.0', 'KMS Encryption', 'Partition Keys (DeviceID)'],
    description: 'Stores live IoT heartbeat telemetry, GPS breadcrumbs, driver duty logs, and asset maintenance histories, optimized for millisecond key-value retrieval at scale.',
    files: ['db/dynamo_client.go', 'db/schema_telematics.sql', 'models/device_event.go'],
  },
  {
    id: 'synthesis',
    layer: 'Layer 4: Diagnostics & Synthesis',
    title: 'New Relic & Ops Synthesizer',
    subtitle: 'Metric Correlation & Operational Intelligence',
    icon: <LineChart size={18} />,
    color: '#10b981',
    metric: 'Sub-Second Synthesis',
    tech: ['New Relic NRQL API', 'Gemini LLM Synthesizer', 'Automated Remediation'],
    description: 'Correlates APM errors, system telematics, and hardware health into a unified, actionable diagnostic summary with suggested remediation steps.',
    files: ['services/newrelic_connector.ts', 'services/llm_synthesizer.ts', 'services/alert_dispatcher.ts'],
  },
];

// 3. Kafbat UI (Web-Based Kafka Cluster Management)
const KAFBAT_NODES: ArchitectureNode[] = [
  {
    id: 'nextjs',
    layer: 'Layer 1: Frontend Core',
    title: 'Next.js 14 App Router',
    subtitle: 'Real-Time Streaming UI & Charts',
    icon: <Globe size={18} />,
    color: '#f97316',
    metric: 'Sub-second Sync',
    tech: ['Next.js 14', 'React', 'TypeScript', 'Tailwind CSS'],
    description: 'Dynamic cluster dashboard presenting broker status, topic lists, partition offsets, consumer group lag breakdown, and payload inspection.',
    files: ['app/dashboard/page.tsx', 'components/KafkaCluster.tsx', 'components/MessageBrowser.tsx'],
  },
  {
    id: 'gin',
    layer: 'Layer 2: Concurrency Gateway',
    title: 'Go (Gin) Microservice',
    subtitle: 'High-Concurrency Ingestion & Routing',
    icon: <Zap size={18} />,
    color: '#00add8',
    metric: '50k+ RPS Capable',
    tech: ['Go 1.22', 'Gin Framework', 'Docker Container', 'Goroutines'],
    description: 'Ultra-fast, low-memory API gateway mediating between web clients and Kafka cluster brokers with zero garbage collection lag.',
    files: ['api/routes.go', 'controllers/kafka_controller.go', 'services/cluster_service.go'],
  },
  {
    id: 'sarama',
    layer: 'Layer 3: Low-Level Driver',
    title: 'IBM Sarama Kafka Client',
    subtitle: 'Low-Level Binary Protocol Protocol Parser',
    icon: <Cpu size={18} />,
    color: '#a855f7',
    metric: 'TCP Connection Pool',
    tech: ['IBM Sarama', 'Binary Wire Protocol', 'Partition Consumer Pool'],
    description: 'Direct wire protocol parser communicating with Apache Kafka brokers, querying partition offsets, replica sets, and inspecting message payloads.',
    files: ['pkg/kafka/client.go', 'pkg/kafka/consumer_groups.go', 'pkg/kafka/topics.go'],
  },
  {
    id: 'cluster',
    layer: 'Layer 4: Distributed Bus',
    title: 'Apache Kafka Brokers',
    subtitle: 'Partitioned Topic Distributed Commit Log',
    icon: <Database size={18} />,
    color: '#10b981',
    metric: 'Zero Lag Ingestion',
    tech: ['Apache Kafka', 'Zookeeper / KRaft', 'PostgreSQL Metadata'],
    description: 'Distributed event bus managing partitioned topics, replicas, consumer offsets, and high-throughput streaming events.',
    files: ['deploy/docker-compose.yml', 'deploy/kafka-cluster.env'],
  },
];

// 4. PSDevTool (All-in-One Developer Workspace)
const PSDEVTOOL_NODES: ArchitectureNode[] = [
  {
    id: 'shell',
    layer: 'Layer 1: Shell & Router',
    title: 'Client Shell & Hash Router',
    subtitle: 'Deep-linkable SPA & Dynamic SEO Engine',
    icon: <Globe size={18} />,
    color: '#38bdf8',
    metric: '< 250ms First Paint',
    tech: ['React 19', 'HashRouter', 'GA4 Events', 'Tailwind CSS'],
    description: 'Manages deep-link state (#/diff, #/har, #/pdf), dynamic SEO document title/OG tags synchronization, and universal ⌘K Command Palette.',
    files: ['src/App.tsx', 'src/components/Layout/Toolbar.tsx', 'src/components/CommandPalette/CommandPalette.tsx'],
  },
  {
    id: 'studios',
    layer: 'Layer 2: Studio Gateways',
    title: 'Domain Studio Engines',
    subtitle: '15+ Specialized Diagnostic Workspaces',
    icon: <Layers size={18} />,
    color: '#818cf8',
    metric: '15+ Integrated Tools',
    tech: ['Lazy Loading', 'Suspense', 'DOM Visibility Toggling'],
    description: 'Houses Monaco Diff, ApiDesk (REST/GraphQL), HAR Waterfall, JWT Debugger, Architecture Lab, and PDF Studio without cross-tool unmounting.',
    files: ['src/components/TextCompare/*', 'src/components/ApiStudio/*', 'src/components/HarViewer/*'],
  },
  {
    id: 'workers',
    layer: 'Layer 3: Computing Core',
    title: 'In-Memory AST & Workers',
    subtitle: 'Background Tokenization & Myers Diff',
    icon: <Cpu size={18} />,
    color: '#c084fc',
    metric: '60 FPS on 100k+ Lines',
    tech: ['Monaco Web Workers', 'diff (Myers AST)', 'pdf-lib', 'mermaid.render()'],
    description: 'Non-blocking Web Workers execute syntax tokenization and line-by-line difference calculation, keeping the main UI thread at a silky 60fps.',
    files: ['node_modules/monaco-editor', 'src/utils/diffFormatters.ts', 'src/utils/jsonXml.ts'],
  },
  {
    id: 'sandbox',
    layer: 'Layer 4: Privacy Sandbox',
    title: 'Air-Gapped Client Memory',
    subtitle: '100% Zero-Server Data Guarantee',
    icon: <Lock size={18} />,
    color: '#10b981',
    metric: '0 Bytes Exfiltrated',
    tech: ['Web Crypto API', 'HTML5 Canvas 2D', 'Iframe Sandbox', 'URL.revokeObjectURL'],
    description: 'All computations (JWT HMAC verification, image cropping, DOCX-to-PDF conversion) run exclusively in client browser RAM. No servers or proxies.',
    files: ['src/components/PdfStudio/*', 'src/components/JwtStudio/*', 'src/components/ImageStudio/*'],
  },
];

export default function InteractiveArchitectureDiagram({
  projectTitle,
  projectColor = '#89b4fa',
}: {
  projectTitle: string;
  projectColor?: string;
}) {
  const titleLower = projectTitle.toLowerCase();

  // Select matching topology based on inspected project
  let nodes: ArchitectureNode[];
  let kpis: ProjectKPI[];

  if (titleLower.includes('drishti')) {
    nodes = DRISHTI_NODES;
    kpis = [
      { label: 'Autonomy Level', value: '85–90% Autonomous', sub: 'Multi-Modal Agent Pipeline', icon: <Bot size={14} className="text-[#ec4899]" /> },
      { label: 'Vision Inference', value: '< 150ms Processing', sub: 'Google Vertex AI Vision', icon: <Zap size={14} className="text-[#38bdf8]" /> },
      { label: 'Cloud Deployment', value: 'Google Cloud Run', sub: 'Containerized Edge Dispatch', icon: <Globe size={14} className="text-[#818cf8]" /> },
      { label: 'Incident Latency', value: '< 1s Alert Trigger', sub: 'Real-time WebSocket / FCM', icon: <BellRing size={14} className="text-[#10b981]" /> },
    ];
  } else if (titleLower.includes('fleetmind')) {
    nodes = FLEETMIND_NODES;
    kpis = [
      { label: 'Query Interface', value: 'Zero SQL Required', sub: 'Natural-Language Chat & CLI', icon: <Globe size={14} className="text-[#06b6d4]" /> },
      { label: 'Orchestrator', value: 'Multi-Agent Fan-Out', sub: 'Parallel Task Decomposition', icon: <Bot size={14} className="text-[#8b5cf6]" /> },
      { label: 'Datastores', value: 'DynamoDB + MySQL', sub: 'Sub-10ms Partition Retrieval', icon: <Database size={14} className="text-[#f59e0b]" /> },
      { label: 'Observability', value: 'New Relic APM', sub: 'Correlated IoT Diagnostics', icon: <LineChart size={14} className="text-[#10b981]" /> },
    ];
  } else if (titleLower.includes('kafka') || titleLower.includes('kafbat')) {
    nodes = KAFBAT_NODES;
    kpis = [
      { label: 'Throughput', value: '50k+ RPS Capable', sub: 'Go Gin Wire Protocol Engine', icon: <Zap size={14} className="text-[#00add8]" /> },
      { label: 'Frontend', value: 'Next.js 14 App Router', sub: 'React Server Streaming UI', icon: <Globe size={14} className="text-[#f97316]" /> },
      { label: 'Driver Driver', value: 'IBM Sarama Client', sub: 'Low-Level Binary Decoders', icon: <Cpu size={14} className="text-[#a855f7]" /> },
      { label: 'Observability', value: 'Per-Partition Lag', sub: 'Consumer Group Monitor', icon: <Database size={14} className="text-[#10b981]" /> },
    ];
  } else {
    // Default to flagship PSDevTool architecture
    nodes = PSDEVTOOL_NODES;
    kpis = [
      { label: 'Security Model', value: '100% Client RAM', sub: 'Zero Server Telemetry', icon: <ShieldCheck size={14} className="text-[#10b981]" /> },
      { label: 'Diff Engine Throughput', value: '60 FPS Virtualized', sub: '100k+ Lines Myers AST', icon: <Zap size={14} className="text-[#38bdf8]" /> },
      { label: 'Language Density', value: '50+ Syntax Highlighting', sub: 'Monaco Background Workers', icon: <FileText size={14} className="text-[#c084fc]" /> },
      { label: 'First Paint Latency', value: '< 250ms (CLS = 0)', sub: 'Code-Split Suspense Bundles', icon: <Sparkles size={14} className="text-[#facc15]" /> },
    ];
  }

  const [activeNodeId, setActiveNodeId] = useState<string>(nodes[0].id);
  const [pulseActive, setPulseActive] = useState<boolean>(true);

  // Sync activeNode if switching between projects
  const activeNode = nodes.find(n => n.id === activeNodeId) || nodes[0];

  return (
    <div className="space-y-4">
      {/* Visual Interactive Map Header & Controls */}
      <div className="flex items-center justify-between gap-3 bg-[#0a0d20] p-3 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <Workflow size={15} style={{ color: projectColor }} />
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            Interactive Architecture Topology
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-[#9399b2]">
            Click nodes to inspect
          </span>
        </div>

        <button
          onClick={() => setPulseActive(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
            pulseActive
              ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 shadow-sm'
              : 'bg-white/5 text-[#6c7086] border border-white/5'
          }`}
          title="Toggle live animated data flow pulse"
        >
          <Activity size={12} className={pulseActive ? 'animate-pulse' : ''} />
          <span>{pulseActive ? 'Flow Active' : 'Flow Paused'}</span>
        </button>
      </div>

      {/* Visual Nodes Grid / Flow Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {nodes.map((node, idx) => {
          const isSelected = activeNode.id === node.id;
          return (
            <div
              key={node.id}
              onClick={() => setActiveNodeId(node.id)}
              className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-200 border flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#131838] shadow-xl scale-[1.02]'
                  : 'bg-[#0c1024]/90 hover:bg-[#101530] border-white/10 hover:border-white/20'
              }`}
              style={{
                borderColor: isSelected ? node.color : undefined,
                boxShadow: isSelected ? `0 0 20px ${node.color}35` : undefined,
              }}
            >
              {/* Animated Flow Connector Arrow on Desktop */}
              {idx < nodes.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-[#45475a] pointer-events-none">
                  <ArrowRight
                    size={14}
                    className={pulseActive ? 'text-[#89b4fa] animate-pulse' : 'text-[#313244]'}
                  />
                </div>
              )}

              {/* Node Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${node.color}20`,
                      color: node.color,
                      border: `1px solid ${node.color}40`,
                    }}
                  >
                    {node.icon}
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${node.color}15`,
                      color: node.color,
                    }}
                  >
                    {node.metric}
                  </span>
                </div>

                <div className="text-[10px] font-mono uppercase tracking-wider text-[#6c7086] mb-0.5">
                  {node.layer}
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#89b4fa] transition-colors leading-snug">
                  {node.title}
                </h4>
                <p className="text-[11px] text-[#9399b2] mt-0.5 leading-snug line-clamp-2">
                  {node.subtitle}
                </p>
              </div>

              {/* Tech Badges */}
              <div className="flex flex-wrap gap-1 mt-3 pt-2.5 border-t border-white/5">
                {node.tech.slice(0, 2).map(t => (
                  <span
                    key={t}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-[#cdd6f4]"
                  >
                    {t}
                  </span>
                ))}
                {node.tech.length > 2 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-[#6c7086]">
                    +{node.tech.length - 2}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Deep-Dive Inspector Panel */}
      <div
        className="rounded-2xl p-4 sm:p-5 border transition-all duration-300 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0e122b 0%, #080a18 100%)',
          borderColor: `${activeNode.color}40`,
          boxShadow: `0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 ${activeNode.color}25`,
        }}
      >
        {/* Top Accent Line */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${activeNode.color}, transparent)` }}
        />

        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${activeNode.color}20`,
                color: activeNode.color,
                border: `1px solid ${activeNode.color}45`,
              }}
            >
              {activeNode.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6c7086]">
                  {activeNode.layer}
                </span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${activeNode.color}18`,
                    color: activeNode.color,
                  }}
                >
                  ⚡ {activeNode.metric}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white">{activeNode.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[#6c7086]">Status:</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-lg border border-[#10b981]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
              Production Architecture Verified
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#cdd6f4] leading-relaxed mb-4">
          {activeNode.description}
        </p>

        {/* Tech Stack & Codebase Anchors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6c7086] block mb-1.5">
              Technologies &amp; Protocols
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeNode.tech.map(t => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-lg font-mono text-[11px] font-medium bg-[#141838] text-[#cdd6f4] border border-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#6c7086] block mb-1.5">
              Key Source Implementations
            </span>
            <div className="space-y-1 font-mono text-[11px]">
              {activeNode.files.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-[#9399b2]">
                  <FileCode2 size={12} style={{ color: activeNode.color }} />
                  <span className="truncate">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter 30-Second Visual KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            className="p-3 rounded-2xl bg-[#090c1f] border border-white/5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-mono text-[#6c7086] uppercase tracking-wider">{kpi.label}</span>
              {kpi.icon}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-white">{kpi.value}</div>
              <div className="text-[9px] font-mono text-[#9399b2] mt-0.5 truncate">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
