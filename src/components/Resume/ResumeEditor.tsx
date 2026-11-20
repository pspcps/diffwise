import { parseProfileBackup } from "../../data/resumeProfiles";
import type { useResumeProfiles } from "../../hooks/useResumeProfiles";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { ResumeContent, ResumeAppearance } from "../../data/resumeDraft";
import {
  blankResumeContent,
  contrastRatio,
  safeResumeUrl,
} from "../../data/resumeDraft";
type Props = {
  content: ResumeContent;
  exampleProjects: ResumeContent["projects"];
  appearance: ResumeAppearance;
  accent: string;
  onContent: (v: ResumeContent) => void;
  onAppearance: (v: ResumeAppearance) => void;
  remember: boolean;
  onRemember: (v: boolean) => void;
  onReset: () => void;
  profileManager: ReturnType<typeof useResumeProfiles>;
  message: string;
  setMessage: (v: string) => void;
  onClose: () => void;
  onCancel: () => void;
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
          aria-label={label}
          value={value}
          maxLength={20000}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
export default function ResumeEditor(p: Props) {
  const file = useRef<HTMLInputElement>(null);
  const importAlive = useRef(true);
  useEffect(() => {
    importAlive.current = true;
    return () => {
      importAlive.current = false;
    };
  }, []);
  const c = p.content;
  const pm = p.profileManager;
  const [profileName, setProfileName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
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
    const blob = new Blob([JSON.stringify(pm.backup())], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume-profiles-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      if (f.size > 5000000) throw Error("Backup is too large (maximum 5 MB).");
      const text = await f.text();
      if (!importAlive.current) return;
      pm.importBackup(parseProfileBackup(text));
    } catch (error) {
      if (!importAlive.current) return;
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
            Done editing keeps your changes. Cancel or Escape discards this edit
            session. Longer content may need more than one page.
          </p>
        </div>
        <div className="resume-editor-actions">
          <button
            type="button"
            className="resume-editor-cancel"
            onClick={p.onCancel}
          >
            Cancel
          </button>
          <button type="button" onClick={p.onClose}>
            Done editing
          </button>
        </div>
      </header>
      <section className="resume-profile-panel" aria-label="Resume profiles">
        <h3>Resume profiles</h3>
        <p>
          Keep a separate resume for each role. Each profile remembers its
          content, colors, QR setting, template and paper size. The seven
          example roles emphasize different parts of Prakash’s documented work;
          held employment titles and dates stay the same.
        </p>
        <label className="resume-edit-field">
          <span>Active profile</span>
          <select
            aria-label="Active profile"
            value={pm.activeId}
            onChange={(e) => {
              pm.select(e.target.value);
              setConfirmDelete(null);
            }}
          >
            {!pm.activeId && (
              <option value="">Common example (not saved)</option>
            )}
            {pm.profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={pm.addRoleExamples}>
          Restore missing role examples
        </button>
        <label className="resume-edit-field">
          <span>Profile name</span>
          <input
            maxLength={100}
            value={profileName}
            placeholder="e.g. Backend Engineer"
            onChange={(e) => setProfileName(e.target.value)}
          />
        </label>
        <div className="resume-draft-actions">
          <button
            type="button"
            onClick={() => {
              pm.create(profileName, false);
              setProfileName("");
            }}
          >
            New blank profile
          </button>
          <button
            type="button"
            onClick={() => {
              pm.create(profileName, true);
              setProfileName("");
            }}
          >
            Duplicate current profile
          </button>
          <button
            type="button"
            disabled={!profileName.trim()}
            onClick={() => {
              pm.rename(profileName);
              setProfileName("");
            }}
          >
            Rename profile
          </button>
          <button
            type="button"
            disabled={!pm.activeId}
            onClick={() => setConfirmDelete(pm.activeId)}
          >
            Delete profile
          </button>
        </div>
        {confirmDelete === pm.activeId && confirmDelete && (
          <div role="group" aria-label="Confirm profile deletion">
            <p>
              Delete this profile? Download a backup first if you may need it
              again.
            </p>
            <button
              type="button"
              onClick={() => {
                pm.remove();
                setConfirmDelete(null);
              }}
            >
              Confirm delete profile
            </button>{" "}
            <button type="button" onClick={() => setConfirmDelete(null)}>
              Cancel deletion
            </button>
          </div>
        )}
      </section>
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
          Download all profiles
        </button>
        <button type="button" onClick={() => file.current?.click()}>
          Import profiles / draft
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
          Reset current profile to sample
        </button>
      </div>
      <p className="resume-editor-privacy">
        Profiles stay in this browser’s local storage when device saving is
        enabled and you choose Done editing; they are not uploaded by the
        editor. Download all profiles before clearing site data or moving
        devices. Imports add profiles without replacing existing ones. Turning
        off device saving removes stored copies after Done editing; open
        profiles remain for this page session.
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
        <p>
          Restore this paper’s example projects without changing your other
          details.
        </p>
        <button
          type="button"
          onClick={() =>
            p.onContent({ ...c, projects: structuredClone(p.exampleProjects) })
          }
        >
          Use example projects
        </button>
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
        <p>
          Education and certification appear in Legal. The focused A4 edition
          hides this section.
        </p>
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
        <p>A4 prints the first contribution; Legal prints all entries.</p>
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
