import { useRef } from "react";
import type { ChangeEvent } from "react";
import type {
  ResumeContent,
  ResumeAppearance,
  ResumeDraft,
} from "../../data/resumeDraft";
import {
  parseResumeDraft,
  blankResumeContent,
  contrastRatio,
  safeResumeUrl,
} from "../../data/resumeDraft";
type Props = {
  content: ResumeContent;
  appearance: ResumeAppearance;
  accent: string;
  onContent: (v: ResumeContent) => void;
  onAppearance: (v: ResumeAppearance) => void;
  remember: boolean;
  onRemember: (v: boolean) => void;
  onReset: () => void;
  onImport: (v: ResumeDraft) => void;
  message: string;
  setMessage: (v: string) => void;
  onClose: () => void;
};
function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="resume-edit-field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
export default function ResumeEditor(p: Props) {
  const file = useRef<HTMLInputElement>(null);
  const c = p.content;
  const field = (
    key: keyof Pick<
      ResumeContent,
      | "name"
      | "title"
      | "email"
      | "phone"
      | "linkedin"
      | "github"
      | "portfolio"
      | "summary"
      | "certification"
    >,
    label: string,
    multiline = false,
  ) => (
    <Field
      key={key}
      label={label}
      value={c[key]}
      multiline={multiline}
      onChange={(v) => p.onContent({ ...c, [key]: v })}
    />
  );
  const remove = (
    key: "skills" | "experience" | "projects" | "contributions",
    i: number,
  ) => p.onContent({ ...c, [key]: c[key].filter((_, j) => j !== i) });
  const download = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 1, content: c, appearance: p.appearance },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-draft.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      if (f.size > 500000) throw Error("Draft is too large (maximum 500 KB).");
      p.onImport(parseResumeDraft(await f.text()));
      p.setMessage("Draft imported.");
    } catch (error) {
      p.setMessage(
        error instanceof Error ? error.message : "Could not import this draft.",
      );
    }
    e.target.value = "";
  };
  return (
    <div className="resume-editor-content">
      <header>
        <div>
          <h2>Edit resume</h2>
          <p>
            Your details apply to every layout. Longer content may need more
            than one page.
          </p>
        </div>
        <button type="button" onClick={p.onClose}>
          Done editing
        </button>
      </header>
      <div className="resume-draft-actions">
        <label>
          <input
            type="checkbox"
            checked={p.remember}
            onChange={(e) => p.onRemember(e.target.checked)}
          />{" "}
          Save on this device
        </label>
        <button type="button" onClick={download}>
          Download draft
        </button>
        <button type="button" onClick={() => file.current?.click()}>
          Import draft
        </button>
        <input
          type="file"
          ref={file}
          accept=".json,application/json"
          onChange={importFile}
          hidden
        />
        <button
          type="button"
          onClick={() => {
            p.onContent(blankResumeContent());
            p.setMessage("Blank resume ready. Add your own details below.");
          }}
        >
          Start blank
        </button>
        <button type="button" onClick={p.onReset}>
          Clear saved draft / reset sample
        </button>
      </div>
      <p className="resume-editor-privacy">
        Saved drafts stay in this browser’s local storage; they are not uploaded
        by the editor. Download a backup to move devices. Turning off device
        saving removes the stored copy.
      </p>
      <p role="status" className="resume-editor-status">
        {p.message}
      </p>
      <details open>
        <summary>Contact details & summary</summary>
        <div className="resume-edit-grid">
          {field("name", "Full name")}
          {field("title", "Professional title")}
          {field("email", "Email")}
          {field("phone", "Phone")}
          {field("linkedin", "LinkedIn URL")}
          {field("github", "GitHub URL")}
          {field("portfolio", "Portfolio / website URL")}
        </div>
        {field("summary", "Professional summary", true)}
        <p>Use complete https:// links. Invalid URLs print as plain text.</p>
      </details>
      <details open>
        <summary>Colors & QR code</summary>
        <div className="resume-color-fields">
          {(["accent", "text", "background"] as const).map((key) => (
            <label key={key}>
              {key === "accent"
                ? "Accent color"
                : key === "text"
                  ? "Text color"
                  : "Background color"}
              <input
                type="color"
                value={p.appearance[key] || p.accent}
                onChange={(e) =>
                  p.onAppearance({ ...p.appearance, [key]: e.target.value })
                }
              />
            </label>
          ))}
        </div>
        <p>
          Text/background contrast:{" "}
          {contrastRatio(p.appearance.text, p.appearance.background).toFixed(1)}
          :1.{" "}
          {contrastRatio(p.appearance.text, p.appearance.background) < 4.5
            ? "This combination may be hard to read. Choose stronger contrast."
            : "Good contrast for body text."}
        </p>
        <label className="resume-qr-toggle">
          <input
            type="checkbox"
            checked={p.appearance.showQR}
            onChange={(e) =>
              p.onAppearance({ ...p.appearance, showQR: e.target.checked })
            }
          />{" "}
          Show portfolio QR code
        </label>
        <p>
          The QR code generates locally from your website URL and updates
          automatically.{" "}
          {!safeResumeUrl(c.portfolio) && p.appearance.showQR
            ? "Enter a valid http:// or https:// website URL to display it."
            : ""}{" "}
          Enable background graphics in Print to preserve your colors.
        </p>
      </details>
      <details>
        <summary>Technical skills</summary>
        {c.skills.map(([label, items], i) => (
          <div className="resume-edit-item" key={i}>
            <Field
              label={`Skill group ${i + 1}`}
              value={label}
              onChange={(v) =>
                p.onContent({
                  ...c,
                  skills: c.skills.map((x, j) => (j === i ? [v, items] : x)),
                })
              }
            />
            <Field
              label={`Skills ${i + 1}`}
              value={items}
              onChange={(v) =>
                p.onContent({
                  ...c,
                  skills: c.skills.map((x, j) => (j === i ? [label, v] : x)),
                })
              }
            />
            <button type="button" onClick={() => remove("skills", i)}>
              Remove skill group
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => p.onContent({ ...c, skills: [...c.skills, ["", ""]] })}
        >
          Add skill group
        </button>
      </details>
      <details>
        <summary>Professional experience</summary>
        {c.experience.map((job, i) => (
          <div className="resume-edit-item" key={i}>
            {(["company", "role", "period"] as const).map((key) => (
              <Field
                key={key}
                label={`${key === "company" ? "Company" : key === "role" ? "Role" : "Dates"} ${i + 1}`}
                value={job[key]}
                onChange={(v) =>
                  p.onContent({
                    ...c,
                    experience: c.experience.map((x, j) =>
                      j === i ? { ...x, [key]: v } : x,
                    ),
                  })
                }
              />
            ))}
            <Field
              label={`Achievements ${i + 1} (one per line)`}
              value={job.bullets.join("\n")}
              multiline
              onChange={(v) =>
                p.onContent({
                  ...c,
                  experience: c.experience.map((x, j) =>
                    j === i ? { ...x, bullets: v.split("\n") } : x,
                  ),
                })
              }
            />
            <button type="button" onClick={() => remove("experience", i)}>
              Remove experience
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            p.onContent({
              ...c,
              experience: [
                ...c.experience,
                { company: "", role: "", period: "", bullets: [] },
              ],
            })
          }
        >
          Add experience
        </button>
      </details>
      <details>
        <summary>Engineering projects</summary>
        {c.projects.map((project, i) => (
          <div className="resume-edit-item" key={i}>
            {(["name", "tech", "url", "detail"] as const).map((key) => (
              <Field
                key={key}
                label={`${key === "name" ? "Project name" : key === "tech" ? "Technologies" : key === "url" ? "Repository / project URL" : "Project description"} ${i + 1}`}
                value={project[key] || ""}
                multiline={key === "detail"}
                onChange={(v) =>
                  p.onContent({
                    ...c,
                    projects: c.projects.map((x, j) =>
                      j === i ? { ...x, [key]: v } : x,
                    ),
                  })
                }
              />
            ))}
            <button type="button" onClick={() => remove("projects", i)}>
              Remove project
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            p.onContent({
              ...c,
              projects: [
                ...c.projects,
                { name: "", tech: "", url: "", detail: "" },
              ],
            })
          }
        >
          Add project
        </button>
      </details>
      <details>
        <summary>Education & certification</summary>
        {(["degree", "institution", "location", "period"] as const).map(
          (key) => (
            <Field
              key={key}
              label={`Education ${key}`}
              value={c.education[key]}
              onChange={(v) =>
                p.onContent({ ...c, education: { ...c.education, [key]: v } })
              }
            />
          ),
        )}
        {field("certification", "Certification")}
      </details>
      <details>
        <summary>Open-source contributions</summary>
        {c.contributions.map((item, i) => (
          <div className="resume-edit-item" key={i}>
            <Field
              label={`Contribution ${i + 1}`}
              value={item.text}
              multiline
              onChange={(v) =>
                p.onContent({
                  ...c,
                  contributions: c.contributions.map((x, j) =>
                    j === i ? { ...x, text: v } : x,
                  ),
                })
              }
            />
            <Field
              label={`Contribution URL ${i + 1}`}
              value={item.url || ""}
              onChange={(v) =>
                p.onContent({
                  ...c,
                  contributions: c.contributions.map((x, j) =>
                    j === i ? { ...x, url: v } : x,
                  ),
                })
              }
            />
            <button type="button" onClick={() => remove("contributions", i)}>
              Remove contribution
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            p.onContent({
              ...c,
              contributions: [...c.contributions, { text: "", url: "" }],
            })
          }
        >
          Add contribution
        </button>
      </details>
    </div>
  );
}
