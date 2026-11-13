import { TECHNOLOGY_ASSETS } from "../../data/technologyAssets";
const aliases: Record<string, string> = {
  nodejs: "nodejs",
  typescript: "typescript",
  nestjs: "nestjs",
  reactjs: "react",
  react: "react",
  graphql: "graphql",
  "c#": "csharp",
  "f#": "fsharp",
  kafka: "kafka",
  apachekafka: "kafka",
  rabbitmq: "rabbitmq",
  awssqs: "sqs",
  mqtt: "mqtt",
  postgresql: "postgresql",
  mysql: "mysql",
  mongodb: "mongodb",
  redis: "redis",
  "t-sql": "sqlserver",
  snowflake: "snowflake",
  aws: "aws",
  awsbedrock: "aws",
  gcp: "googlecloud",
  googlecloud: "googlecloud",
  docker: "docker",
  kubernetes: "kubernetes",
  "gitlabci/cd": "gitlab",
  jenkins: "jenkins",
  gemini: "gemini",
  vertexai: "googlecloud",
  mcp: "mcp",
  "mcp/fastmcp": "mcp",
  ollama: "ollama",
  langchain: "langchain",
  chromadb: "chroma",
  claude: "claude",
  python: "python",
  go: "go",
  rust: "rust",
  kotlin: "kotlin",
  javascript: "javascript",
  sqlite: "sqlite",
  fastapi: "fastapi",
  electron: "electron",
};
export default function TechnologyIcon({ name }: { name: string }) {
  const key = aliases[name.toLowerCase().replace(/[ .]/g, "")];
  return key && TECHNOLOGY_ASSETS.includes(key) ? (
    <span
      aria-hidden="true"
      className="technology-icon"
      style={{
        maskImage: `url(/technology/${key}.svg)`,
        WebkitMaskImage: `url(/technology/${key}.svg)`,
      }}
    />
  ) : (
    <span aria-hidden="true" className="technology-monogram">
      {name.replace(/[^A-Za-z0-9#]/g, "").slice(0, 2)}
    </span>
  );
}
