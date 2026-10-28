export type LanguageThemeKey = 'nodejs' | 'python' | 'typescript' | 'golang' | 'rust';

export interface LanguageTheme {
  id: LanguageThemeKey;
  name: string;
  shortName: string;
  tagline: string;
  primaryHex: string;
  secondaryHex: string;
  glowHex: string;
  primaryThree: number;
  secondaryThree: number;
  glowRgb: string;
  borderClass: string;
  textGradient: string;
  badgeBg: string;
  badgeText: string;
  iconSymbol: string;
}

export const LANGUAGE_THEMES: Record<LanguageThemeKey, LanguageTheme> = {
  nodejs: {
    id: 'nodejs',
    name: 'Node.js Runtime',
    shortName: 'Node.js',
    tagline: 'Async Event-Driven & High-Throughput Microservices',
    primaryHex: '#22c55e', // Node Emerald Green
    secondaryHex: '#10b981',
    glowHex: '#15803d',
    primaryThree: 0x22c55e,
    secondaryThree: 0x10b981,
    glowRgb: '34, 197, 94',
    borderClass: 'border-[#22c55e]/30',
    textGradient: 'from-[#4ade80] via-[#22c55e] to-[#10b981]',
    badgeBg: 'bg-[#22c55e]/15',
    badgeText: 'text-[#4ade80]',
    iconSymbol: '⬢', // Hexagon Node badge
  },
  python: {
    id: 'python',
    name: 'Python Ecosystem',
    shortName: 'Python',
    tagline: 'Data Science, PyTorch & Generative AI Pipelines',
    primaryHex: '#38bdf8', // Python Blue
    secondaryHex: '#facc15', // Python Gold
    glowHex: '#0284c7',
    primaryThree: 0x38bdf8,
    secondaryThree: 0xfacc15,
    glowRgb: '56, 189, 248',
    borderClass: 'border-[#38bdf8]/30',
    textGradient: 'from-[#38bdf8] via-[#60a5fa] to-[#facc15]',
    badgeBg: 'bg-[#38bdf8]/15',
    badgeText: 'text-[#38bdf8]',
    iconSymbol: '🐍',
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript & React',
    shortName: 'TypeScript',
    tagline: 'Strict Type-Safety & Enterprise Full-Stack Architecture',
    primaryHex: '#3b82f6', // TS Blue
    secondaryHex: '#06b6d4', // React Cyan
    glowHex: '#1d4ed8',
    primaryThree: 0x3b82f6,
    secondaryThree: 0x06b6d4,
    glowRgb: '59, 130, 246',
    borderClass: 'border-[#3b82f6]/30',
    textGradient: 'from-[#60a5fa] via-[#3b82f6] to-[#06b6d4]',
    badgeBg: 'bg-[#3b82f6]/15',
    badgeText: 'text-[#60a5fa]',
    iconSymbol: 'TS',
  },
  golang: {
    id: 'golang',
    name: 'Go (Golang)',
    shortName: 'Go',
    tagline: 'Concurrent Goroutines & Ultra-Fast Cloud Infrastructure',
    primaryHex: '#00add8', // Go Aqua
    secondaryHex: '#14b8a6', // Teal
    glowHex: '#0891b2',
    primaryThree: 0x00add8,
    secondaryThree: 0x14b8a6,
    glowRgb: '0, 173, 216',
    borderClass: 'border-[#00add8]/30',
    textGradient: 'from-[#22d3ee] via-[#00add8] to-[#14b8a6]',
    badgeBg: 'bg-[#00add8]/15',
    badgeText: 'text-[#22d3ee]',
    iconSymbol: 'GO',
  },
  rust: {
    id: 'rust',
    name: 'Rust Systems',
    shortName: 'Rust',
    tagline: 'Zero-Cost Abstractions, High Concurrency & Memory Safety',
    primaryHex: '#f97316', // Rust Bronze
    secondaryHex: '#ef4444', // Crimson
    glowHex: '#c2410c',
    primaryThree: 0xf97316,
    secondaryThree: 0xef4444,
    glowRgb: '249, 115, 22',
    borderClass: 'border-[#f97316]/30',
    textGradient: 'from-[#fb923c] via-[#f97316] to-[#ef4444]',
    badgeBg: 'bg-[#f97316]/15',
    badgeText: 'text-[#fb923c]',
    iconSymbol: '⚙',
  },
};
