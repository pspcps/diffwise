import { useEffect, useState } from "react";
import {
  DEFAULT_APPEARANCE,
  RESUME_STORAGE_KEY,
  loadResumeDraft,
  blankResumeContent,
  type ResumeContent,
  type ResumeAppearance,
} from "../data/resumeDraft";
import {
  PROFILE_STORAGE_KEY,
  makeLibrary,
  mergeProfileBackup,
  parseProfileBackup,
  profileId,
  type ResumeLibrary,
  type ResumeProfile,
} from "../data/resumeProfiles";
import type { ResumePaper } from "../data/printResume";
import { navigateTo } from "../seo/routes";
export function useResumeProfiles(
  sample: ResumeContent,
  templateId: string | undefined,
  paper: ResumePaper,
) {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) return parseProfileBackup(raw);
    } catch {
      /* Preserve unreadable storage; an explicit save can replace it. */
    }
    const legacy = loadResumeDraft();
    if (!legacy) return null;
    const id = profileId();
    return makeLibrary(
      [
        {
          content: legacy.content,
          appearance: legacy.appearance,
          id,
          name: "My resume",
          templateId: templateId || "modern",
          paper,
        },
      ],
      id,
    );
  });
  const [library, setLibrary] = useState<ResumeLibrary | null>(initial);
  const [remember, setRemember] = useState(Boolean(initial));
  const [message, setMessage] = useState("");
  const [editSession, setEditSession] = useState<{
    id: string;
    library: ResumeLibrary | null;
    remember: boolean;
    templateId: string;
    paper: ResumePaper;
  } | null>(null);
  const active = library?.profiles.find(
    (p) => p.id === library.activeProfileId,
  );
  const current = active?.content || sample;
  const appearance = active?.appearance || DEFAULT_APPEARANCE;
  const commit = (next: ResumeLibrary | null) => {
    try {
      if (next) parseProfileBackup(JSON.stringify(next));
    } catch (error) {
      setMessage(
        `${error instanceof Error ? error.message : "Profile limits exceeded."} This change was not applied.`,
      );
      return false;
    }
    setLibrary(next);
    return true;
  };
  // Route props can change through the gallery or browser history. Adjust only
  // when that route changes, never when a different profile is being selected.
  const route = templateId ? `${templateId}:${paper}` : null;
  const [lastRoute, setLastRoute] = useState<string | null>(null);
  if (route !== lastRoute) {
    setLastRoute(route);
    if (templateId && library && active) {
      if (active.templateId !== templateId || active.paper !== paper)
        setLibrary(
          makeLibrary(
            library.profiles.map((p) =>
              p.id === active.id ? { ...p, templateId, paper } : p,
            ),
            active.id,
          ),
        );
    }
  }
  useEffect(() => {
    if (editSession || !remember || !library) return;
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(library));
      localStorage.removeItem(RESUME_STORAGE_KEY);
    } catch {
      // Storage failure is an external event; defer the user-facing notification.
      const frame = requestAnimationFrame(() =>
        setMessage(
          "Browser storage is unavailable or full. Download all profiles to keep a backup.",
        ),
      );
      return () => cancelAnimationFrame(frame);
    }
  }, [library, remember, editSession]);
  const snapshot = (): ResumeProfile =>
    active || {
      id: profileId(),
      name: "My resume",
      content: structuredClone(current),
      appearance: { ...appearance },
      templateId: templateId || "modern",
      paper,
    };
  const update = (patch: Partial<ResumeProfile>) => {
    const p = { ...snapshot(), ...patch };
    commit(
      makeLibrary(
        active
          ? library!.profiles.map((v) => (v.id === p.id ? p : v))
          : [...(library?.profiles || []), p],
        p.id,
      ),
    );
  };
  const switchProfile = (next: ResumeLibrary) => {
    const p = next.profiles.find((p) => p.id === next.activeProfileId)!;
    if (!commit(next)) return false;
    navigateTo(
      `/resume/${p.templateId}/${p.paper === "legal" ? "legal/" : ""}`,
    );
    return true;
  };
  const create = (name: string, duplicate: boolean) => {
    const profiles = library?.profiles || [];
    if (profiles.length >= 50) {
      setMessage(
        "Maximum 50 profiles. Download a backup before removing unused profiles.",
      );
      return;
    }
    const p = structuredClone({
      ...snapshot(),
      id: profileId(),
      name:
        name.trim().slice(0, 100) || (duplicate ? "Resume copy" : "New resume"),
      content: duplicate ? current : blankResumeContent(),
    });
    // Preserve the current sample/edits before opening another profile.
    const kept = active ? profiles : [...profiles, snapshot()];
    if (kept.length >= 50) {
      setMessage("Maximum 50 profiles.");
      return;
    }
    if (!switchProfile(makeLibrary([...kept, p], p.id))) return;
    setMessage(
      remember
        ? "Profile created. Choose Done editing to save on this device."
        : "Profile created for this session. Enable device saving to keep it.",
    );
  };
  const remove = () => {
    if (!active || !library) return;
    const remaining = library.profiles.filter((p) => p.id !== active.id);
    if (remaining.length)
      switchProfile(makeLibrary(remaining, remaining[0].id));
    else {
      setLibrary(null);
      try {
        if (!editSession) {
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          localStorage.removeItem(RESUME_STORAGE_KEY);
        }
      } catch {
        setMessage("Could not remove stored profiles. Check browser settings.");
        return;
      }
    }
    setMessage("Profile deleted. Other profiles are unchanged.");
  };
  return {
    editSessionId: editSession?.id || "closed",
    beginEditing: () => {
      setEditSession({
        id: profileId(),
        library: structuredClone(library),
        remember,
        templateId: templateId || "modern",
        paper,
      });
      setMessage("");
    },
    finishEditing: () => {
      if (!editSession) return true;
      try {
        if (remember && library) {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(library));
          localStorage.removeItem(RESUME_STORAGE_KEY);
        } else if (editSession.remember || (editSession.library && !library)) {
          localStorage.removeItem(PROFILE_STORAGE_KEY);
          localStorage.removeItem(RESUME_STORAGE_KEY);
        }
      } catch {
        setMessage(
          "Could not save your changes on this device. Download a backup, retry, or cancel to restore the previous resume.",
        );
        return false;
      }
      setEditSession(null);
      setMessage(
        remember
          ? "Changes saved on this device."
          : "Changes applied for this page session.",
      );
      return true;
    },
    cancelEditing: () => {
      if (!editSession) return;
      setLibrary(editSession.library);
      setRemember(editSession.remember);
      setEditSession(null);
      setMessage("Editing canceled. Previous profiles restored.");
      navigateTo(
        `/resume/${editSession.templateId}/${editSession.paper === "legal" ? "legal/" : ""}`,
      );
    },
    current,
    content: active?.content || null,
    appearance,
    remember,
    message,
    setMessage,
    profiles: library?.profiles || [],
    activeId: active?.id || "",
    changeContent: (content: ResumeContent) => update({ content }),
    changeAppearance: (appearance: ResumeAppearance) => update({ appearance }),
    changeRemember: (save: boolean) => {
      if (save) {
        setRemember(true);
        const p = snapshot();
        commit(library || makeLibrary([p], p.id));
        setMessage("Choose Done editing to save all profiles on this device.");
      } else {
        if (editSession) {
          setRemember(false);
          setMessage(
            "Device saving will turn off when you choose Done editing. Cancel keeps your previous settings.",
          );
        } else
          try {
            localStorage.removeItem(PROFILE_STORAGE_KEY);
            localStorage.removeItem(RESUME_STORAGE_KEY);
            setRemember(false);
            setMessage(
              "Device saving is off. Open profiles remain in this page session.",
            );
          } catch {
            setMessage(
              "Could not remove stored profiles. Check browser settings.",
            );
          }
      }
    },
    reset: () => {
      update({
        content: structuredClone(sample),
        appearance: { ...DEFAULT_APPEARANCE },
      });
      setMessage(
        "Current profile reset to sample. Other profiles are unchanged.",
      );
    },
    create,
    remove,
    rename: (name: string) => {
      if (name.trim()) update({ name: name.trim().slice(0, 100) });
    },
    select: (id: string) => {
      if (library?.profiles.some((p) => p.id === id))
        switchProfile({ ...library, activeProfileId: id });
    },
    backup: () => {
      const p = snapshot();
      return library || makeLibrary([p], p.id);
    },
    importBackup: (incoming: ResumeLibrary) => {
      const next = mergeProfileBackup(library?.profiles || [], incoming);
      if (!switchProfile(next)) return;
      setMessage(
        `Imported ${incoming.profiles.length} profile(s). Existing profiles were kept.${remember ? " Choose Done editing to save on this device." : " Choose Done editing to apply; enable device saving to keep them after reloading."}`,
      );
    },
  };
}
