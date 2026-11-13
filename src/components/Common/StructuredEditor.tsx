import { useRef, type TextareaHTMLAttributes } from "react";
import type { OnMount } from "@monaco-editor/react";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import CodeEditor from "./CodeEditor";
type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  onChange: (value: string) => void;
  language?: string;
};
export default function StructuredEditor({
  value,
  onChange,
  language = "json",
  "aria-label": label = "Code editor",
}: Props) {
  const editor = useRef<Parameters<OnMount>[0] | null>(null);
  return (
    <div className="structured-editor">
      <div className="fold-controls">
        <span>{language.toUpperCase()}</span>
        <button
          aria-label={`Fold all ${language}`}
          onClick={() => editor.current?.getAction("editor.foldAll")?.run()}
        >
          <ChevronsDownUp size={13} />
          <span>Fold</span>
        </button>
        <button
          aria-label={`Unfold all ${language}`}
          onClick={() => editor.current?.getAction("editor.unfoldAll")?.run()}
        >
          <ChevronsUpDown size={13} />
          <span>Unfold</span>
        </button>
      </div>
      <div className="structured-editor-body">
        <CodeEditor
          value={String(value ?? "")}
          language={language}
          onChange={(v) => onChange(v ?? "")}
          onMount={(e) => {
            editor.current = e;
          }}
          options={{
            ariaLabel: label,
            folding: true,
            showFoldingControls: "always",
            foldingHighlight: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            fontSize: 13,
            lineNumbersMinChars: 3,
          }}
        />
      </div>
    </div>
  );
}
