import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import type { FolderDiffItem, DiffStatus } from '../../types';

interface FolderDiffTreeProps {
  items: FolderDiffItem[];
  onSelectFile: (item: FolderDiffItem) => void;
  selectedPath?: string;
}

const statusColors: Record<DiffStatus, string> = {
  added: '#a6e3a1',
  removed: '#f38ba8',
  modified: '#f9e2af',
  identical: '#6c7086',
};

const statusLabels: Record<DiffStatus, string> = {
  added: 'A',
  removed: 'D',
  modified: 'M',
  identical: '=',
};

interface TreeNodeProps {
  item: FolderDiffItem;
  depth: number;
  onSelectFile: (item: FolderDiffItem) => void;
  selectedPath?: string;
}

function TreeNode({ item, depth, onSelectFile, selectedPath }: TreeNodeProps) {
  const [open, setOpen] = useState(true);
  const isSelected = item.path === selectedPath;
  const color = statusColors[item.status];

  return (
    <div>
      <div
        onClick={() => {
          if (item.isDirectory) setOpen(v => !v);
          else onSelectFile(item);
        }}
        className={`flex items-center gap-1 px-2 py-0.5 cursor-pointer text-xs rounded transition-colors group ${
          isSelected ? 'bg-[#313244]' : 'hover:bg-[#24273a]'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {item.isDirectory ? (
          <>
            <span className="text-[#6c7086] shrink-0">
              {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </span>
            <span style={{ color: '#89b4fa' }} className="shrink-0">
              {open ? <FolderOpen size={13} /> : <Folder size={13} />}
            </span>
          </>
        ) : (
          <>
            <span className="w-[11px] shrink-0" />
            <span style={{ color: '#6c7086' }} className="shrink-0">
              <File size={13} />
            </span>
          </>
        )}

        <span
          className="truncate flex-1"
          style={{ color: item.status === 'identical' ? '#9399b2' : '#cdd6f4' }}
        >
          {item.name}
        </span>

        <span
          className="shrink-0 w-4 text-center font-bold text-[10px] rounded"
          style={{ color }}
          title={item.status}
        >
          {statusLabels[item.status]}
        </span>
      </div>

      {item.isDirectory && open && item.children && (
        <div>
          {item.children
            .sort((a, b) => {
              if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map(child => (
              <TreeNode
                key={child.path}
                item={child}
                depth={depth + 1}
                onSelectFile={onSelectFile}
                selectedPath={selectedPath}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function FolderDiffTree({ items, onSelectFile, selectedPath }: FolderDiffTreeProps) {
  const counts = items.reduce(
    (acc, item) => {
      const count = (i: FolderDiffItem) => {
        if (!i.isDirectory) acc[i.status] = (acc[i.status] ?? 0) + 1;
        i.children?.forEach(count);
      };
      count(item);
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="flex flex-col h-full bg-[#181825]">
      {/* Summary bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-[#45475a] shrink-0">
        {Object.entries({ added: '#a6e3a1', removed: '#f38ba8', modified: '#f9e2af', identical: '#6c7086' }).map(
          ([status, color]) =>
            counts[status] ? (
              <span key={status} className="flex items-center gap-1 text-xs" style={{ color }}>
                <span className="font-bold">{statusLabels[status as DiffStatus]}</span>
                <span>{counts[status]}</span>
              </span>
            ) : null
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {items.map(item => (
          <TreeNode
            key={item.path}
            item={item}
            depth={0}
            onSelectFile={onSelectFile}
            selectedPath={selectedPath}
          />
        ))}
      </div>
    </div>
  );
}
