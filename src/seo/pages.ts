import { SITE_INFORMATION, type InformationId } from "./siteInformation";
import data from "./tool-pages.json";
import { RESUME_TEMPLATES } from "../data/printResume";
import type { ViewMode } from "../types";
export interface SearchPage {
  id:
    | ViewMode
    | InformationId
    | "home"
    | "portfolio"
    | "portfolio-v1"
    | "portfolio-v2"
    | "portfolio-v3"
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
export const INFORMATION_PAGES: SearchPage[] = SITE_INFORMATION.map((p) => ({
  id: p.id,
  path: `/${p.id}/`,
  name: p.name,
  title: `${p.name} | PSDevTool`,
  description: p.description,
  intro: p.description,
  features: [],
  steps: [],
  faq: [],
  related: [],
}));
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
        "Yes. Click the language logo to cycle themes; your choice is remembered. Animations follow your system’s reduced-motion setting.",
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
export const PORTFOLIO_V1_PAGE: SearchPage = {
  ...PORTFOLIO_PAGE,
  id: "portfolio-v1",
  path: "/portfolio/v1/",
  title: "Prakash Choudhary — Original Engineering Portfolio",
};
export const PORTFOLIO_V2_PAGE: SearchPage = {
  ...PORTFOLIO_PAGE,
  id: "portfolio-v2",
  path: "/portfolio/v2/",
  name: "Prakash Choudhary · Portfolio v2",
  title: "Prakash Choudhary — Full-Stack & Applied AI Portfolio",
  description:
    "Explore Prakash Choudhary’s full-stack, distributed systems, cloud and applied AI work in a focused portfolio with project sources, experience and technical skills.",
};
export const PORTFOLIO_V3_PAGE: SearchPage = {
  ...PORTFOLIO_PAGE,
  id: "portfolio-v3",
  path: "/portfolio/v3/",
  name: "Prakash Choudhary · Portfolio v3",
  title: "Prakash Choudhary — Interactive Engineering Studio",
  description:
    "Meet Prakash Choudhary through an interactive 3D engineering studio. Explore full-stack and applied AI projects, source code, career experience and technical skills.",
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
    description: `Prakash Choudhary’s expanded ${t.name.toLowerCase()} resume on Legal paper: engineering experience, eight curated projects, four open-source contributions, skills and education.`,
  },
]);
RESUME_PAGES.push({
  ...RESUME_PAGE,
  id: "resume-legal",
  path: "/resume/legal/",
  name: "Legal resume templates",
  title: "Prakash Choudhary — Expanded Legal Resume Templates",
  description:
    "Explore ten expanded Legal-size HTML resume templates for Prakash Choudhary, featuring engineering experience, eight curated projects and four open-source contributions.",
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
      : id === "portfolio-v1"
        ? PORTFOLIO_V1_PAGE
        : id === "portfolio-v2"
          ? PORTFOLIO_V2_PAGE
          : id === "portfolio-v3"
            ? PORTFOLIO_V3_PAGE
            : id === "resume"
              ? RESUME_PAGE
              : [...INFORMATION_PAGES, ...RESUME_PAGES, ...TOOL_PAGES].find(
                  (p) => p.id === id,
                ) || NOT_FOUND;
}
export function toolPath(id: ViewMode) {
  return pageForId(id).path;
}
