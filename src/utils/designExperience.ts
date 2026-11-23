export const HOME_DESIGNS = ["classic", "studio"] as const;
export const PORTFOLIO_DESIGNS = ["v1", "v2", "v3"] as const;
export type HomeDesign = (typeof HOME_DESIGNS)[number];
export interface SessionStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function chooseDesign<T extends string>(
  options: readonly T[],
  key: string,
  storage?: SessionStore,
  requested?: string | null,
  random: () => number = Math.random,
): T {
  let saved: string | null = null;
  try {
    saved = storage?.getItem(key) ?? null;
  } catch {
    /* Storage is optional. */
  }
  const explicit = options.find((option) => option === requested);
  const remembered = options.find((option) => option === saved);
  const choice =
    explicit ??
    remembered ??
    options[
      Math.min(
        options.length - 1,
        Math.max(0, Math.floor(random() * options.length)),
      )
    ];
  try {
    storage?.setItem(key, choice);
  } catch {
    /* Keep the chosen in-memory design. */
  }
  return choice;
}
export function browserSession(): SessionStore | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}
