import InformationPage from "./seo/InformationPage";
import { isInformationId } from "./seo/siteInformation";
import { lazy, Suspense, useState, useEffect } from "react";
import "./index.css";
import Toolbar from "./components/Layout/Toolbar";
import WorkbenchHeading from "./components/Layout/WorkbenchHeading";
import "./workbench.css";
import "./workspace.css";
import "./seo/seo.css";
import "./resume.css";
import { navigateTo, useSiteRoute } from "./seo/routes";
import { toolPath } from "./seo/pages";
import { applyPageMetadata } from "./seo/metadata";
import SearchContent from "./seo/SearchContent";
import { rememberTool } from "./utils/toolHistory";
import ToolWorkspace from "./components/Workspace/ToolWorkspace";
import AdBanner from "./components/Ads/AdBanner";
import AboutPanel from "./components/About/AboutPanel";
const ResumePage = lazy(() => import("./pages/ResumePage"));
const HomeExperience = lazy(
  () => import("./components/Experience/HomeExperience"),
);
const PortfolioEntry = lazy(
  () => import("./components/Experience/PortfolioEntry"),
);
import type { ViewMode } from "./types";

import CommandPalette from "./components/CommandPalette/CommandPalette";

export default function App() {
  const route = useSiteRoute();
  const page = route.page;
  const isResume = page.id === "resume" || page.id.startsWith("resume-");
  const isTool =
    !isResume &&
    !isInformationId(page.id) &&
    ![
      "home",
      "portfolio",
      "portfolio-v1",
      "portfolio-v2",
      "portfolio-v3",
      "notfound",
    ].includes(page.id);
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
    if (isTool || page.id === "resume") {
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
    if (newMode === "resume") {
      rememberTool("resume");
      navigateTo("/resume/");
      return;
    }
    setMode(newMode);
    navigateTo(toolPath(newMode));
  };

  const goPortfolio = () => navigateTo("/portfolio/");
  const goBack = () => navigateTo(toolPath(mode));

  if (isInformationId(page.id)) return <InformationPage id={page.id} />;

  if (isResume)
    return (
      <Suspense fallback={<div className="space-loading">Opening resume…</div>}>
        <ResumePage
          templateId={
            page.id.startsWith("resume-") ? page.id.slice(7) : undefined
          }
        />
      </Suspense>
    );

  if (page.id === "portfolio" || page.id.startsWith("portfolio-v"))
    return (
      <Suspense
        fallback={<div className="space-loading">Opening portfolio…</div>}
      >
        <PortfolioEntry
          key={page.id}
          onBack={goBack}
          initialVersion={
            page.id === "portfolio"
              ? undefined
              : (page.id.slice("portfolio-".length) as "v1" | "v2" | "v3")
          }
        />
      </Suspense>
    );

  if (page.id === "home") {
    return (
      <>
        <Suspense
          fallback={
            <div className="space-loading">Opening your workspace…</div>
          }
        >
          <HomeExperience
            search={route.search}
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
        <nav className="tool-guide-navigation" aria-label="Tool help">
          <a href="#how-to-use">Guide & worked example ↓</a>
          <a href="/contact/">Report an issue</a>
          <a href="/privacy/">Privacy</a>
        </nav>
      </div>
      <SearchContent page={page} />
      <AdBanner />
    </div>
  );
}
