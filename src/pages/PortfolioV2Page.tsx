import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Braces,
  BriefcaseBusiness,
  ChevronDown,
  Cloud,
  Code2,
  ExternalLink,
  FileText,
  GitFork,
  Layers3,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useMotion } from "../components/Motion/MotionContext";
import { RESUME } from "../data/resumeData";
import { PROJECT_CASE_STUDIES } from "../data/projectCaseStudies";
import TechnologyIcon from "../components/Common/TechnologyIcon";
import ThemeChoice from "../components/Guide/ThemeChoice";
import RotatingRole from "../components/Portfolio/RotatingRole";
import { useCareerDuration } from "../hooks/useCareerDuration";
import { activePortfolioSection } from "../utils/portfolioScroll";
import "../portfolio-v2.css";

const TABS = ["About", "Experience", "Projects", "Toolkit", "Contact"] as const;
type Tab = (typeof TABS)[number];
type Project = (typeof RESUME.projects)[number];
const DEV_PROJECTS = ["PSDevTool", "KafkaUI", "ApiDesk Studio", "Cairn IDE"];
const FILTERS = [
  "All work",
  "Applied AI",
  "Developer tools",
  "Android",
] as const;
function category(project: Project) {
  return DEV_PROJECTS.includes(project.title)
    ? "Developer tools"
    : project.tech.includes("Kotlin")
      ? "Android"
      : "Applied AI";
}
const PREVIEWS: Record<string, { label: string; steps: string[] }> = {
  "Project Drishti": {
    label: "From observation to operator review",
    steps: ["Image", "Gemini", "Review"],
  },
  FleetMind: {
    label: "One question. Connected fleet insights.",
    steps: ["Question", "MCP tools", "Answer"],
  },
  PSDevTool: {
    label: "Your everyday developer workspace",
    steps: ["{ JSON }", "Diff", "API"],
  },
  KafkaUI: {
    label: "A clearer view of your event streams",
    steps: ["Topics", "Consumers", "Workers"],
  },
  "Wealth Management Portfolio Tracker": {
    label: "A local view of your financial picture",
    steps: ["Holdings", "Cash flow", "Returns"],
  },
  RentMeter: {
    label: "From meter reading to rental ledger",
    steps: ["Scan", "Calculate", "Record"],
  },
  "Cairn IDE": {
    label: "A focused workbench for C# and .NET",
    steps: ["Code", "Build", "Debug"],
  },
  "ApiDesk Studio": {
    label: "Build. Request. Inspect.",
    steps: ["REST", "GraphQL", "Tests"],
  },
  "Resume AI": {
    label: "Tools for the next career move",
    steps: ["Resume", "Analysis", "Feedback"],
  },
  "Ask My Docs": {
    label: "Answers grounded in your documents",
    steps: ["Index", "Retrieve", "Cite"],
  },
  "Safety App": {
    label: "Local video review with evidence",
    steps: ["Video", "Events", "Review"],
  },
  InkMind: {
    label: "A thinking space for notes and local AI",
    steps: ["Write", "Connect", "Ask"],
  },
};
const FOCUS = [
  {
    icon: Network,
    title: "Backend & distributed systems",
    text: "Node.js services, Kafka pipelines and data platforms built around reliability, throughput and clear failure handling.",
  },
  {
    icon: Code2,
    title: "Full-stack development",
    text: "React interfaces connected to practical APIs, from enterprise CRM platforms to browser-based developer tools.",
  },
  {
    icon: Sparkles,
    title: "Applied AI",
    text: "Domain-specific agents, MCP integrations and local RAG with explicit uncertainty, source evidence and operator review.",
  },
  {
    icon: Cloud,
    title: "Cloud engineering",
    text: "AWS and Google Cloud applications, container delivery, observability and infrastructure cost optimization.",
  },
];
function Panel({ name, children }: { name: Tab; children: ReactNode }) {
  return (
    <section
      className="v2-panel"
      id={`v2-${name.toLowerCase()}`}
      role="region"
      aria-labelledby={`v2-tab-${name.toLowerCase()}`}
    >
      <header className="v2-section-heading">
        <p className="v2-eyebrow">
          {name === "About"
            ? "THE ENGINEER BEHIND THE WORK"
            : "PRAKASH CHOUDHARY"}
        </p>
        <h2>
          {name === "About"
            ? "About me"
            : name === "Toolkit"
              ? "My working toolkit"
              : name === "Contact"
                ? "Contact"
                : name}
        </h2>
        <span />
      </header>
      {children}
    </section>
  );
}
function ProjectCard({ project }: { project: Project }) {
  const group = category(project);
  const Icon =
    group === "Android"
      ? Smartphone
      : group === "Applied AI"
        ? Sparkles
        : Braces;
  const preview = PREVIEWS[project.title] || {
    label: project.subtitle,
    steps: project.tech.slice(0, 3),
  };
  const study = PROJECT_CASE_STUDIES[project.title];
  return (
    <article className="v2-project" data-category={group}>
      <div className="v2-project-art" aria-hidden="true">
        <div className="v2-art-top">
          <span>{group}</span>
          <Icon size={20} />
        </div>
        <strong>
          {project.title === "Wealth Management Portfolio Tracker"
            ? "Wealth Portfolio"
            : project.title}
        </strong>
        <div className="v2-art-flow">
          {preview.steps.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
        <p>{preview.label}</p>
      </div>
      <div className="v2-project-body">
        <h3>{project.title}</h3>
        <p className="v2-project-subtitle">{project.subtitle}</p>
        <div className="v2-tech-row">
          {project.tech.slice(0, 4).map((tech) => (
            <span key={tech}>
              <TechnologyIcon name={tech} />
              {tech}
            </span>
          ))}
        </div>
        <details className="v2-case-study">
          <summary>
            Engineering details
            <ChevronDown size={16} />
          </summary>
          <ul>
            {project.bullets.map((bullet) => (
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
                  Read the documented implementation <ExternalLink size={14} />
                </a>
              )}
            </>
          )}
        </details>
        <div className="v2-project-links">
          {project.github ? (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title} source code on GitHub`}
            >
              <GitFork size={16} />
              Source code
              <ExternalLink size={14} />
            </a>
          ) : (
            <span>Private repository</span>
          )}
          {project.title === "PSDevTool" && <a href="/">Use the tools</a>}
        </div>
      </div>
    </article>
  );
}
export default function PortfolioV2Page() {
  const duration = useCareerDuration();
  const { enabled: motionEnabled } = useMotion();
  const [active, setActive] = useState<Tab>("About");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All work");
  const [contactsOpen, setContactsOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = TABS.map((name) => ({
        id: name,
        top:
          element
            .querySelector(`#v2-${name.toLowerCase()}`)
            ?.getBoundingClientRect().top ?? Infinity,
      }));
      const next = activePortfolioSection(
        sections,
        element.getBoundingClientRect().top +
          (nav.current?.offsetHeight ?? 70) +
          28,
        element.scrollTop + element.clientHeight >= element.scrollHeight - 2,
      );
      if (next) setActive(next as Tab);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    element.addEventListener("scroll", schedule, { passive: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    element
      .querySelectorAll(".v2-panel")
      .forEach((section) => resize.observe(section));
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      element.removeEventListener("scroll", schedule);
    };
  }, []);
  const projects = RESUME.projects.filter(
    (p) => filter === "All work" || category(p) === filter,
  );
  function selectTab(tab: Tab) {
    setActive(tab);
    root.current?.querySelector(`#v2-${tab.toLowerCase()}`)?.scrollIntoView({
      block: "start",
      behavior: motionEnabled ? "smooth" : "instant",
    });
  }
  function moveTab(event: KeyboardEvent<HTMLButtonElement>, tab: Tab) {
    const index = TABS.indexOf(tab);
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % TABS.length
        : event.key === "ArrowLeft"
          ? (index + TABS.length - 1) % TABS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? TABS.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    selectTab(TABS[next]);
    nav.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  }
  return (
    <div className="portfolio-v2" ref={root}>
      <a className="v2-skip" href="#v2-main">
        Skip to portfolio content
      </a>
      <div className="v2-topbar">
        <a href="/" className="v2-brand">
          <span>PS</span>PSDevTool<span className="v2-top-divider">/</span>
          <span className="v2-top-label">Portfolio</span>
        </a>
        <div className="v2-top-actions">
          <a href="/portfolio/v1/">Original portfolio</a>
          <a href="/portfolio/v3/">3D portfolio v3</a>
          <ThemeChoice />
        </div>
      </div>
      <div className="v2-layout">
        <aside className="v2-profile">
          <div className="v2-profile-heading">
            <a
              className="v2-avatar"
              href={RESUME.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Prakash Choudhary’s LinkedIn profile"
            >
              <img
                src="/avatar.jpg"
                alt="Prakash Choudhary"
                width="144"
                height="144"
              />
              <span>
                <ExternalLink size={16} />
              </span>
            </a>
            <div>
              <h1>{RESUME.name}</h1>
              <p className="v2-role-badge">Senior Software Engineer</p>
              <p className="v2-profile-focus">
                Full-stack · Systems · Applied AI
              </p>
            </div>
          </div>
          <button
            className="v2-show-contact"
            onClick={() => setContactsOpen(!contactsOpen)}
            aria-expanded={contactsOpen}
            aria-controls="v2-profile-contact"
          >
            {contactsOpen ? "Hide details" : "Show details"}
            <ChevronDown size={16} />
          </button>
          <div
            className={`v2-profile-contact ${contactsOpen ? "is-open" : ""}`}
            id="v2-profile-contact"
          >
            <div className="v2-separator" />
            <div className="v2-contact-line">
              <span className="v2-icon-box">
                <Mail size={19} />
              </span>
              <div>
                <span>Email</span>
                <a href={`mailto:${RESUME.email}`}>{RESUME.email}</a>
              </div>
            </div>
            <div className="v2-contact-line">
              <span className="v2-icon-box">
                <BriefcaseBusiness size={19} />
              </span>
              <div>
                <span>Current role</span>
                <p>Senior Engineer at Lytx</p>
              </div>
            </div>
            <div className="v2-contact-line">
              <span className="v2-icon-box">
                <Layers3 size={19} />
              </span>
              <div>
                <span>Experience</span>
                <p>{duration.label} years · Since Jan 2017</p>
              </div>
            </div>
            <div className="v2-separator" />
            <div className="v2-socials">
              <a
                href="https://github.com/pspcps"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitFork size={17} />
                GitHub
              </a>
              <a
                href={RESUME.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={17} />
                LinkedIn
              </a>
            </div>
          </div>
          <a className="v2-resume-button" href="/resume/">
            <FileText size={17} />
            View my resume
          </a>
          <p className="v2-profile-note">
            Building things that solve real problems.
          </p>
        </aside>
        <main className="v2-main" id="v2-main" tabIndex={-1}>
          <nav className="v2-tabs" aria-label="Portfolio sections" ref={nav}>
            {TABS.map((tab) => (
              <button
                key={tab}
                id={`v2-tab-${tab.toLowerCase()}`}
                aria-controls={`v2-${tab.toLowerCase()}`}
                aria-current={active === tab ? "location" : undefined}
                onKeyDown={(e) => moveTab(e, tab)}
                onClick={() => selectTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
          <Panel name="About">
            <div className="v2-intro">
              <p className="v2-lead">
                Thoughtful interfaces.
                <br />
                <span>Dependable systems.</span>
              </p>
              <div className="v2-rotating">
                <RotatingRole />
              </div>
              <p>
                I’m Prakash, a software engineer who connects the interface
                people use with the systems they rely on. I build React
                applications, backend services, event-driven platforms and
                applied AI workflows.
              </p>
              <p>
                Across {duration.label} years, my work has included enterprise
                CRM, real-time content pipelines and fleet operations. I care
                about how software behaves beyond the happy path: the failure
                cases, the operational details, and the cost of keeping it
                running.
              </p>
            </div>
            <div className="v2-stats" aria-label="Career highlights">
              {RESUME.stats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
            <section className="v2-content-section">
              <h3>What I bring to a team</h3>
              <div className="v2-focus-grid">
                {FOCUS.map(({ icon: Icon, title, text }) => (
                  <article className="v2-focus-card" key={title}>
                    <span className="v2-focus-icon">
                      <Icon size={30} strokeWidth={1.4} />
                    </span>
                    <div>
                      <h4>{title}</h4>
                      <p>{text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <section className="v2-work-teaser">
              <div>
                <p className="v2-eyebrow">BUILT TO BE USED</p>
                <h3>Explore the work behind the words.</h3>
                <p>
                  Agentic diagnostics, event streams, developer tools and
                  Android applications. Each project has its own engineering
                  story.
                </p>
              </div>
              <button
                className="v2-button"
                onClick={() => {
                  selectTab("Projects");
                  nav.current
                    ?.querySelector<HTMLButtonElement>("#v2-tab-projects")
                    ?.focus();
                }}
              >
                <Code2 size={18} />
                Explore projects
              </button>
            </section>
          </Panel>
          <Panel name="Experience">
            <p className="v2-section-intro">
              {duration.label} years of building, learning and taking
              responsibility for the systems behind the product.
            </p>
            <div className="v2-timeline-heading">
              <span className="v2-icon-box">
                <BriefcaseBusiness size={21} />
              </span>
              <h3>Professional experience</h3>
            </div>
            <ol className="v2-timeline">
              {RESUME.experience.map((job) => (
                <li key={job.company}>
                  <article>
                    <div className="v2-job-heading">
                      <div>
                        <h4>{job.company}</h4>
                        <p>{job.role}</p>
                      </div>
                      <span>{job.period}</span>
                    </div>
                    {job.current && (
                      <span className="v2-current-role">Current role</span>
                    )}
                    <ul>
                      {job.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </article>
                </li>
              ))}
            </ol>
            <div className="v2-timeline-heading">
              <span className="v2-icon-box">
                <FileText size={21} />
              </span>
              <h3>Education & certification</h3>
            </div>
            <div className="v2-education">
              <h4>{RESUME.education.degree}</h4>
              <p>
                {RESUME.education.institution} · {RESUME.education.period}
              </p>
              <p>{RESUME.education.location}</p>
              <span>{RESUME.certifications[0].name}</span>
            </div>
            <section className="v2-content-section">
              <h3>Open source & integrations</h3>
              <div className="v2-contributions">
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
                        View contribution <ExternalLink size={14} />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </Panel>
          <Panel name="Projects">
            <p className="v2-section-intro">
              Working software across AI, developer platforms and everyday
              applications. Public repositories are linked directly; private
              work is identified clearly.
            </p>
            <div
              className="v2-filters"
              role="group"
              aria-label="Filter projects"
            >
              {FILTERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                >
                  {item}
                  <span>
                    {item === "All work"
                      ? RESUME.projects.length
                      : RESUME.projects.filter((p) => category(p) === item)
                          .length}
                  </span>
                </button>
              ))}
            </div>
            <p className="v2-results" role="status">
              Showing {projects.length}{" "}
              {projects.length === 1 ? "project" : "projects"}
            </p>
            <div className="v2-project-grid">
              {projects.map((p) => (
                <ProjectCard project={p} key={p.title} />
              ))}
            </div>
            <p className="v2-preview-note">
              Project cards use workflow illustrations. Open the source and
              engineering details for implementation evidence.
            </p>
          </Panel>
          <Panel name="Toolkit">
            <p className="v2-section-intro">
              The technologies I work with across applications, infrastructure
              and recent AI projects. Chosen for the problem, rather than a
              single stack.
            </p>
            <div className="v2-toolkit">
              {Object.entries(RESUME.skills).map(([group, { items }]) => (
                <section key={group}>
                  <h3>{group}</h3>
                  <div className="v2-skill-chips">
                    {[
                      ...items,
                      ...(group === "GenAI & Emerging Tech" ? ["AI-DLC"] : []),
                    ].map((name) => (
                      <span key={name}>
                        <TechnologyIcon name={name} />
                        {name}
                      </span>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </Panel>
          <Panel name="Contact">
            <div className="v2-contact-hero">
              <span className="v2-icon-box">
                <MessageSquare size={30} />
              </span>
              <h3>A good conversation is a good start.</h3>
              <p>
                Have an engineering challenge, a role to discuss, or a project
                you’d like to know more about? Reach out by email or LinkedIn.
              </p>
              <a className="v2-button" href={`mailto:${RESUME.email}`}>
                <Mail size={18} />
                Email Prakash
              </a>
            </div>
            <div className="v2-contact-cards">
              <a href={`mailto:${RESUME.email}`}>
                <Mail size={24} />
                <span>
                  Email<strong>{RESUME.email}</strong>
                </span>
              </a>
              <a
                href={RESUME.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={24} />
                <span>
                  LinkedIn<strong>Connect with Prakash</strong>
                </span>
              </a>
              <a
                href="https://github.com/pspcps"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitFork size={24} />
                <span>
                  GitHub<strong>Explore the repositories</strong>
                </span>
              </a>
              <a href="/resume/">
                <FileText size={24} />
                <span>
                  Resume<strong>Choose a profile & layout</strong>
                </span>
              </a>
            </div>
            <p className="v2-contact-note">
              <MapPin size={17} />
              Professional experience in India. Open to discussing full-stack,
              backend, cloud and applied AI work.
            </p>
          </Panel>
        </main>
      </div>
      <footer className="v2-footer">
        <span>Prakash Choudhary · Built with care.</span>
        <div>
          <a href="/portfolio/v1/">Original portfolio</a>
          <a href="/portfolio/v3/">3D portfolio v3</a>
          <a href="/">Developer tools</a>
          <a href="/about/">About PSDevTool</a>
        </div>
      </footer>
    </div>
  );
}
