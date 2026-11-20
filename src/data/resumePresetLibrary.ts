import { CONTACT_EMAIL } from "./contact";
import { createResumeContent, DEFAULT_APPEARANCE } from "./resumeDraft";
import {
  makeLibrary,
  parseProfileBackup,
  type ResumeLibrary,
  type ResumeProfile,
} from "./resumeProfiles";
import { RESUME_ROLES } from "./resumeRolePresets";
import { RESUME } from "./resumeData";
import type { ResumePaper } from "./printResume";
export function createDefaultResumeLibrary(
  paper: ResumePaper,
  years: number,
): ResumeLibrary {
  const profiles = RESUME_ROLES.map((role) => ({
    id: `preset:${role.id}`,
    name: role.name,
    presetRole: role.id,
    templateId: "modern",
    paper,
    content: createResumeContent(paper, years, role.id),
    appearance: { ...DEFAULT_APPEARANCE },
  }));
  return makeLibrary(profiles, "preset:general", true);
}
export function addRoleExamples(
  library: ResumeLibrary,
  paper: ResumePaper,
  years: number,
  includeGeneral = true,
): ResumeLibrary {
  const examples = createDefaultResumeLibrary(paper, years).profiles.filter(
    (p) =>
      (includeGeneral || p.presetRole !== "general") &&
      !library.profiles.some((existing) => existing.id === p.id),
  );
  if (library.profiles.length + examples.length > 50)
    throw Error("Make room for the role examples first (maximum 50 profiles).");
  const next = makeLibrary(
    [...library.profiles, ...examples],
    library.activeProfileId,
    true,
  );
  parseProfileBackup(JSON.stringify(next));
  return next;
}
export function migrateOwnerRoleExamples(
  library: ResumeLibrary,
  paper: ResumePaper,
  years: number,
): ResumeLibrary {
  if (library.roleDefaultsAdded) return library;
  const owner = library.profiles.some(
    (p) => p.content.name === RESUME.name && p.content.email === CONTACT_EMAIL,
  );
  // The existing current resume remains selected and untouched. Other people's
  // saved resumes receive no owner examples unless they choose to add them.
  if (!owner) return library;
  try {
    return addRoleExamples(library, paper, years, false);
  } catch {
    return library;
  } // A full saved library must never fall back to a new example.
}
export function refreshRoleExamples(
  library: ResumeLibrary | null,
  years: number,
): ResumeLibrary | null {
  if (!library) return null;
  return {
    ...library,
    profiles: library.profiles.map((p): ResumeProfile =>
      p.presetRole
        ? { ...p, content: createResumeContent(p.paper, years, p.presetRole) }
        : p,
    ),
  };
}
