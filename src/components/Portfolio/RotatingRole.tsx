import { useEffect, useState } from "react";
import { useMotion } from "../Motion/MotionContext";
const ROLES = [
  "Backend Engineer",
  "Cloud Engineer",
  "Applied AI Engineer",
  "Full-Stack Developer",
  "Software Architect",
];
export default function RotatingRole() {
  const { enabled } = useMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % ROLES.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [enabled]);
  return (
    <span className="rotating-role">
      <span className="sr-only">
        Engineering focus: Backend Engineer, Cloud Engineer, Applied AI
        Engineer, Full-Stack Developer, and Software Architect.
      </span>
      <span
        aria-hidden="true"
        className="rotating-role-current"
        data-role={ROLES[index]}
        key={index}
      >
        {ROLES[index]}
        <span className="role-caret" />
      </span>
    </span>
  );
}
