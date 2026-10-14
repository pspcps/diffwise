import { useMemo, useRef, useState, type DragEvent } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Boxes, Cable, Cloud, Copy, Database, Download, GitBranch, Layers3, Network, Play, Plus, Server, Trash2, Users, Workflow } from 'lucide-react';
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

function MermaidView() {
  const [source, setSource] = useState('flowchart LR\n  User([User]) --> Edge[CDN / WAF]\n  Edge --> API[API service]\n  API --> Cache[(Cache)]\n  API --> DB[(Database)]');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [nodeColor, setNodeColor] = useState('#26324b');
  const [borderColor, setBorderColor] = useState('#89b4fa');
  const [lineColor, setLineColor] = useState('#a6adc8');

  const renderDiagram = async () => {
    setBusy(true);
    setError('');
    try {
      const module = await import('mermaid');
      const mermaid = module.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: { primaryColor: nodeColor, primaryTextColor: '#f2f4f8', primaryBorderColor: borderColor, lineColor, secondaryColor: '#263238', tertiaryColor: '#1e293b' },
        flowchart: { htmlLabels: false },
      });
      const result = await mermaid.render(`architecture-${Date.now()}`, source);
      setSvg(result.svg);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not render this Mermaid diagram.');
    } finally {
      setBusy(false);
    }
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
      context.scale(2, 2);
      context.drawImage(image, 0, 0, width, height);
      const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG export failed.')), 'image/png'));
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
    <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)]">
      <div className="flex min-h-0 flex-col border-b border-[#313244] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-2 text-[11px] text-[#9399b2]"><span>Mermaid source</span><span>Flowchart syntax · bracket matching enabled</span></div>
        <div className="min-h-0 flex-1">
          <MonacoEditor height="100%" language="devbench-mermaid" theme="vs-dark" value={source} onChange={value => setSource(value ?? '')}
            onMount={(_editor, monaco) => {
              if (!mermaidLanguageRegistered) {
                monaco.languages.register({ id: 'devbench-mermaid' });
                monaco.languages.setLanguageConfiguration('devbench-mermaid', {
                  brackets: [['(', ')'], ['[', ']'], ['{', '}']],
                  autoClosingPairs: [{ open: '(', close: ')' }, { open: '[', close: ']' }, { open: '{', close: '}' }, { open: '"', close: '"' }],
                });
                monaco.languages.setMonarchTokensProvider('devbench-mermaid', {
                  tokenizer: { root: [
                    [/%%.*/, 'comment'],
                    [/\b(flowchart|graph|subgraph|end|direction|classDef|class|style|linkStyle|click)\b/, 'keyword'],
                    [/\b(TB|TD|BT|RL|LR)\b/, 'type'],
                    [/(<-->|-->|---|-.->|==>|--o|--x|---o|---x)/, 'operator'],
                    [/\[|\]|\(|\)|\{|\}/, 'delimiter.bracket'],
                    [/"[^"\n]*"/, 'string'],
                    [/[A-Za-z_][\w-]*/, 'identifier'],
                    [/\d+/, 'number'],
                  ] },
                });
                monaco.editor.defineTheme('devbench-mermaid-dark', {
                  base: 'vs-dark', inherit: true,
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
                    'editorBracketHighlight.foreground1': '#89b4fa',
                    'editorBracketHighlight.foreground2': '#a6e3a1',
                    'editorBracketHighlight.foreground3': '#f9e2af',
                    'editorBracketHighlight.foreground4': '#f38ba8',
                    'editorBracketHighlight.foreground5': '#cba6f7',
                    'editorBracketHighlight.foreground6': '#94e2d5',
                  },
                });
                monaco.editor.setTheme('devbench-mermaid-dark');
                mermaidLanguageRegistered = true;
              }
            }}
            options={{ automaticLayout: true, minimap: { enabled: false }, folding: true, showFoldingControls: 'always', bracketPairColorization: { enabled: true }, matchBrackets: 'always', lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on', fontSize: 12, padding: { top: 10, bottom: 10 }, tabSize: 2 }} />
        </div>
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#313244] px-4 py-2">
          <span className="text-[11px] text-[#9399b2]">Diagram preview</span>
          <div className="flex flex-wrap gap-1.5">
            {([['Nodes', nodeColor, setNodeColor], ['Borders', borderColor, setBorderColor], ['Lines', lineColor, setLineColor]] as const).map(([label, color, setColor]) => <label key={label} title={`${label} ${color}`} className="flex items-center gap-1 rounded border border-[#313244] px-1.5 py-1 text-[9px] text-[#9399b2]"><input type="color" value={color} onChange={event => setColor(event.target.value)} aria-label={`${label} color`} className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0" /><code>{color}</code></label>)}
            <button onClick={() => void renderDiagram()} disabled={busy || !source.trim()} className="flex items-center gap-1.5 rounded border border-[#89b4fa]/30 bg-[#89b4fa]/10 px-2.5 py-1.5 text-[10px] text-[#89b4fa] disabled:opacity-40"><Workflow size={12} />{busy ? 'Rendering' : 'Render'}</button>
            <button onClick={() => downloadFile('architecture-diagram.mmd', source, 'text/plain')} className="rounded border border-[#313244] px-2.5 py-1.5 text-[10px] text-[#cdd6f4]">Source</button>
            <button onClick={() => downloadFile('architecture-diagram.svg', svg, 'image/svg+xml')} disabled={!svg} className="rounded border border-[#313244] px-2.5 py-1.5 text-[10px] text-[#cdd6f4] disabled:opacity-40">SVG</button>
            <button onClick={() => void exportPng()} disabled={!svg} className="rounded border border-[#313244] px-2.5 py-1.5 text-[10px] text-[#cdd6f4] disabled:opacity-40">PNG</button>
          </div>
        </div>
        {error && <p role="alert" className="shrink-0 border-b border-[#313244] px-4 py-2 text-[11px] text-[#f38ba8]">{error}</p>}
        <div className="min-h-0 flex-1 overflow-auto bg-[#15151f] p-4">
          {svg ? <div className="min-h-full min-w-full [&_svg]:mx-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
            : <div className="flex h-full items-center justify-center text-center text-xs text-[#585b70]">Render the source to preview your diagram.</div>}
        </div>
      </div>
    </div>
  );
}

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
}
interface ServiceCatalogItem {
  title: string;
  provider: string;
  kind: string;
  icon: 'user' | 'network' | 'compute' | 'database' | 'queue' | 'storage' | 'cache';
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
}
type ServiceNodeType = Node<ServiceData, 'service'>;

const ICONS = { user: Users, network: Network, compute: Server, database: Database, queue: Cable, storage: Boxes, cache: Layers3 };

function ServiceNode({ data, selected }: NodeProps<ServiceNodeType>) {
  const Icon = ICONS[data.icon];
  const providerColor = data.provider === 'AWS' ? '#f6ad55' : data.provider === 'GCP' ? '#8bb8ff' : data.provider === 'Azure' ? '#6cbcff' : '#a6e3a1';
  return <div className={`min-w-[190px] rounded-md border bg-[#1b1b2a] shadow-lg ${selected ? 'border-[#89b4fa]' : 'border-[#3a3a50]'}`}>
    <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-[#1b1b2a] !bg-[#89b4fa]" />
    <div className="flex items-center gap-2 border-b border-[#313244] px-3 py-2"><Icon size={15} className="shrink-0 text-[#89b4fa]" /><div className="min-w-0 flex-1"><div className="truncate text-[11px] font-semibold text-[#cdd6f4]">{data.title}</div><div className="text-[9px] text-[#6c7086]">{data.kind}</div></div><span className="rounded border px-1.5 py-0.5 text-[8px] font-semibold" style={{ color: providerColor, borderColor: `${providerColor}55`, backgroundColor: `${providerColor}12` }}>{data.provider === 'Azure' ? 'AZURE' : data.provider.toUpperCase()}</span></div>
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 text-[9px] text-[#9399b2]"><span>Capacity</span><span className="text-right font-mono">{data.capacity * data.replicas}/s</span><span>Replicas</span><span className="text-right font-mono">{data.replicas}</span>
      {data.metrics && <><span className="border-t border-[#313244] pt-1 text-[#cdd6f4]">Traffic</span><span className="border-t border-[#313244] pt-1 text-right font-mono text-[#cdd6f4]">{Math.round(data.metrics.requests)}/s</span><span>Utilization</span><span className={`text-right font-mono ${data.metrics.utilization >= 1 ? 'text-[#f38ba8]' : data.metrics.utilization > 0.8 ? 'text-[#f9e2af]' : 'text-[#a6e3a1]'}`}>{Math.round(data.metrics.utilization * 100)}%</span><span>CPU est.</span><span className="text-right font-mono">{data.metrics.cpuCores.toFixed(1)}/{data.metrics.cpuCapacity} cores</span><span>RAM est.</span><span className="text-right font-mono">{data.metrics.memoryGb} GB</span>{data.metrics.queueDepth > 0 && <><span>Queued est.</span><span className="text-right font-mono text-[#f9e2af]">{Math.round(data.metrics.queueDepth)}</span></>}<span>P95 est.</span><span className="text-right font-mono">{Math.round(data.metrics.p95)} ms</span></>}
    </div>
    <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-[#1b1b2a] !bg-[#89b4fa]" />
  </div>;
}

const serviceNodeTypes: NodeTypes = { service: ServiceNode };
const SERVICE_CATALOG: ServiceCatalogItem[] = [
  { title: 'Traffic source', provider: 'Generic', kind: 'Ingress', icon: 'user', capacity: 5000, replicas: 1, latency: 1, errorRate: 0 },
  { title: 'Load balancer', provider: 'Generic', kind: 'Network', icon: 'network', capacity: 5000, replicas: 2, latency: 3, errorRate: 0.01 },
  { title: 'API gateway', provider: 'AWS', kind: 'API Gateway', icon: 'network', capacity: 2500, replicas: 2, latency: 8, errorRate: 0.02 },
  { title: 'Compute service', provider: 'AWS', kind: 'EC2 / ECS', icon: 'compute', capacity: 800, replicas: 2, latency: 24, errorRate: 0.02 },
  { title: 'Serverless function', provider: 'AWS', kind: 'Lambda', icon: 'compute', capacity: 400, replicas: 4, latency: 38, errorRate: 0.02 },
  { title: 'Object storage', provider: 'AWS', kind: 'S3', icon: 'storage', capacity: 3000, replicas: 1, latency: 35, errorRate: 0.005 },
  { title: 'Relational database', provider: 'AWS', kind: 'RDS', icon: 'database', capacity: 600, replicas: 1, latency: 16, errorRate: 0.01 },
  { title: 'Message queue', provider: 'AWS', kind: 'SQS', icon: 'queue', capacity: 3000, replicas: 1, latency: 12, errorRate: 0.005 },
  { title: 'Container service', provider: 'GCP', kind: 'Cloud Run', icon: 'compute', capacity: 700, replicas: 3, latency: 25, errorRate: 0.02 },
  { title: 'Managed database', provider: 'GCP', kind: 'Cloud SQL', icon: 'database', capacity: 550, replicas: 1, latency: 18, errorRate: 0.01 },
  { title: 'Event bus', provider: 'GCP', kind: 'Pub/Sub', icon: 'queue', capacity: 4000, replicas: 1, latency: 10, errorRate: 0.005 },
  { title: 'Function app', provider: 'Azure', kind: 'Functions', icon: 'compute', capacity: 450, replicas: 3, latency: 42, errorRate: 0.02 },
  { title: 'Managed NoSQL', provider: 'Azure', kind: 'Cosmos DB', icon: 'database', capacity: 900, replicas: 1, latency: 12, errorRate: 0.01 },
  { title: 'Distributed cache', provider: 'Generic', kind: 'Cache', icon: 'cache', capacity: 3000, replicas: 2, latency: 2, errorRate: 0.005 },
  { title: 'Elastic load balancer', provider: 'AWS', kind: 'ALB / NLB', icon: 'network', capacity: 6000, replicas: 2, latency: 4, errorRate: 0.005 },
  { title: 'Key-value database', provider: 'AWS', kind: 'DynamoDB', icon: 'database', capacity: 4500, replicas: 1, latency: 8, errorRate: 0.005 },
  { title: 'Streaming service', provider: 'AWS', kind: 'Kinesis', icon: 'queue', capacity: 3500, replicas: 2, latency: 14, errorRate: 0.01 },
  { title: 'Content delivery', provider: 'AWS', kind: 'CloudFront', icon: 'network', capacity: 10000, replicas: 1, latency: 8, errorRate: 0.002 },
  { title: 'Kubernetes cluster', provider: 'AWS', kind: 'EKS', icon: 'compute', capacity: 1600, replicas: 4, latency: 20, errorRate: 0.015 },
  { title: 'In-memory cache', provider: 'AWS', kind: 'ElastiCache', icon: 'cache', capacity: 5000, replicas: 2, latency: 2, errorRate: 0.005 },
  { title: 'Managed Kubernetes', provider: 'GCP', kind: 'GKE', icon: 'compute', capacity: 1500, replicas: 4, latency: 22, errorRate: 0.015 },
  { title: 'Object storage', provider: 'GCP', kind: 'Cloud Storage', icon: 'storage', capacity: 2800, replicas: 1, latency: 34, errorRate: 0.005 },
  { title: 'Big data warehouse', provider: 'GCP', kind: 'BigQuery', icon: 'database', capacity: 900, replicas: 2, latency: 120, errorRate: 0.01 },
  { title: 'Managed Kubernetes', provider: 'Azure', kind: 'AKS', icon: 'compute', capacity: 1500, replicas: 4, latency: 23, errorRate: 0.015 },
  { title: 'Object storage', provider: 'Azure', kind: 'Blob Storage', icon: 'storage', capacity: 2800, replicas: 1, latency: 34, errorRate: 0.005 },
  { title: 'Message broker', provider: 'Azure', kind: 'Service Bus', icon: 'queue', capacity: 2800, replicas: 2, latency: 15, errorRate: 0.01 },
  { title: 'Identity provider', provider: 'Generic', kind: 'Identity / OIDC', icon: 'user', capacity: 1100, replicas: 2, latency: 35, errorRate: 0.01 },
  { title: 'Search cluster', provider: 'Generic', kind: 'Search', icon: 'database', capacity: 700, replicas: 3, latency: 28, errorRate: 0.02 },
  { title: 'Observability', provider: 'Generic', kind: 'Metrics / Logs', icon: 'storage', capacity: 5000, replicas: 2, latency: 12, errorRate: 0.01 },
];

function createServiceData(service: ServiceCatalogItem): ServiceData {
  return {
    ...service,
    cpuMsPerRequest: service.cpuMsPerRequest ?? (service.icon === 'database' ? 5 : service.icon === 'storage' ? 1 : 3),
    cpuCoresPerReplica: service.cpuCoresPerReplica ?? (service.icon === 'database' ? 2 : service.icon === 'compute' ? 1 : 0.5),
    memoryGbPerReplica: service.memoryGbPerReplica ?? (service.icon === 'database' ? 4 : service.icon === 'compute' ? 2 : 1),
  };
}

const INITIAL_SERVICE_NODES: ServiceNodeType[] = [
  { id: 'traffic', type: 'service', position: { x: 40, y: 160 }, data: createServiceData(SERVICE_CATALOG[0]) },
  { id: 'gateway', type: 'service', position: { x: 330, y: 160 }, data: createServiceData(SERVICE_CATALOG[2]) },
  { id: 'compute', type: 'service', position: { x: 620, y: 160 }, data: createServiceData(SERVICE_CATALOG[3]) },
  { id: 'database', type: 'service', position: { x: 920, y: 90 }, data: createServiceData(SERVICE_CATALOG[6]) },
  { id: 'cache', type: 'service', position: { x: 920, y: 270 }, data: createServiceData(SERVICE_CATALOG[13]) },
];
const INITIAL_SERVICE_EDGES: Edge[] = [
  { id: 'traffic-gateway', source: 'traffic', target: 'gateway', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' } },
  { id: 'gateway-compute', source: 'gateway', target: 'compute', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' } },
  { id: 'compute-db', source: 'compute', target: 'database', markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' } },
  { id: 'compute-cache', source: 'compute', target: 'cache', markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' } },
];

function SystemDesignCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ServiceNodeType>(INITIAL_SERVICE_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_SERVICE_EDGES);
  const [selectedId, setSelectedId] = useState('compute');
  const [ingressRps, setIngressRps] = useState(1200);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [results, setResults] = useState<Record<string, ServiceMetrics> | null>(null);
  const [simulationNote, setSimulationNote] = useState('');
  const flow = useReactFlow<ServiceNodeType, Edge>();
  const selectedNode = nodes.find(node => node.id === selectedId) ?? null;

  const updateSelected = (field: keyof Pick<ServiceData, 'capacity' | 'replicas' | 'latency' | 'errorRate' | 'cpuMsPerRequest' | 'cpuCoresPerReplica' | 'memoryGbPerReplica'>, value: number) => {
    setNodes(current => current.map(node => node.id === selectedId ? { ...node, data: { ...node.data, [field]: value } } : node));
    setResults(null);
  };

  const addCatalogService = (service: ServiceCatalogItem) => {
    const id = `${service.kind.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomUUID().slice(0, 6)}`;
    const nodeIndex = nodes.length;
    const newNode: ServiceNodeType = { id, type: 'service', position: { x: 260 + (nodeIndex % 4) * 70, y: 100 + Math.floor(nodeIndex / 4) * 100 }, data: createServiceData(service) };
    setNodes(current => [...current, newNode]);
    setSelectedId(id);
    setResults(null);
  };

  const onConnect = (connection: Connection) => {
    setEdges(current => addEdge({ ...connection, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' } }, current));
    setResults(null);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const index = Number(event.dataTransfer.getData('application/devbench-service'));
    const service = SERVICE_CATALOG[index];
    if (!service) return;
    const position = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNode: ServiceNodeType = { id: `${service.kind}-${crypto.randomUUID().slice(0, 6)}`, type: 'service', position, data: createServiceData(service) };
    setNodes(current => [...current, newNode]);
    setSelectedId(newNode.id);
    setResults(null);
  };

  const runSimulation = () => {
    const incoming = new Map(nodes.map(node => [node.id, 0]));
    const outgoing = new Map(nodes.map(node => [node.id, [] as string[]]));
    const indegree = new Map(nodes.map(node => [node.id, 0]));
    edges.forEach(edge => {
      outgoing.get(edge.source)?.push(edge.target);
      indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    });
    const roots = nodes.filter(node => indegree.get(node.id) === 0);
    if (!roots.length) {
      setSimulationNote('No entry point found. Add an unconnected traffic source to start the flow.');
      return;
    }
    const trafficRoots = roots.filter(node => node.data.icon === 'user');
    const entryNodes = trafficRoots.length ? trafficRoots : roots;
    entryNodes.forEach(node => incoming.set(node.id, ingressRps / entryNodes.length));
    const queue = [...entryNodes.map(node => node.id)];
    const remainingIndegree = new Map(indegree);
    const visited = new Set<string>();
    const metrics: Record<string, ServiceMetrics> = {};

    while (queue.length) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodes.find(item => item.id === id);
      if (!node) continue;

      const requests = incoming.get(id) ?? 0;
      const requestCapacity = Math.max(1, node.data.capacity * node.data.replicas);
      const cpuMsPerRequest = node.data.cpuMsPerRequest ?? 3;
      const cpuCoresPerReplica = node.data.cpuCoresPerReplica ?? 0.5;
      const memoryGbPerReplica = node.data.memoryGbPerReplica ?? 1;
      const cpuCores = requests * cpuMsPerRequest / 1000;
      const cpuCapacity = node.data.replicas * cpuCoresPerReplica;
      const cpuRequestCapacity = cpuMsPerRequest > 0 ? cpuCapacity * 1000 / cpuMsPerRequest : Number.POSITIVE_INFINITY;
      const effectiveCapacity = Math.min(requestCapacity, cpuRequestCapacity);
      const utilization = Math.max(requests / requestCapacity, cpuCapacity ? cpuCores / cpuCapacity : 0);
      const overload = Math.max(0, requests - effectiveCapacity);
      const queueDelay = utilization < 1 ? utilization ** 2 * 4 : Math.min(1000, 30 + utilization * 180);
      const queueDepth = node.data.icon === 'queue' ? overload * durationSeconds : 0;
      const failedRequests = requests * node.data.errorRate / 100 + overload;
      metrics[id] = {
        requests, utilization, p95: node.data.latency + queueDelay, overload,
        cpuCores, cpuCapacity, memoryGb: node.data.replicas * memoryGbPerReplica, queueDepth, failedRequests,
      };

      const forwarded = Math.max(0, requests - overload);
      const downstream = outgoing.get(id) ?? [];
      if (!downstream.length) continue;
      const share = forwarded / downstream.length;
      downstream.forEach(target => {
        incoming.set(target, (incoming.get(target) ?? 0) + share);
        const remaining = (remainingIndegree.get(target) ?? 0) - 1;
        remainingIndegree.set(target, remaining);
        if (remaining === 0 && !visited.has(target)) queue.push(target);
      });
    }

    const cyclic = nodes.some(node => !visited.has(node.id));
    setResults(metrics);
    setNodes(current => current.map(node => ({ ...node, data: { ...node.data, metrics: metrics[node.id] } })));
    const bottlenecks = Object.values(metrics).filter(metric => metric.utilization >= 1).length;
    setSimulationNote(`${ingressRps.toLocaleString()} requests/sec for ${durationSeconds}s; ${bottlenecks} saturated services${cyclic ? ' · cycle detected, flow estimate may be incomplete' : ''}. CPU, RAM, queue depth, and latency are estimates, not cloud performance guarantees.`);
  };

  const clearMetrics = () => {
    setResults(null);
    setNodes(current => current.map(node => ({ ...node, data: { ...node.data, metrics: undefined } })));
    setSimulationNote('');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#313244] bg-[#181825] px-3 py-2">
        <label className="flex items-center gap-2 text-[10px] text-[#9399b2]">Ingress req/s<input type="number" min="1" value={ingressRps} onChange={event => setIngressRps(Math.max(1, Number(event.target.value)))} className="h-7 w-24 rounded border border-[#313244] bg-[#11111b] px-2 font-mono text-[#cdd6f4]" /></label>
        <label className="flex items-center gap-2 text-[10px] text-[#9399b2]">Duration s<input type="number" min="1" value={durationSeconds} onChange={event => setDurationSeconds(Math.max(1, Number(event.target.value)))} className="h-7 w-16 rounded border border-[#313244] bg-[#11111b] px-2 font-mono text-[#cdd6f4]" /></label>
        <button onClick={runSimulation} className="ml-auto flex items-center gap-1.5 rounded border border-[#a6e3a1]/30 bg-[#a6e3a1]/10 px-3 py-1.5 text-[10px] text-[#a6e3a1]"><Play size={12} />Run estimate</button>
        <button onClick={clearMetrics} className="rounded border border-[#313244] px-2.5 py-1.5 text-[10px] text-[#9399b2]">Clear</button>
      </div>
      {simulationNote && <div className="shrink-0 border-b border-[#313244] px-3 py-1.5 text-[10px] text-[#9399b2]">{simulationNote}</div>}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)_230px]">
        <aside className="flex min-h-0 flex-col border-b border-[#313244] bg-[#181825] md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold text-[#cdd6f4]"><Cloud size={13} className="text-[#89b4fa]" />Service palette</div>
          <div className="min-h-0 flex-1 overflow-auto px-2 pb-2">
            {(['AWS', 'GCP', 'Azure', 'Generic'] as const).map(provider => <section key={provider} className="mb-3">
              <h3 className="sticky top-0 z-10 bg-[#181825] px-2 py-1.5 text-[9px] font-semibold uppercase text-[#89b4fa]">{provider} services</h3>
              {SERVICE_CATALOG.map((service, index) => ({ service, index })).filter(({ service }) => service.provider === provider).map(({ service, index }) => {
                const Icon = ICONS[service.icon];
                const providerColor = provider === 'AWS' ? '#f6ad55' : provider === 'GCP' ? '#8bb8ff' : provider === 'Azure' ? '#6cbcff' : '#a6e3a1';
                return <button key={`${service.provider}-${service.kind}`} draggable onDragStart={event => event.dataTransfer.setData('application/devbench-service', String(index))} onClick={() => addCatalogService(service)} className="mb-1 flex w-full items-center gap-2 rounded border border-transparent px-2.5 py-2 text-left hover:border-[#313244] hover:bg-[#202030]">
                  <Icon size={13} className="shrink-0 text-[#89b4fa]" /><span className="min-w-0 flex-1"><span className="block truncate text-[10px] text-[#cdd6f4]">{service.title}</span><span className="block text-[9px] text-[#6c7086]">{service.kind}</span></span><span className="rounded border px-1 text-[8px] font-semibold" style={{ color: providerColor, borderColor: `${providerColor}55` }}>{provider === 'Azure' ? 'AZ' : provider}</span>
                </button>;
              })}
            </section>)}
          </div>
        </aside>
        <div className="min-h-[320px]" onDragOver={event => event.preventDefault()} onDrop={onDrop}>
          <ReactFlow<ServiceNodeType> nodes={nodes} edges={edges} nodeTypes={serviceNodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_event, node) => setSelectedId(node.id)} fitView deleteKeyCode={['Backspace', 'Delete']}>
            <Background color="#39394b" gap={20} size={1} /><Controls /><MiniMap<ServiceNodeType> nodeColor={node => node.data.metrics?.utilization && node.data.metrics.utilization >= 1 ? '#f38ba8' : '#5b6f94'} maskColor="rgba(20,20,31,0.72)" />
          </ReactFlow>
        </div>
        <aside className="flex min-h-0 flex-col border-t border-[#313244] bg-[#181825] md:border-l md:border-t-0">
          <div className="border-b border-[#313244] px-3 py-2 text-[11px] font-semibold text-[#cdd6f4]">Service settings</div>
          {selectedNode ? <div className="space-y-3 overflow-auto p-3">
            <div className="text-xs font-medium text-[#89b4fa]">{selectedNode.data.title}</div>
            {([
              ['capacity', 'Capacity / replica', 1, 100000],
              ['replicas', 'Replicas', 1, 1000],
              ['latency', 'Base latency (ms)', 0, 60000],
              ['errorRate', 'Failure rate (%)', 0, 100],
              ['cpuMsPerRequest', 'CPU ms / request', 0, 100000],
              ['cpuCoresPerReplica', 'CPU cores / replica', 0.1, 256],
              ['memoryGbPerReplica', 'RAM GB / replica', 0.1, 4096],
            ] as const).map(([field, label, min, max]) => <label key={field} className="flex flex-col gap-1 text-[10px] text-[#9399b2]">{label}<input type="number" min={min} max={max} step={field === 'errorRate' ? 0.1 : 1} value={selectedNode.data[field]} onChange={event => updateSelected(field, Math.min(max, Math.max(min, Number(event.target.value))))} className="h-8 rounded border border-[#313244] bg-[#11111b] px-2 font-mono text-[#cdd6f4]" /></label>)}
            {results?.[selectedNode.id] && <div className="border-t border-[#313244] pt-2 text-[10px] leading-5 text-[#9399b2]"><div>Flow: {Math.round(results[selectedNode.id].requests)} req/s</div><div>Over capacity: {Math.round(results[selectedNode.id].overload)} req/s</div><div>CPU estimate: {results[selectedNode.id].cpuCores.toFixed(1)} / {results[selectedNode.id].cpuCapacity} cores</div><div>RAM estimate: {results[selectedNode.id].memoryGb} GB</div><div>Failed req/s: {Math.round(results[selectedNode.id].failedRequests)}</div>{results[selectedNode.id].queueDepth > 0 && <div>Queue backlog: {Math.round(results[selectedNode.id].queueDepth)} messages</div>}</div>}
            <button onClick={() => { setNodes(current => current.filter(node => node.id !== selectedNode.id)); setEdges(current => current.filter(edge => edge.source !== selectedNode.id && edge.target !== selectedNode.id)); setSelectedId(''); setResults(null); }} className="flex items-center gap-1.5 rounded border border-[#f38ba8]/25 px-2.5 py-1.5 text-[10px] text-[#f38ba8]"><Trash2 size={11} />Delete service</button>
          </div> : <p className="p-3 text-[10px] text-[#6c7086]">Select a service node to edit capacity, replicas, latency, and configured failure rate.</p>}
        </aside>
      </div>
    </div>
  );
}

function SystemDesignView() {
  return <ReactFlowProvider><SystemDesignCanvas /></ReactFlowProvider>;
}

interface DbColumn { id: string; name: string; type: string; primaryKey: boolean; nullable: boolean; }
interface DbTableData { [key: string]: unknown; name: string; columns: DbColumn[]; }
type DbNode = Node<DbTableData, 'dbTable'>;

function DatabaseTableNode({ data, selected }: NodeProps<DbNode>) {
  return <div className={`min-w-[200px] overflow-hidden rounded-md border bg-[#1b1b2a] shadow-lg ${selected ? 'border-[#89b4fa]' : 'border-[#3a3a50]'}`}>
    <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-[#1b1b2a] !bg-[#89b4fa]" />
    <div className="flex items-center gap-2 border-b border-[#313244] bg-[#252538] px-3 py-2"><Database size={13} className="text-[#89b4fa]" /><span className="text-[11px] font-semibold text-[#cdd6f4]">{data.name}</span></div>
    <div>{data.columns.map(column => <div key={column.id} className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-1 border-b border-[#313244]/60 px-3 py-1.5 text-[9px]"><span className="text-[#f9e2af]">{column.primaryKey ? 'PK' : column.name.endsWith('_id') ? 'FK' : ''}</span><span className="truncate text-[#cdd6f4]">{column.name}</span><span className="text-[#9399b2]">{column.type}{column.nullable ? '' : ' · NN'}</span></div>)}</div>
    <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-[#1b1b2a] !bg-[#89b4fa]" />
  </div>;
}

const dbNodeTypes: NodeTypes = { dbTable: DatabaseTableNode };
const INITIAL_DB_NODES: DbNode[] = [
  { id: 'users', type: 'dbTable', position: { x: 80, y: 90 }, data: { name: 'users', columns: [{ id: 'u1', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false }, { id: 'u2', name: 'email', type: 'VARCHAR(255)', primaryKey: false, nullable: false }, { id: 'u3', name: 'created_at', type: 'TIMESTAMP', primaryKey: false, nullable: false }] } },
  { id: 'orders', type: 'dbTable', position: { x: 440, y: 150 }, data: { name: 'orders', columns: [{ id: 'o1', name: 'id', type: 'INTEGER', primaryKey: true, nullable: false }, { id: 'o2', name: 'user_id', type: 'INTEGER', primaryKey: false, nullable: false }, { id: 'o3', name: 'total', type: 'DECIMAL(10,2)', primaryKey: false, nullable: false }] } },
];
const INITIAL_DB_EDGES: Edge[] = [{ id: 'users-orders', source: 'users', target: 'orders', label: 'id → user_id', data: { fromColumn: 'id', toColumn: 'user_id' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' }, style: { stroke: '#89b4fa' }, labelStyle: { fill: '#cdd6f4', fontSize: 10 } }];
type SqlDialect = 'postgresql' | 'mysql' | 'sqlite';

function quoteSqlIdentifier(value: string, dialect: SqlDialect) {
  const quote = dialect === 'mysql' ? '`' : '"';
  return `${quote}${value.replaceAll(quote, `${quote}${quote}`)}${quote}`;
}

function createDdl(tables: DbNode[], edges: Edge[], dialect: SqlDialect) {
  return tables.map(table => {
    const qTable = quoteSqlIdentifier(table.data.name, dialect);
    const columns = table.data.columns.map(column => `  ${quoteSqlIdentifier(column.name, dialect)} ${column.type}${column.nullable ? '' : ' NOT NULL'}${column.primaryKey ? ' PRIMARY KEY' : ''}`);
    const references = edges.filter(edge => edge.target === table.id).map(edge => {
      const fromColumn = String(edge.data?.fromColumn ?? 'id');
      const toColumn = String(edge.data?.toColumn ?? `${edge.source}_id`);
      const fromTable = tables.find(item => item.id === edge.source);
      return fromTable ? `  FOREIGN KEY (${quoteSqlIdentifier(toColumn, dialect)}) REFERENCES ${quoteSqlIdentifier(fromTable.data.name, dialect)} (${quoteSqlIdentifier(fromColumn, dialect)})` : '';
    }).filter(Boolean);
    return `CREATE TABLE ${qTable} (\n${[...columns, ...references].join(',\n')}\n);`;
  }).join('\n\n');
}

function DatabaseDiagramView() {
  const [nodes, setNodes, onNodesChange] = useNodesState<DbNode>(INITIAL_DB_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_DB_EDGES);
  const [selectedId, setSelectedId] = useState('users');
  const [dialect, setDialect] = useState<SqlDialect>('postgresql');
  const [newTableName, setNewTableName] = useState('new_table');
  const [newColumnName, setNewColumnName] = useState('new_column');
  const [newColumnType, setNewColumnType] = useState('VARCHAR(255)');
  const [referenceSource, setReferenceSource] = useState('users');
  const [referenceTarget, setReferenceTarget] = useState('orders');
  const [referenceFromColumn, setReferenceFromColumn] = useState('id');
  const [referenceToColumn, setReferenceToColumn] = useState('user_id');
  const [copied, setCopied] = useState(false);
    const diagramRef = useRef<HTMLDivElement>(null);
  const selectedTable = nodes.find(node => node.id === selectedId) ?? null;
  const ddl = useMemo(() => createDdl(nodes, edges, dialect), [nodes, edges, dialect]);

  const addTable = () => {
    const id = `${newTableName.toLowerCase().replace(/[^a-z0-9_]+/g, '_')}_${crypto.randomUUID().slice(0, 5)}`;
    const index = nodes.length;
    const node: DbNode = { id, type: 'dbTable', position: { x: 120 + (index % 3) * 280, y: 80 + Math.floor(index / 3) * 220 }, data: { name: newTableName || 'new_table', columns: [{ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', primaryKey: true, nullable: false }] } };
    setNodes(current => [...current, node]);
    setSelectedId(id);
    setNewTableName('new_table');
  };

  const addColumn = () => {
    if (!selectedTable || !newColumnName.trim()) return;
    setNodes(current => current.map(node => node.id === selectedId ? { ...node, data: { ...node.data, columns: [...node.data.columns, { id: crypto.randomUUID(), name: newColumnName.trim(), type: newColumnType.trim() || 'TEXT', primaryKey: false, nullable: true }] } } : node));
    setNewColumnName('new_column');
  };

  const addReference = () => {
    const source = nodes.find(node => node.id === referenceSource);
    const target = nodes.find(node => node.id === referenceTarget);
    if (!source || !target || source.id === target.id) return;
    const id = `ref-${crypto.randomUUID().slice(0, 8)}`;
    setEdges(current => [...current, { id, source: source.id, target: target.id, label: `${referenceFromColumn} → ${referenceToColumn}`, data: { fromColumn: referenceFromColumn, toColumn: referenceToColumn }, markerEnd: { type: MarkerType.ArrowClosed, color: '#89b4fa' }, style: { stroke: '#89b4fa' }, labelStyle: { fill: '#cdd6f4', fontSize: 10 } }]);
  };

  const exportDiagram = async (format: 'png' | 'svg') => {
    if (!diagramRef.current) return;
    try {
      const { toPng, toSvg } = await import('html-to-image');
      const image = format === 'png'
        ? await toPng(diagramRef.current, { pixelRatio: 2, backgroundColor: '#1e1e2e' })
        : await toSvg(diagramRef.current, { backgroundColor: '#1e1e2e' });
      downloadFile(`database-schema.${format}`, image, format === 'png' ? 'image/png' : 'image/svg+xml');
    } catch {
      setCopied(false);
    }
  };

  const copyDdl = async () => {
    try {
      await navigator.clipboard.writeText(ddl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const tablesById = new Map(nodes.map(node => [node.id, node]));

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#313244] px-3 py-2">
          <span className="text-[11px] font-semibold text-[#cdd6f4]">Schema diagram</span>
          <button onClick={() => setNodes(current => [...current, { id: `table-${crypto.randomUUID().slice(0, 5)}`, type: 'dbTable', position: { x: 180, y: 150 }, data: { name: 'new_table', columns: [{ id: crypto.randomUUID(), name: 'id', type: 'INTEGER', primaryKey: true, nullable: false }] } }])} className="ml-auto flex items-center gap-1 rounded border border-[#313244] px-2 py-1 text-[10px] text-[#cdd6f4]"><Plus size={11} />Add table</button>
          <select value={dialect} onChange={event => setDialect(event.target.value as SqlDialect)} aria-label="DDL database dialect" className="h-7 rounded border border-[#313244] bg-[#11111b] px-2 text-[10px] text-[#cdd6f4]"><option value="postgresql">PostgreSQL</option><option value="mysql">MySQL</option><option value="sqlite">SQLite</option></select>
          <button onClick={() => void exportDiagram('png')} className="rounded border border-[#313244] px-2 py-1 text-[10px] text-[#cdd6f4]">PNG</button>
          <button onClick={() => void exportDiagram('svg')} className="rounded border border-[#313244] px-2 py-1 text-[10px] text-[#cdd6f4]">SVG</button>
          <button onClick={() => downloadFile(`schema.${dialect === 'postgresql' ? 'postgres' : dialect}.sql`, ddl, 'text/sql')} className="flex items-center gap-1 rounded border border-[#89b4fa]/30 px-2 py-1 text-[10px] text-[#89b4fa]"><Download size={11} />DDL</button>
        </div>
        <div className="min-h-[320px] flex-1">
          <ReactFlow<DbNode> ref={diagramRef} nodes={nodes} edges={edges} nodeTypes={dbNodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={(_event, node) => setSelectedId(node.id)} fitView deleteKeyCode={['Backspace', 'Delete']}>
            <Background color="#39394b" gap={20} size={1} /><Controls /><MiniMap nodeColor="#596c8d" maskColor="rgba(20,20,31,0.72)" />
          </ReactFlow>
        </div>
      </div>
      <aside className="flex min-h-0 flex-col border-t border-[#313244] bg-[#181825] lg:border-l lg:border-t-0">
        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-3">
          <section className="space-y-2"><h3 className="text-[11px] font-semibold text-[#cdd6f4]">Add table</h3><div className="flex gap-1.5"><input value={newTableName} onChange={event => setNewTableName(event.target.value)} aria-label="New table name" className="h-8 min-w-0 flex-1 rounded border border-[#313244] bg-[#11111b] px-2 text-[10px] text-[#cdd6f4]" /><button onClick={addTable} className="rounded border border-[#313244] px-2 text-[#89b4fa]"><Plus size={13} /></button></div></section>
          <section className="space-y-2 border-t border-[#313244] pt-3"><h3 className="text-[11px] font-semibold text-[#cdd6f4]">Selected table</h3>{selectedTable ? <>
            <input value={selectedTable.data.name} onChange={event => setNodes(current => current.map(node => node.id === selectedId ? { ...node, data: { ...node.data, name: event.target.value } } : node))} aria-label="Selected table name" className="h-8 w-full rounded border border-[#313244] bg-[#11111b] px-2 text-[10px] text-[#cdd6f4]" />
            <div className="space-y-1">{selectedTable.data.columns.map(column => <div key={column.id} className="flex items-center justify-between gap-2 rounded bg-[#202030] px-2 py-1.5 text-[9px]"><span className="truncate text-[#cdd6f4]">{column.name}</span><span className="text-[#9399b2]">{column.type}{column.primaryKey ? ' · PK' : ''}</span><button onClick={() => setNodes(current => current.map(node => node.id === selectedId ? { ...node, data: { ...node.data, columns: node.data.columns.filter(item => item.id !== column.id) } } : node))} title="Delete column" className="text-[#6c7086] hover:text-[#f38ba8]"><Trash2 size={10} /></button></div>)}</div>
            <div className="grid grid-cols-[1fr_0.8fr_auto] gap-1"><input value={newColumnName} onChange={event => setNewColumnName(event.target.value)} aria-label="New column name" className="h-7 min-w-0 rounded border border-[#313244] bg-[#11111b] px-1.5 text-[9px] text-[#cdd6f4]" /><input value={newColumnType} onChange={event => setNewColumnType(event.target.value)} aria-label="New column type" className="h-7 min-w-0 rounded border border-[#313244] bg-[#11111b] px-1.5 text-[9px] text-[#cdd6f4]" /><button onClick={addColumn} title="Add column" className="rounded border border-[#313244] px-1.5 text-[#89b4fa]"><Plus size={12} /></button></div>
          </> : <p className="text-[10px] text-[#6c7086]">Select a table node to edit it.</p>}</section>
          <section className="space-y-2 border-t border-[#313244] pt-3"><h3 className="flex items-center gap-1.5 text-[11px] font-semibold text-[#cdd6f4]"><GitBranch size={12} className="text-[#89b4fa]" />Add relationship</h3>
            <label className="block text-[9px] text-[#6c7086]">Referenced table<select value={referenceSource} onChange={event => { setReferenceSource(event.target.value); const table = tablesById.get(event.target.value); setReferenceFromColumn(table?.data.columns.find(column => column.primaryKey)?.name ?? table?.data.columns[0]?.name ?? 'id'); }} className="mt-1 h-7 w-full rounded border border-[#313244] bg-[#11111b] px-1.5 text-[10px] text-[#cdd6f4]">{nodes.map(node => <option key={node.id} value={node.id}>{node.data.name}</option>)}</select></label>
            <label className="block text-[9px] text-[#6c7086]">Primary column<select value={referenceFromColumn} onChange={event => setReferenceFromColumn(event.target.value)} className="mt-1 h-7 w-full rounded border border-[#313244] bg-[#11111b] px-1.5 text-[10px] text-[#cdd6f4]">{(tablesById.get(referenceSource)?.data.columns ?? []).map(column => <option key={column.id} value={column.name}>{column.name}</option>)}</select></label>
            <label className="block text-[9px] text-[#6c7086]">Foreign-key table<select value={referenceTarget} onChange={event => { setReferenceTarget(event.target.value); const table = tablesById.get(event.target.value); setReferenceToColumn(table?.data.columns.find(column => column.name.endsWith('_id'))?.name ?? table?.data.columns[0]?.name ?? 'id'); }} className="mt-1 h-7 w-full rounded border border-[#313244] bg-[#11111b] px-1.5 text-[10px] text-[#cdd6f4]">{nodes.map(node => <option key={node.id} value={node.id}>{node.data.name}</option>)}</select></label>
            <label className="block text-[9px] text-[#6c7086]">Foreign-key column<select value={referenceToColumn} onChange={event => setReferenceToColumn(event.target.value)} className="mt-1 h-7 w-full rounded border border-[#313244] bg-[#11111b] px-1.5 text-[10px] text-[#cdd6f4]">{(tablesById.get(referenceTarget)?.data.columns ?? []).map(column => <option key={column.id} value={column.name}>{column.name}</option>)}</select></label>
            <button onClick={addReference} disabled={referenceSource === referenceTarget} className="flex w-full items-center justify-center gap-1.5 rounded border border-[#313244] px-2 py-1.5 text-[10px] text-[#89b4fa] disabled:opacity-40"><Cable size={11} />Map columns</button>
          </section>
        </div>
        <section className="flex max-h-[38%] min-h-36 flex-col border-t border-[#313244]">
          <div className="flex shrink-0 items-center justify-between px-3 py-2"><span className="text-[10px] font-semibold text-[#cdd6f4]">{dialect.toUpperCase()} DDL</span><button onClick={() => void copyDdl()} title={copied ? 'Copied' : 'Copy DDL'} aria-label="Copy DDL" className="rounded border border-[#313244] p-1 text-[#9399b2]"><Copy size={11} /></button></div>
          <textarea readOnly value={ddl} aria-label="Generated database DDL" className="min-h-0 flex-1 resize-none bg-[#11111b] px-3 py-2 font-mono text-[9px] leading-4 text-[#a6e3a1] outline-none" />
        </section>
      </aside>
    </div>
  );
}

export default function ArchitectureLabView() {
  const [mode, setMode] = useState<LabMode>('mermaid');
  return (
    <section className="flex h-full min-h-0 flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-2">
        <div><h1 className="text-sm font-semibold">Architecture Lab</h1><p className="mt-0.5 text-[10px] text-[#6c7086]">Diagram, connect, and estimate service flows.</p></div>
        <div className="flex gap-1 rounded-md border border-[#313244] p-0.5" role="tablist" aria-label="Architecture tool">
          {([['mermaid', 'Mermaid', <Workflow size={12} />], ['system', 'System design', <Network size={12} />], ['database', 'Database diagram', <Database size={12} />]] as const).map(([id, label, icon]) => <button key={id} onClick={() => setMode(id)} role="tab" aria-selected={mode === id} className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[10px] ${mode === id ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086] hover:text-[#cdd6f4]'}`}>{icon}{label}</button>)}
        </div>
      </header>
      {mode === 'mermaid' ? <MermaidView /> : mode === 'system' ? <SystemDesignView /> : <DatabaseDiagramView />}
    </section>
  );
}