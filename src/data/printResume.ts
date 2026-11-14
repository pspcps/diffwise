import { RESUME } from "./resumeData";
import { getCareerDuration } from "../utils/careerDuration";
export const PORTFOLIO_URL = "https://psdevtool.online/portfolio/";
const DRISHTI_PROJECT = {
  name: "Project Drishti",
  tech: "React, Firebase, Vertex AI Vision, Gemini",
  url: "https://github.com/pspcps/project-drishti",
  detail:
    "Built camera-frame analysis and Firestore-backed incident, zone and responder workflows for an AI-assisted crowd-safety dashboard.",
};
export const PRINT_RESUME = {
  name: RESUME.name,
  title: "Senior Software Engineer | Backend, Distributed Systems & Applied AI",
  email: RESUME.email,
  phone: RESUME.phone,
  linkedin: RESUME.linkedin,
  github: "https://github.com/pspcps",
  portfolio: PORTFOLIO_URL,
  summary(years = getCareerDuration().years) {
    return `Senior Software Engineer with ${years}+ years building full-stack applications, backend microservices and event-driven systems. Specializes in React, Node.js, TypeScript, Kafka and PostgreSQL on AWS and Google Cloud. Led 4–6 engineers; designed a platform saving ~$1M annually. Builds multi-agent AI and retrieval-augmented generation (RAG) solutions.`;
  },
  skills: [
    [
      "Languages & frameworks",
      "TypeScript, JavaScript, Node.js, NestJS, React, Python, Go, C#, F#, GraphQL",
    ],
    [
      "Messaging & databases",
      "Apache Kafka, RabbitMQ, AWS SQS, MQTT, PostgreSQL, MySQL, MongoDB, Redis, Snowflake, T-SQL",
    ],
    [
      "Cloud & delivery",
      "AWS, Google Cloud (GCP), Docker, Kubernetes, GitLab CI/CD, Jenkins, Grafana, OpsGenie",
    ],
    [
      "Applied AI",
      "AWS Bedrock, Claude, Gemini, Vertex AI, Strands Agents SDK, MCP, LangChain, Ollama, ChromaDB",
    ],
  ],
  experience: [
    {
      company: "Lytx India Technologies",
      role: "Senior Software Engineer (SDE III)",
      period: "Oct 2024 – Present",
      bullets: [
        "Architected a high-throughput OpenStreetMap/Redis reverse-geocoding service, replacing Google Maps API usage and saving ~$1M per year.",
        "Built an AI-driven diagnostic tool using device connectivity and movement data, accelerating support issue resolution by 40%.",
        "Reduced non-critical alert noise by 60%; introduced batched database inserts, reducing database errors by 60–70%.",
      ],
    },
    {
      company: "Pluralsight India Pvt. Ltd.",
      role: "Software Engineer (SDE II / SDE III)",
      period: "Nov 2022 – Oct 2024",
      bullets: [
        "Designed Kafka content-tracking pipelines with exactly-once/at-least-once semantics; monitored consumer health and lag using Grafana and OpsGenie.",
        "Optimized 100+ complex SQL queries, reducing execution times by 60–70%.",
      ],
    },
    {
      company: "EGVERSE Technology Solutions",
      role: "Software Engineer",
      period: "Mar 2022 – Oct 2022",
      bullets: [
        "Migrated 2M+ records from MongoDB to PostgreSQL with zero data loss; improved Snowflake analytics query performance by 20%.",
      ],
    },
    {
      company: "Reliable Soft Technologies",
      role: "Software Engineer / Tech Lead",
      period: "Jan 2017 – Mar 2022",
      bullets: [
        "Delivered Node.js/React CRM platforms and Kafka bulk-file ingestion pipelines; integrated payment gateways across 3+ enterprise systems.",
        "Automated SQL Service Broker workflows and optimized database triggers, improving performance by 50%.",
      ],
    },
  ],
  projects: [
    {
      name: "FleetMind",
      tech: "Python, FastAPI, AWS Bedrock, MCP, React",
      url: null,
      detail:
        "Built a Claude orchestrator and MCP-connected agents for read-only DynamoDB, MySQL and New Relic queries, with a React dashboard and CLI.",
    },
    DRISHTI_PROJECT,
    {
      name: "PSDevTool",
      tech: "React, TypeScript, Monaco Editor, Web Workers",
      url: "https://github.com/pspcps/diffwise",
      detail:
        "Built 20 browser tools for code comparison, structured-data inspection, API workflows and file processing, with searchable navigation and persistent themes.",
    },
    {
      name: "Kafbat UI",
      tech: "Go, Kafka, Next.js, Python, Kubernetes",
      url: "https://github.com/pspcps/kafkaUI",
      detail:
        "Built Kafka administration and replication workflows with Kubernetes-managed consumers and PostgreSQL, MySQL, SQL Server and MongoDB adapters.",
    },
  ],
  contribution: {
    text: "Liquibase: merged PostgreSQL SQL-generation fix for GENERATED ALWAYS AS computed columns (PR #2102).",
    url: "https://github.com/liquibase/liquibase/pull/2102",
  },
  education: RESUME.education,
  certification: "AWS Cloud Practitioner",
};
export const LEGAL_PROJECTS = [
  ...PRINT_RESUME.projects,
  {
    name: "ApiDesk Studio",
    tech: "React, Node.js, Express, Electron",
    url: "https://github.com/pspcps/ApiDesk-Studio",
    detail:
      "Built REST/GraphQL workflows, a local request proxy, Autocannon load testing and regression execution with streamed logs.",
  },
];
export const ADDITIONAL_CONTRIBUTIONS = [
  "FreeRADIUS: customized database behavior and functionality for Fair Usage Policy implementation.",
  "Mikro-Node: fixed bugs and enhanced APIs for MikroTik device integration.",
  "jQuery-Draggable: modified core drag-and-drop behavior for a custom use case.",
];
export type ResumePaper = "a4" | "legal";
export type ResumeTemplate = {
  id: string;
  name: string;
  description: string;
  columns: 1 | 2;
  style: string;
  accent: string;
};
export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description:
      "Traditional typography, clear rules and a straightforward reading order.",
    columns: 1,
    style: "classic",
    accent: "#263c35",
  },
  {
    id: "modern",
    name: "Modern",
    description: "A contemporary teal accent with clean, balanced spacing.",
    columns: 1,
    style: "modern",
    accent: "#14685b",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Confident serif headings and a restrained navy palette.",
    columns: 1,
    style: "executive",
    accent: "#233d61",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Quiet monochrome styling that puts your achievements first.",
    columns: 1,
    style: "minimal",
    accent: "#262626",
  },
  {
    id: "technical",
    name: "Technical",
    description:
      "Precise section labels and an engineering-inspired typographic rhythm.",
    columns: 1,
    style: "technical",
    accent: "#344d70",
  },
  {
    id: "compact",
    name: "Compact",
    description:
      "A concise, readable layout with room for substantial experience.",
    columns: 1,
    style: "compact",
    accent: "#5d415e",
  },
  {
    id: "sidebar",
    name: "Sidebar",
    description:
      "A soft teal skills rail beside your experience and engineering projects.",
    columns: 2,
    style: "sidebar",
    accent: "#14685b",
  },
  {
    id: "editorial",
    name: "Editorial",
    description:
      "Serif character and a warm paper-inspired two-column composition.",
    columns: 2,
    style: "editorial",
    accent: "#73503b",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description:
      "Navy accents and distinct section dividers for a technical presentation.",
    columns: 2,
    style: "blueprint",
    accent: "#254a78",
  },
  {
    id: "studio",
    name: "Studio",
    description:
      "A bold plum masthead with a light sidebar and clean body text.",
    columns: 2,
    style: "studio",
    accent: "#674264",
  },
];

/** An editorial formatting heuristic, never an ATS vendor result or job-match score. */
export function estimateResumeFormatting(template: ResumeTemplate) {
  const checks = [
    { label: "Selectable text", points: 25, maximum: 25 },
    { label: "Standard section headings", points: 20, maximum: 20 },
    { label: "Visible contact links", points: 10, maximum: 10 },
    { label: "Conventional typography", points: 10, maximum: 10 },
    {
      label: "Reading order",
      points: template.columns === 1 ? 20 : 5,
      maximum: 25,
    },
    { label: "Text and links in PDF export", points: 10, maximum: 10 },
  ];
  return {
    score: checks.reduce((sum, check) => sum + check.points, 0),
    checks,
  };
}
