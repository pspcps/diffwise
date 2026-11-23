import {
  FileText,
  Palette,
  Users,
  Download,
  Plus,
  Copy,
  Trash2,
} from "lucide-react";
import { parseProfileBackup } from "../../data/resumeProfiles";
import type { useResumeProfiles } from "../../hooks/useResumeProfiles";
import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import type { ResumeContent, ResumeAppearance } from "../../data/resumeDraft";
import {
  blankResumeContent,
  contrastRatio,
  safeResumeUrl,
} from "../../data/resumeDraft";
const EDITOR_TABS = [
  { id: "content", label: "Content", icon: FileText },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "profiles", label: "Profiles", icon: Users },
  { id: "backups", label: "Save & backup", icon: Download },
] as const;
type EditorTab = (typeof EDITOR_TABS)[number]["id"];
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
  wide = false,
  maxLength = 20000,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  wide?: boolean;
  maxLength?: number;
}) {
  return (
    <label
      className={`resume-edit-field${wide || multiline ? " resume-field-wide" : ""}`}
    >
      <span>{label}</span>
      {multiline ? (
        <textarea
          aria-label={label}
          value={value}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          aria-label={label}
          value={value}
          maxLength={maxLength}
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
  const [tab, setTab] = useState<EditorTab>("content");
  const tabsId = useId();
  const body = useRef<HTMLDivElement>(null);
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const activeProfile = pm.profiles.find(
    (profile) => profile.id === pm.activeId,
  );
  const [nameDraft, setNameDraft] = useState<{
    id: string;
    value: string;
  } | null>(null);
  const profileName =
    nameDraft?.id === pm.activeId ? nameDraft.value : activeProfile?.name || "";
  const selectTab = (next: EditorTab) => {
    setTab(next);
    body.current?.scrollTo({ top: 0 });
  };
  const tabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target =
      event.key === "ArrowRight"
        ? (index + 1) % EDITOR_TABS.length
        : event.key === "ArrowLeft"
          ? (index + EDITOR_TABS.length - 1) % EDITOR_TABS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? EDITOR_TABS.length - 1
              : -1;
    if (target < 0) return;
    event.preventDefault();
    selectTab(EDITOR_TABS[target].id);
    tabButtons.current[target]?.focus();
  };
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
      <header className="resume-editor-header">
        <div>
          <p className="resume-editor-eyebrow">RESUME BUILDER</p>
          <h2>Edit resume</h2>
        </div>
        <div className="resume-editor-actions">
          <button
            type="button"
            className="resume-editor-cancel"
            onClick={p.onCancel}
          >
            Cancel
          </button>
          <button type="button" className="resume-primary" onClick={p.onClose}>
            Done editing
          </button>
        </div>
      </header>
      <div className="resume-editor-context">
        <label htmlFor={`${tabsId}-profile`}>Active profile</label>
        <select
          id={`${tabsId}-profile`}
          aria-label="Active profile"
          value={pm.activeId}
          onChange={(event) => {
            pm.select(event.target.value);
            setConfirmDelete(null);
          }}
        >
          {!pm.activeId && <option value="">Common example (not saved)</option>}
          {pm.profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </div>
      <div
        className="resume-editor-tabs"
        role="tablist"
        aria-label="Resume editor sections"
      >
        {EDITOR_TABS.map(({ id, label, icon: Icon }, index) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`${tabsId}-${id}-tab`}
            aria-selected={tab === id}
            aria-controls={`${tabsId}-${id}-panel`}
            tabIndex={tab === id ? 0 : -1}
            ref={(element) => {
              tabButtons.current[index] = element;
            }}
            onKeyDown={(event) => tabKey(event, index)}
            onClick={() => selectTab(id)}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {p.message && (
        <p role="status" className="resume-editor-status">
          {p.message}
        </p>
      )}
      <div className="resume-editor-body" ref={body}>
        <section
          role="tabpanel"
          id={`${tabsId}-content-panel`}
          aria-labelledby={`${tabsId}-content-tab`}
          hidden={tab !== "content"}
          className="resume-editor-panel"
        >
          <div className="resume-panel-heading">
            <h3>Your resume content</h3>
            <p>
              Update a section below. Check Print Preview after longer edits.
            </p>
          </div>
          <details name={`${tabsId}-content`} open>
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
            <p>
              Use complete https:// links. Invalid URLs print as plain text.
            </p>
          </details>

          <details name={`${tabsId}-content`}>
            <summary>Technical skills</summary>
            {c.skills.map(([label, items], i) => (
              <div className="resume-edit-item" key={i}>
                <div className="resume-edit-grid resume-skill-grid">
                  <Field
                    label={`Skill group ${i + 1}`}
                    value={label}
                    onChange={(v) =>
                      p.onContent({
                        ...c,
                        skills: c.skills.map((x, j) =>
                          j === i ? [v, items] : x,
                        ),
                      })
                    }
                  />
                  <Field
                    label={`Skills ${i + 1}`}
                    value={items}
                    onChange={(v) =>
                      p.onContent({
                        ...c,
                        skills: c.skills.map((x, j) =>
                          j === i ? [label, v] : x,
                        ),
                      })
                    }
                  />
                </div>
                <button type="button" onClick={() => remove("skills", i)}>
                  Remove skill group
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                p.onContent({ ...c, skills: [...c.skills, ["", ""]] })
              }
            >
              Add skill group
            </button>
          </details>
          <details name={`${tabsId}-content`}>
            <summary>Professional experience</summary>
            {c.experience.map((job, i) => (
              <div className="resume-edit-item" key={i}>
                <header className="resume-item-heading">
                  <h4>{job.company || `Experience ${i + 1}`}</h4>
                  <button
                    type="button"
                    className="resume-danger-text"
                    onClick={() => remove("experience", i)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove experience
                  </button>
                </header>
                <div className="resume-edit-grid resume-job-grid">
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
                </div>
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
          <details name={`${tabsId}-content`}>
            <summary>Engineering projects</summary>
            <p>
              Optional project groups appear on Legal paper. Leave groups blank
              for a flat list.
            </p>
            {c.projects.map((project, i) => (
              <div className="resume-edit-item" key={i}>
                <header className="resume-item-heading">
                  <h4>{project.name || `Project ${i + 1}`}</h4>
                  <button
                    type="button"
                    className="resume-danger-text"
                    onClick={() => remove("projects", i)}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove project
                  </button>
                </header>
                <div className="resume-edit-grid">
                  {(["name", "tech", "url", "category", "detail"] as const).map(
                    (key) => (
                      <Field
                        key={key}
                        label={`${key === "name" ? "Project name" : key === "tech" ? "Technologies" : key === "url" ? "Repository / project URL" : key === "category" ? "Project group (Legal, optional)" : "Project description"} ${i + 1}`}
                        value={project[key] || ""}
                        maxLength={key === "category" ? 80 : 20000}
                        multiline={key === "detail"}
                        wide={key === "url"}
                        onChange={(v) =>
                          p.onContent({
                            ...c,
                            projects: c.projects.map((x, j) =>
                              j === i ? { ...x, [key]: v } : x,
                            ),
                          })
                        }
                      />
                    ),
                  )}
                </div>
              </div>
            ))}
            <p>
              Restore this paper’s example projects without changing your other
              details.
            </p>
            <button
              type="button"
              onClick={() =>
                p.onContent({
                  ...c,
                  projects: structuredClone(p.exampleProjects),
                })
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
          <details name={`${tabsId}-content`}>
            <summary>Education & certification</summary>
            <p>
              Education and certification appear in Legal. The focused A4
              edition hides this section.
            </p>
            <div className="resume-edit-grid">
              {(["degree", "institution", "location", "period"] as const).map(
                (key) => (
                  <Field
                    key={key}
                    label={`Education ${key}`}
                    value={c.education[key]}
                    onChange={(v) =>
                      p.onContent({
                        ...c,
                        education: { ...c.education, [key]: v },
                      })
                    }
                  />
                ),
              )}
            </div>
            {field("certification", "Certification")}
          </details>
          <details name={`${tabsId}-content`}>
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
                <button
                  type="button"
                  onClick={() => remove("contributions", i)}
                >
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
        </section>
        <section
          role="tabpanel"
          id={`${tabsId}-appearance-panel`}
          aria-labelledby={`${tabsId}-appearance-tab`}
          hidden={tab !== "appearance"}
          className="resume-editor-panel"
        >
          <div className="resume-panel-heading">
            <h3>Make it yours</h3>
            <p>Choose readable colors and an optional portfolio QR.</p>
          </div>
          <section className="resume-editor-card">
            <h3>Colors & QR code</h3>
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
              {contrastRatio(
                p.appearance.text,
                p.appearance.background,
              ).toFixed(1)}
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
              The QR links to your portfolio / website URL.{" "}
              {!safeResumeUrl(c.portfolio) && p.appearance.showQR
                ? "Enter a valid http:// or https:// website URL to display it."
                : ""}{" "}
              Enable background graphics in Print to preserve your colors.
            </p>
          </section>
        </section>
        <section
          role="tabpanel"
          id={`${tabsId}-profiles-panel`}
          aria-labelledby={`${tabsId}-profiles-tab`}
          hidden={tab !== "profiles"}
          className="resume-editor-panel"
        >
          <div className="resume-panel-heading">
            <h3>Manage profiles</h3>
            <p>Keep a separate version for each role.</p>
          </div>
          <section className="resume-editor-card">
            <h4>Current profile</h4>
            <div className="resume-rename-row">
              <label className="resume-edit-field">
                <span>Profile name</span>
                <input
                  aria-label="Profile name"
                  maxLength={100}
                  value={profileName}
                  onChange={(event) =>
                    setNameDraft({ id: pm.activeId, value: event.target.value })
                  }
                />
              </label>
              <button
                type="button"
                disabled={
                  !profileName.trim() ||
                  profileName.trim() === activeProfile?.name
                }
                onClick={() => {
                  pm.rename(profileName);
                  setNameDraft(null);
                }}
              >
                Rename profile
              </button>
            </div>
          </section>
          <section className="resume-editor-card">
            <h4>Create another version</h4>
            <p>
              Start fresh or copy the selected profile. You can rename it
              afterward.
            </p>
            <div className="resume-editor-button-row">
              <button
                type="button"
                onClick={() => {
                  pm.create("", false);
                  setNameDraft(null);
                }}
              >
                <Plus size={15} aria-hidden="true" />
                New blank profile
              </button>
              <button
                type="button"
                onClick={() => {
                  pm.create("", true);
                  setNameDraft(null);
                }}
              >
                <Copy size={15} aria-hidden="true" />
                Duplicate current profile
              </button>
            </div>
          </section>
          <details className="resume-editor-advanced">
            <summary>Restore examples or reset content</summary>
            <p>
              These actions affect the current profile or add missing examples.
              Cancel can undo this edit session.
            </p>
            <div className="resume-editor-button-row">
              <button type="button" onClick={pm.addRoleExamples}>
                Restore missing role examples
              </button>
              <button
                type="button"
                onClick={() => {
                  p.onContent(blankResumeContent());
                  p.setMessage(
                    "Blank resume ready. Add your own details in Content.",
                  );
                }}
              >
                Start blank
              </button>
              <button type="button" onClick={p.onReset}>
                Reset current profile to sample
              </button>
            </div>
          </details>
          <section className="resume-editor-card resume-delete-card">
            <h4>Delete this profile</h4>
            <p>
              Other profiles will be kept. Download a backup first if you may
              need this one again.
            </p>
            <button
              type="button"
              className="resume-danger-text"
              disabled={!pm.activeId}
              onClick={() => setConfirmDelete(pm.activeId)}
            >
              <Trash2 size={15} aria-hidden="true" />
              Delete profile
            </button>
            {confirmDelete === pm.activeId && confirmDelete && (
              <div
                className="resume-delete-confirm"
                role="group"
                aria-label="Confirm profile deletion"
              >
                <p>Delete {activeProfile?.name || "this profile"}?</p>
                <div className="resume-editor-button-row">
                  <button
                    type="button"
                    className="resume-danger"
                    onClick={() => {
                      pm.remove();
                      setConfirmDelete(null);
                    }}
                  >
                    Confirm delete profile
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(null)}>
                    Cancel deletion
                  </button>
                </div>
              </div>
            )}
          </section>
        </section>
        <section
          role="tabpanel"
          id={`${tabsId}-backups-panel`}
          aria-labelledby={`${tabsId}-backups-tab`}
          hidden={tab !== "backups"}
          className="resume-editor-panel"
        >
          <div className="resume-panel-heading">
            <h3>Save & backup</h3>
            <p>Keep your work on this device or download a copy.</p>
          </div>
          <section className="resume-editor-card">
            <label className="resume-storage-toggle">
              <span>
                <strong>Save on this device</strong>
                <small>Save profiles in this browser after Done editing.</small>
              </span>
              <input
                type="checkbox"
                aria-label="Save on this device"
                checked={p.remember}
                onChange={(event) => p.onRemember(event.target.checked)}
              />
            </label>
          </section>
          <div className="resume-backup-grid">
            <section className="resume-editor-card">
              <h4>Download a backup</h4>
              <p>Includes every profile, its content and layout settings.</p>
              <button type="button" onClick={download}>
                <Download size={15} aria-hidden="true" />
                Download all profiles
              </button>
            </section>
            <section className="resume-editor-card">
              <h4>Restore a backup</h4>
              <p>Import adds profiles without replacing existing ones.</p>
              <button type="button" onClick={() => file.current?.click()}>
                Import profiles / draft
              </button>
            </section>
          </div>
          <input
            type="file"
            ref={file}
            accept=".json,application/json"
            onChange={importFile}
            hidden
          />
          <details className="resume-editor-advanced">
            <summary>Storage & privacy</summary>
            <p>
              Saved profiles stay in this browser; the editor does not upload
              them. Download a backup before clearing site data or moving
              devices. Turning off device saving removes stored copies after
              Done editing. Unsaved profiles last for the current page session.
            </p>
          </details>
        </section>
      </div>
      <footer className="resume-editor-footer">
        <span>Cancel discards this edit session.</span>
        <span>{p.remember ? "Device saving enabled" : "Session only"}</span>
      </footer>
    </div>
  );
}
