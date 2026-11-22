const assert = require("node:assert/strict");
exports.run = async () => {
  const vscode = require("vscode");
  const ext = vscode.extensions.getExtension("pspcps.psdevtool");
  assert.ok(ext);
  await ext.activate();
  const commands = await vscode.commands.getCommands(true);
  for (const c of [
    "psdevtool.open",
    "psdevtool.chooseTool",
    "psdevtool.openSelection",
  ])
    assert.ok(commands.includes(c));
  const panel = await vscode.commands.executeCommand("psdevtool.open", "json");
  assert.ok(panel);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Webview did not send ready")),
      20000,
    );
    const sub = panel.webview.onDidReceiveMessage((m) => {
      if (m.type === "ready") {
        clearTimeout(timer);
        sub.dispose();
        resolve();
      }
    });
  });
  console.log(
    "PASS native extension activation, registered commands and real webview ready handshake",
  );
  panel.dispose();
};
