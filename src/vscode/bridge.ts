import { navigateTo } from "../seo/routes";
import { toolPath } from "../seo/pages";
import { TOOLS } from "../data/tools";
import type { ViewMode } from "../types";

type HostApi = {
  postMessage(message: unknown): void;
  setState(state: unknown): void;
};
declare global {
  interface Window {
    acquireVsCodeApi?: () => HostApi;
    __PSDEVTOOL_INITIAL_TOOL__?: string;
  }
}
const api = window.acquireVsCodeApi?.();
let serial = 0;
const requests = new Map<
  number,
  {
    resolve: (v: unknown) => void;
    reject: (e: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();
export function request<T = unknown>(
  type: string,
  data: Record<string, unknown> = {},
): Promise<T> {
  if (!api) return Promise.reject(new Error("VS Code host is unavailable."));
  const id = ++serial;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      requests.delete(id);
      reject(new Error("VS Code action timed out. Please try again."));
    }, 300000);
    requests.set(id, { resolve: (v) => resolve(v as T), reject, timer });
    api.postMessage({ type, id, ...data });
  });
}
export function rememberView(tool: ViewMode) {
  api?.setState({ tool });
}
export function reportError(error: unknown) {
  window.dispatchEvent(
    new CustomEvent("psdevtool:notice", {
      detail: error instanceof Error ? error.message : "Action failed.",
    }),
  );
}
export function selectTool(id: string, selection?: string) {
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) return;
  navigateTo(toolPath(tool.id));
  if (selection !== undefined)
    window.dispatchEvent(
      new CustomEvent("psdevtool:selection", { detail: selection }),
    );
}
window.addEventListener("message", (event) => {
  const m = event.data;
  if (!m || typeof m !== "object") return;
  if (m.type === "response") {
    const pending = requests.get(m.id);
    if (!pending) return;
    clearTimeout(pending.timer);
    requests.delete(m.id);
    if (typeof m.error === "string") pending.reject(new Error(m.error));
    else pending.resolve(m.result);
  }
  if (m.type === "navigate" && typeof m.tool === "string")
    selectTool(
      m.tool,
      typeof m.selection === "string" ? m.selection : undefined,
    );
});

async function saveBlob(blob: Blob, name: string, print = false) {
  if (blob.size > 32 * 1024 * 1024)
    throw new Error("Export exceeds the 32 MB limit.");
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Cannot read export."));
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(blob);
  });
  return request<{ cancelled: boolean }>("save", { name, base64, print });
}
export async function exportPrintDocument(source: Document = document) {
  const clone = source.documentElement.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "script, iframe, object, embed, base, link, meta[http-equiv]",
    )
    .forEach((e) => e.remove());
  for (const element of clone.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      if (
        /^on/i.test(attribute.name) ||
        /^(javascript|command|vscode):/i.test(attribute.value.trim())
      )
        element.removeAttribute(attribute.name);
    }
  }
  // Print is a static snapshot; user-entered HTML and scripts cannot execute in it.
  let css = "";
  for (const sheet of [...source.styleSheets]) {
    try {
      css += [...sheet.cssRules].map((r) => r.cssText).join("\n");
    } catch {
      /* Cross-origin styles are excluded. */
    }
  }
  clone.querySelectorAll("style").forEach((e) => e.remove());
  const head = clone.querySelector("head")!;
  const policy = source.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content =
    "default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:;";
  head.prepend(policy);
  const style = source.createElement("style");
  style.textContent =
    css +
    "\n@media print { .vscode-toolbar, .vscode-notice, .vscode-selection { display:none!important } .vscode-workspace { height:auto!important;overflow:visible!important } }";
  head.append(style);
  const result = await saveBlob(
    new Blob(["<!doctype html>\n" + clone.outerHTML], { type: "text/html" }),
    "psdevtool-print.html",
    true,
  );
  if (!result.cancelled)
    window.dispatchEvent(
      new CustomEvent("psdevtool:notice", {
        detail:
          "Printable HTML saved. Open it in a browser and choose Print → Save as PDF.",
      }),
    );
}

export function installPlatformBridge() {
  if (!api) return;
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: (text: string) => request("clipboardWrite", { text }),
      readText: () => request<string>("clipboardRead"),
    },
  });
  // Existing tools create detached download anchors and revoke blob URLs immediately.
  // Capture the Blob synchronously, then send it through VS Code's Save dialog.
  const blobs = new Map<string, Blob>();
  const create = URL.createObjectURL.bind(URL),
    revoke = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = (value) => {
    const url = create(value);
    if (value instanceof Blob) blobs.set(url, value);
    return url;
  };
  URL.revokeObjectURL = (url) => {
    blobs.delete(url);
    revoke(url);
  };
  const download = (a: HTMLAnchorElement) => {
    const blob = blobs.get(a.href);
    const pending = blob
      ? Promise.resolve(blob)
      : fetch(a.href).then((r) => r.blob());
    void pending
      .then((b) => saveBlob(b, a.download || "export.txt"))
      .catch(reportError);
  };
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.hasAttribute("download")) download(this);
    else click.call(this);
  };
  document.addEventListener("click", (e) => {
    const anchor = (e.target as Element)?.closest?.("a");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const href = anchor.getAttribute("href") || "";
    if (anchor.hasAttribute("download")) {
      e.preventDefault();
      download(anchor);
      return;
    }
    if (e.defaultPrevented) return;
    if (href.startsWith("/") && !href.startsWith("//")) {
      e.preventDefault();
      if (
        href.startsWith("/portfolio") ||
        /^\/(about|contact|privacy|terms)\//.test(href)
      )
        void request("openExternal", {
          url: "https://psdevtool.online" + href,
        }).catch(reportError);
      else navigateTo(href);
    } else if (/^https?:|^mailto:/i.test(href)) {
      e.preventDefault();
      void request("openExternal", { url: href }).catch(reportError);
    }
  });
  window.print = () => {
    void exportPrintDocument().catch(reportError);
  };
}
export async function hostReady() {
  await request("ready");
}
