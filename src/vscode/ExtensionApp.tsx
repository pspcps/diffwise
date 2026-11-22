import { lazy, Suspense, useEffect, useState } from "react";
import { Search, ClipboardPaste, PanelRightOpen, X } from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "../data/tools";
import ToolWorkspace from "../components/Workspace/ToolWorkspace";
import ThemeChoice from "../components/Guide/ThemeChoice";
import { useSiteRoute, navigateTo } from "../seo/routes";
import type { ViewMode } from "../types";
import {
  hostReady,
  rememberView,
  request,
  reportError,
  selectTool,
} from "./bridge";
import { monaco } from "./monaco";
const ResumePage = lazy(() => import("../pages/ResumePage"));
export default function ExtensionApp() {
  const { page } = useSiteRoute();
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [selection, setSelection] = useState<string | null>(null);
  const isResume = page.id === "resume" || page.id.startsWith("resume-");
  const mode: ViewMode = isResume
    ? "resume"
    : TOOLS.some((t) => t.id === page.id)
      ? (page.id as ViewMode)
      : "text";
  const [lastTool, setLastTool] = useState<ViewMode>("text");
  if (!isResume && lastTool !== mode) setLastTool(mode);
  const tool = TOOLS.find((t) => t.id === mode)!;
  useEffect(() => {
    const onNotice = (e: Event) => setNotice((e as CustomEvent<string>).detail);
    const onSelection = (e: Event) =>
      setSelection((e as CustomEvent<string>).detail);
    window.addEventListener("psdevtool:notice", onNotice);
    window.addEventListener("psdevtool:selection", onSelection);
    void hostReady().catch(reportError);
    return () => {
      window.removeEventListener("psdevtool:notice", onNotice);
      window.removeEventListener("psdevtool:selection", onSelection);
    };
  }, []);
  useEffect(() => {
    rememberView(mode);
  }, [mode]);
  const insertSelection = () => {
    if (selection === null) return;
    const pane = document.querySelector(".tool-panel:not([hidden])");
    const editors = monaco.editor
      .getEditors()
      .filter((e) => pane?.contains(e.getDomNode()));
    const editor = editors.find((e) => e.hasTextFocus()) || editors[0];
    if (editor) {
      editor.setValue(selection);
      editor.focus();
      setSelection(null);
    } else
      setNotice(
        "This tool has no code editor. Use Copy selection, then paste into its input.",
      );
  };
  return (
    <div className="vscode-workspace">
      <header className="vscode-toolbar">
        <strong>
          PSDevTool<span>20 tools · local workspace</span>
        </strong>
        <label className="vscode-search">
          <Search size={15} />
          <input
            aria-label="Find a tool"
            placeholder="Find a tool…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="vscode-picker">
          Tool
          <select
            aria-label="Active tool"
            value={mode}
            onChange={(e) => selectTool(e.target.value)}
          >
            {TOOL_CATEGORIES.map((category) => (
              <optgroup label={category} key={category}>
                {TOOLS.filter((t) => t.category === category).map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <ThemeChoice />
      </header>
      {search && (
        <div className="vscode-search-results" aria-label="Tool search results">
          {TOOLS.filter((t) =>
            (t.name + " " + t.description)
              .toLowerCase()
              .includes(search.toLowerCase()),
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                selectTool(t.id);
                setSearch("");
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
      {notice && (
        <div className="vscode-notice" role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {selection !== null && (
        <div className="vscode-selection">
          <span>
            Editor selection ready ({selection.length.toLocaleString()}{" "}
            characters). Your existing input is kept until you choose Replace.
          </span>
          <button onClick={insertSelection}>
            <PanelRightOpen size={14} />
            Replace tool input
          </button>
          <button
            onClick={() =>
              void request("clipboardWrite", { text: selection })
                .then(() =>
                  setNotice("Selection copied. Paste into any tool input."),
                )
                .catch(reportError)
            }
          >
            <ClipboardPaste size={14} />
            Copy selection
          </button>
          <button
            aria-label="Dismiss editor selection"
            onClick={() => setSelection(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {isResume ? (
        <div className="vscode-resume">
          <Suspense fallback={<p>Opening resume builder…</p>}>
            <ResumePage
              templateId={
                page.id.startsWith("resume-") ? page.id.slice(7) : undefined
              }
            />
          </Suspense>
        </div>
      ) : (
        <>
          <div className="vscode-tool-description">
            <h1>{tool.name}</h1>
            <p>{tool.description}</p>
            {mode === "api" && (
              <small>
                Requests use the webview network stack; server CORS rules apply.
              </small>
            )}
          </div>
        </>
      )}
      <div className="vscode-tools" hidden={isResume} inert={isResume}>
        <ToolWorkspace mode={isResume ? lastTool : mode} />
      </div>
      <footer className="vscode-footer">
        <span>Bundled locally · no ads or analytics</span>
        <button onClick={() => navigateTo("/resume/")}>Resume Builder</button>
        <a href="https://psdevtool.online/privacy/">Privacy</a>
      </footer>
    </div>
  );
}
