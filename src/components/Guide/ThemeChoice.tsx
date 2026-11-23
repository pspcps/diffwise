import MotionToggle from "../Motion/MotionToggle";
import TechnologyIcon from "../Common/TechnologyIcon";
import "./theme-cycle.css";
import { useEffect, useState, type ReactNode } from "react";
import {
  LANGUAGE_THEMES,
  type LanguageThemeKey,
} from "../Portfolio/LanguageThemes";
import {
  LanguageThemeContext as ThemeContext,
  useLanguageTheme,
} from "./LanguageThemeContext";
const accents = {
  nodejs: "#c8edb6",
  python: "#f2d483",
  typescript: "#9bc9ff",
  golang: "#89dedb",
  rust: "#f4b18d",
};
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<LanguageThemeKey>(() => {
    try {
      const saved = localStorage.getItem("psdev-language-theme");
      return saved && saved in LANGUAGE_THEMES
        ? (saved as LanguageThemeKey)
        : "nodejs";
    } catch {
      return "nodejs";
    }
  });
  useEffect(() => {
    document.documentElement.style.setProperty("--user-accent", accents[theme]);
    document.documentElement.style.setProperty(
      "--theme-vivid",
      LANGUAGE_THEMES[theme].primaryHex,
    );
    document.documentElement.dataset.languageTheme = theme;
    try {
      localStorage.setItem("psdev-language-theme", theme);
    } catch {
      /* Optional storage. */
    }
  }, [theme]);
  return (
    <ThemeContext.Provider value={{ theme, change: setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
export default function ThemeChoice() {
  const { theme, change } = useLanguageTheme();
  const themes = Object.values(LANGUAGE_THEMES);
  const current = LANGUAGE_THEMES[theme];
  const next =
    themes[(themes.findIndex((item) => item.id === theme) + 1) % themes.length];
  return (
    <div className="theme-controls">
      <button
        type="button"
        className="language-theme-cycle"
        aria-label={`Change language theme. Current: ${current.shortName}. Next: ${next.shortName}`}
        title={`${current.shortName} theme · Click for ${next.shortName}`}
        onClick={() => change(next.id)}
      >
        <TechnologyIcon name={current.shortName} />
      </button>
      <MotionToggle />
    </div>
  );
}
