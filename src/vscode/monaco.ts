import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker&inline";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker&inline";
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker&inline";
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker&inline";
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker&inline";
self.MonacoEnvironment = {
  getWorker(_id, label) {
    if (label === "json") return new JsonWorker();
    if (["css", "scss", "less"].includes(label)) return new CssWorker();
    if (["html", "handlebars", "razor"].includes(label))
      return new HtmlWorker();
    if (["typescript", "javascript"].includes(label)) return new TsWorker();
    return new EditorWorker();
  },
};
loader.config({ monaco });
export { monaco };
