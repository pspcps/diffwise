import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Braces,
  Code2,
  ExternalLink,
  FileText,
  GitFork,
  Layers3,
  Network,
  Sparkles,
} from "lucide-react";
import { RESUME } from "../data/resumeData";
import { PROJECT_CASE_STUDIES } from "../data/projectCaseStudies";
import { useCareerDuration } from "../hooks/useCareerDuration";
import { useMotion } from "../components/Motion/MotionContext";
import ThemeChoice from "../components/Guide/ThemeChoice";
import TechnologyIcon from "../components/Common/TechnologyIcon";
import RotatingRole from "../components/Portfolio/RotatingRole";
import type { DeskDestination } from "../components/PortfolioV3/DeskScene";
import "../portfolio-v3.css";
const DeskScene = lazy(() => import("../components/PortfolioV3/DeskScene"));
const FILTERS = [
  "All projects",
  "AI & agents",
  "Developer tools",
  "Android",
] as const;
const DEV = ["PSDevTool", "KafkaUI", "Cairn IDE", "ApiDesk Studio"];
const NAV = [
  { id: "projects", label: "The work" },
  { id: "experience", label: "The journey" },
  { id: "contact", label: "Say hello" },
];
function projectGroup(title: string, tech: readonly string[]) {
  return DEV.includes(title)
    ? "Developer tools"
    : tech.includes("Kotlin")
      ? "Android"
      : "AI & agents";
}
export default function PortfolioV3Page() {
  const root = useRef<HTMLDivElement>(null);
  const duration = useCareerDuration();
  const { enabled } = useMotion();
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]>("All projects");
  const [active, setActive] = useState("");
  const projects = RESUME.projects.filter(
    (p) =>
      filter === "All projects" || projectGroup(p.title, p.tech) === filter,
  );
  function explore(id: DeskDestination) {
    root.current?.querySelector<HTMLElement>(`#v3-${id}`)?.scrollIntoView({
      behavior: enabled ? "smooth" : "instant",
      block: "start",
    });
  }
  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = "true";
            reveal.unobserve(entry.target);
          }
        });
      },
      { root: element, threshold: 0.08 },
    );
    element
      .querySelectorAll("[data-v3-reveal]")
      .forEach((node) => reveal.observe(node));
    const sections = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting)
            setActive(entry.target.id.replace("v3-", ""));
      },
      { root: element, rootMargin: "-12% 0px -65% 0px", threshold: 0 },
    );
    element
      .querySelectorAll("[data-v3-section]")
      .forEach((node) => sections.observe(node));
    return () => {
      reveal.disconnect();
      sections.disconnect();
    };
  }, []);
  return (
    <div className="portfolio-v3" ref={root}>
      <a className="v3-skip" href="#v3-main">
        Skip to main content
      </a>
      <header className="v3-nav">
        <a className="v3-monogram" href="/" aria-label="PSDevTool home">
          pc<span>.</span>
        </a>
        <nav aria-label="Portfolio sections">
          {NAV.map((item) => (
            <button
              key={item.id}
              aria-current={active === item.id ? "location" : undefined}
              onClick={() => explore(item.id as DeskDestination)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="v3-nav-right">
          <details className="v3-versions">
            <summary>
              V3 <span aria-hidden="true">⌄</span>
            </summary>
            <div>
              <a href="/portfolio/v1/">Original</a>
              <a href="/portfolio/v2/">V2 · Profile</a>
              <a href="/portfolio/v3/" aria-current="page">
                V3 · Studio
              </a>
            </div>
          </details>
          <ThemeChoice />
        </div>
      </header>
      <main id="v3-main">
        <section
          className="v3-hero"
          aria-labelledby="v3-title"
          data-v3-section
          id="v3-intro"
        >
          <div className="v3-hero-copy">
            <p className="v3-kicker">AN ENGINEER. A BUILDER. A CURIOUS MIND.</p>
            <h1 id="v3-title">
              Prakash
              <br />
              Choudhary<span>.</span>
            </h1>
            <div className="v3-role-tape">
              <RotatingRole />
            </div>
            <p className="v3-hero-description">
              From the first interaction
              <br />
              to the systems behind it.
              <br />
              <strong>Full-stack engineering. Applied AI.</strong>
            </p>
            <div className="v3-hero-actions">
              <button
                className="v3-solid-button"
                onClick={() => explore("projects")}
              >
                <Code2 size={18} />
                Explore my work
              </button>
              <a className="v3-text-link" href="/resume/">
                <FileText size={17} />
                My resume
              </a>
            </div>
          </div>
          <div className="v3-hero-scene">
            <Suspense
              fallback={
                <div className="v3-scene-loading">Opening the studio…</div>
              }
            >
              <DeskScene onExplore={explore} />
            </Suspense>
          </div>
          <div className="v3-hero-foot">
            <span>Senior Software Engineer · Lytx</span>
            <span>
              Scroll to get to know me <span aria-hidden="true">↓</span>
            </span>
          </div>
        </section>
        <section className="v3-about" aria-labelledby="v3-about-title">
          <div className="v3-container">
            <div className="v3-about-heading" data-v3-reveal>
              <p className="v3-kicker">A LITTLE ABOUT THE PERSON AT THE DESK</p>
              <h2 id="v3-about-title">
                I like making
                <br />
                complex things
                <br />
                <em>feel simple.</em>
              </h2>
            </div>
            <div className="v3-about-copy" data-v3-reveal>
              <p>
                I’m a senior software engineer with {duration.label} years of
                experience connecting thoughtful interfaces with dependable
                systems.
              </p>
              <p>
                I’ve built React applications, Node.js services, Kafka pipelines
                and cloud platforms. More recently, I’ve been exploring how
                agents and retrieval-augmented generation can help people work
                with operational data.
              </p>
              <p>
                What ties it together? A focus on the real problem, the failure
                cases and the person using what we build.
              </p>
              <div className="v3-about-tags">
                <span>
                  <Code2 size={17} />
                  Full-stack
                </span>
                <span>
                  <Network size={17} />
                  Distributed systems
                </span>
                <span>
                  <Sparkles size={17} />
                  Applied AI
                </span>
              </div>
            </div>
            <div className="v3-career-stats" aria-label="Career highlights">
              {RESUME.stats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          className="v3-work"
          id="v3-projects"
          data-v3-section
          aria-labelledby="v3-work-title"
        >
          <div className="v3-container">
            <header className="v3-section-heading" data-v3-reveal>
              <div>
                <p className="v3-kicker">LESS TALK. MORE WORKING SOFTWARE.</p>
                <h2 id="v3-work-title">
                  Things I’ve
                  <br />
                  <em>put into the world.</em>
                </h2>
              </div>
              <p>
                Practical projects. Different domains.
                <br />
                Plenty of engineering decisions.
              </p>
            </header>
            <div
              className="v3-project-filters"
              role="group"
              aria-label="Filter projects"
            >
              {FILTERS.map((item) => (
                <button
                  key={item}
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <p className="v3-result-count" role="status">
              {projects.length} projects to explore
            </p>
            <div className="v3-project-list">
              {projects.map((project) => {
                const study = PROJECT_CASE_STUDIES[project.title];
                const group = projectGroup(project.title, project.tech);
                const Icon =
                  group === "Developer tools"
                    ? Braces
                    : group === "Android"
                      ? Layers3
                      : Sparkles;
                return (
                  <article className="v3-project" key={project.title}>
                    <div
                      className="v3-project-visual"
                      data-project-kind={group}
                      aria-hidden="true"
                    >
                      <div className="v3-mini-window">
                        <div className="v3-window-top">
                          <i />
                          <i />
                          <i />
                          <span>{group}</span>
                        </div>
                        <div className="v3-project-emblem">
                          <Icon size={48} strokeWidth={1.3} />
                        </div>
                        <strong>
                          {project.title ===
                          "Wealth Management Portfolio Tracker"
                            ? "Wealth Portfolio"
                            : project.title}
                        </strong>
                        <div className="v3-preview-tags">
                          {project.tech.slice(0, 3).map((tech) => (
                            <span key={tech}>{tech}</span>
                          ))}
                        </div>
                        <p>Engineering project · {project.period}</p>
                      </div>
                      <span className="v3-visual-caption">
                        Project illustration
                      </span>
                    </div>
                    <div className="v3-project-story">
                      <span className="v3-project-category">{group}</span>
                      <h3>{project.title}</h3>
                      <p className="v3-project-subtitle">{project.subtitle}</p>
                      <p>{project.bullets[0]}</p>
                      <div className="v3-tech-row">
                        {project.tech.slice(0, 5).map((tech) => (
                          <span key={tech}>
                            <TechnologyIcon name={tech} />
                            {tech}
                          </span>
                        ))}
                      </div>
                      <details className="v3-project-details">
                        <summary>
                          Inside the build <span aria-hidden="true">+</span>
                        </summary>
                        <ul>
                          {project.bullets.slice(1).map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                        {study && (
                          <>
                            <h4>Scope & evidence</h4>
                            <p>{study.scope}</p>
                            {study.sources.length > 0 && (
                              <a
                                href={study.sources[0].url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Implementation evidence
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </>
                        )}
                      </details>
                      <div className="v3-source-links">
                        {project.github ? (
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${project.title} source code on GitHub`}
                          >
                            <GitFork size={17} />
                            View source
                            <ExternalLink size={14} />
                          </a>
                        ) : (
                          <span>Private repository</span>
                        )}
                        {project.title === "PSDevTool" && (
                          <a href="/">Open the tools</a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <section
          className="v3-experience"
          id="v3-experience"
          data-v3-section
          aria-labelledby="v3-experience-title"
        >
          <div className="v3-container">
            <header className="v3-section-heading" data-v3-reveal>
              <div>
                <p className="v3-kicker">
                  A JOURNEY THAT STARTED IN JANUARY 2017
                </p>
                <h2 id="v3-experience-title">
                  Learning by building.
                  <br />
                  <em>Growing by doing.</em>
                </h2>
              </div>
              <a href="/resume/" className="v3-text-link">
                <FileText size={17} />
                Read the full resume
              </a>
            </header>
            <ol className="v3-timeline">
              {RESUME.experience.map((job) => (
                <li key={job.company} data-v3-reveal>
                  <div className="v3-job-date">
                    {job.period}
                    {job.current && <span>Current role</span>}
                  </div>
                  <article>
                    <h3>{job.company}</h3>
                    <p className="v3-job-role">{job.role}</p>
                    <ul>
                      {job.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </article>
                </li>
              ))}
            </ol>
            <section className="v3-open-source" data-v3-reveal>
              <div>
                <p className="v3-kicker">BEYOND MY OWN REPOSITORIES</p>
                <h3>Contributions & integrations.</h3>
              </div>
              <div>
                {RESUME.openSource.map((item) => (
                  <article key={item.project}>
                    <h4>{item.project}</h4>
                    <p>{item.contribution}</p>
                    {item.link.startsWith("https://") && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View contribution
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
        <section className="v3-toolkit" aria-labelledby="v3-toolkit-title">
          <div className="v3-container">
            <header className="v3-section-heading" data-v3-reveal>
              <div>
                <p className="v3-kicker">GOOD TOOLS. CONSIDERED CHOICES.</p>
                <h2 id="v3-toolkit-title">
                  My working
                  <br />
                  <em>toolkit.</em>
                </h2>
              </div>
              <p>
                A stack shaped by the problem.
                <br />
                Across products, platforms and AI.
              </p>
            </header>
            <div className="v3-toolkit-groups">
              {Object.entries(RESUME.skills).map(([name, { items }]) => (
                <section key={name} data-v3-reveal>
                  <h3>{name}</h3>
                  <div>
                    {[
                      ...items,
                      ...(name === "GenAI & Emerging Tech" ? ["AI-DLC"] : []),
                    ].map((tech) => (
                      <span key={tech}>
                        <TechnologyIcon name={tech} />
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>
        <section
          className="v3-contact"
          id="v3-contact"
          data-v3-section
          aria-labelledby="v3-contact-title"
        >
          <div className="v3-container">
            <div data-v3-reveal>
              <p className="v3-kicker">HAVE SOMETHING IN MIND?</p>
              <h2 id="v3-contact-title">
                Let’s make
                <br />
                <em>something matter.</em>
              </h2>
              <p>
                An engineering challenge, a role, or a conversation
                <br />
                about something you’re building. I’d like to hear it.
              </p>
              <a className="v3-email" href={`mailto:${RESUME.email}`}>
                {RESUME.email}
              </a>
              <div className="v3-contact-links">
                <a
                  href={RESUME.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                  <ExternalLink size={17} />
                </a>
                <a
                  href="https://github.com/pspcps"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                  <GitFork size={17} />
                </a>
                <a href="/resume/">
                  Resume
                  <FileText size={17} />
                </a>
              </div>
            </div>
            <a
              className="v3-portrait"
              href={RESUME.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Prakash’s LinkedIn profile"
            >
              <img
                src="/avatar.jpg"
                alt="Prakash Choudhary"
                width="340"
                height="380"
                loading="lazy"
              />
              <span>
                Prakash Choudhary
                <ExternalLink size={19} />
              </span>
              <p>Full-stack. Systems. Applied AI.</p>
            </a>
          </div>
        </section>
      </main>
      <footer className="v3-footer">
        <a href="/">PSDevTool.</a>
        <span>Built with curiosity. Kept grounded in real work.</span>
        <div>
          <a href="/portfolio/v1/">Original</a>
          <a href="/portfolio/v2/">Portfolio v2</a>
          <a
            href="https://david-hckh.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Design inspiration
          </a>
        </div>
      </footer>
    </div>
  );
}
