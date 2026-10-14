import { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Braces, Copy, Download, Eye, FileCode2, WandSparkles } from 'lucide-react';
import { parseXml } from '../../utils/jsonXml';

type MarkupMode = 'html' | 'xml' | 'sql';

const DEFAULT_SOURCES: Record<MarkupMode, string> = {
  html: '<main><h1>Hello, developer</h1><p>Preview runs in a sandbox.</p></main>',
  xml: '<catalog><book id="1"><title>Example</title></book></catalog>',
  sql: 'select id, name from users where active = true order by name;',
};

const SQL_DIALECTS = [
  'sql', 'postgresql', 'mysql', 'mariadb', 'sqlite', 'transactsql', 'bigquery', 'snowflake', 'redshift', 'plsql', 'clickhouse', 'db2', 'duckdb', 'trino',
] as const;

function collectXmlPaths(element: Element, path = 'root', paths = new Set<string>()) {
  const children = [...element.children];
  if (children.length) paths.add(path);
  children.forEach((child, index) => collectXmlPaths(child, `${path}/${child.tagName}[${index}]`, paths));
  return paths;
}

function XmlTreeNode({ element, path, depth = 0, expandedPaths, onToggle }: {
  element: Element;
  path: string;
  depth?: number;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
}) {
  const children = [...element.children];
  const expanded = expandedPaths.has(path);
  const text = [...element.childNodes]
    .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE)
    .map(node => node.nodeValue?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
  const expandable = children.length > 0;

  return (
    <div className="font-mono text-[11px]" style={{ paddingLeft: depth * 14 }}>
      <div className="flex min-h-7 items-center gap-1.5">
        {expandable ? <button onClick={() => onToggle(path)} aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Expand'} ${element.tagName}`} className="flex h-5 w-5 items-center justify-center text-[#9399b2]"><span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span></button> : <span className="w-5" />}
        <span className="text-[#6c7086]">&lt;</span><span className="text-[#89b4fa]">{element.tagName}</span>
        {[...element.attributes].map(attribute => <span key={attribute.name} className="whitespace-nowrap"><span className="ml-1 text-[#f9e2af]">{attribute.name}</span><span className="text-[#9399b2]">=</span><span className="text-[#a6e3a1]">"{attribute.value}"</span></span>)}
        {expandable ? expanded ? <span className="text-[#6c7086]">&gt;</span> : <><span className="text-[#6c7086]">&gt; … &lt;/</span><span className="text-[#89b4fa]">{element.tagName}</span><span className="text-[#6c7086]">&gt;</span><span className="rounded bg-[#313244] px-1.5 text-[10px] text-[#9399b2]">{children.length}</span></>
          : <><span className="text-[#6c7086]">&gt;</span><span className="truncate text-[#cdd6f4]">{text}</span><span className="ml-1 text-[#6c7086]">&lt;/</span><span className="text-[#89b4fa]">{element.tagName}</span><span className="text-[#6c7086]">&gt;</span></>}
      </div>
      {expandable && expanded && <div className="border-l border-[#45475a]/60">{children.map((child, index) => <XmlTreeNode key={`${child.tagName}-${index}`} element={child} path={`${path}/${child.tagName}[${index}]`} depth={depth + 1} expandedPaths={expandedPaths} onToggle={onToggle} />)}<div className="min-h-7 pl-3"><span className="text-[#6c7086]">&lt;/</span><span className="text-[#89b4fa]">{element.tagName}</span><span className="text-[#6c7086]">&gt;</span></div></div>}
    </div>
  );
}

function downloadText(text: string, filename: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function MarkupStudioView() {
  const [mode, setMode] = useState<MarkupMode>('html');
  const [sources, setSources] = useState(DEFAULT_SOURCES);
  const [dialect, setDialect] = useState<(typeof SQL_DIALECTS)[number]>('sql');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [xmlExpandedPaths, setXmlExpandedPaths] = useState<Set<string>>(() => new Set(['root']));
  const source = sources[mode];
  const xmlResult = mode === 'xml' ? parseXml(source) : null;
  const htmlParserResult = mode === 'html';
  const xmlRoot = mode === 'xml' && !xmlResult?.error ? new DOMParser().parseFromString(source, 'application/xml').documentElement : null;

  const toggleXmlPath = (path: string) => setXmlExpandedPaths(current => {
    const next = new Set(current);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    return next;
  });

  const updateSource = (value: string) => {
    setSources(current => ({ ...current, [mode]: value }));
    setError('');
    setStatus('');
    if (mode === 'xml') setXmlExpandedPaths(new Set(['root']));
  };

  const formatSource = async () => {
    try {
      let formatted: string;
      if (mode === 'sql') {
        const { format } = await import('sql-formatter');
        formatted = format(source, { language: dialect, keywordCase: 'upper', tabWidth: 2 });
      } else if (mode === 'xml') {
        const xmlFormatter = await import('xml-formatter');
        formatted = xmlFormatter.default(source, { indentation: '  ' });
      } else {
        const [prettier, plugin] = await Promise.all([
          import('prettier/standalone'),
          import('prettier/plugins/html'),
        ]);
        formatted = await prettier.format(source, { parser: 'html', plugins: [plugin.default], printWidth: 88, tabWidth: 2 });
      }
      setSources(current => ({ ...current, [mode]: formatted }));
      setError('');
      setStatus('Formatted successfully.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not format this input.');
      setStatus('');
    }
  };

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setStatus('Copied to clipboard.');
    } catch {
      setError('Clipboard access is unavailable in this browser context.');
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-2.5">
        <div>
          <h1 className="text-sm font-semibold">Markup Studio</h1>
          <p className="mt-0.5 text-[11px] text-[#6c7086]">Format markup and SQL, inspect XML, and safely preview HTML.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {mode === 'sql' && <select aria-label="SQL dialect" value={dialect} onChange={event => setDialect(event.target.value as (typeof SQL_DIALECTS)[number])} className="h-8 rounded-md border border-[#313244] bg-[#1a1a2c] px-2 text-[11px] text-[#cdd6f4]">{SQL_DIALECTS.map(item => <option key={item} value={item}>{item}</option>)}</select>}
          <button onClick={() => void formatSource()} className="flex items-center gap-1.5 rounded-md border border-[#89b4fa]/30 bg-[#89b4fa]/10 px-2.5 py-1.5 text-[11px] text-[#89b4fa] hover:bg-[#89b4fa]/15"><WandSparkles size={12} />Format</button>
          <button onClick={() => void copySource()} title="Copy source" aria-label="Copy source" className="rounded-md border border-[#313244] p-2 text-[#9399b2] hover:text-[#cdd6f4]"><Copy size={12} /></button>
          <button onClick={() => downloadText(source, `document.${mode}`, mode === 'html' ? 'text/html' : mode === 'xml' ? 'application/xml' : 'text/plain')} title="Download source" aria-label="Download source" className="rounded-md border border-[#313244] p-2 text-[#9399b2] hover:text-[#cdd6f4]"><Download size={12} /></button>
        </div>
      </header>

      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#313244] px-4 py-2">
        <div className="flex gap-1 rounded-md border border-[#313244] p-0.5" role="tablist" aria-label="Markup language">
          {(['html', 'xml', 'sql'] as const).map(item => <button key={item} onClick={() => { setMode(item); setError(''); setStatus(''); if (item === 'xml') setXmlExpandedPaths(new Set(['root'])); }} role="tab" aria-selected={mode === item} className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] uppercase ${mode === item ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086] hover:text-[#cdd6f4]'}`}><FileCode2 size={12} />{item}</button>)}
        </div>
        <div className="min-w-0 truncate text-right text-[10px]" aria-live="polite">
          {error ? <span className="text-[#f38ba8]">{error}</span> : status ? <span className="text-[#a6e3a1]">{status}</span> : mode === 'xml' ? xmlResult?.error ? <span className="text-[#f38ba8]">Invalid XML: {xmlResult.error}</span> : <span className="text-[#a6e3a1]">Valid XML</span> : mode === 'html' && htmlParserResult ? <span className="text-[#6c7086]">HTML preview is sandboxed</span> : <span className="text-[#6c7086]">Ready</span>}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
        <div className="flex min-h-0 flex-col border-b border-[#313244] md:border-b-0 md:border-r">
          <span className="shrink-0 px-4 py-2 text-[11px] text-[#9399b2]">{mode.toUpperCase()} source</span>
          <div className="min-h-0 flex-1">
            <MonacoEditor height="100%" language={mode} theme="vs-dark" value={source} onChange={value => updateSource(value ?? '')}
              options={{ automaticLayout: true, minimap: { enabled: false }, folding: true, showFoldingControls: 'always', lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on', fontSize: 12, padding: { top: 10, bottom: 10 }, tabSize: 2 }} />
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] text-[#9399b2]">
            <span className="flex items-center gap-2">{mode === 'html' ? <><Eye size={12} />Sandboxed preview</> : mode === 'xml' ? <><Braces size={12} />XML tree</> : <><FileCode2 size={12} />SQL source preview</>}</span>
            {mode === 'xml' && xmlRoot && <span className="flex gap-1"><button onClick={() => setXmlExpandedPaths(collectXmlPaths(xmlRoot))} className="rounded border border-[#313244] px-2 py-1 text-[10px] text-[#9399b2] hover:text-[#cdd6f4]">Expand all</button><button onClick={() => setXmlExpandedPaths(new Set())} className="rounded border border-[#313244] px-2 py-1 text-[10px] text-[#9399b2] hover:text-[#cdd6f4]">Collapse all</button></span>}
          </div>
          {mode === 'html' ? <iframe title="HTML preview" sandbox="" srcDoc={source} className="min-h-0 flex-1 bg-white" />
            : mode === 'xml' ? <div className="min-h-0 flex-1 overflow-auto bg-[#1a1a2c] p-3">{xmlResult?.value !== undefined && !xmlResult.error
              ? <XmlTreeNode element={xmlRoot!} path="root" expandedPaths={xmlExpandedPaths} onToggle={toggleXmlPath} />
              : <p className="text-xs text-[#6c7086]">Fix the XML syntax to see its tree.</p>}</div>
              : <pre className="min-h-0 flex-1 overflow-auto bg-[#1a1a2c] px-4 py-3 font-mono text-[12px] leading-6 text-[#a6e3a1]">{source || 'Formatted SQL will appear here.'}</pre>}
        </div>
      </div>
    </section>
  );
}