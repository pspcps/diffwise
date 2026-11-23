import { RESUME } from "./resumeData";
import { getCareerDuration } from "../utils/careerDuration";
export const PORTFOLIO_URL = "https://psdevtool.online/portfolio/";
const DRISHTI_PROJECT = {
  name: "Project Drishti",
  tech: "React, FastAPI, Vertex AI, Gemini",
  url: "https://github.com/pspcps/Agentic-Project-Drishti",
  detail:
    "Built validated still-image analysis with structured Gemini findings, uncertainty/error handling and a scripted evaluation for operator-led hazard review.",
};
export const PRINT_RESUME = {
  name: RESUME.name,
  title: "Senior Software Engineer | Full-Stack, Distributed Systems & Applied AI",
  email: RESUME.email,
  phone: RESUME.phone,
  linkedin: RESUME.linkedin,
  github: "https://github.com/pspcps",
  portfolio: PORTFOLIO_URL,
  summary(years = getCareerDuration().years) {
    return `Senior software engineer with ${years}+ years building React applications, Node.js/TypeScript services and Kafka data pipelines on AWS and Google Cloud. Led teams of 4–6 engineers; designed reverse geocoding with OpenStreetMap and Redis, saving approximately $1M annually. Recent projects include multi-agent AI and retrieval-augmented generation (RAG).`;
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
      role: "Senior Software Engineer",
      period: "Oct 2024 – Present",
      bullets: [
        "Architected an OpenStreetMap/Redis reverse-geocoding service, replacing Google Maps API usage and saving approximately $1M annually.",
        "Built an AI-driven diagnostic tool using device connectivity and movement data, accelerating support issue resolution by 40%.",
        "Reduced non-critical alert noise by 60% through event muting.",
        "Introduced batched database inserts, reducing database errors by 60–70%.",
      ],
    },
    {
      company: "Pluralsight India Pvt. Ltd.",
      role: "Software Engineer",
      period: "Nov 2022 – Oct 2024",
      bullets: [
        "Designed Kafka content-tracking pipelines; monitored consumer health and lag with Grafana and OpsGenie to investigate production issues.",
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
        "Built 20 browser tools with Monaco, worker-based processing and saved resume profiles; packaged a VS Code extension in an open PR.",
    },
    {
      name: "KafkaUI",
      tech: "Go, Kafka, Next.js, Python, Kubernetes",
      url: "https://github.com/pspcps/kafkaUI",
      detail:
        "Built a Go control plane and Kubernetes replication workers; added a development-branch PostgreSQL replay ledger and failure/recovery lab.",
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
  {
    ...PRINT_RESUME.projects[0],
    category: "Applied AI",
    detail:
      "Built Claude/MCP fleet diagnostics over DynamoDB, MySQL and New Relic, with a React dashboard.",
  },
  {
    ...DRISHTI_PROJECT,
    category: "Applied AI",
    detail:
      "Built validated Gemini image analysis with uncertainty handling, operator review and scripted regressions.",
  },
  {
    ...PRINT_RESUME.projects[3],
    category: "Backend & Developer Tools",
    detail:
      "Built Kafka administration and Kubernetes workers, plus a development-branch PostgreSQL replay guard and recovery lab.",
  },
  {
    ...PRINT_RESUME.projects[2],
    category: "Backend & Developer Tools",
    detail:
      "Built 20 browser tools with Monaco, worker-based processing and saved profiles; packaged a VS Code extension.",
  },
  {
    name: "Ask My Docs",
    tech: "Python, SQLite, NumPy, Ollama, Flask",
    url: "https://github.com/pspcps/ask-my-docs",
    detail:
      "Built versioned local RAG with durable indexing, page/excerpt citations, abstention and a recorded evaluation.",
    category: "Applied AI",
  },
  {
    name: "Wealth Management Portfolio Tracker",
    tech: "Kotlin, Compose, Room",
    url: "https://github.com/pspcps/Wealth-Management-Portfolio-Tracker",
    detail:
      "Built local portfolio and cash-flow tracking with XIRR/TWRR analytics, accounting rules and financial tests.",
    category: "Android Applications",
  },
  {
    name: "RentMeter",
    tech: "Kotlin, Compose, Room, CameraX, ML Kit",
    url: "https://github.com/pspcps1/RentMeter",
    detail:
      "Built a rental ledger with meter OCR, utility billing, tenant documents, reminders and portable backups.",
    category: "Android Applications",
  },
  {
    name: "ApiDesk Studio",
    tech: "React, Node.js, Express, Electron",
    url: "https://github.com/pspcps/ApiDesk-Studio",
    detail:
      "Built REST/GraphQL workflows, a local request proxy, load testing and regression execution with streamed logs.",
    category: "Backend & Developer Tools",
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
