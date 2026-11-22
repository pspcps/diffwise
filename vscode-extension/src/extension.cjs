"use strict";
const vscode = require("vscode");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { validateMessage, renderWebview, MAX_TEXT } = require("./protocol.cjs");
const catalog = require("../media/catalog.json");
function activate(context) {
  let panel;
  const open = (tool = "text", selection) => {
    if (!catalog.some((t) => t.id === tool)) tool = "text";
    if (panel) {
      panel.reveal(vscode.ViewColumn.Active);
      panel.webview.postMessage({ type: "navigate", tool, selection });
      return panel;
    }
    const appRoot = vscode.Uri.joinPath(context.extensionUri, "media", "app");
    panel = vscode.window.createWebviewPanel(
      "psdevtool.workspace",
      "PSDevTool",
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [appRoot],
      },
    );
    configure(panel, tool, selection);
    return panel;
  };
  function configure(current, initialTool = "text", selection) {
    panel = current;
    const appRoot = vscode.Uri.joinPath(context.extensionUri, "media", "app");
    current.webview.options = {
      enableScripts: true,
      localResourceRoots: [appRoot],
    };
    let pendingSelection = selection;
    current.onDidDispose(
      () => {
        if (panel === current) panel = undefined;
      },
      null,
      context.subscriptions,
    );
    let inFlight = 0;
    current.webview.onDidReceiveMessage(
      async (input) => {
        if (inFlight >= 4) {
          await current.webview.postMessage({
            type: "response",
            id: input?.id,
            error: "Too many pending requests. Finish the open dialog first.",
          });
          return;
        }
        inFlight++;
        try {
          const m = validateMessage(input);
          let result;
          switch (m.type) {
            case "ready":
              await current.webview.postMessage({
                type: "navigate",
                tool: initialTool,
                selection: pendingSelection,
              });
              pendingSelection = undefined;
              break;
            case "clipboardRead":
              result = await vscode.env.clipboard.readText();
              if (Buffer.byteLength(result) > MAX_TEXT)
                throw new Error("Clipboard exceeds the 2 MB limit.");
              break;
            case "clipboardWrite":
              await vscode.env.clipboard.writeText(m.text);
              break;
            case "newDocument": {
              const doc = await vscode.workspace.openTextDocument({
                content: m.text,
              });
              await vscode.window.showTextDocument(doc, {
                preview: false,
                viewColumn: vscode.ViewColumn.Beside,
              });
              break;
            }
            case "save": {
              const target = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.joinPath(
                  vscode.Uri.file(require("node:os").homedir()),
                  m.name,
                ),
                saveLabel: "Save export",
              });
              if (!target) {
                result = { cancelled: true };
                break;
              }
              await vscode.workspace.fs.writeFile(
                target,
                Buffer.from(m.base64, "base64"),
              );
              result = { cancelled: false };
              if (
                m.print === true &&
                target.path.toLowerCase().endsWith(".html")
              ) {
                const choice = await vscode.window.showInformationMessage(
                  "Saved printable HTML. Open it in a browser, then choose Print → Save as PDF. Disable browser headers and footers.",
                  "Open in browser",
                );
                if (choice) await vscode.env.openExternal(target);
              } else
                vscode.window.setStatusBarMessage(
                  "PSDevTool: export saved.",
                  4000,
                );
              break;
            }
            case "openExternal":
              result = await vscode.env.openExternal(vscode.Uri.parse(m.url));
              break;
          }
          await current.webview.postMessage({
            type: "response",
            id: m.id,
            result,
          });
        } catch (error) {
          await current.webview.postMessage({
            type: "response",
            id: input?.id,
            error:
              error instanceof Error ? error.message : "Toolkit action failed.",
          });
        } finally {
          inFlight--;
        }
      },
      null,
      context.subscriptions,
    );
    const html = fs.readFileSync(
      vscode.Uri.joinPath(appRoot, "vscode-webview.html").fsPath,
      "utf8",
    );
    current.webview.html = renderWebview({
      html,
      base: current.webview.asWebviewUri(appRoot).toString(),
      cspSource: current.webview.cspSource,
      nonce: crypto.randomBytes(24).toString("hex"),
      tool: initialTool,
    });
  }
  const choose = async () => {
    const choice = await vscode.window.showQuickPick(
      catalog.map((t) => ({
        label: t.name,
        description: t.category,
        id: t.id,
      })),
      {
        placeHolder: "Choose one of 20 PSDevTool tools",
        matchOnDescription: true,
      },
    );
    if (choice) open(choice.id);
  };
  context.subscriptions.push(
    vscode.commands.registerCommand("psdevtool.open", (tool) =>
      open(typeof tool === "string" ? tool : "text"),
    ),
    vscode.commands.registerCommand("psdevtool.chooseTool", choose),
    vscode.commands.registerCommand("psdevtool.openSelection", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selection.isEmpty) {
        vscode.window.showInformationMessage("Select text in an editor first.");
        return;
      }
      const text = editor.document.getText(editor.selection);
      if (Buffer.byteLength(text) > MAX_TEXT) {
        vscode.window.showWarningMessage("Select up to 2 MB of text.");
        return;
      }
      open("json", text);
    }),
    vscode.window.registerTreeDataProvider("psdevtool.tools", {
      getTreeItem: (item) => item,
      getChildren: (item) =>
        item
          ? catalog
              .filter((t) => t.category === item.label)
              .map((t) => {
                const leaf = new vscode.TreeItem(
                  t.name,
                  vscode.TreeItemCollapsibleState.None,
                );
                leaf.command = {
                  command: "psdevtool.open",
                  title: t.name,
                  arguments: [t.id],
                };
                leaf.iconPath = new vscode.ThemeIcon("tools");
                return leaf;
              })
          : [...new Set(catalog.map((t) => t.category))].map(
              (category) =>
                new vscode.TreeItem(
                  category,
                  vscode.TreeItemCollapsibleState.Expanded,
                ),
            ),
    }),
    vscode.window.registerWebviewPanelSerializer("psdevtool.workspace", {
      async deserializeWebviewPanel(restored, state) {
        configure(
          restored,
          catalog.some((t) => t.id === state?.tool) ? state.tool : "text",
        );
      },
    }),
  );
}
module.exports = { activate, deactivate() {} };
