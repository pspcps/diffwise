import { useEffect, useState, type ReactNode } from "react";
import { MotionContext } from "./MotionContext";
export default function MotionProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const enabled = !reduced;
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("motion-enabled", enabled);
    document.documentElement.classList.toggle("motion-paused", !enabled);
    return () => {
      document.documentElement.classList.remove(
        "motion-enabled",
        "motion-paused",
      );
    };
  }, [enabled]);
  return (
    <MotionContext.Provider value={{ enabled, reduced }}>
      {children}
    </MotionContext.Provider>
  );
}
