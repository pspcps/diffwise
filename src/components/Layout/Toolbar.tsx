import { navigateTo } from "../../seo/routes";
import { Search, ArrowLeft, UserRound } from "lucide-react";
import ThemeChoice from "../Guide/ThemeChoice";
import ToolHelp from "../Workspace/ToolHelp";
import Brand from "../Spatial/Brand";
import { TOOLS, TOOL_CATEGORIES } from "../../data/tools";
import type { ViewMode } from "../../types";
import "../../spatial.css";
interface ToolbarProps {
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  onAbout: () => void;
  onOpenSearch?: () => void;
}
export default function Toolbar({
  mode,
  onModeChange,
  onAbout,
  onOpenSearch,
}: ToolbarProps) {
  return (
    <header className="tool-toolbar compact-toolbar">
      <Brand
        onClick={() => {
          navigateTo("/");
        }}
      />
      <span className="toolbar-divider" />
      <select
        className="tool-picker"
        aria-label="Choose developer tool"
        value={mode}
        onChange={(e) => onModeChange(e.target.value as ViewMode)}
      >
        {TOOL_CATEGORIES.map((category) => (
          <optgroup key={category} label={category}>
            {TOOLS.filter((t) => t.category === category).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <div className="compact-toolbar-actions">
        <button
          className="toolbar-home tool-home-action"
          onClick={() => {
            navigateTo("/");
          }}
          aria-label="All tools"
        >
          <ArrowLeft size={15} />
          <span>All tools</span>
        </button>
        <button
          className="toolbar-home"
          onClick={onOpenSearch}
          aria-label="Quick search tools"
        >
          <Search size={16} />
          <kbd>
            {/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"}
          </kbd>
        </button>
        <ThemeChoice />
        <ToolHelp mode={mode} />
        <button
          className="toolbar-home builder-action"
          onClick={onAbout}
          aria-label="About the builder"
        >
          <UserRound size={16} />
        </button>
      </div>
    </header>
  );
}
