import { useState, useRef, useEffect, useCallback } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { Scissors, Check, X, ArrowRight, Trash2, ArrowLeftRight } from 'lucide-react';
import * as monaco from 'monaco-editor';
import DropZone from '../Common/DropZone';
import MoveArrow from './MoveArrow';
import { detectLanguage } from '../../utils/fileUtils';

interface FileInfo {
  name: string;
  content: string;
}

interface PendingMove {
  id: string;
  startLine: number;
  endLine: number;
  lines: string[];
  source: 'left' | 'right';
  // arrow coordinates (pixel)
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  targetLine: number;
  target: 'left' | 'right';
  applied: boolean;
}

export default function CodeMoverView() {
  const [left, setLeft] = useState<FileInfo | null>(null);
  const [right, setRight] = useState<FileInfo | null>(null);
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [moves, setMoves] = useState<PendingMove[]>([]);
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<{
    source: 'left' | 'right';
    startLine: number;
    endLine: number;
    lines: string[];
  } | null>(null);

  const leftEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const rightEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const leftContainerRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Ref-based mouse handler to avoid stale closure in Monaco's one-time onMount registration
  const mouseHandlerRef = useRef<(side: 'left' | 'right', e: monaco.editor.IEditorMouseEvent) => void>(() => {});

  useEffect(() => {
    if (left) setLeftContent(left.content);
  }, [left]);
  useEffect(() => {
    if (right) setRightContent(right.content);
  }, [right]);

  // Update SVG size on resize

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  // Get pixel Y position for a line in an editor
  const getLineY = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor | null, line: number, svgRect: DOMRect): number => {
      if (!editor) return 0;
      const top = editor.getTopForLineNumber(line) - editor.getScrollTop();
      const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
      const containerRect = (editor as any).getDomNode()?.getBoundingClientRect();
      if (!containerRect || !svgRect) return 0;
      return containerRect.top - svgRect.top + top + lineHeight / 2;
    },
    []
  );

  // Get pixel X (right edge of left panel, or left edge of right panel)
  const getPanelEdgeX = useCallback(
    (side: 'left' | 'right', svgRect: DOMRect): number => {
      const containerRef = side === 'left' ? leftContainerRef : rightContainerRef;
      if (!containerRef.current || !svgRect) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      return side === 'left'
        ? rect.right - svgRect.left
        : rect.left - svgRect.left;
    },
    []
  );

  const captureSelection = (source: 'left' | 'right') => {
    const editor = source === 'left' ? leftEditorRef.current : rightEditorRef.current;
    if (!editor) return;
    const sel = editor.getSelection();
    if (!sel) { showNotification('Make a selection in the editor first'); return; }

    const startLine = sel.startLineNumber;
    const endLine = sel.endLineNumber;
    const model = editor.getModel();
    if (!model) return;

    const lines: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      lines.push(model.getLineContent(i));
    }

    setSelection({ source, startLine, endLine, lines });
    setSelecting(true);
    showNotification(`Selected ${lines.length} line(s) from ${source} panel. Now click target line in ${source === 'left' ? 'right' : 'left'} panel.`);
  };

  const applyTargetClick = (target: 'left' | 'right', lineNumber: number) => {
    if (!selection || !selecting) return;
    if (target === selection.source) {
      showNotification('Target must be the opposite panel');
      return;
    }

    const srcEditor = selection.source === 'left' ? leftEditorRef.current : rightEditorRef.current;
    const tgtEditor = target === 'left' ? leftEditorRef.current : rightEditorRef.current;
    const rect = svgRef.current?.getBoundingClientRect() ?? new DOMRect();

    const fromY = getLineY(srcEditor, Math.round((selection.startLine + selection.endLine) / 2), rect);
    const toY = getLineY(tgtEditor, lineNumber, rect);
    const fromX = getPanelEdgeX(selection.source, rect);
    const toX = getPanelEdgeX(target, rect);

    const move: PendingMove = {
      id: Date.now().toString(),
      startLine: selection.startLine,
      endLine: selection.endLine,
      lines: selection.lines,
      source: selection.source,
      fromX, fromY, toX, toY,
      targetLine: lineNumber,
      target,
      applied: false,
    };

    setMoves(prev => [...prev, move]);
    setSelection(null);
    setSelecting(false);
    showNotification(`Move queued: ${selection.lines.length} line(s) → ${target} panel at line ${lineNumber}`);
  };

  const applyMove = (move: PendingMove) => {
    const targetLines = (move.target === 'left' ? leftContent : rightContent).split('\n');
    const insertIdx = move.targetLine; // insert after this line (0-indexed: after line N means before index N)
    const newLines = [
      ...targetLines.slice(0, insertIdx),
      ...move.lines,
      ...targetLines.slice(insertIdx),
    ];
    const newContent = newLines.join('\n');

    if (move.target === 'left') setLeftContent(newContent);
    else setRightContent(newContent);

    // Also remove from source if "move" (not copy)
    const srcLines = (move.source === 'left' ? leftContent : rightContent).split('\n');
    const afterRemove = [
      ...srcLines.slice(0, move.startLine - 1),
      ...srcLines.slice(move.endLine),
    ].join('\n');
    if (move.source === 'left') setLeftContent(afterRemove);
    else setRightContent(afterRemove);

    setMoves(prev => prev.map(m => m.id === move.id ? { ...m, applied: true } : m));
    showNotification('Move applied!');
  };

  const discardMove = (id: string) => {
    setMoves(prev => prev.filter(m => m.id !== id));
  };

  // Update ref every render so Monaco's stale onMount listener always calls the current version
  mouseHandlerRef.current = (side: 'left' | 'right', e: monaco.editor.IEditorMouseEvent) => {
    if (!selecting || !selection) return;
    if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS ||
        e.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT ||
        e.target.type === monaco.editor.MouseTargetType.CONTENT_EMPTY) {
      const line = e.target.position?.lineNumber;
      if (line) applyTargetClick(side, line);
    }
  };

  const lang = detectLanguage(left?.name ?? right?.name ?? '');

  if (!left || !right) {
    const renderSide = (side: 'left' | 'right') => {
      const file: FileInfo | null = side === 'left' ? left : right;
      const color = side === 'left' ? 'bg-[#f38ba8]' : 'bg-[#a6e3a1]';
      const label = side === 'left' ? 'Source File' : 'Target File';
      const setFile = side === 'left'
        ? (name: string, content: string) => setLeft({ name, content })
        : (name: string, content: string) => setRight({ name, content });

      if (file) {
        return (
          <div className="flex flex-col h-full border border-[#45475a] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181825] border-b border-[#45475a] shrink-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
              <span className="text-xs text-[#cdd6f4] font-medium truncate">{file.name}</span>
              <span className="ml-auto text-xs text-[#6c7086]">Waiting for {side === 'left' ? 'right' : 'left'} file…</span>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                language={detectLanguage(file.name)}
                value={file.content}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>
        );
      }

      return (
        <DropZone
          label={label}
          onFileLoad={setFile}
          fileName={file?.name}
        />
      );
    };

    return (
      <div className="flex h-full gap-1 p-2">
        <div className="flex-1 flex flex-col min-h-0">{renderSide('left')}</div>
        <div className="flex-1 flex flex-col min-h-0">{renderSide('right')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181825] border-b border-[#45475a] shrink-0">
        <ArrowLeftRight size={13} className="text-[#89b4fa]" />
        <span className="text-xs text-[#6c7086]">
          {selecting && selection
            ? `Selected from ${selection.source === 'left' ? 'left' : 'right'} — click a line in the ${selection.source === 'left' ? 'right' : 'left'} panel to place`
            : 'Select code in either panel, then cut it to move to the other side'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onMouseDown={e => { e.preventDefault(); captureSelection('left'); }}
            disabled={selecting}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#313244] text-[#cdd6f4] hover:bg-[#45475a] disabled:opacity-40 transition-colors"
          >
            <Scissors size={11} /> Cut Left →
          </button>
          <button
            onMouseDown={e => { e.preventDefault(); captureSelection('right'); }}
            disabled={selecting}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[#313244] text-[#cdd6f4] hover:bg-[#45475a] disabled:opacity-40 transition-colors"
          >
            ← Cut Right <Scissors size={11} />
          </button>
          {selecting && (
            <button
              onClick={() => { setSelecting(false); setSelection(null); }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[rgba(243,139,168,0.15)] text-[#f38ba8] hover:bg-[rgba(243,139,168,0.25)] transition-colors"
            >
              <X size={11} /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Move queue */}
      {moves.filter(m => !m.applied).length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#24273a] border-b border-[#45475a] shrink-0 overflow-x-auto">
          <span className="text-xs text-[#6c7086] shrink-0">Pending moves:</span>
          {moves.filter(m => !m.applied).map(move => (
            <div key={move.id} className="flex items-center gap-1 bg-[#313244] rounded px-2 py-0.5 text-xs shrink-0">
              <span className="text-[#cdd6f4]">{move.source}</span>
              <span className="text-[#6c7086]">L{move.startLine}–{move.endLine}</span>
              <ArrowRight size={10} className="text-[#89b4fa]" />
              <span className="text-[#cdd6f4]">{move.target}</span>
              <span className="text-[#6c7086]">@{move.targetLine}</span>
              <button onClick={() => applyMove(move)}
                className="ml-1 p-0.5 rounded hover:bg-[#a6e3a1] hover:text-[#1e1e2e] text-[#a6e3a1] transition-colors">
                <Check size={10} />
              </button>
              <button onClick={() => discardMove(move.id)}
                className="p-0.5 rounded hover:bg-[#f38ba8] hover:text-[#1e1e2e] text-[#f38ba8] transition-colors">
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Editor panels */}
      <div className="flex flex-1 min-h-0 relative">
        {/* SVG overlay for arrows */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <style>{`
              @keyframes dashMove { to { stroke-dashoffset: -20; } }
              .move-arrow-path { animation: dashMove 0.5s linear infinite; }
            `}</style>
          </defs>
          {moves.filter(m => !m.applied).map(move => (
            <MoveArrow
              key={move.id}
              fromX={move.fromX}
              fromY={move.fromY}
              toX={move.toX}
              toY={move.toY}
              animated
              label={`${move.lines.length}L`}
            />
          ))}
        </svg>

        {/* Left panel */}
        <div
          ref={leftContainerRef}
          className={`flex-1 flex flex-col min-w-0 border-r border-[#45475a] ${
            selecting && selection?.source !== 'left' ? 'ring-2 ring-inset ring-[#89b4fa]/30' : ''
          }`}
        >
          <div className="flex items-center gap-2 px-3 py-1 bg-[#181825] border-b border-[#45475a] shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#f38ba8] shrink-0" />
            <span className="text-xs text-[#cdd6f4] font-medium truncate">{left.name}</span>
            {selecting && selection?.source !== 'left' && (
              <span className="ml-auto text-xs text-[#89b4fa] animate-pulse">Click target line</span>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language={lang}
              value={leftContent}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                readOnly: false,
                cursorStyle: selecting && selection?.source !== 'left' ? 'line' : 'line',
              }}
              onChange={v => setLeftContent(v ?? '')}
              onMount={editor => {
                leftEditorRef.current = editor;
                editor.onMouseDown(e => mouseHandlerRef.current('left', e));
              }}
            />
          </div>
        </div>

        {/* Right panel */}
        <div
          ref={rightContainerRef}
          className={`flex-1 flex flex-col min-w-0 ${
            selecting && selection?.source !== 'right' ? 'ring-2 ring-inset ring-[#89b4fa]/30' : ''
          }`}
        >
          <div className="flex items-center gap-2 px-3 py-1 bg-[#181825] border-b border-[#45475a] shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#a6e3a1] shrink-0" />
            <span className="text-xs text-[#cdd6f4] font-medium truncate">{right.name}</span>
            {selecting && selection?.source !== 'right' && (
              <span className="ml-auto text-xs text-[#89b4fa] animate-pulse">Click target line</span>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <MonacoEditor
              height="100%"
              language={lang}
              value={rightContent}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                readOnly: false,
              }}
              onChange={v => setRightContent(v ?? '')}
              onMount={editor => {
                rightEditorRef.current = editor;
                editor.onMouseDown(e => mouseHandlerRef.current('right', e));
              }}
            />
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#313244] border border-[#45475a] rounded-lg px-4 py-2 text-xs text-[#cdd6f4] shadow-lg max-w-md text-center">
          {notification}
        </div>
      )}

      {/* Cursor overlay hint when selecting */}
      {selecting && (
        <style>{`
          .monaco-editor .view-lines { cursor: crosshair !important; }
          .monaco-editor .margin { cursor: crosshair !important; }
        `}</style>
      )}
    </div>
  );
}
