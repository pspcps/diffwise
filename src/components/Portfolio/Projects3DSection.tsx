import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
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
};

// Augment projects with category tags & architectural details
const ENRICHED_PROJECTS: ProjectItem[] = [
  {
    ...RESUME.projects[0], // DevBench
    category: 'tools',
    metricBadge: '50+ Languages Diffing',
    architectureDetails: [
      'Dual Monaco Diff Editor instance with synchronized scrolling & ViewZone injection.',
      'Per-line interactive diff mover strip allowing 1-click code transfers.',
      '100% Client-side sandbox with Web Workers for offline execution.',
    ],
  },
  {
    ...RESUME.projects[1], // ApiDesk Studio
    category: 'tools',
    metricBadge: 'Full REST & Swagger Hub',
    architectureDetails: [
      'Postman-like request runner with GraphQL query & variables builder.',
      'Auto-cURL detection on URL bar paste with parameter extraction.',
      'Bidirectional Swagger/OpenAPI JSON ↔ YAML converter & interactive route explorer.',
    ],
  },
  {
    ...RESUME.projects[2], // Wealth Management
    category: 'fintech',
    metricBadge: 'Real-time Portfolio Insights',
    architectureDetails: [
      'Multi-asset balance tracking with automated portfolio allocation insights.',
      'PostgreSQL data pipeline with transactional integrity for investment records.',
      'Interactive financial charting and risk exposure monitoring.',
    ],
  },
  {
    ...RESUME.projects[3], // Project Drishti
    category: 'ai',
    metricBadge: '85–90% Agentic AI Crowd Safety',
    architectureDetails: [
      'Real-time webcam/mobile stream ingestion processed through Vertex AI Vision.',
      'Autonomous Gemini LLM risk assessment pipeline with automated emergency routing.',
      'Containerized on Google Cloud Run with sub-second incident alerting.',
    ],
  },
  {
    ...RESUME.projects[4], // Resume AI
    category: 'ai',
    metricBadge: 'Gemini 2.5 Pro ATS Scoring',
    architectureDetails: [
      'Deep semantic resume parsing evaluating skill density, role fit, and ATS strengths.',
      'Agentic job role matching reasoning with real-time feedback suggestions.',
      'Firebase Firestore persistent user profiles and PDF analysis pipeline.',
    ],
  },
  {
    ...RESUME.projects[5], // Ask My Docs
    category: 'ai',
    metricBadge: '100% Offline Local RAG',
    architectureDetails: [
      'Offline document embeddings stored directly in Redis Vector Search.',
      'Local Ollama LLM integration (Llama 3 / Mistral) ensuring zero data leakage.',
      'Custom chunking & semantic retrieval pipeline with Streamlit & Flask.',
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
              setInspectedProject(item);
            }}
          />
        ))}
      </div>

      {/* Architectural Inspection Modal */}
      {inspectedProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setInspectedProject(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#0c1024] border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Glow Bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: inspectedProject.color }}
            />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className="text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block"
                  style={{
                    backgroundColor: `${inspectedProject.color}15`,
                    color: inspectedProject.color,
                    border: `1px solid ${inspectedProject.color}35`,
                  }}
                >
                  {inspectedProject.metricBadge || inspectedProject.category}
                </span>
                <h3 className="text-2xl font-black text-white">{inspectedProject.title}</h3>
                <p className="text-sm font-medium mt-1" style={{ color: inspectedProject.color }}>
                  {inspectedProject.subtitle}
                </p>
              </div>

              <button
                onClick={() => setInspectedProject(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#9399b2] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Architectural Highlights */}
            {inspectedProject.architectureDetails && (
              <div className="space-y-3 bg-[#111736] p-4 rounded-2xl border border-white/5">
                <span className="text-xs font-bold text-[#89b4fa] uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu size={14} /> Architecture &amp; Engineering Highlights
                </span>
                <ul className="space-y-2">
                  {inspectedProject.architectureDetails.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2.5 text-xs text-[#cdd6f4]">
                      <span className="mt-1 text-[#89b4fa] font-bold font-mono">▸</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tech Stack */}
            <div>
              <span className="text-xs font-bold text-[#6c7086] uppercase tracking-wider mb-2 block">
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

            {/* Modal Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
              {inspectedProject.github && (
                <a
                  href={inspectedProject.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#89b4fa] hover:bg-[#b4befe] hover:text-[#060814] transition-all shadow-lg shadow-[#89b4fa]/20"
                >
                  <GithubIcon size={14} />
                  <span>View Repository</span>
                </a>
              )}
              <button
                onClick={() => setInspectedProject(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#9399b2] hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
