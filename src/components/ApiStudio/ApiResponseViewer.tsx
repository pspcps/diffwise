import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  Search,
  ChevronRight,
  ChevronDown,
  Table2,
  Code2,
  FileText,
  ListTree,
  WrapText,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { ApiResponseData } from './ApiStudioView';

interface ApiResponseViewerProps {
  response: ApiResponseData;
}

type TabMode = 'tree' | 'pretty' | 'table' | 'raw' | 'headers';

// Robust clipboard copy with fallback
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

function getValueColor(val: unknown): string {
  if (val === null) return 'text-[#f38ba8] italic font-semibold';
  if (typeof val === 'string') return 'text-[#a6e3a1]';
  if (typeof val === 'number') return 'text-[#fab387] font-semibold';
  if (typeof val === 'boolean') return 'text-[#cba6f7] font-semibold';
  return 'text-[#cdd6f4]';
}

function getValueDisplayString(val: unknown): string {
  if (val === null) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return `Array(${val.length})`;
  if (typeof val === 'object') return `Object(${Object.keys(val as object).length})`;
  return String(val);
}

function getRawValueString(val: unknown): string {
  if (val === null) return 'null';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return JSON.stringify(val);
}

// Interactive Nested Tree Node with copy individual value
function JsonTreeNode({
  nodeKey,
  value,
  path,
  depth = 0,
  searchTerm,
  onCopy,
  copiedPath,
  allExpanded,
}: {
  nodeKey: string;
  value: unknown;
  path: string;
  depth?: number;
  searchTerm: string;
  onCopy: (text: string, path: string) => void;
  copiedPath: string | null;
  allExpanded: boolean | null;
}) {
  const isBranch = Array.isArray(value) || (value !== null && typeof value === 'object');
  const [isOpen, setIsOpen] = useState(depth < 2);

  // Sync with global Expand/Collapse All
  React.useEffect(() => {
    if (allExpanded !== null && isBranch) {
      setIsOpen(allExpanded);
    }
  }, [allExpanded, isBranch]);

  const childCount = Array.isArray(value)
    ? value.length
    : value !== null && typeof value === 'object'
    ? Object.keys(value).length
    : 0;

  // Search matching
  const hasMatch = useMemo(() => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    if (nodeKey.toLowerCase().includes(term)) return true;
    if (!isBranch) {
      return String(value).toLowerCase().includes(term);
    }
    try {
      return JSON.stringify(value).toLowerCase().includes(term);
    } catch {
      return false;
    }
  }, [nodeKey, value, isBranch, searchTerm]);

  if (!hasMatch && searchTerm.trim()) {
    return null;
  }

  const rawVal = getRawValueString(value);
  const isValCopied = copiedPath === `val-${path}`;
  const isKeyCopied = copiedPath === `key-${path}`;
  const isPathCopied = copiedPath === `path-${path}`;

  return (
    <div className="font-mono text-xs select-text">
      <div
        className={`flex items-center gap-2 py-1 px-2.5 rounded-lg hover:bg-[#313244]/50 transition-colors group ${
          depth > 0 ? 'ml-4' : ''
        }`}
      >
        {/* Toggle arrow for objects/arrays */}
        {isBranch ? (
          <button
            onClick={() => setIsOpen(v => !v)}
            className="p-0.5 rounded text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244]"
            title={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : (
          <span className="w-3.5 inline-block shrink-0" />
        )}

        {/* Node Key */}
        <span className="text-[#89b4fa] font-bold shrink-0">{nodeKey}:</span>

        {/* Value Preview / Leaf Value */}
        {isBranch ? (
          <span
            onClick={() => setIsOpen(v => !v)}
            className="text-[#6c7086] text-[11px] cursor-pointer hover:text-[#9399b2] select-none"
          >
            {Array.isArray(value) ? `[ ${childCount} items ]` : `{ ${childCount} keys }`}
          </span>
        ) : (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`${getValueColor(value)} break-all`}>
              {getValueDisplayString(value)}
            </span>

            {/* Individual Value Copy Button - ALWAYS visible on leaf value */}
            <button
              onClick={() => onCopy(rawVal, `val-${path}`)}
              className={`p-1 rounded transition-all shrink-0 ${
                isValCopied
                  ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]'
                  : 'text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] opacity-70 group-hover:opacity-100'
              }`}
              title={`Copy value: ${rawVal}`}
            >
              {isValCopied ? (
                <div className="flex items-center gap-1 text-[10px] text-[#a6e3a1] font-sans font-bold">
                  <Check size={11} /> Copied!
                </div>
              ) : (
                <Copy size={11} />
              )}
            </button>
          </div>
        )}

        {/* Actions for Keys and Paths on Hover */}
        <div className="ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onCopy(nodeKey, `key-${path}`)}
            className="px-1.5 py-0.5 bg-[#181825] hover:bg-[#313244] border border-[#45475a] rounded text-[10px] text-[#9399b2] hover:text-[#cdd6f4]"
            title={`Copy key: ${nodeKey}`}
          >
            {isKeyCopied ? <Check size={10} className="text-[#a6e3a1]" /> : 'Key'}
          </button>

          <button
            onClick={() => onCopy(path, `path-${path}`)}
            className="px-1.5 py-0.5 bg-[#181825] hover:bg-[#313244] border border-[#45475a] rounded text-[10px] text-[#6c7086] hover:text-[#cdd6f4]"
            title={`Copy path: ${path}`}
          >
            {isPathCopied ? <Check size={10} className="text-[#a6e3a1]" /> : 'Path'}
          </button>
        </div>
      </div>

      {/* Children branches */}
      {isBranch && isOpen && (
        <div className="border-l border-[#313244]/70 ml-4 pl-1">
          {Array.isArray(value)
            ? value.map((item, idx) => (
                <JsonTreeNode
                  key={idx}
                  nodeKey={String(idx)}
                  value={item}
                  path={`${path}[${idx}]`}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                  onCopy={onCopy}
                  copiedPath={copiedPath}
                  allExpanded={allExpanded}
                />
              ))
            : Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                <JsonTreeNode
                  key={k}
                  nodeKey={k}
                  value={v}
                  path={path ? `${path}.${k}` : k}
                  depth={depth + 1}
                  searchTerm={searchTerm}
                  onCopy={onCopy}
                  copiedPath={copiedPath}
                  allExpanded={allExpanded}
                />
              ))}
        </div>
      )}
    </div>
  );
}

// Line-numbered syntax highlighter for formatted JSON with per-line copy
function FormattedCodeView({
  jsonText,
  onCopy,
  copiedKey,
}: {
  jsonText: string;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
}) {
  const lines = useMemo(() => jsonText.split('\n'), [jsonText]);
  const [wordWrap, setWordWrap] = useState(true);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[#9399b2] pb-1 border-b border-[#313244]">
        <span>{lines.length} lines • Formatted JSON</span>
        <button
          onClick={() => setWordWrap(!wordWrap)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
            wordWrap
              ? 'bg-[#89b4fa]/15 text-[#89b4fa] border-[#89b4fa]/30'
              : 'bg-[#181825] text-[#9399b2] border-[#313244]'
          }`}
        >
          <WrapText size={12} />
          <span>Wrap Lines</span>
        </button>
      </div>

      <div
        className={`bg-[#11111b] border border-[#313244] rounded-xl p-3 font-mono text-xs overflow-x-auto ${
          wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
        }`}
      >
        {lines.map((line, idx) => {
          const lineNum = idx + 1;
          const isCopied = copiedKey === `line-${lineNum}`;

          // Syntax coloring logic
          let coloredLine = <span className="text-[#cdd6f4]">{line}</span>;
          const colonMatch = line.match(/^(\s*"[^"]+"\s*:)(.*)$/);
          if (colonMatch) {
            const keyPart = colonMatch[1];
            const valPart = colonMatch[2];
            let valColor = 'text-[#cdd6f4]';
            const trimmedVal = valPart.trim().replace(/,$/, '');

            if (trimmedVal.startsWith('"')) valColor = 'text-[#a6e3a1]';
            else if (!isNaN(Number(trimmedVal))) valColor = 'text-[#fab387] font-semibold';
            else if (trimmedVal === 'true' || trimmedVal === 'false') valColor = 'text-[#cba6f7] font-semibold';
            else if (trimmedVal === 'null') valColor = 'text-[#f38ba8] italic font-semibold';

            coloredLine = (
              <span>
                <span className="text-[#89b4fa] font-semibold">{keyPart}</span>
                <span className={valColor}>{valPart}</span>
              </span>
            );
          }

          return (
            <div
              key={idx}
              className="group flex items-start hover:bg-[#181825] px-1.5 py-0.5 rounded -mx-1.5"
            >
              <span className="w-10 text-right pr-4 text-[#585b70] select-none text-[11px] shrink-0 font-mono">
                {lineNum}
              </span>
              <div className="flex-1 min-w-0">{coloredLine}</div>
              <button
                onClick={() => {
                  // extract value if key-val, otherwise copy line
                  const matchVal = line.match(/:\s*(.*?),?$/);
                  const textToCopy = matchVal ? matchVal[1].replace(/^["']|["']$/g, '') : line.trim();
                  onCopy(textToCopy, `line-${lineNum}`);
                }}
                className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all text-[#6c7086] hover:text-[#89b4fa] shrink-0 ml-2`}
                title="Copy this line value"
              >
                {isCopied ? <Check size={11} className="text-[#a6e3a1]" /> : <Copy size={11} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ApiResponseViewer: React.FC<ApiResponseViewerProps> = ({ response }) => {
  const [tab, setTab] = useState<TabMode>(response.isJson ? 'tree' : 'raw');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [allExpanded, setAllExpanded] = useState<boolean | null>(null);

  const formattedJson = useMemo(() => {
    if (!response.isJson || !response.parsedJson) return '';
    try {
      return JSON.stringify(response.parsedJson, null, 2);
    } catch {
      return response.data;
    }
  }, [response]);

  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey(prev => (prev === key ? null : prev));
      }, 1800);
    }
  };

  // Prepare table data for array or key-value object
  const tableData = useMemo(() => {
    if (!response.parsedJson) return { columns: [], rows: [] };
    const d = response.parsedJson;

    if (Array.isArray(d)) {
      if (d.length === 0) return { columns: [], rows: [] };
      const cols = Array.from(
        new Set(
          d.flatMap(item => (typeof item === 'object' && item !== null ? Object.keys(item) : ['value']))
        )
      );
      return { columns: cols, rows: d };
    } else if (typeof d === 'object' && d !== null) {
      const cols = ['key', 'value'];
      const rows = Object.entries(d).map(([k, v]) => ({
        key: k,
        value: typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v),
      }));
      return { columns: cols, rows };
    }
    return { columns: [], rows: [] };
  }, [response.parsedJson]);

  const filteredTableRows = useMemo(() => {
    if (!tableSearch.trim()) return tableData.rows;
    const q = tableSearch.toLowerCase();
    return tableData.rows.filter(row => {
      return Object.values(row).some(v => String(v).toLowerCase().includes(q));
    });
  }, [tableData, tableSearch]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#11111b] overflow-hidden">
      {/* Response Navigation Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#313244] bg-[#181825] gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1.5">
          {response.isJson && (
            <button
              onClick={() => setTab('tree')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                tab === 'tree'
                  ? 'bg-[#89b4fa]/20 text-[#89b4fa] font-bold border border-[#89b4fa]/30'
                  : 'text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244]/50'
              }`}
            >
              <ListTree size={13} />
              <span>JSON Tree</span>
            </button>
          )}

          {response.isJson && (
            <button
              onClick={() => setTab('pretty')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                tab === 'pretty'
                  ? 'bg-[#89b4fa]/20 text-[#89b4fa] font-bold border border-[#89b4fa]/30'
                  : 'text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244]/50'
              }`}
            >
              <Code2 size={13} />
              <span>Pretty</span>
            </button>
          )}

          {response.isJson && (
            <button
              onClick={() => setTab('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                tab === 'table'
                  ? 'bg-[#89b4fa]/20 text-[#89b4fa] font-bold border border-[#89b4fa]/30'
                  : 'text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244]/50'
              }`}
            >
              <Table2 size={13} />
              <span>Table</span>
            </button>
          )}

          <button
            onClick={() => setTab('raw')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              tab === 'raw'
                ? 'bg-[#89b4fa]/20 text-[#89b4fa] font-bold border border-[#89b4fa]/30'
                : 'text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244]/50'
            }`}
          >
            <FileText size={13} />
            <span>Raw</span>
          </button>

          <button
            onClick={() => setTab('headers')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              tab === 'headers'
                ? 'bg-[#89b4fa]/20 text-[#89b4fa] font-bold border border-[#89b4fa]/30'
                : 'text-[#9399b2] hover:text-[#cdd6f4] hover:bg-[#313244]/50'
            }`}
          >
            <span>Headers ({Object.keys(response.headers).length})</span>
          </button>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {tab === 'tree' && response.isJson && (
            <div className="flex items-center gap-1 bg-[#11111b] border border-[#313244] rounded-lg p-0.5">
              <button
                onClick={() => setAllExpanded(true)}
                className="px-2 py-1 text-[11px] text-[#9399b2] hover:text-[#cdd6f4] flex items-center gap-1"
                title="Expand all nodes"
              >
                <Maximize2 size={11} /> Expand
              </button>
              <button
                onClick={() => setAllExpanded(false)}
                className="px-2 py-1 text-[11px] text-[#9399b2] hover:text-[#cdd6f4] flex items-center gap-1"
                title="Collapse all nodes"
              >
                <Minimize2 size={11} /> Collapse
              </button>
            </div>
          )}

          <button
            onClick={() => handleCopy(response.data, 'global-body')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#313244] hover:bg-[#45475a] text-xs font-medium text-[#cdd6f4] border border-[#45475a] transition-all"
            title="Copy full response"
          >
            {copiedKey === 'global-body' ? (
              <>
                <Check size={12} className="text-[#a6e3a1]" />
                <span className="text-[#a6e3a1] font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} className="text-[#89b4fa]" />
                <span>Copy Full Response</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {/* 1. JSON Tree View */}
        {tab === 'tree' && response.isJson && (
          <div className="space-y-3">
            {/* Search filter input */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 relative max-w-md">
                <Search size={13} className="absolute left-3 top-2.5 text-[#6c7086]" />
                <input
                  type="text"
                  placeholder="Search keys, values or paths in JSON..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#181825] border border-[#313244] rounded-lg text-xs font-mono text-[#cdd6f4] placeholder-[#585b70] focus:outline-none focus:border-[#89b4fa]"
                />
              </div>
              <div className="text-[11px] text-[#6c7086] italic">
                Hover any item to copy value, key, or path
              </div>
            </div>

            {/* Tree nodes */}
            <div className="bg-[#181825] border border-[#313244] rounded-xl p-3 min-h-[220px]">
              {typeof response.parsedJson === 'object' && response.parsedJson !== null ? (
                Array.isArray(response.parsedJson) ? (
                  response.parsedJson.map((item, idx) => (
                    <JsonTreeNode
                      key={idx}
                      nodeKey={String(idx)}
                      value={item}
                      path={`[${idx}]`}
                      searchTerm={searchFilter}
                      onCopy={handleCopy}
                      copiedPath={copiedKey}
                      allExpanded={allExpanded}
                    />
                  ))
                ) : (
                  Object.entries(response.parsedJson as Record<string, unknown>).map(([k, v]) => (
                    <JsonTreeNode
                      key={k}
                      nodeKey={k}
                      value={v}
                      path={k}
                      searchTerm={searchFilter}
                      onCopy={handleCopy}
                      copiedPath={copiedKey}
                      allExpanded={allExpanded}
                    />
                  ))
                )
              ) : (
                <div className="flex items-center gap-2 p-2">
                  <span className="text-xs font-mono text-[#a6e3a1]">
                    {String(response.parsedJson)}
                  </span>
                  <button
                    onClick={() => handleCopy(String(response.parsedJson), 'root-val')}
                    className="p-1 rounded text-[#89b4fa] hover:bg-[#313244]"
                  >
                    {copiedKey === 'root-val' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Pretty Formatted Code View */}
        {tab === 'pretty' && response.isJson && (
          <FormattedCodeView
            jsonText={formattedJson}
            onCopy={handleCopy}
            copiedKey={copiedKey}
          />
        )}

        {/* 3. Table View */}
        {tab === 'table' && response.isJson && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9399b2]">
                {filteredTableRows.length} {filteredTableRows.length === 1 ? 'row' : 'rows'}
              </span>
              <div className="relative w-64">
                <Search size={13} className="absolute left-2.5 top-2 text-[#6c7086]" />
                <input
                  type="text"
                  placeholder="Filter table rows..."
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1 bg-[#181825] border border-[#313244] rounded-lg text-xs text-[#cdd6f4] placeholder-[#585b70] focus:outline-none focus:border-[#89b4fa]"
                />
              </div>
            </div>

            <div className="border border-[#313244] rounded-xl overflow-x-auto bg-[#181825]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#11111b] border-b border-[#313244] text-[#9399b2]">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">#</th>
                    {tableData.columns.map(c => (
                      <th key={c} className="px-3 py-2.5 font-bold text-[#89b4fa]">
                        <div className="flex items-center justify-between gap-1">
                          <span>{c}</span>
                          <button
                            onClick={() => handleCopy(c, `col-${c}`)}
                            className="opacity-40 hover:opacity-100 p-0.5 text-[#9399b2] hover:text-[#89b4fa]"
                            title={`Copy column name "${c}"`}
                          >
                            {copiedKey === `col-${c}` ? <Check size={11} className="text-[#a6e3a1]" /> : <Copy size={11} />}
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#313244]">
                  {filteredTableRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={tableData.columns.length + 1}
                        className="px-4 py-8 text-center text-xs text-[#6c7086] italic"
                      >
                        No matching table rows
                      </td>
                    </tr>
                  ) : (
                    filteredTableRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#11111b]/60 group transition-colors">
                        <td className="px-3 py-2 text-[#585b70] text-center">{idx + 1}</td>
                        {tableData.columns.map(c => {
                          const rawVal =
                            typeof row === 'object' && row !== null
                              ? (row as Record<string, unknown>)[c]
                              : '';
                          const isObj = typeof rawVal === 'object' && rawVal !== null;
                          const strVal = isObj ? JSON.stringify(rawVal) : String(rawVal ?? '');
                          const isCellCopied = copiedKey === `cell-${idx}-${c}`;

                          return (
                            <td key={c} className="px-3 py-2 text-[#cdd6f4] max-w-sm">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`truncate ${isObj ? 'text-[#89b4fa] font-medium' : getValueColor(rawVal)}`}>
                                  {strVal}
                                </span>
                                <button
                                  onClick={() => handleCopy(strVal, `cell-${idx}-${c}`)}
                                  className={`p-1 rounded transition-all shrink-0 ${
                                    isCellCopied
                                      ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]'
                                      : 'opacity-0 group-hover:opacity-100 text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244]'
                                  }`}
                                  title={`Copy cell value`}
                                >
                                  {isCellCopied ? <Check size={11} className="text-[#a6e3a1]" /> : <Copy size={11} />}
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Raw View */}
        {tab === 'raw' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#9399b2] pb-1 border-b border-[#313244]">
              <span>Raw Response Content ({response.data.length} characters)</span>
              <button
                onClick={() => handleCopy(response.data, 'raw-all')}
                className="flex items-center gap-1 text-[11px] text-[#89b4fa] hover:underline"
              >
                {copiedKey === 'raw-all' ? <Check size={11} /> : <Copy size={11} />}
                <span>Copy Raw</span>
              </button>
            </div>
            <pre className="p-3 bg-[#11111b] border border-[#313244] rounded-xl font-mono text-xs text-[#cdd6f4] leading-relaxed break-all whitespace-pre-wrap selection:bg-[#89b4fa]/30">
              {response.data}
            </pre>
          </div>
        )}

        {/* 5. Headers View */}
        {tab === 'headers' && (
          <div className="border border-[#313244] rounded-xl overflow-hidden divide-y divide-[#313244] bg-[#181825]">
            {Object.entries(response.headers).length === 0 ? (
              <div className="p-4 text-center text-xs text-[#6c7086] italic">
                No response headers returned
              </div>
            ) : (
              Object.entries(response.headers).map(([k, v]) => {
                const isValCopied = copiedKey === `hdr-val-${k}`;
                const isKeyCopied = copiedKey === `hdr-key-${k}`;

                return (
                  <div
                    key={k}
                    className="flex items-center justify-between px-3 py-2 text-xs font-mono group hover:bg-[#11111b] transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#89b4fa] font-bold">{k}</span>
                      <button
                        onClick={() => handleCopy(k, `hdr-key-${k}`)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-[#6c7086] hover:text-[#89b4fa]"
                        title={`Copy header name "${k}"`}
                      >
                        {isKeyCopied ? <Check size={10} className="text-[#a6e3a1]" /> : <Copy size={10} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 max-w-md">
                      <span className="text-[#cdd6f4] truncate font-mono">{v}</span>
                      <button
                        onClick={() => handleCopy(v, `hdr-val-${k}`)}
                        className={`p-1 rounded transition-all shrink-0 ${
                          isValCopied
                            ? 'bg-[#a6e3a1]/20 text-[#a6e3a1]'
                            : 'opacity-0 group-hover:opacity-100 text-[#6c7086] hover:text-[#89b4fa] hover:bg-[#313244]'
                        }`}
                        title="Copy header value"
                      >
                        {isValCopied ? <Check size={11} className="text-[#a6e3a1]" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
