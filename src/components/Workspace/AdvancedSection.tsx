import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
export default function AdvancedSection({
  title,
  description,
  children,
  className = "",
  open = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  open?: boolean;
}) {
  return (
    <details
      className={`advanced-section ${className}`}
      open={open || undefined}
    >
      <summary>
        <span>
          <strong>{title}</strong>
          {description && <small>{description}</small>}
        </span>
        <ChevronDown size={17} />
      </summary>
      <div className="advanced-section-body">{children}</div>
    </details>
  );
}
