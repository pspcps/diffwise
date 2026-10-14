import { useState } from 'react';
import { Copy, RotateCcw } from 'lucide-react';

const CASES = [
  { id: 'sentence', label: 'Sentence case', sample: 'Sc' },
  { id: 'lower', label: 'lower case', sample: 'lc' },
  { id: 'upper', label: 'UPPER CASE', sample: 'UC' },
  { id: 'capitalized', label: 'Capitalized Case', sample: 'Cc' },
  { id: 'alternating', label: 'aLtErNaTiNg cAsE', sample: 'aC' },
  { id: 'title', label: 'Title Case', sample: 'TC' },
  { id: 'inverse', label: 'iNVERSE cASE', sample: 'iC' },
  { id: 'camel', label: 'camelCase', sample: 'cC' },
  { id: 'pascal', label: 'PascalCase', sample: 'PC' },
  { id: 'snake', label: 'snake_case', sample: 'sC' },
  { id: 'kebab', label: 'kebab-case', sample: 'kC' },
] as const;

type CaseId = typeof CASES[number]['id'];

function getWords(text: string) {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .match(/[\p{L}\p{N}]+/gu) ?? [];
}

function convertText(text: string, mode: CaseId) {
  const words = getWords(text);
  const lowerWords = words.map(word => word.toLocaleLowerCase());

  switch (mode) {
    case 'sentence':
      return text.toLocaleLowerCase().replace(/(^|[.!?]\s+)([\p{L}])/gu, (_, prefix: string, letter: string) => prefix + letter.toLocaleUpperCase());
    case 'lower':
      return text.toLocaleLowerCase();
    case 'upper':
      return text.toLocaleUpperCase();
    case 'capitalized':
      return words.map(word => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()).join(' ');
    case 'alternating': {
      let index = 0;
      return [...text].map(character => {
        if (!/\p{L}/u.test(character)) return character;
        const converted = index++ % 2 === 0 ? character.toLocaleLowerCase() : character.toLocaleUpperCase();
        return converted;
      }).join('');
    }
    case 'title':
      return lowerWords.map(word => word.charAt(0).toLocaleUpperCase() + word.slice(1)).join(' ');
    case 'inverse':
      return [...text].map(character => character === character.toLocaleUpperCase()
        ? character.toLocaleLowerCase()
        : character.toLocaleUpperCase()).join('');
    case 'camel':
      return lowerWords.map((word, index) => index === 0 ? word : word.charAt(0).toLocaleUpperCase() + word.slice(1)).join('');
    case 'pascal':
      return lowerWords.map(word => word.charAt(0).toLocaleUpperCase() + word.slice(1)).join('');
    case 'snake':
      return lowerWords.join('_');
    case 'kebab':
      return lowerWords.join('-');
  }
}

export default function CaseConverterView() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<CaseId>('sentence');
  const [copied, setCopied] = useState(false);
  const output = convertText(input, mode);

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold text-[#cdd6f4]">Case Converter</h1>
          <p className="mt-0.5 text-[11px] text-[#6c7086]">Convert text between writing and identifier styles.</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Text case">
          {CASES.map(item => (
            <button key={item.id} onClick={() => setMode(item.id)} aria-pressed={mode === item.id}
              className={`rounded-md border px-2.5 py-1.5 text-[11px] transition-colors ${mode === item.id ? 'border-[#89b4fa]/40 bg-[#89b4fa]/10 text-[#89b4fa]' : 'border-[#313244] text-[#9399b2] hover:border-[#585b70] hover:text-[#cdd6f4]'}`}>
              <span className="mr-1.5 font-mono text-[10px] opacity-70">{item.sample}</span>{item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-px bg-[#313244] md:grid-cols-2">
        <label className="flex min-h-0 flex-col bg-[#1e1e2e]">
          <span className="shrink-0 px-4 py-2 text-[11px] font-medium text-[#9399b2]">Your text</span>
          <textarea value={input} onChange={event => setInput(event.target.value)}
            placeholder="Paste or type text to convert..." spellCheck={false}
            className="min-h-0 flex-1 resize-none bg-[#1a1a2c] px-4 py-3 font-mono text-[13px] leading-6 text-[#cdd6f4] outline-none placeholder:text-[#585b70] focus:ring-1 focus:ring-inset focus:ring-[#89b4fa]/20" />
        </label>
        <div className="flex min-h-0 flex-col bg-[#1e1e2e]">
          <div className="flex shrink-0 items-center justify-between px-4 py-2">
            <span className="text-[11px] font-medium text-[#9399b2]">{CASES.find(item => item.id === mode)?.label} result</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#585b70]">{output.length} characters</span>
              <button onClick={copyOutput} disabled={!output} title="Copy converted text"
                className="flex items-center gap-1.5 rounded-md border border-[#313244] px-2.5 py-1 text-[11px] text-[#9399b2] hover:border-[#585b70] hover:text-[#cdd6f4] disabled:opacity-40">
                <Copy size={12} />{copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={() => setInput('')} title="Clear text" disabled={!input}
                className="rounded-md border border-[#313244] p-1.5 text-[#9399b2] hover:border-[#585b70] hover:text-[#cdd6f4] disabled:opacity-40">
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
          <textarea value={output} readOnly aria-label="Converted text"
            className="min-h-0 flex-1 resize-none bg-[#1a1a2c] px-4 py-3 font-mono text-[13px] leading-6 text-[#a6e3a1] outline-none" />
        </div>
      </div>
    </section>
  );
}