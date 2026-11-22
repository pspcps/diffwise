const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  validateMessage,
  renderWebview,
  MAX_TEXT,
} = require("../src/protocol.cjs");
const catalog = require("../media/catalog.json");
test("host rejects executable external URLs and arbitrary filesystem paths", () => {
  for (const url of [
    "command:workbench.action.closeWindow",
    "file:///etc/passwd",
    "vscode://file/test",
    "javascript:alert(1)",
  ])
    assert.throws(() => validateMessage({ id: 1, type: "openExternal", url }));
  for (const name of [
    "../outside.txt",
    "folder\\outside.txt",
    "..",
    "bad\u0000.txt",
  ])
    assert.throws(() =>
      validateMessage({ id: 1, type: "save", name, base64: "YQ==" }),
    );
  assert.equal(
    validateMessage({
      id: 1,
      type: "openExternal",
      url: "https://github.com/pspcps/diffwise",
    }).type,
    "openExternal",
  );
});
test("payload limits reject malformed/oversized files and text", () => {
  assert.throws(() =>
    validateMessage({
      id: 1,
      type: "save",
      name: "a.txt",
      base64: "%not-base64",
    }),
  );
  assert.throws(() =>
    validateMessage({ id: 1, type: "newDocument", text: "é".repeat(MAX_TEXT) }),
  );
  assert.throws(() => validateMessage({ id: 0, type: "ready" }));
  assert.throws(() =>
    validateMessage({ id: 1, type: "runCommand", command: "dangerous" }),
  );
  assert.equal(
    validateMessage({
      id: 3,
      type: "save",
      name: "large.bin",
      base64: Buffer.alloc(4 * 1024 * 1024).toString("base64"),
    }).type,
    "save",
  );
  assert.equal(
    validateMessage({
      id: 2,
      type: "save",
      name: "report.json",
      base64: "e30=",
    }).name,
    "report.json",
  );
});
test("webview has local resource base and CSP without remote scripts/eval", () => {
  const h = renderWebview({
    html: "<html><head></head><body></body></html>",
    base: "https://local.invalid/app",
    cspSource: "https://local.invalid",
    nonce: "abc123",
    tool: "json",
  });
  assert.ok(h.includes("default-src &#39;none&#39;"));
  assert.ok(h.includes('<base href="https://local.invalid/app/">'));
  assert.ok(!h.includes("unsafe-eval"));
  assert.ok(h.includes('window.__PSDEVTOOL_INITIAL_TOOL__="json"'));
});
test("extension catalog retains every tool and stable unique IDs", () => {
  assert.equal(catalog.length, 20);
  assert.equal(new Set(catalog.map((t) => t.id)).size, 20);
  const site = require("../../src/seo/tool-pages.json");
  assert.deepEqual(
    catalog.map((t) => t.id).sort(),
    [...site.map((t) => t.id), "resume"].sort(),
  );
});
