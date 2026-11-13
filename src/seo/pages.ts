import data from "./tool-pages.json";
import { RESUME_TEMPLATES } from "../data/printResume";
import type { ViewMode } from "../types";
export interface SearchPage {
  id:
    | ViewMode
    | "home"
    | "portfolio"
    | "resume"
    | `resume-${string}`
    | "notfound";
  path: string;
  name: string;
  title: string;
  description: string;
  intro: string;
  features: string[];
  steps: string[];
  faq: { question: string; answer: string }[];
  related: string[];
}
export const TOOL_PAGES = data as SearchPage[];
export const HOME_PAGE: SearchPage = {
  id: "home",
  path: "/",
  name: "PSDevTool",
  title: "Free Online Developer Tools | PSDevTool",
  description:
    "Compare code, format JSON, inspect APIs and logs, create diagrams, process files and convert units. Explore 20 browser-based tools in one workspace.",
  intro:
    "PSDevTool brings 20 practical tools into one browser workspace. Compare versions, inspect structured data and network captures, transform files, or work with measurements and formulas.",
  features: [
    "Compare and format code, text and structured data.",
    "Inspect requests, network archives, tokens and stack traces.",
    "Create diagrams, work with documents and images, and convert measurements.",
  ],
  steps: [
    "Choose a tool by name, format or task.",
    "Enter your data and review the available settings.",
    "Inspect the result and use the relevant copy or export action.",
  ],
  faq: [
    {
      question: "Are the tools free to use?",
      answer:
        "PSDevTool’s tools are available without a paid application subscription. Public map, routing and optional proxy services have their own availability and usage limits.",
    },
    {
      question: "Does everything work offline?",
      answer:
        "No. Many processing operations run locally, but API requests, maps, routing and some application resources require network access. The hosted page also includes analytics and advertising scripts.",
    },
    {
      question: "Can I choose a theme or reduce motion?",
      answer:
        "Yes. Choose a language theme and use the motion control. The app remembers those preferences and respects system reduced-motion settings.",
    },
  ],
  related: [],
};
export const PORTFOLIO_PAGE: SearchPage = {
  id: "portfolio",
  path: "/portfolio/",
  name: "Prakash Choudhary",
  title: "Prakash Choudhary — Senior Software Engineer",
  description:
    "Explore Prakash Choudhary’s backend engineering, distributed systems and applied AI work, project case studies, experience and open-source contribution.",
  intro:
    "Prakash Choudhary is a Senior Software Engineer working on backend services, event-driven systems, cloud applications and applied AI. Explore project case studies and professional experience in the portfolio.",
  features: [
    "Backend services and distributed systems.",
    "Applied AI and developer tools.",
    "Professional experience and source-linked project case studies.",
  ],
  steps: [],
  faq: [],
  related: ["text", "json", "measure"],
};
export const RESUME_PAGE: SearchPage = {
  ...PORTFOLIO_PAGE,
  id: "resume",
  path: "/resume/",
  name: "Resume Builder",
  title: "Free Resume Builder & Print-Ready Templates | PSDevTool",
  description:
    "Build a resume with ten HTML templates. Edit details, colors and portfolio QR, save a local draft, and print focused A4 or expanded Legal editions to PDF.",
  features: [
    "Ten single-column and two-column resume templates.",
    "Edit content, colors and the optional portfolio QR in your browser.",
    "Save a local draft and print A4 or Legal PDFs.",
  ],
};
export const RESUME_PAGES: SearchPage[] = RESUME_TEMPLATES.flatMap((t) => [
  {
    ...RESUME_PAGE,
    id: `resume-${t.id}`,
    path: `/resume/${t.id}/`,
    name: `${t.name} resume`,
    title: `Prakash Choudhary — Senior Software Engineer Resume (${t.name})`,
    description: `Prakash Choudhary’s ${t.name.toLowerCase()} resume: backend engineering, distributed systems, cloud and applied AI experience, engineering projects, skills and education.`,
  },
  {
    ...RESUME_PAGE,
    id: `resume-${t.id}-legal`,
    path: `/resume/${t.id}/legal/`,
    name: `${t.name} Legal resume`,
    title: `Prakash Choudhary — Resume (${t.name}, Legal)`,
    description: `Prakash Choudhary’s expanded ${t.name.toLowerCase()} resume on Legal paper: engineering experience, six projects, four open-source contributions, skills and education.`,
  },
]);
RESUME_PAGES.push({
  ...RESUME_PAGE,
  id: "resume-legal",
  path: "/resume/legal/",
  name: "Legal resume templates",
  title: "Prakash Choudhary — Expanded Legal Resume Templates",
  description:
    "Explore ten expanded Legal-size HTML resume templates for Prakash Choudhary, featuring engineering experience, six projects and four open-source contributions.",
});
export const NOT_FOUND: SearchPage = {
  id: "notfound",
  path: "/404/",
  name: "Page not found",
  title: "Page not found | PSDevTool",
  description:
    "This page could not be found. Explore PSDevTool’s developer tools.",
  intro:
    "This address does not match a tool or page. Choose a tool from the catalog to continue.",
  features: [],
  steps: [],
  faq: [],
  related: [],
};
export function pageForId(id: SearchPage["id"]) {
  return id === "home"
    ? HOME_PAGE
    : id === "portfolio"
      ? PORTFOLIO_PAGE
      : id === "resume"
        ? RESUME_PAGE
        : [...RESUME_PAGES, ...TOOL_PAGES].find((p) => p.id === id) ||
          NOT_FOUND;
}
export function toolPath(id: ViewMode) {
  return pageForId(id).path;
}
