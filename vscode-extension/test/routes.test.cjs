const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  ts = require("typescript");
require.extensions[".ts"] = (m, f) =>
  m._compile(
    ts.transpileModule(fs.readFileSync(f, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
        resolveJsonModule: true,
      },
    }).outputText,
    f,
  );
global.__PSDEVTOOL_VSCODE__ = true;
const { resolveLocation, navigateTo } = require("../../src/seo/routes.ts");
test("webview resolves canonical nested resume and tool routes from hash", () => {
  const base = {
    pathname: "/index.html",
    search: "?extensionId=pspcps.psdevtool",
  };
  assert.equal(
    resolveLocation({ ...base, hash: "#/tools/json-formatter/" }).page.id,
    "json",
  );
  assert.equal(
    resolveLocation({ ...base, hash: "#/resume/modern/legal/" }).page.id,
    "resume-modern-legal",
  );
  const route = resolveLocation({
    ...base,
    hash: "#/tools/distance-calculator/?lat1=10&lon1=20",
  });
  assert.equal(route.page.id, "distance");
  assert.equal(route.search, "?lat1=10&lon1=20");
  assert.equal(route.legacy, false);
});
test("webview navigation uses document origin instead of cross-origin resource base", () => {
  const original = "vscode-webview://example/index.html?id=123";
  let target;
  global.window = {
    location: { href: original + "#/tools/json-formatter/" },
    dispatchEvent: () => {},
  };
  global.history = {
    pushState: (_a, _b, url) => {
      target = url;
    },
  };
  global.PopStateEvent = class {};
  navigateTo("/resume/modern/");
  assert.equal(target, original + "#/resume/modern/");
  target = undefined;
  navigateTo("//untrusted.invalid/");
  assert.equal(target, undefined);
});
