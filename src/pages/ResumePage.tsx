import { useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import ResumeEditor from "../components/Resume/ResumeEditor";
import {
  createResumeContent,
  DEFAULT_APPEARANCE,
  loadResumeDraft,
  RESUME_STORAGE_KEY,
  safeResumeUrl,
  contrastRatio,
} from "../data/resumeDraft";
import type {
  ResumeContent,
  ResumeAppearance,
  ResumeDraft,
} from "../data/resumeDraft";
import { ArrowUpRight } from "lucide-react";
import { useCareerDuration } from "../hooks/useCareerDuration";
import type { CSSProperties } from "react";
import {
  RESUME_TEMPLATES,
  estimateResumeFormatting,
} from "../data/printResume";
import type { ResumeTemplate, ResumePaper } from "../data/printResume";
import { navigateTo } from "../seo/routes";
const short = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "");
function ResumeDocument({
  template,
  content: resume,
  appearance,
  paper,
}: {
  template: ResumeTemplate;
  content: ResumeContent;
  appearance: ResumeAppearance;
  paper: ResumePaper;
}) {
  const portfolioUrl = safeResumeUrl(resume.portfolio);
  const qrSource = useMemo(() => {
    if (!portfolioUrl) return null;
    if (portfolioUrl === "https://psdevtool.online/portfolio/")
      return "/resume/portfolio-qr.svg";
    try {
      const qr = qrcode(0, "M");
      qr.addData(portfolioUrl);
      qr.make();
      return `data:image/svg+xml,${encodeURIComponent(qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true }))}`;
    } catch {
      return null;
    }
  }, [portfolioUrl]);
  const accent = appearance.accent || template.accent;
  return (
    <article
      className={`resume-paper resume-${template.style} resume-columns-${template.columns}`}
      style={
        {
          "--resume-accent": accent,
          "--resume-text": appearance.text,
          "--resume-background": appearance.background,
          "--resume-header-text":
            contrastRatio(accent, "#ffffff") >= 4.5 ? "#ffffff" : "#111111",
        } as CSSProperties
      }
      aria-label={`${resume.name} resume`}
    >
      <header className="resume-header">
        <div className="resume-identity">
          <h1>{resume.name}</h1>
          <p className="resume-title">{resume.title}</p>
          <div className="resume-contacts">
            {(resume.email || resume.phone) && (
              <p>
                {resume.email && (
                  <a href={`mailto:${resume.email}`}>{resume.email}</a>
                )}
                {resume.email && resume.phone && <span> · </span>}
                {resume.phone && (
                  <a href={`tel:${resume.phone}`}>{resume.phone}</a>
                )}
              </p>
            )}
            {resume.linkedin && (
              <p>
                <span>LinkedIn: </span>
                <a href={safeResumeUrl(resume.linkedin)}>
                  {short(resume.linkedin)}
                </a>
              </p>
            )}
            {(resume.github || resume.portfolio) && (
              <p>
                {resume.github && (
                  <>
                    <span>GitHub: </span>
                    <a href={safeResumeUrl(resume.github)}>
                      {short(resume.github)}
                    </a>
                  </>
                )}
                {resume.portfolio && (
                  <>
                    <span className="resume-link-gap">Portfolio: </span>
                    <a href={portfolioUrl}>{short(resume.portfolio)}</a>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
        {appearance.showQR && qrSource && (
          <a
            className="resume-qr"
            href={portfolioUrl}
            aria-label="Open portfolio website"
          >
            <img
              src={qrSource}
              width="88"
              height="88"
              alt="QR code linking to portfolio website"
            />
            <span>Explore my work</span>
          </a>
        )}
      </header>
      <section className="resume-summary">
        <h2>Professional Summary</h2>
        <p>{resume.summary}</p>
      </section>
      <div className="resume-body">
        <section className="resume-skills">
          <h2>Technical Skills</h2>
          <dl>
            {resume.skills.map(([label, items]) => (
              <div key={label}>
                <dt>{label}: </dt>
                <dd>{items}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="resume-experience">
          <h2>Professional Experience</h2>
          {resume.experience.map((job) => (
            <section className="resume-job" key={job.company}>
              <div className="resume-job-heading">
                <h3>{job.company}</h3>
                <span>{job.period}</span>
              </div>
              <p className="resume-role">{job.role}</p>
              <ul>
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ))}
        </section>
        <section className="resume-projects">
          <h2>Engineering Projects</h2>
          {resume.projects.map((project) => (
            <section className="resume-project" key={project.name}>
              <h3>
                {project.name}
                <span> | {project.tech}</span>
              </h3>
              <p>{project.detail}</p>
              {project.url && (
                <a
                  className="resume-project-link"
                  href={safeResumeUrl(project.url)}
                >
                  {short(project.url)}
                </a>
              )}
            </section>
          ))}
        </section>
        {paper === "legal" && (
          <section className="resume-education">
            <h2>Education & Certification</h2>
            <p>
              <strong>{resume.education.degree}</strong> ·{" "}
              {resume.education.period}
            </p>
            <p>
              {resume.education.institution}, {resume.education.location}
            </p>
            {resume.certification && (
              <p>
                <strong>Certification:</strong> {resume.certification}
              </p>
            )}
          </section>
        )}
      </div>
      <section className="resume-open-source">
        <h2>Open-Source Contributions</h2>
        {(paper === "a4"
          ? resume.contributions.slice(0, 1)
          : resume.contributions
        ).map((item, i) => (
          <p className="resume-extra-contribution" key={i}>
            {item.text}
            {item.url && (
              <>
                {" "}
                <a href={safeResumeUrl(item.url)}>{short(item.url)}</a>
              </>
            )}
          </p>
        ))}
      </section>
    </article>
  );
}
function Gallery({
  paper,
  previewName,
}: {
  paper: ResumePaper;
  previewName?: string;
}) {
  return (
    <div className="resume-gallery">
      <nav className="resume-gallery-nav">
        <a href="/portfolio/">← Portfolio</a>
        <a href="/">PSDevTool.</a>
      </nav>
      <main>
        <div className="resume-gallery-intro">
          <p className="resume-eyebrow">ONE STORY. TEN WAYS TO TELL IT.</p>
          <h1>A resume that opens doors.</h1>
          <p>
            Choose a layout, then enter Edit mode to make it yours. Save your
            details on this device and reuse them across every template.
          </p>
        </div>
        <nav className="resume-paper-options" aria-label="Resume paper size">
          <a href="/resume/" aria-current={paper === "a4" ? "page" : undefined}>
            A4 · Focused
          </a>
          <a
            href="/resume/legal/"
            aria-current={paper === "legal" ? "page" : undefined}
          >
            Legal · Expanded
          </a>
        </nav>
        <p className="resume-paper-description">
          {paper === "legal"
            ? "Legal (8.5 × 14 in): five engineering projects and all four open-source contributions / customizations."
            : "A4 (210 × 297 mm): four engineering projects, one open-source contribution and no education section. Choose Legal for the expanded version."}
        </p>
        <aside className="resume-gallery-note">
          <strong>Applying through an ATS?</strong> Start with Classic, Modern
          or Minimal. Single-column resumes have a more predictable reading
          order. Two-column layouts offer a visual alternative for sharing
          directly; parsing varies by system.
        </aside>
        <details className="resume-score-explanation" id="ats-estimate">
          <summary>
            How the approximate ATS formatting score is estimated
          </summary>
          <p>
            This is a transparent layout heuristic, not a score from an ATS
            vendor. It does not assess keywords, qualifications or match to a
            job description, and has not been calibrated against employer
            screening systems.
          </p>
          <ul>
            {estimateResumeFormatting(RESUME_TEMPLATES[0]).checks.map(
              (check) => (
                <li key={check.label}>
                  {check.label}:{" "}
                  {check.label === "Reading order"
                    ? "20/25 for single column; 5/25 for two columns"
                    : `${check.points}/${check.maximum}`}
                </li>
              ),
            )}
          </ul>
          <p>
            The reading-order allowance is deliberately conservative: even a
            single-column PDF can be interpreted differently by different
            parsers. Two-column designs carry more reading-order uncertainty.
            Use the score to compare layouts, not to predict an application
            outcome.
          </p>
        </details>
        <div className="resume-template-grid">
          {RESUME_TEMPLATES.map((t) => (
            <a
              key={t.id}
              href={`/resume/${t.id}/${paper === "legal" ? "legal/" : ""}`}
              className="resume-template-card"
              style={{ "--resume-accent": t.accent } as CSSProperties}
            >
              <div
                className={`resume-template-preview preview-${t.style}`}
                aria-hidden="true"
              >
                <div className="preview-name">
                  {previewName || "PRAKASH CHOUDHARY"}
                </div>
                <div className="preview-subtitle">SENIOR SOFTWARE ENGINEER</div>
                <div className="preview-contact" />
                <div className={`preview-body preview-cols-${t.columns}`}>
                  <div>
                    {[1, 2, 3].map((i) => (
                      <div className="preview-section" key={i}>
                        <b />
                        {[1, 2, 3].map((j) => (
                          <i key={j} />
                        ))}
                      </div>
                    ))}
                  </div>
                  <div>
                    {[1, 2, 3, 4].map((i) => (
                      <div className="preview-section" key={i}>
                        <b />
                        {[1, 2, 3].map((j) => (
                          <i key={j} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="resume-template-info">
                <span>{t.columns === 1 ? "SINGLE COLUMN" : "TWO COLUMNS"}</span>
                <h2>
                  {t.name}
                  <ArrowUpRight size={19} aria-hidden="true" />
                </h2>
                <p>{t.description}</p>
                <p className="resume-format-score">
                  Approx. ATS formatting{" "}
                  <b>{estimateResumeFormatting(t).score}/100</b>
                </p>
                <small className="resume-score-caption">
                  Layout estimate · not a job-match score
                </small>
                <strong>Open resume →</strong>
              </div>
            </a>
          ))}
        </div>
        <p className="resume-gallery-footer">
          All templates use the same content. No sign-in, no upload, no external
          QR service.
        </p>
      </main>
    </div>
  );
}
export default function ResumePage({ templateId }: { templateId?: string }) {
  const paper: ResumePaper =
    templateId === "legal" || templateId?.endsWith("-legal") ? "legal" : "a4";
  const baseId = templateId?.replace(/-legal$/, "");
  const template = RESUME_TEMPLATES.find((t) => t.id === baseId);
  const duration = useCareerDuration();
  const [initial] = useState(loadResumeDraft);
  const [content, setContent] = useState<ResumeContent | null>(
    initial?.content || null,
  );
  const [appearance, setAppearance] = useState<ResumeAppearance>(
    initial?.appearance || DEFAULT_APPEARANCE,
  );
  const [remember, setRemember] = useState(Boolean(initial));
  const [message, setMessage] = useState("");
  const editor = useRef<HTMLDialogElement>(null);
  const current = useMemo(
    () => content || createResumeContent(paper, duration.years),
    [content, paper, duration.years],
  );
  const persist = (next: ResumeContent, colors: ResumeAppearance) => {
    try {
      localStorage.setItem(
        RESUME_STORAGE_KEY,
        JSON.stringify({ version: 1, content: next, appearance: colors }),
      );
      setMessage("Saved on this device. Applies to every template.");
    } catch {
      setMessage(
        "Browser storage is unavailable or full. Download a draft backup instead.",
      );
    }
  };
  const changeContent = (next: ResumeContent) => {
    setContent(next);
    if (remember) persist(next, appearance);
  };
  const changeAppearance = (next: ResumeAppearance) => {
    setAppearance(next);
    if (remember) persist(current, next);
  };
  const changeRemember = (next: boolean) => {
    if (next) {
      setContent(current);
      setRemember(true);
      persist(current, appearance);
    } else {
      try {
        localStorage.removeItem(RESUME_STORAGE_KEY);
        setRemember(false);
        setMessage(
          "Device saving is off. The stored draft was removed; current edits remain open.",
        );
      } catch {
        setMessage(
          "Could not remove the saved draft. Check browser storage settings.",
        );
      }
    }
  };
  const reset = () => {
    try {
      localStorage.removeItem(RESUME_STORAGE_KEY);
      setContent(null);
      setAppearance(DEFAULT_APPEARANCE);
      setRemember(false);
      setMessage("Saved draft cleared. Showing the example resume.");
    } catch {
      setMessage("Could not clear browser storage. Check browser settings.");
    }
  };
  const importDraft = (draft: ResumeDraft) => {
    setContent(draft.content);
    setAppearance(draft.appearance);
    if (remember) persist(draft.content, draft.appearance);
  };

  useEffect(() => {
    if (!template) return;
    const applyTitle = () => {
      document.title = content
        ? `${content.name || "My resume"} — Resume (${template.name}, ${paper === "legal" ? "Legal" : "A4"})`
        : document.querySelector<HTMLMetaElement>('meta[name="title"]')
            ?.content || "Resume Builder";
    };
    const frame = requestAnimationFrame(applyTitle);
    window.addEventListener("beforeprint", applyTitle);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeprint", applyTitle);
    };
  }, [content, template, paper]);
  if (!template)
    return (
      <Gallery
        paper={paper}
        previewName={content ? content.name || "YOUR NAME" : undefined}
      />
    );
  return (
    <main className="resume-page" data-paper={paper}>
      <style>{`@page { size: ${paper === "legal" ? "215.9mm 355.6mm" : "A4"}; margin: 0; }`}</style>
      <div className="resume-controls">
        <a
          href={paper === "legal" ? "/resume/legal/" : "/resume/"}
          onClick={(e) => {
            if (
              !e.ctrlKey &&
              !e.metaKey &&
              !e.shiftKey &&
              !e.altKey &&
              e.button === 0
            ) {
              e.preventDefault();
              navigateTo(paper === "legal" ? "/resume/legal/" : "/resume/");
            }
          }}
        >
          ← All templates
        </a>
        <div>
          <span>
            {template.name} ·{" "}
            {template.columns === 1 ? "Single column" : "Two columns"}
          </span>
          <label className="resume-paper-select">
            Paper{" "}
            <select
              aria-label="Resume paper size"
              value={paper}
              onChange={(e) =>
                navigateTo(
                  `/resume/${template.id}/${e.target.value === "legal" ? "legal/" : ""}`,
                )
              }
            >
              <option value="a4">A4 · Focused</option>
              <option value="legal">Legal · Expanded</option>
            </select>
          </label>
          <a className="resume-control-score" href="/resume/#ats-estimate">
            Approx. ATS formatting: {estimateResumeFormatting(template).score}
            /100
          </a>
          <button type="button" onClick={() => editor.current?.showModal()}>
            Edit resume
          </button>
          <button type="button" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>
      <p className="resume-print-hint">
        Chrome: Save as PDF · {paper === "legal" ? "Legal (8.5 × 14 in)" : "A4"}{" "}
        · Scale 100%. Browser headers and footers should be off; this layout
        uses zero page margins and internal spacing to suppress them. If Chrome
        adds a date or URL, turn off “Headers and footers” under More settings.
      </p>
      {content && (
        <p className="resume-custom-hint">
          Your custom draft is applied. Longer edits may span multiple pages;
          check Print Preview.
        </p>
      )}
      <dialog
        className="resume-editor-dialog"
        ref={editor}
        aria-label="Edit resume"
      >
        <ResumeEditor
          content={current}
          exampleProjects={createResumeContent(paper, duration.years).projects}
          appearance={appearance}
          accent={template.accent}
          onContent={changeContent}
          onAppearance={changeAppearance}
          remember={remember}
          onRemember={changeRemember}
          onReset={reset}
          onImport={importDraft}
          message={message}
          setMessage={setMessage}
          onClose={() => editor.current?.close()}
        />
      </dialog>
      <ResumeDocument
        template={template}
        content={current}
        appearance={appearance}
        paper={paper}
      />
    </main>
  );
}
