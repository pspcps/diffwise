import React, { useState, useEffect } from 'react';
import { GitCompare, FileText, UserRound } from 'lucide-react';
import type { ViewMode } from '../../types';

interface ToolbarProps {
  mode: ViewMode;
  onModeChange: (m: ViewMode) => void;
  onAbout: () => void;
}

const tabs: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'text', label: 'Text Compare', icon: <FileText size={13} /> },
  { id: 'file', label: 'File Compare', icon: <GitCompare size={13} /> },
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
  const [quotes, setQuotes]   = useState<QuoteItem[]>([]);
  const [idx, setIdx]         = useState(0);
  const [visible, setVisible] = useState(true); // for fade toggle

  // Fetch quotes once per day
  useEffect(() => {
    const cached = getCached();
    if (cached?.length) { setQuotes(cached); return; }

    fetch('https://api.quotable.io/quotes/random?limit=8&maxLength=110')
      .then(r => r.json())
      .then((data: any[]) => {
        const q = data.map(d => ({ content: d.content, author: d.author }));
        setCache(q);
        setQuotes(q);
      })
      .catch(() => setQuotes(FALLBACK_QUOTES));
  }, []);

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

export default function Toolbar({ mode, onModeChange, onAbout }: ToolbarProps) {
  const { quote, visible } = useRotatingQuote();

  return (
    <div
      className="flex items-center shrink-0 select-none px-3 gap-1"
      style={{
        height: 44,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #181825 100%)',
        borderBottom: '1px solid #252535',
        boxShadow: '0 1px 0 rgba(137,180,250,0.04)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mr-3 shrink-0">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(137,180,250,0.2), rgba(203,166,247,0.1))', border: '1px solid rgba(137,180,250,0.2)' }}>
          <GitCompare size={13} color="#89b4fa" />
        </div>
        <span
          className="text-sm font-bold tracking-tight"
          style={{
            background: 'linear-gradient(90deg, #cdd6f4, #89b4fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          DiffWise
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 mr-3 shrink-0" style={{ background: '#2a2a3e' }} />

      {/* Mode tabs */}
      <div className="flex gap-1 shrink-0">
        {tabs.map(tab => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
              style={active ? {
                background: 'rgba(137,180,250,0.12)',
                color: '#89b4fa',
                boxShadow: '0 0 0 1px rgba(137,180,250,0.2)',
              } : {
                color: '#585b70',
                background: 'transparent',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#cdd6f4'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = '#585b70'; }}
            >
              {tab.icon}
              {tab.label}
              {active && (
                <span
                  className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, #89b4fa, transparent)' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Quote — fills center space */}
      {quote && (
        <div className="flex-1 min-w-0 flex items-center justify-center px-4 overflow-hidden">
          <p
            className="text-[11px] truncate text-center"
            style={{
              color: '#3d3f55',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(4px)',
              transition: `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms ease`,
              maxWidth: 480,
            }}
          >
            <span style={{ color: '#45475a' }}>{quote.content}</span>
            <span className="mx-1.5" style={{ color: '#2a2b3d' }}>—</span>
            <span style={{ color: '#3d3f55', fontStyle: 'italic' }}>{quote.author}</span>
          </p>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-[10px] px-2 py-0.5 rounded-md font-mono"
          style={{ background: 'rgba(137,180,250,0.06)', color: '#3d3f55', border: '1px solid #252535' }}
        >
          v1.0
        </span>

        {/* About Me button */}
        <button
          onClick={onAbout}
          title="About the builder"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
          style={{ color: '#45475a' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6c7086'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#45475a'}
        >
          <UserRound size={14} />
        </button>
      </div>
    </div>
  );
}
