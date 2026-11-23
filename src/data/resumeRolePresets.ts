import type { ResumeContent } from "./resumeDraft";
import type { ResumePaper } from "./printResume";
import { LEGAL_PROJECTS } from "./printResume";
export const RESUME_ROLES = [
  {
    id: "general",
    name: "Common / General",
    focus:
      "A balanced overview of full-stack, backend, cloud and applied AI work.",
  },
  {
    id: "backend",
    name: "Backend Engineer",
    focus: "Services, event pipelines, SQL performance and data migrations.",
  },
  {
    id: "cloud",
    name: "Cloud Engineer",
    focus:
      "Cloud applications, containers, Kubernetes and operational visibility.",
  },
  {
    id: "ai",
    name: "Applied AI Engineer",
    focus:
      "Agent orchestration, retrieval and AI integration with real applications.",
  },
  {
    id: "fullstack",
    name: "Full-Stack Developer",
    focus: "React interfaces connected to APIs, data and complete workflows.",
  },
  {
    id: "architect",
    name: "Software Architect",
    focus: "System boundaries, event-driven designs and technical trade-offs.",
  },
  {
    id: "forward-deployed",
    name: "Forward-Deployed Engineer",
    focus: "Hands-on integrations, diagnostics and end-to-end delivery.",
  },
] as const;
export type ResumeRoleId = (typeof RESUME_ROLES)[number]["id"];
export const isResumeRole = (id: unknown): id is ResumeRoleId =>
  RESUME_ROLES.some((r) => r.id === id);
const projects: Record<string, ResumeContent["projects"][number]> =
  Object.fromEntries(LEGAL_PROJECTS.map((p) => [p.name, p]));
projects["Ask My Docs"] = {
  name: "Ask My Docs",
  tech: "Python, Streamlit, Flask, SQLite, NumPy, Ollama",
  url: "https://github.com/pspcps/ask-my-docs",
  detail:
    "Built versioned SQLite-backed RAG with durable indexing, page/excerpt citations, abstention and a recorded eight-question Ollama evaluation.",
};
projects["Resume AI"] = {
  name: "Resume AI",
  tech: "React, TypeScript, Firebase, Vertex AI, Gemini",
  url: "https://github.com/pspcps/resume-ai",
  detail:
    "Built a bounded Gemini agent with source-validated resume evidence, verified identity, approved rewrites and PSDevTool-compatible profile export.",
};
const summaries: Record<
  Exclude<ResumeRoleId, "general">,
  (years: number) => string
> = {
  backend: (y) =>
    `Senior software engineer with ${y}+ years building Node.js and TypeScript services, Kafka pipelines and SQL-backed applications. Designed reverse geocoding with OpenStreetMap and Redis, saving approximately $1M annually; optimized 100+ SQL queries and migrated 2M+ records. Works across API design, data integration and operational diagnostics.`,
  cloud: (y) =>
    `Senior software engineer with ${y}+ years of experience in application engineering. Builds services on AWS and Google Cloud, with Docker, Kubernetes-managed data workers and Grafana and OpsGenie monitoring. Designed an OpenStreetMap/Redis service saving approximately $1M annually; builds containerized agent APIs and cloud-connected React applications.`,
  ai: (y) =>
    `Senior software engineer with ${y}+ years in application engineering, with recent applied AI work in Bedrock/Claude agents, MCP integrations and local RAG. Builds React interfaces, evidence-backed tool workflows and versioned document retrieval with Ollama, SQLite and NumPy. Delivered AI-assisted operational diagnostics.`,
  fullstack: (y) =>
    `Senior software engineer with ${y}+ years building React applications and Node.js/TypeScript services backed by Kafka and SQL databases. Delivered CRM platforms and payment integrations across 3+ enterprise systems. Builds complete browser and cloud workflows, including developer tools, AI-assisted applications and API clients.`,
  architect: (y) =>
    `Senior software engineer with ${y}+ years designing backend services, event-driven data flows and full-stack applications. Led teams of 4–6 engineers; designed an OpenStreetMap/Redis platform saving approximately $1M annually. Experience spans Kafka integration, database migration, cloud applications and multi-agent system boundaries.`,
  "forward-deployed": (y) =>
    `Senior software engineer with ${y}+ years turning integration and operational problems into working applications. Delivered React/Node.js CRM systems, payment integrations and AI-assisted diagnostics that accelerated issue resolution by 40%. Combines backend, cloud and applied AI skills to connect data sources, build interfaces and investigate failures.`,
};
const titles: Record<Exclude<ResumeRoleId, "general">, string> = {
  backend:
    "Senior Backend Engineer | Node.js, TypeScript & Distributed Systems",
  cloud: "Cloud Engineer | AWS, Google Cloud & Backend Services",
  ai: "Applied AI Engineer | AI Agents, RAG & Full-Stack Integration",
  fullstack: "Senior Full-Stack Developer | React, Node.js & TypeScript",
  architect: "Software Architect | Backend, Event-Driven & Cloud Systems",
  "forward-deployed":
    "Forward-Deployed Engineer | Full-Stack, Cloud & Applied AI",
};
const skills: Record<Exclude<ResumeRoleId, "general">, string[][]> = {
  backend: [
    ["Backend", "Node.js, TypeScript, JavaScript, NestJS, GraphQL, Python, Go"],
    [
      "Data & messaging",
      "Apache Kafka, PostgreSQL, MySQL, MongoDB, Redis, RabbitMQ, AWS SQS, T-SQL",
    ],
    [
      "Cloud & operations",
      "AWS, Google Cloud, Docker, Kubernetes, Grafana, OpsGenie, GitLab CI/CD",
    ],
    ["Application integration", "React, REST APIs, MCP, AWS Bedrock"],
  ],
  cloud: [
    ["Cloud platforms", "AWS, Google Cloud (GCP), AWS Bedrock, Vertex AI"],
    ["Containers & delivery", "Docker, Kubernetes, GitLab CI/CD, Jenkins"],
    [
      "Services & data",
      "Node.js, TypeScript, Python, Go, Apache Kafka, PostgreSQL, DynamoDB, Redis",
    ],
    [
      "Observability & interfaces",
      "Grafana, OpsGenie, New Relic, React, FastAPI",
    ],
  ],
  ai: [
    [
      "Agents & models",
      "AWS Bedrock, Claude, Gemini, Vertex AI, Strands Agents SDK, MCP / FastMCP",
    ],
    [
      "Retrieval & applications",
      "Ollama, SQLite, NumPy, ChromaDB, document retrieval, evaluation, React",
    ],
    [
      "Languages & APIs",
      "Python, TypeScript, JavaScript, FastAPI, Node.js, Firebase Functions",
    ],
    [
      "Data & deployment",
      "DynamoDB, MySQL, PostgreSQL, Firestore, Docker, Google Cloud",
    ],
  ],
  fullstack: [
    ["Frontend", "React, Next.js, TypeScript, JavaScript, browser APIs"],
    [
      "Backend & integration",
      "Node.js, NestJS, Express, REST APIs, GraphQL, Python",
    ],
    [
      "Data & messaging",
      "PostgreSQL, MySQL, MongoDB, Redis, Apache Kafka, Firebase / Firestore",
    ],
    [
      "Cloud & delivery",
      "AWS, Google Cloud, Docker, Kubernetes, GitLab CI/CD, Jenkins",
    ],
  ],
  architect: [
    [
      "Architecture",
      "Event-driven services, API integration, data pipelines, full-stack applications",
    ],
    ["Implementation", "Node.js, TypeScript, React, Python, Go, GraphQL"],
    [
      "Data platforms",
      "Apache Kafka, PostgreSQL, MySQL, MongoDB, Redis, Snowflake",
    ],
    [
      "Cloud & operations",
      "AWS, Google Cloud, Docker, Kubernetes, Grafana, OpsGenie",
    ],
  ],
  "forward-deployed": [
    [
      "Application delivery",
      "React, TypeScript, Node.js, Python, FastAPI, REST APIs",
    ],
    [
      "AI integration",
      "AWS Bedrock, Claude, Gemini, MCP, LangChain, Ollama, ChromaDB",
    ],
    [
      "Operational data",
      "DynamoDB, MySQL, PostgreSQL, Apache Kafka, New Relic",
    ],
    [
      "Cloud & tooling",
      "AWS, Google Cloud, Docker, API clients, CLI workflows",
    ],
  ],
};
const order: Record<Exclude<ResumeRoleId, "general">, string[]> = {
  backend: [
    "KafkaUI",
    "FleetMind",
    "ApiDesk Studio",
    "PSDevTool",
    "Project Drishti",
  ],
  cloud: [
    "KafkaUI",
    "FleetMind",
    "Project Drishti",
    "ApiDesk Studio",
    "PSDevTool",
  ],
  ai: ["FleetMind", "Project Drishti", "Ask My Docs", "Resume AI", "PSDevTool"],
  fullstack: [
    "PSDevTool",
    "Project Drishti",
    "KafkaUI",
    "ApiDesk Studio",
    "FleetMind",
  ],
  architect: [
    "KafkaUI",
    "FleetMind",
    "ApiDesk Studio",
    "PSDevTool",
    "Project Drishti",
  ],
  "forward-deployed": [
    "FleetMind",
    "Project Drishti",
    "ApiDesk Studio",
    "PSDevTool",
    "KafkaUI",
  ],
};
export function specializeResume(
  content: ResumeContent,
  role: ResumeRoleId,
  paper: ResumePaper,
  years: number,
): ResumeContent {
  if (role === "general") return content;
  const next = structuredClone(content);
  next.title = titles[role];
  next.summary = summaries[role](years);
  next.skills = structuredClone(skills[role]);
  next.projects =
    paper === "legal"
      ? [
          ...new Set([...order[role], ...LEGAL_PROJECTS.map((p) => p.name)]),
        ].flatMap((name) => {
          const project = LEGAL_PROJECTS.find((p) => p.name === name);
          return project ? [structuredClone(project)] : [];
        })
      : order[role].slice(0, 4).map((name) => structuredClone(projects[name]));
  // Target roles change emphasis, never employers, dates or held job titles.
  if (role === "backend" || role === "cloud" || role === "architect") {
    const first = next.experience[0];
    const diagnostic = first.bullets.find((b) => b.startsWith("Built an AI"));
    if (diagnostic)
      first.bullets = [
        ...first.bullets.filter((b) => b !== diagnostic),
        diagnostic,
      ];
  } else if (role === "ai" || role === "forward-deployed") {
    const first = next.experience[0];
    const diagnostic = first.bullets.find((b) => b.startsWith("Built an AI"));
    if (diagnostic)
      first.bullets = [
        diagnostic,
        ...first.bullets.filter((b) => b !== diagnostic),
      ];
  }
  return next;
}
