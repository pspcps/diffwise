const fs = require('fs');
const file = 'src/components/ApiStudio/ApiStudioView.tsx';
let code = fs.readFileSync(file, 'utf8');

const lines = code.split('\n');
const startIdx = lines.findIndex(l => l.includes('// Normalize line continuations'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('const isCurl ='));

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = [
    '  // Normalize line continuations and bash ANSI quotes',
    '  const normalized = trimmed',
    '    .split("\\n").map(l => l.replace(/\\\\$/, "").trim()).join(" ")',
    '    .replace(/\\$\'([\\s\\S]*?)\'/g, "\'$1\'")',
    '    .trim();',
  ];
  lines.splice(startIdx, endIdx - startIdx, ...replacement);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('Normalized lines replaced successfully.');
} else {
  console.log('Indices not found:', startIdx, endIdx);
}
