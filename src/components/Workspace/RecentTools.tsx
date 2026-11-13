import { useState } from "react";
import { History } from "lucide-react";
import { recentTools } from "../../utils/toolHistory";
import { TOOLS } from "../../data/tools";
import type { ViewMode } from "../../types";
export default function RecentTools({
  onTool,
}: {
  onTool: (id: ViewMode) => void;
}) {
  const [recent] = useState(recentTools);
  if (!recent.length) return null;
  return (
    <div className="recent-tools" aria-label="Recently opened tools">
      <span>
        <History size={14} /> Pick up where you left off
      </span>
      <div>
        {recent.map((id) => {
          const tool = TOOLS.find((t) => t.id === id)!;
          return (
            <button type="button" key={id} onClick={() => onTool(id)}>
              <tool.icon size={14} />
              {tool.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
