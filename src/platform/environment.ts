/** Build-time separation: the hosted website never acquires VS Code privileges. */
declare const __PSDEVTOOL_VSCODE__: boolean;
export const IS_VSCODE =
  typeof __PSDEVTOOL_VSCODE__ !== "undefined" && __PSDEVTOOL_VSCODE__;
