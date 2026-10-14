import { Fragment, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { ArrowLeftRight, Braces, Check, ChevronRight, ChevronsUpDown, Copy, Download, GitBranch, ListFilter, Minus, Network, Plus, RotateCcw, Table2 } from 'lucide-react';
import { jsonToXml, parseXml } from '../../utils/jsonXml';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type Row = Record<string, string>;
type JsonView = 'editor' | 'table' | 'tree' | 'graph' | 'xml';

function isRecord(value: JsonValue): value is { [key: string]: JsonValue } {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function flatten(value: JsonValue, prefix = '', result: Row = {}) {
  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (!entries.length && prefix) result[prefix] = '{}';
    for (const [key, child] of entries) flatten(child, prefix ? `${prefix}.${key}` : key, result);
  } else if (Array.isArray(value)) {
    if (!value.length && prefix) result[prefix] = '[]';
    value.forEach((child, index) => flatten(child, prefix ? `${prefix}[${index}]` : `[${index}]`, result));
  } else if (prefix) {
    result[prefix] = value === null ? 'null' : String(value);
  }
  return result;
}

function findNestedContainers(value: JsonValue, path = ''): { path: string; value: JsonValue }[] {
  if (Array.isArray(value)) return [{ path: path || 'items', value }];
  if (!isRecord(value)) return [];
  return Object.entries(value)
    .filter(([, child]) => Array.isArray(child) || isRecord(child))
    .map(([key, child]) => ({ path: path ? `${path}.${key}` : key, value: child }));
}

function childEntries(value: JsonValue): [string, JsonValue][] {
  if (Array.isArray(value)) return value.map((child, index) => [`[${index}]`, child]);
  if (isRecord(value)) return Object.entries(value);
  return [];
}

function collectExpandablePaths(value: JsonValue, path = '$', result: string[] = []) {
  if (Array.isArray(value) || isRecord(value)) {
    result.push(path);
    childEntries(value).forEach(([key, child]) => {
      const childPath = Array.isArray(value) ? `${path}${key}` : `${path}.${key}`;
      collectExpandablePaths(child, childPath, result);
    });
  }
  return result;
}

function JsonTreeNode({
  value, label, path, depth, expandedPaths, onToggle,
}: {
  value: JsonValue;
  label: string;
  path: string;
  depth: number;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
}) {
  const entries = childEntries(value);
  const isContainer = Array.isArray(value) || isRecord(value);
  const expanded = expandedPaths.has(path);
  const summary = Array.isArray(value)
    ? `${value.length} ${value.length === 1 ? 'item' : 'items'}`
    : isRecord(value) ? `${entries.length} ${entries.length === 1 ? 'property' : 'properties'}` : '';
  const primitive = typeof value === 'string' ? JSON.stringify(value) : String(value);

  return (
    <div>
      <div className="flex min-h-7 items-center gap-1.5 font-mono text-[11px]" style={{ paddingLeft: depth * 16 }}>
        {isContainer ? <button onClick={() => onToggle(path)} aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${label}`}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#9399b2] hover:bg-[#313244] hover:text-[#cdd6f4]"><ChevronRight size={13} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} /></button> : <span className="w-5 shrink-0" />}
        <span className="text-[#89b4fa]">{label}</span>
        <span className="text-[#585b70]">:</span>
        {isContainer ? <span className="rounded bg-[#313244] px-1.5 py-0.5 text-[10px] text-[#f9e2af]">{Array.isArray(value) ? 'Array' : 'Object'} · {summary}</span>
          : <span className={`${typeof value === 'string' ? 'text-[#a6e3a1]' : value === null ? 'text-[#f38ba8]' : 'text-[#fab387]'}`}>{primitive}</span>}
      </div>
      {isContainer && expanded && entries.length > 0 && <div className="border-l border-[#45475a]/60" style={{ marginLeft: depth * 16 + 10 }}>
        {entries.map(([key, child]) => {
          const childPath = Array.isArray(value) ? `${path}${key}` : `${path}.${key}`;
          return <JsonTreeNode key={childPath} value={child} label={key} path={childPath} depth={depth + 1} expandedPaths={expandedPaths} onToggle={onToggle} />;
        })}
      </div>}
    </div>
  );
}

type GraphNode = { id: string; label: string; summary: string; depth: number; y: number; expandable: boolean; expanded: boolean };
type GraphEdge = { parentId: string; childId: string };

function makeGraph(value: JsonValue, expandedPaths: Set<string>) {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  let nextLeaf = 0;
  let maxDepth = 0;

  const visit = (nodeValue: JsonValue, label: string, id: string, depth: number, parentId?: string): number => {
    const entries = childEntries(nodeValue);
    const expanded = entries.length > 0 && expandedPaths.has(id);
    maxDepth = Math.max(maxDepth, depth);
    const node: GraphNode = {
      id, label,
      summary: Array.isArray(nodeValue) ? `Array · ${nodeValue.length} items`
        : isRecord(nodeValue) ? `Object · ${entries.length} properties`
          : typeof nodeValue === 'string' ? JSON.stringify(nodeValue) : String(nodeValue),
      depth, y: 0, expandable: entries.length > 0, expanded,
    };
    nodes.push(node);
    if (parentId) edges.push({ parentId, childId: id });

    if (!expanded) {
      node.y = nextLeaf++ * 88 + 42;
      return node.y;
    }
    const childYs = entries.map(([key, child]) => {
      const childId = Array.isArray(nodeValue) ? `${id}${key}` : `${id}.${key}`;
      return visit(child, key, childId, depth + 1, id);
    });
    node.y = childYs.reduce((sum, y) => sum + y, 0) / childYs.length;
    return node.y;
  };

  visit(value, 'root', '$', 0);
  return { nodes, edges, width: (maxDepth + 1) * 230 + 30, height: Math.max(nextLeaf * 88 + 84, 150) };
}

function JsonGraph({ value }: { value: JsonValue }) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(['$']));
  const graph = useMemo(() => makeGraph(value, expandedPaths), [value, expandedPaths]);
  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const nodeWidth = 184;
  const nodeHeight = 56;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 16, y: 16 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const panStartRef = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchDistanceRef = useRef<number | null>(null);

  const clampZoom = (next: number) => Math.max(0.25, Math.min(3, next));
  const zoomBy = (amount: number) => setZoom(current => clampZoom(current + amount));
  const distanceBetween = (first: { x: number; y: number }, second: { x: number; y: number }) =>
    Math.hypot(first.x - second.x, first.y - second.y);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size === 1) {
      panStartRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    } else if (pointersRef.current.size === 2) {
      const [first, second] = [...pointersRef.current.values()];
      pinchDistanceRef.current = distanceBetween(first, second);
      panStartRef.current = null;
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2) {
      const [first, second] = [...pointersRef.current.values()];
      const distance = distanceBetween(first, second);
      if (pinchDistanceRef.current && distance > 0) {
        const ratio = distance / pinchDistanceRef.current;
        setZoom(current => clampZoom(current * ratio));
      }
      pinchDistanceRef.current = distance;
      return;
    }
    const start = panStartRef.current;
    if (start?.pointerId === event.pointerId) {
      setPan({ x: start.panX + event.clientX - start.x, y: start.panY + event.clientY - start.y });
    }
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    pinchDistanceRef.current = null;
    const remaining = [...pointersRef.current.entries()][0];
    panStartRef.current = remaining
      ? { pointerId: remaining[0], x: remaining[1].x, y: remaining[1].y, panX: pan.x, panY: pan.y }
      : null;
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom(current => clampZoom(current * Math.exp(-event.deltaY * 0.001)));
  };

  const resetGraph = () => {
    setZoom(1);
    setPan({ x: 16, y: 16 });
  };

  const toggleNode = (id: string) => setExpandedPaths(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const expandAll = () => setExpandedPaths(new Set(collectExpandablePaths(value)));
  const collapseAll = () => setExpandedPaths(new Set());

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-2 text-[10px] text-[#6c7086]">
        <span>Drag to pan · Scroll or pinch to zoom</span>
        <div className="flex items-center gap-1">
          <button onClick={expandAll} title="Expand all graph nodes" className="rounded border border-[#313244] px-2 py-1 text-[#cdd6f4] hover:bg-[#313244]">Expand all</button>
          <button onClick={collapseAll} title="Collapse all graph nodes" className="rounded border border-[#313244] px-2 py-1 text-[#cdd6f4] hover:bg-[#313244]">Collapse all</button>
          <button onClick={() => zoomBy(-0.15)} title="Zoom out" aria-label="Zoom out" className="flex h-7 w-7 items-center justify-center rounded border border-[#313244] text-[#cdd6f4] hover:bg-[#313244]"><Minus size={13} /></button>
          <span className="w-11 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button onClick={() => zoomBy(0.15)} title="Zoom in" aria-label="Zoom in" className="flex h-7 w-7 items-center justify-center rounded border border-[#313244] text-[#cdd6f4] hover:bg-[#313244]"><Plus size={13} /></button>
          <button onClick={resetGraph} title="Reset graph view" aria-label="Reset graph view" className="flex h-7 w-7 items-center justify-center rounded border border-[#313244] text-[#cdd6f4] hover:bg-[#313244]"><RotateCcw size={12} /></button>
        </div>
      </div>
      <div ref={viewportRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} onWheel={handleWheel}
        className="min-h-0 flex-1 touch-none select-none overflow-hidden overscroll-contain cursor-grab active:cursor-grabbing">
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'top left', width: graph.width, height: graph.height }}>
          <svg role="img" aria-label="JSON parent-child relationship graph" width={graph.width} height={graph.height} viewBox={`0 0 ${graph.width} ${graph.height}`} className="max-w-none">
            {graph.edges.map(edge => {
              const parent = nodeById.get(edge.parentId);
              const child = nodeById.get(edge.childId);
              if (!parent || !child) return null;
              const x1 = parent.depth * 230 + 24 + nodeWidth;
              const x2 = child.depth * 230 + 24;
              return <path key={`${edge.parentId}->${edge.childId}`} d={`M ${x1} ${parent.y} C ${x1 + 32} ${parent.y}, ${x2 - 32} ${child.y}, ${x2} ${child.y}`} fill="none" stroke="#45475a" strokeWidth="1.5" />;
            })}
            {graph.nodes.map(node => {
              const x = node.depth * 230 + 24;
              const y = node.y - nodeHeight / 2;
              return <g key={node.id} role={node.expandable ? 'button' : undefined} tabIndex={node.expandable ? 0 : undefined}
                aria-expanded={node.expandable ? node.expanded : undefined}
                onPointerDown={event => { if (node.expandable) event.stopPropagation(); }}
                onClick={event => { if (node.expandable) { event.stopPropagation(); toggleNode(node.id); } }}
                onKeyDown={event => { if (node.expandable && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toggleNode(node.id); } }}
                style={node.expandable ? { cursor: 'pointer' } : undefined}>
                <title>{`${node.label}: ${node.summary}`}</title>
                <rect x={x} y={y} width={nodeWidth} height={nodeHeight} rx="5" fill="#1a1a2c" stroke={node.depth === 0 ? '#89b4fa' : '#45475a'} />
                <text x={x + 10} y={y + 22} fill="#89b4fa" fontSize="12" fontFamily="monospace">{node.label.length > 23 ? `${node.label.slice(0, 20)}...` : node.label}</text>
                <text x={x + 10} y={y + 41} fill="#9399b2" fontSize="10" fontFamily="monospace">{node.summary.length > 20 ? `${node.summary.slice(0, 17)}...` : node.summary}</text>
                {node.expandable && <g pointerEvents="none"><rect x={x + nodeWidth - 24} y={y + 18} width="16" height="16" rx="3" fill="#313244" /><text x={x + nodeWidth - 16} y={y + 30} textAnchor="middle" fill="#cdd6f4" fontSize="12" fontFamily="monospace">{node.expanded ? '-' : '+'}</text></g>}
              </g>;
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

function rowsFromCollection(collection: JsonValue[]) {
  const rows = collection.map(item => isRecord(item) || Array.isArray(item)
    ? flatten(item)
    : { value: item === null ? 'null' : String(item) });
  return { rows, columns: [...new Set(rows.flatMap(row => Object.keys(row)))] };
}

function rowsFromNestedValue(value: JsonValue) {
  if (Array.isArray(value)) {
    const table = rowsFromCollection(value);
    return { ...table, sources: value, summary: `${value.length} ${value.length === 1 ? 'item' : 'items'}` };
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    return {
      rows: entries.map(([key, child]) => ({
        path: key,
        value: isRecord(child) || Array.isArray(child) ? JSON.stringify(child) : child === null ? 'null' : String(child),
      })),
      columns: ['path', 'value'],
      sources: entries.map(([, child]) => child),
      summary: `${entries.length} ${entries.length === 1 ? 'property' : 'properties'}`,
    };
  }
  return { rows: [{ value: value === null ? 'null' : String(value) }], columns: ['value'], sources: [value], summary: '1 value' };
}

function makeRows(value: JsonValue): { columns: string[]; rows: Row[]; sources: JsonValue[]; label: string } {
  if (Array.isArray(value)) {
    return { ...rowsFromCollection(value), sources: value, label: 'JSON array' };
  }
  if (isRecord(value)) {
    const entries = Object.entries(value);
    const rows = entries.map(([key, child]) => ({ path: key, value: Array.isArray(child)
      ? `Array · ${child.length} ${child.length === 1 ? 'item' : 'items'}`
      : isRecord(child) ? `Object · ${Object.keys(child).length} ${Object.keys(child).length === 1 ? 'property' : 'properties'}`
        : child === null ? 'null' : String(child) }));
    return { columns: ['path', 'value'], rows, sources: entries.map(([, child]) => child), label: 'Root properties' };
  }
  const rows = [{ value: value === null ? 'null' : String(value) }];
  return { columns: ['value'], rows, sources: [value], label: 'JSON value' };
}

function ExpandableDataTable({
  rows, sources, columns, query, offset = 0,
}: {
  rows: Row[];
  sources: JsonValue[];
  columns: string[];
  query: string;
  offset?: number;
}) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(() => new Set());
  const toggleRow = (index: number) => setExpandedRows(current => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });

  return <table className="min-w-full border-collapse text-left text-[11px]">
    <thead className="sticky top-0 z-10 bg-[#252538] text-[#9399b2]"><tr><th className="border-b border-[#313244] px-3 py-2 font-medium">#</th>{columns.map(column => <th key={column} className="max-w-[320px] border-b border-[#313244] px-3 py-2 font-medium">{column}</th>)}</tr></thead>
    <tbody>{rows.map((row, rowIndex) => {
      const absoluteIndex = offset + rowIndex;
      const nestedArrays = findNestedContainers(sources[rowIndex] ?? null);
      const expanded = expandedRows.has(rowIndex);
      const toggle = () => { if (nestedArrays.length) toggleRow(rowIndex); };
      return <Fragment key={absoluteIndex}>
        <tr onClick={toggle} onKeyDown={event => { if (nestedArrays.length && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toggle(); } }}
          tabIndex={nestedArrays.length ? 0 : undefined} aria-expanded={nestedArrays.length ? expanded : undefined}
          className={`${rowIndex % 2 ? '' : 'bg-[#1a1a2c]'} ${nestedArrays.length ? 'cursor-pointer hover:bg-[#252538]' : 'hover:bg-[#252538]'}`}>
          <td className="border-b border-[#313244]/70 px-3 py-2 font-mono text-[#585b70]">
            {nestedArrays.length ? <span className="inline-flex items-center gap-1"><ChevronRight size={12} className={`text-[#89b4fa] transition-transform ${expanded ? 'rotate-90' : ''}`} />{absoluteIndex + 1}</span> : absoluteIndex + 1}
          </td>
          {columns.map(column => <td key={column} title={row[column] ?? ''} className="max-w-[320px] border-b border-[#313244]/70 px-3 py-2 font-mono text-[#cdd6f4]"><HighlightedText text={row[column] ?? 'null'} query={query} /></td>)}
        </tr>
        {expanded && <tr className="bg-[#181825]"><td colSpan={columns.length + 1} className="border-b border-[#313244] px-5 py-3">
          <div className="space-y-3">{nestedArrays.map(nested => {
            const childTable = rowsFromNestedValue(nested.value);
            return <section key={nested.path} className="border-l-2 border-[#89b4fa]/40 pl-3">
              <h4 className="mb-2 text-[10px] font-medium text-[#89b4fa]">{nested.path} · {childTable.summary}</h4>
              {childTable.columns.length ? <ExpandableDataTable rows={childTable.rows} sources={childTable.sources} columns={childTable.columns} query={query} />
                : <p className="text-[10px] text-[#6c7086]">This object or array is empty.</p>}
            </section>;
          })}</div>
        </td></tr>}
      </Fragment>;
    })}</tbody>
  </table>;
}

function downloadText(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(columns: string[], rows: Row[]) {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  return [columns.map(quote).join(','), ...rows.map(row => columns.map(column => quote(row[column] ?? '')).join(','))].join('\n');
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`(${escaped})`, 'ig');
  return text.split(matcher).map((part, index) => part.toLocaleLowerCase() === query.toLocaleLowerCase()
    ? <mark key={index} className="rounded-sm bg-[#f9e2af]/35 text-[#f9e2af]">{part}</mark>
    : part);
}

const PAGE_SIZES = [25, 50, 100, 250];

export default function JsonToolsView() {
  const [source, setSource] = useState('');
  const [xmlSource, setXmlSource] = useState('');
  const [view, setView] = useState<JsonView>('editor');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set(['$']));
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(() => new Set());
  const [copied, setCopied] = useState(false);
  let parsed: JsonValue | undefined;
  let parseError = '';
  try {
    if (source.trim()) parsed = JSON.parse(source) as JsonValue;
  } catch (error) {
    parseError = error instanceof Error ? error.message : 'Invalid JSON';
  }

  const table = parsed === undefined ? { columns: [], rows: [], sources: [], label: '' } : makeRows(parsed);
  const xmlResult = xmlSource.trim() ? parseXml(xmlSource) : null;
  const filteredRows = table.rows.filter(row => `${Object.values(row).join(' ')} ${Object.keys(row).join(' ')}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const sortedRows = sort ? [...filteredRows].sort((left, right) => {
    const leftValue = left[sort.key] ?? '';
    const rightValue = right[sort.key] ?? '';
    const leftNumber = Number(leftValue);
    const rightNumber = Number(rightValue);
    const order = leftValue.trim() !== '' && rightValue.trim() !== '' && Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
      ? leftNumber - rightNumber
      : leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: 'base' });
    return sort.direction === 'asc' ? order : -order;
  }) : filteredRows;
  const pageCount = Math.ceil(sortedRows.length / pageSize);
  const visibleRows = sortedRows.slice(page * pageSize, (page + 1) * pageSize);
  const valid = source.trim().length > 0 && !parseError;

  const setFormatted = (compact: boolean) => {
    if (!valid) return;
    setSource(JSON.stringify(parsed, null, compact ? undefined : 2));
    setExpandedPaths(new Set(['$']));
    setExpandedRows(new Set());
  };

  const togglePath = (path: string) => setExpandedPaths(current => {
    const next = new Set(current);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    return next;
  });

  const expandAll = () => {
    if (parsed !== undefined) setExpandedPaths(new Set(collectExpandablePaths(parsed)));
  };

  const collapseAll = () => setExpandedPaths(new Set());

  const toggleExpandedRow = (index: number) => setExpandedRows(current => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-2.5">
        <div>
          <h1 className="text-sm font-semibold">JSON Studio</h1>
          <p className="mt-0.5 text-[11px] text-[#6c7086]">Validate, format, search, and export nested JSON data.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => setFormatted(false)} disabled={!valid} className="rounded-md border border-[#313244] px-2.5 py-1.5 text-[11px] text-[#9399b2] hover:text-[#cdd6f4] disabled:opacity-40">Format</button>
          <button onClick={() => setFormatted(true)} disabled={!valid} className="rounded-md border border-[#313244] px-2.5 py-1.5 text-[11px] text-[#9399b2] hover:text-[#cdd6f4] disabled:opacity-40">Minify</button>
          <button onClick={() => downloadText(toCsv(table.columns, filteredRows), 'json-table.csv', 'text/csv')} disabled={!valid || !table.columns.length}
            className="flex items-center gap-1.5 rounded-md border border-[#313244] px-2.5 py-1.5 text-[11px] text-[#9399b2] hover:text-[#cdd6f4] disabled:opacity-40"><Download size={12} />CSV</button>
          <button onClick={copySource} disabled={!source} className="flex items-center gap-1.5 rounded-md border border-[#313244] px-2.5 py-1.5 text-[11px] text-[#9399b2] hover:text-[#cdd6f4] disabled:opacity-40"><Copy size={12} />{copied ? 'Copied' : 'Copy JSON'}</button>
        </div>
      </header>

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#313244] px-4 py-2">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-[#313244] p-0.5" role="tablist" aria-label="JSON view">
          {([
            ['editor', 'JSON', <Braces size={12} />],
            ['table', 'Table', <Table2 size={12} />],
            ['tree', 'Tree', <GitBranch size={12} />],
            ['graph', 'Graph', <Network size={12} />],
            ['xml', 'JSON ↔ XML', <ArrowLeftRight size={12} />],
          ] as const).map(([id, label, icon]) => <button key={id} role="tab" aria-selected={view === id} onClick={() => { setView(id); if (id === 'xml' && !xmlSource && parsed !== undefined) setXmlSource(jsonToXml(parsed)); }}
            className={`flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-[11px] ${view === id ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086] hover:text-[#cdd6f4]'}`}>{icon}{label}</button>)}
        </div>
        <div className="flex min-w-0 items-center gap-2 text-[11px]" aria-live="polite">
          {valid ? <><Check size={13} className="text-[#a6e3a1]" /><span className="text-[#a6e3a1]">Valid JSON</span></> : parseError ? <><span className="h-2 w-2 shrink-0 rounded-full bg-[#f38ba8]" /><span className="max-w-[55vw] truncate text-[#f38ba8]">{parseError}</span></> : <span className="text-[#6c7086]">Paste JSON to validate</span>}
        </div>
      </div>

      {view === 'editor' ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          <label className="flex min-h-0 flex-col border-b border-[#313244] md:border-b-0 md:border-r">
            <span className="shrink-0 px-4 py-2 text-[11px] text-[#9399b2]">Input JSON</span>
            <textarea value={source} onChange={event => { setSource(event.target.value); setPage(0); setExpandedPaths(new Set(['$'])); setExpandedRows(new Set()); }}
              placeholder={'Paste JSON here, for example:\n[{"name":"Ada","profile":{"city":"London"}}]'} spellCheck={false}
              className="min-h-0 flex-1 resize-none bg-[#1a1a2c] px-4 py-3 font-mono text-[12px] leading-6 text-[#cdd6f4] outline-none placeholder:text-[#585b70] focus:ring-1 focus:ring-inset focus:ring-[#89b4fa]/20" />
          </label>
          <div className="flex min-h-0 flex-col">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] text-[#9399b2]">
              <span>Parsed preview{valid ? ` · ${table.rows.length} table rows` : ''}</span>
              {valid && <div className="flex gap-1.5"><button onClick={expandAll} className="rounded border border-[#313244] px-2 py-1 text-[10px] hover:text-[#cdd6f4]">Expand all</button><button onClick={collapseAll} className="rounded border border-[#313244] px-2 py-1 text-[10px] hover:text-[#cdd6f4]">Collapse all</button></div>}
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[#1a1a2c] px-3 py-2">
              {valid && parsed !== undefined ? <JsonTreeNode value={parsed} label="root" path="$" depth={0} expandedPaths={expandedPaths} onToggle={togglePath} />
                : <p className={`px-1 py-2 text-xs ${parseError ? 'text-[#f38ba8]' : 'text-[#6c7086]'}`}>{parseError ? 'Fix the JSON syntax to see the parsed preview.' : 'Parsed structure will appear here.'}</p>}
            </div>
          </div>
        </div>
      ) : view === 'xml' ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b border-[#313244] md:border-b-0 md:border-r">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2">
              <span className="text-[11px] font-medium text-[#9399b2]">JSON source</span>
              <button onClick={() => { if (valid && parsed !== undefined) setXmlSource(jsonToXml(parsed)); }} disabled={!valid} className="flex items-center gap-1.5 rounded border border-[#89b4fa]/30 px-2.5 py-1 text-[10px] text-[#89b4fa] disabled:opacity-40"><ArrowLeftRight size={11} />JSON to XML</button>
            </div>
            <textarea value={source} onChange={event => { setSource(event.target.value); setExpandedPaths(new Set(['$'])); setExpandedRows(new Set()); }} spellCheck={false} aria-label="JSON for XML conversion" placeholder="Paste JSON to convert to XML..."
              className="min-h-0 flex-1 resize-none bg-[#1a1a2c] px-4 py-3 font-mono text-[12px] leading-6 text-[#cdd6f4] outline-none placeholder:text-[#585b70] focus:ring-1 focus:ring-inset focus:ring-[#89b4fa]/20" />
          </div>
          <div className="flex min-h-0 flex-col">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2">
              <span className="text-[11px] font-medium text-[#9399b2]">XML source {xmlResult && (xmlResult.error ? <span className="font-normal text-[#f38ba8]">· Invalid XML</span> : <span className="font-normal text-[#a6e3a1]">· Valid XML</span>)}</span>
              <button onClick={() => { if (xmlResult?.value !== undefined) { setSource(JSON.stringify(xmlResult.value, null, 2)); setExpandedPaths(new Set(['$'])); setExpandedRows(new Set()); } }} disabled={!xmlResult || xmlResult.error !== undefined} className="flex items-center gap-1.5 rounded border border-[#a6e3a1]/30 px-2.5 py-1 text-[10px] text-[#a6e3a1] disabled:opacity-40"><ArrowLeftRight size={11} />XML to JSON</button>
            </div>
            <textarea value={xmlSource} onChange={event => setXmlSource(event.target.value)} spellCheck={false} aria-label="XML for JSON conversion" placeholder="Paste or generate XML here..."
              className="min-h-0 flex-1 resize-none bg-[#1a1a2c] px-4 py-3 font-mono text-[12px] leading-6 text-[#cdd6f4] outline-none placeholder:text-[#585b70] focus:ring-1 focus:ring-inset focus:ring-[#89b4fa]/20" />
            {xmlResult?.error && <p className="shrink-0 border-t border-[#313244] px-4 py-2 text-[10px] text-[#f38ba8]">{xmlResult.error}</p>}
          </div>
        </div>
      ) : view === 'table' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#313244] px-4 py-2">
            <span className="text-[11px] text-[#9399b2]">{valid ? `${table.label} · ${sortedRows.length} results` : 'JSON table'}</span>
            <label className="flex items-center gap-2 rounded-md border border-[#313244] px-2.5 py-1.5 text-[#6c7086] focus-within:border-[#89b4fa]/40">
              <ListFilter size={12} />
              <input value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder="Search rows..." aria-label="Search JSON rows" className="w-44 bg-transparent text-[11px] text-[#cdd6f4] outline-none placeholder:text-[#585b70]" />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            {valid && table.columns.length > 0 ? (
              <table className="min-w-full border-collapse text-left text-[11px]">
                <thead className="sticky top-0 z-10 bg-[#252538] text-[#9399b2]"><tr><th className="border-b border-[#313244] px-3 py-2 font-medium">#</th>{table.columns.map(column => <th key={column} aria-sort={sort?.key === column ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'} className="max-w-[320px] border-b border-[#313244] px-3 py-2 font-medium"><button onClick={() => { setSort(current => current?.key === column ? { key: column, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key: column, direction: 'asc' }); setPage(0); }} className="flex items-center gap-1.5 text-left hover:text-[#cdd6f4]"><HighlightedText text={column} query={search} /><ChevronsUpDown size={12} className={sort?.key === column ? 'text-[#89b4fa]' : 'opacity-50'} /></button></th>)}</tr></thead>
                <tbody>{visibleRows.map((row, rowIndex) => {
                  const originalIndex = table.rows.indexOf(row);
                  const nestedArrays = findNestedContainers(table.sources[originalIndex] ?? null);
                  const expanded = expandedRows.has(originalIndex);
                  const toggle = () => { if (nestedArrays.length) toggleExpandedRow(originalIndex); };
                  return <Fragment key={originalIndex}>
                    <tr onClick={toggle} onKeyDown={event => { if (nestedArrays.length && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toggle(); } }}
                      tabIndex={nestedArrays.length ? 0 : undefined} aria-expanded={nestedArrays.length ? expanded : undefined}
                      className={`${rowIndex % 2 ? '' : 'bg-[#1a1a2c]'} ${nestedArrays.length ? 'cursor-pointer hover:bg-[#252538]' : 'hover:bg-[#252538]'}`}>
                      <td className="border-b border-[#313244]/70 px-3 py-2 font-mono text-[#585b70]">{nestedArrays.length ? <span className="inline-flex items-center gap-1"><ChevronRight size={12} className={`text-[#89b4fa] transition-transform ${expanded ? 'rotate-90' : ''}`} />{page * pageSize + rowIndex + 1}</span> : page * pageSize + rowIndex + 1}</td>
                      {table.columns.map(column => <td key={column} title={row[column] ?? ''} className="max-w-[320px] border-b border-[#313244]/70 px-3 py-2 font-mono text-[#cdd6f4]"><HighlightedText text={row[column] ?? 'null'} query={search} /></td>)}
                    </tr>
                    {expanded && <tr><td colSpan={table.columns.length + 1} className="border-b border-[#313244] bg-[#181825] px-5 py-3">
                      <div className="space-y-3">{nestedArrays.map(nested => {
                        const childTable = rowsFromNestedValue(nested.value);
                        return <section key={nested.path} className="border-l-2 border-[#89b4fa]/40 pl-3">
                          <h4 className="mb-2 text-[10px] font-medium text-[#89b4fa]">{nested.path} · {childTable.summary}</h4>
                          {childTable.columns.length ? <ExpandableDataTable rows={childTable.rows} sources={childTable.sources} columns={childTable.columns} query={search} />
                            : <p className="text-[10px] text-[#6c7086]">This object or array is empty.</p>}
                        </section>;
                      })}</div>
                    </td></tr>}
                  </Fragment>;
                })}</tbody>
              </table>
            ) : <div className="flex h-full items-center justify-center px-6 text-center text-xs text-[#6c7086]">{!source.trim() ? 'Paste a JSON array or object to build a table.' : parseError ? 'Correct the JSON syntax to view its table.' : 'No rows match this search.'}</div>}
          </div>
          <footer className="flex shrink-0 items-center justify-between border-t border-[#313244] px-4 py-2 text-[11px] text-[#6c7086]">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">Rows per page<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(0); }} aria-label="Rows per page" className="rounded border border-[#313244] bg-[#1a1a2c] px-2 py-1 text-[#cdd6f4]">{PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}</select></label>
              <span>{sortedRows.length ? `Page ${page + 1} of ${pageCount} · ${sortedRows.length} rows` : '0 rows'}</span>
            </div>
            <div className="flex gap-2"><button onClick={() => setPage(value => Math.max(0, value - 1))} disabled={page === 0} className="rounded border border-[#313244] px-2.5 py-1 hover:text-[#cdd6f4] disabled:opacity-40">Previous</button><button onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))} disabled={page + 1 >= pageCount} className="rounded border border-[#313244] px-2.5 py-1 hover:text-[#cdd6f4] disabled:opacity-40">Next</button></div>
          </footer>
        </div>
      ) : view === 'tree' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#313244] px-4 py-2">
            <span className="text-[11px] text-[#9399b2]">Tree structure{valid && parsed !== undefined ? ` · ${collectExpandablePaths(parsed).length} containers` : ''}</span>
            {valid && <div className="flex gap-1.5"><button onClick={expandAll} className="rounded border border-[#313244] px-2 py-1 text-[10px] text-[#9399b2] hover:text-[#cdd6f4]">Expand all</button><button onClick={collapseAll} className="rounded border border-[#313244] px-2 py-1 text-[10px] text-[#9399b2] hover:text-[#cdd6f4]">Collapse all</button></div>}
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-[#1a1a2c] p-4">
            {valid && parsed !== undefined ? <JsonTreeNode value={parsed} label="root" path="$" depth={0} expandedPaths={expandedPaths} onToggle={togglePath} />
              : <p className="text-xs text-[#6c7086]">Paste valid JSON to explore its tree.</p>}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-[#313244] px-4 py-2">
            <div>
              <h2 className="text-[11px] font-medium text-[#cdd6f4]">JSON relationships</h2>
              <p className="mt-0.5 text-[10px] text-[#6c7086]">Each edge connects a parent to its nested property or array item.</p>
            </div>
            {valid && <span className="text-[10px] text-[#6c7086]">{makeGraph(parsed as JsonValue, new Set(collectExpandablePaths(parsed as JsonValue))).nodes.length} nodes</span>}
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-[#1a1a2c] p-4">
            {valid && parsed !== undefined ? <JsonGraph value={parsed} />
              : <div className="flex h-full items-center justify-center text-xs text-[#6c7086]">Paste valid JSON to view its relationship graph.</div>}
          </div>
        </div>
      )}
    </section>
  );
}