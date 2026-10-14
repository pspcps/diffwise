import { useEffect, useMemo, useState, type ReactNode } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { parseRegExpLiteral, visitRegExpAST } from '@eslint-community/regexpp';
import { ChevronLeft, ChevronRight, Copy, Search, ShieldAlert, Sparkles, TestTube2, Wrench } from 'lucide-react';

type LabMode = 'test' | 'debug' | 'generate';
interface RegexMatch {
  text: string;
  index: number;
  end: number;
  captures: (string | null)[];
  namedCaptures: Record<string, string | undefined>;
}
interface RegexPreset { category: string; name: string; pattern: string; flags?: string; description: string; caveat?: string; sample: string; }
interface TraceStep { start: number; end: number; token: string; description: string; }
let regexLanguageRegistered = false;

const PRESETS: RegexPreset[] = [
  { category: 'Characters', name: 'Numbers only', pattern: '^\\d+$', description: 'One or more ASCII digits, with no spaces or separators.', sample: '2025108' },
  { category: 'Characters', name: 'Letters and numbers', pattern: '^[A-Za-z0-9]+$', description: 'ASCII letters and digits only.', sample: 'Team42' },
  { category: 'Characters', name: 'Lowercase letters', pattern: '^[a-z]+$', description: 'One or more lowercase ASCII letters.', sample: 'developer' },
  { category: 'Characters', name: 'Uppercase letters', pattern: '^[A-Z]+$', description: 'One or more uppercase ASCII letters.', sample: 'DEVTOOLS' },
  { category: 'Characters', name: 'Letters, numbers, underscore', pattern: '^\\w+$', description: 'Word characters: letters, digits, and underscore. JavaScript word matching is ASCII-oriented.', sample: 'build_42' },
  { category: 'Characters', name: 'Whitespace only', pattern: '^\\s+$', description: 'One or more whitespace characters.', sample: '   \n' },
  { category: 'Contact', name: 'Email (practical)', pattern: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$', flags: 'i', description: 'Common application-level email shape.', caveat: 'Email standards are broader; confirmation email is more reliable than regex alone.', sample: 'person@example.com' },
  { category: 'Contact', name: 'Mobile (international)', pattern: '^\\+?[1-9]\\d{7,14}$', description: 'Broad international number shape inspired by E.164.', caveat: 'Does not validate country-specific numbering plans.', sample: '+14155552671' },
  { category: 'Contact', name: 'Indian mobile', pattern: '^(?:\\+91[- ]?)?[6-9]\\d{9}$', description: 'Ten-digit Indian mobile, optionally prefixed with +91.', sample: '+91 9876543210' },
  { category: 'Contact', name: 'US phone', pattern: '^\\+?1?[-. ]?\\(?\\d{3}\\)?[-. ]?\\d{3}[-. ]?\\d{4}$', description: 'Common US phone formats with optional country code and separators.', sample: '+1 (415) 555-2671' },
  { category: 'Contact', name: 'URL (HTTP/HTTPS)', pattern: '^https?:\\/\\/(?:www\\.)?[^\\s/$.?#].[^\\s]*$', flags: 'i', description: 'Practical web URL shape for common HTTP and HTTPS links.', caveat: 'Use the URL API when you need authoritative URL validation.', sample: 'https://example.com/docs' },
  { category: 'Numbers & IDs', name: 'Credit card shape', pattern: '^(?:\\d[ -]*?){13,19}$', description: '13 to 19 digits with optional spaces or hyphens.', caveat: 'Checks shape only, not issuer, expiry, or Luhn checksum. Never use regex alone to validate payment cards.', sample: '4111 1111 1111 1111' },
  { category: 'Numbers & IDs', name: 'IPv4 address', pattern: '^(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$', description: 'IPv4 dotted decimal with each octet between 0 and 255.', sample: '192.168.1.20' },
  { category: 'Numbers & IDs', name: 'UUID', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', flags: 'i', description: 'Canonical UUID shape with a recognized version and variant nibble.', sample: '550e8400-e29b-41d4-a716-446655440000' },
  { category: 'Numbers & IDs', name: 'ISO date (YYYY-MM-DD)', pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$', description: 'Checks the date format and broad month/day ranges.', caveat: 'Does not account for month lengths or leap years.', sample: '2026-10-14' },
  { category: 'Numbers & IDs', name: 'US ZIP code', pattern: '^\\d{5}(?:-\\d{4})?$', description: 'Five-digit ZIP code with optional four-digit extension.', sample: '10001-1234' },
  { category: 'Numbers & IDs', name: 'Hex color', pattern: '^#?(?:[0-9A-F]{3}|[0-9A-F]{6})$', flags: 'i', description: 'Three- or six-digit hexadecimal color, with optional #.', sample: '#89B4FA' },
  { category: 'Identifiers', name: 'Username', pattern: '^[A-Za-z][A-Za-z0-9_]{2,19}$', description: 'Starts with a letter, then 2 to 19 letters, digits, or underscores.', sample: 'prakash_dev' },
  { category: 'Identifiers', name: 'URL slug', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', description: 'Lowercase words and digits separated by single hyphens.', sample: 'regex-debugger-guide' },
  { category: 'Security', name: 'Password policy example', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,}$', description: 'At least 8 characters with lowercase, uppercase, digit, and one listed symbol.', caveat: 'Password policy should balance usability and modern guidance; never store passwords as plain text.', sample: 'SecurePass9!' },
];

const FLAGS = [
  { id: 'g', label: 'Global', title: 'Find all matches' },
  { id: 'i', label: 'Ignore case', title: 'Case-insensitive matching' },
  { id: 'm', label: 'Multiline', title: '^ and $ match line boundaries' },
  { id: 's', label: 'Dot all', title: '. also matches line breaks' },
  { id: 'u', label: 'Unicode', title: 'Enable Unicode-aware matching' },
  { id: 'y', label: 'Sticky', title: 'Match only at the current lastIndex' },
] as const;

function describeRegex(pattern: string, flags: string): TraceStep[] {
  const ast = parseRegExpLiteral(new RegExp(pattern, flags));
  const steps: TraceStep[] = [];
  const add = (node: { start: number; end: number; raw: string }, description: string) => {
    steps.push({ start: node.start, end: node.end, token: node.raw, description });
  };

  visitRegExpAST(ast, {
    onCapturingGroupEnter: node => add(node, node.name ? `Named capture group “${node.name}”.` : 'Capturing group; its value appears in the capture list.'),
    onGroupEnter: node => add(node, 'Non-capturing group; groups alternatives or quantifiers without a capture.'),
    onCharacterClassEnter: node => add(node, `${node.negate ? 'Negated ' : ''}character class; matches one character from this set.`),
    onCharacterSetEnter: node => add(node, `Predefined character set (${node.kind}).`),
    onCharacterEnter: node => add(node, `Literal character ${JSON.stringify(String.fromCodePoint(node.value))}.`),
    onQuantifierEnter: node => add(node, `Repeat ${node.min} to ${node.max === Infinity ? 'unlimited' : node.max} times${node.greedy ? ' (greedy)' : ' (lazy)'}.`),
    onAssertionEnter: node => {
      const kind = node.kind;
      if (kind === 'start') add(node, 'Start-of-input assertion; with the m flag, start of line.');
      else if (kind === 'end') add(node, 'End-of-input assertion; with the m flag, end of line.');
      else if (kind === 'word') add(node, `Word ${node.negate ? 'non-' : ''}boundary assertion.`);
      else add(node, `${'negate' in node && node.negate ? 'Negative' : 'Positive'} ${kind} assertion; checks context without consuming text.`);
    },
    onBackreferenceEnter: node => add(node, `Backreference to capture ${node.ref} (${node.raw}).`),
  });
  return steps.sort((left, right) => left.start - right.start || right.end - left.end);
}

function HighlightedInput({ text, matches }: { text: string; matches: RegexMatch[] }) {
  if (!matches.length) return <>{text}</>;
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [index, match] of matches.entries()) {
    if (match.index > cursor) parts.push(<span key={`text-${index}`}>{text.slice(cursor, match.index)}</span>);
    if (match.end > match.index) {
      parts.push(<mark key={`match-${index}`} className="rounded-sm bg-[#f9e2af]/30 text-[#f9e2af]">{text.slice(match.index, match.end)}</mark>);
      cursor = match.end;
    } else {
      parts.push(<span key={`empty-${index}`} title="Zero-width match" className="border-l border-[#f38ba8]">{'\u200b'}</span>);
      cursor = match.index;
    }
  }
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);
  return <>{parts}</>;
}

export default function RegexLabView() {
  const [mode, setMode] = useState<LabMode>('test');
  const [pattern, setPattern] = useState('(?<user>[A-Za-z0-9._%+-]+)@(?<domain>[A-Za-z0-9.-]+\\.[A-Za-z]{2,})');
  const [flags, setFlags] = useState('gi');
  const [testText, setTestText] = useState('Contact dev@example.com or support@company.org');
  const [presetSearch, setPresetSearch] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<RegexPreset | null>(null);
  const [analysis, setAnalysis] = useState<{ key: string; matches: RegexMatch[]; error: string; timedOut: boolean; capped: boolean } | null>(null);
  const [clipboardError, setClipboardError] = useState('');
  const [matchIndex, setMatchIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const requestKey = JSON.stringify([pattern, flags, testText]);
  const currentAnalysis = analysis?.key === requestKey ? analysis : null;
  const matches = currentAnalysis?.matches ?? [];
  const pending = Boolean(pattern) && testText.length <= 250_000 && !currentAnalysis;
  const timedOut = currentAnalysis?.timedOut ?? false;
  const workerError = testText.length > 250_000
    ? 'Test input is too large. Keep it under 250,000 characters.'
    : currentAnalysis?.error || (currentAnalysis?.capped ? 'Showing the first 1,000 matches.' : '') || clipboardError;

  useEffect(() => {
    let worker: Worker | null = null;
    let watchdog: number | undefined;
    const key = JSON.stringify([pattern, flags, testText]);

    const debounce = window.setTimeout(() => {
      if (!pattern || testText.length > 250_000) {
        setAnalysis({ key, matches: [], error: '', timedOut: false, capped: false });
        return;
      }
      try {
        worker = new Worker(new URL('../../workers/regexWorker.ts', import.meta.url), { type: 'module' });
        watchdog = window.setTimeout(() => {
          worker?.terminate();
          worker = null;
          setAnalysis({ key, matches: [], error: '', timedOut: true, capped: false });
        }, 900);
        worker.onmessage = event => {
          if (watchdog) window.clearTimeout(watchdog);
          setAnalysis({ key, matches: event.data.matches ?? [], error: event.data.error ?? '', timedOut: false, capped: Boolean(event.data.capped) });
          worker?.terminate();
        };
        worker.onerror = () => {
          if (watchdog) window.clearTimeout(watchdog);
          setAnalysis({ key, matches: [], error: 'The regex worker could not complete this match.', timedOut: false, capped: false });
          worker?.terminate();
        };
        worker.postMessage({ pattern, flags, text: testText });
      } catch (error) {
        setAnalysis({ key, matches: [], error: error instanceof Error ? error.message : 'Could not start regex matching.', timedOut: false, capped: false });
      }
    }, 100);

    return () => {
      window.clearTimeout(debounce);
      if (watchdog) window.clearTimeout(watchdog);
      worker?.terminate();
    };
  }, [pattern, flags, testText]);

  const debugSteps = useMemo(() => {
    try {
      return { steps: describeRegex(pattern, flags), error: '' };
    } catch (error) {
      return { steps: [], error: error instanceof Error ? error.message : 'Invalid pattern.' };
    }
  }, [pattern, flags]);

  const matchingPresets = PRESETS.filter(preset => `${preset.category} ${preset.name} ${preset.description}`.toLocaleLowerCase().includes(presetSearch.toLocaleLowerCase()));
  const currentMatch = matches[Math.min(matchIndex, Math.max(matches.length - 1, 0))];
  const flagToggle = (flag: string) => setFlags(current => current.includes(flag) ? current.replace(flag, '') : `${current}${flag}`);

  const selectPreset = (preset: RegexPreset) => {
    setPattern(preset.pattern);
    setFlags(preset.flags ?? 'g');
    setSelectedPreset(preset);
    setTestText(preset.sample);
  };

  const copyPattern = async () => {
    try {
      await navigator.clipboard.writeText(`/${pattern}/${flags}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setClipboardError('Clipboard access is unavailable in this browser context.');
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#1e1e2e] text-[#cdd6f4]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-4 py-2.5">
        <div>
          <h1 className="text-sm font-semibold">Regex Lab</h1>
          <p className="mt-0.5 text-[11px] text-[#6c7086]">Generate patterns, test captures, and inspect match behavior.</p>
        </div>
        <div className="flex gap-1 rounded-md border border-[#313244] p-0.5" role="tablist" aria-label="Regex mode">
          {([['test', 'Test', <TestTube2 size={12} />], ['debug', 'Debug', <Wrench size={12} />], ['generate', 'Generate', <Sparkles size={12} />]] as const).map(([id, label, icon]) => <button key={id} onClick={() => setMode(id)} role="tab" aria-selected={mode === id} className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] ${mode === id ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086] hover:text-[#cdd6f4]'}`}>{icon}{label}</button>)}
        </div>
      </header>

      {mode === 'generate' ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-[#313244] md:border-b-0 md:border-r">
            <label className="m-3 flex items-center gap-2 rounded-md border border-[#313244] px-2.5 py-2 text-[#6c7086]"><Search size={13} /><input value={presetSearch} onChange={event => setPresetSearch(event.target.value)} placeholder="Search patterns..." aria-label="Search regex patterns" className="min-w-0 flex-1 bg-transparent text-[11px] text-[#cdd6f4] outline-none placeholder:text-[#585b70]" /></label>
            <div className="min-h-0 flex-1 overflow-auto px-2 pb-3">
              {matchingPresets.map(preset => <button key={preset.name} onClick={() => selectPreset(preset)} className={`mb-1 w-full rounded-md border px-3 py-2 text-left ${selectedPreset?.name === preset.name ? 'border-[#89b4fa]/40 bg-[#89b4fa]/10' : 'border-transparent hover:bg-[#252538]'}`}>
                <span className="block text-[11px] font-medium text-[#cdd6f4]">{preset.name}</span><span className="mt-1 block text-[9px] uppercase text-[#6c7086]">{preset.category}</span>
              </button>)}
            </div>
          </aside>
          <div className="flex min-h-0 flex-col overflow-auto p-4 sm:p-6">
            {selectedPreset ? <>
              <span className="text-[10px] uppercase text-[#89b4fa]">{selectedPreset.category}</span>
              <h2 className="mt-1 text-lg font-semibold text-[#cdd6f4]">{selectedPreset.name}</h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-[#9399b2]">{selectedPreset.description}</p>
              {selectedPreset.caveat && <p className="mt-3 flex max-w-2xl gap-2 border-l-2 border-[#f9e2af]/60 pl-3 text-[11px] leading-5 text-[#f9e2af]"><ShieldAlert size={14} className="mt-0.5 shrink-0" />{selectedPreset.caveat}</p>}
              <label className="mt-6 flex flex-col gap-2"><span className="text-[11px] font-medium text-[#9399b2]">Generated JavaScript regex</span><div className="flex items-center gap-2 rounded-md border border-[#313244] bg-[#11111b] p-3"><code className="min-w-0 flex-1 break-all font-mono text-sm text-[#a6e3a1]">/{pattern}/{flags}</code><button onClick={() => void copyPattern()} title={copied ? 'Copied' : 'Copy generated regex'} aria-label="Copy generated regex" className="rounded border border-[#313244] p-2 text-[#9399b2] hover:text-[#cdd6f4]"><Copy size={14} /></button></div></label>
              <div className="mt-3 rounded-md border border-[#313244] bg-[#181825] p-3"><span className="text-[10px] text-[#6c7086]">Example</span><pre className="mt-1 overflow-auto font-mono text-[11px] text-[#cdd6f4]">{selectedPreset.sample}</pre></div>
              <button onClick={() => setMode('test')} className="mt-4 self-start rounded-md border border-[#89b4fa]/30 bg-[#89b4fa]/10 px-3 py-2 text-[11px] text-[#89b4fa]">Test this pattern</button>
            </> : <div className="m-auto max-w-md text-center"><Sparkles size={22} className="mx-auto text-[#89b4fa]" /><h2 className="mt-3 text-sm font-semibold">Pattern generator</h2><p className="mt-2 text-xs leading-5 text-[#6c7086]">Choose a common validation or formatting pattern. You can edit it in the test bench and copy the generated JavaScript regex.</p></div>}
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col border-b border-[#313244] lg:border-b-0 lg:border-r">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#313244] px-4 py-2">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-xs">
                <span className="text-[#89b4fa]">/</span>
                <div className="h-8 min-w-0 flex-1">
                  <MonacoEditor height="32px" language="devbench-regex" theme="vs-dark" value={pattern} onChange={value => setPattern(value ?? '')}
                    onMount={(_editor, monaco) => {
                      if (regexLanguageRegistered) return;
                      monaco.languages.register({ id: 'devbench-regex' });
                      monaco.languages.setLanguageConfiguration('devbench-regex', {
                        brackets: [['(', ')'], ['[', ']'], ['{', '}']],
                        autoClosingPairs: [{ open: '(', close: ')' }, { open: '[', close: ']' }, { open: '{', close: '}' }],
                      });
                      monaco.languages.setMonarchTokensProvider('devbench-regex', {
                        tokenizer: {
                          root: [
                            [/\\(?:[dDsSwWbBfnrtv0]|x[\da-fA-F]{2}|u(?:[\da-fA-F]{4}|\{[\da-fA-F]+\})|.)/, 'regex.escape'],
                            [/\[\^?/, 'regex.class', '@characterClass'],
                            [/\(\?(?:[:=!]|<[=!]|<[\w]+>)/, 'regex.group'],
                            [/[()]/, 'regex.group'],
                            [/\{\d+(?:,\d*)?\}\??|[*+?]\??/, 'regex.quantifier'],
                            [/\^|\$/, 'regex.anchor'],
                            [/\|/, 'regex.alternation'],
                            [/\./, 'regex.dot'],
                            [/./, 'regex.literal'],
                          ],
                          characterClass: [
                            [/\\./, 'regex.escape'],
                            [/\]/, 'regex.class', '@pop'],
                            [/./, 'regex.class'],
                          ],
                        },
                      });
                      monaco.editor.defineTheme('devbench-regex-dark', {
                        base: 'vs-dark', inherit: true,
                        rules: [
                          { token: 'regex.anchor', foreground: 'F38BA8' },
                          { token: 'regex.escape', foreground: 'FAB387' },
                          { token: 'regex.group', foreground: '89B4FA' },
                          { token: 'regex.class', foreground: 'A6E3A1' },
                          { token: 'regex.quantifier', foreground: 'F9E2AF' },
                          { token: 'regex.alternation', foreground: 'CBA6F7' },
                          { token: 'regex.dot', foreground: 'F5C2E7' },
                          { token: 'regex.literal', foreground: 'CDD6F4' },
                        ],
                        colors: {
                          'editorBracketHighlight.foreground1': '#89b4fa',
                          'editorBracketHighlight.foreground2': '#a6e3a1',
                          'editorBracketHighlight.foreground3': '#f9e2af',
                          'editorBracketHighlight.foreground4': '#f38ba8',
                          'editorBracketHighlight.foreground5': '#cba6f7',
                          'editorBracketHighlight.foreground6': '#94e2d5',
                        },
                      });
                      monaco.editor.setTheme('devbench-regex-dark');
                      regexLanguageRegistered = true;
                    }}
                    options={{ automaticLayout: true, minimap: { enabled: false }, lineNumbers: 'off', folding: false, bracketPairColorization: { enabled: true }, matchBrackets: 'always', scrollBeyondLastLine: false, wordWrap: 'off', fontSize: 12, padding: { top: 6, bottom: 4 }, tabSize: 2 }} />
                </div>
                <span className="text-[#89b4fa]">/</span><span className="text-[#f9e2af]">{flags}</span>
              </div>
              <button onClick={() => void copyPattern()} title={copied ? 'Copied' : 'Copy regex'} aria-label="Copy regex" className="rounded border border-[#313244] p-1.5 text-[#9399b2] hover:text-[#cdd6f4]"><Copy size={12} /></button>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-[#313244] px-4 py-2" role="group" aria-label="Regular expression flags">
              {FLAGS.map(flag => <button key={flag.id} onClick={() => flagToggle(flag.id)} title={flag.title} aria-pressed={flags.includes(flag.id)} className={`rounded border px-2 py-1 text-[10px] ${flags.includes(flag.id) ? 'border-[#89b4fa]/40 bg-[#89b4fa]/10 text-[#89b4fa]' : 'border-[#313244] text-[#6c7086]'}`}>{flag.id} · {flag.label}</button>)}
            </div>
            {mode === 'debug' ? <div className="min-h-0 flex-1 overflow-auto p-4">
              <h2 className="text-[11px] font-semibold text-[#cdd6f4]">Pattern structure</h2>
              {debugSteps.error ? <p className="mt-2 text-xs text-[#f38ba8]">{debugSteps.error}</p> : <ol className="mt-3 space-y-1.5">{debugSteps.steps.map((step, index) => <li key={`${step.start}-${step.end}-${index}`} className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 rounded border border-[#313244]/70 bg-[#1a1a2c] p-2.5"><span className="font-mono text-[10px] text-[#585b70]">{index + 1}</span><div className="min-w-0"><code className="font-mono text-[11px] text-[#f9e2af]">{step.token}</code><p className="mt-1 text-[10px] leading-4 text-[#9399b2]">{step.description}</p></div></li>)}</ol>}
              <p className="mt-3 text-[10px] leading-4 text-[#6c7086]">This explains parsed tokens and actual match spans. JavaScript does not expose its internal backtracking trace.</p>
            </div> : <label className="flex min-h-0 flex-1 flex-col"><span className="shrink-0 px-4 py-2 text-[11px] text-[#9399b2]">Test string</span><textarea value={testText} onChange={event => setTestText(event.target.value)} spellCheck={false} aria-label="Regex test text" placeholder="Type or paste text to test..." className="min-h-0 flex-1 resize-none bg-[#1a1a2c] px-4 py-3 font-mono text-[12px] leading-6 text-[#cdd6f4] outline-none placeholder:text-[#585b70]" /></label>}
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#313244] px-4 py-2 text-[11px]">
              <span className="font-medium text-[#9399b2]">{mode === 'debug' ? 'Match debugger' : 'Match results'}</span>
              <span className="text-[#6c7086]">{pending ? 'Testing…' : `${matches.length}${matches.length === 1000 ? '+' : ''} match${matches.length === 1 ? '' : 'es'}`}</span>
            </div>
            {mode === 'test' ? <>
              <div className="min-h-0 flex-1 overflow-auto bg-[#1a1a2c] p-4 font-mono text-[12px] leading-6 whitespace-pre-wrap break-words"><HighlightedInput text={testText} matches={matches} /></div>
              <div className="max-h-[38%] min-h-24 overflow-auto border-t border-[#313244] p-3">
                {matches.length ? <div className="space-y-2">{matches.map((match, index) => <div key={`${match.index}-${index}`} className="rounded-md border border-[#313244] bg-[#181825] p-2.5"><div className="flex justify-between gap-2"><code className="break-all font-mono text-[11px] text-[#f9e2af]">{match.text || '(empty match)'}</code><span className="shrink-0 text-[10px] text-[#6c7086]">{match.index}–{match.end}</span></div>{(match.captures.length > 0 || Object.keys(match.namedCaptures).length > 0) && <div className="mt-2 space-y-1 border-t border-[#313244] pt-2">{match.captures.map((capture, groupIndex) => <div key={groupIndex} className="flex gap-2 text-[10px]"><span className="text-[#6c7086]">${groupIndex + 1}</span><code className="break-all text-[#a6e3a1]">{capture ?? '(unmatched)'}</code></div>)}{Object.entries(match.namedCaptures).map(([name, capture]) => <div key={name} className="flex gap-2 text-[10px]"><span className="text-[#89b4fa]">{name}</span><code className="break-all text-[#a6e3a1]">{capture ?? '(unmatched)'}</code></div>)}</div>}</div>)}</div>
                  : !pending && !workerError && <p className="py-3 text-center text-[11px] text-[#6c7086]">No matches found.</p>}
              </div>
            </> : <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
              {workerError && <p className="mb-3 text-[11px] text-[#f38ba8]">{workerError}</p>}
              {timedOut && <p className="mb-3 rounded border border-[#f9e2af]/20 bg-[#f9e2af]/5 p-2 text-[10px] leading-4 text-[#f9e2af]">Matching exceeded 900 ms and was stopped to keep the page responsive. Check for nested ambiguous quantifiers such as <code>(a+)+</code>.</p>}
              {matches.length ? <div className="mb-4 rounded-md border border-[#a6e3a1]/20 bg-[#a6e3a1]/5 p-3"><div className="flex items-center justify-between gap-2"><span className="text-[10px] uppercase text-[#a6e3a1]">Match {matchIndex + 1} of {matches.length}</span><div className="flex gap-1"><button onClick={() => setMatchIndex(value => Math.max(0, value - 1))} disabled={matchIndex === 0} aria-label="Previous match" className="rounded border border-[#313244] p-1 text-[#cdd6f4] disabled:opacity-30"><ChevronLeft size={13} /></button><button onClick={() => setMatchIndex(value => Math.min(matches.length - 1, value + 1))} disabled={matchIndex >= matches.length - 1} aria-label="Next match" className="rounded border border-[#313244] p-1 text-[#cdd6f4] disabled:opacity-30"><ChevronRight size={13} /></button></div></div><code className="mt-2 block break-all font-mono text-xs text-[#f9e2af]">{currentMatch?.text || '(empty match)'}</code><p className="mt-1 text-[10px] text-[#9399b2]">Characters {currentMatch?.index}–{currentMatch?.end}</p>{currentMatch?.captures.map((capture, index) => <p key={index} className="mt-1 text-[10px] text-[#6c7086]">Capture ${index + 1}: <code className="text-[#a6e3a1]">{capture ?? '(unmatched)'}</code></p>)}{Object.entries(currentMatch?.namedCaptures ?? {}).map(([name, capture]) => <p key={name} className="mt-1 text-[10px] text-[#6c7086]">{name}: <code className="text-[#a6e3a1]">{capture ?? '(unmatched)'}</code></p>)}</div>
                : <p className="text-[11px] text-[#6c7086]">{pending ? 'Running the test string in an isolated worker…' : 'No match trace yet. Add a pattern and test text.'}</p>}
              <h2 className="mb-2 text-[11px] font-semibold text-[#cdd6f4]">Test string with match spans</h2>
              <pre className="min-h-20 whitespace-pre-wrap break-words rounded-md border border-[#313244] bg-[#1a1a2c] p-3 font-mono text-[11px] leading-5"><HighlightedInput text={testText} matches={matches} /></pre>
              {workerError && !debugSteps.error && <p className="mt-3 text-[10px] text-[#f38ba8]">{workerError}</p>}
            </div>}
            {debugSteps.error && <div className="shrink-0 border-t border-[#313244] px-4 py-2 text-[10px] text-[#f38ba8]">Pattern error: {debugSteps.error}</div>}
          </div>
        </div>
      )}
    </section>
  );
}