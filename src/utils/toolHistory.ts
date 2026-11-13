import { TOOLS } from "../data/tools";
import type { ViewMode } from "../types";
const KEY = "psdev-recent-tools";
export function recentTools(): ViewMode[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter((id): id is ViewMode =>
              TOOLS.some((t) => t.id === id),
            ),
          ),
        ].slice(0, 5)
      : [];
  } catch {
    return [];
  }
}
export function rememberTool(id: ViewMode) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify(
        [id, ...recentTools().filter((t) => t !== id)].slice(0, 5),
      ),
    );
  } catch {
    /* History is optional. Input contents are never stored here. */
  }
}
