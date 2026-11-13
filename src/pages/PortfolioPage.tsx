import {
  lazy,
  Suspense,
  useRef,
  useState,
  useEffect,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  X,
  Mail,
  Download,
  GitFork,
} from "lucide-react";
import { RESUME } from "../data/resumeData";
import CharacterGuide from "../components/Guide/CharacterGuide";
import ThemeChoice from "../components/Guide/ThemeChoice";
import { tiltCard, resetTilt } from "../components/Spatial/cardMotion";
import "../spatial.css";
const InteractiveArchitectureDiagram = lazy(
  () => import("../components/Portfolio/InteractiveArchitectureDiagram"),
);

import { PROJECT_CASE_STUDIES } from "../data/projectCaseStudies";
import { downloadProfile } from "../utils/downloadProfile";

type Project = (typeof RESUME.projects)[number];
const FILTERS = ["All projects", "AI & agents", "Developer tools"];
const DEV_PROJECTS = ["PSDevTool", "Kafbat UI", "ApiDesk Studio"];
export default function PortfolioPage({ onBack }: { onBack: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState("All projects");
  const [selected, setSelected] = useState<Project | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showArchitecture, setShowArchitecture] = useState(false);
  const scrollTo = (id: string) =>
    root.current?.querySelector(`#${id}`)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  useEffect(() => {
    if (selected) dialog.current?.showModal();
  }, [selected]);
  const filtered = RESUME.projects.filter(
    (p) =>
      filter === "All projects" ||
      (filter === "Developer tools"
        ? DEV_PROJECTS.includes(p.title)
        : p.tech.some((t) => /ai|gemini|ollama|agents/i.test(t))),
  );
  const projects =
    expanded || filter !== "All projects" ? filtered : filtered.slice(0, 6);
  return (
    <div className="portfolio-space" ref={root}>
      <header className="portfolio-nav">
        <ThemeChoice />
        <button
          className="portfolio-identity"
          onClick={() => root.current?.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <img src="/avatar.jpg" alt="" />
          <span>
            Prakash Choudhary<span className="brand-period">.</span>
          </span>
        </button>
        <nav aria-label="Portfolio sections">
          <button onClick={() => scrollTo("projects")}>Work</button>
          <button onClick={() => scrollTo("about")}>About</button>
          <button onClick={() => scrollTo("experience")}>Experience</button>
          <button onClick={() => scrollTo("contact")}>Contact</button>
        </nav>
        <button className="toolbar-home" onClick={onBack}>
          <ArrowLeft size={14} /> Back to tools
        </button>
      </header>
      <main className="portfolio-body">
        <section className="portfolio-hero">
          <div className="portfolio-hero-copy">
            <div className="eyebrow">
              <span /> SENIOR SOFTWARE ENGINEER · 9+ YEARS
            </div>
            <h1>
              Hi, I’m Prakash.
              <br />
              <em>I build for scale.</em>
            </h1>
            <p>
              I’m Prakash Choudhary, a senior software engineer turning backend
              services, distributed systems, and applied AI into practical
              products.
            </p>
            <div className="portfolio-role">
              <span className="live-dot" />
              {RESUME.focus}
            </div>
            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => scrollTo("projects")}
              >
                Explore my work <ArrowUpRight size={17} />
              </button>
              <a
                className="text-button"
                href={RESUME.resumeUrl}
                target="_blank"
                rel="noreferrer"
              >
                View résumé <Download size={15} />
              </a>
              <button className="text-button" onClick={downloadProfile}>
                Download text profile <Download size={15} />
              </button>
            </div>
          </div>
          <div className="portfolio-hero-art">
            <CharacterGuide
              stories={[
                "Hi! I’m your guide to Prakash’s work. He builds cloud-native systems, real-time platforms, and AI products. Tap me to explore his story.",
                "At Lytx, Prakash architected a reverse-geocoding system using OpenStreetMap and Redis, saving approximately $1M each year.",
                "Project Drishti connects camera feeds, Vertex AI Vision, and Gemini to help teams assess crowd safety and respond to incidents.",
                "PSDevTool is the workspace you’re using: code comparison, data tools, document processing, and more. Explore a project below for the details.",
              ]}
            />
          </div>
        </section>
        <section className="portfolio-stats" aria-label="Career highlights">
          {RESUME.stats.map((s) => (
            <div key={s.label}>
              <strong>{s.value}</strong>
              <p>{s.label}</p>
            </div>
          ))}
        </section>
        <section className="portfolio-section" id="projects">
          <div className="section-heading">
            <div>
              <span className="eyebrow muted">SELECTED WORK / 01</span>
              <h2>Selected engineering projects.</h2>
            </div>
            <p>
              From real-time systems to local AI.
              <br />A few things I’ve brought to life.
            </p>
          </div>
          <div
            className="category-tabs"
            role="group"
            aria-label="Filter projects"
          >
            {FILTERS.map((f) => (
              <button
                className={filter === f ? "selected" : ""}
                aria-pressed={filter === f}
                key={f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="portfolio-projects">
            {projects.map((p) => (
              <article
                className="project-space-card"
                key={p.title}
                style={{ "--accent": p.color } as CSSProperties}
                onPointerMove={tiltCard}
                onPointerLeave={resetTilt}
              >
                <div className="project-space-content">
                  <h3>{p.title}</h3>
                  <p>{p.subtitle}</p>
                  <p className="project-real-summary">{p.bullets[0]}</p>
                  <div className="project-tech">
                    {p.tech.slice(0, 4).map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <button
                    className="project-details-button"
                    onClick={() => setSelected(p)}
                  >
                    Project details <ArrowUpRight size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!expanded && filter === "All projects" && (
            <button
              className="all-tools-button"
              onClick={() => setExpanded(true)}
            >
              See all {RESUME.projects.length} projects <ArrowRight size={15} />
            </button>
          )}
        </section>
        <section className="portfolio-section portfolio-about" id="about">
          <div>
            <span className="eyebrow muted">A LITTLE ABOUT ME / 02</span>
            <h2>Professional summary.</h2>
          </div>
          <p>{RESUME.summary}</p>
        </section>
        <section className="portfolio-section" id="experience">
          <span className="eyebrow muted">THE JOURNEY / 03</span>
          <h2>Professional experience.</h2>
          <div className="experience-list">
            {RESUME.experience.map((e, i) => (
              <details key={e.company} open={i === 0}>
                <summary>
                  <span>{e.period}</span>
                  <div>
                    <h3>{e.company}</h3>
                    <p>
                      {e.role}
                      {e.current ? " · Current" : ""}
                    </p>
                  </div>
                  <ChevronDown size={16} />
                </summary>
                <ul>
                  {e.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
        <section className="portfolio-section" id="skills">
          <span className="eyebrow muted">THE BUILDING BLOCKS / 04</span>
          <h2>Technical skills.</h2>
          <div className="skills-grid">
            {Object.entries(RESUME.skills).map(([name, skill]) => (
              <div className="skill-space-card" key={name}>
                <h3>{name}</h3>
                <div className="project-tech">
                  {skill.items.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="portfolio-section" id="education">
          <span className="eyebrow muted">FOUNDATIONS / 05</span>
          <h2>Education & certifications.</h2>
          <div className="credential-row">
            <div>
              <span className="eyebrow muted">EDUCATION</span>
              <h3>{RESUME.education.degree}</h3>
              <p>
                {RESUME.education.institution}
                <br />
                {RESUME.education.location} · {RESUME.education.period}
              </p>
            </div>
            <div>
              <span className="eyebrow muted">CERTIFICATION</span>
              {RESUME.certifications.map((c) => (
                <div key={c.name}>
                  <h3>{c.name}</h3>
                  <p>{c.issuer}</p>
                </div>
              ))}
            </div>
          </div>
          <h2>Open-source contributions.</h2>
          <div className="open-source-grid">
            {RESUME.openSource.map((o) => (
              <div key={o.project}>
                <h3>
                  {o.link === "#" ? (
                    o.project
                  ) : (
                    <a href={o.link} target="_blank" rel="noreferrer">
                      {o.project} ↗
                    </a>
                  )}
                </h3>
                <p>{o.contribution}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="portfolio-contact" id="contact">
          <div className="eyebrow">WHAT COULD WE BUILD TOGETHER?</div>
          <h2>
            Let’s make something
            <br />
            <em>worth making.</em>
          </h2>
          <p>
            Have an interesting problem or an ambitious idea? I’d love to hear
            it.
          </p>
          <a className="primary-button" href={`mailto:${RESUME.email}`}>
            <Mail size={15} /> Say hello <ArrowUpRight size={17} />
          </a>
          <div className="contact-links">
            <a href={RESUME.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
            <a
              href="https://github.com/pspcps"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
            <a href={RESUME.resumeUrl} target="_blank" rel="noreferrer">
              Résumé ↗
            </a>
          </div>
        </section>
        <footer className="space-footer">
          <span>
            © {new Date().getFullYear()} {RESUME.name}
          </span>
          <span>
            A little curiosity goes a long way.{" "}
            <span className="footer-star">✳</span>
          </span>
          <button className="text-button" onClick={onBack}>
            Back to tools <ArrowUpRight size={13} />
          </button>
        </footer>
      </main>
      <dialog
        className={`project-dialog ${showArchitecture ? "project-dialog-wide" : ""}`}
        ref={dialog}
        aria-labelledby="project-title"
        onClose={() => {
          setSelected(null);
          setShowArchitecture(false);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        {selected && (
          <>
            <CharacterGuide
              compact
              key={selected.title}
              stories={[
                `${selected.title}: ${selected.subtitle}`,
                ...selected.bullets,
              ]}
            />
            <button
              className="dialog-close"
              aria-label="Close project"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} />
            </button>
            <div className="eyebrow muted">PROJECT / {selected.period}</div>
            <h2 id="project-title">{selected.title}</h2>
            <p>{selected.subtitle}</p>
            <div className="case-problem">
              <h3>Problem & purpose</h3>
              <p>{PROJECT_CASE_STUDIES[selected.title].problem}</p>
            </div>
            <div className="project-tech">
              {selected.tech.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <ul>
              {selected.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="architecture-walkthrough">
              <button
                className="secondary-button"
                onClick={() => setShowArchitecture((v) => !v)}
                aria-expanded={showArchitecture}
              >
                {showArchitecture
                  ? "Hide architecture"
                  : "Explore architecture"}
                <ChevronDown size={15} />
              </button>
              {showArchitecture && (
                <Suspense fallback={<p>Loading architecture…</p>}>
                  <InteractiveArchitectureDiagram
                    key={selected.title}
                    projectTitle={selected.title}
                    projectColor={selected.color}
                  />
                </Suspense>
              )}
            </div>
            {!selected.github && (
              <p className="private-source-label">
                Private repository · Architecture summary available above
              </p>
            )}
            {selected.github && (
              <a
                className="primary-button"
                href={selected.github}
                target="_blank"
                rel="noreferrer"
              >
                <GitFork size={15} /> Explore source <ArrowUpRight size={15} />
              </a>
            )}
          </>
        )}
      </dialog>
    </div>
  );
}
