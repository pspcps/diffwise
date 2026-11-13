import { useState } from 'react';
import { ArrowDownUp, Copy, RotateCcw } from 'lucide-react';

type UrlMode = 'encode' | 'decode';
type UrlScope = 'component' | 'uri';

export default function UrlToolsView() {
  const [mode, setMode] = useState<UrlMode>('encode');
  const [scope, setScope] = useState<UrlScope>('component');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const convert = () => {
    try {
      const converted = mode === 'encode'
        ? scope === 'component' ? encodeURIComponent(input) : encodeURI(input)
        : scope === 'component' ? decodeURIComponent(input) : decodeURI(input);
      setOutput(converted);
      setError('');
    } catch {
      setOutput('');
      setError('Invalid percent-encoded input. Check that every % is followed by two hexadecimal digits.');
    }
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setError('Clipboard access is unavailable in this browser context.');
    }
  };

  const swap = () => {
    setInput(output);
    setOutput(input);
    setMode(current => current === 'encode' ? 'decode' : 'encode');
    setError('');
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#171d19] text-[#e4ebdd]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#344435] bg-[#111612] px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold">URL Encoder / Decoder</h1>
          <p className="mt-0.5 text-[11px] text-[#9eac96]">Encode complete URLs or individual query values.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-[#344435] p-0.5" role="group" aria-label="URL operation">
            {(['encode', 'decode'] as const).map(item => <button key={item} onClick={() => { setMode(item); setError(''); }} aria-pressed={mode === item} className={`rounded px-3 py-1.5 text-[11px] capitalize ${mode === item ? 'bg-[#344435] text-[#e4ebdd]' : 'text-[#9eac96]'}`}>{item}</button>)}
          </div>
          <select value={scope} onChange={event => setScope(event.target.value as UrlScope)} aria-label="Encoding scope" className="h-8 rounded-md border border-[#344435] bg-[#141a16] px-2 text-[11px] text-[#e4ebdd]">
            <option value="component">URL component</option>
            <option value="uri">Full URL</option>
          </select>
          <button onClick={convert} className="rounded-md border border-[#c8edb6]/30 bg-[#c8edb6]/10 px-3 py-1.5 text-[11px] font-medium text-[#c8edb6] hover:bg-[#c8edb6]/15">{mode === 'encode' ? 'Encode' : 'Decode'}</button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-px bg-[#344435]">
        <label className="flex min-h-0 flex-col bg-[#171d19]">
          <span className="shrink-0 px-4 py-2 text-[11px] font-medium text-[#b1bea8]">{mode === 'encode' ? 'Plain text' : 'Encoded URL'}</span>
          <textarea value={input} onChange={event => { setInput(event.target.value); setError(''); }} placeholder={mode === 'encode' ? 'Paste a URL or query value...' : 'Paste percent-encoded text...'} spellCheck={false}
            className="min-h-0 flex-1 resize-none bg-[#141a16] px-4 py-3 font-mono text-[12px] leading-6 text-[#e4ebdd] outline-none placeholder:text-[#899980] focus:ring-1 focus:ring-inset focus:ring-[#c8edb6]/20" />
        </label>
        <div className="flex flex-col items-center justify-center gap-2 bg-[#171d19] px-2">
          <button onClick={convert} title="Convert URL" aria-label="Convert URL" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#344435] text-[#c8edb6] hover:bg-[#c8edb6]/10"><ArrowDownUp size={15} /></button>
          <button onClick={swap} disabled={!output} title="Swap input and output" aria-label="Swap input and output" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#344435] text-[#b1bea8] hover:text-[#e4ebdd] disabled:opacity-40"><RotateCcw size={14} /></button>
        </div>
        <div className="flex min-h-0 flex-col bg-[#171d19]">
          <div className="flex shrink-0 items-center justify-between px-4 py-2">
            <span className="text-[11px] font-medium text-[#b1bea8]">{mode === 'encode' ? 'Encoded result' : 'Decoded result'}</span>
            <button onClick={() => void copyOutput()} disabled={!output} title={copied ? 'Copied' : 'Copy result'} aria-label="Copy result" className="rounded-md border border-[#344435] p-1.5 text-[#b1bea8] hover:text-[#e4ebdd] disabled:opacity-40"><Copy size={13} /></button>
          </div>
          <textarea value={output} readOnly aria-label="Converted URL" placeholder="Result will appear here..." className="min-h-0 flex-1 resize-none bg-[#141a16] px-4 py-3 font-mono text-[12px] leading-6 text-[#b5dfa3] outline-none placeholder:text-[#899980]" />
          <div className="min-h-7 px-4 py-1 text-[10px] text-[#f19aa6]" role="status">{error}</div>
        </div>
      </div>
    </section>
  );
}