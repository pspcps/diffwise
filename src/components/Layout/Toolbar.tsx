import React, { useState, useEffect, useRef } from 'react';
import {
  GitCompare,
  FileText,
  UserRound,
  CaseSensitive,
  Braces,
  Clock3,
  Image as ImageIcon,
  FileCode2,
  Regex,
  Network,
  Layers,
  Crop,
  Globe,
  KeyRound,
  Search,
  Fingerprint,
  Send,
} from 'lucide-react';
import type { ViewMode } from '../../types';

interface ToolbarProps {
  mode: ViewMode;
  onModeChange: (m: ViewMode) => void;
  onAbout: () => void;
  onOpenSearch?: () => void;
}

const tabs: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Diff Checker', icon: <FileText size={13} /> },
  { id: 'har', label: 'HAR Viewer', icon: <Globe size={13} /> },
  { id: 'api', label: 'API Desk & Swagger', icon: <Send size={13} /> },
  { id: 'jwt', label: 'JWT Debugger', icon: <KeyRound size={13} /> },
  { id: 'json', label: 'JSON & YAML', icon: <Braces size={13} /> },
  { id: 'uuid', label: 'UUID Generator', icon: <Fingerprint size={13} /> },
  { id: 'regex', label: 'Regex Lab', icon: <Regex size={13} /> },
  { id: 'architecture', label: 'Architecture Lab', icon: <Network size={13} /> },
  { id: 'image_studio', label: 'Image Studio', icon: <Crop size={13} /> },
  { id: 'time', label: 'Time Zones', icon: <Clock3 size={13} /> },
  { id: 'base64', label: 'Image Base64', icon: <ImageIcon size={13} /> },
  { id: 'markup', label: 'Markup Studio', icon: <FileCode2 size={13} /> },
  { id: 'case', label: 'Case Converter', icon: <CaseSensitive size={13} /> },
  { id: 'pdf', label: 'PDF Studio', icon: <Layers size={13} /> }, // Placed at very end as requested
];

const CACHE_KEY = 'dw_quotes_cache';
const ROTATE_INTERVAL = 18000; // 18s per quote
const FADE_DURATION   = 1200;  // 1.2s cross-fade

interface QuoteItem { content: string; author: string; }

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getCached(): QuoteItem[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { date, quotes } = JSON.parse(raw);
    if (date === getTodayKey()) return quotes;
  } catch { /* ignore */ }
  return null;
}

function setCache(quotes: QuoteItem[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ date: getTodayKey(), quotes }));
  } catch { /* ignore */ }
}

const FALLBACK_QUOTES: QuoteItem[] = [
  { content: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
  { content: 'Code is like humor. When you have to explain it, it\'s bad.', author: 'Cory House' },
  { content: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
  { content: 'Simplicity is the soul of efficiency.', author: 'Austin Freeman' },
  { content: 'Make it work, make it right, make it fast.', author: 'Kent Beck' },
];

function useRotatingQuote() {
  const [quotes, setQuotes]   = useState<QuoteItem[]>(() => getCached() ?? []);
  const [idx, setIdx]         = useState(0);
  const [visible, setVisible] = useState(true); // for fade toggle

  // Fetch quotes once per day
  useEffect(() => {
    if (quotes.length > 0) return;

    fetch('https://api.quotable.io/quotes/random?limit=8&maxLength=110')
      .then(r => r.json())
      .then((data: any[]) => {
        const q = data.map(d => ({ content: d.content, author: d.author }));
        setCache(q);
        setQuotes(q);
      })
      .catch(() => setQuotes(FALLBACK_QUOTES));
  }, [quotes.length]);

  // Rotate with cross-fade
  useEffect(() => {
    if (quotes.length < 2) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % quotes.length);
        setVisible(true);
      }, FADE_DURATION);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [quotes]);

  return { quote: quotes[idx] ?? null, visible };
}

export default function Toolbar({ mode, onModeChange, onAbout, onOpenSearch }: ToolbarProps) {
  const { quote, visible } = useRotatingQuote();
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active tab into view when mode changes
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [mode]);

  return (
    <header className="relative w-full shrink-0 select-none bg-[#181825] border-b border-[#252535] z-30">
      <div
        className="flex items-center h-11 px-2 sm:px-3 gap-1.5 w-full justify-between"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #181825 100%)',
          boxShadow: '0 1px 0 rgba(137,180,250,0.04)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 pr-1.5 sm:pr-2.5 shrink-0 border-r border-[#252535]">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(137,180,250,0.2), rgba(203,166,247,0.1))',
              border: '1px solid rgba(137,180,250,0.25)',
            }}
          >
            <GitCompare size={13} color="#89b4fa" />
          </div>
          <span
            className="text-xs sm:text-sm font-bold tracking-tight"
            style={{
              background: 'linear-gradient(90deg, #cdd6f4, #89b4fa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            <span className="hidden sm:inline">PSDevTool</span>
            <span className="sm:hidden">PSDev</span>
          </span>
        </div>

        {/* Mode tabs with smooth scroll, flex-1 min-w-0 ensures it NEVER overflows parent */}
        <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1">
          {tabs.map(tab => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                ref={active ? activeTabRef : null}
                onClick={() => onModeChange(tab.id)}
                title={tab.label}
                className="relative flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap shrink-0"
                style={
                  active
                    ? {
                        background: 'rgba(137,180,250,0.15)',
                        color: '#89b4fa',
                        boxShadow: '0 0 0 1px rgba(137,180,250,0.3)',
                      }
                    : {
                        color: '#6c7086',
                        background: 'transparent',
                      }
                }
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#cdd6f4';
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#6c7086';
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {active && (
                  <span
                    className="absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, transparent, #89b4fa, transparent)' }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Quote — fills center space on desktop only */}
        {quote && (
          <div className="hidden 2xl:flex flex-1 min-w-0 items-center justify-center px-3 overflow-hidden">
            <p
              className="text-[11px] truncate text-center"
              style={{
                color: '#3d3f55',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(4px)',
                transition: `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease`,
                maxWidth: 420,
              }}
            >
              <span style={{ color: '#45475a' }}>{quote.content}</span>
              <span className="mx-1.5" style={{ color: '#2a2b3d' }}>—</span>
              <span style={{ color: '#3d3f55', fontStyle: 'italic' }}>{quote.author}</span>
            </p>
          </div>
        )}

        {/* Right side Actions (Pinned & Always Visible on all screen sizes) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto pl-1 sm:pl-1.5 z-20 bg-[#181825]">
          {/* Quick Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              title="Quick search tools (Cmd+K)"
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs transition-all bg-[#1e1e32] hover:bg-[#313244] border border-[#313244] text-[#9399b2] hover:text-[#cdd6f4] shadow-sm active:scale-95"
            >
              <Search size={14} className="text-[#89b4fa]" />
              <span className="text-[11px] font-medium hidden md:inline">Tools</span>
              <kbd className="hidden lg:inline-block px-1 bg-[#11111b] border border-[#45475a] rounded text-[9px] font-mono text-[#6c7086]">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Profile / About Me Button */}
          <button
            onClick={onAbout}
            title="About the builder / 3D Portfolio"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-[#1e1e32] hover:bg-[#313244] border border-[#313244] text-[#89b4fa] hover:text-white hover:scale-105 active:scale-95 shadow-sm"
          >
            <UserRound size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
