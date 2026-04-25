import { useState, useRef, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import {
  Copy, Save, RotateCcw, ChevronUp, ChevronDown, Settings, ArrowRight, ArrowLeft,
} from 'lucide-react';
import DropZone from '../Common/DropZone';
import { detectLanguage } from '../../utils/fileUtils';

interface FileInfo { name: string; content: string; }

interface DiffSettings {
  ignoreTrimWhitespace: boolean;
  showWhitespace: boolean;
}

const DEFAULT_SETTINGS: DiffSettings = { ignoreTrimWhitespace: true, showWhitespace: false };

type Arrow = { y: number; line: number; dir: 'ltr' | 'rtl'; change: any };

export default function FileCompareView() {
  const [left, setLeft] = useState<FileInfo | null>(null);
  const [right, setRight] = useState<FileInfo | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<DiffSettings>(DEFAULT_SETTINGS);
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const origEdRef = useRef<any>(null);
  const modiEdRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const syncingRef = useRef(false);
  const origZoneIds = useRef<string[]>([]);
  const modiZoneIds = useRef<string[]>([]);
  const origDecIds = useRef<string[]>([]);
  const modiDecIds = useRef<string[]>([]);
  const hiddenDiffRef = useRef<any>(null);
  const hiddenContainerRef = useRef<HTMLDivElement | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const language = detectLanguage(left?.name ?? right?.name ?? '');
  const getLeftContent = () => origEdRef.current?.getValue() ?? left?.content ?? '';
  const getRightContent = () => modiEdRef.current?.getValue() ?? right?.content ?? '';

  // Cleanup hidden diff editor on unmount
  useEffect(() => {
    return () => {
      hiddenDiffRef.current?.dispose();
      hiddenDiffRef.current = null;
      if (hiddenContainerRef.current) {
        document.body.removeChild(hiddenContainerRef.current);
        hiddenContainerRef.current = null;
      }
    };
  }, []);

  // Sync editor content when a new file is loaded
  useEffect(() => {
    if (left && origEdRef.current) {
      const model = origEdRef.current.getModel();
      if (model && model.getValue() !== left.content) origEdRef.current.setValue(left.content);
    }
  }, [left]);

  useEffect(() => {
    if (right && modiEdRef.current) {
      const model = modiEdRef.current.getModel();
      if (model && model.getValue() !== right.content) modiEdRef.current.setValue(right.content);
    }
  }, [right]);

  // ── Diff changes → decorations + ViewZones + arrows ──────────────────────
  const applyDiffChanges = (changes: any[]) => {
    const origEd = origEdRef.current;
    const modiEd = modiEdRef.current;
    const Monaco = monacoRef.current;
    if (!origEd || !modiEd || !Monaco) return;

    // ViewZones: pad shorter side so hunks stay visually aligned
    origEd.changeViewZones((acc: any) => {
      origZoneIds.current.forEach((id: string) => acc.removeZone(id));
      origZoneIds.current = [];
      for (const c of changes) {
        const origLen = c.originalEndLineNumber === 0 ? 0 : c.originalEndLineNumber - c.originalStartLineNumber + 1;
        const modiLen = c.modifiedEndLineNumber === 0 ? 0 : c.modifiedEndLineNumber - c.modifiedStartLineNumber + 1;
        const extra = modiLen - origLen;
        if (extra > 0) {
          const after = c.originalEndLineNumber === 0 ? c.originalStartLineNumber : c.originalEndLineNumber;
          const dn = document.createElement('div');
          dn.style.background = 'rgba(137,180,250,0.04)';
          origZoneIds.current.push(acc.addZone({ afterLineNumber: after, heightInLines: extra, domNode: dn }));
        }
      }
    });

    modiEd.changeViewZones((acc: any) => {
      modiZoneIds.current.forEach((id: string) => acc.removeZone(id));
      modiZoneIds.current = [];
      for (const c of changes) {
        const origLen = c.originalEndLineNumber === 0 ? 0 : c.originalEndLineNumber - c.originalStartLineNumber + 1;
        const modiLen = c.modifiedEndLineNumber === 0 ? 0 : c.modifiedEndLineNumber - c.modifiedStartLineNumber + 1;
        const extra = origLen - modiLen;
        if (extra > 0) {
          const after = c.modifiedEndLineNumber === 0 ? c.modifiedStartLineNumber : c.modifiedEndLineNumber;
          const dn = document.createElement('div');
          dn.style.background = 'rgba(243,139,168,0.04)';
          modiZoneIds.current.push(acc.addZone({ afterLineNumber: after, heightInLines: extra, domNode: dn }));
        }
      }
    });

    // Decorations: red on left for deleted/changed, green on right for added/changed
    origDecIds.current = origEd.deltaDecorations(origDecIds.current,
      changes.filter((c: any) => c.originalEndLineNumber > 0).map((c: any) => ({
        range: new Monaco.Range(c.originalStartLineNumber, 1, c.originalEndLineNumber, 1),
        options: { isWholeLine: true, className: 'diff-orig-line' },
      }))
    );

    modiDecIds.current = modiEd.deltaDecorations(modiDecIds.current,
      changes.filter((c: any) => c.modifiedEndLineNumber > 0).map((c: any) => ({
        range: new Monaco.Range(c.modifiedStartLineNumber, 1, c.modifiedEndLineNumber, 1),
        options: { isWholeLine: true, className: 'diff-modi-line' },
      }))
    );

    // Arrows: one per diff line in center strip
    const origScroll = origEd.getScrollTop();
    const modiScroll = modiEd.getScrollTop();
    const next: Arrow[] = [];

    for (const c of changes) {
      if (c.originalEndLineNumber > 0) {
        for (let ln = c.originalStartLineNumber; ln <= c.originalEndLineNumber; ln++) {
          next.push({ y: origEd.getTopForLineNumber(ln) - origScroll, line: ln, dir: 'ltr', change: c });
        }
      }
      if (c.modifiedEndLineNumber > 0) {
        for (let ln = c.modifiedStartLineNumber; ln <= c.modifiedEndLineNumber; ln++) {
          next.push({ y: modiEd.getTopForLineNumber(ln) - modiScroll, line: ln, dir: 'rtl', change: c });
        }
      }
    }
    setArrows(next);
  };

  const applyDiffChangesRef = useRef(applyDiffChanges);
  applyDiffChangesRef.current = applyDiffChanges;

  // Create off-screen DiffEditor sharing same models as visible editors
  const tryCreateHiddenDiff = (Monaco: any) => {
    if (hiddenDiffRef.current || !origEdRef.current || !modiEdRef.current) return;
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:400px;height:300px;';
    document.body.appendChild(container);
    hiddenContainerRef.current = container;

    const diffEd = Monaco.editor.createDiffEditor(container, {
      automaticLayout: false,
      readOnly: true,
      renderSideBySide: true,
      ignoreTrimWhitespace: settingsRef.current.ignoreTrimWhitespace,
    });

    diffEd.setModel({
      original: origEdRef.current.getModel(),
      modified: modiEdRef.current.getModel(),
    });

    diffEd.onDidUpdateDiff(() => {
      applyDiffChangesRef.current(diffEd.getLineChanges() ?? []);
    });

    hiddenDiffRef.current = diffEd;
  };

  // ── Per-line apply ──────────────────────────────────────────────────────────
  // → click: apply original line → right (modified)
  const applyLineToRight = (change: any, origLine: number) => {
    const origEd = origEdRef.current;
    const modiEd = modiEdRef.current;
    const Monaco = monacoRef.current;
    if (!origEd || !modiEd || !Monaco) return;
    const origModel = origEd.getModel();
    const modiModel = modiEd.getModel();
    if (!origModel || !modiModel) return;

    const content = origModel.getLineContent(origLine);
    const offset = origLine - change.originalStartLineNumber;
    const modiStart = change.modifiedStartLineNumber;
    const modiEnd = change.modifiedEndLineNumber;
    const targetLine = modiStart + offset;

    if (modiEnd === 0) {
      // Pure deletion in right — insert the original line back
      const after = Math.max(modiStart, 1);
      modiEd.executeEdits('ltr', [{ range: new Monaco.Range(after, modiModel.getLineMaxColumn(after), after, modiModel.getLineMaxColumn(after)), text: '\n' + content }]);
    } else if (targetLine <= modiEnd) {
      modiEd.executeEdits('ltr', [{ range: new Monaco.Range(targetLine, 1, targetLine, modiModel.getLineMaxColumn(targetLine)), text: content }]);
    } else {
      modiEd.executeEdits('ltr', [{ range: new Monaco.Range(modiEnd, modiModel.getLineMaxColumn(modiEnd), modiEnd, modiModel.getLineMaxColumn(modiEnd)), text: '\n' + content }]);
    }
  };

  // ← click: apply modified line → left (original)
  const applyLineToLeft = (change: any, modiLine: number) => {
    const origEd = origEdRef.current;
    const modiEd = modiEdRef.current;
    const Monaco = monacoRef.current;
    if (!origEd || !modiEd || !Monaco) return;
    const origModel = origEd.getModel();
    const modiModel = modiEd.getModel();
    if (!origModel || !modiModel) return;

    const content = modiModel.getLineContent(modiLine);
    const offset = modiLine - change.modifiedStartLineNumber;
    const origStart = change.originalStartLineNumber;
    const origEnd = change.originalEndLineNumber;
    const targetLine = origStart + offset;

    if (origEnd === 0) {
      // Pure insertion in right — insert into left
      const after = Math.max(origStart, 1);
      origEd.executeEdits('rtl', [{ range: new Monaco.Range(after, origModel.getLineMaxColumn(after), after, origModel.getLineMaxColumn(after)), text: '\n' + content }]);
    } else if (targetLine <= origEnd) {
      origEd.executeEdits('rtl', [{ range: new Monaco.Range(targetLine, 1, targetLine, origModel.getLineMaxColumn(targetLine)), text: content }]);
    } else {
      origEd.executeEdits('rtl', [{ range: new Monaco.Range(origEnd, origModel.getLineMaxColumn(origEnd), origEnd, origModel.getLineMaxColumn(origEnd)), text: '\n' + content }]);
    }
  };

  // ── Utilities ───────────────────────────────────────────────────────────────
  const handleCopy = (side: 'left' | 'right') =>
    navigator.clipboard.writeText(side === 'left' ? getLeftContent() : getRightContent());

  const handleSave = async (side: 'left' | 'right') => {
    const info = side === 'left' ? left : right;
    if (!info) return;
    const content = side === 'left' ? getLeftContent() : getRightContent();
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({ suggestedName: info.name });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return;
      } catch { }
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = info.name; a.click();
    URL.revokeObjectURL(url);
  };

  const copyLeftToRight = () => modiEdRef.current?.setValue(getLeftContent());
  const copyRightToLeft = () => origEdRef.current?.setValue(getRightContent());

  const navigateDiff = (dir: 'next' | 'prev') => {
    const origEd = origEdRef.current;
    if (!origEd) return;
    const scroll = origEd.getScrollTop();
    const height = origEd.getLayoutInfo().height;
    const mid = scroll + height / 2;
    const ltr = arrows.filter(a => a.dir === 'ltr');
    if (!ltr.length) return;
    let target: Arrow | undefined;
    if (dir === 'next') target = ltr.find(a => origEd.getTopForLineNumber(a.line) > mid);
    else {
      const before = ltr.filter(a => origEd.getTopForLineNumber(a.line) < mid - 50);
      target = before[before.length - 1];
    }
    if (target) origEd.setScrollTop(origEd.getTopForLineNumber(target.line) - 80);
  };

  const setSetting = <K extends keyof DiffSettings>(key: K, value: DiffSettings[K]) => {
    setSettings(s => ({ ...s, [key]: value }));
    // Re-configure hidden diff editor if settings changed
    if (key === 'ignoreTrimWhitespace' && hiddenDiffRef.current) {
      hiddenDiffRef.current.updateOptions({ ignoreTrimWhitespace: value });
    }
  };

  // ── Editor mount ────────────────────────────────────────────────────────────
  const editorOptions: any = {
    readOnly: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
    lineNumbers: 'on',
    folding: true,
    wordWrap: 'off',
    scrollbar: { useShadows: false },
  };

  const updateArrowsOnScroll = () => {
    const origEd = origEdRef.current;
    const modiEd = modiEdRef.current;
    if (!origEd || !modiEd || !hiddenDiffRef.current) return;
    const changes = hiddenDiffRef.current.getLineChanges() ?? [];
    const origScroll = origEd.getScrollTop();
    const modiScroll = modiEd.getScrollTop();
    const next: Arrow[] = [];
    for (const c of changes) {
      if (c.originalEndLineNumber > 0) {
        for (let ln = c.originalStartLineNumber; ln <= c.originalEndLineNumber; ln++) {
          next.push({ y: origEd.getTopForLineNumber(ln) - origScroll, line: ln, dir: 'ltr', change: c });
        }
      }
      if (c.modifiedEndLineNumber > 0) {
        for (let ln = c.modifiedStartLineNumber; ln <= c.modifiedEndLineNumber; ln++) {
          next.push({ y: modiEd.getTopForLineNumber(ln) - modiScroll, line: ln, dir: 'rtl', change: c });
        }
      }
    }
    setArrows(next);
  };

  const onOrigMount = (editor: any, Monaco: any) => {
    origEdRef.current = editor;
    monacoRef.current = Monaco;
    editor.onDidScrollChange(() => {
      if (!syncingRef.current) {
        syncingRef.current = true;
        modiEdRef.current?.setScrollTop(editor.getScrollTop());
        modiEdRef.current?.setScrollLeft(editor.getScrollLeft());
        syncingRef.current = false;
      }
      updateArrowsOnScroll();
    });
    tryCreateHiddenDiff(Monaco);
  };

  const onModiMount = (editor: any, Monaco: any) => {
    modiEdRef.current = editor;
    monacoRef.current = Monaco;
    editor.onDidScrollChange(() => {
      if (!syncingRef.current) {
        syncingRef.current = true;
        origEdRef.current?.setScrollTop(editor.getScrollTop());
        origEdRef.current?.setScrollLeft(editor.getScrollLeft());
        syncingRef.current = false;
      }
      updateArrowsOnScroll();
    });
    tryCreateHiddenDiff(Monaco);
  };

  // ── Single-side preview ─────────────────────────────────────────────────────
  if (!left || !right) {
    const renderSide = (side: 'left' | 'right') => {
      const file = side === 'left' ? left : right;
      const color = side === 'left' ? 'bg-[#f38ba8]' : 'bg-[#a6e3a1]';
      const role = side === 'left' ? 'original' : 'modified';
      const label = side === 'left' ? 'Left File (Original)' : 'Right File (Modified)';
      const setFile = side === 'left'
        ? (name: string, content: string) => setLeft({ name, content })
        : (name: string, content: string) => setRight({ name, content });
      const clearFile = side === 'left' ? () => setLeft(null) : () => setRight(null);

      if (file) {
        return (
          <div className="flex flex-col h-full border border-[#45475a] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#181825] border-b border-[#45475a] shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-[#cdd6f4] font-medium truncate max-w-[180px]" title={file.name}>{file.name}</span>
                <span className="text-xs text-[#6c7086]">{role}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => navigator.clipboard.writeText(file.content)} title="Copy"
                  className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
                  <Copy size={12} />
                </button>
                <button onClick={clearFile} title="Close"
                  className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#f38ba8] transition-colors">
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor height="100%" language={detectLanguage(file.name)} value={file.content} theme="vs-dark"
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace', lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'off' }} />
            </div>
          </div>
        );
      }
      return <DropZone label={label} onFileLoad={setFile} fileName={undefined} />;
    };

    return (
      <div className="flex h-full gap-1 p-2">
        <div className="flex-1 flex flex-col min-h-0">{renderSide('left')}</div>
        <div className="flex-1 flex flex-col min-h-0">{renderSide('right')}</div>
      </div>
    );
  }

  // ── Full diff view ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Panel headers */}
      <div className="flex shrink-0 bg-[#181825] border-b border-[#45475a]">

        {/* Left header */}
        <div className="flex-1 flex items-center justify-between px-3 py-1.5 border-r border-[#45475a] min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#f38ba8] shrink-0" />
            <span className="text-xs text-[#cdd6f4] font-medium truncate max-w-[150px]" title={left.name}>{left.name}</span>
            <span className="text-xs text-[#6c7086] shrink-0">original</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => handleCopy('left')} title="Copy to clipboard"
              className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
              <Copy size={12} />
            </button>
            <button onClick={() => handleSave('left')} title="Save to disk"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs hover:bg-[#313244] text-[#6c7086] hover:text-[#a6e3a1] transition-colors">
              <Save size={11} /><span>Save</span>
            </button>
            <button onClick={() => setLeft(null)} title="Close"
              className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#f38ba8] transition-colors">
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* Center header — same width as center strip */}
        <div className="w-9 shrink-0 flex flex-col items-center justify-center gap-0.5 border-r border-[#45475a] py-1 bg-[#181825]">
          <button onClick={copyLeftToRight} title="Copy all left → right"
            className="w-7 h-4 flex items-center justify-center rounded hover:bg-[#313244] text-[#a6e3a1] transition-colors">
            <ArrowRight size={10} />
          </button>
          <button onClick={copyRightToLeft} title="Copy all right → left"
            className="w-7 h-4 flex items-center justify-center rounded hover:bg-[#313244] text-[#89b4fa] transition-colors">
            <ArrowLeft size={10} />
          </button>
        </div>

        {/* Right header */}
        <div className="flex-1 flex items-center justify-between px-3 py-1.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#a6e3a1] shrink-0" />
            <span className="text-xs text-[#cdd6f4] font-medium truncate max-w-[150px]" title={right.name}>{right.name}</span>
            <span className="text-xs text-[#6c7086] shrink-0">modified</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => navigateDiff('prev')} title="Prev diff"
              className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
              <ChevronUp size={12} />
            </button>
            <button onClick={() => navigateDiff('next')} title="Next diff"
              className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
              <ChevronDown size={12} />
            </button>
            <button onClick={() => handleCopy('right')} title="Copy to clipboard"
              className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
              <Copy size={12} />
            </button>
            <button onClick={() => handleSave('right')} title="Save to disk"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs hover:bg-[#313244] text-[#6c7086] hover:text-[#a6e3a1] transition-colors">
              <Save size={11} /><span>Save</span>
            </button>
            <button onClick={() => setRight(null)} title="Close"
              className="p-1 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#f38ba8] transition-colors">
              <RotateCcw size={12} />
            </button>
            <button onClick={() => setSettingsOpen(v => !v)} title="Settings"
              className={`p-1 rounded transition-colors ${settingsOpen ? 'bg-[#89b4fa] text-[#1e1e2e]' : 'hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4]'}`}>
              <Settings size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div className="shrink-0 bg-[#24273a] border-b border-[#45475a] px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-xs text-[#6c7086] font-medium shrink-0">Settings:</span>
            <label className="flex items-center gap-1.5 text-xs text-[#cdd6f4] cursor-pointer select-none">
              <input type="checkbox" checked={settings.ignoreTrimWhitespace}
                onChange={e => setSetting('ignoreTrimWhitespace', e.target.checked)} className="accent-[#89b4fa]" />
              Ignore trailing whitespace
            </label>
            <label className="flex items-center gap-1.5 text-xs text-[#cdd6f4] cursor-pointer select-none">
              <input type="checkbox" checked={settings.showWhitespace}
                onChange={e => setSetting('showWhitespace', e.target.checked)} className="accent-[#89b4fa]" />
              Show whitespace
            </label>
          </div>
        </div>
      )}

      {/* Three-column editor area */}
      <div className="flex flex-1 min-h-0">

        {/* Left editor */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <MonacoEditor
            height="100%"
            defaultValue={left.content}
            language={language}
            theme="vs-dark"
            options={{ ...editorOptions, renderWhitespace: settings.showWhitespace ? 'all' : 'none' }}
            onMount={onOrigMount}
          />
        </div>

        {/* Center strip — left half: → arrows, right half: ← arrows */}
        <div className="w-9 shrink-0 bg-[#181825] border-x border-[#45475a] relative overflow-hidden select-none">
          {arrows.map((arrow, i) => (
            <button
              key={`${arrow.dir}-${arrow.line}-${i}`}
              title={arrow.dir === 'ltr' ? 'Apply line → right' : 'Apply line ← left'}
              className="absolute h-[18px] flex items-center justify-center rounded text-[11px] font-bold opacity-50 hover:opacity-100 transition-opacity"
              style={{
                top: Math.max(0, arrow.y + 1),
                left: arrow.dir === 'ltr' ? 1 : 19,
                width: 17,
                color: arrow.dir === 'ltr' ? '#a6e3a1' : '#89b4fa',
                background: arrow.dir === 'ltr' ? 'rgba(166,227,161,0.08)' : 'rgba(137,180,250,0.08)',
              }}
              onClick={() => arrow.dir === 'rtl'
                ? applyLineToLeft(arrow.change, arrow.line)
                : applyLineToRight(arrow.change, arrow.line)
              }
            >
              {arrow.dir === 'ltr' ? '→' : '←'}
            </button>
          ))}
        </div>

        {/* Right editor */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <MonacoEditor
            height="100%"
            defaultValue={right.content}
            language={language}
            theme="vs-dark"
            options={{ ...editorOptions, renderWhitespace: settings.showWhitespace ? 'all' : 'none' }}
            onMount={onModiMount}
          />
        </div>

      </div>
    </div>
  );
}
