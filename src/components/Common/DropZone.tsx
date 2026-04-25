import React, { useRef, useState } from 'react';
import { Upload, FolderOpen } from 'lucide-react';

interface DropZoneProps {
  label: string;
  accept?: 'file' | 'folder';
  onFileLoad: (name: string, content: string) => void;
  onFolderLoad?: (files: Record<string, string>, rootName: string) => void;
  fileName?: string;
}

export default function DropZone({ label, accept = 'file', onFileLoad, onFolderLoad, fileName }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const readFile = async (file: File) => {
    const text = await file.text();
    onFileLoad(file.name, text);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const items = Array.from(e.dataTransfer.items);
    if (items.length === 0) return;

    if (accept === 'folder' && onFolderLoad) {
      // Try FileSystemDirectoryHandle via drag
      const item = items[0];
      const entry = item.webkitGetAsEntry?.();
      if (entry?.isDirectory) {
        const files = await readDirEntry(entry as FileSystemDirectoryEntry);
        onFolderLoad(files, entry.name);
        return;
      }
    }
    // Single file
    const file = e.dataTransfer.files[0];
    if (file) await readFile(file);
  };

  const readDirEntry = (dir: FileSystemDirectoryEntry, base = ''): Promise<Record<string, string>> => {
    return new Promise(resolve => {
      const reader = dir.createReader();
      const result: Record<string, string> = {};
      const readAll = () => {
        reader.readEntries(async entries => {
          if (!entries.length) { resolve(result); return; }
          for (const e of entries) {
            const path = base ? `${base}/${e.name}` : e.name;
            if (e.isFile) {
              const file = await new Promise<File>(res => (e as FileSystemFileEntry).file(res));
              result[path] = await file.text();
            } else if (e.isDirectory) {
              const sub = await readDirEntry(e as FileSystemDirectoryEntry, path);
              Object.assign(result, sub);
            }
          }
          readAll();
        });
      };
      readAll();
    });
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await readFile(file);
    e.target.value = '';
  };

  const handleFolderInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onFolderLoad) return;
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const result: Record<string, string> = {};
    const rootName = files[0].webkitRelativePath.split('/')[0];
    for (const f of files) {
      // strip the root folder prefix
      const parts = f.webkitRelativePath.split('/').slice(1).join('/');
      try { result[parts] = await f.text(); } catch { result[parts] = ''; }
    }
    onFolderLoad(result, rootName);
    e.target.value = '';
  };

  const openFolderPicker = async () => {
    if ('showDirectoryPicker' in window && onFolderLoad) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        const { readDirectoryHandle } = await import('../../utils/fileUtils');
        const files = await readDirectoryHandle(dirHandle);
        onFolderLoad(files, dirHandle.name);
        return;
      } catch { /* user cancelled or not supported */ }
    }
    folderRef.current?.click();
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center h-full gap-3 border-2 border-dashed rounded-lg cursor-pointer transition-all p-6 ${
        dragging
          ? 'border-[#89b4fa] bg-[rgba(137,180,250,0.05)]'
          : 'border-[#45475a] hover:border-[#6c7086] hover:bg-[#24273a]'
      }`}
    >
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileInput} />
      <input ref={folderRef} type="file" className="hidden" onChange={handleFolderInput}
        {...({ webkitdirectory: '', directory: '' } as any)} />

      {fileName ? (
        <>
          <div className="text-[#89b4fa] font-medium text-sm">{fileName}</div>
          <div className="text-[#6c7086] text-xs">Click or drop to replace</div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#313244] rounded text-xs text-[#cdd6f4] hover:bg-[#45475a] transition-colors">
              <Upload size={12} /> File
            </button>
            {accept === 'folder' && (
              <button onClick={openFolderPicker}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#313244] rounded text-xs text-[#cdd6f4] hover:bg-[#45475a] transition-colors">
                <FolderOpen size={12} /> Folder
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="w-10 h-10 rounded-full bg-[#313244] flex items-center justify-center">
            {accept === 'folder' ? <FolderOpen size={20} className="text-[#89b4fa]" /> : <Upload size={20} className="text-[#89b4fa]" />}
          </div>
          <div className="text-center">
            <div className="text-[#cdd6f4] text-sm font-medium">{label}</div>
            <div className="text-[#6c7086] text-xs mt-1">Drag & drop or click to browse</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#313244] rounded text-xs text-[#cdd6f4] hover:bg-[#89b4fa] hover:text-[#1e1e2e] transition-colors">
              <Upload size={12} /> Open File
            </button>
            {accept === 'folder' && (
              <button onClick={openFolderPicker}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#313244] rounded text-xs text-[#cdd6f4] hover:bg-[#89b4fa] hover:text-[#1e1e2e] transition-colors">
                <FolderOpen size={12} /> Open Folder
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
