import React, { useMemo, useRef, useState, useEffect, type DragEvent } from 'react';
import MonacoEditor from '@monaco-editor/react';
import {
  Cable, Cloud, Copy, Database, Download, GitBranch, Layers3, Network, Play, Pause, Plus,
  Server, Trash2, Users, Workflow, Smartphone, Laptop, Monitor, Tablet, RefreshCw, ZoomIn, ZoomOut,
  Maximize2, AlertTriangle, Flame, ShieldAlert, Cpu, HardDrive, CheckCircle2, Sliders, Edit3, X,
  ArrowLeftRight
} from 'lucide-react';
import {
  addEdge, Background, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow, ReactFlowProvider,
  useEdgesState, useNodesState, useReactFlow,
  type Connection, type Edge, type Node, type NodeProps, type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type LabMode = 'mermaid' | 'system' | 'database';
let mermaidLanguageRegistered = false;

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// MERMAID COMPONENT (High-contrast text, Zoom/Pan, Auto-render, No color pickers)
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MERMAID = `flowchart TD
  Git["Git Push or PR Event"]:::gitStyle --> Jenkins["Jenkins Pipeline Triggered"]:::jenkinsStyle
  Jenkins --> Build["Build All cloud-api Services"]:::buildStyle
  Build --> Push["Push All Images to ECR"]:::pushStyle
  Push --> Decision{"Deployment Enabled?"}:::decisionStyle
  Decision -->|Yes| Deploy["Deploy All Services to dev2"]:::deployStyle
  Decision -->|No| EndNode["End Pipeline"]:::endStyle

  classDef gitStyle fill:#e8f4fd,stroke:#1e88e5,stroke-width:2px,color:#0f172a
  classDef jenkinsStyle fill:#fff9e6,stroke:#f59e0b,stroke-width:2px,color:#0f172a
  classDef buildStyle fill:#fff0e0,stroke:#f97316,stroke-width:2px,color:#0f172a
  classDef pushStyle fill:#e8f8f5,stroke:#0d9488,stroke-width:2px,color:#0f172a
  classDef decisionStyle fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#0f172a
  classDef deployStyle fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#0f172a
  classDef endStyle fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a`;

function MermaidView() {
  const [source, setSource] = useState(DEFAULT_MERMAID);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [canvasBg, setCanvasBg] = useState<'grid' | 'light' | 'dark'>('grid');

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const renderDiagram = async (code: string) => {
    if (!code.trim()) {
      setSvg('');
      setError('');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const module = await import('mermaid');
      const mermaid = module.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'default',
        themeVariables: {
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          textColor: '#0f172a',
          nodeTextColor: '#0f172a',
          primaryTextColor: '#0f172a',
          mainBkg: '#ffffff',
          nodeBorder: '#3b82f6',
          lineColor: '#334155',
          edgeLabelBackground: '#ffffff',
        },
        flowchart: {
          htmlLabels: true,
          useMaxWidth: false,
          curve: 'basis',
        },
      });

      const uniqueId = `devbench-mmd-${Date.now()}`;
      const result = await mermaid.render(uniqueId, code);
      setSvg(result.svg);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not render diagram syntax.');
    } finally {
      setBusy(false);
    }
  };

  // Auto-render with debounce whenever source changes (no need to click Render)
  useEffect(() => {
    const timer = setTimeout(() => {
      renderDiagram(source);
    }, 350);
    return () => clearTimeout(timer);
  }, [source]);

  // Zoom / Pan handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(4, Math.max(0.2, prev * zoomFactor)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click drag
    setIsPanning(true);
    startPanRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: pan.x,
      initialY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - startPanRef.current.x;
    const dy = e.clientY - startPanRef.current.y;
    setPan({
      x: startPanRef.current.initialX + dx,
      y: startPanRef.current.initialY + dy,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const exportPng = async () => {
    if (!svg) return;
    const blobUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const image = new Image();
      image.src = blobUrl;
      await image.decode();
      const viewBox = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
      const width = Number(viewBox?.[1]) || image.naturalWidth || 1200;
      const height = Number(viewBox?.[2]) || image.naturalHeight || 800;
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas export is unavailable.');
      context.fillStyle = canvasBg === 'dark' ? '#15151f' : '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.scale(2, 2);
      context.drawImage(image, 0, 0, width, height);
      const png = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(val => (val ? resolve(val) : reject(new Error('PNG export failed.'))), 'image/png')
      );
      const pngUrl = URL.createObjectURL(png);
      const anchor = document.createElement('a');
      anchor.href = pngUrl;
      anchor.download = 'architecture-diagram.png';
      anchor.click();
      URL.revokeObjectURL(pngUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not export PNG.');
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
      {/* Editor Pane */}
      <div className="flex min-h-0 flex-col border-b border-[#313244] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-[#313244] bg-[#181825] px-4 py-2 text-[11px] text-[#9399b2]">
          <span className="font-medium text-[#cdd6f4]">Mermaid Code Editor</span>
          <span className="text-[10px] text-[#a6e3a1]">Auto-loads on edit/paste</span>
        </div>
        <div className="min-h-0 flex-1">
          <MonacoEditor
            height="100%"
            language="devbench-mermaid"
            theme="vs-dark"
            value={source}
            onChange={value => setSource(value ?? '')}
            onMount={(_editor, monaco) => {
              if (!mermaidLanguageRegistered) {
                monaco.languages.register({ id: 'devbench-mermaid' });
                monaco.languages.setLanguageConfiguration('devbench-mermaid', {
                  brackets: [['(', ')'], ['[', ']'], ['{', '}']],
                  autoClosingPairs: [{ open: '(', close: ')' }, { open: '[', close: ']' }, { open: '{', close: '}' }, { open: '"', close: '"' }],
                });
                monaco.languages.setMonarchTokensProvider('devbench-mermaid', {
                  tokenizer: {
                    root: [
                      [/%%.*/, 'comment'],
                      [/\b(flowchart|graph|subgraph|end|direction|classDef|class|style|linkStyle|click|sequenceDiagram|stateDiagram|erDiagram|gantt|pie)\b/, 'keyword'],
                      [/\b(TB|TD|BT|RL|LR)\b/, 'type'],
                      [/(<-->|-->|---|-.->|==>|--o|--x|---o|---x)/, 'operator'],
                      [/\[|\]|\(|\)|\{|\}/, 'delimiter.bracket'],
                      [/"[^"\n]*"/, 'string'],
                      [/[A-Za-z_][\w-]*/, 'identifier'],
                      [/\d+/, 'number'],
                    ],
                  },
                });
                monaco.editor.defineTheme('devbench-mermaid-dark', {
                  base: 'vs-dark',
                  inherit: true,
                  rules: [
                    { token: 'keyword', foreground: '89B4FA' },
                    { token: 'type', foreground: 'CBA6F7' },
                    { token: 'operator', foreground: 'F9E2AF' },
                    { token: 'string', foreground: 'A6E3A1' },
                    { token: 'comment', foreground: '6C7086' },
                    { token: 'number', foreground: 'FAB387' },
                    { token: 'identifier', foreground: 'CDD6F4' },
                  ],
                  colors: {
                    'editor.background': '#14141f',
                  },
                });
                monaco.editor.setTheme('devbench-mermaid-dark');
                mermaidLanguageRegistered = true;
              }
            }}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              folding: true,
              showFoldingControls: 'always',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              fontSize: 12,
              padding: { top: 10, bottom: 10 },
              tabSize: 2,
            }}
          />
        </div>
      </div>

      {/* Preview Pane with Zoom, Pan, and Canvas Themes */}
      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#313244] bg-[#181825] px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#cdd6f4]">Diagram Preview</span>
            <div className="flex items-center gap-1 rounded bg-[#11111b] p-0.5 text-[9px] border border-[#313244]">
              <button
                onClick={() => setCanvasBg('grid')}
                className={`rounded px-1.5 py-0.5 transition-all ${canvasBg === 'grid' ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086]'}`}
              >
                Dot Grid
              </button>
              <button
                onClick={() => setCanvasBg('light')}
                className={`rounded px-1.5 py-0.5 transition-all ${canvasBg === 'light' ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086]'}`}
              >
                White
              </button>
              <button
                onClick={() => setCanvasBg('dark')}
                className={`rounded px-1.5 py-0.5 transition-all ${canvasBg === 'dark' ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086]'}`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Zoom controls & Exports */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded border border-[#313244] bg-[#11111b] text-[#9399b2]">
              <button
                onClick={() => setZoom(z => Math.max(0.2, z - 0.15))}
                title="Zoom Out"
                className="p-1 hover:text-[#cdd6f4]"
              >
                <ZoomOut size={13} />
              </button>
              <span className="px-1.5 font-mono text-[9px] text-[#cdd6f4]">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(4, z + 0.15))}
                title="Zoom In"
                className="p-1 hover:text-[#cdd6f4]"
              >
                <ZoomIn size={13} />
              </button>
              <button onClick={resetView} title="Reset View" className="border-l border-[#313244] p-1 hover:text-[#cdd6f4]">
                <Maximize2 size={12} />
              </button>
            </div>

            <button
              onClick={() => void renderDiagram(source)}
              disabled={busy}
              className="flex items-center gap-1 rounded border border-[#89b4fa]/30 bg-[#89b4fa]/10 px-2 py-1 text-[10px] text-[#89b4fa] hover:bg-[#89b4fa]/20 disabled:opacity-40"
            >
              <RefreshCw size={11} className={busy ? 'animate-spin' : ''} />
              {busy ? 'Rendering' : 'Render'}
            </button>
            <button
              onClick={() => downloadFile('architecture-diagram.svg', svg, 'image/svg+xml')}
              disabled={!svg}
              className="rounded border border-[#313244] px-2 py-1 text-[10px] text-[#cdd6f4] hover:bg-[#252538] disabled:opacity-40"
            >
              SVG
            </button>
            <button
              onClick={() => void exportPng()}
              disabled={!svg}
              className="rounded border border-[#313244] px-2 py-1 text-[10px] text-[#cdd6f4] hover:bg-[#252538] disabled:opacity-40"
            >
              PNG
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="shrink-0 border-b border-[#f38ba8]/30 bg-[#f38ba8]/10 px-4 py-2 text-[11px] text-[#f38ba8]">
            {error}
          </div>
        )}

        {/* Interactive Canvas Area */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative min-h-0 flex-1 overflow-hidden select-none ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          } ${
            canvasBg === 'grid'
              ? 'bg-[#f8fafc]'
              : canvasBg === 'light'
              ? 'bg-[#ffffff]'
              : 'bg-[#15151f]'
          }`}
          style={
            canvasBg === 'grid'
              ? {
                  backgroundImage: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
                  backgroundSize: '20px 20px',
                }
              : undefined
          }
        >
          {svg ? (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center transition-transform duration-75"
              style={{
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
              }}
            >
              {/* Force node and label texts to always be high contrast and readable! */}
              <style>{`
                .devbench-svg-wrap svg text,
                .devbench-svg-wrap svg .node text,
                .devbench-svg-wrap svg .node .label,
                .devbench-svg-wrap svg span.nodeLabel,
                .devbench-svg-wrap svg p {
                  fill: #0f172a !important;
                  color: #0f172a !important;
                  font-weight: 600 !important;
                  font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                }
                .devbench-svg-wrap svg .edgeLabel {
                  color: #1e293b !important;
                  fill: #1e293b !important;
                  background-color: rgba(255,255,255,0.95) !important;
                  padding: 2px 4px !important;
                  border-radius: 4px !important;
                  font-weight: 500 !important;
                }
                .devbench-svg-wrap svg .node polygon,
                .devbench-svg-wrap svg .node rect,
                .devbench-svg-wrap svg .node circle,
                .devbench-svg-wrap svg .node path {
                  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.06));
                }
              `}</style>
              <div
                className="devbench-svg-wrap pointer-events-none min-w-[500px]"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center text-xs text-[#64748b]">
              Enter Mermaid syntax or paste code to preview your diagram.
            </div>
          )}

          {/* Touch / Pan hint footer */}
          <div className="absolute bottom-2 right-2 rounded-md bg-[#181825]/85 px-2 py-1 text-[9px] text-[#9399b2] backdrop-blur border border-[#313244]/60 pointer-events-none">
            Scroll to zoom · Drag to pan
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM DESIGN "GOD SIMULATOR"
// Authentic Cloud & Device Icons, Real-time Traffic Packets, Breakage & Cascades
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceMetrics {
  requests: number;
  utilization: number;
  p95: number;
  overload: number;
  cpuCores: number;
  cpuCapacity: number;
  memoryGb: number;
  queueDepth: number;
  failedRequests: number;
  isBroken?: boolean;
}

interface ServiceCatalogItem {
  title: string;
  provider: 'AWS' | 'GCP' | 'Azure' | 'Client' | 'Generic';
  kind: string;
  icon: 'user' | 'laptop' | 'mobile' | 'monitor' | 'tablet' | 'compute' | 'database' | 'queue' | 'storage' | 'cache' | 'network' | 'k8s';
  capacity: number;
  replicas: number;
  latency: number;
  errorRate: number;
  cpuMsPerRequest?: number;
  cpuCoresPerReplica?: number;
  memoryGbPerReplica?: number;
}

interface ServiceData extends ServiceCatalogItem {
  [key: string]: unknown;
  metrics?: ServiceMetrics;
  onRename?: (id: string, newName: string) => void;
}

type ServiceNodeType = Node<ServiceData, 'service'>;

// Service Icon Mapper with Device & Cloud Icons
function renderServiceIcon(icon: ServiceCatalogItem['icon'], size = 15) {
  switch (icon) {
    case 'user': return <Users size={size} />;
    case 'laptop': return <Laptop size={size} />;
    case 'mobile': return <Smartphone size={size} />;
    case 'monitor': return <Monitor size={size} />;
    case 'tablet': return <Tablet size={size} />;
    case 'compute': return <Server size={size} />;
    case 'database': return <Database size={size} />;
    case 'queue': return <Cable size={size} />;
    case 'storage': return <HardDrive size={size} />;
    case 'cache': return <Layers3 size={size} />;
    case 'network': return <Network size={size} />;
    case 'k8s': return <Cpu size={size} />;
    default: return <Server size={size} />;
  }
}

function ServiceNode({ id, data, selected }: NodeProps<ServiceNodeType>) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(data.title);

  const providerColor =
    data.provider === 'AWS' ? '#f59e0b' :
    data.provider === 'GCP' ? '#38bdf8' :
    data.provider === 'Azure' ? '#60a5fa' :
    data.provider === 'Client' ? '#a78bfa' : '#34d399';

  const metrics = data.metrics;
  const isOverloaded = metrics && metrics.utilization >= 1.0;
  const isDegraded = metrics && metrics.utilization >= 0.75 && metrics.utilization < 1.0;
  const isBroken = metrics?.isBroken || (metrics && metrics.failedRequests > (metrics.requests * 0.4));

  const handleTitleSubmit = () => {
    setEditingTitle(false);
    if (data.onRename && titleInput.trim()) {
      data.onRename(id, titleInput.trim());
    }
  };

  return (
    <div
      className={`min-w-[210px] rounded-lg border shadow-xl transition-all ${
        isBroken
          ? 'border-[#f38ba8] bg-[#2a131a] ring-2 ring-[#f38ba8]/60 animate-pulse'
          : isOverloaded
          ? 'border-[#fab387] bg-[#291e17] ring-1 ring-[#fab387]'
          : selected
          ? 'border-[#89b4fa] bg-[#1b1b2a] ring-1 ring-[#89b4fa]'
          : 'border-[#313244] bg-[#181825]'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-[#181825] !bg-[#89b4fa]" />

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#313244] px-3 py-2">
        <span className="shrink-0 text-[#89b4fa]">
          {renderServiceIcon(data.icon, 15)}
        </span>
        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <input
              type="text"
              value={titleInput}
              autoFocus
              onChange={e => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={e => e.key === 'Enter' && handleTitleSubmit()}
              className="w-full rounded bg-[#11111b] px-1 text-[11px] font-semibold text-[#cdd6f4] outline-none border border-[#89b4fa]"
            />
          ) : (
            <div
              onClick={() => setEditingTitle(true)}
              title="Click to rename"
              className="flex items-center gap-1 group cursor-pointer"
            >
              <span className="truncate text-[11px] font-semibold text-[#cdd6f4] group-hover:text-[#89b4fa]">
                {data.title}
              </span>
              <Edit3 size={9} className="opacity-0 group-hover:opacity-100 text-[#6c7086]" />
            </div>
          )}
          <div className="text-[9px] text-[#6c7086]">{data.kind}</div>
        </div>

        <span
          className="rounded border px-1.5 py-0.5 text-[8px] font-semibold"
          style={{ color: providerColor, borderColor: `${providerColor}55`, backgroundColor: `${providerColor}15` }}
        >
          {data.provider.toUpperCase()}
        </span>
      </div>

      {/* Body / Live Metrics */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 p-2 text-[9px] text-[#9399b2]">
        <span>Capacity</span>
        <span className="text-right font-mono text-[#cdd6f4]">{(data.capacity * data.replicas).toLocaleString()}/s</span>

        <span>Replicas</span>
        <span className="text-right font-mono text-[#cdd6f4]">{data.replicas}</span>

        {metrics && (
          <>
            <span className="border-t border-[#313244] pt-1 text-[#cdd6f4]">Traffic</span>
            <span className="border-t border-[#313244] pt-1 text-right font-mono font-medium text-[#cdd6f4]">
              {Math.round(metrics.requests).toLocaleString()} /s
            </span>

            <span>Status</span>
            <span className="text-right font-mono font-bold">
              {isBroken ? (
                <span className="text-[#f38ba8] flex items-center justify-end gap-1">
                  <Flame size={10} /> BREAKING
                </span>
              ) : isOverloaded ? (
                <span className="text-[#fab387] flex items-center justify-end gap-1">
                  <AlertTriangle size={10} /> SATURATED
                </span>
              ) : isDegraded ? (
                <span className="text-[#f9e2af]">HEAVY LOAD</span>
              ) : (
                <span className="text-[#a6e3a1] flex items-center justify-end gap-1">
                  <CheckCircle2 size={10} /> HEALTHY
                </span>
              )}
            </span>

            <span>Utilization</span>
            <span
              className={`text-right font-mono font-medium ${
                metrics.utilization >= 1 ? 'text-[#f38ba8]' : metrics.utilization > 0.75 ? 'text-[#fab387]' : 'text-[#a6e3a1]'
              }`}
            >
              {Math.round(metrics.utilization * 100)}%
            </span>

            <span>Latency (P95)</span>
            <span className={`text-right font-mono ${metrics.p95 > 200 ? 'text-[#f38ba8]' : 'text-[#cdd6f4]'}`}>
              {Math.round(metrics.p95)} ms
            </span>

            {metrics.failedRequests > 0 && (
              <>
                <span className="text-[#f38ba8]">Dropped Req</span>
                <span className="text-right font-mono font-bold text-[#f38ba8]">
                  {Math.round(metrics.failedRequests)}/s
                </span>
              </>
            )}

            {metrics.queueDepth > 0 && (
              <>
                <span className="text-[#f9e2af]">Queue Backlog</span>
                <span className="text-right font-mono text-[#f9e2af]">
                  {Math.round(metrics.queueDepth)} msgs
                </span>
              </>
            )}
          </>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-[#181825] !bg-[#89b4fa]" />
    </div>
  );
}

const serviceNodeTypes: NodeTypes = { service: ServiceNode };

const SERVICE_CATALOG: ServiceCatalogItem[] = [
  // User Devices / Clients
  { title: 'Web Users (Browser)', provider: 'Client', kind: 'Desktop Web', icon: 'laptop', capacity: 10000, replicas: 1, latency: 15, errorRate: 0 },
  { title: 'Mobile App Users', provider: 'Client', kind: 'iOS / Android', icon: 'mobile', capacity: 10000, replicas: 1, latency: 45, errorRate: 0 },
  { title: 'Enterprise Desktops', provider: 'Client', kind: 'Workstations', icon: 'monitor', capacity: 5000, replicas: 1, latency: 10, errorRate: 0 },
  { title: 'IoT Devices / Sensors', provider: 'Client', kind: 'Telemetry Edge', icon: 'tablet', capacity: 20000, replicas: 1, latency: 5, errorRate: 0.1 },

  // AWS
  { title: 'API Gateway', provider: 'AWS', kind: 'API Gateway', icon: 'network', capacity: 5000, replicas: 2, latency: 8, errorRate: 0.01 },
  { title: 'CloudFront CDN', provider: 'AWS', kind: 'CloudFront', icon: 'network', capacity: 20000, replicas: 1, latency: 4, errorRate: 0.001 },
  { title: 'Application Load Balancer', provider: 'AWS', kind: 'ALB', icon: 'network', capacity: 10000, replicas: 2, latency: 4, errorRate: 0.005 },
  { title: 'Compute Service (EC2)', provider: 'AWS', kind: 'EC2 Clusters', icon: 'compute', capacity: 1200, replicas: 3, latency: 25, errorRate: 0.01, cpuMsPerRequest: 4, cpuCoresPerReplica: 2, memoryGbPerReplica: 4 },
  { title: 'Serverless Functions', provider: 'AWS', kind: 'AWS Lambda', icon: 'compute', capacity: 600, replicas: 5, latency: 35, errorRate: 0.01, cpuMsPerRequest: 2, cpuCoresPerReplica: 1, memoryGbPerReplica: 2 },
  { title: 'Kubernetes Cluster (EKS)', provider: 'AWS', kind: 'EKS Pods', icon: 'k8s', capacity: 2500, replicas: 4, latency: 18, errorRate: 0.01, cpuMsPerRequest: 3, cpuCoresPerReplica: 4, memoryGbPerReplica: 8 },
  { title: 'Relational Database (RDS)', provider: 'AWS', kind: 'PostgreSQL RDS', icon: 'database', capacity: 800, replicas: 1, latency: 12, errorRate: 0.005, cpuMsPerRequest: 6, cpuCoresPerReplica: 4, memoryGbPerReplica: 16 },
  { title: 'DynamoDB NoSQL', provider: 'AWS', kind: 'DynamoDB', icon: 'database', capacity: 8000, replicas: 1, latency: 6, errorRate: 0.001 },
  { title: 'ElastiCache (Redis)', provider: 'AWS', kind: 'Redis Cluster', icon: 'cache', capacity: 12000, replicas: 2, latency: 2, errorRate: 0.001 },
  { title: 'SQS Message Queue', provider: 'AWS', kind: 'Amazon SQS', icon: 'queue', capacity: 8000, replicas: 1, latency: 10, errorRate: 0.001 },
  { title: 'S3 Object Storage', provider: 'AWS', kind: 'Amazon S3', icon: 'storage', capacity: 10000, replicas: 1, latency: 25, errorRate: 0.001 },

  // GCP
  { title: 'Cloud Run Service', provider: 'GCP', kind: 'Cloud Run', icon: 'compute', capacity: 1000, replicas: 3, latency: 22, errorRate: 0.01 },
  { title: 'Cloud SQL Postgres', provider: 'GCP', kind: 'Cloud SQL', icon: 'database', capacity: 750, replicas: 1, latency: 14, errorRate: 0.005 },
  { title: 'Google Kubernetes (GKE)', provider: 'GCP', kind: 'GKE Cluster', icon: 'k8s', capacity: 2400, replicas: 4, latency: 18, errorRate: 0.01 },
  { title: 'Pub/Sub Event Bus', provider: 'GCP', kind: 'Cloud Pub/Sub', icon: 'queue', capacity: 10000, replicas: 1, latency: 8, errorRate: 0.001 },
  { title: 'BigQuery Analytics', provider: 'GCP', kind: 'BigQuery', icon: 'database', capacity: 1200, replicas: 2, latency: 120, errorRate: 0.005 },

  // Azure
  { title: 'Azure Functions', provider: 'Azure', kind: 'Functions App', icon: 'compute', capacity: 600, replicas: 3, latency: 38, errorRate: 0.02 },
  { title: 'Cosmos DB Multi-Region', provider: 'Azure', kind: 'Cosmos DB', icon: 'database', capacity: 5000, replicas: 1, latency: 9, errorRate: 0.002 },
  { title: 'Azure Kubernetes (AKS)', provider: 'Azure', kind: 'AKS Cluster', icon: 'k8s', capacity: 2200, replicas: 4, latency: 19, errorRate: 0.01 },
  { title: 'Azure Service Bus', provider: 'Azure', kind: 'Service Bus', icon: 'queue', capacity: 6000, replicas: 2, latency: 12, errorRate: 0.005 },

  // Generic / Open Source
  { title: 'Nginx Reverse Proxy', provider: 'Generic', kind: 'Nginx Gateway', icon: 'network', capacity: 12000, replicas: 2, latency: 2, errorRate: 0.001 },
  { title: 'Apache Kafka Broker', provider: 'Generic', kind: 'Kafka Cluster', icon: 'queue', capacity: 15000, replicas: 3, latency: 5, errorRate: 0.002 },
  { title: 'Redis Cache Standalone', provider: 'Generic', kind: 'Redis Master', icon: 'cache', capacity: 10000, replicas: 1, latency: 1, errorRate: 0.001 },
  { title: 'PostgreSQL Database', provider: 'Generic', kind: 'Postgres Master', icon: 'database', capacity: 700, replicas: 1, latency: 15, errorRate: 0.005 },
];

function createServiceData(
  service: ServiceCatalogItem,
  onRename?: (id: string, newName: string) => void
): ServiceData {
  return {
    ...service,
    cpuMsPerRequest: service.cpuMsPerRequest ?? (service.icon === 'database' ? 5 : service.icon === 'storage' ? 1 : 3),
    cpuCoresPerReplica: service.cpuCoresPerReplica ?? (service.icon === 'database' ? 2 : service.icon === 'compute' ? 1 : 0.5),
    memoryGbPerReplica: service.memoryGbPerReplica ?? (service.icon === 'database' ? 4 : service.icon === 'compute' ? 2 : 1),
    onRename,
  };
}

const INITIAL_SERVICE_NODES: ServiceNodeType[] = [
  { id: 'web-clients', type: 'service', position: { x: 30, y: 120 }, data: createServiceData(SERVICE_CATALOG[0]) },
  { id: 'mobile-clients', type: 'service', position: { x: 30, y: 320 }, data: createServiceData(SERVICE_CATALOG[1]) },
  { id: 'gateway', type: 'service', position: { x: 340, y: 220 }, data: createServiceData(SERVICE_CATALOG[4]) },
  { id: 'compute', type: 'service', position: { x: 640, y: 220 }, data: createServiceData(SERVICE_CATALOG[7]) },
  { id: 'database', type: 'service', position: { x: 960, y: 120 }, data: createServiceData(SERVICE_CATALOG[10]) },
  { id: 'cache', type: 'service', position: { x: 960, y: 320 }, data: createServiceData(SERVICE_CATALOG[12]) },
];

const INITIAL_SERVICE_EDGES: Edge[] = [
  { id: 'web-gw', source: 'web-clients', target: 'gateway', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' }, style: { stroke: '#89b4fa', strokeWidth: 2 } },
  { id: 'mobile-gw', source: 'mobile-clients', target: 'gateway', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' }, style: { stroke: '#89b4fa', strokeWidth: 2 } },
  { id: 'gw-compute', source: 'gateway', target: 'compute', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' }, style: { stroke: '#89b4fa', strokeWidth: 2 } },
  { id: 'compute-db', source: 'compute', target: 'database', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' }, style: { stroke: '#89b4fa', strokeWidth: 2 } },
  { id: 'compute-cache', source: 'compute', target: 'cache', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' }, style: { stroke: '#89b4fa', strokeWidth: 2 } },
];

function SystemDesignCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ServiceNodeType>(INITIAL_SERVICE_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_SERVICE_EDGES);
  const [selectedId, setSelectedId] = useState('compute');
  const [ingressRps, setIngressRps] = useState(2500);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState(true);
  const [incidentLog, setIncidentLog] = useState<string[]>([]);
  const [forcedDownNodes, setForcedDownNodes] = useState<Set<string>>(new Set());

  const flow = useReactFlow<ServiceNodeType, Edge>();
  const selectedNode = nodes.find(node => node.id === selectedId) ?? null;

  // In-place node renaming callback
  const handleRenameNode = (nodeId: string, newName: string) => {
    setNodes(current =>
      current.map(n => (n.id === nodeId ? { ...n, data: { ...n.data, title: newName } } : n))
    );
  };

  // Attach rename callback to all nodes on mount
  useEffect(() => {
    setNodes(current =>
      current.map(n => ({
        ...n,
        data: {
          ...n.data,
          onRename: handleRenameNode,
        },
      }))
    );
  }, []);

  const updateSelectedField = (
    field: keyof Pick<ServiceData, 'title' | 'capacity' | 'replicas' | 'latency' | 'errorRate'>,
    value: unknown
  ) => {
    setNodes(current =>
      current.map(node =>
        node.id === selectedId ? { ...node, data: { ...node.data, [field]: value } } : node
      )
    );
  };

  const addCatalogService = (service: ServiceCatalogItem) => {
    const id = `${service.kind.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomUUID().slice(0, 5)}`;
    const nodeIndex = nodes.length;
    const newNode: ServiceNodeType = {
      id,
      type: 'service',
      position: { x: 300 + (nodeIndex % 4) * 60, y: 80 + Math.floor(nodeIndex / 4) * 80 },
      data: createServiceData(service, handleRenameNode),
    };
    setNodes(current => [...current, newNode]);
    setSelectedId(id);
  };

  const onConnect = (connection: Connection) => {
    setEdges(current =>
      addEdge(
        {
          ...connection,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' },
          style: { stroke: '#89b4fa', strokeWidth: 2 },
        },
        current
      )
    );
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const index = Number(event.dataTransfer.getData('application/devbench-service'));
    const service = SERVICE_CATALOG[index];
    if (!service) return;
    const position = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNode: ServiceNodeType = {
      id: `${service.kind.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomUUID().slice(0, 5)}`,
      type: 'service',
      position,
      data: createServiceData(service, handleRenameNode),
    };
    setNodes(current => [...current, newNode]);
    setSelectedId(newNode.id);
  };

  // ── "GOD SIMULATOR" Traffic & Cascade Calculation ─────────────────────────
  const runSimulationStep = () => {
    const incoming = new Map(nodes.map(n => [n.id, 0]));
    const outgoing = new Map(nodes.map(n => [n.id, [] as string[]]));
    const indegree = new Map(nodes.map(n => [n.id, 0]));

    edges.forEach(edge => {
      outgoing.get(edge.source)?.push(edge.target);
      indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    });

    // Find traffic sources: client devices or root nodes
    const clientRoots = nodes.filter(
      n => n.data.provider === 'Client' || n.data.icon === 'user' || indegree.get(n.id) === 0
    );
    const roots = clientRoots.length ? clientRoots : nodes.slice(0, 1);

    roots.forEach(node => {
      incoming.set(node.id, ingressRps / roots.length);
    });

    const queue = [...roots.map(n => n.id)];
    const visited = new Set<string>();
    const metrics: Record<string, ServiceMetrics> = {};
    const newLogs: string[] = [];

    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);

      const node = nodes.find(n => n.id === id);
      if (!node) continue;

      const isKilled = forcedDownNodes.has(id);
      const requests = incoming.get(id) ?? 0;
      const requestCapacity = Math.max(1, node.data.capacity * node.data.replicas);
      const effectiveCapacity = isKilled ? 0 : requestCapacity;
      const utilization = effectiveCapacity > 0 ? requests / effectiveCapacity : 9.99;
      const overload = Math.max(0, requests - effectiveCapacity);
      const isBroken = isKilled || overload > 0 || utilization >= 1.0;

      // Latency calculation: steep exponential curve when saturated
      const queueDelay = utilization < 0.8 ? 0 : utilization < 1 ? (utilization - 0.8) * 150 : 800 + overload * 0.4;
      const p95 = isKilled ? 5000 : Math.round(node.data.latency + queueDelay);
      const failedRequests = isKilled ? requests : (requests * (node.data.errorRate / 100)) + overload;
      const queueDepth = isKilled ? requests * 2 : overload * 1.5;

      metrics[id] = {
        requests,
        utilization,
        p95,
        overload,
        cpuCores: Math.min(node.data.replicas * 4, requests * 0.003),
        cpuCapacity: node.data.replicas * 4,
        memoryGb: node.data.replicas * 4,
        queueDepth,
        failedRequests,
        isBroken,
      };

      if (isKilled) {
        newLogs.push(`[OUTAGE] ${node.data.title} is completely DOWN! Dropping 100% (${Math.round(requests)} req/s).`);
      } else if (overload > 0) {
        newLogs.push(
          `[SATURATION] ${node.data.title} exceeded capacity (${Math.round(requests)}/${effectiveCapacity} req/s) -> Dropping ${Math.round(overload)} req/s, P95 latency: ${p95}ms!`
        );
      }

      // Propagate surviving traffic downstream
      const forwarded = Math.max(0, requests - overload);
      const targets = outgoing.get(id) ?? [];
      if (targets.length && forwarded > 0) {
        const share = forwarded / targets.length;
        targets.forEach(targetId => {
          incoming.set(targetId, (incoming.get(targetId) ?? 0) + share);
          if (!visited.has(targetId)) queue.push(targetId);
        });
      }
    }

    // Apply metrics to nodes
    setNodes(current =>
      current.map(node => ({
        ...node,
        data: {
          ...node.data,
          metrics: metrics[node.id],
        },
      }))
    );

    // Color edges based on whether downstream is breaking
    setEdges(current =>
      current.map(edge => {
        const targetMetric = metrics[edge.target];
        const isTargetBroken = targetMetric && (targetMetric.isBroken || targetMetric.utilization >= 1.0);
        return {
          ...edge,
          animated: isSimulating,
          style: {
            stroke: isTargetBroken ? '#f38ba8' : '#89b4fa',
            strokeWidth: isTargetBroken ? 3 : 2,
            strokeDasharray: isTargetBroken ? '5,5' : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isTargetBroken ? '#f38ba8' : '#89b4fa',
          },
        };
      })
    );

    if (newLogs.length > 0) {
      setIncidentLog(newLogs.slice(0, 3));
    } else {
      setIncidentLog([`All systems operational. Processing ${ingressRps.toLocaleString()} req/s across ${nodes.length} services.`]);
    }
  };

  // Run simulation tick
  useEffect(() => {
    if (!isSimulating) return;
    runSimulationStep();
    const interval = setInterval(runSimulationStep, 2000 / simSpeed);
    return () => clearInterval(interval);
  }, [ingressRps, nodes.length, edges.length, isSimulating, simSpeed, forcedDownNodes]);

  // Failure Injection Shortcuts
  const triggerTrafficSpike = () => {
    setIngressRps(prev => prev * 4);
  };

  const killDatabase = () => {
    const dbNode = nodes.find(n => n.data.icon === 'database');
    if (dbNode) {
      setForcedDownNodes(prev => new Set([...prev, dbNode.id]));
    }
  };

  const restoreAll = () => {
    setForcedDownNodes(new Set());
    setIngressRps(2500);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Simulation Command Center */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-2">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-semibold transition-all ${
                isSimulating ? 'bg-[#a6e3a1]/15 text-[#a6e3a1] border border-[#a6e3a1]/40' : 'bg-[#313244] text-[#cdd6f4]'
              }`}
            >
              {isSimulating ? <Pause size={12} /> : <Play size={12} />}
              {isSimulating ? 'Simulating' : 'Paused'}
            </button>
            <div className="flex items-center gap-1 text-[9px] text-[#9399b2] border border-[#313244] rounded bg-[#11111b] px-1.5 py-0.5">
              <span>Speed:</span>
              {[1, 2, 5].map(spd => (
                <button
                  key={spd}
                  onClick={() => setSimSpeed(spd)}
                  className={`px-1 rounded ${simSpeed === spd ? 'bg-[#89b4fa] text-[#11111b] font-bold' : 'text-[#6c7086]'}`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Ingress slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#9399b2]">Ingress Traffic:</span>
            <input
              type="range"
              min="200"
              max="25000"
              step="200"
              value={ingressRps}
              onChange={e => setIngressRps(Number(e.target.value))}
              className="w-28 accent-[#89b4fa] cursor-pointer"
            />
            <span className="font-mono text-[10px] font-bold text-[#89b4fa]">
              {ingressRps.toLocaleString()} req/s
            </span>
          </div>

          {/* Fault injection presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={triggerTrafficSpike}
              title="Spike traffic by 4x"
              className="flex items-center gap-1 rounded border border-[#fab387]/40 bg-[#fab387]/10 px-2 py-1 text-[9px] text-[#fab387] hover:bg-[#fab387]/20"
            >
              <Flame size={11} /> 4x Spike
            </button>
            <button
              onClick={killDatabase}
              title="Cut database connection pool"
              className="flex items-center gap-1 rounded border border-[#f38ba8]/40 bg-[#f38ba8]/10 px-2 py-1 text-[9px] text-[#f38ba8] hover:bg-[#f38ba8]/20"
            >
              <ShieldAlert size={11} /> Kill DB
            </button>
            <button
              onClick={restoreAll}
              title="Reset all failure states to normal"
              className="flex items-center gap-1 rounded border border-[#313244] px-2 py-1 text-[9px] text-[#a6e3a1] hover:bg-[#252538]"
            >
              <CheckCircle2 size={11} /> Normal
            </button>
          </div>
        </div>

        <div className="text-[9px] text-[#6c7086]">
          Tip: Drag services to canvas · Click node title to rename
        </div>
      </div>

      {/* Live Incident Diagnostics Banner */}
      {incidentLog.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#313244] bg-[#11111b] px-4 py-1.5 text-[10px]">
          <span className="font-semibold text-[#89b4fa] uppercase tracking-wider text-[9px]">Live Diagnostics:</span>
          <div className="flex-1 truncate">
            {incidentLog.map((log, i) => (
              <span
                key={i}
                className={
                  log.includes('[OUTAGE]') || log.includes('[SATURATION]')
                    ? 'text-[#f38ba8] font-medium'
                    : 'text-[#a6e3a1]'
                }
              >
                {log}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[230px_minmax(0,1fr)_250px]">
        {/* Service Catalog Sidebar */}
        <aside className="flex min-h-0 flex-col border-b border-[#313244] bg-[#181825] md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 border-b border-[#313244] px-3 py-2 text-[11px] font-semibold text-[#cdd6f4]">
            <Cloud size={13} className="text-[#89b4fa]" />
            Component Palette
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
            {(['Client', 'AWS', 'GCP', 'Azure', 'Generic'] as const).map(provider => (
              <section key={provider} className="mb-2">
                <h3 className="sticky top-0 z-10 bg-[#181825] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#89b4fa]">
                  {provider === 'Client' ? 'Clients & Devices' : `${provider} Services`}
                </h3>
                {SERVICE_CATALOG.map((service, index) => ({ service, index }))
                  .filter(({ service }) => service.provider === provider)
                  .map(({ service, index }) => (
                    <button
                      key={`${service.provider}-${service.title}`}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('application/devbench-service', String(index))}
                      onClick={() => addCatalogService(service)}
                      className="mb-1 flex w-full items-center gap-2 rounded border border-transparent px-2 py-1.5 text-left transition-all hover:border-[#313244] hover:bg-[#202030]"
                    >
                      <span className="shrink-0 text-[#89b4fa]">
                        {renderServiceIcon(service.icon, 13)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-medium text-[#cdd6f4]">{service.title}</div>
                        <div className="text-[8px] text-[#6c7086]">{service.kind}</div>
                      </div>
                      <span className="text-[8px] font-mono text-[#89b4fa]">
                        {service.capacity >= 1000 ? `${service.capacity / 1000}k` : service.capacity}
                      </span>
                    </button>
                  ))}
              </section>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div className="min-h-[350px]" onDragOver={e => e.preventDefault()} onDrop={onDrop}>
          <ReactFlow<ServiceNodeType>
            nodes={nodes}
            edges={edges}
            nodeTypes={serviceNodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_e, node) => setSelectedId(node.id)}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background color="#313244" gap={20} size={1} />
            <Controls />
            <MiniMap<ServiceNodeType>
              nodeColor={node =>
                node.data.metrics?.isBroken
                  ? '#f38ba8'
                  : node.data.metrics?.utilization && node.data.metrics.utilization >= 1
                  ? '#fab387'
                  : '#5b6f94'
              }
              maskColor="rgba(20,20,31,0.75)"
            />
          </ReactFlow>
        </div>

        {/* Inspector Sidebar */}
        <aside className="flex min-h-0 flex-col border-t border-[#313244] bg-[#181825] md:border-l md:border-t-0">
          <div className="flex items-center gap-2 border-b border-[#313244] px-3 py-2 text-[11px] font-semibold text-[#cdd6f4]">
            <Sliders size={13} className="text-[#89b4fa]" />
            Node Settings
          </div>
          {selectedNode ? (
            <div className="space-y-3 overflow-auto p-3">
              <div>
                <label className="text-[9px] text-[#9399b2] block mb-1">Service Display Name</label>
                <input
                  type="text"
                  value={selectedNode.data.title}
                  onChange={e => updateSelectedField('title', e.target.value)}
                  className="h-8 w-full rounded border border-[#313244] bg-[#11111b] px-2 text-[11px] font-semibold text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-[9px] text-[#9399b2]">
                  Capacity / replica
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    value={selectedNode.data.capacity}
                    onChange={e => updateSelectedField('capacity', Math.max(1, Number(e.target.value)))}
                    className="h-7 rounded border border-[#313244] bg-[#11111b] px-2 font-mono text-[10px] text-[#cdd6f4]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[9px] text-[#9399b2]">
                  Replicas (Scale)
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={selectedNode.data.replicas}
                    onChange={e => updateSelectedField('replicas', Math.max(1, Number(e.target.value)))}
                    className="h-7 rounded border border-[#313244] bg-[#11111b] px-2 font-mono text-[10px] text-[#cdd6f4]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col gap-1 text-[9px] text-[#9399b2]">
                  Base Latency (ms)
                  <input
                    type="number"
                    min="0"
                    value={selectedNode.data.latency}
                    onChange={e => updateSelectedField('latency', Math.max(0, Number(e.target.value)))}
                    className="h-7 rounded border border-[#313244] bg-[#11111b] px-2 font-mono text-[10px] text-[#cdd6f4]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[9px] text-[#9399b2]">
                  Failure Rate (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={selectedNode.data.errorRate}
                    onChange={e => updateSelectedField('errorRate', Math.max(0, Number(e.target.value)))}
                    className="h-7 rounded border border-[#313244] bg-[#11111b] px-2 font-mono text-[10px] text-[#cdd6f4]"
                  />
                </label>
              </div>

              {/* Node status toggle (simulate node crash) */}
              <div className="border-t border-[#313244] pt-2">
                <label className="flex items-center justify-between text-[10px] text-[#cdd6f4] cursor-pointer">
                  <span>Simulate Node Failure</span>
                  <input
                    type="checkbox"
                    checked={forcedDownNodes.has(selectedNode.id)}
                    onChange={e => {
                      setForcedDownNodes(prev => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(selectedNode.id);
                        else next.delete(selectedNode.id);
                        return next;
                      });
                    }}
                    className="accent-[#f38ba8]"
                  />
                </label>
              </div>

              {selectedNode.data.metrics && (
                <div className="rounded-lg bg-[#11111b] p-2.5 border border-[#313244] text-[9px] space-y-1">
                  <div className="font-semibold text-[#89b4fa] mb-1">Live Telemetry</div>
                  <div className="flex justify-between">
                    <span className="text-[#9399b2]">Current Load:</span>
                    <span className="font-mono text-[#cdd6f4]">
                      {Math.round(selectedNode.data.metrics.requests).toLocaleString()} req/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9399b2]">P95 Latency:</span>
                    <span className="font-mono text-[#cdd6f4]">{selectedNode.data.metrics.p95} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9399b2]">Saturation:</span>
                    <span className="font-mono font-bold text-[#fab387]">
                      {Math.round(selectedNode.data.metrics.utilization * 100)}%
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setNodes(current => current.filter(n => n.id !== selectedNode.id));
                  setEdges(current => current.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
                  setSelectedId('');
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-[#f38ba8]/30 py-1.5 text-[10px] text-[#f38ba8] hover:bg-[#f38ba8]/10"
              >
                <Trash2 size={11} /> Delete Service
              </button>
            </div>
          ) : (
            <div className="p-4 text-[10px] text-[#6c7086] text-center">
              Click a node on the canvas to configure capacity, replicas, latency, or test failure modes.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SystemDesignView() {
  return (
    <ReactFlowProvider>
      <SystemDesignCanvas />
    </ReactFlowProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE DIAGRAM (ERD) VIEW
// Instant In-Place Column Editing, Default Types, Flexible Cardinality & Direction
// ─────────────────────────────────────────────────────────────────────────────

interface DbColumn {
  id: string;
  name: string;
  type: string;
  defaultValue?: string;
  primaryKey: boolean;
  foreignKey: boolean;
  nullable: boolean;
  unique: boolean;
}

interface DbTableData {
  [key: string]: unknown;
  name: string;
  columns: DbColumn[];
  onAddColumn?: (tableId: string) => void;
  onEditColumn?: (tableId: string, col: DbColumn) => void;
}

type DbNode = Node<DbTableData, 'dbTable'>;

const DATA_TYPES = [
  'VARCHAR(255)',
  'TEXT',
  'INTEGER',
  'BIGINT',
  'BOOLEAN',
  'TIMESTAMP',
  'DATE',
  'UUID',
  'DECIMAL(10,2)',
  'JSONB',
  'FLOAT',
];

function DatabaseTableNode({ data, selected }: NodeProps<DbNode>) {
  return (
    <div
      className={`min-w-[230px] overflow-hidden rounded-lg border bg-[#1b1b2a] shadow-xl transition-all ${
        selected ? 'border-[#89b4fa] ring-2 ring-[#89b4fa]/40' : 'border-[#3a3a50]'
      }`}
    >
      {/* Table-level target handle on left */}
      <Handle
        type="target"
        position={Position.Left}
        id="tbl-left-target"
        title={`Connect to ${data.name}`}
        className="!h-3 !w-3 !border-2 !border-[#1b1b2a] !bg-[#89b4fa] -left-1.5 hover:!scale-125 transition-transform cursor-crosshair"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#313244] bg-[#252538] px-3 py-2">
        <div className="flex items-center gap-2">
          <Database size={13} className="text-[#89b4fa]" />
          <span className="text-[11px] font-bold text-[#cdd6f4]">{data.name}</span>
        </div>
        <span className="text-[9px] font-mono text-[#9399b2]">{data.columns.length} cols</span>
      </div>

      {/* Column Rows with specific left target handle and right source handle */}
      <div className="divide-y divide-[#313244]/50">
        {data.columns.map(column => (
          <div
            key={column.id}
            className="group relative flex items-center justify-between gap-1 px-3 py-1.5 text-[9px] hover:bg-[#202035] transition-colors"
          >
            {/* Column Left Handle (Target) */}
            <Handle
              type="target"
              position={Position.Left}
              id={`${column.name}__tgt_l`}
              title={`Connect to ${column.name}`}
              className="!h-2.5 !w-2.5 !border !border-[#1b1b2a] !bg-[#89b4fa] -left-1.5 opacity-70 group-hover:opacity-100 group-hover:!scale-125 transition-all cursor-crosshair"
            />

            <div className="flex items-center gap-1.5 min-w-0">
              {column.primaryKey && (
                <span className="rounded bg-[#f9e2af]/15 px-1 font-mono text-[8px] font-bold text-[#f9e2af]">
                  PK
                </span>
              )}
              {column.foreignKey && (
                <span className="rounded bg-[#89b4fa]/15 px-1 font-mono text-[8px] font-bold text-[#89b4fa]">
                  FK
                </span>
              )}
              <span className="truncate font-medium text-[#cdd6f4]">{column.name}</span>
            </div>
            <div className="flex items-center gap-1 text-[8px] text-[#9399b2] font-mono">
              <span>{column.type}</span>
              {!column.nullable && <span className="text-[#f38ba8]">NN</span>}
            </div>

            {/* Column Right Handle (Source) */}
            <Handle
              type="source"
              position={Position.Right}
              id={`${column.name}__src_r`}
              title={`Drag relationship from ${column.name}`}
              className="!h-2.5 !w-2.5 !border !border-[#1b1b2a] !bg-[#89b4fa] -right-1.5 opacity-70 group-hover:opacity-100 group-hover:!scale-125 transition-all cursor-crosshair"
            />
          </div>
        ))}
      </div>

      {/* Table-level source handle on right */}
      <Handle
        type="source"
        position={Position.Right}
        id="tbl-right-source"
        title={`Drag relationship from ${data.name}`}
        className="!h-3 !w-3 !border-2 !border-[#1b1b2a] !bg-[#89b4fa] -right-1.5 hover:!scale-125 transition-transform cursor-crosshair"
      />
    </div>
  );
}

const dbNodeTypes: NodeTypes = { dbTable: DatabaseTableNode };

const INITIAL_DB_NODES: DbNode[] = [
  {
    id: 'users',
    type: 'dbTable',
    position: { x: 60, y: 80 },
    data: {
      name: 'users',
      columns: [
        { id: 'u1', name: 'id', type: 'BIGINT', primaryKey: true, foreignKey: false, nullable: false, unique: true },
        { id: 'u2', name: 'email', type: 'VARCHAR(255)', primaryKey: false, foreignKey: false, nullable: false, unique: true },
        { id: 'u3', name: 'full_name', type: 'VARCHAR(255)', primaryKey: false, foreignKey: false, nullable: true, unique: false },
        { id: 'u4', name: 'created_at', type: 'TIMESTAMP', defaultValue: 'NOW()', primaryKey: false, foreignKey: false, nullable: false, unique: false },
      ],
    },
  },
  {
    id: 'orders',
    type: 'dbTable',
    position: { x: 440, y: 120 },
    data: {
      name: 'orders',
      columns: [
        { id: 'o1', name: 'id', type: 'UUID', primaryKey: true, foreignKey: false, nullable: false, unique: true },
        { id: 'o2', name: 'user_id', type: 'BIGINT', primaryKey: false, foreignKey: true, nullable: false, unique: false },
        { id: 'o3', name: 'total_amount', type: 'DECIMAL(10,2)', primaryKey: false, foreignKey: false, nullable: false, unique: false },
        { id: 'o4', name: 'status', type: 'VARCHAR(255)', defaultValue: "'pending'", primaryKey: false, foreignKey: false, nullable: false, unique: false },
      ],
    },
  },
];

const INITIAL_DB_EDGES: Edge[] = [
  {
    id: 'rel-users-orders',
    source: 'users',
    target: 'orders',
    sourceHandle: 'id__src_r',
    targetHandle: 'user_id__tgt_l',
    label: '1 : N (id → user_id)',
    data: { cardinality: '1:N', direction: 'forward', fromCol: 'id', toCol: 'user_id' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' },
    style: { stroke: '#89b4fa', strokeWidth: 2 },
    labelStyle: { fill: '#cdd6f4', fontSize: 10, fontWeight: 600 },
  },
];

type SqlDialect = 'postgresql' | 'mysql' | 'sqlite';

function createDdl(tables: DbNode[], edges: Edge[], dialect: SqlDialect) {
  return tables
    .map(table => {
      const q = dialect === 'mysql' ? '`' : '"';
      const cols = table.data.columns.map(c => {
        let line = `  ${q}${c.name}${q} ${c.type}`;
        if (!c.nullable) line += ' NOT NULL';
        if (c.primaryKey) line += ' PRIMARY KEY';
        if (c.unique && !c.primaryKey) line += ' UNIQUE';
        if (c.defaultValue) line += ` DEFAULT ${c.defaultValue}`;
        return line;
      });

      const fks = edges
        .filter(edge => edge.target === table.id)
        .map(edge => {
          const fromTable = tables.find(t => t.id === edge.source);
          const fromCol = edge.data?.fromCol ?? 'id';
          const toCol = edge.data?.toCol ?? `${edge.source}_id`;
          return fromTable
            ? `  FOREIGN KEY (${q}${toCol}${q}) REFERENCES ${q}${fromTable.data.name}${q} (${q}${fromCol}${q}) ON DELETE CASCADE`
            : '';
        })
        .filter(Boolean);

      return `CREATE TABLE ${q}${table.data.name}${q} (\n${[...cols, ...fks].join(',\n')}\n);`;
    })
    .join('\n\n');
}

function DatabaseDiagramView() {
  const [nodes, setNodes, onNodesChange] = useNodesState<DbNode>(INITIAL_DB_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_DB_EDGES);
  const [selectedId, setSelectedId] = useState('users');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'tables' | 'relationships'>('tables');
  const [dialect, setDialect] = useState<SqlDialect>('postgresql');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Column creation / editing state
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [colName, setColName] = useState('new_column');
  const [colType, setColType] = useState('VARCHAR(255)');
  const [colDefault, setColDefault] = useState('');
  const [colPk, setColPk] = useState(false);
  const [colFk, setColFk] = useState(false);
  const [colNullable, setColNullable] = useState(true);
  const [colUnique, setColUnique] = useState(false);

  // Relationship creator state
  const [relSource, setRelSource] = useState('users');
  const [relTarget, setRelTarget] = useState('orders');
  const [relFromCol, setRelFromCol] = useState('id');
  const [relToCol, setRelToCol] = useState('user_id');
  const [relCardinality, setRelCardinality] = useState<'1:N' | '1:1' | 'N:M' | 'N:1'>('1:N');
  const [relDirection, setRelDirection] = useState<'forward' | 'backward' | 'bidirectional' | 'undirected'>('forward');
  const [relAutoMarkFk, setRelAutoMarkFk] = useState(true);

  const [copied, setCopied] = useState(false);
  const selectedTable = nodes.find(node => node.id === selectedId) ?? nodes[0] ?? null;
  const ddl = useMemo(() => createDdl(nodes, edges, dialect), [nodes, edges, dialect]);

  // Synchronize relationship source and target when tables change
  useEffect(() => {
    if (!nodes.length) return;
    // Ensure relSource exists
    if (!nodes.some(n => n.id === relSource)) {
      setRelSource(nodes[0].id);
    }
    // Ensure relTarget exists and preferably different from relSource
    if (!nodes.some(n => n.id === relTarget) || relTarget === relSource) {
      const other = nodes.find(n => n.id !== relSource);
      if (other) setRelTarget(other.id);
    }
  }, [nodes, relSource, relTarget]);

  // When source table changes, update fromCol to its primary key
  const handleSourceTableChange = (sourceId: string) => {
    setRelSource(sourceId);
    const tbl = nodes.find(n => n.id === sourceId);
    if (tbl && tbl.data.columns.length) {
      const pk = tbl.data.columns.find(c => c.primaryKey)?.name || tbl.data.columns[0].name;
      setRelFromCol(pk);
    }
    if (relTarget === sourceId) {
      const other = nodes.find(n => n.id !== sourceId);
      if (other) {
        setRelTarget(other.id);
        const toColName = other.data.columns.find(c => c.foreignKey)?.name || other.data.columns[0]?.name || 'id';
        setRelToCol(toColName);
      }
    }
  };

  // When target table changes, update toCol
  const handleTargetTableChange = (targetId: string) => {
    setRelTarget(targetId);
    const tbl = nodes.find(n => n.id === targetId);
    if (tbl && tbl.data.columns.length) {
      const fk = tbl.data.columns.find(c => c.foreignKey)?.name || tbl.data.columns[0].name;
      setRelToCol(fk);
    }
  };

  // Add Table
  const addTable = () => {
    const tableNum = nodes.length + 1;
    const name = `table_${tableNum}`;
    const id = `tbl_${Date.now()}`;
    const newNode: DbNode = {
      id,
      type: 'dbTable',
      position: { x: 120 + (nodes.length % 3) * 260, y: 80 + Math.floor(nodes.length / 3) * 200 },
      data: {
        name,
        columns: [
          { id: crypto.randomUUID(), name: 'id', type: 'BIGINT', primaryKey: true, foreignKey: false, nullable: false, unique: true },
          { id: crypto.randomUUID(), name: 'name', type: 'VARCHAR(255)', primaryKey: false, foreignKey: false, nullable: false, unique: false },
        ],
      },
    };
    setNodes(current => [...current, newNode]);
    setSelectedId(id);
    setSidebarTab('tables');
    setFeedbackMsg({ text: `✓ Added new table "${name}"`, type: 'success' });
  };

  // Start Editing Column
  const handleStartEditColumn = (col: DbColumn) => {
    setEditingColId(col.id);
    setColName(col.name);
    setColType(col.type);
    setColDefault(col.defaultValue ?? '');
    setColPk(col.primaryKey);
    setColFk(col.foreignKey);
    setColNullable(col.nullable);
    setColUnique(col.unique);
  };

  const handleCancelEdit = () => {
    setEditingColId(null);
    setColName('new_column');
    setColType('VARCHAR(255)');
    setColDefault('');
    setColPk(false);
    setColFk(false);
    setColNullable(true);
    setColUnique(false);
  };

  // Save Column (both New and Edit existing)
  const handleSaveColumn = () => {
    if (!selectedTable || !colName.trim()) return;

    if (editingColId) {
      // Update existing
      setNodes(current =>
        current.map(node => {
          if (node.id !== selectedId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              columns: node.data.columns.map(c =>
                c.id === editingColId
                  ? {
                      ...c,
                      name: colName.trim(),
                      type: colType,
                      defaultValue: colDefault.trim() || undefined,
                      primaryKey: colPk,
                      foreignKey: colFk,
                      nullable: colPk ? false : colNullable,
                      unique: colPk ? true : colUnique,
                    }
                  : c
              ),
            },
          };
        })
      );
      handleCancelEdit();
      setFeedbackMsg({ text: `✓ Column "${colName.trim()}" updated`, type: 'success' });
    } else {
      // Add new
      const newCol: DbColumn = {
        id: crypto.randomUUID(),
        name: colName.trim(),
        type: colType,
        defaultValue: colDefault.trim() || undefined,
        primaryKey: colPk,
        foreignKey: colFk,
        nullable: colPk ? false : colNullable,
        unique: colPk ? true : colUnique,
      };

      setNodes(current =>
        current.map(node => {
          if (node.id !== selectedId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              columns: [...node.data.columns, newCol],
            },
          };
        })
      );
      setColName('new_column');
      setColDefault('');
      setFeedbackMsg({ text: `✓ Column "${newCol.name}" added to ${selectedTable.data.name}`, type: 'success' });
    }
  };

  // Add Relationship from UI
  const handleAddRelationship = () => {
    if (nodes.length < 1) {
      setFeedbackMsg({ text: 'At least 1 table is needed to create a relationship.', type: 'error' });
      return;
    }
    const sourceTable = nodes.find(n => n.id === relSource);
    const targetTable = nodes.find(n => n.id === relTarget);
    if (!sourceTable || !targetTable) {
      setFeedbackMsg({ text: 'Please select valid tables.', type: 'error' });
      return;
    }

    const fromCol = relFromCol || sourceTable.data.columns[0]?.name || 'id';
    const toCol = relToCol || targetTable.data.columns[0]?.name || 'id';

    if (relSource === relTarget && fromCol === toCol) {
      setFeedbackMsg({ text: 'Please choose two different columns or tables to connect.', type: 'error' });
      return;
    }

    const edgeId = `rel-${relSource}-${relTarget}-${Date.now()}`;
    const markerEnd =
      relDirection === 'backward' || relDirection === 'undirected'
        ? undefined
        : { type: MarkerType.ArrowClosed, color: '#89b4fa' };
    const markerStart =
      relDirection === 'backward' || relDirection === 'bidirectional'
        ? { type: MarkerType.ArrowClosed, color: '#89b4fa' }
        : undefined;

    const arrowSymbol =
      relDirection === 'bidirectional' ? '◄──►' : relDirection === 'backward' ? '◄───' : relDirection === 'undirected' ? '────' : '───►';

    const sourceHandle = `${fromCol}__src_r`;
    const targetHandle = `${toCol}__tgt_l`;

    const newEdge: Edge = {
      id: edgeId,
      source: relSource,
      target: relTarget,
      sourceHandle,
      targetHandle,
      label: `${relCardinality} (${fromCol} ${arrowSymbol} ${toCol})`,
      data: {
        cardinality: relCardinality,
        direction: relDirection,
        fromCol,
        toCol,
      },
      markerEnd,
      markerStart,
      style: { stroke: '#89b4fa', strokeWidth: 2 },
      labelStyle: { fill: '#cdd6f4', fontSize: 10, fontWeight: 600 },
    };

    setEdges(current => [...current, newEdge]);
    setSelectedEdgeId(edgeId);

    // Auto mark foreign key on target table column if requested
    if (relAutoMarkFk) {
      setNodes(current =>
        current.map(n => {
          if (n.id !== relTarget) return n;
          return {
            ...n,
            data: {
              ...n.data,
              columns: n.data.columns.map(c => (c.name === toCol ? { ...c, foreignKey: true } : c)),
            },
          };
        })
      );
    }

    setFeedbackMsg({
      text: `✓ Connected ${sourceTable.data.name}.${fromCol} ──(${relCardinality})──► ${targetTable.data.name}.${toCol}`,
      type: 'success',
    });
  };

  // Delete Relationship
  const handleDeleteRelationship = (edgeId: string) => {
    setEdges(current => current.filter(e => e.id !== edgeId));
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
    setFeedbackMsg({ text: 'Deleted relationship.', type: 'success' });
  };

  // Swap / Reverse Relationship Direction
  const handleReverseRelationship = (edge: Edge) => {
    const fromCol = edge.data?.toCol || 'id';
    const toCol = edge.data?.fromCol || 'id';
    const card = edge.data?.cardinality || '1:N';
    const reversedCard = card === '1:N' ? 'N:1' : card === 'N:1' ? '1:N' : card;

    setEdges(current =>
      current.map(e => {
        if (e.id !== edge.id) return e;
        return {
          ...e,
          source: edge.target,
          target: edge.source,
          sourceHandle: `${fromCol}__src_r`,
          targetHandle: `${toCol}__tgt_l`,
          label: `${reversedCard} (${fromCol} ──► ${toCol})`,
          data: {
            ...e.data,
            cardinality: reversedCard,
            fromCol,
            toCol,
          },
        };
      })
    );
    setFeedbackMsg({ text: 'Reversed relationship direction.', type: 'success' });
  };

  // Change Cardinality for existing edge
  const handleChangeCardinality = (edgeId: string, newCard: string) => {
    setEdges(current =>
      current.map(e => {
        if (e.id !== edgeId) return e;
        const fromCol = e.data?.fromCol || 'id';
        const toCol = e.data?.toCol || 'id';
        return {
          ...e,
          label: `${newCard} (${fromCol} ──► ${toCol})`,
          data: { ...e.data, cardinality: newCard },
        };
      })
    );
  };

  // ReactFlow onConnect handler (drag arrow directly between table or column handles)
  const onConnectTables = (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;

    const sourceTable = nodes.find(n => n.id === connection.source);
    const targetTable = nodes.find(n => n.id === connection.target);
    if (!sourceTable || !targetTable) return;

    let fromCol = sourceTable.data.columns.find(c => c.primaryKey)?.name ?? sourceTable.data.columns[0]?.name ?? 'id';
    let toCol = targetTable.data.columns.find(c => c.foreignKey)?.name ?? targetTable.data.columns[0]?.name ?? 'id';

    if (connection.sourceHandle) {
      const colName = connection.sourceHandle.split('__')[0];
      if (sourceTable.data.columns.some(c => c.name === colName)) {
        fromCol = colName;
      }
    }
    if (connection.targetHandle) {
      const colName = connection.targetHandle.split('__')[0];
      if (targetTable.data.columns.some(c => c.name === colName)) {
        toCol = colName;
      }
    }

    const edgeId = `rel-${connection.source}-${connection.target}-${Date.now()}`;
    const newEdge: Edge = {
      ...connection,
      id: edgeId,
      label: `1 : N (${fromCol} ──► ${toCol})`,
      data: { cardinality: '1:N', direction: 'forward', fromCol, toCol },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' },
      style: { stroke: '#89b4fa', strokeWidth: 2 },
      labelStyle: { fill: '#cdd6f4', fontSize: 10, fontWeight: 600 },
    };

    setEdges(current => addEdge(newEdge, current));
    setSelectedEdgeId(edgeId);
    setSidebarTab('relationships');
    setFeedbackMsg({
      text: `✓ Connected ${sourceTable.data.name}.${fromCol} ──► ${targetTable.data.name}.${toCol} (1:N)`,
      type: 'success',
    });
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Visual Canvas */}
      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#313244] bg-[#181825] px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-[#cdd6f4]">Interactive Schema Diagram</span>
            <button
              onClick={addTable}
              className="flex items-center gap-1 rounded border border-[#89b4fa]/30 bg-[#89b4fa]/10 px-2.5 py-1 text-[10px] text-[#89b4fa] hover:bg-[#89b4fa]/20"
            >
              <Plus size={12} /> Add Table
            </button>
            <span className="text-[9px] text-[#6c7086]">
              {nodes.length} tables · {edges.length} relationships
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={dialect}
              onChange={e => setDialect(e.target.value as SqlDialect)}
              className="h-7 rounded border border-[#313244] bg-[#11111b] px-2 text-[10px] text-[#cdd6f4]"
            >
              <option value="postgresql">PostgreSQL DDL</option>
              <option value="mysql">MySQL DDL</option>
              <option value="sqlite">SQLite DDL</option>
            </select>
            <button
              onClick={() => downloadFile(`schema.${dialect}.sql`, ddl, 'text/sql')}
              className="flex items-center gap-1 rounded border border-[#313244] px-2.5 py-1 text-[10px] text-[#cdd6f4] hover:bg-[#252538]"
            >
              <Download size={11} /> Export SQL
            </button>
          </div>
        </div>

        <div className="min-h-[350px] flex-1">
          <ReactFlow<DbNode>
            nodes={nodes}
            edges={edges.map(e =>
              e.id === selectedEdgeId
                ? {
                    ...e,
                    style: { stroke: '#f9e2af', strokeWidth: 3 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#f9e2af' },
                    labelStyle: { fill: '#f9e2af', fontSize: 10, fontWeight: 700 },
                  }
                : e
            )}
            nodeTypes={dbNodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnectTables}
            onNodeClick={(_e, node) => {
              setSelectedId(node.id);
              setSelectedEdgeId(null);
            }}
            onEdgeClick={(_e, edge) => {
              setSelectedEdgeId(edge.id);
              setSidebarTab('relationships');
            }}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background color="#313244" gap={20} size={1} />
            <Controls />
            <MiniMap nodeColor="#596c8d" maskColor="rgba(20,20,31,0.72)" />
          </ReactFlow>
        </div>
      </div>

      {/* Inspector Sidebar with Dual Tabs */}
      <aside className="flex min-h-0 flex-col border-t border-[#313244] bg-[#181825] lg:border-l lg:border-t-0">
        {/* Tab switchers */}
        <div className="flex border-b border-[#313244] bg-[#11111b] p-1 gap-1">
          <button
            onClick={() => setSidebarTab('tables')}
            className={`flex-1 rounded py-1.5 text-[10px] font-semibold transition-all ${
              sidebarTab === 'tables'
                ? 'bg-[#252538] text-[#cdd6f4] shadow-sm'
                : 'text-[#6c7086] hover:text-[#cdd6f4]'
            }`}
          >
            Tables & Columns
          </button>
          <button
            onClick={() => setSidebarTab('relationships')}
            className={`flex-1 rounded py-1.5 text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              sidebarTab === 'relationships'
                ? 'bg-[#252538] text-[#89b4fa] shadow-sm'
                : 'text-[#6c7086] hover:text-[#cdd6f4]'
            }`}
          >
            <GitBranch size={11} /> Relationships ({edges.length})
          </button>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div
            className={`flex items-center justify-between px-3 py-1.5 text-[10px] border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-[#a6e3a1]/10 text-[#a6e3a1] border-[#a6e3a1]/20'
                : 'bg-[#f38ba8]/10 text-[#f38ba8] border-[#f38ba8]/20'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button onClick={() => setFeedbackMsg(null)} className="hover:opacity-75">
              <X size={11} />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-3">
          {/* TAB 1: TABLES & COLUMNS */}
          {sidebarTab === 'tables' && (
            <>
              {/* Table Selector Dropdown */}
              <div>
                <label className="text-[9px] text-[#9399b2] block mb-1">Active Table</label>
                <div className="flex gap-1.5">
                  <select
                    value={selectedId}
                    onChange={e => {
                      setSelectedId(e.target.value);
                      handleCancelEdit();
                    }}
                    className="h-8 flex-1 rounded border border-[#313244] bg-[#11111b] px-2 text-[11px] font-bold text-[#cdd6f4]"
                  >
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.data.name} ({n.data.columns.length} cols)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addTable}
                    title="Add Table"
                    className="flex h-8 items-center justify-center rounded border border-[#89b4fa]/30 bg-[#89b4fa]/10 px-2 text-[#89b4fa] hover:bg-[#89b4fa]/20"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {selectedTable && (
                <>
                  {/* Selected Table Name */}
                  <div>
                    <label className="text-[9px] text-[#9399b2] block mb-1">Rename Table</label>
                    <input
                      type="text"
                      value={selectedTable.data.name}
                      onChange={e =>
                        setNodes(curr =>
                          curr.map(n =>
                            n.id === selectedId ? { ...n, data: { ...n.data, name: e.target.value } } : n
                          )
                        )
                      }
                      className="h-8 w-full rounded border border-[#313244] bg-[#11111b] px-2 text-[11px] font-bold text-[#cdd6f4] outline-none focus:border-[#89b4fa]"
                    />
                  </div>

                  {/* Columns List with In-Place Edit/Delete */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-[#cdd6f4]">
                        Columns ({selectedTable.data.columns.length})
                      </span>
                      <span className="text-[8px] text-[#6c7086]">Click row to edit</span>
                    </div>

                    <div className="space-y-1">
                      {selectedTable.data.columns.map(col => (
                        <div
                          key={col.id}
                          onClick={() => handleStartEditColumn(col)}
                          className={`flex items-center justify-between gap-1 rounded px-2 py-1.5 text-[9px] cursor-pointer transition-all border ${
                            editingColId === col.id
                              ? 'border-[#89b4fa] bg-[#2a2a40]'
                              : 'border-transparent bg-[#202030] hover:border-[#313244]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {col.primaryKey && <span className="text-[#f9e2af] font-bold">PK</span>}
                            {col.foreignKey && <span className="text-[#89b4fa] font-bold">FK</span>}
                            <span className="font-medium text-[#cdd6f4] truncate">{col.name}</span>
                            <span className="text-[#6c7086]">({col.type})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleStartEditColumn(col);
                              }}
                              title="Edit column"
                              className="text-[#9399b2] hover:text-[#89b4fa]"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setNodes(curr =>
                                  curr.map(n =>
                                    n.id === selectedId
                                      ? { ...n, data: { ...n.data, columns: n.data.columns.filter(c => c.id !== col.id) } }
                                      : n
                                  )
                                );
                                if (editingColId === col.id) handleCancelEdit();
                              }}
                              title="Delete column"
                              className="text-[#6c7086] hover:text-[#f38ba8]"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column Edit / Add Form */}
                  <div className="rounded-lg border border-[#313244] bg-[#14141f] p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-[#89b4fa]">
                      <span>{editingColId ? 'Edit Column' : 'Add New Column'}</span>
                      {editingColId && (
                        <button onClick={handleCancelEdit} className="text-[#9399b2] hover:text-[#cdd6f4]">
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] text-[#9399b2] block mb-0.5">Column Name</label>
                        <input
                          type="text"
                          value={colName}
                          onChange={e => setColName(e.target.value)}
                          className="h-7 w-full rounded border border-[#313244] bg-[#11111b] px-2 text-[9px] text-[#cdd6f4] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] text-[#9399b2] block mb-0.5">Data Type</label>
                        <select
                          value={colType}
                          onChange={e => setColType(e.target.value)}
                          className="h-7 w-full rounded border border-[#313244] bg-[#11111b] px-1 text-[9px] text-[#cdd6f4]"
                        >
                          {DATA_TYPES.map(t => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] text-[#9399b2] block mb-0.5">Default Value (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. NOW(), 'active', 0"
                        value={colDefault}
                        onChange={e => setColDefault(e.target.value)}
                        className="h-7 w-full rounded border border-[#313244] bg-[#11111b] px-2 text-[9px] text-[#cdd6f4] outline-none"
                      />
                    </div>

                    {/* Constraints Checkboxes */}
                    <div className="grid grid-cols-3 gap-1 pt-1 text-[8px] text-[#cdd6f4]">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={colPk} onChange={e => setColPk(e.target.checked)} className="accent-[#f9e2af]" />
                        <span>Primary (PK)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={colFk} onChange={e => setColFk(e.target.checked)} className="accent-[#89b4fa]" />
                        <span>Foreign (FK)</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={colUnique} onChange={e => setColUnique(e.target.checked)} className="accent-[#a6e3a1]" />
                        <span>Unique</span>
                      </label>
                    </div>

                    <button
                      onClick={handleSaveColumn}
                      className="flex w-full items-center justify-center gap-1 rounded bg-[#89b4fa] py-1.5 text-[9px] font-bold text-[#11111b] hover:bg-[#89b4fa]/90"
                    >
                      {editingColId ? 'Save Column Changes' : 'Add Column to Table'}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setRelSource(selectedTable.id);
                      const other = nodes.find(n => n.id !== selectedTable.id);
                      if (other) setRelTarget(other.id);
                      setSidebarTab('relationships');
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded border border-[#89b4fa]/30 bg-[#89b4fa]/10 py-1.5 text-[9px] font-semibold text-[#89b4fa] hover:bg-[#89b4fa]/20"
                  >
                    <Cable size={11} /> Create Relationship for "{selectedTable.data.name}"
                  </button>

                  {/* Delete Table button */}
                  <button
                    onClick={() => {
                      if (nodes.length <= 1) {
                        setFeedbackMsg({ text: 'Cannot delete the only table in schema.', type: 'error' });
                        return;
                      }
                      setNodes(curr => curr.filter(n => n.id !== selectedId));
                      setEdges(curr => curr.filter(e => e.source !== selectedId && e.target !== selectedId));
                      setSelectedId(nodes.find(n => n.id !== selectedId)?.id || '');
                    }}
                    className="flex w-full items-center justify-center gap-1 rounded border border-[#f38ba8]/25 py-1 text-[9px] text-[#f38ba8] hover:bg-[#f38ba8]/10"
                  >
                    <Trash2 size={10} /> Delete Table "{selectedTable.data.name}"
                  </button>
                </>
              )}
            </>
          )}

          {/* TAB 2: RELATIONSHIPS */}
          {sidebarTab === 'relationships' && (
            <>
              {/* Relationship Creator Form */}
              <div className="rounded-xl border border-[#313244] bg-[#14141f] p-3 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#cdd6f4]">
                  <Cable size={13} className="text-[#89b4fa]" />
                  Create Relationship
                </div>

                <div className="grid grid-cols-2 gap-2 text-[8px] text-[#9399b2]">
                  <div>
                    <label className="block mb-0.5">Source Table (From)</label>
                    <select
                      value={relSource}
                      onChange={e => handleSourceTableChange(e.target.value)}
                      className="h-7 w-full rounded border border-[#313244] bg-[#181825] px-1 text-[9px] text-[#cdd6f4]"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>
                          {n.data.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-0.5">Target Table (To)</label>
                    <select
                      value={relTarget}
                      onChange={e => handleTargetTableChange(e.target.value)}
                      className="h-7 w-full rounded border border-[#313244] bg-[#181825] px-1 text-[9px] text-[#cdd6f4]"
                    >
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>
                          {n.data.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[8px] text-[#9399b2]">
                  <div>
                    <label className="block mb-0.5">Source Column (PK/Key)</label>
                    <select
                      value={relFromCol}
                      onChange={e => setRelFromCol(e.target.value)}
                      className="h-7 w-full rounded border border-[#313244] bg-[#181825] px-1 text-[9px] text-[#cdd6f4]"
                    >
                      {(nodes.find(n => n.id === relSource)?.data.columns ?? []).map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.primaryKey ? '(PK)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-0.5">Target Column (FK)</label>
                    <select
                      value={relToCol}
                      onChange={e => setRelToCol(e.target.value)}
                      className="h-7 w-full rounded border border-[#313244] bg-[#181825] px-1 text-[9px] text-[#cdd6f4]"
                    >
                      {(nodes.find(n => n.id === relTarget)?.data.columns ?? []).map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.foreignKey ? '(FK)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[8px] text-[#9399b2]">
                  <div>
                    <label className="block mb-0.5">Cardinality</label>
                    <select
                      value={relCardinality}
                      onChange={e => setRelCardinality(e.target.value as any)}
                      className="h-7 w-full rounded border border-[#313244] bg-[#181825] px-1 text-[9px] text-[#cdd6f4]"
                    >
                      <option value="1:N">One to Many (1 : N)</option>
                      <option value="1:1">One to One (1 : 1)</option>
                      <option value="N:1">Many to One (N : 1)</option>
                      <option value="N:M">Many to Many (N : M)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-0.5">Direction</label>
                    <select
                      value={relDirection}
                      onChange={e => setRelDirection(e.target.value as any)}
                      className="h-7 w-full rounded border border-[#313244] bg-[#181825] px-1 text-[9px] text-[#cdd6f4]"
                    >
                      <option value="forward">Forward (→)</option>
                      <option value="backward">Reverse (←)</option>
                      <option value="bidirectional">Bidirectional (↔)</option>
                      <option value="undirected">Undirected (—)</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-1.5 text-[8px] text-[#cdd6f4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={relAutoMarkFk}
                    onChange={e => setRelAutoMarkFk(e.target.checked)}
                    className="accent-[#89b4fa]"
                  />
                  <span>Auto-mark target column as Foreign Key (FK)</span>
                </label>

                <button
                  onClick={handleAddRelationship}
                  disabled={nodes.length < 1 || (relSource === relTarget && relFromCol === relToCol)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#89b4fa] py-2 text-[10px] font-bold text-[#11111b] hover:bg-[#89b4fa]/90 active:scale-[0.99] disabled:opacity-40"
                >
                  <Cable size={12} /> Connect Tables & Create Relation
                </button>
              </div>

              {/* Active Relationships List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-semibold text-[#cdd6f4]">
                  <span>Active Relationships ({edges.length})</span>
                  <span className="text-[8px] text-[#6c7086]">Click card to highlight</span>
                </div>

                {edges.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#313244] p-3 text-center text-[9px] text-[#6c7086]">
                    No relationships created yet. Fill the form above or drag between column dots on the diagram.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {edges.map(edge => {
                      const srcNode = nodes.find(n => n.id === edge.source);
                      const tgtNode = nodes.find(n => n.id === edge.target);
                      const isSelected = selectedEdgeId === edge.id;
                      const fromCol = String(edge.data?.fromCol || 'id');
                      const toCol = String(edge.data?.toCol || 'id');
                      const card = String(edge.data?.cardinality || '1:N');

                      return (
                        <div
                          key={edge.id}
                          onClick={() => setSelectedEdgeId(edge.id)}
                          className={`flex flex-col gap-1.5 rounded-lg border p-2 text-[9px] transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#f9e2af] bg-[#f9e2af]/10 text-[#cdd6f4]'
                              : 'border-[#313244] bg-[#14141f] text-[#9399b2] hover:border-[#45475a]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#cdd6f4]">
                              <span className="font-bold text-[#89b4fa]">{srcNode?.data.name || edge.source}.{fromCol}</span>
                              <span className="rounded bg-[#89b4fa]/20 px-1 text-[8px] text-[#89b4fa] font-sans font-semibold">
                                {card}
                              </span>
                              <span>──►</span>
                              <span className="font-bold text-[#a6e3a1]">{tgtNode?.data.name || edge.target}.{toCol}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleReverseRelationship(edge);
                                }}
                                title="Swap / Reverse direction"
                                className="rounded p-1 text-[#9399b2] hover:bg-[#313244] hover:text-[#cdd6f4]"
                              >
                                <ArrowLeftRight size={11} />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteRelationship(edge.id);
                                }}
                                title="Delete relationship"
                                className="rounded p-1 text-[#6c7086] hover:bg-[#f38ba8]/15 hover:text-[#f38ba8]"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[8px] text-[#6c7086]">
                            <span>Change Cardinality:</span>
                            <div className="flex gap-1">
                              {(['1:N', '1:1', 'N:1', 'N:M'] as const).map(c => (
                                <button
                                  key={c}
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleChangeCardinality(edge.id, c);
                                  }}
                                  className={`rounded px-1.5 py-0.5 text-[8px] ${
                                    card === c
                                      ? 'bg-[#89b4fa] text-[#11111b] font-bold'
                                      : 'bg-[#202030] text-[#9399b2] hover:text-[#cdd6f4]'
                                  }`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Live SQL Output */}
        <section className="flex max-h-48 min-h-32 flex-col border-t border-[#313244]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#313244] bg-[#181825] px-3 py-1.5">
            <span className="text-[10px] font-semibold text-[#cdd6f4]">{dialect.toUpperCase()} DDL</span>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(ddl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              title="Copy SQL"
              className="rounded border border-[#313244] p-1 text-[#9399b2] hover:text-[#cdd6f4]"
            >
              {copied ? <CheckCircle2 size={11} className="text-[#a6e3a1]" /> : <Copy size={11} />}
            </button>
          </div>
          <textarea
            readOnly
            value={ddl}
            className="min-h-0 flex-1 resize-none bg-[#11111b] px-3 py-2 font-mono text-[9px] leading-4 text-[#a6e3a1] outline-none"
          />
        </section>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ARCHITECTURE LAB COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ArchitectureLabView() {
  const [mode, setMode] = useState<LabMode>('mermaid');

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      {/* Top Header / Mode Switcher */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#313244] bg-[#181825] px-3 sm:px-4 py-1.5 sm:py-2">
        <div>
          <h1 className="text-xs sm:text-sm font-bold text-[#cdd6f4]">Architecture Lab</h1>
          <p className="mt-0.5 text-[9px] sm:text-[10px] text-[#6c7086] hidden sm:block">
            Mermaid diagram studio, system design traffic simulator, and database ERD modeler.
          </p>
        </div>

        <div className="flex gap-1 rounded-md border border-[#313244] bg-[#11111b] p-0.5 overflow-x-auto no-scrollbar max-w-full" role="tablist">
          {(
            [
              ['mermaid', 'Mermaid Studio', <Workflow size={12} key="m" />],
              ['system', 'System Design Simulator', <Network size={12} key="s" />],
              ['database', 'Database ERD', <Database size={12} key="d" />],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              role="tab"
              aria-selected={mode === id}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-medium transition-all ${
                mode === id
                  ? 'bg-[#313244] text-[#cdd6f4] shadow-sm'
                  : 'text-[#6c7086] hover:text-[#cdd6f4]'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Views */}
      {mode === 'mermaid' ? (
        <MermaidView />
      ) : mode === 'system' ? (
        <SystemDesignView />
      ) : (
        <DatabaseDiagramView />
      )}
    </section>
  );
}