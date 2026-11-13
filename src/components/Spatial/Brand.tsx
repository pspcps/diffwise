import { Command } from "lucide-react";
export default function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="space-brand"
      onClick={onClick}
      aria-label="PSDevTool home"
    >
      <span className="brand-mark">
        <Command size={23} strokeWidth={1.8} />
      </span>
      <span>
        PSDevTool<span className="brand-period">.</span>
        <small>YOUR DEVELOPER SPACE</small>
      </span>
    </button>
  );
}
