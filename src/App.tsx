import { lazy, Suspense, useState, useEffect } from "react";
import "./index.css";
import Toolbar from "./components/Layout/Toolbar";
import WorkbenchHeading from "./components/Layout/WorkbenchHeading";
import "./workbench.css";
import "./workspace.css";
import "./seo/seo.css";
import { navigateTo, useSiteRoute } from "./seo/routes";
import { toolPath } from "./seo/pages";
import { applyPageMetadata } from "./seo/metadata";
import SearchContent from "./seo/SearchContent";
import { rememberTool } from "./utils/toolHistory";
import ToolWorkspace from "./components/Workspace/ToolWorkspace";
import AdBanner from "./components/Ads/AdBanner";
import AboutPanel from "./components/About/AboutPanel";
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
import type { ViewMode } from "./types";

import CommandPalette from "./components/CommandPalette/CommandPalette";

export default function App() {
  const route = useSiteRoute();
  const page = route.page;
  const isTool = !["home", "portfolio", "notfound"].includes(page.id);
  const initialMode = isTool ? (page.id as ViewMode) : "text";
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  if (isTool && mode !== page.id) setMode(page.id as ViewMode);

  // Global Cmd+K / Ctrl+K listener for quick search
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  useEffect(() => {
    if (route.legacy) navigateTo(page.path + route.search, true);
  }, [route.legacy, page.path, route.search]);
  useEffect(() => {
    if (isTool) {
      rememberTool(page.id as ViewMode);
    }
  }, [isTool, page.id]);
  useEffect(() => {
    applyPageMetadata(page);
    const tracker = (
      window as unknown as { gtag?: (...args: unknown[]) => void }
    ).gtag;
    if (tracker)
      tracker("event", "page_view", {
        page_title: page.title,
        page_location: window.location.href,
        page_path: page.path,
      });
  }, [page]);

  const handleModeChange = (newMode: ViewMode) => {
    setMode(newMode);
    navigateTo(toolPath(newMode));
  };

  const goPortfolio = () => navigateTo("/portfolio/");
  const goBack = () => navigateTo(toolPath(mode));

  // Portfolio is a full-page takeover
  if (page.id === "portfolio") {
    return (
      <Suspense
        fallback={<div className="space-loading">Opening portfolio…</div>}
      >
        <PortfolioPage onBack={goBack} />
      </Suspense>
    );
  }

  if (page.id === "home") {
    return (
      <>
        <Suspense
          fallback={
            <div className="space-loading">Opening your workspace…</div>
          }
        >
          <HomePage
            onTool={handleModeChange}
            onPortfolio={goPortfolio}
            onSearch={() => setCommandPaletteOpen(true)}
          />
        </Suspense>
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onSelectTool={handleModeChange}
          onPortfolio={goPortfolio}
        />
      </>
    );
  }

  if (page.id === "notfound")
    return (
      <div className="search-not-found">
        <SearchContent page={page} primary />
      </div>
    );

  return (
    <div className="tool-document">
      <div className="tool-app flex flex-col bg-[#171d19] text-[#e4ebdd] overflow-hidden">
        {/* About Me slide-in panel */}
        {aboutOpen && (
          <AboutPanel
            onClose={() => setAboutOpen(false)}
            onPortfolio={goPortfolio}
          />
        )}

        {/* Cmd+K Quick Search Command Palette */}
        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          onSelectTool={handleModeChange}
          onPortfolio={goPortfolio}
        />

        <a
          className="workspace-skip"
          href="#tool-workspace"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("tool-workspace")?.focus();
          }}
        >
          Skip to workspace
        </a>
        <Toolbar
          mode={mode}
          onModeChange={handleModeChange}
          onAbout={() => setAboutOpen((v) => !v)}
          onOpenSearch={() => setCommandPaletteOpen(true)}
        />

        <WorkbenchHeading mode={mode} />
        <ToolWorkspace mode={mode} />
        <AdBanner />
      </div>
      <SearchContent page={page} />
    </div>
  );
}
