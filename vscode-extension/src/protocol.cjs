"use strict";
const MAX_BYTES = 32 * 1024 * 1024;
const MAX_TEXT = 2 * 1024 * 1024;
const actions = new Set([
  "ready",
  "clipboardRead",
  "clipboardWrite",
  "save",
  "newDocument",
  "openExternal",
]);
function validateMessage(value) {
  if (
    !value ||
    typeof value !== "object" ||
    !Number.isSafeInteger(value.id) ||
    value.id < 1 ||
    !actions.has(value.type)
  )
    throw new Error("Invalid toolkit message.");
  if (
    ["clipboardWrite", "newDocument"].includes(value.type) &&
    (typeof value.text !== "string" || Buffer.byteLength(value.text) > MAX_TEXT)
  )
    throw new Error("Text exceeds the 2 MB limit.");
  if (value.type === "save") {
    if (
      typeof value.base64 !== "string" ||
      value.base64.length > Math.ceil(MAX_BYTES / 3) * 4 ||
      value.base64.length % 4 !== 0 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(value.base64)
    )
      throw new Error("Invalid file or file exceeds the 32 MB export limit.");
    if (
      typeof value.name !== "string" ||
      !value.name ||
      value.name.length > 160 ||
      /[\\/\x00-\x1f<>:"|?*]/.test(value.name) ||
      /^\.+$/.test(value.name)
    )
      throw new Error("Invalid export filename.");
  }
  if (value.type === "openExternal") {
    if (typeof value.url !== "string" || value.url.length > 8192)
      throw new Error("Invalid external link.");
    const url = new URL(value.url);
    if (!["https:", "http:", "mailto:"].includes(url.protocol))
      throw new Error("Unsupported external link.");
  }
  return value;
}
const escapeHtml = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function renderWebview({ html, base, cspSource, nonce, tool }) {
  const policy = `default-src 'none'; script-src ${cspSource} 'nonce-${nonce}'; style-src ${cspSource} 'unsafe-inline'; img-src ${cspSource} https: http: data: blob:; font-src ${cspSource} data:; connect-src ${cspSource} https: http:; worker-src ${cspSource} blob:; frame-src 'self' blob: data:; media-src ${cspSource} blob: data:;`;
  return html.replace(
    "<head>",
    `<head><meta http-equiv="Content-Security-Policy" content="${escapeHtml(policy)}"><base href="${escapeHtml(base)}/"><script nonce="${nonce}">window.__PSDEVTOOL_INITIAL_TOOL__=${JSON.stringify(tool)};</script>`,
  );
}
module.exports = { MAX_BYTES, MAX_TEXT, validateMessage, renderWebview };
