import { createRoot } from "react-dom/client";
import "./monaco";
import { installPlatformBridge, selectTool } from "./bridge";
import { ThemeProvider } from "../components/Guide/ThemeChoice";
import MotionProvider from "../components/Motion/MotionProvider";
import ExtensionApp from "./ExtensionApp";
import "../index.css";
import "../workbench.css";
import "../workspace.css";
import "../resume.css";
import "../guide.css";
import "../motion.css";
import "./vscode.css";
installPlatformBridge();
selectTool(window.__PSDEVTOOL_INITIAL_TOOL__ || "text");
createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <MotionProvider>
      <ExtensionApp />
    </MotionProvider>
  </ThemeProvider>,
);
