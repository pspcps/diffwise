import Editor, { type EditorProps } from "@monaco-editor/react";
import { defineEditorTheme, EDITOR_THEME } from "./editorTheme";
export default function CodeEditor({
  beforeMount,
  options,
  ...props
}: EditorProps) {
  return (
    <Editor
      {...props}
      theme={EDITOR_THEME}
      options={{
        fontSize: 13,
        lineHeight: 22,
        padding: { top: 16 },
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true },
        ...options,
      }}
      beforeMount={(monaco) => {
        defineEditorTheme(monaco);
        beforeMount?.(monaco);
      }}
    />
  );
}
