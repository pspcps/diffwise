import { createPortal } from "react-dom";
import { Shuffle } from "lucide-react";
import "./experience-choice.css";
export default function DesignShuffleButton({
  current,
  onClick,
}: {
  current: string;
  onClick: () => void;
}) {
  const label = `Change design. Current: ${current}`;
  const button = (
    <button
      type="button"
      className="design-shuffle-button"
      onClick={onClick}
      aria-label={label}
      title={`${current} · Click to try another design`}
    >
      <Shuffle size={18} aria-hidden="true" />
    </button>
  );
  return (
    <span className="design-shuffle-slot">
      {typeof document === "undefined"
        ? button
        : createPortal(button, document.body)}
    </span>
  );
}
