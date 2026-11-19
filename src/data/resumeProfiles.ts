import { parseResumeDraft, type ResumeDraft } from "./resumeDraft";
import { RESUME_TEMPLATES, type ResumePaper } from "./printResume";
export const PROFILE_STORAGE_KEY = "psdev-resume-profiles-v2";
export interface ResumeProfile extends Omit<ResumeDraft, "version"> {
  id: string;
  name: string;
  templateId: string;
  paper: ResumePaper;
}
export interface ResumeLibrary {
  version: 2;
  kind: "psdev-resume-profiles";
  activeProfileId: string;
  profiles: ResumeProfile[];
}
export const profileId = () => crypto.randomUUID();
export function makeLibrary(
  profiles: ResumeProfile[],
  activeProfileId: string,
): ResumeLibrary {
  return {
    version: 2,
    kind: "psdev-resume-profiles",
    profiles,
    activeProfileId,
  };
}
export function parseProfileBackup(text: string): ResumeLibrary {
  if (text.length > 5000000 || new TextEncoder().encode(text).length > 5000000)
    throw Error("Backup is too large (maximum 5 MB).");
  const value = JSON.parse(text);
  if (value?.version === 1) {
    const draft = parseResumeDraft(text);
    const id = profileId();
    return makeLibrary(
      [
        {
          content: draft.content,
          appearance: draft.appearance,
          id,
          name: "Imported resume",
          templateId: "modern",
          paper: "a4",
        },
      ],
      id,
    );
  }
  if (
    value?.version !== 2 ||
    value.kind !== "psdev-resume-profiles" ||
    !Array.isArray(value.profiles) ||
    !value.profiles.length ||
    value.profiles.length > 50
  )
    throw Error("Choose a resume profiles backup or a version 1 resume draft.");
  const ids = new Set<string>();
  const profiles = value.profiles.map((p: ResumeProfile) => {
    if (
      !p ||
      typeof p.id !== "string" ||
      !p.id ||
      p.id.length > 100 ||
      ids.has(p.id) ||
      typeof p.name !== "string" ||
      !p.name.trim() ||
      p.name.length > 100 ||
      !RESUME_TEMPLATES.some((t) => t.id === p.templateId) ||
      !["a4", "legal"].includes(p.paper)
    )
      throw Error(
        "Backup contains an invalid profile, duplicate ID, or unsupported layout.",
      );
    ids.add(p.id);
    const draft = parseResumeDraft(
      JSON.stringify({
        version: 1,
        content: p.content,
        appearance: p.appearance,
      }),
    );
    return {
      content: draft.content,
      appearance: draft.appearance,
      id: p.id,
      name: p.name.trim(),
      templateId: p.templateId,
      paper: p.paper,
    };
  });
  if (!ids.has(value.activeProfileId))
    throw Error("Backup has no valid active profile.");
  return makeLibrary(profiles, value.activeProfileId);
}
export function mergeProfileBackup(
  existing: ResumeProfile[],
  incoming: ResumeLibrary,
): ResumeLibrary {
  if (existing.length + incoming.profiles.length > 50)
    throw Error(
      "Keep at most 50 profiles. Remove an unused profile before importing.",
    );
  let active = "";
  const names = new Set(existing.map((p) => p.name));
  const added = incoming.profiles.map((p) => {
    const id = profileId();
    if (p.id === incoming.activeProfileId) active = id;
    let name = p.name;
    let n = 1;
    while (names.has(name)) name = `${p.name.slice(0, 80)} (imported ${n++})`;
    names.add(name);
    return structuredClone({ ...p, id, name });
  });
  return makeLibrary([...existing, ...added], active);
}
