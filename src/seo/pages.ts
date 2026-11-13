import data from "./tool-pages.json";
import type { ViewMode } from "../types";
export interface SearchPage {
  id: ViewMode | "home" | "portfolio" | "notfound";
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
    "Compare code, format JSON, inspect APIs and logs, create diagrams, process files and convert units. Explore 19 browser-based tools in one workspace.",
  intro:
    "PSDevTool brings 19 practical tools into one browser workspace. Compare versions, inspect structured data and network captures, transform files, or work with measurements and formulas.",
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
      : TOOL_PAGES.find((p) => p.id === id) || NOT_FOUND;
}
export function toolPath(id: ViewMode) {
  return pageForId(id).path;
}
