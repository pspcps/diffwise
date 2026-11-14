import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import type { ViewMode } from "../../types";
import { ToolActivity } from "./ToolActivity";
import { TOOLS } from "../../data/tools";

const VIEWS = {
  resume: lazy(() => import("../../pages/ResumePage")),
  text: lazy(() => import("../TextCompare/TextCompareView")),
  file: lazy(() => import("../FileCompare/FileCompareView")),
  case: lazy(() => import("../CaseConverter/CaseConverterView")),
  json: lazy(() => import("../JsonTools/JsonToolsView")),
  time: lazy(() => import("../TimeZone/TimeZoneView")),
  base64: lazy(() => import("../Base64Image/Base64ImageView")),
  markup: lazy(() => import("../MarkupStudio/MarkupStudioView")),
  regex: lazy(() => import("../RegexLab/RegexLabView")),
  url: lazy(() => import("../UrlTools/UrlToolsView")),
  har: lazy(() => import("../HarViewer/HarViewerView")),
  api: lazy(() => import("../ApiStudio/ApiStudioView")),
  jwt: lazy(() => import("../JwtStudio/JwtStudioView")),
  uuid: lazy(() => import("../UuidStudio/UuidStudioView")),
  architecture: lazy(() => import("../ArchitectureLab/ArchitectureLabView")),
  image_studio: lazy(() => import("../ImageStudio/ImageStudioView")),
  debug: lazy(() => import("../ErrorDebugger/ErrorDebuggerView")),
  distance: lazy(() => import("../GeoDistance/GeoDistanceView")),
  measure: lazy(() => import("../MeasureLab/MeasureLabView")),
  pdf: lazy(() => import("../PdfStudio/PdfStudioView")),
} satisfies Record<ViewMode, unknown>;

class ToolErrorBoundary extends Component<
  { children: ReactNode; name: string },
  { failed: boolean; attempt: number }
> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="tool-state" role="alert">
        <strong>{this.props.name} could not open</strong>
        <p>
          Try reopening this tool. If an app file could not load, reload the
          application to fetch it again. Reloading resets unsaved workspace
          inputs.
        </p>
        <button
          type="button"
          onClick={() =>
            this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }))
          }
        >
          Try again
        </button>
        <button type="button" onClick={() => window.location.reload()}>
          Reload application
        </button>
        <a href="/">Back to all tools</a>
      </div>
    ) : (
      <div className="tool-boundary-content" key={this.state.attempt}>
        {this.props.children}
      </div>
    );
  }
}
function ToolPanel({ id, current }: { id: ViewMode; current: ViewMode }) {
  const active = current === id;
  const [opened, setOpened] = useState(active);
  // Keep visited workspaces in memory; untouched tools never load or mount.
  if (active && !opened) setOpened(true);
  if (!opened && !active) return null;
  const View = VIEWS[id];
  const name = TOOLS.find((t) => t.id === id)!.name;
  return (
    <div
      className={`tool-panel${active ? "" : " invisible pointer-events-none"}`}
      data-tool={id}
      hidden={!active}
      aria-hidden={!active}
      inert={!active}
    >
      <ToolActivity.Provider value={active}>
        <ToolErrorBoundary name={name}>
          <Suspense
            fallback={
              <div className="tool-state" role="status">
                <span className="tool-loading-indicator" />
                <strong>Opening {name}</strong>
                <p>Preparing your workspace…</p>
              </div>
            }
          >
            <View />
          </Suspense>
        </ToolErrorBoundary>
      </ToolActivity.Provider>
    </div>
  );
}
export default function ToolWorkspace({ mode }: { mode: ViewMode }) {
  return (
    <main
      id="tool-workspace"
      tabIndex={-1}
      aria-label={`${TOOLS.find((t) => t.id === mode)!.name} workspace`}
      className="flex-1 min-h-0 relative workbench-frame"
      data-active-tool={mode}
    >
      {TOOLS.map((t) => (
        <ToolPanel key={t.id} id={t.id} current={mode} />
      ))}
    </main>
  );
}
