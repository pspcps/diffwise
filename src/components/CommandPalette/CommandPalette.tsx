import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  FileCode2,
  Braces,
  Clock3,
  Image as ImageIcon,
  Regex,
  Network,
  Layers,
  Crop,
  KeyRound,
  Fingerprint,
  Globe,
  CaseSensitive,
  Link2,
  X,
  UserRound,
  Send,
  Bug,
  Compass,
} from 'lucide-react';
import type { ViewMode } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (mode: ViewMode) => void;
  onPortfolio: () => void;
}

interface ToolItem {
  id: ViewMode | 'portfolio';
  name: string;
  category: string;
  keywords: string[];
  icon: React.ReactNode;
  color: string;
}

const TOOLS: ToolItem[] = [
  {
    id: 'debug',
    name: 'DebugFlow (Universal Log & Stack Trace Analyzer)',
    category: 'Network & Debugging',
    keywords: ['debug', 'debugflow', 'stacktrace', 'error', 'log', 'exception', 'stack', 'trace', 'crash', 'debugger', 'csharp', 'dotnet', 'java', 'python'],
    icon: <Bug size={16} />,
    color: '#f3c18e',
  },
  {
    id: 'distance',
    name: 'Geo Distance & Coordinate Difference Calculator',
    category: 'Calculators & Converters',
    keywords: ['distance', 'lat', 'lon', 'latitude', 'longitude', 'coordinates', 'haversine', 'vincenty', 'geodesic', 'geofence', 'gps', 'bearing', 'heading', 'miles', 'km'],
    icon: <Compass size={16} />,
    color: '#c8edb6',
  },
  {
    id: 'har',
    name: 'HAR File Viewer',
    category: 'Network & Debugging',
    keywords: ['har', 'http', 'archive', 'network', 'waterfall', 'ttfb', 'jam', 'payload', 'requests', 'cookies'],
    icon: <Globe size={16} />,
    color: '#c8edb6',
  },
  {
    id: 'api',
    name: 'ApiDesk Studio (Postman, Swagger & GraphQL)',
    category: 'Network & Debugging',
    keywords: ['postman', 'swagger', 'graphql', 'query', 'mutation', 'api', 'openapi', 'rest', 'http', 'request', 'fetch', 'curl', 'endpoints'],
    icon: <Send size={16} />,
    color: '#b5dfa3',
  },
  {
    id: 'jwt',
    name: 'JWT Debugger & Parser',
    category: 'Security & Auth',
    keywords: ['jwt', 'token', 'bearer', 'auth', 'claims', 'decode', 'signature', 'hmac', 'sha256', 'exp'],
    icon: <KeyRound size={16} />,
    color: '#f19aa6',
  },
  {
    id: 'pdf',
    name: 'Word to PDF & PDF Studio',
    category: 'Document Studio',
    keywords: ['pdf', 'word', 'docx', 'convert', 'merge', 'split', 'compress', 'print', 'vector'],
    icon: <Layers size={16} />,
    color: '#f19aa6',
  },
  {
    id: 'text',
    name: 'Diff Checker & Code Compare',
    category: 'Code & Comparison',
    keywords: ['diff', 'compare', 'code', 'text', 'merge', 'monaco', 'syntax', 'changes'],
    icon: <FileText size={16} />,
    color: '#c8edb6',
  },
  {
    id: 'file',
    name: 'Folder & File Diff',
    category: 'Code & Comparison',
    keywords: ['folder', 'directory', 'file', 'diff', 'compare', 'tree'],
    icon: <FileCode2 size={16} />,
    color: '#b5dfa3',
  },
  {
    id: 'uuid',
    name: 'UUID & Unique ID Generator',
    category: 'Security & IDs',
    keywords: ['uuid', 'uuidv4', 'uuidv7', 'snowflake', 'ulid', 'nanoid', 'objectid', 'random', 'id'],
    icon: <Fingerprint size={16} />,
    color: '#c8edb6',
  },
  {
    id: 'json',
    name: 'JSON Tools & JSON to Table',
    category: 'Data & Formatters',
    keywords: ['json', 'yaml', 'yml', 'format', 'table', 'xml', 'validator', 'minify', 'pretty', 'tree'],
    icon: <Braces size={16} />,
    color: '#b5dfa3',
  },
  {
    id: 'time',
    name: 'Timezone & Epoch Clock',
    category: 'Calculators & Converters',
    keywords: ['time', 'timezone', 'epoch', 'unix', 'timestamp', 'utc', 'clock', 'date', 'iso'],
    icon: <Clock3 size={16} />,
    color: '#f3d58c',
  },
  {
    id: 'regex',
    name: 'Regex Lab & Debugger',
    category: 'Code & Comparison',
    keywords: ['regex', 'regexp', 'regular expression', 'test', 'match', 'pattern'],
    icon: <Regex size={16} />,
    color: '#f3c18e',
  },
  {
    id: 'architecture',
    name: 'Architecture & DB Diagram Designer',
    category: 'Diagrams & Design',
    keywords: ['architecture', 'diagram', 'database', 'erd', 'flowchart', 'schema', 'mermaid'],
    icon: <Network size={16} />,
    color: '#ceb8f6',
  },
  {
    id: 'image_studio',
    name: 'Image Studio (Crop, Resize, SVG)',
    category: 'Media & Graphics',
    keywords: ['image', 'crop', 'resize', 'compress', 'svg', 'png', 'jpg', 'webp'],
    icon: <Crop size={16} />,
    color: '#94e2d5',
  },
  {
    id: 'base64',
    name: 'Base64 Image Converter',
    category: 'Media & Graphics',
    keywords: ['base64', 'image', 'encode', 'decode', 'data uri'],
    icon: <ImageIcon size={16} />,
    color: '#8ddacb',
  },
  {
    id: 'case',
    name: 'Text Case Converter',
    category: 'Utilities',
    keywords: ['case', 'camelcase', 'snake_case', 'kebab', 'pascal', 'uppercase'],
    icon: <CaseSensitive size={16} />,
    color: '#d9f6ca',
  },
  {
    id: 'markup',
    name: 'Markup Studio & SQL Formatter',
    category: 'Data & Formatters',
    keywords: ['html', 'markdown', 'xml', 'sql', 'format', 'preview', 'sandbox'],
    icon: <FileCode2 size={16} />,
    color: '#ceb8f6',
  },
  {
    id: 'url',
    name: 'URL Encoder & Query Parser',
    category: 'Utilities',
    keywords: ['url', 'encode', 'decode', 'query', 'params', 'uri'],
    icon: <Link2 size={16} />,
    color: '#f2cdcd',
  },
  {
    id: 'portfolio',
    name: 'Portfolio & Projects Showcase',
    category: 'About',
    keywords: ['about', 'portfolio', 'architecture', 'languages', 'creator', 'prakash', 'contact', 'resume', 'projects', 'experience', 'kafka'],
    icon: <UserRound size={16} />,
    color: '#c8edb6',
  },
];

export default function CommandPalette({ isOpen, onClose, onSelectTool, onPortfolio }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filtered = TOOLS.filter(tool => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q) ||
      tool.keywords.some(k => k.toLowerCase().includes(q))
    );
  });

  const handleSelect = (tool: ToolItem) => {
    if (tool.id === 'portfolio') {
      onPortfolio();
    } else {
      onSelectTool(tool.id as ViewMode);
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          // Handled externally
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % Math.max(filtered.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filtered.length) % Math.max(filtered.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleSelect(filtered[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-[#171d19] border border-[#344435] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center px-4 py-3 border-b border-[#344435] gap-3">
          <Search size={18} className="text-[#c8edb6]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a tool name, format, or keyword (e.g. har, jwt, docx, diff, json)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent text-sm text-[#e4ebdd] placeholder-[#9eac96] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#9eac96] hover:text-[#e4ebdd] hover:bg-[#344435]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#2b382c]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#9eac96]">
              No tools matching &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((tool, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={tool.id}
                  onClick={() => handleSelect(tool)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#c8edb6]/15 text-[#e4ebdd]' : 'hover:bg-[#111612]'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 shrink-0"
                    style={{ backgroundColor: `${tool.color}15`, color: tool.color, border: `1px solid ${tool.color}30` }}
                  >
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#e4ebdd] truncate">{tool.name}</div>
                    <div className="text-[10px] text-[#9eac96] truncate">{tool.category}</div>
                  </div>
                  <span className="text-[10px] text-[#899980] font-mono">Jump ↵</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#111612] border-t border-[#344435] text-[10px] text-[#9eac96]">
          <span>Navigation: ↑ ↓ arrows to select, Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
