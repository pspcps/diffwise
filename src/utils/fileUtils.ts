export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript',
    js: 'javascript', jsx: 'javascript',
    py: 'python', rb: 'ruby', go: 'go',
    rs: 'rust', java: 'java', cs: 'csharp',
    cpp: 'cpp', c: 'c', h: 'c',
    css: 'css', scss: 'scss', less: 'less',
    html: 'html', xml: 'xml', svg: 'xml',
    json: 'json', yaml: 'yaml', yml: 'yaml',
    md: 'markdown', sh: 'shell', bash: 'shell',
    sql: 'sql', php: 'php', swift: 'swift',
    kt: 'kotlin', dart: 'dart',
  };
  return map[ext] ?? 'plaintext';
}

export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string ?? '');
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function readDirectoryHandle(
  handle: FileSystemDirectoryHandle,
  basePath = ''
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for await (const [name, entry] of (handle as any).entries()) {
    const path = basePath ? `${basePath}/${name}` : name;
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      try {
        files[path] = await readFileContent(file);
      } catch {
        files[path] = '';
      }
    } else if (entry.kind === 'directory') {
      const sub = await readDirectoryHandle(entry, path);
      Object.assign(files, sub);
    }
  }
  return files;
}

export function buildDiffTree(
  leftFiles: Record<string, string>,
  rightFiles: Record<string, string>
) {
  type DiffItem = import('../types').FolderDiffItem;
  type DiffStatus = import('../types').DiffStatus;

  const allPaths = new Set([...Object.keys(leftFiles), ...Object.keys(rightFiles)]);
  const dirMap: Record<string, DiffItem> = {};

  // Create a dir node and all its ancestor dirs
  const ensureDir = (dirPath: string): DiffItem => {
    if (!dirMap[dirPath]) {
      const parts = dirPath.split('/');
      dirMap[dirPath] = {
        path: dirPath,
        name: parts[parts.length - 1],
        isDirectory: true,
        status: 'identical',
        children: [],
      };
    }
    return dirMap[dirPath];
  };

  // Build all file items and ensure all ancestor dirs exist
  const fileItems: Array<{ item: DiffItem; parts: string[] }> = [];
  for (const p of Array.from(allPaths).sort()) {
    const inLeft = p in leftFiles;
    const inRight = p in rightFiles;
    let status: DiffStatus;
    if (!inLeft) status = 'added';
    else if (!inRight) status = 'removed';
    else if (leftFiles[p] !== rightFiles[p]) status = 'modified';
    else status = 'identical';

    const parts = p.split('/');
    fileItems.push({
      item: {
        path: p,
        name: parts[parts.length - 1],
        isDirectory: false,
        status,
        leftContent: leftFiles[p],
        rightContent: rightFiles[p],
      },
      parts,
    });

    // Ensure all ancestor dirs exist and propagate non-identical status upward
    for (let i = 1; i < parts.length; i++) {
      const dirPath = parts.slice(0, i).join('/');
      ensureDir(dirPath);
      if (status !== 'identical') dirMap[dirPath].status = 'modified';
    }
  }

  // Place each file into its immediate parent dir (or root)
  for (const { item, parts } of fileItems) {
    if (parts.length === 1) {
      // root-level file — added to result below
    } else {
      dirMap[parts.slice(0, -1).join('/')].children!.push(item);
    }
  }

  // Place each dir into its immediate parent dir (or root)
  for (const [dPath, dir] of Object.entries(dirMap)) {
    const parts = dPath.split('/');
    if (parts.length > 1) {
      dirMap[parts.slice(0, -1).join('/')].children!.push(dir);
    }
  }

  // Collect root-level items
  const result: DiffItem[] = [];
  for (const { item, parts } of fileItems) {
    if (parts.length === 1) result.push(item);
  }
  for (const [dPath, dir] of Object.entries(dirMap)) {
    if (!dPath.includes('/')) result.push(dir);
  }

  // Sort recursively: dirs before files, then alphabetically
  const sortItems = (items: DiffItem[]) => {
    items.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    items.forEach(i => { if (i.children) sortItems(i.children); });
  };
  sortItems(result);

  return result;
}
