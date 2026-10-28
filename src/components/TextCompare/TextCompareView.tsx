import { useState, useRef } from 'react';
import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react';
import {
  Copy,
  Download,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
  Settings,
  FileText,
  Zap,
  Sparkles,
  ArrowDownAZ,
  Check,
  AlertCircle,
} from 'lucide-react';
import { formatContent, detectFormat, type SupportedFormat } from '../../utils/diffFormatters';

interface DiffSettings {
  ignoreTrimWhitespace: boolean;
  ignoreLineEndings: boolean;
  showWhitespace: boolean;
  wordDiff: boolean;
  renderIndicators: boolean;
}

const DEFAULT_SETTINGS: DiffSettings = {
  ignoreTrimWhitespace: true,
  ignoreLineEndings: false,
  showWhitespace: false,
  wordDiff: true,
  renderIndicators: true,
};

function normalize(text: string, settings: DiffSettings) {
  if (settings.ignoreLineEndings) return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return text;
}

interface PanelHeaderProps {
  side: 'left' | 'right';
  label: string;
  color: string;
  text: string;
  onCopy: () => void;
  onClear: () => void;
  onFormat?: () => void;
}

function PanelHeader({
  side,
  label,
  color,
  text,
  onCopy,
  onClear,
  onFormat,
}: PanelHeaderProps) {
  const lines = text ? text.split('\n').length : 0;
  const chars = text.length;

  return (
    <div
      className="flex items-center justify-between px-3 shrink-0"
      style={{
        height: 40,
        background: 'linear-gradient(180deg, #1c1c30 0%, #181825 100%)',
        borderBottom: '1px solid #2a2a3e',
        borderLeft: side === 'left' ? `3px solid ${color}` : undefined,
        borderRight: side === 'right' ? `3px solid ${color}` : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
        <span className="text-xs font-semibold text-[#cdd6f4]">{label}</span>
        {text && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-md text-[#6c7086] font-mono"
            style={{ background: 'rgba(69,71,90,0.35)' }}
          >
            {lines.toLocaleString()} {lines === 1 ? 'line' : 'lines'} · {chars.toLocaleString()} chars
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {text && (
          <>
            {onFormat && (
              <button
                onClick={onFormat}
                title="Format & prettify this side (auto-detect JSON/XML/YAML, sort keys)"
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#89b4fa]/10 hover:bg-[#89b4fa]/20 text-[#89b4fa] hover:text-[#b4befe] text-[11px] font-medium transition-all mr-1"
              >
                <Sparkles size={11} />
                <span>Format</span>
              </button>
            )}
            <button
              onClick={onCopy}
              title="Copy"
              className="p-1.5 rounded-lg hover:bg-[#2a2a3e] text-[#6c7086] hover:text-[#cdd6f4] transition-all"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={onClear}
              title="Clear"
              className="p-1.5 rounded-lg hover:bg-[#2a2a3e] text-[#6c7086] hover:text-[#f38ba8] transition-all"
            >
              <RotateCcw size={12} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function TextCompareView() {
  const [leftText, setLeftText] = useState('');
  const [rightText, setRightText] = useState('');
  const [comparing, setComparing] = useState(false);
  const [inline, setInline] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<DiffSettings>(DEFAULT_SETTINGS);
  const [selectionSide, setSelectionSide] = useState<'left' | 'right' | null>(null);

  // Formatting & Diff state
  const [formatMode, setFormatMode] = useState<SupportedFormat>('auto');
  const [sortJsonKeys, setSortJsonKeys] = useState<boolean>(true);
  const [diffLanguage, setDiffLanguage] = useState<'plaintext' | 'json' | 'xml' | 'yaml'>('plaintext');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const selectionRef = useRef<{ side: 'left' | 'right'; text: string } | null>(null);

  const canCompare = leftText.trim().length > 0 || rightText.trim().length > 0;

  const showToast = (message: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const setSetting = <K extends keyof DiffSettings>(key: K, value: DiffSettings[K]) =>
    setSettings(s => ({ ...s, [key]: value }));

  // Read live content from Monaco editor when in compare mode
  const getLeftContent = () =>
    editorRef.current?.getOriginalEditor()?.getValue() ?? leftText;
  const getRightContent = () =>
    editorRef.current?.getModifiedEditor()?.getValue() ?? rightText;

  const handleCopy = (side: 'left' | 'right') => {
    navigator.clipboard.writeText(side === 'left' ? getLeftContent() : getRightContent());
    showToast(`${side === 'left' ? 'Original' : 'Modified'} copied to clipboard`, 'success');
  };

  const handleDownload = (side: 'left' | 'right') => {
    const content = side === 'left' ? getLeftContent() : getRightContent();
    const ext = diffLanguage === 'json' ? 'json' : diffLanguage === 'xml' ? 'xml' : diffLanguage === 'yaml' ? 'yaml' : 'txt';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = side === 'left' ? `original.${ext}` : `modified.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sync editor content back to state then flip view
  const handleBackToEdit = () => {
    if (editorRef.current) {
      setLeftText(getLeftContent());
      setRightText(getRightContent());
    }
    setComparing(false);
  };

  const copyLeftToRight = () => {
    const content = getLeftContent();
    setRightText(content);
    editorRef.current?.getModifiedEditor()?.setValue(content);
    showToast('Original content copied → Modified', 'success');
  };

  const copyRightToLeft = () => {
    const content = getRightContent();
    setLeftText(content);
    editorRef.current?.getOriginalEditor()?.setValue(content);
    showToast('Modified content copied → Original', 'success');
  };

  const copySelectionTo = (target: 'left' | 'right') => {
    if (!selectionRef.current || !editorRef.current || !monacoRef.current) return;
    const { text } = selectionRef.current;
    const targetEd =
      target === 'left'
        ? editorRef.current.getOriginalEditor()
        : editorRef.current.getModifiedEditor();
    if (!targetEd) return;
    const model = targetEd.getModel();
    if (!model) return;
    const pos = targetEd.getPosition();
    const line = pos?.lineNumber ?? model.getLineCount();
    const col = model.getLineMaxColumn(line);
    targetEd.executeEdits('copy-selection', [
      {
        range: new monacoRef.current.Range(line, col, line, col),
        text: '\n' + text,
      },
    ]);
    targetEd.focus();
  };

  const navigateDiff = (direction: 'next' | 'prev') => {
    const editor = editorRef.current;
    if (!editor) return;
    if (direction === 'next') editor.getAction('editor.action.diffReview.next')?.run();
    else editor.getAction('editor.action.diffReview.prev')?.run();
  };

  /**
   * Formatting Handler: Handles single side or both sides.
   * Auto-sorts JSON/YAML keys alphabetically if sortJsonKeys is enabled.
   */
  const handleFormat = (side: 'left' | 'right' | 'both', specificMode?: SupportedFormat) => {
    const modeToUse = specificMode || formatMode;

    if (side === 'left') {
      const text = getLeftContent();
      if (!text.trim()) return;
      const res = formatContent(text, modeToUse, sortJsonKeys);
      if (res.success) {
        setLeftText(res.result);
        if (comparing && editorRef.current) {
          editorRef.current.getOriginalEditor()?.setValue(res.result);
        }
        showToast(`Original formatted as ${res.detectedType}`, 'success');
      } else {
        showToast(`Original format error: ${res.error || 'Invalid syntax'}`, 'error');
      }
      return;
    }

    if (side === 'right') {
      const text = getRightContent();
      if (!text.trim()) return;
      const res = formatContent(text, modeToUse, sortJsonKeys);
      if (res.success) {
        setRightText(res.result);
        if (comparing && editorRef.current) {
          editorRef.current.getModifiedEditor()?.setValue(res.result);
        }
        showToast(`Modified formatted as ${res.detectedType}`, 'success');
      } else {
        showToast(`Modified format error: ${res.error || 'Invalid syntax'}`, 'error');
      }
      return;
    }

    // Formatting BOTH sides
    const left = getLeftContent();
    const right = getRightContent();
    if (!left.trim() && !right.trim()) {
      showToast('Both panes are empty. Nothing to format.', 'warn');
      return;
    }

    let finalMode = modeToUse;
    if (finalMode === 'auto') {
      const leftDet = detectFormat(left);
      const rightDet = detectFormat(right);
      if (leftDet === 'json' || rightDet === 'json') finalMode = 'json';
      else if (leftDet === 'xml' || rightDet === 'xml') finalMode = 'xml';
      else if (leftDet === 'yaml' || rightDet === 'yaml') finalMode = 'yaml';
      else finalMode = 'normalize';
    }

    const leftRes = left.trim()
      ? formatContent(left, finalMode, sortJsonKeys)
      : { success: true, result: '', detectedType: 'Empty' };
    const rightRes = right.trim()
      ? formatContent(right, finalMode, sortJsonKeys)
      : { success: true, result: '', detectedType: 'Empty' };

    if (leftRes.success && rightRes.success) {
      setLeftText(leftRes.result);
      setRightText(rightRes.result);

      if (comparing && editorRef.current) {
        editorRef.current.getOriginalEditor()?.setValue(leftRes.result);
        editorRef.current.getModifiedEditor()?.setValue(rightRes.result);
      }

      // Set diff syntax highlighting language
      if (finalMode === 'json') setDiffLanguage('json');
      else if (finalMode === 'xml') setDiffLanguage('xml');
      else if (finalMode === 'yaml') setDiffLanguage('yaml');
      else setDiffLanguage('plaintext');

      const sortNote = (finalMode === 'json' || finalMode === 'yaml') && sortJsonKeys ? ' (keys sorted A-Z)' : '';
      showToast(`Both inputs formatted as ${finalMode.toUpperCase()}${sortNote}`, 'success');
    } else {
      const errors: string[] = [];
      if (!leftRes.success) errors.push(`Original: ${leftRes.error}`);
      if (!rightRes.success) errors.push(`Modified: ${rightRes.error}`);

      if (leftRes.success && left.trim()) {
        setLeftText(leftRes.result);
        if (comparing && editorRef.current) editorRef.current.getOriginalEditor()?.setValue(leftRes.result);
      }
      if (rightRes.success && right.trim()) {
        setRightText(rightRes.result);
        if (comparing && editorRef.current) editorRef.current.getModifiedEditor()?.setValue(rightRes.result);
      }
      showToast(errors.join(' | '), 'error');
    }
  };

  const handleStartCompare = () => {
    // Auto detect diff language for Monaco
    const leftDet = detectFormat(leftText);
    const rightDet = detectFormat(rightText);
    if (leftDet === 'json' || rightDet === 'json') setDiffLanguage('json');
    else if (leftDet === 'xml' || rightDet === 'xml') setDiffLanguage('xml');
    else if (leftDet === 'yaml' || rightDet === 'yaml') setDiffLanguage('yaml');
    else setDiffLanguage('plaintext');

    setComparing(true);
  };

  // ── Compare view ──────────────────────────────────────────────────────────
  if (comparing) {
    return (
      <div className="flex flex-col h-full relative">
        {/* Panel headers */}
        <div className="flex shrink-0 bg-[#181825] border-b border-[#45475a] overflow-x-auto no-scrollbar items-center">
          {/* Left header */}
          <div className="flex-1 flex items-center justify-between px-3 py-1.5 border-r border-[#45475a] min-w-[220px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f38ba8]" />
              <span className="text-xs text-[#cdd6f4] font-medium">Original</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFormat('left')}
                title="Format & sort original"
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#89b4fa]/10 hover:bg-[#89b4fa]/20 text-[#89b4fa] transition-colors"
              >
                <Sparkles size={11} />
                <span>Format</span>
              </button>
              <button
                onClick={() => handleCopy('left')}
                title="Copy to clipboard"
                className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              >
                <Copy size={12} />
              </button>
              <button
                onClick={() => handleDownload('left')}
                title="Save as file"
                className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              >
                <Download size={12} />
              </button>
              <button
                onClick={handleBackToEdit}
                title="Back to edit"
                className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* Center: Format Both & Bidirectional Transfer */}
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 border-r border-[#45475a] shrink-0 bg-[#181825]">
            <button
              onClick={() => handleFormat('both')}
              title={`Format & align both sides with ${sortJsonKeys ? 'alphabetically sorted keys' : 'standard indent'}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#89b4fa]/20 text-[#89b4fa] hover:bg-[#89b4fa]/30 border border-[#89b4fa]/40 transition-all shadow-sm"
            >
              <Sparkles size={12} />
              <span>Format &amp; Sort Both</span>
            </button>

            <button
              onClick={copyLeftToRight}
              title="Copy entire left content → right"
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#313244] text-[#6c7086] hover:bg-[#45475a] hover:text-[#89b4fa] transition-colors whitespace-nowrap"
            >
              Left <ArrowRight size={10} />
            </button>

            <button
              onClick={copyRightToLeft}
              title="Copy entire right content → left"
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[#313244] text-[#6c7086] hover:bg-[#45475a] hover:text-[#89b4fa] transition-colors whitespace-nowrap"
            >
              <ArrowLeft size={10} /> Right
            </button>

            {selectionSide && (
              <button
                onMouseDown={e => {
                  e.preventDefault();
                  copySelectionTo(selectionSide === 'left' ? 'right' : 'left');
                }}
                title={`Insert selected ${selectionSide} lines into ${selectionSide === 'left' ? 'right' : 'left'} panel at cursor`}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[rgba(137,180,250,0.12)] text-[#89b4fa] hover:bg-[rgba(137,180,250,0.22)] transition-colors whitespace-nowrap"
              >
                {selectionSide === 'left' ? (
                  <>Sel <ArrowRight size={10} /> Right</>
                ) : (
                  <>Left <ArrowLeft size={10} /> Sel</>
                )}
              </button>
            )}
          </div>

          {/* Right header */}
          <div className="flex-1 flex items-center justify-between px-3 py-1.5 min-w-[260px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#a6e3a1]" />
              <span className="text-xs text-[#cdd6f4] font-medium">Modified</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFormat('right')}
                title="Format & sort modified"
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#a6e3a1]/10 hover:bg-[#a6e3a1]/20 text-[#a6e3a1] transition-colors"
              >
                <Sparkles size={11} />
                <span>Format</span>
              </button>
              <button
                onClick={() => navigateDiff('prev')}
                title="Prev diff"
                className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              >
                <ChevronUp size={12} />
              </button>
              <button
                onClick={() => navigateDiff('next')}
                title="Next diff"
                className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              >
                <ChevronDown size={12} />
              </button>
              <button
                onClick={() => setInline(v => !v)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  inline
                    ? 'bg-[#89b4fa] text-[#1e1e2e]'
                    : 'bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4]'
                }`}
              >
                {inline ? 'Inline' : 'Split'}
              </button>
              <button
                onClick={() => handleCopy('right')}
                title="Copy to clipboard"
                className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              >
                <Copy size={12} />
              </button>
              <button
                onClick={() => handleDownload('right')}
                title="Save as file"
                className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors"
              >
                <Download size={12} />
              </button>
              <button
                onClick={() => setSettingsOpen(v => !v)}
                title="Compare settings"
                className={`p-1 rounded transition-colors ${
                  settingsOpen
                    ? 'bg-[#89b4fa] text-[#1e1e2e]'
                    : 'hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4]'
                }`}
              >
                <Settings size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Settings panel */}
        {settingsOpen && (
          <div className="shrink-0 bg-[#24273a] border-b border-[#45475a] px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text-xs text-[#6c7086] font-medium shrink-0">Compare settings:</span>

              <label className="flex items-center gap-1.5 text-xs text-[#cdd6f4] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.ignoreTrimWhitespace}
                  onChange={e => setSetting('ignoreTrimWhitespace', e.target.checked)}
                  className="accent-[#89b4fa]"
                />
                Ignore trailing whitespace
              </label>

              <label className="flex items-center gap-1.5 text-xs text-[#cdd6f4] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.ignoreLineEndings}
                  onChange={e => setSetting('ignoreLineEndings', e.target.checked)}
                  className="accent-[#89b4fa]"
                />
                Ignore line endings (CR/LF)
              </label>

              <label className="flex items-center gap-1.5 text-xs text-[#cdd6f4] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.wordDiff}
                  onChange={e => setSetting('wordDiff', e.target.checked)}
                  className="accent-[#89b4fa]"
                />
                Word-level diff
              </label>

              <label className="flex items-center gap-1.5 text-xs text-[#cdd6f4] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.showWhitespace}
                  onChange={e => setSetting('showWhitespace', e.target.checked)}
                  className="accent-[#89b4fa]"
                />
                Show whitespace characters
              </label>

              <label className="flex items-center gap-1.5 text-xs text-[#cdd6f4] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.renderIndicators}
                  onChange={e => setSetting('renderIndicators', e.target.checked)}
                  className="accent-[#89b4fa]"
                />
                Show +/− indicators
              </label>

              {/* Language Selector */}
              <div className="flex items-center gap-1.5 text-xs text-[#cdd6f4]">
                <span className="text-[#6c7086]">Syntax:</span>
                <select
                  value={diffLanguage}
                  onChange={e => setDiffLanguage(e.target.value as any)}
                  className="bg-[#181825] border border-[#313244] text-xs px-2 py-0.5 rounded text-[#cdd6f4] focus:outline-none"
                >
                  <option value="plaintext">Plaintext</option>
                  <option value="json">JSON</option>
                  <option value="xml">XML / HTML</option>
                  <option value="yaml">YAML</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Monaco Diff Editor */}
        <div className="flex-1 min-h-0">
          <MonacoDiffEditor
            original={normalize(leftText, settings)}
            modified={normalize(rightText, settings)}
            language={diffLanguage}
            theme="vs-dark"
            options={{
              renderSideBySide: !inline,
              readOnly: false,
              originalEditable: true,
              fontSize: 13,
              lineHeight: 20,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              diffWordWrap: settings.wordDiff ? 'on' : 'off',
              renderIndicators: settings.renderIndicators,
              ignoreTrimWhitespace: settings.ignoreTrimWhitespace,
              renderWhitespace: settings.showWhitespace ? 'all' : 'none',
              padding: { top: 8 },
            } as any}
            onMount={(editor, monacoInstance) => {
              editorRef.current = editor;
              monacoRef.current = monacoInstance;

              const track = (side: 'left' | 'right', ed: any) => {
                ed.onDidChangeCursorSelection(() => {
                  const sel = ed.getSelection();
                  const text = sel && !sel.isEmpty() ? (ed.getModel()?.getValueInRange(sel) ?? '') : '';
                  if (text) {
                    selectionRef.current = { side, text };
                    setSelectionSide(side);
                  } else if (selectionRef.current?.side === side) {
                    selectionRef.current = null;
                    setSelectionSide(null);
                  }
                });
              };

              track('left', editor.getOriginalEditor());
              track('right', editor.getModifiedEditor());
            }}
          />
        </div>

        {/* Floating Toast */}
        {toast && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-2 duration-200"
            style={{
              background: toast.type === 'error' ? '#2e1924' : toast.type === 'warn' ? '#2e2519' : '#192823',
              borderColor: toast.type === 'error' ? '#f38ba8' : toast.type === 'warn' ? '#fab387' : '#a6e3a1',
              color: toast.type === 'error' ? '#f38ba8' : toast.type === 'warn' ? '#fab387' : '#a6e3a1',
            }}
          >
            {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  // ── Input view ────────────────────────────────────────────────────────────
  const leftLines = leftText ? leftText.split('\n').length : 0;
  const rightLines = rightText ? rightText.split('\n').length : 0;

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        {/* Left pane */}
        <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid #2a2a3e' }}>
          <PanelHeader
            side="left"
            label="Original Text"
            color="#f38ba8"
            text={leftText}
            onCopy={() => handleCopy('left')}
            onClear={() => setLeftText('')}
            onFormat={() => handleFormat('left')}
          />
          <div className="relative flex-1 min-h-0">
            {!leftText && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(243,139,168,0.06)',
                    border: '1px solid rgba(243,139,168,0.12)',
                  }}
                >
                  <FileText size={22} color="#f38ba8" strokeWidth={1.5} style={{ opacity: 0.5 }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: '#6c7086' }}>Paste original text</p>
                  <p className="text-xs mt-1" style={{ color: '#45475a' }}>JSON, XML, HTML, YAML or plain text</p>
                </div>
              </div>
            )}
            <textarea
              value={leftText}
              onChange={e => setLeftText(e.target.value)}
              spellCheck={false}
              className="tc-textarea"
              style={{ borderLeft: '3px solid rgba(243,139,168,0.15)' }}
            />
          </div>
        </div>

        {/* Right pane */}
        <div className="flex-1 flex flex-col">
          <PanelHeader
            side="right"
            label="Modified Text"
            color="#a6e3a1"
            text={rightText}
            onCopy={() => handleCopy('right')}
            onClear={() => setRightText('')}
            onFormat={() => handleFormat('right')}
          />
          <div className="relative flex-1 min-h-0">
            {!rightText && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(166,227,161,0.06)',
                    border: '1px solid rgba(166,227,161,0.12)',
                  }}
                >
                  <FileText size={22} color="#a6e3a1" strokeWidth={1.5} style={{ opacity: 0.5 }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: '#6c7086' }}>Paste modified text</p>
                  <p className="text-xs mt-1" style={{ color: '#45475a' }}>JSON, XML, HTML, YAML or plain text</p>
                </div>
              </div>
            )}
            <textarea
              value={rightText}
              onChange={e => setRightText(e.target.value)}
              spellCheck={false}
              className="tc-textarea"
              style={{ borderLeft: '3px solid rgba(166,227,161,0.15)' }}
            />
          </div>
        </div>
      </div>

      {/* Compare & Format Control Bar */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-2.5 gap-4 flex-wrap"
        style={{
          background: 'linear-gradient(180deg, #181825 0%, #141420 100%)',
          borderTop: '1px solid #2a2a3e',
        }}
      >
        {/* Left stats */}
        <div className="text-[11px] text-[#6c7086] font-mono shrink-0 min-w-[120px]">
          {leftText ? (
            <span>
              <span className="text-[#f38ba8] font-medium">{leftLines.toLocaleString()}</span> lines ·{' '}
              {leftText.length.toLocaleString()} chars
            </span>
          ) : (
            <span className="text-[#3b3e52]">No original</span>
          )}
        </div>

        {/* Center: Format Controls & Compare Action */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {/* Format Control Group */}
          <div className="flex items-center gap-1.5 bg-[#11111b] border border-[#313244] rounded-xl p-1">
            <button
              onClick={() => handleFormat('both')}
              disabled={!leftText.trim() && !rightText.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#89b4fa]/15 text-[#89b4fa] hover:bg-[#89b4fa]/25 border border-[#89b4fa]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Auto-format and align both sides with consistent indentation and sorted keys"
            >
              <Sparkles size={13} />
              <span>Format Both</span>
            </button>

            {/* Target Format Selector */}
            <select
              value={formatMode}
              onChange={e => setFormatMode(e.target.value as SupportedFormat)}
              className="px-2 py-1.5 bg-[#181825] border border-[#313244] rounded-lg text-xs font-medium text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa] cursor-pointer"
            >
              <option value="auto">⚡ Auto-Detect</option>
              <option value="json">{} JSON</option>
              <option value="xml">&lt;&gt; XML / HTML</option>
              <option value="yaml">☰ YAML</option>
              <option value="normalize">⇥ Trim Whitespace</option>
            </select>

            {/* Sort Keys (A-Z) Toggle */}
            <label
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                sortJsonKeys
                  ? 'bg-[#cba6f7]/15 text-[#cba6f7] border border-[#cba6f7]/30'
                  : 'text-[#6c7086] hover:text-[#cdd6f4]'
              }`}
              title="Alphabetically sort JSON & YAML keys so order differences don't create false diffs"
            >
              <input
                type="checkbox"
                checked={sortJsonKeys}
                onChange={e => setSortJsonKeys(e.target.checked)}
                className="hidden"
              />
              <ArrowDownAZ size={13} />
              <span className="select-none font-semibold">Sort Keys (A-Z)</span>
            </label>
          </div>

          <div className="h-6 w-px bg-[#313244]" />

          {/* Compare button */}
          <button
            onClick={handleStartCompare}
            disabled={!canCompare}
            className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={
              canCompare
                ? {
                    background: 'linear-gradient(135deg, #89b4fa 0%, #74c7ec 100%)',
                    color: '#1e1e2e',
                    boxShadow:
                      '0 4px 20px rgba(137,180,250,0.35), 0 1px 0 rgba(255,255,255,0.15) inset',
                  }
                : {
                    background: '#1e1e2e',
                    color: '#3d3f55',
                    border: '1px solid #2a2a3e',
                    cursor: 'not-allowed',
                  }
            }
          >
            {canCompare ? <Zap size={14} fill="currentColor" /> : <ArrowLeftRight size={14} />}
            <span>Compare</span>
          </button>

          {(leftText || rightText) && (
            <button
              onClick={() => {
                setLeftText('');
                setRightText('');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all text-[#6c7086] hover:text-[#f38ba8] bg-[#313244]/40 hover:bg-[#313244]"
              title="Clear both inputs"
            >
              <RotateCcw size={11} />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Right stats */}
        <div className="text-[11px] text-[#6c7086] font-mono shrink-0 min-w-[120px] text-right">
          {rightText ? (
            <span>
              <span className="text-[#a6e3a1] font-medium">{rightLines.toLocaleString()}</span> lines ·{' '}
              {rightText.length.toLocaleString()} chars
            </span>
          ) : (
            <span className="text-[#3b3e52]">No modified</span>
          )}
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 border animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            background: toast.type === 'error' ? '#2e1924' : toast.type === 'warn' ? '#2e2519' : '#192823',
            borderColor: toast.type === 'error' ? '#f38ba8' : toast.type === 'warn' ? '#fab387' : '#a6e3a1',
            color: toast.type === 'error' ? '#f38ba8' : toast.type === 'warn' ? '#fab387' : '#a6e3a1',
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
