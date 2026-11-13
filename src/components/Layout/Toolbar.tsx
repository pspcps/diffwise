import { useEffect, useRef } from "react";
import { ArrowLeft, Search, ArrowUpRight } from "lucide-react";
import ThemeChoice from "../Guide/ThemeChoice";
import Brand from "../Spatial/Brand";
import { TOOLS } from "../../data/tools";
import type { ViewMode } from "../../types";
import "../../spatial.css";
interface ToolbarProps {
  mode: ViewMode;
  onModeChange: (m: ViewMode) => void;
  onAbout: () => void;
  onOpenSearch?: () => void;
}
export default function Toolbar({
  mode,
  onModeChange,
  onAbout,
  onOpenSearch,
}: ToolbarProps) {
  const active = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    active.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [mode]);
  return (
    <header className="tool-toolbar">
      <div className="toolbar-main">
        <Brand
          onClick={() => {
            window.location.hash = "#/";
          }}
        />
        <div className="tool-toolbar-actions"><ThemeChoice/>
          <button
            className="toolbar-home"
            onClick={() => {
              window.location.hash = "#/";
            }}
          >
            <ArrowLeft size={14} /> All tools
          </button>
          <button
            className="search-shortcut"
            onClick={onOpenSearch}
            aria-label="Quick search tools"
          >
            <Search size={15} />
            <span>Quick search</span>
            <kbd>⌘ K</kbd>
          </button>
          <button className="toolbar-home" onClick={onAbout}>
            The builder <ArrowUpRight size={13} />
          </button>
        </div>
      </div>
      <nav className="toolbar-tools" aria-label="Developer tools">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            ref={mode === t.id ? active : undefined}
            className={mode === t.id ? "active" : ""}
            aria-current={mode === t.id ? "page" : undefined}
            onClick={() => onModeChange(t.id)}
          >
            <t.icon size={13} />
            {t.name}
          </button>
        ))}
      </nav>
    </header>
  );
}
