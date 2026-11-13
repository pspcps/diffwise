import { useEffect, useRef, useState } from "react";
import { useMotion } from "../Motion/MotionContext";
const ROLES = [
  "Backend Engineer",
  "Cloud Engineer",
  "Applied AI Engineer",
  "Full-Stack Developer",
  "Software Architect",
];
type TypingState = {
  index: number;
  length: number;
  phase: "typing" | "holding" | "deleting" | "gap";
};
const INITIAL: TypingState = { index: 0, length: 0, phase: "typing" };
const DELAYS = { typing: 75, holding: 1800, deleting: 35, gap: 300 };
export default function RotatingRole() {
  const { enabled } = useMotion();
  const [state, setState] = useState(INITIAL);
  const progress = useRef(INITIAL);
  const started = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    // Resume from a complete, readable title after a manual pause.
    const resuming = started.current;
    if (resuming) {
      progress.current = {
        index: progress.current.index,
        length: ROLES[progress.current.index].length,
        phase: "holding",
      };
    }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      if (!document.hidden)
        timer = setTimeout(tick, DELAYS[progress.current.phase]);
    };
    const tick = () => {
      if (document.hidden) return;
      started.current = true;
      const current = progress.current;
      let next: TypingState;
      if (current.phase === "typing") {
        const length = Math.min(
          current.length + 1,
          ROLES[current.index].length,
        );
        next = {
          ...current,
          length,
          phase: length === ROLES[current.index].length ? "holding" : "typing",
        };
      } else if (current.phase === "holding") {
        next = { ...current, phase: "deleting", length: current.length - 1 };
      } else if (current.phase === "deleting") {
        const length = Math.max(0, current.length - 1);
        next = { ...current, length, phase: length === 0 ? "gap" : "deleting" };
      } else {
        next = {
          index: (current.index + 1) % ROLES.length,
          length: 0,
          phase: "typing",
        };
      }
      progress.current = next;
      setState(next);
      schedule();
    };
    if (resuming) {
      timer = setTimeout(() => {
        setState(progress.current);
        schedule();
      }, 0);
    } else schedule();
    document.addEventListener("visibilitychange", schedule);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [enabled]);
  const role = ROLES[state.index];
  return (
    <span className="rotating-role">
      <span className="role-accessible-summary">
        Engineering focus: Backend Engineer, Cloud Engineer, Applied AI
        Engineer, Full-Stack Developer, and Software Architect.
      </span>
      <span
        aria-hidden="true"
        className="rotating-role-current"
        data-role={role}
        data-phase={enabled ? state.phase : "paused"}
      >
        {enabled ? role.slice(0, state.length) : role}
        <span className="role-caret" />
      </span>
    </span>
  );
}
