import { ArrowUpRight } from "lucide-react";
import { useCareerDuration } from "../hooks/useCareerDuration";
import type { CSSProperties } from "react";
import {
  PRINT_RESUME as resume,
  RESUME_TEMPLATES,
  estimateResumeFormatting,
} from "../data/printResume";
import type { ResumeTemplate } from "../data/printResume";
import { navigateTo } from "../seo/routes";
const short = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "");
function ResumeDocument({ template }: { template: ResumeTemplate }) {
  const duration = useCareerDuration();
  return (
    <article
      className={`resume-paper resume-${template.style} resume-columns-${template.columns}`}
      style={{ "--resume-accent": template.accent } as CSSProperties}
      aria-label={`${resume.name} resume`}
    >
      <header className="resume-header">
        <div className="resume-identity">
          <h1>{resume.name}</h1>
          <p className="resume-title">{resume.title}</p>
          <div className="resume-contacts">
            <p>
              <a href={`mailto:${resume.email}`}>{resume.email}</a>
              <span> · </span>
              <a href={`tel:${resume.phone}`}>{resume.phone}</a>
            </p>
            <p>
              <span>LinkedIn: </span>
              <a href={resume.linkedin}>{short(resume.linkedin)}</a>
            </p>
            <p>
              <span>GitHub: </span>
              <a href={resume.github}>{short(resume.github)}</a>
              <span className="resume-link-gap">Portfolio: </span>
              <a href={resume.portfolio}>{short(resume.portfolio)}</a>
            </p>
          </div>
        </div>
        <a
          className="resume-qr"
          href={resume.portfolio}
          aria-label="Open Prakash’s portfolio"
        >
          <img
            src="/resume/portfolio-qr.svg"
            width="88"
            height="88"
            alt="QR code linking to Prakash’s portfolio"
          />
          <span>Explore my work</span>
        </a>
      </header>
      <section className="resume-summary">
        <h2>Professional Summary</h2>
        <p>{resume.summary(duration.years)}</p>
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
          <h2>Selected Projects</h2>
          {resume.projects.map((project) => (
            <section className="resume-project" key={project.name}>
              <h3>
                {project.name}
                <span> | {project.tech}</span>
              </h3>
              <p>{project.detail}</p>
              {project.url && (
                <a className="resume-project-link" href={project.url}>
                  {short(project.url)}
                </a>
              )}
            </section>
          ))}
        </section>
        <section className="resume-education">
          <h2>Education & Certification</h2>
          <p>
            <strong>{resume.education.degree}</strong> ·{" "}
            {resume.education.period}
          </p>
          <p>
            {resume.education.institution}, {resume.education.location}
          </p>
          <p>
            <strong>Certification:</strong> {resume.certification}
          </p>
        </section>
      </div>
      <section className="resume-open-source">
        <h2>Open Source</h2>
        <p>
          {resume.contribution.text}{" "}
          <a href={resume.contribution.url}>{short(resume.contribution.url)}</a>
        </p>
      </section>
    </article>
  );
}
function Gallery() {
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
            Choose a layout for Prakash’s engineering experience. Every template
            opens on its own page, ready to print or share.
          </p>
        </div>
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
              href={`/resume/${t.id}/`}
              className="resume-template-card"
              style={{ "--resume-accent": t.accent } as CSSProperties}
            >
              <div
                className={`resume-template-preview preview-${t.style}`}
                aria-hidden="true"
              >
                <div className="preview-name">PRAKASH CHOUDHARY</div>
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
  const template = RESUME_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return <Gallery />;
  return (
    <main className="resume-page">
      <div className="resume-controls">
        <a
          href="/resume/"
          onClick={(e) => {
            if (
              !e.ctrlKey &&
              !e.metaKey &&
              !e.shiftKey &&
              !e.altKey &&
              e.button === 0
            ) {
              e.preventDefault();
              navigateTo("/resume/");
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
          <a className="resume-control-score" href="/resume/#ats-estimate">
            Approx. ATS formatting: {estimateResumeFormatting(template).score}
            /100
          </a>
          <button type="button" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>
      <p className="resume-print-hint">
        Chrome: Save as PDF · A4 · Scale 100% · Turn off headers and footers.
        Keep the default margins; the page sets its own print spacing.
      </p>
      <ResumeDocument template={template} />
    </main>
  );
}
