import type { ReactNode } from "react";
export default function ToolHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="workspace-tool-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="workspace-tool-actions">{actions}</div>}
    </header>
  );
}
