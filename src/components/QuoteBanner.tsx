import { useState, useEffect } from 'react';
import { X, Quote } from 'lucide-react';

const CACHE_KEY = 'dw_quote_cache';

interface QuoteData { content: string; author: string; }

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getCached(): QuoteData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { date, quote } = JSON.parse(raw);
    if (date === getTodayKey()) return quote;
  } catch { /* ignore */ }
  return null;
}

function setCache(quote: QuoteData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ date: getTodayKey(), quote }));
  } catch { /* ignore */ }
}

export default function QuoteBanner() {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const cached = getCached();
    if (cached) { setQuote(cached); return; }

    fetch('https://api.quotable.io/random?maxLength=120')
      .then(r => r.json())
      .then(data => {
        const q: QuoteData = { content: data.content, author: data.author };
        setCache(q);
        setQuote(q);
      })
      .catch(() => {
        // Fallback quote if API fails
        const fallback = { content: 'The best way to predict the future is to create it.', author: 'Peter Drucker' };
        setQuote(fallback);
      });
  }, []);

  if (!quote || dismissed) return null;

  return (
    <div
      className="shrink-0 flex items-center gap-2 px-4 select-none"
      style={{
        height: 32,
        background: 'linear-gradient(90deg, rgba(137,180,250,0.05) 0%, rgba(203,166,247,0.04) 100%)',
        borderBottom: '1px solid rgba(137,180,250,0.08)',
      }}
    >
      <Quote size={10} style={{ color: '#89b4fa', opacity: 0.6, flexShrink: 0 }} />
      <p className="flex-1 text-[11px] truncate" style={{ color: '#585b70' }}>
        <span style={{ color: '#6c7086' }}>{quote.content}</span>
        <span className="mx-1.5" style={{ color: '#3d3f55' }}>—</span>
        <span style={{ color: '#45475a' }}>{quote.author}</span>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 w-4 h-4 flex items-center justify-center rounded transition-all hover:bg-white/5"
        style={{ color: '#3d3f55' }}
      >
        <X size={10} />
      </button>
    </div>
  );
}
