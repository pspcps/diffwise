import { lazy, Suspense, useRef, useState, type MouseEvent } from "react";
import {
  Code2,
  GitFork,
  Search,
  Star,
  X,
  SlidersHorizontal,
  Braces,
  Layers3,
  Command,
} from "lucide-react";
import type { ViewMode } from "../types";
import { TOOLS, TOOL_CATEGORIES } from "../data/tools";
import { TOOL_KEYWORDS } from "../data/toolSearch";
import { toolPath, HOME_PAGE } from "../seo/pages";
import ThemeChoice from "../components/Guide/ThemeChoice";
import DesignSwitcher from "../components/Experience/DesignSwitcher";
import RecentTools from "../components/Workspace/RecentTools";
import SearchContent from "../seo/SearchContent";
import AdBanner from "../components/Ads/AdBanner";
import { useMotion } from "../components/Motion/MotionContext";
import "../portfolio-v3.css";
import "../studio-home.css";
const DeskScene = lazy(() => import("../components/PortfolioV3/DeskScene"));
export default function StudioHomePage({
  onTool,
  onPortfolio,
  onSearch,
}: {
  onTool: (id: ViewMode) => void;
  onPortfolio: () => void;
  onSearch: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const { enabled } = useMotion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All tools");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("psdev-favorites") || "[]");
      return Array.isArray(saved)
        ? saved.filter((id) => TOOLS.some((tool) => tool.id === id))
        : [];
    } catch {
      return [];
    }
  });
  const filtered = TOOLS.filter(
    (tool) =>
      (category === "All tools" || tool.category === category) &&
      (!favoritesOnly || favorites.includes(tool.id)) &&
      `${tool.name} ${tool.description} ${tool.category} ${TOOL_KEYWORDS[tool.id].join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const catalog = () =>
    root.current
      ?.querySelector("#studio-tools")
      ?.scrollIntoView({ behavior: enabled ? "smooth" : "instant" });
  function favorite(id: string) {
    const next = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem("psdev-favorites", JSON.stringify(next));
    } catch {
      /* Optional storage. */
    }
  }
  function openTool(event: MouseEvent<HTMLAnchorElement>, id: ViewMode) {
    if (
      event.button === 0 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault();
      onTool(id);
    }
  }
  return (
    <div className="studio-home" ref={root}>
      <a href="#studio-tools" className="studio-skip">
        Skip to tools
      </a>
      <header className="studio-header">
        <a className="studio-brand" href="/">
          <img src="/brand/logo.svg" alt="" width="36" height="36" />
          PSDevTool<span>.</span>
        </a>
        <div className="studio-header-controls">
          <DesignSwitcher design="studio" />
          <ThemeChoice />
          <button
            className="studio-quick-search"
            onClick={onSearch}
            aria-label="Quick tool search"
          >
            <Search size={18} />
            <span>Quick search</span>
            <kbd>⌘ K</kbd>
          </button>
        </div>
      </header>
      <main>
        <section className="studio-hero">
          <div className="studio-hero-copy">
            <p className="studio-kicker">
              20 USEFUL TOOLS. ONE THOUGHTFUL WORKSPACE.
            </p>
            <h1>
              A little less friction.
              <br />
              <em>A lot more flow.</em>
            </h1>
            <p>
              Compare code. Untangle data. Inspect requests.
              <br />A developer’s everyday essentials, together
              <br />
              in a space that feels good to use.
            </p>
            <div className="studio-hero-buttons">
              <button className="studio-primary" onClick={catalog}>
                <Command size={18} />
                Explore the toolkit
              </button>
              <button className="studio-simple" onClick={() => onTool("text")}>
                <Code2 size={18} />
                Start a diff
              </button>
            </div>
            <div className="studio-hero-tags">
              <span>
                <Braces size={16} />
                Code & data
              </span>
              <span>
                <SlidersHorizontal size={16} />
                Debug & inspect
              </span>
              <span>
                <Layers3 size={16} />
                Create & convert
              </span>
            </div>
          </div>
          <div className="studio-hero-desk">
            <Suspense
              fallback={
                <div className="studio-desk-loading">
                  Opening the workspace…
                </div>
              }
            >
              <DeskScene
                mode="tools"
                onExplore={(section) =>
                  section === "projects"
                    ? catalog()
                    : section === "experience"
                      ? onTool("json")
                      : onPortfolio()
                }
              />
            </Suspense>
          </div>
        </section>
        <section className="studio-principles" aria-label="Workspace features">
          <span>
            <strong>20 tools</strong>Every tool stays available.
          </span>
          <span>
            <strong>Your preferences</strong>Themes, favorites and recent tools.
          </span>
          <span>
            <strong>Your workflow</strong>One workspace, fewer tabs.
          </span>
        </section>
        <section id="studio-tools" className="studio-toolkit">
          <header>
            <div>
              <p className="studio-kicker">PICK A TOOL. KEEP BUILDING.</p>
              <h2>What are we working on?</h2>
            </div>
            <label className="studio-search">
              <Search size={18} />
              <input
                aria-label="Search tools"
                placeholder="JSON, PDF, logs, units…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </label>
          </header>
          <div
            className="studio-filters"
            role="group"
            aria-label="Filter tools"
          >
            {["All tools", ...TOOL_CATEGORIES].map((item) => (
              <button
                key={item}
                aria-pressed={category === item && !favoritesOnly}
                onClick={() => {
                  setCategory(item);
                  setFavoritesOnly(false);
                }}
              >
                {item}
              </button>
            ))}
            <button
              aria-pressed={favoritesOnly}
              onClick={() => {
                setCategory("All tools");
                setFavoritesOnly(!favoritesOnly);
              }}
            >
              <Star size={15} />
              Favorites · {favorites.length}
            </button>
          </div>
          {!query && !favoritesOnly && category === "All tools" && (
            <RecentTools onTool={onTool} />
          )}
          <p className="studio-results" role="status">
            {filtered.length} {filtered.length === 1 ? "tool" : "tools"} ready
            when you are
          </p>
          <div className="studio-tool-grid">
            {filtered.map((tool) => (
              <article key={tool.id} className="studio-tool-card">
                <div className="studio-tool-card-top">
                  <span className="studio-tool-icon">
                    <tool.icon size={25} strokeWidth={1.5} />
                  </span>
                  <button
                    onClick={() => favorite(tool.id)}
                    aria-label={`${favorites.includes(tool.id) ? "Remove" : "Add"} ${tool.name} ${favorites.includes(tool.id) ? "from" : "to"} favorites`}
                    aria-pressed={favorites.includes(tool.id)}
                  >
                    <Star
                      size={18}
                      fill={
                        favorites.includes(tool.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                </div>
                <a
                  href={toolPath(tool.id)}
                  onClick={(e) => openTool(e, tool.id)}
                >
                  <span>{tool.category}</span>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                  <strong>Open tool</strong>
                </a>
              </article>
            ))}
          </div>
          {!filtered.length && (
            <div className="studio-empty">
              <h3>No tools match this view.</h3>
              <p>Try a different search or show the full toolkit.</p>
              <button
                className="studio-primary"
                onClick={() => {
                  setQuery("");
                  setCategory("All tools");
                  setFavoritesOnly(false);
                }}
              >
                Show all 20 tools
              </button>
            </div>
          )}
        </section>
        <section className="studio-builder">
          <div>
            <p className="studio-kicker">MADE BY AN ENGINEER, FOR THE WORK</p>
            <h2>Good tools start with curiosity.</h2>
            <p>
              I’m Prakash. I build full-stack applications, distributed systems
              <br />
              and applied AI workflows. This workspace is one of them.
            </p>
          </div>
          <button onClick={onPortfolio}>
            <img src="/avatar.jpg" alt="" width="52" height="52" />
            <span>
              Prakash Choudhary<strong>Meet the builder</strong>
            </span>
          </button>
        </section>
        <div className="studio-site-content">
          <SearchContent page={HOME_PAGE} />
          <AdBanner />
        </div>
      </main>
      <footer className="studio-footer">
        <span>PSDevTool · Built to keep you in flow.</span>
        <a
          href="https://github.com/pspcps/diffwise"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitFork size={16} />
          Open source
        </a>
      </footer>
    </div>
  );
}
