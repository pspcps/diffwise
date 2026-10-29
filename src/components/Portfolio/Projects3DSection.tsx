import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RESUME } from '../../data/resumeData';
import {
  ExternalLink,
  Layers,
  Cpu,
  Brain,
  Wrench,
  TrendingUp,
  X,
  ChevronRight,
  Server,
  ShieldCheck,
  Globe,
  Workflow,
} from 'lucide-react';
import InteractiveArchitectureDiagram from './InteractiveArchitectureDiagram';
import { soundFX } from './SoundFX';

// GitHub SVG Icon helper
const GithubIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

type ProjectCategory = 'all' | 'ai' | 'systems' | 'tools' | 'fintech';

type ProjectItem = (typeof RESUME.projects)[number] & {
  category: ProjectCategory;
  metricBadge?: string;
  architectureDetails?: string[];
  securityDetails?: string[];
  liveUrl?: string;
};

// Robust project lookup helper
const getProject = (keyword: string) => {
  const p = RESUME.projects.find(item => item.title.toLowerCase().includes(keyword.toLowerCase()));
  return p || RESUME.projects[0];
};

// Augment all projects with category tags & architectural details (GenAI projects on top)
const ENRICHED_PROJECTS: ProjectItem[] = [
  {
    ...getProject('drishti'), // Project Drishti (GenAI Flagship #1)
    category: 'ai',
    metricBadge: '85–90% Agentic AI Crowd Safety',
    architectureDetails: [
      'Real-time webcam/mobile stream ingestion processed through Vertex AI Vision.',
      'Autonomous Gemini LLM risk assessment pipeline with automated emergency routing.',
      'Containerized on Google Cloud Run with sub-second incident alerting.',
    ],
    securityDetails: [
      'Client-to-cloud TLS encrypted frame transmission with zero raw video retention.',
      'Least-privilege Google Cloud Run service accounts with fine-grained Vertex AI IAM roles.',
      'Automated sanitization of camera metadata ensuring visitor privacy compliance.',
    ],
  },
  {
    ...getProject('fleetmind'), // FleetMind (GenAI Flagship #2)
    category: 'ai',
    metricBadge: 'Multi-Agent Fleet Ops',
    architectureDetails: [
      'Multi-agent natural language query interface for IoT telematics and real-time fleet events.',
      'Decentralized fan-out query orchestration across DynamoDB, MySQL, and New Relic.',
      'Synthesized natural-language operational diagnostics with sub-second response times.',
    ],
    securityDetails: [
      'Role-based access control (RBAC) ensuring operators only access authorized fleet domains.',
      'Sanitized SQL & NRQL parameterization eliminating query injection via conversational prompts.',
      'Encrypted telemetry at rest (DynamoDB KMS) and in flight with audit-logged agent actions.',
    ],
  },
  {
    ...getProject('psdevtool'), // PSDevTool (Flagship Client-Side Studio)
    category: 'tools',
    metricBadge: 'All-in-One Dev Workstation (100% Client-Side)',
    liveUrl: 'https://psdevtool.online/',
    architectureDetails: [
      '4-Layer Modular Client Architecture: Shell/Routing Layer (Hash-based deep links, dynamic SEO sync), Domain Studio Engines, Parsing/Computation Layer, and Hardware Platform APIs.',
      '100% Client-Side Air-Gapped Privacy: All computations (diffing, token parsing, HAR waterfalls, DOCX to PDF synthesis) execute entirely inside browser V8 memory with zero server data leakage.',
      'Monaco Diff Engine & Line Mover: Dual-editor instances with background Web Workers for non-blocking tokenization, DOM virtualization (60fps on 100k+ lines), synchronized scrolling, and custom ViewZone line transfer (CodeMover).',
      'Diagnostic Suite: ApiDesk (Postman/GraphQL runner, auto cURL parser, Swagger YAML/JSON), HAR Network Waterfall with TTFB analysis & 1-click token sanitizer, JWT debugger with WebCrypto signature validation.',
      'Document & System Studio: Client-side Word DOCX to PDF vector synthesis (mammoth + pdf-lib), live Mermaid diagram AST compiler, and visual ERD database designer (@xyflow/react).',
      'Performance & Zero CLS: Bundle code-splitting via React.lazy and dynamic imports, debounced real-time compilers (250ms), React Portals to document.body, and 0ms layout shift.',
    ],
    securityDetails: [
      'Air-gapped execution: Zero user code, tokens, or files are sent to remote backends.',
      'Iframe sandbox isolation (sandbox="allow-scripts") for live HTML/CSS previews.',
      'Automated token redaction (Bearer tokens, cookies, auth headers) in HAR network inspector.',
    ],
  },
  {
    ...getProject('kafbat'), // Kafbat UI
    category: 'systems',
    metricBadge: 'Real-time Kafka Cluster UI',
    architectureDetails: [
      'Full-stack Kafka management dashboard tracking broker, topic, partition, and consumer lag.',
      'Message browser with real-time filtering by partition offset, message key, timestamp, and payload.',
      'Go backend powered by IBM Sarama with Next.js 14 App Router and Docker containerization.',
    ],
    securityDetails: [
      'Read-only sandbox mode for production broker clusters with TLS mTLS authentication.',
      'Strict RBAC guards on topic deletion and configuration mutation endpoints.',
    ],
  },
  {
    ...getProject('resume ai'), // Resume AI
    category: 'ai',
    metricBadge: 'Gemini 2.5 Pro ATS Scoring',
    architectureDetails: [
      'Deep semantic resume parsing evaluating skill density, role fit, and ATS strengths.',
      'Agentic job role matching reasoning with real-time feedback suggestions.',
      'Firebase Firestore persistent user profiles and PDF analysis pipeline.',
    ],
  },
  {
    ...getProject('ask my docs'), // Ask My Docs
    category: 'ai',
    metricBadge: '100% Offline Local RAG',
    architectureDetails: [
      'Offline document embeddings stored directly in Redis Vector Search.',
      'Local Ollama LLM integration (Llama 3 / Mistral) ensuring zero data leakage.',
      'Custom chunking & semantic retrieval pipeline with Streamlit & Flask.',
    ],
  },
  {
    ...getProject('safety app'), // Safety App
    category: 'ai',
    metricBadge: 'Local Vision LLM',
    architectureDetails: [
      'Automated video frame extraction via ffmpeg analyzed locally by llama3.2-vision:11b.',
      'Dual cabin & road safety anomaly detection pipeline without cloud latency or third-party data transmission.',
      'Real-time incident alert engine built with Python & Flask.',
    ],
  },
  {
    ...getProject('inkmind'), // InkMind
    category: 'ai',
    metricBadge: 'Cross-Platform RAG',
    architectureDetails: [
      'Offline-first AI notebook with local ChromaDB vector embeddings and Ollama chat agents.',
      'Interactive architecture flow simulator with animated network packet metrics and failure injections.',
      'Cross-platform native packaging supporting macOS, Windows, and Android via Capacitor.',
    ],
  },
  {
    ...getProject('apidesk'), // ApiDesk Studio
    category: 'tools',
    metricBadge: 'Full REST & Swagger Hub',
    architectureDetails: [
      'Postman-like request runner with GraphQL query & variables builder.',
      'Auto-cURL detection on URL bar paste with parameter extraction.',
      'Bidirectional Swagger/OpenAPI JSON ↔ YAML converter & interactive route explorer.',
    ],
  },
  {
    ...getProject('wealth'), // Wealth Management
    category: 'fintech',
    metricBadge: 'Real-time Portfolio Insights',
    architectureDetails: [
      'Multi-asset balance tracking with automated portfolio allocation insights.',
      'PostgreSQL data pipeline with transactional integrity for investment records.',
      'Interactive financial charting and risk exposure monitoring.',
    ],
  },
];

// Interactive 3D Tilt Card component
const TiltCard: React.FC<{
  project: ProjectItem;
  onInspect: (p: ProjectItem) => void;
}> = ({ project, onInspect }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>('');
  const [glareStyle, setGlareStyle] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 10;

    setTransformStyle(
      `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    );
    setGlareStyle({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlareStyle(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => onInspect(project)}
      style={{
        transform: transformStyle,
        transition: 'transform 0.15s ease-out, box-shadow 0.2s ease',
      }}
      className="relative rounded-3xl bg-[#0c1022]/90 border border-white/10 p-6 flex flex-col justify-between cursor-pointer group shadow-xl hover:shadow-2xl hover:border-white/20 transition-all overflow-hidden"
    >
      {/* Dynamic Holographic Glare Overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: glareStyle.opacity,
          background: `radial-gradient(circle at ${glareStyle.x}% ${glareStyle.y}%, rgba(255, 255, 255, 0.18) 0%, transparent 60%)`,
        }}
      />

      {/* Top Accent Strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
        style={{ background: `linear-gradient(90deg, ${project.color}, transparent)` }}
      />

      <div>
        {/* Header: Period & Category Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{
              backgroundColor: `${project.color}15`,
              color: project.color,
              border: `1px solid ${project.color}35`,
            }}
          >
            {project.metricBadge || project.category}
          </span>
          <span className="text-[11px] font-mono text-[#6c7086]">{project.period}</span>
        </div>

        {/* Project Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-[#89b4fa] transition-colors flex items-center justify-between">
          <span>{project.title}</span>
          <ChevronRight size={16} className="text-[#6c7086] group-hover:translate-x-1 group-hover:text-[#89b4fa] transition-all" />
        </h3>

        {/* Subtitle */}
        <p className="text-xs font-medium mt-1 mb-4" style={{ color: project.color }}>
          {project.subtitle}
        </p>

        {/* Bullet Points */}
        <ul className="space-y-2 mb-6">
          {project.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[#9399b2] leading-relaxed">
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tech.map(t => (
            <span
              key={t}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#141830] text-[#cdd6f4] border border-white/5 group-hover:border-white/10 transition-colors"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          <button
            onClick={e => {
              e.stopPropagation();
              onInspect(project);
            }}
            className="text-xs font-semibold text-[#89b4fa] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span>Architecture &amp; Specs</span>
            <ExternalLink size={12} />
          </button>

          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#1a1f3c] hover:bg-[#252c56] border border-white/10 transition-all hover:scale-105"
            >
              <GithubIcon size={13} />
              <span>GitHub</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export const Projects3DSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('all');
  const [inspectedProject, setInspectedProject] = useState<ProjectItem | null>(null);
  const [modalTab, setModalTab] = useState<'visual' | 'specs'>('visual');

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (inspectedProject) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          soundFX.playKeyClick();
          setInspectedProject(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [inspectedProject]);

  const filteredProjects = ENRICHED_PROJECTS.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="space-y-8">
      {/* Category Filter Pills */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All Projects', icon: <Layers size={13} /> },
          { id: 'ai', label: 'AI & GenAI Systems', icon: <Brain size={13} /> },
          { id: 'systems', label: 'Kafka & Distributed Systems', icon: <Server size={13} /> },
          { id: 'tools', label: 'Developer Workspaces', icon: <Wrench size={13} /> },
          { id: 'fintech', label: 'FinTech & Analytics', icon: <TrendingUp size={13} /> },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              soundFX.playHoverBlip();
              setActiveCategory(cat.id as ProjectCategory);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-[#89b4fa] text-[#060814] shadow-lg shadow-[#89b4fa]/25 scale-105'
                : 'bg-[#0f142b]/80 text-[#9399b2] hover:text-white hover:bg-[#161d3e] border border-white/5'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* 3D Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(p => (
          <TiltCard
            key={p.title}
            project={p}
            onInspect={item => {
              soundFX.playKeyClick();
              setModalTab('visual');
              setInspectedProject(item);
            }}
          />
        ))}
      </div>

      {/* Architectural Inspection Modal (Portaled directly to document.body for true viewport centering) */}
      {inspectedProject && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            soundFX.playKeyClick();
            setInspectedProject(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c1024] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Glow Bar */}
            <div
              className="h-1.5 w-full shrink-0"
              style={{ backgroundColor: inspectedProject.color }}
            />

            {/* Modal Header (Fixed at top of modal) */}
            <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-white/10 shrink-0 bg-[#0c1024]">
              <div className="space-y-1">
                <span
                  className="text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block"
                  style={{
                    backgroundColor: `${inspectedProject.color}15`,
                    color: inspectedProject.color,
                    border: `1px solid ${inspectedProject.color}35`,
                  }}
                >
                  {inspectedProject.metricBadge || inspectedProject.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">{inspectedProject.title}</h3>
                <p className="text-xs sm:text-sm font-medium" style={{ color: inspectedProject.color }}>
                  {inspectedProject.subtitle}
                </p>
              </div>

              <button
                onClick={() => {
                  soundFX.playKeyClick();
                  setInspectedProject(null);
                }}
                aria-label="Close modal"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#9399b2] hover:text-white transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs: Interactive Diagram vs Specifications */}
            <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-white/5 bg-[#0a0d20] shrink-0">
              <button
                onClick={() => {
                  soundFX.playHoverBlip();
                  setModalTab('visual');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  modalTab === 'visual'
                    ? 'bg-[#89b4fa] text-[#060814] shadow-md shadow-[#89b4fa]/20 scale-105'
                    : 'text-[#9399b2] hover:text-white hover:bg-white/5'
                }`}
              >
                <Workflow size={13} />
                <span>Visual Architecture Topology</span>
              </button>
              <button
                onClick={() => {
                  soundFX.playHoverBlip();
                  setModalTab('specs');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  modalTab === 'specs'
                    ? 'bg-[#89b4fa] text-[#060814] shadow-md shadow-[#89b4fa]/20 scale-105'
                    : 'text-[#9399b2] hover:text-white hover:bg-white/5'
                }`}
              >
                <Cpu size={13} />
                <span>Technical Specifications &amp; Security</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {modalTab === 'visual' ? (
                <InteractiveArchitectureDiagram
                  projectTitle={inspectedProject.title}
                  projectColor={inspectedProject.color}
                />
              ) : (
                <>
                  {/* Architectural Highlights */}
                  {inspectedProject.architectureDetails && (
                    <div className="space-y-3 bg-[#111736] p-4.5 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold text-[#89b4fa] uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu size={14} /> Architecture &amp; Engineering Highlights
                      </span>
                      <ul className="space-y-2.5">
                        {inspectedProject.architectureDetails.map((detail, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#cdd6f4] leading-relaxed">
                            <span className="mt-1 text-[#89b4fa] font-bold font-mono shrink-0">▸</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Security & Privacy Architecture */}
                  {inspectedProject.securityDetails && (
                    <div className="space-y-3 bg-[#0d1829] p-4.5 rounded-2xl border border-[#10b981]/25">
                      <span className="text-xs font-bold text-[#10b981] uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={14} /> Security &amp; Air-Gapped Privacy Architecture
                      </span>
                      <ul className="space-y-2">
                        {inspectedProject.securityDetails.map((sec, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#cdd6f4] leading-relaxed">
                            <span className="mt-1 text-[#10b981] font-bold font-mono shrink-0">✓</span>
                            <span>{sec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Core Technical Impact */}
                  {inspectedProject.bullets && inspectedProject.bullets.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#6c7086] uppercase tracking-wider block">
                        Core Technical Impact
                      </span>
                      <ul className="space-y-2">
                        {inspectedProject.bullets.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2 text-xs text-[#9399b2] leading-relaxed">
                            <span
                              className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: inspectedProject.color }}
                            />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tech Stack */}
                  <div>
                    <span className="text-xs font-bold text-[#6c7086] uppercase tracking-wider mb-2.5 block">
                      Technology Stack
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {inspectedProject.tech.map(t => (
                        <span
                          key={t}
                          className="text-xs font-mono px-3 py-1 rounded-xl bg-[#161d3e] text-[#cdd6f4] border border-white/10"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions Footer (Fixed at bottom of modal) */}
            <div className="p-4 px-6 border-t border-white/10 flex items-center justify-between gap-3 shrink-0 bg-[#0c1024]">
              <span className="text-[11px] font-mono text-[#6c7086]">
                {inspectedProject.period}
              </span>
              <div className="flex items-center gap-2">
                {inspectedProject.liveUrl && (
                  <a
                    href={inspectedProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold text-[#060814] bg-[#89b4fa] hover:bg-[#b4befe] transition-all shadow-lg shadow-[#89b4fa]/20 hover:scale-105 active:scale-95"
                  >
                    <Globe size={14} />
                    <span>Open Live Tool</span>
                  </a>
                )}
                {inspectedProject.github && (
                  <a
                    href={inspectedProject.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1a1f3c] hover:bg-[#252c56] border border-white/10 transition-all shadow-md hover:scale-105 active:scale-95"
                  >
                    <GithubIcon size={14} />
                    <span>View Repository</span>
                  </a>
                )}
                <button
                  onClick={() => {
                    soundFX.playKeyClick();
                    setInspectedProject(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#9399b2] hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
