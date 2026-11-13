import { useState, useMemo, Fragment } from 'react';
import {
  Copy,
  Check,
  Search,
  ChevronRight,
  ChevronDown,
  Table2,
  GitBranch,
  Code2,
} from 'lucide-react';

interface HarJsonResponseViewerProps {
  responseText?: string;
  mimeType?: string;
  size?: number;
}

type ViewMode = 'tree' | 'table' | 'raw';

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function getValueColor(val: unknown): string {
  if (val === null) return 'text-[#9eac96]';
  if (typeof val === 'string') return 'text-[#b5dfa3]';
  if (typeof val === 'number') return 'text-[#f3c18e]';
  if (typeof val === 'boolean') return 'text-[#c8edb6]';
  return 'text-[#e4ebdd]';
}

function getValuePreview(val: unknown): string {
  if (val === null) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return `Array(${val.length})`;
  if (isObject(val)) return `Object(${Object.keys(val).length})`;
  return String(val);
}

// Recursive Tree Node for nested JSON
function TreeNode({
  nodeKey,
  value,
  path,
  depth = 0,
  searchTerm,
  onCopy,
  copiedPath,
}: {
  nodeKey: string;
  value: unknown;
  path: string;
  depth?: number;
  searchTerm: string;
  onCopy: (text: string, path: string) => void;
  copiedPath: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const isBranch = Array.isArray(value) || isObject(value);

  // Check if current node or its value matches search
  const isMatch = useMemo(() => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (nodeKey.toLowerCase().includes(term)) return true;
    if (!isBranch && String(value).toLowerCase().includes(term)) return true;
    return false;
  }, [nodeKey, value, isBranch, searchTerm]);

  if (!isMatch && searchTerm) {
    // If it's a branch, only render if children have match
    if (isBranch) {
      const serialized = JSON.stringify(value).toLowerCase();
      if (!serialized.includes(searchTerm.toLowerCase())) return null;
    } else {
      return null;
    }
  }

  const childCount = Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : 0;
  const isCopied = copiedPath === path;

  return (
    <div className="font-mono text-xs select-text">
      <div
        className={`flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-[#344435]/40 transition-colors group ${
          depth > 0 ? 'ml-4' : ''
        }`}
      >
        {isBranch ? (
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="p-0.5 text-[#b1bea8] hover:text-[#e4ebdd]"
          >
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <span className="w-3.5 inline-block" />
        )}

        {/* Key */}
        <span className="text-[#c8edb6] font-semibold">{nodeKey}:</span>

        {/* Value Preview or Leaf Value */}
        {isBranch ? (
          <span className="text-[#9eac96] text-[11px]">
            {Array.isArray(value) ? `[ ${childCount} items ]` : `{ ${childCount} keys }`}
          </span>
        ) : (
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className={`${getValueColor(value)} break-all`}>
              {getValuePreview(value)}
            </span>
            <button
              onClick={() => onCopy(typeof value === 'string' ? value : JSON.stringify(value), path)}
              title="Copy this individual value"
              className={`p-0.5 rounded transition-all shrink-0 ${
                isCopied
                  ? 'bg-[#b5dfa3]/20 text-[#b5dfa3]'
                  : 'text-[#9eac96] hover:text-[#e4ebdd] hover:bg-[#344435] opacity-70 group-hover:opacity-100'
              }`}
            >
              {isCopied ? <Check size={11} className="text-[#b5dfa3]" /> : <Copy size={11} />}
            </button>
          </div>
        )}

        {/* Actions on hover */}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Copy exact value */}
          {!isBranch && (
            <button
              onClick={() => onCopy(typeof value === 'string' ? value : JSON.stringify(value), path)}
              title="Copy value"
              className="flex items-center gap-1 px-1.5 py-0.5 bg-[#111612] hover:bg-[#344435] border border-[#71836b] rounded text-[10px] text-[#c3ceba] hover:text-[#e4ebdd]"
            >
              {isCopied ? <Check size={10} className="text-[#b5dfa3]" /> : <Copy size={10} />}
              <span>{isCopied ? 'Copied' : 'Value'}</span>
            </button>
          )}

          {/* Copy path */}
          <button
            onClick={() => onCopy(path, `${path}-path`)}
            title={`Copy JSON path (${path})`}
            className="px-1.5 py-0.5 bg-[#111612] hover:bg-[#344435] border border-[#71836b] rounded text-[10px] text-[#9eac96] hover:text-[#e4ebdd]"
          >
            {copiedPath === `${path}-path` ? <Check size={10} className="text-[#b5dfa3]" /> : 'Path'}
          </button>
        </div>
      </div>

      {/* Expanded Children */}
      {isBranch && isExpanded && (
        <div className="border-l border-[#344435]/60 ml-3.5 pl-1">
          {Array.isArray(value)
            ? value.map((item, idx) => (
                <TreeNode
                  key={idx}
                  nodeKey={String(idx)}
                  value={item}
                  path={`${path}[${idx}]`}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                  onCopy={onCopy}
                  copiedPath={copiedPath}
                />
              ))
            : Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <TreeNode
                  key={k}
                  nodeKey={k}
                  value={v}
                  path={path ? `${path}.${k}` : k}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                  onCopy={onCopy}
                  copiedPath={copiedPath}
                />
              ))}
        </div>
      )}
    </div>
  );
}

export default function HarJsonResponseViewer({ responseText, mimeType, size }: HarJsonResponseViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedTableRows, setExpandedTableRows] = useState<Set<number>>(new Set());

  // Attempt JSON parsing
  const parsedData = useMemo(() => {
    if (!responseText || !responseText.trim()) return null;
    try {
      return JSON.parse(responseText);
    } catch {
      return null;
    }
  }, [responseText]);

  const isJson = parsedData !== null;

  const handleCopy = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Fallback');
      }
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      } catch {}
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert array of objects or object into tabular rows
  const tableData = useMemo(() => {
    if (!isJson) return null;
    if (Array.isArray(parsedData)) {
      if (parsedData.length === 0) return { columns: [], rows: [] };
      // Gather all unique keys across all objects in array
      const colSet = new Set<string>();
      parsedData.forEach(item => {
        if (isObject(item)) {
          Object.keys(item).forEach(k => colSet.add(k));
        } else {
          colSet.add('value');
        }
      });
      const columns = Array.from(colSet);
      return { columns, rows: parsedData };
    } else if (isObject(parsedData)) {
      // Single object key-value table
      const rows = Object.entries(parsedData).map(([key, value]) => ({
        key,
        value,
        type: Array.isArray(value) ? 'array' : typeof value,
      }));
      return { columns: ['key', 'value', 'type'], rows };
    }
    return null;
  }, [parsedData, isJson]);

  // Filtered rows for Table view
  const filteredTableRows = useMemo(() => {
    if (!tableData) return [];
    if (!searchTerm.trim()) return tableData.rows;
    const term = searchTerm.toLowerCase();

    return tableData.rows.filter(row => {
      if (isObject(row)) {
        return Object.values(row).some(v => String(v).toLowerCase().includes(term));
      }
      return String(row).toLowerCase().includes(term);
    });
  }, [tableData, searchTerm]);

  if (!responseText) {
    return (
      <div className="text-[#9eac96] text-xs italic p-4 bg-[#111612] rounded-xl border border-[#344435]">
        No response body captured in this request.
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3 font-sans">
      {/* Response Action Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[#344435]">
        {/* Left: format & size info */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#b5dfa3] uppercase tracking-wider">
            {isJson ? 'JSON Response' : mimeType || 'Text Content'}
          </span>
          {size !== undefined && (
            <span className="text-[10px] text-[#9eac96]">
              • {size} bytes
            </span>
          )}
        </div>

        {/* View Mode Switcher (Tree, Table, Raw) */}
        {isJson && (
          <div className="flex items-center bg-[#111612] border border-[#344435] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                viewMode === 'tree' ? 'bg-[#c8edb6] text-[#0d120f] font-bold' : 'text-[#b1bea8] hover:text-[#e4ebdd]'
              }`}
            >
              <GitBranch size={12} />
              Tree &amp; Values
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                viewMode === 'table' ? 'bg-[#c8edb6] text-[#0d120f] font-bold' : 'text-[#b1bea8] hover:text-[#e4ebdd]'
              }`}
            >
              <Table2 size={12} />
              Table View
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                viewMode === 'raw' ? 'bg-[#c8edb6] text-[#0d120f] font-bold' : 'text-[#b1bea8] hover:text-[#e4ebdd]'
              }`}
            >
              <Code2 size={12} />
              Raw JSON
            </button>
          </div>
        )}

        {/* Copy All Button */}
        <button
          onClick={() => handleCopy(responseText, 'all')}
          className="flex items-center gap-1 text-[11px] text-[#c8edb6] hover:underline"
        >
          {copiedKey === 'all' ? <Check size={12} /> : <Copy size={12} />}
          Copy Entire Response
        </button>
      </div>

      {/* Search Input for Tree & Table Views */}
      {isJson && viewMode !== 'raw' && (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-2 text-[#9eac96]" />
          <input
            type="text"
            placeholder="Search keys, values, or properties in this response..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#111612] border border-[#344435] rounded-lg text-xs text-[#e4ebdd] placeholder-[#899980] focus:outline-none focus:border-[#c8edb6]"
          />
        </div>
      )}

      {/* VIEW 1: INTERACTIVE TREE WITH 1-CLICK VALUE COPY */}
      {isJson && viewMode === 'tree' && (
        <div className="bg-[#111612] border border-[#344435] rounded-xl p-3 max-h-[550px] overflow-auto">
          <TreeNode
            nodeKey="root"
            value={parsedData}
            path="$"
            depth={0}
            searchTerm={searchTerm}
            onCopy={handleCopy}
            copiedPath={copiedKey}
          />
        </div>
      )}

      {/* VIEW 2: SEARCHABLE TABLE VIEW FOR JSON ARRAYS & OBJECTS */}
      {isJson && viewMode === 'table' && tableData && (
        <div className="bg-[#111612] border border-[#344435] rounded-xl overflow-hidden max-h-[550px] flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#171d19] border-b border-[#344435] text-[11px] font-bold text-[#c8edb6]">
                <tr>
                  <th className="px-3 py-2 w-10 text-[#9eac96]">#</th>
                  {tableData.columns.map(col => (
                    <th key={col} className="px-3 py-2 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b382c]">
                {filteredTableRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableData.columns.length + 1} className="p-6 text-center text-xs text-[#9eac96]">
                      No rows match &quot;{searchTerm}&quot;
                    </td>
                  </tr>
                ) : (
                  filteredTableRows.map((row, rIdx) => {
                    const isExpanded = expandedTableRows.has(rIdx);
                    return (
                      <Fragment key={rIdx}>
                        <tr className="hover:bg-[#171d19]/60 transition-colors group">
                          <td className="px-3 py-2 text-[#899980] font-mono text-[10px]">
                            {rIdx + 1}
                          </td>
                          {tableData.columns.map(col => {
                            const val = isObject(row) ? row[col] : (col === 'value' ? row : '');
                            const isComplex = isObject(val) || Array.isArray(val);
                            const valStr = typeof val === 'string' ? val : JSON.stringify(val);

                            return (
                              <td key={col} className="px-3 py-2 font-mono text-xs max-w-xs truncate">
                                <div className="flex items-center justify-between gap-1">
                                  {isComplex ? (
                                    <button
                                      onClick={() => {
                                        setExpandedTableRows(prev => {
                                          const next = new Set(prev);
                                          if (next.has(rIdx)) next.delete(rIdx);
                                          else next.add(rIdx);
                                          return next;
                                        });
                                      }}
                                      className="text-[#c8edb6] hover:underline flex items-center gap-1 font-sans text-[11px]"
                                    >
                                      {Array.isArray(val) ? `[ ${val.length} items ]` : `{ object }`}
                                    </button>
                                  ) : (
                                    <span className={`${getValueColor(val)} truncate`}>
                                      {String(val ?? 'null')}
                                    </span>
                                  )}

                                  {/* Copy Cell Value */}
                                  <button
                                    onClick={() => handleCopy(valStr, `cell-${rIdx}-${col}`)}
                                    title="Copy cell value"
                                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#344435] text-[#9eac96] hover:text-[#e4ebdd] transition-opacity shrink-0"
                                  >
                                    {copiedKey === `cell-${rIdx}-${col}` ? (
                                      <Check size={11} className="text-[#b5dfa3]" />
                                    ) : (
                                      <Copy size={11} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Expanded Drawer for Nested JSON in row */}
                        {isExpanded && (
                          <tr className="bg-[#0d120f]/80">
                            <td colSpan={tableData.columns.length + 1} className="p-3 border-l-2 border-[#c8edb6]">
                              <div className="text-[10px] font-bold text-[#c8edb6] uppercase mb-1">
                                Expanded Object Data:
                              </div>
                              <pre className="text-xs font-mono text-[#b5dfa3] bg-[#111612] p-2 rounded-lg border border-[#344435] overflow-x-auto">
                                {JSON.stringify(row, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: RAW PRETTY-PRINTED JSON */}
      {(!isJson || viewMode === 'raw') && (
        <pre className="p-3 bg-[#111612] rounded-xl border border-[#344435] text-[#e4ebdd] font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[550px]">
          {isJson ? JSON.stringify(parsedData, null, 2) : responseText}
        </pre>
      )}
    </div>
  );
}
