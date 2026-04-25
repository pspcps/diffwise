export type ViewMode = 'text' | 'file' | 'folder';

export interface FileEntry {
  name: string;
  path: string;
  content: string;
  language?: string;
}

export interface FolderEntry {
  name: string;
  path: string;
  children: (FolderEntry | FileEntry)[];
  isDirectory: true;
}

export type DiffStatus = 'added' | 'removed' | 'modified' | 'identical';

export interface FolderDiffItem {
  path: string;
  name: string;
  isDirectory: boolean;
  status: DiffStatus;
  leftContent?: string;
  rightContent?: string;
  children?: FolderDiffItem[];
}

export interface CodeSelection {
  startLine: number;
  endLine: number;
  content: string;
  sourceFile: 'left' | 'right';
}

export interface MoveOperation {
  selection: CodeSelection;
  targetFile: 'left' | 'right';
  targetLine: number;
}
