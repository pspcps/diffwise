import { createContext, useContext } from "react";
import type { LanguageThemeKey } from "../Portfolio/LanguageThemes";
export const LanguageThemeContext = createContext({
  theme: "nodejs" as LanguageThemeKey,
  change: (value: LanguageThemeKey) => {
    void value;
  },
});
export const useLanguageTheme = () => useContext(LanguageThemeContext);
