import SearchContent from "../seo/SearchContent";
import { toolPath } from "../seo/pages";
import { useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  LayoutGrid,
  Code2,
  Globe,
  Shapes,
  SlidersHorizontal,
  GitFork,
  ShieldCheck,
  Zap,
  ChevronRight,
  Star,
  X,
} from "lucide-react";
import type { ViewMode } from "../types";
import { TOOLS, TOOL_CATEGORIES } from "../data/tools";
import { TOOL_KEYWORDS } from "../data/toolSearch";
import RecentTools from "../components/Workspace/RecentTools";
import Brand from "../components/Spatial/Brand";
import CharacterGuide from "../components/Guide/CharacterGuide";
import ThemeChoice from "../components/Guide/ThemeChoice";
import { tiltCard, resetTilt } from "../components/Spatial/cardMotion";
import "../spatial.css";

const categories = ["All tools", ...TOOL_CATEGORIES];
const categoryIcons = [LayoutGrid, Code2, Globe, Shapes, SlidersHorizontal];
export default function HomePage({
  onTool,
  onPortfolio,
  onSearch,
}: {
  onTool: (m: ViewMode) => void;
  onPortfolio: () => void;
  onSearch: () => void;
}) {
  const [category, setCategory] = useState("All tools");
  const [search, setSearch] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("psdev-favorites") || "[]");
      return Array.isArray(saved)
        ? saved.filter((x) => typeof x === "string")
        : [];
    } catch {
      return [];
    }
  });
  const filtered = TOOLS.filter(
    (t) =>
      (category === "All tools" || t.category === category) &&
      (!favoritesOnly || favorites.includes(t.id)) &&
      `${t.name} ${t.description} ${t.category} ${TOOL_KEYWORDS[t.id].join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const displayed = filtered;
  const selectCategory = (c: string) => {
    setCategory(c);
    setFavoritesOnly(false);
  };
  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem("psdev-favorites", JSON.stringify(next));
    } catch {
      /* Storage is optional. */
    }
  };
  return (
    <div className="space-app">
      <aside className="space-sidebar">
        <Brand
          onClick={() => {
            selectCategory("All tools");
            setSearch("");
          }}
        />
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Tool categories">
          {categories.map((c, i) => {
            const Icon = categoryIcons[i];
            return (
              <button
                key={c}
                className={category === c && !favoritesOnly ? "active" : ""}
                onClick={() => selectCategory(c)}
              >
                <Icon size={17} />
                <span>{c}</span>
                {i === 0 && <small>{TOOLS.length}</small>}
              </button>
            );
          })}
          <button
            className={favoritesOnly ? "active" : ""}
            onClick={() => {
              setFavoritesOnly(true);
              setCategory("All tools");
            }}
          >
            <Star size={17} />
            <span>Favorites</span>
            <small>{favorites.length}</small>
          </button>
        </nav>
        <div className="sidebar-note">
          <span className="note-symbol">✳</span>
          <h3>
            Less friction.
            <br />
            More creation.
          </h3>
          <p>A toolkit that stays out of your way.</p>
          <button onClick={onSearch}>
            Find your next tool <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <a
            href="https://github.com/pspcps/diffwise"
            target="_blank"
            rel="noreferrer"
          >
            <GitFork size={16} /> Open source <ArrowUpRight size={14} />
          </a>
          <button className="builder-link" onClick={onPortfolio}>
            <img src="/avatar.jpg" alt="" />
            <span>
              Prakash Choudhary<small>Meet the builder</small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        </div>
      </aside>
      <main className="space-main">
        <header className="space-topbar">
          <div className="mobile-brand">
            <Brand
              onClick={() => {
                selectCategory("All tools");
                setSearch("");
              }}
            />
          </div>
          <div className="breadcrumb">
            Workspace <ChevronRight size={13} />
            <span>Overview</span>
          </div>
          <div className="topbar-actions">
            <ThemeChoice />
            <span className="local-status">
              <span className="live-dot" /> Built for your browser
            </span>
            <button className="search-shortcut" onClick={onSearch}>
              <Search size={15} />
              <span>Quick search</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="profile-button"
              onClick={onPortfolio}
              aria-label="Open Prakash's portfolio"
            >
              <img src="/avatar.jpg" alt="" />
            </button>
          </div>
        </header>
        <div className="space-content">
          <section className="space-hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span /> 20 TOOLS. ONE WORKSPACE.
              </div>
              <h1>
                Your everyday
                <br />
                <em>developer toolkit.</em>
              </h1>
              <p>
                Compare code, inspect data, debug requests, and convert
                measurements. Find the right tool and get back to building.
              </p>
              <div className="hero-actions">
                <button
                  className="primary-button"
                  onClick={() => onTool("text")}
                >
                  Start comparing <ArrowUpRight size={18} />
                </button>
                <button className="text-button" onClick={onSearch}>
                  Find a tool <Search size={16} />
                </button>
              </div>
              <div className="hero-benefits">
                <span>
                  <ShieldCheck size={14} /> Files stay on your device
                </span>
                <span>
                  <Zap size={14} /> Free to explore
                </span>
              </div>
            </div>
            <div className="hero-art">
              <CharacterGuide
                stories={[
                  "Pick a tool below, or tap me for a tip. Every tool is here; search by name, format, or task.",
                  "Comparing two versions? Open Diff Checker and try its JSON example. Keys, values, and nested brackets have distinct colors.",
                  "Need structured data? JSON & YAML includes source, tree, table, and graph views. Your theme choice follows you between tools.",
                ]}
              />
            </div>
          </section>
          <section className="tool-section" id="tools">
            <div className="section-heading">
              <div>
                <div className="eyebrow muted">THE TOOLKIT</div>
                <h2>
                  {favoritesOnly ? "Your favorites." : "All your tools."}
                  <span>{filtered.length.toString().padStart(2, "0")}</span>
                </h2>
              </div>
              <label className="tool-search">
                <Search size={16} />
                <input
                  aria-label="Search tools"
                  placeholder="Find a tool…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </label>
            </div>
            <div
              className="category-tabs"
              role="group"
              aria-label="Filter tools"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c && !favoritesOnly}
                  className={category === c && !favoritesOnly ? "selected" : ""}
                  onClick={() => selectCategory(c)}
                >
                  {c}
                </button>
              ))}
              <button
                aria-pressed={favoritesOnly}
                className={favoritesOnly ? "selected" : ""}
                onClick={() => {
                  setFavoritesOnly(true);
                  setCategory("All tools");
                }}
              >
                Favorites · {favorites.length}
              </button>
            </div>
            {!search && !favoritesOnly && category === "All tools" && (
              <RecentTools onTool={onTool} />
            )}
            <div className="tools-grid">
              {displayed.map((t, i) => (
                <article
                  className="tool-card"
                  key={t.id}
                  onPointerMove={tiltCard}
                  onPointerLeave={resetTilt}
                  style={
                    {
                      "--accent": t.color,
                      "--delay": `${i * 40}ms`,
                    } as CSSProperties
                  }
                >
                  <div className="card-top">
                    <span className="tool-icon">
                      <t.icon size={23} strokeWidth={1.5} />
                    </span>
                    {"badge" in t && (
                      <span className="tool-badge">{t.badge}</span>
                    )}
                    <button
                      className={`favorite-button ${favorites.includes(t.id) ? "saved" : ""}`}
                      aria-label={`${favorites.includes(t.id) ? "Unfavorite" : "Favorite"} ${t.name}`}
                      aria-pressed={favorites.includes(t.id)}
                      onClick={() => toggleFavorite(t.id)}
                    >
                      <Star size={15} />
                    </button>
                  </div>
                  <a
                    href={toolPath(t.id)}
                    className="tool-card-link"
                    onClick={event => {if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0){event.preventDefault();onTool(t.id);}}}
                  >
                    <h3>
                      {t.name}
                      <ArrowUpRight size={18} />
                    </h3>
                    <p>{t.description}</p>
                    <span className="card-category">
                      {t.category}
                      <ArrowRight size={14} />
                    </span>
                  </a>
                </article>
              ))}
            </div>
            {displayed.length === 0 && (
              <div className="empty-tools">
                <Search size={26} />
                <h3>
                  {favoritesOnly
                    ? "Your toolkit, your way."
                    : "No tools found."}
                </h3>
                <p>
                  {favoritesOnly
                    ? "Tap a star on any tool to save it here."
                    : "Try another name or choose a different category."}
                </p>
                <button
                  className="text-button"
                  onClick={() => {
                    setSearch("");
                    selectCategory("All tools");
                  }}
                >
                  Explore all tools <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
          <SearchContent/>
          <section className="builder-banner">
            <div className="builder-monogram">
              pc<span>↗</span>
            </div>
            <div>
              <span className="eyebrow muted">CRAFTED WITH CURIOSITY</span>
              <h3>Good tools start with a builder.</h3>
              <p>
                Meet Prakash. Engineer, problem solver, and the mind behind this
                space.
              </p>
            </div>
            <button className="secondary-button" onClick={onPortfolio}>
              Behind the build <ArrowUpRight size={17} />
            </button>
          </section>
          <footer className="space-footer">
            <span>© {new Date().getFullYear()} PSDevTool</span>
            <span>
              Made to keep you in flow. <span className="footer-star">✳</span>
            </span>
            <a
              href="https://github.com/pspcps/diffwise"
              target="_blank"
              rel="noreferrer"
            >
              View source <ArrowUpRight size={12} />
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}
