import { useEffect, useRef, type TextareaHTMLAttributes } from "react";
import type { OnMount } from "@monaco-editor/react";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { jsonArrayLengths } from "../../utils/jsonArrayLengths";
import CodeEditor from "./CodeEditor";
type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  onChange: (value: string) => void;
  language?: string;
  onPasteText?: (value: string) => void;
};
export default function StructuredEditor({
  value,
  onChange,
  language = "json",
  onPasteText,
  "aria-label": label = "Code editor",
}: Props) {
  const editor = useRef<Parameters<OnMount>[0] | null>(null);
  const pasteHandler = useRef(onPasteText);
  useEffect(() => {
    pasteHandler.current = onPasteText;
  }, [onPasteText]);
  const fold = async (action: string) => {
    const current = editor.current;
    if (!current?.getModel() || current.getModel()!.isDisposed()) return;
    current.focus();
    await current.getAction(action)?.run();
  };
  return (
    <div className="structured-editor">
      <div className="fold-controls">
        <span>{language.toUpperCase()}</span>
        {language !== "dotenv" && (
          <>
            <button
              aria-label={`Collapse all ${language}`}
              onClick={() => void fold("editor.foldAll")}
            >
              <ChevronsDownUp size={13} />
              <span>Collapse all</span>
            </button>
            <button
              aria-label={`Expand all ${language}`}
              onClick={() => void fold("editor.unfoldAll")}
            >
              <ChevronsUpDown size={13} />
              <span>Expand all</span>
            </button>
          </>
        )}
      </div>
      <div className="structured-editor-body">
        <CodeEditor
          value={String(value ?? "")}
          language={language}
          onChange={(v) => onChange(v ?? "")}
          onMount={(e, monaco) => {
            editor.current = e;
            const paste = e.onDidPaste(() => {
              queueMicrotask(() => {
                if (editor.current === e && !e.getModel()?.isDisposed())
                  pasteHandler.current?.(e.getValue());
              });
            });
            e.onDidDispose(() => {
              paste.dispose();
              if (editor.current === e) editor.current = null;
            });
            if (language !== "json") return;
            const decorations = e.createDecorationsCollection();
            let timer: ReturnType<typeof setTimeout> | undefined;
            const update = () => {
              const model = e.getModel();
              if (!model || model.isDisposed()) return;
              const text = model.getValue();
              const counts =
                text.length <= 2000000 ? jsonArrayLengths(text) : [];
              decorations.set(
                counts.map(({ offset, length }) => {
                  const p = model.getPositionAt(offset + 1);
                  return {
                    range: new monaco.Range(
                      p.lineNumber,
                      p.column,
                      p.lineNumber,
                      p.column,
                    ),
                    options: {
                      showIfCollapsed: true,
                      after: {
                        content: `  ${length} ${length === 1 ? "item" : "items"}  `,
                        inlineClassName: "json-array-length",
                        cursorStops: monaco.editor.InjectedTextCursorStops.None,
                      },
                      hoverMessage: {
                        value: `Array length: **${length}** ${length === 1 ? "item" : "items"}`,
                      },
                    },
                  };
                }),
              );
            };
            update();
            const changes = e.onDidChangeModelContent(() => {
              clearTimeout(timer);
              timer = setTimeout(update, 180);
            });
            e.onDidDispose(() => {
              clearTimeout(timer);
              changes.dispose();
            });
          }}
          options={{
            ariaLabel: label,
            folding: true,
            foldingStrategy: "indentation",
            occurrencesHighlight: "off",
            unfoldOnClickAfterEndOfLine: true,
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
