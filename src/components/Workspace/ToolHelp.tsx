import { useEffect, useRef, useState } from "react";
import { CircleHelp, X, ArrowRight } from "lucide-react";
import { TOOLS } from "../../data/tools";
import { TOOL_TIPS } from "../../data/toolTips";
import type { ViewMode } from "../../types";
function HelpDialog({
  mode,
  onClose,
}: {
  mode: ViewMode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const tool = TOOLS.find((t) => t.id === mode)!;
  useEffect(() => {
    const node = ref.current;
    const previous = document.activeElement;
    node?.showModal();
    return () => {
      node?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  const network =
    mode === "api"
      ? "Sending a request contacts the endpoint you choose. An optional proxy sends it through corsproxy.io. API Desk saves collections and request history locally in this browser. Browser CORS rules apply."
      : mode === "distance"
        ? "Map tiles load from OpenStreetMap. Get driving route sends your selected coordinates to OSRM. Direct distances are calculated locally."
        : "This tool processes its inputs in your browser. Some editor and document resources may load from external CDNs.";
  return (
    <dialog
      ref={ref}
      className="workspace-dialog tool-help"
      aria-labelledby="tool-help-title"
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
      <div className="workspace-dialog-title">
        <span>
          <tool.icon size={19} />
          <h2 id="tool-help-title">Using {tool.name}</h2>
        </span>
        <button type="button" aria-label="Close tool help" onClick={onClose}>
          <X size={19} />
        </button>
      </div>
      <p className="help-lead">{tool.description}</p>
      <h3>Start here</h3>
      <p>{TOOL_TIPS[mode]}</p>
      <h3>Data and network</h3>
      <p>{network}</p>
      <p className="help-footnote">
        The hosted app includes analytics and advertising scripts. Input
        processing and third-party page requests are separate; see the README
        for details.
      </p>
      <h3>Your workspace</h3>
      <p>
        Switch between tools using the picker or Ctrl / ⌘ K. Opened tool inputs
        stay in memory while you switch tools in this workspace. Reloading or
        leaving the workspace may reset them. Recent history stores tool names,
        not your input.
      </p>
      <a
        href="https://github.com/pspcps/diffwise#how-data-and-network-access-work"
        target="_blank"
        rel="noopener noreferrer"
      >
        Read the tool guide <ArrowRight size={14} />
      </a>
    </dialog>
  );
}
export default function ToolHelp({ mode }: { mode: ViewMode }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="toolbar-home tool-help-trigger"
        ref={trigger}
        aria-label="Help and data information"
        onClick={() => setOpen(true)}
      >
        <CircleHelp size={17} />
      </button>
      {open && <HelpDialog mode={mode} onClose={close} />}
    </>
  );
}
