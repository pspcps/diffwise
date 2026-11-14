import {
  PRINT_RESUME,
  LEGAL_PROJECTS,
  ADDITIONAL_CONTRIBUTIONS,
} from "./printResume";
import type { ResumePaper } from "./printResume";
export interface ResumeContent {
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  skills: string[][];
  experience: {
    company: string;
    role: string;
    period: string;
    bullets: string[];
  }[];
  projects: {
    name: string;
    tech: string;
    url: string | null;
    detail: string;
  }[];
  education: {
    degree: string;
    period: string;
    institution: string;
    location: string;
  };
  certification: string;
  contributions: { text: string; url: string | null }[];
}
export interface ResumeAppearance {
  accent: string;
  text: string;
  background: string;
  showQR: boolean;
}
export interface ResumeDraft {
  version: 1;
  content: ResumeContent;
  appearance: ResumeAppearance;
}
export const DEFAULT_APPEARANCE: ResumeAppearance = {
  accent: "",
  text: "#17201c",
  background: "#ffffff",
  showQR: true,
};
export const RESUME_STORAGE_KEY = "psdev-resume-draft-v1";
export function createResumeContent(
  paper: ResumePaper,
  years: number,
): ResumeContent {
  const { summary, contribution, ...base } = PRINT_RESUME;
  return structuredClone({
    ...base,
    summary: summary(years),
    projects: paper === "legal" ? LEGAL_PROJECTS : base.projects,
    contributions: [
      contribution,
      ...(paper === "legal"
        ? ADDITIONAL_CONTRIBUTIONS.map((text) => ({ text, url: null }))
        : []),
    ],
  });
}
export function blankResumeContent(): ResumeContent {
  return {
    name: "",
    title: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    portfolio: "",
    summary: "",
    skills: [],
    experience: [],
    projects: [],
    education: { degree: "", period: "", institution: "", location: "" },
    certification: "",
    contributions: [],
  };
}
export function safeResumeUrl(value: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
const record = (v: unknown): v is Record<string, unknown> =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);
const string = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 20000;
const strings = (o: Record<string, unknown>, keys: string[]) =>
  keys.every((k) => string(o[k]));
const list = (v: unknown, check: (item: unknown) => boolean) =>
  Array.isArray(v) && v.length <= 100 && v.every(check);
/** Validate backups and local storage before letting them reach the editor or links. */
export function parseResumeDraft(text: string): ResumeDraft {
  if (text.length > 500000) throw Error("Draft is too large (maximum 500 KB).");
  const d: unknown = JSON.parse(text);
  if (
    !record(d) ||
    d.version !== 1 ||
    !record(d.content) ||
    !record(d.appearance)
  )
    throw Error("Choose a valid PSDevTool resume draft.");
  const c = d.content,
    a = d.appearance;
  if (
    !strings(c, [
      "name",
      "title",
      "email",
      "phone",
      "linkedin",
      "github",
      "portfolio",
      "summary",
      "certification",
    ]) ||
    !record(c.education) ||
    !strings(c.education, ["degree", "period", "institution", "location"]) ||
    !list(
      c.skills,
      (v) => Array.isArray(v) && v.length === 2 && v.every(string),
    ) ||
    !list(
      c.experience,
      (v) =>
        record(v) &&
        strings(v, ["company", "role", "period"]) &&
        list(v.bullets, string),
    ) ||
    !list(
      c.projects,
      (v) =>
        record(v) &&
        strings(v, ["name", "tech", "detail"]) &&
        (v.url === null || string(v.url)),
    ) ||
    !list(
      c.contributions,
      (v) => record(v) && string(v.text) && (v.url === null || string(v.url)),
    ) ||
    !["accent", "text", "background"].every(
      (k) =>
        typeof a[k] === "string" &&
        (/^#[a-f\d]{6}$/i.test(a[k] as string) ||
          (k === "accent" && a[k] === "")),
    ) ||
    typeof a.showQR !== "boolean"
  )
    throw Error("The draft has missing or invalid fields.");
  return d as unknown as ResumeDraft;
}
export function loadResumeDraft() {
  if (typeof window === "undefined") return null;
  try {
    const text = localStorage.getItem(RESUME_STORAGE_KEY);
    return text ? parseResumeDraft(text) : null;
  } catch {
    return null;
  }
}
export function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
