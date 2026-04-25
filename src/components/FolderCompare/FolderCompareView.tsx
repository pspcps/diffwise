import { useState, useRef } from 'react';
import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react';
import { FolderOpen, GitCompare, X, Save, FileText } from 'lucide-react';
import DropZone from '../Common/DropZone';
import { detectLanguage } from '../../utils/fileUtils';
import type { DiffStatus } from '../../types';

interface TabItem {
  path: string;
  name: string;
  leftContent: string;
  rightContent: string;
  status: DiffStatus;
}

interface SaveDialogState {
  path: string;
  fileName: string;
  content: string;
}

function getFileStatus(
  path: string,
  leftFiles: Record<string, string>,
  rightFiles: Record<string, string>
): DiffStatus {
  const inLeft = path in leftFiles;
  const inRight = path in rightFiles;
  if (!inLeft) return 'added';
  if (!inRight) return 'removed';
  if (leftFiles[path] !== rightFiles[path]) return 'modified';
  return 'identical';
}

const STATUS_BADGE: Record<DiffStatus, string> = {
  added: 'A',
  removed: 'D',
  modified: 'M',
  identical: '=',
};

const STATUS_COLOR: Record<DiffStatus, string> = {
  added: '#a6e3a1',
  removed: '#f38ba8',
  modified: '#f9e2af',
  identical: '#6c7086',
};

export default function FolderCompareView() {
  const [leftFiles, setLeftFiles] = useState<Record<string, string> | null>(null);
  const [rightFiles, setRightFiles] = useState<Record<string, string> | null>(null);
  const [leftName, setLeftName] = useState('');
  const [rightName, setRightName] = useState('');

  const [openTabs, setOpenTabs] = useState<TabItem[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [tabChanges, setTabChanges] = useState<Record<string, boolean>>({});
  const [tabContents, setTabContents] = useState<Record<string, string>>({});

  const [saveDialog, setSaveDialog] = useState<SaveDialogState | null>(null);
  const [pendingClose, setPendingClose] = useState<string | null>(null);

  const tabEditorRef = useRef<any>(null);
  const activeTabRef = useRef<string | null>(null);
  const openTabsRef = useRef<TabItem[]>([]);

  activeTabRef.current = activeTab;
  openTabsRef.current = openTabs;

  const reset = () => {
    setLeftFiles(null);
    setRightFiles(null);
    setLeftName('');
    setRightName('');
    setOpenTabs([]);
    setActiveTab(null);
    setTabChanges({});
    setTabContents({});
  };

  const openFile = (path: string) => {
    if (!leftFiles || !rightFiles) return;
    if (!openTabs.find(t => t.path === path)) {
      const leftContent = leftFiles[path] ?? '';
      const rightContent = rightFiles[path] ?? '';
      const status = getFileStatus(path, leftFiles, rightFiles);
      setOpenTabs(prev => [
        ...prev,
        { path, name: path.split('/').pop() ?? path, leftContent, rightContent, status },
      ]);
    }
    setActiveTab(path);
  };

  const doCloseTab = (path: string) => {
    const tabs = openTabsRef.current;
    const idx = tabs.findIndex(t => t.path === path);
    const remaining = tabs.filter(t => t.path !== path);
    setOpenTabs(remaining);
    setTabChanges(prev => { const n = { ...prev }; delete n[path]; return n; });
    setTabContents(prev => { const n = { ...prev }; delete n[path]; return n; });
    if (activeTabRef.current === path) {
      setActiveTab(remaining.length > 0 ? remaining[Math.min(idx, remaining.length - 1)].path : null);
    }
  };

  const closeTab = (path: string) => {
    if (!tabChanges[path]) { doCloseTab(path); return; }
    const tab = openTabsRef.current.find(t => t.path === path);
    if (!tab) return;
    const content =
      path === activeTabRef.current && tabEditorRef.current
        ? (tabEditorRef.current.getModifiedEditor()?.getValue() ?? tabContents[path] ?? tab.rightContent)
        : (tabContents[path] ?? tab.rightContent);
    setSaveDialog({ path, fileName: tab.name, content });
    setPendingClose(path);
  };

  const saveToFile = async (filename: string, content: string) => {
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({ suggestedName: filename });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        return;
      } catch { /* cancelled or unsupported */ }
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAndClose = async () => {
    if (!saveDialog) return;
    await saveToFile(saveDialog.fileName, saveDialog.content);
    if (pendingClose) doCloseTab(pendingClose);
    setSaveDialog(null);
    setPendingClose(null);
  };

  const handleDontSave = () => {
    if (pendingClose) doCloseTab(pendingClose);
    setSaveDialog(null);
    setPendingClose(null);
  };

  // ── Initial folder loading view ───────────────────────────────────────────
  if (!leftFiles || !rightFiles) {
    const renderFolderSide = (side: 'left' | 'right') => {
      const files: Record<string, string> | null = side === 'left' ? leftFiles : rightFiles;
      const name = side === 'left' ? leftName : rightName;
      const colorClass = side === 'left' ? 'text-[#f38ba8]' : 'text-[#a6e3a1]';
      const onLoad = side === 'left'
        ? (f: Record<string, string>, n: string) => { setLeftFiles(f); setLeftName(n); }
        : (f: Record<string, string>, n: string) => { setRightFiles(f); setRightName(n); };
      const label = side === 'left' ? 'Left Folder (Original)' : 'Right Folder (Modified)';

      if (files) {
        const paths = Object.keys(files).sort();
        return (
          <div className="flex flex-col h-full border border-[#45475a] rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181825] border-b border-[#45475a] shrink-0">
              <FolderOpen size={13} className="text-[#89b4fa] shrink-0" />
              <span className={`text-xs font-medium truncate ${colorClass}`}>{name}</span>
              <span className="ml-auto text-xs text-[#6c7086]">
                {paths.length} files — waiting for {side === 'left' ? 'right' : 'left'} folder…
              </span>
            </div>
            <div className="flex-1 overflow-y-auto py-1 bg-[#181825]">
              {paths.map(p => (
                <div key={p} className="flex items-center gap-2 px-3 py-0.5 text-xs text-[#9399b2] hover:bg-[#24273a]">
                  <FileText size={11} className="text-[#6c7086] shrink-0" />
                  <span className="truncate">{p}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      return (
        <DropZone label={label} accept="folder" onFileLoad={() => {}} onFolderLoad={onLoad} />
      );
    };

    return (
      <div className="flex h-full gap-1 p-2">
        <div className="flex-1 flex flex-col min-h-0">{renderFolderSide('left')}</div>
        <div className="flex-1 flex flex-col min-h-0">{renderFolderSide('right')}</div>
      </div>
    );
  }

  // ── Both folders loaded ───────────────────────────────────────────────────
  const leftPaths = Object.keys(leftFiles).sort();
  const rightPaths = Object.keys(rightFiles).sort();
  const activeTabData = openTabs.find(t => t.path === activeTab) ?? null;
  const language = activeTabData ? detectLanguage(activeTabData.name) : 'plaintext';

  const renderFileList = (paths: string[], side: 'left' | 'right') => {
    const colorClass = side === 'left' ? 'text-[#f38ba8]' : 'text-[#a6e3a1]';
    const folderName = side === 'left' ? leftName : rightName;

    return (
      <div className="flex flex-col h-full border border-[#45475a] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181825] border-b border-[#45475a] shrink-0">
          <FolderOpen size={13} className="text-[#89b4fa] shrink-0" />
          <span className={`text-xs font-medium truncate ${colorClass}`}>{folderName}</span>
          <span className="ml-auto text-xs text-[#6c7086]">{paths.length} files</span>
        </div>
        <div className="flex-1 overflow-y-auto py-1 bg-[#181825]">
          {paths.map(p => {
            const status = getFileStatus(p, leftFiles, rightFiles);
            const hasDiff = status !== 'identical';
            const isActive = activeTab === p;
            const isOpen = openTabs.some(t => t.path === p);
            return (
              <div
                key={p}
                onClick={() => openFile(p)}
                className={`flex items-center gap-2 px-3 py-1 text-xs cursor-pointer transition-colors ${
                  isActive ? 'bg-[#313244]' : isOpen ? 'bg-[rgba(36,39,58,0.7)]' : 'hover:bg-[#24273a]'
                }`}
              >
                <FileText
                  size={11}
                  className="shrink-0"
                  style={{ color: hasDiff ? '#f38ba8' : '#6c7086' }}
                />
                <span
                  className="truncate flex-1"
                  style={{ color: hasDiff ? '#f38ba8' : '#9399b2' }}
                  title={p}
                >
                  {p}
                </span>
                {hasDiff && (
                  <span
                    className="shrink-0 text-[10px] font-bold"
                    style={{ color: STATUS_COLOR[status] }}
                  >
                    {STATUS_BADGE[status]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#181825] border-b border-[#45475a] shrink-0">
        <FolderOpen size={13} className="text-[#89b4fa]" />
        <span className="text-xs text-[#f38ba8] font-medium truncate max-w-[140px]">{leftName}</span>
        <GitCompare size={11} className="text-[#45475a] shrink-0" />
        <span className="text-xs text-[#a6e3a1] font-medium truncate max-w-[140px]">{rightName}</span>
        <div className="ml-auto flex items-center gap-3 text-xs shrink-0">
          {activeTab && (
            <button
              onClick={() => setActiveTab(null)}
              className="text-[#6c7086] hover:text-[#89b4fa] transition-colors"
            >
              ← Files
            </button>
          )}
          <button onClick={reset} className="text-[#6c7086] hover:text-[#f38ba8] transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Tab bar */}
      {openTabs.length > 0 && (
        <div className="flex items-end gap-0 px-2 bg-[#181825] border-b border-[#45475a] overflow-x-auto shrink-0">
          {openTabs.map(tab => {
            const hasChanged = tabChanges[tab.path] ?? false;
            const isActive = activeTab === tab.path;
            return (
              <div
                key={tab.path}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs cursor-pointer transition-colors shrink-0 border-b-2 ${
                  isActive
                    ? 'bg-[#24273a] text-[#cdd6f4] border-[#89b4fa]'
                    : 'text-[#6c7086] hover:text-[#9399b2] border-transparent hover:bg-[#1e1e2e]'
                }`}
                onClick={() => setActiveTab(tab.path)}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLOR[tab.status] }}
                />
                <span className="max-w-[120px] truncate">{tab.name}</span>
                {hasChanged && (
                  <span className="text-[#89b4fa] shrink-0 text-[8px]" title="Unsaved changes">●</span>
                )}
                <button
                  onClick={e => { e.stopPropagation(); closeTab(tab.path); }}
                  className="ml-0.5 p-0.5 rounded hover:bg-[#45475a] text-[#6c7086] hover:text-[#f38ba8] transition-colors shrink-0"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTabData ? (
          <MonacoDiffEditor
            key={activeTabData.path}
            height="100%"
            language={language}
            original={activeTabData.leftContent}
            modified={activeTabData.rightContent}
            theme="vs-dark"
            options={{
              renderSideBySide: true,
              readOnly: false,
              originalEditable: false,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 12,
              fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
              lineNumbers: 'on',
              diffWordWrap: 'on',
            } as any}
            onMount={editor => {
              tabEditorRef.current = editor;
              editor.getModifiedEditor().onDidChangeModelContent(() => {
                const path = activeTabRef.current;
                if (!path) return;
                const content = editor.getModifiedEditor().getValue();
                const tab = openTabsRef.current.find(t => t.path === path);
                if (!tab) return;
                const changed = content !== tab.rightContent;
                setTabContents(prev => ({ ...prev, [path]: content }));
                setTabChanges(prev =>
                  prev[path] === changed ? prev : { ...prev, [path]: changed }
                );
              });
            }}
          />
        ) : (
          <div className="flex h-full gap-1 p-2">
            <div className="flex-1 flex flex-col min-h-0">{renderFileList(leftPaths, 'left')}</div>
            <div className="flex-1 flex flex-col min-h-0">{renderFileList(rightPaths, 'right')}</div>
          </div>
        )}
      </div>

      {/* Save dialog */}
      {saveDialog && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#24273a] border border-[#45475a] rounded-lg p-5 shadow-2xl w-80">
            <h3 className="text-sm font-medium text-[#cdd6f4] mb-2">Save Changes?</h3>
            <p className="text-xs text-[#9399b2] mb-5 leading-relaxed">
              Do you want to save changes to{' '}
              <span className="text-[#89b4fa] font-medium">{saveDialog.fileName}</span>?
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setSaveDialog(null); setPendingClose(null); }}
                className="px-3 py-1.5 rounded text-xs text-[#6c7086] hover:text-[#cdd6f4] hover:bg-[#313244] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDontSave}
                className="px-3 py-1.5 rounded text-xs bg-[#313244] text-[#cdd6f4] hover:bg-[#45475a] transition-colors"
              >
                Don't Save
              </button>
              <button
                onClick={handleSaveAndClose}
                className="px-3 py-1.5 rounded text-xs bg-[#89b4fa] text-[#1e1e2e] hover:bg-[#74c7ec] transition-colors flex items-center gap-1.5 font-medium"
              >
                <Save size={11} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
