const fs = require("node:fs");
const tools = JSON.parse(fs.readFileSync("src/seo/tool-pages.json", "utf8"));
const categories = {
  "Compare & format": ["text", "json", "file", "regex", "markup", "case"],
  "Inspect & debug": ["api", "har", "jwt", "debug"],
  "Create & transform": [
    "architecture",
    "pdf",
    "image_studio",
    "base64",
    "resume",
  ],
  "Calculate & convert": ["uuid", "time", "distance", "measure", "url"],
};
const catalog = Object.entries(categories).flatMap(([category, ids]) =>
  ids.map((id) => {
    const t =
      id === "resume"
        ? { name: "Resume Builder", path: "/resume/" }
        : tools.find((t) => t.id === id);
    if (!t) throw new Error(`Missing tool ${id}`);
    return { id, name: t.name, path: t.path, category };
  }),
);
if (catalog.length !== 20 || new Set(catalog.map((t) => t.id)).size !== 20)
  throw new Error("Expected 20 tools");
fs.writeFileSync(
  "vscode-extension/media/catalog.json",
  JSON.stringify(catalog, null, 2) + "\n",
);
console.log("Generated VS Code catalog: 20 tools.");
