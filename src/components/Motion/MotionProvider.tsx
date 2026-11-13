import { useEffect, useState, type ReactNode } from "react";
import { MotionContext } from "./MotionContext";
export default function MotionProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState(() => {
    try {
      return localStorage.getItem("psdev-motion") !== "off";
    } catch {
      return true;
    }
  });
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const enabled = preference && !reduced;
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("motion-enabled", enabled);
    document.documentElement.classList.toggle("motion-paused", !enabled);
    try {
      localStorage.setItem("psdev-motion", preference ? "on" : "off");
    } catch {
      /* Optional storage. */
    }
    return () => {
      document.documentElement.classList.remove(
        "motion-enabled",
        "motion-paused",
      );
    };
  }, [enabled, preference]);
  return (
    <MotionContext.Provider
      value={{ enabled, reduced, toggle: () => setPreference((p) => !p) }}
    >
      {children}
    </MotionContext.Provider>
  );
}
