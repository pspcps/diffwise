import { DiffEditor, type DiffEditorProps } from "@monaco-editor/react";

import { defineEditorTheme, EDITOR_THEME } from "./editorTheme";

type Props = Omit<
  DiffEditorProps,
  | "keepCurrentOriginalModel"
  | "keepCurrentModifiedModel"
  | "originalModelPath"
  | "modifiedModelPath"
>;

/** Own anonymous models and release them after the widget has detached them.
 * @monaco-editor/react 4.x otherwise disposes models before Monaco 0.55's
 * diff widget, which raises an uncaught error when leaving a comparison.
 */
export default function ManagedDiffEditor({ onMount, beforeMount, options, ...props }: Props) {
  return (
    <DiffEditor
      {...props}
      theme={EDITOR_THEME}
      options={{ bracketPairColorization: { enabled: true }, guides: { bracketPairs: true }, ...options }}
      beforeMount={monaco => { defineEditorTheme(monaco); beforeMount?.(monaco); }}
      keepCurrentOriginalModel
      keepCurrentModifiedModel
      onMount={(editor, monaco) => {
        const models = editor.getModel();
        editor.onDidDispose(() => {
          queueMicrotask(() => {
            if (models?.original && !models.original.isDisposed())
              models.original.dispose();
            if (models?.modified && !models.modified.isDisposed())
              models.modified.dispose();
          });
        });
        onMount?.(editor, monaco);
      }}
    />
  );
}
