import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Search, UserRound, X } from "lucide-react";
import type { ViewMode } from "../../types";
import { TOOLS } from "../../data/tools";
import { TOOL_KEYWORDS } from "../../data/toolSearch";
import { recentTools } from "../../utils/toolHistory";
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (mode: ViewMode) => void;
  onPortfolio: () => void;
}
const DESTINATIONS = [
  ...TOOLS,
  {
    id: "portfolio" as const,
    name: "Meet the builder",
    description: "Projects, experience and contact details.",
    category: "About",
    icon: UserRound,
    color: "#c8edb6",
  },
];
function SearchDialog({
  onClose,
  onSelectTool,
  onPortfolio,
}: Omit<CommandPaletteProps, "isOpen">) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [recent] = useState(recentTools);
  const id = useId();
  const ordered = [...DESTINATIONS].sort((a, b) => {
    const ai = recent.indexOf(a.id as ViewMode),
      bi = recent.indexOf(b.id as ViewMode);
    return (ai < 0 ? 100 : ai) - (bi < 0 ? 100 : bi);
  });
  const filtered = ordered.filter((t) =>
    `${t.name} ${t.description} ${t.category} ${TOOL_KEYWORDS[t.id].join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const current = filtered[Math.min(selected, filtered.length - 1)];
  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement;
    node?.showModal();
    input.current?.focus();
    return () => {
      node?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  useEffect(() => {
    if (current)
      document
        .getElementById(`${id}-${current.id}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [current, id]);
  const choose = (tool: (typeof DESTINATIONS)[number]) => {
    if (tool.id === "portfolio") onPortfolio();
    else onSelectTool(tool.id);
    onClose();
  };
  return (
    <dialog
      ref={dialog}
      className="workspace-dialog command-dialog"
      aria-label="Find a tool"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="command-search">
        <Search size={20} />
        <input
          ref={input}
          aria-label="Search all tools"
          role="combobox"
          aria-expanded="true"
          aria-controls={`${id}-results`}
          aria-activedescendant={current ? `${id}-${current.id}` : undefined}
          aria-autocomplete="list"
          placeholder="Find a tool, format, or task…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setSelected((i) =>
                filtered.length
                  ? (i + (e.key === "ArrowDown" ? 1 : -1) + filtered.length) %
                    filtered.length
                  : 0,
              );
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (current) choose(current);
            }
          }}
        />
        <button type="button" aria-label="Close tool search" onClick={onClose}>
          <X size={19} />
        </button>
      </div>
      <div className="command-hint">
        {query
          ? `${filtered.length} matching destinations`
          : "All 19 tools · Recently opened tools first"}
      </div>
      <div
        className="command-results"
        id={`${id}-results`}
        role="listbox"
        aria-label="Tools and pages"
      >
        {filtered.map((tool, i) => (
          <div
            id={`${id}-${tool.id}`}
            key={tool.id}
            role="option"
            aria-selected={current?.id === tool.id}
            className="command-result"
            onMouseMove={() => setSelected(i)}
            onClick={() => choose(tool)}
          >
            <span className="command-icon">
              <tool.icon size={19} />
            </span>
            <span>
              <strong>{tool.name}</strong>
              <small>{tool.description}</small>
              <span className="command-category">
                {tool.category}
                {!query && recent.includes(tool.id as ViewMode)
                  ? " · Recent"
                  : ""}
              </span>
            </span>
            <ArrowUpRight size={15} />
          </div>
        ))}
        {!filtered.length && (
          <div className="command-empty">
            <Search size={25} />
            <strong>No tools found for “{query}”</strong>
            <p>Try a task like “compare”, “SQL”, “convert units”, or “logs”.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelected(0);
                input.current?.focus();
              }}
            >
              Show all tools
            </button>
          </div>
        )}
      </div>
      <div className="command-footer">
        <span>↑ ↓ Navigate · Enter Open</span>
        <span>Esc Close</span>
      </div>
    </dialog>
  );
}
export default function CommandPalette({
  isOpen,
  ...props
}: CommandPaletteProps) {
  return isOpen ? <SearchDialog {...props} /> : null;
}
