import HarJsonResponseViewer from './HarJsonResponseViewer';
import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  Search,
  Download,
  Copy,
  Check,
  X,
  RefreshCw,
  Globe,
} from 'lucide-react';

export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    queryString: { name: string; value: string }[];
    cookies: { name: string; value: string }[];
    headersSize: number;
    bodySize: number;
    postData?: {
      mimeType: string;
      text?: string;
      params?: { name: string; value: string }[];
    };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: { name: string; value: string }[];
    cookies: { name: string; value: string }[];
    content: {
      size: number;
      mimeType: string;
      text?: string;
      encoding?: string;
    };
    headersSize: number;
    bodySize: number;
  };
  timings: {
    blocked?: number;
    dns?: number;
    connect?: number;
    ssl?: number;
    send?: number;
    wait: number;
    receive: number;
  };
  serverIPAddress?: string;
  connection?: string;
}

export interface HarData {
  log: {
    version: string;
    creator: { name: string; version: string };
    entries: HarEntry[];
  };
}

// Sample HAR file for quick testing without needing an existing HAR
const SAMPLE_HAR: HarData = {
  log: {
    version: '1.2',
    creator: { name: 'PSDevTool Browser Engine', version: '2.0' },
    entries: [
      {
        startedDateTime: '2026-10-26T12:00:00.100Z',
        time: 145,
        request: {
          method: 'GET',
          url: 'https://api.psdevtool.online/v1/auth/session',
          httpVersion: 'HTTP/2.0',
          headers: [
            { name: 'accept', value: 'application/json, text/plain, */*' },
            { name: 'authorization', value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample_token' },
            { name: 'user-agent', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
            { name: 'referer', value: 'https://psdevtool.online/' },
          ],
          queryString: [{ name: 'tenantId', value: 'dev-workspace-01' }],
          cookies: [{ name: 'ps_session_id', value: 'sess_994821a8' }],
          headersSize: 420,
          bodySize: 0,
        },
        response: {
          status: 200,
          statusText: 'OK',
          httpVersion: 'HTTP/2.0',
          headers: [
            { name: 'content-type', value: 'application/json; charset=utf-8' },
            { name: 'cache-control', value: 'no-store, max-age=0' },
            { name: 'x-request-id', value: 'req_88f91c3e' },
          ],
          cookies: [],
          content: {
            size: 324,
            mimeType: 'application/json',
            text: JSON.stringify({
              status: 'authenticated',
              user: { id: 'usr_4401', name: 'Alex Rivera', role: 'admin', email: 'alex@example.com' },
              permissions: ['read', 'write', 'export', 'admin'],
              plan: 'enterprise',
            }, null, 2),
          },
          headersSize: 280,
          bodySize: 324,
        },
        timings: { blocked: 2, dns: 12, connect: 24, ssl: 18, send: 1, wait: 68, receive: 20 },
      },
      {
        startedDateTime: '2026-10-26T12:00:00.260Z',
        time: 210,
        request: {
          method: 'POST',
          url: 'https://api.psdevtool.online/v1/documents/convert',
          httpVersion: 'HTTP/2.0',
          headers: [
            { name: 'content-type', value: 'application/json' },
            { name: 'accept', value: 'application/json' },
          ],
          queryString: [],
          cookies: [],
          headersSize: 310,
          bodySize: 180,
          postData: {
            mimeType: 'application/json',
            text: JSON.stringify({ filename: 'Quarterly_Report_2026.docx', outputFormat: 'pdf', preserveVectors: true }, null, 2),
          },
        },
        response: {
          status: 201,
          statusText: 'Created',
          httpVersion: 'HTTP/2.0',
          headers: [
            { name: 'content-type', value: 'application/json' },
            { name: 'x-processing-time-ms', value: '184' },
          ],
          cookies: [],
          content: {
            size: 198,
            mimeType: 'application/json',
            text: JSON.stringify({ id: 'job_docx_99182', status: 'completed', pages: 14, outputUrl: 'https://cdn.psdevtool.online/pdf/output_99182.pdf' }, null, 2),
          },
          headersSize: 210,
          bodySize: 198,
        },
        timings: { blocked: 1, dns: 0, connect: 0, ssl: 0, send: 4, wait: 190, receive: 15 },
      },
      {
        startedDateTime: '2026-10-26T12:00:00.500Z',
        time: 84,
        request: {
          method: 'GET',
          url: 'https://psdevtool.online/assets/vendor.monaco.js',
          httpVersion: 'HTTP/2.0',
          headers: [{ name: 'accept', value: '*/*' }],
          queryString: [{ name: 'v', value: '0.55.1' }],
          cookies: [],
          headersSize: 180,
          bodySize: 0,
        },
        response: {
          status: 304,
          statusText: 'Not Modified',
          httpVersion: 'HTTP/2.0',
          headers: [
            { name: 'cache-control', value: 'public, max-age=31536000, immutable' },
            { name: 'etag', value: '"d891b2c-901"' },
          ],
          cookies: [],
          content: {
            size: 0,
            mimeType: 'application/javascript',
            text: '/* [Cached Monaco Bundle] */',
          },
          headersSize: 140,
          bodySize: 0,
        },
        timings: { blocked: 1, dns: 0, connect: 0, ssl: 0, send: 1, wait: 79, receive: 3 },
      },
      {
        startedDateTime: '2026-10-26T12:00:00.610Z',
        time: 340,
        request: {
          method: 'GET',
          url: 'https://api.psdevtool.online/v1/metrics/realtime',
          httpVersion: 'HTTP/2.0',
          headers: [{ name: 'accept', value: 'application/json' }],
          queryString: [],
          cookies: [],
          headersSize: 220,
          bodySize: 0,
        },
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          httpVersion: 'HTTP/2.0',
          headers: [
            { name: 'content-type', value: 'application/json' },
            { name: 'x-error-code', value: 'DB_CONNECTION_TIMEOUT' },
          ],
          cookies: [],
          content: {
            size: 142,
            mimeType: 'application/json',
            text: JSON.stringify({ error: 'Database replica synchronization delay', code: 500, timestamp: '2026-10-26T12:00:00.950Z' }, null, 2),
          },
          headersSize: 180,
          bodySize: 142,
        },
        timings: { blocked: 3, dns: 5, connect: 22, ssl: 19, send: 2, wait: 280, receive: 9 },
      },
      {
        startedDateTime: '2026-10-26T12:00:00.980Z',
        time: 65,
        request: {
          method: 'GET',
          url: 'https://psdevtool.online/favicon.svg',
          httpVersion: 'HTTP/2.0',
          headers: [{ name: 'accept', value: 'image/svg+xml,*/*' }],
          queryString: [],
          cookies: [],
          headersSize: 160,
          bodySize: 0,
        },
        response: {
          status: 200,
          statusText: 'OK',
          httpVersion: 'HTTP/2.0',
          headers: [
            { name: 'content-type', value: 'image/svg+xml' },
            { name: 'cache-control', value: 'public, max-age=86400' },
          ],
          cookies: [],
          content: {
            size: 9522,
            mimeType: 'image/svg+xml',
            text: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="46" fill="none"><path fill="#863bff" d="M25.../></svg>',
          },
          headersSize: 170,
          bodySize: 9522,
        },
        timings: { blocked: 1, dns: 0, connect: 0, ssl: 0, send: 1, wait: 50, receive: 13 },
      },
    ],
  },
};

function formatBytes(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getMimeCategory(mimeType: string, url: string): string {
  const m = (mimeType || '').toLowerCase();
  const u = (url || '').toLowerCase();
  if (m.includes('json') || m.includes('xml') || m.includes('graphql') || u.includes('/api/')) return 'xhr';
  if (m.includes('javascript') || u.endsWith('.js') || u.includes('.js?')) return 'js';
  if (m.includes('css') || u.endsWith('.css') || u.includes('.css?')) return 'css';
  if (m.includes('image') || u.match(/\.(png|jpe?g|gif|webp|svg|ico)$/i)) return 'img';
  if (m.includes('font') || u.match(/\.(woff2?|ttf|otf|eot)$/i)) return 'font';
  if (m.includes('html') || m.includes('text/plain')) return 'doc';
  if (m.includes('audio') || m.includes('video')) return 'media';
  return 'other';
}

function getStatusColor(status: number) {
  if (status >= 200 && status < 300) return 'text-[#b5dfa3] bg-[#b5dfa3]/10 border-[#b5dfa3]/30';
  if (status >= 300 && status < 400) return 'text-[#c8edb6] bg-[#c8edb6]/10 border-[#c8edb6]/30';
  if (status >= 400 && status < 500) return 'text-[#f3d58c] bg-[#f3d58c]/10 border-[#f3d58c]/30';
  if (status >= 500) return 'text-[#f19aa6] bg-[#f19aa6]/10 border-[#f19aa6]/30';
  return 'text-[#b1bea8] bg-[#344435] border-[#71836b]';
}

function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case 'GET': return 'text-[#b5dfa3] bg-[#b5dfa3]/10 border-[#b5dfa3]/30';
    case 'POST': return 'text-[#c8edb6] bg-[#c8edb6]/10 border-[#c8edb6]/30';
    case 'PUT': return 'text-[#f3d58c] bg-[#f3d58c]/10 border-[#f3d58c]/30';
    case 'DELETE': return 'text-[#f19aa6] bg-[#f19aa6]/10 border-[#f19aa6]/30';
    case 'PATCH': return 'text-[#ceb8f6] bg-[#ceb8f6]/10 border-[#ceb8f6]/30';
    case 'OPTIONS': return 'text-[#94e2d5] bg-[#94e2d5]/10 border-[#94e2d5]/30';
    default: return 'text-[#e4ebdd] bg-[#344435] border-[#71836b]';
  }
}

export default function HarViewerView() {
  const [harData, setHarData] = useState<HarData | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<HarEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'headers' | 'payload' | 'response' | 'timing' | 'cookies'>('headers');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Parse HAR file
  const loadHarFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const parsed = JSON.parse(raw);
        if (parsed.log && Array.isArray(parsed.log.entries)) {
          setHarData(parsed);
          setSelectedEntry(parsed.log.entries[0] || null);
        } else {
          alert('Invalid HAR file: Missing log.entries structure');
        }
      } catch {
        alert('Failed to parse HAR JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadHarFile(e.dataTransfer.files[0]);
    }
  };

  // Sanitized Export: Strips tokens, cookies, auth headers for safe bug sharing
  const exportSanitizedHar = () => {
    if (!harData) return;
    const sanitized = JSON.parse(JSON.stringify(harData)) as HarData;
    sanitized.log.entries.forEach(entry => {
      entry.request.headers = entry.request.headers.map(h => {
        const name = h.name.toLowerCase();
        if (name === 'authorization' || name === 'cookie' || name === 'x-api-key' || name === 'proxy-authorization') {
          return { name: h.name, value: '[REDACTED_BY_PSDEVTOOL]' };
        }
        return h;
      });
      entry.request.cookies = entry.request.cookies.map(c => ({ name: c.name, value: '[REDACTED]' }));
      entry.response.cookies = entry.response.cookies.map(c => ({ name: c.name, value: '[REDACTED]' }));
    });
    const blob = new Blob([JSON.stringify(sanitized, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitized_${Date.now()}.har`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Overall Statistics
  const entries = harData?.log.entries || [];
  const stats = useMemo(() => {
    if (entries.length === 0) return { totalSize: 0, totalTime: 0, failedCount: 0, domains: 0 };
    let totalSize = 0;
    let totalTime = 0;
    let failedCount = 0;
    const domainSet = new Set<string>();

    entries.forEach(e => {
      totalSize += (e.response.bodySize > 0 ? e.response.bodySize : (e.response.content?.size || 0));
      totalTime = Math.max(totalTime, e.time);
      if (e.response.status >= 400) failedCount++;
      try {
        const urlObj = new URL(e.request.url);
        domainSet.add(urlObj.hostname);
      } catch { /* ignore */ }
    });

    return { totalSize, totalTime, failedCount, domains: domainSet.size };
  }, [entries]);

  // Max request time for relative waterfall calculation
  const maxTime = useMemo(() => {
    return Math.max(...entries.map(e => e.time || 1), 1);
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      // Search query (URL, status, method, mimeType)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesUrl = e.request.url.toLowerCase().includes(q);
        const matchesMethod = e.request.method.toLowerCase().includes(q);
        const matchesStatus = e.response.status.toString().includes(q);
        const matchesMime = (e.response.content.mimeType || '').toLowerCase().includes(q);
        if (!matchesUrl && !matchesMethod && !matchesStatus && !matchesMime) return false;
      }

      // Filter by resource type
      if (filterType !== 'all') {
        const cat = getMimeCategory(e.response.content.mimeType, e.request.url);
        if (cat !== filterType) return false;
      }

      // Filter by status code
      if (statusFilter !== 'all') {
        const s = e.response.status;
        if (statusFilter === '2xx' && (s < 200 || s >= 300)) return false;
        if (statusFilter === '3xx' && (s < 300 || s >= 400)) return false;
        if (statusFilter === '4xx' && (s < 400 || s >= 500)) return false;
        if (statusFilter === '5xx' && s < 500) return false;
      }

      return true;
    });
  }, [entries, searchQuery, filterType, statusFilter]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111612] text-[#e4ebdd] overflow-hidden">
      {/* Top Banner / Upload Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#171d19] border-b border-[#344435] gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#c8edb6]/10 text-[#c8edb6] border border-[#c8edb6]/20">
            <Globe size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#e4ebdd]">HAR File Viewer &amp; Network Inspector</h2>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#b5dfa3]/15 text-[#b5dfa3] font-semibold border border-[#b5dfa3]/30">
                100% Client-Side Private
              </span>
            </div>
            <p className="text-[11px] text-[#b1bea8]">
              Inspect HTTP traffic, debug API payloads, analyze TTFB waterfalls, and sanitize authorization tokens
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".har,application/json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) loadHarFile(e.target.files[0]);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c8edb6] hover:bg-[#d9f6ca] text-[#0d120f] text-xs font-semibold shadow-sm transition-all"
          >
            <Upload size={13} />
            Upload .HAR File
          </button>

          <button
            onClick={() => {
              setHarData(SAMPLE_HAR);
              setSelectedEntry(SAMPLE_HAR.log.entries[0]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#344435] hover:bg-[#71836b] text-[#e4ebdd] text-xs font-medium border border-[#71836b] transition-all"
          >
            <RefreshCw size={13} />
            Load Sample HAR
          </button>

          {harData && (
            <button
              onClick={exportSanitizedHar}
              title="Exports this HAR with tokens and cookies redacted for safe bug reports"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b5dfa3]/10 hover:bg-[#b5dfa3]/20 text-[#b5dfa3] text-xs font-medium border border-[#b5dfa3]/30 transition-all"
            >
              <Download size={13} />
              Export Sanitized
            </button>
          )}
        </div>
      </div>

      {!harData ? (
        /* Empty Upload State */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`flex-1 flex flex-col items-center justify-center p-8 m-4 rounded-2xl border-2 border-dashed transition-all ${
            isDragging ? 'border-[#c8edb6] bg-[#c8edb6]/5' : 'border-[#344435] bg-[#171d19]/60'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-[#344435] flex items-center justify-center text-[#c8edb6] mb-4 shadow-inner">
            <Upload size={32} />
          </div>
          <h3 className="text-lg font-bold text-[#e4ebdd] mb-1">Drop your HTTP Archive (.har) file here</h3>
          <p className="text-xs text-[#b1bea8] text-center max-w-md mb-6">
            Inspect network calls exported from Chrome, Firefox, Edge, Safari DevTools, or Charles Proxy. All analysis runs locally in your browser.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-[#c8edb6] hover:bg-[#d9f6ca] text-[#0d120f] text-xs font-bold transition-all shadow-md"
            >
              Select HAR File
            </button>
            <span className="text-xs text-[#899980]">or</span>
            <button
              onClick={() => {
                setHarData(SAMPLE_HAR);
                setSelectedEntry(SAMPLE_HAR.log.entries[0]);
              }}
              className="px-4 py-2 rounded-xl bg-[#344435] hover:bg-[#71836b] text-[#e4ebdd] text-xs font-medium border border-[#71836b] transition-all"
            >
              Try with Sample HAR Data
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl w-full text-center">
            <div className="p-3 rounded-xl bg-[#111612] border border-[#344435]">
              <div className="text-xs font-bold text-[#c8edb6] mb-0.5">Waterfall Timeline</div>
              <div className="text-[11px] text-[#b1bea8]">DNS, SSL, Connect, and TTFB latencies</div>
            </div>
            <div className="p-3 rounded-xl bg-[#111612] border border-[#344435]">
              <div className="text-xs font-bold text-[#b5dfa3] mb-0.5">Payload &amp; Headers</div>
              <div className="text-[11px] text-[#b1bea8]">Inspect formatted JSON POST bodies &amp; params</div>
            </div>
            <div className="p-3 rounded-xl bg-[#111612] border border-[#344435]">
              <div className="text-xs font-bold text-[#f19aa6] mb-0.5">Privacy Sanitizer</div>
              <div className="text-[11px] text-[#b1bea8]">Scrub Bearer tokens before sharing logs</div>
            </div>
          </div>
        </div>
      ) : (
        /* HAR Loaded Workspace */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Metrics summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-4 py-2 bg-[#111612] border-b border-[#2b382c] text-xs shrink-0">
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#171d19] border border-[#344435]">
              <span className="text-[#b1bea8]">Requests:</span>
              <span className="font-bold text-[#e4ebdd]">{entries.length}</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#171d19] border border-[#344435]">
              <span className="text-[#b1bea8]">Transferred:</span>
              <span className="font-bold text-[#c8edb6]">{formatBytes(stats.totalSize)}</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#171d19] border border-[#344435]">
              <span className="text-[#b1bea8]">Duration:</span>
              <span className="font-bold text-[#f3d58c]">{Math.round(stats.totalTime)} ms</span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#171d19] border border-[#344435]">
              <span className="text-[#b1bea8]">Failed:</span>
              <span className={`font-bold ${stats.failedCount > 0 ? 'text-[#f19aa6]' : 'text-[#b5dfa3]'}`}>
                {stats.failedCount}
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#171d19] border border-[#344435]">
              <span className="text-[#b1bea8]">Domains:</span>
              <span className="font-bold text-[#ceb8f6]">{stats.domains}</span>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#171d19] border-b border-[#344435] gap-2 flex-wrap shrink-0">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search size={14} className="absolute left-2.5 top-2 text-[#9eac96]" />
              <input
                type="text"
                placeholder="Filter by URL, method, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-[#111612] border border-[#344435] rounded-lg text-xs text-[#e4ebdd] focus:outline-none focus:border-[#c8edb6]"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1.5 text-[#9eac96] hover:text-[#e4ebdd]">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Type filters */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'All' },
                { id: 'xhr', label: 'Fetch/XHR' },
                { id: 'js', label: 'JS' },
                { id: 'css', label: 'CSS' },
                { id: 'img', label: 'Img' },
                { id: 'doc', label: 'Doc' },
                { id: 'font', label: 'Font' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setFilterType(t.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    filterType === t.id
                      ? 'bg-[#c8edb6] text-[#0d120f] font-bold'
                      : 'text-[#b1bea8] hover:bg-[#344435] hover:text-[#e4ebdd]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Status filters */}
            <div className="flex items-center gap-1 text-xs">
              {['all', '2xx', '3xx', '4xx', '5xx'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2 py-0.5 rounded text-[11px] uppercase transition-all ${
                    statusFilter === s
                      ? 'bg-[#ceb8f6] text-[#0d120f] font-bold'
                      : 'text-[#9eac96] hover:text-[#e4ebdd]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Main Master-Detail Split Pane */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Request Table (Left) */}
            <div className={`flex flex-col border-r border-[#344435] overflow-hidden ${selectedEntry ? 'w-full lg:w-1/2' : 'w-full'}`}>
              <div className="flex items-center px-3 py-1.5 bg-[#111612] border-b border-[#2b382c] text-[10px] font-bold uppercase tracking-wider text-[#9eac96] shrink-0">
                <span className="w-16">Method</span>
                <span className="w-12">Status</span>
                <span className="flex-1 px-2">Path / Domain</span>
                <span className="w-16 text-right">Size</span>
                <span className="w-16 text-right">Time</span>
                <span className="w-24 text-right pr-2">Waterfall</span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#2b382c]">
                {filteredEntries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#9eac96]">
                    No requests match your search criteria.
                  </div>
                ) : (
                  filteredEntries.map((entry, idx) => {
                    const isSelected = selectedEntry === entry;
                    const urlObj = (() => {
                      try { return new URL(entry.request.url); }
                      catch { return { pathname: entry.request.url, hostname: '' }; }
                    })();
                    const pathDisplay = urlObj.pathname.split('/').pop() || urlObj.pathname || '/';
                    const relativeWidth = Math.max((entry.time / maxTime) * 100, 4);

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedEntry(entry)}
                        className={`flex items-center px-3 py-2 text-xs cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#c8edb6]/15 text-[#e4ebdd]' : 'hover:bg-[#171d19]'
                        }`}
                      >
                        {/* Method */}
                        <span className="w-16 shrink-0">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getMethodColor(entry.request.method)}`}>
                            {entry.request.method}
                          </span>
                        </span>

                        {/* Status */}
                        <span className="w-12 shrink-0">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(entry.response.status)}`}>
                            {entry.response.status || 'ERR'}
                          </span>
                        </span>

                        {/* Name & Host */}
                        <div className="flex-1 px-2 min-w-0">
                          <div className="truncate font-medium text-[#e4ebdd]" title={entry.request.url}>
                            {pathDisplay}
                          </div>
                          <div className="truncate text-[10px] text-[#9eac96]">
                            {urlObj.hostname}
                          </div>
                        </div>

                        {/* Size */}
                        <span className="w-16 text-right text-[11px] text-[#c3ceba] shrink-0">
                          {formatBytes(entry.response.bodySize || entry.response.content.size)}
                        </span>

                        {/* Time */}
                        <span className="w-16 text-right text-[11px] text-[#c3ceba] shrink-0 font-mono">
                          {Math.round(entry.time)}ms
                        </span>

                        {/* Mini Waterfall */}
                        <div className="w-24 pl-2 shrink-0">
                          <div className="w-full bg-[#344435] h-2 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-gradient-to-r from-[#c8edb6] to-[#b5dfa3] rounded-full"
                              style={{ width: `${relativeWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Inspector Details Panel (Right) */}
            {selectedEntry && (
              <div className="hidden lg:flex flex-1 flex-col bg-[#171d19] min-w-0 overflow-hidden">
                {/* Header bar of selected request */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#111612] border-b border-[#344435] shrink-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getMethodColor(selectedEntry.request.method)}`}>
                      {selectedEntry.request.method}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusColor(selectedEntry.response.status)}`}>
                      {selectedEntry.response.status} {selectedEntry.response.statusText}
                    </span>
                    <span className="truncate text-xs font-mono text-[#e4ebdd]" title={selectedEntry.request.url}>
                      {selectedEntry.request.url}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(selectedEntry.request.url, 'url')}
                      className="p-1.5 rounded hover:bg-[#344435] text-[#b1bea8] hover:text-[#e4ebdd]"
                      title="Copy URL"
                    >
                      {copiedKey === 'url' ? <Check size={14} className="text-[#b5dfa3]" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => setSelectedEntry(null)}
                      className="p-1.5 rounded hover:bg-[#344435] text-[#b1bea8] hover:text-[#e4ebdd]"
                      title="Close details"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center px-4 bg-[#171d19] border-b border-[#344435] gap-1 text-xs shrink-0">
                  {[
                    { id: 'headers', label: `Headers (${selectedEntry.request.headers.length + selectedEntry.response.headers.length})` },
                    { id: 'payload', label: `Payload (${selectedEntry.request.queryString.length + (selectedEntry.request.postData ? 1 : 0)})` },
                    { id: 'response', label: 'Response Body' },
                    { id: 'timing', label: 'Waterfall Timing' },
                    { id: 'cookies', label: `Cookies (${selectedEntry.request.cookies.length + selectedEntry.response.cookies.length})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-2 border-b-2 font-medium text-xs transition-all ${
                        activeTab === tab.id
                          ? 'border-[#c8edb6] text-[#c8edb6] font-bold'
                          : 'border-transparent text-[#b1bea8] hover:text-[#e4ebdd]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div className="flex-1 overflow-y-auto p-4 text-xs font-mono">
                  {/* TAB: HEADERS */}
                  {activeTab === 'headers' && (
                    <div className="space-y-6">
                      {/* General */}
                      <div>
                        <div className="text-[11px] font-bold text-[#c8edb6] uppercase tracking-wider mb-2 font-sans flex items-center justify-between">
                          <span>General</span>
                          <span className="text-[10px] text-[#9eac96] font-normal">HTTP {selectedEntry.request.httpVersion}</span>
                        </div>
                        <div className="bg-[#111612] rounded-xl border border-[#344435] p-3 space-y-1.5">
                          <div className="flex gap-2">
                            <span className="text-[#b1bea8] w-28 shrink-0">Request URL:</span>
                            <span className="text-[#e4ebdd] break-all">{selectedEntry.request.url}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-[#b1bea8] w-28 shrink-0">Request Method:</span>
                            <span className="text-[#e4ebdd] font-bold">{selectedEntry.request.method}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-[#b1bea8] w-28 shrink-0">Status Code:</span>
                            <span className="text-[#e4ebdd]">{selectedEntry.response.status} {selectedEntry.response.statusText}</span>
                          </div>
                          {selectedEntry.serverIPAddress && (
                            <div className="flex gap-2">
                              <span className="text-[#b1bea8] w-28 shrink-0">Remote Address:</span>
                              <span className="text-[#e4ebdd]">{selectedEntry.serverIPAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Response Headers */}
                      <div>
                        <div className="text-[11px] font-bold text-[#b5dfa3] uppercase tracking-wider mb-2 font-sans flex items-center justify-between">
                          <span>Response Headers ({selectedEntry.response.headers.length})</span>
                          <button
                            onClick={() => handleCopy(JSON.stringify(selectedEntry.response.headers, null, 2), 'res-headers')}
                            className="text-[10px] text-[#c8edb6] hover:underline flex items-center gap-1 font-sans"
                          >
                            {copiedKey === 'res-headers' ? <Check size={10} /> : <Copy size={10} />} Copy All
                          </button>
                        </div>
                        <div className="bg-[#111612] rounded-xl border border-[#344435] divide-y divide-[#2b382c]">
                          {selectedEntry.response.headers.map((h, i) => (
                            <div key={i} className="flex px-3 py-1.5 gap-2 hover:bg-[#171d19]">
                              <span className="text-[#c8edb6] font-bold w-44 shrink-0 break-all">{h.name}:</span>
                              <span className="text-[#e4ebdd] break-all flex-1">{h.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Request Headers */}
                      <div>
                        <div className="text-[11px] font-bold text-[#f3d58c] uppercase tracking-wider mb-2 font-sans flex items-center justify-between">
                          <span>Request Headers ({selectedEntry.request.headers.length})</span>
                          <button
                            onClick={() => handleCopy(JSON.stringify(selectedEntry.request.headers, null, 2), 'req-headers')}
                            className="text-[10px] text-[#c8edb6] hover:underline flex items-center gap-1 font-sans"
                          >
                            {copiedKey === 'req-headers' ? <Check size={10} /> : <Copy size={10} />} Copy All
                          </button>
                        </div>
                        <div className="bg-[#111612] rounded-xl border border-[#344435] divide-y divide-[#2b382c]">
                          {selectedEntry.request.headers.map((h, i) => (
                            <div key={i} className="flex px-3 py-1.5 gap-2 hover:bg-[#171d19]">
                              <span className="text-[#f3d58c] font-bold w-44 shrink-0 break-all">{h.name}:</span>
                              <span className="text-[#e4ebdd] break-all flex-1">{h.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: PAYLOAD */}
                  {activeTab === 'payload' && (
                    <div className="space-y-6">
                      {/* Query Parameters */}
                      <div>
                        <div className="text-[11px] font-bold text-[#c8edb6] uppercase tracking-wider mb-2 font-sans">
                          Query String Parameters ({selectedEntry.request.queryString.length})
                        </div>
                        {selectedEntry.request.queryString.length === 0 ? (
                          <div className="text-[#9eac96] text-xs italic">No query parameters for this request.</div>
                        ) : (
                          <div className="bg-[#111612] rounded-xl border border-[#344435] divide-y divide-[#2b382c]">
                            {selectedEntry.request.queryString.map((q, i) => (
                              <div key={i} className="flex px-3 py-1.5 gap-2">
                                <span className="text-[#b5dfa3] font-bold w-36 shrink-0">{q.name}:</span>
                                <span className="text-[#e4ebdd] break-all">{q.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Request Body / Post Data */}
                      <div>
                        <div className="text-[11px] font-bold text-[#ceb8f6] uppercase tracking-wider mb-2 font-sans flex items-center justify-between">
                          <span>Request Payload ({selectedEntry.request.postData?.mimeType || 'None'})</span>
                          {selectedEntry.request.postData?.text && (
                            <button
                              onClick={() => handleCopy(selectedEntry.request.postData?.text || '', 'payload')}
                              className="text-[10px] text-[#c8edb6] hover:underline flex items-center gap-1 font-sans"
                            >
                              {copiedKey === 'payload' ? <Check size={10} /> : <Copy size={10} />} Copy Body
                            </button>
                          )}
                        </div>

                        {!selectedEntry.request.postData?.text ? (
                          <div className="text-[#9eac96] text-xs italic">No POST/PUT request payload.</div>
                        ) : (
                          <pre className="p-3 bg-[#111612] rounded-xl border border-[#344435] text-[#b5dfa3] text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {selectedEntry.request.postData.text}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: RESPONSE BODY */}
                  {activeTab === 'response' && (
                    <HarJsonResponseViewer
                      responseText={selectedEntry.response.content.text}
                      mimeType={selectedEntry.response.content.mimeType}
                      size={selectedEntry.response.content.size}
                    />
                  )}

                  {/* TAB: WATERFALL TIMING */}
                  {activeTab === 'timing' && (
                    <div className="space-y-4 font-sans">
                      <div className="text-[11px] font-bold text-[#c8edb6] uppercase tracking-wider mb-2">
                        Timing Breakdown • Total: {Math.round(selectedEntry.time)} ms
                      </div>

                      <div className="bg-[#111612] rounded-xl border border-[#344435] p-4 space-y-3">
                        {[
                          { label: 'Blocked / Queueing', value: selectedEntry.timings.blocked, color: '#9eac96' },
                          { label: 'DNS Lookup', value: selectedEntry.timings.dns, color: '#f3c18e' },
                          { label: 'Initial Connection', value: selectedEntry.timings.connect, color: '#f3d58c' },
                          { label: 'SSL / TLS Handshake', value: selectedEntry.timings.ssl, color: '#ceb8f6' },
                          { label: 'Request Sent', value: selectedEntry.timings.send, color: '#c8edb6' },
                          { label: 'Waiting (TTFB - Time to First Byte)', value: selectedEntry.timings.wait, color: '#b5dfa3' },
                          { label: 'Content Download', value: selectedEntry.timings.receive, color: '#94e2d5' },
                        ].map((t, i) => {
                          if (t.value === undefined || t.value < 0) return null;
                          const percent = Math.min(Math.round((t.value / (selectedEntry.time || 1)) * 100), 100);
                          return (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-[#e4ebdd] flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: t.color }} />
                                  {t.label}
                                </span>
                                <span className="font-mono text-[#c3ceba]">{Math.round(t.value)} ms ({percent}%)</span>
                              </div>
                              <div className="w-full h-2 bg-[#344435] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: t.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* TAB: COOKIES */}
                  {activeTab === 'cookies' && (
                    <div className="space-y-6">
                      <div>
                        <div className="text-[11px] font-bold text-[#c8edb6] uppercase tracking-wider mb-2 font-sans">
                          Request Cookies ({selectedEntry.request.cookies.length})
                        </div>
                        {selectedEntry.request.cookies.length === 0 ? (
                          <div className="text-[#9eac96] text-xs italic">No request cookies.</div>
                        ) : (
                          <div className="bg-[#111612] rounded-xl border border-[#344435] divide-y divide-[#2b382c]">
                            {selectedEntry.request.cookies.map((c, i) => (
                              <div key={i} className="flex px-3 py-1.5 gap-2">
                                <span className="text-[#c8edb6] font-bold w-40 shrink-0">{c.name}:</span>
                                <span className="text-[#e4ebdd] break-all">{c.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-[11px] font-bold text-[#b5dfa3] uppercase tracking-wider mb-2 font-sans">
                          Response Cookies ({selectedEntry.response.cookies.length})
                        </div>
                        {selectedEntry.response.cookies.length === 0 ? (
                          <div className="text-[#9eac96] text-xs italic">No response cookies received.</div>
                        ) : (
                          <div className="bg-[#111612] rounded-xl border border-[#344435] divide-y divide-[#2b382c]">
                            {selectedEntry.response.cookies.map((c, i) => (
                              <div key={i} className="flex px-3 py-1.5 gap-2">
                                <span className="text-[#b5dfa3] font-bold w-40 shrink-0">{c.name}:</span>
                                <span className="text-[#e4ebdd] break-all">{c.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
