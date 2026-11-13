import { Sparkles, Pause } from "lucide-react";
import { useMotion } from "./MotionContext";
export default function MotionToggle() {
  const { enabled, reduced, toggle } = useMotion();
  return (
    <button
      className="motion-toggle"
      type="button"
      aria-label={
        reduced
          ? "System reduced motion is active"
          : enabled
            ? "Pause site animations"
            : "Enable site animations"
      }
      title={
        reduced
          ? "Reduced motion follows your system setting"
          : enabled
            ? "Pause interactive effects"
            : "Enable interactive effects"
      }
      aria-pressed={enabled}
      disabled={reduced}
      onClick={toggle}
    >
      {enabled ? <Sparkles size={15} /> : <Pause size={14} />}
    </button>
  );
}
