export const HOME_DESIGNS = ["classic", "studio"] as const;
export const PORTFOLIO_DESIGNS = ["v1", "v2", "v3"] as const;
export type HomeDesign = (typeof HOME_DESIGNS)[number];
export type PortfolioDesign = (typeof PORTFOLIO_DESIGNS)[number];
export interface PreferenceStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function chooseDesign<T extends string>(
  options: readonly T[],
  key: string,
  storage: PreferenceStore | undefined,
  requested: string | null | undefined,
  fallback: T,
): T {
  let saved: string | null = null;
  try {
    saved = storage?.getItem(key) ?? null;
  } catch {
    /* Preferences are optional. */
  }
  const explicit = options.find((option) => option === requested);
  const choice =
    explicit ?? options.find((option) => option === saved) ?? fallback;
  if (explicit)
    try {
      storage?.setItem(key, choice);
    } catch {
      /* Keep the current in-memory choice. */
    }
  return choice;
}
export function randomDesign<T extends string>(
  options: readonly T[],
  current: T,
  random: () => number = Math.random,
): T {
  const alternatives = options.filter((option) => option !== current);
  if (!alternatives.length) return current;
  return alternatives[
    Math.min(
      alternatives.length - 1,
      Math.max(0, Math.floor(random() * alternatives.length)),
    )
  ];
}
export function browserPreferences(): PreferenceStore | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
