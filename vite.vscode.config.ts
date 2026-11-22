import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

export default defineConfig({
  define: { __PSDEVTOOL_VSCODE__: true },
  plugins: [
    react(),
    {
      name: "bundled-library-notices",
      generateBundle() {
        const packages = new Map<string, string>();
        for (const id of this.getModuleIds()) {
          if (!id.includes("/node_modules/")) continue;
          let dir = path.dirname(id.split("?")[0]);
          while (dir.includes("node_modules")) {
            const manifest = path.join(dir, "package.json");
            if (fs.existsSync(manifest)) {
              const pkg = JSON.parse(fs.readFileSync(manifest, "utf8"));
              if (pkg.name && pkg.version) {
                if (!packages.has(pkg.name)) {
                  const notices = fs
                    .readdirSync(dir)
                    .filter((name) =>
                      /^(licen[sc]e|copying|notice)([.-]|$)/i.test(name),
                    )
                    .filter((name) =>
                      fs.statSync(path.join(dir, name)).isFile(),
                    )
                    .map(
                      (name) =>
                        `${name}\n${fs.readFileSync(path.join(dir, name), "utf8")}`,
                    )
                    .join("\n\n");
                  packages.set(
                    pkg.name,
                    `${pkg.name} ${pkg.version}\nLicense: ${typeof pkg.license === "string" ? pkg.license : "See package license"}\n\n${notices}`,
                  );
                }
                break;
              }
            }
            dir = path.dirname(dir);
          }
        }
        this.emitFile({
          type: "asset",
          fileName: "THIRD_PARTY_NOTICES.txt",
          source:
            "Third-party package notices for the bundled PSDevTool webview.\n\n" +
            [...packages.values()]
              .sort()
              .join(
                "\n\n============================================================\n\n",
              ),
        });
      },
    },
  ],
  base: "./",
  publicDir: false,
  build: {
    outDir: "vscode-extension/media/app",
    emptyOutDir: true,
    rollupOptions: { input: "vscode-webview.html" },
  },
  worker: { format: "es" },
});
