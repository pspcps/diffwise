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
    <section className="flex h-full min-h-0 flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold">URL Encoder / Decoder</h1>
          <p className="mt-0.5 text-[11px] text-[#6c7086]">Encode complete URLs or individual query values.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-[#313244] p-0.5" role="group" aria-label="URL operation">
            {(['encode', 'decode'] as const).map(item => <button key={item} onClick={() => { setMode(item); setError(''); }} aria-pressed={mode === item} className={`rounded px-3 py-1.5 text-[11px] capitalize ${mode === item ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086]'}`}>{item}</button>)}
          </div>
          <select value={scope} onChange={event => setScope(event.target.value as UrlScope)} aria-label="Encoding scope" className="h-8 rounded-md border border-[#313244] bg-[#1a1a2c] px-2 text-[11px] text-[#cdd6f4]">
            <option value="component">URL component</option>
            <option value="uri">Full URL</option>
          </select>
          <button onClick={convert} className="rounded-md border border-[#89b4fa]/30 bg-[#89b4fa]/10 px-3 py-1.5 text-[11px] font-medium text-[#89b4fa] hover:bg-[#89b4fa]/15">{mode === 'encode' ? 'Encode' : 'Decode'}</button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-px bg-[#313244]">
        <label className="flex min-h-0 flex-col bg-[#1e1e2e]">
          <span className="shrink-0 px-4 py-2 text-[11px] font-medium text-[#9399b2]">{mode === 'encode' ? 'Plain text' : 'Encoded URL'}</span>
          <textarea value={input} onChange={event => { setInput(event.target.value); setError(''); }} placeholder={mode === 'encode' ? 'Paste a URL or query value...' : 'Paste percent-encoded text...'} spellCheck={false}
            className="min-h-0 flex-1 resize-none bg-[#1a1a2c] px-4 py-3 font-mono text-[12px] leading-6 text-[#cdd6f4] outline-none placeholder:text-[#585b70] focus:ring-1 focus:ring-inset focus:ring-[#89b4fa]/20" />
        </label>
        <div className="flex flex-col items-center justify-center gap-2 bg-[#1e1e2e] px-2">
          <button onClick={convert} title="Convert URL" aria-label="Convert URL" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#313244] text-[#89b4fa] hover:bg-[#89b4fa]/10"><ArrowDownUp size={15} /></button>
          <button onClick={swap} disabled={!output} title="Swap input and output" aria-label="Swap input and output" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#313244] text-[#9399b2] hover:text-[#cdd6f4] disabled:opacity-40"><RotateCcw size={14} /></button>
        </div>
        <div className="flex min-h-0 flex-col bg-[#1e1e2e]">
          <div className="flex shrink-0 items-center justify-between px-4 py-2">
            <span className="text-[11px] font-medium text-[#9399b2]">{mode === 'encode' ? 'Encoded result' : 'Decoded result'}</span>
            <button onClick={() => void copyOutput()} disabled={!output} title={copied ? 'Copied' : 'Copy result'} aria-label="Copy result" className="rounded-md border border-[#313244] p-1.5 text-[#9399b2] hover:text-[#cdd6f4] disabled:opacity-40"><Copy size={13} /></button>
          </div>
          <textarea value={output} readOnly aria-label="Converted URL" placeholder="Result will appear here..." className="min-h-0 flex-1 resize-none bg-[#1a1a2c] px-4 py-3 font-mono text-[12px] leading-6 text-[#a6e3a1] outline-none placeholder:text-[#585b70]" />
          <div className="min-h-7 px-4 py-1 text-[10px] text-[#f38ba8]" role="status">{error}</div>
        </div>
      </div>
    </section>
  );
}