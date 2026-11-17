import type { Monaco } from "@monaco-editor/react";
export const EDITOR_THEME = "psdev-spatial";
export function defineEditorTheme(monaco: Monaco) {
  if (
    !monaco.languages
      .getLanguages()
      .some((language: { id: string }) => language.id === "dotenv")
  ) {
    monaco.languages.register({ id: "dotenv", aliases: ["ENV"] });
    monaco.languages.setMonarchTokensProvider("dotenv", {
      tokenizer: {
        root: [
          [/^\s*(?:#|\/\/).*$/, "comment"],
          [/^\s*(?:export\s+)?[A-Za-z_][A-Za-z0-9_.]*(?=\s*[=:])/, "type"],
          [/[=:]/, { token: "delimiter", next: "@value" }],
        ],
        value: [
          [/\s*(?:true|false|null)\s*$/, { token: "keyword", next: "@pop" }],
          [/\s*-?\d+(?:\.\d+)?\s*$/, { token: "number", next: "@pop" }],
          [/.*$/, { token: "string", next: "@pop" }],
        ],
      },
    });
  }
  monaco.editor.defineTheme(EDITOR_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "E4EBDD" },
      { token: "comment", foreground: "8F9E89", fontStyle: "italic" },
      { token: "string.key.json", foreground: "A9D9F5" },
      { token: "string.value.json", foreground: "C8EDB6" },
      { token: "string", foreground: "C8EDB6" },
      { token: "number", foreground: "F3C18E" },
      { token: "keyword", foreground: "CEB8F6" },
      { token: "delimiter", foreground: "B3C0AA" },
      { token: "type", foreground: "A9D9F5" },
    ],
    colors: {
      "editor.background": "#141A16",
      "editor.foreground": "#E4EBDD",
      "editorLineNumber.foreground": "#7D8F79",
      "editorLineNumber.activeForeground": "#C8EDB6",
      "editor.selectionBackground": "#C8EDB630",
      "editor.lineHighlightBackground": "#C8EDB609",
      "editorCursor.foreground": "#C8EDB6",
      "editorIndentGuide.background1": "#334232",
      "editorBracketHighlight.foreground1": "#F3D58C",
      "editorBracketHighlight.foreground2": "#CEB8F6",
      "editorBracketHighlight.foreground3": "#8DDACB",
      "diffEditor.insertedTextBackground": "#A5D89125",
      "diffEditor.removedTextBackground": "#F19AA625",
      "diffEditor.insertedLineBackground": "#A5D89110",
      "diffEditor.removedLineBackground": "#F19AA610",
    },
  });
}
